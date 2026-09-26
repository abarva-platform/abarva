# 2026-09-26-t487-census-jest-path-semantics — Coverage census reads a ratchet baseline path the way Jest does

## Release ID

`2026-09-26-t487-census-jest-path-semantics`

## Status

`candidate`

## Plain-English Summary

The repository keeps a census of which test suites CI actually runs. It is not a
gate; it is the instrument that decides which directory gets wired into CI next.

One of the four hops it follows ends in a JSON file that lists directory paths,
and those paths are handed straight to the test runner. A bare path argument to
the runner is a **regular expression**, not a directory prefix — and the census
was reading it as a prefix. The two readings disagree, in both directions:

- A path containing a parenthesised segment is a capture group. The runner looks
  for a directory with the brackets removed, finds nothing, and selects no
  files; the census credited every suite in the directory whose name is spelled
  right there in the file. **Five test files were reported as run by a gate that
  has never run them.**
- A path is unanchored, so the runner also selects a sibling directory whose name
  merely starts the same way. The census required an exact parent match and
  called two of those files uncovered although the gate does run them.

The over-crediting half is the one that matters. A census more generous than the
run is invisible from its own output — the directory name is in the file that
credits it — and it removes directories from the queue that decides what gets
wired next. One of the five removed a directory that this change now ranks
**second** on governed risk.

The fix replaces the census's reading with the test runner's own matcher, so
there is one reading of this contract rather than two that can drift.

This change does **not** edit the path lists themselves. Escaping them is a
separate, already-filed item that is blocked on a decision, because the escape
turns two CI gates red on assertions that fail today. Doing it here would make
this control pass with the census reading still wrong.

## Layer Impact

Release lane: `internal-admin`. This is AbarVa-only repository tooling and the
committed measurement it writes; no client, tenant or product surface receives
anything.

- **Layer 4 (products):** none. No product surface, route, adapter or model
  prompt is touched, and no product behaviour changes.
- **Repository tooling / CI measurement:** the coverage census resolves one of
  its four hops differently, and the committed census artifact moves with it.

No canonical-model object, tenant dataset, migration or governed context object
is read or written by anything in this change.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: **yes** — repository tooling and its committed measurement
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/quality/test-ci-coverage-census.mjs` — a reachable command now
  carries how it must be READ. A path spread into the runner's argv is matched
  with the runner's own `TestPathPatterns`, exported as `reachableEntrySelects`
  so a caller can ask the census's question of the census's code. An unparseable
  pattern credits every file, because the runner says `Invalid testPattern …
  supplied. Running all tests instead.` and does that.
- `src/__tests__/behaviors/test-ci-coverage-census.test.ts` — five cases. The
  runner is spawned in each one as the oracle, so ground truth is the runner
  itself rather than a second copy of the rules under test.
- `src/__tests__/behaviors/product-directory-ci-coverage.test.ts` — the dark
  directory ceiling moves 171 → 172, with a dated entry saying why. This is the
  only rise in that file's history and it records a measurement that was wrong,
  not a regression that was allowed: the directory is unchanged, unwired, and
  has been reached by no gate since that gate landed.
- `docs/architecture/test-ci-coverage-census.json` — refreshed.

## QA / Validation

**Re-verified before any edit, by measurement.** Three of the sixteen resolved
baseline paths carry an unescaped parenthesised or bracketed segment, all on
pull-request-gating workflows. `--listTests` over those three verbatim selects
0 files; the escaped form of one selects the 4 that are under it. The 5 test
files beneath them appeared in no uncovered or partially covered bucket, so the
census credited every one.

**Red first, over the same cases.** Against the unmodified script: 3 of 5 cases
fail on the substantive counts (0 vs 1 covered, 1 vs 0 covered, 2 vs 1 covered).
The fourth fails because the exported matcher does not exist yet, which is an
honest red but a weak one — it is backed by mutation `M1` below, which makes the
same case fail on content with the export present. After the change: **5 of 5
pass.**

**Six mutations, six caught, each with the case that fired.** Every one was
checked for a behaviour change first, so a no-op cannot be scored as a survivor.

| # | Mutation | Covered count | Cases that failed |
|---|---|---|---|
| M1 | the entry's declared reading is ignored; every path falls back to the literal prefix | 2016 → 2019 | all 4 then-present |
| M2 | the pattern is anchored at both ends | 2016 → 1800 | 3 of 4 |
| M3 | the census escapes the pattern for itself — the "fix it by escaping" shape | 2016 → 2019 | 3 of 4 |
| M4 | the baseline entry stops declaring its reading | 2016 → 2019 | all 4 |
| M5 | an unparseable pattern credits nothing instead of everything | unchanged | 1, the case written for it |
| M6 | the new reading is applied only to a path that LOOKS like a regex | unchanged | 2 of 5 |

**M5 is the reason this record says six and not five.** It survived on the first
pass and moved no count, because no real baseline path is an invalid regex, so
the branch is unreachable from this repository. Investigating the survivor
showed the branch was **wrong**: the first implementation returned "selects
nothing" on the reasoning that a broken pattern runs nothing, and the runner in
fact prints `Invalid testPattern … supplied. Running all tests instead.` and
runs the whole tree. The corrected answer and a fixture case that reaches the
branch both landed here. Without the mutation the wrong answer would have
shipped unopposed.

**M6 is the reason the file-for-file case exists.** It leaves the aggregate
covered count unchanged, because the two files it wrongly drops are also run by
another workflow, so only an assertion that compares the credited SET against
the runner's selected SET can see it.

**Baselines from a separate worktree at the same commit, not a stash.**

| Scope | Before (`fb433aa90`) | After |
|---|---|---|
| the census suite | 51 suites' tests, 51 passed, 0 failing | 56 passed, 0 failing |
| `src/__tests__/behaviors` | 139 suites / 1348 tests / **0 failing** | 139 / 1353 / **0 failing** |

The behaviours scope was red once in between, at 139 / 1353 / 1: the dark
directory ceiling, described above. Thirty-four other suites read this census
and every one stayed green, which is measured and not assumed.

- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` with
  `tsconfig.tsbuildinfo` deleted first — **exit 0**, judged by status and not by
  filtering the output.
