        Do a final independent audit of the entire repository, not just the changed files. Verify every requirement against actual implementation, inspect the Git diff, run every available automated check, test the critical customer checkout flow and payment webhook flow, and fix all implementation-caused errors. Confirm that database migrations, environment variables, Docker services, frontend API URLs, WebSocket authorization, Telegram configuration, and READFIRST.md are consistent. Identify every mock, stub, untested feature, and external dependency. Do not claim 100% completion unless every required acceptance criterion has evidence. Finish with a concise but complete report of verified features, exact test results, remaining blockers, and the next actionable steps.
        
        
        
        
         You are the Lead Full-Stack Engineer, Software Architect, QA Engineer, Security Engineer, and DevOps Engineer for my project: High-Speed E-Commerce & Payment Verification Bridge.

MISSION:
Build a complete, production-oriented, mobile-first fashion e-commerce application with a secure payment integration, order verification, real-time order status, Telegram notifications, admin dashboard, Docker infrastructure, automated tests, and comprehensive documentation.

EXECUTION POLICY:
Do not stop at planning. Inspect the existing repository, write an implementation plan, implement the application, run tests, repair failures, review security, and continue until the achievable scope is working. Never claim a feature is complete unless its implementation and relevant tests have been verified. Work incrementally and preserve existing useful functionality.

PHASE 0 — REPOSITORY AUDIT
1. Inspect the current directory, Git status, branches, files, package manifests, README, READFIRST.md, environment examples, existing tests, database schema, and deployment configuration.
2. Identify the actual framework, existing implementation, broken modules, duplicate code, missing files, and security risks.
3. Do not overwrite existing user work or delete data. Do not run destructive SQL or reset databases.
4. Create or update READFIRST.md with the actual starting state and a phased plan.
5. Record the baseline test/build status and distinguish pre-existing failures from new failures.

PROJECT STACK
- Frontend: Next.js App Router, TypeScript, Tailwind CSS.
- State: React state or Zustand where justified; persist non-sensitive cart data locally.
- Backend: Node.js, TypeScript, Fastify, REST APIs.
- Database: PostgreSQL with versioned migrations.
- Cache and coordination: Redis.
- Realtime: Socket.IO or Server-Sent Events, with authenticated order-scoped updates.
- Notifications: Telegram Bot API.
- Tests: Vitest or Jest, API integration tests, database tests, and Playwright for critical browser journeys.
- Infrastructure: Docker Compose, health checks, environment variables, structured logging.
Use compatible, maintained package versions and lockfiles. Prefer a single consistent TypeScript configuration for the Node.js services unless the existing repository has a justified alternative.

REQUIRED REPOSITORY STRUCTURE
my-fashion-store/
  READFIRST.md
  README.md
  SECURITY.md
  docker-compose.yml
  .env.example
  .gitignore
  frontend/
    app/
    components/
    hooks/
    lib/
    messages/
    public/
    tests/
    package.json
  backend/
    src/
      config/
      routes/
      controllers/
      services/
      repositories/
      middleware/
      schemas/
      sockets/
      utils/
      tests/
    package.json
    Dockerfile
  automation-worker/
    src/
      workers/
      providers/
      services/
      tests/
    package.json
    Dockerfile
  database/
    migrations/
    seeds/
    schema.sql
  docs/
    ARCHITECTURE.md
    API.md
    PAYMENT_FLOW.md
    SECURITY.md
    DEPLOYMENT.md
    TESTING.md

Adapt this structure to the existing repository where sensible. Do not create empty files just to satisfy the tree. Every claimed module must contain useful implementation or explicitly documented scaffolding.

PHASE 1 — FASHION E-COMMERCE FRONTEND
Build a polished, responsive, mobile-first online store for:
- Kurtis
- Handbags
- Fashion accessories

