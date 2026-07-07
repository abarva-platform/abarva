# 2026-06-03-pilot-data-loader-governance — Pilot Data Loader Governance

## Release ID

`2026-06-03-pilot-data-loader-governance`

## Status

`candidate`

## Plain-English Summary

This release makes the pilot data-loading rule explicit: new client data should not be side-loaded through seed scripts. It must enter through the Admin Data Loader, or through a loader-backed ingestion path with an audit trail. If the loader cannot handle a needed file type or dimension, the next product task is to enhance the loader before loading that data.

## Layer Impact

`global-control-lane`: Adds a release-control gate and an operator-facing Admin Data Load Center control so the no side-load rule is visible and testable.

`client-data-lane`: Clarifies the required path for pilot tenant data loads and reloads, including ingestion ledger evidence through `data_ingestion_runs` or `pilot_ingestion` tables.

`internal-admin`: Adds a runbook for AbarVa operators preparing Apex, Meridian, SkyHarbor, or future pilot clients.

## Client Applicability

- All clients: The governance rule applies to every pilot/client data load.
- Specific clients: Apex Retail, Meridian Health, SkyHarbor Air, and First Capital are explicitly covered because they are active pilot/demo tenant contexts.
- Internal only: The runbook and release gate are internal operator/developer controls.
- Public/demo only: Not applicable.
- Feature flag: None.

## Changes Included

- `src/lib/admin/setup-load-studio-view.ts`: Adds an operator-visible "Pilot data rule" control to the Admin Data Load Center view model.
- `src/lib/admin/__tests__/setup-load-studio-view.test.ts`: Pins the control in a focused test.
- `scripts/release-control/check-pilot-data-ingestion-policy.mjs`: Adds a release-control gate for likely client/pilot side-load entrypoints.
- `scripts/release-check.mjs`: Runs the new Pilot Data Loader Gate with the existing release record gate.
- `docs/runbooks/pilot-data-loader-governance.md`: Documents the no side-load operating rule and allowed static-fixture exceptions.

## QA / Validation

Passed locally:

- `npx jest src/lib/admin/__tests__/setup-load-studio-view.test.ts --runInBand`
- `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to main. The Admin Data Load Center copy becomes active with the next Vercel production deploy. The release-control gate becomes active in CI and local release checks immediately after merge.

## Rollback Plan

Revert the PR. This removes the release gate, runbook, and Admin Data Load Center control without changing database schema or tenant data.

## Audit Evidence

Audit evidence should include the PR, CI run, release-check output, and the Admin Data Load Center view-model test output. No migration or tenant-data mutation is included in this release.

## Known Gaps

The release does not yet expand the Admin Data Loader to cover every file type or dimension needed for a full SkyHarbor reload. That enhancement should be the next implementation task when the required upload package is known.
