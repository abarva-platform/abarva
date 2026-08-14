# 2026-08-14-source-optimize-value-proof-status — Source Optimize Value Proof Status

## Release ID

`2026-08-14-source-optimize-value-proof-status`

## Status

`candidate`

## Plain-English Summary

Source Optimize now separates the final value-proof states more clearly on the contract optimization page. The page shows strategy approval, vendor outcome, Finance/Tower handoff, and realized value proof as distinct states. A Finance/Tower handoff request can no longer be visually confused with realized value, and a finance confirmation request cannot satisfy the strategy-approval gate.

## Layer Impact

- `global-control-lane`: shared Source Optimize Contract behavior for every tenant using the module.
- Layer 4 Products: updates the Source Optimize Contract projection and workflow-position derivation.
- Layer 3 Canonical Enterprise Model: no schema or data mutation. Existing `source.approval_request`, `source.approval_decision`, `source.negotiated_outcome`, `source.finance_realization`, and finance realization evidence rows are read as governed state.

## Client Applicability

- All clients: Yes, for tenants using the shared Source Optimize Contract module.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Adds a compact value-proof status section to the Source Optimize Contract page.
- Filters workflow-position approval gates to `vendor_outreach_strategy` requests so finance confirmation requests cannot advance strategy or approval steps.
- Adds focused page and workflow-position regression tests for pending handoff versus finance-confirmed proof.

## QA / Validation

- `npx jest src/lib/source/data-model/__tests__/contract-optimization-workflow-step.test.ts --runInBand` — passed.
- `npx jest src/components/source/__tests__/SourceOptimizeContractPage.test.tsx --runInBand` — passed.
- Broader lint, typecheck, release gate, PR checks, deploy, and live proof remain required before released status.

## Rollout Plan

Merge through the protected PR path. The repo-owned Azure Container Apps main deploy workflow will build and deploy the production image after merge.

## Deployment Authority

- Repo-owned deploy workflow: Required for runtime rollout.
- Shared runtime mutators: None in this change.
- Approved image digest: To be produced by the repo-owned ACA deploy workflow.
- ACA runtime invariant: Must be proven after deploy before claiming live.
- Worker image invariant: Must be proven after deploy before claiming live.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes — Source Optimize Contract page must show pending and finance-confirmed value-proof states correctly when data supports those states.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main deploy workflow. No data rollback is required because this change does not add migrations or write new rows.

## Audit Evidence

- Pull request URL and merge commit after PR creation.
- Focused Jest output listed above.
- ACA deploy run, runtime-invariant artifact, and signed-in browser proof after merge.

## Known Gaps

- This does not create Finance/Tower realized-value rows. Realized value still requires governed finance confirmation evidence.
- This does not complete signed-in browser proof; that must be captured after deployment.
