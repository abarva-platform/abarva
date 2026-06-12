# 2026-06-12-source-document-access-actions — Source Document Access Actions

## Release ID

`2026-06-12-source-document-access-actions`

## Status

`candidate`

## Plain-English Summary

Source event documents that appear in the Document tab now have clear actions instead of acting like inert cards. Each persisted event document shows an explicit `Open detail` action for the provenance/content page and a `Download file` action for the original stored file.

The Source artifact download endpoint now supports the governed upload-registry rows used by the event document shelf, not only the newer File Cabinet metadata shape. This lets uploaded files stream back from Azure Blob using tenant-scoped metadata.

## Layer Impact

- `global-control-lane`: updates shared Source workspace UI and artifact-download behavior for all Source events.
- `client-data-lane`: reads existing tenant-scoped Source artifact metadata and Blob objects; no schema or data mutation.

## Client Applicability

- All clients: Source clients with event-scoped uploaded or generated documents.
- Specific clients: Validated against the SkyHarbor Source event path that exposed the issue.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/source/canvas/workspace-tabs/DocumentTab.tsx`: adds explicit document open/download actions.
- `src/app/api/v1/source/artifacts/[artifactId]/download/route.ts`: adds a tenant-checked fallback for upload-registry artifacts stored in the `source-artifacts` Azure Blob container.
- `src/components/source/canvas/workspace-tabs/__tests__/DocumentTab.test.tsx`: covers shelf actions.
- `src/app/api/v1/source/artifacts/[artifactId]/download/__tests__/route.test.ts`: covers File Cabinet downloads and upload-registry fallback downloads.

## QA / Validation

Passed locally:

- `npx jest src/components/source/canvas/workspace-tabs/__tests__/DocumentTab.test.tsx --runInBand`
- `npx jest --runTestsByPath 'src/app/api/v1/source/artifacts/[artifactId]/download/__tests__/route.test.ts' --runInBand`
- `git diff --check`

Pending before merge:

- ESLint on touched files.
- `npm run release:check -- --base origin/main --head HEAD`.
- GitHub CI after PR creation.

## Rollout Plan

Merge to `main`, build the next Azure Container Apps image, deploy to `ca-abarva-web-lab-eastus`, and verify the Source event Document tab can open and download persisted documents from `app.abarva.ai`.

No migration, DNS, Vercel, Supabase, drain/search/freeze, or account-shutdown work is included.

## Rollback Plan

Revert the PR. Existing persisted Source artifacts and Azure Blob objects remain unchanged.

## Audit Evidence

- Live issue observed on SkyHarbor Source event document shelf.
- Signed-in route probe confirmed artifact detail pages resolve for registry-backed documents.
- Unit tests cover visible actions and registry-backed Blob streaming.

## Known Gaps

A fuller File Cabinet page for Source events remains a product enhancement. This change fixes the immediate document-access actions in the current Document tab surface.
