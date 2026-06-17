# 2026-06-16-source-markdown-company-label-dedupe — Source DOCX markdown company label dedupe

## Release ID

`2026-06-16-source-markdown-company-label-dedupe`

## Status

`candidate`

## Plain-English Summary

Source-generated DOCX documents no longer show the company name twice when one company label is Markdown-bolded and the other is plain text. This closes the remaining live D05 Scope Memo proof failure where Word rendered `Company: SkyHarbor Air` twice even after inline plain-text dedupe.

## Layer Impact

- `global-control-lane`: Updates Source generated-document hygiene across the shared app. No schema, data-plane, routing, or storage changes.

## Client Applicability

- All clients: Newly generated Source documents that pass through the Source draft hygiene sanitizer.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Extends the company-label dedupe sanitizer to treat Markdown-decorated labels like `**Company:** SkyHarbor Air` and plain labels like `Company: SkyHarbor Air` as the same metadata label.
- Adds a regression test for the exact Markdown + plain duplicate case observed in live DOCX proof.

## QA / Validation

- Passed: `npx jest src/lib/source/agent-generation/__tests__/client-facing-hygiene.test.ts --runInBand`
- Passed: `npx eslint src/lib/source/agent-generation/client-facing-hygiene.ts src/lib/source/agent-generation/__tests__/client-facing-hygiene.test.ts`
- Passed: `npm run test:behaviors`
- Passed: `node scripts/release-check.mjs --base origin/main --head HEAD`
- Passed: `git diff --check`

## Rollout Plan

Merge to `main`; the standard Azure Container Apps deploy makes the sanitizer active for newly generated Source artifacts. Existing generated artifacts must be regenerated to receive the cleaned metadata.

## Rollback Plan

Revert this PR. No migration or storage rollback is required.

## Audit Evidence

- PR URL after opening.
- Regression test proving Markdown-decorated and plain company labels are deduped together.
- Live proof before this fix: D05 DOCX from `eca786f` still contained two rendered `Company: SkyHarbor Air` labels.

## Known Gaps

Existing files generated before this release keep their prior text until regenerated.
