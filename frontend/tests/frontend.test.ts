import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  DEMO_PRODUCTS,
  enrichProduct,
  filterAndSortProducts,
  getProductPriceForSize,
  getSizeMeasurements,
  paginateProducts,
} from '../lib/catalog';
import {
  buildWhatsAppOrderUrl,
  buildWhatsAppShareUrl,
  DICTIONARIES,
  rupees,
  rupeesInWords,
  validateCheckoutForm,
  validateEmail,
  validateIndianPhone,
  validatePincode,
} from '../lib/store';
import {
  authenticateOrRegisterAccount,
  confirmServerOrder,
  createLiveProduct,
  createServerOrder,
  explainReferenceCodes,
  findServerOrderByOrderOrTrackingId,
  getAdminAnalyticsSummary,
  getCustomerAccount,
  getLiveProductById,
  getOrderEmailReceipt,
  getStoreProfile,
  listSentEmails,
  maskEmail,
  maskPhone,
  requestEmailVerificationOtp,
  sanitizeText,
  updateLiveProduct,
  updateServerOrderTracking,
  updateStoreProfile,
  upsertCustomerAccount,
  upsertServerCoupon,
  validateAuthenticEmail,
  validateCartServerSide,
  verifyAccountSessionToken,
  verifyAdminTokenHeader,
  verifyEmailWithOtp,
  verifyOrderAccessToken,
  checkPincodeServiceability,
  updateDeliveryConfig,
  createProductInquiry,
  listProductInquiries,
  requestRegistrationOtp,
} from '../lib/serverStore';

describe('Phase 1 Frontend — Luxury Catalog, Search, Filters, Sorting & Pagination', () => {
  it('contains 200+ items across all 3 required categories (kurti, bag, accessory) with size-based pricing', () => {
    assert.equal(DEMO_PRODUCTS.length >= 200, true, `Expected 200+ products, got ${DEMO_PRODUCTS.length}`);
    const categories = new Set(DEMO_PRODUCTS.map((p) => p.category));
    assert.equal(categories.has('kurti'), true);
    assert.equal(categories.has('bag'), true);
    assert.equal(categories.has('accessory'), true);
    for (const p of DEMO_PRODUCTS) {
      assert.equal(Number.isInteger(p.price_paise) && p.price_paise > 0, true);
    }

    // Verify dynamic size-based pricing on Kurti #1 (S < M < L < XL < XXL)
    const p1 = DEMO_PRODUCTS[0];
    const priceS = getProductPriceForSize(p1, 'S').price_paise;
    const priceM = getProductPriceForSize(p1, 'M').price_paise;
    const priceL = getProductPriceForSize(p1, 'L').price_paise;
    const priceXL = getProductPriceForSize(p1, 'XL').price_paise;
    const priceXXL = getProductPriceForSize(p1, 'XXL').price_paise;
    assert.equal(priceS < priceM && priceM < priceL && priceL < priceXL && priceXL < priceXXL, true);
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
    const page1 = paginateProducts(DEMO_PRODUCTS, 1, 12);
    assert.equal(page1.items.length, 12);
    assert.equal(page1.currentPage, 1);
    assert.equal(page1.totalPages, Math.ceil(DEMO_PRODUCTS.length / 12));

    const page2 = paginateProducts(DEMO_PRODUCTS, 2, 12);
    assert.equal(page2.items.length, 12);
    assert.equal(page2.currentPage, 2);
  });

  it('normalizes .webp database image URLs to .svg via enrichProduct', () => {
    const enriched = enrichProduct({
      id: 1,
      name: 'Sanganeri Mulmul Cotton Straight Kurti',
      name_hi: 'सांगानेरी मलमल कॉटन स्ट्रेट कुर्ती',
      category: 'kurti',
      price_paise: 79900,
      image_url: '/products/kurti1.webp',
      stock: 50,
    });
    assert.equal(enriched.image_url, '/products/kurti1.svg');
  });
});

