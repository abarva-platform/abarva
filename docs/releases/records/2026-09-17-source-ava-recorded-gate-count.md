# 2026-09-17-source-ava-recorded-gate-count

## Release ID

`2026-09-17-source-ava-recorded-gate-count`

## Status

`candidate`

## Plain-English Summary

Source chat now counts signal-stage and recorded approval blockers when explaining how many contract opportunities still need review. A summary cannot report zero gated lines while its own lever rows show explicit gates.

## Layer Impact

Layer 4 Source answer presentation only. Canonical opportunity records, authorization, and data-plane rows are unchanged.

## Client Applicability

- All clients: Source contract chat answers with governed opportunity rows.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Source chat availability.

## Changes Included

Count recorded signal-stage and blocking-gap gates in the answer summary. Add behavior tests for unsized and sized rows.

## QA / Validation

PASS: 19 focused behavior tests, scoped ESLint, TypeScript, and release check. NOT RUN: signed-in production answer check, required after deployment.

## Rollout Plan

Squash merge through a PR; deploy through the repo-owned ACA main workflow. No schema migration, data build, or flag change.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy.yml`.
- Shared runtime mutators: None outside that workflow.
- Approved image digest: Recorded by the workflow.
- ACA runtime invariant: Verify template and 100%-traffic revision match the approved digest.
- Worker image invariant: Verify in the workflow.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, for a contract with signal-stage levers and recorded review blockers.

## Rollback Plan

Revert the PR and redeploy through the same workflow. No data rollback is needed.

## Audit Evidence

PR and CI links, deploy run and digest readback, then the signed-in answer transcript.

## Known Gaps

This corrects the count of recorded gates, not the completeness of the underlying opportunity evidence or broader aVa question set.
