const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');

process.env.NODE_ENV = 'test';
process.env.USE_IN_MEMORY_STORE = '1';
process.env.ADMIN_TOKEN = 'test_admin_secret_token_12345678';
process.env.RAZORPAY_WEBHOOK_SECRET = 'test_razorpay_webhook_secret_999';
process.env.PAYMENT_MODE = 'mock';

const { buildApp } = require('../server');

describe('Phases 3–10 Backend API — Products, Coupons, Auto Stock Deduction, Webhooks, Confidential Tracking & Admin', () => {
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
    assert.equal(data.products.length >= 200, true);

    const single = await app.inject({ method: 'GET', url: '/api/products/1' });
    assert.equal(single.statusCode, 200);
    assert.equal(single.json().product.price_paise, 79900);

    const missing = await app.inject({ method: 'GET', url: '/api/products/9999' });
    assert.equal(missing.statusCode, 404);
  });

  it('POST /api/cart/validate ignores tampered client prices and computes authoritative server totals & coupons', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/cart/validate',
      payload: {
        items: [
          { id: 1, qty: 2, size: 'M', price_paise: 1 }, // 79900 * 2 = 159800 (ignores client price_paise: 1)
          { id: 5, qty: 1, size: 'Free Size', price_paise: 1 }, // 59900 * 1 = 59900
        ],
        couponCode: 'DIWALI20', // 20% off 219700 = 43940 -> 175760
      },
    });
    assert.equal(res.statusCode, 200);
    const body = res.json();
    assert.equal(body.success, true);
    assert.equal(body.subtotalPaise, 219700);
    assert.equal(body.discountPaise, 43940);
    assert.equal(body.totalPaise, 175760);
  });

  it('POST /api/create-order enforces idempotency keys, stock limits, GST invoice number, and 240s QR session', async () => {
    const idemKey = `idem_backend_${Date.now()}`;
    const payload = {
      customer: {
        name: 'Riya Rathore',
        phone: '9876543210',
        address: 'Plot 15, Malviya Nagar, Jaipur, Rajasthan 302017',
      },
      items: [{ id: 1, qty: 2, size: 'L' }],
      couponCode: 'FIRST10', // 10% off 159800 = 15980 -> 143820
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
    assert.equal(o1.subtotalPaise, 159800);
    assert.equal(o1.discountPaise, 15980);
    assert.equal(o1.amountPaise, 143820);
    assert.equal(/^ORD-\d{6}-08-\d{4}$/.test(o1.orderId), true);
    assert.equal(/^INV-KC-2026-\d{4}$/.test(o1.invoiceNumber), true);
    assert.equal(o1.expiresInSeconds, 240);

    const res2 = await app.inject({
      method: 'POST',
      url: '/api/create-order',
      headers: { 'x-idempotency-key': idemKey },
      payload,
    });
    assert.equal(res2.statusCode, 200);
    assert.equal(res2.json().orderId, o1.orderId);
    assert.equal(res2.json().idempotentReplay, true);

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

  it('generates 12-hex cryptographic Tracking ID & auto-decrements product stock on webhook confirmation, and masks PII on /api/track', async () => {
    const beforeProd = (await app.inject({ method: 'GET', url: '/api/products/2' })).json().product;
    const stockBefore = beforeProd.stock;

    const createRes = await app.inject({
      method: 'POST',
      url: '/api/create-order',
      payload: {
        customer: {
          name: 'Kavita Meena',
          phone: '9123456780',
          address: 'Sector 4, Mansarovar, Jaipur, Rajasthan 302020',
        },
        items: [{ id: 2, qty: 2 }], // 129900 * 2 = 259800 paise
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
            amount: 259800,
            method: 'upi',
          },
        },
      },
    });

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

    // Verify product #2 stock automatically decreased by 2
    const afterProd = (await app.inject({ method: 'GET', url: '/api/products/2' })).json().product;
    assert.equal(afterProd.stock, stockBefore - 2);

    const statusAfter = await app.inject({ method: 'GET', url: `/api/orders/${order.orderId}` });
    const statusJson = statusAfter.json();
    assert.equal(statusJson.status, 'CONFIRMED');
    assert.equal(
      Boolean(statusJson.trackingId && /^TRK-KC-[0-9A-F]{12}$/.test(statusJson.trackingId)),
      true
    );

    const adminUpdateRes = await app.inject({
      method: 'PUT',
      url: `/api/admin/orders/${order.orderId}/tracking`,
      headers: { 'x-admin-token': process.env.ADMIN_TOKEN },
      payload: {
        fulfillmentStatus: 'SHIPPED',
        courierName: 'BlueDart Express',
        trackingId: statusJson.trackingId,
        estimatedDelivery: '23 Oct 2026',
        location: 'Jaipur Central Hub',
        note: 'Dispatched via BlueDart Air',
      },
    });
    assert.equal(adminUpdateRes.statusCode, 200);

    const trackRes2 = await app.inject({
      method: 'GET',
      url: `/api/track/${statusJson.trackingId}`,
    });
    assert.equal(trackRes2.statusCode, 200);
    assert.equal(trackRes2.json().fulfillmentStatus, 'SHIPPED');
    assert.equal(trackRes2.json().courierName, 'BlueDart Express');
    assert.equal(trackRes2.json().customerName, undefined);
    assert.equal(trackRes2.json().phone, undefined);
    assert.equal(trackRes2.json().address, undefined);
  });

  it('enforces admin authentication, product CRUD, 4-Tier Fallback switching, and audit logs', async () => {
    const unauth = await app.inject({ method: 'GET', url: '/api/admin/orders' });
    assert.equal(unauth.statusCode, 401);

    const adminHeaders = { 'x-admin-token': process.env.ADMIN_TOKEN };

    const updateTarget = await app.inject({
      method: 'PUT',
      url: '/api/admin/notification-target',
      headers: adminHeaders,
      payload: { target: '123456789' },
    });
    assert.equal(updateTarget.statusCode, 200);

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

    await app.inject({
      method: 'PUT',
      url: '/api/admin/fallback-tier',
      headers: adminHeaders,
      payload: { tier: 1 },
    });

    const logsRes = await app.inject({
      method: 'GET',
      url: '/api/admin/audit-logs',
      headers: adminHeaders,
    });
    assert.equal(logsRes.statusCode, 200);
    assert.equal(logsRes.json().logs.length >= 3, true);
  });
});
