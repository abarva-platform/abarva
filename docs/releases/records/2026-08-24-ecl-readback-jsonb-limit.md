# 2026-08-24-ecl-readback-jsonb-limit — ECL dense readback count query limit

## Release ID

`2026-08-24-ecl-readback-jsonb-limit`

## Status

`candidate`

## Plain-English Summary

Fixes the dense ECL all-layer job readback query so it can return the full set of layer, projection, cube, and drift counts. The previous query used one large Postgres `jsonb_build_object` call and hit Postgres's function argument limit after Home, Tower, Intelligence, and cube checks were added.

## Layer Impact

`client-data-lane`: changes the governed ACA data-build proof/readback script only. It does not change source data, loaders, schema, projections, product routes, or browser behavior.

## Client Applicability

- All clients: No runtime product change.
- Specific clients: None.
- Internal only: ECL dense all-layer ACA load/readback proof.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `scripts/ecl/execute_dense_all_layer_load.py` splits the readback JSON into two merged `jsonb_build_object` calls so each call remains below the Postgres 100-argument limit.
- `scripts/ecl/__tests__/run-ecl-dense-readback-query-tests.mjs` verifies the readback query has 12+ count keys, includes Home/Tower/Intelligence projection counts, keeps every `jsonb_build_object` call within the Postgres argument limit, and keeps keys unique.
- `package.json` adds `test:ecl-dense-readback-query` for the focused regression check.

## QA / Validation

- Pass — `npm run test:ecl-dense-readback-query`
- Pass — `npm run ecl:dense-aca-job:dry-run`
- Pass — `npm run ecl:dense-aca-job:validate`
- Pass — `npm run release:check`

## Rollout Plan

Merge to main by pull request. The repo-owned ACA main deploy workflow builds the new digest-pinned image. The governed ACA data-build job can then be rerun using that image.

## Deployment Authority

- Repo-owned deploy workflow: Required through normal main deploy workflow after merge.
- Shared runtime mutators: None in this release.
- Approved image digest: Set by the repo-owned deploy workflow.
- ACA runtime invariant: Required before rerunning the data-build job.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: No.

## Rollback Plan

Revert the PR to restore the previous query shape. No data rollback is attached to this script-only change.

## Audit Evidence

- Pull request for this release.
- Failed ACA run `job-abarva-private-operator-eus-bhk5zwg` showed `cannot pass more than 100 arguments to a function` in the independent readback query.
- Local dry-run and validator output.

## Known Gaps

The failed ACA run reached the data-build script and failed during its own readback phase. A fresh governed ACA load/readback run is still required after this fix is deployed.
