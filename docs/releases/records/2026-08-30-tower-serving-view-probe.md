# Tower — find out why the serving views return every generation

## Release ID

`2026-08-30-tower-serving-view-probe`

## Status

`candidate`

## Plain-English Summary

`serving.tower_ai_portfolio` returns 415 rows for a tenant whose active generation holds 55. That
415 is 360 retired rows plus the 55 current ones, so the view is returning every generation that
has ever been built.

The migration that defines `serving.tower_ai_rows` joins `serving.tower_active_assessment_keys()`
on tenant, assessment and projection version, which should make that impossible. So either the
deployed view is not the one that migration describes, or the join is not doing what it reads as
doing. Both are worth knowing and neither is guessable from source — the serving views, like the
tables under them, have no migration in this repository and exist only in a draft file.

The application is unaffected because it filters generations itself, in TypeScript, in
`rowsForActiveServingIdentity`. That is why the page renders 55 rows correctly while the view
returns 415. It also means the filtering is a property of one reader rather than of the data, and
any other consumer of these views sees every generation.

This adds a read-only probe that dumps each deployed view's body, whether it references the
active-keys function, the rows it returns per generation, and what the function currently resolves.

## Layer Impact

Lane: `internal-admin` — AbarVa-only operations capability; no product lane is touched. Read-only,
no schema or code change, nothing calls it.

## Client Applicability

**Internal only.** The probe reports view metadata and row counts — no client data.

## Changes Included

- `scripts/ops/probe-tower-serving-views.mjs`
- `package.json` — `ops:probe-tower-serving-views`

## QA / Validation

**Status: PASS.**

| Check | Result |
| --- | --- |
| `node --check` | PASS |
| Mutating-statement scan | PASS — every statement is a `SELECT`; the only keyword matches are prose |
| `package.json` parse | PASS |
| Run against the data plane | PENDING — immediately after merge |

## Rollout Plan

Merge, then run through `npm run ops:aca-job`, digest-pinned, with
`--secret-env DATABASE_URL=azure-postgres-control-database-url`.

## Deployment Authority

`.github/workflows/aca-main-deploy.yml` on merge to `main`; the probe runs through the governed ACA
Job wrapper.

## Rollback Plan

Delete the script and npm entry.

## Known Gaps

- The probe diagnoses; it does not fix. What the fix should be depends on what it finds, and the
  two possibilities need different changes: a stale view definition needs re-creating, a faulty
  join needs correcting.
- Lab only.

## Audit Evidence

The Layer 4 rebuild on 2026-08-30 reported `serving_tower_ai_portfolio_expected_42_got_415` and
`serving_tower_command_center_expected_77_got_1007` while every write-side integrity check passed
with zero drift. A prior probe run established Meridian holding 55 rows at projection version 2 and
360 at version 1.
