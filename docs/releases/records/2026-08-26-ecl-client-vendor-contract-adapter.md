# 2026-08-26-ecl-client-vendor-contract-adapter

## Release ID

`2026-08-26-ecl-client-vendor-contract-adapter`

## Status

`candidate`

## Plain-English Summary

Adds a local proof adapter for the vendor/contract source family. The adapter maps the contract
register into ECL source rows, canonical vendor and contract objects, commercial contract rows,
service lines, and annualized value measures while preserving unresolved application scope
references without inventing application objects.

## Layer Impact

- Release lane: `client-data-lane`.
- Layer 2 source ingestion: lands the vendor/contract register as `ecl_source.source_file` and
  `ecl_source.source_record`.
- Layer 3 canonical context: creates vendor and contract objects plus `SUPPLIED_BY` relationships.
- Commercial spine: creates `ecl_commercial.contract` and `contract_service_line` rows.
- Measures: declares and populates the annualized contract value metric.

## Client Applicability

- All clients: adapter pattern applies to the ECL client-intake program.
- Specific clients: none.
- Internal only: local validation and proof artifacts.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `scripts/ecl/load_client_intake_vendor_contract_layer.py`
- `scripts/ecl/__tests__/run-ecl-client-intake-vendor-contract-adapter-tests.mjs`
- `scripts/ecl/write_ecl_four_lane_completion_status.mjs`
- `docs/architecture/ecl-four-lane-completion-status.json`
- `.github/workflows/ecl-no-stop-data-pipeline.yml`

## QA / Validation

Validation status:

- PASS: `npm run test:ecl-client-intake-vendor-contract-adapter`
- PASS: `npm run test:ecl-client-intake-source-family-adapter`
- PASS: `npm run test:ecl-client-intake-application-adapter`
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
- Local disposable Postgres vendor/contract adapter proof.
- Four-lane status output showing canonical client adapters at 2 of 14.

## Known Gaps

Application scope references from the contract register remain unresolved attributes until the
application-scope adapter is run in the same assessment context. This is intentional to avoid
inventing application objects from contract text alone.
