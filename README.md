# PingKeeper

Free uptime pinger. Users sign up, add URLs, and the app hits them every 5-60 minutes
so free hosts (Render etc.) don't put the backend to sleep. Works with any backend language,
because it only sends HTTP requests. No payments, no plans.

Stack: Next.js 14, TypeScript, MongoDB (Mongoose).

## Setup
1. `npm install`
2. Copy `.env.example` to `.env` and fill it (free MongoDB Atlas M0 cluster; allow 0.0.0.0/0 in Network Access).
3. `npm run dev` (collections and indexes are created automatically)

## How pinging works
`GET /api/cron/run` (protected by `Authorization: Bearer $CRON_SECRET`) finds monitors that are due,
pings them in batches and stores a log. Logs expire after 7 days through a MongoDB TTL index.
Something external must call it every 5 minutes. Pick one:
- **GitHub Actions**: `.github/workflows/cron.yml` is included. Add repo secrets `APP_URL` and `CRON_SECRET`.
- **cron-job.org** (free, 1 min interval): add a job on `https://YOUR_APP/api/cron/run` with header
  `Authorization: Bearer YOUR_CRON_SECRET`.

Vercel Hobby cron only runs once a day, so don't rely on it for this.

## Deploy
Vercel (free) + MongoDB Atlas M0 (free). Set the env vars, deploy, then set up the scheduler above.
Do not host this on a Render free service, or the pinger itself will sleep.

## Limits
`MAX_MONITORS` env var (default 50 URLs per account). Intervals are in `src/lib/limits.ts`.
Private/internal URLs (localhost, 10.x, 192.168.x) are blocked on purpose (SSRF protection).
Free-tier note: one cron run handles about 25 URLs in parallel, and each ping times out at 25 s.
