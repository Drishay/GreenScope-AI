# GreenScope AI — Phase 2: Identity, Database & RBAC Implementation Plan

**Status:** Ready for technical implementation after Phase 1 decision confirmation  
**Branch:** `phase-1/governance-requirements` (planning artefact only; application code remains unchanged)  
**Pilot mode:** Advisory / shadow mode  
**Site scope:** Mixed institutions and buildings  
**Identity:** Secure accounts for Super Admin, Authority and Institution; public pages remain open  
**Analysis priority:** Real geospatial land-cover analysis is Phase 4; Phase 2 must not imply synthetic values are real.

## 1. Phase 2 outcome

Replace the single-local-user assumptions with a secure multi-user foundation. The system must identify who is signed in, establish their role and organisation/site scope, enforce that scope on the server for every protected operation, and record important security and administrative actions.

Phase 2 does **not** implement statutory notice issuance, a production environmental model, or public registration. It creates the identity and data foundations needed for Phase 3 case management.

## 2. Recommended implementation decisions

### Database
- Use **PostgreSQL** as the target multi-user database; use migrations from the first schema change.
- Keep the existing JSON-file analysis store operational during transition; do not silently discard or automatically import legacy demo records.
- Add an explicit migration/import command later that marks all imported historical reports as `synthetic/demo` unless their provenance proves otherwise.
- Local development should use a documented PostgreSQL setup (Docker Compose may be added if the repository has no existing preferred dev setup).
- Store secrets in environment variables. Commit only `.env.example`, never real credentials.

### Authentication
- Use server-managed sessions with secure, HTTP-only cookies; enable `Secure` in HTTPS environments and choose `SameSite` deliberately.
- Store session state server-side in PostgreSQL or a supported session store; do not store session secrets in localStorage.
- Hash passwords with Argon2id (or a reviewed equivalent supported by the deployment environment). Never store or log plaintext passwords.
- Implement login, logout, current-session endpoint, session rotation after login/privilege changes, expiration, and CSRF protection for cookie-authenticated mutations.
- Require verified invitation/approval for Authority and Institution accounts. Do not expose public self-service role selection.
- Super Admin creation must use a documented bootstrap process, not an open signup route or a hard-coded production password.
- Rate-limit login and account recovery attempts; return generic authentication errors to reduce account enumeration.

### Authorisation
- Roles are not enough by themselves. Every protected request must check role **and** organisation/site/case scope.
- Default deny; use explicit permission checks in API middleware/services.
- Authority users can access only cases/sites assigned to their organisation and jurisdiction.
- Institution users can access only their own institution and linked sites.
- Super Admin has administrative oversight, with auditable sensitive actions. Admin status must not permit silent rewriting of authority decisions or institution responses.
- Public endpoints must return only public information. Never include private case data in a public error or lookup response.

## 3. Proposed data schema (initial migration)

Use UUID primary keys, UTC timestamps, foreign keys, unique constraints, and indexes for common scope filters.

### `organisations`
- `id`, `type` (`authority` | `institution`), `legal_name`, `display_name`, `status`, `verified_at`, `created_at`, `updated_at`
- Optional organisation identifiers and contact fields should be added only when a concrete pilot requirement exists.

### `users`
- `id`, `email_normalized` (unique), `full_name`, `password_hash`, `status` (`invited` | `active` | `suspended`), `email_verified_at`, `last_login_at`, `created_at`, `updated_at`
- Phone numbers and government identifiers are not mandatory by default; collect only if the pilot requires and justifies them.

### `role_assignments`
- `id`, `user_id`, `role` (`super_admin` | `authority` | `institution`), `organisation_id`, optional `site_id`/jurisdiction scope, `granted_by_user_id`, `created_at`, `revoked_at`
- Enforce valid combinations: Super Admin may have no organisation scope; Authority and Institution users must have appropriate organisation scope.

### `institution_sites`
- `id`, `organisation_id`, `name`, `address`, `boundary_geojson` or PostGIS geometry, `jurisdiction_key`, `site_type`, `verification_status`, `created_at`, `updated_at`
- Geometry must have validated coordinates and a declared coordinate reference system. Consider PostGIS when available.

### `authority_scopes`
- `id`, `authority_organisation_id`, `issue_category`, `geographic_scope`, `verified_by`, `verified_at`, `source_reference`, `active_from`, `active_to`
- This is an operational routing configuration, not a legal opinion or proof of statutory power.

### `sessions`
- `id`, `user_id`, `session_token_hash`, `created_at`, `expires_at`, `revoked_at`, minimal security metadata
- Store a hash of the opaque session token where practical; never log the raw token.

### `audit_events`
- `id`, `actor_user_id` (nullable for system events), `action`, `target_type`, `target_id`, `organisation_id`, `request_id`, `reason`, `metadata_json`, `created_at`
- Append-only at the application level. Restrict updates/deletes; do not store passwords, session tokens, or unnecessary sensitive payloads.

### Deferred to Phase 3
Cases, notices, institution responses, evidence assets, inspections and action/decision records are defined in Phase 1 but should be implemented with the case lifecycle in Phase 3. Phase 2 can add minimal placeholder references only if required by foreign-key planning; avoid creating half-working workflow tables.

## 4. API contract

Exact endpoint names may be aligned with current routing conventions, but the semantics below must be met.

