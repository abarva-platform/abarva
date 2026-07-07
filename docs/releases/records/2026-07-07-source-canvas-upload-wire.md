# 2026-07-07-source-canvas-upload-wire — Wire the Source canvas file-upload dropzone end to end

## Release ID

`2026-07-07-source-canvas-upload-wire`

## Status

`candidate`

## Plain-English Summary

The redesigned Source stage canvas (behind the `source_analytics` flag) showed a
"Drop a file here, or browse" dropzone on `provide` tasks (for example
Scope → "Provide the volumetrics"), but it was purely presentational — there was
no real file input, so a user could not actually upload anything.

This change makes the dropzone work end to end. A user can now click or drag a
CSV/XLSX file onto the zone; the file is POSTed (multipart) to the existing
governed Source artifacts upload route, which persists the bytes to Azure Blob
storage on a tenant-scoped path and registers a `source_artifacts` registry row.
On success the canvas replaces the dropzone with a real uploaded-file card
(name · "{size} · uploaded" · a remove ✕) that reflects the actual persisted
file — not a fake success. Because the Source Workspace Explorer reads the same
artifact registry (`listSourceArtifactsForSourceEventId`), the uploaded file
also appears there for that event/tenant with no additional wiring. On failure
the card is not shown; an error message is rendered instead.

No new storage path or upload route was invented — the client was wired to the
existing `POST /api/v1/source/:eventId/artifacts/upload` route, which already
wrote to the Azure Blob adapter (`getObjectStorageAdapter`) and registered the
artifact (`registerSourceArtifactUpload`).

## Layer Impact

- `experimental` lane: the whole canvas surface (including this dropzone) is
  gated behind the `source_analytics` feature flag and is off by default.
- `client-data-lane` lane: an accepted upload writes a real object to Azure Blob
  storage (bucket `source-artifacts`, tenant-scoped path) and inserts a
  `source_artifacts` registry row scoped to the tenant + Source event. This is
  the existing governed upload route's behavior; no new data-plane surface was
  added.

## Client Applicability

- All clients: no.
- Specific clients: only tenants with the `source_analytics` flag enabled see
  the functional dropzone. Everyone else is unaffected (the flag-off path renders
  the existing `UniversalCanvasShell` untouched).
- Internal only: no.
- Public/demo only: no.
- Feature flag: `source_analytics` (off by default).

## Changes Included

- `src/components/source/canvas/analytics/upload-artifact.ts` (new): thin client
  helper that POSTs a file to the governed artifacts upload route, guards the
  client-side CSV/XLSX + size limit, and normalizes the returned artifact
  metadata.
- `src/components/source/canvas/analytics/TaskChecklist.tsx`: the `provide`-task
  dropzone is now a real uploader — hidden `<input type=file accept=".csv,.xlsx">`,
  click-to-browse + drag/drop, uploading→uploaded/error states, and an
  uploaded-file card with a remove affordance. New optional `eventId`/`stageKey`
  props; when absent the dropzone stays presentational (sample/preview mode).
- `src/components/source/canvas/analytics/ScopeAnalyticsStage.tsx` and
  `SourceAnalyticsCanvas.tsx`: minimal additive pass-through of the existing
  `event.id` + view stage down to `TaskChecklist` so the upload is scoped to the
  right event/stage. No behavior change when the props are undefined.
- `src/app/api/v1/source/[eventId]/artifacts/upload/route.ts`: unchanged — the
  client was wired to the existing route.
- Tests: route handler smoke test + jsdom TaskChecklist upload test (see below).

## QA / Validation

- New unit tests pass:
  - `src/app/api/v1/source/[eventId]/artifacts/upload/__tests__/route.test.ts`
    (5 tests): a posted CSV/XLSX → Azure Blob `.upload()` called with a
    tenant-scoped path + `registerSourceArtifactUpload` called with the tenant +
    event scope + metadata returned; missing file → 400; oversize → 413;
    wrong-type → 415.
  - `src/components/source/canvas/analytics/__tests__/TaskChecklist.upload.test.tsx`
    (4 tests): selecting a file POSTs to the upload endpoint and renders the
    uploaded-file card on success; renders an error (not a fake success) on
    failure; rejects a wrong-type file before any network call; no file input in
    sample/preview mode (no eventId).
  - Result: 9 tests passed, 2 suites green.
- ESLint clean on the changed files.
- `tsc --noEmit` filtered to the changed files: clean (main carries ~339
  pre-existing errors under `ignoreBuildErrors`; those are out of scope and were
  not touched).

## Rollout Plan

Merge to `main` via squash PR. The change ships DARK behind the existing
`source_analytics` flag — no runtime rollout, no migration, no image build, and
no traffic shift is required to merge. The behavior activates only for tenants
with `source_analytics` enabled once the standard ACA main-deploy workflow
carries `main` to the lab/product runtime.

## Deployment Authority

Not applicable to shared-runtime mutation. This PR changes application code only;
it does not touch Azure Container Apps templates, deploy workflows, runtime
images, environment variables, worker jobs, ingress traffic, DNS, or feature-flag
definitions.

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (unchanged;
  the only authority that shifts shared Product/Lab web traffic).
- Shared runtime mutators: none in this PR.
- Approved image digest: unchanged — no runtime image update in this PR.
- ACA runtime invariant: unaffected — no `az containerapp update` is performed.
- Worker image invariant: unaffected — no worker job image changes.
- Feature/env flag update path: none — `source_analytics` already exists in the
  feature registry and is not modified here.
- Live signed-in proof required: recommended before claiming `live-proven` — a
  signed-in Source canvas upload of a CSV/XLSX on a `source_analytics`-enabled
  tenant, confirming the uploaded-file card renders and the file appears in the
  Workspace Explorer. Not yet captured.

## Rollback Plan

Revert the squash commit. There is no migration and no runtime state to unwind.
Any files already uploaded through this path are ordinary governed
`source_artifacts` rows + Azure Blob objects and are unaffected by a code revert
(they remain retrievable via the existing artifact registry). No forward-only
migration constraints apply.

## Audit Evidence

- PR URL: (added on open).
- CI: `npm run release:check` and the two new Jest suites.
- Blob write proof: route test asserts `getObjectStorageAdapter().upload()` is
  called with bucket `source-artifacts` and a tenant-scoped path containing the
  event id.
- Registry proof: route test asserts `registerSourceArtifactUpload` is called
  with the tenant key + source event id + `sourceOrigin: 'uploaded'`.
- Explorer surfacing: the Workspace Explorer reads
  `listSourceArtifactsForSourceEventId` (see
  `src/lib/workspace-explorer/source-adapter.ts`), the same registry the upload
  route writes, so a persisted row appears there.

## Known Gaps

- Live signed-in browser proof (upload on a `source_analytics` tenant → card
  renders → file in Explorer) is not yet captured; recommended before
  `live-proven`.
- `signed`/PDF `provide` tasks (e.g. commitment letters) keep their PDF hint and
  are intentionally NOT wired to this CSV/XLSX uploader — out of scope for this
  change.
- The dropzone's accepted set is CSV/XLSX per the design hint; the size ceiling
  surfaced to the user is the real server limit (100 MB, from
  `MAX_SOURCE_ARTIFACT_SIZE_BYTES`), not the design copy's "200 MB".
