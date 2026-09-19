# 2026-09-19-source-event-version-authority — Source Event Version Authority

## Release ID

`2026-09-19-source-event-version-authority`

## Status

`candidate`

## Plain-English Summary

Source New request and strategy approval readiness now has a governed version-authority contract. Request and strategy content is hashed deterministically, material edits create a new version, and approvals count only when they name the exact current version, event, tenant, authority kind, and actor.

## Layer Impact

Release lane: `client-data-lane`.

Layer 3 canonical authority: adds authored schema for immutable event request and strategy versions plus version-bound approval receipts. This is the authoritative record for approval versioning.

Layer 4 Source projection: adds a pure read/projection contract that Source readiness can consume without making Source own the underlying facts.

## Client Applicability

- All clients: receives the code contract after merge.
- Specific clients: none.
- Internal only: migration apply remains an operator-controlled step and is not included here.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `src/lib/source/new-workspace/source-version-authority.ts`
- `src/lib/source/new-workspace/source-version-authority.test.ts`
- `supabase/migrations/20260919152000_source_event_authority_versions.sql`
- `src/__tests__/integration/source/source-event-authority-versions-migration.test.ts`
- `.github/workflows/db-migration-ci-selftest.yml`

## QA / Validation

- Failing-first focused suite: missing module and missing migration failed before implementation.
- `npx jest --runTestsByPath src/lib/source/new-workspace/source-version-authority.test.ts src/__tests__/integration/source/source-event-authority-versions-migration.test.ts --runInBand` passed: 2 suites, 11 tests.
- Mutation proof: disabling canonical key sorting failed 2 tests; reusing current versions regardless of hash failed 1 test; ignoring approval `versionId` failed 2 tests; renaming/removing the current-version index contract failed 1 migration test.
- Scope mutation proof: removing the composite approval/version identity or the same-scope supersession trigger fails the migration contract suite.
- The migration contract suite is registered in the disposable Postgres migration workflow. No shared database was changed.
- Disposable Postgres 16 proof applied the migration, accepted a correctly scoped approval, rejected an approval that mixed one event/tenant with another event's version through the composite foreign key, and rejected a cross-event supersession through the lineage trigger.

## Rollout Plan

Merge through PR to `main`. The code contract becomes available with the normal repo-owned Azure Container Apps deploy. The migration is authored only; applying it requires separate migration approval and operator execution.

## Deployment Authority

- Repo-owned deploy workflow: required after merge for runtime availability.
- Shared runtime mutators: none in this change.
- Approved image digest: pending deploy.
- ACA runtime invariant: pending deploy.
- Worker image invariant: pending deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: yes before claiming user-visible Source New acceptance.

## Rollback Plan

Before migration apply, rollback is a normal code revert. After any separately approved migration apply, rollback must preserve already-written version and approval rows; disable callers first, then use an operator-approved migration plan if schema rollback is required.

## Audit Evidence

Inspect the PR, focused Jest output, mutation notes in the PR, this release record, and the authored migration file. No database apply evidence exists for this candidate because no migration was applied.

## Known Gaps

The migration was not applied. No tenant data was mutated. No Source New write path was wired to write these rows. No signed-in acceptance was attempted or claimed.
