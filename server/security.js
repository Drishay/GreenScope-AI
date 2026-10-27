import crypto from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(crypto.scrypt);
const KEY_LENGTH = 64;

export function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

export function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('base64url');
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

export async function hashPassword(password) {
  if (typeof password !== 'string' || password.length < 12 || password.length > 256) {
    throw new Error('Password must be between 12 and 256 characters');
  }
  const salt = crypto.randomBytes(16);
  const derived = await scrypt(password, salt, KEY_LENGTH, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  return `scrypt$${salt.toString('hex')}$${Buffer.from(derived).toString('hex')}`;
}

export async function verifyPassword(password, storedHash) {
  if (typeof password !== 'string' || typeof storedHash !== 'string') return false;
  const [algorithm, saltHex, hashHex] = storedHash.split('$');
  if (algorithm !== 'scrypt' || !saltHex || !hashHex) return false;
  try {
    const salt = Buffer.from(saltHex, 'hex');
    const expected = Buffer.from(hashHex, 'hex');
    const actual = Buffer.from(await scrypt(password, salt, expected.length, {
      N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024,
    }));
    return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

export function safeUser(row, assignments = []) {
  return {
    id: row.id,
    full_name: row.full_name,
    email: row.email_normalized,
    status: row.status,
    roles: assignments.map((assignment) => ({
      role: assignment.role,
      organisation_id: assignment.organisation_id || null,
      organisation_name: assignment.organisation_name || null,
    })),
  };
}
