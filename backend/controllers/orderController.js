const crypto = require('crypto');
const env = require('../config/env');
const { pool } = require('../config/db');
const { redis } = require('../config/redis');
const { createGatewayOrder } = require('../services/razorpay');
const { confirmOrder } = require('../services/orderService');
const { getCurrentTier, TIER_DESCRIPTIONS } = require('../services/fallbackService');

const COUPONS = {
  FIRST10: { type: 'PERCENT', value: 10, minPaise: 0, maxDiscountPaise: 50000 },
  DIWALI20: { type: 'PERCENT', value: 20, minPaise: 129900, maxDiscountPaise: 100000 },
  JAIPUR15: { type: 'PERCENT', value: 15, minPaise: 99900, maxDiscountPaise: 75000 },
  ROYAL250: { type: 'FLAT', value: 25000, minPaise: 179900, maxDiscountPaise: 25000 },
};

function sanitizeText(raw, maxLen = 250) {
  return String(raw || '')
    .replace(/[<>"'`\\]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim()
    .slice(0, maxLen);
}

let nextBackendSerial = 1002;
function generateStructuredOrderAndInvoice() {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const serial = String(nextBackendSerial++).padStart(4, '0');
  return {
    orderId: `ORD-${yy}${mm}${dd}-08-${serial}`,
    invoiceNumber: `INV-KC-2026-${serial}`,
  };
}

function maskPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length < 4) return '******';
  return `${digits.slice(0, 2)}******${digits.slice(-2)}`;
}

function computeCouponDiscount(rawCode, subtotalPaise) {
  if (!rawCode || !String(rawCode).trim()) {
    return { couponCode: null, discountPaise: 0 };
  }
  const code = sanitizeText(rawCode, 24).toUpperCase();
  const c = COUPONS[code];
  if (!c || subtotalPaise < c.minPaise) {
    return { couponCode: null, discountPaise: 0 };
  }
  let discountPaise =
    c.type === 'PERCENT' ? Math.round((subtotalPaise * c.value) / 100) : c.value;
  if (c.maxDiscountPaise > 0) {
    discountPaise = Math.min(discountPaise, c.maxDiscountPaise);
  }
  discountPaise = Math.min(discountPaise, Math.max(0, subtotalPaise - 100));
  return { couponCode: code, discountPaise };
}

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
  const ids = [
    ...new Set(
      rawItems.map((i) => Number(i.id)).filter((n) => Number.isInteger(n) && n > 0)
    ),
  ];
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
      size: sanitizeText(item.size || 'Free Size', 24),
      qty: safeQty,
      price_paise: p.price_paise,
      line_total_paise: lineTotal,
      stock: p.stock,
    });
  }

  const { couponCode, discountPaise } = computeCouponDiscount(
    req.body?.couponCode,
    subtotalPaise
  );
  const totalPaise = Math.max(0, subtotalPaise - discountPaise);

  return {
    success: true,
    items: validated,
    subtotalPaise,
    discountPaise,
    couponCode,
    deliveryPaise: 0,
    totalPaise,
    currency: 'INR',
    warnings,
  };
}

