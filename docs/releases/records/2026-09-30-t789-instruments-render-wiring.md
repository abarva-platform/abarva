# 2026-09-30-t789-instruments-render-wiring — Wire the instruments render suite by named file

## Release ID

`2026-09-30-t789-instruments-render-wiring`

## Status

`candidate`

## Plain-English Summary

`src/lib/instruments/__tests__/render.test.ts` ran in no continuous-integration
job. T-788 held its whole directory because the other suite there,
`instrument-data-layer-migration.test.ts`, reads the SQL of an applied migration
and asserts literals over its bytes. The render suite was held only because of
that sibling. It is green (2 of 2), it tests the instrument renderer's
behaviour with authoring and the database mocked, and it reads no repository
file.

This change takes the **claimable half** of T-789. It names the render suite
**by file** in the unit-suites job, the way T-786 did. The migration suite
stays out. Whether to keep it, rewrite it over the migrated schema, or retire
its literal cases is the item's **gated half**, which is a decision this change
does not take.

**What the dark-directory ratchet does now.** It tracks only directories with
nothing covered. Once one file runs, the directory is *partial*, so its line
leaves the baseline and the ratchet stops watching it. A new control takes
over and pins the directory's on-disk test files to the record.

This change protects future work; it does not repair a break. No product code
changes, and no test file under `src/lib/instruments` is edited.

## Layer Impact

**Release lane: `global-control-lane`.** This is shared CI tooling that applies
to every client's build equally, behind no feature gate.

- **Layer 4 (Products):** no product behaviour changes. `src/lib/instruments`
  is not edited.
- **Platform tooling / CI:** one job step, one triage record and one control
  suite are added. The census and dark baseline are updated to match. T-788's
  control is unchanged: it already honours a later record that wires a held
  row, and it now requires that row to be reached and the directory to leave
  the dark baseline.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes. CI coverage only.
- Public/demo only: no
- Feature flag: none

## Changes Included

- `.github/workflows/unit-suites.yml`: one step, `Run the T-789 instruments
  render suite by named file`, using `--runTestsByPath` with the one file.
- `src/__tests__/behaviors/product-directory-ci-coverage.baseline.json`: the
  directory's line is removed, because the directory is now partial.
- `docs/architecture/t789-instruments-render-triage.json`: the record. It has
  one row per file in the directory (two). It is dated after T-788's record and
  supersedes its row for the wired file.
- `src/__tests__/behaviors/t789-instruments-render-wiring.test.ts`: the control,
  9 cases, reading every partition out of the record, in T-786's shape.
- `docs/architecture/test-ci-coverage-census.json`: regenerated with
  `npm run audit:test-ci-coverage:write`.
  - Test files: 2583 → 2584 (the new control).
  - Covered files: 2346 → 2348 (the wired suite plus the control).
  - Uncovered directories: 110 → 109; partial directories: 28 → 29.

## QA / Validation

**Re-verified on base `b274987ddc`**, each file alone with
`npx jest --runTestsByPath <file> --no-coverage --ci`: render 2 of 2 green;
migration 3 of 3 green.

**Control, red first.** With the record and control present but the workflow
and baseline unchanged, 3 of 18 cases fail across the T-789 and T-788 controls:
the wired file is unreached, the directory is still in the dark baseline, and
T-788's superseded row is unreached. After the change, 0 of 22 fail over those
two controls plus the product-directory ratchet.

**Control mutations.** Each was run over the same 22 cases, then restored.

| Mutation | Result |
|---|---|
| M1: named file replaced by the directory | 2 of 22 fail |
| M2: step deleted | 3 of 22 fail |
| M3: dark-baseline line restored | 3 of 22 fail |
| M4: a third test file added beside them | 1 of 22 fails |
| M5: held suite's scanner case renamed | 2 of 22 fail |
| M6: wired suite starts importing `node:fs` | 1 of 22 fails |

**Same-scope baseline, clean base worktree at `b274987ddc` vs this branch:**

- `npx jest src/__tests__/behaviors`: 167 suites / 1764 tests / 0 failing
  before, and 168 / 1773 / 0 after. The delta is exactly the new control's 9
  cases.
- `npm run coverage:behavior-gate` exited 0. Statements 90.12, functions 69.42,
  branches 70.25, all unchanged. The control imports only the census script.

**Other checks:**

- `tsc --noEmit` exited 0 with the build-info removed, judged by exit code.
- ESLint reported 0 problems on the new control.
- `npm run audit:test-ci-coverage:check` matches the committed census.
- `npm run audit:triage-record-reconciliation` exited 0.

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

Revert the pull request. That restores the step's absence, the baseline line
and the previous census together. They are consistent only as a set. There is
nothing to unwind in a running environment.

## Audit Evidence

- The triage record, with per-file run counts and the held row's reason.
- The control suite and the control-mutation table above.
- Runner proof from the pull request's unit-suites job log: the step's `PASS`
  line and case total, recorded in the backlog after the run rather than
  inferred from the YAML.

## Known Gaps

- `instrument-data-layer-migration.test.ts` stays unwired until T-789's gated
  half decides whether to keep, rewrite or retire it.
- The render suite mocks authoring and the database. It proves what the
  renderer produces for a given template, not what a live template read
  returns.
