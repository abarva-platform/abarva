# 2026-09-26-t485-nested-jest-probe-ownership — one Jest run owns the transient probe files

## Release ID

`2026-09-26-t485-nested-jest-probe-ownership`

## Status

`candidate`

## Plain-English Summary

The behaviour test suite for this repository was failing at random on code nobody had
changed, and the failures looked like they belonged to whatever change was being measured
at the time. Three runs of the same scope on an unmodified checkout reported 3, 8 and 10
failing suites out of 136, with largely different suites failing each time.

The cause is one file and two test runs. One suite deliberately adds a test file to the
tree mid-run, to prove that the continuous-integration wiring reaches a suite that did not
exist when the wiring was written; roughly thirty other suites list every test file under
`src/` and then read each one. A file that disappears between those two steps kills the
reader. An earlier change moved the removal of that file out of the suite and into the
run's own setup and teardown hooks, where no test worker is alive to see it — which is
correct for one run. But this repository starts a second test run from inside the first: a
quarantine checker spawns the test runner over eight Source integration suites to prove
that each exclusion it lists is still justified. That nested run executes the same two
hooks against the same working tree, and it deleted the outer run's file while the outer
run was still reading.

This change makes ownership explicit instead of assumed. The first run to start claims the
probe files for that checkout; a run that finds a live claim held by another process clears
nothing and removes nothing. Nothing is lost by the nested run standing down — the owner
still removes the file after its own workers have exited.

## Layer Impact

Release lane: `global-control-lane` — shared control-plane tooling every branch and every
agent runs, not scoped to any client. It is behind no feature flag because it is not
reachable from a product surface at all.

- `T` — tests, validators, CI and platform tooling. No product layer is touched: no client
  intake, no source adapter, no canonical model, no product surface. The only code involved
  is the test runner's two global hooks and a new test-support module beside them. Nothing
  here is imported by application code, so no client-visible behaviour can change.

## Client Applicability

