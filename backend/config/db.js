const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const env = require('./env');

const CORE_INITIAL_PRODUCTS = [
  { id: 1, name: 'Cotton Straight Kurti', name_hi: 'कॉटन स्ट्रेट कुर्ती', category: 'kurti', price_paise: 79900, image_url: '/products/kurti1.svg', stock: 50 },
  { id: 2, name: 'Anarkali Printed Kurti', name_hi: 'अनारकली प्रिंटेड कुर्ती', category: 'kurti', price_paise: 129900, image_url: '/products/kurti2.svg', stock: 40 },
  { id: 3, name: 'Chikankari Kurti', name_hi: 'चिकनकारी कुर्ती', category: 'kurti', price_paise: 189900, image_url: '/products/kurti3.svg', stock: 7 },
  { id: 4, name: 'Leather Sling Bag', name_hi: 'लेदर स्लिंग बैग', category: 'bag', price_paise: 99900, image_url: '/products/bag1.svg', stock: 30 },
  { id: 5, name: 'Embroidered Potli Bag', name_hi: 'एम्ब्रॉयडरी पोटली बैग', category: 'bag', price_paise: 59900, image_url: '/products/bag2.svg', stock: 60 },
  { id: 6, name: 'Tote Handbag', name_hi: 'टोट हैंडबैग', category: 'bag', price_paise: 149900, image_url: '/products/bag3.svg', stock: 5 },
  { id: 7, name: 'Oxidised Jhumka Earrings', name_hi: 'ऑक्सीडाइज़्ड झुमके', category: 'accessory', price_paise: 29900, image_url: '/products/acc1.svg', stock: 100 },
  { id: 8, name: 'Silk Dupatta', name_hi: 'सिल्क दुपट्टा', category: 'accessory', price_paise: 49900, image_url: '/products/acc2.svg', stock: 45 },
  { id: 9, name: 'Bangles Set (6 pcs)', name_hi: 'चूड़ी सेट (6 पीस)', category: 'accessory', price_paise: 39900, image_url: '/products/acc3.svg', stock: 80 },
  { id: 10, name: 'Indigo Ajrakh A-Line Kurti', name_hi: 'इंडिगो अजरख ए-लाइन कुर्ती', category: 'kurti', price_paise: 114900, image_url: '/products/kurti4.svg', stock: 22 },
  { id: 11, name: 'Handcrafted Jute & Ikat Shoulder Bag', name_hi: 'हैंडक्राफ्टेड जूट और इकत शोल्डर बैग', category: 'bag', price_paise: 84900, image_url: '/products/bag4.svg', stock: 18 },
  { id: 12, name: 'Pearl & Mirror Work Hair Clip Set', name_hi: 'पर्ल और मिरर वर्क हेयर क्लिप सेट', category: 'accessory', price_paise: 24900, image_url: '/products/acc4.svg', stock: 0 },
];

function loadSeededProducts() {
  try {
    const seedPath = path.resolve(__dirname, '../../database/catalog_seed.json');
    if (fs.existsSync(seedPath)) {
      const parsed = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
      if (Array.isArray(parsed) && parsed.length > 12) {
        const coreIds = new Set(CORE_INITIAL_PRODUCTS.map((p) => p.id));
        const extra = parsed
          .filter((p) => !coreIds.has(Number(p.id)))
          .map((p) => ({
            id: Number(p.id),
            sku: p.sku,
            name: p.name,
            name_hi: p.name_hi,
            category: p.category,
            price_paise: Number(p.price_paise),
            size_prices_paise: p.size_prices_paise || {},
            sizes: p.sizes || ['Free Size'],
            image_url: p.image_url,
            stock: Number(p.stock ?? 20),
          }));
        return [...CORE_INITIAL_PRODUCTS, ...extra];
      }
    }
  } catch {
    // fallback
  }
  return CORE_INITIAL_PRODUCTS;
}

const INITIAL_PRODUCTS = loadSeededProducts();

