# 2026-06-05-program-detail-azure-read-path — Program Detail Uses Azure Read Path

## Release ID

`2026-06-05-program-detail-azure-read-path`

## Status

`candidate`

## Plain-English Summary

The single-program API now resolves program detail through the same tenant-scoped Azure/Postgres read path as the program portfolio API. This prevents a legacy compatibility client from returning a server error for live Lakeshore Moves while preserving the existing tenant and archive checks.

## Layer Impact

- `global-control-lane`: Updates shared `/api/v1/programs/:programId` read behavior for all clients by removing an unnecessary legacy route client from the GET path.
- `client-data-lane`: Improves Lakeshore demo readiness because the Kyriba Move detail API can return the live tenant-scoped program state instead of `internal_error`.

## Client Applicability

- All clients: Program detail API reads now use the canonical Azure/Postgres read path.
- Specific clients: Lakeshore Holdings benefits immediately for Kyriba and Data Spine Moves.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/app/api/v1/programs/[programId]/route.ts`: remove forced legacy route Supabase client from GET detail reads.
- `src/app/api/v1/programs/[programId]/__tests__/route.test.ts`: add regression coverage for tenant-scoped single-program reads and not-found handling.

## QA / Validation

- `pass`: Live pre-fix Agent B QA found product routes and attachments green, but `/api/v1/programs/1196dac0-715c-45ce-8eeb-5e70792d9aa4` returned `500 {"error":"internal_error"}`.
- `pass`: Focused Jest route regression with `npx jest --runTestsByPath '/private/tmp/nexus-agent-b-moves-evidence/src/app/api/v1/programs/[programId]/__tests__/route.test.ts' --runInBand` (2 tests passed; duplicate manual mock warnings are pre-existing Jest noise).
- `pass`: `git diff --check`.
- `pass`: `npm run release:check -- --base origin/main --head HEAD`.
- `not-run`: Post-fix live API rerun after deploy.

## Rollout Plan

Merge to main through PR, let Vercel deploy the updated API route, then rerun the Lakeshore Moves/API proof against `https://app.abarva.ai`.

## Rollback Plan

Revert the route change commit. The rollback restores the previous legacy compatibility-client behavior for the single-program GET route.

## Audit Evidence

- Agent B live pre-fix route/API probe output in the PR description.
- Lakeshore route readiness report under `reports/2026-06-05-lakeshore-agent-b-moves-evidence/`.
- Focused route test output and release-control check output.

## Known Gaps

The change does not alter write routes or phase-advance routes, which still intentionally use the route Supabase compatibility client for mutation paths.
