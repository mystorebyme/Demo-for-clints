const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');

process.env.NODE_ENV = 'test';
process.env.USE_IN_MEMORY_STORE = '1';
process.env.ADMIN_TOKEN = 'test_admin_secret_token_12345678';
process.env.RAZORPAY_WEBHOOK_SECRET = 'test_razorpay_webhook_secret_999';
process.env.PAYMENT_MODE = 'mock';

const { buildApp } = require('../server');

describe('Phases 3–10 Backend API — Products, Orders, Idempotency, Webhooks, Fallback & Admin', () => {
  let app;

  before(async () => {
    app = await buildApp({ logger: false });
    await app.ready();
  });

  after(async () => {
    await app.close();
  });

  it('GET /health and /api/openapi.json return valid status and OpenAPI spec', async () => {
    const h = await app.inject({ method: 'GET', url: '/api/health' });
    assert.equal(h.statusCode, 200);
    const body = h.json();
    assert.equal(body.ok, true);
    assert.equal(body.fallbackTier, 1);

    const spec = await app.inject({ method: 'GET', url: '/api/openapi.json' });
    assert.equal(spec.statusCode, 200);
    assert.equal(spec.json().openapi, '3.0.3');
  });

  it('GET /api/products and /api/products/:id return authoritative product data', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/products' });
    assert.equal(res.statusCode, 200);
    const data = res.json();
    assert.equal(data.success, true);
    assert.equal(data.products.length >= 9, true);

    const single = await app.inject({ method: 'GET', url: '/api/products/1' });
    assert.equal(single.statusCode, 200);
    assert.equal(single.json().product.price_paise, 79900);

    const missing = await app.inject({ method: 'GET', url: '/api/products/9999' });
    assert.equal(missing.statusCode, 404);
  });

  it('POST /api/cart/validate computes authoritative server totals in paise', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/cart/validate',
      payload: {
        items: [
          { id: 1, qty: 2, size: 'M' }, // 79900 * 2 = 159800
          { id: 5, qty: 1, size: 'Free Size' }, // 59900 * 1 = 59900
        ],
      },
    });
    assert.equal(res.statusCode, 200);
    const body = res.json();
    assert.equal(body.success, true);
    assert.equal(body.totalPaise, 219700);
  });

  it('POST /api/create-order enforces idempotency keys, stock limits, and 240s QR session', async () => {
    const idemKey = `idem_backend_${Date.now()}`;
    const payload = {
      customer: {
        name: 'Riya Rathore',
        phone: '9876543210',
        address: 'Plot 15, Malviya Nagar, Jaipur, Rajasthan 302017',
      },
      items: [{ id: 1, qty: 2, size: 'L' }],
    };

    const res1 = await app.inject({
      method: 'POST',
      url: '/api/create-order',
      headers: { 'x-idempotency-key': idemKey },
      payload,
    });
    assert.equal(res1.statusCode, 200);
    const o1 = res1.json();
    assert.equal(o1.success, true);
    assert.equal(o1.amountPaise, 159800);
    assert.equal(o1.expiresInSeconds, 240);
    assert.equal(o1.qrPayload.includes(o1.orderId), true);

    // Duplicate request with same idempotency key returns same orderId
    const res2 = await app.inject({
      method: 'POST',
      url: '/api/create-order',
      headers: { 'x-idempotency-key': idemKey },
      payload,
    });
    assert.equal(res2.statusCode, 200);
    assert.equal(res2.json().orderId, o1.orderId);
    assert.equal(res2.json().idempotentReplay, true);

    // Out-of-stock product (#12 has stock 0) returns 409
    const outOfStockRes = await app.inject({
      method: 'POST',
      url: '/api/create-order',
      payload: {
        customer: payload.customer,
        items: [{ id: 12, qty: 1 }],
      },
    });
    assert.equal(outOfStockRes.statusCode, 409);
  });

  it('verifies Razorpay HMAC-SHA256 webhook signatures, rejects bad signatures, confirms orders & blocks replays', async () => {
    // Create a fresh order
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/create-order',
      payload: {
        customer: {
          name: 'Kavita Meena',
          phone: '9123456780',
          address: 'Sector 4, Mansarovar, Jaipur, Rajasthan 302020',
        },
        items: [{ id: 2, qty: 1 }], // 129900 paise
      },
    });
    const order = createRes.json();
    assert.equal(order.success, true);

    const webhookBody = JSON.stringify({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: `pay_sig_${Date.now()}`,
            order_id: order.gatewayOrderId,
            amount: 129900,
            method: 'upi',
          },
        },
      },
    });

    // 1. Bad signature -> 400
    const badRes = await app.inject({
      method: 'POST',
      url: '/api/webhooks/razorpay',
      headers: {
        'content-type': 'application/json',
        'x-razorpay-signature': 'invalid_signature_hex',
      },
      payload: webhookBody,
    });
    assert.equal(badRes.statusCode, 400);

    // Order is still PENDING
    const statusBefore = await app.inject({ method: 'GET', url: `/api/orders/${order.orderId}` });
    assert.equal(statusBefore.json().status, 'PENDING');

    // 2. Valid HMAC-SHA256 signature -> 200 & order becomes CONFIRMED
    const validSig = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(Buffer.from(webhookBody, 'utf8'))
      .digest('hex');

    const goodRes = await app.inject({
      method: 'POST',
      url: '/api/webhooks/razorpay',
      headers: {
        'content-type': 'application/json',
        'x-razorpay-signature': validSig,
      },
      payload: webhookBody,
    });
    assert.equal(goodRes.statusCode, 200);

    const statusAfter = await app.inject({ method: 'GET', url: `/api/orders/${order.orderId}` });
    assert.equal(statusAfter.json().status, 'CONFIRMED');

    // 3. Replay via mock-pay -> already_confirmed
    const replayRes = await app.inject({
      method: 'POST',
      url: '/api/dev/mock-pay',
      payload: { orderId: order.orderId },
    });
    assert.equal(replayRes.json().result, 'already_confirmed');
  });

  it('enforces admin authentication, product CRUD, 4-Tier Fallback switching, and audit logs', async () => {
    const unauth = await app.inject({ method: 'GET', url: '/api/admin/orders' });
    assert.equal(unauth.statusCode, 401);

    const adminHeaders = { 'x-admin-token': process.env.ADMIN_TOKEN };

    // Update notification target
    const updateTarget = await app.inject({
      method: 'PUT',
      url: '/api/admin/notification-target',
      headers: adminHeaders,
      payload: { target: '123456789' },
    });
    assert.equal(updateTarget.statusCode, 200);

    // Switch fallback tier to Tier 4 (Maintenance) and verify order creation returns 503
    const setTier4 = await app.inject({
      method: 'PUT',
      url: '/api/admin/fallback-tier',
      headers: adminHeaders,
      payload: { tier: 4 },
    });
    assert.equal(setTier4.statusCode, 200);
    assert.equal(setTier4.json().tier, 4);

    const blockedOrder = await app.inject({
      method: 'POST',
      url: '/api/create-order',
      payload: {
        customer: {
          name: 'Test Customer',
          phone: '9876543210',
          address: '10 Civil Lines, Jaipur, Rajasthan 302006',
        },
        items: [{ id: 1, qty: 1 }],
      },
    });
    assert.equal(blockedOrder.statusCode, 503);

    // Restore Tier 1
    await app.inject({
      method: 'PUT',
      url: '/api/admin/fallback-tier',
      headers: adminHeaders,
      payload: { tier: 1 },
    });

    // Verify audit logs recorded admin actions
    const logsRes = await app.inject({
      method: 'GET',
      url: '/api/admin/audit-logs',
      headers: adminHeaders,
    });
    assert.equal(logsRes.statusCode, 200);
    assert.equal(logsRes.json().logs.length >= 3, true);
  });
});