Required functionality:
1. Homepage with a professional hero section, category navigation, featured products, and clear calls to action.
2. Product listing with category filters, search, sorting, pagination, stock status, and loading/empty/error states.
3. Product details with image gallery, price, description, stock, quantity selection, and add-to-cart.
4. Shopping cart with quantity changes, item removal, subtotal, and server-validated totals.
5. Checkout with customer details, delivery address, phone validation, order summary, and payment method.
6. English/Hindi toggle with persistent language preference and complete translation coverage for visible UI.
7. Accessible forms, keyboard navigation, semantic HTML, mobile layouts, image optimization, and useful error messages.
8. No fake testimonials, invented reviews, misleading discounts, or fake payment-success screens.

Create realistic seed products only when clearly identified as demo data. Do not use placeholder product images as if they were genuine merchandise.

PHASE 2 — DATABASE AND DATA INTEGRITY
Create versioned PostgreSQL migrations for:
- users or customer records where required
- products and categories
- inventory
- orders and order_items
- payments and payment_events
- notification settings
- admin users and audit logs
- idempotency records where appropriate

Requirements:
1. Use primary keys, foreign keys, NOT NULL constraints, appropriate CHECK constraints, and indexes.
2. Use NUMERIC for currency storage, never floating-point arithmetic for money.
3. Store currency explicitly, defaulting to INR when appropriate.
4. Use unique provider transaction IDs and payment references where applicable.
5. Use explicit order and payment state machines.
6. Use transactions and row-level locking or conditional updates for inventory and payment-state changes.
7. Prevent duplicate order creation and duplicate webhook processing through idempotency and database constraints.
8. Add created_at and updated_at fields where appropriate.
9. Keep schema.sql synchronized with migrations.
10. Provide safe seed scripts that do not run automatically against production.
11. Never put real passwords, API keys, or tokens into SQL files or source control.

PHASE 3 — BACKEND API
Implement and document endpoints such as:
- GET /api/health
- GET /api/products
- GET /api/products/:id
- POST /api/orders
- GET /api/orders/:orderId
- POST /api/payments/create-session
- POST /api/payments/webhook/:provider
- GET /api/orders/:orderId/status
- Admin-only product, inventory, order, settings, and audit endpoints.

Use a consistent response format, request validation, pagination, centralized error handling, request IDs, and OpenAPI documentation.

Security requirements:
- Validate all incoming data with a schema library.
- Calculate prices and totals on the server using database product prices.
- Never trust frontend prices, frontend payment status, or client-supplied transaction verification.
- Apply rate limits to login, checkout, order creation, and payment endpoints.
- Authenticate administrative operations and enforce authorization on every protected resource.
- Prevent IDOR, SQL injection, XSS, CSRF where applicable, mass assignment, and sensitive-data leakage.
- Do not expose stack traces or secrets in public API responses.
- Configure CORS with explicit trusted origins.
- Use secure cookies and suitable session handling when cookie-based authentication is used.

PHASE 4 — AUTHORIZED PAYMENT INTEGRATION
Implement a provider abstraction and a documented sandbox integration using a legitimate payment gateway that supports the target merchant and currency. Verify current provider documentation before choosing its exact API.

Required flow:
1. Create an order on the server.
2. Calculate the final payable amount using trusted database data.
3. Create a payment session through the provider.
4. Save the provider reference and payment state in PostgreSQL.
5. Display only the payment URL, QR payload, or payment instructions returned by the authorized provider.
6. Receive payment webhooks through a public HTTPS endpoint.
7. Verify webhook signatures using the provider's documented signing procedure and raw request body where required.
8. Enforce idempotent webhook processing and unique transaction references.
9. Verify the provider transaction's amount, currency, merchant reference, and final status.
10. Confirm an order only after successful server-side verification.
11. Handle pending, failed, cancelled, expired, refunded, and disputed payments explicitly.
12. Notify the customer and administrator after committed state transitions.

Never mark an order paid because a browser says success, a screenshot looks genuine, or a client submits a UTR. Do not expose merchant secrets to the frontend.

