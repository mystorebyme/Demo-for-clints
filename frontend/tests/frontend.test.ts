import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  DEMO_PRODUCTS,
  enrichProduct,
  filterAndSortProducts,
  paginateProducts,
} from '../lib/catalog';
import {
  buildWhatsAppOrderUrl,
  buildWhatsAppShareUrl,
  DICTIONARIES,
  rupees,
  validateCheckoutForm,
  validateIndianPhone,
  validatePincode,
} from '../lib/store';
import {
  confirmServerOrder,
  createLiveProduct,
  createServerOrder,
  findServerOrderByOrderOrTrackingId,
  getAdminAnalyticsSummary,
  getLiveProductById,
  getServerOrder,
  updateLiveProduct,
  updateServerOrderTracking,
  upsertServerCoupon,
  validateCartServerSide,
  verifyAdminTokenHeader,
} from '../lib/serverStore';

describe('Phase 1 Frontend — Catalog, Search, Filters, Sorting & Pagination', () => {
  it('contains all 3 required categories (kurti, bag, accessory) with demo flag', () => {
    const categories = new Set(DEMO_PRODUCTS.map((p) => p.category));
    assert.equal(categories.has('kurti'), true);
    assert.equal(categories.has('bag'), true);
    assert.equal(categories.has('accessory'), true);
    for (const p of DEMO_PRODUCTS) {
      assert.equal(p.is_demo, true);
      assert.equal(Number.isInteger(p.price_paise) && p.price_paise > 0, true);
    }
  });

  it('verifies every product SVG asset exists on disk in public/products/', () => {
    const publicDir = path.join(process.cwd(), 'public');
    for (const p of DEMO_PRODUCTS) {
      const svgPath = path.join(publicDir, p.image_url);
      assert.equal(fs.existsSync(svgPath), true, `Missing asset: ${svgPath}`);
    }
  });

  it('filters by category and stock status accurately', () => {
    const kurtis = filterAndSortProducts(DEMO_PRODUCTS, { category: 'kurti' });
    assert.equal(kurtis.every((p) => p.category === 'kurti'), true);

    const inStock = filterAndSortProducts(DEMO_PRODUCTS, { inStockOnly: true });
    assert.equal(inStock.every((p) => p.stock > 0), true);
    assert.equal(inStock.length < DEMO_PRODUCTS.length, true);
  });

  it('searches across both English and Hindi product names and descriptions', () => {
    const enSearch = filterAndSortProducts(DEMO_PRODUCTS, { query: 'Chikankari' });
    assert.equal(enSearch.length, 1);
    assert.equal(enSearch[0].id, 3);

    const hiSearch = filterAndSortProducts(DEMO_PRODUCTS, { query: 'चिकनकारी' });
    assert.equal(hiSearch.length, 1);
    assert.equal(hiSearch[0].id, 3);
  });

  it('sorts products by price ascending and descending', () => {
    const asc = filterAndSortProducts(DEMO_PRODUCTS, { sort: 'price-asc' });
    for (let i = 1; i < asc.length; i++) {
      assert.equal(asc[i].price_paise >= asc[i - 1].price_paise, true);
    }

    const desc = filterAndSortProducts(DEMO_PRODUCTS, { sort: 'price-desc' });
    for (let i = 1; i < desc.length; i++) {
      assert.equal(desc[i].price_paise <= desc[i - 1].price_paise, true);
    }
  });

  it('paginates product lists with correct page boundaries', () => {
    const page1 = paginateProducts(DEMO_PRODUCTS, 1, 8);
    assert.equal(page1.items.length, 8);
    assert.equal(page1.currentPage, 1);
    assert.equal(page1.totalPages, 2);

    const page2 = paginateProducts(DEMO_PRODUCTS, 2, 8);
    assert.equal(page2.items.length, DEMO_PRODUCTS.length - 8);
    assert.equal(page2.currentPage, 2);
  });

  it('normalizes .webp database image URLs to .svg via enrichProduct', () => {
    const enriched = enrichProduct({
      id: 1,
      name: 'Cotton Straight Kurti',
      name_hi: 'कॉटन स्ट्रेट कुर्ती',
      category: 'kurti',
      price_paise: 79900,
      image_url: '/products/kurti1.webp',
      stock: 50,
    });
    assert.equal(enriched.image_url, '/products/kurti1.svg');
  });
});

