# 2026-06-01-rls-regression-service-role-only-classification — RLS Service-Role-Only Classification

## Release ID

`2026-06-01-rls-regression-service-role-only-classification`

## Status

`candidate`

## Plain-English Summary

The SQL-level RLS regression now distinguishes tenant-readable tables from known service-role-only tables. A known service-role-only table that returns `permission denied` under the downgraded `authenticated` role is reported as `service_role_only`, while leaks and unexpected permission errors still fail the run.

## Layer Impact

- `internal-admin` lane: Updates the security regression harness and its contract test only. No product runtime, user interface, production data, or database migration changes are included.

## Client Applicability

- All clients: The production SQL tenant-isolation check applies across the shared production database.
- Specific clients: None.
- Internal only: Security/release operators and CI evidence consumers.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `tests/security/rls-regression.sql` adds an explicit `rls_regression_service_role_only_tables` catalogue for known service-role-only tenant-scoped tables.
- The probe classifies expected `insufficient_privilege` results for those tables as `service_role_only`.
- Unexpected permission errors still remain `error:*` findings and fail the suite.
- `tests/security/rls-regression-contract.test.ts` pins the classification behavior and representative table catalogue.

## QA / Validation

- Failed proof run `26747482256` confirmed production SQL execution reached the database, had `leak=0`, and failed only because known service-role-only tables returned permission denied.
- Pass: `npx jest tests/security/rls-regression-contract.test.ts --runInBand`.
- Pass: `npm run release:check -- --base origin/main --head HEAD`.
- Pass: `git diff --check`.

## Rollout Plan

Merge to `main`. The next scheduled or manual production RLS regression will continue to fail on tenant leaks or unexpected SQL errors, while reporting known service-role-only tables separately.

## Rollback Plan

Revert the PR to restore the previous behavior where every `permission denied` finding fails as an error.

## Audit Evidence

- Manual production RLS proof run with zero leaks and service-role-only permission errors: `https://github.com/anandsundaram-hash/abarva/actions/runs/26747482256`
- PR: pending.
- CI run: pending.

## Known Gaps

The service-role-only catalogue is explicit and must be reviewed when new tenant-scoped service-role-only tables are added. This change does not convert those tables to per-user RLS.
