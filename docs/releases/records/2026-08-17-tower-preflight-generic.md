# 2026-08-17-tower-preflight-generic — Ask what the destination requires, not what we expect

## Release ID

`2026-08-17-tower-preflight-generic`

## Status

`candidate`

## Plain-English Summary

The preflight added in the previous release checked that the columns this projector writes exist. That
is the wrong direction, and it failed on its first real run.

Checking "are my columns present" passes when the table has an **extra mandatory column nobody here
knows about**. `tower.metric_observation.provenance_id` is `NOT NULL`, is not supplied by this
projector, and — the part worth pausing on — **appears in no migration in this repository.**

So the live schema and the repo's migrations have diverged. The database contains constraints and
columns that nothing in version control describes, which means reading the repo can never be
sufficient and the database is the only accurate description of its own shape.

The preflight now enumerates what the destination *demands*: every `NOT NULL` column with no default,
across all three tables, checked against what this projector supplies. One run now reports every
unmet requirement at once instead of surfacing them one deploy cycle at a time.

## Layer Impact

**Release lane: `client-data-lane`.** Read-only preflight change.

## Client Applicability

- Specific clients: both active tenants
- Internal only: no
- Feature flag: none

## Changes Included

- `scripts/data-build/refresh-tower-value-evidence.ts` — preflight inverted to enumerate mandatory
  columns rather than verify expected ones.

## QA / Validation

- Pass: `tsc -p tsconfig.json --noEmit` — 0 errors.
- Pass: `eslint` — 0 errors.
- Pass: `npm run release:check`.

## Rollout Plan

Merge, deploy, re-run. The run either succeeds or names every remaining unmet column in one message.

## Deployment Authority

Repo-owned ACA main deploy workflow; the build runs as an ACA Job.

## Rollback Plan

Revert. The preflight is read-only.

## Audit Evidence

- Four failed executions, each naming a different assumption: a missing hash, two guessed column
  names, an unreadable CHECK constraint, and an unknown mandatory column.

## Known Gaps

- **Schema drift between migrations and the live database is unaddressed.** This release works around
  it. The underlying problem — that `provenance_id` and the `subject_kind` constraint exist in the
  database and in no migration — means anyone reading this repository to understand the schema is
  reading an incomplete description. That deserves its own remediation, not a preflight.
- **Other projectors still assume.** The landscape projector writes without a preflight; it has
  stopped being wrong, which is not the same as being checked.
