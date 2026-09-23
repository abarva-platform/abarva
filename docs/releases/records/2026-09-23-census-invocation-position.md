# 2026-09-23-census-invocation-position — The coverage census reads a command by position, not by text

## Release ID

`2026-09-23-census-invocation-position`

## Status

`candidate`

## Plain-English Summary

The repository keeps a measurement of how many of its own test suites continuous integration
actually runs. Part of that measurement comes from reading the helper scripts a workflow executes
and finding the test-runner commands inside them — and it found them by searching the file's text
for the runner's name.

Text cannot tell a command that is being run from a command that is being talked about. A sentence
in a comment explaining how to run a suite by hand looked exactly like the line that runs it, and a
runner command quoted inside a test fixture as an example looked exactly like a real one.

Both directions of that mistake cost something, and both have already happened here.

In one direction the measurement credited a suite that nothing runs. A helper script explains, in a
block comment, that naming a directory on a runner command line also selects files whose names
begin with the same prefix — and it spells a command out in order to say so. The measurement read
that sentence as a run of that suite. It has done no damage so far only because a workflow
genuinely names the same directory elsewhere, so a real credit was sitting on top of the false one.
That is precisely the condition in which a false credit is never discovered: delete the real line
and the sentence keeps vouching for the suite.

In the other direction the measurement invented a command that does not exist. A quoted runner
command in a test fixture could not be resolved to any directory, so it was filed as an unresolved
invocation — and twenty-five unrelated behaviour suites assert that the unresolved count is zero.
Twenty-five suites went red, and the failure named none of them: the message was an expected zero
against a received one, on a measurement those suites do not own.

The fix reads position instead of text. JavaScript and TypeScript files are parsed, and a runner
token counts only where the operating system would actually receive it: in the arguments of a
child-process call, in a `command`/`args` property that something else spawns, or in a variable that
is handed to a spawn. In a shell script, which has no tree to walk, it counts only in command
position on a line, and a `#` comment is a comment.

Commands the reader declines are **reported rather than discarded**. A position rule that wrongly
demoted a real invocation would quietly take a suite out of the covered set and print the same
numbers as before, so the census now publishes what it declined and why that list exists.

## Layer Impact

**Release lane: `global-control-lane`.** Shared repository CI and measurement tooling, applying to
every client's pull requests equally and behind no feature gate. It is deliberately not
`client-data-lane`: no tenant-scoped schema, seed, ingestion, retrieval or private data-plane
behaviour changes, and the census reads no tenant data. The same lane was recorded for
`2026-09-23-integration-root-quarantine`, which is the adjacent gate on the same measurement.

- **Layer 4 — products:** no impact. No product surface, route, tenant read or answer path is
  touched. No tenant data is read or written.
- **Platform tooling (test/CI measurement):** `scripts/quality/test-ci-coverage-census.mjs` changes
  how it identifies a test-runner invocation inside a workflow-reachable script, and gains a new
  reported field, `mentionedInvocations`.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes — repository test-coverage measurement only
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/quality/test-ci-coverage-census.mjs`
  - `jestInvocationsInScript` is exported and now returns `{ commands, mentions }` instead of a flat
    list. JavaScript and TypeScript files are parsed with the TypeScript scanner already imported
    by this module; shell scripts keep a line scan, with a `#` comment recognised as a comment.
  - New helpers: `scriptKindFor` / `parseScript` (extracted from the existing
    `sourceWithoutNonExecutableSignalText`, which now shares them), `calleeName`, `isSpawnCall`,
    `isTransparentWrapper`, `propertyKeyName`, `isCommandPosition`, `commentTexts`,
    `shellInvocations`.
  - `collectReachableCommands` collects declined matches and returns them; `buildCensus` publishes
    them as `mentionedInvocations`; the printed summary lists them, truncated, under
    `quoted, not run`.
  - Only the innermost matching argument array is read. The predeploy gate holds its checks as an
    array of `{ key, command }` objects, so the outer array carries the runner token through its own
    element and would otherwise be counted a second time. The previous text scan reached the same
    reading by accident — its bracket character class could not span a nested pair.
- `src/__tests__/behaviors/census-reads-invocations-by-position.test.ts` — new, 19 cases.
- This release record.

## QA / Validation

**Red first, over the same scope.** The reader was exported with its text-based logic unchanged and
the new suite run against it: **6 failed / 12 passed of 12**. The six were the five mention
positions and the one live real-file case. The remaining twelve — every position that genuinely runs
the runner — passed before the fix and after it, which is the direction that matters: the change
must not lose a real invocation. After the fix: **19 passed / 19**, the count having grown by the
seven cases added while mutating (below).

**The live over-credit, measured on a clean baseline from the named ref rather than the worktree.**
`origin/main`'s reader was extracted with `git show` and run over the same input:

| | invocations counted | files |
|---|---|---|
| `origin/main` reader | 5 | 5 |
| this change | 4 | 4 |

