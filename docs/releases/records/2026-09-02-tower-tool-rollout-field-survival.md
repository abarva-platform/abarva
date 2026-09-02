# 2026-09-02-tower-tool-rollout-field-survival — Tower Tool Rollout Field Survival

## Release ID

`2026-09-02-tower-tool-rollout-field-survival`

## Status

`candidate`

## Plain-English Summary

Tower tool rollout data now has an explicit survival contract. Fields such as enabled users, monthly active users, adoption targets, control blockers, owner roles, source identifiers, refresh cadence, and quality state must survive from source intake through canonical rows, product read models, and the tool rollout cube.

## Layer Impact

`client-data-lane` affects generated tenant packages and the governed Tower data path. Layer 1 source rows remain intake-owned, Layer 2 preserves lineage, Layer 3 carries canonical tool fields and measures, and Layer 4 exposes the same fields for Tower and aVa consumption.

`global-control-lane` affects release validation. The release check now scans generated tenant packages with tool rollout source data and fails when the contract is not met.

## Client Applicability

All clients: applies to any generated tenant package that includes a Tower AI tool rollout source extract.

Specific clients: not applicable.

Internal only: release validation behavior applies to repository workflows.

Public/demo only: not applicable.

Feature flag: none.

## Changes Included

- Added `docs/architecture/tower/tool-rollout-field-survival-contract.json`.
- Added `scripts/tower/validate-tool-rollout-field-survival.mjs`.
- Added `scripts/release-control/check-tower-tool-rollout-field-survival.mjs`.
- Updated `scripts/release-check.mjs` to run the field-survival gate.
- Updated Tower package generation, Layer 3 loading, Layer 4 loading, and Tower read-model types so tool rollout usage and adoption fields survive to product consumption.
- Added `scripts/tower/__tests__/run-tool-rollout-field-survival-tests.mjs`.
- Regenerated the package files under `datasets/tenant-inputs/generated/meridian-health/tower-layer1-v2026-08-business-case/`.

## QA / Validation

Passed: `node scripts/tower/generate-meridian-layer1-source.mjs`.

Passed: `node scripts/tower/validate-tool-rollout-field-survival.mjs`.

Passed: `node scripts/tower/validate-meridian-layer1-source.mjs`.

Passed: `node scripts/tower/__tests__/run-tool-rollout-field-survival-tests.mjs`.

Passed: `node --check` on the modified Tower generation, validation, and loading scripts.

Passed: `npx eslint` on the modified scripts, Tower reader/view-model files, drawer, aVa context, and focused tests.

Passed: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`.

Passed: `npx jest src/lib/tower/__tests__/current-layer-answer.test.ts src/components/tower/command-center/__tests__/TowerCommandCenter.test.tsx --runInBand`.

Passed: `npm run release:check -- --base origin/main --head HEAD`.

## Rollout Plan

Merge through the protected repository PR flow. The code change becomes available through the normal repo-owned Azure Container Apps main deploy workflow. Generated package changes remain source-controlled package artifacts until an approved data-build job applies them to the shared data plane.

## Deployment Authority

Repo-owned deploy workflow: required for web/runtime deployment after merge.

Shared runtime mutators: none in this release candidate.

Approved image digest: not applicable until the repo-owned deploy workflow builds an image.

ACA runtime invariant: must be verified by the deploy workflow if a runtime deployment follows.

Worker image invariant: required before any approved data-build job uses the new loaders.

Feature/env flag update path: none.

Live signed-in proof required: required after any runtime deploy or data-plane refresh that claims Tower/aVa consumption of the widened fields.

## Rollback Plan

Revert the PR to remove the contract, release-check hook, generated package changes, and widened read-model fields. If a data-build job later applies the widened package, rerun the prior approved package through the governed data-build job path.

## Audit Evidence

- `docs/architecture/tower/tool-rollout-field-survival-contract.json`
- `scripts/tower/validate-tool-rollout-field-survival.mjs`
- `scripts/release-control/check-tower-tool-rollout-field-survival.mjs`
- `scripts/tower/__tests__/run-tool-rollout-field-survival-tests.mjs`
- `datasets/tenant-inputs/generated/meridian-health/tower-layer1-v2026-08-business-case/cube/tower_ai_tool_rollout_cube.csv`

## Known Gaps

No Azure data-plane load, ACA deployment, or signed-in browser proof is included in this release candidate. Those require the governed deploy and data-build paths after merge.
