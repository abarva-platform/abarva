# 2026-08-01-skair-ghost-canonical-retirement - Ghost Canonical Retirement

## Release ID

`2026-08-01-skair-ghost-canonical-retirement`

## Status

`candidate`

## Plain-English Summary

Adds a governed operator command to retire accepted tenant-key ghost canonical rows before canonical promotion. The command defaults to dry-run and requires both apply mode and an explicit confirmation token before mutating data.

Apply mode records review and authority-transition evidence before retiring the ghost entities and the accepted facts attached to them. It also hardens canonical promotion upserts so future fresh accepted decisions can revive corrected rows by refreshing authority state, endpoint/subject references, and freshness fields instead of leaving a retired row stuck.

## Layer Impact

Lane: `client-data-lane`.

Governance layer: writes `governance.review_decision` and `governance.authority_transition` rows only in explicit apply mode.

Knowledge layer: updates `knowledge.entity` and `knowledge.fact_assertion` authority state to `retired` only for accepted tenant-key ghost rows and their attached accepted facts.

Working layer: read-only candidate hints for later re-promotion audit.

Publication, consumption, metrics, Cube, and product layers: no changes.

Product layer: no product route or UI change.

## Client Applicability

- All clients: No.
- Specific clients: Isolated synthetic lab lane only.
- Internal only: Yes, operator verification only.
- Public/demo only: No.
- Feature flag: Not applicable.

## Changes Included

- `scripts/qa/skyharbor-retire-ghost-canonical.mjs`
- `package.json` script `qa:skair-retire-ghost-canonical`
- Promotion upsert hardening in `scripts/knowledge/processing/executor-framework.mjs`
- Regression assertion that promotion upserts can revive retired canonical rows from fresh accepted decisions

## QA / Validation

Local validation before merge:

- pass: `node --check scripts/qa/skyharbor-retire-ghost-canonical.mjs`.
- pass: `node scripts/qa/skyharbor-retire-ghost-canonical.mjs --help`.
- pass: `node scripts/knowledge/__tests__/run-knowledge-process-executor-tests.mjs`.
- pass: package JSON parse.
- pass: `npm run release:check`.
- pass: restricted-token added-line scan.

Runtime validation after deploy:

- not-run: dry-run through isolated private operator job.
- not-run: apply through isolated private operator job with explicit confirmation.
- not-run: post-apply pre-promotion guard readback.
- not-run: preserve the proof bundle in Downloads.

## Rollout Plan

Merge through PR. The repo-owned Azure Container Apps main deploy workflow builds and deploys the digest-pinned image. Run the retirement command first in dry-run mode through the isolated private operator job, then run apply mode only if the dry-run inventory matches the expected ghost scope.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this release.
- Approved image digest: Produced by the repo-owned deploy workflow after merge.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Not changed by this release.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: No; this is an operator data-plane cleanup.

## Rollback Plan

Revert the PR and redeploy through the repo-owned workflow. If apply mode has already retired rows, reversal requires a new governed operator action that records an authority transition back from `retired` to `accepted` or reruns fresh canonical promotion with accepted review decisions.

## Audit Evidence

- PR URL
- CI run
- Azure Container Apps deploy workflow run
- Operator dry-run logs
- Operator apply logs
- Post-apply pre-promotion guard readback
- `ghost-retirement-readback.json`
- `ghost-entities.csv`
- `ghost-facts.csv`
- `candidate-repoint-hints.csv`
- Downloads ZIP with SHA-256

## Known Gaps

This command does not supersede review generations, promote canonical candidates, publish projections, activate baselines, derive relationships, build Cube models, or prove signed-in product rendering. Metric-grain intake remains a separate product/data-contract decision.
