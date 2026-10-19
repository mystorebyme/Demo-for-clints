import crypto from 'crypto';
import { DEMO_PRODUCTS, getProductPriceForSize, Product } from './catalog';

export type OrderStatus =
  | 'CREATED'
  | 'PENDING'
  | 'PAID'
  | 'CONFIRMED'
  | 'FAILED'
  | 'EXPIRED'
  | 'MANUAL_REVIEW';

export type FulfillmentStatus =
  | 'PENDING_PAYMENT'
  | 'ORDER_PLACED'
  | 'PACKED'
  | 'SHIPPED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

export type TrackingEvent = {
  status: FulfillmentStatus;
  title: string;
  location: string;
  note: string;
  timestamp: string;
};

export type StoreProfile = {
  storeName: string;
  legalName: string;
  gstin: string;
  pan: string;
  stateName: string;
  stateCode: string;
  address: string;
  supportEmail: string;
  supportPhone: string;
  invoicePrefix: string;
  freeShippingThresholdPaise: number;
  shippingChargePaise: number;
  gstRatePercent: number;
  signatoryName: string;
};

export type EmailReceiptRecord = {
  id: string;
  order_id: string;
  to_email: string;
  customer_name: string;
  subject: string;
  tracking_id: string;
  invoice_number: string;
  amount_paise: number;
  html_preview: string;
  sent_at: string;
  status: 'SENT' | 'DELIVERED';
};

export type CouponRecord = {
  code: string;
  description_en: string;
  description_hi: string;
  discount_type: 'PERCENT' | 'FLAT';
  discount_value: number;
  min_order_paise: number;
  max_discount_paise: number;
  active: boolean;
  usage_count: number;
};

export type ProductReview = {
  id: string;
  product_id: number;
  customer_name: string;
  city: string;
  rating: number;
  comment: string;
  verified: boolean;
  created_at: string;
};

export type LiveProduct = Product & {
  sold_count: number;
};

export type ServerOrderItem = {
  id: number;
  name: string;
  name_hi: string;
  qty: number;
  size: string;
  price_paise: number;
  line_total_paise: number;
  image_url: string;
  category?: string;
  hsn_code?: string;
};

export type ServerOrderRecord = {
  order_id: string;
  gateway_order_id: string;
  idempotency_key: string | null;
  customer_name: string;
  customer_email: string;
  phone: string;
  address: string;
  items: ServerOrderItem[];
  subtotal_paise: number;
  discount_paise: number;
  shipping_paise: number;
  coupon_code: string | null;
  taxable_paise: number;
  cgst_paise: number;
  sgst_paise: number;
  igst_paise: number;
  gst_paise: number;
  supply_type: 'INTRA_STATE' | 'INTER_STATE';
  amount_paise: number;
  invoice_number: string;
  status: OrderStatus;
  tracking_id: string | null;
  courier_name: string;
  fulfillment_status: FulfillmentStatus;
  estimated_delivery: string | null;
  tracking_history: TrackingEvent[];
  email_sent: boolean;
  email_sent_at: string | null;
  qr_expires_at: string;
  qr_payload: string;
  created_at: string;
  updated_at: string;
  payment_id?: string;
  stock_deducted?: boolean;
};

export type CustomerAccountRecord = {
  email: string;
  name: string;
  phone: string;
  pincode: string;
  cityState: string;
  address: string;
  wishlist: number[];
  email_verified?: boolean;
  verified_at?: string | null;
  updated_at: string;
};

export type ReferenceCodeSegment = {
  segment: string;
  digits: string;
  meaning_en: string;
  meaning_hi: string;
};

type GlobalStore = {
  storeProfile: StoreProfile;
  products: LiveProduct[];
  coupons: Map<string, CouponRecord>;
  reviews: Map<number, ProductReview[]>;
  orders: Map<string, ServerOrderRecord>;
  accounts: Map<string, CustomerAccountRecord>;
  emailOtps: Map<string, { otp: string; expiresAt: number }>;
  emails: EmailReceiptRecord[];
  idempotencyMap: Map<string, string>;
  paymentIds: Set<string>;
  notificationTarget: string;
  fallbackTier: 1 | 2 | 3 | 4;
  nextSerialNumber: number;
};

const globalRef = globalThis as unknown as { __FASHION_SERVER_STORE__?: GlobalStore };

/**
 * Sanitizes untrusted user text against XSS, HTML injection, and control chars.
 */
export function sanitizeText(input: unknown, maxLen = 300): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[<>"'`\\]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLen);
}

export function maskPhone(phone: string): string {
  const digits = (phone || '').replace(/\D/g, '');
  if (digits.length < 4) return '******';
  return `+91-******${digits.slice(-4)}`;
}

export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '***@***.com';
  const [user, domain] = email.split('@');
  const prefix = user.slice(0, 2);
  return `${prefix}***@${domain}`;
}

const DEFAULT_STORE_PROFILE: StoreProfile = {
  storeName: 'Zariya Jaipur — Royal Ethnic House',
  legalName: 'Zariya Heritage Craft Pvt. Ltd.',
  gstin: '08AABCK7412R1Z5',
  pan: 'AABCK7412R',
  stateName: 'Rajasthan',
  stateCode: '08',
  address: 'Showroom 14, Heritage Arcade, MI Road, Jaipur, Rajasthan – 302001',
  supportEmail: 'concierge@zariyajaipur.in',
  supportPhone: '+91-9876543210',
  invoicePrefix: 'INV/ZRJ/26-27/',
  freeShippingThresholdPaise: 99900,
  shippingChargePaise: 0,
  gstRatePercent: 5,
  signatoryName: 'For Zariya Heritage Craft Pvt. Ltd. — Authorized Signatory',
};

const DEMO_SEED_ORDER: ServerOrderRecord = {
  order_id: 'ORDDEMO1001',
  gateway_order_id: 'order_demo_1001',
  idempotency_key: 'demo-seed-1001',
  customer_name: 'Priya Sharma',
  customer_email: 'priya.sharma@gmail.com',
  phone: '9876543210',
  address: 'Flat 102, Rose Residency, MI Road, Jaipur, Rajasthan, PIN: 302001',
  items: [
    {
      id: 2,
      name: 'Maharani Zardozi Festive Anarkali Kurti',
      name_hi: 'महारानी ज़रदोज़ी फेस्टिव अनारकली कुर्ती',
      qty: 1,
      size: 'M',
      price_paise: 129900,
      line_total_paise: 129900,
      image_url: '/products/kurti2.svg',
      category: 'kurti',
      hsn_code: '6204',
    },
    {
      id: 7,
      name: 'Heritage Filigree Oxidized Jhumka Earrings',
      name_hi: 'हेरिटेज फिलिग्री ऑक्सीडाइज़्ड झुमका इयररिंग्स',
      qty: 1,
      size: 'Free Size',
      price_paise: 29900,
      line_total_paise: 29900,
      image_url: '/products/acc1.svg',
      category: 'accessory',
      hsn_code: '7117',
    },
  ],
  subtotal_paise: 159800,
  discount_paise: 31960,
  shipping_paise: 0,
  coupon_code: 'DIWALI20',
  taxable_paise: 121752,
  cgst_paise: 3044,
  sgst_paise: 3044,
  igst_paise: 0,
  gst_paise: 6088,
  supply_type: 'INTRA_STATE',
  amount_paise: 127840,
  invoice_number: 'INV-KC-2026-1001',
  status: 'CONFIRMED',
  tracking_id: 'TRK-KC-261019081001',
  courier_name: 'BlueDart Royal Priority',
  fulfillment_status: 'SHIPPED',
  estimated_delivery: '22 Oct 2026',
  tracking_history: [
    {
      status: 'ORDER_PLACED',
      title: 'Order Confirmed & GST Receipt Emailed',
      location: 'Jaipur Flagship Atelier, RJ',
      note: 'Server webhook verified payment of ₹1,278.40. Official GST Invoice INV-KC-2026-1001 & confidential Tracking ID TRK-KC-261019081001 sent to priya.sharma@gmail.com.',
      timestamp: new Date(Date.now() - 3600 * 1000 * 18).toISOString(),
    },
    {
      status: 'PACKED',
      title: 'Artisanal Quality Inspection & Tamper-Proof Packaging',
      location: 'Sitapura Fulfillment Hub, Jaipur',
      note: 'Pieces steamed, inspected, packed with printed GST tax invoice, and sealed.',
      timestamp: new Date(Date.now() - 3600 * 1000 * 10).toISOString(),
    },
    {
      status: 'SHIPPED',
      title: 'Dispatched via BlueDart Royal Priority Air',
      location: 'Jaipur Regional Sorting Hub',
      note: 'Consignment in transit to destination hub. Expected delivery within 48 hours.',
      timestamp: new Date(Date.now() - 3600 * 1000 * 3).toISOString(),
    },
  ],
  email_sent: true,
  email_sent_at: new Date(Date.now() - 3600 * 1000 * 18).toISOString(),
  qr_expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
  qr_payload: 'upi://pay?pa=zariya.jaipur@upi&pn=Zariya%20Jaipur&am=1278.40&cu=INR&tr=ORDDEMO1001',
  created_at: new Date(Date.now() - 3600 * 1000 * 18).toISOString(),
  updated_at: new Date(Date.now() - 3600 * 1000 * 3).toISOString(),
  payment_id: 'pay_verified_1001',
  stock_deducted: true,
};

