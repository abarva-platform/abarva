# W32B — Intelligence Programs + Actions Mode View Models

**Wave:** Wave 32 — Agent Surface Completion
**Slice ID:** W32B
**Type:** view-model
**Status:** code_complete

## Purpose

Adds two new Intelligence mode view models that back the missing "Programs" and "Actions"
tabs on the Intelligence canvas. The WIRE2 audit found only 4 of 5 required blueprint tabs
were implemented — Programs and Actions tabs were absent.

## Files Added

- `src/lib/intelligence/intelligence-programs-mode-view.ts` — Programs mode view model
- `src/lib/intelligence/intelligence-actions-mode-view.ts` — Actions mode view model
- `src/__tests__/integration/intelligence/intelligence-programs-actions-modes.test.ts` — 40 tests

## API Surface

### Programs Mode
```typescript
export function buildIntelligenceProgramsModeView(tenantSlug: string): IntelligenceProgramsMode
```

### Actions Mode
```typescript
export function buildIntelligenceActionsModeView(tenantSlug: string): IntelligenceActionsMode
```

## Data Contract

### Apex Retail Programs Mode
- 3 impacted programs: CDP (vendor assumption divergence), AMS (BAFO readiness gap), Contact Center AI (design criteria gap)
- Each program has patternIds, sentinelSignal, evidenceBasis
- `lowContextDisclosure: null` (rich tenant)

### Apex Retail Actions Mode
- 5 priority-ordered actions: immediate (×2), this_week (×2), this_month (×1)
- Actions linked to: vendor assumption divergence, BAFO readiness gap, CDP evidence gap
- All agents represented: sentinel, nexus, steward, atlas
- `blockedBy` field is honest — never null-faked

### Meridian / thin tenants
- `lowContextDisclosure` populated with explanation
- Minimal seed data shown

## WIRE2 Deviations Addressed

| Page | Deviation | Before | After |
|------|-----------|--------|-------|
| Intelligence | Programs tab absent (4 of 5 tabs) | MEDIUM / unresolved | View model provides data contract |
| Intelligence | Actions tab absent (4 of 5 tabs) | MEDIUM / unresolved | View model provides data contract |
| Intelligence | No cross-reference from patterns to programme detail | MEDIUM / unresolved | Programs mode cross-references patternIds |

## Tests

40 tests covering both view models for apex-retail, meridian, and unknown tenants.
