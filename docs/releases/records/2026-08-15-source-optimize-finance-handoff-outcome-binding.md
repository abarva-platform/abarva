# 2026-08-15-source-optimize-finance-handoff-outcome-binding — Source Optimize Finance Handoff Outcome Binding

## Release ID

`2026-08-15-source-optimize-finance-handoff-outcome-binding`

## Status

`candidate`

## Plain-English Summary

Source Optimize now sends Finance/Tower confirmation handoff actions to the opportunity that already has the agreed negotiated outcome. This prevents an otherwise valid optimization case from being blocked because the UI or operator reused a different currently highlighted opportunity in the same case.

The change does not create realized value. It only allows the existing handoff gate to create a pending Finance/Tower confirmation request after an agreed outcome exists.

## Layer Impact

- Layer 3 Canonical Model: no schema change. Existing `source.negotiated_outcome` and `source.approval_request` rows remain the governed workflow state.
- Layer 4 Products, Source: the Source Optimize action panel and operator script now bind the handoff request to the agreed-outcome opportunity.
- global-control-lane: shared Source Optimize behavior changes for every tenant using the common optimization spine; no tenant-specific code path was added.

## Client Applicability

- All clients: tenants using Source Optimize and the governed commercial opportunity spine receive the action-binding fix.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `scripts/source/request-contract-optimization-finance-handoff.ts`
- `src/components/source/SourceOptimizeContractPage.tsx`
- `src/components/source/__tests__/SourceOptimizeContractPage.test.tsx`

## QA / Validation

Passed locally before PR creation:

- `npx tsc --noEmit --pretty false` — pass.
- `npx eslint scripts/source/request-contract-optimization-finance-handoff.ts src/components/source/SourceOptimizeContractPage.tsx src/components/source/__tests__/SourceOptimizeContractPage.test.tsx` — pass.
- `npx jest src/components/source/__tests__/SourceOptimizeContractPage.test.tsx src/lib/source/data-model/__tests__/contract-optimization-workflow-actions.test.ts 'src/app/api/source/optimize/contract/[contractId]/workflow/__tests__/route.test.ts' --runInBand` — pass. Jest reported existing duplicate manual mock warnings only.
- The Jest suite includes a regression where the selected UI opportunity differs from the agreed-outcome opportunity and the Finance/Tower request uses the agreed-outcome opportunity.
- `npm run release:check` — pending after this record format update.

Not yet run:

- ACA runtime invariant after deploy.
- Operator plan/apply after deploy.
- Post-apply data readback.
- Signed-in browser proof.

## Rollout Plan

Open a PR and merge through the protected repository lane. The repo-owned ACA main deploy workflow builds and deploys the shared web image. After deployment, rerun the Finance/Tower handoff operator plan, apply only if the plan proves the intended row, then read back the governed spine.

## Deployment Authority

- Repo-owned deploy workflow: required for shared web runtime.
- Shared runtime mutators: not allowed from this branch or local shell.
- Approved image digest: to be captured from the ACA deploy workflow after merge.
- ACA runtime invariant: required before claiming live.
- Worker image invariant: required before claiming live where applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, for the Source Optimize page once browser access is available.

## Rollback Plan

Revert the PR. The previous behavior returns, where Finance/Tower handoff actions may bind to the currently selected opportunity rather than the agreed-outcome opportunity.

## Audit Evidence

- PR URL: pending.
- Local validation output: commands listed above.
- Deployment run: pending.
- Operator proof bundle: pending.
- Readback proof bundle: pending.
- Browser proof: pending.

## Known Gaps

Live proof is pending until the PR is merged, deployed through the repo-owned ACA workflow, and the operator plan/apply/readback sequence is rerun against the deployed image.
