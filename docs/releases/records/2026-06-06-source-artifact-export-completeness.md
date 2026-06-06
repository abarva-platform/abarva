# 2026-06-06-source-artifact-export-completeness — Source Artifact Export Completeness

## Release ID

`2026-06-06-source-artifact-export-completeness`

## Status

`candidate`

## Plain-English Summary

This release closes Source export gaps found during the live Lakeshore Kyriba proof run. The unified Source artifact export route already rendered several artifacts, but vendor response pack requests were not mapped into the dispatcher and the pricing workbook HTML request was routed like a spreadsheet instead of a buyer-readable summary. This change lets the same governed route export the Lakeshore vendor response pack in HTML/DOCX/PDF and the pricing workbook in HTML as a readable commercial summary while keeping XLSX as the authoritative vendor-editable pricing surface.

## Layer Impact

- `global-control-lane`: Shared Source export routing and rendering behavior changes for every client using the unified Source artifact render endpoint.
- `public-demo`: Improves the Lakeshore demo proof path because the Kyriba Source event can now show more complete artifact retrieval across stages and formats.

## Client Applicability

- All clients: Source artifacts using `d13_vendor_responses` and `d19_pricing_workbook` benefit from the export dispatcher fix.
- Specific clients: Lakeshore benefits immediately for the Kyriba treasury rollout demo event.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Adds the missing `vendor-response-pack` Source deliverable kind and maps it to `d13_vendor_responses`.
- Allows `d13_vendor_responses` to route through the narrative HTML/DOCX/PDF dispatcher.
- Allows `d19_pricing_workbook` to render HTML as a buyer-readable pricing summary while preserving XLSX/DOCX/PDF behavior.
- Updates focused Source export tests for routing and dispatcher behavior.

## QA / Validation

- `npx jest src/lib/source/exports/__tests__/format-router.test.ts src/lib/source/exports/__tests__/dispatch.test.ts src/lib/source/exports/__tests__/renderable-codes.test.ts --runInBand` — passed, 48 tests.
- `npx eslint src/lib/source/exports/types.ts src/lib/source/exports/format-router.ts src/lib/source/exports/spec-builder.ts src/lib/source/exports/dispatch.ts src/lib/source/exports/__tests__/format-router.test.ts src/lib/source/exports/__tests__/dispatch.test.ts` — passed.

## Rollout Plan

Merge to main, then deploy the Vercel production app. After deployment, rerun the Lakeshore signed-in Source/Moves artifact proof against `https://app.abarva.ai` and confirm `d13_vendor_responses`, `d19_pricing_workbook`, and `d24_decision_brief` export behavior across HTML/PDF/DOCX/XLSX as applicable.

## Rollback Plan

Revert the PR. Existing Source events and artifact bodies remain unchanged; rollback only removes the added route mappings and pricing HTML summary rendering.

## Audit Evidence

- PR URL: pending.
- Local QA commands listed above.
- Live proof before this fix showed page-level Lakeshore routes passing but `d13_vendor_responses` exports returning 404 and `d19_pricing_workbook` HTML returning 500; the post-deploy proof should be attached under `reports/lakeshore-source-moves-artifact-proof/`.

## Known Gaps

- Finance-attested realized Source value remains out of scope for this export-routing fix.
- The Lakeshore corpus expansion remains intentionally last unless a live answer gap requires it.
