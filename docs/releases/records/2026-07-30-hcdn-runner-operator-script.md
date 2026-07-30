# 2026-07-30-hcdn-runner-operator-script — HCDN Runner Operator Script

## Release ID

`2026-07-30-hcdn-runner-operator-script`

## Status

`candidate`

## Plain-English Summary

Adds a named npm script for the governed HCDN job runner so the shared Azure Container Apps operator wrapper can invoke approved tenant data-build processes without bypassing the wrapper.

## Layer Impact

Release lane: `client-data-lane`.

Client intake: No change.

Source adapters: No change.

Canonical model: No schema or data mutation in this PR.

Products: No direct UI change. This enables approved data-build jobs to refresh governed consumption projections through the standard operator path.

## Client Applicability

- All clients: The operator script can be used for approved single-tenant HCDN jobs.
- Specific clients: None.
- Internal only: Operator workflow only.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `package.json` adds `knowledge:hcdn-job-runner`, a named npm script that invokes the existing governed HCDN runner. The script is required because the shared ACA operator wrapper accepts npm script names, not arbitrary command strings, and therefore could not submit the existing runner without a package-level alias.

## QA / Validation

- Pass: `npm run knowledge:hcdn-job-runner -- --tenant airline-demo-new --process airline-demo-new-projection-build-v1 --stage 13_build_module_projections --mode preflight --no-network`
- Pass: `npm run test:hcdn-job-runner`
- Pass: `node --check scripts/knowledge/hcdn-job-runner.mjs`
- Pass: `npm run release:check`

## Rollout Plan

Merge through PR to `main`. The repo-owned Azure Container Apps deploy workflow builds and deploys the updated runtime. After runtime invariant proof, the operator wrapper may submit digest-pinned HCDN jobs using this script name.

## Deployment Authority

- Repo-owned deploy workflow: Required for shared runtime activation.
- Shared runtime mutators: None in this PR.
- Approved image digest: Captured by the repo-owned deploy workflow after merge.
- ACA runtime invariant: Required after deployment before using the runtime for operator jobs.
- Worker image invariant: Required after deployment before using the runtime for operator jobs.
- Feature/env flag update path: None.
- Live signed-in proof required: Required only for product-impacting data-build outcomes.

## Rollback Plan

Revert the PR. Existing deployed runtime and data remain unchanged by this script alias alone.

## Audit Evidence

- PR and CI evidence to be attached after review.
- HCDN runner preflight output.
- HCDN runner test output.
- Release check output.

## Known Gaps

This does not run any data-build job by itself.
