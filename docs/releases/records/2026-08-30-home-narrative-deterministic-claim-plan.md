# 2026-08-30-home-narrative-deterministic-claim-plan — Home Narrative Claim Planning

## Release ID

`2026-08-30-home-narrative-deterministic-claim-plan`

## Status

`candidate`

## Plain-English Summary

This change moves the Home narrative path from free-form thesis drafting to deterministic claim planning. The ECL Home narrative job now selects its auditable claim set from governed signal and context statements first, then uses the existing verifier and prose writer only after those claims are selected.

## Layer Impact

Layer 4 Products (`global-control-lane`): Home narrative generation changes for the ECL-backed Home path. The rendered chapter content continues to come from ECL projection rows and the existing publication gates.

Layer 3 Canonical Model: No canonical schema or data changes.

Layer 2 Source Adapters: No source adapter changes.

Layer 1 Client Intake: No intake template or source-data changes.

## Client Applicability

- All clients: No default impact unless they use the ECL Home narrative generation job.
- Specific clients: Synthetic demonstration tenants using the ECL Home narrative job.
- Internal only: Operator build and validation workflow.
- Public/demo only: None.
- Feature flag: Existing write gates remain unchanged.

## Changes Included

- `scripts/data-build/build-enterprise-thesis.ts` adds a deterministic claim-plan mode and prompt-version bump.
- `scripts/ecl/build_home_ecl_narrative_layer.ts` uses deterministic claim planning for the ECL Home narrative job.
- `scripts/ecl/__tests__/run-home-ecl-narrative-layer-tests.mjs` asserts that the deterministic claim planner exists and is used by the ECL Home narrative path.

## QA / Validation

- `node scripts/ecl/__tests__/run-home-ecl-narrative-layer-tests.mjs` passed.
- `npx jest tests/behaviors/enterprise-thesis-validation.test.ts scripts/data-build/__tests__/enterprise-signal-packet.test.ts --runInBand` passed.
- `NODE_OPTIONS=--max-old-space-size=8192 ./node_modules/.bin/tsc --noEmit --pretty false --skipLibCheck --project tsconfig.json` passed.

## Rollout Plan

Merge to `main`, deploy through the repo-owned Azure Container Apps workflow, then run the Home ECL narrative job in plan-only mode before any write. Publication remains blocked unless the existing publication and visible-quality gates pass.

## Deployment Authority

- Repo-owned deploy workflow: Required for live runtime image.
- Shared runtime mutators: None outside the approved workflow.
- Approved image digest: Captured by the ACA workflow after merge.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy.
- Feature/env flag update path: No new feature flag or env var.
- Live signed-in proof required: Required only after any accepted write is applied to the ECL Home projection rows.

## Rollback Plan

Revert the merge commit and redeploy the prior ACA image. No migration rollback is required because this change does not alter schema or write data by itself.

## Audit Evidence

- Pull request and merge commit.
- Local validation command outputs listed above.
- ACA deploy run after merge.
- Plan-only Home ECL narrative job output after deploy.

## Known Gaps

This release does not publish new Home narrative rows. It changes the generation path and must be followed by a plan-only proof run before any write is considered.
