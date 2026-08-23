# 2026-08-23-source-ecl-db-projection-provider — Source ECL DB Projection Provider

## Release ID

`2026-08-23-source-ecl-db-projection-provider`

## Status

`candidate`

## Plain-English Summary

Adds a server-side Source workspace provider mode that reads the ECL Source 360 projection tables from Azure/Postgres instead of local CSV proof files. The existing Source workspace remains on its current provider unless `SOURCE_WORKSPACE_PROVIDER=ecl_projection_db` is explicitly set.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 3 / Canonical Enterprise Model: no schema, migration, or data mutation. The new path reads existing `ecl_projection` rows.
- Layer 4 / Products: Source workspace can now be tested against the governed ECL projection tables through the same portfolio contract used by the current page. No default route repointing is performed by this release.

## Client Applicability

- All clients: no default behavior change.
- Specific clients: none.
- Internal only: controlled Source ECL route/browser QA.
- Public/demo only: none.
- Feature flag: `SOURCE_WORKSPACE_PROVIDER=ecl_projection_db`.

## Changes Included

- `src/app/(maestro)/source/preview/workspace/live/portfolioAdapter.ts`
- `src/app/(maestro)/source/preview/workspace/__tests__/portfolioAdapter.ecl.test.ts`
- `src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx`

## QA / Validation

- pass — `npx jest --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/portfolioAdapter.ecl.test.ts' 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx' --runInBand`
- pass — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`

## Rollout Plan

Merge through pull request. The provider remains inactive until the explicit server-side environment flag is set in a controlled runtime or browser-QA environment.

## Deployment Authority

- Repo-owned deploy workflow: required for standard main deployment.
- Shared runtime mutators: none in this PR.
- Approved image digest: resolved by the repo-owned deploy workflow after merge.
- ACA runtime invariant: required if deployed.
- Worker image invariant: not affected.
- Feature/env flag update path: controlled runtime flag update only.
- Live signed-in proof required: required before claiming Source is browser-proven on ECL projection data.

## Rollback Plan

Revert this release or unset `SOURCE_WORKSPACE_PROVIDER=ecl_projection_db`. Since the default provider is unchanged, rollback is code or environment only.

## Audit Evidence

- Focused adapter test covering local CSV and Azure/Postgres ECL projection rows.
- Existing browser-surface component test continues to pass with the flagged ECL path.
- TypeScript compile.

## Known Gaps

This release does not set the runtime flag, repoint product routes by default, shift traffic, or claim signed-in browser proof.
