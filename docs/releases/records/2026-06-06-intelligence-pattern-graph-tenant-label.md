# 2026-06-06-intelligence-pattern-graph-tenant-label — Intelligence Pattern Graph Tenant Label

## Release ID

`2026-06-06-intelligence-pattern-graph-tenant-label`

## Status

`candidate`

## Plain-English Summary

This release fixes tenant-copy leaks found during the Lakeshore live module crawl and follow-up Intelligence route sweep. The `/intelligence/patterns` page correctly resolved Lakeshore for the tenant identity strip, but the Pattern Graph shell still hard-coded the Apex Retail fixture label in the app top bar. Adjacent Intelligence topic and failure-mode routes also resolved the active tenant for telemetry while rendering Apex in the shell. These shells now use the active tenant name and fall back to a neutral label when no tenant is resolved.

## Layer Impact

- `global-control-lane`: Shared Intelligence Pattern Graph shell behavior changes for every client.
- `public-demo`: Improves Lakeshore demo readiness by removing cross-client fixture copy from a signed-in Lakeshore route.

## Client Applicability

- All clients: Pattern Graph top-bar tenant copy now follows the active tenant instead of Apex.
- Specific clients: Lakeshore benefits immediately for the live Kyriba demo flow.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Threads `activeClient.name` from `/intelligence/patterns` into `PatternGraphShell`.
- Replaces the hard-coded `Apex Retail Group` top-bar label with the active tenant name.
- Replaces hard-coded Apex top-bar labels on `/intelligence/topics`, `/intelligence/topics/[topicId]`, and `/intelligence/failure-modes/[slug]` with the active tenant name.
- Adds a focused regression test proving `PatternGraphShell` renders `Lakeshore Holdings` and not the Apex fixture label when passed a Lakeshore tenant name.

## QA / Validation

- `npx jest src/components/intelligence/__tests__/PatternGraphShell.tenant.test.tsx --runInBand` — passed.
- `npx eslint src/app/intelligence/patterns/page.tsx src/app/intelligence/topics/page.tsx 'src/app/intelligence/topics/[topicId]/page.tsx' 'src/app/intelligence/failure-modes/[slug]/page.tsx' src/components/intelligence/PatternGraphShell.tsx src/components/intelligence/__tests__/PatternGraphShell.tenant.test.tsx` — passed.

## Rollout Plan

Merge to main, deploy the Vercel production app, and rerun the Lakeshore live module crawl for `/intelligence/patterns?client=lakeshore` plus the adjacent Intelligence topic and failure-mode routes to confirm they render `Lakeshore Holdings` with no Apex copy.

## Rollback Plan

Revert the PR. Rollback would restore the prior hard-coded Pattern Graph shell label, so it should only be used if the active-client resolution causes a production regression.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/3175.
- Pre-fix proof: `/Users/anand/Projects/nexus/reports/lakeshore-route-module-proof/lakeshore-live-module-crawl-2026-06-06T07-23-11-543Z/LIVE_MODULE_CRAWL_REPORT.md`.
- Local QA commands listed above.

## Known Gaps

- Pattern Graph data remains a deterministic seed graph; this release only fixes tenant display correctness.
