# 2026-07-28-relationship-promotion-endpoint-map — Relationship Promotion Endpoint Map

## Release ID

`2026-07-28-relationship-promotion-endpoint-map`

## Status

`candidate`

## Plain-English Summary

The governed Knowledge promotion executor now resolves relationship endpoints through a precomputed accepted-entity map instead of per-row lateral lookups. This keeps relationship promotion tied to accepted entity review decisions while avoiding an inefficient endpoint lookup pattern during bulk promotion.

## Layer Impact

- Lane: `client-data-lane`.
- Canonical model: Relationship assertions can promote only when both endpoint entities resolve through accepted entity decisions.
- Operations: Improves the bulk review-decision promotion path for large candidate sets.
- Products: No Home, Source, Moves, Tower, Intelligence, Learn, Pricing, Cube, or runtime product behavior changes.

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

## Rollout Plan

Merge through a pull request, deploy through the repo-owned Azure Container Apps main workflow, verify the runtime invariant, then rerun the governed promotion job with a new idempotency key if the prior execution has not completed successfully. Downstream publication, baseline activation, projections, analytics, and product-provider activation remain prohibited until promotion and reconciliation pass.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this PR.
- Approved image digest: captured by the ACA main deploy workflow after merge.
- ACA runtime invariant: required before rerunning the governed job with this executor.
- Worker image invariant: required for the governed job image before execution.
- Feature/env flag update path: none.
- Live signed-in proof required: not for this executor-only fix; downstream product proof is required after baseline/projection activation.

## Rollback Plan

Revert this PR and redeploy the prior approved runtime image. Any failed or canceled data-build execution remains bounded by the process ledger and idempotency controls; rerun only with a new governed idempotency key after the selected runtime is proven.

## Audit Evidence

- Pull request URL to be recorded after PR creation.
- CI checks for focused Knowledge executor and job-runner tests.
- ACA runtime invariant after deployment.
- Governed job retry logs after deployment.

## Known Gaps

This does not approve or apply review decisions, publish immutable domains, activate a Knowledge Baseline, build consumption projections, configure analytics, or expose product runtime consumers.
