# 2026-10-01-item26-draw17-stale-suite-triage — Seventeenth stale-suite triage draw, verdicts only

## Release ID

`2026-10-01-item26-draw17-stale-suite-triage`

## Status

`candidate`

## Plain-English Summary

196 Jest test files run in no continuous-integration job. The coverage census
ranks the unrun files nobody has judged yet, and each triage draw takes the top
of that ranking, runs every file, and records a verdict for each one.

This is the seventeenth draw: ranks 1–20, one file per directory, all in the
`unclassified` band. It is filed under the standing P3 item 26 (stale-suite
triage) rather than a new item id, because the lane's T-id ranges are spent and
choosing a new range is an owner decision.

Each file was run on its own. 16 were green and 4 were red:

- **11 are ready to wire.** Each is green and behavioural, reads no repository
  file, and tests a subject that a route, page, boot hook or operator script
  imports.
- **5 are held under T-775's rule.** Each is green, but imports a module the
  repository's own reachability registry lists as `testOnly`.
- **2 are red because the data they read was deleted, and need a repair.** Both
  load files from legacy synthetic dataset roots that were removed from the
  repository in July. They join the open data-lane decision from draw 16:
  frozen fixture, re-point at the registry-declared intake, or retire the case.
- **2 are red because the product deliberately changed, and need a test-only
  update.** One builds an inline fixture for a tenant that was removed from the
  canonical tenant declarations in August, so the canonical promotion evaluator
  now blocks it. The other expects a tenant alias, removed in July, to still
  resolve. In both the product's new behaviour is the intended one, and neither
  reads any corpus, so the update needs no data decision: re-key the fixture,
  and move the alias from the accepted list to the rejected list.

This change is **read-only**. It adds the verdicts and a control, and it
regenerates the census so the twenty files are held out of the next draw. No
workflow, baseline or existing test file changes.

## Layer Impact

**Release lane: `global-control-lane`.** Shared CI tooling that applies to every
client's build equally, behind no feature gate.

- **Layer 4 (Products):** no product behaviour changes, and no product or test
  file under a product directory is edited.
- **Platform tooling / CI:** one triage record and one behavioural control are
  added, and the census is regenerated.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes. CI triage records only.
- Public/demo only: no
- Feature flag: none

## Changes Included

- `docs/architecture/item26-draw17-stale-suite-triage.json`: the record. 20 rows
  with measured jest counts, a verdict, an owner and a rationale for each. Red
  rows carry a machine-checkable `redCause`; held rows name the registry entry
  that holds them.
- `src/__tests__/behaviors/item26-draw17-triage-record.test.ts`: the control,
  9 cases, each recomputing a claim from the tree:
  - whether a file reads repository text, from its bytes;
  - whether a wiring row's resolved imports appear in either reachability
    registry;
  - whether a held subject is still listed by the registry the row names, and
    is still what the test imports;
  - whether each red row's cause still holds: a deleted dataset root against
    the filesystem; a retired tenant key against the canonical tenant
    declarations; a retired alias against the alias table, read in both
    directions (one expected input still declared, at least one not);
  - whether any other triage record already judged a drawn file;
  - whether the committed census resolves every drawn path to this record.
  It imports no `src` module, so the behaviour coverage floor's denominator is
  unchanged.
- `docs/architecture/test-ci-coverage-census.json`: regenerated with `--write`.
  Ranked directories 39 → 19, held test paths 105 → 125, test files
  2592 → 2593 and covered files 2396 → 2397 (the new control, which the
  behaviors directory already runs). Unrun files stay at 196.

## QA / Validation

**Draw executed on base `1484038274`.** Each file was run alone with
`npx jest --runTestsByPath <file> --no-coverage --ci --json`: 16 green, 4 red.
Subjects were resolved from each test's imports and checked against both
reachability registries; each wiring subject was also confirmed imported by a
non-test file. Each red cause was traced to the commit that introduced it.

**Red first.** The control was run before the census was regenerated: 1 of 9
failed (the census case). After regeneration: 9 of 9.

**Mutations: 11 of 11 caught.** Each was checked by a sha256 change before the
run and a sha256 restore after, and each fired the case it targets:

| # | mutation | case that fired |
|---|---|---|
| 1 | a `testOnly` subject's row re-labelled `wire_into_ci` | wiring reachability; census |
| 2 | a repair row declared not to read the tree | bytes |
| 3 | published counts disagree with the rows | counts |
| 4 | a deleted dataset root restored on disk | red-cause |
| 5 | the retired tenant declared again in the canonical list | red-cause |
| 6 | the retired alias restored in the alias table | red-cause |
| 7 | a held module dropped from `testOnly` | held-subject |
| 8 | a wiring row's subject added to `testOnly` | wiring reachability |
| 9 | a red row called green | green-means-passing |
| 10 | the census resolves a different verdict for a drawn file | census |
| 11 | the stale fixture re-keyed while the row stays held | red-cause |

**Baselines.** Behaviors on a clean detached worktree at `1484038274`:
171 suites / 1805 tests / 0 failed. On this branch: 172 / 1814 / 0. Census
`--check` 0, triage reconciliation 0, Source workspace quarantine checker 0 and
its node tests with the reconciliation tests 14 of 14, `tsc --noEmit` exit 0,
eslint 0, release-check 0.

## Rollout Plan

Merge to `main` through the repo-owned workflow. No runtime rollout: no image,
migration, flag, environment variable or traffic change.

## Deployment Authority

Not required. This release cannot affect Azure Container Apps, runtime images,
flags, environment variables, worker jobs, traffic or DNS.

- Repo-owned deploy workflow: not invoked by this change
- Shared runtime mutators: none
- Approved image digest: n/a (no runtime image change)
- ACA runtime invariant: unaffected
- Worker image invariant: unaffected
- Feature/env flag update path: n/a
- Live signed-in proof required: **no**, because no product surface changes

## Rollback Plan

Revert the pull request. That removes the record and the control and restores
the previous census; the twenty files return to the draw. Nothing needs to be
unwound in a running environment.

## Audit Evidence

- The triage record, with per-file jest counts.
- The control suite and the mutation table above.

## Known Gaps

- None of the 11 `wire_into_ci` files runs in CI yet. Wiring them is this
  draw's second half; each must be re-executed on the then-current `main` first.
- The 2 test-only updates are claimable now; each lands with its own wiring.
- The 2 repair rows wait on the draw 16 data-lane decision.
- The five held subjects need a retire-or-mount decision from their owners.
