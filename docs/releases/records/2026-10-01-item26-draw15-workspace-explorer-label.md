# 2026-10-01-item26-draw15-workspace-explorer-label — Apply the item 26 draw 15 WorkspaceExplorer label update and wire the suite

## Release ID

`2026-10-01-item26-draw15-workspace-explorer-label`

## Status

`candidate`

## Plain-English Summary

The fifteenth stale-suite triage draw under P3 item 26
(`docs/architecture/item26-draw15-stale-suite-triage.json`, #8767) judged twenty
test files that no continuous-integration job ran. One row,
`src/components/workspace-explorer/__tests__/WorkspaceExplorer.test.tsx`, was
red 1 of 6 with verdict `update_with_reason_recorded`. The red case looked for
a strategy-step evidence requirement by the label the canonical evidence spec
carried before that requirement was relabelled. The component renders the
canonical label correctly. The test's literal copy was stale.

This change applies that update and wires the suite:

- The stale expectation now reads the `EVID-SRC-STR-INCUMBENT` label from
  `evidenceForStage("strategy")` in
  `src/lib/source/canonical-specs/evidence-requirements.ts`. That is the same
  function `WorkspaceExplorer` renders from. The case still asserts the same
  thing: the selected step surfaces its canonical requirements. A future
  relabel can no longer strand the test the same way. Re-executed on base
  `9fc88b46a9`: 6 of 6 green.
- The directory holds only that one file, so it is named whole in the existing
  `Run the item 26 draw 15 config, data and lib suites` step. It also leaves
  the dark-directory baseline.

The other held draw 15 rows are untouched: the toolUseLoop byte scan
(`rewrite_as_behavior`) and six rows held under T-775.

No product file is edited.

## Layer Impact

**Release lane: `global-control-lane`.** This changes shared CI tooling and
one test file. It applies equally to every client's build and sits behind no
feature gate.

- **Layer 4 (Products):** no product behaviour changes. No route, component,
  adapter, projection or canonical object is touched.
- **Platform tooling / CI:** one directory is added to an existing job step.
  The coverage census, the dark-directory baseline, the draw 15 triage record
  and its control are updated to match what the repository now runs.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes. This affects CI coverage only.
- Public/demo only: no
- Feature flag: none

## Changes Included

- `src/components/workspace-explorer/__tests__/WorkspaceExplorer.test.tsx`:
  the stale label literal is replaced by the canonical spec's label, with the
  reason in a comment.
- `.github/workflows/unit-suites.yml`:
  `src/components/workspace-explorer/__tests__` is added to `Run the item 26
  draw 15 config, data and lib suites`, and the step comment is updated.
- `src/__tests__/behaviors/product-directory-ci-coverage.baseline.json`: that
  directory is removed.
- `docs/architecture/test-ci-coverage-census.json`: regenerated with the
  repo-owned `--write`. Uncovered test files went from 205 to 204, and
  untriaged unrun files from 153 to 152.
- `docs/architecture/item26-draw15-stale-suite-triage.json`: the row keeps its
  original verdict and red counts as the snapshot at its base. It gains an
  `updated` block (re-execution base, 6/6, what changed) and
  `wiredInThisItem: true`. `secondHalf.stillHeld` drops it.
- `src/__tests__/behaviors/item26-draw15-triage-record.test.ts`: a draw 15
  step must now run a row when it is `wire_into_ci` **or** an applied update.
  An applied stale-label row must meet five conditions:
  - the old literal is gone from the test;
  - the test does not re-type the current literal;
  - the source still carries the current literal;
  - the test imports that source module;
  - the re-execution is green.

  A stale-label row that is not marked applied still holds only while its
  defect exists.

## QA / Validation

**Re-verified on main first.** `WorkspaceExplorer.test.tsx` on `origin/main`
`9fc88b46a9`: 1 failed, 5 passed, 6 total. The failure was the label lookup.

**Red first.** With the test edit alone and the control amended, the draw 15
control failed 1 of 10: its red-row case reported that the hold's defect was
gone. After the record, workflow, baseline and census were updated, it passed
10 of 10.

**Mutations.** Each mutation was applied alone, checked with
`git diff --numstat`, run, and restored with a sha256 check.

| Mutation | Result |
|---|---|
| Product: `WorkspaceExplorer.tsx` renders `requirement?.requirementId` instead of `requirement?.label` | WorkspaceExplorer suite 1/6 fails |
| M1: the directory removed from the draw 15 step | control 1/10 fails |
| M2: the test re-types the current label instead of reading the spec | control 1/10 fails |
| M3: the record's re-execution set to 5/6 (the `updated` block only) | control 1/10 fails |
| M4: `updatedInThisItem` set to false | control 3/10 fails |
| M5: the test's import of the spec deleted | control 1/10 fails |

All 6 were caught. M3 was first run as an unscoped substitution that also
changed another row, which gave 2/10. That result was discarded, and M3 was
re-run scoped to the `updated` block.

**Same-scope baseline, `src/__tests__/behaviors`:** 170 suites, 1793 tests,
0 failing on base `9fc88b46a9`, measured in a clean detached worktree. The
branch gives the same 170 / 1793 / 0. No case was added; one was amended.

**Other gates:**

- census `--check`: exit 0
- triage-record census reconciliation: exit 0
- `tsc --noEmit` (6 GB heap): exit 0
- eslint on both changed tests: exit 0

The control imports no `src` module, so it does not move the behaviour
coverage floor.

## Rollout Plan

Merge to `main` through the repo-owned workflow. There is no runtime rollout:
no image, migration, flag, environment variable or traffic change. The suite
runs from the next pull request.

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

Revert the pull request. That restores the test, the step, the baseline, the
census, the record and the control together. They are consistent only as a
set. There is nothing to unwind in a running environment.

## Audit Evidence

- The local run counts and the mutation table above.
- Runner proof from the pull request's unit-suites job log: the `PASS` line
  for `WorkspaceExplorer.test.tsx` in the draw 15 step. This is recorded in
  the backlog after the run, not inferred from the YAML.

## Known Gaps

- Draw 15 still holds the toolUseLoop behavioural rewrite (item 26) and six
  rows under T-775.
