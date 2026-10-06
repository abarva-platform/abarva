# 2026-09-20-source-core-suite-ci - Run Source Core Suites In CI

## Release ID

`2026-09-20-source-core-suite-ci`

## Status

`candidate`

## Plain-English Summary

The Source core test tree now runs in the pull-request workflow. The tree was green when measured,
but most of its direct suites were not reached by any workflow.

## Layer Impact

- `global-control-lane`: test and release controls only.
- Product and data layers: no runtime, schema, tenant-data, or product behavior changes.

## Client Applicability

- All clients: shared Source governance and lifecycle controls gain continuous test ownership.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Runs `src/lib/source/__tests__` as a parent in the unit workflow.
- Adds a behavior guard that fails if the parent command is removed.
- Refreshes the generated CI coverage census.

## QA / Validation

- Direct census row: 69 suites, 9 already covered and 60 newly covered.
- Actual parent run: 77 suites / 736 tests, all passing.
- Existing covered slice: 9 suites / 71 tests in about 1 second.
- Full parent: about 2.6 seconds.
- TypeScript, targeted lint, workflow parse, behavior coverage, and release control pass before merge.

## Rollout Plan

Squash-merge through the protected repository. The repo-owned ACA main deploy may publish the same
commit, although the change affects only CI ownership and tests.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None in this change.
- Approved image digest: Resolved by the repo-owned workflow after merge.
- ACA runtime invariant: Verified by the repo-owned workflow after merge.
- Worker image invariant: Verified by the repo-owned workflow after merge.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: No; there is no product surface change.

## Rollback Plan

Revert the squash commit. No data-plane rollback is required.

## Audit Evidence

- Baseline and final Jest output captured in the execution record.
- Generated census records the change in workflow ownership.

## Known Gaps

The nine suites already owned by the AI-surface workflow run again in this parent command. The
overlap is deliberate and measured; it avoids a hand-maintained list of sixty individual files.
