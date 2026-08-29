# 2026-08-29-tower-active-assessment-recency — The reader ranks assessments the way the SQL does

## Release ID

`2026-08-29-tower-active-assessment-recency`

## Status

`candidate`

## Plain-English Summary

Tower serves one assessment per tenant, and the serving layer already decides which:
`serving.tower_active_assessment_keys()` orders candidates by build priority, then projection
version, then **`created_at` descending** — newest load wins — with `assessment_id` only as a
last-resort tiebreak. Every `serving.tower_*` view joins that function.

The application reader keeps its own copy of that selection, as a defence for databases where the
join is not in place. That copy was missing the recency term entirely: it went from projection
version straight to `assessment_id.localeCompare`. So whenever priority and version tied, a
superseded assessment could beat a newer one **on alphabetical order alone** — which is what was
happening, because the newer assessment id sorts below the older one.

The reader now ranks identically to the SQL. `created_at` is not a column on the serving view,
which is how it came to be dropped, but the view returns `payload_json` as `to_jsonb(p)` of the
projection row, so the value is carried there and no migration is needed. A row whose timestamp is
absent or unparsable sorts as oldest, never newest, so it can never displace a real load.

## Layer Impact

Release lane: `global-control-lane`.

- **App read path only.** `readTowerCommandCenter.ts` gains a recency term in
  `activeServingIdentity()` and a `servingRowCreatedAt()` helper.
- No SQL, no migration, no projection or metric change. The serving function is already correct and
  is untouched.

## Client Applicability

- All clients: yes — any tenant with more than one assessment in `ecl_projection`.
- Feature flag: none.

## Changes Included

- `src/lib/tower/readTowerCommandCenter.ts`
- `src/lib/tower/__tests__/serving-active-assessment.test.ts` (new)

## QA / Validation

- New suite → 6/6. It pins the SQL's ordering (recency ahead of the id tiebreak, and that the views
  join the function) and that the reader's terms appear in the same order, so the two cannot drift
  again without a test failing.
- `readTowerCommandCenter.test.ts` passes **unchanged**. That suite deliberately feeds the reader
  two assessments and expects it to pick the active one; it is the reason the defence exists and
  the reason it was not simply deleted.
- `jest src/lib/tower/__tests__ src/components/tower/command-center/__tests__` → 119 pass / 21 fail
  across 6 suites. Baseline on `origin/main`: 21 fail across 6 suites. Identical; the +6 are this
  change's own.
- `tsc -p tsconfig.json --noEmit` (8 GB heap) → clean.
- `eslint` on both files → clean.
- `node scripts/release-check.mjs --base origin/main --head HEAD` → passes with this record.

## Rollout Plan

Merge to `main` by squash; the ACA main deploy workflow builds and deploys. No migration, no data
build, no flag change.

## Deployment Authority

- Repo-owned deploy workflow: unchanged.
- Shared runtime mutators: none. No `az` command in this release.
- ACA runtime invariant: re-prove post-deploy before claiming `live-proven`.
- Live signed-in proof required: yes — a signed-in `/tower` capture showing the most recently
  loaded assessment, identified by its source files.

## Rollback Plan

Revert the squash commit. Code-only, no schema or data change. Reverting restores a selection that
can prefer an older assessment on alphabetical order.

## Audit Evidence

- The two-file diff.
- New-suite output and the before/after counts above.
- Post-deploy: a signed-in capture naming the served assessment's source files.

## Known Gaps

- Not live-proven; `candidate`.
- **This does not remove superseded assessments.** They remain in `ecl_projection` and are simply
  no longer selected. Retiring them is separate work, and worth doing — an unbounded set of
  candidates is a selection problem waiting to recur.
- The reader still duplicates a rule that lives in SQL. The tests now hold the two in step, but the
  durable fix is for the serving views to be the only place that decides, once every database is
  known to carry the join.
