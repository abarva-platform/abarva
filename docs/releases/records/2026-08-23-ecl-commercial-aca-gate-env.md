# 2026-08-23-ecl-commercial-aca-gate-env — ECL Commercial ACA Gate Input

## Release ID

`2026-08-23-ecl-commercial-aca-gate-env`

## Status

`candidate`

## Plain-English Summary

This release makes the commercial-family load runner executable through the approved ACA operator
job path without requiring a gate file to be pre-baked into the container image. The runner can now
accept an approved gate manifest through an environment variable and can emit a proof bundle in the
format the shared operator wrapper already extracts.

## Layer Impact

- Release lane: `client-data-lane` with `internal-admin` operator automation.
- Layer 2 / source adapter operations: adds operator-runner input handling for the approved gate
  manifest.
- Layer 3 / canonical loading operations: prepares the commercial-family load runner for a future
  governed data-build execution.
- Layer 4 / products: no product route, projection, or browser surface changes.

## Client Applicability

- All clients: none.
- Specific clients: none.
- Internal only: AbarVa operator automation for future governed data-build execution.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `scripts/ecl/load_ecl_commercial_family.py`
- `scripts/ecl/__tests__/run-ecl-commercial-family-load-tests.mjs`

## QA / Validation

- Pass: `npm run test:ecl-commercial-family-load`
- Pass: `npm run ecl:commercial-family:load:validate`
- Pass: `python3 -m py_compile scripts/ecl/load_ecl_commercial_family.py scripts/ecl/validate_ecl_commercial_local_load_runner.py`
- Pass: `npm run release:check`

## Rollout Plan

Merge to `main`. The repo-owned ACA main deploy workflow builds and deploys the code image. Actual
data-plane execution remains a separate ACA operator job run with a digest-pinned image, an approved
gate manifest, target database secret binding, and independent readback.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this PR beyond normal repo-owned deploy.
- Approved image digest: assigned by the repo-owned deploy workflow after merge.
- ACA runtime invariant: required by the repo-owned deploy workflow.
- Worker image invariant: required by the repo-owned deploy workflow.
- Feature/env flag update path: none.
- Live signed-in proof required: no; this PR does not wire product routes or claim live product data.

## Rollback Plan

Revert the PR or roll ACA traffic back to the prior healthy digest. No data rollback is required
because this PR does not execute a data-plane load.

## Audit Evidence

- PR URL after creation.
- Focused local test and validation output.
- CI release-control checks.
- Repo-owned ACA deploy evidence after merge.

## Known Gaps

Actual commercial-family lab/preprod load and row-for-row readback remain gated follow-on actions.
