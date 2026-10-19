# Security & Zero-Trust Payment Verification Policy (`SECURITY.md`)

## 1. Zero-Trust Payment Verification
- **Never Trust the Browser**: Frontend callbacks, query parameters, screenshots, or client-submitted UTR strings can **never** transition an order to `CONFIRMED`.
- **Single Confirmation Path**: Only verified server-side webhook events (`POST /api/webhooks/razorpay` verified with `crypto.timingSafeEqual` HMAC-SHA256 over the exact raw request bytes) or the development-only sandbox endpoint (`POST /api/dev/mock-pay`, strictly blocked when `NODE_ENV=production`) can invoke `confirmOrder()`.

## 2. Authoritative Integer Currency Math
- All prices and payment totals are stored and compared in integer **paise** (`1 INR = 100 paise`).
- Client payloads only submit `{ id, qty, size }`; unit prices are always queried from the database on the server.
- If a payment provider reports an amount that does not match `orders.amount_paise`, the order is immediately flagged as `FAILED` and logged.

## 3. Replay & Duplicate Prevention
- **Order Creation Idempotency**: `x-idempotency-key` prevents duplicate order creation on network retries or double clicks.
- **Payment Confirmation Idempotency**:
  - `payments.gateway_payment_id` has a `UNIQUE` constraint.
  - `payment_events.provider_event_id` deduplicates repeated webhook deliveries.
  - PostgreSQL row-level locking (`SELECT ... FOR UPDATE`) + Redis atomic locks (`SET key val EX 30 NX`) prevent concurrent race conditions.

## 4. Administrative Access Control
- All `/api/admin/*` routes require the `x-admin-token` header validated via constant-time `crypto.timingSafeEqual`.
- `ADMIN_TOKEN` must be at least 16 characters long.
- Administrative state changes (updating Telegram chat ID, changing fallback tiers, modifying products/stock) are recorded in `admin_audit_logs`.
