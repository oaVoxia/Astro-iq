# Astroiq — Cloudflare + Supabase + Stripe

A full-stack Next.js / TypeScript starter for Astroiq, styled in midnight navy, electric purple and blue. The application supports authenticated accounts, a dashboard, purchase history, Stripe-hosted one-time checkout, and 30-, 90- and 365-day access entitlements.

> **Launch status:** implementation starter, not yet deployed or production-certified. The local unit tests pass. Dependency installation and the full Next.js/Cloudflare build could not be run in the authoring environment because the npm registry request timed out. See `docs/SECURITY_AUDIT.md` for verified checks, known limitations and launch blockers.

## Stack

- Next.js App Router, React and TypeScript
- Cloudflare Workers with the OpenNext adapter (`@opennextjs/cloudflare`)
- Supabase Auth + PostgreSQL with row-level security
- Stripe Checkout in `mode: "payment"` only
- GitHub Actions CI/CD, Wrangler deployment configuration
- Node's built-in test runner for pure access-control and URL-safety tests

Cloudflare's current Next.js guide also documents `vinext` as its preferred adapter for new projects. This starter uses the established OpenNext adapter so the included middleware, route handlers, cookie-based session refresh and Cloudflare deployment configuration can be validated against the current OpenNext guide before launch.

## What is included

- Marketing pages: home, features, pricing, privacy, terms and refunds
- Email/password sign-up and sign-in
- Server-side auth callback and session refresh
- Protected dashboard and account pages
- Stripe one-time checkout for three access tiers
- Idempotent Stripe webhook processing
- Purchase history and entitlement expiry calculation
- Server-side access gate for premium features
- Rate-limited checkout requests
- Redirect and return-URL validation
- Supabase schema with row-level security
- GitHub Actions workflow for tests, type checking, linting and deployment

## Local setup

1. Copy `.env.example` to `.env.local` and fill in the values.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Start Supabase locally or create a remote project and apply `supabase/migrations/202610110001_initial_schema.sql`.
4. Create three one-time Stripe prices and set their IDs.
5. Configure the Stripe webhook to `https://<your-domain>/api/webhooks/stripe` with the `checkout.session.completed` event.
6. Add the exact `/auth/callback` URL to the redirect allowlist. For production, use only the canonical Astroiq domain.

7. Run:

   ```bash
   npm run dev
   npm test
   npm run typecheck
   npm run lint
   npm run build
   ```

## Environment variables

See `.env.example`. `NEXT_PUBLIC_*` variables are intentionally public and may be embedded in client bundles. The Supabase publishable/anon key is safe to expose only when row-level security is configured correctly. `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` must remain server-side secrets.

`APP_BASE_URL` must be the exact canonical origin, with no trailing path, and must match the browser request `Origin` for checkout. The app is currently configured for GBP. Do not reuse production Stripe keys or a production Supabase service-role key in staging or local environments.

## Cloudflare setup

1. Create the Cloudflare account/domain and verify DNS ownership.
2. Run the OpenNext adapter compatibility test for SSR, middleware/session refresh, route handlers, `cookies()`, Supabase requests and Stripe SDK. Use the current official guide: <https://developers.cloudflare.com/workers/framework-guides/web-apps/opennext/>.
3. Configure the Worker and custom domain. This repository uses `wrangler.jsonc` with separate `staging` and `production` environments.
4. Configure public runtime variables and server secrets for **each Worker environment separately**. Worker environment secrets are not assumed to inherit from the default environment. In the Cloudflare dashboard, set `APP_BASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `NEXT_PUBLIC_APP_URL` to values for the matching environment.
5. For production, configure the canonical public URL and Supabase URL/key as GitHub `production` environment variables so they are present at build time; add `CLOUDFLARE_ACCOUNT_ID` and a least-privilege `CLOUDFLARE_API_TOKEN` as GitHub secrets.
6. Set `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_30D`, `STRIPE_PRICE_90D`, `STRIPE_PRICE_365D`, and `SUPABASE_SERVICE_ROLE_KEY` as Worker secrets in each environment. Do not put secrets in `wrangler.jsonc` or GitHub variables. Example for production (repeat with `--env staging` and staging-only credentials for staging):

   ```bash
   npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY --env production
   npx wrangler secret put STRIPE_SECRET_KEY --env production
   npx wrangler secret put STRIPE_WEBHOOK_SECRET --env production
   npx wrangler secret put STRIPE_PRICE_30D --env production
   npx wrangler secret put STRIPE_PRICE_90D --env production
   npx wrangler secret put STRIPE_PRICE_365D --env production
   ```

7. Deploy from the `main` branch. The included workflow deploys to the staging environment on non-main pushes and to production on `main`.

## Security notes

- All entitlement checks for premium content must happen on the server. Client-side state is presentation only.
- The webhook verifies the Stripe signature and records processed event IDs before side effects.
- Purchase writes use the Supabase service-role client only in the verified webhook path.
- Row-level security prevents ordinary authenticated users from inserting or modifying purchases.
- Checkout return URLs are restricted to the configured application origin.
- Rate limiting is in-memory and suitable for a single Worker isolate. Replace it with a shared limiter before high-volume production traffic.

See `docs/SECURITY_AUDIT.md`, `docs/PRODUCTION_RUNBOOK.md` and `docs/QA_CHECKLIST.md` before launch.

## License

Private starter. Add your preferred license before public distribution.