- All clients: no.
- Specific clients: none.
- Internal only: yes — developer and CI test execution only.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/testing/transient-probe-ownership.ts` (new) — the claim: which run owns the
  transient probe files for one repository root, held as a small JSON file in the OS temp
  directory keyed by a digest of that root, with pid liveness and an age bound so a killed
  run cannot disable clearing permanently.
- `src/testing/jest-global-setup.ts` — claims ownership; clears leaked probe files only
  when it is the owner.
- `src/testing/jest-global-teardown.ts` — removes probe files and releases the claim only
  when it holds it.
- `src/__tests__/behaviors/t485-nested-jest-probe-ownership.test.ts` (new) — nine cases,
  including a second OS process running both real hooks against one root.
- `src/__tests__/behaviors/t759-transient-probe-files.test.ts` — one existing case updated
  with the reason recorded inline: the teardown now removes only what it owns, so the case
  makes the claim its own setup would have made. The behaviour it asserts is unchanged; its
  precondition is new. No case was deleted or weakened.

## QA / Validation

Scope `jest src/__tests__/behaviors`, default parallelism, measured before and after over
the same scope. The baseline ran in a separate clean worktree at the same base commit, not
against a stashed tree.

**First measurement, base `a4c9e4f69`, unmodified tree, three runs:**

| run | failing suites | failing tests | total suites |
|---|---|---|---|
| 1 | 3 | 3 | 136 |
| 2 | 8 | 12 | 136 |
| 3 | 10 | 9 | 136 |

The failing sets were largely disjoint. Every failure in all three runs resolved to one
path, `src/lib/agent/__tests__/t743-coverage-probe.generated.test.ts`, reached either as an
unhandled `ENOENT` in `scripts/quality/test-ci-coverage-census.mjs:424` or — in the one
suite that parses the census's standard output — as
`SyntaxError: Expected property name or '}' in JSON at position 4`. Position 4, line 2
column 3 is the `e` of `errno` in Node's printed error object for that same crash, so this
is one mechanism reported two ways rather than two mechanisms.

**Who deleted it, measured rather than inferred.** The remover was instrumented to log pid,
parent pid, argv and a stack on every call. Two runs of the test runner executed the hooks
against the same root inside one run: the outer one (`globalSetup` 00:05:43.576Z,
`globalTeardown` 00:06:23.984Z) and a nested one (`globalSetup` 00:05:45.132Z,
`globalTeardown` 00:06:05.782Z) whose argv was `node_modules/.bin/jest` over eight
`src/__tests__/integration/source/*` suites with `--runInBand --json --outputFile`. That is
`scripts/quality/check-source-integration-quarantine.mjs` spawning the runner from inside
`src/__tests__/behaviors/source-quarantine-ceiling-is-a-ratchet.test.ts`.

**Second measurement, base `f46e5f5df`, before and after.** `origin/main` moved between the
two measurements, so the first run's totals are not comparable to this base and this pair is
measured again from scratch: the baseline in a separate clean worktree checked out at
`f46e5f5df` with nothing applied, the after-runs on this branch.

| tree | run | failing suites | failing tests | total suites |
|---|---|---|---|---|
| baseline, unmodified | 1 | 1 | 1 | 137 |
| baseline, unmodified | 2 | 8 | 12 | 137 |
| baseline, unmodified | 3 | 7 | 4 | 137 |
| this branch | 1 | **0** | **0** | 138 |
| this branch | 2 | **0** | **0** | 138 |
| this branch | 3 | **0** | **0** | 138 |

138 rather than 137 because this branch adds one suite. The three baseline failing sets are
again largely disjoint — one run failed only the suite that parses the census's stdout, the
next eight suites, the next seven others — which is the property that makes this a race
rather than a broken assertion. "Repeatedly" above means three consecutive full runs of the
scope at default parallelism; it is not a claim about any number beyond three.

**The fix broken deliberately, three ways, at both bases:**

| mutation | result |
|---|---|
| both hooks reverted to their pre-change bodies | 1 of 9 failing — `expect(existsSync(probe)).toBe(true)` |
| `globalSetup` only reverted | 1 of 9 failing — same assertion |
| `globalTeardown` only reverted | 1 of 9 failing — same assertion |
| neither reverted | 9 of 9 passing |

Run at base `a4c9e4f69` and again at `f46e5f5df`, with the same result each time.

Each hook's guard is therefore load-bearing on its own; neither is absorbed by the other.
The assertion that fails is the file's presence, not the log line — the message is asserted
after it, as corroboration.

The suite also carries its own negative control: a case that calls the remover with no
ownership check and requires the file to disappear. Without it, the case above could pass
against a file nothing was ever going to touch.

## Rollout Plan

Merge to `main`. No runtime rollout: nothing here is imported by application code, no image
behaviour changes, no migration, no flag. CI picks the hooks up on its next run.

## Deployment Authority

Not required. This release cannot affect Azure Container Apps, deploy workflows, runtime
images, flags, environment variables, worker jobs, traffic, DNS, or environment promotion.

- Repo-owned deploy workflow: not invoked by this change.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable — no runtime image or template change.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: no. Nothing in this change is reachable from a product
  surface; the evidence that matters is repeated execution of the test scope, recorded
  above.

## Rollback Plan

Revert the commit. The two hooks return to their unconditional bodies and the scope returns
to being non-deterministically red; no data, schema or runtime state is involved, so there
is nothing else to undo. The claim files live in the OS temp directory and are removed by
the owning run; a leftover one is ignored once its pid is gone or it ages past six hours.

## Audit Evidence

- PR URL: recorded at open time.
- Before/after failing counts over the same scope, and the three mutation results, in the
  QA section above and in the pull request body.
- The instrumented trace that identified the nested run (pids, timestamps, argv) is quoted
  in the QA section; it was temporary local instrumentation and is not committed.
- `node scripts/release-check.mjs --base origin/main --head HEAD`.

## Known Gaps

- **A second, latent race in the same suite is not fixed here, and is filed separately as
  `T-488`.** `source-quarantine-ceiling-is-a-ratchet.test.ts` also rewrites
  `scripts/quality/source-integration-quarantine.json` in the working tree and restores it,
  while `test-ci-coverage-census.mjs` reads every `scripts/quality/*-quarantine.json` it
  finds. No failure in the runs measured here traced to that write — the `SyntaxError` that
  looks like it did is the printed error object of the census's own `ENOENT` crash — so it
  is latent rather than observed, and repairing it inside this item would mix a measured fix
  with an unmeasured one.
- The item as filed named two mechanisms and prescribed per-suite census output paths, or
  moving the probe outside the tree the census walks. Neither would have fixed this: there
  is one mechanism, and moving the probe out of `src/lib/agent/__tests__` destroys the
  property `T-743` exists to assert. The backlog row is corrected with the measurement.
- Two independent runs of the test runner started against one checkout now behave correctly
  with respect to probe files, which is a side effect worth knowing but is not otherwise
  proven here; they still share a runner cache and a working tree.
