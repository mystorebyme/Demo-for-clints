# 03 — ACCOUNT OTP, GST INVOICE, SECURITY & DATABASE WORKFLOW

## 1. Verified Account & 6-Digit Email OTP Engine (`lib/serverStore.ts` & `/api/account`)
- **Session Security**: Every authenticated session receives an HMAC-SHA256 signed token (`zjsess_<base64url(email)>.<hmac>`) verified via `crypto.timingSafeEqual` in `verifyAccountSessionToken()`.
- **4 Supported Login/Verification Actions**:
  1. `action: 'login'` — Email + HMAC password hash check.
  2. `action: 'login_send_otp'` $\rightarrow$ `action: 'login_verify_otp'` — Passwordless 6-digit Email OTP login for existing patrons.
  3. `action: 'register_send_otp'` $\rightarrow$ `action: 'register_verify_otp'` — 2-step verified registration via 6-digit Email OTP.
  4. `action: 'forgot_send_otp'` $\rightarrow$ `action: 'forgot_verify_reset'` — Forgot password reset via 6-digit Email OTP + new password.
- **Single Account Synchronization**:
  - Orders placed with the account email, Wishlist items (`users.wishlist`), and Saved Delivery Addresses (`users.saved_addresses`) are tied to the single authenticated account and persisted to `database/runtime_accounts.json` and PostgreSQL (`users` table).

## 2. Full Order Persistence & Live Admin Revenue Charts
- Every order saves complete CGST Rule 46(b) and logistics metadata:
  - `order_id` (`ORD-YYMMDD-08-NNNN`), `invoice_number` (`INV-KC-2026-NNNN`), `tracking_id` (`TRK-KC-YYMMDD08PPPP`)
  - `items` (with `size`, `qty`, `price_paise`, `line_total_paise`, `hsn_code`), `subtotal_paise`, `discount_paise`, `shipping_paise`, `taxable_paise`, `cgst_paise`, `sgst_paise`, `igst_paise`, `gst_paise`, `supply_type`, `amount_paise`
  - `status`, `fulfillment_status`, `courier_name`, `estimated_delivery`, `tracking_history`, `email_sent`
- `getAdminAnalyticsSummary()` computes live KPI metrics (`totalRevenuePaise`, `totalGstPaise`, `confirmedOrdersCount`, `pendingOrdersCount`, `totalUnitsSold`, `dailySeries`, `categoryBreakdown`, `topProducts`, `lowStockProducts`) directly from the store's orders and catalog.
