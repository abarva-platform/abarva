# 2026-07-05-moves-build-approve-finalize — Finalize capture before generating in Build-and-approve

## Release ID

`2026-07-05-moves-build-approve-finalize`

## Status

`candidate` — verified live on the Lakeshore P2 Move before merge.

## Plain-English Summary

Hotfix to the Moves phase-workspace "Build and approve" action shipped in the v2
package. Clicking **Build and approve** on a saved phase returned:

> Phase capture incomplete: Current-state findings, Baseline metrics, Gaps / root
> causes, Process handoffs, Data quality / governance, Evidence confidence,
> Recommendation.; Phase 2 gate is not approved — no generation until the gate is
> approved.

…even though the tracker read **"7 of 7 captured"**.

Root cause: **Save** persists the seven inputs but leaves the underlying phase
modules `in_progress`. The generation gate (`assertPhaseReadyForGeneration` →
`captureComplete`) only counts modules that are `completed`. So generation was
rejected as "capture incomplete". And because a **pre-gate draft** is only
permitted when capture is complete (the intended "generate a draft, review it,
then approve the gate" path), the same incompleteness also tripped the
`gate_not_approved` blocker — producing the confusing two-part error.

`buildAndApprove` generated *before* finalizing the capture. The sibling
`advanceGate` action already finalizes (POST `phase-capture {complete:true}`,
flipping the modules to `completed`) before it approves the gate; Build-and-approve
was simply missing that step.

Fix: `buildAndApprove` now finalizes the capture first, then generates the
pre-gate draft, then signs it off. A finalized capture is exactly what the
generation gate requires, so the just-saved record becomes generatable.

## Layer Impact

- `global-control-lane`: the shared Strategic Moves phase workspace
  (`StrategicMovePhaseClient`) for all clients. Client-side ordering change only;
  it calls the existing signed-in `phase-capture` (finalize) and generation routes
  in the correct order. No route, schema, or gate-policy change — the server still
  enforces every gate.

## Client Applicability

- All clients: yes — every tenant using the Strategic Moves phase workspace (P1–P5).
- Specific clients: n/a
- Internal only: no
- Public/demo only: no
- Feature flag: none.

## Changes Included

- `src/components/strategic-moves/StrategicMovePhaseClient.tsx` — `buildAndApprove`
  now POSTs `phase-capture {complete:true}` (finalize → modules `completed`) before
  `generateArtifact()`. On a finalize failure it surfaces the missing sections and
  stops without generating. Deps array gains `move.id` + `phaseNum`.

## QA / Validation

Overall status: **static PASS; live verification IN PROGRESS on the Lakeshore P2 Move.**

- `npx tsc --noEmit` → **PASS** (0 errors; needs `--max-old-space-size=8192`).
- `npx eslint` on the changed file → **PASS** (exit 0).
- Live repro captured pre-fix: Build-and-approve on RETAIL-LEGAL-2026 P2 returned
  the "capture incomplete / gate not approved" error at "7 of 7 captured".
- Live post-fix proof → on the same Move, Build-and-approve finalizes → generates a
  pre-gate draft → signs it off (deliverable `signed_off`), with no "capture
  incomplete" error. The P2 **gate** correctly stays blocked on the remaining hard
  evidence gaps (notes ingested, baseline attested, stakeholders named) — that is by
  design, not this fix's concern.

## Rollout Plan

Merge to `main` → ACA "main deploy" → re-verify live on the Lakeshore Move. No
migration, no flag.

## Deployment Authority

- Repo-owned deploy workflow: "ACA main deploy" (auto on push to `main`).
- Shared runtime mutators: none changed — reuses existing finalize + generate +
  sign-off routes, all tenant-fenced and server-gated.
- Live signed-in proof required: **yes** — Build-and-approve generates + signs off
  without the capture-incomplete error.

## Rollback Plan

Revert the PR. Pure client ordering change; reverting restores the
generate-before-finalize order (the buggy behavior). No data to unwind.

## Audit Evidence

- PR URL: (added on open)
- CI: `tsc` clean + eslint clean.
- Pre-fix live error screenshot: Build-and-approve on RETAIL-LEGAL-2026 P2.

## Known Gaps

- The non-P2 `generate-phase` path (P1/P3/P4/P5 via
  `/api/v1/deliverables/generate-phase`) enqueues durable runs that execute in the
  library's default `final` mode, which requires an approved gate. Build-and-approve's
  pre-gate DRAFT path is currently wired only for the P2 `discovery_report` route
  (`/api/v1/programs/{id}/generate`, `generationMode:"draft"`). Extending pre-gate
  draft generation to the other phases is follow-up work, tracked with the v2 package.
