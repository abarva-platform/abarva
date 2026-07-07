# 2026-07-07-source-file-to-facts-ingest — Source canvas file → typed facts ingest

## Release ID

`2026-07-07-source-file-to-facts-ingest`

## Status

`candidate`

## Plain-English Summary

Closes the last gap between a user uploading a spreadsheet at the Source canvas and
the deterministic value engine actually seeing that data. Until now, a CSV/XLSX
dropped on a Scope task only stored to Azure Blob + the artifact registry — the
numbers inside it never became facts, so the ✦ Intelligence step insight stayed on
its illustrative MODEL reading. This release adds a deterministic (no-LLM) file
parser and a new upload route that parses the file into rows and writes typed
`source_event_facts` through the exact same map/validate/write path the existing
`/facts/ingest` route uses. When a task binds a template (Scope volumetrics →
`VOLUMETRICS_V1`), the dropzone now ALSO ingests facts, shows an honest "N facts
written" chip (plus any unmapped columns / rejected cells — never a fake success),
and refreshes the page so the step insight flips to LIVE. The file still stores as
an artifact exactly as before.

## Layer Impact

- `global-control-lane`: shared Source app behavior. A new API route
  (`/api/v1/source/[eventId]/facts/ingest-file`), a shared ingest lib, a file
  parser, and canvas-dropzone wiring. The entire fact-ingest path stays dark behind
  the existing `source_analytics` feature flag, so there is no behavior change for
  un-enrolled tenants. No schema/data-plane changes; reuses the existing
  `source_event_facts` table and `sourceFactWriteAdapter` write seam.

## Client Applicability

- All clients: no. The route + wiring are gated by the `source_analytics` feature
  flag and are inert (404) for tenants without it.
- Specific clients: tenants enrolled in `source_analytics` (Lakeshore in lab).
- Internal only: no.
- Public/demo only: no.
- Feature flag: `source_analytics` (unchanged; this ships behind it).

## Changes Included

- `src/lib/source/facts/extraction/file-to-rows.ts` — deterministic CSV (papaparse)
  / XLSX (exceljs) file → `{ headers, rows }` parser. No LLM.
- `src/lib/source/facts/ingest/ingest-template-upload.ts` — shared map+validate+write
  ingest core; both `/facts/ingest` and `/facts/ingest-file` now call it.
- `src/app/api/v1/source/[eventId]/facts/ingest-file/route.ts` — new multipart route
  (file + templateCode), mirrors `/facts/ingest` auth + `source_analytics` gate.
- `src/app/api/v1/source/[eventId]/facts/ingest/route.ts` — refactored to the shared
  lib (behavior identical; existing route test still passes).
- `src/components/source/canvas/analytics/upload-artifact.ts` — `ingestSourceCanvasFacts`
  client helper.
- `src/components/source/canvas/analytics/TaskChecklist.tsx` — dropzone calls the
  fact ingest after artifact upload, renders an honest result chip, refreshes.
- `src/components/source/canvas/analytics/view-model.ts` +
  `sample-view-model.ts` — `factTemplateCode` on `StageTaskView`; Scope volumetrics
  task bound to `VOLUMETRICS_V1`.
- Tests: `file-to-rows.test.ts`, `ingest-template-upload.test.ts`,
  `ingest-file/__tests__/route.test.ts`, extended `TaskChecklist.upload.test.tsx`.

## QA / Validation

- Unit/behavior jest: new parser, shared ingest lib, ingest-file route gating, and
  the existing `/facts/ingest` route test (proves the refactor is behavior-identical)
  — all green. `Status: pass` (22 tests across the new/affected suites passed).
- Typecheck: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json
  --noEmit` — net-new errors = 0. Total errors 131 (identical to origin/main
  baseline of 131, all pre-existing from the 6ebe6d4a9 canvas workstream); none of
  the changed files appear in the error list.
- ESLint on all changed files — clean (0 errors).
- `node scripts/release-check.mjs --base origin/main --head HEAD` — pass.

## Rollout Plan

Merge to main via squash PR. No migration. No runtime env/flag change: the route is
already gated by the pre-existing `source_analytics` flag, so it activates only for
tenants already enrolled. Standard ACA main deploy workflow picks up the merge; no
manual runtime mutation required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` on merge to main.
- Shared runtime mutators: none — no feature-branch/local Azure commands.
- Approved image digest: produced by the main deploy workflow at merge time.
- ACA runtime invariant: unchanged by this PR; verify template image, 100%-traffic
  revision image, and worker images match the approved digest post-deploy per runbook.
- Worker image invariant: not affected (no worker job change).
- Feature/env flag update path: none — reuses existing `source_analytics`.
- Live signed-in proof required: yes, before claiming `live-proven`: as a
  `source_analytics`-enrolled tenant, upload a VOLUMETRICS_V1-shaped CSV/XLSX at the
  Scope volumetrics task and confirm the "N facts written" chip and the ✦
  Intelligence step insight flipping to LIVE.

## Rollback Plan

Revert the squash commit. No migration to roll back, no data written by the deploy
itself (facts are only written by an authenticated, flag-enrolled user upload). The
worst case is reverting to the prior behavior where uploads are registry-only.

## Audit Evidence

- PR URL: see the PR opened for branch `feat/source-file-to-facts-ingest`.
- CI: release-check + jest + tsc as recorded in QA / Validation above.
- No deployment URL yet (candidate; not deployed by this record).

## Known Gaps

- Only the Scope volumetrics task is bound to a template (`VOLUMETRICS_V1`).
  `APP_INVENTORY_V1` is fully supported end-to-end by the parser + route + shared
  lib (unit-proven), but no canvas task is bound to it yet — wiring it is a one-line
  `factTemplateCode` add on the relevant app-inventory task when that task exists on
  the canvas. Other stages/tasks remain registry-only uploads (no bound template).
- Live signed-in browser proof for an enrolled tenant is not captured in this record
  (candidate status); it is required before `live-proven`.
