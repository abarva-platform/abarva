# Source Wave S4 Plan · Sub-routes Refresh

**Status:** Shipped — PR #565 merged 2026-04-27
**Branch:** `source/wave-S4/sub-routes`
**Catalog entries:** SRC-DTL-SCORECARD · SRC-DTL-ARTIFACT

---

## Scope

Scorecard editor and artifact detail pages. Both are currently under-styled relative to the paper aesthetic. Both pages share the AppShell chrome from S1 — this wave is working-pane content only.

**Out of scope:** Any changes to scorecard data logic. No new query functions.

---

## File-level diffs (estimated)

| File | Action | Lines est | Reason |
|---|---|---|---|
| `src/components/source/ScorecardGovernancePanel.tsx` | modify | +40 -55 | Paper aesthetic; 7-state lifecycle display |
| `src/components/source/EvaluationCriteriaEditor.tsx` | modify | +25 -35 | Paper aesthetic (also touched in S3 — reconcile) |
| `src/components/source/SourceArtifactDrawer.tsx` | modify | +40 -50 | Paper aesthetic; tier indicator (rich/outline/stub) |
| `src/components/source/SourceArtifactStatusStrip.tsx` | modify | +15 -20 | Paper aesthetic |
| `src/app/(maestro)/source/events/[eventId]/scorecard/page.tsx` | modify | +15 -8 | Sentinel voice per SRC-DTL-SCORECARD spec |
| `src/app/(maestro)/source/events/[eventId]/artifacts/[artifactId]/page.tsx` | modify | +15 -8 | Sentinel voice per SRC-DTL-ARTIFACT spec |
| `src/components/source/__tests__/ScorecardGovernancePanel.test.tsx` | new | +40 | Snapshot per lifecycle state |
| `src/components/source/__tests__/SourceArtifactDrawer.test.tsx` | new | +35 | Snapshot per artifact tier |

**Net change estimate:** ~+250 lines. Under 500-line limit.

---

## Sentinel voice targets

- **SRC-DTL-SCORECARD:** *"Scorecard at `{lifecycleState}`. {N} criteria approved · {M} pending review. Locks when all criteria reach `approved`."*
- **SRC-DTL-ARTIFACT:** *"Artifact tier: `{tier}`. Status: `{status}`. Provenance: `{createdFrom}`. Evidence chain: {N} entries."*

---

## Mockups required

| ID | File |
|---|---|
| SRC-DTL-SCORECARD | `docs/source-build/mockups/src-dtl-scorecard.html` |
| SRC-DTL-ARTIFACT | `docs/source-build/mockups/src-dtl-artifact.html` |

---

## Knowledge fabric contract changes

- `provenance` props: Added to SourceArtifactDrawer (this is where provenance becomes visible per §3 Iceberg principle — the artifact detail is the surface that shows provenance data-provenance attributes visibly when `body.show-provenance`)
- Changes to query surface: **NONE**

---

## Test plan

- Snapshot: ScorecardGovernancePanel (7 lifecycle states), SourceArtifactDrawer (3 tier variants)
- Visual regression: Scorecard page + artifact detail page
- Smoke test S-SMOKE-AMS: Extended to traverse scorecard + at least one artifact

---

## Risk & mitigation

- **Highest-risk:** `EvaluationCriteriaEditor` touched in both S3 and S4 — must reconcile changes cleanly
- **Rollback:** `git revert <merge-commit>`

---

## Auto-approval claim

This PR **meets** auto-approval criteria per §10 (pending CI green + smoke pass).
