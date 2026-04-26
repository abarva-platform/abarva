# SRC33 — Linked Program Badge on Source Commercial Event

**Wave:** wave-19
**Lane:** D
**Status:** code_complete
**Branch:** wave19/src33-linked-program-badge

## Summary

Adds a small badge/pill to the Source Commercial Event UI showing that the event is linked to a specific Apex Retail Program (APX-CDP-2026). All data is deterministic seed — no live procurement decisions are represented.

## Files Added

- `src/lib/source/linked-program-badge-view.ts` — View model interface `LinkedProgramBadgeView` and builder function `buildLinkedProgramBadgeView(sourceEventId)`. Returns the badge view for `apex-retail-ams-outsourcing-2026`; returns null for all other event IDs.
- `src/components/source/LinkedProgramBadge.tsx` — Compact inline React badge component. Design canon: `#EEF2F8` background, `#1B2B5C` dark-navy border and text, DM Sans font, no teal.
- `src/__tests__/integration/source/linked-program-badge.test.ts` — Six pure TypeScript + Jest tests covering the view model (no jsdom/React).

## Files Modified

- `src/lib/source/index.ts` — Added `export * from './linked-program-badge-view'`.
- `src/components/source/SourceCommercialEventSection.tsx` — Wired: imports `LinkedProgramBadge` and `buildLinkedProgramBadgeView`; renders the badge above the header row when `badgeView` is non-null. Additive only — no existing content removed.

## Caveats / Constraints

- Data is deterministic seed only. No live programme procurement decisions are represented.
- `routeHint` is `/tenant/apex-retail/programs/apx-cdp-2026` — links to the Apex Retail programme detail page. Route availability depends on the tenant programme routing being live.
- SourceCommercialEventSection wiring is complete (not deferred).

## Validation

- TypeScript: `npx tsc --noEmit` — clean
- Jest: 6/6 tests pass
- ESLint: 0 warnings, 0 errors
