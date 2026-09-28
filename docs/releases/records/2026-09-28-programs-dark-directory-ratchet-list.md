# 2026-09-28-programs-dark-directory-ratchet-list — Programs dark-directory ratchet reports a set difference

## Release ID

`2026-09-28-programs-dark-directory-ratchet-list`

## Status

`candidate`

## Plain-English Summary

A CI guard watches which test directories under `src/lib/programs` are not run by any
workflow. It used to hold that set as a single integer, so its failure read
`Expected: 16 / Received: 15` and said nothing about which directory moved.

That resolution is blind to exactly one change, and it is the change a reviewer waves
through: wiring one directory into CI while another goes dark in the same pull request
moves the total by zero, so the guard stays green while a new blind spot is created.

This change converts the guard to hold a sorted **list of directory names** and to fail
with a **set difference**, printing what ENTERED the dark set (the regression it refuses)
separately from what LEFT it (a wiring to record). Its sibling guard for `src/app` and
`src/lib` was converted the same way and is already merged, so this is a port of a
reviewed precedent rather than a new design.

Nothing about what the guard permits or refuses changed. It is still an equality in both
directions, and the recorded set is still a log rather than a target: removing a line is
always allowed and is part of wiring a directory. Only the resolution of the failure
changed — from two integers to two named lists.

No wiring is folded into this change. No directory was wired into CI and none was
darkened; the recorded list is the measurement taken on this commit.

## Layer Impact

**Release lane: `internal-admin`.** This is an AbarVa-only repository CI guard. No client
receives anything from it and no product surface is involved.

No product layer. This touches CI guard code and its committed record only:

- **Layer 4 (Products):** unaffected. No product surface, route, component or read
  model changed.
- **Layer 3 (Canonical model):** unaffected. No schema, no tenant data, no migration.
- **Test/tooling:** one behavioral guard converted from a count to a set difference; one
  shared test helper gains an optional parameter with its existing default preserved.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes — repository CI guard only
- Public/demo only: no
- Feature flag: none

## Changes Included

- `src/__tests__/behaviors/programs-unit-directory-ci-coverage.test.ts` — the count
  assertion is replaced by a set difference against a committed list. The test-file count
  stays **reported and not pinned**, as its own comment always required, and it moves into
  a case of its own so that adding a suite to an already-dark directory cannot redden the
  equality. Three cases added: the baseline's sortedness/uniqueness with a vacuity floor,
  the set-difference equality, and the cancelling-change case below.
- `src/__tests__/behaviors/programs-unit-directory-ci-coverage.baseline.json` — **new.**
  The 16 directory names, sorted, generated from the census on this commit rather than
  transcribed. A separate file from the sibling ratchet's baseline, so that a failure is
  unambiguous about which of the two ratchets moved.
- `src/testing/dark-directory-ratchet.ts` — `formatDarkDirectoryDrift` takes an optional
  `baselinePath`, defaulting to the product baseline so the existing caller is byte-for-byte
  unchanged in behavior. A new exported constant names the programs baseline. A failure
  message that names the wrong file is worse than one that names none: it turns the cheap
  correct action into a wrong edit to a gate the change never touched.

No workflow file changed. No directory was wired.

## QA / Validation

Measured from a separate clean worktree branched from `origin/main` `dec4da306a`, not
from a stash, over the same three suites in every run.

**Baseline, same scope:** 3 suites / 26 tests / **0 failing before**.
**After:** 3 suites / 29 tests / **0 failing after**. The net +3 is one case removed
(the count) and four added.

The suite is green on unmutated code, which for a resolution change is expected and is
**not** the evidence. The evidence is that it fails, and on what.

**The defect, proven by execution on the real census before any code changed.** A
cancelling change was applied to the working tree — `src/lib/programs/architecture/__tests__`
wired into a workflow step, and a new directory holding one suite created so it went dark —
and both halves were confirmed present on disk before the run:

