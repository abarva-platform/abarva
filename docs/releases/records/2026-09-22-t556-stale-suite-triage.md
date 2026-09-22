# 2026-09-22-t556-stale-suite-triage — Fourth triage draw of twenty unrun suites

## Release ID

`2026-09-22-t556-stale-suite-triage`

## Status

`candidate`

## Plain-English Summary

The repository has more Jest suites than any CI workflow runs. Nobody knew how
many, or what was in them, so they have been triaged in batches: twenty suites
drawn from the highest-risk end of the census, each one executed, each one given
a written verdict and handed to a follow-on item. This is the fourth such batch.
It changes no product code and wires nothing on.

Twenty suites were executed individually before any verdict was written: **305
tests, 301 passed, 4 failed, 0 pending; 18 suites green, 2 red.** The verdicts
are 15 `wire_into_ci`, 3 `rewrite_as_behavior`, 1 `update_with_reason_recorded`,
1 `repair`.

**The two red ones are why the exercise exists.** One suite declares a hard
floor — zero hardcoded display strings for one canonical tenant anywhere in the
control plane — and that floor is breached in four files. Nothing runs the
suite, so the floor has been decorative for as long as the breach has existed.
The other has been red since 1 July, when a deliberate product change (#4276,
`1886b8d24`) replaced tenant display names with generic ones and three
expectations were not updated with it. Neither was found by CI, because CI does
not run either file. Both are filed for repair; neither is touched here.

**Among the greens, the one worth naming** executes the tenant database
connection resolver and proves it fails closed — no shared-database fallback
when a tenant-scoped secret is missing. That guarantee runs in no workflow
today.

Two controls were added to the guard that earlier batches did not have. The
first asserts the draw is disjoint from the three earlier triage records;
earlier batches stated that in prose and nothing checked it, so one file could
have been judged twice with the later verdict silently replacing the earlier.
The second draws a distinction the earlier rule got wrong: a suite that reads
source text as a stand-in for behaviour it could have executed must never be
wired into CI, but a suite whose *subject* is the source text — a declared floor
on what literals may appear in the control plane — has no behaviour to execute
instead. Rather than mislabel such a suite to escape the rule, the record
declares the distinction and the guard makes taking it expensive.

## Layer Impact

**Release lane: `internal-admin`.** This is AbarVa-only repository quality
tooling — a triage record and the behavioral guard that reads it. No client
receives anything, and no product surface changes.

- **Layer 4 (products):** none. No product surface, route, component or read
  path is touched.
- **Layer 3 (canonical model):** none.
- **Layers 1–2 (intake, adapters):** none.
- **Repository quality substrate:** one new record under `docs/architecture/`,
  one new behavioral guard under `src/__tests__/behaviors/`, and five item ids
  placed in the execution stage map so the generated board can see them.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes — repository quality tooling and a triage record
- Public/demo only: no
- Feature flag: none

## Changes Included

- `docs/architecture/t556-stale-suite-triage.json` — new. The draw, the
  execution evidence and one verdict per suite. Every count in it is read out of
  the Jest run that produced it; none was typed by hand.
- `src/__tests__/behaviors/t556-stale-suite-triage-record.test.ts` — new. 14
  cases guarding the record. Picked up by `npm run test:behaviors`, which runs
  the directory wholesale, so no workflow edit is needed.
- `scripts/exec/source-stage-map.json` — places `T-556` through `T-560`, and
  `T-596`, which was in the backlog and in no stage-map entry and so was
  reported `unmapped` by the board generator and never offered by the queue.
  `unmapped` is now `[]`.

## QA / Validation

Base `d17cd0c83b34b879487a17a12ea27eda8435986d`, in an isolated worktree.

**The twenty suites under triage.** Each run on its own with
`npx jest --runTestsByPath <path> --no-coverage --ci --json`, at
2026-09-22T10:30:37Z–10:30:54Z, before any verdict was written. Totals: 20
suites, 305 tests, 301 passed, 4 failed, 0 pending. The 4 failures are 3 in one
suite and 1 in another, both recorded with their cause. **None of the twenty
was edited**; the guard fails if any path under judgement appears in the
record's `claimedWriteFiles`.

**The guard, red first.** Written before the record existed and run against its
absence: `Test Suites: 1 failed`, `Tests: 0 total` — it could not even collect,
because the record it reads was not there. After the record was generated: **14
passed, 0 failed.**

**The guard, broken deliberately.** Nine mutations were applied to a scratch
copy of the record, one at a time, and the record was confirmed byte-identical
afterwards. **All nine were caught**, each by the case that should catch it:

