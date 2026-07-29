# 2026-07-29-foundation-pipeline-preflight — Foundation Pipeline Preflight

## Release ID

`2026-07-29-foundation-pipeline-preflight`

## Status

`candidate`

## Plain-English Summary

Adds a reusable read-only preflight for foundation execution jobs before the next mutating stage runs. The check compares the approved tenant stage map to live Azure Container Apps Job definitions and fails if a job is missing, uses the wrong managed identity, carries a mutable image, relies on a static PostgreSQL password, targets the wrong database, or is not bound to the approved tenant/process/stage.

## Layer Impact

- `client-data-lane`: adds an execution-control gate for tenant foundation pipelines.
- `internal-admin`: gives operators and agents a standard preflight report instead of relying on ad hoc Azure inspection.

## Client Applicability

- All clients: applies as a reusable control pattern for foundation execution tenants.
- Specific clients: initially validates the Airline foundation execution jobs.
- Internal only: yes, operator/preflight control.
- Public/demo only: no product UI change.
- Feature flag: none.

## Changes Included

- `scripts/knowledge/foundation-pipeline-preflight.mjs`
- `scripts/knowledge/__tests__/run-foundation-pipeline-preflight-tests.mjs`
- `package.json` script `test:foundation-pipeline-preflight`

## QA / Validation

- `npm run test:foundation-pipeline-preflight` — validates passing and failing job definitions without Azure access.
- `node --check scripts/knowledge/foundation-pipeline-preflight.mjs` — validates script syntax.
- `node --check scripts/knowledge/__tests__/run-foundation-pipeline-preflight-tests.mjs` — validates test syntax.
- `git diff --check` — validates whitespace.

## Rollout Plan

Merge through PR. The script is read-only and does not mutate Azure, Postgres, tenant data, product routing, or provider activation. Operators can run it against live Azure before any future mutating pipeline stage and attach the JSON report to the execution authority record.

## Deployment Authority

- Repo-owned deploy workflow: normal repository deploy may build the script into the image, but the preflight itself is read-only.
- Shared runtime mutators: none.
- Approved image digest: not applicable to this script-only control.
- ACA runtime invariant: required only if a deploy is triggered by the merge.
- Worker image invariant: required only if a deploy is triggered by the merge.
- Feature/env flag update path: none.
- Live signed-in proof required: no; signed-in proof remains a downstream product activation gate.

## Rollback Plan

Revert the PR to remove the preflight script and package script. No tenant data or Azure state is changed by this release.

## Audit Evidence

- PR and CI checks for this release.
- Local test output from `npm run test:foundation-pipeline-preflight`.
- Future live JSON preflight reports generated against tenant foundation jobs.

## Known Gaps

This release does not repair any live job template drift and does not authorize review apply, domain publication, baseline activation, projection build, product provider switch, or tenant-user activation. It only adds the automated read-only preflight needed to detect those risks before execution.