describe('Phase 1 Frontend — Bilingual (EN/HI) Completeness, WhatsApp Links & Formatting', () => {
  it('ensures English and Hindi dictionaries have identical translation keys and non-empty values', () => {
    const enKeys = Object.keys(DICTIONARIES.en).sort();
    const hiKeys = Object.keys(DICTIONARIES.hi).sort();
    assert.deepEqual(enKeys, hiKeys);
    for (const k of enKeys) {
      assert.equal(DICTIONARIES.en[k].trim().length > 0, true, `Empty EN key: ${k}`);
      assert.equal(DICTIONARIES.hi[k].trim().length > 0, true, `Empty HI key: ${k}`);
    }
  });

  it('formats paise into Indian Rupees and builds WhatsApp share/order URLs accurately', () => {
    assert.equal(rupees(79900), '₹799');
    assert.equal(rupees(129900), '₹1,299');
    assert.equal(rupees(50023), '₹500.23');

    const shareUrl = buildWhatsAppShareUrl({
      id: 2,
      name: 'Festive Anarkali Kurti',
      price_paise: 129900,
    });
    assert.equal(shareUrl.startsWith('https://wa.me/?text='), true);

    const orderUrl = buildWhatsAppOrderUrl({
      id: 2,
      name: 'Festive Anarkali Kurti',
      price_paise: 129900,
      size: 'M',
    });
    assert.equal(orderUrl.startsWith('https://wa.me/919876543210?text='), true);
  });
});

describe('Phase 1 Frontend — Checkout Form & Phone Validation', () => {
  it('validates 10-digit Indian mobile numbers starting with 6-9', () => {
    assert.equal(validateIndianPhone('9876543210'), true);
    assert.equal(validateIndianPhone('6123456789'), true);
    assert.equal(validateIndianPhone('5123456789'), false);
    assert.equal(validateIndianPhone('987654321'), false);
    assert.equal(validateIndianPhone('98765432100'), false);
  });

  it('validates 6-digit Indian PIN codes', () => {
    assert.equal(validatePincode('302001'), true);
    assert.equal(validatePincode('002001'), false);
    assert.equal(validatePincode('30200'), false);
  });

  it('rejects incomplete checkout forms and accepts valid forms', () => {
    assert.equal(
      validateCheckoutForm({ name: 'A', phone: '9876543210', address: '123 MG Road, Jaipur' }).valid,
      false
    );
    assert.equal(
      validateCheckoutForm({ name: 'Priya Sharma', phone: '1234567890', address: '123 MG Road, Jaipur' }).valid,
      false
    );
    assert.equal(
      validateCheckoutForm({
        name: 'Priya Sharma',
        phone: '9876543210',
        address: 'Flat 12, Bapu Nagar, Jaipur, Rajasthan',
        pincode: '302015',
      }).valid,
      true
    );
  });
});

