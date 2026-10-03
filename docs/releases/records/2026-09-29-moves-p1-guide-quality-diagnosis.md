# 2026-09-29 — P1 Discovery Guide Quality Diagnosis

## Release ID

`2026-09-29-moves-p1-guide-quality-diagnosis`

## Status

`candidate`

## Plain-English Summary

The P1 Discovery Workshop Guide now uses a fixed, five-section brief that prepares discovery without generating findings or later-phase design. When a generated document is blocked, the build panel distinguishes evidence gaps from quality blockers and displays the actual blocker and next action.

## Layer Impact

- Release lane: `global-control-lane`.
- `Products / Moves`: constrains P1 guide generation and clarifies blocked-output status.
- `Shared application logic`: refines run-readiness classification without changing approval or phase-gate policy.

## Client Applicability

- All clients: Applies to Moves P1 Discovery Workshop Guide generation and blocked-run messaging.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Fixed P1 discovery-plan brief backed by its canonical structure and use-case evidence/interview blueprint.
- Phase-specific orchestrator keys for later workshop guides; they no longer alias the P1 discovery plan.
- Blocker classification and UI details that separate retrieved evidence, actual evidence gaps, and generation-quality failures.
- Regression coverage for the overlong-document blocker and the absence of false evidence-upload instructions.

## QA / Validation

- Pass: 10 targeted Jest suites, 172 tests across guide, readiness, component, generation, and API route coverage.
- Pass: repository typecheck.
- Pass: ESLint on changed source and test files.
- Pass: `git diff --check`.
- Not run: signed-in regeneration and review of the P1 outputs on the deployed runtime; required after merge and deployment.

## Rollout Plan

Merge through a pull request, then use the repository-owned ACA main deploy workflow for the merged main SHA. Replay the P1 build in the authorized synthetic workspace and inspect both output status and generated guide before advancing any phase.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside the repository-owned workflow.
- Approved image digest: Pending exact-SHA workflow build.
- ACA runtime invariant: Pending post-deploy verification of template image, 100%-traffic revision, and required worker job images.
- Worker image invariant: Pending post-deploy verification.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes; verify a P1 rebuild, blocker rendering when blocked, and generated guide scope on the deployed revision.

## Rollback Plan

Revert the change through a pull request and redeploy the reverted main SHA using the repository-owned ACA main deploy workflow. No schema migration or feature-flag rollback is involved.

## Audit Evidence

- Pull request and required CI run: pending.
- Exact-SHA ACA main deploy run and digest verification: pending.
- Signed-in synthetic P1 rebuild and output review: pending.

## Known Gaps

The deployed P1 rebuild has not yet been replayed. This candidate does not itself complete the broader synthetic journey through P2–P5.
