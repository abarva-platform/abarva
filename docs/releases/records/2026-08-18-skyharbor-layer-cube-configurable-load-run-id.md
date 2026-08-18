# 2026-08-18-skyharbor-layer-cube-configurable-load-run-id — Layer-Cube Loader Load-Run-Id Made Configurable

## Release ID

`2026-08-18-skyharbor-layer-cube-configurable-load-run-id`

## Status

`candidate`

## Plain-English Summary

`source.contract_360` (the view the live Optimize Contract picker reads) joins `source.contract` to
`source.l4_cube_active_load_run` on `(tenant_key, load_run_id)`. Exactly one `load_run_id` is marked
active per tenant — a pointer owned by an automated "runtime-layer-refresh" pipeline, confirmed live via
`inspect-source-contract-360-definition.mjs` to currently be `runtime-layer-refresh-2026-08-17-e6419145`
for the synthetic demo airline tenant, with 65 rows in `source.contract` under that id. A separate,
earlier load of 2 canonical contract rows (`scripts/source/load-skyharbor-source-layer-cube-package.mjs`)
used its own hardcoded `load_run_id`, so those 2 rows exist in `source.contract` but are invisible to
`source.contract_360` — not a schema-drift problem, as an earlier diagnosis in this investigation
suspected, but a load-run-id mismatch.

`LOAD_RUN_ID` in that loader is now a `--load-run-id` / `LOAD_RUN_ID` env-configurable value (default
unchanged) instead of a hardcoded constant. Running it with `--load-run-id
runtime-layer-refresh-2026-08-17-e6419145` retags the 2 existing contract rows (and their supporting
rows) to the tenant's currently-active load run via the loader's existing `ON CONFLICT (tenant_key,
contract_id) DO UPDATE` upsert — no duplicate rows, no rows removed from the 65 already active under
that id.

## Layer Impact

- Release lane: `client-data-lane`
- Products: Source (Optimize Contract picker read path) for the synthetic demo airline tenant only.
- Canonical model: No schema/migration change. Adds a configuration knob to an existing loader; the
  default value and behavior are unchanged when the flag is not passed.

## Client Applicability

- All clients: No.
- Specific clients: The synthetic demo airline tenant's Source contract-evidence data plane.
- Internal only: Yes — operator-run ACA Job.
- Public/demo only: Yes.
- Feature flag: None.

## Changes Included

- `scripts/source/load-skyharbor-source-layer-cube-package.mjs` — `LOAD_RUN_ID` changed from a hardcoded
  module constant to a mutable value resolved from `--load-run-id` / `LOAD_RUN_ID` env / the prior
  default, set before `loadPackage()` runs.

## QA / Validation

- `node --check scripts/source/load-skyharbor-source-layer-cube-package.mjs` — syntax valid.
- Local plan-mode run with `--load-run-id runtime-layer-refresh-2026-08-17-e6419145` confirms
  `loadRunId` in the printed plan reflects the override.
- `node scripts/release-check.mjs --base origin/main --head HEAD` — pass.
- Live apply-pass proof (row counts, `source.contract_360` visibility) captured in the operator run
  summary, not in this record, per the public-repo disclosure rule against narrating a specific
  engagement's data in a public artifact.

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps main deploy workflow builds and deploys the new
image. Re-run `source:skyharbor-layer-cube:apply` (or the ACA Job equivalent) with `--load-run-id
runtime-layer-refresh-2026-08-17-e6419145` to retag the 2 existing rows onto the tenant's active load
run — or whatever `load_run_id` is active at the time, confirmed first via
`source:inspect-contract-360-definition`.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Produced by the deploy workflow.
- ACA runtime invariant: Verify template image, 100% traffic revision image match the deployed digest
  before re-running the operator job.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes — confirm the two contracts appear in the live Optimize Contract
  picker after the retag.

## Rollback Plan

Revert this commit, or roll the ACA image back to the previous healthy digest. The retag itself is a
row-level `UPDATE` via upsert (not a schema change); reverting the code does not undo an already-applied
retag, but re-running the loader with its old default `load_run_id` would move the two rows back.

## Audit Evidence

- Pull request URL after PR creation.
- GitHub Actions checks for the PR.
- ACA main deploy run after merge.
- ACA operator job execution log showing the retag and updated `source.contract_360` row count.
- Live picker screenshot/read showing both contracts present.

## Known Gaps

- The tenant's active `load_run_id` is owned by an external automated refresh pipeline outside this
  loader's control. If that pipeline runs again and rotates to a new `load_run_id` (its naming pattern
  suggests a roughly daily cadence, observed on 2026-08-16 and 2026-08-17), the two retagged rows would
  need to be retagged again to the new active id. This is a known, accepted risk for a demo-prep window,
  not something this change attempts to solve structurally.
