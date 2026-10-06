# 2026-09-15 - Source Opportunity Readiness Projection Stability

## Release ID

`2026-09-15-source-opportunity-readiness-projection-stability`

## Status

`candidate`

## Plain-English Summary

Keeps the shared Source opportunity projection consistent when cloud-consumption and contract-depth Layer 4 jobs run in sequence. Control actions remain control-gated, while priced opportunities remain finance-confirmation candidates.

## Layer Impact

`client-data-lane`; shared Layer 4 Source projection and its operator proof.

- L4: the contract-depth projection now preserves the canonical control-action readiness state.
- Product read models: downstream readiness, coverage, and action queues no longer change meaning based on which package ran last.
- L2/L3: unchanged.

## Client Applicability

- All clients using the shared Source projection: reusable behavior.
- Specific clients: none.
- Internal only: operator projection and validation paths.
- Public/demo only: synthetic validation only; no client-identifying data is included.
- Feature flag: none.

## Changes Included

- Preserve `control_action -> control_required` in the contract-depth Layer 4 opportunity view.
- Add a regression assertion so later package projections cannot erase the control-action branch.
- This release record.

## QA / Validation

- Focused Layer 4 projection suite: `PASS` (18 tests).
- ESLint on touched files: `PASS`.
- TypeScript no-emit check: `PASS`.
- Release control check: `PASS`.
- Azure verify-only jobs: `BLOCKED` until this release is deployed; the prior live verifier exposed the projection overwrite this change repairs.
- Signed-in Source proof: `NOT RUN` until the corrected projection is deployed.

## Rollout Plan

Merge through protected `main`, deploy the exact merge SHA through the repo-owned ACA workflow, verify the digest-pinned runtime invariant, rerun the approved Layer 4 projections through ACA Jobs, then run independent readback for the cloud and dense contract packages.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: repository workflow only
- ACA runtime invariant: template image, 100%-traffic revision, and operator Job image must match the approved digest
- Live signed-in proof required: Source portfolio and Contract 360 readiness surfaces after projection

## Rollback Plan

Revert through a new PR and redeploy the prior approved digest. The projection is idempotent and package-scoped; no destructive data rollback is required.

## Audit Evidence

- PR and merge SHA
- Focused test, typecheck, lint, and release-check output
- ACA deploy run, digest, revision, traffic, and runtime-invariant proof
- Cloud and contract-depth Layer 4 ACA Job proof bundles and independent readbacks
- Signed-in Source readiness proof

## Known Gaps

- This release stabilizes readiness semantics; it does not classify the remaining register contracts without an authoritative mapping source.
- Report/email delivery remains outside this release.
