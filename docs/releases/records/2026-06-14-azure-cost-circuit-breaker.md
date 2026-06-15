# 2026-06-14-azure-cost-circuit-breaker — Azure Cost Circuit Breaker

## Release ID

`2026-06-14-azure-cost-circuit-breaker`

## Status

`candidate`

## Plain-English Summary

Adds a read-only Azure cost circuit breaker for AbarVa environments. It checks
Azure budget current spend and forecast spend, writes an evidence report, and
gives the operator the next safe action. It does not mutate Azure resources or
automatically pause workloads.

## Layer Impact

- `internal-admin`: Adds an AbarVa-only operating guard for Azure subscription
  cost monitoring.
- `global-control-lane`: Applies to product/control-plane subscriptions as they
  are created.
- `client-data-lane`: Provides the same guard pattern for future client
  private-plane subscriptions, without touching client data.

## Client Applicability

- All clients: No client-facing runtime behavior changes.
- Specific clients: None.
- Internal only: Azure environment operators.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `docs/azure/COST_CIRCUIT_BREAKER_2026-06.md`
- `docs/azure/COST_CIRCUIT_BREAKER_2026-06.json`
- `scripts/azure/cost-circuit-breaker.mjs`
- `scripts/azure/verify-cost-circuit-breaker.mjs`
- `package.json` scripts:
  - `azure:cost-circuit-breaker:check`
  - `azure:cost-circuit-breaker:verify`

## QA / Validation

- `npm run azure:cost-circuit-breaker:verify` passed 42/42 checks.
- `npm run azure:cost-circuit-breaker:check -- --subscriptions "lab=<id>,product-dev=<id>" --output docs/build/azure/2026-06-14-cost-circuit-breaker` ran read-only against Azure budgets.
- Live read-only result: Lab is `BREACH`; Product Dev is `OK`.
- Release check to be run before PR.

## Rollout Plan

Merge to main as an internal-admin control. Operators can run the check manually
or wire it into a scheduled read-only monitor. No Azure deployment is required
for the repo artifact itself.

## Rollback Plan

Revert the PR. No Azure resources are created, updated, stopped, deleted,
scaled, paused, or mutated by this release.

## Audit Evidence

- Cost circuit breaker report under
  `docs/build/azure/2026-06-14-cost-circuit-breaker/`.
- Verifier output from `npm run azure:cost-circuit-breaker:verify`.
- Release check output.

## Known Gaps

This is detection and escalation, not a hard cap. Azure budgets are alerts, not
spending limits. Automatic pause/scale-down controls remain out of scope until a
separate human-approved runbook and approval file exist.
