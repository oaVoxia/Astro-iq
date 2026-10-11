# QA checklist

## Authentication

- [ ] Sign-up creates user and sends verification email.
- [ ] Unverified user cannot access dashboard.
- [ ] Sign-in works; session persists across refresh.
- [ ] Sign-out clears session.
- [ ] Invalid credentials show a safe error.

## Payments & entitlements

- [ ] Checkout button redirects to Stripe Checkout for the correct price.
- [ ] Success redirect does **not** grant access by itself.
- [ ] Webhook with valid signature creates order, payment and entitlement.
- [ ] Duplicate webhook is idempotent.
- [ ] Active entitlement allows dashboard content; expired/revoked does not.
- [ ] Full refund revokes the matching entitlement.

## Security

- [ ] Open redirect attempts are rejected.
- [ ] Rate limit configuration is present.
- [ ] Security headers present on responses.
- [ ] No secrets in client bundle or logs.

## Accessibility & UI

- [ ] Forms have labels.
- [ ] Error messages are announced.
- [ ] Responsive layout on mobile.
