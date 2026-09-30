# 2026-09-30-t781-stale-suite-triage — Triage the tenth stale-suite draw and wire the two directories it can

## Release ID

`2026-09-30-t781-stale-suite-triage`

## Status

`candidate`

## Plain-English Summary

Fifteen test files in five directories existed and were run by no
continuous-integration job. They are the top five directories of the
repository's own ranking of untriaged, unrun test work. One more file, already
run elsewhere, sits in one of those directories and was judged too, because the
new wiring line selects it.

All sixteen files were run individually before any verdict was written. Fifteen
pass and one fails. Each file now has a written verdict in
`docs/architecture/t781-stale-suite-triage.json`.

Two of the five directories are now wired into a job that runs on every pull
request:

- Atlas composition: 3 suites, 19 cases.
- Answer-quality evaluation: 4 suites, 9 cases.

That is 7 suites and 28 cases, all green. Both subjects are imported by non-test
code. Atlas composition is imported by the agent retrieval module; the answer
scorer is imported by the answer-eval harness and by the answer-quality CI gate.
Three of the answer-quality suites read JSONL fixture files of known-good and
known-bad answers. That is test data, not source text. The control only allows
such reads when they are declared, exist, and are `.jsonl` files under the
subject's `fixtures/` directory. This change protects future work; it does not
repair a break.

The other three directories stay unwired. The new control recomputes each hold
instead of only describing it:

- **Atlas initiative-deep.** One case reads nine source files and asserts that
  no quoted tenant key appears in their bytes. A comment, or a string split
  across a concatenation, can satisfy or defeat that without any change in
  behaviour. The other five cases in that file are real tenant-fence checks. The
  successor is T-782: rewrite the byte case as a behavioural probe, then wire the
  directory.
- **Sentinel.** Two reasons:
  - One case is red. It expects the industry normaliser to map two tenant
    industry codes to broad canonical families, but the code maps them to
    narrower sub-families. The exact values are in the record's `redProbe`. All
    four are canonical industries, and the test and the code arrived in the same
    squash commit. Which family those codes belong to is a taxonomy call, so
    neither side was edited. That call is T-783.
  - A sibling suite tests a module that no product or tooling entry point
    reaches.
- **Shell.** One suite tests a module that no entry point reaches. Retiring or
  mounting both such modules is T-784.

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

- `.github/workflows/unit-suites.yml`: one step, `Run the T-781 atlas
  composition and answer-quality suites`. It names
  `src/lib/atlas/composition/__tests__` and
  `src/lib/eval/answer-quality/__tests__` as directories, without a trailing
  slash.
- `src/__tests__/behaviors/product-directory-ci-coverage.baseline.json`: the
  atlas composition line is removed. The answer-quality directory was already
  partially covered, so it was never in that baseline.
- `docs/architecture/t781-stale-suite-triage.json`: the record. It has 16 rows,
  each executed, and each with a verdict, counts, a file-read judgement and a
  rationale. It also lists the three held directories, with their recomputable
  reasons and successors.
- `src/__tests__/behaviors/t781-stale-suite-wiring.test.ts`: the control. It has
  9 cases and reads every partition out of the record.
- `docs/architecture/test-ci-coverage-census.json`: regenerated. On the base it
  showed 2289 covered and 281 uncovered test files. On the branch it shows 2296
  covered and 275 uncovered: the six newly reached files plus the new control.
  Ranked directories went 124 → 119, and ranked untriaged unrun files went
  154 → 139.

## QA / Validation

**Each file was run on its own** (`npx jest --runTestsByPath`): 15 green and 1
red (`sentinel/__tests__/canonical-grounding.test.ts`, 1 of 5 failing).

**Reachability.** Reachability was classified with the repository's own
module-referrer walk (`scripts/audit/lib/module-referrers.mjs`):

- Atlas composition, initiative-deep, the sentinel orchestrator and grounding
  modules, and two of the three shell modules are reached by product code.
- The answer scorer is reached by tooling.
- The two held modules are reached by a test only.

The control asserts that each wired subject keeps a non-test importer.

**Control, red first.** Before the wiring existed, 2 of 9 cases failed: reach,
and the dark baseline. After the wiring, 0 of 9 fail.

**Same-scope baseline, base `5b976bdbbf` in a clean worktree vs this branch:**

- `npx jest src/__tests__/behaviors`: 161 suites / 1715 tests / 0 failing
  before, and 162 / 1724 / 0 after. The delta is exactly the new control (9
  cases).
- The wired step's own command: 7 suites / 28 tests / 0 failing.
- `npm run coverage:behavior-gate`: the first draft of the control imported the
  sentinel grounding module to recompute the red hold, and that measured
  **89.92 lines against the floor of 90**. The floor was not changed. Instead,
  the control now calls the same exported function in a `tsx` child process,
  which coverage does not instrument. The final result is recorded in the pull
  request.

**Mutations.** Each was applied, run against the control, and restored.

| Mutation | Result |
|---|---|
| M1: the byte-scan suite marked wired | 5 of 9 fail |
| M2: a declared fixture read pointed at a `.ts` source | 1 of 9 fails |
| M3: a fixture-reading row's declared reads deleted | 1 of 9 fails |
| M4: the red row's expected value set to what the code returns | 1 of 9 fails |
| M5: a test-only subject replaced by a reached module | 1 of 9 fails |
| M6: the scanner case title changed | 1 of 9 fails |
| M7: the answer-quality line removed from the step | 1 of 9 fails |
| M8: atlas composition put back on the dark baseline | 1 of 9 fails |
| M9: an unjudged test file added to a wired directory | 1 of 9 fails |
| M10: the red row re-marked green in the record | 1 of 9 fails |
| M11: the product normaliser changed for the probed code | 1 of 9 fails |

M11 matters most: the red hold is answered by the live function, not by the
record.

`tsc --noEmit` exited 0, judged by exit code.

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

Revert the pull request. That removes the step and restores the baseline line
and the previous census together. They are consistent only as a set. There is
nothing to unwind in a running environment.

## Audit Evidence

- The triage record, with per-file run counts.
- The control suite and the mutation table above.
- Runner proof from the pull request's unit-suites job log (the step's
  per-suite `PASS` lines and case total). It is recorded in the backlog after
  the run, not inferred from the YAML.

## Known Gaps

- `src/lib/atlas/initiative-deep/__tests__` (3 files, all green) stays dark
  until T-782 rewrites its byte case.
- `src/lib/sentinel/__tests__` stays dark until two things happen: T-783 makes
  the taxonomy call, and T-784 decides the test-only module.
- `src/lib/shell/__tests__` stays dark until T-784. Its two reachable files may
  be wired by named file before then.
