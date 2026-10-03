# 2026-09-30-t795-wire-triaged-suites — Wire the thirteenth stale-suite draw's nineteen green files

## Release ID

`2026-09-30-t795-wire-triaged-suites`

## Status

`candidate`

## Plain-English Summary

Item T-795 triaged nineteen test files that no continuous-integration job ran.
Its verdicts were recorded read-only. Three red files were repaired in #8729,
and one case that byte-scanned a historical migration was replaced with a
runtime assertion in #8732. The item's remaining open half was the wiring. This
change does that wiring.

All nineteen files were re-executed on base `0f662a090c` before wiring:
19 suites and 168 cases, all green. They now run on every pull request in two
new steps of the `unit-suites` job:

- **Named by directory (7 directories, 14 suites, 148 cases):**
  `src/lib/patternops`, `src/lib/programs/source-trigger/__tests__`,
  `src/lib/setup/__tests__`, `src/lib/source/decision-queue/__tests__`,
  `src/lib/source/disclosure-flag/__tests__`,
  `src/lib/source/execution-room/__tests__` and
  `src/lib/source/pricing-submissions/__tests__`. Every test file in each of
  these directories is in the draw, so naming the whole directory means a
  future test file added there also runs.
- **Named by file (5 suites, 20 cases):** two in
  `src/lib/observability/__tests__`, two in
  `src/lib/source/new-workspace/__tests__` and
  `src/__tests__/features/neo4j-gate.test.ts`. The two `__tests__`
  directories each hold files that were already running elsewhere, so they are
  named by file and not run twice.

This change protects future work. It does not repair a break, and no test file
or product file is edited.

## Layer Impact

**Release lane: `global-control-lane`.** This is shared CI tooling. It applies
to every client's build equally and sits behind no feature gate.

- **Layer 4 (Products):** no product behaviour changes. No route, component,
  adapter, projection or canonical object is touched.
- **Platform tooling / CI:** two job steps are added. The coverage census and
  two dark-directory baselines are updated to match what the repository now
  runs.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes. CI coverage only.
- Public/demo only: no
- Feature flag: none

## Changes Included

- `.github/workflows/unit-suites.yml`: two steps, `Run the T-795 Source,
  programs, setup and patternops suites` (seven directories) and `Run the
  T-795 observability, new-workspace and graph-gate suites by named file`
  (five files).
- `src/__tests__/behaviors/product-directory-ci-coverage.baseline.json`: the
  seven wired directories are removed (115 → 108 entries).
- `src/__tests__/behaviors/programs-unit-directory-ci-coverage.baseline.json`:
  `src/lib/programs/source-trigger/__tests__` is removed (3 → 2 entries). It
  left the dark set because it was wired, not because it became partial.
- `docs/architecture/test-ci-coverage-census.json`: regenerated with the
  repo-owned `--write`. The unrun test files drop from 256 to 237 across
  148 → 138 directories. `--explain` shows exactly the nineteen files leaving
  that set, and none entering it.

## QA / Validation

**Re-execution on base.** All 19 files together (`--runTestsByPath`) gave
19/19 suites and 168/168 cases. The two step commands were then run exactly as
written: 14 suites / 148 cases and 5 suites / 20 cases, with 0 failing.

**Red first.** With the workflow change alone, `product-directory-ci-coverage`
failed 1 of 4 cases (seven directories left the dark set) and the census check
reported drift. The full behaviors run then also failed
`programs-unit-directory-ci-coverage` 2 of 17 cases, which names the same
Programs directory. After both baselines and the census were updated, both
ratchets passed and the census check exited 0.

**Mutations.** Each was applied, run and restored.

| Mutation | Result |
|---|---|
| M1: a planted failing case in a directory-step file | step exits non-zero |
| M2: a planted failing case in a named-file-step file | step exits non-zero |
| M3: one wired directory removed from the step | dark-directory ratchet 1 of 4 fails; census check exits 1 |
| M4: the graph-gate file removed from the named-file step | census check exits 1 |
| M5: one observability file removed (directory stays partial) | census check exits 1 |
| M6: one new-workspace file removed (directory stays partial) | census check exits 1 |

6 of 6 caught.

**Same-scope baseline, `src/__tests__/behaviors`:** 167 suites / 1764 tests /
0 failing on base `0f662a090c` (measured in a separate clean worktree), and
167 / 1764 / 0 on the branch. No TypeScript file is changed.

## Rollout Plan

Merge to `main` through the repo-owned workflow. There is no runtime rollout:
no image, migration, flag, environment variable or traffic change. The steps
become active on the next pull request.

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

Revert the pull request. That removes the two steps and restores both baselines
and the previous census together. They are consistent only as a set. There is
nothing to unwind in a running environment.

## Audit Evidence

- Local run counts and the mutation table above.
- Runner proof from the pull request's unit-suites job log (the per-suite
  `PASS` lines and the case totals for both steps), recorded in the backlog
  after the run rather than inferred from the YAML.

## Known Gaps

- T-795's verdicts live in the operator backlog, not in a repository triage
  record. The census therefore credits these files as covered, not as
  verdicted.
- The named-file step covers three partial directories. The dark-directory
  ratchets cannot see a partial directory, so dropping one of those files is
  caught by the census check alone (M4 to M6).
