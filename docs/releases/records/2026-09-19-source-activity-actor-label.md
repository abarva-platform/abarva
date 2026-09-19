# 2026-09-19-source-activity-actor-label

## Release ID

`2026-09-19-source-activity-actor-label`

## Status

`candidate`

## Plain-English Summary

Older Source activity rows can contain an internal actor key without a
reader-facing name or role. The decision trail previously rendered that key as
though it were a person's name. It now says `Recorded user` when an actor key
exists but no display identity was captured.

## Layer Impact

`global-control-lane`. Layer 4 Source presentation only. No canonical records,
activity rows, or identity data are changed.

## Client Applicability

- All clients: Source New decision trails.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Source activity reader actor-label fallback.
- Direct behavior coverage for an internal actor key with no display identity.
- This release record.

## QA / Validation

- A behavior case reproduces the internal-key disclosure before the change.
- The focused activity-reader suite passes after the change.
- The existing no-actor case still renders no actor instead of inventing one.
- TypeScript, scoped ESLint, release control, and the Source workspace suites
  run before merge.

## Rollout Plan

Squash-merge through the protected repository and deploy only through the
repo-owned ACA main workflow.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None.
- Approved image digest: Recorded by the deploy workflow after merge.
- ACA runtime invariant: Required before deployment is claimed.
- Worker image invariant: Required before deployment is claimed.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert through a new PR. No data rollback is required.

## Audit Evidence

PR, focused test output, CI, repo-owned deployment proof, and signed-in
Approvals-view readback.

## Known Gaps

This presentation fallback does not retroactively populate missing display
names. Canonical identity enrichment remains a separate data-quality concern.
