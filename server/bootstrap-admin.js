import { getPool, closeDatabase } from './db.js';
import { hashPassword, normalizeEmail } from './security.js';

async function main() {
  const email = normalizeEmail(process.env.BOOTSTRAP_ADMIN_EMAIL);
  const fullName = String(process.env.BOOTSTRAP_ADMIN_NAME || '').trim();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || fullName.length < 2 || typeof password !== 'string' || password.length < 12) {
    throw new Error('Set BOOTSTRAP_ADMIN_EMAIL, BOOTSTRAP_ADMIN_NAME, and BOOTSTRAP_ADMIN_PASSWORD (12+ chars) in your local environment.');
  }

  const db = getPool();
  const existing = await db.query('SELECT id FROM users WHERE email_normalized = $1', [email]);
  if (existing.rowCount) throw new Error('A user with this email already exists; bootstrap will not change existing accounts.');

  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const passwordHash = await hashPassword(password);
    const created = await client.query(
      `INSERT INTO users(email_normalized, full_name, password_hash, status, email_verified_at)
       VALUES ($1,$2,$3,'active',now()) RETURNING id,email_normalized,full_name`,
      [email, fullName, passwordHash],
    );
    await client.query(
      'INSERT INTO role_assignments(user_id, role, organisation_id) VALUES ($1,\'super_admin\',NULL)',
      [created.rows[0].id],
    );
    await client.query(
      `INSERT INTO audit_events(actor_user_id, action, target_type, target_id, metadata_json)
       VALUES ($1,'admin.bootstrap_created','user',$1,$2::jsonb)`,
      [created.rows[0].id, JSON.stringify({ method: 'environment_bootstrap' })],
    );
    await client.query('COMMIT');
    console.log(`Created Super Admin: ${created.rows[0].email_normalized} (id ${created.rows[0].id})`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

main()
  .catch((error) => {
    console.error('[GreenScope] Admin bootstrap failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDatabase().catch(() => {});
  });
