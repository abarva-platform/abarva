# 2026-09-20-wire-four-dark-component-directories — Suites the catalog left behind

## Release ID

`2026-09-20-wire-four-dark-component-directories`

## Status

`candidate`

## Plain-English Summary

A workflow already reached into four component directories and named only the
`*.controls.test.tsx` suites the control catalog required. It pulled exactly its own
evidence into CI and left the rest of each directory dark: of 22 suites across those
directories, **15 ran nowhere**.

All 15 were run before anything was wired. **All 15 pass, 99 tests, and none fails to
collect** — healthy suites nothing was running, not a red directory being quietly admitted.
The four directories together are 22 suites and 211 tests in about four seconds.

They are wired as directories rather than as fifteen filenames, for the same reason the
neighbouring step in the same file gives: a file list is a blind spot that reopens the day
someone adds a suite.

## Layer Impact

- `global-control-lane`. One CI workflow step. No product surface, tenant data, schema,
  projection, migration, source file, or runtime behaviour.

## Client Applicability

- All clients: no · Specific clients: none · Internal only: yes — CI
- Public/demo only: no · Feature flag: none

## Changes Included

- `.github/workflows/ai-surface-control-catalog.yml` — one step running
  `src/components/{programs,agent,shell,atlas}/__tests__`.

## QA / Validation

| What | Result |
|---|---|
| The 15 named suites, run before wiring | **15 passed, 99 tests, 0 failed to collect** |
| The step's exact command | **22 suites, 211 tests, all passing** |
| Local wall time for the step | ~4s |
| Job headroom | recent runs ~281s under a 720s ceiling |
| `release-check` | passed |

### The item's own warning pointed at the wrong component, and the measurement found the right one

The acceptance singles out `AgentResponseParts.test.tsx`, citing an earlier item that says
the component has no consumer, and asks for that to be recorded rather than wired.
Measured, **`AgentResponseParts` is reachable from a route and has at least four non-test
importers, including the agent dock.** That warning does not hold today.

The component that *is* orphaned is **`ProbabilisticForecastCard`** — zero non-test
importers, unreachable from any of the 3,366 files the routes reach — and the item does not
mention it. Its suite is run anyway rather than excluded, because dropping one file would
reintroduce the hand-maintained list this change exists to avoid. What that suite does and
does not prove is recorded here instead: it exercises a component the product cannot
currently reach, so it guards against regression in code no user meets.

### A measurement instrument of mine was wrong, and the first answer was wrong with it

The first reachability pass reported **11 of 15 subjects unreachable**. That was the probe,
not the tree: `computeRouteReachability` returns a Set of **absolute** paths and it was
being queried with repo-relative ones, so every lookup missed.

The tell was that **zero of eleven ordinary components came back reachable** — a probe whose
answer never varies is not measuring. Corrected, and given a self-check that asserts a real
route page reads reachable and a nonexistent path does not, the answer is **1 of 15**. Two
of the components were also checked independently by importer grep before the number was
used.

**One earlier claim made with the broken probe was re-verified rather than left standing.**
A previous change recorded `src/lib/admin/admin-action-strip-view.ts` as unreachable. Re-run
with the corrected probe, that is **still true** — the conclusion survives, but it had been
reached with an instrument that could not have said otherwise, and that is worth knowing.

## Rollout Plan

Merge to `main`. The step runs on the next pull request. No image build, migration, flag, or
runtime change.

## Deployment Authority

- Repo-owned deploy workflow: not exercised beyond the ordinary main deploy
- Shared runtime mutators: none · Approved image digest: not applicable
- ACA runtime invariant: not applicable · Worker image invariant: not applicable
- Feature/env flag update path: none · Live signed-in proof required: no

## Rollback Plan

Revert the PR. No data, migration, or runtime state. Reverting returns 15 suites to running
nowhere.

## Audit Evidence

- The PR diff — one workflow step.
- The pre-wiring run of all 15 suites, and the step's exact command at 22 suites / 211 tests.
- The corrected reachability probe with its self-check, and the importer greps corroborating
  two of its answers.

## Known Gaps

- **Wiring is not triage.** These suites now run; nothing here says whether what they assert
  is worth asserting. The item asked for one triage per directory and this delivers the
  measurement and the wiring, not a judgement on 211 individual cases.
- **`ProbabilisticForecastCard` stays unreachable.** Whether that component should be
  reachable, deleted, or left as staged work is a product question this does not answer.
- Running whole directories re-runs the `*.controls.test.tsx` suites the catalog already
  names individually. That duplication costs under a second and keeps both the catalog's
  explicit evidence and the directory sweep honest; collapsing them would mean deciding
  which of the two lists owns those files.
