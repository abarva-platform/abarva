# 2026-08-15-source-workspace-contract-deeplink — Source Workspace Contract Deep Link

## Release ID

`2026-08-15-source-workspace-contract-deeplink`

## Status

`candidate`

## Plain-English Summary

Source workspace links that include a contract id now open directly into the selected Contract 360 view instead of landing on the portfolio canvas. This keeps a user who is handed off from an optimization workflow or direct link on the contract they intended to inspect.

## Layer Impact

- Release lane: `global-control-lane`.
- PRODUCTS: Updates the Source workspace route and client state initialization so product navigation preserves the requested contract context.
- CANONICAL MODEL: No change. The same Source read models and contract detail fetch remain authoritative.

## Client Applicability

- All clients: Source workspace users who navigate with a contract id in the URL.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Source workspace route accepts `contractId`, `tab`, and `contractTab` query parameters.
- Source workspace client initializes the selected contract state from the query parameters.
- Source workspace client fetches the selected contract detail on initial load.
- Unit coverage for route threading and Contract 360 initial state.

## QA / Validation

- `npm test -- --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/viewModel.explore.test.ts' 'src/app/(maestro)/source/preview/workspace/__tests__/page-tenant-routing.test.ts' --runInBand` passed.
- `npx eslint 'src/app/(maestro)/source/preview/workspace/page.tsx' 'src/app/(maestro)/source/preview/workspace/WorkspaceClient.tsx' 'src/app/(maestro)/source/preview/workspace/viewModel.tsx' 'src/app/(maestro)/source/preview/workspace/__tests__/page-tenant-routing.test.ts' 'src/app/(maestro)/source/preview/workspace/__tests__/viewModel.explore.test.ts'` passed.
- `npx tsc --noEmit --pretty false` pending before merge.
- Live signed-in browser proof pending after ACA deployment.

## Rollout Plan

Merge to `main`, let the repo-owned Azure Container Apps main deploy workflow build and deploy the digest-pinned image, then verify the live route with a signed-in browser session.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: Not used by this release.
- Approved image digest: Pending repo-owned deploy workflow.
- ACA runtime invariant: Pending after deploy.
- Worker image invariant: Pending after deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the PR and allow the repo-owned ACA deploy workflow to publish the previous behavior. No schema, data, feature flag, or migration rollback is required.

## Audit Evidence

- PR URL: Pending.
- Repo-owned ACA deploy run: Pending.
- ACA runtime invariant proof: Pending.
- Signed-in browser screenshot/text proof: Pending.

## Known Gaps

None known for this narrow navigation fix. This release does not change Contract 360 data quality, calculation traceability, or optimization workflow semantics.
