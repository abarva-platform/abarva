# 2026-08-14-source-optimize-approval-substrate — Source Optimize Approval Substrate

## Release ID

`2026-08-14-source-optimize-approval-substrate`

## Status

`live-proven`

## Plain-English Summary

Source Optimize can now persist the governed lifecycle records that sit between a calculated negotiation target and any claimed outcome. When a contract reaches the strategy step, an authorized user can create a strategy approval request, record an approval or send-back decision, and record that a negotiated outcome exists. The change does not create realized value, does not invent savings, and does not bypass missing-baseline or baseline-conflict gates.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 — Source product projection: adds a compact workflow action panel to the Optimize Contract page and a server route for lifecycle actions.
- Layer 3 — Canonical model: writes to existing Source approval-request, approval-decision, negotiated-outcome, and optimization-case records. No schema or migration changes.

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
  `npm test -- --runTestsByPath src/lib/source/data-model/__tests__/contract-optimization-workflow-actions.test.ts src/components/source/__tests__/SourceOptimizeContractPage.test.tsx 'src/app/api/source/optimize/contract/[contractId]/workflow/__tests__/route.test.ts' --runInBand`
  - Result: 3 suites passed, 20 tests passed.
  - Note: Jest printed pre-existing duplicate manual mock warnings for Markdown-related mocks.
- ESLint passed:
  `npx eslint src/lib/source/data-model/contract-optimization-workflow-actions.ts src/app/api/source/optimize/contract/'[contractId]'/workflow/route.ts src/app/api/source/optimize/contract/'[contractId]'/workflow/__tests__/route.test.ts src/components/source/SourceOptimizeContractPage.tsx src/components/source/__tests__/SourceOptimizeContractPage.test.tsx src/lib/source/data-model/__tests__/contract-optimization-workflow-actions.test.ts`
- TypeScript passed:
  `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit --pretty false`
- Runtime readback passed through ACA private operator execution
  `job-abarva-private-operator-eus-wf3w72o`: the ready-baseline canary contract
  reported a persisted optimization case, one approved
  `vendor_outreach_strategy` request, one approval decision, and one
  negotiated outcome.
- Runtime readback passed for the conflict branch: the conflict-baseline canary
  contract remained blocked by a governed baseline conflict and did not advance
  into strategy approval.
- Signed-in browser proof showed the ready-baseline canary route past the
  strategy and approval gates and stopped at the Finance/Tower confirmation
  gate, rather than claiming realized value.

## Rollout Plan

Merge through the protected GitHub PR lane. The repo-owned Azure Container Apps main deploy workflow builds and deploys the new image to the shared Product/Lab runtime. No data job, migration, feature flag, or manual runtime mutation is required.

## Deployment Authority

- Repo-owned deploy workflow: required after merge.
- Shared runtime mutators: none outside the repo-owned workflow.
- Approved image digest:
  `acrabarvalab001.azurecr.io/abarva/web@sha256:f9e9109e2914fcfb186ee49aef24a0e4c20a3dccc7b17a9eac232af125a43f71`.
- ACA runtime invariant: proved on revision
  `ca-abarva-web-lab-eastus--m8dc5e2c5` with 100% traffic.
- Worker image invariant: not applicable.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: yes, for the Source Optimize lifecycle action on a strategy-ready contract.

## Rollback Plan

Revert the PR and redeploy through the same repo-owned ACA workflow. Because this release uses existing tables and changes only Source workflow behavior, rollback does not require database rollback.

## Audit Evidence

- PR/deployment lane evidence: deployed through repo-owned ACA deployment run
  `31886533505`.
- Focused test, lint, and typecheck commands are listed above.
- ACA runtime invariant and signed-in browser proof captured after deploy.
- ACA private-operator readback execution:
  `job-abarva-private-operator-eus-wf3w72o`.

## Known Gaps

- This release does not create missing baselines, resolve baseline conflicts, calculate realized value, or finance-confirm outcomes.
- It records agreement state only when requested; any amount remains governed by calculation runs and Tower/Finance realization proof.
