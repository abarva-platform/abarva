# 2026-09-30-t788-stale-suite-triage — Triage the twelfth stale-suite draw and wire the six suites it can

## Release ID

`2026-09-30-t788-stale-suite-triage`

## Status

`candidate`

## Plain-English Summary

Ten test files in five directories existed and were run by no
continuous-integration job. They are the top five directories of the
repository's own ranking of untriaged, unrun test work on base `f92952c32a` (re-executed on `c334308aed` after rebasing, same results).
Four directories were fully unrun; the fifth, `src/lib/atlas`, has a third
direct test file that already runs by name, so it is pinned rather than drawn.

All ten files were run individually before any verdict was written. Eight
pass; two fail one case each. Each file now has a written verdict in
`docs/architecture/t788-stale-suite-triage.json`.

Six suites are now wired into a job that runs on every pull request:

- Artifact storytelling contract and artifact repository
  (`src/lib/artifacts/__tests__`, whole directory): 2 suites, 9 cases.
- Answer HTML and PDF export (`src/lib/ava-answer/export/__tests__`, whole
  directory): 2 suites, 11 cases.
- Atlas intent classifier and value grounding (`src/lib/atlas/classifier.test.ts`
  and `value-grounding.test.ts`, by named file): 2 suites, 7 cases.

That is 6 suites and 27 cases, all green. None reads a repository file, and
the control forbids a wired row from reading one. Each row's own subject is
reached by non-test code: the storytelling contract by the Source story pack,
the repository by the strategic-move phase page and artifact API routes, the
export renderers by the answer export route, and the two Atlas modules by the
Atlas orchestrator, which the Atlas chat and ask routes import. This change
protects future work; it does not repair a break.

The Atlas files are wired by name, not as a directory: the directory holds a
sibling that already runs by name and a `__tests__` subdirectory that naming
the directory would also select. Named-file wiring leaves the directory
partial, which the dark-directory ratchet cannot see, so the control pins the
directory's direct test files to the three it knows about.

Two directories stay unwired, and the control recomputes each hold rather than
only describing it:

- **`src/lib/instruments/__tests__`.** One suite reads an applied migration's
  SQL and asserts literals over its bytes. The directory is held whole, as
  earlier draws held a directory with one byte-scan in it. Its other suite is
  green and clean; wiring it by name, and deciding the byte-scan's fate, is
  T-789.
- **`src/lib/lakeshore/__tests__`.** Both suites are red on base, one case
  each. One case pins a persona count that the persona register has since
  grown past, deliberately — the test is stale. The other dry-runs a frozen
  synthetic CSV fixture through the CSV connector, whose template contract
  gained required fields after the fixture was generated. Neither is a wiring
  side effect; T-790 carries both. The control asks the live code each red
  row's question out of process and goes red when the answer changes.

A triage does not edit the files it judges.

## Layer Impact

**Release lane: `global-control-lane`.** This is shared CI tooling. It applies
to every client's build equally and sits behind no feature gate.

- **Layer 4 (Products):** no product behaviour changes. No route, component,
  adapter, projection or canonical object is touched, and no judged test file
  is modified.
- **Platform tooling / CI:** this change adds one job step, one triage record
  and one control suite. The coverage census and the dark-directory baseline
  are updated to match what the repository now runs.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes. CI coverage only.
- Public/demo only: no
- Feature flag: none

## Changes Included

- `.github/workflows/unit-suites.yml`: one step, `Run the T-788 artifacts,
  answer-export and Atlas suites`. It names the two `__tests__` directories
  without a trailing slash and the two Atlas files by path.
- `src/__tests__/behaviors/product-directory-ci-coverage.baseline.json`: the
  two wired directories are removed (117 → 115
  entries). `src/lib/atlas` was never on it.
- `docs/architecture/t788-stale-suite-triage.json`: the record. Ten rows, each
  executed, each with a verdict, counts, a file-read judgement, its subject
  and a rationale; the atlas pin; the two held directories with their
  recomputable reasons and successors.
- `src/__tests__/behaviors/t788-stale-suite-wiring.test.ts`: the control,
  9 cases, adapted from T-785's.
