# SRC27 — Mount Source Commercial Hub

**Wave:** wave-16
**Branch:** wave16/src27-mount-source-commercial-hub
**Type:** source-ui
**Status:** code_complete

## Summary

Mounts the `SourceCommercialHub` inside the Source event detail experience by introducing `SourceCommercialEventSection` — a collapsible client component that wraps the 7-tab hub with deterministic seed data and minimal page wiring.

## Files Changed

- `src/components/source/SourceCommercialEventSection.tsx` — new collapsible wrapper component
- `src/app/(maestro)/source/events/[eventId]/page.tsx` — adds `SourceCommercialEventSection` below `NexusEngagementCanvas`
- `src/__tests__/integration/source/source-commercial-event-section.test.ts` — 8 type-shape tests (no jsdom)
- `docs/build/slices/SRC27_MOUNT_SOURCE_COMMERCIAL_HUB.md` — this file

## Design Decisions

- Section collapsed by default; expand button labeled "View commercial intelligence →"
- Vendor list derived deterministically from `eventId` via a simple hash (3–5 vendors from a fixed pool)
- All slot props left empty; `SourceCommercialHub` renders "Panel loading..." placeholders — consistent with the prop-slot composition contract
- Caveat banner clearly states data is deterministic/seed-backed
- AbarVa canon: white background, near-black/navy headings, `#2E6FD8` accent blue chevron, `#E5DCD2` border — no teal

## Constraints

- `SourceCommercialHub` was not modified (prop-slot composition contract preserved)
- Component does not import from `@/lib/source` (pure UI)
- Server component (`page.tsx`) renders client component (`SourceCommercialEventSection`) — valid Next.js pattern
