-- Migration 003: Discount Coupons, GST Invoice Metadata & Product Sold Counter
-- Non-destructive migration for existing deployments

BEGIN;

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS sold_count INTEGER NOT NULL DEFAULT 0 CHECK (sold_count >= 0);

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS subtotal_paise BIGINT NOT NULL DEFAULT 0 CHECK (subtotal_paise >= 0),
  ADD COLUMN IF NOT EXISTS discount_paise BIGINT NOT NULL DEFAULT 0 CHECK (discount_paise >= 0),
  ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(40),
  ADD COLUMN IF NOT EXISTS gst_paise BIGINT NOT NULL DEFAULT 0 CHECK (gst_paise >= 0),
  ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(64);

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

INSERT INTO coupons (code, description_en, description_hi, discount_type, discount_value, min_order_paise, max_discount_paise, active, usage_count)
VALUES
  ('FIRST10', '10% OFF on your first order (up to ₹500)', 'आपके पहले ऑर्डर पर 10% की छूट (₹500 तक)', 'PERCENT', 10, 0, 50000, TRUE, 14),
  ('DIWALI20', 'Festive Special: 20% OFF on orders above ₹1,299 (up to ₹1,000)', 'त्योहार विशेष: ₹1,299+ के ऑर्डर पर 20% की छूट (₹1,000 तक)', 'PERCENT', 20, 129900, 100000, TRUE, 29),
  ('JAIPUR15', 'Jaipur Boutique Special: 15% OFF on orders above ₹999', 'जयपुर बुटीक स्पेशल: ₹999+ के ऑर्डर पर 15% की छूट', 'PERCENT', 15, 99900, 75000, TRUE, 9),
  ('ROYAL250', 'Flat ₹250 OFF on Royal Ethnic orders above ₹1,799', '₹1,799+ के रॉयल एथनिक ऑर्डर पर सीधी ₹250 की छूट', 'FLAT', 25000, 179900, 25000, TRUE, 6)
ON CONFLICT (code) DO NOTHING;

COMMIT;
