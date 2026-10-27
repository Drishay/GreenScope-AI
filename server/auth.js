import crypto from 'node:crypto';
import { getPool } from './db.js';
import { hashPassword, hashToken, normalizeEmail, randomToken, safeUser, verifyPassword } from './security.js';

const SESSION_COOKIE = process.env.SESSION_COOKIE_NAME || 'greenscope.sid';
const SESSION_TTL_HOURS = Math.min(Math.max(Number(process.env.SESSION_TTL_HOURS || 12), 1), 168);
const isProduction = process.env.NODE_ENV === 'production';

function cookieOptions(maxAge) {
  return [
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    ...(isProduction ? ['Secure'] : []),
    ...(typeof maxAge === 'number' ? [`Max-Age=${Math.floor(maxAge / 1000)}`] : []),
  ].join('; ');
}

function setSessionCookie(res, token, maxAge) {
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=${token}; ${cookieOptions(maxAge)}`);
}

function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; ${cookieOptions(0)}`);
}

function parseCookies(header = '') {
  const result = {};
  for (const part of header.split(';')) {
    const index = part.indexOf('=');
    if (index <= 0) continue;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    try { result[key] = decodeURIComponent(value); } catch { /* ignore malformed cookie */ }
  }
  return result;
}

async function audit({ actorUserId = null, action, targetType = null, targetId = null, organisationId = null, requestId = null, reason = null, metadata = {} }) {
  await getPool().query(
    `INSERT INTO audit_events(actor_user_id, action, target_type, target_id, organisation_id, request_id, reason, metadata_json)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb)`,
    [actorUserId, action, targetType, targetId, organisationId, requestId, reason, JSON.stringify(metadata)],
  );
}

async function loadAssignments(userId) {
  const { rows } = await getPool().query(
    `SELECT ra.role, ra.organisation_id, o.display_name AS organisation_name
       FROM role_assignments ra
       LEFT JOIN organisations o ON o.id = ra.organisation_id
      WHERE ra.user_id = $1 AND ra.revoked_at IS NULL
      ORDER BY ra.created_at ASC`,
    [userId],
  );
  return rows;
}

export async function attachCurrentUser(req, res, next) {
  try {
    const cookies = parseCookies(req.headers.cookie);
    const token = cookies[SESSION_COOKIE];
    if (!token || token.length > 256) return next();

    const db = getPool();
    const tokenHash = hashToken(token);
    const { rows } = await db.query(
      `SELECT s.id AS session_id, s.user_id, s.csrf_token, s.expires_at,
              u.email_normalized, u.full_name, u.status
         FROM app_sessions s
         JOIN users u ON u.id = s.user_id
        WHERE s.token_hash = $1 AND s.revoked_at IS NULL AND s.expires_at > now()`,
      [tokenHash],
    );
    const row = rows[0];
    if (!row || row.status !== 'active') return next();

    const assignments = await loadAssignments(row.user_id);
    req.auth = {
      sessionId: row.session_id,
      csrfToken: row.csrf_token,
      user: safeUser(row, assignments),
      userId: row.user_id,
      assignments,
    };
    return next();
  } catch (error) {
    return next(error);
  }
}

export function requireAuth(req, res, next) {
  if (!req.auth) return res.status(401).json({ error: 'Authentication required' });
  next();
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.auth) return res.status(401).json({ error: 'Authentication required' });
    if (!req.auth.assignments.some((assignment) => roles.includes(assignment.role))) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

export function requireCsrf(req, res, next) {
  if (!req.auth) return res.status(401).json({ error: 'Authentication required' });
  const supplied = req.get('x-csrf-token');
  if (!supplied || supplied.length > 256 || supplied !== req.auth.csrfToken) {
    return res.status(403).json({ error: 'CSRF validation failed' });
  }
  next();
}

