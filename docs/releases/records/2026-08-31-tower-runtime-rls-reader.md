# Tower — enforce serving reads through a runtime RLS role

## Release ID

`2026-08-31-tower-runtime-rls-reader`

## Status

`candidate`

## Plain-English Summary

Tower projection tables already carry tenant-scoped row-level-security policies. This release makes
the product read path exercise those policies by moving Tower reads into a no-login, non-bypass
runtime role for the duration of each read-only transaction. The serving views are also marked as
invoker-secured, so reads through `serving.tower_*` are checked against the caller role instead of a
view owner.

The route still reads the same serving views and renders the same data; the change is about where
tenant isolation is enforced.

## Layer Impact

Lane: `global-control-lane`. Layer 4 product projection and runtime read path. The migration adds a
role, grants read access to the Tower serving surface, and sets Tower serving views to
`security_invoker=true`. The application reader wraps each Tower read in `BEGIN READ ONLY`,
`SET LOCAL ROLE`, and a local `app.tenant_key` setting so role and tenant scope reset at transaction
end.

## Client Applicability

All clients. No client-specific data is loaded, deleted, or transformed.

## Changes Included

- `supabase/migrations/20260831122000_tower_runtime_reader_role.sql`
- `src/lib/tower/readTowerCommandCenter.ts`
- `scripts/ops/probe-tower-rls-enforcement.mjs`
- `src/lib/tower/__tests__/runtime-rls-role.test.ts`
- `src/lib/tower/__tests__/readTowerCommandCenter.test.ts`
- `package.json`

## QA / Validation

Status so far: local candidate validation.

- `npx jest src/lib/tower/__tests__/readTowerCommandCenter.test.ts src/lib/tower/__tests__/runtime-rls-role.test.ts --runInBand` passed: 14 tests.
- Release check, type check, lint, migration apply, and live signed-in proof are required before this
  release can be marked released.

## Rollout Plan

1. Merge through PR.
2. Let the repo-owned ACA main deploy workflow build and deploy the image.
3. Apply the migration through the governed ACA migration/operator path using the approved image and
   `DATABASE_URL` secret reference.
4. Run `ops:probe-tower-rls` to confirm role and policy state.
5. Run `ops:probe-tower-rls-enforcement` to confirm no rows are visible without tenant scope and no
   cross-tenant rows are visible with tenant scope.
6. Run the Tower serving-view probe and a signed-in `/tower` proof to confirm rendered data is
   unchanged.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the repo-owned workflow
- Approved image digest: captured after merge
- ACA runtime invariant: required before live claim
- Worker image invariant: required before live claim
- Feature/env flag update path: none
- Live signed-in proof required: yes

## Rollback Plan

Revert the PR to remove the application role switch and probe script. If the migration has been
applied, restore default view execution by resetting the Tower serving view options and revoke the
runtime role membership from the connection role. Existing tenant predicates in the reader remain as
defense in depth.

## Audit Evidence

PR, CI output, migration/operator logs, `ops:probe-tower-rls`,
`ops:probe-tower-rls-enforcement`, Tower serving-view probe output, and signed-in route proof.

## Known Gaps

Write-side loader roles are unchanged. This release covers Tower product reads only.
