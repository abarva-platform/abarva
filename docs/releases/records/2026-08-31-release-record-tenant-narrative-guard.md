# 2026-08-31 Release Record Tenant Narrative Guard

## Release ID

`2026-08-31-release-record-tenant-narrative-guard`

## Status

`candidate`

## Plain-English Summary

This release adds a forward-looking release-control guard that prevents new release records from naming registry tenants in prose. Release records can still cite real repository paths, command snippets, and file identifiers when those are necessary audit evidence.

## Layer Impact

`global-control-lane`: release governance only. Product runtime behavior and tenant data are unchanged.

## Client Applicability

All clients: no product surface changes. The guard applies to future pull requests that change release-relevant files.

## Changes Included

- Adds a release-record tenant narrative scanner under `scripts/release-control/`.
- Wires the scanner into `scripts/release-control/check-release-record.mjs`.
- Adds focused tests for narrative refusal and path or command evidence allowance.

## QA / Validation

Passed locally: focused node test, `node --check`, and focused ESLint. `node scripts/release-check.mjs --base origin/main --head HEAD` is the final release-control validation for this candidate.

## Rollout Plan

Merge to main through pull request. The repo-owned Azure Container Apps deploy workflow may publish the same code, but this is a CI and release-governance change rather than a user-facing runtime feature.

## Deployment Authority

- Repo-owned deploy workflow: unchanged; main deploy workflow remains authoritative if a web image is produced.
- Shared runtime mutators: none.
- Approved image digest: not applicable before merge.
- ACA runtime invariant: no runtime mutation is required for the guard itself.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: no; release-check behavior is validated through CI and local command output.

## Rollback Plan

Revert the PR to remove the new guard from `check-release-record.mjs`. No database, migration, tenant-data, environment, or traffic rollback is required.

## Audit Evidence

Inspect the pull request diff, focused test output, release-check output, and CI logs. The planted failure is a release-record prose line that names a registry tenant; path and command evidence remain accepted only when protected as code-shaped evidence.

## Known Gaps

The guard does not rewrite existing merged release records. It is intentionally forward-looking and scoped to records changed in the current diff.
