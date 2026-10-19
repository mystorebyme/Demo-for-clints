require('dotenv').config();

const isProd = process.env.NODE_ENV === 'production';

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT || 5000),
  DATABASE_URL: process.env.DATABASE_URL || '',
  REDIS_URL: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
  FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
  ADMIN_TOKEN: process.env.ADMIN_TOKEN || (isProd ? '' : 'dev_admin_token_replace_me_123456'),
  PAYMENT_MODE: process.env.PAYMENT_MODE || 'mock',
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || '',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || '',
  RAZORPAY_WEBHOOK_SECRET:
    process.env.RAZORPAY_WEBHOOK_SECRET || (isProd ? '' : 'dev_webhook_secret_key_123456'),
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '',
  ORDER_EXPIRY_MINUTES: Number(process.env.ORDER_EXPIRY_MINUTES || 4),
};

if (isProd) {
  const missing = ['DATABASE_URL', 'ADMIN_TOKEN'].filter((k) => !env[k]);
  if (missing.length) {
    throw new Error(`Missing required env vars in production: ${missing.join(', ')}`);
  }
}

if (!env.ADMIN_TOKEN || env.ADMIN_TOKEN.length < 16) {
  throw new Error('ADMIN_TOKEN must be at least 16 characters');
}

if (env.PAYMENT_MODE === 'mock' && isProd) {
  throw new Error('PAYMENT_MODE=mock is not allowed when NODE_ENV=production');
}

if (env.PAYMENT_MODE === 'razorpay') {
  const need = ['RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET', 'RAZORPAY_WEBHOOK_SECRET'].filter((k) => !env[k]);
  if (need.length) throw new Error(`PAYMENT_MODE=razorpay needs: ${need.join(', ')}`);
}

module.exports = env;
