# 2026-06-19-quality-gate-why-and-regenerate — Show WHY a deliverable is below the board-grade gate + Regenerate

## Release ID

`2026-06-19-quality-gate-why-and-regenerate`

## Status

`candidate`

## Plain-English Summary

When a Move phase deliverable was generated but **held below the board-grade quality gate**,
the phase workspace only said *"Built · below gate"* — with no explanation of why, and no
clear next action. The user couldn't tell whether to fix inputs, add context, or just re-run.

This change makes the below-gate state actionable, **without weakening the gate**:

1. **Shows WHY** — the specific gate blockers (e.g. "3 unsupported client-fact claims",
   "document too short: 420 words; minimum 900", "section ends mid-sentence (truncation)")
   are now listed under the generate step. These come straight from the orchestrator's
   `QualityValidationResult.blockers`, already persisted on the run and already returned by
   `GET /api/v1/deliverables/runs/{runId}` — they were simply being discarded by the UI.
2. **Offers a clear re-run** — the generate button relabels to **"Regenerate at board-grade"**
   when a build came back below gate (and "Regenerate artifact" when it passed). Generation is
   non-deterministic, so another board-grade pass can clear the gate; or the user fixes the
   flagged inputs/context first, then regenerates.

Deliberately **NOT** done: a "bypass / override the gate" mode. Deliverables already always
run at `board_grade_consulting`, and skipping the gate would be a governance regression
(no-fabrication / pilot-scrutiny). The gate stays enforced; "Regenerate" only runs another pass.

## Layer Impact

- **`global-control-lane`** — shared Move phase workspace UI (`StrategicMovePhaseClient`). No
  schema change, no migration, no API change (the `blockers` field was already returned),
  no data write.

## Client Applicability

- All clients: **Yes** — shared phase-workspace behavior, no feature flag.
- Specific clients: No. Internal only: No. Public/demo only: No. Feature flag: None.

## Changes Included

- `src/components/strategic-moves/StrategicMovePhaseClient.tsx`
  - `GenState` "done" variant now carries `blockers?: string[]`.
  - The run poll captures `poll.blockers` on a `blocked` result (was discarded).
  - The generate button relabels to "Regenerate at board-grade" (below gate) /
    "Regenerate artifact" (passed) / "Generate artifact" (first run).
  - The below-gate result now renders the blocker reasons using the existing
    `gateLine`/`gateLineRed`/`pulse`/`statusText` canon, plus a hint that the gate stays
    enforced and a File Cabinet link. The passed state keeps the compact "Built ✓" line.

## QA / Validation

- **PASS** — `tsc --noEmit` (no errors in the changed file) + `eslint` on the changed file (clean).
- **PASS** — data chain verified by reading the source: worker writes `blockers` on a blocked
  run (`process-deliverable-queue.ts` → `completeDeliverableRun`), `getDeliverableRun` parses
  them, and `GET /api/v1/deliverables/runs/{runId}` returns `blockers` (route line 34). The UI
  now consumes that same field.
- **NOT-RUN — live render of the below-gate branch**: requires a deliverable that actually
  lands below the gate, which can't be forced on demand (the current First Capital P1 charter
  passes — verified live run `6dd7183f`). Will surface on the next genuine below-gate run;
  the passed-path render is unchanged and remains live-proven.

## Rollout Plan

Merge to `main` → `aca-main-deploy` (web image). No migration, no worker change.

## Rollback Plan

Revert the PR and redeploy prior `main`. UI-only; no data impact.

## Audit Evidence

- PR URL (added on open) for the branch; CI run.
- Source refs: `runs/[runId]/route.ts:34` (blockers exposed), `process-deliverable-queue.ts`
  (blockers persisted on blocked runs), `StrategicMovePhaseClient.tsx` (consumption + render).

## Known Gaps

- The File Cabinet does not show below-gate runs at all (blocked runs produce no
  `generated_artifacts` row), so the phase workspace is the only surface for the "why". This
  is correct for now (the artifact-based Cabinet only lists produced artifacts) but means a
  user who navigates away from the phase workspace loses the blocker detail until they re-run.
- No automated component test renders the below-gate branch (CharterWorkflow is an internal,
  non-exported component); covered by tsc + the verified data chain instead.
