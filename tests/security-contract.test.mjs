import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('webhook route verifies signature', () => {
  const src = readFileSync(new URL('../app/api/webhooks/stripe/route.ts', import.meta.url), 'utf8');
  assert.match(src, /constructEvent/);
});

test('checkout route does not trust client price', () => {
  const src = readFileSync(new URL('../app/api/checkout/route.ts', import.meta.url), 'utf8');
  assert.match(src, /tierConfig|STRIPE_PRICE/);
  assert.doesNotMatch(src, /body\.price|body\.amount/);
});
