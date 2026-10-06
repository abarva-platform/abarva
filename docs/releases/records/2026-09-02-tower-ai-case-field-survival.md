# 2026-09-02-tower-ai-case-field-survival - Tower AI Case Field Survival

## Release ID

`2026-09-02-tower-ai-case-field-survival`

## Status

`candidate`

## Plain-English Summary

Tower AI business cases now have an explicit survival contract. Fields such as value story, value type, build-cost range, projected value range, ROI, payback, success metric, proof needed, sponsor role, Finance role, Finance status, readiness, confidence, gating constraint, source identifiers, and quality state must survive from source intake through canonical rows, product read models, and the AI case cube.

## Layer Impact

`client-data-lane` affects generated tenant packages and the governed Tower data path. Layer 1 source rows remain intake-owned, Layer 2 preserves lineage, Layer 3 carries canonical AI business-case fields and measures, and Layer 4 exposes the same fields for Tower and aVa consumption.

`global-control-lane` affects release validation. The release check now scans generated tenant packages with AI business-case source data and fails when the contract is not met.

## Client Applicability

All clients: applies to any generated tenant package that includes a Tower AI business-case source extract.

Specific clients: not applicable.

Internal only: release validation behavior applies to repository workflows.

Public/demo only: not applicable.

Feature flag: none.

## Changes Included

- Added `docs/architecture/tower/ai-business-case-field-survival-contract.json`.
- Added `scripts/tower/validate-ai-business-case-field-survival.mjs`.
- Added `scripts/release-control/check-tower-ai-business-case-field-survival.mjs`.
- Added `scripts/tower/__tests__/run-ai-business-case-field-survival-tests.mjs`.
- Updated `scripts/release-check.mjs` to run the new gate.
- Updated Tower package generation, Layer 3 canonical case artifacts, Layer 4 generated read models, and Layer 4 cube payloads so AI business-case detail survives to product consumption.
- Updated `scripts/tower/validate-meridian-layer1-source.mjs` to require both AI case and tool rollout field-survival contracts.
- Regenerated the package files under `datasets/tenant-inputs/generated/meridian-health/tower-layer1-v2026-08-business-case/`.

## QA / Validation

Pass: `node scripts/tower/generate-meridian-layer1-source.mjs`.

Pass: `node scripts/tower/validate-ai-business-case-field-survival.mjs`.

Pass: `node scripts/tower/__tests__/run-ai-business-case-field-survival-tests.mjs`.

Pass: `node scripts/tower/__tests__/run-tool-rollout-field-survival-tests.mjs`.

Pass: `node scripts/tower/validate-meridian-layer1-source.mjs`.

Pass: `npx eslint scripts/tower/generate-meridian-layer1-source.mjs scripts/tower/load-healthcare-demo-layer4-products.mjs scripts/tower/validate-ai-business-case-field-survival.mjs scripts/tower/validate-meridian-layer1-source.mjs scripts/tower/__tests__/run-ai-business-case-field-survival-tests.mjs scripts/release-control/check-tower-ai-business-case-field-survival.mjs scripts/release-check.mjs`.

Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`.

Pass: `npm run release:check -- --base origin/main --head HEAD`.

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

Revert the PR to remove the contract, release-check hook, generated package changes, widened read-model artifacts, and widened cube payloads. If a data-build job later applies the widened package, rerun the prior approved package through the governed data-build job path.

## Audit Evidence

- `docs/architecture/tower/ai-business-case-field-survival-contract.json`
- `scripts/tower/validate-ai-business-case-field-survival.mjs`
- `scripts/release-control/check-tower-ai-business-case-field-survival.mjs`
- `scripts/tower/__tests__/run-ai-business-case-field-survival-tests.mjs`
- `datasets/tenant-inputs/generated/meridian-health/tower-layer1-v2026-08-business-case/cube/tower_ai_case_cube.csv`

## Known Gaps

No Azure data-plane load, ACA deployment, or signed-in browser proof is included in this release candidate. Those require the governed deploy and data-build paths after merge.
