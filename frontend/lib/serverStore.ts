import crypto from 'crypto';
import { DEMO_PRODUCTS, enrichProduct, Product } from './catalog';

export type OrderItemRecord = {
  id: number;
  name: string;
  name_hi: string | null;
  size?: string;
  qty: number;
  price_paise: number;
};

export type OrderRecord = {
  order_id: string;
  customer_name: string;
  phone: string;
  address: string;
  amount_paise: number;
  items: OrderItemRecord[];
  status: 'PENDING' | 'CONFIRMED' | 'FAILED' | 'EXPIRED';
  gateway_order_id: string;
  created_at: string;
  expires_at: string;
  confirmed_at: string | null;
  qr_payload: string;
};

type GlobalStore = {
  products: Product[];
  orders: Map<string, OrderRecord>;
  idempotencyMap: Map<string, string>;
  verifiedPayments: Set<string>;
  notificationTarget: string;
};

const globalForStore = globalThis as unknown as { __fashionStore?: GlobalStore };

function getStore(): GlobalStore {
  if (!globalForStore.__fashionStore) {
    globalForStore.__fashionStore = {
      products: DEMO_PRODUCTS.map((p) => ({ ...p })),
      orders: new Map<string, OrderRecord>(),
      idempotencyMap: new Map<string, string>(),
      verifiedPayments: new Set<string>(),
      notificationTarget: process.env.TELEGRAM_CHAT_ID || 'YOUR_TELEGRAM_CHAT_ID_HERE',
    };
  }
  return globalForStore.__fashionStore;
}

export const BACKEND_INTERNAL_URL = process.env.BACKEND_INTERNAL_URL || '';

export async function tryProxyBackend(path: string, init?: RequestInit): Promise<Response | null> {
  if (!BACKEND_INTERNAL_URL) return null;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1500);
    const res = await fetch(`${BACKEND_INTERNAL_URL.replace(/\/$/, '')}${path}`, {
      ...init,
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timer);
    return res;
  } catch {
    return null;
  }
}

export function listServerProducts(): Product[] {
  const store = getStore();
  return store.products.map((p) => enrichProduct(p));
}

export function getServerProductById(id: number): Product | null {
  const store = getStore();
  const found = store.products.find((p) => p.id === id);
  return found ? enrichProduct(found) : null;
}

export function validateCartServerSide(rawItems: Array<{ id: number; qty: number; size?: string }>) {
  const store = getStore();
  const validatedLines: Array<{
    id: number;
    name: string;
    name_hi: string | null;
    size: string;
    qty: number;
    price_paise: number;
    line_total_paise: number;
    stock: number;
  }> = [];

  let subtotalPaise = 0;
  const warnings: string[] = [];

  for (const item of rawItems || []) {
    const product = store.products.find((p) => p.id === Number(item.id));
    if (!product) {
      warnings.push(`Product #${item.id} is no longer available.`);
      continue;
    }
    if (product.stock <= 0) {
      warnings.push(`${product.name} is currently out of stock.`);
      continue;
    }
    const safeQty = Math.max(1, Math.min(Number(item.qty) || 1, Math.min(10, product.stock)));
    if (safeQty !== item.qty) {
      warnings.push(`Quantity for ${product.name} adjusted to available stock (${safeQty}).`);
    }
    const lineTotal = product.price_paise * safeQty;
    subtotalPaise += lineTotal;
    validatedLines.push({
      id: product.id,
      name: product.name,
      name_hi: product.name_hi,
      size: item.size || (product.sizes && product.sizes[0]) || 'Free Size',
      qty: safeQty,
      price_paise: product.price_paise,
      line_total_paise: lineTotal,
      stock: product.stock,
    });
  }

  return {
    success: true,
    items: validatedLines,
    subtotalPaise,
    deliveryPaise: 0,
    totalPaise: subtotalPaise,
    currency: 'INR',
    warnings,
    validatedAt: new Date().toISOString(),
  };
}

