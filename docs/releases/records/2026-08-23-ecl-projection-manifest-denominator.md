# 2026-08-23-ecl-projection-manifest-denominator — ECL Projection Manifest Denominator

## Release ID

`2026-08-23-ecl-projection-manifest-denominator`

## Status

`candidate`

## Plain-English Summary

The no-stop ECL proof workflow now expects seven product projection manifests, matching the all-product projection load that includes Source, Home, Tower, and Intelligence. The prior workflow expectation still assumed the older Source-only projection set and failed with `projection_manifest=7, expected 4`.

## Layer Impact

- `internal-admin`: Corrects CI/proof automation accounting.
- `Layer 4 PRODUCTS`: No product behavior change; only the proof denominator for product projection manifests changes.
- `client-data-lane`: No data-plane mutation, schema change, tenant input replacement, or projection reload.

## Client Applicability

- All clients: No.
- Specific clients: Synthetic dense Meridian lab/preprod proof automation only.
- Internal only: Yes.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `.github/workflows/ecl-no-stop-data-pipeline.yml`
- `docs/releases/records/2026-08-23-ecl-projection-manifest-denominator.md`

## QA / Validation

- `npm run ecl:heartbeat-agent:advance` passed the local queue step and produced an accepted status before this workflow-denominator correction.
- `npm run ecl:product-browser-qa-gate:package` passed through the heartbeat agent.
- `npm run ecl:product-browser-qa-gate:validate` passed through the heartbeat agent.
- `npm run release:check` was run before this template correction and failed only on release-record shape; rerun is required after this record update.

## Rollout Plan

Merge through the standard PR path. The corrected workflow becomes active the next time the ECL no-stop data pipeline runs on a PR or main.

## Deployment Authority

- Repo-owned deploy workflow: Not required; workflow-only proof correction.
- Shared runtime mutators: None.
- Approved image digest: Not applicable.
- ACA runtime invariant: Not applicable.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: No, because this does not alter product runtime behavior.

## Rollback Plan

Revert this commit if the product projection manifest set intentionally returns to four Source-only manifests.

## Audit Evidence

- Failing CI evidence: `projection readback projection_manifest=7, expected 4`.
- Corrected expected denominator: `projection_manifest=7`.

## Known Gaps

- Browser/live product proof remains separate and is not claimed by this workflow correction.
