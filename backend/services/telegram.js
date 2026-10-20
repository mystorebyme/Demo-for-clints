const axios = require('axios');
const env = require('../config/env');
const { pool } = require('../config/db');

// Target is read from the DB on every send, so the admin can change it live without a restart.
async function getTarget() {
  const { rows } = await pool.query("SELECT value FROM system_settings WHERE key = 'admin_notification_target'");
  return rows[0] ? rows[0].value : null;
}

async function setTarget(value) {
  await pool.query(
    `INSERT INTO system_settings (key, value, updated_at) VALUES ('admin_notification_target', $1, NOW())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
    [value]
  );
}

async function sendTelegram(text) {
  if (!env.TELEGRAM_BOT_TOKEN) {
    console.warn('[telegram] TELEGRAM_BOT_TOKEN not set, skipping notification');
    return false;
  }
  const chatId = await getTarget();
  if (!chatId || chatId === 'YOUR_TELEGRAM_CHAT_ID_HERE') {
    console.warn('[telegram] admin chat id not configured, skipping notification');
    return false;
  }
  try {
    await axios.post(
      `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      { chat_id: chatId, text },
      { timeout: 5000 }
    );
    return true;
  } catch (err) {
    console.error('[telegram] send failed:', err.response ? err.response.status : err.message);
    return false;
  }
}

async function notifyOrderConfirmed(order, payment) {
  const items = (order.items || []).map((i) => `• ${i.name} x${i.qty}`).join('\n');
  const text =
    `✅ New paid order\n` +
    `Order: ${order.order_id}\n` +
    `Amount: ₹${(order.amount_paise / 100).toFixed(2)}\n` +
    `Payment ID: ${payment.id}\n` +
    `Customer: ${order.customer_name} (${order.phone})\n` +
    `Address: ${order.address}\n` +
    `Items:\n${items}\n` +
    `Time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`;
  return sendTelegram(text);
}

module.exports = { getTarget, setTarget, sendTelegram, notifyOrderConfirmed };
