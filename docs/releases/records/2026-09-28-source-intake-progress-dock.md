# 2026-09-28-source-intake-progress-dock - Visible Request decision state

## Release ID

`2026-09-28-source-intake-progress-dock`

## Status

`candidate`

## Plain-English Summary

The Request approval screen now keeps its progress state visible at the viewport edge. It shows a grey, non-clickable status with the next missing control while blocked and one clear green Approve command only after the existing decision requirements are met.

## Layer Impact

`global-control-lane`, Layer 4 Source presentation only. Canonical Request facts, approval policy, server checks and decision payload are unchanged.

## Client Applicability

- All clients: Source New Request approval screen.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Keep a single primary Approve command fixed near the viewport bottom, styled green only when ready.
- Show a fixed grey status instead of a clickable command while rationale, accountable confirmation, authority version or approver permission is missing.
- Reserve page space for the dock so it does not cover the end of the approval form.

## QA / Validation

- Pass: red-first mounted test failed because the existing page had no progress dock.
- Pass: mutation bypassing the human-confirmation predicate made the negative test fail; restored code returned green.
- Pass: Source component suite, 90 suites and 617 tests.
- Pass: Node 24 TypeScript check with an 8 GB heap; scoped ESLint.
- Not run: signed-in post-deploy readback, pending the official main deployment.

## Rollout Plan

Squash merge the reviewed PR, then allow only `.github/workflows/aca-main-deploy.yml` to deploy the exact main SHA. No migration or data job is included.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside that workflow.
- Approved image digest: Record after workflow completion.
- ACA runtime invariant: Verify digest-pinned web template, healthy 100%-traffic revision, and both delivery jobs.
- Worker image invariant: Both delivery jobs must use the approved digest.
- Feature/env flag update path: None.
- Live signed-in proof required: grey blocked status and green ready action remain visible without scrolling; no decision submission.

## Rollback Plan

Revert the PR through protected main and let the repo-owned workflow deploy the rollback SHA. No schema or data rollback is required.

## Audit Evidence

Local red/green and mutation output, PR checks, official deploy run, Azure digest readback, and signed-in smoke ledger.

## Known Gaps

This presentation change does not create an approval decision or supply missing Request evidence. A positive decision still requires an authorized person and the existing server validation.
