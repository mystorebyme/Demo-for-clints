import crypto from 'crypto';
import { DEMO_PRODUCTS, Product } from './catalog';

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

export type CouponRecord = {
  code: string;
  description_en: string;
  description_hi: string;
  discount_type: 'PERCENT' | 'FLAT';
  discount_value: number; // percent (e.g. 20) OR flat paise (e.g. 25000)
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
  phone: string;
  address: string;
  items: ServerOrderItem[];
  subtotal_paise: number;
  discount_paise: number;
  coupon_code: string | null;
  gst_paise: number;
  amount_paise: number;
  invoice_number: string;
  status: OrderStatus;
  tracking_id: string | null;
  courier_name: string;
  fulfillment_status: FulfillmentStatus;
  estimated_delivery: string | null;
  tracking_history: TrackingEvent[];
  qr_expires_at: string;
  qr_payload: string;
  created_at: string;
  updated_at: string;
  payment_id?: string;
  stock_deducted?: boolean;
};

type GlobalStore = {
  products: LiveProduct[];
  coupons: Map<string, CouponRecord>;
  reviews: Map<number, ProductReview[]>;
  orders: Map<string, ServerOrderRecord>;
  idempotencyMap: Map<string, string>;
  paymentIds: Set<string>;
  notificationTarget: string;
  fallbackTier: 1 | 2 | 3 | 4;
};

const globalRef = globalThis as unknown as { __FASHION_SERVER_STORE__?: GlobalStore };

