# 2026-08-01-foundation-v3-baseline-activation-gate - Baseline Activation Gate

## Release ID

`2026-08-01-foundation-v3-baseline-activation-gate`

## Status

`candidate`

## Plain-English Summary

Adds an enforceable baseline activation gate for Foundation V3 publication. Future or updated `passed` baselines require a non-empty projection validation hash, and activation now refuses any zero-row active projection unless that projection has an active absence assertion explaining why zero rows are honest.

This release intentionally does not withdraw, grandfather, rebuild, or republish the current active synthetic baseline. The current row remains visible to readback as a warning until a post-promotion rebuild creates the first baseline that passes the real gate.

## Layer Impact

Lane: `client-data-lane`.

Publication layer: adds `publication.projection_absence_assertion`, adds a future-enforced baseline validation constraint, and replaces `publication.activate_knowledge_baseline` with a gated implementation.

Operations layer: updates the pre-promotion guard readback so zero-row projection warnings mean "missing absence assertion" rather than "zero rows always invalid."

Knowledge, working, evidence, consumption, metrics, Cube, and product layers: no direct data mutation.

Product layer: no product route or UI change.

## Client Applicability

- All clients: No.
- Specific clients: Isolated synthetic lab lane and the Foundation V3 publication path.
- Internal only: Yes, operator/data-plane verification.
- Public/demo only: No.
- Feature flag: Not applicable.

## Changes Included

- `supabase/migrations/20260801194500_foundation_v3_baseline_activation_gate.sql`
- `scripts/qa/skyharbor-prepromotion-guard-readback.mjs`
- `scripts/knowledge/__tests__/run-knowledge-process-executor-tests.mjs`
- Release-record update for the prior ghost canonical retirement evidence

## QA / Validation

Planned local validation before merge:

- `node scripts/knowledge/__tests__/run-knowledge-process-executor-tests.mjs`
- `node --check scripts/qa/skyharbor-prepromotion-guard-readback.mjs`
- `node scripts/qa/skyharbor-prepromotion-guard-readback.mjs --help`
- `npm run release:check`
- `git diff --check`
- restricted-token added-line scan

Runtime validation after deploy:

- Apply the migration through the governed private operator path.
- Run the pre-promotion guard readback through the isolated private operator job.
- Expected readback: ghost canonical checks remain pass, stale current-candidate review generation remains pass, baseline validation hash warning remains for the historical active row, and zero-row projection warnings count only rows missing absence assertions.

## Rollout Plan

Merge through PR. The repo-owned Azure Container Apps main deploy workflow builds and deploys the digest-pinned image. Apply the new migration through the isolated private operator job before running the guard readback.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this release.
- Approved image digest: Produced by the repo-owned deploy workflow after merge.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Updated only by the repo-owned deploy workflow.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: No; this is a publication gate and operator readback change.

## Rollback Plan

Revert the PR and redeploy through the repo-owned workflow. If the migration has already been applied, rollback requires a governed follow-up migration that restores the prior activation function and retires the projection absence assertion table from use. It should not delete historical assertion rows without a separate data-retention decision.

## Audit Evidence

- PR URL
- CI run
- Azure Container Apps deploy workflow run
- Migration apply logs
- Post-migration pre-promotion guard readback
- Downloads ZIP with SHA-256

## Known Gaps

This release does not run fresh review generation, promote canonical candidates, publish projections, activate or replace a baseline, derive relationships, build Cube models, or prove signed-in product rendering. The current synthetic active baseline still requires rebuild after promotion to become the first baseline that passes the real gate.
