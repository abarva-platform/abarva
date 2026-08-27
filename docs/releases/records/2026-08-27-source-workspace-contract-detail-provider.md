# 2026-08-27-source-workspace-contract-detail-provider — Source Workspace Contract Detail Provider Routing

## Release ID

`2026-08-27-source-workspace-contract-detail-provider`

## Status

`candidate`

## Plain-English Summary

Source Workspace contract detail pages now preserve the same provider context used by the portfolio page when loading per-contract detail. If the canonical contract-detail read path does not have a row but the active authorized workspace provider does, the detail route can hydrate the contract page from that provider instead of rendering a misleading load failure.

## Layer Impact

Lane: `global-control-lane`.

Products: Source Workspace carries active client and provider context into lazy contract-detail and workflow-start API calls.

Source adapters: The contract-detail and workflow-start routes can read the active workspace provider as a fallback after tenant authorization succeeds.

Canonical model: No schema or canonical data changes.

## Client Applicability

- All clients: Source Workspace users who open contract detail from a provider-backed workspace.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

Workspace client routing, Source Workspace server page provider handoff, contract-detail API provider fallback, workflow-start API provider fallback, and focused route/workspace tests.

## QA / Validation

Focused Jest route/workspace tests pass:

`/Users/anand/Projects/nexus/node_modules/.bin/jest --runTestsByPath 'src/app/api/source/workspace/contract/[contractId]/__tests__/route.test.ts' 'src/app/(maestro)/source/preview/workspace/__tests__/workspace-explicit-client-api-routing.test.ts' 'src/app/api/source/workspace/contract/[contractId]/optimization/__tests__/route.test.ts' --runInBand --verbose=false`

Additional scoped lint, TypeScript, release check, diff check, PR checks, ACA deploy workflow, and live signed-in proof are required before release.

## Rollout Plan

Merge to main through a protected GitHub PR. The repo-owned Azure Container Apps main deploy workflow builds and deploys the resulting web image. After deployment, perform signed-in Source Workspace proof for provider-backed contract detail loads and tenant-denied client requests.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None outside the repo-owned deploy workflow.
- Approved image digest: To be produced by the deploy workflow.
- ACA runtime invariant: Required after deployment.
- Worker image invariant: Required after deployment if worker jobs are updated by the workflow.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the PR and redeploy main through the repo-owned Azure Container Apps workflow. No data rollback is required because this release does not mutate stored data or schema.

## Audit Evidence

Inspect the PR, focused test output, release check output, ACA deployment workflow run, runtime invariant proof, and signed-in browser/network proof for contract-detail API responses.

## Known Gaps

No tenant data is changed by this release. Live signed-in proof remains required before claiming the provider-backed detail path is active in production.
