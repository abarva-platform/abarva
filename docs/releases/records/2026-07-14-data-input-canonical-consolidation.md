# 2026-07-14-data-input-canonical-consolidation — Universal Tenant Input Consolidation

## Release ID

`2026-07-14-data-input-canonical-consolidation`

## Status

`candidate`

## Plain-English Summary

This release consolidates every registry-active tenant onto one universal active input packet: exactly one CSV per governed tenant data dimension under `datasets/tenant-inputs/active/<tenant-key>/current/`. Historical packet folders and versioned source files are archived out of the active build path, while row-level lineage remains preserved for audit. It also normalizes product-facing source labels so raw migration filenames remain diagnostic lineage, not primary UI labels.

## Layer Impact

- Lane: `client-data-lane`.
- Secondary lane: `global-control-lane` for the source-label display contract used by shared module context.
- Tenant input source layer: active inputs now use 19 universal CSV files per active tenant with no nested current-state, rich, upgrade, enterprise, or holdco packet folders in active current.
- Canonical build artifacts: canonical data build proof is regenerated from the consolidated active inputs.
- Candidate/readiness artifacts: inactive candidate versions, active module-context metadata proof, and Home quality proof are regenerated from the consolidated source.
- Module context serving contract: evidence references carry a business-facing `sourceLabel` and diagnostic `technicalSourceFile` so product UIs do not show raw migration filenames as primary source titles.

## Client Applicability

- All clients: all registry-active synthetic/demo tenants in this repository.
- Specific clients: Apex Retail, First Capital Financial, Lakeshore Holdings, Lakeshore Industries, Meridian Health, and SkyHarbor Air.
- Internal only: deterministic build/audit/report artifacts and source consolidation utility.
- Public/demo only: no public route change.
- Feature flag: none.

Northstar is retired/excluded and is not processed as an active tenant.

## Changes Included

- Added `scripts/data-build/consolidate-active-tenant-inputs.mjs`.
- Updated `datasets/tenant-inputs/tenant-input-registry.json`.
- Replaced active nested/versioned packet folders with universal current CSV files under each active tenant.
- Archived historical active packet folders under `datasets/tenant-inputs/archive/<tenant-key>/consolidated-20260714/`.
- Updated canonical tenant input audit to enforce the one-universal-file-per-domain active standard.
- Updated candidate coverage checks/tests to derive coverage from source rows instead of stale hardcoded row thresholds.
- Added shared source display-label normalization for module context and Moves context extract review.
- Added deterministic proof reports under `reports/tenant-input-consolidation/latest/`.

## QA / Validation

- `npm run data:consolidate-tenant-inputs` — Pass.
- `npm run audit:canonical-tenant-inputs` — Pass.
- `npm run audit:tenant-input-quality` — Pass.
- `npm run build:canonical-tenant-data` — Pass, 6 tenants, 6,593 accepted records, 9,330 relationship candidates.
- `npm run audit:canonical-data-build` — Pass, 6 tenants, 6,593 records, 6,593 evidence attachments.
- `npm run build:candidate-version` — Pass, 6 inactive candidate versions, no default candidate reads.
- `npm run audit:candidate-version` — Pass.
- `npm run audit:active-module-context-promotion -- --all-active-tenants` — Pass, 6 active module-context metadata proofs.
- `npm run audit:module-context-serving` — Pass, 24 tests.
- `npm test -- src/lib/programs/__tests__/move-context-extract.test.ts --runInBand` — Pass, 5 tests.
- `npm run audit:moves-context-extract` — Pass.
- `npm run audit:active-candidate-separation` — Pass.
- `npm run audit:home:content-quality` — Pass, 6 tenants / 42 dimensions / 210 tabs / 0 P0 / 0 P1 / 0 P2.
- `npm run smoke:home:full` — Pass, 10 aVa prompts / 0 P0 / 0 P1 / 0 P2.
- `npm run qa:home:ava-quality` — Pass, 10 aVa prompts / 0 P0 / 0 P1 / 0 P2.
- `npm run audit:enterprise-naming` — Pass.
- `npm run audit:architecture-rules` — Pass.
- `npm run release:check` — Pass.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` — Pass.
- `git diff --check` — Pass.

Jest prints pre-existing duplicate manual mock warnings for markdown/GFM mocks; the targeted suites still pass.

## Rollout Plan

Merge to `main` through PR. This is a repository data-input, build-artifact, and contract cleanup. It does not require production DB writes and does not promote candidate data. If the branch is deployed through the repo-owned ACA workflow, validate the standard runtime invariant and signed-in proof before calling the runtime live-proven.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` if a runtime deploy is required after merge.
- Shared runtime mutators: none in this PR.
- Approved image digest: not applicable until ACA deploy.
- ACA runtime invariant: required only after deploy.
- Worker image invariant: required only after deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: required only after deploy.

## Rollback Plan

Revert the PR to restore the previous active input tree and registry. Because historical packets are archived in-repo under `datasets/tenant-inputs/archive/...`, row lineage remains available and can be restored without external data recovery.

## Audit Evidence

- `reports/tenant-input-consolidation/latest/summary.md`
- `reports/tenant-input-consolidation/latest/applications-systems-source-to-loaded.md`
- `reports/tenant-input-consolidation/latest/applications-systems-full-source-to-loaded.csv`
- `reports/canonical-tenant-inputs/latest/canonical-tenant-inputs.md`
- `reports/canonical-data-build/latest/summary.md`
- `reports/candidate-version-build/latest/summary.md`
- `reports/active-tenant-access/all-tenants/all-tenant-active-module-context-promotion.md`
- `reports/home-smoke-quality/latest/summary.md`

## Known Gaps

- This release standardizes and rebuilds the active input path; it does not enrich missing tenant content beyond preserving and correctly projecting the available active source rows.
- Lakeshore Industries still lacks a dedicated signed-in automation persona, so browser proof for that tenant remains server/module-context proof until a persona is added.