The original concept requests a four-minute QR session. Implement a 240-second expiry only if the chosen provider supports compatible payment-session expiration. Otherwise show the actual provider expiry and clearly document the limitation. Use an absolute server-generated expiry timestamp rather than trusting a client countdown.

Do not automate unauthorized third-party game logins, defeat CAPTCHA or Cloudflare protections, use stolen or shared session cookies, or scrape private transaction ledgers. Use official provider APIs, signed webhooks, authorized merchant exports, or a documented sandbox. Do not invent provider endpoints or pretend mock data represents real payments.

PHASE 5 — REDIS AND CONCURRENCY
Implement:
- Atomic idempotency for order and payment-session creation.
- Redis locks only where necessary, with bounded TTLs and safe release.
- Database constraints and transactional updates as the final source of truth.
- A bounded queue or worker concurrency limit for background jobs.
- Timeouts, retries with backoff, jitter, and dead-letter handling where appropriate.
- Graceful degradation if Redis becomes unavailable.
- Cleanup of expired sessions and stale locks.

Never rely exclusively on a Redis lock to prevent duplicate payment confirmations. Never match payments solely by amount when multiple orders could share that amount.

Do not use arbitrary micro-decimal amounts such as ₹500.01 as a substitute for reliable transaction references unless the payment provider explicitly supports that payment model and the merchant has validated its compliance. Prefer provider order IDs and transaction IDs.

PHASE 6 — REAL-TIME CHECKOUT
Build a production-quality checkout/status component with:
- order creation through the backend
- payment-session loading state
- provider-authorized QR or payment link
- server-synchronized expiration
- pending, confirming, confirmed, failed, expired, and cancelled states
- reconnect and retry handling
- accessible progress indicators
- a manual status refresh fallback
- proper event cleanup and no duplicate listeners

Authenticate real-time connections and authorize every subscription against the order's ownership. Do not broadcast payment details to all connected clients. Treat real-time messages as notifications of state changes, not as proof of payment.

Do not create an order automatically on every component remount without an idempotency strategy. Do not hardcode localhost URLs into production components.

PHASE 7 — PAYMENT EVENT WORKER
Build a background worker that processes trusted payment-provider webhook events or an authorized transaction feed.

Requirements:
1. Fetch or receive only documented, authorized transaction data.
2. Validate the event and its source.
3. Deduplicate events using provider event IDs and transaction IDs.
4. Match using a trusted provider order/reference ID.
5. Verify amount, currency, merchant, transaction status, and order association.
6. Apply payment and order transitions atomically.
7. Ensure one transaction cannot confirm two orders.
8. Recover safely after process restarts.
9. Use bounded retries and structured error logging.
10. Alert administrators about unmatched transactions and repeated failures without exposing secrets.
11. Add a dry-run mode and deterministic fixtures for testing.
12. Never create fake successful transactions in production.

Use polling only when the provider documents or permits it. Respect provider rate limits and retry guidance. Do not assume that a three-second polling interval is permitted or guarantees instant settlement.

PHASE 8 — TELEGRAM ADMIN NOTIFICATIONS
Implement a Telegram notification service for:
- new order
- verified payment
- failed or expired payment
- unmatched payment event
- worker failure
- system health alerts

Requirements:
- Read the bot token from an environment secret.
- Store an authorized administrator chat ID securely.
- Validate and restrict changes to notification settings to authenticated administrators.
- Use a notification queue or retry strategy where appropriate.
- Prevent duplicate notifications through idempotency keys.
- Escape Telegram message formatting correctly.
- Avoid sending complete addresses, authentication secrets, or unnecessary customer information.
- Never log bot tokens.
- Do not invent WhatsApp integration; document it as a separate provider if later required.

PHASE 9 — ADMIN DASHBOARD
Implement a protected admin area for:
- product creation and editing
- inventory management
- order search and filtering
- payment status inspection
- notification settings
- failed and unmatched payment events
- worker health
- audit history

