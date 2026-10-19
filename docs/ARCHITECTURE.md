# Architecture Overview (`docs/ARCHITECTURE.md`)

## System Components
1. **Storefront (`frontend/`)**: Next.js 14 App Router application with Tailwind CSS and Zustand persistent state (`localStorage`). Provides instant English/Hindi switching, client-side filtering/sorting/pagination, server-validated cart totals, and a real-time 240-second (4-minute) QR checkout monitor.
2. **Backend API (`backend/`)**: Fastify 4 REST & Socket.IO server providing sub-50ms product reads, authoritative order creation, sliding-window rate limiting, HMAC-SHA256 webhook verification, 4-Tier Fallback management, and dynamic Telegram notifications.
3. **Payment Event Worker (`automation-worker/`)**: Background event processor that validates, deduplicates, and reconciles authorized payment events with bounded exponential backoff retries and dry-run support.
4. **PostgreSQL (`database/`)**: Relational source of truth for `users`, `products`, `orders`, `order_items`, `payments`, `payment_events`, `system_settings`, and `admin_audit_logs`.
5. **Redis**: Provides 240-second QR session locks, 30-second confirmation mutexes, and sliding-window IP rate limiting, with graceful degradation if Redis is temporarily unreachable.

## 4-Tier Fallback Hierarchy
- **Tier 1**: Primary Payment Gateway / Dedicated Dynamic QR Session
- **Tier 2**: Secondary Authorized Provider / Backup Session Pool
- **Tier 3**: Manual Reference / Pending Reconciliation Workflow
- **Tier 4**: Emergency Maintenance Mode (returns HTTP `503` for new payment sessions with a clear support message and alerts the store admin via Telegram)
