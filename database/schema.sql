-- Synchronized Database Schema (PostgreSQL 17 / Live Supabase Project: byinrfmonsqfkoxejhgn)

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  sku VARCHAR(40),
  name VARCHAR(200) NOT NULL,
  name_hi VARCHAR(200) NOT NULL,
  category VARCHAR(64) NOT NULL CHECK (category IN ('kurti', 'bag', 'accessory')),
  description TEXT DEFAULT '',
  description_hi TEXT DEFAULT '',
  price_paise INTEGER NOT NULL CHECK (price_paise > 0),
  original_price_paise INTEGER CHECK (original_price_paise IS NULL OR original_price_paise >= price_paise),
  sizes JSONB NOT NULL DEFAULT '["Free Size"]'::jsonb,
  size_prices_paise JSONB NOT NULL DEFAULT '{}'::jsonb,
  size_original_prices_paise JSONB NOT NULL DEFAULT '{}'::jsonb,
  image_url TEXT NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  sold_count INTEGER NOT NULL DEFAULT 0 CHECK (sold_count >= 0),
  rating NUMERIC(2,1) NOT NULL DEFAULT 4.8,
  reviews_count INTEGER NOT NULL DEFAULT 10,
  badge VARCHAR(64),
  badge_hi VARCHAR(64),
  is_demo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160),
  auth_provider VARCHAR(32) DEFAULT 'email_otp',
  verified BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS coupons (
  code VARCHAR(40) PRIMARY KEY,
  description_en TEXT NOT NULL,
  description_hi TEXT NOT NULL,
  discount_type VARCHAR(16) NOT NULL CHECK (discount_type IN ('PERCENT', 'FLAT')),
  discount_value INTEGER NOT NULL CHECK (discount_value > 0),
  min_order_paise BIGINT NOT NULL DEFAULT 0 CHECK (min_order_paise >= 0),
  max_discount_paise BIGINT NOT NULL DEFAULT 0 CHECK (max_discount_paise >= 0),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  usage_count INTEGER NOT NULL DEFAULT 0 CHECK (usage_count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  order_id VARCHAR(40) UNIQUE NOT NULL,
  user_id INTEGER REFERENCES users(id),
  gateway_order_id VARCHAR(64),
  idempotency_key VARCHAR(128) UNIQUE,
  customer_name VARCHAR(120) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(160),
  address TEXT NOT NULL,
  pincode VARCHAR(10),
  items JSONB NOT NULL,
  subtotal_paise BIGINT NOT NULL DEFAULT 0 CHECK (subtotal_paise >= 0),
  discount_paise BIGINT NOT NULL DEFAULT 0 CHECK (discount_paise >= 0),
  coupon_code VARCHAR(40),
  gst_paise BIGINT NOT NULL DEFAULT 0 CHECK (gst_paise >= 0),
  amount_paise BIGINT NOT NULL CHECK (amount_paise > 0),
  invoice_number VARCHAR(64),
  status VARCHAR(24) NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('CREATED', 'PENDING', 'PAID', 'CONFIRMED', 'FAILED', 'EXPIRED', 'MANUAL_REVIEW')),
  tracking_id VARCHAR(40) UNIQUE,
  courier_name VARCHAR(80) DEFAULT 'Delhivery Express',
  fulfillment_status VARCHAR(32) NOT NULL DEFAULT 'PENDING_PAYMENT'
    CHECK (fulfillment_status IN ('PENDING_PAYMENT', 'ORDER_PLACED', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED')),
  estimated_delivery VARCHAR(64),
  tracking_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  qr_payload TEXT,
  fallback_tier INTEGER DEFAULT 1,
  qr_expires_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_inquiries (
  id VARCHAR(40) PRIMARY KEY,
  product_id INTEGER NOT NULL,
  product_sku VARCHAR(40),
  product_name TEXT NOT NULL,
  selected_size VARCHAR(32),
  unit_price_paise INTEGER,
  customer_name VARCHAR(120) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_email VARCHAR(160),
  pincode VARCHAR(10),
  message TEXT NOT NULL,
  owner_email VARCHAR(160) DEFAULT 'prakashgothwal370@gmail.com',
  status VARCHAR(24) DEFAULT 'SENT_TO_OWNER',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS store_delivery_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  mode VARCHAR(32) NOT NULL DEFAULT 'ALL_INDIA',
  allowed_states JSONB NOT NULL DEFAULT '["Rajasthan","Delhi","Maharashtra","Gujarat","Uttar Pradesh","Haryana","Karnataka","Madhya Pradesh","Punjab","Telangana","West Bengal","Tamil Nadu"]'::jsonb,
  allowed_pincodes JSONB NOT NULL DEFAULT '["302001","302002","302003","302004","302015","302017","302018","302019","302020","302021","302022","313001","342001","334001","110001","400001","380001","560001"]'::jsonb,
  blocked_pincodes JSONB NOT NULL DEFAULT '[]'::jsonb,
  cod_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  free_shipping_threshold_paise INTEGER NOT NULL DEFAULT 99900,
  flat_shipping_paise INTEGER NOT NULL DEFAULT 7900,
  updated_by VARCHAR(120) DEFAULT 'Store Owner (prakashgothwal370@gmail.com)',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  order_id VARCHAR(40) NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
  payment_id VARCHAR(64) UNIQUE NOT NULL,
  status VARCHAR(24) NOT NULL,
  amount_paise BIGINT NOT NULL CHECK (amount_paise > 0),
  method VARCHAR(32),
  raw_payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS settings (
  key VARCHAR(64) PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id SERIAL PRIMARY KEY,
  action VARCHAR(64) NOT NULL,
  actor VARCHAR(64) NOT NULL DEFAULT 'admin',
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_gateway_order_id ON orders(gateway_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_tracking_id ON orders(tracking_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
