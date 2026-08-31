# 2026-08-31-home-browse-record-contract — Home Browse Record Contract

## Release ID

`2026-08-31-home-browse-record-contract`

## Status

`candidate`

## Plain-English Summary

Adds an executable contract builder for the Home Browse The Record surface. It profiles each source
CSV and emits a professional browse contract: dataset selector entries, dimension candidates, column
presets, source hashes, schema fingerprints, row counts, fill rates, and lineage drawer
requirements. The contract is built so each dataset click refreshes a canvas rather than dumping all
content into one long page.

## Layer Impact

Affected lane: `global-control-lane`.

- `Layer 1 - Client Intake`: reads canonical source CSVs for profiling; does not mutate them.
- `Layer 2 - Source Adapters`: adds a deterministic browse-contract preparation step.
- `Layer 3 - Canonical Enterprise Model`: no canonical table mutation.
- `Layer 4 - Products`: no product runtime mutation; this produces a contract for the Home browse
  UI to consume later.

## Client Applicability

- All clients: none.
- Specific clients: none.
- Internal only: applies to internal build tooling for Home browse preparation.
- Public/demo only: supports synthetic demo Browse The Record preparation.
- Feature flag: none.

## Changes Included

- `scripts/ecl/build_home_browse_record_contract.mjs`
- `scripts/ecl/__tests__/run-home-browse-record-contract-tests.mjs`
- `package.json` scripts:
  - `ecl:home-browse-record:contract`
  - `test:ecl-home-browse-record-contract`

## QA / Validation

- Pass: `npm run test:ecl-home-browse-record-contract`
- Pass: browse contract run over current synthetic source CSVs.

## Rollout Plan

Merge to main only. There is no Azure Container Apps rollout, migration apply, traffic shift,
feature flag, or data-plane mutation in this slice.

## Deployment Authority

- Repo-owned deploy workflow: not required.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: no, because this does not affect runtime routes.

## Rollback Plan

Revert the commit. No data-plane or product-runtime state is changed.

## Audit Evidence

- Unit proof: `npm run test:ecl-home-browse-record-contract`
- Contract proof: `/tmp/home-browse-record-contract-20260831/home-browse-record-contract.json`
- Download artifact: generated locally for operator inspection; not committed to the public repo.

## Known Gaps

This slice does not implement the Home UI, deploy runtime code, write ECL serving rows, or mutate
Azure data. It defines the browse data contract that the UI must render.
