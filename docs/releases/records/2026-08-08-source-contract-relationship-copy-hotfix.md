# 2026-08-08-source-contract-relationship-copy-hotfix — Polish Contract Optimization Relationship Copy

## Release ID

`2026-08-08-source-contract-relationship-copy-hotfix`

## Status

`candidate`

## Plain-English Summary

The Source Contract 360 relationship map now uses client-facing business language for the contract optimization path. It removes an internal workflow nickname from the visible graph copy and replaces it with approval and optimization wording.

## Layer Impact

Release lane: `global-control-lane`.

Products: updates the Source Contract 360 canvas copy only. No data, schema, tenancy, retrieval, calculations, or write behavior changes.

## Client Applicability

All clients: receives the Source UI copy correction where the contract optimization canvas is enabled.

Specific clients: none.

Internal only: none.

Public/demo only: none.

Feature flag: follows existing Source surface availability.

## Changes Included

- `src/app/(maestro)/source/preview/workspace/canvases/ContractCanvas.tsx`: replaces visible internal workflow wording with approval and optimization language.

## QA / Validation

- pass: `npx eslint src/app/'(maestro)'/source/preview/workspace/canvases/ContractCanvas.tsx src/app/'(maestro)'/source/preview/workspace/__tests__/buildViewModel.numeric.test.ts`.
- pass: `npm test -- --runTestsByPath src/app/'(maestro)'/source/preview/workspace/__tests__/buildViewModel.numeric.test.ts`.
- pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`.
- pass: active Source UI wording scan found no retired workflow phrase in `src/app/(maestro)/source/preview/workspace` or `src/components/source`.
- pass: `npm run release:check`.
- pending: signed-in live proof after ACA deploy.

## Rollout Plan

Merge to `main` through PR. The repo-owned ACA main deploy workflow builds and deploys the digest-pinned image, then shifts shared app traffic after its invariant checks pass.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside the approved workflow.
- Approved image digest: pending deploy.
- ACA runtime invariant: pending deploy.
- Worker image invariant: pending deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, for the Source Contract 360 optimization path.

## Rollback Plan

Revert the PR and allow the repo-owned ACA main deploy workflow to publish the prior Source copy. No data rollback is required.

## Audit Evidence

- PR URL: pending.
- CI: pending.
- ACA deploy run: pending.
- Live proof: pending.

## Known Gaps

Internal module names and historical documents may still reference the internal workflow nickname. This release addresses active client-facing Source canvas copy only.
