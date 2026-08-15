# 2026-08-15-source-optimize-target-selection — Source Optimize approval target selection

## Release ID

`2026-08-15-source-optimize-target-selection`

## Status

`live-proven`

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
- Live signed-in browser proof after ACA deployment: direct `/source/optimize?contractId=CTR-090` selected the governed traceable opportunity and advanced to the correct value-proof gate.

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps main deploy workflow builds and deploys the digest-pinned web image.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none outside the repo-owned deploy workflow.
- Approved image digest: `acrabarvalab001.azurecr.io/abarva/web@sha256:49cbbda5bfeebcbc64c2d50f2b992de784620933c7c2d9aa64a9b4186b842228`.
- ACA runtime invariant: proven on `ca-abarva-web-lab-eastus--m36cd2c7f` with 100% traffic.
- Worker image invariant: delivery worker jobs matched the same approved digest; historical jobs are outside this release proof.
- Feature/env flag update path: none.
- Live signed-in proof required: completed.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA workflow. No data rollback is required because this changes selection behavior only.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/6359
- Merge commit: `8dc5e2c564f3c512c2a6873ed0c077150fad21f4`
- ACA deployment run: `31886533505`
- Runtime revision: `ca-abarva-web-lab-eastus--m36cd2c7f`
- Signed-in browser proof: `/source/optimize?contractId=CTR-090` rendered `Selected opportunity: Negotiated improvement` and `Step 7 of 7`.
- Local test output for the focused read-adapter regression.

## Known Gaps

This release only chooses the active opportunity for the Optimize workflow. It does not create new opportunity rows or change the amount calculation model.
