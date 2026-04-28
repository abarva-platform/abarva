# QA33 Intelligence Deterministic Journey Manifest

Date: 2026-04-28
Branch: `qa/intelligence-deterministic-journey`
Scope: QA/read-model manifest only

## Objective

Record the deterministic Intelligence journey that already exists across route files and component contracts without claiming browser smoke, live Sentinel runtime, live retrieval, model invocation, migrations, or API execution.

## Coverage

| Coverage area | Deterministic proof |
|---|---|
| Landing route | `/tenant/apex-retail/intelligence` via `IntelligenceRouteShell` and `IntelligenceLensTabs`. |
| Pattern detail route | `/tenant/apex-retail/intelligence/patterns/[patternKey]` via `SentinelPatternDetail` and `IntelligenceCanvasModeTabs`. |
| Canvas modes | `summary`, `evidence`, `programs`, `actions`. |
| Detail depth | Provenance ribbon, source basis panel, evidence dataset drawer, Sentinel interaction rail. |

## Boundary

This slice does not run Playwright, authenticate, navigate a browser, create migrations, call Supabase, call model SDKs, or change UI. It only adds a deterministic QA manifest and tests that the existing route/component contract is present on disk.

## QA

```bash
npx jest src/__tests__/integration/qa/intelligence-deterministic-journey.test.ts --runInBand
npx jest src/__tests__/integration/intelligence/intelligence-canvas-modes.test.ts src/__tests__/integration/intelligence/sentinel-pattern-detail.test.ts src/__tests__/integration/intelligence/source-basis.test.ts src/__tests__/integration/intelligence/sentinel-interaction-rail.test.ts --runInBand
npx eslint --max-warnings=0 src/lib/qa/intelligence-deterministic-journey.ts src/__tests__/integration/qa/intelligence-deterministic-journey.test.ts
output=$(npx tsc --noEmit --pretty false 2>&1); filtered=$(printf '%s\n' "$output" | grep -v '\.next/types/validator.ts' || true); if [ -n "$filtered" ]; then printf '%s\n' "$filtered"; exit 1; fi
git diff --check
```
