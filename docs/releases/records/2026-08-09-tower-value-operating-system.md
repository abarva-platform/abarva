# 2026-08-09-tower-value-operating-system - Tower Value Operating System

## Release ID

`2026-08-09-tower-value-operating-system`

## Status

`candidate`

## Plain-English Summary

Tower now has one governed value-case operating model underneath the cockpit. The product reads additive `tower.*` value-case tables and `consumption.tower_*_v1` views instead of stitching board posture directly from raw measurement rows or reviving a retired mart path.

The model preserves the chain from investment evidence to usage, workflow change, operational outcome, economic conversion, Finance attestation, and claimable value. Adoption and capacity are visible evidence, but they do not become savings unless an explicit economic conversion event exists. Source conflicts are surfaced as blocked, not board-certified value.

## Layer Impact

- `client-data-lane` / Layer 3 Canonical and governed consumption: adds six additive Tower value-case tables and governed consumption views. Existing `tower.metric_definition`, `tower.tracked_subject`, `tower.metric_observation`, `tower.metric_provenance`, and `tower.value_claim` remain the canonical foundation.
- `global-control-lane` / Layer 4 Products: the Tower reader now consumes the governed consumption views. The cockpit visual design is not redesigned in this release.
- Layer 1 / Layer 2: no tenant intake template, source adapter, or raw source schema change is introduced by this release.

## Client Applicability

All clients: applies to any tenant with Tower schema-backed data after the migration and governed value-case backfill are applied.

Specific clients: none named in this public release record.

Internal only: no.

Public/demo only: no.

Feature flag: none.

## Changes Included

- Migration: `supabase/migrations/20260809150000_tower_value_operating_system_v1.sql`
- Runtime reader: `src/lib/tower/readTowerCommandCenter.ts`
- Operator/readback proof: `scripts/tower/verify-tower-value-os.mjs`
- Repeatable lane scripts: `tower:value-os:migrate:dry`, `tower:value-os:migrate:apply`, `tower:value-os:verify:preflight`, `tower:value-os:verify`
- Minimal cockpit copy guard: `src/components/tower/command-center/views/CommandCenterView.tsx`, `src/components/tower/command-center/TowerCommandCenterAvaShell.tsx`, and related Tower drawer/tab strings
- Tower contracts/tests: `src/lib/tower/__tests__/readTowerCommandCenter.test.ts`, `src/lib/tower/__tests__/value-operating-system-contract.test.ts`
- Integration guard updates: `src/__tests__/integration/tower/tower-db-only-surface.test.ts`, `src/__tests__/integration/tower/tower-invariants.test.ts`
- Comment alignment: `src/lib/tower/command-center/types.ts`, `src/lib/tower/command-center/view-model.ts`

## QA / Validation

- Pass: `npx eslint src/lib/tower/readTowerCommandCenter.ts src/lib/tower/__tests__/readTowerCommandCenter.test.ts src/lib/tower/__tests__/value-operating-system-contract.test.ts src/__tests__/integration/tower/tower-db-only-surface.test.ts src/__tests__/integration/tower/tower-invariants.test.ts src/lib/tower/command-center/types.ts src/lib/tower/command-center/view-model.ts`
- Pass: `npm test -- --runTestsByPath src/lib/tower/__tests__/readTowerCommandCenter.test.ts src/lib/tower/__tests__/value-operating-system-contract.test.ts --runInBand`
- Pass: `npm test -- --runTestsByPath src/__tests__/integration/tower/tower-db-only-surface.test.ts src/__tests__/integration/tower/tower-invariants.test.ts --runInBand`
- Pass: `npx eslint src/lib/tower/readTowerCommandCenter.ts src/lib/tower/__tests__/readTowerCommandCenter.test.ts src/lib/tower/__tests__/value-operating-system-contract.test.ts src/__tests__/integration/tower/tower-db-only-surface.test.ts src/__tests__/integration/tower/tower-invariants.test.ts src/lib/tower/command-center/types.ts src/lib/tower/command-center/view-model.ts src/components/tower/command-center/views/CommandCenterView.tsx src/components/tower/command-center/TowerCommandCenterAvaShell.tsx src/components/tower/command-center/drawers/EvidenceGapDrawer.tsx src/components/tower/command-center/views/ValueProofView.tsx src/components/tower/command-center/views/RecommendedActionsView.tsx src/components/tower/command-center/drawers/ProgramDrawer.tsx`
- Pass: `npm test -- --runTestsByPath src/components/tower/command-center/__tests__/TowerCommandCenter.test.tsx src/components/tower/command-center/__tests__/TowerCommandCenterAvaShell.test.tsx src/lib/tower/__tests__/readTowerCommandCenter.test.ts src/lib/tower/__tests__/value-operating-system-contract.test.ts --runInBand`
- Pass: `npm run tower:value-os:verify:preflight -- --out-dir /tmp/<proof-dir>`
- Not run: live database migration apply, tenant data-build job, production deployment, Cube model generation, and signed-in browser proof. Those require the approved migration/data-build/deploy lane after merge.

## Rollout Plan

Merge through PR to `main`. Apply the migration only through the approved database migration path. Any tenant value-case refresh or reconciliation must run through the governed ACA data-build job path with proof bundle, validation output, and review. Deploy the web runtime only through the repo-owned Azure Container Apps main deploy workflow.

Do not claim production live proof until the migration is applied, the governed value-case rows are verified for the target tenant, the same `consumption.tower_*_v1` views power Tower/aVa/export reads, and signed-in Tower proof has been captured.

## Deployment Authority

- Repo-owned deploy workflow: required for web runtime rollout.
- Shared runtime mutators: none in this local implementation.
- Approved image digest: produced by the main deploy workflow after merge.
- ACA runtime invariant: required before claiming shared runtime activation.
- Worker image invariant: required for any governed data-build job that writes value-case rows.
- Feature/env flag update path: none.
- Live signed-in proof required: yes after migration, governed data-build, and deployment.

## Rollback Plan

Application rollback is a normal revert/redeploy through the repo-owned Azure Container Apps workflow. The migration is additive and can remain inert if application code rolls back. If governed value-case rows are incorrect, run a data-build rollback or restore from the approved proof bundle; do not mutate production data manually from the web runtime.

## Audit Evidence

- Migration diff and focused Tower tests.
- Static verifier output: `TOWER_LIVE_VALUE_RECONCILIATION.json`, `TOWER_LIVE_VALUE_RECONCILIATION.md`, `TOWER_VALUE_CASE_COVERAGE.csv`, sanitized query/readback logs, and proof ZIP.
- Database migration apply logs and readback once approved.
- Governed data-build job proof bundle for any tenant refresh.
- Signed-in Tower browser proof after runtime deployment.
- Export/aVa proof that both consume the same `consumption.tower_*_v1` contract.

## Known Gaps

- This local implementation does not apply the migration to live databases, run a tenant data-build job, or deploy the shared web runtime.
- Cube model files are not added in this release; the consumption views are the stable contract Cube should model next.
