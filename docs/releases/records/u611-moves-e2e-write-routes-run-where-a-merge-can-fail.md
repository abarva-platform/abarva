# u611 — The two remaining Moves end-to-end write routes run where a merge can fail

## Release ID

`2026-10-08-moves-e2e-write-routes-required-ci`

## Status

`candidate`

## Plain-English Summary

Two of the write routes a Move cannot finish a phase without — the one that builds
a phase's deliverables, and the one that turns a pending evidence review into an
approved one — had test suites that no merge-blocking check ran.

The suites existed and passed. The coverage census counted both directories as
covered, which was true in the only sense the census asks about: some workflow
reached them. The workflow that did is in none of the repository's required status
checks, so the practical state was that every case guarding either route could
have been deleted and a pull request would still have gone green.

This change moves both suites into a job that blocks a merge. It sweeps each
directory from the required AI surface control catalog and drops the two names
from the non-required workflow that held them, so the quotable line in a CI log
and the line that can block a merge are now the same line. Nothing stopped
running and no coverage was lost; a new behaviour suite pins the wiring so that
a later edit which quietly removes either sweep fails instead of going silent.

## Layer Impact

Lane: `global-control-lane`

- **Layer 4 (products) — test ownership only, no product behaviour.** No route,
  gate, read model, projection or rendered surface changes. The two routes
  themselves are untouched; what changes is which CI job runs their suites.
- **Repository control plane.** One required workflow gains two directory
  sweeps; one non-required workflow loses two exact-path names. The committed
  coverage census is refreshed.

## Client Applicability

State exactly who receives the change.

- All clients: no runtime change reaches any client.
- Specific clients: none.
- Internal only: yes — CI ownership and the committed coverage census.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `.github/workflows/ai-surface-control-catalog.yml` — slice 18: two new steps,
  one sweeping the phase deliverable build route's suite directory, one sweeping
  the current-state evidence approval route's suite directory. The second escapes
  its dynamic route segments, because a bare jest positional argument is a regex
  and the unescaped spelling selects nothing.
- `.github/workflows/unit-suites.yml` — removes three exact-path names that now
  sit inside a required sweep: the build route suite, which was named twice in
  two different steps, and the evidence approval route suite. Two stale comment
  blocks that described the old state are corrected.
- `src/__tests__/behaviors/moves-e2e-write-routes-required-ci-coverage.test.ts` —
  new, 12 cases. Pins both sweeps, that each resolves to a directory really on
  disk, that each is a directory sweep rather than a file list, that neither name
  returned to the non-required workflow, and that the escaping is present on the
  dynamic route and absent on the one with no dynamic segment.
- `src/__tests__/behaviors/approval-route-ci-coverage.test.ts` — the suite that
  pinned the previous eighteen-entry name list, updated for the one entry this
  change moves and generalised to one separation case per moved directory.
- `docs/architecture/test-ci-coverage-census.json` — refreshed.

## QA / Validation

- **PASS** — `npx jest src/app/api/v1/deliverables/generate-phase/__tests__ --runInBand`:
  1 suite, 35 tests green. Measured three consecutive times before wiring
  (0.13s, 0.14s, 0.18s) so the step is not being added to a red directory.
- **PASS** — `npx jest 'src/app/api/v1/programs/\[programId\]/current-state/evidence/\[evidenceId\]/approve/__tests__' --runInBand`:
  1 suite, 4 tests green. Three consecutive runs, 0.053s each.
- **PASS** — the new behaviour suite plus its three siblings
  (`named-suite-requiredness`, `phase-gate-approval-route-required-ci-coverage`,
  `deliverable-generation-suite-required-ci-coverage`): 4 suites, 29 tests green.
- **PASS, after a fix** — `src/__tests__/behaviors/approval-route-ci-coverage.test.ts`
  pinned the exact eighteen-entry name list this change shortens, so the first
  full run of the behaviour floor failed 3 of its cases (206 of 207 suites
  passed; 2138 of 2141 tests). It is the assertion that pinned the old wiring,
  not a defect in it, and it is updated the same way slice 17 updated it: the
  removed entry is dropped, the count goes 18 to 17, and its single
  phase-gate-approval separation case becomes one case per moved directory, each
  pairing the absence of the name here with the presence of the escaped sweep in
  the catalog. 4 cases green, and mutation 7 below confirms it now watches the
  new sweep too.
- **PASS** — the seven wiring-related behaviour suites together
  (`t779-stale-suite-wiring`, `t557-unrun-suite-wiring`,
  `named-suite-requiredness`, `approval-route-ci-coverage`, the new suite,
  `programs-unit-directory-ci-coverage`, `test-ci-coverage-census`): 171 tests
  green.
- **PASS** — a repo-wide grep of `src/__tests__`, `src/lib`, `scripts` and
  `docs/ci` for the two removed path strings, which is how the assertion above
  was found. The two remaining hits are a code comment and a proof script's own
  jest line, neither reached by a workflow and neither an assertion about CI
  wiring.
- **PASS** — `node scripts/quality/check-named-suite-requiredness.mjs`: 42
  directories swept by a required job at the base, **44** on this branch, and
  `OK` with no violations. The count moving is the proof the control resolves
  both new sweeps rather than merely parsing them.
