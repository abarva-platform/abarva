# 2026-08-17-tower-evidence-columns — Align the Tower evidence writer to the real schema

## Release ID

`2026-08-17-tower-evidence-columns`

## Status

`candidate`

## Plain-English Summary

The Tower evidence projector wrote `tracked_subject.label` and `metric_observation.value`. The columns
are `title` and `value_num`. The write run failed on the first insert.

This is the second time in this work a projector has been written against an assumed schema rather
than a read one — the first was a missing `content_hash`. Both failed safely because the writes are
transactional, and both cost a deploy cycle that reading the migration first would have saved.

## Layer Impact

**Release lane: `client-data-lane`.** Column names only. No behaviour change.

## Client Applicability

- Specific clients: both active tenants
- Internal only: no
- Feature flag: none

## Changes Included

- `scripts/data-build/refresh-tower-value-evidence.ts` — `label` → `title`, `value` → `value_num`.

## QA / Validation

- Pass: `tsc -p tsconfig.json --noEmit` — 0 errors.
- Pass: dry-run unchanged — 50 subjects, 305 observations, 102 claims, 16 claimable.
- Pass: `npm run release:check`.

## Rollout Plan

Merge, deploy, re-run `data-build:tower-evidence` as an ACA Job with write approval.

## Deployment Authority

Repo-owned ACA main deploy workflow; the build runs as an ACA Job.

## Rollback Plan

Revert. Nothing was written by the failed run — the insert failed inside the transaction.

## Audit Evidence

- Failed execution log naming `column "label" of relation "tracked_subject" does not exist`.
- The commit and its PR.

## Known Gaps

- **The projector still has no schema assertion.** It discovers a column mismatch by failing against
  the real table. That is survivable because the write is transactional and unacceptable as a habit:
  a build that reads its destination's columns before writing would have caught both this and the
  `content_hash` defect at dry-run, on a laptop, in seconds.
