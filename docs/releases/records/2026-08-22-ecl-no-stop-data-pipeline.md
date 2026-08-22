# 2026-08-22-ecl-no-stop-data-pipeline — ECL No-Stop Data Pipeline

## Release ID

`2026-08-22-ecl-no-stop-data-pipeline`

## Status

`candidate`

## Plain-English Summary

Adds a governed no-stop CI lane for the Enterprise Context Ledger build work. The workflow runs the local ECL proof chain, validates acceptance outputs, generates the legacy table retirement map, uploads a proof bundle, and can optionally squash-merge a specified PR only when explicitly dispatched with a merge confirmation.

## Layer Impact

- `global-control-lane`: Adds CI orchestration for local proof artifacts and retirement-map evidence. It does not load data, migrate a database, repoint product routes, or claim browser/live proof.
- `client-data-lane`: Adds a proof-only data-build lane for ECL source-room and retirement-map evidence. The lane remains local/CI proof until a separate ACA Job data-build authorization exists.
- Release control: Adds an explicitly confirmed PR merge path after proof passes. Shared ACA deployment remains owned by the existing main deploy workflow.

## Client Applicability

- All clients: No direct product/runtime change.
- Specific clients: None.
- Internal only: CI/proof automation for ECL build work.
- Public/demo only: Not applicable.
- Feature flag: Not applicable.

## Changes Included

- `.github/workflows/ecl-no-stop-data-pipeline.yml`
- ECL proof scripts and reports already produced by the local execution lane.
- Legacy table retirement-map generator and generated proof report.

## QA / Validation

- Pass: `ruby -e "require 'yaml'; YAML.load_file('.github/workflows/ecl-no-stop-data-pipeline.yml'); puts 'workflow yaml ok'"`
- Pass: `python3 -m py_compile scripts/ecl/write_legacy_table_retirement_map.py scripts/ecl/run_commercial_contract_proof.py`
- Pass: `python3 scripts/ecl/run_commercial_contract_proof.py && python3 scripts/ecl/write_legacy_table_retirement_map.py`
- Pass: Commercial proof acceptance is `accepted=true` with zero issues.
- Pass: Legacy retirement map reports 895 repo-visible `CREATE TABLE` statements, 734 unique table names, and required execution columns.
- Pass: ZIP proof packages were generated locally for the commercial proof and retirement-map slices.
- Pending: GitHub Actions workflow execution on the remote PR lane.

## Rollout Plan

Merge to `main`. The workflow becomes available for pull requests, branch pushes that touch ECL files, and manual `workflow_dispatch`.

The workflow does not deploy directly. If a PR is explicitly merged through the workflow, the push to `main` triggers the existing repo-owned ACA main deploy workflow.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this workflow.
- Approved image digest: Not applicable; this workflow does not build or deploy the web image.
- ACA runtime invariant: Checked by the existing ACA main deploy workflow after main deploys.
- Worker image invariant: Not applicable.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Required separately for any product/runtime claim; not performed by this workflow.

## Rollback Plan

Revert this release if the workflow behavior is wrong. Because the workflow does not mutate Azure, run migrations, or change runtime traffic, rollback is a normal code revert.

## Audit Evidence

- Workflow artifact: `ecl-no-stop-proof-<run_id>`
- Local proof bundle: `outputs/ecl-commercial-contract-supply-correction-2026-08-22/`
- Local retirement map: `reports/ecl-legacy-table-retirement-map-2026-08-22/`

## Known Gaps

- The workflow does not run a real ACA data-build job. Mutating data builds still require the ACA Job lane and explicit data-plane authorization.
- The workflow does not perform signed-in browser QA.
- Auto-merge is available only through explicit `workflow_dispatch` with `confirm_merge=MERGE`.
