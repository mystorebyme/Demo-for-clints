-- ============================================================================
-- Fashion Store Complete Schema (Synchronized with database/migrations/001_initial_schema.sql)
-- Non-destructive initialization for Docker entrypoint & fresh PostgreSQL instances
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(15) UNIQUE NOT NULL,
    name VARCHAR(120) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    sku VARCHAR(50) UNIQUE,
    name VARCHAR(255) NOT NULL,
    name_hi VARCHAR(255),
    category VARCHAR(50) NOT NULL CHECK (category IN ('kurti', 'bag', 'accessory')),
    description TEXT,
    description_hi TEXT,
    fabric_or_material VARCHAR(255),
    fabric_or_material_hi VARCHAR(255),
    price_paise INT NOT NULL CHECK (price_paise > 0),
    currency CHAR(3) NOT NULL DEFAULT 'INR',
    image_url TEXT NOT NULL,
    stock INT NOT NULL DEFAULT 100 CHECK (stock >= 0),
    is_demo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(50) UNIQUE NOT NULL,
    user_id INT REFERENCES users(id),
    customer_name VARCHAR(120) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    address TEXT NOT NULL,
    amount_paise INT NOT NULL CHECK (amount_paise > 0),
    currency CHAR(3) NOT NULL DEFAULT 'INR',
    items JSONB NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'CONFIRMING', 'CONFIRMED', 'FAILED', 'EXPIRED', 'CANCELLED', 'REFUNDED')),
    fallback_tier SMALLINT NOT NULL DEFAULT 1 CHECK (fallback_tier BETWEEN 1 AND 4),
    gateway_order_id VARCHAR(100) UNIQUE,
    qr_payload TEXT,
    idempotency_key VARCHAR(120) UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL '4 minutes'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(status, created_at);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);

CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products(id),
    product_name VARCHAR(255) NOT NULL,
    size VARCHAR(30) DEFAULT 'Free Size',
    qty INT NOT NULL CHECK (qty >= 1 AND qty <= 10),
    unit_price_paise INT NOT NULL CHECK (unit_price_paise > 0),
    line_total_paise INT NOT NULL CHECK (line_total_paise > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL REFERENCES orders(order_id),
    gateway_payment_id VARCHAR(100) UNIQUE NOT NULL,
    provider VARCHAR(30) NOT NULL DEFAULT 'razorpay',
    amount_paise INT NOT NULL CHECK (amount_paise > 0),
    currency CHAR(3) NOT NULL DEFAULT 'INR',
    method VARCHAR(30),
    status VARCHAR(20) NOT NULL DEFAULT 'CAPTURED'
        CHECK (status IN ('PENDING', 'CAPTURED', 'FAILED', 'REFUNDED', 'DISPUTED')),
    verified_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);

CREATE TABLE IF NOT EXISTS payment_events (
    id SERIAL PRIMARY KEY,
    provider VARCHAR(30) NOT NULL,
    provider_event_id VARCHAR(120) UNIQUE NOT NULL,
    gateway_order_id VARCHAR(100),
    gateway_payment_id VARCHAR(100),
    event_type VARCHAR(60) NOT NULL,
    payload JSONB NOT NULL,
    process_status VARCHAR(30) NOT NULL DEFAULT 'PROCESSED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS system_settings (
    key VARCHAR(50) PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id SERIAL PRIMARY KEY,
    action VARCHAR(80) NOT NULL,
    target_key VARCHAR(120),
    details JSONB,
    ip_address VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_admin_audit_created ON admin_audit_logs(created_at DESC);

INSERT INTO system_settings (key, value)
VALUES
  ('admin_notification_target', 'YOUR_TELEGRAM_CHAT_ID_HERE'),
  ('payment_fallback_tier', '1')
ON CONFLICT (key) DO NOTHING;

INSERT INTO products (id, sku, name, name_hi, category, price_paise, image_url, stock, is_demo)
VALUES
  (1, 'KRT-001', 'Cotton Straight Kurti', 'कॉटन स्ट्रेट कुर्ती', 'kurti', 79900, '/products/kurti1.svg', 50, TRUE),
  (2, 'KRT-002', 'Anarkali Printed Kurti', 'अनारकली प्रिंटेड कुर्ती', 'kurti', 129900, '/products/kurti2.svg', 40, TRUE),
  (3, 'KRT-003', 'Chikankari Kurti', 'चिकनकारी कुर्ती', 'kurti', 189900, '/products/kurti3.svg', 7, TRUE),
  (4, 'BAG-001', 'Leather Sling Bag', 'लेदर स्लिंग बैग', 'bag', 99900, '/products/bag1.svg', 30, TRUE),
  (5, 'BAG-002', 'Embroidered Potli Bag', 'एम्ब्रॉयडरी पोटली बैग', 'bag', 59900, '/products/bag2.svg', 60, TRUE),
  (6, 'BAG-003', 'Tote Handbag', 'टोट हैंडबैग', 'bag', 149900, '/products/bag3.svg', 5, TRUE),
  (7, 'ACC-001', 'Oxidised Jhumka Earrings', 'ऑक्सीडाइज़्ड झुमके', 'accessory', 29900, '/products/acc1.svg', 100, TRUE),
  (8, 'ACC-002', 'Silk Dupatta', 'सिल्क दुपट्टा', 'accessory', 49900, '/products/acc2.svg', 45, TRUE),
  (9, 'ACC-003', 'Bangles Set (6 pcs)', 'चूड़ी सेट (6 पीस)', 'accessory', 39900, '/products/acc3.svg', 80, TRUE),
  (10, 'KRT-004', 'Indigo Ajrakh A-Line Kurti', 'इंडिगो अजरख ए-लाइन कुर्ती', 'kurti', 114900, '/products/kurti4.svg', 22, TRUE),
  (11, 'BAG-004', 'Handcrafted Jute & Ikat Shoulder Bag', 'हैंडक्राफ्टेड जूट और इकत शोल्डर बैग', 'bag', 84900, '/products/bag4.svg', 18, TRUE),
  (12, 'ACC-004', 'Pearl & Mirror Work Hair Clip Set', 'पर्ल और मिरर वर्क हेयर क्लिप सेट', 'accessory', 24900, '/products/acc4.svg', 0, TRUE)
ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('products', 'id'), GREATEST((SELECT MAX(id) FROM products), 12));
