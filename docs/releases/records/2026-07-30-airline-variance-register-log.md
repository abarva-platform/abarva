# 2026-07-30-airline-variance-register-log — Airline Variance Register Log

## Release ID

`2026-07-30-airline-variance-register-log`

## Status

`candidate`

## Plain-English Summary

This change makes the Airline live reconciliation readback print a compact failing-variance register directly in the governed job logs. Operators can see which reconciliation gates failed without requiring local access to the private proof bundle.

## Layer Impact

- Release lane: `client-data-lane`, with `internal-admin` audit tooling impact.
- Layer 4 Products / QA: Improves the read-only reconciliation audit output used before Cube and product certification.
- No tenant facts, review decisions, canonical Knowledge records, publications, baselines, projections, or product provider settings are changed by this release.

## Client Applicability

- All clients: No.
- Specific clients: Airline Demo New audit lane only.
- Internal only: Yes.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `scripts/qa/airline-e2e-live-reconciliation-readback.mjs`
  - Adds a compact `FAILING_VARIANCE_REGISTER` JSON log event for unresolved gates.
  - Includes gate name, counts, first broken layer, classification, repair guidance, validation query, and proof bundle URI.

## QA / Validation

- `node --check scripts/qa/airline-e2e-live-reconciliation-readback.mjs` passed.
- Local source-only smoke with `--skip-db --no-field-detail` verified the new JSON log shape.
- Final proof must come from the governed Airline VNet reconciliation job after deployment.

## Rollout Plan

Merge to main, deploy through the repo-owned Azure Container Apps main workflow, then rerun `job-airdn-reconcile-audit-lab` against Airline Demo New.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this release.
- Approved image digest: Produced by the deploy workflow.
- ACA runtime invariant: Required before rerunning the VNet job.
- Worker image invariant: The reconciliation job must use the deployed digest-pinned image.
- Feature/env flag update path: None.
- Live signed-in proof required: No; this is an internal readback audit output change.

## Rollback Plan

Revert this script change and redeploy the previous digest. Existing proof bundles remain valid but will not include the compact log event.

## Audit Evidence

- PR for this release.
- CI results.
- ACA deploy workflow result.
- Governed VNet reconciliation job log showing `FAILING_VARIANCE_REGISTER`.
- Private proof bundle referenced by the log event.

## Known Gaps

- This does not close the three variance gates. It only makes them visible in the governed job logs so the next repair can target the earliest broken transition.
- This does not ingest or reference the offline Airline interview augmentation package.