- `docs/architecture/test-ci-coverage-census.json`: regenerated with the
  repo-owned `--write`. Covered test files 2317 → 2324 (the six newly reached files plus the new control) and uncovered 262 → 256; the only uncovered directories that leave are the two wired ones, none joins. Ranked directories 114 → 109 and ranked untriaged unrun files 128 → 118, because the two held directories now carry verdicts.

## QA / Validation

**Each file was run on its own** (`npx jest --runTestsByPath`): 8 green, 2 red.

**Control, red first.** With the workflow and dark baseline as on the base,
2 of 9 cases fail (reach, and the dark baseline). With the wiring, 0 of 9.

**The importer check had to be transitive.** First written as "a non-test
file outside the subject's directory imports the subject", it rejected both
Atlas rows: `classifier.ts` and `value-grounding.ts` are imported only by
`orchestrator.ts` beside them, and the routes import the orchestrator. The
check now walks importers inside the directory until it reaches one outside
it, and fails when none does.

**Mutations.** Each was applied, run against the control, and restored.

| Mutation | Result |
|---|---|
| M1: the artifacts directory removed from the step | 1 of 9 fails |
| M2: the classifier file removed from the named-file step | 1 of 9 fails |
| M3: a wired directory put back on the dark baseline | 1 of 9 fails |
| M4: the held instruments directory added to the step | 1 of 9 fails |
| M5: the held second directory added to the step | 1 of 9 fails |
| M6: the migration scanner's case title changed | 1 of 9 fails |
| M7: the migration scanner's `node:fs` import respelled | 1 of 9 fails |
| M8: product code changed so the persona count equals the test's expectation | 1 of 9 fails |
| M9: product code changed so the template no longer requires one of the missing fields | 1 of 9 fails |
| M10: an unjudged test file added to a wired directory | 2 of 9 fail |
| M11: an unjudged test file added beside the Atlas files | 1 of 9 fails |
| M12: a wired row marked red in the record | 2 of 9 fail |
| M13: the record's case total misstated | 1 of 9 fails |
| M14: the held clean suite's `heldWithSibling` removed | 1 of 9 fails |
| M15: the already-covered Atlas sibling removed from its step | 1 of 9 fails |
| M16: the control's transitive importer walk blinded | 1 of 9 fails |

16 of 16 caught. M8 and M9 change product code and prove the red holds are
asked of the live code, not read from the record.

**Same-scope baseline:**

- `npm run coverage:behavior-gate`: 166 suites / 1755 tests / 0 failing on the
  base (the figure T-786 reported for its merge, which is this base's parent
  chain; not re-measured in a separate worktree), 167 / 1764 / 0 on the
  branch. The delta is exactly the new control (9 cases). Floor exit 0, lines
  90.12 and functions 69.42, identical to the base.
- The wired steps' own commands: 4 suites / 20 tests and 2 suites / 7 tests,
  0 failing.
- `tsc --noEmit` exited 0, judged by exit code. ESLint on the new control: 0.
- `audit:test-ci-coverage:check`: the committed census matches the tree.

## Rollout Plan

Merge to `main` through the repo-owned workflow. There is no runtime rollout:
no image, migration, flag, environment variable or traffic change. The step
becomes active on the next pull request.

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

Revert the pull request. That removes the step and restores the baseline lines
and the previous census together. They are consistent only as a set. There is
nothing to unwind in a running environment.

## Audit Evidence

- The triage record, with per-file run counts.
- The control suite and the mutation table above.
- Runner proof from the pull request's unit-suites job log (the step's
  per-suite `PASS` lines and case total), recorded in the backlog after the
  run rather than inferred from the YAML.

## Known Gaps

- `src/lib/instruments/__tests__` (2 files, both green) stays dark until T-789.
- `src/lib/lakeshore/__tests__` (2 files, both red) stays dark until T-790.
  Its load-rehearsal half is data-plane work.
- The control's red probes run the two subjects out of process under the
  `react-server` resolution condition, because one of them imports
  `server-only`. If that probe stops resolving, the control fails loudly
  rather than passing.
