# SRC32 — Tenant-Scoped Apex Retail AMS Scenario

## Slice Metadata

| Field              | Value                                      |
|--------------------|--------------------------------------------|
| sliceId            | SRC32                                      |
| wave               | wave-19                                    |
| lane               | A                                          |
| status             | code_complete                              |
| tenant             | apex-retail                                |
| linkedProgramCode  | APX-CDP-2026                               |
| deterministicSeed  | true                                       |

## What Was Built

SRC32 updates the Source commercial demo scenario to be fully tenant-scoped for Apex Retail, linked to the APX-CDP-2026 program.

Key changes from SRC28:

- `scenarioId` updated to `apex-retail-ams-outsourcing-2026`
- New field `tenantSlug: "apex-retail"` added to `SourceCommercialDemoScenario`
- New field `linkedProgramCode: "APX-CDP-2026"` added to `SourceCommercialDemoScenario`
- New field `sourceEventId: "apex-retail-ams-outsourcing-2026"` added
- New field `deterministicSeed: true` added at scenario root level
- All four generic vendor labels replaced with named representative vendors:
  - `Northstar Managed Services` (complete pricing)
  - `BluePeak Digital Operations` (partial pricing — missing L3 support rate card and knowledge transfer costs)
  - `Horizon Application Services` (partial pricing — missing transition management costs)
  - `Meridian Systems Partners` (missing pricing — full rate card absent)
- Each vendor now carries extended posture fields: `completenessState`, `pricingResponsePosture`, `assumptionClarity`, `transitionTransparency`, `productivityCommitmentPosture`
- Each vendor carries `caveat: "Deterministic seed data. Not an actual vendor response."`
- All 5 risks, 4 signals, and 5 missions updated to reference the new named vendors
- `clientContext` updated to reference Apex Retail and the APX-CDP-2026 program
- Integration test file fully rewritten for SRC32 assertions

## Note on deterministicSeed

`deterministicSeed: true` is set on both the scenario root and each individual vendor. This is a compile-time constant (`true` literal type) that marks all values as seed data, not live vendor data. No random number generation, no Date.now(), no network calls.

## Files Changed

- `src/lib/source/source-commercial-demo-scenario.ts` — scenario updated with tenant scoping, named vendors, extended posture fields
- `src/__tests__/integration/source/source-commercial-demo-scenario.test.ts` — test suite rewritten for SRC32
- `docs/build/slices/SRC32_TENANT_SCOPED_AMS_SCENARIO.md` — this file
- `docs/build/build-slices.json` — SRC32 entry added
- `docs/build/production-readiness.json` — SRC32 note added under source section
- `docs/build/build-waves.json` — wave-19 entry added with SRC32
