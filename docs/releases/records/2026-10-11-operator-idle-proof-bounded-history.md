# 2026-10-11-operator-idle-proof-bounded-history — Bounded Operator Idle Readback

## Release ID

`2026-10-11-operator-idle-proof-bounded-history`

## Status

`candidate`

## Plain-English Summary

The operator job's cleanup check now reads a short list of unfinished executions. A long history of completed executions can no longer overwhelm the local command buffer while checking that the job is idle. Azure CLI failures also produce bounded diagnostics instead of printing a large execution payload.

## Layer Impact

Release lane: `internal-admin`. The four data layers and product projections do not change. The check continues to block completion when another execution is running, queued, or has an unrecognized status.

## Client Applicability

- All clients: Operator jobs for any client use the shared check.
- Specific clients: None.
- Internal only: Yes; this changes the operator wrapper.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `scripts/ops/submit-aca-operator-job.mjs` asks the Azure CLI for only unfinished execution names and statuses during idle verification.
- The wrapper omits buffered stdout on process errors and limits other CLI error output.
- `scripts/ops/__tests__/submit-aca-operator-job.test.ts` covers the narrow query, queued and unknown executions, and bounded diagnostics.

## QA / Validation

- PASS: Focused Jest suite, 22 tests.
- PASS: ESLint on changed code and test files.
- PASS: Wrapper self-test and Node syntax check.
- PASS: Local Azure CLI JMESPath engine returned only unfinished rows from a sample containing a large completed payload.
- Live Azure job verification remains pending.

## Rollout Plan

Merge through a PR to `main`. The repository-owned main deployment workflow builds the resulting image. Use the updated wrapper for the next governed operator job and inspect its idle verification proof. No data reload is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` for any shared web image update.
- Shared runtime mutators: None in this change.
- Approved image digest: Established by the deployment workflow; not set by this PR.
- ACA runtime invariant: Verify through the normal deployment proof before treating new code as live.
- Worker image invariant: Verify through the normal deployment proof.
- Feature/env flag update path: None.
- Live signed-in proof required: Not for the wrapper itself; later data/product claims require their own proof.

## Rollback Plan

Revert this PR. Operators can also use the prior wrapper from an approved checkout while keeping the operator job on its approved digest-pinned image.

## Audit Evidence

- PR diff and focused test output.
- Future operator proof folder: `99d-execution-list.json` (now a compact unfinished list), `99c-idle-verification.json`, and `99e-idle-verification-wait-log.json`.

## Known Gaps

The new query has not yet been exercised against the live operator job. It changes only cleanup verification and does not certify any data load.
