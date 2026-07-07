# 2026-06-18-source-access-honor-tenant-admin — Honor Clerk tenant-admin without a persons membership row

## Release ID

`2026-06-18-source-access-honor-tenant-admin`

## Status

`candidate`

## Plain-English Summary

A Clerk tenant/client-admin who had not yet been provisioned a persons-backed
membership row was being dropped to "no source access" — every Source event
returned a 404 for them, even inside their own client. This made Source unusable
for a freshly provisioned admin (the most common pilot entry path). The fix makes
the Source access policy treat an admin Clerk role as a Source `client_admin`
within the client that has already been resolved for that session — exactly the
behavior the Moves program-access policy already ships in production.

## Layer Impact

- `global-control-lane`: shared control-plane access-resolution logic
  (`src/lib/auth/source-access-policy.ts`). `inferAccessLevel` now considers the
  caller's Clerk role, not only a persons-backed membership row. No schema, no
  data-plane, no client-scoped change. Cross-tenant isolation is unchanged: Source
  events remain filtered by `client_key` at the query layer; this only sets access
  *within* the already-resolved active client.

## Client Applicability

State exactly who receives the change.

- All clients: yes — the access-resolution path applies to every tenant. It only
  upgrades genuine admin roles; non-admin users are unaffected (fail-closed).
- Specific clients: n/a
- Internal only: no
- Public/demo only: no
- Feature flag: none (always-on control-plane fix)

## Changes Included

- Branch `fix/source-access-honor-tenant-admin`, commit `954aa3756`.
- `src/lib/auth/source-access-policy.ts` — add `isClientAdminRole` helper;
  `inferAccessLevel(ctx, membership, participants)` returns `client_admin` when
  `ctx.role` (or membership role) is an admin role.
- `src/lib/auth/__tests__/source-access-policy.test.ts` — two new tests: the
  entry-path fix (no-membership tenant-admin → `client_admin`) and a no-over-grant
  fence (plain member with no membership → `no_source_access`).

## QA / Validation

- `npx jest src/lib/auth/__tests__/source-access-policy.test.ts` → **14 passed**,
  including both new cases.
- `npx eslint src/lib/auth/source-access-policy.ts <test>` → exit 0.
- Tenant-fence gate (the explicit pre-cutover condition): the fence test proves a
  non-admin Clerk user is NOT over-granted, and that admin access stays scoped to
  the active client (`sourceScope: all_client_source_events`, not cross-tenant).
  Cross-tenant event isolation lives at the query layer (`client_key`) and is not
  modified here.
- Live signed-in retrieval verification on First Capital is run after deploy,
  before the fix is declared usable end-to-end.

## Rollout Plan

Merge to main on green PR check → ACA image build/deploy via `aca-main-deploy`,
or direct `az containerapp update --image main-<sha>` if the CI deploy step races
on image-digest resolution. No migration, no flag flip.

## Rollback Plan

Revert the commit / redeploy the prior `main-<sha>` revision and shift ingress
traffic back. Pure code path; no data or schema to unwind.

## Audit Evidence

- PR: (filled on open) `fix/source-access-honor-tenant-admin`
- CI run: PR "Release Control Gate" + test job
- Local proof: jest 14/14, eslint exit 0 (above)
- Post-deploy: signed-in Source event open on First Capital (no 404)

## Known Gaps

Durable JIT persons-provisioning on sign-in (so admins get a real membership row,
not just role-based access) is tracked separately under the operator-persona
provisioning work — out of scope for this control-plane fix.
