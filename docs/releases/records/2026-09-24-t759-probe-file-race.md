# 2026-09-24-t759-probe-file-race — Stop the gated behaviors directory racing its own probe file

## Release ID

`2026-09-24-t759-probe-file-race`

## Status

`candidate`

## Plain-English Summary

One CI-gated test directory was failing at random, a different set of suites each
time, with nothing wrong in any of them.

The cause was one suite writing a file and then deleting it while the run was
still going. That suite exists to prove something worth proving: that the CI
command covering a directory reaches a test file added *after* the command was
written, rather than only the files that existed on the day someone typed their
names. It proves it by adding a file nobody has ever heard of and re-measuring.

The problem was the cleanup. Thirty-one suites in that directory ask a coverage
tool to list every test file under `src/` and then read each one. A file that
disappears between the listing and the read kills the tool outright, and takes
whichever suite was asking with it. Which suites died depended purely on
timing — the same three runs produced four, three and four failures.

The repair is a rule rather than a patch: **while tests are running, the set of
files on disk only grows.** A suite that needs a file adds it and leaves it
there. The run removes it once, at the end, after every worker has exited and
there is nobody left to trip over it — and clears a stray copy at the start, so
a run that was killed halfway cannot fail the next one.

The proving suite keeps its file, its case and its point. Nothing was deleted or
weakened to make anything green.

## Layer Impact

Release lane: `global-control-lane` — shared repository tooling, no client data
and no feature gate. It is shared in the sense that every Jest invocation loads
the two new hooks; it reaches no client-visible behaviour.

- **Test and CI tooling only.** `jest.config.ts` gains a `globalSetup` and a
  `globalTeardown`; one existing suite stops deleting a file mid-run; a new
  shared module declares which files a test may add, and a new suite holds the
  mechanism.
- **No product layer is touched.** Nothing under `src/app`, `src/components` or
  the data plane changes. The four canonical layers of the enterprise
  information architecture — client intake, source adapters, canonical model,
  products — are all untouched.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes — repository test harness
- Public/demo only: no
- Feature flag: none

## Changes Included

- `src/testing/transient-probe-files.ts` — new. The single declaration of every
  file a test may add to the working tree for the duration of a run, plus the
  only sanctioned way to add or remove one. `root` is injectable so the control
  suite can drive the real functions over a scratch directory.
- `src/testing/jest-global-setup.ts` — new. Clears a probe file leaked by a
  killed run, before any worker starts.
- `src/testing/jest-global-teardown.ts` — new. Removes it after every worker has
  exited.
- `jest.config.ts` — wires both hooks.
- `src/__tests__/behaviors/t743-agent-tests-directory-ci.test.ts` — the probe no
  longer removes its own file inside the run. Its closing assertion is inverted
  from "the file is gone" to "the file is still here and is registered for
  teardown", so re-adding a removal fails there first.
- `src/__tests__/behaviors/t759-transient-probe-files.test.ts` — new control, six
  cases.

## QA / Validation

Backlog item `T-759`. Base `origin/main` `15e0e9994`.

**Reproduced first, by execution, on the base — before a line was written.**
The item asks for cold-cache repetition because a single warm run is what hid
this, so: `npx jest --clearCache` then the whole gated directory, three times.

| | suites failing | of | failing suites |
|---|---|---|---|
| before, cold run 1 | 4 | 114 | test-success-guard-assertions, liability-product-truth-ci-coverage, rendered-ai-controls-ci-coverage, admin-source-action-route-suite-ci-coverage |
| before, cold run 2 | 3 | 114 | liability-product-truth-ci-coverage, rendered-ai-controls-ci-coverage, admin-source-action-route-suite-ci-coverage |
| before, cold run 3 | 4 | 114 | test-success-guard-assertions, liability-product-truth-ci-coverage, rendered-ai-controls-ci-coverage, admin-source-action-route-suite-ci-coverage |
| after, cold runs 1–3 | 0 | 115 | none |

Every failure was the same unhandled `ENOENT` on
`src/lib/agent/__tests__/t743-coverage-probe.generated.test.ts`, thrown at
`scripts/quality/test-ci-coverage-census.mjs:424`, where a file that was just
enumerated is read. The moving count is what makes it a race rather than a
broken assertion. Warm cache on the base was 0 failing, which is the reading
that hid it.