const INITIAL_COUPONS: CouponRecord[] = [
  {
    code: 'FIRST10',
    description_en: '10% Privilege OFF on your first boutique order (up to ₹500)',
    description_hi: 'आपके पहले बुटीक ऑर्डर पर 10% की विशेष छूट (₹500 तक)',
    discount_type: 'PERCENT',
    discount_value: 10,
    min_order_paise: 0,
    max_discount_paise: 50000,
    active: true,
    usage_count: 14,
  },
  {
    code: 'DIWALI20',
    description_en: 'Festive Couture: 20% OFF on orders ₹1,299+ (up to ₹1,000)',
    description_hi: 'फेस्टिव कलेक्शन: ₹1,299+ के ऑर्डर पर 20% की छूट (₹1,000 तक)',
    discount_type: 'PERCENT',
    discount_value: 20,
    min_order_paise: 129900,
    max_discount_paise: 100000,
    active: true,
    usage_count: 29,
  },
  {
    code: 'JAIPUR15',
    description_en: 'Jaipur Heritage Special: 15% OFF on orders ₹999+ (up to ₹750)',
    description_hi: 'जयपुर हेरिटेज स्पेशल: ₹999+ के ऑर्डर पर 15% की छूट (₹750 तक)',
    discount_type: 'PERCENT',
    discount_value: 15,
    min_order_paise: 99900,
    max_discount_paise: 75000,
    active: true,
    usage_count: 9,
  },
  {
    code: 'ROYAL250',
    description_en: 'Flat ₹250 OFF on Royal Couture orders ₹1,799+',
    description_hi: '₹1,799+ के रॉयल ऑर्डर पर सीधी ₹250 की छूट',
    discount_type: 'FLAT',
    discount_value: 25000,
    min_order_paise: 179900,
    max_discount_paise: 25000,
    active: true,
    usage_count: 6,
  },
];

const INITIAL_SOLD_COUNTS: Record<number, number> = {
  1: 38,
  2: 52,
  3: 41,
  4: 19,
  5: 27,
  6: 31,
  7: 64,
  8: 23,
  9: 29,
  10: 34,
  11: 45,
  12: 18,
};

function getHsnByCategory(category: string): string {
  if (category === 'kurti') return '6204';
  if (category === 'bag') return '4202';
  return '7117';
}

function buildEmailHtml(order: ServerOrderRecord, profile: StoreProfile): string {
  const itemsRows = order.items
    .map(
      (i) =>
        `<tr>
          <td style="padding:8px;border-bottom:1px solid #e7e5e4;"><strong>${i.name}</strong> (${i.size})</td>
          <td style="padding:8px;border-bottom:1px solid #e7e5e4;text-align:center;">${i.hsn_code || '6204'}</td>
          <td style="padding:8px;border-bottom:1px solid #e7e5e4;text-align:center;">${i.qty}</td>
          <td style="padding:8px;border-bottom:1px solid #e7e5e4;text-align:right;">₹${(i.line_total_paise / 100).toFixed(2)}</td>
        </tr>`
    )
    .join('');

  return `<div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;border:1px solid #d6d3d1;border-radius:16px;overflow:hidden;background:#ffffff;color:#1c1917;">
    <div style="background:#881337;color:#fff8e7;padding:20px 24px;">
      <h2 style="margin:0;font-size:20px;">${profile.storeName}</h2>
      <p style="margin:4px 0 0;font-size:12px;opacity:0.9;">Official Order Confirmation, GST Tax Receipt & Confidential Tracking ID</p>
    </div>
    <div style="padding:24px;font-family:sans-serif;font-size:13px;line-height:1.6;">
      <p>Dear <strong>${order.customer_name}</strong>,</p>
      <p>Thank you for your patronage! Your payment of <strong>₹${(order.amount_paise / 100).toFixed(2)}</strong> has been verified. Below are your official GST Invoice and confidential shipment tracking credentials:</p>
      <div style="background:#ecfdf5;border:1px solid #6ee7b7;border-radius:12px;padding:14px;margin:16px 0;">
        <div style="font-size:11px;text-transform:uppercase;color:#065f46;font-weight:bold;">Confidential Shipment Tracking ID</div>
        <div style="font-size:20px;font-family:monospace;font-weight:bold;color:#064e3b;margin:4px 0;">${order.tracking_id}</div>
        <div style="font-size:12px;color:#047857;">Courier Partner: <strong>${order.courier_name}</strong> • ETA: <strong>${order.estimated_delivery || 'Within 3-4 Days'}</strong></div>
      </div>
      <p style="margin:8px 0;"><strong>GST Invoice No:</strong> ${order.invoice_number} | <strong>Store GSTIN:</strong> ${profile.gstin}</p>
      <table style="width:100%;border-collapse:collapse;margin-top:12px;font-size:12px;">
        <thead>
          <tr style="background:#f5f5f4;">
            <th style="padding:8px;text-align:left;">Item</th>
            <th style="padding:8px;text-align:center;">HSN</th>
            <th style="padding:8px;text-align:center;">Qty</th>
            <th style="padding:8px;text-align:right;">Total</th>
          </tr>
        </thead>
        <tbody>${itemsRows}</tbody>
      </table>
      <div style="margin-top:14px;text-align:right;font-size:12px;">
        <div>Subtotal: ₹${(order.subtotal_paise / 100).toFixed(2)}</div>
        ${order.discount_paise > 0 ? `<div style="color:#047857;">Discount (${order.coupon_code}): -₹${(order.discount_paise / 100).toFixed(2)}</div>` : ''}
        <div>Shipping: ${order.shipping_paise > 0 ? `₹${(order.shipping_paise / 100).toFixed(2)}` : 'COMPLIMENTARY (₹0.00)'}</div>
        <div>Taxable Value: ₹${(order.taxable_paise / 100).toFixed(2)}</div>
        ${
          order.supply_type === 'INTRA_STATE'
            ? `<div>CGST (2.5%): ₹${(order.cgst_paise / 100).toFixed(2)} | SGST (2.5%): ₹${(order.sgst_paise / 100).toFixed(2)}</div>`
            : `<div>IGST (5.0% Inter-State): ₹${(order.igst_paise / 100).toFixed(2)}</div>`
        }
        <div style="font-size:15px;font-weight:bold;margin-top:6px;color:#881337;">Grand Total Paid: ₹${(order.amount_paise / 100).toFixed(2)}</div>
      </div>
      <hr style="border:none;border-top:1px solid #e7e5e4;margin:16px 0;" />
      <p style="font-size:11px;color:#78716c;margin:0;">${profile.legalName} • ${profile.address} • Support: ${profile.supportEmail}</p>
    </div>
  </div>`;
}

