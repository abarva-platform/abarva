# 2026-08-15-source-optimize-target-selection — Source Optimize approval target selection

## Release ID

`2026-08-15-source-optimize-target-selection`

## Status

`candidate`

## Plain-English Summary

The Optimize Contract read model now selects the opportunity that matches the current workflow action. If an approval or outcome already exists, the page keeps that opportunity selected. If no workflow artifact exists yet, the page selects an approval-ready target position before falling back to diagnostic opportunity rows. This prevents the strategy approval action from being shown against a diagnostic row that cannot create an approval request.

## Layer Impact

- `global-control-lane`: updates shared Source Optimize Contract projection/read selection behavior for the workflow surface.
- Layer 4 Products: updates the Source Optimize Contract projection/read selection behavior only.
- Layer 3 Canonical Enterprise Model: no schema, data, metric, or canonical fact changes.

## Client Applicability

- All clients: yes, for tenants using the Source Optimize Contract projection.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: existing Source Optimize route availability only; no new flag.

## Changes Included

- `src/lib/source/data-model/read-adapter.ts`
- `src/lib/source/data-model/__tests__/read-adapter.contract-optimization.test.ts`

## QA / Validation

- `npm test -- --runTestsByPath src/lib/source/data-model/__tests__/read-adapter.contract-optimization.test.ts --runInBand` passed.
- `npx eslint src/lib/source/data-model/read-adapter.ts src/lib/source/data-model/__tests__/read-adapter.contract-optimization.test.ts` passed.
- `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit --pretty false` passed.

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps main deploy workflow builds and deploys the digest-pinned web image.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none outside the repo-owned deploy workflow.
- Approved image digest: assigned by the repo-owned deploy workflow.
- ACA runtime invariant: required before claiming live.
- Worker image invariant: required before claiming live.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA workflow. No data rollback is required because this changes selection behavior only.

## Audit Evidence

- PR URL: pending.
- Local test output for the focused read-adapter regression.
- ACA workflow and live signed-in proof after merge.

## Known Gaps

Pending release checks, PR review/merge, ACA deploy, and live signed-in proof.
