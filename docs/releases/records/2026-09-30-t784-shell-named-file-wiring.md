# 2026-09-30-t784-shell-named-file-wiring — Wire two reachable shell suites by named file

## Release ID

`2026-09-30-t784-shell-named-file-wiring`

## Status

`candidate`

## Plain-English Summary

Two green test suites under `src/lib/shell/__tests__` ran in no
continuous-integration job. T-781 held the whole directory because its third
suite, `atrium-contract.test.ts`, tests a module that
`docs/architecture/orphaned-lib-modules.json` lists as reached only by tests.
Wiring the directory whole would count coverage over code no route reaches.

This change takes the **claimable half** of T-784 and wires the other two
suites **by file name** in the unit-suites job, the way T-780 did:

- `origination-handoff.test.ts` (9 cases), whose subject is imported by the
  Atlas page-state provider and the Steward origination chat;
- `working-pane-shape.test.ts` (1 case), whose subject is imported by the shell
  working-pane container and the Source and Programs shape resolvers.

That is 10 cases. `atrium-contract.test.ts` stays out. Whether to retire that
module or mount it from a product path is T-784's **gated half**, a decision
this change does not take.

**What the dark-directory ratchet does now.** It tracks only directories with
nothing covered. Once one file runs, the directory is *partial*, so its line
leaves the baseline and the ratchet stops watching it. The new control takes
over: it pins the directory's on-disk test files to the record, so a new file
added beside them fails the control instead of running nowhere unseen.

This change protects future work; it does not repair a break.

## Layer Impact

**Release lane: `global-control-lane`.** This is shared CI tooling that applies
to every client's build equally, behind no feature gate.

- **Layer 4 (Products):** no product behavior changes. No route, component,
  adapter, projection or canonical object is touched, and no judged test file
  is modified.
- **Platform tooling / CI:** one job step, one triage record and one control
  suite are added. The census and dark baseline are updated to match. T-781's
  control is unchanged: it already honours a later record that wires a held
  row.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes. CI coverage only.
- Public/demo only: no
- Feature flag: none

## Changes Included

- `.github/workflows/unit-suites.yml`: one step, `Run the T-784 shell suites
  by named file`. It uses `--runTestsByPath` with the two files.
- `src/__tests__/behaviors/product-directory-ci-coverage.baseline.json`: the
  directory's line is removed, because it is now partial.
- `docs/architecture/t784-shell-named-file-triage.json`: the record, with one
  row per file in the directory (three). It is dated after T-781's record and
  supersedes its rows for the two wired files.
- `src/__tests__/behaviors/t784-shell-named-file-wiring.test.ts`: the control,
  with 8 cases, reading every partition out of the record.
- `docs/architecture/test-ci-coverage-census.json`: regenerated with
  `npm run audit:test-ci-coverage:write`. Test files went from 2573 to 2574
  (the new control) and covered files from 2301 to 2304 (the two wired files
  plus the control). Uncovered directories went from 125 to 124, and partial
  directories from 29 to 30.

## QA / Validation

**Each file was run on its own** on the base `445e48df59`
(`npx jest --runTestsByPath`): 3 of 3 green (6, 9 and 1 cases).

**Reachability.** Neither wired subject is on the test-only register, each is
imported by its suite, and each has a non-test importer outside its directory.
The control asserts all three.

**The hold is recomputed from two independent sources.** The held row's
subject must still be listed `testOnly` in the register, and a scan of `src`
must still find no non-test module that imports it. So the hold goes red if
the register is edited, and separately if someone mounts the module without
updating the register.

**Control, red first.** On the base workflow and baseline, with the new
control and record present, 3 of 21 cases fail over the T-784 control, the
T-781 control and the product-directory ratchet. After the change, 0 of 21
fail.

**Same-scope baseline, base `445e48df59` vs this branch:**

- `npx jest src/__tests__/behaviors`, measured in a clean worktree at the base:
  163 suites / 1730 tests / 0 failing before, and 164 / 1738 / 0 after. The
  delta is exactly the new control's 8 cases.
- The wired step's own command: 2 suites / 10 tests / 0 failing.
- `npm run coverage:behavior-gate`: exit 0. Lines are 90.12 and functions
  69.42, the same as on the base. The control imports only the census script.

**Mutations.** Each was run over the T-784 control, the T-781 control and the
product-directory ratchet (21 cases), then restored.

| Mutation | Result |
|---|---|
| M0: base workflow and baseline | 3 of 21 fail |
| M1: the two named files replaced by the directory | 2 of 21 fail |
| M2: `atrium-contract.test.ts` added to the step | 2 of 21 fail |
| M3: `working-pane-shape.test.ts` dropped from the step | 2 of 21 fail |
| M4: a new test file added to `src/lib/shell/__tests__` | 1 of 21 fails |
| M5: `atrium-contract.ts` removed from the test-only register | 2 of 21 fail |
| M6: a product module imports `atrium-contract.ts`, register unchanged | 1 of 21 fails |
| M7: the T-784 record dated before T-781's | 2 of 21 fail |
| M8: a wired row's subject replaced by a module its suite does not import | 1 of 21 fails |

Other checks: `tsc --noEmit` exited 0, judged by exit code. ESLint reported 0
problems on the control file. `npm run audit:test-ci-coverage:check` matches
the committed census.

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

Revert the pull request. That restores, together:

- the step's absence;
- the baseline line;
- the previous census.

They are consistent only as a set. There is nothing to unwind in a running
environment.

## Audit Evidence

- The triage record, with per-file run counts and the held row's reason.
- The control suite and the mutation table above.
- Runner proof from the pull request's unit-suites job log: the step's
  per-suite `PASS` lines and case total. It is recorded in the backlog after
  the run, not inferred from the YAML.

## Known Gaps

- `atrium-contract.test.ts` stays unwired until T-784's gated half decides
  whether to retire or mount `src/lib/shell/atrium-contract.ts`.
- `src/lib/sentinel/tense-guard-allowlist.ts`, the other test-only module
  T-784 names, sits in a directory T-783 also holds and is out of this
  change's scope.
