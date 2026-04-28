# QA23: Source Commercial Route Smoke Verification

**Wave:** wave-16
**Type:** qa
**Status:** code_complete
**Branch:** wave16/qa23-source-commercial-route-smoke

## Purpose

Manifest-driven smoke verification for the Wave-16 Source commercial route. Provides a static always-passing test suite for CI lane isolation and graceful integration-phase file checks that activate when all SRC27–SRC30 lanes are cherry-picked.

## Files

- `src/lib/qa/source-commercial-route-smoke.ts` — Pure TypeScript manifest: `WAVE16_ROUTE_DESCRIPTORS` (3 routes), `WAVE16_COMPONENT_DESCRIPTORS` (3 new components), `WAVE16_LIB_DESCRIPTORS` (3 new libs), and `buildWave16RouteSmokeReport()`.
- `src/__tests__/integration/qa/source-commercial-route-smoke.test.ts` — 22 tests across 3 suites.
- `docs/build/SOURCE_COMMERCIAL_ROUTE_SMOKE_RUNBOOK.md` — Operator runbook.

## Wave-16 Inventory Verified

| Lane | Artifact | Path |
|------|----------|------|
| SRC27 | Component | `src/components/source/SourceCommercialEventSection.tsx` |
| SRC27 | Page mod | `src/app/(maestro)/source/events/[eventId]/page.tsx` |
| SRC28 | Lib | `src/lib/source/source-commercial-demo-scenario.ts` |
| SRC29 | Component | `src/components/source/SourceCommercialExecutiveBrief.tsx` |
| SRC29 | Lib | `src/lib/source/source-commercial-executive-brief.ts` |
| SRC30 | Component | `src/components/source/SourceCommercialActionQueue.tsx` |
| SRC30 | Lib | `src/lib/source/source-commercial-action-queue.ts` |

## Test Strategy

**Suite A — Static manifest (10 tests, always green):** Descriptor counts, report `waveId`, `generatedAt`, non-empty paths/exports, no teal/fake references.

**Suite B — Integration-phase file checks (10 tests):** Wave-16 files skip gracefully when absent; Wave-15 files (Hub, RiskPanel, hub-view) always assert existence; event detail page asserts existence and content length > 100.

**Suite C — Content checks (2 tests):** Event page contains no live-data call patterns; `SourceCommercialEventSection` contains deterministic data caveat when present.
