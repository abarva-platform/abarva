# 2026-06-13-env-vending-ledger — Azure Subscription Vending Ledger

## Release ID

`2026-06-13-env-vending-ledger`

## Status

`candidate`

## Plain-English Summary

This release adds the non-mutating subscription vending runbook and execution ledger template for the Azure environment factory. It defines the order of subscription creation, the evidence packet required per subscription, and the human approval gates where agents must stop before performing material Azure actions.

## Layer Impact

- `global-control-lane`: adds shared environment execution governance for product and client environment work.
- `internal-admin`: supports AbarVa-only subscription vending readiness, audit, and approval workflow.

## Client Applicability

- All clients: indirectly protected because future Client Preprod and Client Prod subscriptions must use the same ledger/evidence model.
- Specific clients: none.
- Internal only: applies to AbarVa environment execution.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Adds `docs/azure/ENVIRONMENT_SUBSCRIPTION_VENDING_RUNBOOK_2026-06.md`.
- Adds `docs/azure/ENVIRONMENT_EXECUTION_LEDGER_TEMPLATE_2026-06.json`.
- Adds `scripts/azure/verify-environment-vending-ledger.mjs`.
- Adds `npm run azure:environment-vending:verify`.
- Wires the vending-ledger verifier into `.github/workflows/production-readiness-gate.yml`.

## QA / Validation

- `npm run azure:environment-vending:verify` must pass.
- `npm run azure:environment-factory:verify` must pass.
- `npm run release:check -- --base origin/main --head HEAD` must pass.
- Production-readiness CI must pass after the new verifier is wired.

## Rollout Plan

Merge to main. This is documentation and CI verification only. It does not create subscriptions, assign RBAC, deploy resources, run migrations, move DNS, or load data.

## Rollback Plan

Revert this PR to remove the vending runbook, ledger template, verifier, and production-readiness workflow step. Because this is additive governance only, rollback has no runtime or data impact.

## Audit Evidence

- Runbook at `docs/azure/ENVIRONMENT_SUBSCRIPTION_VENDING_RUNBOOK_2026-06.md`.
- Ledger template at `docs/azure/ENVIRONMENT_EXECUTION_LEDGER_TEMPLATE_2026-06.json`.
- Verifier output from `npm run azure:environment-vending:verify`.
- Pull request CI after opening the PR.

## Known Gaps

- This does not yet create Product Dev, Product Preview, Product Prod, Client Preprod, or Client Prod subscriptions.
- This does not yet assign management groups, budgets, policies, or RBAC.
- This does not yet generate subscription-specific Bicep parameter files.
