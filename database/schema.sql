-- Fashion Store schema (PostgreSQL 15)
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS system_settings;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(15) UNIQUE NOT NULL,
    name VARCHAR(120),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    name_hi VARCHAR(255),
    category VARCHAR(50) NOT NULL CHECK (category IN ('kurti','bag','accessory')),
    price_paise INT NOT NULL CHECK (price_paise > 0),
    image_url TEXT NOT NULL,
    stock INT NOT NULL DEFAULT 100 CHECK (stock >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_products_category ON products(category);

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(50) UNIQUE NOT NULL,
    user_id INT REFERENCES users(id),
    customer_name VARCHAR(120) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    address TEXT NOT NULL,
    amount_paise INT NOT NULL CHECK (amount_paise > 0),
    items JSONB NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, CONFIRMED, FAILED, EXPIRED
    gateway_order_id VARCHAR(100) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP
);
CREATE INDEX idx_orders_status_created ON orders(status, created_at);

-- Payments: UNIQUE gateway_payment_id blocks duplicate/replayed confirmations
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL REFERENCES orders(order_id),
    gateway_payment_id VARCHAR(100) UNIQUE NOT NULL,
    amount_paise INT NOT NULL,
    method VARCHAR(30),
    verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE system_settings (
    key VARCHAR(50) PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO system_settings (key, value) VALUES ('admin_notification_target', 'YOUR_TELEGRAM_CHAT_ID_HERE');

-- Sample catalog (placeholder images: replace with your own WebP files)
INSERT INTO products (name, name_hi, category, price_paise, image_url, stock) VALUES
('Cotton Straight Kurti', 'कॉटन स्ट्रेट कुर्ती', 'kurti', 79900, '/products/kurti1.webp', 50),
('Anarkali Printed Kurti', 'अनारकली प्रिंटेड कुर्ती', 'kurti', 129900, '/products/kurti2.webp', 40),
('Chikankari Kurti', 'चिकनकारी कुर्ती', 'kurti', 189900, '/products/kurti3.webp', 25),
('Leather Sling Bag', 'लेदर स्लिंग बैग', 'bag', 99900, '/products/bag1.webp', 30),
('Embroidered Potli Bag', 'एम्ब्रॉयडरी पोटली बैग', 'bag', 59900, '/products/bag2.webp', 60),
('Tote Handbag', 'टोट हैंडबैग', 'bag', 149900, '/products/bag3.webp', 20),
('Oxidised Jhumka Earrings', 'ऑक्सीडाइज़्ड झुमके', 'accessory', 29900, '/products/acc1.webp', 100),
('Silk Dupatta', 'सिल्क दुपट्टा', 'accessory', 49900, '/products/acc2.webp', 45),
('Bangles Set (6 pcs)', 'चूड़ी सेट (6 पीस)', 'accessory', 39900, '/products/acc3.webp', 80);
