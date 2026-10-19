const { pool } = require('../config/db');
const { getTarget, setTarget, sendTelegram } = require('../services/telegram');

async function getNotificationTarget() {
  return { success: true, target: await getTarget() };
}

async function updateNotificationTarget(req) {
  await setTarget(req.body.target.trim());
  const sent = await sendTelegram('🔔 Notification target updated. You will receive order alerts here.');
  return { success: true, testMessageSent: sent };
}

async function listOrders() {
  const { rows } = await pool.query(
    `SELECT order_id, customer_name, phone, amount_paise, status, items, created_at, confirmed_at
     FROM orders ORDER BY created_at DESC LIMIT 100`
  );
  return { success: true, orders: rows };
}

module.exports = { getNotificationTarget, updateNotificationTarget, listOrders };
