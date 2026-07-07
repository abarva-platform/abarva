# 2026-06-11-source-preflight-gate-record-and-shelf-fixes — Source gate-record stage mapping + live document shelf refresh

## Release ID

`2026-06-11-source-preflight-gate-record-and-shelf-fixes`

## Status

`candidate`

## Plain-English Summary

Two bugs found by clicking the real Source canvas as a user (pre-flight for the SkyHarbor end-to-end pressure test):

1. Recording a stage-gate decision returned HTTP 500. The gate playbook uses its own stage vocabulary (`origination`, `rfp_design`, …) while the `source_artifacts` registry enforces a different stage vocabulary via a database CHECK constraint (`intake`, `rfp_rfi_package`, …). Persisting the Gate Approval Record passed the playbook key straight into the registry, which threw. This release adds an explicit playbook→registry stage mapping so gate approval records persist under the correct registry stage.
2. After uploading a document, the EVENT DOCUMENTS shelf did not show the new file until a full page reload. The shelf seeded React state from props once and ignored refreshed server props. A prop-sync effect now updates the shelf when the server component re-renders.

## Layer Impact

- `global-control-lane`: shared Source canvas behavior (gate decision persistence and document shelf rendering) for all tenants. No schema change, no data migration.

## Client Applicability

- All clients: yes — any tenant using the Source canvas gate and document shelf.
- Specific clients: n/a
- Internal only: no
- Public/demo only: no
- Feature flag: none

## Changes Included

- PR #3402 (branch `source-preflight-fixes`)
- `src/lib/source/stage-gate/approval-artifact.ts` — `PLAYBOOK_TO_REGISTRY_STAGE` map + `registryStageFor()`; gate approval records now register under valid registry stage keys.
- `src/components/source/canvas/UniversalCanvasShell.tsx` — prop-sync `useEffect` so `registryArtifacts` prop refreshes the shelf state after `router.refresh()`.
- `src/lib/source/__tests__/source-wiring.test.ts` — assertion that a `rfp_design` gate decision registers with `stageKey: 'rfp_rfi_package'`.

## QA / Validation

- `npm run test:behaviors` green locally, including the new stage-mapping assertion in `source-wiring.test.ts`.
- Root cause reproduced live on app.abarva.ai (HTTP 500 on Record decision; frozen shelf needing manual reload) with screenshots in the Source pre-flight evidence set.
- Full PR CI suite green except this release gate prior to adding this record.

## Rollout Plan

Squash-merge to main, then standard Azure control-lane web image roll (`az acr build` → `az containerapp update` → traffic shift to the new revision). No migration required.

## Rollback Plan

Revert the squash commit and roll the previous web image revision back to 100% traffic. No data cleanup needed — gate approval records written under the corrected stage keys remain valid registry rows.

## Audit Evidence

- PR: https://github.com/abarva-platform/abarva/pull/3402
- CI runs on the PR head (all functional checks green).
- Pre-flight click-through screenshots (500 before / 200 + Gate Approval Record visible after deploy) in the Source E2E testing evidence set.

## Context Ingestion Evidence

Not applicable — no ingestion, parsing, embedding, or retrieval path changed. The document-shelf change is render-only; upload, Blob staging, and registry commit paths are untouched.

## Known Gaps

- The deprecated File-Cabinet list/download routes still need reconciliation onto the `source_artifacts` registry (tracked separately).
- Live re-click verification on the deployed revision is pending the next web image roll.
