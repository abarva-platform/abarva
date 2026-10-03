# 2026-09-30-t799-stale-suite-triage — Fourteenth stale-suite triage draw, verdicts only

## Release ID

`2026-09-30-t799-stale-suite-triage`

## Status

`candidate`

## Plain-English Summary

236 Jest test files run in no continuous-integration job. The coverage census
ranks the unrun files nobody has judged yet, and each triage draw takes the top
of that ranking, runs every file, and records a verdict for each one.

This is the fourteenth draw: ranks 1–20, one file per directory. The census now
reports no critical or high governed-risk directory left, so all twenty are in
the `unclassified` band.

Each file was run on its own. 18 were green and 2 were red:

- **17 are ready to wire.** Each one is green and behavioural, reads no
  repository file, and tests a subject that a route reaches.
- **1 is held for T-775.** It is green, but it renders a component that
  `unreachable-components.json` lists and that nothing imports.
- **1 is red because a test expectation went stale.** It looks for a
  case-switcher label that the case data renamed in July. That rename was a
  deliberate data change, not a regression.
- **1 is a red byte scan.** It asserts tenant-scope wiring on a route by
  matching literals in the route's source. A formatter reflow put one expression
  on a single line, which turned the case red. The behaviour is unchanged. The
  verdict is to rewrite it as a behavioural test, because the control it guards
  is worth asserting.

This change is **read-only**. It adds the verdicts and a control, and it
regenerates the census so the twenty files are held out of the next draw. It
wires nothing: no workflow, baseline or existing test file changes. Wiring is
the second half of T-799.

## Layer Impact

**Release lane: `global-control-lane`.** This is shared CI tooling that applies
to every client's build equally, behind no feature gate.

- **Layer 4 (Products):** no product behaviour changes, and no product or test
  file under a product directory is edited.
- **Platform tooling / CI:** one triage record and one behavioural control are
  added, and the census is regenerated.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes. CI triage records only.
- Public/demo only: no
- Feature flag: none

## Changes Included

- `docs/architecture/t799-stale-suite-triage.json`: the record. It has 20 rows
  with the measured jest counts, a verdict, an owner and a rationale for each.
  The two red rows also carry a machine-checkable `redCause`, and the held row
  carries the unreachable component it renders.
- `src/__tests__/behaviors/t799-stale-suite-triage-record.test.ts`: the
  control. It has 9 cases and recomputes each claim from the tree:
  - whether a file reads repository text, derived from its bytes;
  - whether a held component is still unreachable;
  - whether each red row's cause is still present;
  - whether any other triage record already judged a drawn file;
  - whether the committed census resolves every drawn path to this record.
- `docs/architecture/test-ci-coverage-census.json`: regenerated with `--write`.
  Verdict-held untriaged files went from 85 to 105, and the drawable ones from
  99 to 79. Test files went from 2585 to 2586, and covered files from 2349 to
  2350; the difference is the new control, which the behaviors directory runs.

## QA / Validation

**Draw executed on base `4f5230e1bb`.** Each file was run alone with
`npx jest --runTestsByPath <file> --no-coverage --ci`: 18 green and 2 red. The
red files failed 1 of 4 cases and 2 of 8 cases.

**Control, red first:**

| State | Result |
|---|---|
| Record absent | The suite fails to load |
| Record present, census not regenerated | 1 of 9 fail (the census case) |
| After regeneration | 0 of 9 fail |

**Mutations.** Each file's change was confirmed before the run, and the file
was restored afterwards. All 8 were caught.

| Mutation | Case that fired |
|---|---|
| M1: the byte-scan row is declared as not reading files | The bytes case, plus the red-cause case |
| M2: the unreachable render is offered for wiring | The wiring, unreachable-hold and census cases |
| M3: the stale label is fixed in the test | The red-cause case: the row must be superseded |
| M4: the component is removed from the unreachable list | The unreachable-hold case |
| M5: a red row is declared green | The green case |
| M6: the census names another record for a path | The census case |
| M7: the route regains the multi-line literal | The red-cause case |
| M8: another triage record judges a drawn file | The disjointness case |

**Same-scope baseline, clean base worktree at `4f5230e1bb` compared with this
branch:**

- `npx jest src/__tests__/behaviors`: 168 suites / 1773 tests / 0 failing
  before, and 169 / 1782 / 0 after. The difference is exactly the new control's
  9 cases.
- `npm run coverage:behavior-gate`: recorded in the pull request. The control
  imports no module under `src/`.

**Other checks:**

- `tsc --noEmit` exited 0, judged by its exit code.
- ESLint reported 0 problems on the new control.
- `npm run audit:test-ci-coverage:check` exited 0.
- `npm run audit:triage-record-reconciliation`: 85 → 105 verdicted, and 99 → 79
  with no verdict.

## Rollout Plan

Merge to `main` through the repo-owned workflow. There is no runtime rollout:
no image, migration, flag, environment variable or traffic change.

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

Revert the pull request. That removes the record and the control and restores
the previous census, and the twenty files return to the draw. Nothing needs to
be unwound in a running environment.

## Audit Evidence

- The triage record, with the per-file jest counts.
- The control suite and the mutation table above.

## Known Gaps

- None of the 17 `wire_into_ci` files runs in CI yet. Wiring them is T-799's
  second half, and each must be re-executed on the then-current `main` first.
  One of them sits in a directory that is already partly covered, so it must be
  named by file.
- The stale-label update and the byte-scan rewrite are recorded but not done.
