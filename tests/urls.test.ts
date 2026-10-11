import { test } from 'node:test';
import assert from 'node:assert/strict';
import { safeReturnUrl } from '../lib/security/urls.ts';

test('allows same-origin relative path', () => {
  assert.equal(safeReturnUrl('/dashboard', 'https://astroiq.example'), 'https://astroiq.example/dashboard');
});

test('rejects external origin', () => {
  assert.equal(safeReturnUrl('https://evil.example', 'https://astroiq.example'), 'https://astroiq.example/dashboard');
});