### Public
- `GET /api/health` — health status without secrets.
- Existing public geocoding/analyze routes should be reviewed for rate limits and synthetic-data labelling. In advisory mode, `POST /api/analyze` must never create an official case or legal notice by itself.
- Public pages and public informational content remain accessible without login.

### Authentication
- `POST /api/auth/login` — validate credentials, rotate/create session, set HTTP-only cookie.
- `POST /api/auth/logout` — revoke session and clear cookie.
- `GET /api/auth/me` — return safe current-user profile, roles and allowed organisation/site scope; return 401 if not authenticated.
- `POST /api/auth/forgot-password` and reset flow only if secure email delivery and single-use expiring tokens are configured; otherwise disable the flow and document the limitation.
- `POST /api/auth/change-password` — require current session and CSRF protection; rotate sessions after success.

### Super Admin
- `GET /api/admin/users` — paginated user list with safe fields only.
- `POST /api/admin/users/invitations` — create invitation for an allowed role/organisation.
- `PATCH /api/admin/users/:id/status` — activate/suspend; record reason and audit event.
- `POST /api/admin/role-assignments` and revoke operation — assign only allowed roles/scopes and audit every change.
- `GET /api/admin/organisations`, `POST /api/admin/organisations`, `PATCH /api/admin/organisations/:id` — manage authority/institution organisations.
- `GET /api/admin/audit-events` — paginated, filterable audit log; no raw secrets.

### Authority and Institution
- Phase 2 should expose only `/api/auth/me` and safe profile/scope data for these roles. Case endpoints are Phase 3.
- Return 403 for authenticated users without permission; 404 may be used for scoped resources where revealing existence would leak information.
- Do not trust role, organisation id, site id or user id supplied in request bodies as proof of access.

## 5. Frontend work

- Preserve current public Home / Analyze / History experiences where compatible, and do not redesign the existing design tokens.
- Add a dedicated sign-in page for staff/institution users and a clear sign-in entry in navigation. Public visitors can still use public pages.
- Add role-aware dashboard routing after authentication. Avoid rendering a private page before session loading completes.
- Add invitation acceptance/password setup for invited users.
- Do not expose administrative buttons to non-admins; however, frontend visibility is only a usability layer, never the security boundary.
- Mark legacy synthetic reports as demo data; no synthetic analysis should be represented as an official case.

## 6. Security and privacy acceptance checks

- [ ] Unauthenticated request to every protected endpoint returns 401.
- [ ] Authenticated user with wrong role gets 403.
- [ ] Institution A cannot read or modify Institution B's users, sites, analyses or future cases by changing an ID.
- [ ] Authority A cannot read cases/sites outside its configured assignment scope.
- [ ] Public requests cannot enumerate users or retrieve private case details.
- [ ] Password hashes are salted and generated using the selected password-hashing algorithm.
- [ ] Session cookie is HTTP-only; Secure is enabled in HTTPS production; SameSite and CSRF controls are tested.
- [ ] Login is rate-limited; logout revokes the session; expired/revoked sessions cannot be reused.
- [ ] Role/organisation changes and account suspensions are audited and invalidate or refresh affected sessions/permissions.
- [ ] Admin actions require an authenticated Super Admin and are audited with a reason where appropriate.
- [ ] Secrets are not committed, returned in API responses, or written to logs.
- [ ] Validation, pagination, safe error messages, dependency audit and basic security headers are in place.
- [ ] Existing public pages continue to load without login; responsive layout remains intact.
- [ ] Existing local JSON reports remain intact and are not silently migrated or deleted.

## 7. Suggested work breakdown

1. **Repository reconnaissance:** inspect current scripts, dependencies, server middleware, app routing, deployment constraints and existing auth UI. Confirm Node/runtime and database availability.
2. **Database foundation:** add PostgreSQL configuration, migration tooling, initial schema, local setup instructions and connection health check.
3. **Auth service:** password hashing, session storage, login/logout/me, CSRF, rate limits and safe errors.
4. **RBAC middleware:** default-deny guards, role checks, organisation/site scope helpers, and tests for cross-tenant access.
5. **Super Admin APIs:** organisation/user invitation, activation/suspension, role assignment/revocation and audit events.
6. **Staff sign-in UI:** login/invitation acceptance and role-aware route handling while preserving public access.
7. **Tests and review:** unit/integration tests for auth, scope isolation, session expiry and public access; update README and environment example.
8. **Demo safety:** label existing synthetic analysis outputs and confirm no route can turn them into an official finding or notice.

## 8. Definition of done

Phase 2 is complete when all security acceptance checks pass, Super Admin can provision users and scope them correctly, Authority and Institution users can sign in and receive only their safe profile/scope data, public pages remain usable without login, and the existing analysis history is preserved. Do not claim production-ready security without running and reviewing the test suite in the target deployment environment.

## 9. Implementation notes and cautions

- Avoid adding a broad authentication framework until current dependencies/runtime are inspected; choose a maintained library with current security updates and compatible licence.
- For production, use TLS, secure secrets management, backups, monitoring, dependency updates and an incident-response owner.
- Government staff identity assurance may require official email/domain checks or an organisation-approved identity process; decide with the pilot authority rather than collecting government IDs by default.
- Do not use an AI model to decide roles, verify official identity, or make enforcement decisions.
- Do not make production deployment dependent on a personal developer account or a hard-coded local administrator.
