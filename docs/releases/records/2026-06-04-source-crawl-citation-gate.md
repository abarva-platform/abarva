# 2026-06-04-source-crawl-citation-gate — Source Crawl Citation Gate Correction

## Release ID

`2026-06-04-source-crawl-citation-gate`

## Status

`candidate`

## Plain-English Summary

The production crawl no longer treats the Source events portfolio as if it were an agent-answer surface. Citation-depth enforcement still applies to real ask, agent, and Sentinel surfaces, but portfolio/list pages are evaluated as pages.

## Layer Impact

`internal-admin` lane: updates the post-deploy crawl guard used by operators to judge release health. No customer-facing UI, tenant data, or runtime product behavior changes.

## Client Applicability

- All clients: post-deploy crawl scoring is more accurate across tenants.
- Specific clients: none.
- Internal only: yes, this changes release verification logic.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/crawl/baseline-compare.ts`: narrow hard-question citation-depth scoring to actual ask/agent/Sentinel surfaces.
- `src/lib/crawl/__tests__/post-deploy-crawl-guard.test.ts`: regression coverage for Source events portfolio and ask-surface enforcement.

## QA / Validation

- Pass: `npx jest src/lib/crawl/__tests__/post-deploy-crawl-guard.test.ts --runInBand`
- Pass: `npm run release:check`
- Pass: production Source-focused crawl rerun against `https://app.abarva.ai`.

## Rollout Plan

Merge to `main`, then deploy through the normal Vercel production path so future post-deploy crawls use the corrected guard.

## Rollback Plan

Revert this release record and the crawl guard/test changes. No database, tenant data, or customer-facing rollback is required.

## Audit Evidence

- Production deployment: `https://app.abarva.ai`
- Crawl artifact path from final verification will be recorded in the PR and merge notes.

## Known Gaps

The broader post-deploy crawl can still report real ask-surface citation-depth gaps. This change only removes the false positive from Source portfolio/list pages.
