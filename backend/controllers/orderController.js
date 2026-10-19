const crypto = require('crypto');
const env = require('../config/env');
const { pool } = require('../config/db');
const { redis } = require('../config/redis');
const { createGatewayOrder } = require('../services/razorpay');
const { confirmOrder } = require('../services/orderService');
const { getCurrentTier, TIER_DESCRIPTIONS } = require('../services/fallbackService');

async function listProducts() {
  const { rows } = await pool.query(
    'SELECT id, name, name_hi, category, price_paise, image_url, stock FROM products ORDER BY id'
  );
  return { success: true, products: rows };
}

async function getProductById(req, reply) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return reply.code(400).send({ success: false, error: 'Invalid product ID.' });
  }
  const { rows } = await pool.query(
    'SELECT id, name, name_hi, category, price_paise, image_url, stock FROM products WHERE id = $1',
    [id]
  );
  if (!rows[0]) {
    return reply.code(404).send({ success: false, error: 'Product not found.' });
  }
  return { success: true, product: rows[0] };
}

async function validateCart(req) {
  const rawItems = Array.isArray(req.body?.items) ? req.body.items : [];
  const ids = [...new Set(rawItems.map((i) => Number(i.id)).filter((n) => Number.isInteger(n) && n > 0))];
  const { rows: products } = await pool.query(
    'SELECT id, name, name_hi, category, price_paise, image_url, stock FROM products WHERE id = ANY($1::int[])',
    [ids]
  );
  const byId = new Map(products.map((p) => [p.id, p]));

  let subtotalPaise = 0;
  const validated = [];
  const warnings = [];

  for (const item of rawItems) {
    const p = byId.get(Number(item.id));
    if (!p || p.stock <= 0) {
      warnings.push(`Product #${item.id} is out of stock or unavailable.`);
      continue;
    }
    const safeQty = Math.max(1, Math.min(Number(item.qty) || 1, Math.min(10, p.stock)));
    const lineTotal = p.price_paise * safeQty;
    subtotalPaise += lineTotal;
    validated.push({
      id: p.id,
      name: p.name,
      name_hi: p.name_hi,
      size: item.size || 'Free Size',
      qty: safeQty,
      price_paise: p.price_paise,
      line_total_paise: lineTotal,
      stock: p.stock,
    });
  }

  return {
    success: true,
    items: validated,
    subtotalPaise,
    deliveryPaise: 0,
    totalPaise: subtotalPaise,
    currency: 'INR',
    warnings,
  };
}

async function createOrder(req, reply) {
  const { customer, items } = req.body;
  const idempotencyKey = req.headers['x-idempotency-key']
    ? String(req.headers['x-idempotency-key']).slice(0, 120)
    : null;

  const currentTier = await getCurrentTier();
  if (currentTier === 4) {
    return reply.code(503).send({
      success: false,
      fallbackTier: 4,
      error: 'Payment gateway is temporarily under maintenance (Tier 4 Fallback). Please try again shortly or contact support.',
    });
  }

  if (idempotencyKey) {
    const { rows: existingRows } = await pool.query(
      'SELECT * FROM orders WHERE idempotency_key = $1',
      [idempotencyKey]
    );
    if (existingRows[0]) {
      const ex = existingRows[0];
      return {
        success: true,
        idempotentReplay: true,
        orderId: ex.order_id,
        gatewayOrderId: ex.gateway_order_id,
        amountPaise: ex.amount_paise,
        currency: 'INR',
        fallbackTier: ex.fallback_tier || currentTier,
        paymentMode: env.PAYMENT_MODE,
        razorpayKeyId: env.PAYMENT_MODE === 'razorpay' ? env.RAZORPAY_KEY_ID : null,
        expiresInMinutes: env.ORDER_EXPIRY_MINUTES,
        expiresAt: ex.expires_at,
        qrPayload: ex.qr_payload,
      };
    }
  }

  const qtyById = new Map();
  for (const it of items) {
    qtyById.set(it.id, (qtyById.get(it.id) || 0) + it.qty);
  }
  const ids = [...qtyById.keys()];

  const { rows: products } = await pool.query(
    'SELECT id, name, name_hi, price_paise, stock FROM products WHERE id = ANY($1::int[])',
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
    orderItems.push({ id: p.id, name: p.name, name_hi: p.name_hi, qty, price_paise: p.price_paise });
  }

  const orderId = `ORD${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

  const sessionLockKey = `lock:qr_session:${orderId}`;
  await redis.set(sessionLockKey, String(amountPaise), 'EX', env.ORDER_EXPIRY_MINUTES * 60, 'NX').catch(() => {});

  const { rows: userRows } = await pool.query(
    `INSERT INTO users (phone, name) VALUES ($1, $2)
     ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
    [customer.phone, customer.name]
  );

  let gatewayOrder;
  let activeTier = currentTier;
  try {
    gatewayOrder = await createGatewayOrder({ amountPaise, receipt: orderId });
  } catch (err) {
    req.log.error({ err: err.message }, 'primary gateway failed, escalating fallback tier');
    activeTier = Math.min(3, currentTier + 1);
    gatewayOrder = { id: `order_fallback_t${activeTier}_${orderId}` };
  }

  const amountRupees = (amountPaise / 100).toFixed(2);
  const qrPayload = `upi://pay?pa=kurticorner.demo@upi&pn=Kurti%20Corner&tr=${orderId}&am=${amountRupees}&cu=INR`;

  const { rows: insertedRows } = await pool.query(
    `INSERT INTO orders (order_id, user_id, customer_name, phone, address, amount_paise, items, gateway_order_id, qr_payload, idempotency_key, fallback_tier)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING expires_at`,
    [
      orderId,
      userRows[0].id,
      customer.name,
      customer.phone,
      customer.address,
      amountPaise,
      JSON.stringify(orderItems),
      gatewayOrder.id,
      qrPayload,
      idempotencyKey,
      activeTier,
    ]
  );

  const expiresAt =
    insertedRows[0]?.expires_at || new Date(Date.now() + env.ORDER_EXPIRY_MINUTES * 60 * 1000).toISOString();

  return {
    success: true,
    orderId,
    gatewayOrderId: gatewayOrder.id,
    amountPaise,
    currency: 'INR',
    fallbackTier: activeTier,
    fallbackDescription: TIER_DESCRIPTIONS[activeTier],
    paymentMode: env.PAYMENT_MODE,
    razorpayKeyId: env.PAYMENT_MODE === 'razorpay' ? env.RAZORPAY_KEY_ID : null,
    expiresInMinutes: env.ORDER_EXPIRY_MINUTES,
    expiresInSeconds: env.ORDER_EXPIRY_MINUTES * 60,
    expiresAt,
    qrPayload,
  };
}

