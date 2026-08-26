# 2026-08-26-ecl-client-infrastructure-adapter

## Release ID

`2026-08-26-ecl-client-infrastructure-adapter`

## Status

`candidate`

## Plain-English Summary

Adds a local proof adapter for the infrastructure and hosting source family. The adapter maps
platform, cluster, account, appliance, and hosting-segment rows into ECL source rows, canonical
business-function and infrastructure objects, support relationships, and infrastructure measures.

## Layer Impact

- Release lane: `client-data-lane`.
- Layer 2 source ingestion: lands the infrastructure extract as `ecl_source.source_file` and
  `ecl_source.source_record`.
- Layer 3 canonical context: creates business-function and infrastructure objects plus
  `SUPPORTED_BY` relationships.
- Measures: declares and populates platform capacity, utilization, and support-days-remaining
  metrics.

## Client Applicability

- All clients: adapter pattern applies to the ECL client-intake program.
- Specific clients: none.
- Internal only: local validation and proof artifacts.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `scripts/ecl/load_client_intake_infrastructure_layer.py`
- `scripts/ecl/__tests__/run-ecl-client-intake-infrastructure-adapter-tests.mjs`
- `scripts/ecl/write_ecl_four_lane_completion_status.mjs`
- `docs/architecture/ecl-four-lane-completion-status.json`
- `.github/workflows/ecl-no-stop-data-pipeline.yml`

## QA / Validation

Validation status:

- PASS: `npm run test:ecl-client-intake-infrastructure-adapter`
- PASS: `npm run test:ecl-client-intake-data-bi-etl-adapter`
- PASS: `npm run test:ecl-client-intake-vendor-contract-adapter`
- PASS: `npm run test:ecl-client-intake-application-adapter`
- PASS: `npm run test:ecl-client-intake-source-family-adapter`
- PASS: `ECL_RECONCILE_REF=HEAD npm run test:ecl-four-lane-status`
- PASS: `npm run test:ecl-legacy-retirement-status`
- PASS: `npm run test:npm-script-targets`
- PASS: `npm run release:check -- --base origin/main --head HEAD`

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
- Local disposable Postgres infrastructure adapter proof.
- Four-lane status output showing canonical client adapters at 4 of 14.

## Known Gaps

The adapter intentionally loads platform, cluster, account, appliance, and hosting-segment rows. It
does not create one row per VM, subnet, disk, node, or component; that lower grain should be added
only where a named product use case requires it.
