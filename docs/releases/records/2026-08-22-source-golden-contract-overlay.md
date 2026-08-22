# 2026-08-22-source-golden-contract-overlay — Source Golden Contract Overlay

## Release ID

`2026-08-22-source-golden-contract-overlay`

## Status

`candidate`

## Plain-English Summary

Source can now surface governed golden contract evidence rows in Contract 360 even when the tenant already has ordinary `source.contract_360` rows. This prevents a loaded evidence package from being invisible in the live workspace just because the base contract register does not yet include those contract IDs.

## Layer Impact

- `global-control-lane`: Layer 3 canonical/read-model access changes the shared Source read adapter so it merges `source.golden_contract_overview` rows into the Contract 360 list and direct contract lookup path.
- `global-control-lane`: Layer 4 product projection changes Source workspace, Contract 360, and Optimize Contract resolution so evidence-backed contracts can use the same adapter path as ordinary contract rows.
- `client-data-lane`: the operator projection script can synthesize a contract row from the loaded golden evidence package when the base `source.contract_360` row is absent.

## Client Applicability

- All clients: the overlay path is generic for tenants with governed `source.golden_contract_*` evidence rows.
- Specific clients: Meridian is the first live canary for this path.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/source/data-model/read-adapter.ts`
- `scripts/source/project-contract-optimization-spine.ts`
- `src/lib/source/data-model/__tests__/read-adapter.test.ts`

## QA / Validation

- pass: `npx jest src/lib/source/data-model/__tests__/read-adapter.test.ts src/lib/source/data-model/__tests__/contract-optimization-opportunity.test.ts src/lib/source/data-model/__tests__/contract-optimization-facts.test.ts --runInBand`
- pass: `npm run source:contract-evidence:meridian:validate`
- pending: full release gate rerun after this release record is updated.
- pending: live proof after merge and repo-owned ACA deployment.

## Rollout Plan

Merge to `main`, let the repo-owned Azure Container Apps workflow build and deploy the digest-pinned image, then verify the ACA runtime invariant and signed-in Source workspace routes for the canary contract IDs.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none outside the approved workflow.
- Approved image digest: assigned by the main ACA workflow.
- ACA runtime invariant: required after deploy.
- Worker image invariant: unchanged unless an operator job is run.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA workflow. Data loaded into the golden evidence tables remains governed evidence; rollback only removes the product overlay path.

## Audit Evidence

- Pull request URL and merge commit.
- GitHub Actions deploy run.
- ACA runtime invariant output.
- Signed-in Source route proof for the affected contract IDs.
- Optional operator job proof if the optimization spine projection is applied.

## Known Gaps

The evidence package is already loaded, but the live UI must still prove that the canary contract IDs resolve to their own Contract 360 pages instead of falling back to another contract.
