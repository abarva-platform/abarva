# SHELL5 · Source Route Shell Control

**Wave:** wave-20
**Lane:** E
**Status:** code_complete

## Summary

SHELL5 lands `SourceRouteShell` — a thin orientation wrapper for Source routes that renders a persistent context strip above all Source route content. The strip displays the route mode label (SOURCE · OUTSOURCING INTELLIGENCE / SOURCE · EVENT PORTFOLIO / SOURCE · COMMERCIAL EVENT DETAIL), optional tenant name, optional event name, an optional linked program badge, and the deterministic seed caveat.

## Files Added

- `src/components/source/SourceRouteShell.tsx` — orientation wrapper component

## Files Modified

- `src/app/(maestro)/source/events/[eventId]/page.tsx` — `SourceRouteShell` wired as outer wrapper with `pageMode="event_detail"`, `tenantName`, and `eventName`. Additive only; all existing `SourceCanonShell` content and children preserved verbatim.

## Files Added (tests + docs)

- `src/__tests__/integration/source/source-route-shell-control.test.ts` — fs-based contract tests (no jsdom/React)
- `docs/build/slices/SHELL5_SOURCE_ROUTE_SHELL_CONTROL.md` — this file

## Design Constraints

- No `#14B8A6` / teal colors (AbarVa canon compliant)
- Background `#FBFAF7`, white strip bar, `#1B2B5C` accent — canon-aligned
- Font: DM Sans (body), no Georgia on strip
- Caveat: "Deterministic seed data. No live sourcing signals." — honest, no fake live claims

## Route Wiring Decision

`SourceRouteShell` was wired into the event detail route (`[eventId]/page.tsx`) as it is the highest-value surface (commercial workflow, linked program). The index and events list routes already use `SourceCanonShell` which provides nav context; extending those routes with `SourceRouteShell` is deferred to a subsequent slice to keep blast radius minimal.

## Cross-references

- SRC33 (wave-19): Linked Program Badge on Source Commercial Event
- LINK1 (wave-19): Source Program Link Model
- DESROUTE4: Source route shell enforcement (SourceCanonShell coverage)
