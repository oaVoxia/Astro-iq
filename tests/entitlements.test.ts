import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hasActiveEntitlement, addUtcDays } from '../lib/entitlements/access.ts';

test('active entitlement inside window is allowed', () => {
  const now = new Date('2026-10-11T12:00:00Z');
  const rows = [{ status: 'active', starts_at: '2026-10-01T00:00:00Z', expires_at: '2026-10-31T00:00:00Z' }];
  assert.equal(hasActiveEntitlement(rows, now), true);
});

test('expired entitlement is denied', () => {
  const now = new Date('2026-11-01T00:00:00Z');
  const rows = [{ status: 'active', starts_at: '2026-10-01T00:00:00Z', expires_at: '2026-10-31T00:00:00Z' }];
  assert.equal(hasActiveEntitlement(rows, now), false);
});