const DEMO_TRACKED_ORDER = {
  id: 1,
  order_id: 'ORDDEMO1001',
  user_id: 1,
  customer_name: 'Aditi Sharma (Demo Order)',
  phone: '9876543210',
  address: 'B-24, Bapu Nagar, Jaipur, Rajasthan, PIN: 302015',
  amount_paise: 209800,
  items: [
    { id: 1, name: 'Cotton Straight Kurti', name_hi: 'कॉटन स्ट्रेट कुर्ती', size: 'M', qty: 1, price_paise: 79900 },
    { id: 2, name: 'Anarkali Printed Kurti', name_hi: 'अनारकली प्रिंटेड कुर्ती', size: 'L', qty: 1, price_paise: 129900 },
  ],
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
      note: 'Server webhook verified payment. Tracking ID TRK-KC-1001 generated.',
      timestamp: '2026-10-18T10:15:00.000Z',
    },
    {
      status: 'PACKED',
      title: 'Order Packed & Quality Checked',
      location: 'Sitapura Dispatch Center, Jaipur',
      note: '2 items packed in tamper-evident courier bag.',
      timestamp: '2026-10-18T15:40:00.000Z',
    },
    {
      status: 'SHIPPED',
      title: 'Dispatched via Delhivery Express',
      location: 'Jaipur Regional Sorting Hub',
      note: 'Handed over to courier partner (AWB: TRK-KC-1001). In transit to destination.',
      timestamp: '2026-10-19T05:30:00.000Z',
    },
  ],
  gateway_order_id: 'order_mock_ORDDEMO1001',
  qr_payload: 'upi://pay?pa=kurticorner.demo@upi&pn=Kurti%20Corner&tr=ORDDEMO1001&am=2098.00&cu=INR',
  idempotency_key: 'demo_seed_1001',
  fallback_tier: 1,
  created_at: '2026-10-18T10:12:00.000Z',
  expires_at: '2026-10-18T10:16:00.000Z',
  confirmed_at: '2026-10-18T10:15:00.000Z',
};

