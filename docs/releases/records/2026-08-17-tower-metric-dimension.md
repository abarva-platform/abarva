# 2026-08-17-tower-metric-dimension — Let the projector populate the dimension it depends on

## Release ID

`2026-08-17-tower-metric-dimension`

## Status

`candidate`

## Plain-English Summary

`tower.metric_observation.metric_ref` carries a foreign key to a metric definition table. Like the
five columns and constraints before it, **that constraint exists in the database and in no migration
in this repository.**

The vocabulary is semantic — `project.approved_budget`, `ai.active_users` — not hashed, so generated
refs can never satisfy it.

Guessing the table name would have been a seventh guess in a sequence that has already cost six
deploy cycles. The foreign-key definition names the table, so this reads the definition, then writes
the dimension rows this run needs before writing the facts that reference them.

**A projector that depends on a dimension should be able to populate it.** Otherwise every refresh is
hostage to someone else having seeded that dimension first, and the failure when they have not is a
foreign-key violation fifteen minutes into a deploy.

## Layer Impact

**Release lane: `client-data-lane`.** The projector now writes dimension rows inside the same
transaction as the facts.

## Client Applicability

- Specific clients: both active tenants
- Internal only: no
- Feature flag: none

## Changes Included

- `scripts/data-build/refresh-tower-value-evidence.ts` — resolves the referenced table from the FK
  definition and upserts the metric definitions this run requires.

## QA / Validation

- Pass: `tsc -p tsconfig.json --noEmit` — 0 errors.
- Pass: `eslint` — 0 errors.
- Pass: `npm run release:check`.

Only the mandatory columns of the dimension are supplied, plus the key. Anything the dimension marks
optional stays empty rather than being invented to look complete.

## Rollout Plan

Merge, deploy, run the job.

## Deployment Authority

Repo-owned ACA main deploy workflow; the build runs as an ACA Job.

## Rollback Plan

Revert. Dimension rows are written with `on conflict do nothing` inside the same transaction as the
facts, so a rollback removes both together.

## Audit Evidence

- Six failed executions across the sequence, each naming a different undocumented requirement.
- `summary.metricDimension` records the table and column resolved from the constraint.

## Known Gaps

- **This is the sixth workaround for the same root cause.** `tower.*` in the live database differs
  from what this repository's migrations describe, in at least six ways now. Every projector written
  against it will rediscover the same things. The schema should be reconciled — or the live schema
  captured into a migration — and until that happens the preflight in this file is the only accurate
  description of what `tower.*` actually requires.
- **The dimension write is best-effort on column mapping.** It supplies the key and mandatory columns
  from a known-safe list. A dimension with a mandatory column outside that list will still fail, and
  the preflight will name it.