describe('Phase 1 Frontend — Bilingual (EN/HI) Completeness, Amount-in-Words & WhatsApp Links', () => {
  it('ensures English and Hindi dictionaries have identical translation keys and non-empty values', () => {
    const enKeys = Object.keys(DICTIONARIES.en).sort();
    const hiKeys = Object.keys(DICTIONARIES.hi).sort();
    assert.deepEqual(enKeys, hiKeys);
    for (const k of enKeys) {
      assert.equal(DICTIONARIES.en[k].trim().length > 0, true, `Empty EN key: ${k}`);
      assert.equal(DICTIONARIES.hi[k].trim().length > 0, true, `Empty HI key: ${k}`);
    }
  });

  it('formats paise into Indian Rupees, converts Rupees to Words, and builds WhatsApp URLs', () => {
    assert.equal(rupees(79900), '₹799');
    assert.equal(rupees(129900), '₹1,299');
    assert.equal(rupeesInWords(149900).includes('One Thousand Four Hundred Ninety Nine'), true);

    const shareUrl = buildWhatsAppShareUrl({
      id: 2,
      name: 'Maharani Zardozi Festive Anarkali Kurti',
      price_paise: 129900,
    });
    assert.equal(shareUrl.startsWith('https://wa.me/?text='), true);

    const orderUrl = buildWhatsAppOrderUrl({
      id: 2,
      name: 'Maharani Zardozi Festive Anarkali Kurti',
      price_paise: 129900,
      size: 'M',
    });
    assert.equal(orderUrl.startsWith('https://wa.me/919876543210?text='), true);
  });
});

describe('Phase 1 Frontend — Checkout Form, Email, Phone & Security Sanitization', () => {
  it('validates 10-digit Indian mobile numbers, emails, and 6-digit PIN codes', () => {
    assert.equal(validateIndianPhone('9876543210'), true);
    assert.equal(validateIndianPhone('5123456789'), false);
    assert.equal(validateEmail('priya.sharma@gmail.com'), true);
    assert.equal(validateEmail('bad-email'), false);
    assert.equal(validatePincode('302001'), true);
    assert.equal(validatePincode('002001'), false);
  });

  it('strips XSS payloads and masks PII phone/email for public tracking lookups', () => {
    const cleaned = sanitizeText('<script>alert("xss")</script>Priya Sharma', 80);
    assert.equal(cleaned.includes('<'), false);
    assert.equal(cleaned.includes('>'), false);
    assert.equal(maskPhone('9876543210'), '+91-******3210');
    assert.equal(maskEmail('priya.sharma@gmail.com').includes('@gmail.com'), true);
  });

  it('rejects incomplete checkout forms and accepts valid forms with email', () => {
    assert.equal(
      validateCheckoutForm({
        name: 'A',
        phone: '9876543210',
        address: '123 MG Road, Jaipur',
      }).valid,
      false
    );
    assert.equal(
      validateCheckoutForm({
        name: 'Priya Sharma',
        phone: '9876543210',
        email: 'priya.sharma@gmail.com',
        address: 'Flat 12, Bapu Nagar, Jaipur, Rajasthan',
        pincode: '302015',
      }).valid,
      true
    );
  });
});