const DEMO_SEED_ORDER: ServerOrderRecord = {
  order_id: 'ORDDEMO1001',
  gateway_order_id: 'order_demo_1001',
  idempotency_key: 'demo-seed-1001',
  customer_name: 'Priya Sharma',
  phone: '9876543210',
  address: 'Flat 102, Rose Residency, MI Road, Jaipur, Rajasthan, PIN: 302001',
  items: [
    {
      id: 2,
      name: 'Festive Anarkali Kurti',
      name_hi: 'फेस्टिव अनारकली कुर्ती',
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
      name: 'Oxidized Jhumka Earrings',
      name_hi: 'ऑक्सीडाइज़्ड झुमका इयररिंग्स',
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
  coupon_code: 'DIWALI20',
  gst_paise: 6088,
  amount_paise: 127840,
  invoice_number: 'INV-KC-2026-1001',
  status: 'CONFIRMED',
  tracking_id: 'TRK-KC-1001',
  courier_name: 'Delhivery Express',
  fulfillment_status: 'SHIPPED',
  estimated_delivery: '22 Oct 2026',
  tracking_history: [
    {
      status: 'ORDER_PLACED',
      title: 'Order Confirmed & Payment Verified',
      location: 'Jaipur Warehouse, RJ',
      note: 'Server webhook verified payment of ₹1,278.40 (Coupon DIWALI20 applied). Tracking ID TRK-KC-1001 assigned.',
      timestamp: new Date(Date.now() - 3600 * 1000 * 18).toISOString(),
    },
    {
      status: 'PACKED',
      title: 'Quality Checked & Packed',
      location: 'Sitapura Fulfillment Hub, Jaipur',
      note: 'Items inspected, eco-packed with GST invoice INV-KC-2026-1001, and handed over to courier.',
      timestamp: new Date(Date.now() - 3600 * 1000 * 10).toISOString(),
    },
    {
      status: 'SHIPPED',
      title: 'Dispatched via Delhivery Express',
      location: 'Jaipur Regional Sorting Facility',
      note: 'In transit to destination hub. Expected delivery within 48 hours.',
      timestamp: new Date(Date.now() - 3600 * 1000 * 3).toISOString(),
    },
  ],
  qr_expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
  qr_payload: 'upi://pay?pa=merchant@upi&pn=Kranti%20Classes%20Store&am=1278.40&cu=INR&tr=ORDDEMO1001',
  created_at: new Date(Date.now() - 3600 * 1000 * 18).toISOString(),
  updated_at: new Date(Date.now() - 3600 * 1000 * 3).toISOString(),
  payment_id: 'pay_demo_seed_1001',
  stock_deducted: true,
};

const INITIAL_COUPONS: CouponRecord[] = [
  {
    code: 'FIRST10',
    description_en: '10% OFF on your first order (up to ₹500)',
    description_hi: 'आपके पहले ऑर्डर पर 10% की छूट (₹500 तक)',
    discount_type: 'PERCENT',
    discount_value: 10,
    min_order_paise: 0,
    max_discount_paise: 50000,
    active: true,
    usage_count: 14,
  },
  {
    code: 'DIWALI20',
    description_en: 'Festive Special: 20% OFF on orders ₹1,299+ (up to ₹1,000)',
    description_hi: 'त्योहार विशेष: ₹1,299+ के ऑर्डर पर 20% की छूट (₹1,000 तक)',
    discount_type: 'PERCENT',
    discount_value: 20,
    min_order_paise: 129900,
    max_discount_paise: 100000,
    active: true,
    usage_count: 29,
  },
  {
    code: 'JAIPUR15',
    description_en: 'Jaipur Boutique: 15% OFF on orders ₹999+ (up to ₹750)',
    description_hi: 'जयपुर बुटीक: ₹999+ के ऑर्डर पर 15% की छूट (₹750 तक)',
    discount_type: 'PERCENT',
    discount_value: 15,
    min_order_paise: 99900,
    max_discount_paise: 75000,
    active: true,
    usage_count: 9,
  },
  {
    code: 'ROYAL250',
    description_en: 'Flat ₹250 OFF on Royal Ethnic orders ₹1,799+',
    description_hi: '₹1,799+ के रॉयल एथनिक ऑर्डर पर सीधी ₹250 की छूट',
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
            'Authentic Jaipur boutique quality! Fabric, stitching, and festive finishing look even better in person.',
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
            'बहुत ही सुंदर डिज़ाइन और तेज़ डिलीवरी। UPI QR पेमेंट के तुरंत बाद मुझे ट्रैकिंग आईडी और GST बिल मिल गया!',
          verified: true,
          created_at: new Date(Date.now() - 86400 * 1000 * 2).toISOString(),
        },
      ]);
    }

    globalRef.__FASHION_SERVER_STORE__ = {
      products: DEMO_PRODUCTS.map((p) => ({
        ...p,
        sold_count: INITIAL_SOLD_COUNTS[p.id] ?? 12,
      })),
      coupons: initialCoupons,
      reviews: initialReviews,
      orders: initialOrders,
      idempotencyMap: new Map(),
      paymentIds: new Set(['pay_demo_seed_1001']),
      notificationTarget: process.env.TELEGRAM_CHAT_ID || '9876543210 (Telegram / WhatsApp Demo)',
      fallbackTier: 1,
    };
  }
  return globalRef.__FASHION_SERVER_STORE__;
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
    name: patch.name !== undefined && patch.name.trim() ? patch.name.trim() : current.name,
    name_hi: patch.name_hi !== undefined && patch.name_hi.trim() ? patch.name_hi.trim() : current.name_hi,
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
    badge: patch.badge !== undefined ? patch.badge : current.badge,
    badge_hi: patch.badge_hi !== undefined ? patch.badge_hi : current.badge_hi,
    description: patch.description !== undefined ? patch.description : current.description,
    description_hi: patch.description_hi !== undefined ? patch.description_hi : current.description_hi,
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
    name: input.name.trim(),
    name_hi: (input.name_hi || input.name).trim(),
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
      input.description?.trim() ||
      'Handpicked Jaipur ethnic boutique collection item crafted with premium materials.',
    description_hi:
      input.description_hi?.trim() ||
      'प्रीमियम कपड़े और जयपुर की पारंपरिक कारीगरी से तैयार विशेष उत्पाद।',
    rating: 4.9,
    reviews_count: 1,
    badge: input.badge || 'New Launch',
    badge_hi: input.badge_hi || 'नया कलेक्शन',
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
  const code = rawCode.trim().toUpperCase();
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
  const code = input.code.trim().toUpperCase();
  const existing = store.coupons.get(code);
  const record: CouponRecord = {
    code,
    description_en: input.description_en.trim(),
    description_hi: (input.description_hi || input.description_en).trim(),
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
  const clean = code.trim().toUpperCase();
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
    customer_name: input.customer_name.trim(),
    city: (input.city || 'India').trim(),
    rating: Math.min(5, Math.max(1, Math.round(Number(input.rating) || 5))),
    comment: input.comment.trim(),
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

export function validateCartServerSide(
  rawItems: Array<{ id: number; qty: number; size?: string }>,
  couponCode?: string | null
): {
  success: boolean;
  error?: string;
  items?: ServerOrderItem[];
  subtotalPaise?: number;
  discountPaise?: number;
  couponCode?: string | null;
  couponMessage?: string;
  gstPaise?: number;
  totalPaise?: number;
} {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return { success: false, error: 'Cart cannot be empty' };
  }

  const store = getStore();
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
    const lineTotal = product.price_paise * qty;
    subtotalPaise += lineTotal;
    items.push({
      id: product.id,
      name: product.name,
      name_hi: product.name_hi,
      qty,
      size: raw.size || product.sizes[0] || 'Free Size',
      price_paise: product.price_paise,
      line_total_paise: lineTotal,
      image_url: product.image_url,
      category: product.category,
      hsn_code: getHsnByCategory(product.category),
    });
  }

  const couponResult = validateCouponServerSide(couponCode, subtotalPaise);
  const discountPaise = couponResult.valid ? couponResult.discountPaise : 0;
  const totalPaise = Math.max(100, subtotalPaise - discountPaise);
  const gstPaise = Math.round((totalPaise * 5) / 105);

  return {
    success: true,
    items,
    subtotalPaise,
    discountPaise,
    couponCode: couponResult.valid ? couponResult.code : null,
    couponMessage: couponResult.message,
    gstPaise,
    totalPaise,
  };
}

