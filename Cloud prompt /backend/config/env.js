require('dotenv').config();

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT || 5000),
  DATABASE_URL: process.env.DATABASE_URL,
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
  ADMIN_TOKEN: process.env.ADMIN_TOKEN,
  PAYMENT_MODE: process.env.PAYMENT_MODE || 'mock',
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || '',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || '',
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || '',
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '',
  ORDER_EXPIRY_MINUTES: 30,
};

const missing = ['DATABASE_URL', 'ADMIN_TOKEN'].filter((k) => !env[k]);
if (missing.length) {
  throw new Error(`Missing required env vars: ${missing.join(', ')}`);
}
if (env.ADMIN_TOKEN.length < 16) {
  throw new Error('ADMIN_TOKEN must be at least 16 characters');
}
if (env.PAYMENT_MODE === 'mock' && env.NODE_ENV === 'production') {
  throw new Error('PAYMENT_MODE=mock is not allowed when NODE_ENV=production');
}
if (env.PAYMENT_MODE === 'razorpay') {
  const need = ['RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET', 'RAZORPAY_WEBHOOK_SECRET'].filter((k) => !env[k]);
  if (need.length) throw new Error(`PAYMENT_MODE=razorpay needs: ${need.join(', ')}`);
}

module.exports = env;
