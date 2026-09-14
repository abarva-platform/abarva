# 2026-08-31-ecl-browser-proof-route-health - Separate route health from proof coverage

## Release ID

`2026-08-31-ecl-browser-proof-route-health`

## Status

`candidate`

## Plain-English Summary

This change makes the product browser proof report route health separately from proof coverage.
An entry route can now pass when the page loads and renders its core content, while named surface
coverage and demonstrable finding checks remain separate proof gates.

## Layer Impact

Layer 4 - Products (`global-control-lane`): The browser proof harness now distinguishes route
availability from product proof coverage. No product runtime path or customer data changes.

## Client Applicability

- All clients: No.
- Specific clients: None.
- Internal only: Yes, proof reporting only.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `scripts/ecl/run_product_ecl_browser_smoke.mjs`
- `scripts/ecl/write_ecl_product_live_proof_compact_summary.mjs`
- `scripts/ecl/run_product_ecl_predeploy_gate.mjs`

## QA / Validation

- pass: `node --check scripts/ecl/run_product_ecl_browser_smoke.mjs`
- pass: `node --check scripts/ecl/write_ecl_product_live_proof_compact_summary.mjs`
- pass: `node scripts/ecl/run_product_ecl_browser_smoke.mjs --validate-demo-findings-contract`
- pass: `npm run ecl:product-browser:predeploy-gate`
- pass: `npm run release:check`

## Rollout Plan

Merge through PR. The proof harness update becomes available in the next repository-owned ACA
workflow run that invokes product live proof.

## Deployment Authority

- Repo-owned deploy workflow: Not required for the harness-only behavior to be committed; future
  proof jobs consume it from the checked-out SHA.
- Shared runtime mutators: None.
- Approved image digest: Not applicable.
- ACA runtime invariant: Not applicable.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: The next product proof run will produce the evidence.

## Rollback Plan

Revert the PR if the proof summary shape does not satisfy downstream status consumers.

## Audit Evidence

- PR URL: to be added.
- Local validation output from the commands listed above.

## Known Gaps

This does not make the missing named-surface or finding proof pass. It only prevents those proof
gaps from being reported as entry-route outages.
