# E2E Smoke Result Capture Protocol

**Protocol ID:** QA19-E2E-SMOKE-RESULT-CAPTURE-v1  
**Schema Version:** 1  
**Date:** 2026-04-26  
**Status:** Active

---

## Overview

This protocol defines how to capture, structure, and communicate end-to-end smoke test results for the AbarVa / Nexus platform. The capture model is a TypeScript read model — no browser automation, no screenshots, no network calls are performed by the model itself.

The canonical implementation is `src/lib/qa/e2e-smoke-result-capture.ts`.

---

## Schema

### `SmokeResultCapture` (root)

| Field | Type | Description |
|-------|------|-------------|
| `schemaVersion` | `number` | Must be `1` |
| `generatedAt` | `string` | ISO date string (e.g. `2026-04-26`) |
| `protocol` | `string` | Must be `QA19-E2E-SMOKE-RESULT-CAPTURE-v1` |
| `runs` | `SmokeTestRun[]` | One or more test run records |

### `SmokeTestRun`

| Field | Type | Description |
|-------|------|-------------|
| `runId` | `string` | Unique identifier for this run (e.g. `QA19-RUN-001`) |
| `runDate` | `string` | Date of the run (ISO date string) |
| `isLiveRun` | `boolean` | `false` for fixture/read-model runs; `true` for real browser runs |
| `environment` | `'local-seed' \| 'vercel-preview' \| 'production'` | Execution environment |
| `routeResults` | `RouteResult[]` | One entry per route tested |
| `personaResults` | `PersonaResult[]` | Aggregated per-persona summary |
| `totalRoutes` | `number` | Must equal `routeResults.length` |
| `passedRoutes` | `number` | Count of routes with `status: 'pass'` |
| `failedRoutes` | `number` | Count of routes with `status: 'fail'` |
| `deferredRoutes` | `number` | Count of routes with `status: 'deferred'` |
| `blockedRoutes` | `number` | Count of routes with `status: 'blocked'` |
| `overallStatus` | `SmokeResultStatus` | Rollup status for the run |
| `readinessSummary` | `string` | Human-readable summary |
| `nextActions` | `string[]` | Ordered list of next validation steps |

### `RouteResult`

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique route result ID (e.g. `QA19-R01`) |
| `route` | `string` | Path of the route (e.g. `/home`) |
| `persona` | `'admin' \| 'client' \| 'investor' \| 'guest'` | Persona used for the test |
| `status` | `SmokeResultStatus` | Result status |
| `httpStatus` | `number \| null` | HTTP response code, or `null` if not captured |
| `componentRendered` | `boolean \| null` | Whether the primary component rendered |
| `screenshotRef` | `string \| null` | Reference to a screenshot artifact; always `null` in file-pure mode |
| `blocker` | `string \| null` | Description of the blocker if status is `blocked` |
| `notes` | `string` | Freeform notes |
| `readinessImpact` | `ReadinessImpact` | Impact classification on production readiness |
| `nextValidationAction` | `string` | The next validation step for this route |

### `PersonaResult`

| Field | Type | Description |
|-------|------|-------------|
| `persona` | `string` | Persona name |
| `routesTested` | `number` | Total routes tested for this persona |
| `passed` | `number` | Routes with `status: 'pass'` |
| `failed` | `number` | Routes with `status: 'fail'` |
| `deferred` | `number` | Routes with `status: 'deferred'` |
| `blockers` | `string[]` | Blocker strings collected from failed/blocked routes |

---

## Status Vocabulary

### `SmokeResultStatus`

| Value | Meaning |
|-------|---------|
| `pass` | Route loaded, component rendered, no errors |
| `fail` | Route returned an error or component did not render |
| `deferred` | Route not tested; deferred to a later run |
| `not_run` | Route was in scope but was not executed |
| `blocked` | Route cannot be tested until a blocker is resolved |

### `ReadinessImpact`

| Value | Meaning |
|-------|---------|
| `none` | No production readiness impact; route passes cleanly |
| `minor` | Low-severity issue; does not block demo or launch |
| `significant` | Medium-severity issue; affects demo quality |
| `critical` | Blocker; must be resolved before launch |

