# Source Wave S2 Plan · Index Pages Refresh

**Status:** Planned (starts after S1 merge)
**Branch:** `source/wave-S2/index-refresh`
**Catalog entries:** SRC-IDX-DEFAULT · SRC-IDX-EVENTS · SRC-IDX-VALUE

---

## Scope

Refresh the three index pages (dashboard, events portfolio, value ledger) with paper aesthetic and Sentinel voice. All working-pane components get restyled using SHELL tokens — no layout restructuring, no new data.

**Out of scope:** Working-pane component logic changes. No data layer changes. Event canvas (S3 scope).

---

## File-level diffs (estimated)

| File | Action | Lines est | Reason |
|---|---|---|---|
| `src/components/source/AbarVaSourceDashboard.tsx` | modify | +40 -60 | Replace inline-styled cards with SHELL tokens |
| `src/components/source/SourceEventsPortfolio.tsx` | modify | +30 -50 | Restyle card grid, filter integration |
| `src/components/source/SourceValueLedger.tsx` | modify | +25 -35 | Refresh table layout with SHELL tokens |
| `src/components/source/SourcingEventCard.tsx` | modify | +20 -30 | Re-style with SHELL tokens |
| `src/components/source/SourcingEventTable.tsx` | modify | +15 -20 | Re-style with SHELL tokens |
| `src/components/source/EventLifecycleStatusBadge.tsx` | modify | +10 -15 | Verify paper-aesthetic rendering |
| `src/components/source/LinkedProgramBadge.tsx` | modify | +10 -15 | Verify paper-aesthetic rendering |
| `src/app/(maestro)/source/page.tsx` | modify | +10 | Wire Sentinel voice per SRC-IDX-DEFAULT spec |
| `src/app/(maestro)/source/events/page.tsx` | modify | +10 | Wire Sentinel voice per SRC-IDX-EVENTS spec |
| `src/app/(maestro)/source/value/page.tsx` | modify | +10 | Wire Sentinel voice per SRC-IDX-VALUE spec |
| `src/components/source/__tests__/AbarVaSourceDashboard.test.tsx` | new | +40 | Snapshot |
| `src/components/source/__tests__/SourceEventsPortfolio.test.tsx` | new | +40 | Snapshot |
| `src/components/source/__tests__/SourceValueLedger.test.tsx` | new | +35 | Snapshot |

**Net change estimate:** ~+300 lines. Under 500-line limit.

---

## Mockups required

| ID | File | Status |
|---|---|---|
| SRC-IDX-DEFAULT | `docs/source-build/mockups/src-idx-default.html` | Produce in design phase |
| SRC-IDX-EVENTS | `docs/source-build/mockups/src-idx-events.html` | Produce in design phase |
| SRC-IDX-VALUE | `docs/source-build/mockups/src-idx-value.html` | Produce in design phase |

---

## Sentinel voice targets

- **SRC-IDX-DEFAULT:** *"4 active events · AMS Vendor Consolidation at Stage 7, one input away from BAFO close. Value ledger: $2.1M attributed, $890K pending vendor confirmation."*
- **SRC-IDX-EVENTS:** *"12 events · 4 active · 1 blocked — AMS BAFO awaiting Vendor B staffing data, due Friday."*
- **SRC-IDX-VALUE:** *"$2.1M sourcing-attributed value confirmed · $890K asserted by vendors, pending audit. AMS contributes $1.4M of confirmed total."*

---

## Knowledge fabric contract changes

- New `provenance` props: Added to AbarVaSourceDashboard, SourceEventsPortfolio, SourceValueLedger (accepts but does not display — iceberg principle)
- Changes to query surface: **NONE**

---

## Test plan

- Snapshot tests: 3 new (one per index component)
- Visual regression baseline: Yes — 3 pages against paper aesthetic
- Smoke test S-SMOKE-AMS: Step 1 must pass (events list shows AMS event card with correct stage/status/linked-program)

---

## Risk & mitigation

- **Highest-risk change:** `AbarVaSourceDashboard` is the largest component — restyle must not change data flow
- **Rollback:** `git revert <merge-commit>`

---

## Auto-approval claim

This PR **meets** auto-approval criteria per §10 (pending CI green + smoke pass).
