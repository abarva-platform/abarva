# 2026-08-17-tower-schema-preflight — Ask the database instead of assuming it

## Release ID

`2026-08-17-tower-schema-preflight`

## Status

`candidate`

## Plain-English Summary

The Tower evidence projector has now failed three times on assumptions about its destination:

1. A `NOT NULL` column it did not supply (`content_hash` on the landscape pack).
2. Two columns whose names it guessed — `label` and `value` where the schema has `title` and
   `value_num`.
3. A `CHECK` constraint on `subject_kind` **whose permitted values appear in no migration in this
   repository.** There was nothing to read. Only the database knew.

Each failure cost a merge, a deploy and a job run to discover something the destination could have
been asked directly in the first second. The third one is the interesting case: no amount of reading
the repository would have prevented it, because the constraint is not expressed there.

So the projector now asks. Before writing anything it reads `information_schema.columns` for the
tables it targets and `pg_constraint` for their enumerated values, and either proceeds or fails
immediately with the permitted values named.

## Layer Impact

**Release lane: `client-data-lane`.** Adds a read-only preflight to an existing writer.

## Client Applicability

- Specific clients: both active tenants
- Internal only: no
- Feature flag: none

## Changes Included

- `scripts/data-build/refresh-tower-value-evidence.ts` — schema and constraint preflight; subject
  kinds coerced to a permitted value; scenario values validated.

## QA / Validation

- Pass: `tsc -p tsconfig.json --noEmit` — 0 errors.
- Pass: `eslint` — 0 errors.
- Pass: `npm run release:check`.
- Dry-run unchanged: 50 subjects, 305 observations, 102 claims, 16 claimable.

The preflight reports the permitted values it found into the run summary, so the next person does not
have to rediscover them either.

## Rollout Plan

Merge, deploy, re-run `data-build:tower-evidence` with write approval.

## Deployment Authority

Repo-owned ACA main deploy workflow; the build runs as an ACA Job.

## Rollback Plan

Revert. The preflight is read-only; removing it restores the previous behaviour of failing later.

## Audit Evidence

- Three failed executions, each naming a different assumption.
- The run summary's `schemaPreflight` block recording the permitted values.

## Known Gaps

- **Enum drift is coerced, not rejected.** An unrecognised `subject_kind` falls back to `initiative`
  rather than failing the build, because failing an entire refresh over one drifted enum is worse
  than recording a slightly coarser kind. An unrecognised `scenario` *does* fail, because a
  baseline written as an actual would corrupt the claim chain rather than coarsen it.
- **The other projectors do not do this yet.** The landscape projector still writes on assumption; it
  has simply stopped being wrong. Same preflight is owed there.
