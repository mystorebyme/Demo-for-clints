# Payment Verification & 4-Minute QR Flow (`docs/PAYMENT_FLOW.md`)

1. **Cart Validation**: Customer views `/cart`, which calls `POST /api/cart/validate` to verify database prices (`price_paise`) and stock availability.
2. **Order & Session Creation**: On `/checkout`, submitting customer details and item IDs/quantities invokes `POST /api/create-order` with `x-idempotency-key`.
3. **240-Second Atomic Session Lock**:
   - The server computes `amount_paise` from the database, generates a unique `orderId`, locks the session in Redis for 240 seconds (`ORDER_EXPIRY_MINUTES=4`), and stores `expires_at` in PostgreSQL.
4. **Real-Time Status & QR Display (`/order/[orderId]`)**:
   - The customer sees the dynamic UPI QR code / gateway prompt and a server-synchronized 4-minute countdown timer.
   - The page subscribes to the order's Socket.IO room (`join(orderId)`) and polls `GET /api/orders/:orderId` every 3 seconds as a fallback.
5. **Cryptographic Webhook Confirmation**:
   - When `POST /api/webhooks/razorpay` receives a signed `payment.captured` or `order.paid` event, it verifies the HMAC-SHA256 signature over `req.rawBody`.
   - Inside a database transaction (`SELECT ... FOR UPDATE`), it verifies `payment.amount === order.amount_paise`, inserts into `payments` (`ON CONFLICT (gateway_payment_id) DO NOTHING`), sets `orders.status = 'CONFIRMED'`, decrements product stock, emits `payment_confirmed` via Socket.IO, and dispatches a Telegram alert to the store owner.
