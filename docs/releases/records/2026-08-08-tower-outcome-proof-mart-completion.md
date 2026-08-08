# 2026-08-08-tower-outcome-proof-mart-completion — Tower Outcome Proof Mart Completion

## Release ID

`2026-08-08-tower-outcome-proof-mart-completion`

## Status

`candidate`

## Plain-English Summary

This release promotes the Tower cockpit's operating story into deterministic mart fields. The UI can now read board value posture, proof waterfall stage counts and amounts, capital decision matrix dimensions, evidence-owner queue metadata, and source-trust lineage state from `cio_tower.mart_*` instead of calculating those concepts in React.

The cockpit UI remains frozen. This change strengthens the governed projection underneath it and preserves the rule that conflicted or unknown value cannot become claimable, realized, or board-certified value.

## Layer Impact

- `client-data-lane` / Layer 3 Canonical / marts: adds compatibility-safe columns and a validation view to the existing `cio_tower.mart_*` read model. These are derived projections, not new source truth.
- `global-control-lane` / Layer 4 Products: Tower reads the new mart fields when present, with old-row fallbacks so existing tenants do not break before a governed refresh writes v2 rows.
- Layer 1 / Layer 2: no intake template, adapter, loader-source, or tenant package change.

## Client Applicability

- All clients: applies to all tenants once their Tower mart rows are refreshed by the governed data-build path.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Migration: `supabase/migrations/20260808193000_cio_tower_outcome_proof_mart_v2.sql`
- Mart assembler: `src/lib/cio-tower/mart-projection/assemble-mart.ts`
- Mart vocabulary: `src/lib/cio-tower/mart-projection/mart-metric-keys.ts`
- Runtime read model: `src/lib/cio-tower/tower-mart-view-model.ts`
- Tower view model/types: `src/lib/tower/command-center/view-model.ts`, `src/lib/tower/command-center/types.ts`
- Cockpit binding only: `src/components/tower/command-center/views/CommandCenterView.tsx`
- aVa validation: `src/lib/cio-tower/answer.ts`
- Tests: `src/lib/cio-tower/mart-projection/__tests__/assemble-mart.test.ts`, `src/lib/cio-tower/__tests__/answer.test.ts`

## QA / Validation

- Pass: `npx jest src/lib/cio-tower/mart-projection/__tests__/assemble-mart.test.ts src/lib/tower/command-center/__tests__/view-model.test.ts src/components/tower/command-center/__tests__/TowerCommandCenter.test.tsx src/lib/cio-tower/__tests__/answer.test.ts --runInBand`
- Pass: `npx eslint src/lib/cio-tower/mart-projection/assemble-mart.ts src/lib/cio-tower/mart-projection/mart-metric-keys.ts src/lib/cio-tower/tower-mart-view-model.ts src/lib/tower/command-center/types.ts src/lib/tower/command-center/view-model.ts src/components/tower/command-center/views/CommandCenterView.tsx src/lib/cio-tower/answer.ts src/lib/cio-tower/mart-projection/__tests__/assemble-mart.test.ts src/lib/cio-tower/__tests__/answer.test.ts`
- Note: Jest emitted existing duplicate manual mock warnings for markdown/GFM mocks; the focused suites still passed 91/91.

## Rollout Plan

Merge through PR to `main`. Apply the migration through the approved database migration path. Refresh tenant Tower mart rows only through the governed ACA data-build job. Do not promote a tenant as board-grade until `cio_tower.v_mart_outcome_proof_validation` returns zero rows for that tenant and signed-in Tower proof confirms the cockpit still renders correctly.

## Deployment Authority

- Repo-owned deploy workflow: required for application activation.
- Shared runtime mutators: none in this change.
- Approved image digest: produced by the repo-owned deploy workflow.
- ACA runtime invariant: required only if deployed to shared Product/Lab runtime.
- Worker image invariant: required for any governed data-build job that writes refreshed mart rows.
- Feature/env flag update path: none.
- Live signed-in proof required: yes after migration/app deployment and after any tenant mart refresh.

## Rollback Plan

Application rollback is a normal revert/redeploy through the repo-owned workflow. The migration is additive and should remain inert if application code rolls back. If refreshed mart rows are incorrect, rerun the prior approved Tower data-build job or restore the tenant's previous `cio_tower.mart_*` rows through an approved data-build rollback path.

## Audit Evidence

- The migration file and diff.
- Focused Jest output for mart assembly, Tower view-model, cockpit behavior, and aVa visible-answer validation.
- Post-merge migration apply logs.
- Governed data-build job proof bundle for each tenant refresh.
- Signed-in Tower browser proof after runtime deployment and tenant mart refresh.

## Known Gaps

- No live database migration, tenant mart refresh, or production deployment is performed by this local implementation.
- Lineage conflict detection is now represented in the mart contract and SQL validation view, but existing tenant rows need a governed refresh before those states become populated product data.
