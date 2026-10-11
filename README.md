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

Cloudflare's current Next.js guide also documents `vinext` as its preferred path for new projects. This starter uses OpenNext to preserve the conventional Next.js runtime/API surface. Validate required Next.js features in a Workers preview before committing to the adapter; switch to `vinext` if it passes the compatibility proof of concept and is preferable for the deployment you want.

## Included

- Responsive landing, features and pricing pages
- Purple/blue dark design system
- Sign-up, sign-in, email callback and sign-out
- Protected dashboard and account view
- Three price IDs and server-side price validation
- Checkout Session creation from server-owned tier mapping
- Signed Stripe webhook verification
- Transactional PostgreSQL RPCs for idempotent fulfillment and refunds
- UTC entitlement windows and extension of existing access
- Supabase migration with RLS policies
- Cloudflare Wrangler config and GitHub Actions workflow
- Security headers, safe redirect helper, health route, tests and deployment docs

## Local setup

Requirements: Node.js 22+, npm, a Supabase project and a Stripe account.

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and fill the required values. Keep all server secrets out of browser code and source control.

3. Apply the database migration to your Supabase project:

   ```bash
   # With Supabase CLI linked to the correct project
   supabase db push
   ```

   Or run `supabase/migrations/202610110001_initial_schema.sql` through the SQL migration workflow for your project. Use a staging project first.

4. In Stripe test mode, create three **one-time** GBP prices matching these values exactly:

   | Tier key | Duration | Amount | Environment variable |
   |---|---:|---:|---|
   | `starter` | 30 days | £29.00 | `STRIPE_PRICE_30D` |
   | `professional` | 90 days | £69.00 | `STRIPE_PRICE_90D` |
   | `annual` | 365 days | £199.00 | `STRIPE_PRICE_365D` |

   The API rejects a recurring price, a wrong currency or a price whose amount differs from the published amount. Change both the UI and the server-side expected amount if you change pricing.

5. Configure a Stripe webhook endpoint pointing to `/api/webhooks/stripe`. Subscribe to:
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
   - `checkout.session.async_payment_failed`
   - `charge.refunded`

   Use the webhook signing secret for that environment. Use Stripe CLI to forward events during local development.

6. In Supabase Auth settings, set the site URL to the local origin and add the exact `/auth/callback` URL to the redirect allowlist. For production, use only the canonical Astroiq domain.

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
7. Set Cloudflare WAF/rate-limiting rules for `/api/checkout`, `/api/webhooks/stripe` (do not challenge legitimate Stripe requests), `/sign-in` and `/sign-up`. Keep the webhook endpoint exempt from browser challenges while requiring valid Stripe signatures at the application layer.
8. Verify TLS, custom-domain routing, logs and rollback procedure before accepting live payments.

Deploy commands (after credentials and bindings are configured):

```bash
npm run preview
npm run deploy:staging
npm run deploy:production
```

Use a staging Supabase project and Stripe test mode for the staging deployment. Build-time public environment variables must match the target environment.

## CI/CD

`.github/workflows/ci.yml` runs dependency installation, lint, type-check, tests and build. A push to `main` can deploy production through a protected GitHub `production` environment. Configure these GitHub variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL`. Configure secrets: `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`. Review and pin third-party GitHub Actions to immutable commit SHAs before production use.

The workflow uses `npm install` because a lockfile could not be generated in the offline authoring environment. **Before launch, run `npm install` in a network-enabled environment and commit `package-lock.json`, then switch CI back to `npm ci`.** This is a release blocker for reproducible builds.

## Access and refund semantics

- Access is granted only from a verified Stripe webhook, never from the success redirect.
- The server maps a tier to a configured Stripe Price ID; the browser never supplies price or duration.
- Entitlements use UTC timestamps and a half-open interval: `starts_at <= now < expires_at`.
- Buying another pass schedules it after the latest active entitlement expiry.
- A full refund revokes the entitlement attached to that order. Partial refunds are recorded but do not revoke access automatically.
- Refund events that arrive before payment records are persisted fail and ask Stripe to retry, rather than silently losing the refund.
- The legal refund policy and customer support process must be finalised before live launch.

## Important scope note

The dashboard is an authenticated workspace scaffold with sample visual data; it is not a completed financial-data analytics engine. No bank integrations, market data feeds, regulated advice, or verified analytics are included. Define the actual Astroiq core product before marketing those capabilities.
