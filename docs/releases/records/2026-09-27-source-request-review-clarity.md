# 2026-09-27 Source Request Review Clarity

## Release ID

`2026-09-27-source-request-review-clarity`

## Status

`candidate`

## Plain-English Summary

The Source request page now shows pending decisions once, with their recorded decision owners, separately from event workspaces. The approval form explains precisely how much rationale text remains before its action is available.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Source presentation only. Canonical facts, approval authority, and the 12-character audit-rationale requirement are unchanged.

## Client Applicability

- All clients: yes, for signed-in Source New request and event-approval views.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Source request queue presentation and event owner labels.
- Source event-approval rationale feedback beside the decision controls.
- Focused component regressions for two pending decisions and trimmed rationale length.

## QA / Validation

- Pass: focused Jest suites, 26 tests.
- Pass: scoped ESLint.
- Pass: TypeScript project check with an 8 GB Node heap; the default 4 GB heap exhausted on this repository.
- Pass: mutation proof. Counting untrimmed rationale text made the new regression fail before the correct rule was restored.
- Pass: signed-in pre-fix reproduction of the disabled action and duplicate queue presentation on a synthetic event. No approval was submitted.
- Not run: post-deployment signed-in replay; required after the official deployment.

## Rollout Plan

Squash merge after applicable PR checks and review, then use only the repo-owned ACA main deployment workflow. No migration or data build is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside the workflow.
- Approved image digest: pending official deployment.
- ACA runtime invariant: pending official deployment.
- Worker image invariant: pending official deployment.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, for the same form and request queue.

## Rollback Plan

Revert the squash commit and redeploy through the repo-owned workflow. No schema or data rollback is required.

## Audit Evidence

- Focused test and mutation output in the PR validation summary.
- Official workflow, runtime digest, and post-deployment browser evidence to be linked after rollout.

## Known Gaps

- This release does not submit an accountable human approval on a user's behalf. It verifies readiness and presentation without creating that attestation.
