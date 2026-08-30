# 2026-08-30-source-360-six-tab-route — Source 360 Design Contract Route

## Release ID

`2026-08-30-source-360-six-tab-route`

## Status

`candidate`

## Plain-English Summary

Adds a first-class Source 360 route that mounts the governed Source workspace substrate with the executive six-tab structure from the current design contract. The route exposes Verdict, Vendors, Contracts, Optimize, Evidence, and Contract graph without changing the underlying tenant data or running any data-plane mutation.

## Layer Impact

Layer 4 Products / `global-control-lane`: Source renders an additional product route and expands the executive shell navigation so evidence and graph views are visible as first-class tabs.

Layers 1-3: No change. No intake files, adapters, canonical tables, loaders, or tenant rows are changed.

## Client Applicability

- All clients: Source users with access to the Source module can load the new route.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Adds `/source/360` as a first-class route that reuses the governed Source workspace read path.
- Expands the Source executive shell to six top-level tabs.
- Adds Evidence and Contract graph product panels backed by existing Source workspace data.
- Adds a claim-contract guard strip tied to the active tab.
- Adds focused route/design-contract tests.

## QA / Validation

- PASS: `npx jest --runTestsByPath src/app/(maestro)/source/__tests__/tenant-resolution-source-contract.test.ts src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceExecutiveShell.performance.test.ts --runInBand`
- PASS: `npx eslint src/app/(maestro)/source/360/page.tsx src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx src/app/(maestro)/source/__tests__/tenant-resolution-source-contract.test.ts`
- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false`
- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npm run build` confirmed `/source/360` is registered as a dynamic app route.

Signed-in browser proof will be attached after ACA deploy.

## Rollout Plan

Open a PR, squash merge to main, and let the repo-owned Azure Container Apps main deploy workflow build and deploy the exact main SHA.

## Deployment Authority

- Repo-owned deploy workflow: Required for production.
- Shared runtime mutators: None in this change.
- Approved image digest: To be recorded after ACA deploy.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, for `/source/360`.

## Rollback Plan

Revert the Source 360 route and executive shell navigation changes, then redeploy through the same ACA main workflow. No data rollback is required because this release does not mutate data.

## Audit Evidence

PR, CI/deploy run, ACA runtime invariant, and signed-in browser screenshots for `/source/360`.

## Known Gaps

This does not add new Source data. Finance confirmation, page-span retrieval proof, live adversarial aVa chat proof, and first-class change-order object cutover remain separate work.
