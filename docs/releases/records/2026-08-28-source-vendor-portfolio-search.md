# 2026-08-28-source-vendor-portfolio-search — Source Vendor Portfolio Search

## Release ID

`2026-08-28-source-vendor-portfolio-search`

## Status

`candidate`

## Plain-English Summary

The Source workspace vendor portfolio now includes a search box so operators can quickly narrow the vendor rollup table before opening a vendor detail view. The search filters only the already-loaded browser rows and does not change data reads, writes, or tenant resolution.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 Products: Source workspace UI only. The change improves navigation over existing vendor portfolio projection rows without changing Layer 3 canonical records or Layer 2 adapters.

## Client Applicability

- All clients: Yes, wherever the Source workspace vendor portfolio surface is enabled.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Source workspace availability only.

## Changes Included

- `src/app/(maestro)/source/preview/workspace/lenses/ListLens.tsx`
- `src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx`

## QA / Validation

- Pass: `npm test -- --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx' --runInBand`
- Pass: `npx eslint src/app/'(maestro)'/source/preview/workspace/lenses/ListLens.tsx src/app/'(maestro)'/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx`
- Pass: `npx prettier --check src/app/'(maestro)'/source/preview/workspace/lenses/ListLens.tsx src/app/'(maestro)'/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx docs/releases/records/2026-08-28-source-vendor-portfolio-search.md`
- Pass: `npm run release:check`
- Not run yet: post-deploy signed-in Source workspace clickthrough proof. This is required after merge and ACA deployment.

## Rollout Plan

Open a pull request, merge through the protected repository flow, and let the repo-owned Azure Container Apps main deploy workflow publish the new shared web image.

## Deployment Authority

- Repo-owned deploy workflow: Required for production rollout.
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Resolved by the repo-owned deploy workflow.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required by the repo-owned deploy workflow.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Source workspace vendor portfolio clickthrough.

## Rollback Plan

Revert the UI commit or roll back to the previous ACA image through the approved deployment lane.

## Audit Evidence

PR URL, CI checks, ACA deploy run, runtime invariant evidence, and signed-in Source workspace clickthrough proof.

## Known Gaps

The search is intentionally browser-local and filters the vendor rows already loaded into the Source workspace. It does not add server-side pagination, saved filters, category facets, or new data access behavior.
