# Source Wave S5 Plan · Commercial-Intel Convergence

**Status:** Planned (starts after S4 merge)
**Branch:** `source/wave-S5/commercial-convergence`
**Catalog entries:** Internal — reduces 12 Commercial* panels to 4

---

## Scope

The 12 `SourceCommercial*` components authored in Wave-14 overlap heavily with each other and with `SourceExecutiveDecisionSummaryPanel`. This wave eliminates the redundancy.

**Out of scope:** Any working-pane visual changes. No new catalog entries shipped. No data layer changes.

---

## Convergence map

| Original component | Fate | Target |
|---|---|---|
| `SourceCommercialActionQueue` | merge | `SourceExecutiveDecisionSummaryPanel` |
| `SourceCommercialEventSection` | fold | `SourceEventCanvas` (from S3) |
| `SourceCommercialExecutiveBrief` | merge | `SourceExecutiveDecisionSummaryPanel` |
| `SourceCommercialHub` | delete | Functions absorbed by canvas |
| `SourceCommercialMissionsPanel` | merge → rename | `SourceMissionPanel` (aligned with `agent-mission-types.ts`) |
| `SourceCommercialReadinessView` | merge | `SourceDataReadinessPanel` |
| `SourceCommercialRiskPanel` | keep → rename | `SourceRiskPanel` |
| `SourceCommercialSignalsPreview` | merge → rename | `SourceSignalsPanel` (generic, not AMS-specific) |
| `SourceCommercialSummaryPanel` | delete | Redundant with executive decision summary |
| `SourceCommercialSummarySurface` | delete | Redundant with executive decision summary |
| `SourceCommercialWorkflowCanvas` | delete | Redundant with SourceEventCanvas (S3) |
| `SourceDataReadinessPanel` | keep (absorbs ReadinessView) | `SourceDataReadinessPanel` |

**Result:** 12 → 4 components retained/renamed: `SourceExecutiveDecisionSummaryPanel`, `SourceMissionPanel`, `SourceRiskPanel`, `SourceSignalsPanel`, `SourceDataReadinessPanel`.

---

## File-level diffs (estimated)

| File | Action | Lines est | Reason |
|---|---|---|---|
| `src/components/source/SourceCommercialActionQueue.tsx` | delete | -120 | Merged into ExecutiveDecisionSummary |
| `src/components/source/SourceCommercialEventSection.tsx` | delete | -90 | Folded into SourceEventCanvas |
| `src/components/source/SourceCommercialExecutiveBrief.tsx` | delete | -150 | Merged into ExecutiveDecisionSummary |
| `src/components/source/SourceCommercialHub.tsx` | delete | -200 | Absorbed by canvas |
| `src/components/source/SourceCommercialMissionsPanel.tsx` | delete | -140 | → SourceMissionPanel |
| `src/components/source/SourceCommercialReadinessView.tsx` | delete | -110 | → SourceDataReadinessPanel |
| `src/components/source/SourceCommercialSummaryPanel.tsx` | delete | -130 | Redundant |
| `src/components/source/SourceCommercialSummarySurface.tsx` | delete | -90 | Redundant |
| `src/components/source/SourceCommercialWorkflowCanvas.tsx` | delete | -180 | Redundant with S3 canvas |
| `src/components/source/SourceCommercialRiskPanel.tsx` | rename+keep | 0 | → SourceRiskPanel.tsx |
| `src/components/source/SourceCommercialSignalsPreview.tsx` | rename+keep | -20 | → SourceSignalsPanel.tsx (AMS refs generalized) |
| `src/components/source/SourceMissionPanel.tsx` | new | +80 | Aligned to agent-mission-types.ts |
| `src/components/source/SourceRiskPanel.tsx` | new (rename) | 0 | From SourceCommercialRiskPanel |
| `src/components/source/SourceSignalsPanel.tsx` | new (rename) | +20 | From SourceCommercialSignalsPreview |
| `src/components/source/SourceExecutiveDecisionSummaryPanel.tsx` | modify | +60 -20 | Absorbs ActionQueue + ExecutiveBrief content |
| `src/components/source/SourceDataReadinessPanel.tsx` | modify | +40 -10 | Absorbs ReadinessView content |
| `src/components/source/index.ts` | modify | -9 +4 | Drop deleted exports, add new |

**Net change estimate:** ~+200 added, -1210 deleted = -1010 net. This is a **large net deletion wave** — likely held for human visual review per §10 criterion #2 if net change >500.

**Note:** Net *deletion* of >500 lines is architecturally safe (no code added that could regress), but the auto-merge policy counts |net| = 1010 > 500. Expect this wave to be held for human review.

---

## Pre-deletion grep audit (mandatory)

Before deletion, agent must confirm zero external imports for each deleted component:
```bash
grep -r "SourceCommercialActionQueue\|SourceCommercialEventSection\|SourceCommercialExecutiveBrief\|SourceCommercialHub\|SourceCommercialMissionsPanel\|SourceCommercialReadinessView\|SourceCommercialSummaryPanel\|SourceCommercialSummarySurface\|SourceCommercialWorkflowCanvas" src/
```
Grep output must be included in PR description.

---

## Knowledge fabric contract changes

- None — no new data rendering, no new provenance props
- Changes to query surface: **NONE**

---

## Test plan

- Snapshot: `SourceExecutiveDecisionSummaryPanel` (updated), `SourceDataReadinessPanel` (updated), `SourceMissionPanel` (new), `SourceSignalsPanel` (new)
- Smoke test S-SMOKE-AMS: Must pass confirming no functionality lost

---

## Risk & mitigation

- **Highest-risk:** Deleting 9 components — must confirm zero import references first
- **Held for review:** Expected (net change >500 lines)
- **Rollback:** `git revert <merge-commit>` restores all 9 deleted files

---

## Auto-approval claim

This PR **does NOT meet** auto-approval criteria per §10: net change >500 lines (criterion #2 fails). **Held for human review.** Human applies `auto-approved-override` label after visual inspection.
