# 2026-06-17-documents-cabinet-consistency — Documents tab read-only + Cabinet lists generated artifacts

## Release ID

`2026-06-17-documents-cabinet-consistency`

## Status

`candidate`

## Plain-English Summary

Two consistency fixes for how a Strategic Move's documents are surfaced.

1. **Documents tab → read-only browse.** The Documents tab previously had a per-document
   "Generate" button on every not-yet-built deliverable. Generation is now a phase-level
   action (Approve & Build in the phase workspace), so the Documents tab no longer
   generates anything — it browses and downloads. A not-yet-built deliverable now shows
   "Not generated — built when you Approve & Build {phase}" instead of a button. This
   removes the last per-deliverable generate buttons and makes the tab a clean
   browse/download surface (consistent with the read-only Explorer).

2. **File Cabinet lists the real generated artifacts.** The Cabinet read only the
   `move_artifacts` vault, which often does not mirror generated deliverables — so it
   looked near-empty. It now also lists the governed `generated_artifacts` (the actual
   output of Approve & Build / the orchestrator), matched across **both**
   `source_artifact_ref` conventions (the orchestrated path stores the bare `moveId`; the
   legacy board path stores `move:{moveId}:{artifactId}`), de-duplicated against the
   vault and merged newest-first. Generated docs appear under the "Deliverables"
   (`generated_deliverable`) family and download via `/api/v1/artifacts/{id}`.

## Layer Impact

- `global-control-lane`: shared Moves UI (Documents tab) + the Cabinet's artifacts API.
  Read-only/UI + a read-side merge in an existing API. No schema, write-path, or
  data-plane change.

## Client Applicability

- All clients: yes — every Move's Documents tab and File Cabinet.
- Specific clients: n/a
- Internal only: no
- Public/demo only: no
- Feature flag: none.

## Changes Included

- `src/components/strategic-moves/PhaseDocumentsPanel.tsx` — replace the per-document
  `GenerateDeliverableButton` (not-built branch) with a read-only "built via Approve &
  Build" line; drop the now-unused generate imports + `DocumentRow`/panel props that
  only fed generation.
- `src/lib/artifacts/repository.ts` — `listGeneratedArtifactsForMoveAllRefs` (matches
  both `source_artifact_ref` conventions, de-duped, newest-first).
- `src/app/api/v1/programs/[programId]/artifacts/route.ts` — merge generated artifacts
  into the Cabinet response (family-gated to `generated_deliverable`, de-duped vs the
  vault, sorted; non-fatal if the read fails).
- Tests: new `programs/[programId]/artifacts/__tests__/route.test.ts` (merge, dedup,
  family filter, fail-soft).

## QA / Validation

- `npx tsc --noEmit` on changed files — **PASS** (no new errors).
- `npx eslint` on changed files — **PASS** (exit 0, no warnings).
- `npx jest src/components/strategic-moves src/lib/deliverables/orchestrator` plus the
  new cabinet route test — **PASS** for everything changed (130/131 in the swept
  strategic-moves set; the single failure is the **pre-existing, unrelated**
  `BoardArtifactsPanel.test.tsx`, triaged separately).
- Live signed-in check (Documents tab shows no generate buttons; Cabinet lists built
  deliverables) — **NOT-RUN** at authoring; runs post-deploy.

## Rollout Plan

Squash → main. `az acr build` → web revision (this is a web route + component change;
no worker change required) → traffic shift → deactivate idle revisions. No migration,
no flag.

## Rollback Plan

Revert the squash-merge and redeploy the prior web image. No data/schema change.

## Audit Evidence

- PR URL (filled at PR open); `jest`/`tsc`/`eslint` output in the PR.
- Post-deploy: a Move's Cabinet showing generated deliverables + the Documents tab with
  no per-document generate buttons.

## Known Gaps

- Cross-table dedup is by artifact id only; a generated artifact backfilled into the
  vault under a *different* id could appear twice (rare — the vault is sparse).
- The pre-existing `BoardArtifactsPanel` unit-test failure on main is unrelated and
  triaged separately.
