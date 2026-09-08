# 2026-09-08-source-workspace-impact-timing — Source Impact Read Timing

## Release ID

`2026-09-08-source-workspace-impact-timing`

## Status

`candidate`

## Plain-English Summary

Adds server-side timing metadata to the Source workspace impact-scope API response so operators can identify which governed read path is responsible for slow initial-load behavior. The change does not alter visible UI content, records, or calculation logic.

## Layer Impact

- Layer 4 PRODUCTS, lane `global-control-lane`: Source workspace portfolio API now emits compact per-read timing diagnostics on the existing impact-scope response.

No Layer 1, Layer 2, or Layer 3 data mutation is included.

## Client Applicability

- All clients: Source workspace routes using the portfolio API.
- Specific clients: None.
- Internal only: Timing metadata is operator diagnostic evidence.
- Public/demo only: None.
- Feature flag: Existing Source workspace provider flags continue to control the read provider.

## Changes Included

- `src/app/api/source/workspace/portfolio/route.ts`
- `src/app/(maestro)/source/preview/workspace/live/portfolioAdapter.ts`
- `src/app/(maestro)/source/preview/workspace/__tests__/page-tenant-routing.test.ts`

## QA / Validation

- `npm test -- page-tenant-routing.test.ts --runInBand` passed.
- `npm test -- portfolioAdapter.ecl.test.ts --runInBand` passed.
- `npx eslint src/app/(maestro)/source/preview/workspace/live/portfolioAdapter.ts src/app/api/source/workspace/portfolio/route.ts src/app/(maestro)/source/preview/workspace/__tests__/page-tenant-routing.test.ts` passed.
- `npx tsc --noEmit --pretty false` passed.

## Rollout Plan

Merge by PR to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the approved image. After deployment, capture the impact-scope API response headers and JSON timing metadata from the live product route.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None in this change.
- Approved image digest: Set by the repo-owned deploy workflow.
- ACA runtime invariant: Required after deploy before claiming live status.
- Worker image invariant: Required after deploy before claiming live status.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, capture the Source workspace impact-scope response and verify timing metadata is present with clean page content.

## Rollback Plan

Revert the PR and redeploy through the repo-owned Azure Container Apps main deploy workflow. The API returns to total-load timing only.

## Audit Evidence

PR URL, CI checks, deploy workflow run, ACA revision/digest proof, live impact-scope API timing capture, and signed-in Source workspace content check.

## Known Gaps

This release identifies the slow read path. It does not by itself optimize the underlying database view or query.