describe('Phase 1 Frontend — Coupons, Auto Stock Decrement, GST Invoices, Tracking & Admin Analytics', () => {
  it('calculates cart totals and applies festive coupon discounts (DIWALI20 & FIRST10) server-side', () => {
    // Without coupon: 79900 * 2 + 29900 * 1 = 189700
    const resNoCoupon = validateCartServerSide([
      { id: 1, qty: 2, size: 'M' },
      { id: 7, qty: 1, size: 'Free Size' },
    ]);
    assert.equal(resNoCoupon.success, true);
    assert.equal(resNoCoupon.subtotalPaise, 189700);
    assert.equal(resNoCoupon.discountPaise, 0);
    assert.equal(resNoCoupon.totalPaise, 189700);

    // With DIWALI20 (20% OFF on ₹1,299+): 20% of 189700 = 37940 -> total = 151760
    const resDiwali = validateCartServerSide(
      [
        { id: 1, qty: 2, size: 'M' },
        { id: 7, qty: 1, size: 'Free Size' },
      ],
      'DIWALI20'
    );
    assert.equal(resDiwali.success, true);
    assert.equal(resDiwali.couponCode, 'DIWALI20');
    assert.equal(resDiwali.discountPaise, 37940);
    assert.equal(resDiwali.totalPaise, 151760);
  });

  it('creates an order with coupon & GST invoice, auto-decrements product stock on confirmation, and supports Admin live tracking', () => {
    const stockBefore = getLiveProductById(1)?.stock ?? 50;
    const soldBefore = getLiveProductById(1)?.sold_count ?? 0;

    const idemKey = `test-idem-${Date.now()}`;
    const order1 = createServerOrder({
      customer: {
        name: 'Ananya Verma',
        phone: '9876543210',
        address: '42 MI Road, C-Scheme, Jaipur, Rajasthan, PIN: 302001',
      },
      items: [{ id: 1, qty: 2, size: 'M' }], // 79900 * 2 = 159800
      couponCode: 'FIRST10', // 10% off = 15980 -> payable 143820
      idempotencyKey: idemKey,
    });
    assert.equal(order1.success, true);
    if (!order1.success) return;

    assert.equal(order1.subtotalPaise, 159800);
    assert.equal(order1.discountPaise, 15980);
    assert.equal(order1.amountPaise, 143820);
    assert.equal(order1.invoiceNumber.startsWith('INV-KC-2026-'), true);

    // Confirm payment -> generates Tracking ID (TRK-KC-...) AND decrements product #1 stock by 2
    const confirm1 = confirmServerOrder(order1.orderId, {
      id: `pay_test_${Date.now()}`,
      amount: 143820,
      method: 'upi_qr',
    });
    assert.equal(confirm1.result, 'confirmed');
    assert.equal(Boolean(confirm1.trackingId && confirm1.trackingId.startsWith('TRK-KC-')), true);

    const stockAfter = getLiveProductById(1)?.stock ?? 0;
    const soldAfter = getLiveProductById(1)?.sold_count ?? 0;
    assert.equal(stockAfter, stockBefore - 2);
    assert.equal(soldAfter, soldBefore + 2);

    // Lookup by Tracking ID
    const tracked = findServerOrderByOrderOrTrackingId(confirm1.trackingId!);
    assert.equal(tracked?.order_id, order1.orderId);
    assert.equal(tracked?.fulfillment_status, 'ORDER_PLACED');

    // Admin updates tracking to SHIPPED
    const updated = updateServerOrderTracking(order1.orderId, {
      fulfillmentStatus: 'SHIPPED',
      courierName: 'BlueDart Air',
      location: 'Jaipur Airport Hub',
      note: 'Dispatched by air courier',
    });
    assert.equal(updated?.fulfillment_status, 'SHIPPED');
    assert.equal(updated?.courier_name, 'BlueDart Air');
    assert.equal(updated?.tracking_history.length, 2);

    // Replay confirmation does NOT double-deduct stock
    const confirm2 = confirmServerOrder(order1.orderId, {
      id: `pay_test_second_${Date.now()}`,
      amount: 143820,
      method: 'upi_qr',
    });
    assert.equal(confirm2.result, 'already_confirmed');
    assert.equal(getLiveProductById(1)?.stock, stockAfter);
  });

  it('supports Admin product & stock image creation/updating, custom coupons, and analytics summary', () => {
    const newProd = createLiveProduct({
      name: 'Bandhani Gotapatti Kurti',
      name_hi: 'बंधेज गोटापट्टी कुर्ती',
      category: 'kurti',
      price_paise: 109900,
      stock: 15,
      image_url: '/products/kurti3.svg',
    });
    assert.equal(newProd.stock, 15);
    assert.equal(newProd.price_paise, 109900);

    const editedProd = updateLiveProduct(newProd.id, {
      stock: 28,
      image_url: '/products/kurti4.svg',
    });
    assert.equal(editedProd?.stock, 28);
    assert.equal(editedProd?.image_url, '/products/kurti4.svg');

    const customCoupon = upsertServerCoupon({
      code: 'WEDDING25',
      description_en: '25% OFF Wedding Collection',
      discount_type: 'PERCENT',
      discount_value: 25,
      min_order_paise: 50000,
    });
    assert.equal(customCoupon.code, 'WEDDING25');

    const analytics = getAdminAnalyticsSummary();
    assert.equal(analytics.totalRevenuePaise > 0, true);
    assert.equal(analytics.categoryBreakdown.length, 3);
    assert.equal(analytics.dailySeries.length, 7);

    assert.equal(verifyAdminTokenHeader('wrong'), false);
    assert.equal(verifyAdminTokenHeader('dev_admin_token_replace_me_123456'), true);
  });
});
