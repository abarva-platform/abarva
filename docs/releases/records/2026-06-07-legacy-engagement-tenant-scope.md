# 2026-06-07-legacy-engagement-tenant-scope — Legacy Engagement Tenant Scope

## Release ID

`2026-06-07-legacy-engagement-tenant-scope`

## Status

`candidate`

## Plain-English Summary

Legacy engagement URLs now resolve engagements only inside the signed-in user's active client. A guessed or copied engagement ID from another tenant returns as missing before the page or API can read charter, deliverable, turn, topic, or sponsor-console data.

## Layer Impact

- `global-control-lane`: Tightens shared app-layer tenant isolation for legacy `/engagements/*`, `/sponsor/*`, and `/api/engage/*` surfaces by applying active-client `client_id` filtering at the engagement lookup seam.

## Client Applicability

- All clients: Yes. The guard applies to all authenticated clients that can reach the legacy engagement stack.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Adds client-scoped legacy engagement lookup helpers in `src/lib/db/engagement.ts`.
- Routes request-facing legacy engagement pages, sponsor console, topic actions, and legacy Nexus turn POST through the scoped helpers after `requireTenancy()`.
- Adds `src/lib/db/__tests__/engagement-tenant-scope.test.ts` to prove graph-ID and UUID lookups include `client_id`.

## QA / Validation

- Pending in this candidate before final summary:
  - Focused Jest test for `src/lib/db/__tests__/engagement-tenant-scope.test.ts`.
  - Focused ESLint check for touched TypeScript/TSX files.
  - `npm run release:check`.

## Rollout Plan

Merge to `main` and deploy the normal Next.js application. No migration, seed, feature flag, or manual runtime step is required.

## Rollback Plan

Revert the application commit to restore the previous legacy engagement lookup behavior. No database rollback is required.

## Audit Evidence

- PR for this branch.
- Jest output for the tenant-scope helper test.
- ESLint output for touched files.
- `npm run release:check` output.

## Known Gaps

Legacy creation/backfill internals still retain unscoped helper access for non-request paths; this candidate closes request-facing legacy engagement reads and writes.
