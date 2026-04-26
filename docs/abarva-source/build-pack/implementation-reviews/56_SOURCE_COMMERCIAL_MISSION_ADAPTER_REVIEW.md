# 56 Source Commercial Mission Adapter Review

Date: 2026-04-26
Slice: Commercial Mission Adapter
Status: implemented

## Files Changed

- `src/lib/source/commercial-mission-adapter.ts`
- `src/lib/source/commercial-mission-adapter-types.ts`
- `src/lib/source/index.ts`
- `src/__tests__/integration/source/source-commercial-mission-adapter.test.ts`

## Mapping Rules

- Reused canonical Source mission contract from `agent-mission-types`.
- Mapped commercial mission queue owner to canonical agents:
  - `nexus` -> `nexus`
  - `sentinel` -> `sentinel`
  - `atlas` -> `atlas`
  - `steward` -> `steward`
  - `buyer_team` -> `steward` with explicit handoff note.
- Mapped commercial mission type to canonical mission type deterministically (for example `evidence_collection` -> `evidence_gap`, `award_recommendation` -> `executive_brief`).
- Mapped queue status into canonical mission state (`queued` -> `proposed`, `in_progress` -> `active`, `blocked` -> `blocked`, and so on).
- Derived canonical trigger and deterministic context-used fields from commercial mission queue inputs.

## Duplicate Suppression Behavior

- Adapter suppresses missions that are semantically equivalent to existing canonical missions for the same event/stage.
- Duplicate checks use:
  - same agent
  - same mission type
  - same source event + stage
  - title/summary semantic overlap
- Adapter reports `duplicateSuppressedCount` in deterministic output.

## Test Results

- Added integration coverage in `source-commercial-mission-adapter.test.ts`.
- Test coverage validates:
  - deterministic adaptation output
  - canonical field presence and owner mapping
  - duplicate suppression
  - markdown formatter
  - no model/UI/persistence wiring imports

## What Remains Future

- Wiring this adapter into runtime mission composition flow as a controlled follow-up slice.
- Optional provenance field standardization between canonical and commercial mission streams.
- Executive summary layer to consume unified mission stream.

## Scope Compliance

- No UI work.
- No model calls.
- No scheduler/workflow engine work.
- No upload/parsing work.
