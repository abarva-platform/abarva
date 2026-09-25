# 2026-09-25-t615-census-enumeration-quarantine — Coverage census reads a quarantine declared by enumeration

## Release ID

`2026-09-25-t615-census-enumeration-quarantine`

## Status

`candidate`

## Plain-English Summary

The repository measures which of its automated test suites CI actually runs, and
sorts the gaps so engineers work on the riskiest one first. That measurement
separates two kinds of unrun suite: one somebody has already looked at and
deliberately set aside with a written reason, and one nobody has looked at yet.
Only the second kind is offered as work.

It could only recognise the first kind in one form: a CI command that selects a
whole folder and then names a file inside it as an exception. Some folders work
the opposite way — they list the files they run one by one, because selecting the
whole folder would also run everything broken beneath it. In such a folder a
set-aside file is mentioned by nothing at all, so the measurement called it
"nobody has looked at this", even when it was recorded in a machine-readable
list with a reason, an owner and a verdict, and even when a separate check
re-runs it to make sure the reason is still true.

That mislabelling does not just misreport a number: the count of un-looked-at
files is the only thing the risk ranking sorts on, so it can put a folder that
is fully triaged at the top of the list and send the next engineer to work that
is already done. That happened twice.

This teaches the measurement the second form. Every quarantine list in
`scripts/quality` is now read, each list says which directory its entries belong
to, and a file named in one counts as triaged whether or not any command
mentions it. The measurement now also publishes which of the two forms credited
each file, and refuses to run at all if it finds a list it cannot resolve —
because a quarantine list it silently skipped would be the same blind spot one
directory over.

## Layer Impact

Release lane: `internal-admin` — an AbarVa-only measurement instrument and its
committed output. No client receives anything from this change.

- **Layer 4 — products:** none. No product surface, route, component, prompt or
  tenant-visible value changes.
- **Platform tooling (test/CI measurement):** `scripts/quality/test-ci-coverage-census.mjs`
  gains a second reading of "declared quarantine", a published inventory of the
  quarantine lists it read, and a per-file field naming which reading credited a
  file. The committed measurement artifact
  `docs/architecture/test-ci-coverage-census.json` is refreshed to match.
