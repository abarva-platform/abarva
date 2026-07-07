# 2026-06-05-source-pricing-binding-e2e - Source Pricing Binding E2E

## Release ID

`2026-06-05-source-pricing-binding-e2e`

## Status

`candidate`

## Plain-English Summary

Fixes the Pricing document workspace so governed XLSX workbook templates stay visible before a narrative draft exists, then adds a focused production-style Playwright test for Source pricing data binding. The test downloads the d19 pricing template, fills a vendor workbook, uploads it through the visible Source UI, verifies the submitted vendor row appears, then downloads the comparison workbook and confirms it contains the uploaded vendor name.

## Layer Impact

- `global-control-lane`: Updates Source canvas runtime behavior for structured workbook intake and adds Source E2E QA coverage. No database schema or tenant data model changes.
- `client-data-lane`: The test exercises tenant/event-scoped upload and comparison behavior when run against a live environment.

## Client Applicability

- All clients: The E2E pattern validates generic Source pricing-binding behavior.
- Specific clients: The test fixture targets the Apex Retail AMS pilot event.
- Internal only: The test itself is internal QA evidence.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/components/source/canvas/workspace-tabs/DocumentTab.tsx`: keeps XLSX template/comparison links visible for renderer-backed structured artifacts even when DOCX/PDF/HTML exports remain gated until a draft body exists.
- `src/__tests__/integration/source/source-event-canvas-render.test.tsx`: updates the Pricing canvas contract to treat workbook templates as governed intake controls, not draft exports.
- `tests/e2e/_helpers/auth.ts` and `tests/e2e/source/_auth.ts`: refresh live demo-code sign-in selectors and preserve the active-client cookie on UI fallback auth.
- `tests/e2e/source/vendor-pricing-binding.spec.ts`: browser-level pricing upload/download binding proof.

## QA / Validation

- PASS: `npx jest src/__tests__/integration/source/source-event-canvas-render.test.tsx src/__tests__/integration/source/source-pricing-upload-download-routes.test.ts --runInBand`
- PASS: focused lint for Source document tab, Source canvas integration test, E2E auth helpers, and pricing E2E.
- EXPECTED RED before this fix is deployed: `BASE_URL=https://app.abarva.ai npx playwright test tests/e2e/source/vendor-pricing-binding.spec.ts --workers=1` reached the authenticated Pricing workspace but timed out waiting for `source-canvas-document-body-download-xlsx-d19_pricing_workbook`, proving production hid the governed workbook template on an unauthored pricing artifact.
- PENDING after merge/deploy: `BASE_URL=https://app.abarva.ai npx playwright test tests/e2e/source/vendor-pricing-binding.spec.ts --workers=1`
- PENDING: `npm run release:check -- --base origin/main --head HEAD`
- PENDING: `git diff --check`

## Rollout Plan

Merge with the normal PR flow and deploy to production. The runtime change is limited to the Source artifact document workspace and only makes renderer-backed XLSX workbook controls visible earlier.

## Rollback Plan

Revert the document-tab change, auth-helper update, test, and release record. No schema rollback is required. Any QA vendor-submission rows created by the production E2E are uniquely named with the `Codex QA Pricing` prefix and can be filtered if cleanup is needed.

## Audit Evidence

- Pre-fix Playwright failure artifact: `test-results/source-vendor-pricing-bind-01009--comparison-from-bound-data-chromium/error-context.md`.
- Post-merge production Playwright output and any generated `test-results` artifacts from the passing production run.

## Known Gaps

- This proves the existing d19 pricing loop. It does not claim the canonical d13 Vendor Response Pack is fully wired; d13 still requires vendor picker, versioned response-pack parsing, and response-section mapping.