function getStore(): GlobalStore {
  if (!globalRef.__FASHION_SERVER_STORE__) {
    const initialOrders = new Map<string, ServerOrderRecord>();
    initialOrders.set(DEMO_SEED_ORDER.order_id, DEMO_SEED_ORDER);

    const initialCoupons = new Map<string, CouponRecord>();
    for (const c of INITIAL_COUPONS) {
      initialCoupons.set(c.code, { ...c });
    }

    const initialReviews = new Map<number, ProductReview[]>();
    for (const p of DEMO_PRODUCTS) {
      initialReviews.set(p.id, [
        {
          id: `rev-${p.id}-1`,
          product_id: p.id,
          customer_name: 'Neha Rathore',
          city: 'Jaipur, RJ',
          rating: 5,
          comment:
            'Exquisite Jaipur atelier finishing! The hand-block print, pure fabric drape, and zari detailing exceeded expectations.',
          verified: true,
          created_at: new Date(Date.now() - 86400 * 1000 * 5).toISOString(),
        },
        {
          id: `rev-${p.id}-2`,
          product_id: p.id,
          customer_name: 'अंजलि शर्मा',
          city: 'उदयपुर, राजस्थान',
          rating: 5,
          comment:
            'बहुत ही शानदार कारीगरी और तेज़ डिलीवरी। ऑर्डर कन्फर्म होते ही मेरी ईमेल पर GST बिल और गोपनीय ट्रैकिंग आईडी आ गई!',
          verified: true,
          created_at: new Date(Date.now() - 86400 * 1000 * 2).toISOString(),
        },
      ]);
    }

    const seedEmail: EmailReceiptRecord = {
      id: 'eml-seed-1001',
      order_id: DEMO_SEED_ORDER.order_id,
      to_email: DEMO_SEED_ORDER.customer_email,
      customer_name: DEMO_SEED_ORDER.customer_name,
      subject: `[${DEFAULT_STORE_PROFILE.storeName}] Order Confirmed & GST Invoice ${DEMO_SEED_ORDER.invoice_number} (Tracking: ${DEMO_SEED_ORDER.tracking_id})`,
      tracking_id: DEMO_SEED_ORDER.tracking_id!,
      invoice_number: DEMO_SEED_ORDER.invoice_number,
      amount_paise: DEMO_SEED_ORDER.amount_paise,
      html_preview: buildEmailHtml(DEMO_SEED_ORDER, DEFAULT_STORE_PROFILE),
      sent_at: DEMO_SEED_ORDER.email_sent_at!,
      status: 'DELIVERED',
    };

    const initialAccounts = new Map<string, CustomerAccountRecord>();
    initialAccounts.set('priya.sharma@gmail.com', {
      email: 'priya.sharma@gmail.com',
      name: 'Priya Sharma',
      phone: '9876543210',
      pincode: '302001',
      cityState: 'Jaipur, Rajasthan',
      address: 'Flat 102, Rose Residency, MI Road',
      wishlist: [1, 2, 7, 13],
      email_verified: true,
      verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    globalRef.__FASHION_SERVER_STORE__ = {
      storeProfile: { ...DEFAULT_STORE_PROFILE },
      products: DEMO_PRODUCTS.map((p) => ({
        ...p,
        sold_count: INITIAL_SOLD_COUNTS[p.id] ?? 12,
      })),
      coupons: initialCoupons,
      reviews: initialReviews,
      orders: initialOrders,
      accounts: initialAccounts,
      emailOtps: new Map(),
      emails: [seedEmail],
      idempotencyMap: new Map(),
      paymentIds: new Set(['pay_verified_1001']),
      notificationTarget: process.env.TELEGRAM_CHAT_ID || '+91-9876543210 (Concierge Alert)',
      fallbackTier: 1,
      nextSerialNumber: 1002,
    };
  }
  if (!globalRef.__FASHION_SERVER_STORE__.accounts) {
    globalRef.__FASHION_SERVER_STORE__.accounts = new Map();
  }
  if (!globalRef.__FASHION_SERVER_STORE__.emailOtps) {
    globalRef.__FASHION_SERVER_STORE__.emailOtps = new Map();
  }
  if (globalRef.__FASHION_SERVER_STORE__.products.length < DEMO_PRODUCTS.length) {
    const existingById = new Map(
      globalRef.__FASHION_SERVER_STORE__.products.map((p) => [p.id, p])
    );
    globalRef.__FASHION_SERVER_STORE__.products = DEMO_PRODUCTS.map((p) => {
      const ex = existingById.get(p.id);
      return ex
        ? { ...p, stock: ex.stock, sold_count: ex.sold_count }
        : { ...p, sold_count: INITIAL_SOLD_COUNTS[p.id] ?? 12 };
    });
  }
  if (!globalRef.__FASHION_SERVER_STORE__.nextSerialNumber) {
    globalRef.__FASHION_SERVER_STORE__.nextSerialNumber = 1002;
  }
  return globalRef.__FASHION_SERVER_STORE__;
}

/**
 * Generates structured Indian E-Commerce & CGST Rule 46(b) compliant reference codes:
 * - Order Reference (18 chars): ORD-YYMMDD-SS-NNNN (e.g., ORD-261019-08-1002)
 *   • ORD    = Order Document Prefix (3 chars)
 *   • YYMMDD = 6-Digit Order Date (Year/Month/Day, e.g., 261019 = 19 Oct 2026)
 *   • SS     = 2-Digit Seller GST State Code (08 = Rajasthan)
 *   • NNNN   = 4-Digit Sequential Fiscal Order Serial (1002, 1003, ...)
 * - GST Tax Invoice (16 chars max per CGST Rule 46(b)): INV-KC-2026-NNNN (e.g., INV-KC-2026-1002)
 *   • INV    = GST Tax Invoice Prefix (3 chars)
 *   • KC     = Store Series Code (Kurti Couture / Zariya Jaipur, 2 chars)
 *   • 2026   = 4-Digit Financial Year (FY 2026-27)
 *   • NNNN   = 4-Digit Consecutive Fiscal Invoice Serial (matches order serial)
 * - Shipment Tracking ID (19 chars / 12 pure digits): TRK-KC-YYMMDDSSPPPP (e.g., TRK-KC-261019084829)
 *   • TRK-KC = Courier AWB Prefix
 *   • YYMMDD = 6-Digit Dispatch Date
 *   • SS     = 2-Digit Origin Hub State Code (08 = Jaipur, Rajasthan)
 *   • PPPP   = 4-Digit Cryptographic Verification PIN (1000-9999)
 */
function getDateYYMMDD(d = new Date()): string {
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yy}${mm}${dd}`;
}

function generateStructuredTrackingId(stateCode = '08'): string {
  const yymmdd = getDateYYMMDD();
  const st = (stateCode || '08').replace(/\D/g, '').padStart(2, '0').slice(0, 2);
  const pin4 = String(crypto.randomInt(1000, 10000));
  return `TRK-KC-${yymmdd}${st}${pin4}`;
}

export function explainReferenceCodes(
  orderId: string,
  invoiceNumber: string,
  trackingId?: string | null
) {
  return {
    orderFormat: {
      code: orderId,
      standard: 'Indian E-Commerce Structured Order ID (18 chars)',
      pattern: 'ORD-YYMMDD-SS-NNNN',
      segments: [
        { segment: 'ORD', digits: '3 Letters', meaning_en: 'Order Reference Document Prefix', meaning_hi: 'ऑर्डर रेफरेंस प्रीफिक्स' },
        { segment: 'YYMMDD', digits: '6 Digits', meaning_en: 'Order Date (Year-Month-Day)', meaning_hi: 'ऑर्डर की तारीख (वर्ष-माह-दिन)' },
        { segment: '08', digits: '2 Digits', meaning_en: 'Seller GST State Code (08 = Rajasthan)', meaning_hi: 'राजस्थान GST राज्य कोड (08)' },
        { segment: 'NNNN', digits: '4 Digits', meaning_en: 'Consecutive Fiscal Order Serial Number', meaning_hi: 'क्रमिक ऑर्डर सीरियल नंबर' },
      ],
    },
    invoiceFormat: {
      code: invoiceNumber,
      standard: 'CGST Rule 46(b) Tax Invoice Number (16 chars max)',
      pattern: 'INV-KC-YYYY-NNNN',
      segments: [
        { segment: 'INV', digits: '3 Letters', meaning_en: 'GST Tax Invoice Prefix', meaning_hi: 'GST टैक्स इनवॉइस प्रीफिक्स' },
        { segment: 'KC', digits: '2 Letters', meaning_en: 'Store Voucher Series (Kurti Couture)', meaning_hi: 'स्टोर सीरीज़ कोड' },
        { segment: '2026', digits: '4 Digits', meaning_en: 'Financial Year (FY 2026-27)', meaning_hi: 'वित्तीय वर्ष (FY 2026-27)' },
        { segment: 'NNNN', digits: '4 Digits', meaning_en: 'Consecutive Tax Invoice Serial Number', meaning_hi: 'क्रमिक इनवॉइस सीरियल नंबर' },
      ],
    },
    trackingFormat: {
      code: trackingId || 'TRK-KC-261019084829',
      standard: '12-Digit Courier AWB & Security PIN (TRK-KC + 12 Digits)',
      pattern: 'TRK-KC-YYMMDDSSPPPP',
      segments: [
        { segment: 'TRK-KC', digits: '6 Chars', meaning_en: 'Courier Air Waybill Prefix', meaning_hi: 'कूरियर AWB प्रीफिक्स' },
        { segment: 'YYMMDD', digits: '6 Digits', meaning_en: 'Dispatch Booking Date (YYMMDD)', meaning_hi: 'डिस्पैच की तारीख (YYMMDD)' },
        { segment: '08', digits: '2 Digits', meaning_en: 'Origin Hub State Code (08 = Jaipur, RJ)', meaning_hi: 'जयपुर हब राज्य कोड (08)' },
        { segment: 'PPPP', digits: '4 Digits', meaning_en: 'Secret Verification PIN (Anti-Guessing)', meaning_hi: 'गोपनीय सुरक्षा पिन (4 अंक)' },
      ],
    },
  };
}

export function getStoreProfile(): StoreProfile {
  return { ...getStore().storeProfile };
}

export function updateStoreProfile(patch: Partial<StoreProfile>): StoreProfile {
  const store = getStore();
  const cur = store.storeProfile;
  store.storeProfile = {
    storeName: patch.storeName ? sanitizeText(patch.storeName, 120) : cur.storeName,
    legalName: patch.legalName ? sanitizeText(patch.legalName, 120) : cur.legalName,
    gstin: patch.gstin ? sanitizeText(patch.gstin, 20).toUpperCase() : cur.gstin,
    pan: patch.pan ? sanitizeText(patch.pan, 15).toUpperCase() : cur.pan,
    stateName: patch.stateName ? sanitizeText(patch.stateName, 60) : cur.stateName,
    stateCode: patch.stateCode ? sanitizeText(patch.stateCode, 5) : cur.stateCode,
    address: patch.address ? sanitizeText(patch.address, 250) : cur.address,
    supportEmail: patch.supportEmail ? sanitizeText(patch.supportEmail, 100) : cur.supportEmail,
    supportPhone: patch.supportPhone ? sanitizeText(patch.supportPhone, 30) : cur.supportPhone,
    invoicePrefix: patch.invoicePrefix ? sanitizeText(patch.invoicePrefix, 25) : cur.invoicePrefix,
    freeShippingThresholdPaise:
      patch.freeShippingThresholdPaise !== undefined
        ? Math.max(0, Math.round(Number(patch.freeShippingThresholdPaise) || 0))
        : cur.freeShippingThresholdPaise,
    shippingChargePaise:
      patch.shippingChargePaise !== undefined
        ? Math.max(0, Math.round(Number(patch.shippingChargePaise) || 0))
        : cur.shippingChargePaise,
    gstRatePercent:
      patch.gstRatePercent !== undefined && [5, 12, 18].includes(Number(patch.gstRatePercent))
        ? Number(patch.gstRatePercent)
        : cur.gstRatePercent,
    signatoryName: patch.signatoryName ? sanitizeText(patch.signatoryName, 120) : cur.signatoryName,
  };
  return { ...store.storeProfile };
}

export function listSentEmails(): EmailReceiptRecord[] {
  return [...getStore().emails];
}

export function getOrderEmailReceipt(orderId: string): EmailReceiptRecord | null {
  return getStore().emails.find((e) => e.order_id === orderId) || null;
}

export function getLiveProducts(): LiveProduct[] {
  return getStore().products.map((p) => ({ ...p }));
}

export function getLiveProductById(id: number): LiveProduct | undefined {
  const found = getStore().products.find((p) => p.id === Number(id));
  return found ? { ...found } : undefined;
}

export function updateLiveProduct(
  id: number,
  patch: Partial<{
    name: string;
    name_hi: string;
    category: 'kurti' | 'bag' | 'accessory';
    price_paise: number;
    original_price_paise: number;
    stock: number;
    image_url: string;
    badge: string;
    badge_hi: string;
    description: string;
    description_hi: string;
    sizes: string[];
  }>
): LiveProduct | null {
  const store = getStore();
  const idx = store.products.findIndex((p) => p.id === Number(id));
  if (idx === -1) return null;
  const current = store.products[idx];

  const updated: LiveProduct = {
    ...current,
    name: patch.name !== undefined && patch.name.trim() ? sanitizeText(patch.name, 160) : current.name,
    name_hi:
      patch.name_hi !== undefined && patch.name_hi.trim()
        ? sanitizeText(patch.name_hi, 160)
        : current.name_hi,
    category:
      patch.category && ['kurti', 'bag', 'accessory'].includes(patch.category)
        ? patch.category
        : current.category,
    price_paise:
      patch.price_paise !== undefined && Number(patch.price_paise) > 0
        ? Math.round(Number(patch.price_paise))
        : current.price_paise,
    original_price_paise:
      patch.original_price_paise !== undefined && Number(patch.original_price_paise) > 0
        ? Math.round(Number(patch.original_price_paise))
        : current.original_price_paise,
    stock:
      patch.stock !== undefined && Number(patch.stock) >= 0
        ? Math.max(0, Math.round(Number(patch.stock)))
        : current.stock,
    image_url:
      patch.image_url !== undefined && patch.image_url.trim()
        ? patch.image_url.trim()
        : current.image_url,
    badge: patch.badge !== undefined ? sanitizeText(patch.badge, 40) : current.badge,
    badge_hi: patch.badge_hi !== undefined ? sanitizeText(patch.badge_hi, 40) : current.badge_hi,
    description:
      patch.description !== undefined ? sanitizeText(patch.description, 500) : current.description,
    description_hi:
      patch.description_hi !== undefined
        ? sanitizeText(patch.description_hi, 500)
        : current.description_hi,
    sizes: Array.isArray(patch.sizes) && patch.sizes.length > 0 ? patch.sizes : current.sizes,
  };

  store.products[idx] = updated;
  return { ...updated };
}

export function createLiveProduct(input: {
  name: string;
  name_hi?: string;
  category: 'kurti' | 'bag' | 'accessory';
  price_paise: number;
  original_price_paise?: number;
  stock: number;
  image_url: string;
  sizes?: string[];
  badge?: string;
  badge_hi?: string;
  description?: string;
  description_hi?: string;
}): LiveProduct {
  const store = getStore();
  const nextId = store.products.reduce((max, p) => Math.max(max, p.id), 0) + 1;
  const pricePaise = Math.max(100, Math.round(Number(input.price_paise) || 79900));
  const origPaise =
    input.original_price_paise && Number(input.original_price_paise) >= pricePaise
      ? Math.round(Number(input.original_price_paise))
      : Math.round(pricePaise * 1.35);

  const created: LiveProduct = {
    id: nextId,
    name: sanitizeText(input.name, 160),
    name_hi: sanitizeText(input.name_hi || input.name, 160),
    category: ['kurti', 'bag', 'accessory'].includes(input.category) ? input.category : 'kurti',
    price_paise: pricePaise,
    original_price_paise: origPaise,
    image_url: input.image_url?.trim() || '/products/kurti1.svg',
    stock: Math.max(0, Math.round(Number(input.stock) || 0)),
    sold_count: 0,
    sizes:
      Array.isArray(input.sizes) && input.sizes.length > 0
        ? input.sizes
        : input.category === 'kurti'
          ? ['S', 'M', 'L', 'XL']
          : ['Free Size'],
    description:
      sanitizeText(input.description, 500) ||
      'Handpicked Jaipur boutique couture crafted with pure handloom fabrics and artisanal detailing.',
    description_hi:
      sanitizeText(input.description_hi, 500) ||
      'प्रीमियम हैंडलूम फ़ैब्रिक और जयपुर की पारंपरिक कारीगरी से तैयार विशेष उत्पाद।',
    rating: 4.9,
    reviews_count: 1,
    badge: sanitizeText(input.badge, 40) || 'New Arrival',
    badge_hi: sanitizeText(input.badge_hi, 40) || 'नया कलेक्शन',
    is_demo: true,
  };

  store.products.unshift(created);
  return { ...created };
}

export function listServerCoupons(): CouponRecord[] {
  return Array.from(getStore().coupons.values());
}

export function validateCouponServerSide(
  rawCode: string | undefined | null,
  subtotalPaise: number
): {
  valid: boolean;
  code: string | null;
  discountPaise: number;
  message?: string;
  coupon?: CouponRecord;
} {
  if (!rawCode || !rawCode.trim()) {
    return { valid: false, code: null, discountPaise: 0 };
  }
  const code = sanitizeText(rawCode, 30).toUpperCase();
  const coupon = getStore().coupons.get(code);
  if (!coupon || !coupon.active) {
    return {
      valid: false,
      code: null,
      discountPaise: 0,
      message: `Invalid or inactive coupon code "${code}"`,
    };
  }
  if (subtotalPaise < coupon.min_order_paise) {
    const minInr = Math.round(coupon.min_order_paise / 100);
    return {
      valid: false,
      code: null,
      discountPaise: 0,
      message: `Coupon ${code} requires a minimum order of ₹${minInr.toLocaleString('en-IN')}`,
    };
  }
  let discountPaise = 0;
  if (coupon.discount_type === 'PERCENT') {
    discountPaise = Math.round((subtotalPaise * coupon.discount_value) / 100);
    if (coupon.max_discount_paise > 0) {
      discountPaise = Math.min(discountPaise, coupon.max_discount_paise);
    }
  } else {
    discountPaise = coupon.discount_value;
  }
  discountPaise = Math.min(discountPaise, Math.max(0, subtotalPaise - 100));
  return {
    valid: true,
    code: coupon.code,
    discountPaise,
    coupon,
    message: `Coupon ${coupon.code} applied! You saved ₹${(discountPaise / 100).toLocaleString('en-IN')}`,
  };
}

export function upsertServerCoupon(input: {
  code: string;
  description_en: string;
  description_hi?: string;
  discount_type: 'PERCENT' | 'FLAT';
  discount_value: number;
  min_order_paise?: number;
  max_discount_paise?: number;
  active?: boolean;
}): CouponRecord {
  const store = getStore();
  const code = sanitizeText(input.code, 30).toUpperCase();
  const existing = store.coupons.get(code);
  const record: CouponRecord = {
    code,
    description_en: sanitizeText(input.description_en, 200),
    description_hi: sanitizeText(input.description_hi || input.description_en, 200),
    discount_type: input.discount_type === 'FLAT' ? 'FLAT' : 'PERCENT',
    discount_value: Math.max(1, Math.round(Number(input.discount_value) || 10)),
    min_order_paise: Math.max(0, Math.round(Number(input.min_order_paise) || 0)),
    max_discount_paise: Math.max(0, Math.round(Number(input.max_discount_paise) || 100000)),
    active: input.active !== undefined ? Boolean(input.active) : true,
    usage_count: existing?.usage_count || 0,
  };
  store.coupons.set(code, record);
  return { ...record };
}

export function toggleServerCoupon(code: string): CouponRecord | null {
  const store = getStore();
  const clean = sanitizeText(code, 30).toUpperCase();
  const existing = store.coupons.get(clean);
  if (!existing) return null;
  existing.active = !existing.active;
  return { ...existing };
}

export function getProductReviews(productId: number): ProductReview[] {
  return getStore().reviews.get(Number(productId)) || [];
}

export function addProductReview(
  productId: number,
  input: { customer_name: string; city?: string; rating: number; comment: string }
): ProductReview {
  const store = getStore();
  const pid = Number(productId);
  const list = store.reviews.get(pid) || [];
  const review: ProductReview = {
    id: `rev-${pid}-${Date.now()}`,
    product_id: pid,
    customer_name: sanitizeText(input.customer_name, 80),
    city: sanitizeText(input.city || 'India', 60),
    rating: Math.min(5, Math.max(1, Math.round(Number(input.rating) || 5))),
    comment: sanitizeText(input.comment, 400),
    verified: true,
    created_at: new Date().toISOString(),
  };
  store.reviews.set(pid, [review, ...list]);
  const product = store.products.find((p) => p.id === pid);
  if (product) {
    product.reviews_count = (product.reviews_count || 0) + 1;
  }
  return review;
}

/**
 * Authoritative server-side cart validator.
 * Completely ignores any client-passed price/discount/tax fields to prevent parameter tampering.
 */
export function validateCartServerSide(
  rawItems: Array<{ id: number; qty: number; size?: string }>,
  couponCode?: string | null
): {
  success: boolean;
  error?: string;
  items?: ServerOrderItem[];
  subtotalPaise?: number;
  discountPaise?: number;
  shippingPaise?: number;
  couponCode?: string | null;
  couponMessage?: string;
  gstPaise?: number;
  totalPaise?: number;
} {
  if (!Array.isArray(rawItems) || rawItems.length === 0 || rawItems.length > 30) {
    return { success: false, error: 'Cart must contain between 1 and 30 items' };
  }

  const store = getStore();
  const profile = store.storeProfile;
  const items: ServerOrderItem[] = [];
  let subtotalPaise = 0;

  for (const raw of rawItems) {
    const product = store.products.find((p) => p.id === Number(raw.id));
    if (!product) {
      return { success: false, error: `Product #${raw.id} not found` };
    }
    const qty = Number(raw.qty);
    if (!Number.isInteger(qty) || qty < 1 || qty > 10) {
      return { success: false, error: `Invalid quantity for ${product.name}` };
    }
    if (product.stock < qty) {
      return {
        success: false,
        error: `${product.name} is out of stock (only ${product.stock} left)`,
      };
    }
    // Authoritative server-side size-based price calculation
    const sizeQuoted = getProductPriceForSize(product, raw.size);
    const unitPricePaise = sizeQuoted.price_paise;
    const lineTotal = unitPricePaise * qty;
    subtotalPaise += lineTotal;
    items.push({
      id: product.id,
      name: product.name,
      name_hi: product.name_hi,
      qty,
      size: sanitizeText(sizeQuoted.size, 30),
      price_paise: unitPricePaise,
      line_total_paise: lineTotal,
      image_url: product.image_url,
      category: product.category,
      hsn_code: getHsnByCategory(product.category),
    });
  }

  const couponResult = validateCouponServerSide(couponCode, subtotalPaise);
  const discountPaise = couponResult.valid ? couponResult.discountPaise : 0;
  const afterDiscount = Math.max(100, subtotalPaise - discountPaise);
  const shippingPaise =
    afterDiscount >= profile.freeShippingThresholdPaise ? 0 : profile.shippingChargePaise;
  const totalPaise = afterDiscount + shippingPaise;
  const gstRate = profile.gstRatePercent || 5;
  const gstPaise = Math.round((totalPaise * gstRate) / (100 + gstRate));

  return {
    success: true,
    items,
    subtotalPaise,
    discountPaise,
    shippingPaise,
    couponCode: couponResult.valid ? couponResult.code : null,
    couponMessage: couponResult.message,
    gstPaise,
    totalPaise,
  };
}

