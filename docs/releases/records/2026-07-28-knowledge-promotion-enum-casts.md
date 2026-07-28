# 2026-07-28-knowledge-promotion-enum-casts — Enum-Safe Knowledge Promotion

## Release ID

`2026-07-28-knowledge-promotion-enum-casts`

## Status

`candidate`

## Plain-English Summary

The governed Knowledge promotion executor now writes enum-backed state values using explicit PostgreSQL enum casts. This prevents accepted review decisions from failing at the canonical Knowledge table boundary when the physical schema requires typed state columns.

## Layer Impact

- Lane: `client-data-lane`.
- Canonical model: Narrows the promotion writer so accepted entity, fact, and relationship records conform to the PostgreSQL enum contract before they can be inserted into canonical Knowledge tables.
- Operations: Improves the governed data-build execution path for review-decision promotion.
- Products: No Home, Source, Moves, Tower, Intelligence, Learn, Pricing, Cube, or runtime product behavior changes.

## Client Applicability

- All clients: none automatically.
- Specific clients: any tenant execution that uses the shared Knowledge review-decision promotion executor after deployment.
- Internal only: governed data-build operators and release auditors.
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

Merge through a pull request, deploy through the repo-owned Azure Container Apps main workflow, verify the runtime invariant, then retry the governed data-build job with a new idempotency key. Downstream publication, baseline activation, projections, analytics, and product-provider activation remain prohibited until promotion and reconciliation pass.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this PR.
- Approved image digest: captured by the ACA main deploy workflow after merge.
- ACA runtime invariant: required before retrying the governed job.
- Worker image invariant: required for the governed job image before execution.
- Feature/env flag update path: none.
- Live signed-in proof required: not for this executor-only fix; downstream product proof is required after baseline/projection activation.

## Rollback Plan

Revert this PR and redeploy the prior approved runtime image. Any failed data-build execution remains stopped by the existing process ledger and idempotency controls; rerun only after the rollback or replacement fix is deployed.

## Audit Evidence

- Pull request URL to be recorded after PR creation.
- CI checks for focused Knowledge executor and job-runner tests.
- ACA runtime invariant after deployment.
- Governed job retry logs after deployment.

## Known Gaps

This does not approve or apply review decisions, publish immutable domains, activate a Knowledge Baseline, build consumption projections, configure analytics, or expose product runtime consumers.
