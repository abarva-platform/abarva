# 2026-09-27-t768-programs-discovery-suite-ci-coverage — wire the Programs discovery component suites

## Release ID

`2026-09-27-t768-programs-discovery-suite-ci-coverage`

## Status

`candidate`

## Plain-English Summary

Three automated test files sat beside the Programs discovery components and no
continuous-integration workflow ran any of them. They passed when run by hand and nothing
would have told us if they stopped. The coverage census ranked this directory **first** among
governed-risk directories by untriaged tests that run nowhere: band `critical`, signal
`declared_ai_surface_control`, **3 untriaged of 3 unrun of 3** — fully dark.

It inherited rank 1 the moment the previous change (`T-767`) wired the origination directory.
It did not get worse; it stopped being second.

This change names the **directory** in the pull-request test workflow, so all three run on
every pull request and a fourth written there tomorrow runs the day it lands.

**All three suites were run before anything else was written, and all three were green** — 2,
2 and 3 cases, 7 in total, 0 failing. So this is a wiring job, not a repair. That is measured,
not assumed: `T-767`'s directory looked like a wiring job too and turned out to hold two suites
that had been red for weeks where nothing could report it. **No test was weakened, skipped or
deleted to reach green, because none needed to be**, and there was no failure to classify as
product defect or test-setup gap.

## Triage per suite, with the reason

Reachability decided `wire` over `delete`, measured by **running**
`scripts/audit/route-reachability-check.mjs` rather than reading its committed artifact:

| suite | subject | reachable from a route? | verdict |
|---|---|---|---|
| `brief-to-shape.test.ts` (2 cases) | `briefToDiscoveryShape` | **yes** — `/programs/new` and `/demo/programs/new` mount `ProgramOriginationWorkspace`, which imports it | `wire` |
| `DiscoveryCapturePanel.test.tsx` (3 cases) | `DiscoveryCapturePanel` | **yes** — rendered by that same workspace | `wire` |
| `DiscoveryReceiptCard.test.tsx` (2 cases) | `DiscoveryReceiptCard` | **no** — an orphan; its only importer, `MoveArtifactUpload.tsx`, is itself an orphan | `wire`, with the coverage it buys named honestly |

The third verdict is the one worth arguing. A green, cheap, correct suite over a presentational
card is not worth deleting, and the card is not dead code in the sense that matters — it is
code whose **only mount** is dead. That is a separate defect with its own id (`T-769`, filed),
not a reason to leave the other two suites dark. What this record will not do is claim the
wiring proves a live surface for that one.

## Layer Impact

**Release lane: `global-control-lane`.** Shared control-plane behavior — a continuous-integration
step and a repo-owned audit document — applying to every client, not feature-gated. It is not
`client-data-lane`: no schema, RLS, seed, ingestion, retrieval or private data-plane path is
touched. It is not `internal-admin`, `public-demo` or `experimental`.

- **Layer 4 (Products)** — test and CI coverage for two Programs surface components and one
  pure mapping function. No product behavior, no rendering, no route, no API changed.
- **No other layer.** No tenant data read or written, no intake file, no adapter, no canonical
  model object, no schema, no migration, no auth, RLS or security setting.

## Client Applicability

- All clients: no functional change reaches any client.
- Specific clients: none.
- Internal only: yes — CI coverage and a repo-owned audit document.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `.github/workflows/unit-suites.yml` — one step in the `unit-suites` job naming
  `src/components/programs/discovery/__tests__` as a directory. The job runs on
  `pull_request` to `main`.
- `src/__tests__/behaviors/programs-discovery-directory-ci-coverage.test.ts` — new, 8 cases.
  Proves the wiring through the census's own resolver rather than by searching a workflow for a
  string, and refuses the re-add to the fully-dark baseline.
- `src/__tests__/behaviors/product-directory-ci-coverage.baseline.json` — the directory's line
  removed: **168 → 167** entries against `54bc2ac277`. The first measurement said 169 → 168, and
  that was against the old base; `main` removed a different line (`src/scripts/__tests__`) in the
  meantime, so the count is corrected here rather than left to read as if this change removed
  two. This change removes exactly one line, and it is this directory's. Required in this same change: that baseline is a set of
  fully-dark directories and the ratchet asserts set **equality**, so leaving the line behind
  fails there instead.
- `docs/architecture/test-ci-coverage-census.json` — refreshed via `--write`; `--check` passes.

## QA / Validation

**The three suites, per suite, before anything was written** (`npx jest --runTestsByPath`):