- **PASS — mutation testing, 7 applied, 7 killed.** (1) drop the build sweep — 2
  cases fail; (2) drop the evidence sweep — 3 fail; (3) unescape the evidence
  brackets — 2 fail; (4) convert the build sweep to `--runTestsByPath` — 2 fail;
  (5) restore the build suite's name in the non-required workflow — 1 fails;
  (6) point the build sweep at a renamed directory — 2 fail; (7) drop the
  evidence sweep again, against the UPDATED `approval-route-ci-coverage` suite —
  1 of its 4 fails, which is what proves that suite now watches the new sweep
  rather than only slice 17's. Baselines restored green afterwards (12 of 12 and
  4 of 4). Each mutator asserted exactly one occurrence of its pattern before
  writing.
- **PASS** — the escaping is load-bearing, measured rather than asserted: the
  unescaped spelling of the evidence directory makes jest print
  `No tests found, exiting with code 1`.
- **PASS** — mutation (5) also confirms the requiredness control now reads the
  new build sweep: restoring that name in the non-required job turns the control
  from `OK` into `FAIL: 1 named suite(s) in a non-required job`.
- **PASS** — coverage census is byte-identical at base and on this branch for
  the two workflow files alone (2864 test files / 2700 covered / 164 uncovered /
  441 fully covered, 27 partial, 43 uncovered directories, both readings). So
  the three removals from the non-required workflow lose no census coverage.
  With the new behaviour suite the committed census moves `+2`; see Known Gaps
  for why one of those two is inherited.
- **PASS** — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`, exit 0.
- **PASS** — `npx eslint` on the new suite, exit 0.
- **PASS** — `npx prettier --check` on all three edited files, run in the tree
  itself rather than on a copy, so the config resolves from the files' own
  directory.
- **PASS** — `npm run audit:tenancy-fence-coverage:check`, exit 0, shape matches.
- **PASS, re-validated after merging main forward.** Main advanced three commits
  mid-run and one of them appended its own sweep to the end of the same catalog
  file, so the two appends conflicted. Resolved by keeping BOTH, the earlier
  sweep first, and by correcting slice 18's own prose, which named only slice 17
  as its precedent when a second sweep had landed between them. Re-measured on
  the merged tree: catalog YAML parses (83 steps); requiredness **45**
  directories, `OK`; the five wiring suites 31 tests green; all four swept route
  directories 5 suites / 109 tests green; `tsc` exit 0; `prettier --check`
  clean; fence census shape matches; `release:check` 11 of 11 against the new
  base.
- **NOT RUN** — no live signed-in walk. This change alters no product surface,
  so there is nothing on screen for a walk to read.

## Rollout Plan

Merge to main. No runtime rollout: no image build, no deploy, no migration, no
flag change. The two new steps take effect on the next pull request the required
catalog workflow runs.

## Deployment Authority

- Repo-owned deploy workflow: not involved; this change deploys nothing.
- Shared runtime mutators: none.
- Approved image digest: not applicable — no runtime image changes.
- ACA runtime invariant: unaffected; no Container App template, traffic or
  revision is touched.
- Worker image invariant: unaffected.
- Feature/env flag update path: not applicable; no flag or environment variable
  changes.
- Live signed-in proof required: no. No product surface changes.

## Rollback Plan

Revert the single squash commit. The two catalog steps disappear, the three
names return to the non-required workflow, the behaviour suite is removed and the
census returns to its prior committed values. No migration, no data and no
runtime state is involved, so the revert is complete on merge.

## Audit Evidence

- The pull request and its CI run, including the required **AI surface control
  catalog** job's log, where `PASS` for both route suites is now readable out of
  a job that can block a merge.
- The `Named-suite requiredness` line in that run: `44 directories swept by a
  required job` against `42` at the base commit.
- The committed `docs/architecture/test-ci-coverage-census.json` diff.

## Known Gaps

- **After the forward merge the committed census reads 2867 / 2703, which is
  `+2` over BOTH parents' committed 2865.** Attributed exactly: main's three new
  commits add two test files
  (`deliverable-structure-exhibit-kinds.test.ts`, `move-unreadable-refusal.test.ts`)
  and main's own committed census had not been updated for them. The two
  parents' identical 2865 is a coincidence of the collision described below, not
  agreement.
- **One of the census's two added files is inherited from the base, not produced
  here.** Measured directly: with only the two edited workflow files reverted and
  the new behaviour suite still absent, the census already read `+1` against its
  own committed values (2864 vs 2863 test files, 2700 vs 2699 covered). This is
  the fourth change in a row to inherit that drift, and the mechanism is a
  process one rather than a defect in any single change: two squashes merging
  close together each write `+1` from the same base and the later merge
  overwrites the earlier count. An honest single-file regeneration therefore
  reads `+2`. Worth a process look; it is not caused by, or fixable in, this
  change.
- **The coverage census still cannot see the difference this change makes.**
  Every census number is identical before and after, because the census asks
  whether some workflow reaches a directory and never whether a required one
  does. The two gap lists it publishes are therefore not a ranking of
  merge-darkness, and should not be read as one.
- **The census also cannot read an escaped dynamic-route sweep.** It credits the
  evidence approval directory to the non-required workflow's broad
  `src/app/api/v1/programs` argument, not to the new required step. The
  requiredness control does resolve the escapes, which is why that control and
  not the census is cited above as proof.
- **The wider pattern is not closed by this change.** A sweep of every Moves API
  route test directory found that only a handful are reached by any required job;
  these two were selected because they are the write routes on the end-to-end
  phase path. The remaining directories are a ranked backlog, not a claim of
  coverage.
- No live signed-in proof. Nothing in this change is `live-proven`, and nothing
  in it needs to be.
