const crypto = require('crypto');
const env = require('../config/env');
const { rateLimit } = require('../services/rateLimit');
const orders = require('../controllers/orderController');
const webhook = require('../controllers/webhookController');
const admin = require('../controllers/adminController');

function adminAuth(req, reply, done) {
  const a = Buffer.from(String(req.headers['x-admin-token'] || ''));
  const b = Buffer.from(env.ADMIN_TOKEN);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return reply.code(401).send({ success: false, error: 'Unauthorized' });
  }
  done();
}

const createOrderSchema = {
  body: {
    type: 'object',
    required: ['customer', 'items'],
    additionalProperties: false,
    properties: {
      customer: {
        type: 'object',
        required: ['name', 'phone', 'address'],
        additionalProperties: false,
        properties: {
          name: { type: 'string', minLength: 2, maxLength: 120 },
          phone: { type: 'string', pattern: '^[6-9][0-9]{9}$' },
          address: { type: 'string', minLength: 10, maxLength: 500 },
        },
      },
      items: {
        type: 'array',
        minItems: 1,
        maxItems: 30,
        items: {
          type: 'object',
          required: ['id', 'qty'],
          additionalProperties: false,
          properties: {
            id: { type: 'integer', minimum: 1 },
            qty: { type: 'integer', minimum: 1, maximum: 10 },
          },
        },
      },
    },
  },
};

module.exports = async function routes(app) {
  app.get('/health', async () => ({ ok: true }));

  app.get('/api/products', orders.listProducts);

  app.post(
    '/api/create-order',
    { schema: createOrderSchema, onRequest: rateLimit({ name: 'create-order', limit: 10, windowMs: 60_000 }) },
    orders.createOrder
  );

  app.get(
    '/api/orders/:orderId',
    { onRequest: rateLimit({ name: 'order-status', limit: 60, windowMs: 60_000 }) },
    orders.getOrderStatus
  );

  app.post('/api/webhooks/razorpay', webhook.razorpayWebhook);

  if (env.PAYMENT_MODE === 'mock') {
    app.post('/api/dev/mock-pay', {
      schema: { body: { type: 'object', required: ['orderId'], properties: { orderId: { type: 'string' } } } },
    }, orders.mockPay);
  }

  app.register(async function adminRoutes(adminApp) {
    adminApp.addHook('onRequest', rateLimit({ name: 'admin', limit: 30, windowMs: 60_000 }));
    adminApp.addHook('onRequest', adminAuth);
    adminApp.get('/api/admin/notification-target', admin.getNotificationTarget);
    adminApp.put('/api/admin/notification-target', {
      schema: { body: { type: 'object', required: ['target'], properties: { target: { type: 'string', minLength: 3, maxLength: 100 } } } },
    }, admin.updateNotificationTarget);
    adminApp.get('/api/admin/orders', admin.listOrders);
  });
};
