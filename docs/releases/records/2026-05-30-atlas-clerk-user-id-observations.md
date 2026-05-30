# 2026-05-30-atlas-clerk-user-id-observations — Atlas Clerk User ID Write Guard

## Release ID

`2026-05-30-atlas-clerk-user-id-observations`

## Status

`candidate`

## Plain-English Summary

Atlas no longer passes a fallback Clerk user token such as `clerk:user_...` into Atlas persistence paths that expect UUID-backed person identifiers. Demo users without a linked person row can still use Atlas, and Atlas continues to preserve UUID person ids when they exist.

## Layer Impact

- `global-control-lane`: adjusts the Atlas API tenancy boundary for all clients so chat turns do not fail when the authenticated user is Clerk-only.
- `client-data-lane`: no schema or tenant data changes; persistence receives `null` for non-UUID person attribution instead of an invalid UUID-like value.

## Client Applicability

- All clients: yes, Atlas API requests for every tenant use the same normalization.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/app/api/v1/atlas/_auth.ts`: normalizes Atlas `userId` to UUID-or-null before downstream writes.
- `src/app/api/v1/atlas/__tests__/auth-user-id-normalization.test.ts`: pins Clerk fallback ids to `null` and UUID person ids to preserved values.
- Release record for audit and rollback.

## QA / Validation

- Passed: `npx jest src/app/api/v1/atlas/__tests__/auth-user-id-normalization.test.ts --runInBand`
- Passed: `npx tsc --noEmit --pretty false`
- Passed: `npx eslint src/app/api/v1/atlas/_auth.ts src/app/api/v1/atlas/__tests__/auth-user-id-normalization.test.ts`
- Passed: `git diff --check`
- Failed-before-fix / captured: production CXO E2E run before this fix captured Meridian Atlas turns returning `500 invalid input syntax for type uuid: "clerk:user_..."`; the regression test pins that failure shape.

## Rollout Plan

Merge to main and allow the normal Vercel production deployment to pick up the API boundary fix. No migration or manual data repair is required.

## Rollback Plan

Revert the PR. The rollback restores previous person-id propagation behavior and may reintroduce Atlas 500s for Clerk-only demo users.

## Audit Evidence

- PR URL and CI checks.
- CXO E2E raw report under `reports/2026-05-30-atlas-iac-campaign/raw.json`.
- Regression test output from the command listed above.

## Known Gaps

This does not backfill person rows for demo users or infer a UUID from Clerk. It deliberately favors successful tenant-scoped Atlas operation over invalid audit attribution.
