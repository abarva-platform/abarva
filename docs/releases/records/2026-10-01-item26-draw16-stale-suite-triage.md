# 2026-10-01-item26-draw16-stale-suite-triage — Sixteenth stale-suite triage draw, verdicts only

## Release ID

`2026-10-01-item26-draw16-stale-suite-triage`

## Status

`candidate`

## Plain-English Summary

203 Jest test files run in no continuous-integration job. The coverage census
ranks the unrun files nobody has judged yet, and each triage draw takes the top
of that ranking, runs every file, and records a verdict for each one.

This is the sixteenth draw: ranks 1–20, one file per directory, all in the
`unclassified` band. It is filed under the standing P3 item 26 (stale-suite
triage) rather than a new item id, because the lane's T-id ranges are spent and
choosing a new range is an owner decision.

Each file was run on its own. 14 were green and 6 were red:

- **7 are ready to wire.** Each is green and behavioural, reads no repository
  file, and tests a subject that a route, page or tooling script imports.
- **5 are held under T-775's rule.** Each imports a module the repository's own
  reachability registry lists as `testOnly`. One of the five is also red.
- **5 are red because the data they read has moved, and need a repair.** Seven
  of the twenty files build from tenant data in the repository. Three pin
  tenant counts or tenant lists from before the tenant registry was narrowed to
  two active tenants in August. Two name a file under a legacy dataset root that
  was deleted in July; in one of those it is the code under test, not the test,
  that hard-codes the deleted path, so the builder script that calls it cannot
  run. Which repair is right is a data-lane call: re-pin to the registry, move
  the case onto a frozen fixture, or retire the builder.
- **2 are green, with an update owed before wiring.** They pass today, but they
  pin exact counts over live tenant intake that is being rebuilt. Wired as they
  stand, they would become a gate that fails when the data improves. They are
  recorded as `update_with_reason_recorded`, not `held_unwired`: the repository
  reserves `held_unwired` for suites that a scoped quarantine list declares, and
  the first CI run of this change failed on exactly that rule.
- **1 is green but holds one text case.** Six cases test the evidence ledger's
  behaviour; the seventh asserts the text of a committed migration. Whether that
  case belongs in the unit step or in a migration validator is decided before
  the file is wired.

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

- `docs/architecture/item26-draw16-stale-suite-triage.json`: the record. 20 rows
  with measured jest counts, a verdict, an owner and a rationale for each. Red
  rows carry a machine-checkable `redCause`; held rows name the registry entry
  or the live data root that holds them.
- `src/__tests__/behaviors/item26-draw16-triage-record.test.ts`: the control,
  10 cases, each recomputing a claim from the tree:
  - whether a file reads repository text, from its bytes, and that no text-scan
    or text-subject row is offered for wiring;
  - whether a wiring row's imported subjects appear in either reachability
    registry;
  - whether a held subject is still listed by the registry the row names;
  - whether each red row's cause still holds: a pinned tenant count against the
    tenant registry's active list, a retired tenant key against its retired
    list, a deleted dataset file against the filesystem;
  - whether each live-data row still reads the root it names, and is not offered
    for wiring;
  - whether any other triage record already judged a drawn file;
  - whether the committed census resolves every drawn path to this record.
- `docs/architecture/test-ci-coverage-census.json`: regenerated with `--write`.
  Ranked directories 59 → 39, held test paths 92 → 112. Test files 2589 → 2592
  and covered files 2386 → 2389: the new control (the behaviors directory
  already runs it) plus two covered test files a preceding merge added without
  regenerating the census. Unrun files stay at 203.

## QA / Validation

**Draw executed on base `db4e03f860`.** Each file was run alone with
`npx jest --runTestsByPath <file> --no-coverage --ci --json`: 14 green, 6 red.
Subjects were resolved from each test's imports and checked against both
reachability registries; each wiring subject was also confirmed imported by a
non-test file. The branch was then rebased onto `e6645a9a30`, which touches no
drawn file, registry or census input other than adding covered tests.

**Red first.** The control was run before the census was regenerated: 1 of 10
failed (the census case). After regeneration: 10 of 10.

**First CI run red, on a real rule.** The two live-data rows were first labelled
`held_unwired`. `Unit suites that pass on main` failed in its Source workspace
quarantine step: `check-source-workspace-quarantine.test.mjs` requires every
`held_unwired` verdict to bring a scoped quarantine entry, and the triage
reconciliation then read both paths as held-but-untriaged. The rows were
re-labelled `update_with_reason_recorded`; that step now passes locally
(14 of 14 node tests, quarantine checker exit 0).

**Mutations: 10 of 10 caught**, re-run after the re-label against the green
census. Each was checked by a sha256 change before the run and a sha256 restore
after, and each fired the case it targets:

| # | mutation | case that fired |
|---|---|---|
| 1 | a `testOnly` subject's row re-labelled `wire_into_ci` | wiring reachability |
| 2 | a live-data row declared not to read the tree | bytes; live-data hold |
| 3 | a pinned tenant count set to the registry's own count | red-cause |
| 4 | published counts disagree with the rows | counts |
| 5 | a retired tenant moved back to active in the registry | red-cause |
| 6 | the deleted dataset file restored | red-cause |
| 7 | a held module dropped from `testOnly` | held-subject |
| 8 | a live-data root renamed to one that does not exist | live-data hold |
| 9 | the migration-text row offered for wiring | bytes; wiring reachability |
| 10 | the census resolves a different verdict for a drawn file | census |


**Baselines.** Behaviors on a clean detached worktree at `e6645a9a30`:
170 suites / 1794 tests / 0 failed. On this branch: 171 / 1804 / 0. Census
`--check` 0, triage reconciliation 0, `tsc --noEmit` exit 0, eslint 0,
release-check 0. The control imports no `src` module, so the behavior coverage
floor's denominator is unchanged.

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

- None of the 7 `wire_into_ci` files runs in CI yet. Wiring them is this draw's
  second half; each must be re-executed on the then-current `main` first.
- The 5 repair rows and the 2 live-data update rows wait on one data-lane
  decision.
- The migration-text case in the evidence-ledger suite is undecided.
- The five held subjects need a retire-or-mount decision from their owners.
