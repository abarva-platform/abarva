# 2026-10-01-d512-placeholder-runner-tempdir — Placeholder-corruption suite writes only under its own temp directory

## Release ID

`2026-10-01-d512-placeholder-runner-tempdir`

## Status

`candidate`

## Plain-English Summary

Running one data-build test suite by hand rewrote a committed tenant input file and still
reported success. Anyone who then staged their working tree broadly would have committed the
damage without noticing.

The suite exists to check `fix-placeholder-corrupted-references.mjs`. To check it, the suite
runs the fix, and the fix writes its candidate CSVs into the tracked
`datasets/tenant-inputs/candidates/<tenant>/gate-2-1-phase-d-v1/` tree. On `origin/main`
`e714d3ecb8`, run from a clean worktree, the suite exited 0 and left a -125/+27 diff in one
committed candidate file.

The fix function now takes an output root. Its default is unchanged, so the data build still
writes where it always did. The suite passes a temp directory that it creates and removes, and
it now asserts that every candidate file landed under that directory.

The 2026-09-21 change stopped Jest from running the suite's body when it imports the file. That
guard is kept. This change covers the other case: running the suite directly.

## Layer Impact

- **Tooling only.** It changes a data-build script's test harness and adds an optional parameter
  to the script it tests. The default output path is unchanged.
- No source adapter, canonical-model, or product-surface change. No tenant input file changes in
  this PR.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/data-build/tenant-scenario-model/fix-placeholder-corrupted-references.mjs`: `fixTenant(tenantKey, targets, { candidatesRoot })`, defaulting to the tracked candidates tree.
- `scripts/data-build/tenant-scenario-model/__tests__/run-placeholder-corruption-fix-tests.mjs`: writes under an `mkdtemp` directory, asserts each candidate is inside it, and removes it in `finally`.
- `src/__tests__/behaviors/d512-placeholder-runner-writes-no-tracked-path.test.ts` (new): runs the suite the documented way and asserts:
  - it exits 0 with at least 10 passing checks;
  - every committed candidate file is byte-identical afterwards (sha256);
  - `git status` over `datasets/` and `reports/` is unchanged.

  Its `afterAll` restores any file the run changed, so a red run does not leave the damage it
  found.

## QA / Validation

Base: `origin/main` `e714d3ecb8`.

| What | Result |
|---|---|
| Reproduction: direct run on base | exit 0; one tracked candidate CSV -125/+27 |
| New behavior test on base code | **2 of 4 failed** (byte-identity, git status) |
| New behavior test after fix | **4 of 4 passed** |
| Mutation: first `fixTenant` call back to default root | 3 of 4 failed |
| Mutation: second (active/current listing) call back to default root | 2 of 4 failed |
| Mutation: fixer ignores `candidatesRoot` | 3 of 4 failed |
| Direct run after fix | 40 `[PASS]`, exit 0, `git status` clean |
| `jest src/__tests__/behaviors` | 174 suites / 1830 tests, all passed. The new suite adds 1 suite and 4 tests; the earlier pulse measured 173/1826 on this scope. |
| `tsc --noEmit` (exit code) | 0 |
| `eslint` on changed files | 0 |
| test-CI coverage census `--check` | 0 (the new file is in a directory CI already runs) |

## Rollout Plan

Merge to `main`. The repo-owned ACA workflow rebuilds the image, but nothing in this change runs
in the web or worker runtime. The new test runs in CI under the behaviors suite.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, on merge
- Shared runtime mutators: none
- Approved image digest: whatever the merge's deploy run produces
- ACA runtime invariant: to be read after merge
- Worker image invariant: to be read after merge
- Feature/env flag update path: none
- Live signed-in proof required: no (CI and tooling only)

## Rollback Plan

Revert the squash commit. That restores the old behavior, where a direct run writes the tracked
tree. No data needs restoring.

## Audit Evidence

- The PR and its CI run, including the behaviors suite step.
- The mutation results in the table above.

## Known Gaps

- The committed `gate-2-1-phase-d-v1` candidate CSV for one tenant no longer matches what the
  fix produces from that tenant's current active file:
  - the committed file has 124 data rows, blank except for tenant key and source path;
  - the current active file yields 26 populated rows.

  Whether to regenerate the candidate is a data-build decision and is out of scope here.