| suite | result |
|---|---|
| `brief-to-shape.test.ts` | 2 passed, 0 failed |
| `DiscoveryReceiptCard.test.tsx` | 2 passed, 0 failed |
| `DiscoveryCapturePanel.test.tsx` | 3 passed, 0 failed |
| all three together | 3 suites, 7 tests, 0 failing, 0.25s |

**Red-first, then green**, over the new suite (first measured on `6a68c913fd`, and the new
suite re-run green on the merged tree at `54bc2ac277`):

- before the workflow step and the baseline edit: **4 failed, 4 passed of 8** — and it is the
  four wiring cases that failed (reach, governed-risk ranking, named-literally, dark baseline),
  while the four preconditions and floors passed.
- after: **8 passed of 8**.

**Clean baseline over the same scope**, measured in a separate clean worktree at `54bc2ac277`,
the base this lands on, rather than by stashing: `test:behaviors` **144 suites / 1527 tests / 0
failing** before, **145 / 1535 / 0** after — the same figures the first measurement at
`6a68c913fd` gave, re-run rather than carried over. The discovery directory itself: **0 failing before and after**; it
was never red.

**Typecheck**: `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` →
**exit 0**, zero diagnostics. Judged on the exit code, because a bare run exits 134 on this
machine with no output and a grep for `error TS` would report a false clean.

**Lint**: `npx eslint` on the new file → exit 0, no findings.

**Workflow parsed, not grepped**: the YAML parses and the step resolves to
`npx jest src/components/programs/discovery/__tests__ --no-coverage --ci` inside the
`unit-suites` job, whose triggers include `pull_request` on `main`.

**Census reconciliation, per directory by diffing the two gap lists** rather than comparing
totals:

| census gap list | before | after | left | entered |
|---|---|---|---|---|
| uncovered | 173 | 172 | `src/components/programs/discovery/__tests__` | none |
| partially covered | 25 | 25 | none | none |
| union of both | 198 | 197 | that one directory | **none** |

Exactly one directory leaves and none enter, which is the acceptance. Per suite the directory
went `uncovered (0 of 3)` → `covered (3 of 3)`, skipping `partial` entirely — so unlike its
predecessor it never passes through the quieter state. It is also gone from the governed-risk
ranking, where it sat at rank 1; rank 1 is now `src/app/(maestro)/source/__tests__`.

**Repo-wide absolutes, quoted against `54bc2ac277`, the base this pull request actually lands
on** (the `testFiles` figure moves by +1 because this change adds its own behaviors suite).

**These figures were corrected after a merge moved them.** The branch first measured against
`6a68c913fd`; two pull requests landed on `main` while checks were pending, and the branch took
them by merge rather than rebase because a rebase would have needed a force-push. Re-measured in
a separate clean worktree at `54bc2ac277` — not by stashing — the **repo-wide** figures moved
(base `testFiles` 2505 → 2506, run by a workflow 2065 → 2066, uncovered 174 → 173, partial
24 → 25) while every **per-directory** figure this change turns on did not: the directory was
still `uncovered`, still `0 of 3` covered with 3 untriaged, still rank 1, and exactly one
directory still leaves the gap lists with none entering. The generated census was resolved by
**regenerating** it against the new base rather than hand-merging two machine-written files:

| | before | after |
|---|---|---|
| Jest test files under `src/` | 2506 | 2507 |
| run by a workflow | 2066 | 2070 |
| run by no workflow | 440 | 437 |
| run by no workflow, untriaged | 388 | 385 |
| directories with unrun tests | 198 | 197 |
| governed risk among them | 2 critical, 6 high | 1 critical, 6 high |

**Mutation-proven in five directions, applied one at a time, each naming which case fired
rather than a count:**

1. **step deleted** → 3 of 8 fail: reach, governed-risk ranking, named-literally.
2. **trailing slash added** to the jest path → the same 3 fail, and this is the mutation worth
   reading: `npx jest --listTests src/components/programs/discovery/__tests__/` still selects
   **all three files**, so a runner would run them while the visibility gate reported every one
   as having no CI owner. A grep of the workflow would have called this wired.
3. **directory re-added to the fully-dark baseline** → exactly 1 fails, the baseline case.
   Stated plainly: this case is **partially redundant** — the existing dark-directory ratchet
   independently fails on the same mutation, printing `+ src/components/programs/discovery/__tests__`
   as a set difference. Both fire, and they name different things: the ratchet names the drift,
   this case names the instruction the backlog item gave by name. The redundancy is recorded
   rather than sold as a second independent guard.
