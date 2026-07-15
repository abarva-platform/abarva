# 2026-07-15-tower-v3-contextpack-projection-pr1 — Tower V3 ContextPack Projection PR1

## Release ID

`2026-07-15-tower-v3-contextpack-projection-pr1`

## Status

`candidate`

## Plain-English Summary

Tower now has a formal v3-oriented `TowerContextPack` boundary for the first derived-projection slice. The change keeps the existing `cio_tower` read model working, but marks it as a bridge/read-model projection rather than the source of truth. It also adds a Tower value-claim gate so realized-value language is blocked unless measured value is backed by reconciled evidence.

## Layer Impact

- Release lane: `global-control-lane`.
- Enterprise context contracts: adds Tower-specific metric, value, lineage, dimension, and value-claim fields to `TowerContextPack`.
- Enterprise context assembler: maps existing v3 dimensions 08, 09, 11, 14, 17, and 18 into the Tower pack.
- Tower read model: adds derived-projection metadata to the CXO view model.
- Tower aVa prompt path: includes the value-claim policy in the deterministic packet and prompt.

## Client Applicability

- All clients: applies to Tower contract and prompt behavior wherever Tower uses the shared code path.
- Specific clients: Meridian benefits from the measurement-plan/readiness posture because bridge rows no longer unlock realized-value language.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Adds `TowerContextPack` source-dimension, lineage, metric, value, and claim contract fields.
- Adds `buildTowerContextPackFields`.
- Adds `evaluateTowerValueClaimGate`.
- Marks `cio_tower` CXO view output as `derived_read_model`, `bridge_only`, and `not_v3_reconciled`.
- Updates Tower aVa prompt assembly to carry the value-claim policy.
- Adds focused unit coverage for the claim gate and Tower context-pack builder.

## QA / Validation

- Pass: `npx jest --runInBand src/lib/tower/__tests__/value-claim-gate.test.ts src/lib/enterprise-knowledge/assembler/__tests__/tower-context-pack-builder.test.ts src/lib/cio-tower/__tests__/answer.test.ts`.
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`.
- Pass: `npm run audit:architecture-rules`.
- Pass: `npm run audit:enterprise-naming`.
- Pass: `npm run release:check`.
- Pass: `git diff --check`.
- Not run: signed-in browser proof; this PR is not deployed.

## Rollout Plan

Open a PR to `main`. After review and merge, the repo-owned Azure Container Apps main deploy workflow can build and deploy the change. This PR does not require a data migration or manual data-plane job.

## Deployment Authority

- Repo-owned deploy workflow: required for any production rollout.
- Shared runtime mutators: none in this PR.
- Approved image digest: not available until merge/deploy.
- ACA runtime invariant: required after deploy before claiming live proof.
- Worker image invariant: not affected.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, for Tower pages and Tower aVa prompt behavior after deployment.

## Rollback Plan

Revert the PR. The change is code-only and does not mutate production tenant data, candidate versions, Active Tenant Access pointers, or Tower database rows.

## Audit Evidence

- PR URL: pending.
- CI output: pending.
- Local validation output: focused Jest, TypeScript, architecture rules, enterprise naming, release gate, and diff whitespace passed locally.
- Live proof: pending deployment.

## Known Gaps

- This is PR1 only. It does not add new source adapters SA07 through SA11.
- `cio_tower` remains a derived bridge/read model until follow-up work reconciles every Tower-visible row to v3 source-backed context.
- No production writes, candidate promotion, Active Tenant Access update, or module runtime data migration is included.
