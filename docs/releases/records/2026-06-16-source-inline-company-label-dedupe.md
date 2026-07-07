# 2026-06-16-source-inline-company-label-dedupe — Source DOCX inline company label dedupe

## Release ID

`2026-06-16-source-inline-company-label-dedupe`

## Status

`candidate`

## Plain-English Summary

Source-generated DOCX documents no longer show the company name twice when metadata is rendered onto one line. This tightens the client-facing document hygiene from the AQ1/AQ2 Source document-generation work: a founder or buyer should see one clean `Company: SkyHarbor Air` label, not duplicated metadata.

## Layer Impact

- `global-control-lane`: Updates Source document text hygiene for generated artifacts across the shared app. No schema, routing, storage, or data-plane behavior changes.

## Client Applicability

- All clients: Source-generated client-facing documents that pass through the Source draft hygiene sanitizer.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Tightened `sanitizeClientFacingSourceDraft` company-label dedupe to remove repeated `Company: <name>` tokens even when the duplicate appears inline on the same metadata line.
- Added a regression test for the exact live DOCX failure pattern.

## QA / Validation

- Passed: `npx jest src/lib/source/agent-generation/__tests__/client-facing-hygiene.test.ts --runInBand`
- Passed: `npx eslint src/lib/source/agent-generation/client-facing-hygiene.ts src/lib/source/agent-generation/__tests__/client-facing-hygiene.test.ts`
- Passed: `npm run test:behaviors`
- Passed: `node scripts/release-check.mjs --base origin/main --head HEAD`

## Rollout Plan

Merge to `main`; the standard Azure Container Apps build/deploy for the web app makes the sanitizer active for newly generated Source artifacts. Existing generated artifacts remain unchanged until regenerated.

## Rollback Plan

Revert this PR to restore the previous sanitizer. No data migration or storage rollback is required.

## Audit Evidence

- PR URL after opening.
- Regression test showing inline duplicate `Company: SkyHarbor Air Company: SkyHarbor Air` is reduced to one label.
- Live proof from the preceding AQ2 validation showed D05 still had two labels before this fix.

## Known Gaps

Existing DOCX files already generated before this release will still contain their prior text until regenerated.
