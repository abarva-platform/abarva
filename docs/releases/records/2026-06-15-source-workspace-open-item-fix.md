# 2026-06-15-source-workspace-open-item-fix — Fix Source Workspace Open Item

## Release ID

`2026-06-15-source-workspace-open-item-fix`

## Status

`candidate`

## Plain-English Summary

Fixes the Source workspace file explorer primary action so generated Source artifacts open through the in-app artifact review route instead of pointing the user at a raw download endpoint. It also teaches the Source artifact download API how to serve generated inline drafts from the Source artifact-state body, so generated markdown drafts no longer fail with Azure Blob `BlobNotFound` when the registry row uses an `inline://` URI.

## Layer Impact

- `global-control-lane`: updates shared Source workspace link behavior and Source artifact download handling for all clients using the workspace explorer.
- No data-plane mutation: does not change schemas, migrations, records, blobs, parser output, or tenant data.
- No ingestion change: does not change upload, parse, quarantine, review, or approval behavior.

## Client Applicability

- All clients: yes, for Source workspace explorer artifact links.
- Specific clients: validated against the SkyHarbor Source workspace failure path.
- Internal only: no.
- Public/demo only: no.
- Feature flag: respects the existing Source workspace explorer feature gate; no new flag.

## Changes Included

- `src/lib/workspace-explorer/types.ts`: adds an optional `downloadHref` so open/review and download targets can be separated.
- `src/lib/workspace-explorer/source-adapter-mapping.ts`: maps Source registry, linked canvas, and evidence artifacts to `/source/events/{eventId}/artifacts/{artifactId}` as the primary open target while preserving the API download URL separately.
- `src/app/api/v1/source/artifacts/[artifactId]/download/route.ts`: handles `inline://source-event-artifact-state/...` registry artifacts by reading the authored body from Azure/Postgres and returning inline text instead of attempting an Azure Blob download.
- Focused tests updated for adapter mapping, workspace explorer rendering, and the inline generated artifact download route.

## QA / Validation

- Live diagnosis before fix: Chrome proved `Open item` linked to `/api/v1/source/artifacts/d351b934-2758-42d2-bc5b-d840b4d71de0/download`; browser request returned HTTP 500.
- Azure Container App logs showed `BlobNotFound` for an `inline://source-event-artifact-state/...` URI, confirming generated draft rows were being treated as physical Blob paths.
- `npx jest src/lib/workspace-explorer/__tests__/source-adapter-mapping.test.ts 'src/app/api/v1/source/artifacts/[artifactId]/download/__tests__/route.test.ts' src/components/workspace-explorer/__tests__/WorkspaceExplorer.test.tsx --runInBand` passed.
- `npx jest --runTestsByPath src/components/workspace-explorer/__tests__/WorkspaceExplorer.test.tsx --runInBand` passed.
- `npx eslint src/lib/workspace-explorer/types.ts src/lib/workspace-explorer/source-adapter-mapping.ts 'src/app/api/v1/source/artifacts/[artifactId]/download/route.ts' src/lib/workspace-explorer/__tests__/source-adapter-mapping.test.ts 'src/app/api/v1/source/artifacts/[artifactId]/download/__tests__/route.test.ts' src/components/workspace-explorer/__tests__/WorkspaceExplorer.test.tsx` passed.

## Rollout Plan

Merge to `main`, build the Azure Container Apps image, deploy a new ACA revision, shift traffic, then verify the SkyHarbor Source workspace `Open item` action in Chrome with the signed-in session.

## Rollback Plan

Rollback to the previous Azure Container Apps revision if the artifact link or download behavior regresses. No database rollback is required because this release has no schema or data migrations.

## Audit Evidence

- PR and CI evidence after publication.
- Live pre-fix evidence: `Open item` returned 500 and ACA logs showed `BlobNotFound` for the generated inline artifact URI.
- Post-deploy Chrome proof should verify the primary link targets `/source/events/{eventId}/artifacts/{artifactId}` and no longer returns 500.

## Known Gaps

This fixes the failed primary open action and inline generated draft route. It does not redesign the full artifact drawer, add side-by-side native document rendering, or change upload/parse/quarantine behavior.