---

## Using `buildSmokeResultFixture` as a Baseline

The exported `buildSmokeResultFixture()` function returns a deterministic, file-pure capture covering 12 canonical platform routes. It serves as:

1. **Baseline for regression detection** — future live captures should include at least these 12 routes.
2. **Test fixture** — the Jest suite in `src/__tests__/integration/qa/e2e-smoke-result-capture.test.ts` uses it to lock the schema shape.
3. **Documentation** — the fixture's `notes` and `nextValidationAction` fields describe what live verification requires.

The fixture always sets `isLiveRun: false` and `screenshotRef: null`. It is not a substitute for a live run.

---

## Recording a Live Run

A live run is executed by a human operator or a browser automation harness. The result capture module does **not** perform any browser automation, network calls, or screenshot capture. To record a live run:

1. Execute the smoke test suite against the target environment (local, Vercel preview, or production).
2. For each route in `routeResults`:
   - Record the actual HTTP status code in `httpStatus`.
   - Set `componentRendered` to `true` or `false` based on visual inspection.
   - Set `status` to the appropriate `SmokeResultStatus` value.
   - Fill `blocker` if the route is blocked or failing.
   - Add notes describing what was observed.
3. Set `isLiveRun: true`.
4. Set `environment` to `'vercel-preview'` or `'production'` as appropriate.
5. Set `runDate` to the ISO date string of the run.
6. Compute `passedRoutes`, `failedRoutes`, `deferredRoutes`, `blockedRoutes` from `routeResults`.
7. Determine `overallStatus`: use `'pass'` only if all routes pass; use `'fail'` if any route fails; use `'blocked'` if any route is blocked.
8. Call `validateSmokeResultCapture(capture)` and resolve all returned errors before publishing.

---

## Screenshot Reference Placeholder Convention

The `screenshotRef` field is reserved for future use. In file-pure mode (all fixture and deterministic runs), it is always `null`. When screenshot evidence is captured:

- Set `screenshotRef` to a relative path or artifact URL (e.g. `screenshots/QA19-R01-home-admin-2026-04-26.png`).
- Store screenshots outside the repository or in a dedicated `reports/screenshots/` directory.
- Never embed screenshot data in the JSON capture directly.

---

## Readiness Impact Classification Guide

Use these guidelines when classifying `readinessImpact` for each route result:

| Impact | When to use |
|--------|-------------|
| `none` | Route loads cleanly; all key components render; no user-visible errors |
| `minor` | Non-critical UI element missing; edge case not covered; does not affect demo flow |
| `significant` | A key demo route is degraded; partial render; affects investor or client demo quality |
| `critical` | Core route is down; auth fails; data is missing; blocks boardroom demo |

When in doubt, classify conservatively (higher impact).

---

## Integration with OPS13 Final Report Standard

This capture model is designed to feed the OPS13 final report. When OPS13 is implemented:

1. The `SmokeResultCapture` JSON is consumed by the OPS13 report builder.
2. `readinessSummary` and `nextActions` from each run are surfaced in the executive summary section.
3. `personaResults` map to the per-persona readiness section of the OPS13 report.
4. Routes with `readinessImpact: 'critical'` or `'significant'` are flagged as blockers in the OPS13 report.
5. `overallStatus` drives the top-level readiness badge in the OPS13 report.

The `protocol` field (`QA19-E2E-SMOKE-RESULT-CAPTURE-v1`) is the canonical reference for OPS13 to identify and validate the capture format.

---

## Non-Goals

This protocol does NOT:

- Execute browser automation or Playwright scripts
- Capture real screenshots
- Make network calls to the platform
- Modify the database or any live system
- Replace the OPS13 final report; it feeds into it

---

## Related Slices

- **QA18** — E2E Persona Walk Results (`src/lib/qa/persona-walk-results.ts`)
- **QA5** — Route Smoke Inventory (`src/lib/qa/route-smoke-inventory.ts`)
- **PROD3/PROD4** — Production readiness live-refresh API
- **OPS13** — Final report standard (deferred)
