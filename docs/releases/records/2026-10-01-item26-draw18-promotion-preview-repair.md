# 2026-10-01-item26-draw18-promotion-preview-repair — Repair and wire the eighteenth draw's one repair row

## Release ID

`2026-10-01-item26-draw18-promotion-preview-repair`

## Status

`candidate`

## Plain-English Summary

The eighteenth stale-suite triage draw (P3 item 26, #8797) judged one red file
`repair`: `src/scripts/governance/__tests__/promotion-preview.test.ts`, red 0
of 2. The defect was in the product, not the test.

`src/lib/governance/promotion-preview-render.ts` found the airline tenant's key by matching a regular expression against the display names in
`CANONICAL_TENANTS`. That tenant's display name was later changed to a neutral
demo label, so no name matched and the key fell back to the empty string. No
evaluated row has an empty `client_key`, so the preview's tenant-specific
section counted zero rows for every input, silently.

The resolver now looks the tenant up by its declared key and throws at load if
the registry stops declaring that key, so the same drift can no longer produce
a quiet zero. This follows the identity rule: identity is declared, never
inferred from a label.

The test changes in two ways:

- The heading assertion expected the old display name. The renderer prints the
  neutral label on purpose, so the assertion now expects that heading and the
  row count printed under it.
- A third case proves that a different tenant's row is not counted into the
  section.

The file is the only test in its directory. It is now run by one new
`unit-suites` step, `Run the item 26 draw 18 repaired suite`. The fourteen
draw 18 `wire_into_ci` rows and the four T-775 holds are unchanged.

## Layer Impact

**Release lane: `global-control-lane`.**

- **Layer 4 (Products):** one pure aggregation module changes. Its only
  importer is the operator script `src/scripts/governance/promotion-preview.ts`,
  which renders a read-only markdown preview. No route, component, adapter,
  projection or canonical object imports it, and no data is written.
- **Platform tooling / CI:** one test file and one job step change. The
  coverage census, the product dark-directory baseline, the draw 18 triage
  record and its control are updated to match what the repository now runs.

## Client Applicability

- All clients: no
- Specific clients: none. The preview is an internal operator report.
- Internal only: yes
- Public/demo only: no
- Feature flag: none

## Changes Included

- `src/lib/governance/promotion-preview-render.ts`: the tenant is resolved by
  declared key, and the module throws at load when that key is not declared.
- `src/scripts/governance/__tests__/promotion-preview.test.ts`: the heading
  assertion is updated as described, and one negative case is added.
- `.github/workflows/unit-suites.yml`: one step naming
  `src/scripts/governance/__tests__`.
- `src/__tests__/behaviors/product-directory-ci-coverage.baseline.json`: the
  wired directory leaves the dark set.
- `docs/architecture/test-ci-coverage-census.json`: regenerated with the
  repo-owned `--write`. Test files run by no workflow drop from 183 to 182, and
  uncovered directories from 58 to 57. Separately, `testFiles` moves from
  2595 to 2596. That drift is already on the base: a clean worktree at
  `d4721a6007` regenerates the same +1, and `--check` passes there.
- `docs/architecture/item26-draw18-stale-suite-triage.json`: the row keeps its
  draw-time verdict, counts and red cause. It gains a `repaired` block with
  the repair base, the re-execution counts and the declared key it now
  resolves, plus `wiredInThisItem: true`. `secondHalf` names the new step.
- `src/__tests__/behaviors/item26-draw18-triage-record.test.ts`:
  - Once a row records an applied repair, the resolver must no longer match by
    name. It must look the tenant up by key, name the intended declared key,
    and the test must still expect rows in the section.
  - A new case requires every applied repair or wired row to be named in an
    item 26 draw 18 step and counted as run by the census, and forbids any
    other row from being named.
  - The census-resolution case now covers only rows that are still held.

## QA / Validation

**Red on base.** On `d4721a6007` the file, run alone with `--runTestsByPath`,
gave 2 failed / 0 passed, which matches the record.

**After.** 3/3. The new step, run as written, gave 1 suite / 3 cases.

**Product mutations against the repaired suite** (each restored from the
branch):

| Mutation | Result |
|---|---|
| P1: resolver reverted to the display-name match | 2 fail |
| P2: section counts every row regardless of tenant | 2 fail |
| P3: resolver pointed at a different declared tenant | 3 fail |
| P4: resolver pointed at an undeclared key | suite fails to load, naming the key |

4 of 4 caught.

**Control.** The base copy of the draw 18 control, run against this branch,
failed 2 of 9. The amended control passes 10 of 10.

| Control mutation | Result |
|---|---|
| C1: resolver reverted to the display-name match | 1 fails |
| C2: the new step removed | 1 fails |
| C3: census reverted to the base copy | 1 fails |
| C4: the recorded re-execution marked one failure | 1 fails |
| C5: the wired directory turned into `# <dir>` inside the folded command | 1 fails |
| C6: a held draw 18 row's directory added to the new step | 1 fails |
| C7: the test's section-count expectation removed | 1 fails |

7 of 7 caught. The first attempts at C5 and C6 changed no behaviour, so both
were redone:

- **C5:** the first attempt wrote a quoted `"#"`, which is not a shell comment.
- **C6:** the first attempt added a directory that is not a draw 18 row.

**Same-scope baseline, `src/__tests__/behaviors`:**

- A clean worktree at `d4721a6007` gave 173 suites / 1824 tests / 0 failing.
- This branch gives 173 / 1825 / 0. The +1 is the new control case.

**Other gates:**

- `tsc --noEmit`: exit 0.
- eslint on the three changed source and test files: exit 0.
- `audit:test-ci-coverage:check`: exit 0.
- Triage-record census reconciliation: exit 0.
- The control still imports no `src` module.

## Rollout Plan

Merge to `main` through the repo-owned workflow. The web image is rebuilt as
usual, but nothing served by it imports the changed module. There is no
migration, flag, environment variable or traffic change.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy.yml` on merge, as for every
  change.
- Shared runtime mutators: none
- Approved image digest: whatever the merge run produces; recorded in the
  backlog after the run.
- ACA runtime invariant: checked after deploy (template digest = 100%-traffic
  revision digest).
- Worker image invariant: unaffected
- Feature/env flag update path: n/a
- Live signed-in proof required: **no**. No client surface imports the module.

## Rollback Plan

Revert the pull request. That restores the resolver, test, step, baseline,
census, record and control together; they are consistent only as a set.
Nothing needs unwinding in a running environment.

## Audit Evidence

- The local counts and the two mutation tables above.
- Runner proof from the pull request's unit-suites job log: the `PASS` line
  for the new step. It will be recorded in the backlog after the run, not
  inferred from the YAML.

## Known Gaps

- Eighteen draw 18 rows stay held:
  - The fourteen `wire_into_ci` rows are claimable under item 26.
  - The four T-775 rows wait on their owner.
- The rendered section heading is a fixed label rather than the tenant's
  registry display name. That is unchanged here, because the triage judged
  the label intentional.
