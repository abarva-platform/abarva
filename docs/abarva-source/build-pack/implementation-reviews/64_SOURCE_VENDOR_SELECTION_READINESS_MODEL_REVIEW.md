# 64 Source Vendor Selection Readiness Model Review

## Scope

This review covers the deterministic implementation added in `src/lib/source/vendor-selection-readiness.ts` and
`src/lib/source/vendor-selection-readiness-types.ts` to produce a non-judgmental selection-readiness signal
for Source events.

## Files Changed

- `src/lib/source/vendor-selection-readiness-types.ts`
- `src/lib/source/vendor-selection-readiness.ts`
- `src/lib/source/index.ts`
- `src/__tests__/integration/source/source-vendor-selection-readiness.test.ts`

## Design References

- `docs/platform-design/experience-system/00_EXPERIENCE_SYSTEM_MASTER_ANCHOR.md`
- `docs/platform-design/experience-system/DESIGN_DECISIONS_LOCK.md`
- `docs/platform-design/experience-system/01_BRAND_AND_VISUAL_LANGUAGE.md`
- `docs/platform-design/experience-system/03_DESIGN_TOKENS_AND_USAGE.md`
- `docs/platform-design/experience-system/11_VISUAL_ACCEPTANCE_CRITERIA.md`
- `docs/platform-design/experience-system/wireframes/05_source_event_by_stage_wireframes.md`
- `docs/platform-design/experience-system/components/04_AbarVaJourneyMap.md`
- `docs/platform-design/experience-system/components/05_AbarVaAgentPanel.md`
- `docs/platform-design/experience-system/components/09_AbarVaDataTable.md`
- `docs/platform-design/experience-system/components/10_AbarVaArtifactStrip.md`
- `docs/platform-design/experience-system/components/15_AbarVaAgentResponseCard.md`

## What the model does

- Consumes deterministic inputs from:
  - `SourceCommercialSignals`
  - `SourceExecutiveDecisionSummary`
  - `SourceStageGateReadiness`
  - artifact status seed input
- Computes:
  - `readinessStatus`
  - `selectionPosture`
  - `selectionReviewReady`
  - `viableVendors` / `blockedVendors`
  - unresolved commercial/evidence/gate issues
  - required artifacts and approvals
  - next action and governance-facing notes
- Produces `sourceModulesUsed` to show which canonical model layers contributed.

## Determinism / Safety

- No model/API calls.
- No runtime persistence changes.
- Uses seeded inputs when explicit inputs are not provided.
- Returns deterministic output for identical input values.
- Uses conservative defaults and never marks `ready_for_selection_review` unless blockers are closed.

## Test Coverage

Created `src/__tests__/integration/source/source-vendor-selection-readiness.test.ts` with checks for:

- deterministic build behavior on seeded data
- Vendor B blocked by pricing template gap
- Vendor C evidence caution visibility
- required artifacts/approvals inclusion
- module provenance inclusion
- markdown formatter output
- file-level guard test rejecting model/API/upload/workflow/persistence imports in this slice scope

## Validation Run

- `npx tsc --noEmit --pretty false`
- `npx eslint src/lib/source/vendor-selection-readiness.ts src/lib/source/vendor-selection-readiness-types.ts src/lib/source/index.ts src/__tests__/integration/source/source-vendor-selection-readiness.test.ts`
- `npx jest src/__tests__/integration/source/source-vendor-selection-readiness.test.ts`
- `npm run build -- --webpack`
- `git diff --check`

## Out-of-Scope / What it Does Not Do

- It does not make final vendor selection decisions.
- It does not implement approval workflows.
- It does not implement document export/import, artifact generation, or upload/parsing.

## Production Readiness Impact

- No direct `production_ready` or `pilot_ready` state transitions are set by this model.
- This slice is a deterministic synthesis layer to support pre-selection readiness visibility.
