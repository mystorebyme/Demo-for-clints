# Testing & Verification Guide (`docs/TESTING.md`)

## Automated Test Suites

### 1. Frontend Unit & Integration Tests (`frontend/tests/frontend.test.ts`)
Covers:
- Catalog presence across `kurti`, `bag`, and `accessory` categories with `is_demo` flag
- Disk verification of all SVG product illustrations in `frontend/public/products/`
- Category & stock filtering, English + Hindi search, price sorting, and pagination
- 100% key parity between `en.json` and `hi.json`
- Indian mobile number (`^[6-9][0-9]{9}$`) and 6-digit PIN code validation
- Server-side cart validation, order idempotency, payment confirmation, replay protection, and amount mismatch handling

Run:
```bash
cd frontend && npm run typecheck && npm test
```

### 2. Backend API & Security Tests (`backend/tests/backend.test.js`)
Covers:
- `/api/health` and `/api/openapi.json`
- `/api/products` and `/api/products/:id`
- `/api/cart/validate` integer paise math
- `/api/create-order` idempotency keys, out-of-stock (`409`) handling, and 240s QR session expiry
- `/api/webhooks/razorpay` HMAC-SHA256 raw-body verification, invalid signature rejection (`400`), confirmation, and replay protection
- `/api/admin/*` timing-safe token auth (`401` vs `200`), 4-Tier Fallback switching (`503` in Tier 4), and audit logs

Run:
```bash
cd backend && npm run lint && npm test
```

### 3. Payment Event Worker Tests (`automation-worker/tests/worker.test.js`)
Covers:
- Event ID deduplication and single-transaction-per-order enforcement
- Amount and currency mismatch detection + unmatched order alerting
- Dry-run mode (`DRY_RUN=true`) and bounded exponential backoff retry recovery

Run:
```bash
cd automation-worker && npm run lint && npm test
```
