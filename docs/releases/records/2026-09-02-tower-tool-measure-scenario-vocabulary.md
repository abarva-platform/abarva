# 2026-09-02-tower-tool-measure-scenario-vocabulary — Tower Tool Measure Scenario Vocabulary

## Release ID

`2026-09-02-tower-tool-measure-scenario-vocabulary`

## Status

`candidate`

## Plain-English Summary

Tower tool rollout measures now use the physical scenario vocabulary accepted by the canonical measure schema. The enabled-users measure remains identifiable by its metric key, while its scenario is recorded as a current-state measurement rather than a separate unsupported scenario value.

## Layer Impact

`client-data-lane` affects the Layer 3 canonical Tower load path. The generated package is unchanged; the canonical load SQL now emits schema-valid measure rows for tool rollout enabled-user counts.

`global-control-lane` affects validation. The tool rollout field-survival regression now dry-runs the Layer 3 SQL and fails if the enabled-users measure emits the unsupported scenario value again.

## Client Applicability

All clients: applies to any generated Tower tool rollout package loaded through this Layer 3 canonical path.

Specific clients: not applicable.

Internal only: validation behavior applies to repository workflows and governed data-build jobs.

Public/demo only: not applicable.

Feature flag: none.

## Changes Included

- Updated `scripts/tower/load-healthcare-demo-layer3-canonical.mjs` so `enabled_users` uses the `current` measure scenario.
- Updated `scripts/tower/__tests__/run-tool-rollout-field-survival-tests.mjs` to dry-run Layer 3 SQL generation and reject the unsupported scenario value.

## QA / Validation

Passed: `node scripts/tower/__tests__/run-tool-rollout-field-survival-tests.mjs`.

Passed: `node scripts/tower/load-healthcare-demo-layer3-canonical.mjs --out-dir /tmp/tower-layer3-tool-scenario-dryrun-20260902`.

Passed: `npx eslint scripts/tower/load-healthcare-demo-layer3-canonical.mjs scripts/tower/__tests__/run-tool-rollout-field-survival-tests.mjs`.

Passed: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`.

## Rollout Plan

Merge through the protected repository PR flow. The code change becomes available through the normal repo-owned Azure Container Apps main deploy workflow. Any shared data-plane refresh must use the governed ACA data-build job path with a digest-pinned image built from the merged commit.

## Deployment Authority

Repo-owned deploy workflow: required for web/runtime deployment after merge.

Shared runtime mutators: none in this release candidate.

Approved image digest: not applicable until the repo-owned deploy workflow builds an image.

ACA runtime invariant: must be verified by the deploy workflow if a runtime deployment follows.

Worker image invariant: required before any approved data-build job uses the corrected loader.

Feature/env flag update path: none.

Live signed-in proof required: required after any runtime deploy or data-plane refresh that claims Tower consumption of the corrected data.

## Rollback Plan

Revert the PR. If a data-build job later applies data produced by this loader, rerun the prior approved package through the governed data-build job path.

## Audit Evidence

- `scripts/tower/load-healthcare-demo-layer3-canonical.mjs`
- `scripts/tower/__tests__/run-tool-rollout-field-survival-tests.mjs`
- `/tmp/tower-layer3-tool-scenario-dryrun-20260902/tower_layer3_ecl_context_load.sql`

## Known Gaps

No Azure data-plane load, ACA deployment, or signed-in browser proof is included in this release candidate. Those require the governed deploy and data-build paths after merge.
