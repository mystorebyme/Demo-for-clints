const crypto = require('crypto');
const env = require('../config/env');
const { rateLimit } = require('../services/rateLimit');
const orders = require('../controllers/orderController');
const webhook = require('../controllers/webhookController');
const admin = require('../controllers/adminController');
const { getCurrentTier, TIER_DESCRIPTIONS } = require('../services/fallbackService');

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
            size: { type: 'string', maxLength: 30 },
          },
        },
      },
    },
  },
};

module.exports = async function routes(app) {
  const healthHandler = async () => {
    const tier = await getCurrentTier();
    return {
      ok: true,
      service: 'fashion-backend',
      paymentMode: env.PAYMENT_MODE,
      fallbackTier: tier,
      fallbackDescription: TIER_DESCRIPTIONS[tier],
      timestamp: new Date().toISOString(),
    };
  };

  app.get('/health', healthHandler);
  app.get('/api/health', healthHandler);

  app.get('/api/openapi.json', async () => ({
    openapi: '3.0.3',
    info: {
      title: 'High-Speed Fashion E-Commerce & Payment Verification Bridge API',
      version: '1.0.0',
    },
    paths: {
      '/api/health': { get: { summary: 'Service & Fallback Tier Health Check' } },
      '/api/products': { get: { summary: 'List all catalog products' } },
      '/api/products/{id}': { get: { summary: 'Get single product details by ID' } },
      '/api/cart/validate': { post: { summary: 'Server-authoritative cart price & stock validation' } },
      '/api/create-order': { post: { summary: 'Create order & lock 240s payment session' } },
      '/api/orders/{orderId}': { get: { summary: 'Get real-time order verification status' } },
      '/api/webhooks/razorpay': { post: { summary: 'HMAC-verified Razorpay webhook receiver' } },
      '/api/admin/orders': { get: { summary: 'Protected admin order & inventory list' } },
      '/api/admin/notification-target': {
        get: { summary: 'Get live Telegram chat ID' },
        put: { summary: 'Update live Telegram chat ID' },
      },
      '/api/admin/products': { post: { summary: 'Create product (Admin)' } },
      '/api/admin/products/{id}': { put: { summary: 'Update product price/stock (Admin)' } },
      '/api/admin/fallback-tier': {
        get: { summary: 'Get active 4-Tier Fallback level' },
        put: { summary: 'Switch active 4-Tier Fallback level (1-4)' },
      },
      '/api/admin/audit-logs': { get: { summary: 'Inspect admin audit trail' } },
    },
  }));

  app.get('/api/products', orders.listProducts);
  app.get('/api/products/:id', orders.getProductById);
  app.post('/api/cart/validate', orders.validateCart);

  app.post(
    '/api/create-order',
    { schema: createOrderSchema, onRequest: rateLimit({ name: 'create-order', limit: 10, windowMs: 60_000 }) },
    orders.createOrder
  );
  app.post(
    '/api/orders',
    { schema: createOrderSchema, onRequest: rateLimit({ name: 'create-order', limit: 10, windowMs: 60_000 }) },
    orders.createOrder
  );

  app.get(
    '/api/orders/:orderId',
    { onRequest: rateLimit({ name: 'order-status', limit: 60, windowMs: 60_000 }) },
    orders.getOrderStatus
  );
  app.get(
    '/api/orders/:orderId/status',
    { onRequest: rateLimit({ name: 'order-status', limit: 60, windowMs: 60_000 }) },
    orders.getOrderStatus
  );

  app.post('/api/webhooks/razorpay', webhook.razorpayWebhook);
  app.post('/api/payments/webhook/:provider', webhook.razorpayWebhook);

  if (env.PAYMENT_MODE === 'mock') {
    app.post(
      '/api/dev/mock-pay',
      {
        schema: {
          body: {
            type: 'object',
            required: ['orderId'],
            properties: {
              orderId: { type: 'string' },
              paymentId: { type: 'string' },
              amountPaise: { type: 'integer' },
            },
          },
        },
      },
      orders.mockPay
    );
  }

  app.register(async function adminRoutes(adminApp) {
    adminApp.addHook('onRequest', rateLimit({ name: 'admin', limit: 30, windowMs: 60_000 }));
    adminApp.addHook('onRequest', adminAuth);

    adminApp.get('/api/admin/notification-target', admin.getNotificationTarget);
    adminApp.put(
      '/api/admin/notification-target',
      {
        schema: {
          body: {
            type: 'object',
            required: ['target'],
            properties: { target: { type: 'string', minLength: 3, maxLength: 100 } },
          },
        },
      },
      admin.updateNotificationTarget
    );

    adminApp.get('/api/admin/orders', admin.listOrders);

    adminApp.post(
      '/api/admin/products',
      {
        schema: {
          body: {
            type: 'object',
            required: ['name', 'category', 'price_paise'],
            properties: {
              name: { type: 'string', minLength: 2, maxLength: 255 },
              name_hi: { type: 'string', maxLength: 255 },
              category: { type: 'string', enum: ['kurti', 'bag', 'accessory'] },
              price_paise: { type: 'integer', minimum: 100 },
              image_url: { type: 'string' },
              stock: { type: 'integer', minimum: 0 },
            },
          },
        },
      },
      admin.createProduct
    );

    adminApp.put('/api/admin/products/:id', admin.updateProduct);

    adminApp.get('/api/admin/fallback-tier', admin.getFallbackTier);
    adminApp.put(
      '/api/admin/fallback-tier',
      {
        schema: {
          body: {
            type: 'object',
            required: ['tier'],
            properties: { tier: { type: 'integer', minimum: 1, maximum: 4 } },
          },
        },
      },
      admin.updateFallbackTier
    );

    adminApp.get('/api/admin/audit-logs', admin.listAuditLogs);
  });
};
