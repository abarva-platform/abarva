# 2026-07-17-v6-v7-phase1-dead-artifact-cleanup — V6/V7 Phase 1 Generated Artifact Cleanup

## Release ID

`2026-07-17-v6-v7-phase1-dead-artifact-cleanup`

## Status

`candidate`

## Plain-English Summary

This change executes Phase 1 of the V6/V7 sunset plan after the Phase 0 deletion-readiness audit landed in PR #4912. It deletes only generated proof/report artifacts that were listed as safe-delete candidates and then passed a fresh reference-proof scan.

The cleanup is intentionally narrow. It does not delete runtime code, active tenant data, loaders, tests, schemas, historical migrations, release records, or V6/V7 runtime read paths. Files that still had references from docs, release records, scripts, sibling proof reports, or generated control reports were blocked and retained.

## Layer Impact

- `global-control-lane`: Adds a reproducible Phase 1 safe-delete proof harness and cleanup reports.
- `client-data-lane`: Deletes generated proof/report artifacts only. No tenant input dataset, active tenant data, candidate context, or data-plane row is changed.
- `internal-admin`: Reduces stale generated artifact clutter while preserving referenced audit evidence.

## Client Applicability

- All clients: No runtime behavior change.
- Specific clients: Some deleted proof/report artifacts mention Meridian, SkyHarbor, First Capital, Lakeshore, or historical demo/client lanes, but no active tenant data is changed.
- Internal only: Yes, repository hygiene/control-plane cleanup only.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Adds `scripts/audit/v6-v7-phase1-safe-delete-proof.mjs`.
- Adds `npm run audit:v6-v7-phase1-cleanup`.
- Generates `reports/v6-v7-phase1-cleanup/summary.md`.
- Generates `reports/v6-v7-phase1-cleanup/deletion-plan.csv`.
- Generates `reports/v6-v7-phase1-cleanup/deleted-artifacts.csv`.
- Generates `reports/v6-v7-phase1-cleanup/blocked-artifacts.csv`.
- Generates `reports/v6-v7-phase1-cleanup/proof.html`.
- Deletes 149 generated proof/report files that have zero exact-path references outside prior V6/V7 audit evidence.
- Blocks and retains 160 candidate files that still have references.

## QA / Validation

- Pass: `node scripts/audit/v6-v7-phase1-safe-delete-proof.mjs --delete`
- Pass: `npm run audit:v6-v7-sunset`
- Pass: `npm run release:check`
- Pass: `git diff --check`
- Pass: `npm run audit:architecture-rules`
- Pass: `npm run audit:enterprise-naming`
- Pass: `npm run audit:legacy-context-retirement`
- Pass: `npm run audit:v3-only-active-architecture`
- Pass: `npm run audit:no-legacy-context-language`
- Pass: `npm run audit:legacy-dataset-sunset`
- Pass: `NODE_PATH=/Users/anand/Projects/nexus/node_modules npm run validate:context-corpus:manifests`

## Rollout Plan

Merge the cleanup/control PR only. There is no Azure Container Apps deployment, no database mutation, no schema migration, no tenant promotion, and no feature flag change.

## Deployment Authority

- Repo-owned deploy workflow: Not applicable; no deployment.
- Shared runtime mutators: None.
- Approved image digest: Not applicable.
- ACA runtime invariant: Not applicable.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: No, because this PR deletes only unreferenced generated proof/report artifacts and does not change runtime behavior.

## Rollback Plan

Revert the cleanup PR to restore deleted generated artifacts and remove the Phase 1 proof harness/report updates. No data-plane rollback is needed because no runtime, database, tenant input, or schema state is changed.

## Audit Evidence

- `reports/v6-v7-phase1-cleanup/summary.md`
- `reports/v6-v7-phase1-cleanup/deletion-plan.csv`
- `reports/v6-v7-phase1-cleanup/deleted-artifacts.csv`
- `reports/v6-v7-phase1-cleanup/blocked-artifacts.csv`
- `reports/v6-v7-phase1-cleanup/proof.html`
- Source input: `reports/v6-v7-sunset/safe-delete-candidates.csv`

## Known Gaps

Phase 2 runtime cleanup remains blocked. Home, Tower, Intelligence, Moves, Source, Admin/data loaders, active tenant data, and V6/V7 historical migrations are untouched. V7 Home/Tower/Intelligence paths must not be removed until the V3 replacement is implemented, merged, deployed through the approved ACA main workflow where runtime-visible, signed-in browser-proven, tenant-safe, and same-or-better for latency and quality.
