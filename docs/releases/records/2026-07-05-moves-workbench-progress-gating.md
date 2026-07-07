# 2026-07-05-moves-workbench-progress-gating — Live % complete + gating clarity in the Evidence Workbench

## Release ID

`2026-07-05-moves-workbench-progress-gating`

## Status

`candidate` — verified live on the Lakeshore Move before merge.

## Plain-English Summary

Two founder asks on the Evidence Workbench (P2–P5):

1. **Track % complete, always updated.** Adds live progress meters, recomputed
   from real data every render: a **"Phase complete" %** under the phase rail
   (share of the phase's gate criteria met — the truest phase-completion signal)
   and an **Evidence %** in the explorer header (share of *required* evidence
   needs that are covered or waived).

2. **Enforce the rules on the buttons, with clarity.** Two changes:
   - **Advance** is now disabled until **every hard gate criterion is met** — the
     same rule the server enforces on the advance request — instead of enabling as
     soon as the deliverable was signed off and relying on a server rejection. Its
     note now lists exactly what is left ("Complete first: …").
   - **Every disabled action states the critical reason to enable it.** e.g. Build
     report shows "Save all 7 inputs first — 5/7 captured" or "Save the record to
     create the deliverable" so it is never a mystery why a button is off.

The server remains the source of truth for every gate (generation readiness, gate
approval, sign-off); this only makes the client button-state match it and explain
it.

## Layer Impact

- `global-control-lane`: the shared Strategic Moves Evidence Workbench
  (`EvidenceWorkbench` + its mapping in `CharterWorkflow`), P2–P5 current phase,
  all clients. Presentation + a stricter client-side *disable* on Advance
  (narrowing only — the server gate is unchanged; the button can no longer be
  clicked into a guaranteed server rejection). P0/P1 and the non-workbench path
  are untouched.

## Client Applicability

- All clients: yes — every tenant using the Moves workbench at P2–P5.
- Specific clients: n/a
- Internal only: no
- Public/demo only: no
- Feature flag: none.

## Changes Included

- `src/components/strategic-moves/EvidenceWorkbench.tsx` — `Meter` component;
  `evidencePct`/`gatePct` props rendered under the rail and in the evidence header;
  `WorkbenchGateStep.action.reason` rendered under a disabled action.
- `src/components/strategic-moves/EvidenceWorkbench.module.css` — meter + reason
  styles.
- `src/components/strategic-moves/StrategicMovePhaseClient.tsx` (workbench mapping)
  — compute `gatePct` (gate criteria met) + `evidencePct` (required needs covered);
  `hardBlockers` + `wbCanAdvance` (advance disabled until no unmet hard criteria)
  with a note listing the blockers; `buildReason` attached to the Build action.

## QA / Validation

Overall status: **static PASS; live verification before merge.**

- `tsc --noEmit` (8GB heap) → **PASS** (0 errors); `eslint` → **PASS**.
- Live proof before merge (Lakeshore e0e138d5, P2): meters show real %s; Advance is
  disabled with "Complete first: …" listing the unmet hard criteria; a disabled
  Build report (when capture not saved) shows its reason.

## Rollout Plan

Merge to `main` → ACA "main deploy" → re-verify live. No migration, no flag.

## Deployment Authority

- Repo-owned deploy workflow: "ACA main deploy".
- Shared runtime mutators: none — presentation + a stricter client disable.
- Live signed-in proof required: **yes** — meters accurate, Advance gated on hard
  criteria, disabled actions show reasons.

## Rollback Plan

Revert the PR. Additive/presentation + a client-disable tightening; reverting
restores the prior workbench. No data to unwind.

## Audit Evidence

- PR URL: (added on open)
- CI: `tsc` clean + eslint clean.
- Server enforcement (unchanged, source of truth): `assertPhaseReadyForGeneration`
  (generation), `phase-gate-approval` hard-check (advance), `signOffDeliverable`.

## Known Gaps

- Per-phase % across P0–P5 (e.g. on the rail nodes) needs cross-phase gate data
  not currently loaded for non-current phases; this slice shows the current phase's
  %. A Moves-list/overview rollup is a follow-up.
- The report/sign-off criterion is still identified by label match; verify per
  phase as new gate criteria are added.
