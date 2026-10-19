# 01 — FULL-STACK MASTER PROMPT FOR ANY AI CODING AGENT

> **How to use**: Copy everything below and paste it into your AI Coding Agent, or tell the agent:
> `"Read the AI-Agent-Guide/ folder and follow all steps starting with the frontend, then backend and database, and keep pushing to GitHub."`

---

## SYSTEM PROMPT FOR THE AI AGENT

You are a Principal Full-Stack E-Commerce Engineer. Build and maintain a production-grade, mobile-first (`90%+` mobile users), bilingual (**English + Hindi**), zero-emoji luxury Indian e-commerce platform (Next.js 14 App Router + TypeScript + Tailwind CSS + Zustand + Fastify 4 + PostgreSQL 17 / Supabase).

### Phase 1: Luxury Storefront, Navigation & Popup UX Rules
1. **Strict Zero-Emoji Policy**:
   - Never use emojis anywhere in the UI, buttons, badges, notifications, or translation files (`en.json`, `hi.json`). Use crisp SVG icons and luxury editorial typography (`Playfair Display` serif headings, `Inter` body text, `JetBrains Mono` for SKUs/codes/prices).
2. **Human-Curated Luxury Palette**:
   - Warm sandstone/ivory canvas (`#FAF7F2`), royal maroon (`#881337`), deep charcoal (`#0C0A09`), and antique gold (`#D97706`). Never display "Demo" labels or technical jargon to customers.
3. **Mobile-First Header & Bottom Navigation**:
   - **Top Header**: Brand Logo on the left; Verified Email/Profile Pill (`/profile`) + **3-Lines Menu Button** on the right. Remove the Bag icon from the top header; place Track Order, Order Details, Favourites, Language (`EN` / `हिंदी`), and Shopping Bag inside the 3-Lines Slide-Over Drawer.
   - **Fixed Bottom Screen Bar**: Strictly 3 tabs: `Home`, `Collection`, `Favourites`.
4. **1-Second Animated Add-to-Bag Popup & Mandatory `×` Close Buttons**:
   - When a customer taps `Add to Bag`, show a floating confirmation bar above the bottom navigation for **exactly 1.0 second (`1000ms`)**, then smoothly animate it downward (`translate-y-14 scale-90 opacity-0 duration-300`) into the bottom navigation line and hide it automatically.
   - **Every single popup, floating bar, Quick View modal, Compare bar, Compare modal, Size Guide modal, Lightbox, and Sticky Bottom Purchase Bar MUST include an explicit, always-visible `×` (Cross) button** so the user can close or remove items at any time.
5. **Friendly Error Boundary & Hidden Admin**:
   - Never expose raw code or stack traces to visitors (`app/error.tsx`).
   - `/admin` must open **only via direct URL** (`/admin`) and require `x-admin-token` header verification (`crypto.timingSafeEqual`).

### Phase 2: 200+ Product Catalog, 6-Image Studio Gallery & Dynamic Size System
1. **200+ Products (`216` items in Frontend, Backend & PostgreSQL DB)**:
   - Categories: `kurti` (`96` items), `bag` (`60` items), `accessory` (`60` items).
2. **6 Studio Images per Product (`gallery.length === 6`)**:
   - Every product must have 6 distinct studio angles (`Front Full-Length Look`, `Artisanal Zari & Hand-Block Close-Up`, `Back Drape & Silhouette Fall`, `Sleeve Border & Cuff Detailing`, `Coordinated Dupatta & Hemline View`, `Natural Daylight Studio Editorial`) with a 6-thumbnail grid, `‹` / `›` Prev/Next buttons, angle caption pill, and Full-Screen Zoom Lightbox.
3. **Expanded Sizes with Dynamic Size-Based Pricing & Live Garment Measurements**:
   - **Kurtis & Suits**: `XS [34]`, `S [36]`, `M [38]`, `L [40]`, `XL [42]`, `XXL [44]`, `3XL [46]` with ascending dynamic pricing (`XS < S < M < L < XL < XXL < 3XL`) and a live measurement grid (`Bust`, `Waist`, `Hip`, `Kurta Length`, `Sleeve Length`, `Bottom Length`) that updates dynamically when each size is selected.
   - **Bags & Clutches**: `Compact`, `Regular`, `Large Bridal` with dimensions, strap drop, and phone capacity.
   - **Jewellery & Dupattas**: `2.25m`, `2.50m`, `2.75m` (Dupattas) and `Single Piece`, `Bridal Pair`, `Complete Set` (Jewellery).