function createInMemoryPool() {
  const state = {
    users: [{ id: 1, phone: '9876543210', name: 'Aditi Sharma (Demo Order)' }],
    products: INITIAL_PRODUCTS.map((p) => ({ ...p })),
    orders: [JSON.parse(JSON.stringify(DEMO_TRACKED_ORDER))],
    payments: [],
    paymentEvents: new Set(),
    settings: new Map([
      ['admin_notification_target', 'YOUR_TELEGRAM_CHAT_ID_HERE'],
      ['payment_fallback_tier', '1'],
    ]),
    auditLogs: [],
  };

  async function query(sql, params = []) {
    const norm = sql.replace(/\s+/g, ' ').trim();

    if (/^(BEGIN|COMMIT|ROLLBACK)$/i.test(norm)) {
      return { rows: [], rowCount: 0 };
    }

    if (norm.startsWith('SELECT id, name, name_hi, category, price_paise, image_url, stock FROM products WHERE id = $1') || norm.startsWith('SELECT * FROM products WHERE id = $1')) {
      const id = Number(params[0]);
      const found = state.products.filter((p) => p.id === id);
      return { rows: found, rowCount: found.length };
    }

    if (norm.startsWith('SELECT id, name, name_hi, category, price_paise, image_url, stock FROM products') || norm.startsWith('SELECT * FROM products')) {
      return { rows: [...state.products].sort((a, b) => a.id - b.id), rowCount: state.products.length };
    }

    if (norm.includes('FROM products WHERE id = ANY')) {
      const ids = (params[0] || []).map(Number);
      const rows = state.products.filter((p) => ids.includes(p.id));
      return { rows, rowCount: rows.length };
    }

    if (norm.startsWith('INSERT INTO products')) {
      const nextId = state.products.reduce((m, p) => Math.max(m, p.id), 0) + 1;
      const newProd = {
        id: nextId,
        name: params[0],
        name_hi: params[1] || null,
        category: params[2],
        price_paise: Number(params[3]),
        image_url: params[4] || '/products/kurti1.svg',
        stock: Number(params[5] ?? 50),
      };
      state.products.push(newProd);
      return { rows: [newProd], rowCount: 1 };
    }

    if (norm.startsWith('UPDATE products SET stock = GREATEST')) {
      const qty = Number(params[0]);
      const id = Number(params[1]);
      const p = state.products.find((x) => x.id === id);
      if (p) p.stock = Math.max(0, p.stock - qty);
      return { rows: p ? [p] : [], rowCount: p ? 1 : 0 };
    }

    if (norm.startsWith('UPDATE products SET')) {
      const id = Number(params[0]);
      const p = state.products.find((x) => x.id === id);
      if (!p) return { rows: [], rowCount: 0 };
      if (params[1] !== undefined && params[1] !== null) p.name = params[1];
      if (params[2] !== undefined && params[2] !== null) p.price_paise = Number(params[2]);
      if (params[3] !== undefined && params[3] !== null) p.stock = Number(params[3]);
      return { rows: [p], rowCount: 1 };
    }

    if (norm.startsWith('INSERT INTO users')) {
      const [phone, name] = params;
      let u = state.users.find((x) => x.phone === phone);
      if (u) {
        u.name = name;
      } else {
        u = { id: state.users.length + 1, phone, name };
        state.users.push(u);
      }
      return { rows: [{ id: u.id }], rowCount: 1 };
    }

    if (norm.startsWith('SELECT * FROM orders WHERE idempotency_key = $1')) {
      const found = state.orders.find((o) => o.idempotency_key === params[0]);
      return { rows: found ? [found] : [], rowCount: found ? 1 : 0 };
    }

    if (norm.startsWith('INSERT INTO orders')) {
      const [order_id, user_id, customer_name, phone, address, amount_paise, itemsJson, gateway_order_id, qr_payload, idempotency_key, fallback_tier] = params;
      const now = new Date();
      const expiresAt = new Date(now.getTime() + env.ORDER_EXPIRY_MINUTES * 60 * 1000);
      const rec = {
        id: state.orders.length + 1,
        order_id,
        user_id,
        customer_name,
        phone,
        address,
        amount_paise: Number(amount_paise),
        items: typeof itemsJson === 'string' ? JSON.parse(itemsJson) : itemsJson,
        status: 'PENDING',
        tracking_id: null,
        courier_name: 'Delhivery Express',
        fulfillment_status: 'PENDING_PAYMENT',
        estimated_delivery: null,
        tracking_history: [],
        gateway_order_id,
        qr_payload: qr_payload || null,
        idempotency_key: idempotency_key || null,
        fallback_tier: Number(fallback_tier || 1),
        created_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        confirmed_at: null,
      };
      state.orders.push(rec);
      return { rows: [rec], rowCount: 1 };
    }

    if (norm.includes('WHERE UPPER(order_id) = UPPER($1) OR UPPER(tracking_id) = UPPER($1)')) {
      const needle = String(params[0] || '').trim().toUpperCase();
      const found = state.orders.find(
        (o) =>
          (o.order_id && o.order_id.toUpperCase() === needle) ||
          (o.tracking_id && o.tracking_id.toUpperCase() === needle)
      );
      return { rows: found ? [found] : [], rowCount: found ? 1 : 0 };
    }

    if (norm.includes('FROM orders WHERE order_id = $1')) {
      const found = state.orders.find((o) => o.order_id === params[0]);
      return { rows: found ? [found] : [], rowCount: found ? 1 : 0 };
    }

    if (norm.includes('FROM orders WHERE gateway_order_id = $1')) {
      const found = state.orders.find((o) => o.gateway_order_id === params[0]);
      return { rows: found ? [found] : [], rowCount: found ? 1 : 0 };
    }

    if (norm.startsWith("UPDATE orders SET status = 'FAILED' WHERE id = $1")) {
      const found = state.orders.find((o) => o.id === Number(params[0]));
      if (found) found.status = 'FAILED';
      return { rows: [], rowCount: found ? 1 : 0 };
    }

    if (norm.startsWith("UPDATE orders SET status = 'CONFIRMED'")) {
      const [id, trackingId, courierName, fulfillmentStatus, estimatedDelivery, historyJson] = params;
      const found = state.orders.find((o) => o.id === Number(id));
      if (found) {
        found.status = 'CONFIRMED';
        found.confirmed_at = new Date().toISOString();
        if (trackingId) found.tracking_id = trackingId;
        if (courierName) found.courier_name = courierName;
        if (fulfillmentStatus) found.fulfillment_status = fulfillmentStatus;
        if (estimatedDelivery) found.estimated_delivery = estimatedDelivery;
        if (historyJson) {
          found.tracking_history = typeof historyJson === 'string' ? JSON.parse(historyJson) : historyJson;
        }
      }
      return { rows: found ? [found] : [], rowCount: found ? 1 : 0 };
    }

    if (norm.startsWith('UPDATE orders SET fulfillment_status =')) {
      const [orderId, fulfillmentStatus, courierName, trackingId, estimatedDelivery, historyJson] = params;
      const found = state.orders.find((o) => o.order_id === orderId);
      if (!found) return { rows: [], rowCount: 0 };
      found.fulfillment_status = fulfillmentStatus;
      if (courierName) found.courier_name = courierName;
      if (trackingId) found.tracking_id = trackingId;
      if (estimatedDelivery !== undefined) found.estimated_delivery = estimatedDelivery;
      if (historyJson) {
        found.tracking_history = typeof historyJson === 'string' ? JSON.parse(historyJson) : historyJson;
      }
      return { rows: [found], rowCount: 1 };
    }

    if (norm.startsWith("UPDATE orders SET status = 'EXPIRED'")) {
      const minutes = Number(params[0] || env.ORDER_EXPIRY_MINUTES);
      const cutoff = Date.now() - minutes * 60 * 1000;
      const expired = [];
      for (const o of state.orders) {
        if (o.status === 'PENDING' && new Date(o.created_at).getTime() < cutoff) {
          o.status = 'EXPIRED';
          expired.push({ order_id: o.order_id });
        }
      }
      return { rows: expired, rowCount: expired.length };
    }

    if (norm.startsWith('INSERT INTO payments')) {
      const [order_id, gateway_payment_id, amount_paise, method] = params;
      if (state.payments.some((p) => p.gateway_payment_id === gateway_payment_id)) {
        return { rows: [], rowCount: 0 };
      }
      const pay = {
        id: state.payments.length + 1,
        order_id,
        gateway_payment_id,
        amount_paise: Number(amount_paise),
        method,
        verified_at: new Date().toISOString(),
      };
      state.payments.push(pay);
      return { rows: [{ id: pay.id }], rowCount: 1 };
    }

    if (norm.includes('FROM system_settings WHERE key =')) {
      const key = params[0] || 'admin_notification_target';
      const val = state.settings.get(key);
      return { rows: val !== undefined ? [{ value: val }] : [], rowCount: val !== undefined ? 1 : 0 };
    }

    if (norm.startsWith('INSERT INTO system_settings')) {
      if (params.length === 1) {
        state.settings.set('admin_notification_target', params[0]);
      } else if (params.length >= 2) {
        state.settings.set(params[0], params[1]);
      }
      return { rows: [], rowCount: 1 };
    }

    if (norm.includes('FROM orders ORDER BY created_at DESC')) {
      const rows = [...state.orders].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 100);
      return { rows, rowCount: rows.length };
    }

    if (norm.startsWith('INSERT INTO admin_audit_logs')) {
      const log = {
        id: state.auditLogs.length + 1,
        action: params[0],
        target_key: params[1] || null,
        details: params[2] ? JSON.parse(params[2]) : {},
        ip_address: params[3] || null,
        created_at: new Date().toISOString(),
      };
      state.auditLogs.unshift(log);
      return { rows: [log], rowCount: 1 };
    }

    if (norm.includes('FROM admin_audit_logs')) {
      return { rows: state.auditLogs.slice(0, 100), rowCount: state.auditLogs.length };
    }

    return { rows: [], rowCount: 0 };
  }

  return {
    isMemoryFallback: true,
    query,
    async connect() {
      return {
        query,
        release() {},
      };
    },
    async end() {},
  };
}

let pool;
if (process.env.USE_IN_MEMORY_STORE === '1' || env.NODE_ENV === 'test' || !env.DATABASE_URL) {
  pool = createInMemoryPool();
} else {
  pool = new Pool({ connectionString: env.DATABASE_URL, max: 20 });
  pool.on('error', (err) => console.error('[pg] idle client error', err.message));
}

module.exports = { pool, createInMemoryPool, DEMO_TRACKED_ORDER };
