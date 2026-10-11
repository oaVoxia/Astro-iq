# Architecture

Astroiq is a Next.js App Router application deployed to Cloudflare Workers via the OpenNext adapter. Authentication and relational data live in Supabase. Payments are processed by Stripe in one-time Checkout mode.

## Request flow

1. Browser hits a Cloudflare Worker route.
2. Middleware refreshes the Supabase session cookie via `@supabase/ssr`.
3. Server Components and Route Handlers read the validated user with `supabase.auth.getUser()`.
4. Entitlement checks run server-side against RLS-protected tables.
5. Checkout is initiated from a Route Handler that maps a tier key to a server-owned Stripe Price ID.
6. Stripe redirects the browser; fulfillment happens only in the signed webhook handler.

## Data model

- `profiles` — display name linked to `auth.users`.
- `orders` — intent records with tier, duration, amount and status.
- `payments` — verified Stripe payment records.
- `entitlements` — time-bounded access windows derived from verified payments.
- `webhook_events` — idempotency log for Stripe event IDs.
- `audit_logs` — append-only operational trail.

All tables have row-level security. Ordinary users can read their own rows; writes to commercial tables are restricted to the service role used only inside the verified webhook.

## Security boundaries

- Public keys (`NEXT_PUBLIC_*`) are embedded in the client. Protect data with RLS, never with obscurity.
- Service-role and Stripe secrets never leave the server/Worker environment.
- The webhook verifies the Stripe signature before any side effect and records the event ID first.
- Redirects are restricted to the configured origin.
