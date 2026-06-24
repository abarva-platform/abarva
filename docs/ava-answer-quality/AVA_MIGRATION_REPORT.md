# Ava Migration Report

## Completed In This Slice

- Added `src/lib/ava-answer/contract.ts` with `AvaAnswerPacket`.
- Removed the old `AgentAnswer` public shape. The old file is now a compatibility type shim to the new packet.
- Added shared composer, Home composer, retrieval policy, voice doctrine files, and packet validation.
- Migrated Home KNOW conversion and the Intelligence streaming `agent-answer` events to emit `AvaAnswerPacket`.
- Migrated the shared answer renderer to read packet fields and artifacts instead of `prose/tables/charts`.
- Added quality-gate tests for forbidden language, row-count-first leads, Home recommendations, and Home expert leakage.

## Remaining Surface Work

Some older component, test, and eval names still say `AgentAnswer` because renaming files would be a broad mechanical change. Their runtime type now resolves to `AvaAnswerPacket`.

Moves, Source, and Tower still need deeper route-by-route composer wiring beyond this keystone. They are documented as pending until their answer generation routes call `composeAvaAnswer` directly.
