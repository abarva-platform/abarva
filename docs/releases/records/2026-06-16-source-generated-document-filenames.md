# 2026-06-16-source-generated-document-filenames — Business-Friendly Source Document Filenames

## Release ID

`2026-06-16-source-generated-document-filenames`

## Status

`candidate`

## Plain-English Summary

Generated Source artifacts now use business document names in their downloaded filenames, such as `Scope_Memo-...docx`, instead of internal artifact codes such as `d05_scope_memo-...docx`. The underlying artifact codes remain internal metadata for routing and lineage.

## Layer Impact

- `global-control-lane`: Source generated artifact rendering changes apply to all clients when new Source documents are generated.

## Client Applicability

- All clients: Yes, for newly generated Source artifacts.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/source/generated-artifact-rendering.ts`
- `src/lib/source/agent-generation/client-facing-hygiene.ts`
- `src/lib/source/__tests__/generated-artifact-rendering.test.ts`

## QA / Validation

- PASS: `npx jest src/lib/source/__tests__/generated-artifact-rendering.test.ts src/lib/source/agent-generation/__tests__/client-facing-hygiene.test.ts --runInBand`
- PASS: `npx eslint src/lib/source/generated-artifact-rendering.ts src/lib/source/agent-generation/client-facing-hygiene.ts src/lib/source/__tests__/generated-artifact-rendering.test.ts`
- PASS: `npx tsc --noEmit --pretty false`
- PASS: `npm run test:behaviors`
- PASS: `node scripts/release-check.mjs --base origin/main --head HEAD`

## Rollout Plan

Merge to `main`; Azure Container Apps builds and shifts traffic through the normal ACA main deploy workflow. Existing generated files keep their historical filenames; regenerated/new files use the business-friendly filename stem.

## Rollback Plan

Revert the PR and redeploy the prior ACA image. No schema or data migration is involved.

## Audit Evidence

- PR and CI checks for this release record.
- Live AQ2 proof should regenerate D01/D05 after deploy and confirm default downloads return `.docx` files with business-friendly names and no raw internal artifact codes in the document body.

## Known Gaps

This does not rename stale Blob objects or previously registered source artifact filenames. Regenerate artifacts to receive new filenames.
