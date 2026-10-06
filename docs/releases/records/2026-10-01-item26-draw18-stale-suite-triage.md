# 2026-10-01-item26-draw18-stale-suite-triage — Eighteenth stale-suite triage draw, verdicts only

## Release ID

`2026-10-01-item26-draw18-stale-suite-triage`

## Status

`candidate`

## Plain-English Summary

183 Jest test files run in no continuous-integration job. The coverage census
ranks the unrun files nobody has judged yet, and each triage draw takes the top
of that ranking, runs every file, and records a verdict for each one.

This is the eighteenth draw. The ranking held only 19 directories after draw 17,
so this draw takes all of them: ranks 1–19, one file per directory, all in the
`unclassified` band. **After it, the ranking is empty: every untriaged unrun
file in the repository carries a verdict.** It is filed under the standing P3
item 26 (stale-suite triage) rather than a new item id, because the lane's T-id
ranges are spent and choosing a new range is an owner decision.

Each file was run on its own. 18 were green and 1 was red:

- **14 are ready to wire.** Each is green and behavioural, reads no repository
  file, and tests a subject that a route, page, component or library entry
  point imports.
- **4 are held under T-775's rule.** Each is green, but imports a module the
  repository's own reachability registry lists as `testOnly`.
- **1 is red because of a product defect, and needs a repair.** The promotion
  preview renderer finds one tenant's key by matching a regular expression
  against tenant *display names*. That tenant's display name was later changed
  to a neutral label, so nothing matches and the key it derives is the empty
  string. The tenant-specific section of the preview therefore counts zero rows
  for every input. The tenant key itself is still declared. The repair is to
  resolve the key from the declared key rather than from a display name, the
  repository's own rule that identity is declared, never inferred. The test's
  second assertion expects the old display name in a heading that now prints
  the neutral label on purpose, so it is updated in the same repair.

This change is **read-only** for product code, and it changes no workflow or
baseline. It adds the verdicts and a control, and it regenerates the census so
the nineteen files are held out of any further draw. It also amends one existing
guard, described next, which the completed triage turned red.

### The one existing test changed, and why

`t773-census-ranking-reads-triage-verdicts.test.ts` had a real-tree case
requiring at least one real, unjudged, drawable file. That is a statement that
triage is unfinished, so it went red the moment this draw finished the ranking.
The drawable direction is already proven independently by the suite's fixture
case "keeps a file nobody has judged drawable". The real-tree case now asserts
the property that holds both while work remains and after it is done:

- no untriaged file is both unjudged and held;
- an empty drawable set means an empty ranking with every untriaged file held.

A census that wrongly holds an unjudged file still turns it red; see mutation 11.

## Layer Impact

**Release lane: `global-control-lane`.** Shared CI tooling that applies to every
client's build equally, behind no feature gate.

- **Layer 4 (Products):** no product behaviour changes, and no product or test
  file under a product directory is edited.
- **Platform tooling / CI:** this change adds one triage record and one
  behavioural control, amends one census guard, and regenerates the census.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes. CI triage records only.
- Public/demo only: no
- Feature flag: none

## Changes Included

- `docs/architecture/item26-draw18-stale-suite-triage.json`: the record. It has
  19 rows, each with measured jest counts, a verdict, an owner and a rationale.
  The red row carries a machine-checkable `redCause`. Each held row names the
  registry entry that holds it.
- `src/__tests__/behaviors/item26-draw18-triage-record.test.ts`: the control.
  It has 9 cases, and each recomputes a claim from the tree:
  - whether a file reads repository text, from its bytes;
  - whether a wiring row's resolved imports appear in either reachability
    registry;
  - whether a held subject is still listed by the registry the row names, and
    is still what the test imports;
  - whether the red row's cause still holds, which needs four things together:
    - the renderer still matches by display name;
    - no declared display name matches the pattern;
    - the intended key is still declared;
    - the test still expects the section to count rows;
  - whether any other triage record already judged a drawn file;
  - whether the committed census resolves every drawn path to this record.

  It imports no `src` module, so the behaviour coverage floor's denominator is
  unchanged.
- `src/__tests__/behaviors/t773-census-ranking-reads-triage-verdicts.test.ts`:
  one real-tree case amended, as described above.
- `docs/architecture/test-ci-coverage-census.json`: regenerated with `--write`.
  - Ranked directories: 19 → 0.
  - Held test paths: 112 → 131.
  - Test files: 2594 → 2595, and covered files 2411 → 2412. The difference is
    the new control, which the behaviors directory already runs.
  - Unrun files stay at 183.

## QA / Validation

**Draw executed on base `8cc068d27a`.** Each file was run alone with
`npx jest --runTestsByPath <file> --no-coverage --ci --json`: 18 green, 1 red.
Each subject was resolved from its test's imports and checked against both
reachability registries. Each wiring subject was also confirmed imported by a
non-test file. The red cause was traced to the commit that renamed the
display name.

**Red first.** With the base census restored, the control fails 1 of 9 (the
census case). With the regenerated census, it passes 9 of 9. The T-773 suite
failed 1 of 14 on the regenerated census before the amendment, and passes 14 of
14 after it.

**Mutations: 11 of 11 caught.**

| # | mutation | result |
|---|---|---|
| 1 | the renderer repaired to resolve the declared key | control 1 failed (red cause) |
| 2 | the old display name declared again | control 1 failed (red cause) |
| 3 | a wiring row declared to read the tree | control 2 failed |
| 4 | a held module dropped from `testOnly` | control 1 failed (held subject) |
| 5 | published counts disagree with the rows | control 1 failed (counts) |
| 6 | the red row re-labelled `wire_into_ci` | control 3 failed |
| 7 | a held row re-labelled `wire_into_ci` | control 2 failed |
| 8 | the census restored to the base | control 1 failed (census) |
| 9 | the red row called green | control 1 failed (green means passing) |
| 10 | the intended tenant key retired | control 1 failed (red cause) |
| 11 | one drawn file un-judged AND the census holding unjudged files | T-773 5 failed, including the amended case |

Mutation 11 has a control of its own. The same un-judged row with an honest
census passes 14 of 14, because the file correctly returns to the drawable set.

**Baselines.** Behaviors on a clean detached worktree at `8cc068d27a`:
172 suites / 1815 tests / 0 failed. On this branch: 173 / 1824 / 0. Other
checks:

- census `--check`: 0;
- triage reconciliation: 0;
- `tsc --noEmit`: exit 0, judged on the exit code;
- eslint: 0.

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

Revert the pull request. That removes the record and the control, restores the
T-773 case and the previous census, and returns the nineteen files to the draw.
Nothing needs to be unwound in a running environment.

## Audit Evidence

- The triage record, with per-file jest counts.
- The control suite and the mutation table above.

## Known Gaps

- None of the 14 `wire_into_ci` files runs in CI yet. Wiring them is this
  draw's second half, and each must be re-executed on the then-current `main`
  first.
- The repair row (rank 18) is a small product fix plus one heading assertion.
  It is claimable under item 26.
- The four held subjects need a retire-or-mount decision from T-775.
- With the ranking empty, the stale-suite fallback in the executor's task file
  has no further draw to take. The remaining unrun files are all held by a
  verdict that names owned work.
- On an empty ranking, the T-773 case "ranks no directory without a drawable
  file" iterates zero rows. It is vacuous until a new unrun file appears.