4. **directory emptied** → exactly 1 fails, the suite-count floor, while the reach case passes
   **vacuously** — an empty directory is absent from both gap lists in exactly the way a fully
   wired one is. That is the state the floor exists for.
5. **the two reachable subjects stripped of their only mount** in
   `ProgramOriginationWorkspace` → exactly 1 fails, the reachability case, absorbed by nothing
   else. Verified that the mutation changed behavior before reading the result: the checker
   re-run reported all three subjects as orphans.

Every mutation was reverted and the product files confirmed byte-identical to `HEAD`
afterwards; `git diff --quiet` passes for `ProgramOriginationWorkspace.tsx` and for
`src/components/programs/discovery/`.

**Runner proof — read from the job log, not grepped from the YAML.** `Unit suites` run
`36286762995`, keyed to this branch's own head SHA `79fb63dee27c6c7b8d70dfe5567239e7dd93e751`
rather than to "the newest run" — run `headSha` confirmed equal, `createdAt
2026-09-27T01:50:47Z`, conclusion `success`. Job `Unit suites that pass on main`, step
`Run the T-768 Programs discovery component suites`:

```
01:57:33 ##[group]Run npx jest src/components/programs/discovery/__tests__ --no-coverage --ci
01:57:35 PASS src/components/programs/discovery/__tests__/brief-to-shape.test.ts
01:57:36 PASS src/components/programs/discovery/__tests__/DiscoveryReceiptCard.test.tsx
01:57:36 PASS src/components/programs/discovery/__tests__/DiscoveryCapturePanel.test.tsx
01:57:36 Test Suites: 3 passed, 3 total
01:57:36 Tests:       7 passed, 7 total
```

Three `PASS` lines naming each suite **individually**, so this is per-suite evidence rather than
a directory-level aggregate, and it reproduces the same 3 suites and 7 tests measured locally
before the wiring.

## Rollout Plan

Merge to `main` through the normal pull request and squash merge. No runtime rollout: the
change adds a CI step, a test file, a baseline line removal and a refreshed audit document. The
repo-owned ACA main deploy workflow will build and deploy on merge as it does for any commit,
and nothing in this change alters an image, env var, flag, scale rule, secret or traffic
weight.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unmodified.
- Shared runtime mutators: none. No `az` command is run by or for this change.
- Approved image digest: unchanged by this release; whatever the main deploy workflow publishes
  for the merge commit.
- ACA runtime invariant: unaffected — no template, revision or traffic mutation. The invariant
  is still checked after the merge deploy, as for any commit.
- Worker image invariant: unaffected.
- Feature/env flag update path: none.
- Live signed-in proof required: **no**. Nothing renders, no route changes, no tenant data is
  read. A signed-in replay would prove nothing this change asserts.

## Rollback Plan

Revert the squash commit. No migration, no data change, no runtime state, so the revert is
complete and immediate. Reverting restores the directory's line to the fully-dark baseline and
the census's previous shape in the same commit, which is what the ratchet's equality assertion
requires in either direction.

## Audit Evidence

- The pull request, its diff, and the `unit-suites` job log showing the new step's `PASS` lines
  and test count — the job log, not a grep of the workflow file.
- `node scripts/quality/test-ci-coverage-census.mjs --check` → exit 0, `committed census
  matches this run`.
- `npm run test:behaviors` → 145 suites / 1535 tests / 0 failing.
- `npx tsc --noEmit` → exit 0.
- The five mutation results above, reproducible from the descriptions.

## Known Gaps

- **`DiscoveryReceiptCard.tsx` is an orphan and its suite is now wired.** The coverage is real
  but it guards a card no route can reach, because its only importer
  (`MoveArtifactUpload.tsx`) is itself an orphan. Filed as `T-769` — mount it or remove it;
  this change deliberately does neither, and deliberately does **not** assert the unreachability
  in a test, because a case pinned to today's orphan set would go red on the pull request that
  finally fixes it.
- **The shape that produced this item is untouched.** After this change **437** test files
  under `src/` still run in no workflow, **385** of them untriaged, across **197** directories.
  `test:before-commit` is still three directories wide. One directory is wired; the pattern is
  not fixed, and the governed-risk **band** for 179 of those directories is `unclassified`
  because the resolver found no product source for them — the resolver's silence, not a finding
  that they are low risk.
- **Deploy proof.** The merge triggers the repo-owned ACA main deploy workflow as any commit
  does. Nothing in this change alters an image, env var, flag, scale rule, secret or traffic
  weight, so the runtime invariant is verified after the merge as routine rather than as this
  change's evidence.
