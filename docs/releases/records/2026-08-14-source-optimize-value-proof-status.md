# 2026-08-14-source-optimize-value-proof-status — Source Optimize Value Proof Status

## Release ID

`2026-08-14-source-optimize-value-proof-status`

## Status

`live-proven`

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
- Pass: ACA private operator execution
  `job-abarva-private-operator-eus-wf3w72o` read back a pending
  `finance_value_confirmation` request separately from the finance realization
  row.
- Pass: signed-in browser proof showed the Source Optimize route at the final
  Finance/Tower confirmation gate with 6 of 6 stated amounts reproducible; the
  page did not present the pending handoff as realized value.
- Pass: current deployed runtime proof after ACA deployment run `31886533505`
  showed revision `ca-abarva-web-lab-eastus--m8dc5e2c5` at 100% traffic on
  image
  `acrabarvalab001.azurecr.io/abarva/web@sha256:f9e9109e2914fcfb186ee49aef24a0e4c20a3dccc7b17a9eac232af125a43f71`.

## Rollout Plan

Merge through the protected PR path. The repo-owned Azure Container Apps main deploy workflow will build and deploy the production image after merge.

## Deployment Authority

- Repo-owned deploy workflow: Required for runtime rollout.
- Shared runtime mutators: None in this change.
- Approved image digest:
  `acrabarvalab001.azurecr.io/abarva/web@sha256:f9e9109e2914fcfb186ee49aef24a0e4c20a3dccc7b17a9eac232af125a43f71`.
- ACA runtime invariant: proved on revision
  `ca-abarva-web-lab-eastus--m8dc5e2c5` with 100% traffic.
- Worker image invariant: delivery worker images matched the deployed web
  digest during post-deploy readback.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes — Source Optimize Contract page must show pending and finance-confirmed value-proof states correctly when data supports those states.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main deploy workflow. No data rollback is required because this change does not add migrations or write new rows.

## Audit Evidence

- Pull request URL and merge commit after PR creation.
- Focused Jest output listed above.
- ACA deploy run `31886533505`, runtime-invariant readback, private-operator
  readback `job-abarva-private-operator-eus-wf3w72o`, and signed-in browser
  proof after merge.

## Known Gaps

- This does not create Finance/Tower realized-value rows. Realized value still requires governed finance confirmation evidence.
- This proves the pending Finance/Tower value-proof state for the sampled
  ready-baseline canary. It does not prove an approved Finance/Tower
  confirmation path or create realized value.
