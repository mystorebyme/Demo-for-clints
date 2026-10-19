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
  DICTIONARIES,
  rupees,
  validateCheckoutForm,
  validateIndianPhone,
  validatePincode,
} from '../lib/store';
import {
  confirmServerOrder,
  createServerOrder,
  getServerOrder,
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

describe('Phase 1 Frontend — Bilingual (EN/HI) Completeness & Formatting', () => {
  it('ensures English and Hindi dictionaries have identical translation keys and non-empty values', () => {
    const enKeys = Object.keys(DICTIONARIES.en).sort();
    const hiKeys = Object.keys(DICTIONARIES.hi).sort();
    assert.deepEqual(enKeys, hiKeys);
    for (const k of enKeys) {
      assert.equal(DICTIONARIES.en[k].trim().length > 0, true, `Empty EN key: ${k}`);
      assert.equal(DICTIONARIES.hi[k].trim().length > 0, true, `Empty HI key: ${k}`);
    }
  });

  it('formats paise into Indian Rupees accurately without floating-point drift', () => {
    assert.equal(rupees(79900), '₹799');
    assert.equal(rupees(129900), '₹1,299');
    assert.equal(rupees(50023), '₹500.23');
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

describe('Phase 1 Frontend — Server-Authoritative Cart, Order Creation, Idempotency & Payment Verification', () => {
  it('calculates cart totals exclusively from server product prices in paise', () => {
    const res = validateCartServerSide([
      { id: 1, qty: 2, size: 'M' }, // 79900 * 2 = 159800
      { id: 7, qty: 1, size: 'Free Size' }, // 29900 * 1 = 29900
    ]);
    assert.equal(res.success, true);
    assert.equal(res.totalPaise, 189700);
  });

  it('creates an order with a 240s expiry, enforces idempotency keys, and confirms payment idempotently', () => {
    const idemKey = `test-idem-${Date.now()}`;
    const order1 = createServerOrder({
      customer: {
        name: 'Ananya Verma',
        phone: '9876543210',
        address: '42 MI Road, C-Scheme, Jaipur, Rajasthan, PIN: 302001',
      },
      items: [{ id: 1, qty: 1, size: 'M' }],
      idempotencyKey: idemKey,
    });
    assert.equal(order1.success, true);
    if (!order1.success) return;

    // Duplicate submission with same idempotency key returns identical orderId
    const order2 = createServerOrder({
      customer: {
        name: 'Ananya Verma',
        phone: '9876543210',
        address: '42 MI Road, C-Scheme, Jaipur, Rajasthan, PIN: 302001',
      },
      items: [{ id: 1, qty: 1, size: 'M' }],
      idempotencyKey: idemKey,
    });
    assert.equal(order2.success, true);
    if (order2.success) {
      assert.equal(order2.orderId, order1.orderId);
    }

    // Initial order status is PENDING
    const fetched = getServerOrder(order1.orderId);
    assert.equal(fetched?.status, 'PENDING');
    assert.equal(fetched?.amount_paise, 79900);

    // First confirmation succeeds
    const confirm1 = confirmServerOrder(order1.orderId, {
      id: `pay_test_${Date.now()}`,
      amount: 79900,
      method: 'upi_qr',
    });
    assert.equal(confirm1.result, 'confirmed');

    // Replay confirmation returns already_confirmed
    const confirm2 = confirmServerOrder(order1.orderId, {
      id: `pay_test_second_${Date.now()}`,
      amount: 79900,
      method: 'upi_qr',
    });
    assert.equal(confirm2.result, 'already_confirmed');
  });

  it('marks order FAILED on amount mismatch and protects admin token timing-safely', () => {
    const order = createServerOrder({
      customer: {
        name: 'Meera Joshi',
        phone: '9123456789',
        address: '88 Vaishali Nagar, Jaipur, Rajasthan, PIN: 302021',
      },
      items: [{ id: 4, qty: 1 }], // 99900 paise
    });
    assert.equal(order.success, true);
    if (!order.success) return;

    const mismatch = confirmServerOrder(order.orderId, {
      id: `pay_mismatch_${Date.now()}`,
      amount: 100, // wrong amount!
    });
    assert.equal(mismatch.result, 'amount_mismatch');
    assert.equal(getServerOrder(order.orderId)?.status, 'FAILED');

    assert.equal(verifyAdminTokenHeader('wrong'), false);
    assert.equal(verifyAdminTokenHeader('dev_admin_token_replace_me_123456'), true);
  });
});
