# 2026-07-28-standard-product-scope-contract — Standard Product Scope Contract

## Release ID

`2026-07-28-standard-product-scope-contract`

## Status

`candidate`

## Plain-English Summary

This release freezes the standard AbarVa product boundary in one authoritative scope contract. It
separates included product commitments from optional accelerators, analytics-pod work, custom
connectors, bespoke reporting, and roadmap items.

## Layer Impact

- Release lane: `global-control-lane`
- Client intake: Clarifies supported standard source inputs and client responsibilities.
- Source adapters and canonical model: Reaffirms that adapters emit canonical objects and products
  consume projections rather than owning data.
- Products: Documents the standard responsibilities of Knowledge, aVa, Cube, Superset, Observable,
  and Source without adding runtime behavior.
- Operations and governance: Adds explicit acceptance evidence and preflight rigor before heavy
  Azure or data-build execution.

## Client Applicability

- All clients: Applies as the default standard product boundary.
- Specific clients: None named.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `docs/product/STANDARD_PRODUCT_SCOPE.md`
- `docs/releases/records/2026-07-28-standard-product-scope-contract.md`

## QA / Validation

- Pass: `git diff --check -- docs/product/STANDARD_PRODUCT_SCOPE.md docs/releases/records/2026-07-28-standard-product-scope-contract.md`
- Pass: `npm run release:check`

## Rollout Plan

Merge through pull request. This is a documentation and governance contract only. It does not deploy
code, change runtime flags, apply database migrations, publish baselines, modify tenant data, or
shift Azure Container Apps traffic.

## Deployment Authority

- Repo-owned deploy workflow: Not required for this docs-only scope contract.
- Shared runtime mutators: None.
- Approved image digest: Not applicable.
- ACA runtime invariant: Not applicable.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Not for this documentation-only release. Runtime capabilities named
  in the contract still require their own live proof before being declared complete.

## Rollback Plan

Revert the documentation PR. No runtime or data-plane rollback is required.

## Audit Evidence

- Pull request URL: https://github.com/abarva-platform/abarva/pull/5722
- Validation output: `git diff --check` and `npm run release:check`.

## Known Gaps

This contract does not complete the Airline foundation runtime gates, Superset provisioning,
Observable proof, Source handoff proof, signed-in product proof, or rollback proof. Those remain
separate execution gates.
