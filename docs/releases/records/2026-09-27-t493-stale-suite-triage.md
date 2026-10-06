# 2026-09-27-t493-stale-suite-triage — Eighth stale-suite triage draw: 50 unrun test files judged, nine directories wired

## Release ID

`2026-09-27-t493-stale-suite-triage`

## Status

`released`

## Release Lane

`global-control-lane`

## Plain-English Summary

The repository has a standing problem it has been paying down one draw at a time: test files
that exist, pass, and are run by no continuous-integration job. A suite nobody runs cannot report
anything, so a control it asserts is decoration until something executes it.

This is the eighth draw. It takes the next 50 such files — five each across ten directories, named
individually by the backlog item rather than by their rank — **executes every one of them on its
own before writing a single verdict**, and then wires the directories that came back clean into the
pull-request job that already owns this kind of work.

The numbers, all measured rather than asserted:

- **50 files executed individually**: 414 cases, 411 passing, **3 failing in one suite**.
- **Nine of the ten directories are wired**: 45 suites, 373 cases, 0 failing. They were also run
  **together**, in the shape of the workflow steps, because a suite that passes alone and fails
  beside its siblings is a real failure mode: 46 suites / 374 cases, the extra suite being one an
  existing pinned step already owned.
- **One directory is deliberately left dark**, and this is the half of the change that did not
  happen. `src/lib/intelligence/synthesis/__tests__` holds both of the draw's deferred rows. A
  directory is wired by fixing it, never by adding it to a green command, so its three green
  siblings stay unrun until those two are settled. That cost is stated, asserted by a test, and
  handed to the items that already own each class.

**Two findings worth more than the wiring.**

First, **the item's own rank numbers were stale and its directory names were not.** The filing named
ranks 19–28. On this change's base the same ten directories sit at ranks 14–23, because the previous
draw wired five directories out of the untriaged set about an hour earlier and every row below moved
up five places. Re-deriving the census on the base rather than reading the committed snapshot is
what showed that. The draw itself is unchanged — same ten directories, five files each — and the
record stores both rank numbers per row with a test asserting the offset is *uniform*, because one
event moving the whole list is what a uniform offset means and a scattered one would mean the draw
had genuinely changed.

Second, **the mechanical classifier this record depends on was wrong first, and the record publishes
the correction.** Its first pass bound identifiers assigned from a file read by *name* and counted
any test case mentioning that name: it reported 32 of 43 cases in the migration-runner suite as
byte-matching, because the identifier was `sql` in a suite about SQL. A name cannot tell you about
scope. The second pass asks a narrower question a regular expression can actually answer — does a
case body contain a read whose own argument is anchored to the repository root — and reports 1. The
corrected number is the one a later reader will quote, and the reason it can be trusted is that the
wrong one is on the record beside it.

## Layer Impact

This ships in the `global-control-lane`: it changes shared control-plane behaviour — which test
directories a pull-request job executes — for every client at once, behind no feature gate.

- **Layer 4 (Products):** none. No product code, route, prompt, projection or dataset is touched. The
  suites wired here were already passing; they now run where a failure is visible.
- **Control plane / CI:** nine directories join `.github/workflows/unit-suites.yml` as directories,
  so a suite added to any of them runs the day it lands rather than the day someone remembers.
- **Layers 1–3:** untouched.

## Client Applicability

- All clients: no behavioural change. Nothing here can alter an answer, a number, or a surface.
- Specific clients: none.
- Internal only: yes in effect — this is test and CI ownership.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `.github/workflows/unit-suites.yml` — nine new steps, each naming a **directory** without a
  trailing slash (a trailing slash stops the CI-visibility gate matching, and file-by-file wiring is
  the shape of the defect this family exists to end).
- `docs/architecture/t493-stale-suite-triage.json` — the record: 50 rows, per-file run counts read
  out of each run's JSON by script rather than typed, per-row verdict, owner and rationale.
- `src/__tests__/behaviors/t493-stale-suite-triage-record.test.ts` — 24 cases guarding that record.
- `src/__tests__/behaviors/t493-wired-directory-ci-coverage.test.ts` — 10 cases proving the wiring
  through the coverage census's own resolver, **per file** as well as per directory.
- `src/__tests__/behaviors/product-directory-ci-coverage.baseline.json` — eight lines removed.
- `src/__tests__/behaviors/product-directory-ci-coverage.test.ts` — dated entry recording the
  movement and why it is eight rather than nine.
