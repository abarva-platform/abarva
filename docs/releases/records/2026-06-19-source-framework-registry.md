# 2026-06-19-source-framework-registry — Framework registry + context adapter (Phase 1, Slice 1.2)

## Release ID

`2026-06-19-source-framework-registry`

## Status

`candidate`

## Plain-English Summary

The integration crux of the reasoning spine: a registry of reasoning "frameworks"
(should-cost, delivery-model, proposal-normalization, archetype classification)
and the adapter that derives their inputs from the live generation context — so
the Analysis stage can run the existing analytical modules on the generation path
without coupling it to the heavy chat-path context bundle ("one definition, two
callers"). This slice wires the **classifier** framework end-to-end and declares
the other three with the exact input each still needs. Pure code; **the live
generate path is untouched**, and nothing calls the registry yet.

## Layer Impact

- `global-control-lane`: new dormant code under `src/lib/source/reasoning/`. Reuses
  the existing `classifier/category-classifier.ts`; no change to it or to the chat
  path. No schema/data/runtime change.

## Client Applicability

- All clients: shared but **inert** until the Analysis stage (Slice 1.3) calls it.
- Specific clients: n/a · Internal only: no · Public/demo only: no · Feature flag: none (dormant)

## Changes Included

- `src/lib/source/reasoning/context-adapter.ts` — `toClassifierInput`,
  `toValueAtStakeUsd`, `toRigorLevel` (pure derivations from `SourceGenerationContext`).
- `src/lib/source/reasoning/framework-registry.ts` — `FRAMEWORK_REGISTRY`,
  `listWiredFrameworks`, `runFramework`; classifier wired, should-cost/delivery-model/
  proposal-normalization declared with their pending inputs.
- `src/lib/source/reasoning/__tests__/framework-registry.test.ts` — 7 tests.

Stacked on Slice 1.0 (`feat/source-reasoning-envelope`, the ReasoningEnvelope contract).

## QA / Validation

- `jest src/lib/source/reasoning/` → **PASS** (15/15: 8 envelope-gate + 7 registry/adapter).
- `eslint src/lib/source/reasoning/` → **PASS** (exit 0).
- Typecheck — runs in CI.

## Rollout Plan

Merge after Slice 1.0. No runtime effect (dormant). No migration/flag.

## Rollback Plan

Revert the commit. Dormant; nothing on the live path depends on it.

## Audit Evidence

- PR: `feat/source-framework-registry` (stacked on `feat/source-reasoning-envelope`)
- Tests 15/15. Plan: `docs/codex-handoff/SOURCE_INTELLIGENCE_OS_PHASE1_BUILD_PLAN.md`.

## Known Gaps

should-cost/delivery-model wiring follows (they need a value-at-stake / category
adapter that reuses the existing modules without the chat bundle);
proposal-normalization needs Phase-2 parsed vendor proposals. **Plan correction
surfaced here:** Slice 1.1 (classify-at-intake) needs a real additive migration —
`archetype`/`rigor` are derived from `event_type`, not stored columns, and
`source_events` has no JSONB field — so persisting the classification requires new
columns (handle migration-before-code).