After: 115 suites, 1035 tests, 0 failing, three cold runs of three, and
`git status` showed exactly the six changed files after each — no leak.

**One correction to the item, measured rather than assumed.** It names four
readers. Four is the observed sample, not the population: 31 suites under
`src/__tests__/behaviors` reach that census, 30 of them enumerate-then-read
through it, and which ones go red is decided by timing alone. That is why the
repair is at the single writer and not at the readers. A rule every future
reader has to remember is the same omission-by-default that left 28 agent
suites outside CI in the first place — the defect the probe exists to disprove.

**Six mutations, five caught, one required to stay green.**

| # | mutation | result |
|---|---|---|
| M1 | probe deletes its file inside the run again | **caught** — 1 case fails, the probe's own |
| M2 | `globalTeardown` dropped from `jest.config.ts` | **caught** — 1 case fails |
| M3 | `globalSetup` dropped from `jest.config.ts` | **caught** — 1 case fails |
| M4 | registry emptied | **caught** — 3 cases fail, including the non-vacuity case |
| M5 | teardown sweeps the directory instead of the registry | **caught** — 1 case fails, exactly the case written for it and no other |
| M6 | a second path registered | **green, and must be** — the control is about the mechanism, not a pinned count |

M5 failing by exactly one case is what shows that case is not redundant with the
others. M6 is the negative control: a registry that grows must not fail.

Other validation, all from the item's own worktree:

- `npm run test:nav` — 26 passed, 0 failed. Confirms the two new hooks load and
  run under a different test path, since they now run for every Jest invocation
  in the repository.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` —
  **exit 0**, judged by exit code, 0 diagnostic lines.
- `npx eslint` over all six changed files — exit 0.
- `node scripts/release-check.mjs --base origin/main --head HEAD`.

**Observed live, not asserted:** the first run of the new control printed
`[t759] cleared 1 probe file(s) leaked by an earlier run` — a real leak from the
reproduction runs above, cleared by the new `globalSetup` on its first
execution.

## Rollout Plan

Merge to `main` via squash. The repo-owned ACA main deploy workflow builds and
deploys as usual. Nothing here ships to a runtime surface: no file under `src/`
that the application imports changes, and `jest.config.ts`,
`src/testing/jest-global-*.ts` and `src/testing/transient-probe-files.ts` are
loaded only by Jest.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, on merge
  to `main`. No hand-run Azure command.
- Shared runtime mutators: none. This change adds no env var, flag, secret or
  scale change.
- Approved image digest: whatever the main deploy workflow builds from the merge
  SHA; recorded against the item when the run completes.
- ACA runtime invariant: to be proven from the deploy run's own
  `runtime-invariant-proof.json` — Container App template image, the
  100%-traffic revision image and both worker job images equal one
  digest-pinned image.
- Worker image invariant: same digest, from the same artifact.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: **no, and none is owed.** Nothing here renders
  on a product surface; the changed modules are loaded by Jest and by nothing
  under `src/app`. No signed-in acceptance is asserted.

## Rollback Plan

Revert the squash commit. The change is additive and confined to the test
harness: reverting restores the previous `jest.config.ts`, the previous probe
suite, and removes three new modules and one new suite. No migration, no data,
no runtime state. The only consequence of a rollback is the return of the
intermittent failures this record measures.

## Audit Evidence

- PR and CI check run on the merge SHA.
- Before/after cold-cache tables above, each from `npx jest --clearCache`
  followed by a full run of the gated directory.
- Mutation table above; each row is a real edit, run, and revert from the
  commit.
- The deploy run keyed to the merge SHA and its `runtime-invariant-proof.json`
  artifact, recorded against item `T-759` in `EXECUTION_PULSE_20260918.md`.

## Known Gaps

- **Two Jest processes on one checkout can still collide.** Run B's
  `globalSetup` would clear a probe file run A wrote moments earlier. This is
  narrower than the defect repaired here — it needs two concurrent runs on one
  working tree rather than one run on its own — and the project already requires
  one worktree per session. Named here rather than fixed.
- **The coverage census still dies on an unhandled `ENOENT`** when a file
  vanishes between its enumeration and its read. This change removes the only
  known producer of that condition, not the census's intolerance of it. The
  census script was held by another agent's live claim during this work and is
  deliberately untouched; the residual robustness gap is filed separately rather
  than taken here.
