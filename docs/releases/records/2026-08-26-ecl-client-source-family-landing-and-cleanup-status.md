# 2026-08-26-ecl-client-source-family-landing-and-cleanup-status

## Release ID

`2026-08-26-ecl-client-source-family-landing-and-cleanup-status`

## Status

`candidate`

## Plain-English Summary

Adds a local proof that all fourteen client-shaped ECL source families can land into the governed
source layer without being over-counted as canonical adapters. It also records the first safe
legacy-cleanup movement by marking archive-only SQL inventory rows as retired metadata, without
dropping data-plane tables.

## Layer Impact

- Layer 2 source ingestion: adds a source-family landing adapter that writes `ecl_source.source_file`
  and `ecl_source.source_record` only.
- Governance/status: separates source landing from canonical adapter completion in the four-lane
  status artifact.
- Legacy cleanup metadata: reclassifies archive-only inventory rows as terminal archive retirement.

## Client Applicability

- All clients: source-family landing and status semantics apply to the ECL program generally.
- Specific clients: none.
- Internal only: local validation, release tracking, and cleanup inventory metadata.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `scripts/ecl/load_client_intake_source_family_layer.py`
- `scripts/ecl/__tests__/run-ecl-client-intake-source-family-adapter-tests.mjs`
- `scripts/ecl/__tests__/run-ecl-legacy-retirement-status-tests.mjs`
- `scripts/ecl/write_ecl_four_lane_completion_status.mjs`
- `docs/architecture/ecl-four-lane-completion-status.json`
- `reports/ecl-legacy-table-retirement-map-2026-08-22/*`
- `.github/workflows/ecl-no-stop-data-pipeline.yml`

## QA / Validation

Validation status:

- PASS: `npm run test:ecl-client-intake-source-family-adapter`
- PASS: `npm run test:ecl-client-intake-application-adapter`
- PASS: `npm run test:ecl-four-lane-status`
- PASS: `npm run test:ecl-legacy-retirement-status`
- PASS: `npm run test:npm-script-targets`
- PENDING: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge by PR. No runtime deployment is required because this change adds local validation, committed
status, and metadata-only cleanup classification. Existing product routes and Azure data remain
unchanged.

## Deployment Authority

- Repo-owned deploy workflow: not required.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: no.

## Rollback Plan

Revert the PR to remove the adapter/test/status changes and restore the archive-only rows to their
previous pending label. No data-plane rollback is required because no database mutation or deploy is
performed.

## Audit Evidence

- PR URL and CI run once opened.
- Local disposable Postgres source-family adapter proof.
- Four-lane status test output.
- Legacy retirement status test output.

## Known Gaps

Canonical/context adapters remain at 1 of 14. Source-family landing proves governed intake receipt;
it does not prove product-ready semantic mapping for every family.