describe('Phase 1 Frontend — Zero-Trust Pricing, Coupons, Email Receipt Dispatch, Cryptographic Tracking & Customizable GST Profile', () => {
  it('ignores client-tampered prices and computes authoritative server totals & coupons', () => {
    // Product #1 = 79900 paise, #7 = 29900 paise -> 79900*2 + 29900 = 189700
    // Even if a scammer passes price_paise: 100 in the cart payload, server ignores it!
    const resTampered = validateCartServerSide([
      { id: 1, qty: 2, size: 'M', price_paise: 100 } as any,
      { id: 7, qty: 1, size: 'Free Size', price_paise: 100 } as any,
    ]);
    assert.equal(resTampered.success, true);
    assert.equal(resTampered.subtotalPaise, 189700);
    assert.equal(resTampered.totalPaise, 189700);

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

  it('creates an order, generates 12-hex Tracking ID, dispatches Email Receipt on confirmation, and deducts stock', () => {
    const stockBefore = getLiveProductById(1)?.stock ?? 50;
    const emailsBefore = listSentEmails().length;

    const idemKey = `test-idem-${Date.now()}`;
    const order1 = createServerOrder({
      customer: {
        name: 'Ananya Verma',
        email: 'ananya.verma@example.com',
        phone: '9829012345',
        address: '42 MI Road, C-Scheme, Jaipur, Rajasthan, PIN: 302001',
      },
      items: [{ id: 1, qty: 2, size: 'M' }], // 79900 * 2 = 159800
      couponCode: 'FIRST10', // 10% off = 15980 -> payable 143820
      idempotencyKey: idemKey,
    });
    assert.equal(order1.success, true);
    if (!order1.success) return;

    assert.equal(verifyOrderAccessToken(order1.orderAccessToken, order1.orderId), true);
    assert.equal(verifyOrderAccessToken('forged-token', order1.orderId), false);
    assert.equal(order1.subtotalPaise, 159800);
    assert.equal(order1.discountPaise, 15980);
    assert.equal(order1.amountPaise, 143820);
    assert.equal(/^ORD-\d{6}-08-\d{4}$/.test(order1.orderId), true);
    assert.equal(/^INV-KC-2026-\d{4}$/.test(order1.invoiceNumber), true);

    // Promo code single-use & first-order-only enforcement:
    // Ananya cannot use FIRST10 a second time on her account!
    const repeatFirst10 = createServerOrder({
      customer: {
        name: 'Ananya Verma',
        email: 'ananya.verma@example.com',
        phone: '9829012345',
        address: '42 MI Road, C-Scheme, Jaipur, Rajasthan, PIN: 302001',
      },
      items: [{ id: 1, qty: 1, size: 'M' }],
      couponCode: 'FIRST10',
    });
    assert.equal(repeatFirst10.success, false);

    // Password-protected Account Security (Zero Hijacking):
    // 1. Stranger cannot log into Priya Sharma's account with wrong password
    const wrongLogin = authenticateOrRegisterAccount({
      mode: 'login',
      email: 'priya.sharma@gmail.com',
      password: 'WrongPassword123',
    });
    assert.equal(wrongLogin.success, false);

    // 2. Stranger cannot overwrite/re-register Priya Sharma's account
    const hijackRegister = authenticateOrRegisterAccount({
      mode: 'register',
      email: 'priya.sharma@gmail.com',
      password: 'NewPassword123',
      name: 'Hacker',
      phone: '9876543210',
    });
    assert.equal(hijackRegister.success, false);

    // 3. Stranger cannot claim Ananya's order email with a different phone number
    const wrongPhoneClaim = authenticateOrRegisterAccount({
      mode: 'register',
      email: 'ananya.verma@example.com',
      password: 'AnanyaPass123',
      name: 'Ananya Verma',
      phone: '9111122222',
    });
    assert.equal(wrongPhoneClaim.success, false);

    // 4. Ananya can register her account by providing her matching order phone number (9829012345)
    const validClaim = authenticateOrRegisterAccount({
      mode: 'register',
      email: 'ananya.verma@example.com',
      password: 'AnanyaPass123',
      name: 'Ananya Verma',
      phone: '9829012345',
    });
    assert.equal(validClaim.success, true);
    if (validClaim.success) {
      assert.equal(
        verifyAccountSessionToken(validClaim.sessionToken, 'ananya.verma@example.com').valid,
        true
      );
    }

    const explained = explainReferenceCodes(
      order1.orderId,
      order1.invoiceNumber,
      'TRK-KC-261019081002'
    );
    assert.equal(explained.orderFormat.segments.length, 4);
    assert.equal(explained.invoiceFormat.segments.length, 4);
    assert.equal(explained.trackingFormat.segments.length, 4);

    // Gmail / Email Account Sync + Real Email OTP Verification
    assert.equal(validateAuthenticEmail('test@gmail.com').valid, false);
    assert.equal(validateAuthenticEmail('123456@gmail.com').valid, false);
    assert.equal(validateAuthenticEmail('pagal@gmail.com').valid, false);
    assert.equal(validateAuthenticEmail('user@yopmail.com').valid, false);
    assert.equal(validateAuthenticEmail('ananya.verma@gmail.com').valid, true);

    const otpReq = requestEmailVerificationOtp('ananya.verma@gmail.com');
    assert.equal(otpReq.success, true);
    assert.equal(Boolean(otpReq.otpPreview && /^\d{6}$/.test(otpReq.otpPreview)), true);

    const verifiedAcct = verifyEmailWithOtp('ananya.verma@gmail.com', otpReq.otpPreview!);
    assert.equal(verifiedAcct.success, true);

    const acct = upsertCustomerAccount({
      email: 'ananya.verma@example.com',
      name: 'Ananya Verma',
      phone: '9876543210',
      pincode: '302001',
      cityState: 'Jaipur, Rajasthan',
      address: '42 MI Road, C-Scheme',
      wishlist: [1, 7],
    });
    assert.equal(acct?.profile.email, 'ananya.verma@example.com');
    assert.equal(acct?.orders.length, 1);
    assert.equal(acct?.wishlistProducts.length, 2);
    assert.equal(Boolean(getCustomerAccount('priya.sharma@gmail.com')?.orders.length), true);

    // Confirm payment -> generates 12-hex Tracking ID (TRK-KC-XXXXXXXXXXXX), sends Email Receipt & deducts stock
    const confirm1 = confirmServerOrder(order1.orderId, {
      id: `pay_test_${Date.now()}`,
      amount: 143820,
      method: 'upi_qr',
    });
    assert.equal(confirm1.result, 'confirmed');
    assert.equal(
      Boolean(confirm1.trackingId && /^TRK-KC-[0-9A-F]{12}$/.test(confirm1.trackingId)),
      true
    );
    assert.equal(confirm1.emailSentTo, 'ananya.verma@example.com');
    assert.equal(listSentEmails().length >= emailsBefore + 2, true);
    const receipt = getOrderEmailReceipt(order1.orderId);
    assert.equal(receipt?.tracking_id, confirm1.trackingId);
    assert.equal(Boolean(receipt?.html_preview.includes(confirm1.trackingId!)), true);

    const stockAfter = getLiveProductById(1)?.stock ?? 0;
    assert.equal(stockAfter, stockBefore - 2);

    // Lookup by confidential Tracking ID
    const tracked = findServerOrderByOrderOrTrackingId(confirm1.trackingId!);
    assert.equal(tracked?.order_id, order1.orderId);

    // Admin updates tracking to SHIPPED
    const updated = updateServerOrderTracking(order1.orderId, {
      fulfillmentStatus: 'SHIPPED',
      courierName: 'BlueDart Air',
      location: 'Jaipur Airport Hub',
      note: 'Dispatched by air courier',
    });
    assert.equal(updated?.fulfillment_status, 'SHIPPED');
    assert.equal(updated?.courier_name, 'BlueDart Air');
  });

  it('supports customizable Store GST Profile, Admin product/stock/photo CRUD, and analytics', () => {
    const initialProfile = getStoreProfile();
    assert.equal(initialProfile.gstin.length, 15);

    const updatedProfile = updateStoreProfile({
      storeName: 'ROYAL MEWAR EMPORIUM',
      gstin: '08AABCR1111K1Z9',
      invoicePrefix: 'RME-2026',
    });
    assert.equal(updatedProfile.storeName, 'ROYAL MEWAR EMPORIUM');
    assert.equal(updatedProfile.gstin, '08AABCR1111K1Z9');

    // Restore default store name
    updateStoreProfile({
      storeName: 'ZARIYA JAIPUR — ROYAL ETHNIC HOUSE',
      gstin: '08AABCZ9481K1Z4',
      invoicePrefix: 'INV-KC-2026',
    });

    const newProd = createLiveProduct({
      name: 'Bandhani Gotapatti Kurti',
      name_hi: 'बंधेज गोटापट्टी कुर्ती',
      category: 'kurti',
      price_paise: 109900,
      stock: 15,
      image_url: '/products/kurti3.svg',
    });
    assert.equal(newProd.stock, 15);

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
    assert.equal(verifyAdminTokenHeader('wrong'), false);
    assert.equal(verifyAdminTokenHeader('dev_admin_token_replace_me_123456'), true);
  });

  it('enforces Store Owner PIN Code & Address Serviceability, 2-step Verified Registration, and Item Inquiries', () => {
    // 1. Valid Jaipur PIN code
    const jaipurCheck = checkPincodeServiceability(
      '302001',
      'Plot 42, Johari Bazar, Jaipur, Rajasthan'
    );
    assert.equal(jaipurCheck.valid, true);
    assert.equal(jaipurCheck.serviceable, true);
    assert.equal(jaipurCheck.district, 'Jaipur');
    assert.equal(jaipurCheck.state, 'Rajasthan');

    // 2. Bogus / invalid PIN code is rejected
    const bogusCheck = checkPincodeServiceability('111111');
    assert.equal(bogusCheck.valid, false);
    assert.equal(bogusCheck.serviceable, false);

    // 3. Store Owner restricts delivery to Rajasthan only -> Mumbai (400001) becomes unserviceable
    updateDeliveryConfig({
      mode: 'SELECTED_STATES',
      serviceableStates: ['Rajasthan'],
    });
    const mumbaiRestricted = checkPincodeServiceability(
      '400001',
      '14 Marine Drive, Nariman Point, Mumbai'
    );
    assert.equal(mumbaiRestricted.valid, true);
    assert.equal(mumbaiRestricted.serviceable, false);

    // Restore ALL_INDIA delivery mode
    updateDeliveryConfig({ mode: 'ALL_INDIA' });
    const mumbaiRestored = checkPincodeServiceability(
      '400001',
      '14 Marine Drive, Nariman Point, Mumbai'
    );
    assert.equal(mumbaiRestored.serviceable, true);

    // 4. Customer Product Inquiry to Store Owner
    const inqRes = createProductInquiry({
      productId: 1,
      selectedSize: 'L',
      customerName: 'Kavita Rathore',
      customerPhone: '9829055555',
      customerEmail: 'kavita.rathore@gmail.com',
      pincode: '302001',
      message: 'Can you customize the sleeve length for Size L?',
    });
    assert.equal(inqRes.success, true);
    assert.equal(listProductInquiries().length >= 1, true);

    // 5. 2-Step Verified Registration never leaks OTP in browser JSON response
    const regOtp = requestRegistrationOtp({
      email: 'kavita.rathore@gmail.com',
      password: 'SecurePassword99',
      name: 'Kavita Rathore',
      phone: '9829055555',
    });
    assert.equal(regOtp.success, true);
    assert.equal('otpPreview' in regOtp, false);
  });

  it('provides 6-image galleries, XS-3XL size measurements, and verified OTP login/password-reset/wishlist/address-book account workflows', async () => {
    const {
      getPendingOtpNotification,
      requestLoginOtp,
      verifyLoginOtp,
      requestPasswordResetOtp,
      verifyPasswordResetOtpAndSetPassword,
      upsertCustomerAccount,
    } = await import('../lib/serverStore');

    // 1. All 216 products have 6 gallery images, angle captions, rich descriptions, and per-size measurements
    for (const p of DEMO_PRODUCTS) {
      assert.equal(Array.isArray(p.gallery), true);
      assert.equal(p.gallery!.length, 6, `Product #${p.id} must have 6 gallery images`);
      assert.equal(p.gallery_captions?.length, 6);
      assert.equal(Boolean(p.long_description && p.long_description.length > 40), true);
      assert.equal(Boolean(p.package_contents && p.package_contents.length > 5), true);
    }

    const kurti1 = DEMO_PRODUCTS[0];
    assert.equal(kurti1.sizes.includes('XS'), true);
    assert.equal(kurti1.sizes.includes('3XL'), true);
    const m3xl = getSizeMeasurements(kurti1, '3XL');
    assert.equal(
      m3xl.metrics.some((m) => m.label.includes('Bust') && m.value.includes('46')),
      true
    );

    // 2. Passwordless Email OTP Login flow for registered patron
    const loginOtpReq = requestLoginOtp('priya.sharma@gmail.com');
    assert.equal(loginOtpReq.success, true);
    const notif = getPendingOtpNotification('priya.sharma@gmail.com');
    assert.equal(Boolean(notif && notif.otpCode.length === 6), true);

    const loginOtpVerify = verifyLoginOtp('priya.sharma@gmail.com', notif!.otpCode);
    assert.equal(loginOtpVerify.success, true);
    if (loginOtpVerify.success) {
      assert.equal(loginOtpVerify.profile.email, 'priya.sharma@gmail.com');
      assert.equal(loginOtpVerify.sessionToken.startsWith('zjsess_'), true);
    }

    // 3. Forgot Password / Reset Password via Email OTP flow
    const resetReq = requestPasswordResetOtp('priya.sharma@gmail.com');
    assert.equal(resetReq.success, true);
    const resetNotif = getPendingOtpNotification('priya.sharma@gmail.com');
    assert.equal(Boolean(resetNotif && resetNotif.otpCode.length === 6), true);

    const resetVerify = verifyPasswordResetOtpAndSetPassword({
      email: 'priya.sharma@gmail.com',
      otp: resetNotif!.otpCode,
      newPassword: 'PriyaNewPassword@2026',
    });
    assert.equal(resetVerify.success, true);

    // Verify login works with the newly reset password
    const loginWithNewPwd = authenticateOrRegisterAccount({
      mode: 'login',
      email: 'priya.sharma@gmail.com',
      password: 'PriyaNewPassword@2026',
    });
    assert.equal(loginWithNewPwd.success, true);

    // Restore default password for Priya
    const restoreReq = requestPasswordResetOtp('priya.sharma@gmail.com');
    assert.equal(restoreReq.success, true);
    verifyPasswordResetOtpAndSetPassword({
      email: 'priya.sharma@gmail.com',
      otp: '100108',
      newPassword: 'Priya@2026',
    });

    // 4. Saved Address Book & Wishlist sync on the account
    const synced = upsertCustomerAccount({
      email: 'priya.sharma@gmail.com',
      wishlist: [1, 2, 5, 10],
      savedAddresses: [
        {
          id: 'addr-1',
          label: 'Home',
          recipientName: 'Priya Sharma',
          phone: '9876543210',
          pincode: '302001',
          cityState: 'Jaipur, Rajasthan',
          addressLine: 'Flat 102, Rose Residency, MI Road',
          isDefault: true,
        },
        {
          id: 'addr-2',
          label: 'Work',
          recipientName: 'Priya Sharma',
          phone: '9876543210',
          pincode: '302022',
          cityState: 'Jaipur, Rajasthan',
          addressLine: 'Sitapura Industrial Area, Tonk Road',
          isDefault: false,
        },
      ],
    });
    assert.equal(synced?.profile.wishlist.includes(10), true);
    assert.equal(synced?.profile.savedAddresses?.length, 2);
  });
});
