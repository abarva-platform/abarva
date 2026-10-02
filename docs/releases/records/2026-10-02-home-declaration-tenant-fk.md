# 2026-10-02-home-declaration-tenant-fk — A Home declaration can name only its own tenant's manifest

## Release ID

`2026-10-02-home-declaration-tenant-fk`

## Status

`candidate`

## Plain-English Summary

Home chooses which assessment a tenant reads from a declaration row, and that row names a projection manifest. The table referenced the manifest by its id alone, so the database accepted a declaration for one tenant that named another tenant's manifest, or a manifest of another assessment. The Home reader refuses to serve such a declaration; nothing refused to store it.

This adds a migration that makes the database refuse it: a declaration must name a manifest with the same tenant and the same assessment. It writes no row and changes no valid declaration.

The migration is not applied by merging this change. A stored declaration that already breaks the rule makes the migration fail as a whole and change nothing, which is how such a row would be found.

## Layer Impact

- Release lane: `client-data-lane`.
- Layer 3, Canonical model, and the projection tables: one unique index on the projection manifest table over its id, tenant and assessment, and one foreign key from the Home declarations table to it. Additive. No row is read, written or rewritten.
- Layer 4, Products: none. The Home reader is unchanged and keeps its own checks, which cover what a foreign key cannot: that the manifest is a Home projection and still carries the two hashes the declaration recorded.
- Layers 1 and 2, intake and adapters: not touched.

## Client Applicability

- All clients: once applied, the constraint holds for every tenant's declarations. A declaration that names its own tenant's and assessment's manifest is stored exactly as before.
- Specific clients: none named or special-cased.
- Internal only: the migration and the database suite that holds it.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `supabase/migrations/20261002060000_home_active_assessment_tenant_fk.sql` (new): the unique index and the foreign key, each added only when absent, inside one transaction with a lock timeout.
- `scripts/ecl/__tests__/test_home_selection_tenant_fence.ts`: after the reader's own refusals have been exercised on the schema without the migration, the suite applies it and holds that it fails whole while a declaration that breaks the rule is stored, applies cleanly and repeatably once that row is gone, refuses another tenant's manifest by insert and by update and another assessment's manifest, and still stores a manifest of the same tenant and assessment that is not a Home projection, which the reader then refuses.
- `.github/workflows/home-selection-tenant-fence.yml`: the suite's trigger list gains the migration.

## QA / Validation

- pass: the two-tenant suite, with the new phase, against a disposable local Postgres 18. The workflow runs it on Postgres 16.
- pass: five single-edit mutations of the migration, each restored, each failing the suite: no foreign key added; a foreign key on the manifest id alone; the assessment left out of the key; the index created unconditionally; the constraint added unconditionally.
- not held: removing the migration's own transaction is not detected. The suite and the repository's migration runner both apply a file as one transaction, so the file's own transaction changes nothing for them. It matters when a file is applied statement by statement, and no test covers that.
- pass: ESLint on the touched suite; project type-check, `tsc --noEmit`, exit 0; `npm run release:check`.
- not run: the migration against the lab database, and the lab migration workflow in either mode.

## Rollout Plan

Merge by pull request. Merging applies nothing: a merged migration stays pending until the lab migration workflow is deliberately dispatched, first in `status` mode and then in `apply` mode. The nightly drift check reports a merged migration as pending until it is applied.

Before applying, confirm read-only that every stored declaration, active or retired, names a manifest with its own tenant and assessment. If one does not, the migration fails and changes nothing, and that row needs a decision before the migration can be applied.

No application code depends on the constraint, so the image that carries this file can be deployed before, after or without the migration being applied.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` for the image that carries the file; `.github/workflows/db-migration-lab.yml` for applying it.
- Shared runtime mutators: none in this change.
- Approved image digest: recorded by the successful main deploy.
- ACA runtime invariant: required after the image deploy, as for any merge.
- Worker image invariant: required after the image deploy, as for any merge.
- Feature/env flag update path: not used.
- Live signed-in proof required: no. Nothing a signed-in user sees changes.

## Rollback Plan

Before it is applied: revert the pull request. After it is applied: nothing depends on the constraint or the index, and leaving them in place is safe; removing them is a follow-up migration that drops the foreign key and then the index, through the same lane.

## Audit Evidence

The pull request and its checks, including the two-tenant workflow run; the mutation list above; and, when the migration is applied, the lab migration workflow's status and apply runs with their evidence artifacts.

## Known Gaps

- Not applied anywhere. Until it is, the reader is the only thing that refuses a declaration naming another tenant's manifest.
- The foreign key does not check that the manifest is a Home projection, or that it still carries the hashes the declaration recorded. The reader checks both.
- The earlier foreign key on the manifest id alone stays in place. The new one implies it.
- A declaration row, active or retired, still prevents its manifest from being deleted.
- The job that stores a declaration does not turn a refusal by this constraint into an operator-readable message; it would surface as a database error.
- The migration's own transaction is not held by a test, as stated above.
