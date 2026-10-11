# Astroiq

Financial clarity for people who are tired of guessing.

Astroiq is a focused workspace that helps founders and operators see their numbers clearly, make better decisions, and stop living in spreadsheets. Think of it as the calm, opinionated dashboard you actually want to open on Monday morning.

Right now this repo is the production-ready foundation: auth, payments, entitlements, and a clean dark UI — everything you need to start shipping the real product on top.

## Why this exists

Most financial tools are either:
- Too heavy (enterprise software that takes a quarter to implement), or
- Too light (pretty charts with no real access control or billing).

Astroiq sits in the middle. One place to understand your position, runway, and priorities — with proper accounts, paid access, and a security model that won't embarrass you in a diligence call.

## What's already built

This isn't a landing page with a "coming soon" form. It's a working app skeleton:

- Email auth (sign up, sign in, verification, protected routes)
- Three clear access tiers (30 / 90 / 365 days) with Stripe Checkout
- Server-side entitlement checks — the browser never decides who has access
- Idempotent webhooks + refund handling
- Dashboard + account views
- Dark purple/blue design system that doesn't look like every other SaaS template
- Full Supabase schema with RLS, CI workflow, and Cloudflare deployment config

The dashboard currently shows sample data. The plumbing (who paid, who has access, how long it lasts) is real.

## Stack (the short version)

- **Frontend**: Next.js App Router + React + TypeScript
- **Backend / edge**: Cloudflare Workers (via OpenNext)
- **Auth + DB**: Supabase (Auth + Postgres + RLS)
- **Payments**: Stripe (one-time Checkout only — no surprise subscriptions)
- **CI**: GitHub Actions that can deploy straight to production

We chose boring, proven pieces so we can spend time on the actual product instead of fighting infrastructure.

## Quick start

You'll need Node 22+, a Supabase project, and a Stripe account (test mode is fine).

```bash
npm install
cp .env.example .env.local   # fill in your keys
# apply supabase/migrations/202610110001_initial_schema.sql
npm run dev
```

Then run the checks:

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

Full environment and Cloudflare setup details are further down if you need them.

## How access works (the important part)

- Users pick a tier → we create a Stripe Checkout session with a price ID that lives only on the server.
- Payment succeeds → Stripe hits our webhook → we record the order and grant an entitlement.
- The success page does **not** grant access. Only the signed webhook does.
- Entitlements have clear start/end times in UTC. Buying another pass stacks after the current one expires.
- Full refunds revoke access. Partial refunds are recorded but don't auto-revoke.

This is the model we want to defend in any future security or compliance conversation.

## Pricing (current placeholders)

| Tier | Duration | Price | 
|------|----------|-------|
| Starter | 30 days | £29 |
| Professional | 90 days | £69 |
| Annual | 365 days | £199 |

All one-time. Change the numbers in both the UI and the server-side expected amounts if you adjust them.

## Deployment

Configured for Cloudflare with separate staging and production environments. The GitHub Action on `main` can deploy production once you add the required secrets and variables.

See the longer notes below or `docs/PRODUCTION_RUNBOOK.md` before you take real money.

## Current status

This is a solid implementation starter, not a finished product. Local tests pass. The Cloudflare build path should be re-verified in a proper environment (the original authoring setup hit an npm timeout). Security audit notes and known limitations live in `docs/`.

The core product (what the dashboard actually analyzes) is still yours to define. This repo just makes sure the accounts, payments, and access control won't be the thing that slows you down.

## Next

- Wire up real data sources
- Decide the actual insights Astroiq should surface
- Tighten the legal pages
- Ship the first version people can pay for

Questions or want to talk about the product? Open an issue or just reach out.

---

### Technical appendix

<details>
<summary>Environment variables & Stripe setup</summary>

See `.env.example`. Public keys are fine in the client; service role and Stripe secrets stay server-side only.

Create three one-time GBP prices in Stripe that match the amounts above, then set:
- `STRIPE_PRICE_30D`
- `STRIPE_PRICE_90D`
- `STRIPE_PRICE_365D`

Webhook endpoint: `/api/webhooks/stripe`  
Events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `charge.refunded`

</details>

<details>
<summary>Cloudflare & CI notes</summary>

The app is set up for the OpenNext Cloudflare adapter. Public vars and secrets must be configured per Worker environment. The CI workflow currently uses `npm install` (lockfile wasn't generated in the original offline environment). Commit a `package-lock.json` and switch to `npm ci` before launch.

Full runbook: `docs/PRODUCTION_RUNBOOK.md`  
Security notes: `docs/SECURITY_AUDIT.md`

</details>
