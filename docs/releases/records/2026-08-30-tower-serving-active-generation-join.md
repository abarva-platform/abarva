# Tower — make the active generation a property of the data

## Release ID

`2026-08-30-tower-serving-active-generation-join`

## Status

`candidate`

## Plain-English Summary

`serving.tower_ai_portfolio` returns 415 rows for a tenant whose active generation holds 55. The
415 is 360 retired rows plus the 55 current ones: the serving functions return every generation
ever built.

The application is unaffected, and that is the problem. It filters generations itself, in
TypeScript, in `rowsForActiveServingIdentity`. So the page is correct because one caller
compensates — correctness is a property of that reader, not of the data. Any other consumer of
these views sees retired rows, and the second consumer to exist will not carry that filter.

This adds the missing join onto `serving.tower_active_assessment_keys()` in both serving
functions, matching on tenant, assessment and projection version. It is what turns the assessment
lifecycle declaration from a record into a constraint: until now the declaration said which
generation was active and nothing enforced it.

## Why this is patched from the deployed body

Migration `20260829113000` defines both functions **with** this join, and that migration is
already applied — yet the deployed bodies do not contain it. Something replaced them afterwards.

Re-creating from the repository would therefore restore the join *and* silently revert whatever
else changed, on the read path of every Tower page. So the bodies here are the deployed text with
the join added and nothing else altered. That was verified mechanically, not by eye:
`tower_command_rows` gains four lines and removes none; `tower_ai_rows` gains the same four, its
`from` line changing only because the statement terminator moved to the end of the join.

## What is deliberately not fixed

`tower_ai_rows` also lacks the `page_key` predicate the same migration defines, which is why
`serving.tower_ai_portfolio` and `serving.tower_adoption_lens` return identical row sets — the
adoption lens is meant to return the thirteen tool rollouts. That is a real defect and a separate
change. Widening a live read-path fix past a single clause is how a reporting bug becomes a data
bug.

A consequence worth stating: with the join alone, `serving.tower_ai_portfolio` returns 55 — the
active generation's cases and rollouts together — not 42. The Layer 4 readback expects 42 and will
still flag until the page predicate is restored.

## Layer Impact

Lane: `global-control-lane` — shared control-plane behaviour for all clients. Layer 3/4 serving
boundary. Two function bodies; no table, no data, no application code.

## Client Applicability

**All clients.** No rendered figure changes: the reader already applies the same filter, so the
views returning fewer rows is invisible to the product and material to everything else.

## Changes Included

- `supabase/migrations/20260830190000_tower_serving_active_generation_join.sql`
- `package.json` — `tower:migrate:serving-join:dry` and `:apply`
- `src/lib/tower/__tests__/case-attribute-widening.test.ts` — four guards

## QA / Validation

**Status: PASS.**

| Check | Result |
| --- | --- |
| `case-attribute-widening` | PASS — 73/73, four new guards |
| `tsc --noEmit` | PASS — clean |
| Diff minimality | PASS — verified line-by-line against the deployed bodies, not visually |
| Applied to a database | NOT RUN — the rollout plan below is the proof |

One guard asserts the join matches on all three identity columns. Tenant alone is not an identity:
two generations of one tenant differ by assessment and version, and matching on fewer columns lets
a retired generation through — which is the defect being fixed.

## Rollout Plan

Through `npm run ops:aca-job`, digest-pinned, with
`--secret-env DATABASE_URL=azure-postgres-control-database-url`:

1. `ops:probe-tower-serving-views` — capture before.
2. `tower:migrate:serving-join:dry`.
3. `tower:migrate:serving-join:apply`.
4. `ops:probe-tower-serving-views` — capture after.

Expected after, and each is a separate assertion:

- `serving.tower_ai_portfolio` for `meridian-health`: **415 → 55**.
- `skyharbor-air`: **360, unchanged.** Its rows are projection version 1 under its own active
  assessment and are entirely live. A fix that filtered Meridian correctly and dropped SkyHarbor
  would pass a naive check and be worse than the defect.
- `joins_active_keys` on both functions: `false → true`.

Any other movement stops the sequence.

## Deployment Authority

`.github/workflows/aca-main-deploy.yml` on merge. The migration runs through the governed ACA Job
wrapper. No shared web runtime is mutated.

## Rollback Plan

Re-apply the deployed bodies without the join — they are recorded verbatim in this change's diff,
which is the reason for patching from them rather than from the repository.

## Known Gaps

- **The `page_key` predicate on `tower_ai_rows` remains missing**, so the two AI views still return
  identical sets and the readback still expects 42 where the view returns 55.
- **The serving views have no migration of their own.** They exist in a draft file, and the
  deployed definitions have already diverged from the repository once. This change does not close
  that gap; it works around it safely.
- Lab only.

## Audit Evidence

`ops:probe-tower-serving-views` on 2026-08-30 reported `joins_active_keys=false` for
`tower_ai_rows`, `tower_command_rows` and all four views, with `tower_ai_portfolio` returning
`meridian-health v2 55`, `meridian-health v1 360` under assessment
`assessment-dense-source-room-20260823`, and `skyharbor-air v1 360`. The deployed function bodies
were dumped verbatim in the same run and are the basis for this migration.
