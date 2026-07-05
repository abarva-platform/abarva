# 2026-07-05-bind-phase-capture-to-solution-context — Bind the operator's saved phase capture into deliverable generation

## Release ID

`2026-07-05-bind-phase-capture-to-solution-context`

## Status

`candidate` — verified live (fresh Lakeshore Move P2 discovery report) before merge.

## Plain-English Summary

When a deliverable is generated (e.g. the P2 discovery report), the model is fed a
cumulative `SolutionContext`. That context was assembled from three sources only:
the tenant broker/current-state estate, prior **approved** deliverable digests, and
approved gate decisions. **The operator's saved phase capture — the "N of N"
section content they type into the phase form (current-state findings, baseline
metrics, gaps/root causes, process handoffs, data quality, evidence confidence,
recommendation) — was never bound into that context.** It is stored in
`program_modules.state_jsonb` and read only to check module *status*; its content
was dropped.

Consequence: on a fresh Move with no prior approved phases, the discovery report
was generated **blind to the operator's diagnosis**. The mandated diagnostic
sections had no supporting context, so the model wrote a literal `[DATA GAP]`
marker — which the board-grade quality gate blocks (`golden-bar.ts` → "contains
[DATA GAP] — context was not bound"). The Move could not produce a signable
discovery report even though the operator had filled all seven capture sections.

Fix: add an optional `loadPhaseCapture(moveId, phase)` context source that reads
the saved sections via `getModuleState` and folds them into the `SolutionContext`
— merging its `currentState` with the broker result (neither is dropped) and
carrying the structured fields (`baselineMetrics`, `gaps`, `rootCauses`,
recommendation → `humanApprovalNotes`). The bound capture also lets the existing
P2 metric inference run, so the diagnostic thesis is grounded in the real numbers
the operator attested.

## Layer Impact

- `global-control-lane`: the shared Move deliverable context assembler
  (`assembleMoveSolutionContext`) + its Moves deps wiring, for all clients and all
  phases (P1–P5). The change only **adds** bound context (the operator's own
  capture); it never removes or overwrites the broker current state or prior
  digests. The source is optional, so other callers/tests are unaffected.

## Client Applicability

- All clients: yes — every tenant generating Move deliverables from phase capture.
- Specific clients: n/a
- Internal only: no
- Public/demo only: no
- Feature flag: none.

## Changes Included

- `src/lib/programs/assemble-solution-context.ts` — `SolutionContextSources` gains
  optional `loadPhaseCapture`; `assembleMoveSolutionContext` folds it after the
  broker bind, merging `currentState` and updating `currentStateBound` so the P2
  metric inference runs on the capture.
- `src/lib/deliverables/moves-generate-deps.ts` — `contextSources.loadPhaseCapture`
  reads `getModuleState`, filters to the target phase, and maps each section's
  `state_jsonb.value` onto the digest (all sections → `currentState`;
  `baseline_metrics` → `baselineMetrics`; `gaps_root_causes` → `gaps`/`rootCauses`;
  `recommendation` → `humanApprovalNotes`).
- `src/lib/programs/__tests__/assemble-solution-context.test.ts` — 3 regression
  tests: capture binds when the broker is empty; broker + capture are merged (neither
  dropped); back-compat no-op when no source is supplied.

## QA / Validation

Overall status: **static PASS; live verification before merge.**

- `jest assemble-solution-context` → **PASS** (9/9, incl. 3 new). `moves-generate-deps`
  → **PASS** (1/1). (Unrelated `evidence-ingestion.test.ts` fails on clean
  `origin/main` too — pre-existing, not from this change.)
- `tsc --noEmit` (8GB heap) → **PASS** (0 errors); `eslint` → **PASS**.
- Live proof before merge: on the fresh Lakeshore Move (RETAIL-CONTRACT-2026), with
  P2 capture 7/7 saved + evidence ingested, re-run P2 **Build and approve** →
  discovery report generates **without `[DATA GAP]`** and signs off; then P2→P3.

## Rollout Plan

Merge to `main` → ACA "main deploy" → re-verify live on the fresh Move. No
migration, no flag.

## Deployment Authority

- Repo-owned deploy workflow: "ACA main deploy" (auto on push to `main`).
- Shared runtime mutators: none — context assembly only (read path).
- Live signed-in proof required: **yes** — discovery report generates gap-free.

## Rollback Plan

Revert the PR. The added source is additive and optional; reverting restores the
prior (capture-blind) assembly. No data to unwind.

## Audit Evidence

- PR URL: (added on open)
- CI: jest + tsc + eslint clean.
- Pre-fix live evidence: fresh Move P2 discovery report held on "CONTAINS [DATA GAP]
  — CONTEXT WAS NOT BOUND" with all 7 P2 capture sections saved.
- Trace: capture stored in `program_modules.state_jsonb`, read only for `status` in
  `gateSources.captureComplete`; never folded into `assembleMoveSolutionContext`.

## Known Gaps

- The section→field mapping is P2-shaped (baseline/gaps/recommendation keys). For
  other phases the capture still folds into `currentState` generically (so it is no
  longer dropped), but phase-specific structured promotion (e.g. P4 value fields)
  is future work.
- `gaps` and `rootCauses` are populated from the same captured "gaps / root causes"
  section; splitting them into distinct structured lists is a later refinement.