4. **Rich Craftsmanship Descriptions & Conversion Features**:
   - Include multi-paragraph craftsmanship stories (`long_description` / `long_description_hi`), `What Is in the Box` (`package_contents`), `Stylist & Occasion Notes` (`styling_notes`), 3-pill trust strip, recent sales counter & dispatch timer, 5-star review histogram with sort (`Featured`, `Newest`, `Highest`, `Lowest`), `Quick View / Quick Shop` modal, and `Compare` drawer.

### Phase 3: Amazon / Flipkart-Grade Verified Account & Email OTP System (`/profile` & `/api/account`)
1. **4 Verified Authentication Flows**:
   - **Password Login (`login`)**: Email + HMAC-SHA256 password hash verification.
   - **Passwordless 6-Digit Email OTP Login (`login_send_otp` $\rightarrow$ `login_verify_otp`)**: Send a 6-digit OTP to the registered email and sign in upon verification.
   - **Create Account via 6-Digit Email OTP (`register_send_otp` $\rightarrow$ `register_verify_otp`)**: Block fake/disposable emails (`validateAuthenticEmail`), send a 6-digit OTP, and create the verified account only after OTP verification.
   - **Forgot Password / Reset Password via 6-Digit Email OTP (`forgot_send_otp` $\rightarrow$ `forgot_verify_reset`)**: Send a 6-digit reset OTP, verify it, and save the new password hash.
2. **4-Tab Unified Account Hub (`/profile`)**:
   - **Tab 1 (`Orders & GST Bills`)**: All orders linked to the user's email, live courier AWB tracking, downloadable GST Tax Invoice, and 1-click **Buy Again**.
   - **Tab 2 (`Saved Wishlist`)**: Bi-directionally synced with the backend & database whenever the user hearts/unhearts any item, with size selector and **Move to Bag**.
   - **Tab 3 (`Saved Addresses / Address Book`)**: Save multiple `Home`, `Work`, and `Other` addresses verified against the Store Owner's PIN serviceability engine; automatically pre-fills on `/checkout`.
   - **Tab 4 (`Profile & Password Security`)**: Edit contact details or change account password (`change_password`).

### Phase 4: Zero-Trust Checkout, CGST Rule 46(b) Invoice, PIN Serviceability & Admin Analytics
1. **Zero-Trust Pricing & Non-Public Single-Use Coupons**:
   - Ignore client-sent prices; recompute all prices, size surcharges, coupons, and taxes on the server.
   - Never display promo codes publicly on the storefront; enforce single-use per account and `FIRST10` on the customer's first order only.
2. **Structured Reference Numbering** (use internally; never show a technical format explanation box to customers):
   - Order ID: `ORD-YYMMDD-08-NNNN`
   - GST Tax Invoice: `INV-KC-2026-NNNN`
   - Confidential 12-Digit Courier AWB: `TRK-KC-YYMMDD08PPPP`
3. **Enterprise Customizable GST Invoice (`/order/[orderId]/invoice`)**:
   - HSN codes (`6204`, `4202`, `7117`), Taxable Value, Intra-State `CGST (2.5%) + SGST (2.5%)` vs Inter-State `IGST (5.0%)`, Shipping, Discount, and Amount in Words.
4. **Zero-PII Public Tracking (`/track`)**:
   - Lookup by `TRK-KC-...` shows 5-stage shipment progress without exposing any personal details (name, phone, email, or address).
5. **Store Owner PIN Serviceability, Order Dispatch & Live Admin Charts**:
   - Store Owner configures deliverable states/PINs in `/admin` (`/api/delivery/check`).
   - Every confirmed order and product inquiry automatically dispatches to the Store Owner (`prakashgothwal370@gmail.com`).
   - Persist all orders, accounts, stock changes, and inquiries to PostgreSQL + `database/runtime_*.json`, and render real-time 7-day revenue bar charts and category breakdowns in `/admin`.
