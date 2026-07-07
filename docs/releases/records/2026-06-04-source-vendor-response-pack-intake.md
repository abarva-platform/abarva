# 2026-06-04-source-vendor-response-pack-intake — Source Vendor Response Pack Intake

## Release ID

`2026-06-04-source-vendor-response-pack-intake`

## Status

`candidate`

## Plain-English Summary

Source now exposes a dedicated vendor response pack intake on the Responses-stage checklist artifact. A Maestro can upload a received vendor response file for the event, with supported formats shown directly in the UI: DOCX, PDF, XLSX, and PPTX. Uploads are stored through the existing private Source artifact registry and now write a visible Source event activity row.

## Layer Impact

- `global-control-lane`: adds a Source canvas response-intake panel for the response checklist artifact.
- `client-data-lane`: persists uploads through the existing Source artifact registry and appends tenant-scoped/event-scoped activity rows to `source_event_activity`. No schema or migration changes are included.

## Client Applicability

- All clients: Source users with upload rights can use the response-pack intake on events with the response checklist artifact.
- Specific clients: Apex Retail Group benefits immediately for the Apex AMS walkthrough.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Adds a `VendorResponsePackPanel` to the `d11_response_checklist` workspace.
- Calls the existing `POST /api/v1/source/[eventId]/artifacts/upload` route with `artifactFamily=proposal` and `artifactKind=vendor_response_pack`.
- Extends the upload route to append an `artifact_uploaded` activity row through the Source write adapter.
- Adds focused tests for the panel and static route wiring.

## QA / Validation

- Focused Jest for the vendor response panel and static wiring — pass locally before PR update.
- ESLint on touched files — pass locally before PR update.
- `npm run release:check` — pass locally before PR update.

## Rollout Plan

Merge the PR to `main`, allow the Vercel production deployment for `app.abarva.ai` to complete, then smoke the Apex AMS Responses stage by uploading a small DOCX/PDF/XLSX/PPTX response file and confirming the Stored documents shelf and Log tab reflect the upload.

## Rollback Plan

Revert the PR. This removes the response-pack panel and upload activity logging. Existing uploaded artifact registry rows and activity rows should remain as audit history.

## Audit Evidence

- PR URL: pending.
- Focused Jest and ESLint output from the PR validation.
- Production smoke after deploy: pending.

## Known Gaps

- This release stores response packs and shows parser status from the artifact registry. Deep section-by-section proposal normalization remains a follow-up workflow.
- Upload does not send files to vendors or replace the client procurement portal. It records received vendor materials against the Source event.
