# 2026-06-06-source-vendor-pricing-artifact-render-support — Source Vendor/Pricing Artifact Render Support

## Release ID

`2026-06-06-source-vendor-pricing-artifact-render-support`

## Status

`candidate`

## Plain-English Summary

Source can now render the Lakeshore Kyriba Vendor Response Pack and Pricing Workbook authored artifact bodies through the same buyer-review export surfaces used by the RFP and executive decision artifacts. This closes a demo-readiness gap where the event page listed the documents, but direct render endpoints returned `unsupported_artifact` for some important stage artifacts.

## Layer Impact

- `global-control-lane`: Extends shared Source artifact export routing and render registries for all clients using Source.
- `public-demo`: Improves Lakeshore demo proof by allowing the Kyriba event to retrieve real synthetic artifacts across RFP, responses, pricing, and executive decision stages.

## Client Applicability

- All clients: Source artifact render registry support is global.
- Specific clients: Lakeshore benefits immediately because its Kyriba event has authored synthetic `d13_vendor_responses` and `d19_pricing_workbook` bodies loaded.
- Internal only: No.
- Public/demo only: No, but the immediate validation target is the Lakeshore demo.
- Feature flag: None.

## Changes Included

- Adds narrative render configs for `d13_vendor_responses`.
- Adds a shareable HTML summary config for `d19_pricing_workbook`.
- Wires `d13_vendor_responses` into HTML, DOCX, and PDF renderable-code registries.
- Wires `d19_pricing_workbook` into the HTML renderable-code registry while preserving its existing structured DOCX/PDF/XLSX paths.
- Adds focused registry and narrative DOCX tests.

## QA / Validation

- `npx jest src/lib/source/exports/__tests__/renderable-codes.test.ts src/lib/source/exports/__tests__/narrative-docx.test.ts --runInBand` — passed.
- `npx eslint src/lib/source/exports/index.ts src/lib/source/exports/renderers/narrative-docx.ts src/lib/source/exports/renderers/narrative-html.ts src/lib/source/exports/renderers/narrative-pdf.tsx 'src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/render-docx/route.ts' 'src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/render-pdf/route.ts' src/lib/source/exports/__tests__/renderable-codes.test.ts src/lib/source/exports/__tests__/narrative-docx.test.ts --no-warn-ignored` — passed.
- `git diff --check` — passed.

## Rollout Plan

Merge to `main` through the normal PR flow. Vercel production deploy makes the route registry available immediately; no migration or data backfill is required.

## Rollback Plan

Revert the PR. Existing Source artifacts remain loaded; rollback only removes the newly added render support for `d13_vendor_responses` and `d19_pricing_workbook` HTML.

## Audit Evidence

- Pre-fix live proof: `/Users/anand/Projects/nexus/reports/lakeshore-source-moves-artifact-proof/lakeshore-source-moves-artifact-proof-2026-06-06T05-54-35-3NZ/README.md`
- PR and CI evidence to be attached after PR creation.

## Known Gaps

Post-merge live proof must re-run the Lakeshore Source/Moves artifact retrieval pack and confirm `d13_vendor_responses` and `d19_pricing_workbook` HTML/PDF/DOCX behavior in production.
