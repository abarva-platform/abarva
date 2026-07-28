# 2026-07-28-airline-review-promotion-guard — Review Promotion Guard Repair

## Release ID

`2026-07-28-airline-review-promotion-guard`

## Status

`candidate`

## Plain-English Summary

The governed review promotion process now handles large review ledgers without failing on missing persisted working-candidate hashes. Before accepted review decisions are promoted into canonical Knowledge tables, the process backfills missing candidate hashes from the current candidate content and then runs the existing stale-candidate, approved-batch, reviewer, policy, validation-run, and evidence-lineage guards.

## Layer Impact

- Release lane: `client-data-lane`.
- Canonical model: Preserves the rule that accepted candidates can move into canonical Knowledge only after hash, policy, batch, reviewer, validation, and lineage checks pass.
- Governance: Keeps stale-candidate protection intact while repairing a working-layer hash persistence gap from earlier processing waves.
- Operations: Improves performance of approved-batch manifest checking by expanding the approved manifest once instead of per accepted row.

## Client Applicability

- All clients: Applies to the shared governed Knowledge process executor.
- Specific clients: Immediately needed by the current Airline Demo New execution.
- Internal only: No direct user-facing product behavior change.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `scripts/knowledge/processing/executor-framework.mjs`

## QA / Validation

- `npm run test:knowledge-process-executors` — pass.
- `npm run test:hcdn-job-runner` — pass.

## Rollout Plan

Merge through PR, build a digest-pinned image through the approved Azure Container Apps lane, then rerun the Airline Demo New `knowledge-review-v1` promotion job. Do not publish domains, activate baselines, build projections, refresh Home, select API providers, or expose runtime consumers until the promotion job passes and canonical counts reconcile.

## Deployment Authority

- Repo-owned deploy workflow: Required for a new digest-pinned job image.
- Shared runtime mutators: None in this PR.
- Approved image digest: To be captured after deploy.
- ACA runtime invariant: Required before using the new image for governed execution.
- Worker image invariant: Required for the Airline process job image used in execution.
- Feature/env flag update path: None.
- Live signed-in proof required: Not for this internal executor repair; downstream product proof remains required after baseline/projection activation.

## Rollback Plan

Revert this PR and rerun the prior image only for read-only diagnostics. If the promotion job has not succeeded, no canonical Knowledge rows are written. If it has succeeded, rollback must follow the baseline/publication rollback process, not a code revert.

## Audit Evidence

- Focused test output from `test:knowledge-process-executors`.
- Focused test output from `test:hcdn-job-runner`.
- Prior failed Airline promotion guard output: `review_decision_guard_failed` with `missing_candidate` and `missing_evidence_lineage`, no canonical rows promoted.

## Known Gaps

- The HCDN runner still connects through standard Postgres credentials in ACA overrides; managed-identity-native DB token handling should be treated as a follow-up operations hardening item.