- `src/__tests__/behaviors/programs-unit-directory-ci-coverage.test.ts` — its dark-directory count
  lowered 18 → 17 with the reason recorded. **This gate found the change, rather than being
  remembered:** it went red on the branch, which is exactly the direction a ratchet must never
  punish.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

## QA / Validation

**Per-file execution, before any verdict.** All 50 with
`npx jest --runTestsByPath <path> --no-coverage --ci --json --outputFile` — `--runTestsByPath` for
every one so no path is read as a regular expression. Every run reports
`numTotalTestSuites === 1` and `numTotalTests > 0`, asserted rather than assumed, because a harness
that silently matches nothing exits green.

**The nine wired directories, as directories, in the shape of the steps:** 46 suites / 374 tests /
0 failing. 373 of those cases are this draw's 45 wired files and the 374th is the already-owned
sibling suite — which is the cross-check that the per-file rows and the directory run describe the
same population.

**Behaviours baseline over the same scope, from a separate clean worktree at `origin/main` rather
than a stash:**

| | suites | tests | failing |
|---|---|---|---|
| before (`f7e7f9302f`) | 148 | 1586 | 0 |
| after (this branch) | 150 | 1620 | 0 |

Nothing failing on either side, so no failure is this change's. Wall time 44.1s before and 43.8s
after locally at ~10× parallelism — within noise, and the honest caveat is that a two-core runner
serialises differently, so see the risk note below.

**Mutation checks — the guards were broken deliberately, every one:**

- **Record guard: 17 mutations, 17 caught.** Dropping a row (7 cases fail); wiring the red suite (5);
  wiring the source-text scanner (1); restoring the classifier's discredited 32-case count (1);
  naming an unfiled id as a row's owner (1); scattering one filed rank (1); claiming case attribution
  the instrument does not have (2); dropping the workflow from the claimed-writes list (1); claiming
  to have edited a file the record judges (1); breaking one row's passed/failed/total arithmetic (1);
  thinning the unfiled-successor reason (1); letting an unfiled row carry a work verdict (2); saying
  the scanner reads no file (2); dropping the held-directory account (1); drifting the together-run
  figures (1); drifting a vacuity count (1); moving a row to another directory (2).
- **Wiring, in the failing direction, twice.** Removing one wiring step fails 4 cases *including the
  per-file one written for the directory that holds its tests beside its sources*. Re-adding a wired
  directory to the dark baseline fails both this change's case and the ratchet that already existed.
- **The gate itself can fail, which is the check the item demanded.** A deliberately red case placed
  in `src/lib/intelligence/ask/retrievers` — the one non-`__tests__` directory in the draw — makes
  the verbatim workflow command exit **1**: `1 failed, 5 passed, 6 total`. That is what proves the
  pattern reaches the *files*. A `__tests__`-shaped glob there would have matched nothing and exited
  green, which is the gate-reachability defect this family exists to end. The probe was then removed;
  the directory is back to 5 suites / 14 cases green.

**Other gates:** `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` with
`tsconfig.tsbuildinfo` removed first — **exit 0, no diagnostics, judged by exit code**. ESLint over
the four changed test files — exit 0. `node scripts/quality/test-ci-coverage-census.mjs --check` —
coverage shape matches the committed census.

**What is NOT claimed.** The job-log half of the acceptance — the new suites' case counts read from
the real runner's log rather than from a local run — can only be read after this lands in CI, and is
recorded on the pull request rather than asserted here. No signed-in proof is owed: nothing here
renders.

## Rollout Plan

Merge to `main`. No image build, no migration, no flag, no data build, no runtime change of any kind
— the only effect is that nine directories are executed by an existing pull-request job.

## Deployment Authority

- Repo-owned deploy workflow: not applicable; this change has no runtime artefact.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable — no container image, template, revision or traffic weight is
  touched.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: no. No product surface, route, prompt or projection changes.

## Rollback Plan

Revert the commit. The nine directories return to being unrun, the two ratchets return to their
previous values, and nothing else moves — there is no migration, no deployed artefact and no state to
unwind.

## Risks

**The required `Behavior coverage floor` check does not pass, and this section is the honest account
of why — including the part this change caused and the claim it originally got backwards.**

*What happened.* That job runs `src/__tests__/behaviors` under `--coverage --runInBand` with
`timeout-minutes: 15`. On the first two draws of this branch the **gate step itself was cancelled** at
14m23s, having not finished; on the third it passed at 547s. It is a required context, so nothing was
merged until it did: all 19 required contexts were then checked **per context** against
`docs/ci/required-status-checks.json` rather than read off the aggregate.

