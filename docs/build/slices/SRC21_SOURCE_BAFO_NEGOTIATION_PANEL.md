# SRC21 — BAFO Negotiation Panel

**Wave:** wave-15
**Status:** code_complete
**Owner:** Codex
**Completed:** 2026-04-26

## Summary

Adds a tabbed BAFO / Negotiation model panel surfacing Wave-14 commercial intelligence inside the Source app.

## Files

- `src/lib/source/source-bafo-negotiation-view.ts` — View model builder wrapping Wave-14 `buildBafoNegotiationSummary`. Deterministic, no model calls, no network calls.
- `src/components/source/SourceBafoNegotiationModelPanel.tsx` — Tabbed React panel (levers / opportunities / asks / recommendations). Named `SourceBafoNegotiationModelPanel` to avoid collision with the existing `SourceBafoNegotiationPanel`.
- `src/__tests__/integration/source/source-bafo-negotiation-model-panel.test.ts` — 9 integration tests covering view model correctness, determinism, and component type shape.

## Design

- Colors: `#FAFAF9` bg, `#0F0E0D` text, `#1E3A5F` dark-navy accent. No teal/cyber.
- Display-only. No API calls, no model calls. Not legal or procurement advice.

## Naming Collision Note

`src/components/source/SourceBafoNegotiationPanel.tsx` already existed (uses `SourceBafoNegotiationPlan` from `bafo-negotiation-types.ts`). This slice uses the name `SourceBafoNegotiationModelPanel` throughout to avoid overwriting or conflicting with the existing file.
