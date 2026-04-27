# W32A — Programs Phase Filter View Model

**Wave:** Wave 32 — Agent Surface Completion
**Slice ID:** W32A
**Type:** view-model
**Status:** code_complete

## Purpose

Adds the `PhaseFilterView` read-model for the Programs Index phase filter surface.
The WIRE2 compliance audit found that the phase filter bar was display-only — no
interactive data contract existed. This slice creates the pure TypeScript view model
that backs the filter.

## Files Added

- `src/lib/programs/phase-filter-view.ts` — view model functions
- `src/__tests__/integration/programs/phase-filter-view.test.ts` — 33 tests

## API Surface

```typescript
export type ProgramPhase = 'discovery' | 'synthesis' | 'design' | 'build' | 'activate' | 'operate';
export function buildPhaseFilterView(tenantSlug: string, activePhase?: ProgramPhase | 'all'): PhaseFilterView
export function getPhaseLabel(phase: ProgramPhase): string
export function getPhasesWithPrograms(tenantSlug: string): ProgramPhase[]
```

## Data Contract

- Apex Retail: 4 programs across 4 phases (discovery, synthesis, design, build)
- CDP program is the current flagship in Build phase → `isCurrentPhase: true`
- Activate and Operate have 0 programs (honest disclosure)
- `deterministicSeed: true` on all results
- Caveat present on every view

## WIRE2 Deviation Addressed

| Page | Deviation | Before | After |
|------|-----------|--------|-------|
| Programs Index | Phase filter bar not interactive (display-only phase band) | MEDIUM / unresolved | View model provides data contract |

## Tests

33 tests covering:
- `getPhaseLabel` for all 6 phases
- `getPhasesWithPrograms` for apex-retail, meridian, unknown tenant
- `buildPhaseFilterView` structure, data contract, apex-retail specifics, activePhase parameter, meridian, unknown tenant
