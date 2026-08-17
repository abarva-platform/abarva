# 2026-08-17-tower-final-columns — Supply what the preflight named

## Release ID

`2026-08-17-tower-final-columns`

## Status

`candidate`

## Plain-English Summary

The generic preflight worked. In one run it named every remaining unmet requirement instead of
surfacing them one deploy cycle at a time:

```
tower.metric_observation.provenance_id
tower.value_claim.outcome_metric_ref
tower.value_claim.claim_input_hash
```

None of the three appears in any migration in this repository — the same drift the previous release
documented. The difference is that this time the cost was one cycle rather than three.

All three are now supplied:

- **`provenance_id`** identifies the build that produced the observation, so a figure on screen traces
  to the run that wrote it rather than only to the row it lives in.
- **`outcome_metric_ref`** is the metric the claim is about, which the projector already had.
- **`claim_input_hash`** hashes what the claim was computed from, so an unchanged claim is
  recognisable as unchanged across builds instead of looking rewritten every run.

The preflight also now reports foreign keys, because a `NOT NULL` column that is *also* a reference
cannot be satisfied by a generated value, and discovering that at insert time would cost another
cycle.

## Layer Impact

**Release lane: `client-data-lane`.**

## Client Applicability

- Specific clients: both active tenants
- Internal only: no
- Feature flag: none

## Changes Included

- `scripts/data-build/refresh-tower-value-evidence.ts` — three columns supplied; preflight extended
  to report foreign-key constraints.

## QA / Validation

- Pass: `tsc -p tsconfig.json --noEmit` — 0 errors.
- Pass: `eslint` — 0 errors.
- Pass: `npm run release:check`.
- Pass: dry-run — 50 subjects, 305 observations, 102 claims, 16 claimable.

## Rollout Plan

Merge, deploy, run the job.

## Deployment Authority

Repo-owned ACA main deploy workflow; the build runs as an ACA Job.

## Rollback Plan

Revert. Nothing has been written by this projector.

## Audit Evidence

- Five failed executions, and the preflight output that ended the sequence by naming three
  requirements at once.

## Known Gaps

- **The schema drift is still unresolved.** Five separate columns and constraints exist in the
  database and in no migration. This projector now copes; the next one written against `tower.*` will
  rediscover all of it unless the schema is reconciled or the preflight is extracted into a shared
  helper. The helper is the cheaper of the two and is owed.
