# Deployment & Operations Guide (`docs/DEPLOYMENT.md`)

## 1. Docker Compose Production Deployment
```bash
cp .env.example .env
# Edit .env with production secrets (POSTGRES_PASSWORD, ADMIN_TOKEN, RAZORPAY_*, TELEGRAM_BOT_TOKEN)
docker compose up --build -d
```
- `postgres-db` and `redis-cache` run on a private Docker bridge network (`internal-net`) and are not exposed publicly.
- Put Caddy or Nginx in front of port `3000` (Frontend) and `5000` (Backend Webhook receiver) with HTTPS enabled.

## 2. Database Migrations & Seeds
For existing databases where Docker init has already run, apply versioned migrations manually:
```bash
psql "$DATABASE_URL" -f database/migrations/001_initial_schema.sql
# Optional demo catalog seed (safe & idempotent):
psql "$DATABASE_URL" -f database/seeds/001_demo_catalog.sql
```

## 3. Backup & Restore
```bash
# Backup
docker exec fashion_postgres pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > backup_$(date +%F).sql

# Restore
cat backup_YYYY-MM-DD.sql | docker exec -i fashion_postgres psql -U "$POSTGRES_USER" "$POSTGRES_DB"
```
