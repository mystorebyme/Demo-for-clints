const { pool } = require('../config/db');
const { redis } = require('../config/redis');
const { emitToOrder } = require('./socket');
const { notifyOrderConfirmed } = require('./telegram');

// Single place where an order becomes CONFIRMED. Called only from the verified webhook
// (or the dev-only mock endpoint). Idempotent: replays and duplicates are ignored.
async function confirmOrder(gatewayOrderId, payment) {
  const lockKey = `lock:confirm:${gatewayOrderId}`;
  const gotLock = await redis.set(lockKey, '1', 'EX', 30, 'NX');
  if (!gotLock) return { result: 'busy' };

  const client = await pool.connect();
  let order;
  try {
    await client.query('BEGIN');
    const { rows } = await client.query('SELECT * FROM orders WHERE gateway_order_id = $1 FOR UPDATE', [gatewayOrderId]);
    order = rows[0];
    if (!order) {
      await client.query('ROLLBACK');
      return { result: 'unknown_order' };
    }
    if (order.status === 'CONFIRMED') {
      await client.query('ROLLBACK');
      return { result: 'already_confirmed' };
    }
    if (Number(payment.amount) !== order.amount_paise) {
      await client.query("UPDATE orders SET status = 'FAILED' WHERE id = $1", [order.id]);
      await client.query('COMMIT');
      console.error(`[confirm] amount mismatch order=${order.order_id} paid=${payment.amount} expected=${order.amount_paise}`);
      return { result: 'amount_mismatch' };
    }
    const ins = await client.query(
      `INSERT INTO payments (order_id, gateway_payment_id, amount_paise, method)
       VALUES ($1, $2, $3, $4) ON CONFLICT (gateway_payment_id) DO NOTHING RETURNING id`,
      [order.order_id, payment.id, payment.amount, payment.method || null]
    );
    if (!ins.rowCount) {
      await client.query('ROLLBACK');
      return { result: 'duplicate_payment' };
    }
    await client.query("UPDATE orders SET status = 'CONFIRMED', confirmed_at = NOW() WHERE id = $1", [order.id]);
    for (const item of order.items) {
      await client.query('UPDATE products SET stock = GREATEST(stock - $1, 0) WHERE id = $2', [item.qty, item.id]);
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
    await redis.del(lockKey).catch(() => {});
  }

  emitToOrder(order.order_id, 'payment_confirmed', { orderId: order.order_id, status: 'CONFIRMED' });
  notifyOrderConfirmed(order, payment).catch((e) => console.error('[notify]', e.message));
  return { result: 'confirmed', orderId: order.order_id };
}

async function expireOldOrders(minutes) {
  const { rows } = await pool.query(
    `UPDATE orders SET status = 'EXPIRED'
     WHERE status = 'PENDING' AND created_at < NOW() - ($1 || ' minutes')::interval
     RETURNING order_id`,
    [String(minutes)]
  );
  rows.forEach((r) => emitToOrder(r.order_id, 'order_expired', { orderId: r.order_id, status: 'EXPIRED' }));
  return rows.length;
}

module.exports = { confirmOrder, expireOldOrders };