- `npx eslint` over the three changed source files — exit 0.
- `node scripts/quality/test-ci-coverage-census.mjs --check` — exit 0 after the
  refresh.

**The movement the item asked to be stated.** Net `coveredTestFiles` 2019 → 2016:
five files dropped, two added. `untriagedUnrunTestFiles` 392 → 395.
`directoriesFullyCovered` 288 → 286, `directoriesPartiallyCovered` 23 → 24,
`directoriesUncovered` 176 → 177. In the governed-risk ranking one directory
enters at **rank 2, band high, signal `tenant_scoped_read`**, 2 of its 4 files
unrun; `highGovernedRiskDirectories` 7 → 8. Every figure quoted in an earlier
record that inherits this reading — any "remaining pool" number drawn from the
census — was taken under the old resolution and is high by up to five files.

## Rollout Plan

Merge to `main`. The repo-owned ACA deploy workflow runs on merge as it does for
every change; nothing here reaches a runtime. No migration, no flag, no job.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged
- Shared runtime mutators: none — this change mutates no Container App, revision,
  traffic weight, env var, secret or job
- Approved image digest: read from the deploy run keyed to the merge SHA and
  recorded in the claim register on completion
- ACA runtime invariant: to be proven after merge — template image = 100%-traffic
  revision image = both deliverable worker job images, each read from Azure
  independently rather than from the workflow summary
- Worker image invariant: same digest, read independently
- Feature/env flag update path: not applicable
- Live signed-in proof required: **no, and not applicable rather than skipped.**
  Product behaviour is byte-identical. What changed is a number in a repository
  measurement and which directory that measurement ranks next; no signed-in
  session can observe any of it.

## Rollback Plan

Revert the PR. The census is regenerated from the tree on every run, so reverting
the script and re-running `--write` restores the previous artifact exactly. No
state exists anywhere else.

## Audit Evidence

- The PR, its checks, and the deploy run keyed to the merge SHA
- `src/__tests__/behaviors/test-ci-coverage-census.test.ts`, the five cases under
  "a ratchet baseline path is a Jest regex" — each spawns the runner and asserts
  against its selection
- `docs/architecture/test-ci-coverage-census.json`, diffable against the previous
  committed artifact
- The mutation table above; each row is reproducible by making the stated edit
  and running that one describe block

## Known Gaps

- **The path lists are still unescaped, deliberately.** Two CI gates therefore
  still name directories they cannot reach. That is the separate item, it is
  blocked on a decision about the three assertions the escape reveals as failing,
  and this change deliberately does not pre-empt it. What this change does is
  stop the census from reporting those directories as covered.
- The dark directory ceiling rose by one. The directory behind it is unwired and
  unchanged; wiring it belongs to the same blocked decision.
- The invalid-pattern branch is reachable only from a fixture. No real path list
  contains an invalid regex today, and the case that covers it says so.
