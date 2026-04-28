# TOWER3 — Control Tower Active Lens Refresh

**Wave:** wave-21
**Lane:** J
**Status:** code_complete
**Risk:** low
**Owner:** Lane J

## Summary

Introduces the `ControlTowerActiveLensView` deterministic read model and `ControlTowerActiveLens` React component for the Control Tower page lens-switching surface. Follows the CONTROL_TOWER_PAGE_BLUEPRINT exactly: 7 lens tabs, max-5 scorecard strip, max-3 pressure cards, and Ask Atlas as a deferred secondary drawer button — not the page hero.

## Files Changed

- `src/lib/tower/control-tower-active-lens-view.ts` — View model, types, and builder function
- `src/components/tower/ControlTowerActiveLens.tsx` — React component following AbarVa design canon
- `src/__tests__/integration/tower/control-tower-active-lens.test.ts` — Integration tests

## Blueprint Compliance

- Blueprint: `CONTROL_TOWER_PAGE_BLUEPRINT.md` — followed exactly
- Design canon: off-white `#FBFAF7` base, dark-navy `#1B2B5C` typography + accent, DM Sans body — no teal
- Agent-centric: Atlas as primary signal owner; Ask Atlas is a drawer button, not the main affordance
- Scorecard cap: 5 enforced via `.slice(0, 5)`
- Pressure card cap: 3 enforced via `.slice(0, 3)`
- Deterministic seed caveat: always visible
- `deterministicSeed: true` on view, scorecards, and pressure cards

## Tenant Coverage

- `apex-retail`: portfolio lens returns 3 scorecards (on_track/at_risk/blocked) + 2 pressure cards
- All other tenants: empty scorecards/pressure cards with honest fallback message

## Deferred

- Live AI telemetry ingestion
- Ask Atlas drawer wiring (runtime deferred per blueprint)
- Non-portfolio lens content for apex-retail (future waves)

## Acceptance Criteria

- [x] 7 lens tabs present in component
- [x] Max 5 scorecards enforced
- [x] Max 3 pressure cards enforced
- [x] Ask Atlas is a drawer button, not the page hero
- [x] Deterministic seed caveat visible
- [x] No teal (#14B8A6) in component
- [x] `deterministicSeed: true` on all output objects
- [x] Non-apex tenant returns empty scorecards
- [x] TypeScript clean
- [x] Tests green
- [x] ESLint clean (max-warnings 0)

## Validation Commands

```
npx tsc --noEmit --pretty false
npx jest src/__tests__/integration/tower/control-tower-active-lens.test.ts --no-coverage
npx eslint --max-warnings=0 src/lib/tower/control-tower-active-lens-view.ts src/components/tower/ControlTowerActiveLens.tsx src/__tests__/integration/tower/control-tower-active-lens.test.ts
```
