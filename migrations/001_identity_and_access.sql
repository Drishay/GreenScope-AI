-- GreenScope AI Phase 2: identity, organisation scope and audit foundation.
-- Apply with: npm run db:migrate
-- Sessions are stored in the separate connect-pg-simple table.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS organisations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('authority', 'institution')),
  legal_name TEXT NOT NULL CHECK (length(trim(legal_name)) BETWEEN 2 AND 240),
  display_name TEXT NOT NULL CHECK (length(trim(display_name)) BETWEEN 2 AND 160),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'archived')),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_normalized TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL CHECK (length(trim(full_name)) BETWEEN 2 AND 160),
  password_hash TEXT,
  status TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'active', 'suspended')),
  email_verified_at TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS role_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'authority', 'institution')),
  organisation_id UUID REFERENCES organisations(id) ON DELETE RESTRICT,
  granted_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  CHECK (
    (role = 'super_admin' AND organisation_id IS NULL) OR
    (role IN ('authority', 'institution') AND organisation_id IS NOT NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS role_assignments_active_unique
  ON role_assignments(user_id, role, COALESCE(organisation_id, '00000000-0000-0000-0000-000000000000'::uuid))
  WHERE revoked_at IS NULL;

CREATE TABLE IF NOT EXISTS institution_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE RESTRICT,
  name TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 2 AND 200),
  address TEXT,
  boundary_geojson JSONB,
  jurisdiction_key TEXT,
  site_type TEXT,
  verification_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS institution_sites_org_idx ON institution_sites(organisation_id);

CREATE TABLE IF NOT EXISTS authority_scopes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  authority_organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE RESTRICT,
  issue_category TEXT NOT NULL,
  geographic_scope JSONB,
  jurisdiction_key TEXT,
  source_reference TEXT,
  verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  active_from DATE NOT NULL DEFAULT CURRENT_DATE,
  active_to DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (active_to IS NULL OR active_to >= active_from)
);

CREATE INDEX IF NOT EXISTS authority_scopes_org_idx ON authority_scopes(authority_organisation_id);

CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_normalized TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('authority', 'institution')),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE RESTRICT,
  token_hash TEXT NOT NULL UNIQUE,
  created_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS invitations_email_idx ON invitations(email_normalized);

CREATE TABLE IF NOT EXISTS audit_events (
  id BIGSERIAL PRIMARY KEY,
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  organisation_id UUID REFERENCES organisations(id) ON DELETE SET NULL,
  request_id TEXT,
  reason TEXT,
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_events_created_idx ON audit_events(created_at DESC);
CREATE INDEX IF NOT EXISTS audit_events_actor_idx ON audit_events(actor_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_events_org_idx ON audit_events(organisation_id, created_at DESC);

