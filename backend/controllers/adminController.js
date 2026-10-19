const { pool } = require('../config/db');
const { emitToOrder } = require('../services/socket');
const { getTarget, setTarget, sendTelegram } = require('../services/telegram');
const { getCurrentTier, setCurrentTier, TIER_DESCRIPTIONS } = require('../services/fallbackService');
const {
  getDeliveryConfig,
  updateDeliveryConfig,
  listProductInquiries,
  updateProductInquiryStatus,
} = require('../services/deliveryService');

const FULFILLMENT_TITLES = {
  ORDER_PLACED: 'Order Confirmed & Payment Verified',
  PACKED: 'Order Packed & Quality Checked at Warehouse',
  SHIPPED: 'Dispatched with Courier Partner',
  OUT_FOR_DELIVERY: 'Out for Delivery in Destination City',
  DELIVERED: 'Delivered Successfully to Customer',
  CANCELLED: 'Shipment Cancelled',
};

async function recordAudit(action, targetKey, details, ip) {
  await pool
    .query(
      'INSERT INTO admin_audit_logs (action, target_key, details, ip_address) VALUES ($1, $2, $3, $4)',
      [action, targetKey, JSON.stringify(details || {}), ip || null]
    )
    .catch(() => {});
}

async function getNotificationTarget() {
  return { success: true, target: await getTarget() };
}

async function updateNotificationTarget(req) {
  const newTarget = req.body.target.trim();
  await setTarget(newTarget);
  await recordAudit('UPDATE_NOTIFICATION_TARGET', 'admin_notification_target', { target: newTarget }, req.ip);
  const sent = await sendTelegram('🔔 Notification target updated. You will receive order alerts here.');
  return { success: true, testMessageSent: sent };
}

async function listOrders() {
  const { rows: orders } = await pool.query(
    `SELECT order_id, customer_name, phone, address, amount_paise, status, tracking_id, courier_name, fulfillment_status, estimated_delivery, tracking_history, items, created_at, confirmed_at
     FROM orders ORDER BY created_at DESC LIMIT 100`
  );
  const { rows: products } = await pool.query(
    'SELECT id, name, name_hi, category, price_paise, image_url, stock FROM products ORDER BY id'
  );
  return {
    success: true,
    orders,
    products,
    deliveryConfig: getDeliveryConfig(),
    inquiries: listProductInquiries(),
  };
}

async function updateOrderTracking(req, reply) {
  const { orderId } = req.params;
  const { fulfillmentStatus, courierName, trackingId, estimatedDelivery, location, note } = req.body;

  const { rows: existingRows } = await pool.query('SELECT * FROM orders WHERE order_id = $1', [orderId]);
  if (!existingRows[0]) {
    return reply.code(404).send({ success: false, error: 'Order not found.' });
  }
  const order = existingRows[0];

  const nextStatus = fulfillmentStatus || order.fulfillment_status || 'ORDER_PLACED';
  const nextCourier = (courierName || order.courier_name || 'Delhivery Express').trim();
  const nextTrackingId = (trackingId || order.tracking_id || `TRK-KC-${orderId.slice(-6)}`).trim().toUpperCase();
  const nextEta = estimatedDelivery !== undefined ? estimatedDelivery : order.estimated_delivery;

  const currentHistory = Array.isArray(order.tracking_history) ? [...order.tracking_history] : [];
  const milestone = {
    status: nextStatus,
    title: FULFILLMENT_TITLES[nextStatus] || nextStatus,
    location: (location || 'Jaipur Fulfillment Hub').trim(),
    note: (note || `Status updated to ${nextStatus} via ${nextCourier} (${nextTrackingId}).`).trim(),
    timestamp: new Date().toISOString(),
  };
  currentHistory.push(milestone);

  const { rows: updatedRows } = await pool.query(
    `UPDATE orders SET fulfillment_status = $2, courier_name = $3, tracking_id = $4, estimated_delivery = $5, tracking_history = $6 WHERE order_id = $1 RETURNING *`,
    [orderId, nextStatus, nextCourier, nextTrackingId, nextEta, JSON.stringify(currentHistory)]
  );

  await recordAudit(
    'UPDATE_ORDER_TRACKING',
    orderId,
    { fulfillmentStatus: nextStatus, courierName: nextCourier, trackingId: nextTrackingId, location, note },
    req.ip
  );

  emitToOrder(orderId, 'tracking_updated', {
    orderId,
    trackingId: nextTrackingId,
    fulfillmentStatus: nextStatus,
    courierName: nextCourier,
    estimatedDelivery: nextEta,
    trackingHistory: currentHistory,
  });

  return {
    success: true,
    order: updatedRows[0],
  };
}

