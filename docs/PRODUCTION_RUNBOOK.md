# Production runbook

## Pre-launch checklist

- [ ] Supabase project created; migration applied; RLS verified.
- [ ] Stripe products/prices created in live mode matching expected amounts and GBP.
- [ ] Webhook endpoint registered with the four required events; signing secret stored as Worker secret.
- [ ] Cloudflare Worker environments (`staging`, `production`) configured with public vars and secrets.
- [ ] Custom domain, TLS and DNS verified.
- [ ] GitHub production environment protected; required reviewers set; secrets configured.
- [ ] CI passes on the release commit.
- [ ] Manual smoke test of sign-up, sign-in, checkout (test mode first), webhook delivery and entitlement grant.

## Deployment

1. Merge to `main`.
2. Confirm the `verify` job passes.
3. The `deploy-production` job deploys via Wrangler.
4. Watch Cloudflare logs and Stripe webhook delivery dashboard for the first 30 minutes.

## Rollback

- Revert the commit and re-deploy, or use Wrangler versions to roll back the Worker.
- Do not roll back the database schema without a tested down migration.

## Incident response

- Payment not granted: check Stripe webhook delivery, signature verification logs, and `webhook_events` / `orders` / `entitlements` tables.
- Auth issues: confirm Supabase redirect allowlist and cookie settings on the Worker.
- Rate limit: review Cloudflare WAF rules and the placeholder limiter.
