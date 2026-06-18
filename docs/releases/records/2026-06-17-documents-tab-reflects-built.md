# 2026-06-17-documents-tab-reflects-built — Documents tab reflects Approve & Build output

## Release ID

`2026-06-17-documents-tab-reflects-built`

## Status

`candidate`

## Plain-English Summary

Completes the consistency fix: the **Documents tab** now also shows Approve & Build
output as built, matching the Move Explorer and File Cabinet.

Approve & Build writes to `generated_artifacts`, but the Documents tab read only
`deliverables_v2`, so a built document showed "Not generated" there. The tab now also
maps the latest **succeeded** deliverable run per document for the Move; when
`deliverables_v2` has no content for a slot, the row reads **Built** with HTML/Word
downloads to `/api/v1/artifacts/{id}`. It is additive — a `deliverables_v2` document
still wins — and the phase counts (`Generated`, `n/total`) now include run-built
documents. With this, all three browse surfaces (Explorer, Cabinet, Documents) agree.

## Layer Impact

- `global-control-lane`: shared Moves browse surface. A read-side merge in the
  Documents tab server component, reusing the same `listSucceededRunsForMove` helper as
  the Explorer. No schema, write path, or data-plane change.

## Client Applicability

- All clients: yes — every Move's Documents tab.
- Specific clients: n/a
- Internal only: no
- Public/demo only: no
- Feature flag: none.

## Changes Included

- `src/components/strategic-moves/PhaseDocumentsPanel.tsx` — compute a per-key map of
  succeeded runs (`getActiveClientRow` + `listSucceededRunsForMove` +
  `orchestratorDeliverableType`); `DocumentRow` accepts `runArtifact` and renders a
  "Built" dot + `/api/v1/artifacts/{id}` downloads when `deliverables_v2` is empty; the
  `withContent`, `generatedCount` and per-row status include run-built slots.
- Tests: `moves-liability-visible-controls.test.tsx` mocks the new server deps
  (`active-client`, `runs-repository`) so the jsdom render does not pull the data-plane
  ESM chain.

## QA / Validation

- `npx tsc --noEmit` — **PASS** (no new errors).
- `npx eslint` on changed files — **PASS** (exit 0).
- `npx jest src/components/strategic-moves src/lib/deliverables/orchestrator` —
  **132/133 PASS**; the one failure is the **pre-existing, unrelated**
  `BoardArtifactsPanel.test.tsx`.
- Architecture audit + release gate — **PASS** (no new Supabase-runtime usage added).
- Live signed-in check (Documents tab shows Approve & Build output as Built +
  downloadable) — **NOT-RUN** at authoring; runs post-deploy.

## Rollout Plan

Squash → main. Web-only (server component) — `az acr build` → web revision → traffic
shift → deactivate idle revisions. No worker change, no migration, no flag.

## Rollback Plan

Revert the squash-merge and redeploy the prior web image. No data/schema change.

## Audit Evidence

- PR URL (filled at PR open); `jest`/`tsc`/`eslint` output in the PR.
- Post-deploy: a Move whose Approve & Build output shows as Built in the Documents tab
  with a working `/api/v1/artifacts/{id}` download.

## Known Gaps

- The canonical-store question (`deliverables_v2` vs `generated_artifacts`) is still not
  resolved — this is the additive "show built if either" bridge across all three
  surfaces, not a unification. A future slice should pick a canonical store (or write
  both) so the bridges can be retired.
