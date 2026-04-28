# Wave T0 Plan · Audit & Spec

**Status:** shipped
**Date:** 2026-04-28
**Branch:** No branch (docs-only wave)

---

## Scope

Per `TOWER_DESIGN_SPEC.md` §13: "Per-module spec authored; gap analysis vs current components in `src/components/tower/`"

This wave produces no code changes. It delivers:
1. `docs/build/TOWER_DESIGN_SPEC.md` — copied from founder's Downloads
2. `docs/build/SOURCE_BUILD_SPEC.md` — copied from founder's Downloads
3. `docs/build/ORCHESTRATION_SPEC.md` — authored per kickoff prompt §11 + §13
4. `docs/build/WAVE_ROADMAP.md` — T0–T7 from §13 with dependency graph
5. `docs/build/JOURNAL.md` — initialized
6. `docs/build/CLAIMS.md` — initialized
7. This file (`WAVE-T0-PLAN.md`) — audit + gap analysis

---

## Gap analysis: existing vs spec

### Existing tower: 19 components, 24 lib files, 16 routes

**What exists:**
- `/tower` → `TowerIndexPage` — pressure grid (3 cards) + activity strip
- `/tower/pressures/[pressureId]` → `PressureDetailPage` — driver decomposition
- `/tower/programs/[programId]` → `ProgramScopePage` — program scope/metrics
- `/tower/outcomes` → `OutcomePage` — outcome tracking list
- `/tower/lens/adoption` → `AdoptionLensPage`
- `/tower/lens/risk` → `RiskLensPage`
- `/tower/lens/value` → TowerLensTabs-based value lens
- `/tower/activity` → `ActivityPage` — cross-program activity stream
- `/tower/onboard` + `/tower/onboard/[dimension]` — onboarding flow (partial)
- `VendorPortfolioSurface.tsx` — vendor view (not routed as top-level)

**Agent mismatch:** Current code uses `Atlas` (Sonnet, 150-word cap). New spec requires `Nexus` (Opus, maestro, portfolio strategist).

### Spec pages → component mapping

| Spec ID | Route | Existing component | Match level |
|---|---|---|---|
| TWR-IDX-PORTFOLIO | `/tower` | `TowerIndexPage.tsx` | PARTIAL — missing KPI band, AI program table |
| TWR-IDX-LENSES | `/tower/lens/*` | `TowerLensTabs.tsx` | PARTIAL — 3 of 4 lenses; missing COST |
| TWR-IDX-DECISIONS | `/tower/activity` | `ActivityPage.tsx` | PARTIAL — activity not decision-typed |
| TWR-DTL-PROGRAM | `/tower/programs/[id]` | `ProgramScopePage.tsx` | PARTIAL — missing value model panel |
| TWR-DTL-PRESSURE | `/tower/pressures/[id]` | `PressureDetailPage.tsx` | CLOSE — add $ impact + P-type badges |
| TWR-DTL-VENDOR | none (VendorPortfolioSurface) | `VendorPortfolioSurface.tsx` | PARTIAL — not routed, missing renewal calendar |
| TWR-DTL-OUTCOME | `/tower/outcomes` | `OutcomePage.tsx` | PARTIAL — missing baseline + confidence haircut |
| TWR-DTL-DECISION | none | none | MISSING — net-new |
| TWR-FLW-ONBOARD | `/tower/onboard` | onboard routes | PARTIAL — needs value model step |
| TWR-FLW-REALLOCATE | none | none | MISSING — net-new |
| TWR-FLW-RENEWAL | none | none | MISSING — net-new |
| TWR-EMP-NO-PROGRAMS | inline in TowerIndexPage | inline `EmptyState` | CLOSE — needs dedicated route |
| TWR-ERR-PROGRAM-NOT-FOUND | none | none | MISSING — needs not-found handler |

### Data model gaps

**`ai-portfolio-inventory.ts`** tracks generic use cases by lifecycle stage.
**New spec needs** vendor-anchored AI programs (M365 Copilot, Claude Code, Now Assist, SAP Joule) with:
- `annualSpend`, `valueCaptures`, `roi`, `programType` (T-CODE/T-PROD/T-SVC/T-ERP/T-FOW)
- `adoptionPct`, `eligibleUsers`, `activeUsers`
- Typed pressures per program (P-COST, P-ADOPT, P-VALUE, P-DUPL, etc.)
- Value model formula fields per program type
- Confidence levels (high/medium/low) for attribution

**Resolution:** Create `src/lib/tower/ai-program-portfolio-fixture.ts` alongside existing inventory (don't replace it).

---

## Wave plans T1–T7

### T1 · Shell + index foundations

**Branch:** `tower/wave-T1/portfolio-index`
**Delivers:** TWR-IDX-PORTFOLIO (skeleton — KPI band + AI program table, no bubble chart)
**Files:**
- `src/lib/tower/ai-program-portfolio-fixture.ts` — NEW: vendor-anchored program data
- `src/components/tower/TowerIndexPage.tsx` — UPDATE: KPI band + program table + Nexus voice

### T2 · Bubble chart + lenses

**Branch:** `tower/wave-T2/bubble-chart-lenses`
**Delivers:** TWR-IDX-PORTFOLIO (full with bubble chart), TWR-IDX-LENSES (4-tab lenses)
**Files:**
- `TowerIndexPage.tsx` — add bubble chart section
- `TowerLensTabs.tsx` — add COST lens
- New COST lens page

### T3 · Program detail

**Branch:** `tower/wave-T3/program-detail`
**Delivers:** TWR-DTL-PROGRAM
**Files:**
- `ProgramScopePage.tsx` — UPDATE: value model panel, vendor anchoring, adoption panel

### T4 · Pressure system + decisions log

**Branch:** `tower/wave-T4/pressure-decisions`
**Delivers:** TWR-DTL-PRESSURE (enhanced), TWR-IDX-DECISIONS
**Files:**
- `PressureDetailPage.tsx` — UPDATE: typed pressures, $ impact, recommended actions
- `ActivityPage.tsx` — CONVERT to decisions log with filters

### T5 · Vendor, outcome, decision detail

**Branch:** `tower/wave-T5/vendor-outcome-decision`
**Delivers:** TWR-DTL-VENDOR, TWR-DTL-OUTCOME, TWR-DTL-DECISION
**Files:**
- New route: `/tower/vendors/[vendorId]/page.tsx`
- `OutcomePage.tsx` — UPDATE: baseline + confidence haircut
- New route: `/tower/decisions/[decisionId]/page.tsx`

### T6 · Workspaces

**Branch:** `tower/wave-T6/workspaces`
**Delivers:** TWR-FLW-ONBOARD (enhanced), TWR-FLW-REALLOCATE (new), TWR-FLW-RENEWAL (new)
**Files:** Net-new components + routes for all three flows

### T7 · States + polish

**Branch:** `tower/wave-T7/states-polish`
**Delivers:** TWR-EMP-NO-PROGRAMS, TWR-ERR-PROGRAM-NOT-FOUND
**Files:** Empty state route + not-found handler