Require authenticated admin access, server-side authorization, input validation, audit logs, pagination, and safe error handling. Do not create a hidden or hardcoded admin password. Document the secure initial-admin provisioning procedure.

PHASE 10 — FALLBACK AND RESILIENCE
Implement a documented fallback state machine:
Tier 1: Primary configured payment provider.
Tier 2: An independently configured, authorized secondary provider if credentials and merchant onboarding exist.
Tier 3: A safe pending/manual reconciliation workflow using official payment references.
Tier 4: Disable new payment-session creation, preserve orders, display a clear support message, and notify the administrator.

Never silently switch the customer to a different merchant account or unrelated QR. Never invent a QR code, transaction status, provider capability, or payment reference. An unavailable provider must not cause an order to be marked paid.

PHASE 11 — DOCKER AND OPERATIONS
Create a working docker-compose.yml with:
- frontend
- backend-api
- payment-worker
- PostgreSQL
- Redis

Requirements:
- health checks and dependency readiness
- persistent database volume
- private internal network for databases
- non-root application containers where practical
- appropriate restart policies
- configurable ports
- environment variable validation
- production-safe secret handling
- structured logs
- graceful shutdown
- database migration instructions
- backup and restore documentation

Do not publish database or Redis ports publicly by default. Use development-only example credentials only in .env.example and require production secrets through a secure deployment mechanism.

PHASE 12 — TESTING AND PERFORMANCE
Add automated tests for:
- product listing, search, filters, and cart calculations
- order creation and validation
- inventory races and concurrent checkouts
- duplicate idempotency keys
- duplicate webhook events
- invalid webhook signatures
- incorrect amount or currency
- expired sessions
- payment success, failure, refund, and retry
- unauthorized admin access
- order ownership and real-time event isolation
- Telegram retry and notification deduplication
- worker restart and recovery
- database migration and seed safety

Use mocks for external services in unit tests and provider sandbox credentials for integration tests. Never claim a real gateway or production flow was tested if only mocks were used.

Performance goal: target API latency below 50 ms for lightweight internal reads under a defined benchmark environment. Do not guarantee every request will be below 50 ms. Measure p50, p95, and p99 latency, error rates, database query time, throughput, and resource use. Separate provider/network latency from internal API latency. Add an optional load-test script with documented concurrency, duration, and safety limits.

PHASE 13 — ACCESSIBILITY, SEO, AND QUALITY
- Add page metadata, canonical URLs where appropriate, product structured data only when accurate, sitemap, robots.txt, and meaningful page titles.
- Optimize images and font loading.
- Add loading, empty, offline, and error states.
- Check mobile responsiveness, keyboard access, contrast, and form labels.
- Add ESLint, formatting, TypeScript checks, and dependency/security audit instructions.
- Do not add unnecessary dependencies or overengineer a simple feature.

PHASE 14 — READFIRST.md HANDOFF
Update root READFIRST.md after every major phase and before handing off. Include:
1. Actual repository state and architecture.
2. Completed modules and their file paths.
3. Commands executed and their actual outcomes.
4. Active dependencies and versions.
5. Migrations and database state.
6. API routes implemented and tested.
7. Test/build/type-check results, including failures.
8. Environment variables required, without their secret values.
9. Docker startup and shutdown instructions.
10. Remaining tasks and exact next steps.
11. Known warnings, limitations, and security considerations.
12. Last updated date and current implementation phase.

Never claim that an unimplemented module is complete. Distinguish production-ready code from mocks, scaffolding, and sandbox-only functionality.

PHASE 15 — FINAL VERIFICATION
Run the appropriate available commands, adapting them to the repository:
- dependency installation using the committed lockfile
- lint
- formatting check
- TypeScript check
- unit tests
- integration tests
- frontend production build
- backend build
- worker build
- database migration validation
- Docker Compose configuration validation
- critical end-to-end checkout tests
- dependency and secret scanning where available

