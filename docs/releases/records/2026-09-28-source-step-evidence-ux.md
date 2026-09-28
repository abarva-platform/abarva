# 2026-09-28-source-step-evidence-ux - Single active evidence request

## Release ID

`2026-09-28-source-step-evidence-ux`

## Status

`candidate`

## Plain-English Summary

The active Source step no longer repeats its evidence request in a wide table below the step guidance. The required input, readback, and upload or review action remain together on the step. Continue and approval readiness still use the governed evidence state.

## Layer Impact

`global-control-lane`, Layer 4 Products: Source presentation only. Layer 3 facts, evidence requirements, server authorization, and approval persistence are unchanged.

## Client Applicability

- All clients: Source New users on the shared product surface.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Removed the redundant active-step evidence table and its unused rendering helpers.
- Retained the active-step needs summary, guide, upload/readback action, and stage-level Files review.
- Updated mounted workflow tests across the Source stages to require one active request without the duplicate table.

## QA / Validation

- Pass: red-first mounted regression failed when the duplicate table was present.
- Pass: a deliberate reintroduction of the table failed the regression; the mutation was restored.
- Pass: focused analytics canvas suite (23 suites, 198 tests).
- Pass: Node 24 TypeScript check with an 8 GB heap and scoped ESLint.
- Not run: signed-in post-deploy review, pending the official main deployment.

## Rollout Plan

Squash merge the reviewed PR, then allow only `.github/workflows/aca-main-deploy.yml` to build and deploy the exact main SHA. No migration or data job is included.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside that workflow.
- Approved image digest: Record after workflow completion.
- ACA runtime invariant: Verify digest-pinned web template, healthy 100%-traffic revision, and both delivery jobs.
- Worker image invariant: Both delivery jobs must use the approved digest.
- Feature/env flag update path: None.
- Live signed-in proof required: Active-step evidence and hidden Continue when the required input is missing.

## Rollback Plan

Revert the PR through protected main and let the repo-owned workflow deploy the rollback SHA. No schema or data rollback is required.

## Audit Evidence

Local red/green and mutation output, PR review and CI, official deploy run, Azure digest readback, and signed-in smoke ledger.

## Known Gaps

This presentation change does not assign every canonical required evidence item to a workflow task. Unmapped requirements remain governed by the stage-level evidence and approval gates; the one-to-many step mapping is a separate contract change.
