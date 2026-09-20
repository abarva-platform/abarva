# 2026-09-20-source-action-candidate-read-latency — Bound action-candidate lookup

## Release ID

`2026-09-20-source-action-candidate-read-latency`

## Status

`candidate`

## Plain-English Summary

The Source workspace now resolves the current governed action-candidate contracts once per tenant-scoped read instead of repeating that lookup for every legacy candidate row. The precedence rule is unchanged: a current canonical opportunity suppresses the older projection for the same contract.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 product projection: changes one read query used by the Source workspace and its derived impact layer.
- Layers 1 through 3: no data, schema, adapter, or canonical-object changes.

## Client Applicability

- All clients: yes, when the Source workspace uses the database projection provider.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: existing Source workspace provider selection.

## Changes Included

- Replace a row-correlated precedence lookup with one tenant-scoped materialized contract set in both action-candidate read paths.
- Add a behavior contract that rejects the correlated lookup and requires the tenant-scoped set join.

## QA / Validation

- Focused Source workspace adapter suite: pass, 10 tests.
- TypeScript typecheck: pass with an 8 GB Node heap.
- ESLint on changed source and test files: pass.
- Release-control check: pass.
- Deployed authenticated endpoint timing and signed-in workspace hydration: not run until the candidate is merged and deployed; required before the release can be called live-proven.

## Rollout Plan

Merge through the protected pull-request lane and deploy through the repo-owned ACA main workflow.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: resolved by the deploy workflow.
- ACA runtime invariant: required after deployment.
- Worker image invariant: required after deployment.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the pull request and let the repo-owned ACA workflow redeploy the prior query. No data or schema rollback is required.

## Audit Evidence

- Pull request and CI runs.
- ACA deployment summary and runtime-invariant proof.
- Authenticated impact-endpoint timing before and after deployment.
- Signed-in Source workspace showing hydrated evidence and action rows.

## Known Gaps

This change bounds the measured action-candidate precedence lookup. It does not change other Source workspace queries or create database indexes.
