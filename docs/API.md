# API Reference (`docs/API.md`)

 An OpenAPI 3.0 specification is served live at `GET /api/openapi.json`.

## Public Endpoints

### `GET /api/health`
Returns service health and active fallback tier (`1`–`4`).

### `GET /api/products`
Returns all catalog products with `price_paise` and `stock`.

### `GET /api/products/:id`
Returns a single product by integer ID (`404` if not found).

### `POST /api/cart/validate`
Validates cart items against authoritative server prices and current stock.
- **Request Body**: `{ "items": [{ "id": 1, "qty": 2, "size": "M" }] }`
- **Response**: `{ "success": true, "subtotalPaise": 159800, "totalPaise": 159800, "currency": "INR", "items": [...], "warnings": [] }`

### `POST /api/create-order` (alias: `POST /api/orders`)
Creates a server-authoritative order and locks a 240-second (4-minute) payment session.
- **Headers**: `x-idempotency-key: <unique-key>` (optional, recommended)
- **Request Body**:
```json
{
  "customer": {
    "name": "Priya Sharma",
    "phone": "9876543210",
    "address": "Flat 12, Bapu Nagar, Jaipur, Rajasthan, PIN: 302015"
  },
  "items": [{ "id": 1, "qty": 1, "size": "M" }]
}
```

### `GET /api/orders/:orderId` (alias: `GET /api/orders/:orderId/status`)
Returns current order status (`PENDING`, `CONFIRMED`, `EXPIRED`, `FAILED`), `amountPaise`, `expiresAt`, and `qrPayload`.

### `POST /api/webhooks/razorpay`
Verifies `x-razorpay-signature` using HMAC-SHA256 over the raw request buffer and confirms the order idempotently.

---

## Admin Endpoints (Header: `x-admin-token: <ADMIN_TOKEN>`)
- `GET /api/admin/orders`: Lists recent 100 orders and current product inventory.
- `GET /api/admin/notification-target`: Returns current Telegram Chat ID from `system_settings`.
- `PUT /api/admin/notification-target`: Updates Telegram Chat ID live and sends a test message.
- `POST /api/admin/products`: Creates a new catalog product.
- `PUT /api/admin/products/:id`: Updates product `name`, `price_paise`, or `stock`.
- `GET /api/admin/fallback-tier` & `PUT /api/admin/fallback-tier`: Inspects or switches the active 4-Tier Fallback level (`1`–`4`).
- `GET /api/admin/audit-logs`: Returns recent administrative audit log entries.
