# 2026-09-08-source-workspace-impact-slice - Source Workspace Impact Slice Response

## Release ID

`2026-09-08-source-workspace-impact-slice`

## Status

`candidate`

## Plain-English Summary

The Source workspace now hydrates its detailed impact panels with an impact-only API response. The initial portfolio read still returns the contract book needed for immediate render; the follow-up read now returns only the impact layer and merges it into the existing page state.

## Layer Impact

- Layer 4 PRODUCTS, lane `global-control-lane`: changes the Source workspace API response shape used by the browser hydration path. It does not change schemas, records, calculations, or client-owned records.

## Client Applicability

- All clients: Source workspace impact hydration uses the smaller response shape.
- Specific clients: None.
- Internal only: None.
- Public/demo only: None.
- Feature flag: Existing Source workspace provider selection remains unchanged.

## Changes Included

- `src/app/api/source/workspace/portfolio/route.ts`: adds `scope=impact` for an impact-only response and keeps the existing portfolio response backward-compatible.
- `src/app/(maestro)/source/workspace/WorkspaceClientLoader.tsx`: requests the impact-only response for detailed hydration and merges it into the deferred portfolio state.
- `src/app/(maestro)/source/preview/workspace/live/portfolioAdapter.ts`: adds a server helper that reads and vendor-name-resolves only the impact layer.
- `src/app/(maestro)/source/preview/workspace/__tests__/page-tenant-routing.test.ts`: locks the impact-only hydration contract.

## QA / Validation

- PASS: `npm test -- page-tenant-routing.test.ts --runInBand`
- PASS: `npm test -- portfolioAdapter.ecl.test.ts --runInBand`
- PASS: `npm test -- WorkspaceClient.ecl-browser.test.tsx --runInBand`
- PASS: `npm test -- WorkspaceExecutiveShell.performance.test.ts --runInBand`
- PASS: `npm run test:nav -- --runInBand`
- PASS: `npx tsc --noEmit --pretty false`
- PASS: `npx eslint src/app/api/source/workspace/portfolio/route.ts src/app/(maestro)/source/workspace/WorkspaceClientLoader.tsx src/app/(maestro)/source/preview/workspace/live/portfolioAdapter.ts src/app/(maestro)/source/preview/workspace/__tests__/page-tenant-routing.test.ts`
- BLOCKED until after merge/deploy: signed-in production timing proof.

## Rollout Plan

Merge through pull request, then activate through the repo-owned Azure Container Apps main deploy workflow.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the deploy workflow
- Approved image digest: assigned by the deploy workflow after merge
- ACA runtime invariant: required before live-proof claim
- Worker image invariant: required before live-proof claim
- Feature/env flag update path: none
- Live signed-in proof required: yes, Source workspace load timing and content integrity

## Rollback Plan

Revert the pull request and redeploy through the repo-owned ACA main deploy workflow. No data rollback is required.

## Audit Evidence

- Pull request URL and CI checks.
- ACA deployment artifact with image digest, revision, traffic, health, and runtime invariant.
- Signed-in Source workspace network proof showing the impact-only response size, timing, and page content integrity.

## Known Gaps

This release reduces duplicate response payload bytes. If the remaining delay is dominated by database view runtime, a follow-up release should add per-view server timing and consolidate expensive view reads.
