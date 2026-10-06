# 2026-09-30-t785-stale-suite-triage — Triage the eleventh stale-suite draw and wire the three directories it can

## Release ID

`2026-09-30-t785-stale-suite-triage`

## Status

`candidate`

## Plain-English Summary

Eleven test files in five directories existed and were run by no
continuous-integration job. They are the top five directories of the
repository's own ranking of untriaged, unrun test work on base `6ce86fc134`.
All five directories were fully unrun, so no covered sibling needed judging.

All eleven files were run individually before any verdict was written. All
eleven pass. Each file now has a written verdict in
`docs/architecture/t785-stale-suite-triage.json`.

Three of the five directories are now wired into a job that runs on every pull
request:

- Source renewal cockpit: 3 suites, 24 cases.
- Learn case-study chapters and nav: 2 suites, 10 cases.
- Agent-grounding QA scorer and prompt builder: 2 suites, 8 cases.

That is 7 suites and 42 cases, all green. None reads a repository file, and the
control forbids a wired row from reading one. Each subject is imported by
non-test code: the renewal cockpit by the Source execution room, the case-study
components by the Learn article page, and agent grounding by its QA runner
script. This change protects future work; it does not repair a break.

The other two directories stay unwired, and the new control recomputes each
hold instead of only describing it:

- **`src/components/__tests__`.** Both suites assert over the bytes of component
  source files: one checks the nav source for literal `Link` markup, the other
  checks a surface's source for `/admin/setup`. A rename, reformat or comment
  can satisfy or defeat either without any change in behaviour. There is a
  further finding: the only surface the second suite still checks is itself
  listed as unreachable, and the register it uses to explain removed surfaces
  is listed as test-only. The successor is T-786: rewrite the nav check as a
  render, and settle the setup-link check by execution, which may mean retiring
  it rather than wiring it.
- **`src/lib/artifact-excellence/__tests__`.** Both suites are green and
  behavioural, but both subjects are listed `testOnly`: nothing but these tests
  reaches them. Wiring them would count coverage over code no entry point runs.
  Retire-or-mount is an owner decision, carried by T-787.

A triage does not edit the files it judges.

## Layer Impact

**Release lane: `global-control-lane`.** This is shared CI tooling. It applies
to every client's build equally and sits behind no feature gate.

- **Layer 4 (Products):** no product behaviour changes. No route, component,
  adapter, projection or canonical object is touched, and no judged test file is
  modified.
- **Platform tooling / CI:** this change adds one job step, one triage record and
  one control suite. The coverage census and the dark-directory baseline are
  updated to match what the repository now runs.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes. CI coverage only.
- Public/demo only: no
- Feature flag: none

## Changes Included

- `.github/workflows/unit-suites.yml`: one step, `Run the T-785
  renewal-cockpit, learn case-study and agent-grounding suites`. It names the
  three directories without a trailing slash.
- `src/__tests__/behaviors/product-directory-ci-coverage.baseline.json`: the
  three wired directories are removed (121 → 118 entries).
- `docs/architecture/t785-stale-suite-triage.json`: the record. It has 11 rows,
  each executed, each with a verdict, counts, a file-read judgement and a
  rationale, and it lists the two held directories with their recomputable
  reasons and successors.
- `src/__tests__/behaviors/t785-stale-suite-wiring.test.ts`: the control, 8
  cases, adapted from T-781's. It reads every partition out of the record.
- `docs/architecture/test-ci-coverage-census.json`: regenerated with the
  repo-owned `--write`. Covered test files 2305 → 2313 and uncovered 270 → 263
  (the seven newly reached files plus the new control). Ranked directories
  119 → 114, ranked untriaged unrun files 139 → 128. After merging `main` at
  `a2f7f5e5a2` (two unrelated PRs added two test files), the census was
  regenerated rather than hand-merged: 2307 → 2315 covered, the same +8.

## QA / Validation

**Each file was run on its own** (`npx jest --runTestsByPath`): 11 green, 0 red.

**Control, red first.** With the workflow and dark baseline as on the base,
2 of 8 cases fail (reach, and the dark baseline). With the wiring, 0 of 8 fail.

**A sibling carried a lost hold, and the control was tightened.** The T-781
shape checks holds per directory: a hold kind is satisfied if any row in the
directory still has that reason. Changing the scanner title in only one of the
two scanner suites, or removing only one of the two `testOnly` entries, left
the control green (0 of 8) because the sibling still satisfied it. The check is
now per row: every still-held row must have its own recorded reason. After the
change, all five single-row mutations below fail it.

**Mutations.** Each was applied, run against the control, and restored.

| Mutation | Result |
|---|---|
| M1: the T-785 step removed | 1 of 8 fails |
| M2: the agent-grounding line removed from the step | 1 of 8 fails |
| M3: the wired directories put back on the dark baseline | 1 of 8 fails |
| M4: the held `src/components/__tests__` added to the step | 1 of 8 fails |
| M5: the held `artifact-excellence` directory added to the step | 1 of 8 fails |
| M6a: the nav scanner's case title changed (that file only) | 1 of 8 fails |
| M6b: the setup-link scanner's case title changed (that file only) | 1 of 8 fails |
| M6c: the nav scanner's `node:fs` import respelled | 1 of 8 fails |
| M7a: one `testOnly` entry removed from the orphan register | 1 of 8 fails |
| M7b: the other `testOnly` entry removed | 1 of 8 fails |
| M8: an unjudged test file added to a wired directory | 1 of 8 fails |
| M9: a wired row marked red in the record | 1 of 8 fails |
| M10: the record's case total misstated | 1 of 8 fails |

Before the per-row change, M6a and M7a were **missed** (0 of 8).

**Same-scope baseline, base `6ce86fc134` vs this branch:**

- `npm run coverage:behavior-gate`: 164 suites / 1738 tests / 0 failing on the
  base (the branch figure T-784 reported; this base is T-784's squash merge
  and was not re-measured in a separate worktree), and 165 / 1746 / 0 on the
  branch. The delta is exactly the new control
  (8 cases). Floor exit 0, lines 90.12 and functions 69.42, identical to the
  base.
- The wired step's own command: 7 suites / 42 tests / 0 failing.
- `tsc --noEmit` exited 0, judged by exit code. ESLint on the new control: 0.
- `audit:test-ci-coverage:check`: the committed census matches the tree.

## Rollout Plan

Merge to `main` through the repo-owned workflow. There is no runtime rollout: no
image, migration, flag, environment variable or traffic change. The step becomes
active on the next pull request.

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
  per-suite `PASS` lines and case total). It is recorded in the backlog after
  the run, not inferred from the YAML.

## Known Gaps

- `src/components/__tests__` (2 files, both green) stays dark until T-786.
- `src/lib/artifact-excellence/__tests__` (2 files, both green) stays dark
  until T-787's retire-or-mount decision.
- The agent-grounding subject is reached by a QA script, not by a product
  route. It is wired because tooling that runs is still code that runs; the
  record says so.
