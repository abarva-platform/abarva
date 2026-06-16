# 2026-06-16-source-generated-document-label-hygiene — Clean Generated Source Document Labels

## Release ID

`2026-06-16-source-generated-document-label-hygiene`

## Status

`candidate`

## Plain-English Summary

Generated Source documents now remove escaped internal artifact codes and use business-facing document labels before DOCX/HTML rendering. This closes the live proof gap where Word downloads no longer said `Tenant`, but still showed raw strings such as `d01_strategy_memo` in the document body.

## Layer Impact

- `global-control-lane`: Source generated document hygiene changes apply to generated artifact output for all Source events.

## Client Applicability

- All clients: Yes, for generated Source artifacts.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/source/agent-generation/client-facing-hygiene.ts`
- `src/lib/source/agent-generation/__tests__/client-facing-hygiene.test.ts`

## QA / Validation

- PASS: `npx jest src/lib/source/agent-generation/__tests__/client-facing-hygiene.test.ts --runInBand`
- PASS: `npx eslint src/lib/source/agent-generation/client-facing-hygiene.ts src/lib/source/agent-generation/__tests__/client-facing-hygiene.test.ts`
- PASS: `npx tsc --noEmit --pretty false`
- PASS: `node scripts/release-check.mjs --base origin/main --head HEAD`

## Rollout Plan

Merge to `main`; Azure Container Apps builds and shifts traffic to the new revision through the normal ACA main deploy workflow. Existing generated documents are not rewritten; newly generated documents receive the cleaner labels.

## Rollback Plan

Revert the PR and redeploy the prior ACA image. No schema or data migration is involved.

## Audit Evidence

- PR and CI checks for this release record.
- Live AQ2 proof should regenerate D01/D05 after deploy and confirm DOCX body has no raw `d01_strategy_memo`, `d05_scope_memo`, escaped variants, `Tenant`, or internal source terms.

## Known Gaps

This does not backfill stale generated artifacts. Existing files must be regenerated to pick up the hygiene fix.
