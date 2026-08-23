# ECL Ordered ACA Commercial-First Plan

Plan-only PR slice. No Azure mutation, migration apply, active tenant promotion, product route repointing, deploy, traffic shift, or browser-live claim was performed.

## Immediate Deliverable

Build the ACA data-build job contract, then stage the commercial family as the first gated lab/preprod data-plane action, followed by independent row-for-row readback against the local commercial proof.

## Commercial Proof Basis

- Source records: `589`
- Documents: `55`
- Document extractions: `235`
- Contracts: `5`
- Source Contract 360 rows: `5`

## Ordered Queue

| Step | Percent | Status | Gate | Blockers |
|---:|---:|---|---|---|
| 1 | 65% | `contract_built_no_data` | `no_data_plane_mutation_in_this_pr` | none |
| 2 | 25% | `plan_ready_gated_not_executed` | `azure_data_plane_write` | explicit operator approval, digest-pinned image, target private data-plane confirmation |
| 3 | 25% | `plan_ready_gated_not_executed` | `readback_after_approved_load` | commercial load execution must complete first |
| 4 | 0% | `deferred_after_commercial_readback` | `commercial_readback_parity` | complete step 3 first |
| 5 | 0% | `deferred_after_remaining_8_dense_rooms` | `all_9_local_artifacts_exist` | complete step 4 first |
| 6 | 0% | `deferred_hard_gated` | `azure_data_plane_write_and_readback` | complete step 5 and obtain explicit load approval |
| 7 | 0% | `deferred_hard_gated` | `product_route_repointing_and_browser_live_claim` | complete step 6, deploy through approved workflow, signed-in Source browser QA |
