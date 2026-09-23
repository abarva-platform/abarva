# 2026-09-23-t742-stale-suite-triage — Fifth triage draw of twenty unrun suites

## Release ID

`2026-09-23-t742-stale-suite-triage`

## Status

`candidate`

## Plain-English Summary

The repository has more Jest suites than any CI workflow runs. They are being
triaged in batches of twenty, drawn from the highest-risk end of the census,
each one executed and each one given a written verdict handed to a follow-on
item. This is the fifth such batch. It changes no product code and wires
nothing on.

Twenty suites were executed individually before any verdict was written:
**313 tests, 313 passed, 0 failed, 0 pending; 20 suites green, 0 red.** All
twenty verdicts are `wire_into_ci`.

**The finding is not in any one suite — it is in where the twenty landed.**
Every row left in the pool at this base is the same band and the same score, so
the ranking collapses to path order and the draw became an alphabetical sweep of
one directory: **nineteen of the twenty are `src/lib/agent/__tests__`.** The
census at this base reports that directory holds 33 test files, of which **5 are
covered and 28 are untriaged and unrun, with zero declared quarantines.** It is
reached by *named-file* commands, so every file added to it since those commands
were written falls outside CI by omission. This draw judges 19 of the 28. The
nine it does not reach include `untrusted-content`, `tenant-guardrails`,
`system-prompt-guardrails`, `restricted-output-policy` and
`retrieval-tenant-leak` — the agent runtime's prompt-injection, tenant-fence and
restricted-output suites.

**What the twenty actually prove, now that they are executed rather than
counted.** The agent's fail-closed boundary is exercised end to end and by
nothing in CI: a context bundle with no identity can never classify as anything
but blocked; a blocked bundle maps to `refuse_or_defer` and encodes its blocking
input ids; a capture-field proposal with no usable citation is dropped rather
than accepted uncited; fifty uploads in sixty seconds yield `rate_limit` with
storage, parsing and queueing all denied, and an executable disguised as a PDF
is quarantined *before* storage or parsing. Fifty-one cases resolve every
canonical tenant key and alias and assert in both directions — the requested
slug comes back, and no other tenant's display name ever does.

**Two of the previous batch's controls are vacuous here, and the record says so
in writing rather than passing quietly.** T-556's draw held one source-text
scanner and two red suites, so its guard asserted both populations were
non-empty. This draw holds zero of each, which is the healthy state; carrying
those preconditions forward would turn a clean draw red for being clean. The
rules are kept in full and the preconditions are replaced by a control that
silence cannot satisfy: the record must *declare* each emptiness, and the guard
recomputes both from the rows and fails if declaration and rows disagree.

## Layer Impact

**Release lane: `internal-admin`.** This is AbarVa-only repository quality
tooling — a triage record, the behavioral guard that reads it, and a structure
map entry. No client receives anything, and no product surface changes.

- **Layer 4 (products):** none. No product surface, route, component or read
  path is touched.
- **Layer 3 (canonical model):** none.
- **Layers 1–2 (intake, adapters):** none.
- **Repository quality substrate:** one new record under `docs/architecture/`,
  one new behavioral guard under `src/__tests__/behaviors/`, and twenty-one item
  ids placed in the execution stage map.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes — repository quality tooling and a triage record
- Public/demo only: no
- Feature flag: none

## Changes Included

- `docs/architecture/t742-stale-suite-triage.json` — new. The draw, the
  execution evidence and one verdict per suite. Every count in it is read out of
  the Jest run that produced it by script; none was typed by hand.
- `src/__tests__/behaviors/t742-stale-suite-triage-record.test.ts` — new. 18
  cases guarding the record. Picked up by the `Behavior coverage floor` job,
  which runs `jest src/__tests__/behaviors` wholesale, so no workflow edit is
  needed.
- `scripts/exec/source-stage-map.json` — places `T-742`, `T-743` and `T-744`,
  and closes a pre-existing gap while it is open: eighteen further ids
  (`T-709`–`T-714`, `T-720`, `T-723`, `T-728`, `T-729`, `T-731`, `T-733`,
  `T-736`–`T-741`) were in the backlog and in no stage-map entry, so the board
  reported them `unmapped` and the queue could never offer them. `not placed on
  the map` goes from **16 to 0**.

## QA / Validation

Base `5cb905487a3c119cca93edc2ecd842261ed0a91e`, in an isolated worktree.

**The twenty suites under triage.** Each run on its own with
`npx jest --runTestsByPath <path> --no-coverage --ci --json --outputFile`, at
2026-09-23T19:20:32Z–19:20:48Z, before any verdict was written. `--runTestsByPath`
for all twenty because the first path contains `(maestro)`, which a bare jest
pattern reads as a regex group. Totals: **20 suites, 313 tests, 313 passed, 0
failed, 0 pending.**

**The harness was proved to have found tests, not merely to have exited 0.**
Every one of the twenty runs reports `numTotalTestSuites: 1`, exactly one entry
in `testResults`, and `numTotalTests > 0`. A run matching no file reports zero
and is the failure mode a green exit code hides; it is asserted here rather than
assumed, and the assertion is also a case in the guard.

**None of the twenty was edited.** The guard fails if any path under judgement
appears in the record's `claimedWriteFiles`.

**The guard, broken deliberately.** Eight mutations were applied to the record,
one at a time, each reverted from a byte-identical backup before the next, and
the baseline confirmed green again at the end. **All eight were caught.**

