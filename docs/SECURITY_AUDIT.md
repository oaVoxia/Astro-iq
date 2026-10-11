# Security audit notes

This starter was authored with the following controls:

- Server-side entitlement checks only.
- Stripe webhook signature verification + event idempotency.
- RLS on all commercial tables; service role used only in the webhook path.
- Redirect URL allow-list.
- Security headers via `next.config.ts`.
- No client-side price or duration trust.

## Known limitations / launch blockers

- Full Cloudflare OpenNext build was not executed in the original authoring environment (npm registry timeout). Re-run `npm run build` and the OpenNext compatibility checklist before production.
- In-memory rate limiting is a placeholder; replace with Cloudflare rate limiting or a shared store.
- `package-lock.json` should be committed and CI switched to `npm ci`.
- Legal pages (terms, privacy, refunds) are placeholders; have counsel review.
- Dashboard contains sample data only; do not market unfinished analytics features.

## Recommendations

- Pin GitHub Actions to commit SHAs.
- Enable Cloudflare WAF and bot management on auth and checkout routes.
- Monitor webhook failures and set up alerts.
- Rotate secrets on any exposure.
