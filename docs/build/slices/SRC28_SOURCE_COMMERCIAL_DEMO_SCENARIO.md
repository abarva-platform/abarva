# SRC28 - Source Commercial Demo Scenario Seed

Slice ID: SRC28
Slice name: Source Commercial Demo Scenario Seed
Status: code_complete
Authored: 2026-04-26
Wave: Wave 16 (Source Commercial Route Mount + Demo Scenario)
Primary agent: SRC28 lane agent
Depends on: SRC11, SRC12, SRC13, SRC14, SRC16, SRC18

## Purpose

SRC28 delivers a deterministic, self-contained AMS outsourcing demo scenario
that can be used to demonstrate Source commercial intelligence in boardroom and
investor settings. The scenario represents a large IT outsourcing / vendor
consolidation / AMS sourcing event with four generic vendors, five risks, five
agent missions, and four control-tower signals.

## What Changed

- `src/lib/source/source-commercial-demo-scenario.ts` — pure TypeScript lib
  exporting `DemoVendorPricingStatus`, `DemoRiskSeverity`,
  `DemoReadinessStatus`, `DemoMissionPriority`, `DemoSignalSeverity`,
  `DemoVendorSummary`, `DemoRiskItem`, `DemoMissionItem`, `DemoSignalItem`,
  `SourceCommercialDemoScenario`, and `buildSourceCommercialDemoScenario()`.
- `src/__tests__/integration/source/source-commercial-demo-scenario.test.ts`
  — 12 type-shape tests (no jsdom): scenarioId, vendor count, deterministicSeed
  flag, risk count, risk severity validity, mission count, agentOwner validity,
  signal count, caveats count, generatedAt, vendor label prefix guard, and
  deterministicSeed-not-false guard.
- `docs/build/slices/SRC28_SOURCE_COMMERCIAL_DEMO_SCENARIO.md` — this slice doc.
- Append to `docs/build/build-slices.json`.
- wave-16 entry added to `docs/build/build-waves.json`.
- Source component notes updated in `docs/build/production-readiness.json`.

## Scenario Summary

| Dimension | Value |
|---|---|
| Scenario ID | `ams-outsourcing-demo-2026` |
| Event | Application Management Services — Vendor Consolidation 2026 |
| Vendors | 4 (Alpha, Beta, Gamma, Delta) |
| Risks | 5 (pricing, commercial, transition, governance, evidence) |
| Missions | 5 (Nexus x2, Sentinel, Atlas, Steward) |
| Signals | 4 (critical, warning x2, info) |
| BAFO opportunities | 3 top-level items |
| Readiness state | `partial` |

## Vendor Pricing Coverage

| Vendor | Pricing Status | Missing Sections |
|---|---|---|
| Vendor Alpha | complete | — |
| Vendor Beta | partial | L3 support rate card, Knowledge transfer costs |
| Vendor Gamma | partial | Transition management costs |
| Vendor Delta | missing | Full rate card, SLA commercial framework, Rebate structure |

## Validation

```bash
node_modules/.bin/tsc --noEmit
node_modules/.bin/jest src/__tests__/integration/source/source-commercial-demo-scenario.test.ts --no-coverage
```

Both pass: 0 TypeScript errors, 12 tests green.

## What This Slice Does NOT Do

- Does not use real vendor names or proprietary information.
- Does not include real market pricing benchmarks or commercial rates.
- Does not call any model provider or make network requests.
- Does not write to any database.
- Does not include React components (pure TypeScript lib only).
- Does not modify auth, migrations, or runtime configuration.
- Does not modify any existing Source lib files.
