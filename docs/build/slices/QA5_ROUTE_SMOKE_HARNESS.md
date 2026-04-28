# QA5 - Route Smoke Inventory (Static, Deterministic)

Slice ID: QA5
Slice name: Route Smoke Inventory (Static, Deterministic)
Status: code_complete
Authored: 2026-04-25
Primary agent: Lane G (parallel build pack)
Depends on: PROD2

## Purpose

QA5 lands a deterministic, file-pure catalog of the canonical routes
that a future route-smoke harness must cover. The catalog records,
for each route pattern, the owner surface, primary agent, expected
guard, expected read-model contract, smoke priority, current
implementation status, the test strategy that would apply once
execution is wired, and any known gaps that block automation today.

QA5 is the read-only inventory companion to PROD2's production
readiness validator. PROD2 owns manifest discipline; QA5 owns the
canonical list of route smoke targets and the strategy taxonomy.

QA5 does NOT execute any smoke run. Browser automation, real HTTP
fixture fetches, and a persona crawler are explicitly deferred. The
PROD2 manifest's `validation_qa.testingGates.route_smoke` entry is
left at its existing status; QA5 only appends a note acknowledging
that the inventory now exists.

## What Changed

- New module
  [src/lib/qa/route-smoke-inventory.ts](../../../src/lib/qa/route-smoke-inventory.ts):
  - Public types: `RouteSmokePriority`, `RouteSmokeOwnerSurface`,
    `RouteSmokePrimaryAgent`, `RouteSmokeImplementationStatus`,
    `RouteSmokeTestStrategy`, `RouteSmokeExpectedGuard`,
    `RouteSmokeTarget`, `RouteSmokeSummary`.
  - Public constants: `ROUTE_SMOKE_PRIORITY` (canonical, ordered).
  - Public helpers: `listRouteSmokeTargets`,
    `summarizeRouteSmokeTargets`, `getHighPrioritySmokeTargets`,
    `getRouteSmokeByOwnerSurface`.
  - No imports from `@/lib/source`, `@/lib/nexus`,
    `@/lib/sentinel`, `@/lib/atlas`, `@/lib/agent`, `@/lib/auth`,
    or supabase.
  - No `Date.now`, `Math.random`, `new Date(`, `fetch(`, anthropic,
    openai, useState, useEffect, "Coming soon", "TBD", or
    "Lorem ipsum".
  - No browser-automation imports.

- Eleven canonical route smoke targets, in canonical order:
  1. `/home` - owner `home`, agent `platform`, guard `public`,
     read model `src/components/home/AgenticHomeEntry.tsx`,
     priority `critical`, implemented `exists`,
     strategy `static_snapshot`, gaps none.
  2. `/platform/admin` - owner `admin`, agent `steward`,
     guard `platform_admin`, read model
     `src/components/admin/StewardSetupControlCenter.tsx`,
     priority `critical`, implemented `exists`,
     strategy `static_snapshot`, gaps none.
  3. `/platform/admin/build-progress` - owner `admin`,
     agent `steward`, guard `platform_admin`,
     read model `src/lib/admin/build-progress`,
     priority `high`, implemented `exists`,
     strategy `read_model_unit`, gaps none.
  4. `/platform/admin/production-readiness` - owner `admin`,
     agent `steward`, guard `platform_admin`,
     read model `src/lib/admin/production-readiness.ts`,
     priority `critical`, implemented `exists`,
     strategy `read_model_unit`, gaps none.
  5. `/tenant/[tenantSlug]/programs` - owner `programs`,
     agent `nexus`, guard `tenant_scoped`,
     read model `src/lib/programs/programs-canonical-view.ts`,
     priority `critical`, implemented `exists`,
     strategy `read_model_unit`, gaps none.
  6. `/tenant/[tenantSlug]/programs/[programSlug]` - owner `programs`,
     agent `nexus`, guard `tenant_scoped`,
     read model `src/components/programs/ProgramCanonicalDetail.tsx`,
     priority `critical`, implemented `exists`,
     strategy `read_model_unit`, gaps none.
  7. `/tenant/[tenantSlug]/tower` - owner `tower`, agent `atlas`,
     guard `tenant_scoped`,
     read model `src/components/tower/ProgramPressureCards.tsx`,
     priority `critical`, implemented `exists`,
     strategy `read_model_unit`, gaps none.
  8. `/tenant/[tenantSlug]/intelligence` - owner `intelligence`,
     agent `sentinel`, guard `tenant_scoped`,
     read model `src/components/intelligence/SentinelActivePatterns.tsx`,
     priority `critical`, implemented `exists`,
     strategy `read_model_unit`, gaps none.
  9. `/tenant/[tenantSlug]/intelligence/patterns/[patternKey]` -
     owner `intelligence`, agent `sentinel`, guard `tenant_scoped`,
     read model `src/lib/intelligence/sentinel-pattern-detections.ts`,
     priority `high`, implemented `exists`,
     strategy `read_model_unit`, gaps none.
  10. `/source` - owner `source`, agent `platform`,
      guard `authenticated`, read model `src/lib/source/`,
      priority `medium`, implemented `partial`,
      strategy `manual_only`, gaps `["smoke harness not yet automated"]`.
  11. `/source/events` - owner `source`, agent `platform`,
      guard `authenticated`, read model `src/lib/source/events`,
      priority `medium`, implemented `partial`,
      strategy `manual_only`, gaps none.

