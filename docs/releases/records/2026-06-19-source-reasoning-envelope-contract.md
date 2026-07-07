# 2026-06-19-source-reasoning-envelope-contract — Reasoning Envelope contract + gate (Phase 1, Slice 1.0)

## Release ID

`2026-06-19-source-reasoning-envelope-contract`

## Status

`candidate`

## Plain-English Summary

First building block of the Source Intelligence OS reasoning spine: the canonical
**Reasoning Envelope** — the structured container that will carry Source's
analysis (claims, evidence, assumptions, confidence, caveats, decision trace, and
a refusal record) — plus the **quality-gate validator** that enforces it. The
keystone rule: a claim with no supporting evidence is a *failure*, not a warning;
a gate-defining claim must rest on "Usable Evidence"; internal terms can't leak
into client-facing reasoning. This is types + a pure validator + tests only —
**nothing is wired into the live generation path**, which is untouched.

## Layer Impact

- `global-control-lane`: shared reasoning-engine contract under
  `src/lib/source/reasoning/`. New, dormant code — no caller on the live generate
  path. No schema, data-plane, or runtime-behavior change. Reuses existing
  `SourceDataReadinessState` / `SourceRigorLevel` / `SourceStageKey` types.

## Client Applicability

- All clients: the contract is shared, but it is **inert** until the Analysis/
  Recommendation stages and the flag-gated route wiring land (later slices).
- Specific clients: n/a · Internal only: no · Public/demo only: no · Feature flag: none (dormant)

## Changes Included

- `src/lib/source/reasoning/reasoning-envelope.ts` — `ReasoningEnvelope` + `Claim`,
  `EvidenceRef`, `Assumption`, `ConfidenceBand`, `Caveat`, `TraceStep`, `RefusalRecord`.
- `src/lib/source/reasoning/types.ts` — `AnalysisResult`, `FrameworkParams`, `Framework`.
- `src/lib/source/reasoning/envelope-gate.ts` — `validateEnvelope` (keystone gate).
- `src/lib/source/reasoning/__tests__/envelope-gate.test.ts` — 8 tests.

## QA / Validation

- `jest envelope-gate.test.ts` → **PASS** (8/8: keystone unsupported-claim failure,
  dangling ref, gate-claim-below-usable, leaked term, clean pass, refusal pass/fail).
- `eslint src/lib/source/reasoning/` → **PASS** (exit 0).
- Typecheck — runs in CI.

## Rollout Plan

Merge to main → ACA build/deploy (no runtime effect; the module is dormant). No
migration, no flag. Becomes live only when a later slice wires it behind
`source_reasoning_spine`.

## Rollback Plan

Revert the commit. Dormant code; nothing on the live path depends on it.

## Audit Evidence

- PR: `feat/source-reasoning-envelope`
- Tests: 8/8 green. Plan: `docs/codex-handoff/SOURCE_INTELLIGENCE_OS_PHASE1_BUILD_PLAN.md`.

## Known Gaps

Inert until Slices 1.2/1.3/1.5/1.6 build the framework registry/adapter, the
Analysis + Recommendation stages, and the flag-gated route wiring. The envelope is
not yet persisted (Slice 1.8 adds the `reasoning_envelopes` table).
