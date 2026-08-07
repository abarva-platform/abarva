# 2026-08-07-source-door1-exact-contract-routing — Source Door 1 Contract Routing Guard

## Release ID

`2026-08-07-source-door1-exact-contract-routing`

## Status

`candidate`

## Plain-English Summary

The Source workspace now opens a Door 1 optimization workflow only when the existing or newly created event matches the selected contract, vendor, and contract name. A stale event that merely mentions the same contract reference is rejected instead of sending the user to the wrong approval brief.

## Layer Impact

Lane: `global-control-lane`.

Products: Source Contract 360 and the Source event approval path receive a routing guard and clearer CTA language.

Source adapters / canonical model: No schema, loader, cube, or tenant data changes.

## Client Applicability

- All clients: Yes, for tenants using the Source workspace contract optimization entry point.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Source workspace availability controls apply.

## Changes Included

- Guarded `/api/source/workspace/contract/[contractId]/optimization` so an event can be reused only when it is explicitly scoped to the selected contract identity.
- Returned contract identity in the route response and added a client-side mismatch check before navigation.
- Aligned the overview CTA label with the optimization cockpit wording.
- Added focused route helper tests for stale-event rejection and correct event identity generation.

## QA / Validation

- Pass: `npx jest --runTestsByPath 'src/app/api/source/workspace/contract/[contractId]/optimization/__tests__/route.test.ts' --runInBand`.
- Pass: `npx eslint 'src/app/api/source/workspace/contract/[contractId]/optimization/route.ts' 'src/app/api/source/workspace/contract/[contractId]/optimization/__tests__/route.test.ts' 'src/app/(maestro)/source/preview/workspace/WorkspaceClient.tsx' 'src/app/(maestro)/source/preview/workspace/canvases/ContractCanvas.tsx'`.
- Pass: `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit --pretty false`.
- Pass: `npm run release:check`.
- Pending: Signed-in browser proof after deploy: launch Door 1 from a contract and verify the approval brief names the same vendor and contract.

## Rollout Plan

Merge to main through the normal PR path. The repo-owned Azure Container Apps deploy workflow builds and deploys the main image. No manual data migration is required.

## Deployment Authority

- Repo-owned deploy workflow: Required for production activation.
- Shared runtime mutators: None.
- Approved image digest: To be captured by the deployment workflow.
- ACA runtime invariant: Required before claiming live.
- Worker image invariant: Not applicable.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes, Source workspace contract optimization route and approval page.

## Rollback Plan

Revert the PR or roll back the ACA web revision to the previous approved digest. No data rollback is required for this code-only routing guard.

## Audit Evidence

- PR URL and merge commit.
- Jest, lint, TypeScript, and release-check output.
- ACA deployment evidence.
- Signed-in browser proof of the contract-to-Door-1 route.

## Known Gaps

This release does not delete any pre-existing stale workflow events. It prevents the Source workspace from reusing them for the wrong selected contract.