export function createServerOrder(params: {
  customer: { name: string; phone: string; address: string };
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
      couponCode: string | null;
      invoiceNumber: string;
      expiresInSeconds: number;
      qrPayload: string;
      record: ServerOrderRecord;
    }
  | { success: false; error: string } {
  const store = getStore();

  if (params.idempotencyKey) {
    const existingId = store.idempotencyMap.get(params.idempotencyKey);
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

  const name = (params.customer?.name || '').trim();
  const phone = (params.customer?.phone || '').replace(/\D/g, '');
  const address = (params.customer?.address || '').trim();

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
  const randomSuffix = crypto.randomBytes(4).toString('hex').toUpperCase();
  const orderId = `ORD${Date.now().toString().slice(-6)}${randomSuffix}`;
  const gatewayOrderId = `order_mock_${orderId.toLowerCase()}`;
  const invoiceNumber = `INV-KC-2026-${orderId.slice(-6)}`;

  const amountInr = (validated.totalPaise / 100).toFixed(2);
  const qrPayload = `upi://pay?pa=merchant@upi&pn=Kranti%20Classes%20Store&am=${amountInr}&cu=INR&tr=${orderId}&tn=Order%20${orderId}`;

  const nowIso = new Date().toISOString();
  const record: ServerOrderRecord = {
    order_id: orderId,
    gateway_order_id: gatewayOrderId,
    idempotency_key: params.idempotencyKey || null,
    customer_name: name,
    phone,
    address,
    items: validated.items,
    subtotal_paise: validated.subtotalPaise || validated.totalPaise,
    discount_paise: validated.discountPaise || 0,
    coupon_code: validated.couponCode || null,
    gst_paise: validated.gstPaise || Math.round((validated.totalPaise * 5) / 105),
    amount_paise: validated.totalPaise,
    invoice_number: invoiceNumber,
    status: 'PENDING',
    tracking_id: null,
    courier_name: 'Delhivery Express',
    fulfillment_status: 'PENDING_PAYMENT',
    estimated_delivery: null,
    tracking_history: [
      {
        status: 'PENDING_PAYMENT',
        title: 'Order Created — Awaiting UPI Payment',
        location: 'Online Checkout',
        note: `UPI QR session initiated for ₹${amountInr}`,
        timestamp: nowIso,
      },
    ],
    qr_expires_at: expiresAt,
    qr_payload: qrPayload,
    created_at: nowIso,
    updated_at: nowIso,
    stock_deducted: false,
  };

  store.orders.set(orderId, record);
  if (params.idempotencyKey) {
    store.idempotencyMap.set(params.idempotencyKey, orderId);
  }

  return {
    success: true,
    orderId,
    amountPaise: record.amount_paise,
    subtotalPaise: record.subtotal_paise,
    discountPaise: record.discount_paise,
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

export function findServerOrderByOrderOrTrackingId(idOrTracking: string): ServerOrderRecord | null {
  const store = getStore();
  const needle = (idOrTracking || '').trim().toUpperCase();
  if (!needle) return null;

  const direct = store.orders.get(needle);
  if (direct) return getServerOrder(direct.order_id);

  for (const order of store.orders.values()) {
    if (
      order.order_id.toUpperCase() === needle ||
      (order.tracking_id && order.tracking_id.toUpperCase() === needle)
    ) {
      return getServerOrder(order.order_id);
    }
  }
  return null;
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
} {
  const store = getStore();
  const record = store.orders.get(orderId);
  if (!record) return { result: 'not_found' };

  if (store.paymentIds.has(paymentEntity.id)) {
    return { result: 'duplicate_payment', trackingId: record.tracking_id };
  }
  if (record.status === 'CONFIRMED') {
    return { result: 'already_confirmed', trackingId: record.tracking_id };
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

  const trackingSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  const trackingId = record.tracking_id || `TRK-KC-${trackingSuffix}`;
  const etaDate = new Date(Date.now() + 4 * 24 * 3600 * 1000).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  record.status = 'CONFIRMED';
  record.payment_id = paymentEntity.id;
  record.tracking_id = trackingId;
  record.courier_name = record.courier_name || 'Delhivery Express';
  record.fulfillment_status = 'ORDER_PLACED';
  record.estimated_delivery = etaDate;
  record.tracking_history = [
    ...(record.tracking_history || []).filter((e) => e.status !== 'PENDING_PAYMENT'),
    {
      status: 'ORDER_PLACED',
      title: 'Order Confirmed & Payment Verified',
      location: 'Jaipur Warehouse, RJ',
      note: `Payment (${paymentEntity.id}) verified via webhook. Tracking ID ${trackingId} & GST Invoice ${record.invoice_number} generated.`,
      timestamp: nowIso,
    },
  ];
  record.updated_at = nowIso;
  return { result: 'confirmed', trackingId };
}

const STAGE_TITLES: Record<FulfillmentStatus, string> = {
  PENDING_PAYMENT: 'Awaiting Payment',
  ORDER_PLACED: 'Order Confirmed & Received at Warehouse',
  PACKED: 'Order Quality Checked & Packed',
  SHIPPED: 'Order Dispatched with Courier Partner',
  OUT_FOR_DELIVERY: 'Out for Delivery in Your City',
  DELIVERED: 'Order Delivered Successfully',
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
    record.courier_name = update.courierName.trim();
  }
  if (update.trackingId && update.trackingId.trim()) {
    record.tracking_id = update.trackingId.trim().toUpperCase();
  } else if (!record.tracking_id) {
    record.tracking_id = `TRK-KC-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  }
  if (update.estimatedDelivery !== undefined && update.estimatedDelivery.trim()) {
    record.estimated_delivery = update.estimatedDelivery.trim();
  }

  record.fulfillment_status = nextStatus;
  const event: TrackingEvent = {
    status: nextStatus,
    title: STAGE_TITLES[nextStatus] || `Status updated to ${nextStatus}`,
    location:
      update.location && update.location.trim()
        ? update.location.trim()
        : 'Jaipur Fulfillment Hub, RJ',
    note:
      update.note && update.note.trim()
        ? update.note.trim()
        : `Order status updated by Admin to ${nextStatus.replace(/_/g, ' ')}.`,
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

export function getAdminAnalyticsSummary() {
  const store = getStore();
  const orders = Array.from(store.orders.values());
  const confirmedOrders = orders.filter((o) => o.status === 'CONFIRMED' || o.status === 'PAID');

  const liveConfirmedRevenuePaise = confirmedOrders.reduce((acc, o) => acc + o.amount_paise, 0);
  const totalDiscountGivenPaise = confirmedOrders.reduce((acc, o) => acc + (o.discount_paise || 0), 0);

  // Combine historical boutique sales + live session sales for rich client presentation
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
        label: 'Kurtis / कुर्तियाँ',
        revenuePaise: catalogRevenueByCategory.kurti,
        percentage: Math.round((catalogRevenueByCategory.kurti / Math.max(1, totalCatalogRevenuePaise)) * 100),
      },
      {
        category: 'bag',
        label: 'Ethnic Bags / बैग्स',
        revenuePaise: catalogRevenueByCategory.bag,
        percentage: Math.round((catalogRevenueByCategory.bag / Math.max(1, totalCatalogRevenuePaise)) * 100),
      },
      {
        category: 'accessory',
        label: 'Accessories / ज्वेलरी',
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
  };
}

export function setNotificationTarget(target: string) {
  const store = getStore();
  store.notificationTarget = target.trim();
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
