# Tower — make tenant isolation a property of the data

## Release ID

`2026-08-30-tower-projection-tenant-policies`

## Status

`candidate`

## Plain-English Summary

All four Tower projection tables have RLS enabled with **zero policies**. In Postgres that denies
every read to any role which does not bypass RLS — and the application reads them successfully, so
its role bypasses. Tenant isolation therefore rests entirely on the `where tenant_key = $1` in
`readTowerCommandCenter`. A query that omits the predicate is stopped by nothing.

This is the same structural weakness that let the serving functions return retired generations: a
governed property living in a caller rather than in the substrate. That one was closed earlier
today by joining the active-generation keys in the database. This closes the tenancy half.

Each table gains a tenant-scoped `select` policy following the pattern already established in
`intelligence_v7` and used on `tower_assessment_lifecycle`.

## Why this is safe, stated precisely

A table with RLS enabled and no policies **already denies everything** to a non-bypassing role. A
permissive policy can therefore only *grant* access, never remove it, and a bypassing role is
unaffected in either state. The change cannot reduce what any current consumer can read.

This corrects an earlier assessment of my own. I had described adding these policies as changing
reads on every surface at once and treated it as high blast radius. That was wrong in direction:
the risk of a mismatched policy is real only where RLS is enforced *and* policies already exist.
Here the floor is zero.

`force row level security` is deliberately **not** set. Forcing it would subject the table owner to
the policy, which is the one change that could remove access from the role the product reads with.

## Layer Impact

Lane: `global-control-lane` — shared control-plane behaviour for all clients. Layer 4 physical
substrate. Four policies; no table, column, view, function, data or application change.

## Client Applicability

**All clients.** No rendered figure changes and no current read path is affected. The change
matters for what becomes possible rather than what is: a future consumer, or a connection role
without bypass, is now confined to its own tenant by the database.

## Changes Included

- `supabase/migrations/20260830210000_tower_projection_tenant_policies.sql`
- `scripts/ops/probe-tower-rls.mjs` — read-only report of role, RLS state, ownership and policy
  count per table
- `package.json` — `ops:probe-tower-rls`, `tower:migrate:rls:dry`, `tower:migrate:rls:apply`
- `src/lib/tower/__tests__/case-attribute-widening.test.ts` — four guards

## QA / Validation

**Status: PASS.**

| Check | Result |
| --- | --- |
| `case-attribute-widening` | PASS — 77/77, four new guards |
| Tower suites | PASS against baseline — failing set identical to `origin/main` |
| `tsc --noEmit` | PASS — clean |
| Applied to a database | NOT RUN — the rollout plan below is the proof |

One guard pins the predicate to the doubled-quote spelling the migration actually emits. The
predicate is built through `format()`, so it lives inside a SQL string literal; a guard checking
the unescaped spelling would pass against a migration that never runs.

Another guard asserts `force row level security` is absent, for the reason given above.

## Rollout Plan

Through `npm run ops:aca-job`, digest-pinned, with
`--secret-env DATABASE_URL=azure-postgres-control-database-url`:

1. `ops:probe-tower-rls` — capture role, ownership, RLS and policy counts before.
2. `tower:migrate:rls:dry`.
3. `tower:migrate:rls:apply`.
4. `ops:probe-tower-rls` — after; expect `policies` moving from 0 to 1 on each of the four, with
   `rls` still true and `forced` still false.
5. `ops:probe-tower-serving-views` — expect the row counts unchanged from the post-join capture,
   confirming the product's read path is untouched.

Step 5 is the one that matters. If any count moves, the app's role is not bypassing as assumed and
the policy is being enforced against it; revert immediately by dropping the four policies.

## Deployment Authority

`.github/workflows/aca-main-deploy.yml` on merge. The migration runs through the governed ACA Job
wrapper. No shared web runtime is mutated.

## Rollback Plan

`drop policy <name> on ecl_projection.<table>` for each of the four. RLS remains enabled with zero
policies, which is the state before this change.

## Known Gaps

- **These are `select` policies only.** Writes go through the loader's own role and are not
  covered; a write-side policy is a separate decision and needs the loader's role established
  first.
- **The bypass route is not yet known.** Ownership, `BYPASSRLS` and superuser all produce the
  behaviour observed, and they differ in whether the policy will ever be exercised. The probe in
  this change reports which.
- **The four tables still have no migration creating them.** This adds policies to tables whose
  definition is not in version control.

## Audit Evidence

`ops:probe-tower-serving-shape` on 2026-08-30 reported `rls_enabled=true policies=0` for all four
tables. `readTowerCommandCenter.ts:369` issues
`SELECT set_config('app.tenant_key', $1, false)` before every query, which is what makes the
predicate resolve.