| mutation | result |
|---|---|
| understate the directory concentration, 19 → 12 | 1 failed, 17 passed |
| replace the scanner-vacuity declaration with `"none"` | 1 failed, 17 passed |
| re-judge a path T-556 already judged | 2 failed, 16 passed |
| publish `red: 1` while every row is green | 1 failed, 17 passed |
| flag a wired suite as a source-text scanner | 3 failed, 15 passed |
| hide the one byte-matching case inside a wired suite | 1 failed, 17 passed |
| inflate one suite's test count to 999 | 1 failed, 17 passed |
| hand a row to a follow-on item the record does not describe | 1 failed, 17 passed |
| *(restored)* | **18 passed, 0 failed** |

**Clean baseline over the same scope.** `npx jest src/__tests__/behaviors` with
the new guard removed from the tree: **111 suites, 991 tests, 0 failing.** The
same command with it present: **112 suites, 1009 tests, 0 failing.** The whole
delta is the new guard — one suite, eighteen cases — and no existing behavior
test changed state. No absolute failure count is quoted as if this change caused
it, because there is none.

**Other checks on this base.** `node scripts/exec/build-execution-queue.test.mjs`
— 166 passed, 0 failed, 2 skipped (both skips are the live-corpus abstention
T-739 made explicit, not silent passes). `node scripts/exec/build-source-board.test.mjs`
— 35 passed, 0 failed. `npx jest --listTests src/__tests__/behaviors` names the
new guard, so its CI wiring is proved by execution rather than by reading a
workflow file. `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit
--pretty false` — **exit 0**, judged by exit code, zero lines of output.
`npx eslint` on the new guard — exit 0.

**What is not claimed.** This record does not wire any of the twenty into CI,
does not rewrite the one byte-matching case it names, and does not touch the
nine suites in the same directory that the draw did not reach. Those are T-743
and T-744, filed with this item and unclaimed.

## Rollout Plan

Merge to `main`. No runtime rollout: nothing in this change is served, rendered,
executed by a worker, or read by a product surface. The new guard begins running
on the next pull request through the existing `Behavior coverage floor` job.

## Rollback Plan

Revert the merge commit. The three files are additive — one record, one guard,
one structure-map entry list — and nothing reads them at runtime, so a revert
restores the previous state exactly. Reverting also restores the 16 `unmapped`
board ids, which is a return to the prior state rather than a regression this
change introduced.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` runs on
  merge, as it does for every merge to `main`.
- No hand-run Azure command, no shared-traffic mutation, no ACA job.
- The runtime invariant is owed on the run keyed to the merge SHA and will be
  recorded as an addendum in the register.

## Audit Evidence

- Triage record: `docs/architecture/t742-stale-suite-triage.json`
- Guard: `src/__tests__/behaviors/t742-stale-suite-triage-record.test.ts`
- Prior draws, all four asserted disjoint from this one by the guard:
  `t472`, `t509`, `t550`, `t556` under `docs/architecture/`
- Census used to enumerate and rank the pool:
  `scripts/quality/test-ci-coverage-census.mjs --json`

## Known Gaps

- **Nineteen of the twenty are wired into nothing, and this item does not wire
  them.** The verdicts are recorded; `T-743` is unclaimed. Until it lands, the
  agent runtime's fail-closed boundary, tenant resolution and upload-abuse guard
  remain proven only by a command an operator has to type.
- **Nine suites in the same directory are outside this draw.**
  `untrusted-content`, `tenant-guardrails`, `system-prompt-guardrails`,
  `restricted-output-policy`, `retrieval-tenant-leak` and four others are in the
  remaining pool of 21 and are unjudged. They are named here so their absence is
  a recorded gap rather than an omission a reader has to notice.
- **`persona-army-harness` is wired on a narrower claim than its name suggests.**
  It proves the persona plan is well-formed — ten personas, 240 scheduled runs,
  every run anchored to a golden fixture. It does **not** prove any persona run
  ever executes. That second question is not asked or answered here.
- **The one byte-matching case is wired along with its suite.** Following the
  T-556 precedent for a mostly-executing suite, `module-v6-answer-contract` is
  wired with its `readFileSync` case named in the record and handed to `T-744`,
  rather than held back. Until T-744 lands, that case proves five string tokens
  are present in two route files, not that the routes behave that way.
- **The two vacuous controls are vacuous.** No source-text scanner and no red
  suite appears in this draw, so neither rule fired. The record declares both and
  the guard recomputes them, but a rule that did not fire has not been exercised
  by this batch's evidence.
- **The id band is still unresolved.** `T-500`–`T-599` is exhausted at 0 of 100
  free, so `T-742`–`T-744` continue the `T-7xx` range the last six filings used
  in practice rather than a ratified band. Recommend `T-700`–`T-799` be declared
  Claude Code's T band. Flagged, not guessed.

## Follow-on Items

- **T-743** — wire the suites this record marks `wire_into_ci` into CI **by
  directory rather than by named file**, so a suite added to
  `src/lib/agent/__tests__` tomorrow cannot fall outside CI by omission the way
  28 of 33 have.
- **T-744** — rewrite the one byte-matching case named in the record so it
  invokes the two synthesis routes and reads the headers and prompt block off
  the response, instead of `readFileSync`-ing the route source and matching five
  string tokens.
