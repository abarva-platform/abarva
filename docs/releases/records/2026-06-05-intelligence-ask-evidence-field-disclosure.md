# 2026-06-05-intelligence-ask-evidence-field-disclosure — Intelligence Ask Evidence Field Disclosure

## Release ID

`2026-06-05-intelligence-ask-evidence-field-disclosure`

## Status

`candidate`

## Plain-English Summary

Sentinel Ask now adds a short "Evidence checked" line for audit-style hard questions when the answer does not already cite exact evidence fields. The line keeps the CXO answer readable while giving QA and reviewers a concrete handle for what evidence family the answer used.

## Layer Impact

`global-control-lane`: Shared Intelligence Ask synthesis now has a deterministic evidence-field disclosure for hard audit questions.

`client-data-lane`: No client data, loader data, private schemas, ingestion runs, migrations, or static seed facts changed.

## Client Applicability

- All clients: Yes. The Intelligence Ask fallback synthesizer is shared across tenants.
- Specific clients: Not limited to one client.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Added `src/lib/intelligence/ask/evidence-field-disclosure.ts`.
- Updated `src/lib/intelligence/ask/index.ts` to append the evidence line only for hard audit questions and only when the answer lacks exact field handles.
- Added `src/lib/intelligence/ask/__tests__/evidence-field-disclosure.test.ts`.

## QA / Validation

- PASS: `npx jest src/lib/intelligence/ask/__tests__/evidence-field-disclosure.test.ts --runInBand`.
- PASS: `npx eslint src/lib/intelligence/ask/evidence-field-disclosure.ts src/lib/intelligence/ask/index.ts src/lib/intelligence/ask/__tests__/evidence-field-disclosure.test.ts`.
- PASS: `git diff --check`.
- PASS: `npm run release:check -- --base origin/main --head HEAD`.
- NOT-RUN until merge and deploy: production crawl should remove the hard-question citation-depth P1 findings.

## Rollout Plan

Merge to main and deploy production. No data operation is required.

## Rollback Plan

Revert the PR. Sentinel Ask returns to the prior answer shape without changing persisted tenant context.

## Audit Evidence

- Production crawl artifact `/private/tmp/post-deploy-crawl-local-ask-submit/2026-06-05T07-54-42-726Z-local` showed real Sentinel answers with 0 exact field handles on completed hard-question transcripts.

## Known Gaps

This release does not address the visual-canon P2 findings.