*It is not only this change.* Another pull request today — **doc-only** — was cancelled on three
consecutive attempts of the same job. On those attempts the gate step *concluded success* at 812s and
818s and the JOB was killed afterwards, during the cheap steps that follow. So the job total was
already over the cap before this branch existed.

*How much of it is this change: less than this record first said, and the correction is a retraction
rather than a refinement.* An earlier version of this section read "the step fit in 818s on doc-only
content and did not fit in 863s here, so this branch made the gate step roughly 50 seconds slower".
Three draws of the same job on near-identical content then gave 863s (not finished), 863s (not
finished) and **547s (success)** — a 316-second spread. An inference drawn from two single draws on
different content cannot survive that, and an 11-second saving cannot explain 863 → 547 either, so the
50-second attribution is **withdrawn**. What is measured directly, and all that is claimed: two suites
are added, one of which runs the census at 10.9s under coverage, plus the instrumented cost of 34 more
test cases.

*What survives unchanged is the finding underneath it.* The job sits close enough to its ceiling that
it dies on some draws regardless of content, which is why a doc-only pull request lost three
consecutive attempts to it. The two kills on this branch are evidence for that, not evidence about
this change.

*The correction.* This record originally claimed that cost had been cut by calling `buildCensus`
**once in process** instead of spawning the census CLI twice — "the same resolver and roughly halves
its share". **That was asserted and never measured, and it is wrong in the environment that
decides it.** Measured four ways on this machine, one suite:

| | with `--coverage` | without |
|---|---|---|
| in process, one call | **22.2s** | 8.2s |
| spawned CLI, two calls | **10.9s** | 9.9s |

Without coverage the in-process form is faster, which is why the wrong choice looked right. Under
coverage an in-process census is *instrumented* and a spawned one is not, so it costs twice as much —
and under coverage is how the gate runs. The suite now spawns the CLI, like every sibling
census-reading suite in that directory already did; that is four measurements agreeing with them
rather than a style someone copied. The saving is real but small against the gap.

*What is owed, and to whom.* Even at 10.9s this job does not fit: the gate step would be about 850s
and the steps after it need roughly 90 more. The remedy is a change to the **gate** — raise the cap,
or shard that suite — which affects every pull request behind it and is not this item's to make. This
change will not be merged on a cancelled or failing required check.

## Known Gaps

- **The tenth drawn directory is still dark.** `src/lib/intelligence/synthesis/__tests__` holds a red
  suite and a source-text scanner, so three green suites inside it (36 cases) remain unrun. Both
  deferred rows are handed to the existing items that own their class, and a test asserts the
  directory is still dark so a later change cannot wire it without settling them.
- **The successor that would wire that directory is not filed, and cannot be.** Both test-lane id
  bands an agent may draw from report 0 of 100 free, so the id-band rule leaves no number for it.
  The three affected rows carry an explicit unfiled-owner block rather than an invented id — an id
  that looks filed is one another run can spend on something else — and the record's guard refuses
  that branch unless the reason is written out. This needs the range decision the generated execution
  queue has been reporting, not a careful reading.
- **The sibling `programs-unit-directory-ci-coverage` ratchet still holds a COUNT, not a list.** Its
  count had to be moved by hand here and the justifying diff taken separately, because a count cannot
  distinguish a wiring from a regression in a change that does both. Converting it to a set difference
  — which the product-directory ratchet already did, for exactly this reason — is a separate change
  with its own id and is deliberately not folded in.
- **Case-level attribution has no answer for one suite of the 50.** `structured-exhibits.test.ts`
  generates its cases (38 static openers, 45 at runtime), so the byte-matching attribution has no
  denominator for it. That is published rather than filled in with a number a later reader would
  treat as measured.
- **The job-log proof is owed on the pull request, not in this record.** That the nine new steps ran
  with the expected case counts can only be read from the real runner after merge; a local run is not
  that evidence.

## Audit Evidence

- The record itself, `docs/architecture/t493-stale-suite-triage.json`, and the 24-case guard over it.
- The wiring proof, `src/__tests__/behaviors/t493-wired-directory-ci-coverage.test.ts`, which answers
  through the census's own resolver and not by searching a workflow for a string.
- The two ratchets that moved, each carrying a dated entry with the reason and the per-directory diff
  that justified it.
- The pull request, its required checks, and the `Unit suites` job log showing the nine new steps
  with their case counts.
