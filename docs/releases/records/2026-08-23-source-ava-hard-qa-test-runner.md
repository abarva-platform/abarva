# 2026-08-23-source-ava-hard-qa-test-runner — Source aVa QA Harness Test Runner Fix

## Release ID

`2026-08-23-source-ava-hard-qa-test-runner`

## Status

`candidate`

## Plain-English Summary

The Source aVa hard-question audit harness had a regression test that only worked when run under a Jest-style global environment. The harness itself is a standalone Node audit script, so its regression test now runs under Node's native test runner as well. This makes the 50-question coverage gate directly executable without relying on implicit globals.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Products: Source aVa audit coverage is easier to verify. No Source runtime route or model prompt changes are included.
- Release / QA tooling: The audit harness regression test now uses explicit Node test imports and an ESM-safe path resolver.

## Client Applicability

- All clients: no direct runtime behavior change.
- Specific clients: none.
- Internal only: Source aVa QA and release validation.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `scripts/audit/__tests__/source-ava-hard-qa.test.ts`

## QA / Validation

- `NODE_PATH=/Users/anand/Projects/nexus/node_modules node --test scripts/audit/__tests__/source-ava-hard-qa.test.ts` passed.
- `NODE_PATH=/Users/anand/Projects/nexus/node_modules npm run release:check` must pass before merge.

## Rollout Plan

Merge to `main` through a pull request. The repo-owned ACA workflow may run because all main merges trigger it, but this change is test-only and does not require a signed-in product proof.

## Deployment Authority

- Repo-owned deploy workflow: standard main deploy workflow if triggered by merge.
- Shared runtime mutators: none.
- Approved image digest: not applicable to this test-only change.
- ACA runtime invariant: not required for claiming the test fix; required before claiming any later runtime change live.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: no.

## Rollback Plan

Revert the pull request if the test runner change introduces unexpected CI issues.

## Audit Evidence

- Pull request for this release record and test-runner fix.
- Local native Node test output for the Source aVa hard-QA harness.
- Release control gate output.

## Known Gaps

This does not execute the full live 50-question Source aVa browser/API suite. It only makes the audit harness coverage test directly runnable.
