# 2026-06-06-skyharbor-private-runtime-runbook - SkyHarbor Private Runtime Reset/Load Runbook

## Release ID

`2026-06-06-skyharbor-private-runtime-runbook`

## Status

`candidate`

## Plain-English Summary

Adds an executable private-runtime runbook for completing the SkyHarbor reset/load lane from an Azure/VNet-connected runtime. The prior local attempt proved that the dataset and loader dry-run are healthy, but the private Azure Postgres hostname does not resolve from the desktop runtime. This runbook turns that blocker into a precise operator packet: connectivity gate, inventory, backup, scoped delete, clean-slate verification, real load, post-load counts, signed-in crawl proof, and Moves/Source proof definition.

## Layer Impact

- `client-data-lane`: Documents the controlled process for SkyHarbor-only reset/load and post-load verification.
- `internal-admin`: Provides operator instructions for running the destructive lane safely from a private network runtime.

## Client Applicability

- All clients: No.
- Specific clients: SkyHarbor Air only.
- Internal only: Yes, this is an operator runbook.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `docs/runbooks/skyharbor-private-runtime-reset-load.md`

## QA / Validation

- Prior evidence confirmed local DB reachability is blocked by `getaddrinfo ENOTFOUND pg-abarva-context-lab-001.postgres.database.azure.com`.
- Prior dry-run evidence confirmed expected SkyHarbor local dataset counts: 3,240 chunks, 92 applications, 38 initiatives, and 52 vendor contracts.
- This candidate is docs-only and should pass `npm run release:check -- --base origin/main --head HEAD`.

## Rollout Plan

Merge the runbook to main. No runtime deploy, migration, or data mutation is included. The runbook becomes active when an operator executes it from an Azure/VNet-connected runtime.

## Rollback Plan

Revert the documentation PR. No data rollback is needed because this change does not run the reset/load.

## Audit Evidence

- Prior blocker packet: `reports/2026-06-05-skyharbor-reset-load/`.
- New operator packet: `docs/runbooks/skyharbor-private-runtime-reset-load.md`.

## Known Gaps

The actual SkyHarbor live reset/load and Moves/Source proof still require a private runtime with Azure Postgres DNS/connectivity. This PR does not perform the load.
