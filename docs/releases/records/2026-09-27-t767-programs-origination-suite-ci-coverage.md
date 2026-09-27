# 2026-09-27-t767-programs-origination-suite-ci-coverage — Wire the Programs origination component suites, and repair the two that were red where nobody could see them

## Release ID

`2026-09-27-t767-programs-origination-suite-ci-coverage`

## Status

`candidate`

## Plain-English Summary

Six automated test suites sit beside the Programs origination screens. Five of them
ran in no continuous-integration job, which means that for those five, a test could
start failing and no pull request, no check and no person would be told.

The repository measures this for itself. Its test-coverage census ranked this one
directory **first** among all governed-risk directories by the number of unrun tests
nobody had triaged: band `critical`, signal `declared_ai_surface_control`, five
untriaged of five unrun of six.

Two of those five suites were **already failing**, and had been for weeks:

- One asserted that a starter-prompt button carries a particular label. A deliberate
  product change renamed that label on 2026-07-17. The test has been red for ten
  weeks in a suite nothing ran.
- One rendered a component that asks the router for the current route. The test
  never put a router in scope, so both of its cases threw before reaching a single
  assertion — including the only existing assertions about the promotion approval
  card's submit path.

Neither was a defect in the product. The first pinned a label the product had
deliberately moved; the second was missing a piece of test setup that the suite
**next to it in the same directory** already had. Both are repaired, neither by
weakening or deleting a case, and then all six suites are wired into a job that runs
on every pull request.

The change also refuses a tempting shortcut, and the refusal is held by a test. When
one of the six was wired earlier, the directory stopped qualifying for the
repository's "fully dark" list and its line had to be removed from it. That made the
directory **quieter** rather than safer: the warning went away while five of six
suites still ran nowhere. Putting that line back would restore the warning by
asserting something false — that none of these suites run. It is not put back, and a
case fails if anyone does put it back.

## Layer Impact

Release lane: **`global-control-lane`** — the change ships shared repository control
behavior (a CI job step and a behavioral gate) for all clients, with no feature gate.
It is lane-shared rather than client-scoped because no tenant schema, seed, ingestion,
retrieval or private data-plane path is touched.

Layer 4 (Products) test coverage and CI wiring only. No change to any product
behavior, route, read path, query, prompt, schema, entitlement or tenant data.

- **Layer 1 (Client intake):** unaffected.
- **Layer 2 (Source adapters):** unaffected.
- **Layer 3 (Canonical model):** unaffected.
- **Layer 4 (Products):** three test files changed (two repaired expectations/setup,
  one new behavioral guard), one workflow step added, one committed census refreshed.
  No component, route or library source file is touched.

## Client Applicability

- All clients: no behavioral change reaches any client.
- Specific clients: none.
- Internal only: yes — CI coverage and test repair.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `.github/workflows/unit-suites.yml` — one new step,
  `Run the T-767 Programs origination component suites`, naming
  `src/components/programs/origination/__tests__` as a **directory** rather than file
  by file, so a seventh suite written there runs the day it lands. The step's header
  comment states the triage verdict for each of the five suites and the measured
  before/after numbers.
- `src/components/programs/origination/__tests__/StewardChat.attachments.test.tsx` —
  verdict `update`. The starter-prompt label expectation moves to the label the
  product renamed it to, with the reason and the renaming change recorded inline. It
  stays a **literal**: deriving the expectation from the component's own
  `STARTER_PROMPTS` list would make the case pass for any label, including an empty
  one, which is how a rename goes unnoticed in the first place.
- `src/components/programs/origination/__tests__/ProgramOriginationWorkspace.test.tsx`
  — verdict `update`. Adds the `next/navigation` mock the component's unconditional
  `useRouter()` call requires. This is a test-setup gap, not a product defect, and is
  the category backlog item #37 warned would inflate a regression count; it is
  reported as setup, not as a regression.
- `src/__tests__/behaviors/programs-origination-directory-ci-coverage.test.ts` — new,
  7 cases. Proves the wiring through the census's own four-hop resolver
  (workflow → npm script → node script → jest), holds a floor under the directory's
  suite count so the coverage cases cannot pass vacuously, records that no sibling
  directory is prefixed by `__tests__` (a bare Jest path argument is a regex, so one
  arriving later would be adopted by this command without anyone choosing it), and
  refuses the re-add to the fully-dark baseline.