- New tests
  [src/__tests__/integration/qa/route-smoke-inventory.test.ts](../../../src/__tests__/integration/qa/route-smoke-inventory.test.ts):
  - Asserts the canonical priority tuple and the eleven canonical
    route patterns in canonical order.
  - Asserts the four required critical-priority routes are present
    and tagged `critical`: `/home`, `/platform/admin`,
    `/platform/admin/production-readiness`,
    `/tenant/[tenantSlug]/programs`.
  - Asserts the production-readiness route is present and points at
    `src/lib/admin/production-readiness.ts`.
  - Asserts every target has non-empty `expectedReadModel`,
    `ownerSurface`, `primaryAgent`, `expectedGuard`,
    `smokePriority`, `currentlyImplemented`, and `testStrategy`
    fields, and that each enum value is in its canonical set.
  - Asserts `getHighPrioritySmokeTargets` returns only targets
    whose priority is `critical` or `high`.
  - Asserts `getRouteSmokeByOwnerSurface('source')` returns
    exactly two targets (`/source` and `/source/events`).
  - Asserts `summarizeRouteSmokeTargets` reconciles totals across
    every breakdown axis (priority, owner surface, primary agent,
    implementation status).
  - Asserts the inventory is byte-equal across calls (deterministic).
  - Asserts module hygiene: no browser-automation imports
    (`playwright`, `puppeteer`, `cypress`), no `fetch(` call form,
    no `Date.now`, `Math.random`, `new Date(`, `useState`,
    `useEffect`, `anthropic`, `openai`, supabase, no banned
    placeholder strings (`Coming soon`, `TBD`, `Lorem ipsum`), and
    no imports from `@/lib/source|nexus|sentinel|atlas|agent|auth`.

- Build slice manifest update
  [docs/build/build-slices.json](../build-slices.json) appends the
  QA5 entry with status `code_complete`, risk `low`,
  `dependsOn: ['PROD2']`, the five-file allowlist, the standard
  forbidden-files list, and bumps `lastUpdated`.

- Production readiness manifest update
  [docs/build/production-readiness.json](../production-readiness.json):
  - `validation_qa.notes` appends a line acknowledging that QA5
    adds a deterministic route smoke inventory of eleven canonical
    targets, with execution still deferred (no browser, no automation).
  - `validation_qa.testingGates.route_smoke.evidence` is updated to
    acknowledge the inventory exists. The gate's `status` is
    deliberately preserved (still `partial`, NOT promoted) because
    execution is not wired.
  - No component is promoted. `overallStatus`,
    `overallReadinessPercent`, and component statuses are unchanged.
  - `lastUpdated` is bumped to the slice authorship date.

## Test Strategy Taxonomy

Five strategies are recognized today, and the inventory tags every
route with exactly one. The strategy is the recommended approach
for the future smoke harness; QA5 does not implement any of them.

- `static_snapshot` - the route renders a deterministic
  read-only surface that can be exercised by a snapshot test
  against the underlying component. Used for `/home` and
  `/platform/admin` today.

- `read_model_unit` - the route is backed by a deterministic read
  model (file path or named contract) that can be unit-tested
  without rendering. Used for the admin tracker, programs canonical
  view, programs detail, tower pressure cards, intelligence active
  patterns, and the intelligence pattern detail. This is the
  preferred strategy when read-model coverage already exists.

- `persona_walk` - the route is part of a multi-step founder /
  operator / tenant journey that must be walked top-to-bottom
  before promotion. No QA5 target uses this strategy today; it is
  reserved for the future persona crawler.

- `fixture_fetch_when_implemented` - the route would be exercised
  by a fixture-backed HTTP fetch only after a future slice wires
  real fixture data and a deterministic in-process server boot.
  Reserved; no QA5 target uses this strategy today.

- `manual_only` - the route is currently verified by hand only.
  Used for `/source` and `/source/events`, which are partial.

## What Is Explicitly Out Of Scope

- QA5 does not execute any HTTP request, does not start a server,
  does not open a browser, and does not use Playwright, Puppeteer,
  or Cypress.
- QA5 does not promote any production-readiness component or gate.
  `validation_qa` remains `tested`. The `route_smoke` gate stays at
  its prior status; QA5 only updates that gate's evidence string.
- QA5 does not author the future fixture / persona crawler. Those
  are deferred to later slices.
- QA5 does not modify auth, supabase, migrations, Nexus, Sentinel,
  Atlas, agent runtime, or source product code.
- QA5 does not import any model provider, does not call the Model
  Gateway, and does not write any audit-ledger entry.

## Why It Is Safe

- The inventory module is a frozen seed. Every target is built
  from `Object.freeze`'d literals; the public list is itself
  frozen. The module performs no I/O, no network calls, no clock
  reads, and no random calls.
- The helpers (`listRouteSmokeTargets`,
  `summarizeRouteSmokeTargets`, `getHighPrioritySmokeTargets`,
  `getRouteSmokeByOwnerSurface`) are pure functions over the seed.
- The integration test asserts byte-equality across calls and
  module hygiene against banned imports and APIs, locking in the
  determinism contract.
- The manifest update is append-only at the note level and does
  not change any component status, dimension, gate status, or
  overall readiness percent.

## How To Re-Run

1. Run TypeScript:
   `npx tsc --noEmit --pretty false`
2. Run the QA5 jest suite:
   `npx jest src/__tests__/integration/qa/route-smoke-inventory.test.ts`
3. Run the production build:
   `npm run build`
4. Re-parse manifest and slice JSON files:
   `python3 -c "import json; json.load(open('docs/build/build-slices.json')); json.load(open('docs/build/production-readiness.json'))"`

## Readiness Impact

- Tracker updated: yes.
- Components changed: `validation_qa`.
- Readiness/status changes: none. `validation_qa` stays `tested`.
  `route_smoke` gate stays at its prior status; only the evidence
  string is updated to acknowledge that the inventory exists.
- Blockers added or removed: none.
- `nextAction` updated: no.
- Notes added: one line on `validation_qa` recording the QA5
  inventory landing and that execution is still deferred.
