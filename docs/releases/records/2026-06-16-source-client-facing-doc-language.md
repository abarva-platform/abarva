# 2026-06-16-source-client-facing-doc-language — Source Client-Facing Document Language

## Release ID

`2026-06-16-source-client-facing-doc-language`

## Status

`candidate`

## Plain-English Summary

Source generated artifacts now use business-facing language in prompts and previews. The generation prompts no longer pass "Tenant" or tenant keys to Claude for the active Source artifact chain, and narrative previews label the organization as "Company" instead of "Tenant." Strategy and scope memo prompts now ask for an executive summary and cleaner, list-heavy scope formatting so generated drafts read more like client-ready business artifacts and less like internal system output.

## Layer Impact

- `global-control-lane`: Source artifact prompt and narrative preview rendering behavior changes for generated Source documents.
- `public-demo`: Demo/client-facing generated artifacts are less likely to expose internal platform vocabulary.

## Client Applicability

- All clients: Yes, for generated Source artifacts that use the shared Source prompt registry and narrative renderers.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Updated `src/lib/source/agent-generation/prompt-registry.ts` to use company-facing context labels, remove tenant-key prompt binding, and add executive-summary/list-heavy expectations for d01 strategy memo and d05 scope memo.
- Updated `src/lib/source/exports/renderers/narrative-html.ts` and `src/lib/source/exports/renderers/narrative-pdf.tsx` to label the organization as "Company" in generated previews/PDFs.
- Added tests that block regression to `Tenant:` labels in generated Source prompts and HTML previews.

## QA / Validation

- `npx jest src/lib/source/agent-generation/__tests__/prompt-registry.test.ts src/lib/source/__tests__/generated-artifact-rendering.test.ts --runInBand` passed.
- `rg "Tenant:|key: \\$\\{ctx\\.tenantKey\\}|\\(key:" src/lib/source/agent-generation/prompt-registry.ts src/lib/source/exports/renderers/narrative-html.ts src/lib/source/exports/renderers/narrative-pdf.tsx -n` returned no matches.

## Rollout Plan

Merge to `main`; the standard Azure Container Apps main deploy publishes the updated prompt/preview behavior. No migration or feature flag is required.

## Rollback Plan

Revert the prompt/renderer commit. Existing generated artifacts remain unchanged until regenerated; newly generated artifacts after rollback would use the previous language.

## Audit Evidence

- PR for this release candidate.
- Focused Jest output for prompt and generated-artifact rendering tests.
- Release-check output before merge.

## Known Gaps

- This is not AQ2 section-conformance verification.
- This is not AQ3 async quality/orchestrator generation.
- Existing artifacts already generated before this change must be regenerated to pick up the improved language and memo structure.
