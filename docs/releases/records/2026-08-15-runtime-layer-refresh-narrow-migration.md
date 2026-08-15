# 2026-08-15-runtime-layer-refresh-narrow-migration — Narrow migration operator script

## Release ID

`2026-08-15-runtime-layer-refresh-narrow-migration`

## Status

`candidate`

## Plain-English Summary

Adds forced migration scripts for the runtime layer refresh migration only. The live migration dry-run showed multiple pending migrations, so the refresh path needs a narrow operator script instead of broad `db:migrate:ci`.

## Layer Impact

- `runtime-layer-refresh` lane: Adds a scoped ACA operator migration entrypoint for the runtime layer refresh database objects.
- Layer 1: No change.
- Layer 2: No change.
- Layer 3: No data change in this PR. The script applies only the runtime layer refresh table/dictionary migration when invoked through the approved ACA operator job.
- Layer 4: No change.

## Client Applicability

- All clients: No default runtime behavior change.
- Specific clients: None by default; migration apply remains an operator action.
- Internal only: ACA operator migration command.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `package.json`: adds `runtime-layer-refresh:migrate:dry` and `runtime-layer-refresh:migrate:apply`, both forced to `20260815162000_intelligence_v6_runtime_layer_refresh.sql`.

## QA / Validation

- Pass: package scripts resolve to the forced runtime layer refresh migration only.
- Pass: ACA operator `--plan-only` accepted `runtime-layer-refresh:migrate:dry`.
- Pass: ACA operator `--plan-only` accepted `runtime-layer-refresh:migrate:apply`.
- Not run yet: live migration dry/apply through ACA operator; requires merge and repo-owned deploy first.

## Rollout Plan

Merge to main, allow the repo-owned ACA deploy workflow, then run `runtime-layer-refresh:migrate:dry` and `runtime-layer-refresh:migrate:apply` through the digest-pinned ACA operator job before retrying the runtime layer refresh job.

## Deployment Authority

- Repo-owned deploy workflow: Approved for this session.
- Migration apply: Approved only for `20260815162000_intelligence_v6_runtime_layer_refresh.sql`.
- Broad pending migration apply: Not approved by this record.
- Live truth claims: Not approved by this record.

## Rollback Plan

Revert the package script additions if no longer needed. If the migration is applied, schema rollback requires an explicit database rollback plan and operator approval.

## Audit Evidence

- Pending: narrow migration dry-run proof.
- Pending: narrow migration apply proof.

## Known Gaps

- This does not run the migration.
- This does not retry the runtime layer refresh job.
