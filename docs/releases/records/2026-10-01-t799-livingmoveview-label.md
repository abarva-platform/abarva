# 2026-10-01-t799-livingmoveview-label — Apply the T-799 LivingMoveView label update and wire the suite

## Release ID

`2026-10-01-t799-livingmoveview-label`

## Status

`candidate`

## Plain-English Summary

Item T-799 triaged twenty test files that no continuous-integration job ran
(`docs/architecture/t799-stale-suite-triage.json`, #8757). One row,
`src/components/moves/living/__tests__/LivingMoveView.test.tsx`, was red 2 of
8 with verdict `update_with_reason_recorded`: both red cases looked for a
case-switcher tab under the label the case registry carried before #4997
relabelled it. The component, the registry and the other six cases were
correct. The label change was a deliberate data change, not a regression.

This change applies that update and wires the suite:

- The two stale expectations now read the label from
  `LIVING_MOVE_CASES.arcturus.tenantLabel` in
  `src/lib/programs/expert-kernel/living-move-cases.ts` instead of re-typing
  it. What the cases assert is unchanged in meaning: the switcher renders the
  registry's label and clicking it opens that case. A future relabel can no
  longer strand the test the same way. Re-executed on base `db5e4afd32`:
  8 of 8 green.
- The directory holds only that one file, so it is named whole in the existing
  T-799 directory step of `unit-suites`, and leaves the dark-directory baseline.

The two other held T-799 rows are untouched: the Tower route-scope byte scan
(`rewrite_as_behavior`) and ProofPointFooter (held for T-775).

No product file is edited.

## Layer Impact

**Release lane: `global-control-lane`.** Shared CI tooling and one test file.
It applies to every client's build equally and sits behind no feature gate.

- **Layer 4 (Products):** no product behaviour changes. No route, component,
  adapter, projection or canonical object is touched.
- **Platform tooling / CI:** one directory is added to an existing job step.
  The coverage census, the dark-directory baseline, the T-799 triage record and
  its control are updated to match what the repository now runs.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes. CI coverage only.
- Public/demo only: no
- Feature flag: none

## Changes Included

- `src/components/moves/living/__tests__/LivingMoveView.test.tsx`: the two
  stale label literals replaced by the registry's `tenantLabel`, with the
  reason in a comment.
- `.github/workflows/unit-suites.yml`: `src/components/moves/living/__tests__`
  added to `Run the T-799 route handler, setup, programs and strategic-moves
  suites`; the step comment updated.
- `src/__tests__/behaviors/product-directory-ci-coverage.baseline.json`: that
  directory removed (91 → 90 entries).
- `docs/architecture/test-ci-coverage-census.json`: regenerated with the
  repo-owned `--write`. Uncovered directories 93 → 92; untriaged unrun files
  167 → 166.
- `docs/architecture/t799-stale-suite-triage.json`: the row keeps its original
  verdict and red counts as the snapshot at its base, and gains an `updated`
  block (re-execution base, 8/8, what changed) plus `wiredInThisItem: true`.
  `secondHalf.stillHeld` drops it.
- `src/__tests__/behaviors/t799-stale-suite-triage-record.test.ts`: a row is
  now required to be run by a T-799 step when it is `wire_into_ci` or an
  applied update. An applied stale-label row must show the old literal gone
  from the test, the current label still in the registry, the test importing
  the registry, and a green re-execution. A stale-label row not marked applied
  still holds only while its defect exists.

## QA / Validation

**Re-verified on main first.** `LivingMoveView.test.tsx` on `origin/main`
`db5e4afd32`: 2 failed, 6 passed, 8 total, both on the old label.

**Red first.** With the test edit alone and the control amended, the T-799
control failed 1 of 10: its red-row case reported that the hold's defect was
gone. After the record, workflow, baseline and census were updated, it passed
10 of 10.

**Mutations.** Each was applied, checked with `git diff --numstat`, run and
restored.

| Mutation | Result |
|---|---|
| Product: `LivingMoveView.tsx` renders `entry.id` instead of `entry.tenantLabel` | LivingMoveView suite 2/8 fails |
| M1: the directory removed from the T-799 step | T-799 control 1/10 fails |
| M2: the test re-types the label instead of importing the registry | T-799 control 1/10 fails |
| M3: the record's re-execution set to 6/8 | T-799 control 1/10 fails |
| M4: `updatedInThisItem` set to false | T-799 control 3/10 fails |

5 of 5 caught.

**Same-scope baseline, `src/__tests__/behaviors`:** 169 suites / 1783 tests /
0 failing on base `db5e4afd32` (as recorded by the merge of #8760), and
169 / 1783 / 0 on the branch. No case was added; one was amended.

**Other gates:** census `--check` exit 0; `tsc --noEmit` exit 0; eslint on
both changed tests exit 0. The control imports no `src` module, so the
behaviour coverage floor is not moved by it.

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
census, the record and the control together; they are consistent only as a
set. There is nothing to unwind in a running environment.

## Audit Evidence

- Local run counts and the mutation table above.
- Runner proof from the pull request's unit-suites job log (the `PASS` line
  for `LivingMoveView.test.tsx` in the T-799 directory step), recorded in the
  backlog after the run rather than inferred from the YAML.

## Known Gaps

- T-799 still holds two rows: the Tower route-scope behavioural rewrite and
  ProofPointFooter under T-775.