async function getOrderStatus(req, reply) {
  const { rows } = await pool.query(
    'SELECT order_id, status, amount_paise, items, tracking_id, courier_name, fulfillment_status, estimated_delivery, tracking_history, qr_payload, fallback_tier, created_at, expires_at, confirmed_at FROM orders WHERE order_id = $1',
    [req.params.orderId]
  );
  if (!rows[0]) return reply.code(404).send({ success: false, error: 'Order not found.' });
  const o = rows[0];
  return {
    success: true,
    orderId: o.order_id,
    status: o.status,
    amountPaise: o.amount_paise,
    items: o.items,
    trackingId: o.tracking_id || null,
    courierName: o.courier_name || 'Delhivery Express',
    fulfillmentStatus: o.fulfillment_status || 'PENDING_PAYMENT',
    estimatedDelivery: o.estimated_delivery || null,
    trackingHistory: o.tracking_history || [],
    qrPayload: o.qr_payload,
    fallbackTier: o.fallback_tier || 1,
    createdAt: o.created_at,
    expiresAt: o.expires_at,
    confirmedAt: o.confirmed_at,
  };
}

// Public Tracking Lookup by either Tracking ID (TRK-KC-...) or Order ID (ORD...)
async function trackOrder(req, reply) {
  const rawId = String(req.params.id || '').trim();
  if (!rawId || rawId.length < 4) {
    return reply.code(400).send({ success: false, error: 'Please provide a valid Tracking ID or Order ID.' });
  }
  const { rows } = await pool.query(
    'SELECT * FROM orders WHERE UPPER(order_id) = UPPER($1) OR UPPER(tracking_id) = UPPER($1)',
    [rawId]
  );
  if (!rows[0]) {
    return reply.code(404).send({
      success: false,
      error: 'No order found with this Tracking ID or Order ID.',
    });
  }
  const o = rows[0];
  return {
    success: true,
    orderId: o.order_id,
    trackingId: o.tracking_id || null,
    paymentStatus: o.status,
    fulfillmentStatus: o.fulfillment_status || (o.status === 'CONFIRMED' ? 'ORDER_PLACED' : 'PENDING_PAYMENT'),
    courierName: o.courier_name || 'Delhivery Express',
    estimatedDelivery: o.estimated_delivery || null,
    trackingHistory: o.tracking_history || [],
    customerName: o.customer_name,
    address: o.address,
    amountPaise: o.amount_paise,
    items: o.items || [],
    createdAt: o.created_at,
    confirmedAt: o.confirmed_at,
  };
}

// DEV ONLY (PAYMENT_MODE=mock): simulates the gateway telling us a payment succeeded.
async function mockPay(req, reply) {
  if (env.PAYMENT_MODE !== 'mock') return reply.code(404).send({ success: false });
  const { rows } = await pool.query('SELECT gateway_order_id, amount_paise FROM orders WHERE order_id = $1', [req.body.orderId]);
  if (!rows[0]) return reply.code(404).send({ success: false, error: 'Order not found.' });
  const result = await confirmOrder(rows[0].gateway_order_id, {
    id: req.body.paymentId || `pay_mock_${crypto.randomBytes(6).toString('hex')}`,
    amount: req.body.amountPaise ?? rows[0].amount_paise,
    method: 'mock',
  });
  return { success: true, ...result };
}

module.exports = { listProducts, getProductById, validateCart, createOrder, getOrderStatus, trackOrder, mockPay };