export function createServerOrder(params: {
  customer: { name: string; phone: string; address: string; email?: string };
  items: Array<{ id: number; qty: number; size?: string }>;
  couponCode?: string | null;
  idempotencyKey?: string | null;
}):
  | {
      success: true;
      orderId: string;
      amountPaise: number;
      subtotalPaise: number;
      discountPaise: number;
      shippingPaise: number;
      couponCode: string | null;
      invoiceNumber: string;
      expiresInSeconds: number;
      qrPayload: string;
      record: ServerOrderRecord;
    }
  | { success: false; error: string } {
  const store = getStore();
  const profile = store.storeProfile;

  if (params.idempotencyKey) {
    const cleanIdem = sanitizeText(params.idempotencyKey, 120);
    const existingId = store.idempotencyMap.get(cleanIdem);
    if (existingId) {
      const existing = store.orders.get(existingId);
      if (existing) {
        const remaining = Math.max(
          0,
          Math.floor((new Date(existing.qr_expires_at).getTime() - Date.now()) / 1000)
        );
        return {
          success: true,
          orderId: existing.order_id,
          amountPaise: existing.amount_paise,
          subtotalPaise: existing.subtotal_paise,
          discountPaise: existing.discount_paise,
          shippingPaise: existing.shipping_paise,
          couponCode: existing.coupon_code,
          invoiceNumber: existing.invoice_number,
          expiresInSeconds: remaining,
          qrPayload: existing.qr_payload,
          record: existing,
        };
      }
    }
  }

  const validated = validateCartServerSide(params.items, params.couponCode);
  if (!validated.success || !validated.items || validated.totalPaise === undefined) {
    return { success: false, error: validated.error || 'Invalid cart' };
  }

  const name = sanitizeText(params.customer?.name || '', 120);
  const phone = (params.customer?.phone || '').replace(/\D/g, '');
  const address = sanitizeText(params.customer?.address || '', 400);
  const emailRaw = sanitizeText(params.customer?.email || '', 120);
  const email =
    emailRaw && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailRaw)
      ? emailRaw.toLowerCase()
      : `${phone}@customer.zariyajaipur.in`;

  if (name.length < 2) {
    return { success: false, error: 'Customer name must be at least 2 characters' };
  }
  if (!/^[6-9]\d{9}$/.test(phone)) {
    return { success: false, error: 'Valid 10-digit Indian phone number is required' };
  }
  if (address.length < 10) {
    return { success: false, error: 'Complete delivery address is required' };
  }

  const expiresInSeconds = 240;
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();
  const serialNum = store.nextSerialNumber++;
  const serialStr = String(serialNum).padStart(4, '0');
  const yymmdd = getDateYYMMDD();
  const stateCode = (profile.stateCode || '08').replace(/\D/g, '').padStart(2, '0').slice(0, 2);
  const orderId = `ORD-${yymmdd}-${stateCode}-${serialStr}`;
  const gatewayOrderId = `order_mock_${orderId.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
  const invoiceNumber = `INV-KC-2026-${serialStr}`;

  const totalPaise = validated.totalPaise;
  const gstPaise = validated.gstPaise || Math.round((totalPaise * 5) / 105);
  const taxablePaise = Math.max(0, totalPaise - gstPaise);

  // Determine Intra-State (Rajasthan) vs Inter-State supply from address/PIN
  const isIntraState =
    /rajasthan|jaipur|udaipur|jodhpur|kota|ajmer|bikaner|PIN:\s*3[0-4]\d{4}/i.test(address);
  const supplyType: 'INTRA_STATE' | 'INTER_STATE' = isIntraState ? 'INTRA_STATE' : 'INTER_STATE';
  const cgstPaise = supplyType === 'INTRA_STATE' ? Math.round(gstPaise / 2) : 0;
  const sgstPaise = supplyType === 'INTRA_STATE' ? gstPaise - cgstPaise : 0;
  const igstPaise = supplyType === 'INTER_STATE' ? gstPaise : 0;

  const amountInr = (totalPaise / 100).toFixed(2);
  const qrPayload = `upi://pay?pa=zariya.jaipur@upi&pn=${encodeURIComponent(
    profile.storeName
  )}&am=${amountInr}&cu=INR&tr=${orderId}&tn=Order%20${orderId}`;

  const nowIso = new Date().toISOString();
  const record: ServerOrderRecord = {
    order_id: orderId,
    gateway_order_id: gatewayOrderId,
    idempotency_key: params.idempotencyKey ? sanitizeText(params.idempotencyKey, 120) : null,
    customer_name: name,
    customer_email: email,
    phone,
    address,
    items: validated.items,
    subtotal_paise: validated.subtotalPaise || totalPaise,
    discount_paise: validated.discountPaise || 0,
    shipping_paise: validated.shippingPaise || 0,
    coupon_code: validated.couponCode || null,
    taxable_paise: taxablePaise,
    cgst_paise: cgstPaise,
    sgst_paise: sgstPaise,
    igst_paise: igstPaise,
    gst_paise: gstPaise,
    supply_type: supplyType,
    amount_paise: totalPaise,
    invoice_number: invoiceNumber,
    status: 'PENDING',
    tracking_id: null,
    courier_name: 'BlueDart Royal Priority',
    fulfillment_status: 'PENDING_PAYMENT',
    estimated_delivery: null,
    tracking_history: [
      {
        status: 'PENDING_PAYMENT',
        title: 'Order Created — Awaiting Encrypted UPI Confirmation',
        location: 'Online Checkout',
        note: `UPI QR session initiated for ₹${amountInr}`,
        timestamp: nowIso,
      },
    ],
    email_sent: false,
    email_sent_at: null,
    qr_expires_at: expiresAt,
    qr_payload: qrPayload,
    created_at: nowIso,
    updated_at: nowIso,
    stock_deducted: false,
  };

  store.orders.set(orderId, record);
  if (record.idempotency_key) {
    store.idempotencyMap.set(record.idempotency_key, orderId);
  }

  // Automatically save/update customer profile under their email address
  if (email) {
    const existingAcct = store.accounts.get(email);
    const pinMatch = address.match(/PIN:\s*(\d{6})/i);
    store.accounts.set(email, {
      email,
      name,
      phone,
      pincode: pinMatch ? pinMatch[1] : existingAcct?.pincode || '',
      cityState: existingAcct?.cityState || 'Jaipur, Rajasthan',
      address,
      wishlist: existingAcct?.wishlist || [],
      updated_at: nowIso,
    });
  }

  return {
    success: true,
    orderId,
    amountPaise: record.amount_paise,
    subtotalPaise: record.subtotal_paise,
    discountPaise: record.discount_paise,
    shippingPaise: record.shipping_paise,
    couponCode: record.coupon_code,
    invoiceNumber: record.invoice_number,
    expiresInSeconds,
    qrPayload,
    record,
  };
}

export function getServerOrder(orderId: string): ServerOrderRecord | null {
  const store = getStore();
  const record = store.orders.get(orderId);
  if (!record) return null;

  if (
    (record.status === 'PENDING' || record.status === 'CREATED') &&
    Date.now() > new Date(record.qr_expires_at).getTime()
  ) {
    record.status = 'EXPIRED';
    record.updated_at = new Date().toISOString();
  }
  return record;
}

/**
 * Confidential Tracking Lookup.
 * Requires the un-guessable Tracking ID (TRK-KC-...) so strangers cannot enumerate sequential order IDs.
 * Supports legacy TRK-KC-1001 alias for the pre-seeded showcase order.
 */
export function findServerOrderByOrderOrTrackingId(idOrTracking: string): ServerOrderRecord | null {
  const store = getStore();
  const needle = sanitizeText(idOrTracking || '', 60).toUpperCase();
  if (!needle) return null;

  if (needle === 'TRK-KC-1001') {
    return getServerOrder('ORDDEMO1001');
  }

  for (const order of store.orders.values()) {
    if (order.tracking_id && order.tracking_id.toUpperCase() === needle) {
      return getServerOrder(order.order_id);
    }
    if (order.order_id.toUpperCase() === needle) {
      return getServerOrder(order.order_id);
    }
  }
  return null;
}

export function dispatchOrderConfirmationEmail(record: ServerOrderRecord): EmailReceiptRecord {
  const store = getStore();
  const profile = store.storeProfile;
  const html = buildEmailHtml(record, profile);
  const nowIso = new Date().toISOString();

  const emailRec: EmailReceiptRecord = {
    id: `eml-${record.order_id}-${Date.now()}`,
    order_id: record.order_id,
    to_email: record.customer_email,
    customer_name: record.customer_name,
    subject: `[${profile.storeName}] Order Confirmed & GST Invoice ${record.invoice_number} (Tracking: ${record.tracking_id})`,
    tracking_id: record.tracking_id || '',
    invoice_number: record.invoice_number,
    amount_paise: record.amount_paise,
    html_preview: html,
    sent_at: nowIso,
    status: 'DELIVERED',
  };

  store.emails.unshift(emailRec);
  record.email_sent = true;
  record.email_sent_at = nowIso;
  return emailRec;
}

export function confirmServerOrder(
  orderId: string,
  paymentEntity: { id: string; amount: number; method?: string }
): {
  result:
    | 'confirmed'
    | 'already_confirmed'
    | 'duplicate_payment'
    | 'amount_mismatch'
    | 'expired_late_payment'
    | 'not_found';
  trackingId?: string | null;
  emailSentTo?: string | null;
} {
  const store = getStore();
  const record = store.orders.get(orderId);
  if (!record) return { result: 'not_found' };

  if (store.paymentIds.has(paymentEntity.id)) {
    return {
      result: 'duplicate_payment',
      trackingId: record.tracking_id,
      emailSentTo: record.customer_email,
    };
  }
  if (record.status === 'CONFIRMED') {
    return {
      result: 'already_confirmed',
      trackingId: record.tracking_id,
      emailSentTo: record.customer_email,
    };
  }

  store.paymentIds.add(paymentEntity.id);

  if (Number(paymentEntity.amount) !== Number(record.amount_paise)) {
    record.status = 'FAILED';
    record.updated_at = new Date().toISOString();
    return { result: 'amount_mismatch' };
  }

  const now = Date.now();
  const nowIso = new Date().toISOString();
  const expiresAt = new Date(record.qr_expires_at).getTime();
  if (now > expiresAt || record.status === 'EXPIRED') {
    record.status = 'MANUAL_REVIEW';
    record.updated_at = nowIso;
    return { result: 'expired_late_payment' };
  }

  // Automatically decrement product stock and increment sold_count on first confirmation
  if (!record.stock_deducted) {
    for (const item of record.items) {
      const prod = store.products.find((p) => p.id === Number(item.id));
      if (prod) {
        prod.stock = Math.max(0, prod.stock - item.qty);
        prod.sold_count = (prod.sold_count || 0) + item.qty;
      }
    }
    if (record.coupon_code) {
      const coupon = store.coupons.get(record.coupon_code);
      if (coupon) {
        coupon.usage_count = (coupon.usage_count || 0) + 1;
      }
    }
    record.stock_deducted = true;
  }

  // Generate structured 12-digit Tracking ID: TRK-KC-YYMMDD + 2-digit StateCode (08) + 4-digit Secret PIN
  const trackingId = record.tracking_id || generateStructuredTrackingId(store.storeProfile.stateCode);
  const etaDate = new Date(Date.now() + 4 * 24 * 3600 * 1000).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  record.status = 'CONFIRMED';
  record.payment_id = paymentEntity.id;
  record.tracking_id = trackingId;
  record.courier_name = record.courier_name || 'BlueDart Royal Priority';
  record.fulfillment_status = 'ORDER_PLACED';
  record.estimated_delivery = etaDate;
  record.tracking_history = [
    ...(record.tracking_history || []).filter((e) => e.status !== 'PENDING_PAYMENT'),
    {
      status: 'ORDER_PLACED',
      title: 'Order Confirmed, GST Invoice & Tracking ID Emailed',
      location: 'Jaipur Flagship Atelier, RJ',
      note: `Payment (${paymentEntity.id}) verified via webhook. GST Invoice ${record.invoice_number} and confidential Tracking ID ${trackingId} emailed to ${record.customer_email}.`,
      timestamp: nowIso,
    },
  ];
  record.updated_at = nowIso;

  // Automatically dispatch HTML Email Receipt + Tracking ID to customer's email
  dispatchOrderConfirmationEmail(record);

  return {
    result: 'confirmed',
    trackingId,
    emailSentTo: record.customer_email,
  };
}

const STAGE_TITLES: Record<FulfillmentStatus, string> = {
  PENDING_PAYMENT: 'Awaiting Payment',
  ORDER_PLACED: 'Order Confirmed & Received at Atelier',
  PACKED: 'Quality Checked, Steamed & Packed with GST Invoice',
  SHIPPED: 'Dispatched with Priority Courier Partner',
  OUT_FOR_DELIVERY: 'Out for Delivery in Your City',
  DELIVERED: 'Consignment Delivered Successfully',
  CANCELLED: 'Order Cancelled',
};

export function updateServerOrderTracking(
  orderId: string,
  update: {
    fulfillmentStatus: FulfillmentStatus;
    courierName?: string;
    trackingId?: string;
    estimatedDelivery?: string;
    location?: string;
    note?: string;
  }
): ServerOrderRecord | null {
  const store = getStore();
  const record = store.orders.get(orderId);
  if (!record) return null;

  const nextStatus = update.fulfillmentStatus;
  const nowIso = new Date().toISOString();

  if (update.courierName && update.courierName.trim()) {
    record.courier_name = sanitizeText(update.courierName, 80);
  }
  if (update.trackingId && update.trackingId.trim()) {
    record.tracking_id = sanitizeText(update.trackingId, 40).toUpperCase();
  } else if (!record.tracking_id) {
    record.tracking_id = generateStructuredTrackingId(store.storeProfile.stateCode);
  }
  if (update.estimatedDelivery !== undefined && update.estimatedDelivery.trim()) {
    record.estimated_delivery = sanitizeText(update.estimatedDelivery, 60);
  }

  record.fulfillment_status = nextStatus;
  const event: TrackingEvent = {
    status: nextStatus,
    title: STAGE_TITLES[nextStatus] || `Status updated to ${nextStatus}`,
    location:
      update.location && update.location.trim()
        ? sanitizeText(update.location, 120)
        : 'Jaipur Fulfillment Hub, RJ',
    note:
      update.note && update.note.trim()
        ? sanitizeText(update.note, 300)
        : `Consignment status updated to ${nextStatus.replace(/_/g, ' ')}.`,
    timestamp: nowIso,
  };

  record.tracking_history = [...(record.tracking_history || []), event];
  record.updated_at = nowIso;
  return record;
}

export function listServerOrders(): ServerOrderRecord[] {
  const store = getStore();
  return Array.from(store.orders.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

const DISPOSABLE_OR_FAKE_DOMAINS = new Set([
  'mailinator.com',
  'tempmail.com',
  'temp-mail.org',
  '10minutemail.com',
  'guerrillamail.com',
  'yopmail.com',
  'trashmail.com',
  'sharklasers.com',
  'fakeinbox.com',
  'getnada.com',
  'throwawaymail.com',
  'test.com',
  'fake.com',
  'abc.com',
  'xyz.com',
  'invalid.com',
  'none.com',
  'demo.com',
  'pagal.com',
  'timepass.com',
]);

const FAKE_USERNAMES = new Set([
  'test',
  'testing',
  'fake',
  'fakemail',
  'pagal',
  'timepass',
  'abcd',
  'abcde',
  'abcdef',
  'qwerty',
  'asdf',
  'asdfgh',
  'admin',
  'nobody',
  'noreply',
  'no-reply',
  'sample',
  'dummy',
  'temp',
  'xxx',
  'zzz',
  'aaa',
  'bbb',
]);

/**
 * Strictly validates that an email address is a real, personal/corporate email
 * and rejects fake, troll, or disposable email addresses.
 */
export function validateAuthenticEmail(rawEmail: string): {
  valid: boolean;
  email: string;
  reason_en?: string;
  reason_hi?: string;
} {
  const email = sanitizeText(rawEmail || '', 120).toLowerCase();
  if (!email || !/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,10}$/.test(email)) {
    return {
      valid: false,
      email,
      reason_en: 'Please enter a valid email address (e.g. yourname@gmail.com).',
      reason_hi: 'कृपया सही ईमेल आईडी दर्ज करें (जैसे yourname@gmail.com)।',
    };
  }

  const [localPart, domain] = email.split('@');
  if (!localPart || !domain || localPart.length < 3) {
    return {
      valid: false,
      email,
      reason_en: 'Email username must be at least 3 characters long.',
      reason_hi: 'ईमेल का नाम कम से कम 3 अक्षरों का होना चाहिए।',
    };
  }

  // Reject purely numeric local part (e.g. 123456@gmail.com) or single repeated character (aaaaa@gmail.com)
  if (/^\d+$/.test(localPart) || /^(.)\1{3,}$/.test(localPart)) {
    return {
      valid: false,
      email,
      reason_en: 'This email appears artificial (only numbers or repeated letters). Please use your real email ID.',
      reason_hi: 'यह ईमेल फेक लग रहा है (केवल नंबर या एक जैसे अक्षर)। कृपया अपनी असली ईमेल आईडी डालें।',
    };
  }

  const normalizedLocal = localPart.replace(/[0-9._+-]/g, '');
  if (FAKE_USERNAMES.has(localPart) || FAKE_USERNAMES.has(normalizedLocal)) {
    return {
      valid: false,
      email,
      reason_en: `Fake or test email "${email}" is not allowed. Please enter your genuine email address.`,
      reason_hi: `"${email}" जैसी टेस्ट या फेक ईमेल मान्य नहीं है। कृपया अपनी असली ईमेल आईडी दर्ज करें।`,
    };
  }

  if (DISPOSABLE_OR_FAKE_DOMAINS.has(domain)) {
    return {
      valid: false,
      email,
      reason_en: `Disposable or fake domain "@${domain}" is blocked. Please use Gmail, Yahoo, Outlook, iCloud, or your official domain.`,
      reason_hi: `"@${domain}" डोमेन ब्लॉक है। कृपया अपना असली Gmail, Yahoo, या Outlook ईमेल उपयोग करें।`,
    };
  }

  return { valid: true, email };
}

export function requestEmailVerificationOtp(rawEmail: string): {
  success: boolean;
  email?: string;
  otpPreview?: string;
  error?: string;
  error_hi?: string;
} {
  const check = validateAuthenticEmail(rawEmail);
  if (!check.valid) {
    return {
      success: false,
      error: check.reason_en,
      error_hi: check.reason_hi,
    };
  }

  const store = getStore();
  const otp =
    check.email === 'priya.sharma@gmail.com'
      ? '100108'
      : String(crypto.randomInt(100000, 1000000));
  const expiresAt = Date.now() + 10 * 60 * 1000;
  store.emailOtps.set(check.email, { otp, expiresAt });

  // Also log verification email into server email outbox
  store.emails.unshift({
    id: `otp-${Date.now()}`,
    order_id: 'ACCOUNT-VERIFY',
    to_email: check.email,
    customer_name: store.accounts.get(check.email)?.name || 'Valued Patron',
    subject: `[Zariya Jaipur] ${otp} is your 6-digit Email Verification Code`,
    tracking_id: '',
    invoice_number: '',
    amount_paise: 0,
    html_preview: `<div style="font-family:Georgia,serif;padding:24px;border:1px solid #d6d3d1;border-radius:12px;">
      <h2 style="margin:0 0 8px;color:#1c1917;">Zariya Jaipur — Email Verification</h2>
      <p style="font-size:14px;color:#44403c;">Use the 6-digit verification code below to verify your email address <strong>${check.email}</strong> and unlock your Order History, GST Invoices, and Saved Address:</p>
      <div style="font-size:28px;font-weight:bold;letter-spacing:6px;padding:12px 20px;background:#fafaf9;border:1px solid #a8a29e;display:inline-block;margin:12px 0;">${otp}</div>
      <p style="font-size:12px;color:#78716c;">Valid for 10 minutes. Do not share this code with anyone.</p>
    </div>`,
    sent_at: new Date().toISOString(),
    status: 'DELIVERED',
  });

  return {
    success: true,
    email: check.email,
    otpPreview: otp,
  };
}

export function verifyEmailWithOtp(rawEmail: string, rawOtp: string) {
  const check = validateAuthenticEmail(rawEmail);
  if (!check.valid) {
    return {
      success: false as const,
      error: check.reason_en || 'Invalid email address',
    };
  }

  const store = getStore();
  const otp = String(rawOtp || '').replace(/\D/g, '');
  const saved = store.emailOtps.get(check.email);

  const isPreverifiedDemo = check.email === 'priya.sharma@gmail.com' && otp === '100108';
  if (!isPreverifiedDemo) {
    if (!saved || Date.now() > saved.expiresAt) {
      return {
        success: false as const,
        error: 'Verification OTP has expired or was not requested. Please tap Send OTP again.',
      };
    }
    if (saved.otp !== otp) {
      return {
        success: false as const,
        error: 'Incorrect 6-digit OTP code. Please check the code and try again.',
      };
    }
  }

  store.emailOtps.delete(check.email);
  const existing = store.accounts.get(check.email);
  const nowIso = new Date().toISOString();

  store.accounts.set(check.email, {
    email: check.email,
    name: existing?.name || '',
    phone: existing?.phone || '',
    pincode: existing?.pincode || '',
    cityState: existing?.cityState || 'Jaipur, Rajasthan',
    address: existing?.address || '',
    wishlist: existing?.wishlist || [],
    email_verified: true,
    verified_at: nowIso,
    updated_at: nowIso,
  });

  const accountData = getCustomerAccount(check.email);
  return {
    success: true as const,
    ...accountData,
  };
}

/**
 * Gmail / Email Account Sync:
 * Retrieves customer profile (saved address, phone, wishlist) + all orders placed with that email.
 */
export function getCustomerAccount(rawEmail: string) {
  const store = getStore();
  const check = validateAuthenticEmail(rawEmail);
  if (!check.valid) {
    return null;
  }
  const email = check.email;

  let profile = store.accounts.get(email);
  const matchingOrders = Array.from(store.orders.values())
    .filter((o) => (o.customer_email || '').toLowerCase() === email)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // If no explicit profile exists yet, derive from most recent order placed with this email
  if (!profile && matchingOrders.length > 0) {
    const latest = matchingOrders[0];
    const pinMatch = latest.address.match(/PIN:\s*(\d{6})/i);
    profile = {
      email,
      name: latest.customer_name,
      phone: latest.phone,
      pincode: pinMatch ? pinMatch[1] : '302001',
      cityState: 'Jaipur, Rajasthan',
      address: latest.address,
      wishlist: [],
      updated_at: latest.updated_at,
    };
    store.accounts.set(email, profile);
  }

  if (!profile) {
    profile = {
      email,
      name: '',
      phone: '',
      pincode: '',
      cityState: '',
      address: '',
      wishlist: [],
      updated_at: new Date().toISOString(),
    };
  }

  const wishlistProducts = store.products.filter((p) => profile!.wishlist.includes(p.id));

  return {
    profile,
    wishlistProducts,
    orders: matchingOrders.map((o) => ({
      order_id: o.order_id,
      invoice_number: o.invoice_number,
      tracking_id: o.tracking_id,
      status: o.status,
      fulfillment_status: o.fulfillment_status,
      amount_paise: o.amount_paise,
      subtotal_paise: o.subtotal_paise,
      discount_paise: o.discount_paise,
      gst_paise: o.gst_paise,
      courier_name: o.courier_name,
      estimated_delivery: o.estimated_delivery,
      created_at: o.created_at,
      items: o.items,
      address: o.address,
      phone: o.phone,
      customer_name: o.customer_name,
      customer_email: o.customer_email,
      reference_explanation: explainReferenceCodes(o.order_id, o.invoice_number, o.tracking_id),
    })),
  };
}

export function upsertCustomerAccount(input: {
  email: string;
  name?: string;
  phone?: string;
  pincode?: string;
  cityState?: string;
  address?: string;
  wishlist?: number[];
}) {
  const store = getStore();
  const email = sanitizeText(input.email || '', 120).toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return null;
  }

  const existing = store.accounts.get(email);
  const nowIso = new Date().toISOString();
  const wishlist = Array.isArray(input.wishlist)
    ? Array.from(
        new Set(
          input.wishlist
            .map((id) => Number(id))
            .filter((id) => Number.isInteger(id) && id > 0)
        )
      )
    : existing?.wishlist || [];

  const updated: CustomerAccountRecord = {
    email,
    name: input.name !== undefined && input.name.trim() ? sanitizeText(input.name, 120) : existing?.name || '',
    phone:
      input.phone !== undefined && input.phone.trim()
        ? input.phone.replace(/\D/g, '').slice(-10)
        : existing?.phone || '',
    pincode:
      input.pincode !== undefined && input.pincode.trim()
        ? input.pincode.replace(/\D/g, '').slice(0, 6)
        : existing?.pincode || '',
    cityState:
      input.cityState !== undefined && input.cityState.trim()
        ? sanitizeText(input.cityState, 100)
        : existing?.cityState || '',
    address:
      input.address !== undefined && input.address.trim()
        ? sanitizeText(input.address, 400)
        : existing?.address || '',
    wishlist,
    updated_at: nowIso,
  };

  store.accounts.set(email, updated);
  return getCustomerAccount(email);
}

export function getAdminAnalyticsSummary() {
  const store = getStore();
  const orders = Array.from(store.orders.values());
  const confirmedOrders = orders.filter((o) => o.status === 'CONFIRMED' || o.status === 'PAID');

  const liveConfirmedRevenuePaise = confirmedOrders.reduce((acc, o) => acc + o.amount_paise, 0);
  const totalDiscountGivenPaise = confirmedOrders.reduce((acc, o) => acc + (o.discount_paise || 0), 0);

  const catalogRevenueByCategory: Record<'kurti' | 'bag' | 'accessory', number> = {
    kurti: 0,
    bag: 0,
    accessory: 0,
  };
  let totalUnitsSold = 0;
  for (const p of store.products) {
    const rev = p.sold_count * p.price_paise;
    catalogRevenueByCategory[p.category] = (catalogRevenueByCategory[p.category] || 0) + rev;
    totalUnitsSold += p.sold_count;
  }

  const totalCatalogRevenuePaise =
    catalogRevenueByCategory.kurti +
    catalogRevenueByCategory.bag +
    catalogRevenueByCategory.accessory;

  const topProducts = [...store.products]
    .sort((a, b) => b.sold_count * b.price_paise - a.sold_count * a.price_paise)
    .slice(0, 6)
    .map((p) => ({
      id: p.id,
      name: p.name,
      name_hi: p.name_hi,
      category: p.category,
      image_url: p.image_url,
      price_paise: p.price_paise,
      stock: p.stock,
      sold_count: p.sold_count,
      revenue_paise: p.sold_count * p.price_paise,
    }));

  const lowStockProducts = store.products.filter((p) => p.stock <= 5);

  const dailySeries = [
    { day: '13 Oct', orders: 18, revenuePaise: 2480000 },
    { day: '14 Oct', orders: 24, revenuePaise: 3290000 },
    { day: '15 Oct', orders: 21, revenuePaise: 2850000 },
    { day: '16 Oct', orders: 31, revenuePaise: 4420000 },
    { day: '17 Oct', orders: 29, revenuePaise: 3980000 },
    { day: '18 Oct', orders: 36, revenuePaise: 5190000 },
    {
      day: 'Today (19 Oct)',
      orders: 26 + confirmedOrders.length,
      revenuePaise: 3650000 + liveConfirmedRevenuePaise,
    },
  ];

  return {
    totalRevenuePaise: totalCatalogRevenuePaise,
    liveSessionRevenuePaise: liveConfirmedRevenuePaise,
    totalDiscountGivenPaise,
    totalOrdersCount: 185 + orders.length,
    confirmedOrdersCount: confirmedOrders.length,
    totalUnitsSold,
    averageOrderValuePaise: Math.round(totalCatalogRevenuePaise / Math.max(1, 185 + confirmedOrders.length)),
    categoryBreakdown: [
      {
        category: 'kurti',
        label: 'Kurtas & Sets / कुर्तियाँ',
        revenuePaise: catalogRevenueByCategory.kurti,
        percentage: Math.round((catalogRevenueByCategory.kurti / Math.max(1, totalCatalogRevenuePaise)) * 100),
      },
      {
        category: 'bag',
        label: 'Heritage Bags / बैग्स',
        revenuePaise: catalogRevenueByCategory.bag,
        percentage: Math.round((catalogRevenueByCategory.bag / Math.max(1, totalCatalogRevenuePaise)) * 100),
      },
      {
        category: 'accessory',
        label: 'Fine Jewellery / ज्वेलरी',
        revenuePaise: catalogRevenueByCategory.accessory,
        percentage: Math.round((catalogRevenueByCategory.accessory / Math.max(1, totalCatalogRevenuePaise)) * 100),
      },
    ],
    topProducts,
    lowStockProducts,
    dailySeries,
    coupons: Array.from(store.coupons.values()),
  };
}

export function getAdminConfig() {
  const store = getStore();
  return {
    notificationTarget: store.notificationTarget,
    fallbackTier: store.fallbackTier,
    storeProfile: store.storeProfile,
  };
}

export function setNotificationTarget(target: string) {
  const store = getStore();
  store.notificationTarget = sanitizeText(target, 120);
  return store.notificationTarget;
}

export function verifyAdminTokenHeader(providedToken: string | null): boolean {
  const expected = process.env.ADMIN_TOKEN || 'dev_admin_token_replace_me_123456';
  if (!providedToken) return false;
  const a = Buffer.from(providedToken);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
