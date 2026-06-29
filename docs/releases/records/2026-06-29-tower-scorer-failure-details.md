# 2026-06-29-tower-scorer-failure-details — Tower scorer failure details

## Release ID

`2026-06-29-tower-scorer-failure-details`

## Status

`candidate`

## Plain-English Summary

The Tower server-side answer scorer now prints compact failure details to stdout when any right-answer contract fails. This makes VNet proof runs diagnosable from ACA job logs without downloading container-local report files.

## Layer Impact

- `global-control-lane`: Updates a QA/proof script only. It does not change Tower runtime answers, data, routes, or rendering.

## Client Applicability

- All clients: QA scorer behavior only.
- Specific clients: None.
- Internal only: Yes, proof tooling.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `scripts/qa/tower-answer-contract-server-runner.ts`: emits failed question id, tenant, failed checks, latency, and rendered snippet when scorer results are not fully green.

## QA / Validation

- Passed: `npx eslint scripts/qa/tower-answer-contract-server-runner.ts`
- Passed: `git diff --check`
- Pending: `npm run release:check` will be rerun after this release record update.

## Rollout Plan

Merge to `main`, deploy through the repo-owned Azure Container Apps main deploy workflow, then rerun the private VNet Tower scorer.

## Deployment Authority

- Repo-owned deploy workflow: Required for ACA runtime image update.
- Shared runtime mutators: No new mutator.
- Approved image digest: Produced by the main deploy workflow.
- ACA runtime invariant: Main deploy workflow verifies template image, active revision, and traffic.
- Worker image invariant: Main deploy workflow updates worker jobs to the same approved image.
- Feature/env flag update path: None.
- Live signed-in proof required: No browser proof required for this QA-only logging change; VNet scorer output is the proof.

## Rollback Plan

Revert this script change or deploy the previous approved main image. Runtime product behavior is unaffected.

## Audit Evidence

- PR and CI results for this change.
- ACA private operator logs from the subsequent scorer run.

## Known Gaps

This only improves failure visibility. It does not itself fix any failing Tower answer contract.
