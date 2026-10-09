# 2026-10-10 — Re-declare the SQL tenant-key canonicalizer before it is needed

## Release ID

`2026-10-10-restore-canonical-tenant-key`

## Status

`candidate`

## Plain-English Summary

A governed `apply` run of the lab migration lane (`db-migration-lab.yml`) had
five pending migrations. It stopped at the first one,
`20261006193500_source_nda_template_event_canonical_fk.sql`, with
`function canonical_tenant_key(text) does not exist`. That migration adds a
generated column using the SQL canonicalizer `canonical_tenant_key(TEXT)`.

The function was introduced in `20260516090000_rls_coverage_gaps.sql`, and the
live migration ledger records that migration as applied. The function still is
not resolvable on that database's search path. Fresh replays pass because they
create the function in sequence, so CI could not see the gap.

The runner applies each migration in its own transaction and stops at the first
failure, so nothing was applied. The database is unchanged.

This change adds one migration that sorts just before the failing one. It
re-declares `public.canonical_tenant_key(TEXT)` with exactly the same body as
the May migration, and repeats its grant. It is idempotent: `CREATE OR REPLACE`
is a no-op where the function already exists identically. With it in place, the
five pending migrations can apply in order:
- the two Source migrations from 6 October (a canonical-key FK for NDA
  template events, and request-level intake dispositions), whose application
  code is already deployed;
- the three Moves migrations (assumptions register, public-source research,
  review note).

## Layer Impact

- Release lane: `client-data-lane` (schema).
- Canonical model: no new object. This restores an existing helper function.

## Client Applicability

- All clients: yes. It is a schema helper on the shared lab database. It has
  no behaviour change except that dependent DDL can now resolve the function.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `supabase/migrations/20261006193400_restore_canonical_tenant_key.sql`.

## QA / Validation

- `scripts/audit-migrations.mjs`: pass, with no finding for the new file.
- `migration:seals:check`: pass.
- Migration-scanning suites: pass (214 tests).
- CI's fresh Postgres migration replay runs on this PR.
- The function body matches the May migration exactly, and its alias map
  matches `src/lib/tenant-keys.ts`.
- `npm run release:check`: pass.

## Rollout Plan

Merge through the protected main branch. The repo-owned deploy ships the image.
Then dispatch `db-migration-lab.yml` with `mode=apply`, after a `mode=status`
run confirms the pending list.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Migration lane: `.github/workflows/db-migration-lab.yml`, dispatched by the
  product owner's authorization in session.
- Shared runtime mutators: none outside those workflows.
- Approved image digest: assigned by the deploy workflow.
- ACA runtime invariant: the migration lane runs in the currently deployed,
  digest-pinned image.
- Worker image invariant: unchanged.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: the lane's schema readback and repository
  readback steps.

## Rollback Plan

The function is required by the source event FK migration and by RLS policies,
so it is not dropped. If needed, re-declare it with an identical body; that has
no effect.

## Audit Evidence

- The failed apply run's evidence artifact (job log showing the missing
  function), and the later successful apply run.

## Known Gaps

- The root cause of the ledger/schema drift (ledger says applied, function not
  resolvable) is not diagnosed from inside the database. This change is a
  forward fix. A read-only inspection of the function's schema and search path
  on the live database is recommended.
