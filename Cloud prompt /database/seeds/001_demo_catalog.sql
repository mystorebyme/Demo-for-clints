-- ============================================================================
-- Seed 001: Safe Idempotent Demo Catalog & Default System Settings
-- Explicitly marked with is_demo = TRUE
-- ============================================================================

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
