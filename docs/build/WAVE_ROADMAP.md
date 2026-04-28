# Tower Module · Wave Roadmap

**Module:** AI Control Tower
**Design spec:** `docs/build/TOWER_DESIGN_SPEC.md`
**Orchestration:** `docs/build/ORCHESTRATION_SPEC.md`
**Last updated:** 2026-04-28

---

## Wave status

| Wave | Title | Catalog entries | Status | Notes |
|---|---|---|---|---|
| **T0** | Audit & spec | — | `shipped` | Audit complete; gap analysis in WAVE-T0-PLAN.md |
| **T1** | Shell + index foundations | TWR-IDX-PORTFOLIO (skeleton) | `in_progress` | KPI band + AI program table; no bubble chart yet |
| **T2** | Bubble chart + lenses | TWR-IDX-PORTFOLIO (full), TWR-IDX-LENSES | `planned` | Visual peak — bubble chart, lens tabs (add COST lens) |
| **T3** | Program detail | TWR-DTL-PROGRAM | `planned` | Value model panel, vendor anchoring, adoption panel |
| **T4** | Pressure system | TWR-DTL-PRESSURE, TWR-IDX-DECISIONS | `planned` | Typed pressures (8 types), decisions log |
| **T5** | Vendor & outcome detail | TWR-DTL-VENDOR, TWR-DTL-OUTCOME, TWR-DTL-DECISION | `planned` | Renewal calendar, promise tracking, decision provenance |
| **T6** | Workspaces | TWR-FLW-ONBOARD, TWR-FLW-REALLOCATE, TWR-FLW-RENEWAL | `planned` | Largest wave; all net-new flows |
| **T7** | States + polish | TWR-EMP-NO-PROGRAMS, TWR-ERR-PROGRAM-NOT-FOUND | `planned` | Empty/error states, connector health meta-pressure |

---

## Dependency graph

```
T0 (audit) → T1 (portfolio skeleton)
T1 → T2 (bubble chart + lenses — needs program data model)
T2 → T3 (program detail — needs programs to click into)
T3 → T4 (pressure system — needs program context)
T4 → T5 (vendor/outcome/decision — needs pressure entities)
T5 → T6 (flows — needs all detail pages as destinations)
T6 → T7 (states — cleanup after flows exist)
```

---

## Catalog coverage after each wave

| After wave | Catalog entries shipped | Running total |
|---|---|---|
| T0 | 0 | 0/13 |
| T1 | TWR-IDX-PORTFOLIO (skeleton) | 1/13 |
| T2 | TWR-IDX-PORTFOLIO (full), TWR-IDX-LENSES | 3/13 |
| T3 | TWR-DTL-PROGRAM | 4/13 |
| T4 | TWR-DTL-PRESSURE, TWR-IDX-DECISIONS | 6/13 |
| T5 | TWR-DTL-VENDOR, TWR-DTL-OUTCOME, TWR-DTL-DECISION | 9/13 |
| T6 | TWR-FLW-ONBOARD, TWR-FLW-REALLOCATE, TWR-FLW-RENEWAL | 12/13 |
| T7 | TWR-EMP-NO-PROGRAMS, TWR-ERR-PROGRAM-NOT-FOUND | 13/13 |

---

## Gap summary (from T0 audit)

**Components missing (net-new required):**
- TWR-DTL-DECISION (no existing route)
- TWR-FLW-REALLOCATE (no existing route)
- TWR-FLW-RENEWAL (no existing route)

**Components needing significant rework:**
- `TowerIndexPage.tsx` → needs KPI band + AI program portfolio table; switch Atlas → Nexus
- `TowerLensTabs.tsx` + lens routes → needs COST lens added (currently only 3 of 4)
- `ProgramScopePage.tsx` → needs vendor anchoring + value model panel
- `ai-portfolio-inventory.ts` → generic use-case model, needs vendor-anchored AI program fixture alongside

**Components with minor gaps:**
- `PressureDetailPage.tsx` → add P-type badges and $ impact quantification
- `OutcomePage.tsx` → add promise baseline + confidence haircut display
- `ActivityPage.tsx` → convert to decisions log with decision-type filters

---

## Smoke test gate

`T-SMOKE-PORTFOLIO` must pass before any wave from T1 onward merges.
Definition in `docs/build/ORCHESTRATION_SPEC.md` §8.
