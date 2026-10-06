# 2026-09-08 Tower Source-Bridge Refresh Guard

## Release ID

`2026-09-08-tower-source-bridge-refresh-guard`

## Status

`candidate`

## Plain-English Summary

Tower Layer 4 refreshes now stop before deleting active Source-to-Tower action rows unless the operator explicitly acknowledges that the Source bridge jobs will be reapplied. This prevents an otherwise valid Tower rebuild from silently removing contract actions that were loaded independently.

Source bridge rows also carry package-aware claim-gate language, so managed-services contract actions are not mislabeled as cloud opportunities in the executive queue.

## Layer Impact

- Release lane: `client-data-lane`.
- Layer 4 Products: The Tower projection refresh receives a pre-delete safety gate.
- Layers 1-3: No intake, adapter, canonical object, calculation, or tenant record changes.

## Client Applicability

- All clients: Yes, when Source extension rows are present in an active Tower assessment.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Pre-delete detection for governed Source cloud and contract-depth bridge rows.
- Explicit operator acknowledgment through `TOWER_LAYER4_SOURCE_BRIDGE_REAPPLY_APPROVED=true` before a refresh may remove those rows.
- Job summary evidence recording whether that acknowledgment was supplied.
- Package-aware cloud versus contract-depth claim-gate wording.
- Focused purge/load SQL contract tests.

## QA / Validation

- Focused Layer 4 purge-mode test: PASS (7 checks).
- Layer 4 dry-run SQL generation and guard inspection: PASS.
- Scoped ESLint: PASS.
- Release-control check: PASS after this record is included.
- Live Source-action readback after bridge reapply: NOT RUN; required after deployment.

## Rollout Plan

Merge through the protected PR lane and deploy the exact main SHA through the repo-owned ACA workflow. Reapply the governed Source bridge jobs through the ACA operator job, verify their readbacks, and confirm the Source contract actions appear in the signed-in Tower queue.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: Repo-owned workflow and governed ACA operator job only.
- Approved image digest: Recorded by the deployment workflow and ACA job proof.
- ACA runtime invariant: Template, active revision, and 100% traffic image must match the workflow-approved digest.
- Worker image invariant: Worker jobs must remain digest-aligned with the approved web image.
- Feature/env flag update path: Per-run ACA operator environment only.
- Live signed-in proof required: Yes; the Tower Source-action queue must show both cloud and managed-services actions and link to Source Contract 360.

## Rollback Plan

Revert the squash merge through a new PR and redeploy that main SHA. The guard does not mutate data by itself. Any bridge data rollback must use the existing idempotent bridge loader for the affected dataset and active Tower assessment.

## Audit Evidence

- PR URL, merge SHA, CI run, and ACA deploy run after publication.
- Focused local test and generated SQL inspection.
- ACA Source-bridge apply and verify proof bundles.
- Signed-in Tower and Source browser proof.

## Known Gaps

The guard prevents silent removal but does not itself execute the bridge jobs. The governed release sequence remains Tower refresh followed by each applicable Source bridge apply and verify job.
