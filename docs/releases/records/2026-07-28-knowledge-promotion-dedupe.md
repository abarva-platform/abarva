# 2026-07-28-knowledge-promotion-dedupe — Canonical Promotion Dedupe

## Release ID

`2026-07-28-knowledge-promotion-dedupe`

## Status

`candidate`

## Plain-English Summary

This release fixes a guarded promotion failure where multiple accepted working candidates could map to the same canonical object key inside one PostgreSQL upsert. The executor now chooses one deterministic row per canonical entity and relationship key before writing to Knowledge, preserving the review ledger boundary while avoiding PostgreSQL cardinality errors.

## Layer Impact

- Release lane: `client-data-lane`.
- Canonical model: The promotion executor now deduplicates source rows before writing accepted entities and relationships.
- Governance and operations: The existing review-decision guard remains intact; deferred and sensitive candidates are still excluded from the first baseline.

## Client Applicability

- All clients: Any future tenant using the governed Knowledge promotion executor.
- Specific clients: Current synthetic clean-room tenant execution path.
- Internal only: Data-plane operator execution.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `scripts/knowledge/processing/executor-framework.mjs`
- Follow-up to PR #5709, which repaired candidate hash and evidence-lineage checks for guarded promotion.

## QA / Validation

- `npm run test:knowledge-process-executors` — passed.
- `npm run test:hcdn-job-runner` — passed.
- Prior deployed promotion attempt failed closed with PostgreSQL `ON CONFLICT DO UPDATE command cannot affect row a second time`; this change addresses that failure mode by deduplicating the SQL source before conflict handling.

## Rollout Plan

Merge through PR, deploy via the repository-owned Azure Container Apps main workflow, then rerun the governed Knowledge review promotion job with the new digest-pinned image. Do not publish domains, activate baselines, build projections, refresh product read models, or expose runtime consumers until the promotion job passes and canonical counts reconcile.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the approved workflow.
- Approved image digest: Pending post-merge ACA build.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required for the operator job image used by the promotion retry.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Not for this executor-only repair; downstream product proof is required after projections/API selection.

## Rollback Plan

Revert the PR and redeploy through the main ACA workflow. If a promotion retry fails, stop before domain publication; the review ledger and working candidates remain the recovery point.

## Audit Evidence

- Focused local tests listed above.
- ACA promotion retry logs from the previous failed execution.
- Post-merge deploy summary and rerun logs to be captured before downstream publication.

## Known Gaps

This does not approve additional review batches and does not publish a Knowledge baseline. It only repairs canonical promotion of already approved safe-lane decisions.
