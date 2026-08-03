# 2026-08-03-tower-demo-story-data-contract - Tower Demo Story Data Contract

## Release ID

`2026-08-03-tower-demo-story-data-contract`

## Status

`candidate`

## Plain-English Summary

Tower now distinguishes value-at-stake, partial finance-validated value, and claimable value when reading the governed `tower.*` model. The change also adds a repeatable audit that checks whether the synthetic airline demo source package can support the Tower tab-by-tab narrative before the UI is treated as demo-ready.

## Layer Impact

Release lanes: `global-control-lane`, `client-data-lane`.

Canonical model projection: The source promotion SQL now carries project value-at-stake into `tower.value_claim.promised_value`, using a transparent approved-budget fallback when the raw expected-value field is qualitative.

Products: The Tower read model now reads project budget observations, linked outcome evidence, vendor metadata, and separated value states instead of rendering zero-dollar program lanes or misclassifying unknown-value claims as AI candidate opportunities.

QA/governance: A new story-data audit validates that Command Center, Value Proof, Decision Lanes, AI Portfolio, Evidence, and Recommended Actions each have supporting synthetic facts.

## Client Applicability

All clients: No.

Specific clients: Demo tenants using the Tower schema-backed read path.

Internal only: No.

Public/demo only: Yes, this is demo-story and governed projection readiness.

Feature flag: None.

## Changes Included

- `scripts/source/skyharbor-v3/load_source_tower_measurements.sql`
- `src/lib/tower/readTowerCommandCenter.ts`
- `src/lib/tower/__tests__/readTowerCommandCenter.test.ts`
- `scripts/tower/audit-tower-demo-story-data.mjs`
- `package.json`

## QA / Validation

- `npm run audit:tower-demo-story-data` - PASS.
- `npm test -- --runTestsByPath src/lib/tower/__tests__/readTowerCommandCenter.test.ts --runInBand` - PASS. The run emitted existing duplicate manual mock warnings unrelated to this change.
- `npx eslint src/lib/tower/readTowerCommandCenter.ts src/lib/tower/__tests__/readTowerCommandCenter.test.ts scripts/tower/audit-tower-demo-story-data.mjs` - PASS.

## Rollout Plan

Merge through PR to `main`. The production web runtime must be updated only by the repo-owned Azure Container Apps main deploy workflow. Any data-plane reload must run through the approved Container Apps data-build job path with proof bundle and review, not through an ad-hoc web request or manual production mutation.

## Deployment Authority

- Repo-owned deploy workflow: Required for web runtime rollout.
- Shared runtime mutators: None in this PR.
- Approved image digest: To be produced by the main deploy workflow after merge.
- ACA runtime invariant: Required before claiming production live.
- Worker image invariant: Required for any data-build job reload.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Tower route proof after deployment and after any approved data reload.

## Rollback Plan

Revert the PR and redeploy through the repo-owned Azure Container Apps main deploy workflow. If a data-build job has loaded promoted Tower values, rerun the prior approved data-build input or restore from the job proof bundle according to the data-build runbook.

## Audit Evidence

- Story-data audit JSON from `npm run audit:tower-demo-story-data`.
- Targeted Tower read-model Jest test.
- Targeted ESLint run.
- PR review and main deploy workflow after merge.
- Signed-in Tower desktop/mobile screenshots after deployment and approved data reload.

## Known Gaps

The current synthetic source package has qualitative expected-value text for projects, not explicit numeric expected-value dollars. Tower therefore uses approved budget as value-at-stake with a caveat until a future source package adds governed numeric expected-value fields.
