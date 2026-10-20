# AI AGENT MASTER PROMPT & E-COMMERCE ARCHITECTURE BLUEPRINT
**Copy and paste this document into any AI Coding Agent to build or replicate this exact Enterprise Luxury E-Commerce System.**

---

## 1. SYSTEM ROLE & CORE MANDATE FOR THE AI AGENT
You are a Principal Full-Stack E-Commerce Architect. Build a production-grade, mobile-first (`90%+` mobile users), bilingual (**English + Hindi**), zero-emoji luxury Indian e-commerce platform inspired by **Zariya Jaipur / Liksha Clothing / The Store of Bufani / Jaypore / Sabyasachi**.

### Mandatory Non-Negotiable Rules:
1. **Zero Emojis Anywhere**: Never use emojis in any UI component, button, badge, toast, or dictionary (`en.json`, `hi.json`). Use clean SVG icons and editorial typography (`Playfair Display` / serif headings + `Inter` sans-serif + `JetBrains Mono` for codes/prices).
2. **Human-Curated Luxury Aesthetic**: Warm ivory & sandstone palette (`#FAF7F2`), royal maroon (`#881337`), deep charcoal (`#0C0A09`), and antique gold (`#D97706`). Never show "Demo" or AI-generated placeholder text to customers.
3. **Mobile-First Navigation & Popup Discipline**:
   - **Top Header**: Brand Logo on left, Verified Profile Pill (`/profile`) + 3-Lines Hamburger Menu Button on right (no Bag clutter in top header; Track, Order Details, Favourites, Language, and Bag live inside the 3-Lines Slide-Over Drawer).
   - **Fixed Bottom Bar**: Strictly 3 primary tabs: `Home`, `Collection`, `Favourites`.
   - **1-Second Animated Add-to-Bag Popup**: When a user taps `Add to Bag`, show a floating confirmation bar above the bottom navigation for **exactly 1.0 second (`1000ms`)**, then smoothly animate it down (`translate-y-14 scale-90 opacity-0 duration-300`) into the bottom line and hide it automatically.
   - **Mandatory `×` (Cross) Close Button on Every Popup/Modal**: Every floating bar, Quick View modal, Compare bar, Compare modal, Size Guide modal, Lightbox, and Sticky Bottom Purchase Bar MUST include an explicit, always-visible `×` close/remove button.
4. **Hidden Admin Access**: `/admin` is accessible **only via direct URL** (`/admin`) and protected by `x-admin-token` header verification (`crypto.timingSafeEqual`). Never show an Admin link on the public storefront.
5. **Friendly Error Boundary**: Never expose raw stack traces, SQL errors, or code to visitors (`app/error.tsx`).

---

## 2. PRODUCT CATALOG, 6-IMAGE GALLERY & DYNAMIC SIZE SYSTEM (`lib/catalog.ts`)
1. **200+ Curated Products (`216` items across 3 categories)**:
   - Categories: `kurti` (`96` items), `bag` (`60` items), `accessory` (`60` items).
2. **6 Studio Images per Product (`gallery.length === 6`)**:
   - Every product has 6 distinct studio angles with captions (`Front Full-Length Look`, `Artisanal Zari & Hand-Block Close-Up`, `Back Drape & Silhouette Fall`, `Sleeve Border & Cuff Detailing`, `Coordinated Dupatta & Hemline View`, `Natural Daylight Studio Editorial`).
   - Product Detail Page (`/products/[id]`) features a 6-thumbnail strip, `‹` / `›` Prev/Next arrows, angle caption pill, and Full-Screen Zoom Lightbox with `×` close button.
3. **Expanded Size System with Dynamic Size-Based Pricing & Live Measurements**:
   - **Kurtis & Suit Sets**: `XS [34]`, `S [36]`, `M [38]`, `L [40]`, `XL [42]`, `XXL [44]`, `3XL [46]` with ascending dynamic price (`getProductPriceForSize(product, size)`) and live per-size garment measurements (`Bust`, `Waist`, `Hip`, `Kurta Length`, `Sleeve Length`, `Bottom Length`) via `getSizeMeasurements(product, size)`.
   - **Handcrafted Bags**: `Compact`, `Regular`, `Large Bridal` with dimensions, strap drop, and phone capacity.
   - **Jewellery & Dupattas**: `2.25m`, `2.50m`, `2.75m` (Dupattas) or `Single Piece`, `Bridal Pair`, `Complete Set` (Jewellery).
4. **Rich Bilingual Product Specifications**:
   - Multi-paragraph craftsmanship story (`long_description` / `long_description_hi`), **`What Is in the Box` (`package_contents`)**, **`Stylist & Occasion Notes` (`styling_notes`)**, 5-star review histogram with sort (`Featured`, `Newest`, `Highest`, `Lowest`), and Direct Store Owner Product Inquiry modal.

---

## 3. AMAZON / FLIPKART-GRADE VERIFIED ACCOUNT & OTP SYSTEM (`/profile` & `/api/account`)
All customer actions are tied to one verified email account backed by HMAC-SHA256 session tokens (`x-account-token`) and persisted in PostgreSQL (`users` table) + `database/runtime_accounts.json`:

