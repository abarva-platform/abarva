# 2026-08-22-move-phase-gate-evidence-routing — Move Phase Gate Evidence Routing

## Release ID

`2026-08-22-move-phase-gate-evidence-routing`

## Status

`candidate`

## Plain-English Summary

Fixes two Strategic Moves phase-workspace defects found during synthetic end-to-end QA. Current-state evidence uploads now route by the active evidence-family labels shown to the user, and P3 Approve & Build can recover the selected approach from persisted phase-capture text after a page reload. P3 option assembly also keeps operational disruption Moves on the operations-resilience option set when vendor or SLA evidence is present.

## Layer Impact

- Lane: `global-control-lane`.
- Layer 4 Products: Updates the Strategic Moves browser workspace, upload-family inference, and P3 option selection behavior.
- No Layer 1 tenant input, Layer 2 adapter, Layer 3 canonical model, registry, graph, retrieval index, migration, or data-plane write change.

## Client Applicability

- All clients: Strategic Moves phase workspace users.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`
- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`
- `src/lib/programs/phase-templates/p3-option-assembler.ts`
- `src/lib/programs/phase-templates/__tests__/p3-option-assembler.test.ts`

## QA / Validation

- PASS: `npx jest src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx src/lib/programs/phase-templates/__tests__/p3-option-assembler.test.ts --runInBand` — 77/77 tests passed. Jest reported pre-existing duplicate manual mock warnings.
- PASS: `npx eslint src/components/strategic-moves/MovesPhaseStandaloneClient.tsx src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx src/lib/programs/phase-templates/p3-option-assembler.ts src/lib/programs/phase-templates/__tests__/p3-option-assembler.test.ts`.
- PASS: `npx tsc --noEmit`.
- PASS: `npm run release:check`.

## Rollout Plan

Merge through a PR to `main`. The repo-owned Azure Container Apps main deploy workflow will build and deploy the runtime image if the PR merges.

## Deployment Authority

- Repo-owned deploy workflow: Required after merge to main.
- Shared runtime mutators: None outside the repo-owned deploy workflow.
- Approved image digest: Produced by the deploy workflow.
- ACA runtime invariant: Required before claiming the change is live.
- Worker image invariant: Required by the deploy workflow.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes. Re-open the synthetic Move phase workspace and verify P2 evidence routing, P3 option cards, P3 Approve & Build enablement, and phase advancement behavior.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main workflow. No migration, tenant-data rollback, registry rollback, graph rollback, or retrieval rollback is required.

## Audit Evidence

- PR URL: to be added by the PR.
- Local validation commands listed above.
- Synthetic evidence pack and browser proof artifacts are stored outside the repository for the QA run.
- Deployment evidence: ACA deploy run and runtime-invariant proof after merge.

## Known Gaps

This does not create or mutate Move data. It fixes browser workspace behavior so the existing synthetic end-to-end run can continue through the normal UI path.