export function createServerOrder(params: {
  customer: { name: string; phone: string; address: string };
  items: Array<{ id: number; qty: number; size?: string }>;
  idempotencyKey?: string;
}):
  | {
      success: true;
      orderId: string;
      gatewayOrderId: string;
      amountPaise: number;
      currency: string;
      paymentMode: string;
      razorpayKeyId: string | null;
      expiresInSeconds: number;
      expiresAt: string;
      qrPayload: string;
    }
  | { success: false; status: number; error: string } {
  const store = getStore();
  const { customer, items, idempotencyKey } = params;

  if (idempotencyKey && store.idempotencyMap.has(idempotencyKey)) {
    const existingId = store.idempotencyMap.get(idempotencyKey)!;
    const existing = store.orders.get(existingId);
    if (existing) {
      const remainingSec = Math.max(0, Math.floor((new Date(existing.expires_at).getTime() - Date.now()) / 1000));
      return {
        success: true,
        orderId: existing.order_id,
        gatewayOrderId: existing.gateway_order_id,
        amountPaise: existing.amount_paise,
        currency: 'INR',
        paymentMode: process.env.PAYMENT_MODE || 'mock',
        razorpayKeyId: null,
        expiresInSeconds: remainingSec,
        expiresAt: existing.expires_at,
        qrPayload: existing.qr_payload,
      };
    }
  }

  if (!customer || typeof customer.name !== 'string' || customer.name.trim().length < 2) {
    return { success: false, status: 400, error: 'Customer name must be at least 2 characters.' };
  }
  if (!/^[6-9][0-9]{9}$/.test(String(customer.phone || '').trim())) {
    return { success: false, status: 400, error: 'Phone must be a valid 10-digit Indian mobile number.' };
  }
  if (typeof customer.address !== 'string' || customer.address.trim().length < 10) {
    return { success: false, status: 400, error: 'Delivery address must be at least 10 characters.' };
  }
  if (!Array.isArray(items) || items.length === 0 || items.length > 30) {
    return { success: false, status: 400, error: 'Order must contain between 1 and 30 items.' };
  }

  // Aggregate quantities per product ID for stock checking
  const totalQtyById = new Map<number, number>();
  for (const it of items) {
    const pid = Number(it.id);
    const q = Number(it.qty);
    if (!Number.isInteger(pid) || pid < 1 || !Number.isInteger(q) || q < 1 || q > 10) {
      return { success: false, status: 400, error: 'Invalid item ID or quantity (1–10 allowed).' };
    }
    totalQtyById.set(pid, (totalQtyById.get(pid) || 0) + q);
  }

  let amountPaise = 0;
  const orderItems: OrderItemRecord[] = [];

  for (const [pid, totalQty] of totalQtyById.entries()) {
    const p = store.products.find((prod) => prod.id === pid);
    if (!p) {
      return { success: false, status: 400, error: 'One or more products not found.' };
    }
    if (totalQty > p.stock) {
      return { success: false, status: 409, error: `Not enough stock for ${p.name}.` };
    }
  }

  for (const it of items) {
    const p = store.products.find((prod) => prod.id === Number(it.id))!;
    const qty = Number(it.qty);
    amountPaise += p.price_paise * qty;
    orderItems.push({
      id: p.id,
      name: p.name,
      name_hi: p.name_hi,
      size: it.size || (p.sizes && p.sizes[0]) || 'Free Size',
      qty,
      price_paise: p.price_paise,
    });
  }

  const orderId = `ORD${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
  const gatewayOrderId = `order_mock_${orderId}`;
  const now = Date.now();
  const expiresInSeconds = 240; // 4-minute dynamic QR lock window
  const expiresAt = new Date(now + expiresInSeconds * 1000).toISOString();
  const amountRupees = (amountPaise / 100).toFixed(2);
  const qrPayload = `upi://pay?pa=kurticorner.demo@upi&pn=Kurti%20Corner&tr=${orderId}&am=${amountRupees}&cu=INR&tn=Order%20${orderId}`;

  const record: OrderRecord = {
    order_id: orderId,
    customer_name: customer.name.trim(),
    phone: customer.phone.trim(),
    address: customer.address.trim(),
    amount_paise: amountPaise,
    items: orderItems,
    status: 'PENDING',
    gateway_order_id: gatewayOrderId,
    created_at: new Date(now).toISOString(),
    expires_at: expiresAt,
    confirmed_at: null,
    qr_payload: qrPayload,
  };

  store.orders.set(orderId, record);
  if (idempotencyKey) {
    store.idempotencyMap.set(idempotencyKey, orderId);
  }

  return {
    success: true,
    orderId,
    gatewayOrderId,
    amountPaise,
    currency: 'INR',
    paymentMode: process.env.PAYMENT_MODE || 'mock',
    razorpayKeyId: null,
    expiresInSeconds,
    expiresAt,
    qrPayload,
  };
}

export function getServerOrder(orderId: string): OrderRecord | null {
  const store = getStore();
  const o = store.orders.get(orderId);
  if (!o) return null;
  if (o.status === 'PENDING' && Date.now() > new Date(o.expires_at).getTime()) {
    o.status = 'EXPIRED';
  }
  return o;
}

export function confirmServerOrder(
  orderId: string,
  payment?: { id?: string; amount?: number; method?: string }
): {
  success: boolean;
  result: 'confirmed' | 'already_confirmed' | 'duplicate_payment' | 'amount_mismatch' | 'expired' | 'unknown_order';
  orderId?: string;
} {
  const store = getStore();
  const o = store.orders.get(orderId);
  if (!o) return { success: false, result: 'unknown_order' };

  if (o.status === 'CONFIRMED') {
    return { success: true, result: 'already_confirmed', orderId: o.order_id };
  }

  if (o.status === 'PENDING' && Date.now() > new Date(o.expires_at).getTime()) {
    o.status = 'EXPIRED';
    return { success: false, result: 'expired', orderId: o.order_id };
  }

  const paidAmount = payment?.amount ?? o.amount_paise;
  if (Number(paidAmount) !== o.amount_paise) {
    o.status = 'FAILED';
    return { success: false, result: 'amount_mismatch', orderId: o.order_id };
  }

  const paymentId = payment?.id || `pay_mock_${crypto.randomBytes(6).toString('hex')}`;
  if (store.verifiedPayments.has(paymentId)) {
    return { success: true, result: 'duplicate_payment', orderId: o.order_id };
  }

  store.verifiedPayments.add(paymentId);
  o.status = 'CONFIRMED';
  o.confirmed_at = new Date().toISOString();

  // Decrement stock atomically
  for (const item of o.items) {
    const prod = store.products.find((p) => p.id === item.id);
    if (prod) {
      prod.stock = Math.max(0, prod.stock - item.qty);
    }
  }

  return { success: true, result: 'confirmed', orderId: o.order_id };
}

export function verifyAdminTokenHeader(tokenHeader: string | null): boolean {
  const expected = process.env.ADMIN_TOKEN || 'dev_admin_token_replace_me_123456';
  const provided = String(tokenHeader || '');
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function getAdminStoreData() {
  const store = getStore();
  return {
    target: store.notificationTarget,
    orders: Array.from(store.orders.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ),
  };
}

export function setAdminNotificationTarget(target: string) {
  const store = getStore();
  store.notificationTarget = target.trim();
  return store.notificationTarget;
}