export function registerAuthRoutes(app) {
  const loginAttempts = new Map();
  const loginLimit = Number(process.env.LOGIN_ATTEMPTS_PER_WINDOW || 10);
  const loginWindowMs = 15 * 60 * 1000;

  app.post('/api/auth/login', async (req, res, next) => {
    try {
      const email = normalizeEmail(req.body?.email);
      const password = req.body?.password;
      if (!email || email.length > 254 || typeof password !== 'string' || password.length > 256) {
        return res.status(400).json({ error: 'Enter a valid email and password' });
      }

      // Basic per-process protection; deploy behind a shared rate limiter for multi-instance production.
      const now = Date.now();
      const key = `${req.ip}:${email}`;
      const attempt = loginAttempts.get(key);
      if (attempt && attempt.resetAt > now && attempt.count >= loginLimit) {
        res.setHeader('Retry-After', String(Math.ceil((attempt.resetAt - now) / 1000)));
        return res.status(429).json({ error: 'Too many login attempts. Try again later.' });
      }
      if (!attempt || attempt.resetAt <= now) loginAttempts.set(key, { count: 1, resetAt: now + loginWindowMs });
      else attempt.count += 1;

      const db = getPool();
      const { rows } = await db.query(
        'SELECT id, email_normalized, full_name, password_hash, status FROM users WHERE email_normalized = $1',
        [email],
      );
      const user = rows[0];
      const valid = user?.password_hash ? await verifyPassword(password, user.password_hash) : false;
      if (!user || user.status !== 'active' || !valid) {
        await audit({ action: 'auth.login_failed', requestId: req.id, metadata: { email_domain: email.split('@')[1] || '' } }).catch(() => {});
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const assignments = await loadAssignments(user.id);
      if (!assignments.length) return res.status(403).json({ error: 'Account has no active role. Contact the administrator.' });

      const rawToken = randomToken(32);
      const csrfToken = randomToken(32);
      const expiresAt = new Date(Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000);
      const sessionId = crypto.randomUUID();
      await db.query(
        `INSERT INTO app_sessions(id, user_id, token_hash, csrf_token, expires_at, created_at, last_seen_at)
         VALUES ($1,$2,$3,$4,$5,now(),now())`,
        [sessionId, user.id, hashToken(rawToken), csrfToken, expiresAt],
      );
      await db.query('UPDATE users SET last_login_at = now(), updated_at = now() WHERE id = $1', [user.id]);
      await audit({ actorUserId: user.id, action: 'auth.login_success', targetType: 'user', targetId: user.id, requestId: req.id });
      loginAttempts.delete(key);
      setSessionCookie(res, rawToken, SESSION_TTL_HOURS * 60 * 60 * 1000);
      res.setHeader('Cache-Control', 'no-store');
      return res.json({ user: safeUser(user, assignments), csrf_token: csrfToken });
    } catch (error) { next(error); }
  });

  app.post('/api/auth/logout', attachCsrfFromSession, async (req, res, next) => {
    try {
      await getPool().query('UPDATE app_sessions SET revoked_at = now() WHERE id = $1 AND revoked_at IS NULL', [req.auth.sessionId]);
      await audit({ actorUserId: req.auth.userId, action: 'auth.logout', targetType: 'user', targetId: req.auth.userId, requestId: req.id });
      clearSessionCookie(res);
      return res.json({ ok: true });
    } catch (error) { next(error); }
  });

  app.get('/api/auth/me', requireAuth, (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    return res.json({ user: req.auth.user, csrf_token: req.auth.csrfToken });
  });

  app.post('/api/auth/change-password', requireAuth, requireCsrf, async (req, res, next) => {
    try {
      const currentPassword = req.body?.current_password;
      const newPassword = req.body?.new_password;
      if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
        return res.status(400).json({ error: 'Current and new passwords are required' });
      }
      if (newPassword.length < 12 || newPassword.length > 256) {
        return res.status(400).json({ error: 'New password must be between 12 and 256 characters' });
      }
      const db = getPool();
      const { rows } = await db.query('SELECT password_hash FROM users WHERE id = $1', [req.auth.userId]);
      if (!rows[0]?.password_hash || !(await verifyPassword(currentPassword, rows[0].password_hash))) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }
      const newHash = await hashPassword(newPassword);
      await db.query('UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2', [newHash, req.auth.userId]);
      await db.query('UPDATE app_sessions SET revoked_at = now() WHERE user_id = $1 AND id <> $2', [req.auth.userId, req.auth.sessionId]);
      await audit({ actorUserId: req.auth.userId, action: 'auth.password_changed', targetType: 'user', targetId: req.auth.userId, requestId: req.id });
      return res.json({ ok: true, message: 'Password changed. Other sessions have been signed out.' });
    } catch (error) { next(error); }
  });

  app.post('/api/admin/organisations', requireAuth, requireRole('super_admin'), requireCsrf, async (req, res, next) => {
    try {
      const type = req.body?.type;
      const legalName = String(req.body?.legal_name || '').trim();
      const displayName = String(req.body?.display_name || '').trim();
      if (!['authority', 'institution'].includes(type) || legalName.length < 2 || legalName.length > 240 || displayName.length < 2 || displayName.length > 160) {
        return res.status(400).json({ error: 'Valid type, legal_name and display_name are required' });
      }
      const { rows } = await getPool().query(
        `INSERT INTO organisations(type, legal_name, display_name, status)
         VALUES ($1,$2,$3,'pending')
         RETURNING id, type, legal_name, display_name, status, created_at`,
        [type, legalName, displayName],
      );
      await audit({ actorUserId: req.auth.userId, action: 'admin.organisation_created', targetType: 'organisation', targetId: rows[0].id, requestId: req.id });
      return res.status(201).json({ organisation: rows[0] });
    } catch (error) { next(error); }
  });

  app.get('/api/admin/organisations', requireAuth, requireRole('super_admin'), async (_req, res, next) => {
    try {
      const { rows } = await getPool().query(
        'SELECT id, type, legal_name, display_name, status, verified_at, created_at FROM organisations ORDER BY created_at DESC LIMIT 500',
      );
      return res.json({ organisations: rows });
    } catch (error) { next(error); }
  });

  app.post('/api/admin/users/invitations', requireAuth, requireRole('super_admin'), requireCsrf, async (req, res, next) => {
    try {
      const email = normalizeEmail(req.body?.email);
      const fullName = String(req.body?.full_name || '').trim();
      const role = req.body?.role;
      const organisationId = req.body?.organisation_id;
      if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || fullName.length < 2 || fullName.length > 160 || !['authority', 'institution'].includes(role) || !organisationId) {
        return res.status(400).json({ error: 'Valid email, full_name, role and organisation_id are required' });
      }
      const db = getPool();
      const org = await db.query('SELECT id, type, status FROM organisations WHERE id = $1', [organisationId]);
      if (!org.rowCount || org.rows[0].type !== role || org.rows[0].status !== 'active') {
        return res.status(400).json({ error: 'Select an active organisation matching the requested role' });
      }
      const existing = await db.query('SELECT id FROM users WHERE email_normalized = $1', [email]);
      if (existing.rowCount) return res.status(409).json({ error: 'An account already exists for this email' });

      const token = randomToken(32);
      const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
      const invitation = await db.query(
        `INSERT INTO invitations(email_normalized, full_name, role, organisation_id, token_hash, created_by_user_id, expires_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         RETURNING id, email_normalized, full_name, role, organisation_id, expires_at`,
        [email, fullName, role, organisationId, hashToken(token), req.auth.userId, expiresAt],
      );
      await audit({ actorUserId: req.auth.userId, action: 'admin.invitation_created', targetType: 'invitation', targetId: invitation.rows[0].id, organisationId, requestId: req.id });
      // The token is returned once because email delivery is not configured yet. Admin must send it securely.
      return res.status(201).json({ invitation: invitation.rows[0], invitation_token: token, delivery: 'manual_secure_delivery_required' });
    } catch (error) { next(error); }
  });

  app.post('/api/auth/accept-invitation', async (req, res, next) => {
    try {
      const token = String(req.body?.token || '');
      const password = req.body?.password;
      if (token.length < 30 || token.length > 256 || typeof password !== 'string' || password.length < 12 || password.length > 256) {
        return res.status(400).json({ error: 'A valid invitation token and a password of at least 12 characters are required' });
      }
      const db = getPool();
      const client = await db.connect();
      try {
        await client.query('BEGIN');
        const invitationResult = await client.query(
          `SELECT * FROM invitations WHERE token_hash = $1 AND accepted_at IS NULL AND revoked_at IS NULL AND expires_at > now() FOR UPDATE`,
          [hashToken(token)],
        );
        const invitation = invitationResult.rows[0];
        if (!invitation) {
          await client.query('ROLLBACK');
          return res.status(400).json({ error: 'Invitation is invalid or expired' });
        }
        const existing = await client.query('SELECT id FROM users WHERE email_normalized = $1 FOR UPDATE', [invitation.email_normalized]);
        if (existing.rowCount) {
          await client.query('ROLLBACK');
          return res.status(409).json({ error: 'An account already exists for this email' });
        }
        const passwordHash = await hashPassword(password);
        const created = await client.query(
          `INSERT INTO users(email_normalized, full_name, password_hash, status, email_verified_at)
           VALUES ($1,$2,$3,'active',now()) RETURNING id,email_normalized,full_name,status`,
          [invitation.email_normalized, invitation.full_name, passwordHash],
        );
        const user = created.rows[0];
        await client.query(
          'INSERT INTO role_assignments(user_id, role, organisation_id, granted_by_user_id) VALUES ($1,$2,$3,$4)',
          [user.id, invitation.role, invitation.organisation_id, invitation.created_by_user_id],
        );
        await client.query('UPDATE invitations SET accepted_at = now() WHERE id = $1', [invitation.id]);
        await client.query(
          `INSERT INTO audit_events(actor_user_id, action, target_type, target_id, organisation_id, metadata_json)
           VALUES ($1,'auth.invitation_accepted','user',$1,$2,$3::jsonb)`,
          [user.id, invitation.organisation_id, JSON.stringify({ invitation_id: invitation.id })],
        );
        await client.query('COMMIT');
        return res.status(201).json({ ok: true, message: 'Account created. You can now sign in.' });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) { next(error); }
  });
}

async function attachCsrfFromSession(req, res, next) {
  await attachCurrentUser(req, res, (error) => {
    if (error) return next(error);
    if (!req.auth) return res.status(401).json({ error: 'Authentication required' });
    return requireCsrf(req, res, next);
  });
}