async function createOrder(req, reply) {
  const { customer, items, couponCode: requestedCoupon } = req.body;
  const idempotencyKey = req.headers['x-idempotency-key']
    ? sanitizeText(req.headers['x-idempotency-key'], 120)
    : req.body?.idempotencyKey
    ? sanitizeText(req.body.idempotencyKey, 120)
    : null;

  const safeName = sanitizeText(customer?.name, 80);
  const safePhone = String(customer?.phone || '').replace(/\D/g, '');
  const safeAddress = sanitizeText(customer?.address, 280);

  if (safeName.length < 2 || !/^[6-9]\d{9}$/.test(safePhone) || safeAddress.length < 10) {
    return reply.code(400).send({
      success: false,
      error: 'Invalid customer name, 10-digit Indian phone number, or shipping address.',
    });
  }

  const currentTier = await getCurrentTier();
  if (currentTier === 4) {
    return reply.code(503).send({
      success: false,
      fallbackTier: 4,
      error:
        'Payment gateway is temporarily under maintenance (Tier 4 Fallback). Please try again shortly or contact support.',
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
        invoiceNumber: `ZJ/2026-27/${ex.order_id.slice(-6)}`,
        gatewayOrderId: ex.gateway_order_id,
        amountPaise: ex.amount_paise,
        currency: 'INR',
        fallbackTier: ex.fallback_tier || currentTier,
        paymentMode: env.PAYMENT_MODE,
        razorpayKeyId: env.PAYMENT_MODE === 'razorpay' ? env.RAZORPAY_KEY_ID : null,
        expiresInMinutes: env.ORDER_EXPIRY_MINUTES,
        expiresInSeconds: env.ORDER_EXPIRY_MINUTES * 60,
        expiresAt: ex.expires_at,
        qrPayload: ex.qr_payload,
      };
    }
  }

  const qtyById = new Map();
  for (const it of items) {
    const numId = Number(it.id);
    const numQty = Number(it.qty);
    if (!Number.isInteger(numId) || numId < 1 || !Number.isInteger(numQty) || numQty < 1 || numQty > 10) {
      return reply.code(400).send({ success: false, error: 'Invalid cart item payload.' });
    }
    qtyById.set(numId, (qtyById.get(numId) || 0) + numQty);
  }
  const ids = [...qtyById.keys()];

  const { rows: products } = await pool.query(
    'SELECT id, name, name_hi, price_paise, stock FROM products WHERE id = ANY($1::int[])',
    [ids]
  );
  if (products.length !== ids.length) {
    return reply.code(400).send({ success: false, error: 'One or more products not found.' });
  }

  let subtotalPaise = 0;
  const orderItems = [];
  for (const p of products) {
    const qty = qtyById.get(p.id);
    if (qty > p.stock) {
      return reply
        .code(409)
        .send({ success: false, error: `Not enough stock for ${p.name}.` });
    }
    // Authoritative server-side price calculation (client prices are strictly ignored)
    subtotalPaise += p.price_paise * qty;
    orderItems.push({
      id: p.id,
      name: p.name,
      name_hi: p.name_hi,
      qty,
      price_paise: p.price_paise,
    });
  }

  const { couponCode, discountPaise } = computeCouponDiscount(requestedCoupon, subtotalPaise);
  const amountPaise = Math.max(100, subtotalPaise - discountPaise);

  const { orderId, invoiceNumber } = generateStructuredOrderAndInvoice();

  const sessionLockKey = `lock:qr_session:${orderId}`;
  await redis
    .set(sessionLockKey, String(amountPaise), 'EX', env.ORDER_EXPIRY_MINUTES * 60, 'NX')
    .catch(() => {});

  const { rows: userRows } = await pool.query(
    `INSERT INTO users (phone, name) VALUES ($1, $2)
     ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
    [safePhone, safeName]
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
  const qrPayload = `upi://pay?pa=zariyajaipur@upi&pn=Zariya%20Jaipur&tr=${orderId}&am=${amountRupees}&cu=INR`;

  const { rows: insertedRows } = await pool.query(
    `INSERT INTO orders (order_id, user_id, customer_name, phone, address, amount_paise, items, gateway_order_id, qr_payload, idempotency_key, fallback_tier)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING expires_at`,
    [
      orderId,
      userRows[0].id,
      safeName,
      safePhone,
      safeAddress,
      amountPaise,
      JSON.stringify(orderItems),
      gatewayOrder.id,
      qrPayload,
      idempotencyKey,
      activeTier,
    ]
  );

  const expiresAt =
    insertedRows[0]?.expires_at ||
    new Date(Date.now() + env.ORDER_EXPIRY_MINUTES * 60 * 1000).toISOString();

  return {
    success: true,
    orderId,
    invoiceNumber,
    gatewayOrderId: gatewayOrder.id,
    subtotalPaise,
    discountPaise,
    couponCode,
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
    invoiceNumber: `ZJ/2026-27/${o.order_id.slice(-6)}`,
    status: o.status,
    amountPaise: o.amount_paise,
    items: o.items,
    trackingId: o.tracking_id || null,
    courierName: o.courier_name || 'BlueDart Royal Priority Air',
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

// Public Tracking Lookup by confidential Tracking ID (TRK-KC-...) or cryptographic Order ID (ORD...)
async function trackOrder(req, reply) {
  const rawId = sanitizeText(req.params.id, 64);
  if (!rawId || rawId.length < 6) {
    return reply.code(400).send({
      success: false,
      error: 'Please provide a valid confidential Tracking ID.',
    });
  }
  const { rows } = await pool.query(
    'SELECT * FROM orders WHERE UPPER(order_id) = UPPER($1) OR UPPER(tracking_id) = UPPER($1)',
    [rawId]
  );
  if (!rows[0]) {
    return reply.code(404).send({
      success: false,
      error: 'No shipment found with this confidential Tracking ID.',
    });
  }
  const o = rows[0];
  return {
    success: true,
    orderId: o.order_id,
    invoiceNumber: `ZJ/2026-27/${o.order_id.slice(-6)}`,
    trackingId: o.tracking_id || null,
    paymentStatus: o.status,
    fulfillmentStatus:
      o.fulfillment_status ||
      (o.status === 'CONFIRMED' ? 'ORDER_PLACED' : 'PENDING_PAYMENT'),
    courierName: o.courier_name || 'BlueDart Royal Priority Air',
    estimatedDelivery: o.estimated_delivery || null,
    trackingHistory: o.tracking_history || [],
    customerName: o.customer_name,
    customerPhoneMasked: maskPhone(o.phone),
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
  const { rows } = await pool.query(
    'SELECT gateway_order_id, amount_paise FROM orders WHERE order_id = $1',
    [req.body.orderId]
  );
  if (!rows[0]) return reply.code(404).send({ success: false, error: 'Order not found.' });
  const result = await confirmOrder(rows[0].gateway_order_id, {
    id: req.body.paymentId || `pay_mock_${crypto.randomBytes(6).toString('hex')}`,
    amount: req.body.amountPaise ?? rows[0].amount_paise,
    method: 'mock',
  });
  return { success: true, ...result };
}

module.exports = {
  listProducts,
  getProductById,
  validateCart,
  createOrder,
  getOrderStatus,
  trackOrder,
  mockPay,
};
