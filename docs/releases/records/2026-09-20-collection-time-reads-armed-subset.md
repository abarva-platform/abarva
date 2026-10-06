# 2026-09-20-collection-time-reads-armed-subset — 178 cases that were not running

## Release ID

`2026-09-20-collection-time-reads-armed-subset`

## Status

`candidate`

## Plain-English Summary

A filesystem read in a `describe` body runs during jest's collection phase. If the path is
gone, the throw takes the **whole file** down — every case in it, including ones that touch
nothing missing — and jest reports "0 tests", which does not read as a failure the way a red
count does.

112 test files do this. The item required the **armed** subset be measured first, because a
gate proposed against 112 files would be a gate failing on arrival.

Measured by running them rather than by parsing path expressions: **6 files are armed**, and
between them **183 declared cases were not running.** 178 of those now run and pass.

## Layer Impact

- `global-control-lane`. Six test files and the shared QA path register. No product surface,
  tenant data, schema, projection, migration, or runtime behaviour.

## Client Applicability

- All clients: no · Specific clients: none · Internal only: yes — test suites
- Public/demo only: no · Feature flag: none

## Changes Included

- `src/__tests__/integration/agents/agent-mission-queue.test.ts`,
  `…/cross-agent-handoff.test.ts` — one wrong path each.
- Four `src/__tests__/integration/intelligence/*` suites — dead component-hygiene blocks
  replaced by retirement records resolved through the shared register.
- `src/lib/qa/path-disposition.ts` — five sunset paths declared.

## QA / Validation

| What | Before | After |
|---|---|---|
| armed files (suite fails to collect) | **6** | **0** |
| the six suites | **0 tests ran** | **178 passed** |
| all 111 scanned files together | 17 suites failed, 2,609 tests | 11 suites failed, **2,787 tests** |
| test failures across that run | 42 | **42 — unchanged** |

`tsc --noEmit` exit 0. `eslint` exit 0. **Mutation harness: 5 mutations, 5 caught, 0 survived.**

### Two families, and only one was a retirement

- **Two suites had a wrong path.** They read `src/lib/agents/…`; the modules live in
  `src/lib/agent/…`, singular. The plural directory exists, so the path resolves to a real
  directory and a file that is not in it. Correcting one word restored **74 cases, all
  passing** — coverage of live modules that had been dead with nobody the wiser.
- **Four suites read components the legacy surface sunset deleted** at `0c6a86c51`. Those
  blocks are recorded as retired and checked against the register, so what the sunset cost
  stays visible. **104 cases** in those files now run.

A fifth missing path turned up mid-repair — a nested route under the sunset tenant tree.
Its history was verified with `--diff-filter=A` and `D` on this branch rather than inferred
from its parent, then declared.

### Why the harness had to check more than the count

In direction 1 the mutated run printed **`Tests: 145 passed, 145 total`** — a green-looking
line — while a suite had silently failed to collect. A harness reading only pass/fail counts
would have scored that mutation as survived. It checks for `failed to run` as well, which is
the defect this whole item is about.

### A repair I got wrong first

The first patch replaced each dead `describe` block by slicing to the *next* `describe`.
For the last block in a file that means slicing to end-of-file, which deleted a
`stripComments` helper the surviving blocks call — turning four suites into a different
collection error. Reverted and redone ending each block at the `});` that closes it.

## Rollout Plan

Merge to `main`. The six suites run on the next PR. No image build, migration, flag, or
runtime change.

## Deployment Authority

- Repo-owned deploy workflow: not exercised beyond the ordinary main deploy
- Shared runtime mutators: none · Approved image digest: not applicable
- ACA runtime invariant: not applicable · Worker image invariant: not applicable
- Feature/env flag update path: none · Live signed-in proof required: no

## Rollback Plan

Revert the PR. No data, migration, or runtime state. Reverting returns 178 cases to not
running.

## Audit Evidence

- The PR diff.
- The before/after armed counts (6 → 0) and the whole-run totals (2,609 → 2,787 tests, 42
  failures unchanged).
- The five mutation results.

## Known Gaps

- **No gate is added, and that is deliberate.** 106 of the 112 files read the filesystem in a
  `describe` body without being armed today; each is a landmine that arms itself the day its
  subject moves, but a check failing on 106 files would be the fail-on-arrival pattern. The
  armed count is now 0, which is the number a ratchet could hold — proposing one is separate
  work, and it needs a rule that distinguishes an armed read from a merely latent one.
- **42 test failures remain across the 111 scanned files** and are untouched. They are
  ordinary assertion failures in suites that collect fine, outside this item's subject, and
  none was weakened.
- The four retirement records assert absence. If a component returns, the register says so
  and the case fails — which is the direction that keeps the record honest.
