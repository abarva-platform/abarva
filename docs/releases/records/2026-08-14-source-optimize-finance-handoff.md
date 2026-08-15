# 2026-08-14-source-optimize-finance-handoff — Source Optimize Finance Handoff

## Release ID

`2026-08-14-source-optimize-finance-handoff`

## Status

`live-proven`

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
- Pass: ACA private operator execution
  `job-abarva-private-operator-eus-wf3w72o` read back one pending
  `finance_value_confirmation` approval request and latest case state
  `finance_handoff` for the ready-baseline canary contract.
- Pass: the same readback kept the finance-realization row count separate from
  the pending handoff request; no realized-value amount was created by the
  handoff state.
- Pass: signed-in browser proof showed the Optimize workflow stopped at the
  Finance/Tower confirmation gate, with downstream value proof still pending.

## Rollout Plan

Merge through the protected GitHub PR lane. The repo-owned Azure Container Apps main deploy workflow builds and deploys the new image to the shared Product/Lab runtime. No data job, migration, feature flag, or manual runtime mutation is required.

## Deployment Authority

- Repo-owned deploy workflow: required after merge.
- Shared runtime mutators: none outside the repo-owned workflow.
- Approved image digest:
  `acrabarvalab001.azurecr.io/abarva/web@sha256:f9e9109e2914fcfb186ee49aef24a0e4c20a3dccc7b17a9eac232af125a43f71`.
- ACA runtime invariant: proved on revision
  `ca-abarva-web-lab-eastus--m8dc5e2c5` with 100% traffic.
- Worker image invariant: delivery worker images matched the deployed web
  digest during post-deploy readback.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: yes, for the Source Optimize Finance/Tower handoff action after an agreed outcome.

## Rollback Plan

Revert the PR and redeploy through the same repo-owned ACA workflow. Because this release uses existing tables and changes only Source workflow behavior, rollback does not require database rollback.

## Audit Evidence

- PR/deployment lane evidence: deployed through repo-owned ACA deployment run
  `31886533505`.
- Focused test, lint, and typecheck commands are listed above.
- ACA runtime invariant, private-operator readback
  `job-abarva-private-operator-eus-wf3w72o`, and signed-in browser proof were
  captured after deploy.

## Known Gaps

- This release does not create finance-realization rows, Tower claim references, or realized-value amounts.
- Finance/Tower confirmation remains a separate evidence-backed step. Missing
  confirmation still renders as pending, not zero.
