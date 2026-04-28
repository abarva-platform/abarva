# Source Wave S3 Plan · Event Canvas Refresh

**Status:** Shipped — PR #563 merged 2026-04-27
**Branch:** `source/wave-S3/event-canvas`
**Catalog entries:** SRC-DTL-CANVAS

---

## Scope

The densest Source surface. Refresh the event detail canvas: integrate 10-stage tracker in middle strip, wire stage-conditional panel dispatch, apply paper aesthetic to all working-pane panels. Create `SourceEventCanvas` as the new top-level working-pane component that dispatches panels by `currentStageKey`.

**Out of scope:** Scorecard and artifact sub-routes (S4). Commercial-intel panels (S5).

---

## File-level diffs (estimated)

| File | Action | Lines est | Reason |
|---|---|---|---|
| `src/components/source/SourceEventCanvas.tsx` | new | +120 | Stage-key → panel-set dispatcher; replaces SourceEventDetailPage role |
| `src/components/source/SourceActiveStageWorkspace.tsx` | modify | +30 -50 | Paper aesthetic; plug into SourceEventCanvas |
| `src/components/source/SourceJourneyTracker.tsx` | modify | +20 -30 | Paper tokens; moved to middle strip adapter |
| `src/components/source/SourceStagePanel.tsx` | modify | +15 -20 | Paper tokens |
| `src/components/source/SourceStageGatePanel.tsx` | modify | +15 -20 | Paper tokens |
| `src/components/source/AmsBafoPanel.tsx` | modify | +20 -25 | Paper tokens; wire into canvas stage 7 |
| `src/components/source/AmsVendorStorylinePanel.tsx` | modify | +10 -15 | Paper tokens |
| `src/components/source/AmsIntelligenceSignalsPanel.tsx` | modify | +10 -15 | Paper tokens |
| `src/components/source/SourceBafoNegotiationPanel.tsx` | modify | +15 -20 | Paper tokens |
| `src/components/source/SourceBafoNegotiationModelPanel.tsx` | modify | +10 -15 | Paper tokens |
| `src/components/source/SourceRfpReadinessPanel.tsx` | modify | +10 -15 | Paper tokens |
| `src/components/source/SourcePricingComparisonPanel.tsx` | modify | +10 -15 | Paper tokens |
| `src/components/source/VendorPricingComparison.tsx` | modify | +10 -15 | Paper tokens |
| `src/components/source/SourceVendorResponseCompletenessPanel.tsx` | modify | +10 -15 | Paper tokens |
| `src/components/source/SourceVendorSelectionReadinessPanel.tsx` | modify | +10 -15 | Paper tokens |
| `src/components/source/EvaluationCriteriaEditor.tsx` | modify | +10 -15 | Paper tokens |
| `src/app/(maestro)/source/events/[eventId]/page.tsx` | modify | +20 -10 | Mount SourceEventCanvas; pass stage-tracker to middleStrip |
| `src/components/source/__tests__/SourceEventCanvas.test.tsx` | new | +60 | Snapshot for each of 10 stage variants |

**Net change estimate:** ~+420 lines. Under 500-line limit; if it exceeds, split into S3a (canvas shell) and S3b (panel reskins).

---

## Stage-conditional dispatch map

```ts
const STAGE_PANELS: Record<StageKey, ComponentType[]> = {
  intake:             [SourceScopeStageWorkspace],
  scope:              [SourceScopeStageWorkspace, SourceRfpReadinessPanel],
  sourcing_strategy:  [SourceRfpReadinessPanel],
  rfp_rfi_package:    [SourceRfpReadinessPanel, SourceVendorResponseCompletenessPanel],
  vendor_responses:   [SourceVendorResponseCompletenessPanel, VendorPricingComparison],
  evaluation:         [EvaluationCriteriaEditor, SourcePricingComparisonPanel],
  orals_bafo:         [AmsBafoPanel, SourceBafoNegotiationPanel, SourceBafoNegotiationModelPanel, AmsVendorStorylinePanel, AmsIntelligenceSignalsPanel],
  selection:          [SourceVendorSelectionReadinessPanel, SourceStageGatePanel],
  contract_mobilization: [SourceStageGatePanel],
  value_realization:  [SourceStageGatePanel],
};
```

---

## Sentinel voice targets (per stage)

| Stage | Voice |
|---|---|
| `orals_bafo` | *"Stage 7: Orals & BAFO active. Three vendors invited; Vendor B pending staffing data. Pricing comparison locked at 14% variance to benchmark; scorecard approved by Procurement Tuesday."* |
| `intake` | *"Stage 1: Intake open. Scope not yet locked. Vendor long-list not defined."* |
| `evaluation` | *"Stage 6: Evaluation underway. {N} vendors scored; {M} criteria finalized."* |
| _(others)_ | Template-driven from event seed data |

---

## Mockup required

| ID | File |
|---|---|
| SRC-DTL-CANVAS | `docs/source-build/mockups/src-dtl-canvas.html` |

---

## Knowledge fabric contract changes

- New `provenance` props: Added to SourceEventCanvas (passed through to all panels)
- Changes to query surface: **NONE**

---

## Test plan

- Snapshot tests: 1 new component (SourceEventCanvas) with 10 stage variants
- Visual regression: AMS event at stage 7 (`orals_bafo`) as primary baseline
- Smoke test S-SMOKE-AMS: Step 2 must pass (canvas renders, stage 7 active, BAFO panel visible, linked program chip resolves)

---

## Risk & mitigation

- **Highest-risk:** Stage dispatch creating regressions for non-AMS events. All 10 stages must render for at least one seeded event.
- **Split trigger:** If net change >500 lines, split S3a (SourceEventCanvas + page wiring) and S3b (panel reskins).
- **Rollback:** `git revert <merge-commit>`

---

## Auto-approval claim

This PR **meets** auto-approval criteria per §10 (if under 500 lines; else split triggers).
