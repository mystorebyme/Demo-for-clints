# READFIRST.md - State & Handoff Tracker

Update this file every time you finish a task or open a PR.

## 1. Completed Modules
- **database/schema.sql**: users, products (price in paise), orders, payments, system_settings + sample catalog. `payments.gateway_payment_id` is UNIQUE (duplicate/replay protection).
- **backend/** (Fastify 4, CommonJS): product list, create-order (server-side pricing + stock check), order status, Razorpay webhook (HMAC-verified raw body, idempotent confirm in one DB transaction with row lock + Redis lock), Redis sliding-window rate limits, Socket.io rooms per order, Telegram notifications (target read from DB on every send), admin API (token protected), 60s expiry job (PENDING older than 30 min -> EXPIRED).
- **frontend/** (Next.js 14 App Router + Tailwind + Zustand): shop with instant client-side search/filter, persistent cart, EN/HI toggle (bundled JSON, zero network), checkout, live order status page (socket + 3s polling), /admin page (change Telegram chat ID live, view orders).
- **docker-compose.yml**: postgres (auto-loads schema), redis, backend, frontend. DB/Redis bound to 127.0.0.1 only.

## 2. Active Dependencies
- backend: fastify ^4.28.1, @fastify/cors ^9.0.1, @fastify/helmet ^11.1.1, ioredis ^5.4.1, pg ^8.12.0, socket.io ^4.7.5, axios ^1.7.2, dotenv ^16.4.5
- frontend: next 14.2.5, react 18.3.1, zustand ^4.5.4, socket.io-client ^4.7.5, tailwindcss ^3.4.6, typescript ^5.5.3

## 3. Tested API Routes
Not yet run against live Postgres/Redis. Verified: backend syntax check, frontend production build. Run the checklist in section 6 first.
- GET /health, GET /api/products
- POST /api/create-order, GET /api/orders/:orderId
- POST /api/webhooks/razorpay (only way to confirm in production)
- POST /api/dev/mock-pay (exists only when PAYMENT_MODE=mock)
- GET/PUT /api/admin/notification-target, GET /api/admin/orders (header `x-admin-token`)

## 4. Pending Tasks for Next Agent
- [ ] Run the manual test checklist (section 6) with `docker compose up --build`.
- [ ] Add real product photos (WebP) in `frontend/public/products/` (cards show an emoji if missing).
- [ ] Set real Razorpay keys, set webhook URL (`https://YOUR_DOMAIN/api/webhooks/razorpay`, events `payment.captured`, `order.paid`), switch `PAYMENT_MODE=razorpay`.
- [ ] Put HTTPS reverse proxy (Caddy/Nginx) in front; set FRONTEND_ORIGIN and NEXT_PUBLIC_API_URL to the real domains.
- [ ] Optional: admin product CRUD, order status emails/SMS, refund flow, automated tests.

## 5. Known Warnings
- Never confirm an order from the browser. Only `services/orderService.js#confirmOrder` may set CONFIRMED, and it is called only from the signed webhook (or the mock endpoint in dev).
- Prices are stored in paise (integers). Never trust prices sent by the client.
- `PAYMENT_MODE=mock` is refused at startup when NODE_ENV=production.
- Webhook signature needs the exact raw body: keep the custom JSON content-type parser in `backend/server.js`.
- NEXT_PUBLIC_API_URL is baked in at frontend build time; rebuild after changing it.
- `schema.sql` DROPs tables. It runs only on first DB init in Docker; do not re-run on production data.

## 6. Manual Test Checklist
1. `cp .env.example .env`, edit passwords/ADMIN_TOKEN, `docker compose up --build`.
2. Open http://localhost:3000, add items, check out, press "Simulate payment" -> status becomes CONFIRMED live.
3. Replay: call mock-pay twice for the same order -> second returns `already_confirmed`.
4. Open /admin with ADMIN_TOKEN, set your Telegram chat ID -> test message arrives (needs TELEGRAM_BOT_TOKEN).
5. Hit POST /api/create-order 11 times in a minute -> 429.
6. Webhook with wrong signature -> 400.
