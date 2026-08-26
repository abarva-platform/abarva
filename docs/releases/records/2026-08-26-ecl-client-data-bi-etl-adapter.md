# 2026-08-26-ecl-client-data-bi-etl-adapter

## Release ID

`2026-08-26-ecl-client-data-bi-etl-adapter`

## Status

`candidate`

## Plain-English Summary

Adds a local proof adapter for the data, BI, analytics, and ETL source family. The adapter maps
segment-level workload counts into ECL source rows, canonical business-function and data-platform
objects, usage relationships, and volumetric measures without requiring row-level enumeration of
every report, script, ETL job, or stored procedure.

## Layer Impact

- Release lane: `client-data-lane`.
- Layer 2 source ingestion: lands the data/BI/ETL extract as `ecl_source.source_file` and
  `ecl_source.source_record`.
- Layer 3 canonical context: creates business-function and data-platform objects plus `USED_BY`
  relationships.
- Measures: declares and populates workload count, active user count, and data volume metrics.

## Client Applicability

- All clients: adapter pattern applies to the ECL client-intake program.
- Specific clients: none.
- Internal only: local validation and proof artifacts.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `scripts/ecl/load_client_intake_data_bi_etl_layer.py`
- `scripts/ecl/__tests__/run-ecl-client-intake-data-bi-etl-adapter-tests.mjs`
- `scripts/ecl/write_ecl_four_lane_completion_status.mjs`
- `docs/architecture/ecl-four-lane-completion-status.json`
- `.github/workflows/ecl-no-stop-data-pipeline.yml`

## QA / Validation

Validation status:

- PASS: `npm run test:ecl-client-intake-data-bi-etl-adapter`
- PASS: `npm run test:ecl-client-intake-source-family-adapter`
- PASS: `npm run test:ecl-client-intake-application-adapter`
- PASS: `npm run test:ecl-client-intake-vendor-contract-adapter`
- PASS: `ECL_RECONCILE_REF=HEAD npm run test:ecl-four-lane-status`
- PASS: `npm run test:ecl-legacy-retirement-status`
- PASS: `npm run test:npm-script-targets`
- PENDING: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge by PR. No runtime deployment is required because this change adds a local adapter proof and
status metadata only.

## Deployment Authority

- Repo-owned deploy workflow: not required.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: no.

## Rollback Plan

Revert the PR. No data-plane rollback is required because no database mutation or deploy is
performed.

## Audit Evidence

- PR URL and CI run once opened.
- Local disposable Postgres data/BI/ETL adapter proof.
- Four-lane status output showing canonical client adapters at 3 of 14.

## Known Gaps

The adapter intentionally loads summarized segment-level counts. It does not create one object per
individual report, job, script, or stored procedure; those may be collected later only when a named
product use case requires that grain.
