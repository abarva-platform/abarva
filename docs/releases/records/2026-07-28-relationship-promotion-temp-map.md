# 2026-07-28-relationship-promotion-temp-map — Relationship Promotion Temp Map

## Release ID

`2026-07-28-relationship-promotion-temp-map`

## Status

`candidate`

## Plain-English Summary

The governed Knowledge promotion executor now materializes accepted entity endpoints and accepted relationship candidates into transaction-local indexed temp tables before writing canonical relationship assertions. This preserves the review-decision controls while making large relationship promotion runs practical.

## Layer Impact

- Lane: `client-data-lane`.
- Canonical model: Relationship assertions still promote only when both endpoint entities have accepted review decisions.
- Operations: Improves the bulk review-decision promotion path for large candidate sets by giving Postgres indexed join inputs.
- Products: No Home, Source, Moves, Tower, Intelligence, Learn, Pricing, Cube, Superset, Observable, or runtime product behavior changes.

## Client Applicability

- All clients: Applies to future Knowledge review-decision promotion executions that use the shared executor.
- Specific clients: Prepared for the governed tenant execution lane currently in progress.
- Internal only: Operator execution scripts and review evidence.
- Public/demo only: not applicable.
- Feature flag: not applicable.

## Changes Included

- `scripts/knowledge/processing/executor-framework.mjs`
- `scripts/knowledge/__tests__/run-knowledge-process-executor-tests.mjs`

## QA / Validation

- `npm run test:knowledge-process-executors` passed.
- `npm run test:hcdn-job-runner` passed.
- `node --check scripts/knowledge/processing/executor-framework.mjs` passed.
- `node --check scripts/knowledge/__tests__/run-knowledge-process-executor-tests.mjs` passed.
- `npm run release:check` to be rerun before PR creation.

## Rollout Plan

Merge through a pull request, deploy through the repo-owned Azure Container Apps main workflow, verify the runtime invariant, then rerun the governed review-decision promotion job with a new idempotency key. Downstream publication, baseline activation, projections, analytics, provider activation, and signed-in product acceptance remain prohibited until promotion and reconciliation pass.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this PR.
- Approved image digest: captured by the ACA main deploy workflow after merge.
- ACA runtime invariant: required before rerunning the governed job with this executor.
- Worker image invariant: required for the governed job image before execution.
- Feature/env flag update path: none.
- Live signed-in proof required: not for this executor-only fix; downstream product proof is required after baseline/projection activation.

## Rollback Plan

Revert this PR and redeploy the prior approved runtime image. Any failed or stopped data-build execution remains bounded by the process ledger and idempotency controls; rerun only with a new governed idempotency key after the selected runtime is proven.

## Audit Evidence

- Pull request URL to be recorded after PR creation.
- CI checks for focused Knowledge executor and job-runner tests.
- ACA runtime invariant after deployment.
- Governed job retry logs after deployment.

## Known Gaps

This does not approve or apply review decisions, publish immutable domains, activate a Knowledge Baseline, build consumption projections, configure analytics, or expose product runtime consumers.
