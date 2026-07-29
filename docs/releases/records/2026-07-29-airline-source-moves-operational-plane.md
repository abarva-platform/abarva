# 2026-07-29-airline-source-moves-operational-plane — Source and Moves Operational Plane Guard

## Release ID

`2026-07-29-airline-source-moves-operational-plane`

## Status

`candidate`

## Plain-English Summary

Adds tenant-aware data-plane selection to core Source and Moves operational read/write seams for the governed foundation tenant path. This prevents the governed pilot tenant from silently using the legacy default data plane when these workflows already know the tenant key. It also adds a focused Source/Moves operational migration inventory so remaining database, Blob storage, runtime, and negative-proof work is visible instead of implied.

## Layer Impact

- Products: Source and Moves operational workflows now pass tenant context into core data-plane adapter selection where available.
- Canonical / Knowledge: No foundation data, review decisions, publication, baseline, or projections are changed.
- Source adapters / storage: No storage migration is performed in this release. The report identifies Blob upload/download proof as a remaining gate.

## Client Applicability

- All clients: Legacy tenants keep existing default data-plane behavior.
- Specific clients: Governed foundation tenant paths for `airline-demo-new` and the shared foundation-tenant guard behavior.
- Internal only: Operational migration inventory and proof artifacts.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Tenant-aware adapter selection for Source event reads, Source work-item reads/writes, Moves program reads, Moves preference reads, and program attachment metadata writes.
- Regression tests proving governed foundation tenants route to Azure/PostgreSQL by default and reject explicit Supabase for the patched selectors.
- `scripts/qa/airline-source-moves-operational-migration.mjs`
- `reports/airline-source-moves-operational-migration-2026-07-29.md`
- `proof/airline-source-moves-operational-migration-2026-07-29/`

## QA / Validation

- pass — Focused Jest adapter regression suite:
  `npx jest --runTestsByPath src/lib/data-plane/read-adapters/__tests__/source-events-read-adapter.test.ts src/lib/data-plane/read-adapters/__tests__/programs-read-adapter.test.ts src/lib/data-plane/read-adapters/__tests__/strategic-moves-preferences-read-adapter.test.ts src/lib/data-plane/read-adapters/__tests__/sourcing-work-items-read-adapter.test.ts src/lib/data-plane/write-adapters/__tests__/attachments-write-adapter.test.ts src/lib/data-plane/write-adapters/__tests__/sourcing-work-items-write-adapter.test.ts --runInBand`
- pass — Source/Moves operational migration inventory:
  `node scripts/qa/airline-source-moves-operational-migration.mjs`
- pass — TypeScript:
  `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit`
- pass — Diff whitespace:
  `git diff --check`
- pass — Release control:
  `npm run release:check`
- pass — Broader Airline module certification script still runs:
  `npm run qa:airline-module-data-plane-certification`

## Rollout Plan

Merge through the normal PR path. The ACA main deployment lane will build and deploy the merged image. This change becomes active in runtime code immediately for the affected Source/Moves adapter paths.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this PR.
- Approved image digest: Captured by ACA main deployment after merge.
- ACA runtime invariant: Required after deploy before calling it live.
- Worker image invariant: Not changed.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, for the next operational migration gate.

## Rollback Plan

Revert the PR and redeploy the previous ACA digest. Since no data migration or Blob movement is performed here, rollback is code-only.

## Audit Evidence

- Source/Moves operational inventory report.
- JSON and CSV proof artifacts under `proof/airline-source-moves-operational-migration-2026-07-29/`.
- Focused Jest regression output.
- TypeScript and release-check output.

## Known Gaps

This does not complete the full operational migration. Source/Moves upload byte paths, generated artifacts, database row migration, signed-in workflow proof, negative fallback proof, and rollback/restore proof remain open.
