# LINK1 — Source Program Link Model

**Wave:** wave-19
**Lane:** C
**Status:** code_complete
**Branch:** wave19/link1-source-program-link-model

## Purpose

LINK1 creates the data bridge type model between Apex Retail Source AMS outsourcing event (`apex-retail-ams-outsourcing-2026`) and Apex Retail Program (`APX-CDP-2026`). This is a deterministic read model — no live procurement decision, no model calls, no network calls.

## Files

- `src/lib/source/source-program-link.ts` — types and functions
- `src/lib/source/index.ts` — re-exports `source-program-link`
- `src/__tests__/integration/source/source-program-link.test.ts` — Jest integration tests

## Types Exported

- `SourceProgramLinkType` — union of four link classification strings
- `SourceProgramLinkStatus` — union of four lifecycle statuses
- `SourceProgramLinkEvidenceBasis` — union of four evidence basis strings
- `SourceProgramLink` — bridge entity between source event and program
- `SourceProgramLinkSummary` — roll-up view with counts and evidence caveat

## Functions Exported

- `buildSourceProgramLinks()` — returns deterministic array of seed links
- `getLinksForProgram(programCode)` — filters by `linkedProgramCode`
- `getLinksForSourceEvent(sourceEventId)` — filters by `sourceEventId`
- `summarizeSourceProgramLinks(links)` — returns summary with counts and caveat

## Seed Data

| Field | Value |
|---|---|
| id | `link-apex-retail-ams-cdp-2026` |
| tenantSlug | `apex-retail` |
| sourceEventId | `apex-retail-ams-outsourcing-2026` |
| linkedProgramCode | `APX-CDP-2026` |
| linkType | `commercial_event_supports_program` |
| status | `deterministic_seed` |
| evidenceBasis | `deterministic_demo_seed` |
| deterministicSeed | `true` |
| createdAt | `2026-04-26T00:00:00.000Z` |

## Caveats

- All links are deterministic seed data. No live procurement decision has been made.
- Link is advisory and read-model only.
- Missing inputs: Live vendor response ingestion, Final BAFO response package, Approved pricing evidence, Client procurement owner confirmation.

## Cross-References

- SRC28 — Source Commercial Demo Scenario Seed (AMS outsourcing event shape)
- APX-CDP-2026 — Apex Retail CDP Activation programme (Programs module)
