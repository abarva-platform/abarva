# 2026-08-27-ecl-cross-tenant-id-namespace — ECL Cross-Tenant ID Namespace

## Release ID

`2026-08-27-ecl-cross-tenant-id-namespace`

## Status

`candidate`

## Plain-English Summary

This change makes deterministic ECL dense-load UUIDs unique per tenant and assessment. It prevents a second active synthetic profile from colliding with rows already loaded for another active profile in the shared ECL database.

## Layer Impact

- Release lane: `client-data-lane`.
- Layer 2 — Source adapters: deterministic source-room load IDs now include tenant and assessment context.
- Layer 3 — Canonical model: generated object, relationship, metric, measure, commercial, review, projection, and cube references continue to be derived from the same helper, so all downstream references remain internally consistent.
- Layer 4 — Products: no route behavior changes. Product impact comes only after the governed data-build job loads the second active profile successfully.

## Client Applicability

- All clients: applies to deterministic ECL dense-load tooling.
- Specific clients: none.
- Internal only: none.
- Public/demo only: active synthetic profile data-build lanes.
- Feature flag: none.

## Changes Included

- `scripts/ecl/load_dense_source_room_source_layer.py` now includes tenant and assessment in deterministic UUID generation.
- `scripts/ecl/__tests__/run-ecl-dense-cross-tenant-id-namespace-tests.mjs` proves two active dense profiles produce no overlapping generated UUIDs.
- `package.json` exposes the regression test as `test:ecl-dense-cross-tenant-id-namespace`.

## QA / Validation

- `npm run test:ecl-dense-cross-tenant-id-namespace` — pass; generated dense SQL for two active profiles produced 49,080 and 49,231 UUIDs with 0 overlap.
- `npm run test:ecl-dense-readback-query` — pass.
- `python3 -m py_compile scripts/ecl/load_dense_source_room_source_layer.py scripts/ecl/execute_dense_all_layer_load.py` — pass.
- Local airline-profile projection proof — pass, zero issues, 40/40 serving views populated.
- Local airline-profile cube proof — pass, zero issues, cube FK planted failures rejected.
- `git diff --check` — pass.

## Rollout Plan

Merge to `main`, let the repo-owned Azure Container Apps deploy workflow build and deploy the digest-pinned web image, then rerun the governed ECL dense all-layer data-build job for the second active synthetic profile. Run independent readback as a separate ACA execution before claiming Azure data completion.

## Deployment Authority

- Repo-owned deploy workflow: required for shared web runtime image.
- Shared runtime mutators: repo-owned deploy workflow only.
- Approved image digest: resolved by the deploy workflow after merge.
- ACA runtime invariant: required after deploy.
- Worker image invariant: required after deploy.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: required after data load/readback, not for this code-only fix alone.

## Rollback Plan

Revert this PR and redeploy the previous digest. If a data-build job has already loaded the second active profile with the new namespace, rerun the tenant/assessment-scoped purge before reverting if the old generator must be used.

## Audit Evidence

- PR for this release candidate.
- Local test output from `test:ecl-dense-cross-tenant-id-namespace`.
- Governed ACA data-build job output and independent readback output after merge/deploy.

## Known Gaps

The governed Azure data-build job and independent readback still need to be rerun after this candidate is merged and deployed.