async function createProduct(req) {
  const { name, name_hi, category, price_paise, image_url, stock } = req.body;
  const { rows } = await pool.query(
    `INSERT INTO products (name, name_hi, category, price_paise, image_url, stock)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [name, name_hi || null, category, price_paise, image_url || '/products/kurti1.svg', stock ?? 50]
  );
  await recordAudit('CREATE_PRODUCT', String(rows[0].id), { name, price_paise, stock }, req.ip);
  return { success: true, product: rows[0] };
}

async function updateProduct(req, reply) {
  const id = Number(req.params.id);
  const { name, price_paise, stock } = req.body;
  const { rows } = await pool.query(
    `UPDATE products SET
       name = COALESCE($2, name),
       price_paise = COALESCE($3, price_paise),
       stock = COALESCE($4, stock)
     WHERE id = $1 RETURNING *`,
    [id, name ?? null, price_paise ?? null, stock ?? null]
  );
  if (!rows[0]) {
    return reply.code(404).send({ success: false, error: 'Product not found.' });
  }
  await recordAudit('UPDATE_PRODUCT', String(id), { name, price_paise, stock }, req.ip);
  return { success: true, product: rows[0] };
}

async function getFallbackTier() {
  const tier = await getCurrentTier();
  return {
    success: true,
    tier,
    description: TIER_DESCRIPTIONS[tier],
    tiers: TIER_DESCRIPTIONS,
  };
}

async function updateFallbackTier(req) {
  const updated = await setCurrentTier(req.body.tier);
  await recordAudit('UPDATE_FALLBACK_TIER', 'payment_fallback_tier', updated, req.ip);
  return { success: true, ...updated };
}

async function listAuditLogs() {
  const { rows } = await pool.query('SELECT * FROM admin_audit_logs ORDER BY created_at DESC LIMIT 100');
  return { success: true, logs: rows };
}

async function getAdminDeliveryConfig() {
  return { success: true, deliveryConfig: getDeliveryConfig() };
}

async function putAdminDeliveryConfig(req) {
  const updated = updateDeliveryConfig(req.body || {});
  await recordAudit('UPDATE_DELIVERY_CONFIG', 'delivery_config', updated, req.ip);
  return { success: true, deliveryConfig: updated };
}

async function getAdminInquiries() {
  return { success: true, inquiries: listProductInquiries() };
}

async function patchAdminInquiry(req, reply) {
  const updated = updateProductInquiryStatus(
    String(req.body?.id || ''),
    req.body?.status || 'REPLIED',
    req.body?.adminNote
  );
  if (!updated) {
    return reply.code(404).send({ success: false, error: 'Inquiry not found' });
  }
  return { success: true, inquiry: updated };
}

module.exports = {
  getNotificationTarget,
  updateNotificationTarget,
  listOrders,
  updateOrderTracking,
  createProduct,
  updateProduct,
  getFallbackTier,
  updateFallbackTier,
  listAuditLogs,
  getAdminDeliveryConfig,
  putAdminDeliveryConfig,
  getAdminInquiries,
  patchAdminInquiry,
};
