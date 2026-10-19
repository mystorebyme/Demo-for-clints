# READFIRST.md — State & Handoff Tracker

**Last Updated:** 2026-10-19 (UTC)
**Current Implementation Phase:** Phase 0 Completed (Repository Audit & Structure Consolidation) → Proceeding to Phase 1 (Fashion E-Commerce Frontend)
**Active Branch:** `arena/2b4d115e-demo-for-clints`

---

## 1. Phase 0 Repository Audit Findings

### 1.1 Starting Repository State
At baseline (`7f21605`), the repository contained four uploaded directories:
- `Cloud prompt/` (no trailing space): `READFIRST.md`, `docker-compose.yml`
- `Cloud prompt /` (with trailing space): `frontend/`, `backend/`, `database/schema.sql`
- `GPT PROMPT/GPT COMMAND .MD`: Master engineering specification (Phases 0–15)
- `Gemini prompt/prompt for giid ewebsite every thing GEMINI  .md`: Master Blueprint (Parts 1–3)

### 1.2 Baseline Build & Syntax Verification
- **Frontend (`Cloud prompt /frontend`)**:
  - `npm ci` → Installed 117 packages (`next@14.2.5`, `react@18.3.1`, `zustand@4.5.4`, `socket.io-client@4.7.5`, `tailwindcss@3.4.6`, `typescript@5.5.3`).
  - `npm run build` → Passed baseline Next.js production build.
- **Backend (`Cloud prompt /backend`)**:
  - `npm ci` → Installed 119 packages (`fastify@4.28.1`, `@fastify/cors@9.0.1`, `@fastify/helmet@11.1.1`, `pg@8.12.0`, `ioredis@5.4.1`, `socket.io@4.7.5`, `axios@1.7.2`, `dotenv@16.4.5`).
  - `node --check server.js routes/index.js controllers/*.js services/*.js config/*.js` → Passed syntax verification.

### 1.3 Identified Defects & Missing Modules at Baseline
1. **Split Directory Path Defect**: `Cloud prompt/docker-compose.yml` referenced `./backend`, `./frontend`, and `./database/schema.sql`, which lived in `../Cloud prompt /` (with a trailing space), breaking Docker builds from `Cloud prompt/`.
2. **Missing Root Configuration Files**: No `.gitignore` or `.env.example` existed in the repository (despite `READFIRST.md` referencing `cp .env.example .env`).
3. **Hardcoded `http://localhost:5000` in Frontend (`lib/store.ts`)**: Browser code called `http://localhost:5000` directly when `NEXT_PUBLIC_API_URL` was unset, breaking remote/preview browser access.
4. **Missing Product Assets (`frontend/public/products/`)**: `schema.sql` referenced `/products/kurti1.webp` through `/products/acc3.webp`, none of which existed in `frontend/public/products/`.
5. **Incomplete Phase 1 Frontend**:
   - Missing Hero section, Category navigation cards, Featured products showcase, and Footer.
   - Missing Product Detail route (`/products/[id]`) with image gallery, bilingual descriptions, fabric/care metadata, size selection, quantity controls, and related items.
   - Missing catalog sorting (price low-to-high, high-to-low, newest, alphabetical), stock filter, and pagination.
   - Missing stock status badges (In Stock, Low Stock, Out of Stock) and Demo Merchandise transparency labeling.
   - Missing server-validated cart subtotal verification and delivery breakdown on `/cart`.
   - Missing structured checkout validation (PIN code, city/state, field labels, order summary, idempotency key) on `/checkout`.
   - Missing 4-minute (240s) server-synchronized countdown timer, dynamic QR display, status progression stepper, and manual refresh fallback on `/order/[orderId]`.
   - Missing automated frontend tests (`vitest`), `typecheck`, and `lint` scripts in `frontend/package.json`.

### 1.4 Phase 0 Actions Completed
- Consolidated canonical repository structure at root (`frontend/`, `backend/`, `database/`, `docker-compose.yml`, `READFIRST.md`, `.env.example`, `.gitignore`) while preserving original uploaded folders (`Cloud prompt/`, `Cloud prompt /`, `GPT PROMPT/`, `Gemini prompt/`).
- Added `.gitignore` and `.env.example` with safe development-only placeholders.

---

## 2. Phased Implementation Plan

- **Phase 0 (Completed)**: Repository audit, baseline checks, root structure consolidation, `.gitignore`, `.env.example`, `READFIRST.md`.
- **Phase 1 (In Progress)**: Complete Mobile-First Fashion E-Commerce Frontend (`frontend/`):
  - **Step 1A**: Bilingual demo catalog (`lib/catalog.ts`), high-craft SVG product illustrations (`public/products/`), complete English & Hindi translations (`public/i18n/en.json`, `public/i18n/hi.json`), relative API routing + Next.js API route handlers (`/api/products`, `/api/products/[id]`, `/api/cart/validate`, `/api/create-order`, `/api/orders/[orderId]`, `/api/dev/mock-pay`, `/api/admin/*`) with backend proxy & standalone in-memory store.
  - **Step 1B**: Responsive Header (navigation, search link, EN/HI toggle, cart badge, Demo Catalog banner), Footer, Hero Section, Category Cards, and enhanced `ProductCard`.
  - **Step 1C**: Homepage & Catalog (`/`) with search, category filter, stock toggle, sorting, pagination, loading/empty/error states, and Product Detail Page (`/products/[id]`) with image gallery, size/qty selector, bilingual specs, and related items.
  - **Step 1D**: Shopping Cart (`/cart`) with server-validated totals, Checkout (`/checkout`) with Indian phone/PIN validation and idempotency key, Real-Time Order Status & 4-Minute Dynamic QR Bridge (`/order/[orderId]`), Admin Dashboard (`/admin`), plus `not-found.tsx`, `robots.ts`, `sitemap.ts`.
  - **Step 1E**: TypeScript check (`tsc --noEmit`), ESLint, Vitest unit & integration tests, production build (`next build`), and live preview verification.
- **Phase 2 & 3 (Next)**: Database migrations, repository layer, Fastify REST API enhancements, Redis idempotency & locking, OpenAPI docs, and backend test suite.
- **Phase 4–7 (Planned)**: Authorized payment gateway abstraction, webhook signature verification, real-time checkout sync, and payment-event worker.
- **Phase 8–15 (Planned)**: Telegram notification service, Admin audit logs, 4-Tier Fallback state machine, Docker Compose hardening, and final end-to-end verification.
