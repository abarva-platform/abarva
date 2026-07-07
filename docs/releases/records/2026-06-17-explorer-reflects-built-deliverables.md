# 2026-06-17-explorer-reflects-built-deliverables — Explorer reflects Approve & Build output

## Release ID

`2026-06-17-explorer-reflects-built-deliverables`

## Status

`candidate`

## Plain-English Summary

Makes a built deliverable actually show as "built" in the Move Explorer.

Approve & Build (and the deliverable orchestrator) writes its output to the
`generated_artifacts` store, but the Explorer reads `deliverables_v2` — two
disconnected stores. So a document you just built appeared in the File Cabinet but
still showed "Not generated" in the Explorer. This wires the Explorer to also reflect
the orchestrator output: it reads the latest **succeeded** deliverable run per document
for the Move and, when `deliverables_v2` has no content for that slot, marks it
**built** (status "ready") with HTML/Word downloads pointing at
`/api/v1/artifacts/{id}`. It is additive — a `deliverables_v2` document still wins when
present — so nothing that already worked changes. Phase gate-met counts now include
run-built documents too.

## Layer Impact

- `global-control-lane`: shared Moves browse surface. A read-side merge in the
  Explorer's server model + one new tenant-scoped repository read. No schema, write
  path, or data-plane change; it does not pick a canonical store, it just stops a built
  document from looking unbuilt.

## Client Applicability

- All clients: yes — every Move Explorer.
- Specific clients: n/a
- Internal only: no
- Public/demo only: no
- Feature flag: none.

## Changes Included

- `src/lib/deliverables/orchestrator/runs-repository.ts` — `listSucceededRunsForMove`
  (latest succeeded run per deliverable type for a Move; the move id lives in the JSONB
  `job_payload`, so it filters in code; tenant-scoped).
- `src/components/strategic-moves/StrategicMoveDetailView.tsx` — `buildExplorerModel`
  maps each registry key to a succeeded run via
  `orchestratorDeliverableType(key) === run.deliverableType`; a slot reads "ready" +
  downloads from `/api/v1/artifacts/{id}` when `deliverables_v2` is empty; `gateMet`
  counts run-built slots.
- Tests: `runs-repository.test.ts` (+2 — latest-per-type filtering, skip null artifact).

## QA / Validation

- `npx tsc --noEmit` — **PASS** (no new errors).
- `npx eslint` on changed files — **PASS** (exit 0).
- `npx jest src/lib/deliverables/orchestrator src/components/strategic-moves` —
  **132/133 PASS**; the one failure is the **pre-existing, unrelated**
  `BoardArtifactsPanel.test.tsx`.
- Architecture audit + release gate — **PASS**.
- Live signed-in check (Explorer shows Approve & Build output as built + downloadable) —
  **NOT-RUN** at authoring; runs post-deploy.

## Rollout Plan

Squash → main. Web-only (server component + a read helper) — `az acr build` → web
revision → traffic shift → deactivate idle revisions. No worker change, no migration,
no flag.

## Rollback Plan

Revert the squash-merge and redeploy the prior web image. No data/schema change.

## Audit Evidence

- PR URL (filled at PR open); `jest`/`tsc`/`eslint` output in the PR.
- Post-deploy: a Move whose Approve & Build output shows as built in the Explorer with a
  working `/api/v1/artifacts/{id}` download.

## Known Gaps

- Only the Explorer is wired in this change; the Documents tab still reads
  `deliverables_v2` only — the same additive merge there is the immediate follow-up.
- The canonical-store question (`deliverables_v2` vs `generated_artifacts`) is not
  resolved here; this is an additive "show built if either" bridge, not a unification.
