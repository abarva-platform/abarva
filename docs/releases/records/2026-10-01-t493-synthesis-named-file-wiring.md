# 2026-10-01-t493-synthesis-named-file-wiring — Run the four green T-493 synthesis suites by named file

## Release ID

`2026-10-01-t493-synthesis-named-file-wiring`

## Status

`candidate`

## Plain-English Summary

Stale-suite triage draw T-493 (P3 item 26) held
`src/lib/intelligence/synthesis/__tests__` dark as a whole directory. The
hold had two reasons. One expired on 2026-09-27, when T-497 repaired
`violationsSupabaseBackend.test.ts` (#8574). The other still stands:
`violationsMigration.test.ts` is a source-text scanner over a committed SQL
migration. T-550's rule refuses to wire that kind of test whether it passes or
not, and its lane is T-495's decision.

That left four green suites, 40 cases, running nowhere only because they share
a directory with the scanner. Every subject they test is imported by product
code:

| Suite | Cases | Product importers of its subject |
|---|---|---|
| `healthcareAnswerContract.test.ts` | 9 | `src/lib/intelligence/ask/synthesizer.ts` |
| `outputValidator.test.ts` | 19 | `src/app/api/chat/agent/route.ts`, `src/lib/programs/ava-chat/quality-gate.ts` |
| `violationsRecorder.test.ts` | 8 | `src/app/api/chat/agent/route.ts`, `src/lib/pilot-dashboard/aggregates.ts` |
| `violationsSupabaseBackend.test.ts` | 4 | `src/app/api/chat/agent/route.ts`, `src/lib/pilot-dashboard/aggregates.ts` |

They now run on every pull request in a new `unit-suites` step,
`Run the T-493 held synthesis suites by named file`. The step names each file
with `--runTestsByPath`, the shape T-780 established for the same situation.
The directory is never named whole, because that would select the scanner too.
The scanner stays unrun.

No product file and no wired test file is edited.

## Layer Impact

**Release lane: `global-control-lane`.** This is shared CI tooling. It applies
to every client's build equally and sits behind no feature gate.

- **Layer 4 (Products):** no product behaviour changes.
- **Platform tooling / CI:** one job step is added. The T-493 control and
  record, the coverage census and the dark-directory baseline are updated to
  match what the repository now runs.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes. CI coverage only.
- Public/demo only: no
- Feature flag: none

## Changes Included

- `.github/workflows/unit-suites.yml`: the one step described above.
- `src/__tests__/behaviors/t493-wired-directory-ci-coverage.test.ts`: the old
  held-directory case asserted that all five files stayed unrun. It now asserts
  the narrower truth, measured from the census's own `--explain` output: the
  scanner is the **only** unrun file in the directory, and the directory is
  partial at 4 of 5. A new case asserts four things. Each of the four files is
  named literally in a `--runTestsByPath` command in `unit-suites.yml`. No
  workflow command names the directory as a bare argument. No command names the
  scanner. The record's `namedFileWiring` block lists exactly these files.
- `docs/architecture/t493-stale-suite-triage.json`: a new `namedFileWiring`
  block records the base, the step, the four paths, the per-file re-execution
  counts, the product importers and the path left dark. A dated update is
  appended to the held-directory reason. The original suite rows keep
  `wiredInThisItem: false`, because T-493 itself did not wire them.
- `src/__tests__/behaviors/product-directory-ci-coverage.baseline.json`: the
  directory is partial now, so it leaves the fully-dark list (42 to 41).
- `src/__tests__/behaviors/product-directory-ci-coverage.test.ts`: a dated
  header note only. The `> 30` vacuity floor still holds at 41.
- `docs/architecture/test-ci-coverage-census.json`: regenerated with the
  repo-owned `--write`. Test files run by no workflow go from 168 to 164,
  uncovered directories from 44 to 43, and untriaged unrun files from 116 to
  112.

## QA / Validation

**Re-execution on base `35b8b3e7dd`.** Each file alone (`--runTestsByPath`):
9/9, 19/19, 8/8 and 4/4. The step as written runs 4 suites / 40 cases.

**Red first.** The amended control was written before the wiring and failed
2 of 11. With the wiring, record, baseline and census in place it passes 11 of
11.

**Mutations.** Each was applied to the change, the control was run, and the
files were restored from a copy:

| Mutation | Result |
|---|---|
| M1: the four paths replaced by the directory | 2/11 fail |
| M2: one file dropped from the step | 2/11 fail |
| M3: the scanner added to the step | 2/11 fail |
| M4: `--runTestsByPath` removed | 1/11 fails |
| M5: the directory put back in the dark baseline | 1/11 fails |
| M6: the record's `leftDark` key renamed | 1/11 fails |
| M7: the step commented out | 2/11 fail |

All 7 were caught.

**Same-scope baseline, `src/__tests__/behaviors`:** 173 suites / 1825 tests /
0 failing on a clean worktree at base `35b8b3e7dd`, and 173 / 1826 / 0 on this
branch. The one extra test is the new case.

**Other gates:** `tsc --noEmit` exit 0 (6 GB heap, judged on the exit code);
eslint on the changed tests exit 0; the T-493 record guard, the dark-directory
ratchet and the T-770 scanner-wiring refusal all pass.

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

Revert the pull request. That removes the step and restores the control, the
record, the baseline and the census together, which are consistent only as a
set. There is nothing to unwind in a running environment.

## Audit Evidence

- The local run counts and the mutation table above.
- Runner proof: the per-suite `PASS` lines for the new step in the pull
  request's `unit-suites` job log, recorded in the backlog after the run.

## Known Gaps

- `violationsMigration.test.ts` stays unrun until T-495 decides its lane
  (a governance validator over migrations, or a parsed model of the DDL).
- 112 untriaged unrun files are still held by earlier triage records, and most
  are owner-gated.