| form | result on the cancelling change |
|---|---|
| the COUNT assertion `main` held (`directories === 16`) | **PASSES — blind to the change** |
| the set difference this change introduces | **FAILS**, naming `…/c414-probe/__tests__` as ENTERED and `…/architecture/__tests__` as LEFT |

The census confirmed the state independently: 16 dark directories both before and after
the perturbation, with `architecture` no longer dark and the new directory dark. The
mutation was then reverted and the suites re-measured green.

**Five mutations, five caught.** Each was confirmed to have changed a file before its run
— a no-op mutation reads exactly like a caught one.

1. **Darken only** (new dark directory, no wiring) — red, `ENTERED (1)` naming it,
   `LEFT (0)`.
2. **Wire only** (`taxonomy/__tests__` named in a workflow step) — red, `LEFT (1)` naming
   it, `ENTERED (0)`. This is the direction the ratchet must not *punish*: it is a
   bookkeeping prompt to remove the line, identical in kind to the count going red when it
   was lowered, and the message says which edit to make.
3. **Empty the committed baseline** — 3 cases red, including the vacuity floor. Without
   it an empty observed set would compare cleanly against an empty baseline and the whole
   file would be decoration.
4. **Blind the diff** (`formatDarkDirectoryDrift` always returns the no-drift message) —
   3 cases red, across this suite *and* the sibling `t491` proof suite.
5. **Neutralize the new `baselinePath` parameter** (always name the product baseline) —
   exactly 1 case red, the one asserting the message names this ratchet's own file and not
   its sibling's. The parameter is load-bearing rather than decoration.

**One defect in the first draft of this change was found by these mutations and fixed.**
The cancelling-change case originally derived its fixture from the *live* census output,
so a genuine cancelling change in flight reddened it for a reason unrelated to the
property under test — on top of the gate case, which is the one meant to report it. It
now perturbs the committed baseline instead and is deterministic.

**Commands and exit codes, judged on the exit code and not on a grep:**

- `npx jest --runTestsByPath` over the three suites — 3 passed / 29 tests / 0 failing.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` — **exit 0**,
  zero diagnostics.
- `npx eslint` over both changed source files — exit 0.
- `node scripts/release-check.mjs --base origin/main --head HEAD` — recorded in the PR.

## Rollout Plan

Merge to `main` through the repo-owned squash-merge path. There is no runtime rollout:
this change ships no runtime module, so the ACA deploy that follows the merge carries it
only as repository content.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged by this
  release and triggered by the merge like any other.
- Shared runtime mutators: **none.** This change runs no Azure command and mutates no
  Container App, revision weight, traffic split, env var, flag or secret.
- Approved image digest: not set by this release; the post-merge deploy's digest is
  recorded as evidence.
- ACA runtime invariant: to be proven after merge — template image digest equal to the
  100%-traffic revision digest.
- Worker image invariant: unaffected; no worker job image changes.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: **no, and none is owed.** No product surface renders
  anything this touches; the whole change is a test guard, a committed list and a test
  helper.

## Rollback Plan

Revert the squash commit. There is no migration, no data write and no runtime state, so
the revert is complete on merge. Reverting restores the count assertion and with it the
blind spot this change removes; that is the only consequence.

## Audit Evidence

- PR URL and its full check set, recorded on the PR.
- The before/after suite counts and the five mutation results above, each reproducible
  from a clean worktree by the commands named.
- The committed baseline is machine-generated from
  `scripts/quality/test-ci-coverage-census.mjs --json` on this commit, so it can be
  regenerated and compared rather than trusted.
- Post-merge: the `aca-main-deploy` run keyed to the merge SHA, and the digest equality
  between the Container App template and the 100%-traffic revision.

## Known Gaps

- **The 16 dark directories are still dark.** This change makes their set legible; it
  wires nothing. That work is the successor item and is deliberately not folded in here,
  because the value of this change is that its scope is checkable.
- The sibling ratchet keeps its own baseline file. Merging the two into one gate was not
  attempted: the roots differ and a shared file would make each failure ambiguous about
  which ratchet moved.
