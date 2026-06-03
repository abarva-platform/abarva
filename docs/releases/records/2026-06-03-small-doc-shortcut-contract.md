# 2026-06-03-small-doc-shortcut-contract — Small PDF Native Shortcut Contract

## Release ID

`2026-06-03-small-doc-shortcut-contract`

## Status

`candidate`

## Plain-English Summary

Agent uploads now classify small PDFs against a configurable native-PDF shortcut policy. PDFs under the default thresholds of 4 pages and 500KB are marked eligible for a future Claude native-PDF route; larger PDFs, PDFs without page counts, and non-PDF files stay on the parser route.

## Layer Impact

- `global-control-lane`: Adds shared upload metadata and API response fields used by the AgentDock upload route across product surfaces.
- `client-data-lane`: No client data schema or private data-plane storage changes.

## Client Applicability

- All clients: The upload API returns the new shortcut classification where PDF parser metadata is available.
- Specific clients: None.
- Internal only: None.
- Public/demo only: None.
- Feature flag: Thresholds are configurable with `AGENT_SMALL_DOC_NATIVE_PDF_MAX_BYTES` and `AGENT_SMALL_DOC_NATIVE_PDF_MAX_PAGES`; the default behavior is active without a flag.

## Changes Included

- `src/lib/agent/attachments.ts` adds the small-PDF native shortcut classifier and parser metadata field.
- `src/app/api/v1/agent/attachments/route.ts` exposes the classifier decision in `parse_metadata.small_doc_shortcut`.
- Focused Jest coverage pins the strict threshold behavior and API response shape.

## QA / Validation

- PASS: `npx jest src/lib/agent/__tests__/attachments.test.ts src/app/api/v1/agent/attachments/__tests__/route.test.ts --runInBand` (26 tests passed; Jest reported pre-existing duplicate manual mock warnings).
- PASS: `npx tsc --noEmit --pretty false`.
- PASS: `npx eslint src/lib/agent/attachments.ts src/lib/agent/__tests__/attachments.test.ts src/app/api/v1/agent/attachments/route.ts src/app/api/v1/agent/attachments/__tests__/route.test.ts`.
- PASS: `git diff --check`.
- PASS: `npm run release:check -- --base origin/main --head HEAD`.

## Rollout Plan

Merge through the protected main merge queue. The route begins returning the new metadata after deployment; no migration is required.

## Rollback Plan

Revert the PR to remove the classifier metadata from parser results and upload responses. No data rollback is required because this does not persist new database columns.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/2944
- CI: pending.
- Local QA: focused Jest, TypeScript, eslint, diff whitespace, and release control pass locally before PR.

## Known Gaps

This is the routing contract and eligibility classifier for T195, not the final Claude native binary handoff. T195 should remain `In progress` until eligible small PDFs are actually passed to the model through the native document path and verified end to end.
