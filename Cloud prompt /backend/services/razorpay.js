const axios = require('axios');
const crypto = require('crypto');
const env = require('../config/env');

async function createGatewayOrder({ amountPaise, receipt }) {
  if (env.PAYMENT_MODE === 'mock') {
    return { id: `order_mock_${receipt}` };
  }
  const res = await axios.post(
    'https://api.razorpay.com/v1/orders',
    { amount: amountPaise, currency: 'INR', receipt },
    { auth: { username: env.RAZORPAY_KEY_ID, password: env.RAZORPAY_KEY_SECRET }, timeout: 8000 }
  );
  return res.data;
}

// Razorpay signs the raw webhook body with HMAC-SHA256 using the webhook secret.
function verifyWebhookSignature(rawBody, signature) {
  if (!env.RAZORPAY_WEBHOOK_SECRET || !signature || !rawBody) return false;
  const expected = crypto.createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET).update(rawBody).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

module.exports = { createGatewayOrder, verifyWebhookSignature };
