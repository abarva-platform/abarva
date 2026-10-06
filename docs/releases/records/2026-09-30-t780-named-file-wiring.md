# 2026-09-30-t780-named-file-wiring — Wire four reachable agent-answer and context-broker suites by named file

## Release ID

`2026-09-30-t780-named-file-wiring`

## Status

`candidate`

## Plain-English Summary

Four green test suites ran in no continuous-integration job. They were held
back only because each shares a directory with a suite that renders a
component no route reaches (`AvaAsk`, `FourModeDemoSurface`, both listed in
`docs/architecture/unreachable-components.json`). Wiring either directory
whole would count coverage over unreachable code, so T-779 held both.

This change wires the four suites **by file name** in the unit-suites job:

- `AgentAnswerRenderer.test.tsx` (16 cases), whose subject is mounted by the
  shell agent column, Home, Moves and the Source bottom bar;
- `AvaAskMark.assets.test.ts` (1 case);
- `ContextAssembledPanel.test.tsx` (34 cases) and `ModeToggle.test.tsx`
  (14 cases), whose subjects are mounted by the programs agent canvas.

That is 65 cases. The two unreachable renders stay out, and their
retire-or-mount decision stays with T-775.

**The asset case.** `AvaAskMark.assets.test.ts` reads two SVG files and
asserts their fill colours instead of rendering anything. It is wired in the
same step, not moved to a separate asset validator. Those files are the bytes
the component serves by URL, so the text is the shipped artifact and a comment
in source code cannot satisfy it. No asset validator covers that folder today.
The new control recomputes this rather than trusting the record: every file
the suite reads must sit under `public/`, and the component must reference each
by its served URL.

**What the dark-directory ratchet does now.** It tracks only directories with
nothing covered. Once one file in a directory runs, the directory is
*partial*, so both lines leave its baseline (126 → 124) and the ratchet no
longer watches them. The new control takes over that job: it pins each
directory's on-disk test files to the record, so a new file added beside them
fails the control instead of running nowhere unseen.

This change protects future work; it does not repair a break.

## Layer Impact

**Release lane: `global-control-lane`.** This is shared CI tooling that applies
to every client's build equally, behind no feature gate.

- **Layer 4 (Products):** no product behavior changes. No route, component,
  adapter, projection or canonical object is touched, and no judged test file
  is modified.
- **Platform tooling / CI:** one job step, one triage record and one control
  suite are added. T-779's control learns to honour a later record, and the
  census and dark baseline are updated to match.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes. CI coverage only.
- Public/demo only: no
- Feature flag: none

## Changes Included

- `.github/workflows/unit-suites.yml`: one step, `Run the T-780 agent-answer
  and context-broker suites by named file`. It uses `--runTestsByPath` with the
  four files.
- `src/__tests__/behaviors/product-directory-ci-coverage.baseline.json`: the
  two directories' lines are removed, because both are now partial.
- `docs/architecture/t780-named-file-triage.json`: the record. It has one row
  per file in both directories (six), the asset-case decision, and the
  ratchet finding. It is dated after T-779's record and supersedes its rows for
  the four wired files.
- `src/__tests__/behaviors/t780-named-file-wiring.test.ts`: the control, with 9
  cases, reading every partition out of the record.
- `src/__tests__/behaviors/t779-stale-suite-wiring.test.ts`: its hold case
  previously required every row of a held directory to be unreached. It now
  exempts a row only when a later triage record both names it and marks it
  wired. A directory with such a row is expected off the dark baseline. Every
  other held row is held exactly as before.
- `docs/architecture/test-ci-coverage-census.json`: regenerated with
  `npm run audit:test-ci-coverage:write`. Counts went from 2569 test files and
  2284 covered to 2570 and 2289: the four wired files plus the new control.
  Uncovered directories went from 129 to 127, and partial directories from 28
  to 30.

## QA / Validation

**Each file was run on its own** on the base (`npx jest --runTestsByPath`): 6
of 6 green (16, 2, 1, 34, 8 and 14 cases).

**Reachability.** None of the four wired subjects is on the unreachable
register, and each has a non-test importer outside its directory. The control
asserts both.

**Control, red first.** On the base workflow and baseline, with the new
control and record present, 3 of 21 cases fail over the T-780 control, the
T-779 control and the product-directory ratchet. After the change, 0 of 21
fail.

**Same-scope baseline, base `bfc0d3b3b3` vs this branch:**

- `npx jest src/__tests__/behaviors`: 160 suites / 1706 tests / 0 failing
  before, and 161 / 1715 / 0 after. The delta is exactly the new control's 9
  cases.
- The wired step's own command: 4 suites / 65 tests / 0 failing.
- `npm run coverage:behavior-gate`: exit 0. Lines are 90.12 against a floor of
  90, the same as on the base. The control imports only the census script.

**Mutations.** Each was run over the T-780 control, the T-779 control and the
product-directory ratchet (21 cases), then restored from the commit.

| Mutation | Result |
|---|---|
| M0: base workflow and baseline | 3 of 21 fail |
| M1: the two agent-answer files replaced by their directory | 2 of 21 fail |
| M2: `FourModeDemoSurface.test.tsx` added to the step | 2 of 21 fail: T-780 "reaches no held file", and the T-779 hold case |
| M3: `ModeToggle.test.tsx` dropped from the step | 1 of 21 fails |
| M4: a new test file added to `context-broker/__tests__` | 1 of 21 fails: T-780 "judges every file" |
| M5: `AvaAsk.tsx` removed from the unreachable register | 2 of 21 fail |
| M6: `AvaAskMark.tsx` stops serving one of the read SVG URLs | 1 of 21 fails: the asset case |
| M7: T-779's control ignores the later record | 1 of 21 fails |
| M8: the T-780 record dated before T-779's | 2 of 21 fail |

Other checks: `tsc --noEmit` exited 0, judged by exit code. ESLint reported 0
problems on both control files.

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
- the two baseline lines;
- T-779's original hold case;
- the previous census.

They are consistent only as a set. There is nothing to unwind in a running
environment.

## Audit Evidence

- The triage record, with per-file run counts and the two decisions.
- The control suite and the mutation table above.
- Runner proof from the pull request's unit-suites job log: the step's
  per-suite `PASS` lines and case total. It is recorded in the backlog after
  the run, not inferred from the YAML.

## Known Gaps

- `AvaAsk.test.tsx` and `FourModeDemoSurface.test.tsx` stay unwired until
  T-775 decides whether to retire or mount their components.