- `docs/architecture/test-ci-coverage-census.json` — refreshed via
  `npm run audit:test-ci-coverage:write`. The committed census is the input to which
  directory gets wired next, so a stale one mis-ranks that queue.

## QA / Validation

**Verified on `origin/main` before editing, not taken from the
filing — and the filing undercounts.** It says two of three suites are unwired. The
directory holds **six** suites and **five** ran nowhere. The three it does not name
are `ProgramOriginationWorkspace.test.tsx`, `StewardChat.attachments.test.tsx` and
`applyArtifactToBrief.test.ts`.

Census row for the directory, before → after, read out of the committed census on
both sides rather than from the console totals:

| | before (`0a6f73356f`) | after |
|---|---|---|
| `partiallyCoveredDirectories` row | `1 of 6`, 5 untriaged unrun | absent |
| `uncoveredDirectories` row | absent | absent |
| `governedRiskRanking` row | score 1000, band `critical`, **rank 1** | absent |
| `governedRiskEvidence` rows | 1 | 0 |

Repository-wide, against the base this PR is actually rebased onto (`0a6f73356f`):
`testFiles` 2504 → 2505 (+1, this change's own guard suite), `coveredTestFiles`
2059 → 2065 (+6: the five wired suites plus the guard, which `test:behaviors` covers),
`uncoveredTestFiles` 445 → 440 (−5), partial directories 25 → 24, fully covered
292 → 293, `critical` governed-risk directories with unrun tests 3 → 2.

**These absolutes were re-measured after a rebase, not carried over, and they moved.**
Measured first at `79de04efa` they read 2058 → 2063; `#8536` landed in between and
added a covered test file. The direction, the −5, and every per-directory figure are
unchanged, but a derived number quoted against the wrong base is stale even when its
conclusion holds, so the figures above are the ones a reader can reproduce at this
PR's base.

**The −5 reconciles per directory in both directions, which is stronger than the
totals:** diffing the two census gap lists, **exactly one** directory left them — this
one — and **none** entered. `npx jest <directory> --listTests` selects exactly the six
files in the directory and nothing outside it, and one of the six was already covered,
so the five that moved are the five that were unrun.

**Suite triage, per suite with the reason — five suites, and every one acted on:**

| suite | before | verdict | reason |
|---|---|---|---|
| `ProgramBriefPanel.test.tsx` | green, 14 cases | `wire` | Holds the only existing assertions about the promotion approval card's submit path. Green when measured, so wiring buys the future rather than repairing the past. |
| `buildBriefSnapshot.test.ts` | green | `wire` | Green when measured. |
| `applyArtifactToBrief.test.ts` | green | `wire` | Green when measured; not named by the filing. |
| `ProgramOriginationWorkspace.test.tsx` | **red, 2 cases** | `update` then `wire` | `invariant expected app router to be mounted` — missing `next/navigation` mock, which the sibling suite in this directory already had. Test setup, not product. |
| `StewardChat.attachments.test.tsx` | **red, 1 case** | `update` then `wire` | Pinned a starter-prompt label a deliberate rename moved on 2026-07-17. Red ten weeks. Expectation moves; behaviour under test unchanged. |

**Clean baseline over the same scope, measured in a separate worktree checked out at
`0a6f73356f` — this PR's actual base — rather than by stashing. Re-run there after the
rebase rather than quoted from the earlier base; both suite figures came back
identical:**

| scope | before | after |
|---|---|---|
| `npm run test:behaviors` | 143 suites / 1520 tests / **0 failing** | 144 / 1527 / **0 failing** |
| the origination directory | 6 suites, **2 failing suites, 3 failing cases** | 6 suites, **0 failing**, 49 passing |

The `+1 suite / +7 tests` in `test:behaviors` is this change's own guard. No
pre-existing failure is claimed or inherited.

**Mutation proof — four directions, each reported by which case fired rather than by
a count, because a redundant guard that absorbs a mutation reads exactly like a guard
that caught it:**

| mutation | cases failing | which |
|---|---|---|
| the workflow step deleted | 3 of 7 | reach, governed-risk ranking, named-literally |
| a trailing slash added to the path | 3 of 7 | the same three |
| the directory re-added to the fully-dark baseline | **1** of 7 | the baseline case only — absorbed by nothing else |
| the directory's six test files removed | **1** of 7 | the suite-count floor only |

Two of those are worth reading twice. The **trailing slash** is not cosmetic: with it,
`--listTests` still selects all six files, so the runner would run them while the
CI-visibility gate reported every one as having no owner — the command would work and
the accounting would lie. And with the directory **emptied**, the coverage case passes
vacuously (an empty directory is absent from both census gap lists in exactly the way
a fully wired one is); the floor is the only thing that fails, which is precisely the
state it exists for.

Every mutation was confirmed to have changed the subject before its result was read —
the step's absence, the slash's presence, the baseline entry, the empty directory —
so that no no-op mutation is reported as a passing guard.

- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` after
  deleting `tsconfig.tsbuildinfo`: **exit 0, zero diagnostic lines.** The exit code is
  judged, not grepped for.
- `npx eslint` over the three changed test files: exit 0, no findings.
- `src/__tests__/behaviors/product-directory-ci-coverage.test.ts` (the fully-dark
  ratchet this change deliberately does not feed): 4 of 4 pass.

## Rollout Plan

Merge to `main` via squash. There is **no runtime rollout**: this change adds a CI
step, repairs two test files and refreshes a committed census. No image, revision,
traffic weight, env var, flag, worker job or migration is affected. The new step
begins running on the next pull request and merge-group run.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged. It
  runs on merge to `main` as it does for every merge; this change does not modify it.
- Shared runtime mutators: none. No `az containerapp` command, image build, traffic
  shift, revision change or secret/env update is part of this release.
- Approved image digest: not applicable — no runtime image change is requested.
- ACA runtime invariant: to be read after merge from the deploy run keyed at or after
  this change's merge SHA, for the record only. No product behavior depends on it here.
- Worker image invariant: unchanged; no worker job image is touched.
- Feature/env flag update path: none.
- Live signed-in proof required: **no.** Nothing user-visible changes — no route,
  component render, query, prompt or entitlement. The evidence for this release is the
  CI wiring and the test results above, and asserting a signed-in proof for a
  CI-coverage change would be a proof of nothing.

## Rollback Plan

Revert the single squash commit. Each piece reverts independently and safely: dropping
the workflow step returns the directory to `partial` (and the new guard then fails,
which is the intended signal rather than a side effect); reverting either test file
returns that suite to its prior red state; reverting the census file returns it to the
stale figures, which the census's own drift check then reports. No migration, no data
change, no runtime state to unwind.

## Audit Evidence

- PR: recorded on the pull request opened from `claude/exec-20260926T2359Z`.
- CI: the pull request's own checks, including the new
  `Run the T-767 Programs origination component suites` step in the `Unit suites` job
  — the first run of these five suites in CI, which is itself the evidence the wiring
  works rather than merely appears in YAML.
- Census before/after: `docs/architecture/test-ci-coverage-census.json` in this diff;
  regenerate with `node scripts/quality/test-ci-coverage-census.mjs` to reproduce the
  drift check.
- Guard: `src/__tests__/behaviors/programs-origination-directory-ci-coverage.test.ts`,
  7 cases, reached by `npm run test:behaviors` which runs in CI.
- Backlog and register: item T-767, claim and release lines in the append-only
  execution claim log.

## Known Gaps

- **The item's count was wrong and is corrected here rather than in the backlog alone.**
  Two of three unwired became five of six. Anyone reading the filing without the
  census will still get the smaller number.
- **This directory is fixed; the shape that produced it is not.** The census still
  reports 440 test files under `src/` that no workflow runs, 388 of them untriaged,
  across 198 directories with unrun tests. `src/components/programs/discovery/__tests__`
  is now rank 1 among governed-risk directories — `critical`,
  `declared_ai_surface_control`, 3 untriaged of 3 unrun of 3 — and is the next one to
  take. That is an observation for the queue, not a claim that this change addressed it.
- **The two repaired suites were red for weeks and nothing reported it.** Wiring them
  stops that recurring here. It does not stop it in the other 198 directories, and the
  `test:before-commit` scope is still three directories wide (backlog item 26).
- The census's governed-risk **band** for 179 directories is `unclassified` because the
  resolver found no product source for them. That is the resolver's silence, not a
  statement that they are low risk, and it is unchanged by this release.