The one demoted match is the block-comment paragraph in
`scripts/quality/check-integration-root-quarantine.mjs`. All four genuine invocations survive —
two `spawnSync` argument arrays, one declared `command` property, one shell command line.

**Nothing left the covered set, and that was proved rather than asserted.** Both readers were run
through a full census over 141 workflow-reachable scripts and 2,403 test files, and the two outputs
compared field by field. Every one of the seventeen counts is identical, including
`coveredTestFiles` 1,920 and `pullRequestCoveredTestFiles` 1,917; the uncovered-directory set and
the partially-covered-directory set are identical with no entry on either side; `--check`, which
gates on coverage shape, reports the shape current before and after. The false credit was masked by
a real workflow line, so removing it costs no coverage — which is the claim, now measured.

**Both directions are reported, as the item required.** Of the 141 scripts the census reads, 4 run
the runner and 5 quote it without running it. Four of those five were invisible to the previous
reader: they are bare comment prose, which its quote- and bracket-anchored patterns could not match.
They are newly *visible*, not newly demoted — only one match changed verdict.

**Mutation: seven applied, seven caught.** One survivor was found and closed rather than reported as
acceptable, and one of the seven was initially a faulty no-op mutation and was redone.

| # | mutation | result |
|---|---|---|
| 1 | `isCommandPosition` always accepts | 2 failed |
| 2 | comment matches never collected | 3 failed |
| 3 | `COMMAND_PROPERTIES` emptied | 2 failed |
| 4 | spawn-argument indirection dropped | 1 failed |
| 5 | shell `#` comment treated as command | 1 failed |
| 6 | innermost-array filter removed | 1 failed |
| 7 | mention path guard removed | 1 failed |

Mutation 6 first survived because the mutation itself was wrong — `.filter(() => true)` was
inserted *before* the real predicate, which left the predicate running. Rewritten to delete the
filter, it fails the predeploy-gate case, which asserts exactly one command and no mentions from
that file.

Mutation 7 genuinely survived the first suite. The guard restricts a reported mention to one naming
a `src/` path, and nothing asserted it: measured, the guard is reachable and load-bearing — 5
mentions with it, 12 without — so a case was added rather than the branch removed or the survivor
excused.

**Scope.** `src/__tests__/behaviors` — the directory that holds the twenty-five suites which build
this census live and assert its unresolved-invocation count is zero: **111 suites, 991 tests, 0
failing.** `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` — exit 0, zero
diagnostics. `npx eslint` on both changed files — exit 0.

## Rollout Plan

Merge to `main`. The repo-owned ACA main deploy workflow builds and deploys on merge as it does for
any change. Nothing in this change runs at request time, so there is no functional rollout: the
census is a developer- and CI-invoked measurement that executes no test and reads no tenant data.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, on merge to `main`.
- Shared runtime mutators: none. No `az` command is run by this change and no runtime template,
  env var, flag, scale setting or traffic weight is touched.
- Approved image digest: whatever the main deploy workflow produces for the merge commit; recorded
  on the release line in the operator register.
- ACA runtime invariant: to be proven after merge — Container App template image equal to the
  100%-traffic revision image.
- Worker image invariant: to be proven on the same digest.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: **no, structurally.** No route, surface or tenant read changes. The
  proof that matters here is the census comparison above, and it is in this record.

## Rollback Plan

Revert the merge commit. The change is two files and one new test file, with no migration, no
generated artifact and no runtime state, so a revert is complete. The committed census at
`docs/architecture/test-ci-coverage-census.json` is deliberately untouched (see Known Gaps), so
there is no derived file to restore.

## Audit Evidence

- The pull request for this change, and its CI run.
- The red-first and post-fix runs of
  `src/__tests__/behaviors/census-reads-invocations-by-position.test.ts` quoted above.
- The before/after census comparison: every count, the uncovered set and the partial set.
- `node scripts/quality/test-ci-coverage-census.mjs --check` — shape current.
- The mutation table above, reproducible by applying each row to the reader.

## Known Gaps

- **The committed census is stale, and not by this change.** `docs/architecture/test-ci-coverage-census.json`
  was already behind `main` before this branch existed — `testFiles` 2,401 against a measured 2,402,
  `coveredTestFiles` 1,917 against 1,919 — from an earlier change that added test files without
  refreshing it. It is deliberately **not** refreshed here: regenerating it would absorb someone
  else's measurement into this diff and put a large derived file in a review about a reader. The
  census reports this drift on every run and gates on coverage shape, not on the counts, which is
  why it is a report rather than a failure. Refreshing it is owed by whoever is re-measuring.
- `mentionedInvocations` is therefore absent from the committed census file until that refresh. The
  field is read from a live build, never from the committed copy, and the new suite calls the reader
  directly.
- **Attribution is not established and is not guessed.** The text-based reader predates the run that
  found this, and no bisect was attempted.
- The reader recognises a command in a variable that is passed to a spawn by name. It does not
  follow a command assembled across several statements, or one built by a function. No such shape
  exists in the 141 scripts the census reads today; a future one would be reported as a mention, not
  silently dropped, which is what the mention list is for.
