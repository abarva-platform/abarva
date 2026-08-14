# 2026-08-14-source-optimize-finance-handoff — Source Optimize Finance Handoff

## Release ID

`2026-08-14-source-optimize-finance-handoff`

## Status

`candidate`

## Plain-English Summary

Source Optimize can now create the governed handoff request that follows an agreed vendor outcome and precedes any realized-value claim. The page exposes a Finance/Tower confirmation action only after the strategy approval and negotiated-outcome gates are complete. The action updates the optimization case to `finance_handoff` and writes a pending `finance_value_confirmation` request; it does not create realized value or finance-realization rows.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 — Source product projection: adds a Finance/Tower confirmation action to the Optimize Contract workflow panel.
- Layer 3 — Canonical model: writes to existing `source.approval_request` and `source.optimization_case` records. No schema or migration changes.

## Client Applicability

- All clients: yes, for tenants with Source Optimize enabled and governed opportunity data.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none changed.

## Changes Included

- `src/lib/source/data-model/contract-optimization-workflow-actions.ts`
- `src/app/api/source/optimize/contract/[contractId]/workflow/route.ts`
- `src/components/source/SourceOptimizeContractPage.tsx`
- `src/lib/source/data-model/__tests__/contract-optimization-workflow-actions.test.ts`
- `src/app/api/source/optimize/contract/[contractId]/workflow/__tests__/route.test.ts`
- `src/components/source/__tests__/SourceOptimizeContractPage.test.tsx`

## QA / Validation

- Focused Jest suite passed:
  `npx jest src/lib/source/data-model/__tests__/contract-optimization-workflow-actions.test.ts --runInBand`
  - Result: 1 suite passed, 6 tests passed.
  - Note: Jest printed pre-existing duplicate manual mock warnings for Markdown-related mocks.
- Focused Jest suite passed:
  `npx jest --runTestsByPath 'src/app/api/source/optimize/contract/[contractId]/workflow/__tests__/route.test.ts' --runInBand`
  - Result: 1 suite passed, 4 tests passed.
  - Note: Jest printed pre-existing duplicate manual mock warnings for Markdown-related mocks.
- Focused Jest suite passed:
  `npx jest src/components/source/__tests__/SourceOptimizeContractPage.test.tsx --runInBand`
  - Result: 1 suite passed, 14 tests passed.
  - Note: Jest printed pre-existing duplicate manual mock warnings for Markdown-related mocks.
- ESLint passed:
  `npx eslint src/lib/source/data-model/contract-optimization-workflow-actions.ts 'src/app/api/source/optimize/contract/[contractId]/workflow/route.ts' src/components/source/SourceOptimizeContractPage.tsx src/lib/source/data-model/__tests__/contract-optimization-workflow-actions.test.ts 'src/app/api/source/optimize/contract/[contractId]/workflow/__tests__/route.test.ts' src/components/source/__tests__/SourceOptimizeContractPage.test.tsx`
- TypeScript passed:
  `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit --pretty false`

## Rollout Plan

Merge through the protected GitHub PR lane. The repo-owned Azure Container Apps main deploy workflow builds and deploys the new image to the shared Product/Lab runtime. No data job, migration, feature flag, or manual runtime mutation is required.

## Deployment Authority

- Repo-owned deploy workflow: required after merge.
- Shared runtime mutators: none outside the repo-owned workflow.
- Approved image digest: pending deploy.
- ACA runtime invariant: pending deploy proof.
- Worker image invariant: pending deploy proof from the repo-owned workflow.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: yes, for the Source Optimize Finance/Tower handoff action after an agreed outcome.

## Rollback Plan

Revert the PR and redeploy through the same repo-owned ACA workflow. Because this release uses existing tables and changes only Source workflow behavior, rollback does not require database rollback.

## Audit Evidence

- PR URL: pending.
- Focused test, lint, and typecheck commands are listed above.
- ACA workflow run, runtime invariant, and signed-in browser proof to be attached after merge/deploy.

## Known Gaps

- This release does not create finance-realization rows, Tower claim references, or realized-value amounts.
- Finance/Tower confirmation remains a separate evidence-backed step. Missing confirmation must still render as pending, not zero.
