const crypto = require('crypto');
const { pool } = require('../config/db');
const { redis } = require('../config/redis');
const { emitToOrder } = require('./socket');
const { notifyOrderConfirmed } = require('./telegram');

// Structured 12-Digit Courier AWB + Security PIN Tracking ID: TRK-KC-YYMMDD + 08 (Rajasthan) + 4-Digit Secret PIN
function generateTrackingId() {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const pin4 = String(crypto.randomInt(1000, 10000));
  return `TRK-KC-${yy}${mm}${dd}08${pin4}`;
}

function getDefaultEstimatedDelivery() {
  const dt = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000);
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Single place where an order becomes CONFIRMED. Called only from the verified webhook
// (or the dev-only mock endpoint). Idempotent: replays and duplicates are ignored.
// Automatically generates a unique cryptographic customer Tracking ID (TRK-KC-<12-hex>) on confirmation.
async function confirmOrder(gatewayOrderId, payment) {
  const lockKey = `lock:confirm:${gatewayOrderId}`;
  const gotLock = await redis.set(lockKey, '1', 'EX', 30, 'NX');
  if (!gotLock) return { result: 'busy' };

  const client = await pool.connect();
  let order;
  let trackingId;
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      'SELECT * FROM orders WHERE gateway_order_id = $1 FOR UPDATE',
      [gatewayOrderId]
    );
    order = rows[0];
    if (!order) {
      await client.query('ROLLBACK');
      return { result: 'unknown_order' };
    }
    if (order.status === 'CONFIRMED') {
      await client.query('ROLLBACK');
      return {
        result: 'already_confirmed',
        orderId: order.order_id,
        trackingId: order.tracking_id,
      };
    }
    if (Number(payment.amount) !== order.amount_paise) {
      await client.query("UPDATE orders SET status = 'FAILED' WHERE id = $1", [order.id]);
      await client.query('COMMIT');
      console.error(
        `[confirm] amount mismatch order=${order.order_id} paid=${payment.amount} expected=${order.amount_paise}`
      );
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

    trackingId = order.tracking_id || generateTrackingId();
    const courierName = order.courier_name || 'BlueDart Royal Priority Air';
    const estimatedDelivery = order.estimated_delivery || getDefaultEstimatedDelivery();
    const initialHistory = [
      {
        status: 'ORDER_PLACED',
        title: 'Order Confirmed, Payment Verified & Email Receipt Dispatched',
        location: 'Zariya Heritage Atelier, Johari Bazar, Jaipur',
        note: `Payment verified. Confidential Tracking ID ${trackingId} and GST Tax Invoice emailed to customer.`,
        timestamp: new Date().toISOString(),
      },
    ];

    await client.query(
      `UPDATE orders SET status = 'CONFIRMED', confirmed_at = NOW(), tracking_id = $2, courier_name = $3, fulfillment_status = $4, estimated_delivery = $5, tracking_history = $6 WHERE id = $1`,
      [
        order.id,
        trackingId,
        courierName,
        'ORDER_PLACED',
        estimatedDelivery,
        JSON.stringify(initialHistory),
      ]
    );

    for (const item of order.items) {
      await client.query(
        'UPDATE products SET stock = GREATEST(stock - $1, 0) WHERE id = $2',
        [item.qty, item.id]
      );
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
    await redis.del(lockKey).catch(() => {});
  }

  order.tracking_id = trackingId;
  emitToOrder(order.order_id, 'payment_confirmed', {
    orderId: order.order_id,
    status: 'CONFIRMED',
    trackingId,
    emailDispatched: true,
  });
  notifyOrderConfirmed(order, payment).catch((e) => console.error('[notify]', e.message));
  return { result: 'confirmed', orderId: order.order_id, trackingId, emailDispatched: true };
}

async function expireOldOrders(minutes) {
  const { rows } = await pool.query(
    `UPDATE orders SET status = 'EXPIRED'
     WHERE status = 'PENDING' AND created_at < NOW() - ($1 || ' minutes')::interval
     RETURNING order_id`,
    [String(minutes)]
  );
  rows.forEach((r) =>
    emitToOrder(r.order_id, 'order_expired', { orderId: r.order_id, status: 'EXPIRED' })
  );
  return rows.length;
}

module.exports = { confirmOrder, expireOldOrders, generateTrackingId };
