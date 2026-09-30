# 2026-09-30-t799-wire-triaged-suites — Wire the fourteenth stale-suite draw's seventeen green files

## Release ID

`2026-09-30-t799-wire-triaged-suites`

## Status

`candidate`

## Plain-English Summary

Item T-799 triaged twenty test files that no continuous-integration job ran.
Its verdicts were recorded read-only in #8757
(`docs/architecture/t799-stale-suite-triage.json`). Seventeen were judged
`wire_into_ci`: green, behavioural, reading no repository file, over a subject
reachable from a route. This change does that wiring and nothing else.

All seventeen files were re-executed on base `a1990c0457` before wiring:
17 suites and 80 cases, all green. They now run on every pull request in two
new steps of the `unit-suites` job:

- **Named by directory (15 directories, 15 suites, 64 cases):** eight App
  Router handler suites (`api/cron/board-pack`, `api/cron/notifications-tick`,
  `api/health`, `api/health/postgres-disruption`, `api/knowledge/chunk`,
  `api/programs/expert-kernel/export`, `api/request-access`,
  `api/webhooks/resend`) and seven component suites (`ava-chat`,
  `programs/attachments`, `setup/loader`, `source/setup`, and the three
  `strategic-moves` panels). Each directory holds exactly the one drawn file,
  so naming it whole means a future test file added there also runs.
- **Named by file (2 suites, 16 cases):** the `/docs` page suite, because the
  `(maestro)` route-group segment would be read as a capture group by a bare
  Jest pattern, and `SourceNewRequestFirstPage.test.tsx`, because its directory
  holds two files that already run elsewhere.

Three rows stay held, by verdict, and are not wired: the Tower route-scope
byte scan (`rewrite_as_behavior`), the LivingMoveView stale label
(`update_with_reason_recorded`) and ProofPointFooter (held for T-775, whose
component is still unreachable).

No test file and no product file is edited.

## Layer Impact

**Release lane: `global-control-lane`.** This is shared CI tooling. It applies
to every client's build equally and sits behind no feature gate.

- **Layer 4 (Products):** no product behaviour changes. No route, component,
  adapter, projection or canonical object is touched.
- **Platform tooling / CI:** two job steps are added. The coverage census, the
  dark-directory baseline, the T-799 triage record and its control are updated
  to match what the repository now runs.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes. CI coverage only.
- Public/demo only: no
- Feature flag: none

## Changes Included

- `.github/workflows/unit-suites.yml`: two steps, `Run the T-799 route
  handler, setup, programs and strategic-moves suites` (fifteen directories)
  and `Run the T-799 docs page and Source request-first suites by named file`
  (two files).
- `src/__tests__/behaviors/product-directory-ci-coverage.baseline.json`: the
  sixteen wired directories that were dark are removed (107 → 91 entries).
  `source/new-workspace` was partial, not dark, so it was never listed.
- `docs/architecture/test-ci-coverage-census.json`: regenerated with the
  repo-owned `--write`. Unrun test files drop from 236 to 219; uncovered
  directories from 109 to 93; partial directories from 29 to 28.
- `docs/architecture/t799-stale-suite-triage.json`: the seventeen
  `wire_into_ci` rows are marked `wiredInThisItem: true`, and `secondHalf`
  records the wiring base, the re-execution counts, the two step names and the
  three rows still held.
- `src/__tests__/behaviors/t799-stale-suite-triage-record.test.ts`: the census
  case now requires the census to hold only the three non-wire rows, and a new
  case requires every `wire_into_ci` row to be named in a T-799 step (read from
  the parsed workflow, not grepped) and to be run per the census (absent from
  the held set, directory not dark), while no held row may be named in a T-799
  step.

## QA / Validation

**Re-execution on base.** All 17 files together (`--runTestsByPath`) gave
17/17 suites and 80/80 cases. The two step commands, read from the parsed YAML
and run exactly as written: 15 suites / 64 cases and 2 suites / 16 cases, both
exit 0.

**Red first.** With the workflow change alone, the `src/__tests__/behaviors`
scope went from 0 failing to 2 failing of 1782: the dark-directory ratchet
(`product-directory-ci-coverage`) and the census shape check. After the
baseline and census were updated, the T-799 control failed 1 of 9 (its census
case still expected all twenty paths held) — the intended signal. After the
control and record were amended, it passed 10 of 10.

**Mutations.** Each was applied, verified by `git diff --numstat`, run and
restored.

| Mutation | Result |
|---|---|
| M1: one wired directory removed from the directory step | T-799 control 1/10 fails; census check exits 1; dark-directory ratchet 1/4 fails |
| M2: the request-first file removed from the named-file step | T-799 control 1/10 fails; census check exits 1 |
| M3: the held Tower byte scan added to the named-file step | T-799 control 1/10 fails |
| M4: one row's `wiredInThisItem` set back to false | T-799 control 1/10 fails |
| M5: a planted failing case in one file of each step | both steps exit 1 |
| M6: the census reverted to the base copy | T-799 control 1/10 fails; census check exits 1 |

6 of 6 caught.

**Same-scope baseline, `src/__tests__/behaviors`:** 169 suites / 1782 tests /
0 failing on base `a1990c0457` (measured in this worktree before any edit),
and 169 / 1783 / 0 on the branch (the one new control case).

**Other gates:** `tsc --noEmit` exit 0; eslint on the changed test exit 0;
behavior coverage floor 90.12 / 69.42 / 70.25 (lines / functions / branches),
unchanged from base — the control imports no `src` module.

## Rollout Plan

Merge to `main` through the repo-owned workflow. There is no runtime rollout:
no image, migration, flag, environment variable or traffic change. The steps
become active on the next pull request.

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

Revert the pull request. That removes the two steps and restores the baseline,
the census, the record and the control together. They are consistent only as a
set. There is nothing to unwind in a running environment.

## Audit Evidence

- Local run counts and the mutation table above.
- Runner proof from the pull request's unit-suites job log (the per-suite
  `PASS` lines and case totals for both steps), recorded in the backlog after
  the run rather than inferred from the YAML.

## Known Gaps

- The named-file step covers one partial directory. The dark-directory
  ratchet cannot see a partial directory, so dropping that file is caught by
  the census check and the T-799 control (M2), not the ratchet.
- T-799's three held rows remain open: the LivingMoveView label update, the
  Tower route-scope behavioural rewrite, and ProofPointFooter under T-775.
