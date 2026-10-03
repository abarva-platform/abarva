# 2026-10-01-item26-draw17-fixture-updates — Apply and wire the seventeenth draw's two fixture updates

## Release ID

`2026-10-01-item26-draw17-fixture-updates`

## Status

`candidate`

## Plain-English Summary

The seventeenth stale-suite triage draw (P3 item 26, #8785) judged two red
files `update_with_reason_recorded`: the product behaviour was the intended
one, and each test's fixture had gone stale. This change applies both updates
and wires both files into CI.

- `src/lib/programs/learning-writeback/__tests__/moves-learning-writeback.test.ts`
  was red 2 of 16. Its two promotion-preview cases built inline fixture rows
  for a tenant key that the canonical tenant registry no longer declares, so
  the canonical promotion evaluator blocked each row on a non-canonical
  `client_key` before judging its gates. Those two cases now use a tenant the
  registry declares. The other fourteen cases are unchanged; they do not
  reach that check.
- `src/lib/semantic2/__tests__/runtime-contract.test.ts` was red 1 of 5. One
  positive case expected a holdco alias to normalise to a canonical tenant;
  that alias was removed from the alias table on 2026-07-02. The input now
  sits in the rejects list, so the case asserts that the runtime contract
  refuses a retired alias. That is the behaviour the alias removal intended.

Each file is the only test in its directory, so both are run whole by one new
`unit-suites` step, `Run the item 26 draw 17 fixture-updated suites`.

No product file is edited. The two repair rows (waiting on the draw 16
data-lane decision) and the five T-775 holds are unchanged.

## Layer Impact

**Release lane: `global-control-lane`.** This is shared CI tooling and test
fixtures. It applies equally to every client's build and sits behind no
feature gate.

- **Layer 4 (Products):** no product behaviour changes. No route, component,
  adapter, projection or canonical object is touched.
- **Platform tooling / CI:** the changes are two test fixtures and one job
  step. The coverage census, both dark-directory baselines, the draw 17
  triage record and its control are updated to match what the repository now
  runs.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes. Test and CI coverage only.
- Public/demo only: no
- Feature flag: none

## Changes Included

- The two test files above: three fixture lines are re-keyed, with one
  comment in each of the two cases saying why. One expectation moved from the
  accepted list to the rejected list, also with a comment.
- `.github/workflows/unit-suites.yml`: one step naming
  `src/lib/programs/learning-writeback/__tests__` and
  `src/lib/semantic2/__tests__`. `jest --listTests` over the two patterns
  resolves exactly the two files. The second pattern does not select the
  already-wired `semantic2/dossiers` directory.
- `src/__tests__/behaviors/product-directory-ci-coverage.baseline.json` and
  `src/__tests__/behaviors/programs-unit-directory-ci-coverage.baseline.json`:
  the wired directories leave the dark set. Both were dark before.
- `docs/architecture/test-ci-coverage-census.json`: regenerated with the
  repo-owned `--write`. Test files run by no workflow drop from 185 to 183, and
  uncovered directories from 60 to 58. `--check` exits 0.
- `docs/architecture/item26-draw17-stale-suite-triage.json`: each of the two
  rows keeps its draw-time verdict, counts and red cause. Each gains an
  `updated` block with the update base and the re-execution counts, the tenant
  it was re-keyed to where that applies, and `wiredInThisItem: true`.
  `secondHalf` names the new step and no longer lists these rows as held.
- `src/__tests__/behaviors/item26-draw17-triage-record.test.ts`: a row is now
  run when it is `wire_into_ci` or an applied update. An applied
  retired-tenant row must still show the cause (the retired key is still
  undeclared). Its re-key target must be a declared key, and the test must pin
  a fixture to it. An applied retired-alias row must expect no retired input
  to resolve, while the reader still sees a declared one. Both rows must
  record a green re-execution and be wired. An unapplied row is held exactly
  as before.

## QA / Validation

**Red on base.** On `0b237ac29b`, each file was run alone with
`--runTestsByPath`. The writeback suite gave 2 failed / 14 passed and the
runtime-contract suite 1 failed / 4 passed, which matches the record.

**After.** The same two files gave 16/16 and 5/5. The new step, run as written,
gave 2 suites / 21 cases.

**Product mutations against the updated suites** (each mutation restored from
the committed branch):

| Mutation | Result |
|---|---|
| P1: the review queue's governed object given a retired tenant as `client_key` | 2 fail |
| P2: the retired alias restored to the alias table | 1 fails |
| P3: the writeback fixture re-key reverted | 2 fail |

3 of 3 caught.

**Control.** The base copy of the draw 17 control, run against this branch,
failed 3 of 10. The amended control passes 10 of 10.

| Control mutation | Result |
|---|---|
| C1: the alias expectation reverted in the test | 1 fails |
| C2: the record's re-key target set to the retired key | 1 fails |
| C3: the new step removed | 1 fails |
| C4: one row's `updatedInThisItem` set false | 2 fail |
| C5: the writeback fixture re-key reverted | 1 fails |
| C6: the recorded re-execution marked one failure | 1 fails |
| C7: one wired directory turned into `# <dir>` inside the folded command | 1 fails |

7 of 7 caught. A first attempt at C7 put the `#` after the path. That left the
path running, so it changed no behaviour and was redone.

**Same-scope baseline, `src/__tests__/behaviors`:** a clean worktree at base
`0b237ac29b` gave 172 suites / 1815 tests / 0 failing. This branch gives the
same 172 / 1815 / 0, because no case was added. The Programs dark-directory
ratchet failed 2 cases until its baseline lost the wired directory.

**Other gates:** `tsc --noEmit` exit 0. eslint on the three changed tests exit
0. `audit:test-ci-coverage:check` exit 0. Triage-record census reconciliation
exit 0. The control still imports no `src` module.

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

Revert the pull request. That restores the fixtures, step, baselines, census,
record and control together; they are consistent only as a set. Nothing needs
unwinding in a running environment.

## Audit Evidence

- The local counts and the two mutation tables above.
- Runner proof from the pull request's unit-suites job log: the per-suite
  `PASS` lines for the new step. It will be recorded in the backlog after the
  run, not inferred from the YAML.

## Known Gaps

- Seven draw 17 rows stay held. The two repair rows wait on the draw 16
  data-lane decision. The five T-775 rows wait on their owner.
- The rest of the writeback suite still uses fixtures with the retired tenant
  key. Those cases are green because they never reach the evaluator's
  canonical `client_key` check, so they were left alone.
