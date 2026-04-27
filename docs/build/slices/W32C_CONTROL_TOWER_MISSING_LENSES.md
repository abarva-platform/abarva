# W32C — Control Tower Missing Lenses (Adoption / Value / Risk)

**Wave:** Wave 32 — Agent Surface Completion
**Slice ID:** W32C
**Type:** view-model extension
**Status:** code_complete

## Purpose

Extends `control-tower-active-lens-view.ts` with the three missing lens types
identified by the WIRE2 compliance audit: Adoption, Value, and Risk. The existing
file had the full 7-lens TowerLens type union but only had data for the Portfolio lens.

## Files Modified

- `src/lib/tower/control-tower-active-lens-view.ts` — added TowerLensDetail type,
  Adoption/Value/Risk lens data, lensDetail dispatch, lowContextDisclosure for thin tenants

## Files Added

- `src/__tests__/integration/tower/control-tower-lenses.test.ts` — 69 tests
- `docs/build/slices/W32C_CONTROL_TOWER_MISSING_LENSES.md` — this file

## New Types

```typescript
export interface TowerLensDetail {
  lensId: TowerLens;
  primaryQuestion: string;
  dataAvailable: string[];
  dataMissing: string[];
  topSignal: string;
  nextAction: string;
  atlasRecommendation: string;
  lowContextDisclosure: string | null;
  deterministicSeed: true;
  caveat: string;
}
```

## Lens Detail Coverage

### Adoption (apex-retail)
- CDP in Build phase approaching Activate with no adoption readiness plan
- 2 scorecards: CDP Adoption Readiness (not_started), Training Programme (not_started)
- dataMissing: user adoption baseline, change management plan, training tracking

### Value (apex-retail)
- $2.4M CDP value at stake from Workshop 5 business case
- 2 scorecards: CDP Value Baseline (blocked), AMS Cost Avoidance (at_risk)
- G3 gate blocks value baseline establishment

### Risk (apex-retail)
- 3 active risks: BAFO incomplete (2 vendors), connector stubs only, evidence gaps
- 3 scorecards covering each risk dimension
- 1 pressure card: BAFO deadline pressure

### Meridian / thin tenants
- All non-portfolio lenses return lowContextDisclosure explaining limited data availability
- dataMissing always populated, topSignal defers to low-context message

## WIRE2 Deviations Addressed

| Page | Deviation | Before | After |
|------|-----------|--------|-------|
| Control Tower | Adoption lens absent (4 of 7 tabs) | MEDIUM / unresolved | Lens detail with data contract |
| Control Tower | Value lens absent (4 of 7 tabs) | MEDIUM / unresolved | Lens detail with data contract |
| Control Tower | Risk lens absent (4 of 7 tabs) | MEDIUM / unresolved | Lens detail with data contract |

## Tests

69 tests covering getLensLabel, listAvailableLenses, all 7 lenses for apex-retail and meridian,
scorecard/pressure card constraints.
