import test from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword, hashToken, normalizeEmail, randomToken } from '../server/security.js';

test('password hashes are salted and verify only the correct password', async () => {
  const first = await hashPassword('correct horse battery staple');
  const second = await hashPassword('correct horse battery staple');
  assert.notEqual(first, second, 'each password hash should use a fresh salt');
  assert.equal(await verifyPassword('correct horse battery staple', first), true);
  assert.equal(await verifyPassword('wrong password', first), false);
});

test('password hashing rejects weak or oversized passwords', async () => {
  await assert.rejects(() => hashPassword('short'), /12 and 256/);
  await assert.rejects(() => hashPassword('x'.repeat(257)), /12 and 256/);
});

test('opaque tokens have sufficient entropy and are stored as one-way hashes', () => {
  const token = randomToken(32);
  assert.ok(token.length >= 40);
  assert.notEqual(hashToken(token), token);
  assert.equal(hashToken(token), hashToken(token));
});

test('email normalization trims whitespace and lowercases', () => {
  assert.equal(normalizeEmail('  Staff@Example.ORG '), 'staff@example.org');
});
