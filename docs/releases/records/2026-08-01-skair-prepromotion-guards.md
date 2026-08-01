# 2026-08-01-skair-prepromotion-guards - Pre-Promotion Guard Readback

## Release ID

`2026-08-01-skair-prepromotion-guards`

## Status

`candidate`

## Plain-English Summary

Adds a live DB-backed pre-promotion guard readback command for the isolated synthetic lab lane. The command checks the blockers that must be resolved before canonical promotion: accepted ghost entities, facts attached to those entities, stale review generation attached to current candidates, active baselines with empty projection-validation hashes, and active zero-row projections.

The command can optionally seed warn-only guard expectations into `operations.registered_query` and `operations.design_expectation`. It does not retire entities, supersede reviews, promote canonical records, publish projections, activate baselines, derive relationships, build Cube models, or touch product routes.

## Layer Impact

Lane: `client-data-lane`.

Operations layer: optionally upserts warn-only guard expectations and registered queries.

Governance layer: read-only review-decision generation breakdown.

Working layer: read-only current candidate inventory for stale-review detection.

Knowledge layer: read-only checks for accepted ghost entities and facts attached to them.

Publication layer: read-only checks for active passed baselines and active projection row counts.

Product layer: no product route or UI change.

## Client Applicability

- All clients: No.
- Specific clients: Isolated synthetic lab lane only.
- Internal only: Yes, operator verification only.
- Public/demo only: No.
- Feature flag: Not applicable.

## Changes Included

- `scripts/qa/skyharbor-prepromotion-guard-readback.mjs`
- `package.json` script `qa:skair-prepromotion-guard-readback`
- Warn-only guard expectation seeding for the pre-promotion blockers when explicitly requested.
- Evidence outputs:
  - `prepromotion-guard-readback.json`
  - `prepromotion-guard-readback.csv`
  - `review-decision-generation-breakdown.csv`

## QA / Validation

Local validation before merge:

- Pass: `node --check scripts/qa/skyharbor-prepromotion-guard-readback.mjs`.
- Pass: package JSON parse.
- Pass: restricted-token added-line scan.
- Not-run: `npm run release:check` pending rerun after release-record status wording correction.

Runtime validation after deploy:

- Not-run: run through the isolated private operator job against the approved digest-pinned image.
- Not-run: preserve the proof bundle in Downloads.

## Rollout Plan

Merge through PR. The repo-owned Azure Container Apps main deploy workflow builds and deploys the digest-pinned image. The guard command becomes available only when explicitly invoked by an operator job.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this release.
- Approved image digest: Produced by the repo-owned deploy workflow after merge.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Not changed by this release.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: No; this is an operator data-plane readback.

## Rollback Plan

Revert the PR and redeploy through the repo-owned workflow. If seed mode has added warn-only guard expectations, retire only those expectation rows through the approved private operator path.

## Audit Evidence

- PR URL
- CI run
- Azure Container Apps deploy workflow run
- Operator job logs
- `prepromotion-guard-readback.json`
- `prepromotion-guard-readback.csv`
- `review-decision-generation-breakdown.csv`
- Downloads ZIP with SHA-256

## Known Gaps

This command does not perform the corrective actions it reports. Ghost retirement, review-generation supersession, baseline-gate closure, canonical promotion, relationship derivation, publication, Cube parity, and signed-in product proof remain separate gates.
