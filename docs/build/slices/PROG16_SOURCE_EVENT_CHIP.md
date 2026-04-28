# PROG16 · Source Event Chip on Program Action Strip

**Wave:** wave-19
**Lane:** E
**Status:** code_complete
**Date:** 2026-04-26

## Summary

Adds a compact source event chip to the Program Flagship page that surfaces the linked Source AMS event for a given program. The chip shows commercial readiness state, top commercial blocker, and a link to the full commercial event.

## Files Created

- `src/lib/programs/program-source-link-view.ts` — deterministic view-model; `buildProgramSourceLinkView(programCode)` returns `ProgramSourceLinkView | null`
- `src/components/programs/SourceEventChip.tsx` — compact chip component (AbarVa canon: off-white base, dark navy accent, no teal, no avatars)
- `src/__tests__/integration/programs/source-event-chip.test.ts` — pure TS+Jest contract tests (9 assertions)

## Files Modified

- `src/components/programs/ProgramFlagshipPage.tsx` — additive wiring of SourceEventChip in Section 2b (between workflow orientation strip and knows/missing panel), guarded by `programCode` prop

## Design Canon

- Background: `#F8F7F4` (off-white)
- Border accent: `#1B2B5C` (dark navy, 3px left)
- Text: `#0A0C12` ink / `#525866` muted
- Font: DM Sans
- No teal, no sparkles, no avatars, no large cards

## Seed Data

| Field | Value |
|-------|-------|
| `sourceEventId` | `apex-retail-ams-outsourcing-2026` |
| `sourceEventName` | Application Management Services — Vendor Consolidation 2026 |
| `commercialReadinessState` | `pending_bafo_review` |
| `topCommercialBlocker` | BAFO responses incomplete — 2 vendors require follow-up |
| `topBafoOpportunity` | Northstar Managed Services pricing gap |
| `routeHint` | `/source/events/apex-retail-ams-outsourcing-2026` |
| `deterministicSeed` | `true` |

Data is deterministic and seed-aligned. Live commercial event wiring is deferred to a future release slice.

## Constraints

- No live model calls, no writes, no mutations
- Read-only orientation chip only
- `buildProgramSourceLinkView` returns `null` for all program codes except `APX-CDP-2026`
- Live source event API wiring deferred to release agent
