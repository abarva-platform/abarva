# 2026-06-17-phase-approve-and-build — Phase-level Approve & Build (batch generation)

## Release ID

`2026-06-17-phase-approve-and-build`

## Status

`candidate`

## Plain-English Summary

Replaces the per-deliverable "Generate" buttons in the Strategic Move phase workspace
with a single, governed **Approve & Build** action that builds every deliverable in the
phase as one batch.

Before, a user clicked Generate on each document one at a time. Now, in the phase
workspace's build step, one "Approve & Build {phase}" button enqueues generation for all
of the phase's deliverables at once. Each runs through the same proven decomposed
generator (plan → write section by section → assemble → quality gate) via the durable
worker; the UI shows a read-only status row per document (queued → building % → built /
below-gate) with an Open link when a document is ready. There is no isolated
per-document regenerate — consistent with the staleness model, if an input changes you
re-run the phase and re-approve.

This is the north-star phase-gate action: a phase is approved and built as a unit.

## Layer Impact

- `global-control-lane`: shared Moves generation UX + a new batch enqueue API. The new
  route only enqueues durable run rows (no model work in the request); generation still
  runs in the existing ACA Job worker. No schema or data-plane change.

## Client Applicability

- All clients: yes — every Strategic Move phase workspace uses the batch action.
- Specific clients: n/a
- Internal only: no
- Public/demo only: no
- Feature flag: none.

## Changes Included

- `src/app/api/v1/deliverables/generate-phase/route.ts` (new) — `POST` resolves a
  phase's canonical deliverables and enqueues one queued run each (reusing
  `createDeliverableRun`); best-effort per deliverable; 202 if any queued, 500 only if
  all fail; tenant-scoped.
- `src/components/strategic-moves/PhaseApproveAndBuild.tsx` (new) — client action:
  readiness summary + one Approve & Build button + per-deliverable run-status polling
  (GET `/deliverables/runs/{id}`), read-only status rows, AI-draft + edit-before-commit
  liability controls.
- `src/components/strategic-moves/StrategicMovePhaseClient.tsx` — swap the per-document
  `GeneratePhasePackage` for `PhaseApproveAndBuild` at the build step.
- Removed `src/components/strategic-moves/GeneratePhasePackage.tsx` (fully replaced).
- Tests: new `generate-phase/__tests__/route.test.ts` (batch enqueue, per-deliverable
  error tolerance, all-fail → 500, tenant scoping); `moves-liability-visible-controls`
  migrated to the new component (liability labels + batch engine path, no single-pass).

## QA / Validation

- `npx tsc --noEmit` — **PASS** (no new errors; two pre-existing missing-optional-dep
  errors in unrelated files remain).
- `npx eslint` on changed files — **PASS** (exit 0).
- `npx jest src/lib/deliverables/orchestrator src/components/strategic-moves
  src/app/api/v1/deliverables` — **142/143 PASS**. The single failure
  (`BoardArtifactsPanel.test.tsx`, a Costed Business-Case row count) is **PRE-EXISTING
  on main** — reproduced with this slice stashed — and is unrelated to this change;
  spun off for separate triage.
- Live phase Approve & Build on ACA (batch enqueue → worker drains → docs built) —
  **NOT-RUN** at authoring; runs post-deploy (worker already on the current image).

## Rollout Plan

Squash → main. `az acr build` → deploy worker job (runs the generator) + web revision →
traffic shift → deactivate idle revisions. No migration, no flag.

## Rollback Plan

Revert the squash-merge and redeploy the prior image to the worker + web. No data/schema
change. (Reverting also restores the per-document buttons.)

## Audit Evidence

- PR URL (filled at PR open); `jest`/`tsc`/`eslint` output in the PR.
- Post-deploy: a phase Approve & Build run producing multiple queued runs + the worker
  draining them.

## Known Gaps

- The Documents tab still has per-document generate buttons; converting it to the
  read-only browse + Approve & Build model is a follow-up (the phase workspace is done).
- Readiness is a lightweight summary (deliverable + input counts); the full
  Source-style gate-readiness panel (`buildSourceStageGateReadiness` mirror) is a
  follow-up.
- Staleness is implicit (re-run the phase); explicit "input changed since last build →
  stale" detection is a follow-up.
- Pre-existing `BoardArtifactsPanel` unit-test failure on main (unrelated) — triaged
  separately.
