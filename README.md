# High-Speed Bilingual E-Commerce & Payment Verification Bridge (`Kurti Corner`)

Complete, plug-and-play **Next.js 14 + Fastify + PostgreSQL + Redis + Payment Verification Worker** repository for Indian Ethnic Wear (**Kurtis**, **Handbags**, **Fashion Accessories**).

You do **not** need to search for any external template — this repository is **100% complete** across Frontend, Backend, Database Migrations, 4-Minute Dynamic QR Session Bridge, 4-Tier Fallback Engine, Telegram Notifications, Admin Panel, Docker Compose, and Automated Tests. To customize it for any client, you only need to edit `.env` (and optional catalog items).

---

## Quick 3-Step Client Configuration Guide

### 1. Copy & Edit `.env`
```bash
cp .env.example .env
```
Update only these keys in `.env` for your client:
- `ADMIN_TOKEN`: Set a strong secret (minimum 16 characters) for `/admin` login.
- `PAYMENT_MODE`:
  - `mock` — for client demo / sandbox testing (enables the 1-click **"Simulate Verified Server Webhook"** button on the 4-minute QR checkout page).
  - `razorpay` — for live production payments.
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`: Client's Razorpay credentials.
- `TELEGRAM_BOT_TOKEN`: Client's Telegram Bot token from `@BotFather` (Admin Chat ID can be changed anytime live from `/admin` without restarting the server!).

### 2. Run Locally (Zero-Config Preview Mode)
```bash
# Start Frontend (includes built-in API fallback & backend proxy)
cd frontend
npm ci
npm run dev
# Open http://localhost:3000
```
Or run the full stack with Docker Compose:
```bash
docker compose up --build -d
```

### 3. Run All Automated Tests (24/24 Passing)
```bash
# 1. Frontend Tests, Typecheck & Production Build (15 tests)
cd frontend && npm run typecheck && npm test && npm run build

# 2. Backend API, Webhook HMAC, Idempotency & 4-Tier Fallback Tests (6 tests)
cd ../backend && npm run lint && npm test

# 3. Payment Event Worker Tests (3 tests)
cd ../automation-worker && npm run lint && npm test
```

---

## Repository Structure

```text
.
├── READFIRST.md                  # Multi-agent state & verification tracker
├── README.md                     # Quick client setup & configuration guide
├── SECURITY.md                   # Zero-trust security & anti-fraud architecture
├── docker-compose.yml            # 5-service production Docker orchestration
├── .env.example                  # Safe environment variable template
├── frontend/                     # Next.js 14 App Router (EN/HI Bilingual Storefront)
│   ├── app/                      # Home/Catalog, /products/[id], /cart, /checkout, /order/[orderId], /admin
│   ├── components/               # Header, Footer, HeroSection, ProductCard
│   ├── lib/                      # catalog.ts, store.ts (Zustand), serverStore.ts
│   ├── messages/ & public/i18n/  # Complete English (en.json) & Hindi (hi.json) dictionaries
│   ├── public/products/          # 24 custom SVG/WebP product illustrations
│   └── tests/                    # Automated frontend test suite (15 tests)
├── backend/                      # Fastify High-Speed API & Socket.IO Server
│   ├── config/                   # env.js, db.js, redis.js (with automatic in-memory fallback)
│   ├── controllers/              # orderController.js, webhookController.js, adminController.js
│   ├── services/                 # orderService.js, fallbackService.js, razorpay.js, telegram.js, rateLimit.js
│   ├── routes/                   # REST endpoints + OpenAPI 3.0 spec (/api/openapi.json)
│   └── tests/                    # Automated backend API & security test suite (6 tests)
├── automation-worker/            # Authorized Payment Event & Reconciliation Worker
│   ├── src/worker.js             # Deduplication, amount/currency check, retry backoff, dry-run
│   └── tests/worker.test.js      # Automated worker test suite (3 tests)
├── database/
│   ├── migrations/               # 001_initial_schema.sql (non-destructive)
│   ├── seeds/                    # 001_demo_catalog.sql (idempotent)
│   └── schema.sql                # Complete synchronized PostgreSQL schema
└── docs/                         # Detailed Architecture, API, Payment Flow, Deployment & Testing docs
```
