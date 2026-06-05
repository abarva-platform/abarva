# 2026-06-05-agent-response-html-report - Agent Response HTML Report

## Release ID

`2026-06-05-agent-response-html-report`

## Status

`candidate`

## Plain-English Summary

Adds a reliable way to document agent answers from the authenticated production
crawl. The crawl now asks the Intelligence API directly after sign-in instead
of scraping whatever page text is visible. A new renderer turns captured
transcripts into a readable HTML report with every question, every answer,
coverage counts, exact evidence-field citation counts, and P0/P1/P2 findings.

## Layer Impact

`global-control-lane`: Improves QA evidence capture for agent surfaces. This
does not change product runtime behavior for users.

## Client Applicability

- All clients: The production crawl covers all configured crawl personas.
- Specific clients: Useful for PHS/Meridian readiness, but not limited to it.
- Internal only: Yes, this is an internal QA/reporting capability.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Updated `scripts/crawl/post-deploy-harness.ts` to capture hard-question
  answers through `/api/intelligence/ask` using the authenticated browser
  session.
- Added `scripts/crawl/render-agent-response-report.ts` to render transcripts
  and crawl findings into HTML.

## QA / Validation

- PASS: `npx eslint scripts/crawl/post-deploy-harness.ts scripts/crawl/render-agent-response-report.ts`.
- PASS: `npx eslint scripts/crawl/post-deploy-harness.ts scripts/crawl/render-agent-response-report.ts scripts/smoke/p21-post-deploy-crawl.spec.ts`.
- PASS: `npx tsc --noEmit --pretty false`.
- PASS: `npx tsx scripts/smoke/p21-post-deploy-crawl.spec.ts`.
- PASS: `npx tsx scripts/crawl/render-agent-response-report.ts --input-dir /private/tmp/phs-agent-report/artifacts-27016813614 --output reports/2026-06-05-agent-response-capture/index.html --title "PHS/Meridian Agent Response Capture - 50 Hard Turns"`.
- PASS: `npm run release:check -- --base origin/main --head HEAD`.

The rendered report intentionally flags the downloaded 2026-06-05 canceled
production crawl artifact as 50 chrome-only captures. That is the defect this
release fixes for the next crawl.

## Rollout Plan

Merge to main. The next post-deploy crawl will produce richer transcripts. The
HTML renderer is run manually or by follow-up automation against the crawl
artifact directory.

## Rollback Plan

Revert the PR. The previous page-scrape transcript behavior returns, and no
client data or schema changes need rollback.

## Audit Evidence

- Crawl transcript JSON files under `audit-artifacts/post-deploy-crawl/<run>/transcripts/`.
- Rendered HTML report under `reports/2026-06-05-agent-response-capture/index.html`.
- Post-deploy crawl GitHub Action artifact.

## Known Gaps

This does not add 50 distinct hard questions. It documents the current 50-turn
production-crawl shape: 5 personas times 10 hard questions. A separate question
bank expansion can raise the test to 50 distinct questions if desired.
