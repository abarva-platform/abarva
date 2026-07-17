# 2026-07-16-legacy-dataset-sunset-pr2 — Legacy Dataset Sunset PR2

## Release ID

`2026-07-16-legacy-dataset-sunset-pr2`

## Status

`candidate`

## Plain-English Summary

This release freezes default legacy dataset generation and moves the local Home/Knowledge runtime proof path off legacy-named dataset folders. Default local runtime now reads deterministic rows from canonical `standard-2026-07-v3` tenant inputs and approved advisory artifacts from a neutral tenant-key artifact store. Legacy dataset folders remain as frozen references only; this release does not delete, archive, load Azure/Postgres, promote context, or deploy.

## Layer Impact

Release lane: `global-control-lane` for shared runtime proof, operator scripts, and local artifact layout.

Runtime proof layer: `getLocalCxoRuntimeBrowser` now uses canonical v3 tenant inputs plus neutral approved Home/Knowledge artifacts, and the runtime proof records `local-v3-standard` with canonical input paths.

Operator layer: Package-level v3 generation/audit commands route through neutral `scripts/tenant-v3` wrappers. Package-level legacy generation commands are blocked by default.

Artifact layer: Approved Home/Knowledge story blocks and visual specs are mirrored into `datasets/context-artifacts/approved/<tenant>/home-knowledge`.

Data-plane layer: No Azure/Postgres mutation, tenant promotion, candidate load, or production/lab deploy is included.

## Client Applicability

- All clients: Yes, for shared runtime proof and operator guardrails.
- Specific clients: Meridian, SkyHarbor Air, and First Capital are covered by the neutral local artifact store and standard v3 input proof.
- Internal only: Legacy dataset inventory and sunset audit reports.
- Public/demo only: No.
- Feature flag: No.

## Changes Included

- `src/lib/home/local-cxo-runtime.ts`
- `scripts/knowledge/runtime-proof-cxo-context.ts`
- `scripts/knowledge/audit-cxo-story-blocks.mjs`
- `scripts/knowledge/generate-cxo-story-blocks.mjs`
- `scripts/audit/legacy-dataset-sunset.mjs`
- `scripts/audit/block-legacy-dataset-generation.mjs`
- `scripts/tenant-v3/*` neutral wrappers
- `datasets/context-artifacts/approved/*/home-knowledge/*`
- `reports/legacy-dataset-sunset/*`

## QA / Validation

- Pass: `npm run audit:legacy-dataset-sunset`
- Pass: `npm run audit:knowledge-cxo-story-blocks`
- Pass: `npm run audit:multi-tenant-runtime-retrieval-proof`
- Additional validation is recorded in the final agent summary for this slice.

## Rollout Plan

Merge through the normal PR path if approved. The repo-owned ACA main deploy workflow may deploy after merge if this release is selected for runtime rollout. No ad-hoc Azure command or direct shared traffic mutation is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: Required for any deployment.
- Shared runtime mutators: None in this PR.
- Approved image digest: Not applicable until main deploy workflow builds one.
- ACA runtime invariant: Must be proven after any approved deployment.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: Required only if deployed and claimed live.

## Rollback Plan

Revert this PR. The old legacy-named local folders were not deleted, so rollback is source-only and does not require database restoration.

## Audit Evidence

- `reports/legacy-dataset-sunset/summary.md`
- `reports/legacy-dataset-sunset/standard-v3-inputs.csv`
- `reports/legacy-dataset-sunset/neutral-artifact-store.csv`
- `reports/legacy-dataset-sunset/default-runtime-read-scan.csv`
- `reports/legacy-dataset-sunset/generation-freeze.csv`
- `reports/legacy-dataset-sunset/legacy-dataset-inventory.csv`
- `reports/legacy-dataset-sunset/proof.html`
- `reports/multi-tenant-runtime-retrieval-proof/tenant-retrieval.csv`

## Known Gaps

Physical archive/delete is still not performed. Some runtime/API/internal symbols retain compatibility names and are tracked separately by the legacy-language burndown. DB/schema retirement remains a separate data-plane workstream.