| mutation | caught by |
|---|---|
| re-judge a path an earlier record already judged | disjointness case (+ the existence case) |
| use the text-is-the-subject flag to wire a scanner into CI | 4 cases |
| take that flag with no written reason | the flag case |
| claim that flag on a suite that is not a scanner | the flag case |
| count byte-matching cases without naming them | the partial-cases case |
| call a suite stale without naming the change that made it stale | the citation case |
| wire a proxy scanner into CI (the earlier batch's rule, kept) | the scanner case |
| wire a suite that never ran green | 2 cases |
| let the triage edit a file it judged | the no-self-editing case |

**Clean baseline over the same scope.** `npx jest src/__tests__/behaviors` run
in a separate worktree checked out at `origin/main`: **104 suites, 866 tests, 0
failing.** The same command on this branch: **105 suites, 880 tests, 0 failing.**
The whole delta is the new guard — one suite, fourteen cases — and no existing
behavior test changed state. No absolute failure count is quoted as if this
change caused it, because there is none: the directory was green before and is
green after.

**Other checks on this base:** `node scripts/exec/build-execution-queue.test.mjs`
— 107 passed, 0 failed, with the stage-map change in place.
`node scripts/quality/test-ci-coverage-census.mjs --json` — 154 governed-risk
rows in exactly two shapes, 83 covered reporting `run`/`green` as `"unknown"`
and 71 uncovered reporting `run: false`; **not one row claims green**, which is
the earlier census defect confirmed fixed rather than assumed.

## Rollout Plan

Merge to `main`. No runtime rollout: nothing in this change is served, rendered,
executed by a worker, or read by a product surface. The new guard begins running
on the next pull request through the existing behaviors job.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` will run
  on merge as it does for every commit to `main`.
- Shared runtime mutators: none. No `az` command is run by this change.
- Approved image digest: not applicable — no runtime image changes.
- ACA runtime invariant: unaffected. Will be verified after merge as standing
  practice, not because this change touches it.
- Worker image invariant: unaffected.
- Feature/env flag update path: none.
- Live signed-in proof required: **no**, and the reason: this change adds a
  record and a test that reads it. No route, component or tenant read path is in
  the diff, so there is nothing a signed-in session could exercise that a
  required check does not already prove.

## Rollback Plan

Revert the commit. Nothing depends on the new files: the record is read only by
its own guard, and the stage-map entries only make already-filed backlog items
visible to a generated view. No migration, no data, no runtime state.

## Audit Evidence

- The record itself, `docs/architecture/t556-stale-suite-triage.json`, which
  carries the base commit, the draw rule, the pool sizes, the per-suite
  execution counts and one written rationale per verdict.
- The guard, `src/__tests__/behaviors/t556-stale-suite-triage-record.test.ts`,
  and its run in this pull request's behaviors check.
- The four follow-on items — `T-557` (wire the fifteen), `T-558` (rewrite the
  three proxies and the ten cases inside two otherwise-executing suites),
  `T-559` (update the expectations that a July product change made stale, naming
  it), `T-560` (repair the breached control-plane literal floor; the
  destination is a product decision and is marked as one).
- The earlier records this one is asserted disjoint from:
  `docs/architecture/t472-stale-suite-triage.json`,
  `docs/architecture/t509-stale-suite-triage.json`,
  `docs/architecture/t550-stale-suite-triage.json`.

## Known Gaps

- **Fifteen suites are verdicted `wire_into_ci` and none of them is wired by
  this change.** They stay unrun until `T-557` lands. The verdict is the
  evidence that wiring them is safe, not the wiring.
- **The two red suites stay red.** `T-559` and `T-560` own them. The breached
  literal floor in particular is a live gap: it is breached today, it was
  breached before this triage, and naming it does not close it. `T-560` is
  marked `decision needed` because the destination for those literals is a
  product call — one of the two files is tenant-safety policy code, where a
  literal may be load-bearing rather than debt.
- **`textIsTheSubject` is a written judgement, not a measurement.** The guard
  can refuse a bare flag, refuse it on a non-scanner, and refuse it as a route
  to a CI wiring. It cannot check that the claim is true. One row uses it, and
  a reader has to read that row's reason rather than trust the field.
- **The draw is disjoint from the three prior records and from nothing else.**
  If a fifth batch is drawn by a different rule, or by an agent that does not
  read these records, the disjointness control only catches it on the side that
  runs this guard.
- **Forty-two rows remain in the pool** at this base, all band `high`. The
  batch size is a convention, not a measurement of what is worth triaging.

## Disclosure Note

This repository is public. The triage record names file paths and occurrence
counts for the breached literal floor but deliberately does **not** name the
tenant strings themselves, and no fixture tenant name appears in this record, in
the committed JSON, or in the guard.
