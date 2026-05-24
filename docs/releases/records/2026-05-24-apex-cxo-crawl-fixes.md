# 2026-05-24-apex-cxo-crawl-fixes — Apex CXO Crawl Fixes

## Release ID

`2026-05-24-apex-cxo-crawl-fixes`

## Status

`candidate`

## Plain-English Summary

Fixes three defects found during the Apex Retail CXO end-to-end crawl: compact Move value ranges now keep their million suffix, Source origination creates a clean Integration Fabric event title instead of echoing the first scope clause, and the Source event agent answers renewal/RFI/BAFO pressure from persisted intake facts instead of falling back to generic unavailable-context language.

## Layer Impact

- `app-control-lane`: Updates the Moves and Source runtime code paths that shape and render CXO-facing work.
- `client-data-lane`: Uses persisted Source intake facts as a tenant-scoped fallback when deeper Apex corpus retrieval is not required for event-gate answers.
- `ops-release-lane`: Adds targeted regression coverage and this release record for the crawl fix.

## Client Applicability

- All clients: compact USD range parsing, Source event naming sanitization, and persisted-intake fallback.
- Specific clients: Apex Retail benefits from the Integration Fabric naming and crawl scenario.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/programs/value-utils.ts`
- `src/lib/programs/origination-submit.ts`
- `src/components/source/SourceOriginatePage.tsx`
- `src/app/api/v1/source/[eventId]/nexus/ask/route.ts`
- Source and Moves regression tests.

## QA / Validation

- `npm test -- --runTestsByPath src/lib/programs/__tests__/value-utils.test.ts src/__tests__/integration/source/source-originate-page.test.ts src/lib/source/expert-judgment/__tests__/source-hard-question-answer.test.ts src/lib/source/__tests__/nexus-api-live-context.test.ts` — passed.
- `npx tsc --noEmit --pretty false` — passed.
- `npx eslint src/lib/programs/value-utils.ts src/lib/programs/__tests__/value-utils.test.ts src/components/source/SourceOriginatePage.tsx src/__tests__/integration/source/source-originate-page.test.ts src/lib/source/expert-judgment/source-hard-question-answer.ts src/lib/source/expert-judgment/__tests__/source-hard-question-answer.test.ts src/lib/source/__tests__/nexus-api-live-context.test.ts src/app/api/v1/source/[eventId]/nexus/ask/route.ts` — passed.
- `npm run test:behaviors -- --runInBand` — passed.
- `npm run build` — passed.

## Rollout Plan

Merge to `main`, allow Vercel production deployment to complete, then rerun the Apex CXO browser crawl and capture the final audit report.

## Rollback Plan

Revert the merge commit. No database migration or data backfill is included.

## Audit Evidence

- PR URL and CI run after branch push.
- Vercel production deployment URL after merge.
- Apex CXO crawl report and screenshots after production retest.

## Known Gaps

The full browser crawl report is produced after this fix deploys so it reflects production behavior, not local-only behavior.
