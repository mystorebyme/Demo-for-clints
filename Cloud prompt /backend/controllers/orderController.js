const crypto = require('crypto');
const env = require('../config/env');
const { pool } = require('../config/db');
const { createGatewayOrder } = require('../services/razorpay');
const { confirmOrder } = require('../services/orderService');

async function listProducts(req, reply) {
  const { rows } = await pool.query(
    'SELECT id, name, name_hi, category, price_paise, image_url, stock FROM products ORDER BY id'
  );
  return { success: true, products: rows };
}

async function createOrder(req, reply) {
  const { customer, items } = req.body;

  // Merge duplicate product ids and validate quantities.
  const qtyById = new Map();
  for (const it of items) {
    qtyById.set(it.id, (qtyById.get(it.id) || 0) + it.qty);
  }
  const ids = [...qtyById.keys()];

  // Price is ALWAYS taken from the database, never from the client.
  const { rows: products } = await pool.query(
    'SELECT id, name, price_paise, stock FROM products WHERE id = ANY($1::int[])',
    [ids]
  );
  if (products.length !== ids.length) {
    return reply.code(400).send({ success: false, error: 'One or more products not found.' });
  }

  let amountPaise = 0;
  const orderItems = [];
  for (const p of products) {
    const qty = qtyById.get(p.id);
    if (qty > p.stock) {
      return reply.code(409).send({ success: false, error: `Not enough stock for ${p.name}.` });
    }
    amountPaise += p.price_paise * qty;
    orderItems.push({ id: p.id, name: p.name, qty, price_paise: p.price_paise });
  }

  const orderId = `ORD${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

  const { rows: userRows } = await pool.query(
    `INSERT INTO users (phone, name) VALUES ($1, $2)
     ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
    [customer.phone, customer.name]
  );

  let gatewayOrder;
  try {
    gatewayOrder = await createGatewayOrder({ amountPaise, receipt: orderId });
  } catch (err) {
    req.log.error({ err: err.message }, 'gateway order creation failed');
    return reply.code(502).send({ success: false, error: 'Payment service unavailable, please try again.' });
  }

  await pool.query(
    `INSERT INTO orders (order_id, user_id, customer_name, phone, address, amount_paise, items, gateway_order_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [orderId, userRows[0].id, customer.name, customer.phone, customer.address, amountPaise, JSON.stringify(orderItems), gatewayOrder.id]
  );

  return {
    success: true,
    orderId,
    gatewayOrderId: gatewayOrder.id,
    amountPaise,
    currency: 'INR',
    paymentMode: env.PAYMENT_MODE,
    razorpayKeyId: env.PAYMENT_MODE === 'razorpay' ? env.RAZORPAY_KEY_ID : null,
    expiresInMinutes: env.ORDER_EXPIRY_MINUTES,
  };
}

async function getOrderStatus(req, reply) {
  const { rows } = await pool.query(
    'SELECT order_id, status, amount_paise, items, created_at FROM orders WHERE order_id = $1',
    [req.params.orderId]
  );
  if (!rows[0]) return reply.code(404).send({ success: false, error: 'Order not found.' });
  const o = rows[0];
  return { success: true, orderId: o.order_id, status: o.status, amountPaise: o.amount_paise, items: o.items, createdAt: o.created_at };
}

// DEV ONLY (PAYMENT_MODE=mock): simulates the gateway telling us a payment succeeded.
async function mockPay(req, reply) {
  if (env.PAYMENT_MODE !== 'mock') return reply.code(404).send({ success: false });
  const { rows } = await pool.query('SELECT gateway_order_id, amount_paise FROM orders WHERE order_id = $1', [req.body.orderId]);
  if (!rows[0]) return reply.code(404).send({ success: false, error: 'Order not found.' });
  const result = await confirmOrder(rows[0].gateway_order_id, {
    id: `pay_mock_${crypto.randomBytes(6).toString('hex')}`,
    amount: rows[0].amount_paise,
    method: 'mock',
  });
  return { success: true, ...result };
}

module.exports = { listProducts, createOrder, getOrderStatus, mockPay };
