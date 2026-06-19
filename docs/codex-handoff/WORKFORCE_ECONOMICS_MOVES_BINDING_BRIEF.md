# Workforce Economics → Moves Binding — Session Readout + Codex Execution Brief

**Date:** 2026-06-19
**Author:** Claude (Opus 4.8) session
**Purpose:** (A) Consolidated readout of everything created this session. (B) Codex execution brief to bind the AbarVa Workforce Economics substrate into the **Moves** module (the business-case / roadmap / estimation deliverable arc).

---

# PART A — Session Readout (everything created)

## 1. Tower Atlas grounded-chat fix — SHIPPED + LIVE

- **Problem:** AI Control Tower's Atlas chat (`src/components/tower/AiControlTowerPage.tsx`) used a client-side keyword router (`buildAtlasAnswer` → `classifyAiControlTowerIntent`) that dumped a templated "Spend read" / "Actions read" lens and **dropped the question's predicate** (e.g. "which spend lacks adoption or value proof" returned top-N by size).
- **Fix:** `submitQuestion` now POSTs to `/api/v1/atlas/chat` → `runAtlasTurn` (grounded engine), renders prose + follow-ups + loading state; keyword branches deleted; local builder kept only as a marked offline fallback.
- **Status:** PR [#3677] merged to `main` (`33cd6ab20`); `aca-main-deploy` green (11m25s); **verified live** on app.abarva.ai (First Capital) — grounded, predicate-aware, record-cited answer.
- **Release record:** `docs/releases/records/2026-06-18-tower-atlas-grounded-chat.md`.

## 2. Tower "Demo fallback" root cause — DIAGNOSED

- Two parallel substrates; only one loaded. Tower reads `ai_control_*` (+ `ai_control_refresh_runs`), which is loaded **per tenant** and was never loaded for First Capital → demo fallback. The context load writes only `enterprise_context_*`.
- Captured in memory `project_tower_dual_substrate.md`.

## 3. First Capital Intelligence Substrate brief (P3–P5) — ON MAIN

- `docs/codex-handoff/FIRST_CAPITAL_INTELLIGENCE_SUBSTRATE_BRIEF.md` (PR [#3678], `d9b26fad2`).
- P3 typed-fact extraction + canonical identity · P4 read-model views + materialization · **P4.4f durable Tower projection** (`ai_control_tower_lens_mv` over the context layer, new `context_projection` source — retires the dual substrate for all tenants) · P5 insight engine + grounded Q&A.
- **Founder decision:** DURABLE path chosen. NOT yet built — depends on P3 typed facts; waiting on a **client-dataset upgrade** (agreed to reconcile after it lands; reconcile checklist in memory).

## 4. AbarVa Workforce Economics platform — SUBSTRATE BUILT + VERIFIED

- **File:** `~/Downloads/Workforce_Taxonomy_Master.xlsx` — 17 executive-grade sheets, parametric.
- **Build script (in repo):** `scripts/workforce-economics/build-workforce-taxonomy.py` (openpyxl). **Workbook (in repo):** `docs/workforce-economics/Workforce_Taxonomy_Master.xlsx` (also at `~/Downloads/Workforce_Taxonomy_Master.xlsx`). **Validation:** python `formulas` lib (LibreOffice/`soffice` is NOT installed on this Mac, so the xlsx skill's `recalc.py` can't run) — **0 formula errors / 14,848 cells**. Excel recalculates on open.
- **Coverage:** 21 towers · 139 capabilities · **321 role families** · **891 priced rate-card units** (role × eligible level) · 10 career levels · 17 geos · 23 anonymized provider archetypes (CONS-T1 / SI-T1 / SI-T2 / ENG-B / AI-B — **no real firms**) · 5 agent platforms · 107 delivery pods.
- **Sheets:** Cover · Exec Summary · Assumptions (engine) · Towers · Capabilities · Career Levels · Roles · Role Rate Card · Geography · Internal Cost Model · Rate Intelligence · Agent Economics · Delivery Pods · **Estimation Engine** · **Business Case** · Moves Binding · Glossary.
- **Design (locked):** fully **parametric** — every rate/cost is a formula off the Assumptions sheet (base × geo × provider-tier × shore × scarcity; loaded = base × (1 + 87.15% load) / 2,080). Change one multiplier → whole model reflows.
- **Estimate-twice (the differentiator):** every scope estimated Traditional (people-only) vs AI-Native (people + agents + platforms) using a **CAPACITY model** (see WE-2 below — agents add parallel capacity = faster; billed by subscription not human rate = cheaper; humans billed for actual time only; **no double-counting**). Worked example: **$1.71M → $0.72M (−58%)**, 18 → 8 humans, **2.4× productivity**, ROI 322% → 895%, payback 8.5 → 3.6 mo, NPV $4.26M → $5.24M.
- Captured in memory `project_workforce_economics_platform.md`.

## 5. Founder decisions recorded this session

- Workforce platform: **full-breadth-first**, **design-to-bind-to-Moves**, build in parallel with the dataset-upgrade wait, then EXPAND to full counts.
- Tower durable fix: **DURABLE projection** (P4.4f), not the quick per-tenant load.
- Client-dataset upgrade in progress → **wait + reconcile** before building P3/P4.

---

# PART B — Codex Execution Brief: bind Workforce Economics into Moves

**Goal:** make the Workforce Economics substrate the **economics engine behind the Move business-case / roadmap / estimation deliverables** — one source of truth, traceable, estimate-twice. NOT a second tool. The workbook is the reference; this brief ports it to code and wires it into Moves.

**Execution authority:** Full. Branch per phase `feat/moves-workforce-economics-{phase}`; squash-merge after QA; deploy via `aca-main-deploy` on push to main.

> **⚠ RECONCILE FIRST — read `docs/build/DELIVERABLE_TRANSFORMATION_RECONCILIATION.md`.**
> AbarVa has **two business-case paths** (`move-business-case.ts` → `board-grade/*` routes, which
> already has SVG exhibits; and the orchestrator `deliverable-structures.ts business_case`, prose).
> The Deliverable Transformation is rebuilding the orchestrator path toward exhibit-led. To avoid
> producing **two** economics-bearing business cases:
> - **WE-1 / WE-2 (the economics engine) are conflict-free — build them now.** They are an input,
>   not a binding.
> - **WE-3 / WE-4 / WE-5 converge through the transformation's `MoveDecisionModel`**, not by
>   patching two generators. The estimate-twice becomes the Value Model on that single object; the
>   business-case/roadmap **archetype** consumes it and renders via the **existing** economic
>   exhibits in `expert-kernel/exports/board-grade/svg-charts.ts` (investment waterfall · cost stack
>   · value bridge · payback curve · tornado · roadmap swimlane — a 1:1 fit). Do **not** stand up a
>   parallel exhibit or generation path. See the reconciliation note + the spec §9 P4 archetype.

## What exists today (verified on main — read before writing)

| Asset                        | Location                                                                                                                                                                   | Role                                                                    |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Move business case           | `src/lib/programs/move-business-case.ts`                                                                                                                                   | Bind estimate-twice cost/ROI here                                       |
| Timeline + resource estimate | `src/lib/deliverables/timeline-resource-estimate.ts` (+ `templates/timeline_resource_estimate.ts`)                                                                         | Bind rate intelligence + pods + capacity model here                     |
| Execution roadmap            | `src/lib/deliverables/execution-roadmap-tracker.ts` (+ `templates/execution_roadmap_tracker.ts`)                                                                           | Derive durations from estimated effort/capacity — no invented timelines |
| Deliverable orchestrator     | `src/lib/deliverables/orchestrator/*` (`generation-plan`, `section-generation`, `evidence-assembler`, `quality-validator`, `types`, `generate-service`, `runs-repository`) | Wire WE into generation                                                 |
| Deliverable registry         | `src/lib/programs/deliverable-registry.ts`                                                                                                                                 | Register WE-backed deliverables                                         |
| Generate route               | `src/app/api/v1/programs/[programId]/generate/route.ts`                                                                                                                    | Generation entry point                                                  |
| Grounded answer contract     | `src/lib/source/source-answer-engine.ts` (pattern)                                                                                                                         | Reuse for any narrative; cite, refuse on insufficient                   |
| Workbook (reference)         | `docs/workforce-economics/Workforce_Taxonomy_Master.xlsx` + `scripts/workforce-economics/build-workforce-taxonomy.py`                                                      | Source of truth for the ported data                                     |

## Phase WE-1 — Port substrate to typed code

**Branch:** `feat/moves-workforce-economics-we1-substrate`
Create `src/lib/workforce-economics/`:

- `taxonomy.ts` — towers, capabilities (with scarcity + agent-amenability), role families (tower/capability/scarcity/min-max level), career levels (YOE + base salary), delivery pods (role mix, headcount, blended level, agent mix).
- `assumptions.ts` — the parametric engine constants: load-component % (total 87.15%), billable hours/yr (2080), provider-tier multipliers (CONS-T1 1.85 / SI-T1 1.25 / SI-T2 0.85 / ENG-B 1.10 / AI-B 1.35), shore multipliers (on 1.00 / near 0.72 / off 0.45), scarcity multipliers (High 1.30 / Med 1.10 / Low 1.00), market base bill rate by level, geography multipliers, agent economics (equiv-FTE, utilization, monthly cost, productivity/doc/testing/arch multipliers).
- `rate-engine.ts` — pure functions: `loadedHourly(level)`, `providerRate(provider, level, shore, scarcity)`, `blendedRate(mix)`, `rateCard()` (role × level expansion).
- **Source-of-truth discipline — make drift impossible, don't merely detect it.** The canonical
  numbers live in the **Python** builder `scripts/workforce-economics/build-workforce-taxonomy.py`
  (not a `.mjs` — earlier wording was stale). A hand-ported TS + an xlsx-snapshot test is fragile
  (binary parse in CI). Instead: have the Python builder **also emit
  `src/lib/workforce-economics/workforce-economics.constants.json`** (the assumptions, multipliers,
  and rate-card as plain JSON, checked in and diffable in PRs), and have `assumptions.ts` /
  `rate-engine.ts` **import and validate against that JSON** at module load. Single source → the TS
  cannot drift from the workbook by construction. CI re-runs the builder and fails if the emitted
  JSON differs from the committed one.

## Phase WE-2 — Estimation engine (capacity model — estimate twice)

**Branch:** `feat/moves-workforce-economics-we2-estimator`
Create `src/lib/workforce-economics/estimation-engine.ts`. **Use this exact capacity model — do NOT compress effort hours AND cut the team (that double-counts and makes AI-native look slower; this bug was caught and fixed in the workbook):**

```
W            = total effort hours (sum of WBS estimate categories)
blendedRate  = blendedRate(geo/shore mix)
// Traditional
tradMonths   = W / (tradHumans * hoursPerFteMonth)
tradCost     = W * blendedRate
// AI-Native (agents = added parallel capacity; humans billed for actual time; agents on subscription)
agentCap     = agents * agentEquivFte * agentUtil          // FTE-equiv
aiCapacity   = aiHumans + agentCap
aiMonths     = W / (aiCapacity * hoursPerFteMonth)
aiHumanHours = aiHumans * aiMonths * hoursPerFteMonth
aiCost       = aiHumanHours * blendedRate + agentAnnualCost * (aiMonths / 12)
productivity = W / aiHumanHours
```

Inputs come from the Move scope (WBS by the 10 estimate categories: BA, Architecture, Engineering, Testing, Security, Training, Change Mgmt, Deployment, Governance, PM) + a selected delivery pod + geo mix + agent platform. Return both scenarios. Unit-test against the workbook worked example (≈ $1.71M→$0.72M, 18→8 humans, 2.4×) — AI-native MUST be cheaper and not slower.

## Phase WE-3 — Business case bind

**Branch:** `feat/moves-workforce-economics-we3-businesscase`
Wire `src/lib/programs/move-business-case.ts` to consume the estimator: emit Traditional vs AI-Native cost, timeline, team (FTE + agents), productivity, ROI, payback, NPV (discount-rate + horizon inputs). Every figure must trace to a substrate value (rate-card row / assumption / pod). Reuse the grounded-answer contract for the narrative; cite the drivers; refuse to assert numbers not derived from the substrate.

## Phase WE-4 — Roadmap from estimate

**Branch:** `feat/moves-workforce-economics-we4-roadmap`
`src/lib/deliverables/execution-roadmap-tracker.ts`: derive phase/WorkPackage durations from estimated effort ÷ capacity + dependencies + critical path. **No invented durations** — every timeline traceable to the estimate. Both scenarios produce a roadmap; AI-native roadmap reflects the capacity gain.

## Phase WE-5 — Orchestrator + route wiring + live proof

**Branch:** `feat/moves-workforce-economics-we5-wire`

- Register the WE-backed business-case/estimate/roadmap deliverables in `deliverable-registry.ts` and the orchestrator generation-plan.
- Gate behind a tenant flag (e.g. `moves_workforce_economics`), default OFF, following the `moves_orchestrated_deliverables` pattern.
- **Live proof on ACA** (localhost cannot reach the private DB): originate/advance a real Move to P1, flip the flag, generate the business case, and verify at state level that the deliverable shows traditional-vs-AI-native with traceable, substrate-derived numbers (mirror the orchestrated-deliverables live-proof discipline).

## Constraints (do not violate)

1. **Parametric only** — no hardcoded rates/costs in deliverable code; everything from `workforce-economics/assumptions.ts`.
2. **Traceable** — every number maps to a substrate row/assumption; surface the driver.
3. **Estimate-twice always** — every capability gets Traditional AND AI-Native.
4. **Capacity model — no double-count** (WE-2 formula is the contract).
5. **No invented durations** — roadmap from estimate only.
6. **Provider names anonymized** (CONS-T1 etc.); never emit real firm names.
7. **Grounded narrative** — reuse the GroundedAnswer contract; cite or refuse.
8. **One source of truth** — bind to the existing Move business-case/roadmap deliverables; do not stand up a second estimation system.
9. **Release discipline** — `node scripts/release-check.mjs --base origin/main --head HEAD`; lane `global-control-lane` (engine is shared) + `client-data-lane` if any per-tenant substrate; release record per phase.

## QA per phase

- `npx tsc --noEmit` clean · `eslint` clean · `release:check` pass · release record.
- WE-2: unit tests assert the worked-example outputs and that AI-native is cheaper & not slower.
- WE-5: live ACA proof on a real Move; screenshot the generated business case with both scenarios + traceable drivers.

## File reference

```
CREATE: src/lib/workforce-economics/{taxonomy,assumptions,rate-engine,estimation-engine}.ts
MODIFY: src/lib/programs/move-business-case.ts                         [WE-3]
MODIFY: src/lib/deliverables/timeline-resource-estimate.ts            [WE-2/3]
MODIFY: src/lib/deliverables/execution-roadmap-tracker.ts            [WE-4]
MODIFY: src/lib/deliverables/orchestrator/generation-plan.ts         [WE-5]
MODIFY: src/lib/programs/deliverable-registry.ts                      [WE-5]
REUSE : docs/workforce-economics/Workforce_Taxonomy_Master.xlsx + scripts/workforce-economics/build-workforce-taxonomy.py (source of truth, in repo)
```
