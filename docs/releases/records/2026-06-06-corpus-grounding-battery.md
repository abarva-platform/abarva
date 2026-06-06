# 2026-06-06 — Corpus grounding battery (140-question CI guard)

## Release ID

`2026-06-06-corpus-grounding-battery`

## Status

`candidate`

## Plain-English Summary

Adds a deterministic, CI-enforced battery of 140 grounding questions that exercise the real production binding path (`bindMoveFunctionPack` + `resolveFunctionPack`) to prove the Domain Function Pack corpus grounds an agent's answer before it reaches for general intelligence. Result: 140/140 grounded across healthcare (68), retail (36), and financial services (36). A new jest test fails CI if grounding ever drops below 100%, so editing a pack cannot silently regress grounding. A report documents the result and an honest wiring audit of which agent surfaces actually consume the corpus today.

This is the reproducible form of "run 100+ questions" — a live-LLM eval would need the deployed app with real Clerk/Azure/Anthropic credentials and would add flakiness without testing anything the binding layer does not already determine (the pack IS the curated depth).

## Layer Impact

- `global-control-lane`: adds a grounding-coverage guard over the shared expert-kernel function-pack registry; no runtime behavior change to the app — a test + a CLI + a report + a pure module.

## Client Applicability

- All clients: Yes — the guard protects the grounding all clients' Moves inherit.
- Internal only: the report + battery are internal QA assets. Public/demo only: No. Feature flag: N/A.

## Changes Included

- `src/lib/programs/expert-kernel/grounding/corpus-grounding-battery.ts` — the question set (140) + pure `runGroundingBattery()` runner.
- `scripts/grounding/run-corpus-grounding-battery.ts` — CLI report (`npx tsx …`).
- `src/lib/programs/expert-kernel/__tests__/corpus-grounding-battery.test.ts` — CI guard (3 tests: ≥100 questions, 100% grounded, hero packs grounded end-to-end).
- `docs/build/grounding/CORPUS_GROUNDING_REPORT.md` — results + wiring audit.
- `docs/releases/records/2026-06-06-corpus-grounding-battery.md` — this record.

## QA / Validation

**Status: PASS.**

- `npx tsx scripts/grounding/run-corpus-grounding-battery.ts` → **140/140 grounded** (Nexus/Moves 125, Sentinel/Intelligence 11, Steward/Setup 3, Atlas/Tower 1).
- `npx jest …/corpus-grounding-battery.test.ts` → **1 suite, 3 tests passing.**
- `npx tsc --noEmit` → 0 errors in the new module/CLI/test (only the 2 pre-existing missing-optional-dependency errors remain).

## Rollout Plan

Merge to main. The jest guard joins the suite; the CLI + report are available on demand. No deploy step.

## Rollback Plan

Revert the PR. Removes the guard, CLI, module, and report. No schema or runtime state.

## Audit Evidence

- Battery + runner: `src/lib/programs/expert-kernel/grounding/corpus-grounding-battery.ts`
- CI guard: `…/__tests__/corpus-grounding-battery.test.ts`
- Report + wiring audit: `docs/build/grounding/CORPUS_GROUNDING_REPORT.md`
- Pairs with #3210/#3212/#3213/#3216/#3217/#3218.

## Known Gaps

- Coverage/regression battery, not a live adversarial LLM eval.
- Wiring gap (documented in the report): Sentinel/Source, Atlas/Tower, Steward/Setup do not yet bind the registry directly — corpus depth is present (proved), but those surfaces are not yet wired to consume it. Nexus/Moves is fully wired.
