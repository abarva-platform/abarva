# Slice Contract: DEMO2 — Founder Demo Route Checklist

| Field              | Value |
|--------------------|-------|
| **Slice ID**       | DEMO2 |
| **Name**           | Founder Demo Route Checklist |
| **Category**       | demo |
| **Validation Status** | code_complete |
| **Risk**           | low |
| **Date**           | 2026-04-26 |
| **Wave**           | wave-11 (Demo Readiness + Architecture Overview) |

---

## Goal

Produce a deterministic, founder-facing checklist of the eleven canonical
platform routes that should be walked during a boardroom or seed-round
demo of the AbarVa platform. The checklist documents, for each route:
its purpose, primary agent, a scripted talking point, the expected
component, an honest readiness caveat, and a fallback strategy for demo
day.

No model calls. No runtime calls. No database reads. No HTTP requests.
Pure TypeScript with a companion Jest suite and a markdown operator doc.

---

## Files Created

### Source

- `src/lib/qa/founder-demo-route-checklist.ts`
  Pure TypeScript module. Exports `DemoRoute`, `FounderDemoRouteChecklist`,
  and `buildFounderDemoRouteChecklist()`. Hardcodes all eleven route records
  and derives readiness bucket counts deterministically at call time.
  No imports other than standard TypeScript types.

### Tests

- `src/__tests__/integration/qa/founder-demo-route-checklist.test.ts`
  Jest integration suite. Asserts: all 11 expected route strings present,
  every route has non-empty purpose / primaryAgent / demoTalkingPoint /
  expectedComponent / readinessCaveat / fallbackIfBlocked, every
  validationStatus is one of the four canonical values, totalRoutes equals
  routes.length, bucket totals sum to totalRoutes, generatedAt is
  '2026-04-26', determinism across calls, and module hygiene (no browser
  automation, no fetch, no Date.now / Math.random / new Date, no model
  providers, no React hooks, no 'use client', no placeholder language).

### Documentation

- `docs/demo/ABARVA_FOUNDER_DEMO_ROUTE_CHECKLIST.md`
  Founder-facing operator checklist. Route-by-route tables with all fields
  rendered. Includes demo-day preparation notes on boot order, fallback
  stack, honest framing, seed data anchor, and agent narrative.

- `docs/build/slices/DEMO2_FOUNDER_DEMO_ROUTE_CHECKLIST.md`
  This file. Slice contract doc.

---

## Routes Covered

| Route | Primary Agent | Validation Status |
|-------|---------------|-------------------|
| `/home` | Nexus | ready |
| `/platform/admin` | Steward | ready |
| `/platform/admin/production-readiness` | Steward | ready |
| `/platform/admin/build-progress` | Steward | ready |
| `/tenant/apex-retail/programs` | Nexus | ready |
| `/tenant/apex-retail/programs/[programSlug]` | Nexus | partial |
| `/tenant/apex-retail/tower` | Atlas | ready |
| `/tenant/apex-retail/intelligence` | Sentinel | ready |
| `/tenant/apex-retail/intelligence/patterns/[patternKey]` | Sentinel | partial |
| `/source` | Steward | partial |
| `/source/events` | Steward | partial |

**Ready: 6 / Partial: 5 / Deferred: 0 / Blocked: 0**

---

## JSON Updates

### docs/build/build-slices.json
DEMO2 entry appended to the slices array.

### docs/build/production-readiness.json
Note appended to `validation_qa.notes`:
"DEMO2: Founder demo route checklist created; 11 routes documented with
talk tracks, readiness caveats, and fallbacks."

### docs/build/build-waves.json
wave-11 (Demo Readiness + Architecture Overview) appended to the waves
array with DEMO2 in completedSlices and status in_progress.

---

## Validation Commands

```bash
cd /Users/anand/Projects/nexus-demo-demo2
npx tsc --noEmit --pretty false 2>&1 | tail -10
npx jest src/__tests__/integration/qa/founder-demo-route-checklist.test.ts --no-coverage 2>&1 | tail -20
npm run build 2>&1 | tail -10
```

---

## Deferred

- Live route smoke execution (no browser, no Playwright, no real HTTP).
- Persona-walk automation against the production domain.
- CI gate integration.
- Dynamic content from live model inference or database reads.
