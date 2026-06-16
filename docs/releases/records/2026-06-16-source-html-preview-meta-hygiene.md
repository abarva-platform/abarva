# 2026-06-16-source-html-preview-meta-hygiene — Clean Source HTML Preview Metadata

## Release ID

`2026-06-16-source-html-preview-meta-hygiene`

## Status

`candidate`

## Plain-English Summary

Source generated HTML previews no longer expose raw internal artifact codes in document metadata. The preview still carries a business-readable document label for tooling and inspection, but client-facing HTML source now says things like `RFP Package` instead of `d09_rfp_pack`. Generated Source drafts also deterministically insert a `Company: <client>` line when Claude omits it from the body preamble.

## Layer Impact

- `global-control-lane`: Updates the shared Source narrative HTML renderer used by generated preview artifacts. No data schema, ingestion, routing, or approval logic changes.

## Client Applicability

- All clients: Applies to generated Source HTML previews.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Updates `src/lib/source/exports/renderers/narrative-html.ts` to emit business-readable document metadata.
- Updates Source draft hygiene to insert a business-facing company label when missing.
- Updates `src/lib/source/exports/__tests__/narrative-html.test.ts` to prevent raw artifact-code metadata from returning.

## QA / Validation

- Focused renderer test: pass — `npx jest src/lib/source/exports/__tests__/narrative-html.test.ts --runInBand --runTestsByPath`.
- ESLint: pass — renderer and test files.
- Typecheck: pass — `npx tsc --noEmit --pretty false`.
- Behavior tests: pass — `npm run test:behaviors`.
- Release check: pass — `node scripts/release-check.mjs --base origin/main --head HEAD`.
- Whitespace check: pass — `git diff --check`.
- Live AQ2 proof: pending deployment — will regenerate and inspect Source HTML preview artifacts after merge/deploy.

## Rollout Plan

Merge to `main`; deploy through the existing Azure Container Apps main deployment workflow. New generated previews pick up the metadata hygiene automatically.

## Rollback Plan

Revert the renderer commit and redeploy the previous ACA revision if preview tooling unexpectedly depends on the old raw artifact-code meta tag.

## Audit Evidence

- PR URL and CI checks.
- ACA deployment revision.
- Live preview download inspection showing no `x-source-artifact-code` or raw artifact code.

## Known Gaps

Existing previously generated HTML preview artifacts are not backfilled; regenerate artifacts to pick up the cleaned metadata.