- **Layers 1–3 (intake, adapters, canonical model):** untouched.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes — a measurement instrument and its committed output
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/quality/test-ci-coverage-census.mjs`
  - `quarantineDeclarations(root)` — globs `scripts/quality/*-quarantine.json`,
    returns the list inventory plus every declaration as
    `{ list, key, scope, suite }`. Throws, naming the file and the missing key,
    when a list that declares suites carries no scope, when a sibling
    declaration array carries no scope of its own, when an array mixes
    suite-bearing and non-suite entries, or when a list is unreadable.
  - `declaredQuarantinePaths(root, testFiles)` — resolves each declaration to a
    real test path: the scoped exact path first, otherwise the regex fragment the
    `*-ignore-args.mjs` scripts build, matched only inside the declared scope.
  - `coverageFor` takes the resolved set as a required third argument and reports
    `declaredQuarantine` as either shape, plus `declaredQuarantineShape` naming
    which one.
  - New published `quarantineLists`, one row per list found — including a list
    that declares nothing — with declared-suite count, resolved paths and
    declarations that name no file in the tree.
- `scripts/quality/*-quarantine.json` (7 files) — each declares `scope`, the
  repository-relative directory its entries name. Each value is the directory its
  own sibling checker already resolves against; the checker line is quoted in the
  commit. Two lists also declare `alsoIgnoredScope`, which is a different
  directory: those entries are integration-root siblings an un-slashed directory
  pattern sweeps in. Both `alsoIgnored` arrays are empty today, so this declares
  where the next entry belongs rather than crediting anything now.
- `src/__tests__/behaviors/test-ci-coverage-census.test.ts` — 8 new cases; the
  one pre-existing fixture that writes a quarantine list now declares its scope.
- `docs/architecture/test-ci-coverage-census.json` — refreshed.

## QA / Validation

**Re-verified on `origin/main` `406b24498` before writing code**, at the line
rather than from the item text: `coverageFor` computed `declaredQuarantine` as
`hits.length === 0 && named.length > 0`, true only where a command names the file
and then subtracts it; `untriaged` is `!covered && !declaredQuarantine`; and
`untriagedUnrunTestFiles` is the sole input to `governedRiskRanking`.

**The defect and the fix, measured on the real tree in both directions.** One
root-level file was unwired from the workflow's enumeration and declared in
`integration-root-quarantine.json` with a reason, an owner and a verdict. The two
censuses were then run against that identical tree state:

| census | untriagedUnrunTestFiles | declaredQuarantineTestFiles | `src/__tests__/integration` |
|---|---|---|---|
| `406b24498` (before) | 398 | 49 | rank 1, band `critical` |
| this change | 397 | 50 | not ranked |

The same tree with the declaration removed — the state before anybody triaged the
file — reports 398 / 49 / rank 1 `critical` under this change too, so the credit
is given to the declaration and not to the unwiring. The probe was reverted; no
workflow file changes in this release.

**Tree-wide effect, stated as measured rather than as expected.** On the
unmodified tree the number does **not** move: `untriagedUnrunTestFiles` is 397
before and 397 after, and `declaredQuarantineTestFiles` is 49 before and 49
after. All 32 declarations across the seven lists were already credited by the
first reading, and the one list whose shape needed the second reading is empty
today. The item that raised this expected some of the 397 to be declared in the
sibling lists; measured, **zero of the 397 are**. What ships is the mechanism,
not a correction to today's count — and the mechanism is what two draws already
went wrong on.

**Seven lists, not five.** The item named five quarantine lists;
`scripts/quality` holds seven. `intelligence-library-quarantine.json` and
`source-ava-library-quarantine.json` were not in the item's list, which is the
argument against hardcoding any list of lists.

**Scope is declared because inferring it was measured wrong.** Resolving an
entry's basename against the walked tree is ambiguous on this repository today:
`ai-program-failure-modes.test.ts` exists under both
`src/lib/intelligence/__tests__` and `src/__tests__/integration/intelligence`
while `intelligence-library-quarantine.json` declares that name, and 40 basenames
in the tree are non-unique. Crediting the wrong file is the over-stating
direction.

**Baseline over the same scope**, clean `origin/main` `406b24498` in a separate
detached worktree: `src/__tests__/behaviors/test-ci-coverage-census.test.ts`
43 passed, **0 failing**. After: 51 passed, **0 failing**.

**Mutation checks — each part of the fix broken deliberately, each caught, and
each mutation asserted to change the file's bytes before running:**

| mutation | result | cases that failed |
|---|---|---|
| drop `\|\| declaredInQuarantineList` from the predicate | 3 failed, 48 passed | the enumeration case and both scope-fence cases |
| skip an unscoped list instead of refusing to measure | 2 failed, 49 passed | both fail-closed cases |
| drop the scope fence on the regex branch | 1 failed, 50 passed | `keeps a declared regex fragment inside its own scope` |
| resolve the exact-path branch by basename anywhere | 1 failed, 50 passed | `credits only the declared scope when two directories hold the same suite name` |
| build the list inventory from declarations only | 10 failed, 41 passed | the empty-list row case and eight others |

The third mutation **survived the first attempt** at 51 passed: the same-name
case resolved through the exact-path branch and returned before the fence ran, so
the fence had no case that reached it. The case named above was added for that
branch specifically, and the fence is now failable on both.

**Other checks:** `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit
--pretty false` exit 0, 0 `error TS`. `npx eslint` on both changed source files
exit 0. All seven sibling quarantine checkers exit 0. Census `--check` reports
both drift lines clean against the refreshed artifact. Five adjacent census
behavior suites: 76 passed, 0 failing.

## Rollout Plan

Merge to `main` by squash. No runtime rollout: nothing here is imported by the
application, no route, component, prompt, migration, job or flag changes. The
repo-owned ACA deploy workflow runs on merge as it does for every commit, and the
runtime invariant is proven from that run's artifact.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, on merge to `main`
- Shared runtime mutators: none — this change mutates no Container App, revision, traffic weight, env var, secret or worker job
- Approved image digest: whatever the main deploy workflow builds from the merge SHA; not selected by this change
- ACA runtime invariant: template image, 100%-traffic revision image and both worker job images must match that digest; read from the deploy run's `runtime-invariant-proof.json`
- Worker image invariant: unchanged by this release
- Feature/env flag update path: none
- Live signed-in proof required: **no** — no product surface, route or rendered value changes, and no tenant-visible behavior is in the diff. Nothing here can be proven or disproven by a signed-in session.

## Rollback Plan

Revert the squash commit. No migration, no data change, no runtime state to
unwind. The only artifact that would need attention is
`docs/architecture/test-ci-coverage-census.json`, which the revert restores
alongside the script; `node scripts/quality/test-ci-coverage-census.mjs --check`
confirms the pair agrees after either direction.

## Known Gaps

- **The tree-wide number does not move, and that is the honest result.**
  `untriagedUnrunTestFiles` is 397 before and 397 after on the unmodified tree.
  The item expected the correction to reach files declared in the sibling lists;
  measured, zero of the 397 are declared anywhere. Nobody should read this
  release as having reduced the untriaged backlog.
- **The second reading has no live subject today.** The one list whose shape
  needs it — `integration-root-quarantine.json` — is empty, because the entries
  that exposed the defect were repaired and wired in on the same day it was
  filed. The behaviour is therefore proven by a real-tree probe that was reverted
  and by fixtures, not by a standing entry in the repository. The first entry
  anybody adds to that list is the first live use.
- **`alsoIgnoredScope` is declared and credits nothing.** Both `alsoIgnored`
  arrays in the repository are empty. The scope is declared so the next entry
  lands on the right directory rather than the list's own, and a fixture case
  holds the requirement, but no repository entry exercises it yet.
- **Scope is declared per list, which is a convention a new list must follow.**
  The census fails loudly and names the file and the missing key, so a list that
  does not follow it cannot be skipped silently — but it will stop the census
  until someone adds the key. That is the intended trade and it is a new
  obligation on whoever adds the eighth list.
- **The census still classifies selection, never execution.** A file credited as
  a declared quarantine is triaged, not passing. `green` remains `"unknown"` for
  every row, unchanged by this release.

## Audit Evidence

- The pull request for this branch, with the mutation table above reproduced in its body
- `src/__tests__/behaviors/test-ci-coverage-census.test.ts` — 51 cases, 8 of them new; the two fail-closed cases assert a non-zero exit and the named key
- `docs/architecture/test-ci-coverage-census.json` — `quarantineLists` has one row per `scripts/quality/*-quarantine.json`, and a case asserts that set equals the directory listing so a list added later is covered without editing the test
- Backlog item `T-615` in the execution backlog, and the claim and release lines for this run in the execution register
