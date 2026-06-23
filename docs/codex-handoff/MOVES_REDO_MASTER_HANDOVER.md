# Codex Master Handover — Moves Deliverable Redo (single entry point)

**Base off branch `feat/moves-deliverable-story-redo` (PR #3840)** — it contains everything below.
Do NOT start from `main` (the redo isn't merged there yet) and do NOT start from `#3816` alone
(it lacks these files). If you must build on `#3816`'s live routes, first merge/rebase
`feat/moves-deliverable-story-redo` in so all of this is present.

## Read these first (all on the branch)

1. `docs/build/MOVES_REDO_INTEGRATED_DELIVERY_PLAN.md` — **the plan**: one live use case (Meridian
   Health · clinical+claims) through 8 QA-gated slices. This drives everything.
2. `docs/build/MOVES_DELIVERABLE_STORY_REDO_STANDARD.md` — the story-led/exhibit-led standard.
3. `docs/build/MOVES_PHASE_BY_PHASE_CONTEXT_AND_ARTIFACT_MAP.md` — per-phase context binding map.

## What is already built + tested on this branch (do NOT rebuild)

- **The four muscles** (typed, tested):
  - `src/lib/programs/solution-context.ts` — `SolutionContext` cumulative memory + `applyPhaseDigest`
    + `contextReadyForPhase` / `architectureMayProceed`.
  - `src/lib/deliverables/visual-artifact-contract.ts` — per-artifact required exhibits +
    `VISUAL_ARTIFACT_STANDARD` + `checkVisualArtifactContract`.
  - `src/lib/deliverables/solution-prompt-factory.ts` — `buildArtifactPrompt` (dynamic, context-rich,
    HTML, `[MISSING]`-not-invented, architecture uses approved `chosenOption` or STOPs).
  - `src/lib/deliverables/review-loop.ts` — `ArtifactReviewPacket` / `FeedbackItem` /
    `SolutionContextChangeSet`, gate states, downstream staleness, `buildRegenerationPrompt`.
- **Slice 0** — `docs/build/golden-artifacts/*` (the acceptance bar), `src/lib/deliverables/golden-bar.ts`
  (`meetsGoldenBar`), `tests/e2e/moves-deliverable-redo.spec.ts` (the click-through harness).
- The new **`solution_approach_options`** deliverable + profile.

## Your job — execute the slices (the plan §Slices), in order

For EACH slice: build → unit (jest) → integration → **E2E click-through** (the harness, on the live
Meridian move) → **golden bar** (`meetsGoldenBar`) → second-tenant smoke (SkyHarbor) → release-check +
release record + tenant-purity → merge → `aca-main-deploy` → **live verify**. A slice is not done until
its live click-through is green and the artifact meets the golden bar.

The wiring per slice (files already named in the plan):
- **Slice 1:** `assembleMoveSolutionContext` is **BUILT + tested** (`src/lib/programs/assemble-solution-context.ts`,
  injectable). You only wire its 3 real `SolutionContextSources`: `retrieveCurrentState` →
  AgentContextBroker / `enterprise_context`; `loadPriorDigests` → full structured digests from
  `deliverable_versions` (NOT 1800-char clips); `loadDecisions` → gate approvals (`phase_snapshots` /
  governance). Then **replace the `[DATA GAP]` stubs** in `v2-generator.ts:336-341` with the assembled
  `SolutionContext`. (`currentStateBound=false` ⇒ leave it MISSING — the prompt-factory flags it, never
  invents.)
- **Slice 2:** wire `buildArtifactPrompt` + `output_format:'html'` into
  `api/v1/programs/[programId]/generate/route.ts:196` and
  `api/programs/workspace/[moveId]/artifact/route.ts:101`.
- **Slice 3:** generate `solution_approach_options` + the approve-an-option step + enforce
  `architectureMayProceed`.
- **Slice 4:** call `applyPhaseDigest` after each generation; per-phase reads full `SolutionContext`.
- **Slice 5:** upload→parse→`FeedbackItem` ingestion + the review/regenerate UI.
- **Slice 6:** `assertPhaseReadyForGeneration` on every entry point (see
  `PHASE_GATE_GENERATION_GUARD_BRIEF.md`) + the 3 gate states.
- **Slice 7:** full P0→P5 run on the live Meridian move to the golden bar.

## Related briefs on the branch (reference, not separate work)

- `docs/codex-handoff/MOVES_DELIVERABLE_STORY_REDO_PR_B_TO_F_HANDOVER.md` (the renderer/prompt detail).
- `docs/codex-handoff/PHASE_GATE_GENERATION_GUARD_BRIEF.md` (Slice 6 detail).
- `docs/codex-handoff/SKYHARBOR_IROPS_DELIVERABLE_REPAIR_BRIEF.md` (generation-honesty discipline).

## Rules

Shared/universal — keyed by deliverable type + phase, never per-tenant; no per-client code. Never
reject for length. Visual-first by default. `[MISSING]` context is a blocking input, never invented.
Report honestly per slice: tests + click-through + golden-bar result + live-verify.
