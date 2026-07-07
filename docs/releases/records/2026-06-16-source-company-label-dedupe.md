# 2026-06-16-source-company-label-dedupe — Source Company Label Dedupe

## Release ID

`2026-06-16-source-company-label-dedupe`

## Status

`candidate`

## Plain-English Summary

Source generated documents now remove duplicate `Company: <name>` lines during client-facing draft hygiene. The document still explicitly names the company, but a generated memo no longer repeats the same Company line in the opening metadata block.

## Layer Impact

- `global-control-lane`: Client-facing Source artifact generation hygiene changes for all clients.
- Document quality: Improves polish of generated DOCX/HTML/markdown source without changing the factual evidence or approval workflow.

## Client Applicability

- All clients: Yes, for Source generated artifacts.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Adds a duplicate Company label cleanup pass to `sanitizeClientFacingSourceDraft`.
- Adds a regression test for duplicate Company labels in generated text.

## QA / Validation

- Pass: `npx jest src/lib/source/agent-generation/__tests__/client-facing-hygiene.test.ts --runInBand`
- Pass: `npx eslint src/lib/source/agent-generation/client-facing-hygiene.ts src/lib/source/agent-generation/__tests__/client-facing-hygiene.test.ts`
- Pass: `npx tsc --noEmit --pretty false`
- Pass: `npm run test:behaviors`
- Pass: `node scripts/release-check.mjs --base origin/main --head HEAD`
- Pass: `git diff --check`

## Rollout Plan

Merge to main and allow the Azure Container Apps main image workflow to deploy. Regenerate fresh Source D01/D05 artifacts in a disposable SkyHarbor event and verify the downloaded DOCX files contain one Company label.

## Rollback Plan

Revert this helper/test commit. Existing documents remain intact; the change only affects future generated artifact hygiene.

## Audit Evidence

- PR link once opened.
- CI/release-check output.
- Live regenerated DOCX proof after deployment.

## Known Gaps

This does not rewrite previously generated documents already stored in the File Cabinet. It applies to new generated artifacts only; stale files can be regenerated if a cleaner copy is needed.
