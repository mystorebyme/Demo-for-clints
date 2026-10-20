const Fastify = require('fastify');
const env = require('./config/env');
const { pool } = require('./config/db');
const { redis } = require('./config/redis');
const { initSocket } = require('./services/socket');
const { expireOldOrders } = require('./services/orderService');

async function buildApp(opts = {}) {
  const app = Fastify({ logger: opts.logger ?? true, trustProxy: true });

  await app.register(require('@fastify/helmet'));
  await app.register(require('@fastify/cors'), {
    origin: env.FRONTEND_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'x-admin-token', 'x-idempotency-key'],
  });

  // Keep the raw body: Razorpay's webhook signature is computed over the exact bytes.
  app.addContentTypeParser('application/json', { parseAs: 'buffer' }, (req, body, done) => {
    req.rawBody = body;
    try {
      done(null, body.length ? JSON.parse(body.toString('utf8')) : {});
    } catch (err) {
      err.statusCode = 400;
      done(err);
    }
  });

  await app.register(require('./routes'));
  return app;
}

async function main() {
  const app = await buildApp({ logger: true });

  await app.ready();
  initSocket(app.server);

  const timer = setInterval(() => {
    expireOldOrders(env.ORDER_EXPIRY_MINUTES).catch((e) => app.log.error({ err: e.message }, 'expiry job failed'));
  }, 60_000);

  const shutdown = async () => {
    clearInterval(timer);
    await app.close();
    await pool.end();
    redis.disconnect();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  await app.listen({ port: env.PORT, host: '0.0.0.0' });
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { buildApp };
