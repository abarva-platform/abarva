# 2026-07-28-knowledge-promotion-payload-alias — Canonical Payload Projection Fix

## Release ID

`2026-07-28-knowledge-promotion-payload-alias`

## Status

`candidate`

## Plain-English Summary

This release fixes a guarded Knowledge promotion failure where accepted entity candidates were
deduplicated correctly but the SQL source did not expose the payload column under the canonical
column name expected by the target table. The change keeps the same approved review decisions and
simply maps each accepted entity candidate payload into the canonical entity payload field.

## Layer Impact

- Release lane: `client-data-lane`.
- Canonical model: Accepted source-derived entity candidates can now be promoted into the canonical
  entity table using the expected `canonical_payload` projection.
- Governance and operations: The review-decision guard, approved-batch boundary, hash checks,
  reviewer authorization, and deferred-candidate rules are unchanged.

## Client Applicability

- All clients: Any future tenant using the governed Knowledge promotion executor.
- Specific clients: Current synthetic clean-room tenant execution path.
- Internal only: Data-plane operator execution.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `scripts/knowledge/processing/executor-framework.mjs`
- Follow-up to PR #5710, which deduplicated canonical promotion rows.

## QA / Validation

- `npm run test:knowledge-process-executors` — passed.
- `npm run test:hcdn-job-runner` — passed.
- `node --check scripts/knowledge/processing/executor-framework.mjs` — passed.
- `npm run release:check` — pending for this candidate record.

## Rollout Plan

Merge through PR, deploy via the repository-owned Azure Container Apps main workflow, capture the
deployed digest and runtime invariant, then rerun only the governed Knowledge review promotion job.
Do not publish domains, activate baselines, build projections, refresh product read models, or expose
runtime consumers until promotion passes and accepted canonical counts reconcile.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the approved workflow.
- Approved image digest: Pending post-merge ACA build.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required for the operator job image used by the promotion retry.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Not for this executor-only repair; downstream product proof is
  required after projections/API selection.

## Rollback Plan

Revert the PR and redeploy through the main ACA workflow. If a promotion retry fails, stop before
domain publication; the review ledger and working candidates remain the recovery point.

## Audit Evidence

- Focused local tests listed above.
- ACA promotion retry `job-airdn-validate-lab-b2otl4b` failed closed with
  `column "canonical_payload" does not exist`.
- Post-merge deploy summary and rerun logs must be captured before downstream publication.

## Known Gaps

This does not approve additional review batches and does not publish a Knowledge baseline. It only
repairs canonical promotion of already approved safe-lane decisions.
