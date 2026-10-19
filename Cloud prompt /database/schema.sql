-- Synchronized Database Schema (matches migrations 001 + 002 + 003)

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  name_hi VARCHAR(200) NOT NULL,
  category VARCHAR(64) NOT NULL CHECK (category IN ('kurti', 'bag', 'accessory')),
  description TEXT DEFAULT '',
  description_hi TEXT DEFAULT '',
  price_paise INTEGER NOT NULL CHECK (price_paise > 0),
  original_price_paise INTEGER CHECK (original_price_paise IS NULL OR original_price_paise >= price_paise),
  image_url TEXT NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  sold_count INTEGER NOT NULL DEFAULT 0 CHECK (sold_count >= 0),
  sizes JSONB NOT NULL DEFAULT '["Free Size"]'::jsonb,
  rating NUMERIC(2,1) NOT NULL DEFAULT 4.8,
  reviews_count INTEGER NOT NULL DEFAULT 10,
  badge VARCHAR(64),
  badge_hi VARCHAR(64),
  is_demo BOOLEAN NOT NULL DEFAULT TRUE,
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
  gateway_order_id VARCHAR(64),
  idempotency_key VARCHAR(128) UNIQUE,
  customer_name VARCHAR(120) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address TEXT NOT NULL,
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
  qr_expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
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
