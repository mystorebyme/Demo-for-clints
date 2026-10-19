const { pool } = require('../config/db');
const { getTarget, setTarget, sendTelegram } = require('../services/telegram');
const { getCurrentTier, setCurrentTier, TIER_DESCRIPTIONS } = require('../services/fallbackService');

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
    `SELECT order_id, customer_name, phone, amount_paise, status, items, created_at, confirmed_at
     FROM orders ORDER BY created_at DESC LIMIT 100`
  );
  const { rows: products } = await pool.query(
    'SELECT id, name, name_hi, category, price_paise, image_url, stock FROM products ORDER BY id'
  );
  return { success: true, orders, products };
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

module.exports = {
  getNotificationTarget,
  updateNotificationTarget,
  listOrders,
  createProduct,
  updateProduct,
  getFallbackTier,
  updateFallbackTier,
  listAuditLogs,
};
