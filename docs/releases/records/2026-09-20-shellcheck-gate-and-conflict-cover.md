# 2026-09-20-shellcheck-gate-and-conflict-cover — A shell gate that arrives clean

## Release ID

`2026-09-20-shellcheck-gate-and-conflict-cover`

## Status

`candidate`

## Plain-English Summary

The hygiene gate's own shell was checked by `bash -n`, which catches syntax and nothing
else. Three of the last four defects in that script family were shell **semantics** — a pipe
swallowing an exit status, a substring test standing in for a comparison, a variable hiding
a path from a resolver — and each was found by a person noticing a construction.

The item forbade proposing a gate before counting what it would report, because a gate that
arrives with a large waiver list is the vacuity pattern. So the count came first:

| | |
|---|---|
| shell files under `scripts/` | 15 |
| findings at **error** severity | **0** |
| findings at **warning** severity | 2 |
| findings in total (default severity) | **6, across 4 files** |

Six is a fixable list, not a waiver list. All six were fixed or answered, and the gate is
added to the workflow with **zero** findings on arrival.

One of the six was a real defect in the gate itself: `cd "$REPO_ROOT"` with no `|| exit`. A
failed `cd` would have run every check against whatever directory the script happened to be
in, found nothing wrong with a tree it was never asked about, and exited 0.

## Layer Impact

- `global-control-lane`. CI workflow, four shell scripts, one behaviour suite. No product
  surface, tenant data, schema, projection, migration, or runtime behaviour.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes — CI
- Public/demo only: no
- Feature flag: none

## Changes Included

- `.github/workflows/hygiene-gate.yml` — a `Shellcheck scripts/` step, running
  `shellcheck -x` over every `*.sh` under `scripts/`.
- `scripts/integration/hygiene_gate.sh` — `cd` guarded; conflict count uses `grep -c`; three
  dead exclusion patterns removed.
- `scripts/orchestration/run_next_wave.sh` — a dead assignment removed.
- `scripts/integration/check_admin_design_tokens.sh`, `scripts/vercel-build.sh` — SC2001
  answered with a reason rather than waived.
- `src/__tests__/behaviors/hygiene-gate-exit-codes.test.ts` — five conflict-marker cases and
  a fixture option for committing extra files. 25 cases → 30.

## QA / Validation

| What | Result |
|---|---|
| `shellcheck -x` over `scripts/` — the step's exact command | **exit 0, zero findings** |
| The gate's behaviour suite | 30 passed (was 25) |
| Three hygiene suites together | 60 passed, 0 failed |
| `tsc --noEmit` | exit 0 |
| `eslint` | exit 0 |
| Mutation harness, two directions | **8 mutations, 7 caught, 1 survived** |

Direction 1 asks whether the new step would block the next defect, since a gate that starts
clean is only worth having if it catches something: `cd` losing its `|| exit` again, an
unquoted variable, and a backtick command substitution were all caught.

Direction 2 attacks the conflict counting, which this change rewrote: hardcoding the count
to zero, dropping the markdown exclusion, dropping the binary exclusion, and dropping the
search anchor were all caught.

### The one survivor, and why it is not fixed

An undefined variable (SC2154) is **not** caught. SC2154 is one of shellcheck's optional
checks, and enabling them is not free: measured, `shellcheck -x -o all` reports **169**
findings across the same 15 files. That is exactly the waiver list the acceptance rules out,
so optional checks stay off and the limit is recorded here instead of being hidden behind a
suppression list.

### Two findings the item did not name

- **`cd` without `|| exit` in the gate itself** — described above. It is the same class the
  item cites, in the script the item is about.
- **Three of the five conflict-marker exclusions were dead.** The search pattern is anchored
  with `^`, so it only ever matches a line that *begins* with a marker; `# <<<<<<< HEAD` is
  never matched, and the `#.*<<<<` exclusions had nothing to filter. Measured on a scratch
  repository holding both a real conflict and a commented one: **they removed 0 of 3
  matches.** A guard nothing can exercise is not a safeguard, and leaving it in reads as
  though commented markers are handled deliberately when the anchor is what handles them.
  They are removed and the anchor is now pinned by a case.

### The conflict counting had no behavioural cover at all

Rewriting `grep | wc -l` into `grep -c` is the kind of tidy-up that quietly breaks a count.
Measured earlier against the contract suite, deleting the entire git-hygiene section was
caught only by the source-text scanner, never behaviourally — so nothing could have noticed.
Five cases now cover it: a real conflict fails, a clean tree passes, a marker in markdown
does not count, a marker in a binary file does not count, and a marker that does not begin
its line does not count. The binary case exists because a mutation removing that exclusion
survived until a fixture had a binary file in it.

## Rollout Plan

Merge to `main`. The step runs on the next pull request. No image build, migration, flag, or
runtime change.

## Deployment Authority

- Repo-owned deploy workflow: not exercised beyond the ordinary main deploy
- Shared runtime mutators: none
- Approved image digest: not applicable — no runtime surface changes
- ACA runtime invariant: not applicable
- Worker image invariant: not applicable
- Feature/env flag update path: none
- Live signed-in proof required: no

## Rollback Plan

Revert the PR. No data, migration, or runtime state. Reverting removes the step and restores
the unguarded `cd`.

## Audit Evidence

- The PR diff.
- The pre-proposal count (15 files, 0 errors, 2 warnings, 6 total) and the post-fix run of
  the step's exact command at exit 0.
- The eight mutation results, and the 169-finding measurement behind leaving optional checks
  off.

## Known Gaps

- **shellcheck was not previously installed on the executor machine and still is not.** It
  was fetched into a temporary directory to produce these numbers; nothing was installed on
  the machine itself. CI needs no install — `ubuntu-latest` ships it — but anyone reproducing
  the count locally has to fetch it.
- **Optional checks are off**, so SC2154 and its siblings do not run. The 169-finding
  measurement is why. Turning them on is a separate piece of work with its own waiver
  question.
- The step lints `scripts/` only. Shell embedded in workflow `run:` blocks is not checked.
