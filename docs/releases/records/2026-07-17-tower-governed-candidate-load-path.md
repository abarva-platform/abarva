# 2026-07-17-tower-governed-candidate-load-path — Tower Governed Candidate Load Path

## Release ID

`2026-07-17-tower-governed-candidate-load-path`

## Status

`candidate`

## Plain-English Summary

Adds a governed Meridian Tower candidate-load planning path. The new audit builds a candidate-preview-only Tower load plan from the Meridian v3 TowerContextPack, emits an ACA Job contract, produces quality-gate proof, and keeps the truth split explicit: no production tenant data write, no Active Tenant Access update, no candidate promotion, and no default Tower runtime read.

## Layer Impact

- Release lane: `client-data-lane` for Meridian-scoped candidate data-load planning, with no runtime promotion.
- `tenant_context`: Declares the Meridian Tower v3 candidate-preview dataset manifest before any future load.
- `artifact`: Produces local proof artifacts under `reports/tower-governed-candidate-load/meridian-health`.
- `metric`: Carries Tower metric/value/value-claim counts from the v3 TowerContextPack into the candidate-load plan.
- `financial`: Preserves Tower value-claim gating; realized/proven value language remains blocked unless measured evidence later passes the gate.

## Client Applicability

- All clients: No runtime behavior change.
- Specific clients: Meridian Health / Healthcare Demo only.
- Internal only: The candidate load plan, audit command, and ACA Job contract are operator/audit artifacts.
- Public/demo only: No public route change.
- Feature flag: None.

## Changes Included

- New Tower candidate-load builder: `src/lib/enterprise-data/tower-candidate-load/tower-governed-candidate-load.ts`
- New audit command: `npm run audit:tower-governed-candidate-load`
- New manifest: `docs/governance/dataset-manifests/meridian-health-tower-v3-candidate-preview-20260717.json`
- Focused Jest coverage for candidate-only guardrails, ACA Job contract, and fail-fast missing input behavior.

## QA / Validation

Validation status before merge:

- Pass: `npx jest src/lib/enterprise-data/tower-candidate-load/__tests__/tower-governed-candidate-load.test.ts --runInBand`
- Pass: `npm run audit:tower-governed-candidate-load`
- Pass: `npm run validate:context-corpus:manifests`
- Pass: `npx eslint src/lib/enterprise-data/tower-candidate-load/tower-governed-candidate-load.ts src/lib/enterprise-data/tower-candidate-load/__tests__/tower-governed-candidate-load.test.ts scripts/audit/build-tower-governed-candidate-load.ts`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json`
- Pass: `npm run release:check`
- Pass: `git diff --check`

## Rollout Plan

Merge through the protected PR lane. The code can deploy through the normal ACA main workflow, but the PR does not submit a data-build job and does not make Tower consume the candidate preview. A future operator run must submit the ACA Job through `scripts/ops/submit-aca-operator-job.mjs` using a digest-pinned image, then pass quality gate and human review before any promotion.

## Deployment Authority

- Repo-owned deploy workflow: Required for code rollout only.
- Shared runtime mutators: Not used by this PR.
- Approved image digest: Not applicable until merge/deploy.
- ACA runtime invariant: Required only if this code deploys with main.
- Worker image invariant: Required before any future ACA Job execution.
- Feature/env flag update path: None.
- Live signed-in proof required: Not for this planning PR; future candidate preview runtime proof is required before Tower UI uses the candidate path.

## Rollback Plan

Revert the PR. Since this does not write data, promote candidates, update Active Tenant Access, or change runtime reads, rollback is code/report removal only.

## Audit Evidence

- `reports/tower-governed-candidate-load/meridian-health/summary.json`
- `reports/tower-governed-candidate-load/meridian-health/summary.md`
- `reports/tower-governed-candidate-load/meridian-health/proof.html`
- `reports/tower-governed-candidate-load/meridian-health/quality-gate.json`
- `reports/tower-governed-candidate-load/meridian-health/aca-job-contract.json`
- `reports/tower-governed-candidate-load/meridian-health/source-lineage.csv`

## Known Gaps

This PR does not submit the ACA data-build job, load Azure/Postgres, update Active Tenant Access, promote a candidate, make Tower read candidate context by default, or prove signed-in Tower candidate preview UI. Those remain future gated work.
