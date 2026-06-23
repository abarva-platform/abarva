# Moves Deliverable Redo — Integrated Delivery Plan (QA every step, live use case along the way)

**One live use case threads through every slice; no slice advances until its live click-through is
green.** This is the single source that drives the build — the integration of the four muscles
(SolutionContext, VisualArtifactContract, prompt-factory, review-loop) + the route/broker wiring + the
UI + the gates.

## The live use case (the continuous proof)

- **Tenant:** Meridian Health (real loaded healthcare context).
- **Move / use case:** "Unify clinical + claims on Databricks to drive clinical quality + operational
  performance KPIs."
- **Golden bar (acceptance target):** the two manually-generated decks, staged at
  `docs/build/golden-artifacts/` — `Target-State-Architecture.html` and
  `Clinical-Claims-Databricks-Strategy.html`. **Every generated artifact is measured against these.**

## The QA gate every slice MUST pass before the next starts (the "no excuse" rule)

1. `npx tsc --noEmit` clean.
2. `npx jest` — unit green, no regressions.
3. Integration test green (the seam works end to end in-process).
4. **E2E click-through** (Playwright, real move on the deployed app) — green, **no click failure**.
5. **Artifact renders to the golden bar** — required exhibits present, flashy HTML, grounded (not
   `[DATA GAP]`). Checked by the Slice-0 acceptance helper.
6. **Second-tenant smoke** — re-run one artifact on SkyHarbor → proves universal, not hard-coded.
7. `node scripts/release-check.mjs` + release record + tenant-purity green.
8. Merge → `aca-main-deploy` → **live verify on `app.abarva.ai`**.

A slice's **definition of done is the golden bar**, not "the code runs."

## Slices

### Slice 0 — Harness + live move + golden bar  *(set up first)*
- **Files:** `tests/e2e/moves-deliverable-redo.spec.ts` (the click-through), `docs/build/golden-artifacts/*`,
  `src/lib/deliverables/__tests__/golden-bar.ts` (acceptance helper).
- **Build:** stage the golden decks; write the Playwright spec that signs in, opens the Meridian move,
  drives capture → gate → generate → view; write `meetsGoldenBar(html, artifactKey)` (reuses
  `checkVisualArtifactContract` + SVG/exhibit checks).
- **Click-through:** the spec drives the existing move surface end to end (no new behavior yet).
- **DoD:** the harness drives a move and the acceptance helper scores an artifact vs the golden bar.

### Slice 1 — SolutionContext + real retrieval (kill `[DATA GAP]`)
- **Files:** `src/lib/programs/solution-context.ts` (done) + `assembleMoveSolutionContext` (new,
  broker-backed), replace stubs in `v2-generator.ts:336-341`.
- **Click-through:** generate a P2 artifact → assert it contains Meridian's **real current-state**, not
  `[DATA GAP]`.
- **DoD:** no `[DATA GAP]` in a generated artifact where the tenant has context.

### Slice 2 — Visual-first prompt → Claude-authored flashy HTML
- **Files:** wire `solution-prompt-factory` + `VISUAL_ARTIFACT_STANDARD` + `output_format:'html'` into
  the generate route (`api/v1/programs/[programId]/generate/route.ts:196`) and workspace artifact
  route (`api/programs/workspace/[moveId]/artifact/route.ts:101`).
- **Click-through:** generate Target Architecture → it's a flashy SVG HTML deck; `meetsGoldenBar` passes;
  the story/visual quality gate passes.
- **DoD:** the architecture artifact looks like the golden deck.

### Slice 3 — P3a Approach & Options + the decision gate
- **Files:** `solution_approach_options` generation; the **approve-an-option** UI; wire
  `architectureMayProceed` so P3b is blocked until `chosenOption` approved.
- **Click-through:** generate options → approve one → architecture unlocks & uses it; architecture
  **blocked** before approval.
- **DoD:** architecture cannot generate without an approved option.

### Slice 4 — Cumulative writeback + per-phase context
- **Files:** call `applyPhaseDigest` after each generation; each phase reads the full SolutionContext;
  add the **"what we know so far"** SolutionContext panel.
- **Click-through:** P1→P2→P3 — each artifact references prior phases' real content; the panel grows.
- **DoD:** later artifacts visibly build on earlier approved content.

### Slice 5 — Review-change-regenerate loop + UI
- **Files:** `review-loop.ts` (done) + upload→parse→`FeedbackItem` ingestion + the review UI
  (Upload feedback → Review extracted changes → Approve → Regenerate → Compare versions → Sign off).
- **Click-through:** upload a feedback file → review → approve → regenerate → compare → sign off;
  downstream staleness markers appear on impacted artifacts.
- **DoD:** a client change produces a scoped, versioned regeneration with traceability.

### Slice 6 — Gate enforcement (no approved gate, no generation) + 3 gate states
- **Files:** `assertPhaseReadyForGeneration` wired into every generation entry point; gate ribbon shows
  `draft_ready / changes_requested / approved`; block advance on unresolved changes.
- **Click-through:** incomplete gate → **409** + blockers, nothing enqueued; approved → auto-enqueue.
- **DoD:** generation is impossible without an approved gate; approval triggers it.

### Slice 7 — Full P0→P5 run to the golden bar
- **Click-through:** drive the whole move P0→P5 — generate, review, regenerate, sign off — every
  artifact `client_ready`, flashy, grounded; review loop exercised; no click failure.
- **DoD:** the full engagement reads like a senior consulting team's work, end to end, on the live app.

## Sequencing note

Front-load **Slices 1–2** (real context + flashy HTML) — that's the visible win by slice 2 — then harden
with 3–7. Each slice ends in a deploy + live verify; budget for that cycle (generation runs in the ACA
worker). Second-tenant smoke on every slice keeps it universal.
