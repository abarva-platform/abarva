# 2026-08-01-skair-phase-a-readback — Isolated Phase A Candidate Readback

## Release ID

`2026-08-01-skair-phase-a-readback`

## Status

`candidate`

## Plain-English Summary

Adds a read-only verification command for the isolated synthetic lab lane and hardens candidate extraction replay so regenerated candidates replace stale working rows for the same source versions. The command checks whether the repaired Phase A candidate identity path produced the expected source, evidence, entity, fact, and key entity-type counts after the governed jobs run.

## Layer Impact

Lane: `client-data-lane`.

Layer 2 evidence: reads source registry and evidence counts for reconciliation only. It does not insert, update, or delete evidence.

Layer 3 candidates: reads candidate counts, entity-type counts, resolved identity state, and display-name quality checks. Candidate extraction replay now deletes stale working candidates for the replayed source versions before inserting regenerated rows. It does not promote candidates.

Layer 4 products: no product read path changes.

## Client Applicability

- All clients: No.
- Specific clients: Isolated synthetic lab lane only.
- Internal only: Yes, operator verification only.
- Public/demo only: No.
- Feature flag: Not applicable.

## Changes Included

- `scripts/qa/skyharbor-phase-a-candidate-readback.mjs`
- `scripts/knowledge/processing/executor-framework.mjs`
- `scripts/knowledge/__tests__/run-knowledge-process-executor-tests.mjs`
- `package.json` script `qa:skair-phase-a-candidate-readback`

## QA / Validation

Local validation:

- `node --check scripts/qa/skyharbor-phase-a-candidate-readback.mjs` — passed.
- `node -e "JSON.parse(require('fs').readFileSync('package.json','utf8')); console.log('package.json ok')"` — passed.
- `npm run test:knowledge-process-executors` — passed.
- restricted-token added-line scan — passed.
- `npm run release:check` — passed.

Runtime validation after deploy:

- Run the read-only command through the isolated private operator job using the approved digest-pinned image — not run before merge.
- Preserve a proof bundle in Downloads — not run before merge.

## Rollout Plan

Merge through PR. The repo-owned Azure Container Apps main deploy workflow builds and deploys the digest-pinned image. The readback command becomes available only when explicitly invoked by an operator job.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this release.
- Approved image digest: Produced by the repo-owned deploy workflow after merge.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Not changed by this release.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: No; this is a read-only data-plane operator command.

## Rollback Plan

Revert the PR and redeploy through the repo-owned workflow. No database rollback is required because this release adds no schema or data mutations.

## Audit Evidence

- PR URL
- CI run
- Azure Container Apps deploy workflow run
- Operator job logs
- `phase-a-candidate-readback.json`
- `phase-a-candidate-readback-checks.csv`
- `phase-a-source-breakdown.csv`
- Downloads ZIP with SHA-256

## Known Gaps

The readback does not certify publication, baseline activation, Cube parity, product rendering, or signed-in Knowledge behavior. Those remain downstream gates.
