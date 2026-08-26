# 2026-08-26-ecl-client-finance-erp-adapter — ECL Finance ERP Intake Adapter

## Release ID

`2026-08-26-ecl-client-finance-erp-adapter`

## Status

`candidate`

## Plain-English Summary

Adds a local ECL adapter proof for the finance and ERP intake family. The adapter maps fiscal period, cost center, account category, supplier, budget, actual spend, variance, and allocation basis into ECL source, context, commercial, and measure records without treating the extract as a full financial ledger.

## Layer Impact

Layer 1 - Client intake: Reads the finance and ERP source-family extract at summarized finance allocation grain. Completion lane affected: `L-CLIENT`.

Layer 2 - Source adapters: Adds a finance and ERP adapter with a disposable Postgres proof and planted foreign-key failure. Completion lane affected: `L-CLIENT`.

Layer 3 - Canonical model: Produces cost center, supplier, function, metric, measure, relationship, and invoice-line records for local validation. Completion lane affected: `L-CLIENT`.

Layer 4 - Products: No product route or runtime behavior changes in this release. Product cutover lane `L-CUTOVER` is not changed.

## Client Applicability

- All clients: Adapter pattern and local proof only.
- Specific clients: None.
- Internal only: ECL build and validation workflow.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `scripts/ecl/load_client_intake_finance_erp_layer.py`
- `scripts/ecl/__tests__/run-ecl-client-intake-finance-erp-adapter-tests.mjs`
- Package scripts for loading and testing the finance and ERP adapter.
- ECL no-stop pipeline proof step for the finance and ERP adapter.
- Four-lane ECL completion status update from 4/14 to 5/14 client-intake adapters.

## QA / Validation

- Pass: `npm run test:ecl-client-intake-finance-erp-adapter`
- Pass: Disposable Postgres load against the ECL draft schema.
- Pass: Row-count, field-distribution, quality-state, and review-state assertions.
- Pass: Planted supplier reference failure rejected by the database foreign key.

## Rollout Plan

Merge to `main`. No Azure data-plane mutation, no product route repointing, and no runtime deployment is required for this adapter-only proof.

## Deployment Authority

- Repo-owned deploy workflow: Not required.
- Shared runtime mutators: None.
- Approved image digest: Not applicable.
- ACA runtime invariant: Not applicable.
- Worker image invariant: Not applicable.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: No.

## Rollback Plan

Revert the adapter script, test, package-script entries, workflow proof step, and status update. No persisted data or runtime state is changed by this release.

## Audit Evidence

- Pull request for this release.
- `npm run test:ecl-client-intake-finance-erp-adapter`
- CI ECL no-stop data pipeline proof after PR creation.

## Known Gaps

The adapter is not a replacement for an ERP subledger or AP invoice-detail feed. It intentionally captures summarized finance allocation data needed for current-state reasoning and product projections.