Fix failures caused by the implementation and rerun the affected checks. If a test requires credentials, an external provider, Docker, or unavailable infrastructure, report that limitation honestly and provide the exact command needed to complete it.

Inspect the final Git diff for accidental deletions, secrets, generated artifacts, debug code, broken imports, insecure defaults, and inconsistent documentation.

DELIVERY REQUIREMENTS
At completion, provide:
1. Executive summary of what was actually built.
2. Final repository tree.
3. Implemented features by phase.
4. Database migration instructions.
5. Exact local setup commands.
6. Required environment variable names.
7. Docker startup instructions.
8. API endpoint list and examples.
9. Test/build results with pass/fail status.
10. Security review findings.
11. Performance benchmark results, if actually measured.
12. Remaining external setup requirements.
13. Updated READFIRST.md.
14. Suggested next task for another agent.

GIT RULES:
Preserve existing user changes. Use small, coherent changes and meaningful commit messages if commits are appropriate. Do not force-push, delete branches, alter repository permissions, deploy to production, spend money, register payment accounts, or publish secrets. Do not push changes to a remote unless explicitly authorized.

FINAL EXECUTION RULE:
Begin by inspecting the repository and identifying the current state. Then implement one phase at a time. After every phase, run relevant checks, repair issues, update READFIRST.md, and continue. Do not stop after producing a plan, code snippets, mockups, or an empty scaffold. If blocked, finish all independent safe tasks and provide a precise blocker report with evidence.

Start now with PHASE 0.       Execute Phase 0 only. Thoroughly inspect the current repository and Git status, identify existing features, defects, dependencies and missing modules, verify the actual project state, and update READFIRST.md with a prioritized implementation plan. Do not overwrite user work. Report findings with file paths and exact next steps.Implement Phase 1 completely in the existing repository. Build the responsive Next.js fashion store, catalog, search, category filters, product detail pages, persistent cart, checkout form, bilingual English/Hindi interface, accessibility and loading/error states. Use real API integration where available and clearly label seed data. Run lint, type-check, tests and production build; fix failures and update READFIRST.md before finishing.Implement Phases 2 and 3 of the master prompt: PostgreSQL migrations, repositories, validated Fastify REST endpoints, transactional order creation, authoritative price calculation, inventory concurrency protection, Redis idempotency and rate limits, and OpenAPI documentation. Add automated unit and integration tests. Verify migrations against a disposable test database where available. Do not drop or reset any existing database. Update READFIRST.md with verified results.Implement Phases 4 through 7 using an authorized payment provider and its documented sandbox/API. First verify provider documentation and required configuration. Implement payment sessions, signature-verified webhooks, idempotent event processing, exact amount/currency/reference checks, safe order state transitions, real-time checkout status, expiration handling and a recoverable payment-event worker. If provider credentials or onboarding are unavailable, finish the adapter, tests and documented configuration without pretending a real payment was processed. Do not bypass CAPTCHA/Cloudflare or scrape unauthorized game ledgers. Update READFIRST.md.Implement Phases 8 through 11. Complete authenticated admin management, secure dynamic Telegram notification settings, idempotent notification delivery, worker health monitoring, documented fallback states, Docker Compose services, private database networking, health checks, graceful shutdown, environment validation, migration instructions and deployment docs. Validate the Compose configuration and add tests. Do not expose database/Redis ports publicly by default. Update READFIRST.md.Perform Phases 12 through 15 as a strict final audit. Run all available lint, formatting, TypeScript, unit, integration, end-to-end, production-build, migration and Docker configuration checks. Test duplicate webhooks, concurrent orders, invalid signatures, incorrect amounts, expired sessions, unauthorized access and order ownership. Fix implementation-caused failures and rerun checks. Review Git diff and secrets. Update READFIRST.md and all docs to match the actual code. Report verified successes, failures, untested external dependencies and exact remaining steps. Do not claim success without evidence.