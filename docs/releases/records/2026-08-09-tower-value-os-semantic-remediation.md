# 2026-08-09 — Tower Value OS Semantic Remediation

## Release ID

`2026-08-09-tower-value-os-semantic-remediation`

## Status

`candidate`

## Plain-English Summary

Tower now separates approved investment from explicit business-case benefit. The value-model correction preserves funding as investment, keeps missing benefit and budget classifications null, derives source trust from source assertion counts, groups claims into business value cases, adds portfolio-scope semantics, and keeps AI tool identity tied to governed program/value-case targets before benefit is shown.

## Layer Impact

- `client-data-lane`: additive semantic columns and bridge tables are added to the Tower value-case layer. The previously applied migration is not edited.
- `global-control-lane`: Tower consumption views and the command-center reader use the corrected semantic fields so the UI does not render missing benefit as zero.
- `internal-admin`: verification tooling now checks source-trust counts, grouped value cases, AI identity links, duplicate proof actions, scope counts, and eight-quarter coverage.

## Client Applicability

- All clients: applies to Tower Value OS projections once the semantic migration is applied in an environment.
- Specific clients: none named in this public record.
- Internal only: private proof Container App and operator proof bundles.
- Public/demo only: none.
- Feature flag: none introduced.

## Changes Included

- Migration: `supabase/migrations/20260809193000_tower_value_os_semantic_remediation_v1.sql`
- Scripts: `scripts/tower/verify-tower-value-os.mjs`
- Runtime reader and UI: Tower command-center reader, summary model, command cockpit, value proof, decision lanes, drawers, and aVa context payload.
- Tests: Tower Value OS contract, command-center reader, and AI matrix fixture coverage.

## QA / Validation

- Pass: `npm test -- --runTestsByPath src/lib/tower/__tests__/readTowerCommandCenter.test.ts src/lib/tower/__tests__/value-operating-system-contract.test.ts src/components/tower/command-center/charts/__tests__/AiBubbleMatrixChart.test.ts --runInBand`
- Pass: `npx eslint src/lib/tower/readTowerCommandCenter.ts src/lib/cio-tower/tower-mart-view-model.ts src/lib/tower/command-center/types.ts src/lib/tower/command-center/view-model.ts src/lib/tower/command-center/derive.ts src/components/tower/command-center/views/CommandCenterView.tsx src/components/tower/command-center/views/ValueProofView.tsx src/components/tower/command-center/views/DecisionLanesView.tsx src/components/tower/command-center/drawers/ProgramDrawer.tsx src/components/tower/command-center/drawers/AiInitiativeDrawer.tsx src/components/tower/command-center/TowerCommandCenter.tsx src/components/tower/command-center/TowerCommandCenterAvaShell.tsx src/lib/tower/__tests__/readTowerCommandCenter.test.ts src/lib/tower/__tests__/value-operating-system-contract.test.ts src/components/tower/command-center/charts/__tests__/AiBubbleMatrixChart.test.ts`
- Pass: `npm run tower:value-os:verify:preflight -- --out-dir /tmp/tower-semantic-preflight-2`
- Pass: local disposable Postgres clean replay with Supabase-compatible shims, `327 / 327` migrations applied and dry-run confirmed no pending migrations.

## Rollout Plan

1. Merge through PR after candidate validation.
2. Apply the additive semantic migration through the governed private ACA operator job using a digest-pinned branch image.
3. Run the Tower Value OS verification bundle from the private operator path.
4. Deploy only a dedicated private Tower proof Container App for CFO browser proof.
5. Stop before any shared web traffic shift.

## Deployment Authority

- Repo-owned deploy workflow: required for shared Product/Lab traffic; not used by this private proof candidate.
- Shared runtime mutators: none authorized by this record.
- Approved image digest: private proof image digest to be recorded after ACR build.
- ACA runtime invariant: shared web runtime must remain unchanged.
- Worker image invariant: operator job must restore to its idle digest after proof runs.
- Feature/env flag update path: none.
- Live signed-in proof required: private proof Container App only before shared deployment consideration.

## Rollback Plan

Do not edit the sealed base migration. If the semantic migration fails before commit, restore the operator job to idle and leave shared web traffic untouched. If applied in a lab database and a rollback is needed, restore the lab database from the pre-apply backup or run an explicitly reviewed follow-up migration that removes semantic-remediation projections without deleting canonical source facts.

## Audit Evidence

- Local clean replay logs under the `/tmp/tower-semantic-clean-replay-*` folder recorded during candidate validation.
- Tower preflight proof bundle under `/tmp/tower-semantic-preflight-2`.
- ACA operator migration and verification bundles to be attached after private proof.
- Private Container App browser screenshots and DOM evidence to be attached after signed-in CFO proof.

## Known Gaps

- Private ACA migration apply, verification bundle, and signed-in CFO proof are pending for this candidate.