### 4 Verified Authentication Flows:
1. **Password Login (`action: 'login'`)**: Email + HMAC-SHA256 password verification.
2. **Passwordless 6-Digit Email OTP Login (`action: 'login_send_otp'` $\rightarrow$ `'login_verify_otp'`)**: Sends a 6-digit OTP to the registered email and signs in upon verification.
3. **New Account Registration via 6-Digit Email OTP (`action: 'register_send_otp'` $\rightarrow$ `'register_verify_otp'`)**: Blocks fake/disposable emails (`validateAuthenticEmail`), sends a 6-digit OTP, and creates the verified account only after OTP verification.
4. **Forgot Password / Reset Password via 6-Digit Email OTP (`action: 'forgot_send_otp'` $\rightarrow$ `'forgot_verify_reset'`)**: Sends a 6-digit password reset OTP and updates the account password hash upon verification.
5. **Official Google OAuth2 ID Token Verification (`action: 'google_oauth'`)**.

### 4-Tab Unified Account Hub (`/profile`):
- **Tab 1 (`Orders & GST Bills`)**: Lists all orders linked to the user's email, live courier AWB tracking, downloadable GST Tax Invoice, and 1-click **Buy Again**.
- **Tab 2 (`Saved Wishlist`)**: Bi-directionally synced with the backend & database whenever the user hearts/unhearts any item, with size selector and **Move to Bag**.
- **Tab 3 (`Saved Addresses / Address Book`)**: Save multiple `Home`, `Work`, and `Other` addresses verified against the Store Owner's PIN serviceability engine; automatically pre-fills on `/checkout`.
- **Tab 4 (`Profile & Password Security`)**: Edit contact details or change account password (`action: 'change_password'`).

---

## 4. ZERO-TRUST CHECKOUT, STRUCTURED NUMBERING & CGST RULE 46(b) TAX INVOICE
1. **Zero-Trust Server Pricing (`validateCartServerSide`)**:
   - Never trust prices, totals, or discounts sent from the browser. Recompute all line totals from authoritative server product & size prices (`paise`).
2. **Non-Public Single-Use & First-Order Promo Codes**:
   - Promo codes (`FIRST10`, `DIWALI20`, `JAIPUR15`, `ROYAL250`) are never advertised publicly on the storefront.
   - Enforce single-use per customer (by email/phone) and `FIRST10` strictly on the customer's first order.
3. **Structured Indian E-Commerce & CGST Rule 46(b) Numbering** (internal format — never show a technical format explanation box to customers):
   - **Order ID**: `ORD-YYMMDD-08-NNNN` (e.g. `ORD-261019-08-1002`)
   - **GST Tax Invoice Number**: `INV-KC-2026-NNNN` (e.g. `INV-KC-2026-1002`, max 16 chars per CGST Rule 46(b))
   - **Confidential 12-Digit Courier AWB Tracking ID**: `TRK-KC-YYMMDD08PPPP` (e.g. `TRK-KC-261019084829`)
4. **Customizable Enterprise GST Invoice (`/order/[orderId]/invoice`)**:
   - Computes HSN `6204` / `4202` / `7117`, Taxable Value, Intra-State `CGST (2.5%) + SGST (2.5%)` vs Inter-State `IGST (5.0%)` based on customer PIN/State vs Seller State (`08 Rajasthan`), Shipping Charges, Discount, and Grand Total in Words (`rupeesInWords`).
5. **Privacy-Protected Public Tracking (`/track`)**:
   - Searching by `TRK-KC-...` shows live 5-stage shipment progress (`ORDER_PLACED` $\rightarrow$ `PACKED` $\rightarrow$ `SHIPPED` $\rightarrow$ `OUT_FOR_DELIVERY` $\rightarrow$ `DELIVERED`) with **zero personal details** (no customer name, phone, email, or street address exposed).

---

## 5. STORE OWNER PIN SERVICEABILITY, MANDATORY ORDER DISPATCH & ADMIN ANALYTICS
1. **Store Owner Delivery & PIN Serviceability Engine (`/api/delivery/check` & `/admin`)**:
   - Validates 6-digit Indian PIN codes against the India Post prefix directory and the Store Owner's configured delivery mode (`ALL_INDIA`, `SELECTED_STATES`, or `CUSTOM_PINCODES`) plus blocked PINs and gibberish-address rejection.
2. **Automatic Order & Inquiry Dispatch to Store Owner (`prakashgothwal370@gmail.com`)**:
   - Every confirmed order automatically dispatches a customer receipt + GST invoice AND a Store Owner fulfillment alert with 1-click WhatsApp/Mailto links.
   - Product pages include an **Ask Store Owner About This Piece** modal (`POST /api/inquiries`) logged directly in `/admin`.
3. **Real-Time Admin Revenue Charts & Database Persistence (`/admin` & `database/`)**:
   - All orders, accounts, stock deductions, and inquiries persist to PostgreSQL (`products`, `users`, `orders`, `product_inquiries`, `store_delivery_config`) and `database/runtime_*.json`.
   - `/admin` displays live KPI cards (`Total Verified Revenue`, `Total GST`, `Confirmed vs Pending Orders`, `Units Sold`, `Low Stock Alerts`), a 7-Day Revenue Bar Chart (`dailySeries`), and Category Sales Mix (`categoryBreakdown`).
