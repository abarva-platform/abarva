# 2026-09-02-migration-drift-nightly-reachability — Nightly Migration Drift Monitor Reachability

## Release ID

`2026-09-02-migration-drift-nightly-reachability`

## Status

`candidate`

## Plain-English Summary

Updates the nightly migration drift monitor so it checks the live database through the private operator job path instead of trying to connect from a hosted GitHub runner. The workflow remains read-only and reports three distinct states: checked with no pending migrations, checked with pending migrations, or not checked.

## Layer Impact

Control plane: updates CI monitoring for the migration ledger comparison.

Data plane: read-only status check only. No migration is applied and no client data is read or written by this workflow.

## Client Applicability

- All clients: Yes, because the monitor covers the shared lab/product database migration ledger.
- Specific clients: None.
- Internal only: Operational monitoring only.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- PR: https://github.com/abarva-platform/abarva/pull/7312
- Workflow: `.github/workflows/migration-drift-nightly.yml`

## QA / Validation

- PR workflow syntax parsed and started successfully.
- Release gate validates this record.
- Full live proof requires dispatch from `main`, because Azure OIDC credentials are scoped to the governed main-branch authority boundary.

## Rollout Plan

Merge to `main`. The next scheduled run or an explicit `workflow_dispatch` from `main` activates the updated monitor. No app deployment, database migration, traffic shift, or feature flag is required.

## Deployment Authority

- Repo-owned deploy workflow: Not applicable.
- Shared runtime mutators: None.
- Approved image digest: The workflow resolves and uses the currently deployed digest-pinned image.
- ACA runtime invariant: Not changed.
- Worker image invariant: Not changed.
- Feature/env flag update path: None.
- Live signed-in proof required: No; this is an internal CI monitor.

## Rollback Plan

Revert the workflow change on `main`. If the monitor fails unexpectedly, disable the schedule or revert while preserving the governed database migration workflow.

## Audit Evidence

- PR #7312.
- Release Control Gate result after this record is added.
- Initial successful or failing main-branch dispatch of this workflow.
- Uploaded workflow artifact `migration-drift-<run_id>`.

## Known Gaps

This monitor compares repository migrations against the `schema_migrations` ledger. It does not prove that objects created by an applied migration still exist in the database; object-level schema readback is a separate check.
