# QA29 — Intelligence / Tower Blueprint Verification

**Wave:** wave-21
**Lane:** K
**Status:** code_complete
**Created:** 2026-04-26

---

## Purpose

QA29 provides a deterministic filesystem verification pass over all Intelligence
and Control Tower surface contracts: page blueprints, route files, shell
components, view-model libraries, and supporting manifest entries.

It runs now (pre-integration) with graceful deferrals for INTEL1-3 and TOWER1-3
components not yet present on this branch, and will fully pass once those slices
are integrated.

---

## Checks Inventory

| Check ID | Surface | Description | Expected Status |
|---|---|---|---|
| INTEL-BP-01 | intelligence | Intelligence page blueprint exists | pass |
| TOWER-BP-01 | tower | Control Tower page blueprint exists | pass |
| INTEL-ROUTE-01 | intelligence | Intelligence route page.tsx exists | pass |
| TOWER-ROUTE-01 | tower | Tower route page.tsx exists | pass |
| INTEL1-SHELL-01 | intelligence | IntelligenceRouteShell.tsx exists | pass (deferred pre-INTEL1) |
| TOWER1-SHELL-01 | tower | TowerRouteShell.tsx exists | pass (deferred pre-TOWER1) |
| INTEL2-CANVAS-01 | intelligence | Intelligence workflow canvas view exists | deferred (INTEL2) |
| INTEL3-EVID-01 | intelligence | Sentinel evidence brief view exists | deferred (INTEL3) |
| TOWER2-CANVAS-01 | tower | Atlas executive brief canvas exists | deferred (TOWER2) |
| TOWER3-LENS-01 | tower | Control Tower active lens view exists | deferred (TOWER3) |
| INTEL1-CAVEAT-01 | intelligence | IntelligenceRouteShell contains Deterministic caveat | pass (deferred pre-INTEL1) |
| TOWER1-CAVEAT-01 | tower | TowerRouteShell contains Deterministic caveat | pass (deferred pre-TOWER1) |
| SHARED-AGENTX-01 | shared | AGENTX enforcement review doc exists | pass |
| SHARED-SLICES-01 | shared | build-slices.json is valid JSON | pass |
| SHARED-SLICES-02 | shared | INTEL1/INTEL2/INTEL3 in build-slices.json | deferred (pre-integration) |

---

## Pre-integration Deferred Items

The following items are expected to be deferred before INTEL/TOWER slice
integration and will resolve to `pass` after their respective slices merge:

- **INTEL2** — `src/lib/intelligence/intelligence-workflow-canvas-view.ts`
- **INTEL3** — `src/lib/intelligence/sentinel-brief-evidence-view.ts`
- **TOWER2** — `src/lib/tower/atlas-executive-brief-canvas.ts`
- **TOWER3** — `src/lib/tower/control-tower-active-lens-view.ts`
- **SHARED-SLICES-02** — INTEL1/INTEL2/INTEL3 slice entries in build-slices.json

INTEL1 (IntelligenceRouteShell) and TOWER1 (TowerRouteShell) already exist on
this branch via the SHELL7 wave-20 slice. Their checks pass now.

---

## Files Delivered

- `src/lib/qa/intelligence-tower-blueprint-verification.ts` — 15-check
  deterministic verification library
- `src/__tests__/integration/qa/intelligence-tower-blueprint-verification.test.ts`
  — Jest test suite (27 assertions)
- `docs/build/INTELLIGENCE_TOWER_BLUEPRINT_VERIFICATION.md` — this document
- `docs/build/slices/QA29_INTELLIGENCE_TOWER_BLUEPRINT_VERIFICATION.md` — slice
  contract
- Manifest updates: `build-slices.json`, `production-readiness.json`,
  `build-waves.json`

---

## Invariants

- No application code changes
- No migrations
- No model calls
- No network calls
- No `Date.now` / `Math.random` / `new Date` references
- No production readiness promotion
- `deterministicSeed: true` on every check and the report root

---

## Validation Commands

```bash
# TypeScript
npx tsc --noEmit --pretty false 2>&1 | head -20

# Tests
npx jest src/__tests__/integration/qa/intelligence-tower-blueprint-verification.test.ts --no-coverage

# ESLint
npx eslint --max-warnings=0 \
  src/lib/qa/intelligence-tower-blueprint-verification.ts \
  src/__tests__/integration/qa/intelligence-tower-blueprint-verification.test.ts
```
