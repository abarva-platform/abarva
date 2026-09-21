# 2026-09-21-stop-a-test-run-rewriting-tenant-input-data — the write, not the diff

## Release ID

`2026-09-21-stop-a-test-run-rewriting-tenant-input-data`

## Status

`candidate`

## Plain-English Summary

A parallel `npx jest` executed a real data build and wrote **seven tracked files
across four tenants** under `datasets/tenant-inputs/candidates/`. Those are
committed client input files.

Six of the seven rewrote to byte-identical content, so `git status` showed
nothing. The seventh did not, and left a **-125/+27** diff in
`skyharbor-air/gate-2-1-phase-d-v1/14_metrics_outcomes.csv` — a 125-row
deletion that the next `git add -A` would have carried into an unrelated pull
request.

| | before | after |
|---|---|---|
| Tracked files written by a parallel run | **7**, across 4 tenants | **0** |
| Files left modified | 1 | **0** |
| The harness run the documented way | passes | **passes, unchanged** |

## What was actually wrong

`run-placeholder-corruption-fix-tests.mjs` carries no `describe` or `it`. It is
an operator harness, and `next/jest`'s default `testMatch` takes **every** file
under a `__tests__` directory — so Jest collected it, executed its module body
for the side effects, and then failed it for containing no tests. Executing that
body ran `fixTenant()` against the real repository. It also called
`process.exit()` inside a Jest worker.

So the data build ran because Jest imported the file.

The fix is an entry-point guard: importing the module now does nothing, and
invoking it the documented way is unchanged.

**Deliberately not fixed by redirecting the output to a temp directory**, which
the filed item suggested. That stops the diff while leaving Jest executing a
data build and calling `process.exit()` in a worker. The write is the defect;
the diff was only the symptom that happened to be visible.

## How the writer was found

Subsetting could not find it, and the reason is worth recording.

| Probe | Result |
|---|---|
| every `src/` subtree, alone | clean |
| every `scripts/<dir>`, alone (21 directories) | clean |
| all 165 `scripts/` files, parallel | **dirty** |
| the same 165, `--runInBand` | clean |
| reproduction rate at `--maxWorkers=4` | **6/6** |

Binary search over the file list narrowed 165 → 82 → 41 → 21 and then reported
that neither half of the 21 reproduced alone. Delta debugging then kept all 21,
which looks like a flaky oracle — so the rate was measured before drawing any
conclusion, and it was 6/6. The reduction was correct: the write is sensitive to
how Jest distributes files across workers, not to a particular pair, so removing
any file changes the distribution and the write stops. **Subsetting could never
have converged.**

The writer was found instead by instrumenting `fs` through
`NODE_OPTIONS=--require`, which reports a stack from any Node process —
including children, which several candidate harnesses spawn and which a probe
living inside the Jest worker would have missed.

A hypothesis recorded earlier in the same investigation — that
`run-evidence-sources-consolidation-tests.mjs` was responsible, because the diff
removed near-empty rows and the CSV carries a `consolidation_rule_used`
column — was **wrong**. The probe named a different file.

## The guard, and why it is second

`scripts/ci/assert-datasets-unmodified.mjs` fails when a run leaves any tracked
file modified under `datasets/`, naming the paths.

It is wired **after** the suites, and shipped **with** the fix rather than
before it. A gate for a defect that is still present reds every pull request and
blocks everyone; a gate that lands after the fix is a tripwire for the next
writer. It does not revert the files: reverting would make the failure vanish on
a re-run and turn a real defect into a flake.

Untracked files under `datasets/` do not fail it — a run that drops a new report
there has not rewritten client input.

## Layer Impact

- `global-control-lane`. One test harness, one new CI script, one workflow step.
  No product surface, tenant data, schema, projection, migration, flag, or
  runtime behaviour. **No tenant input file is changed by this PR** — the point
  of it is that a test run stops changing them.

## Client Applicability

- All clients: no · Specific clients: none · Internal only: yes
- Public/demo only: no · Feature flag: none

## Changes Included

- `scripts/data-build/tenant-scenario-model/__tests__/run-placeholder-corruption-fix-tests.mjs`
  — entry-point guard; the body is unchanged.
- `scripts/ci/assert-datasets-unmodified.mjs` — new.
- `.github/workflows/unit-suites.yml` — one step, after the suites.

## QA / Validation

Measured on base `56286b266`.

| What | Result |
|---|---|
| fs probe over the 21-file set, before | 7 writes into the tree, 1 file dirty |
| the same probe, after | **0 writes into the tree, 0 dirty** |
| the harness run directly (`node scripts/.../run-...mjs`) | **all checks passed** |
| guard on a clean tree | exit **0** |
| guard on a deliberately dirtied tracked file | exit **1**, names the file |
| `tsc` (exit code) | 0 |
| `eslint` | clean |
| `release-check` | passed |

The only writes the probe still reports are a sibling harness writing into its
own `mkdtemp` directory, which is the pattern this one should have used.

## Rollout Plan

Merge to `main`. The new step is green on arrival because the writer is fixed in
the same change. No image build, migration, flag, or runtime change.

## Deployment Authority

- Repo-owned deploy workflow: not exercised beyond the ordinary main deploy
- Shared runtime mutators: none · Approved image digest: not applicable
- ACA runtime invariant: not applicable · Worker image invariant: not applicable
- Feature/env flag update path: none · Live signed-in proof required: no

## Rollback Plan

Revert the PR. A parallel test run resumes writing seven tracked tenant input
files, and the tripwire that would report it is removed with it.

## Audit Evidence

- The fs-probe stacks naming `fix-placeholder-corrupted-references.mjs:91` and
  its caller, before and after.
- The seven paths, listed per tenant.
- The serial-versus-parallel and 6/6 rate measurements.
- Guard exit codes in both directions.

## Known Gaps

- **The class is wider than this file.** Every `run-*.mjs` harness under
  `scripts/**/__tests__/` is collected and executed by Jest the same way. Only
  the one that wrote into the repository is fixed here; the others were not
  audited, and the guard is what would catch the next one.
- **Why the write needs parallelism is not explained.** Serial runs produce zero
  writes and that is measured, not theorised, but the mechanism inside Jest's
  worker distribution was not established — and the fix does not depend on it.
- **Six of the seven files were invisible.** They rewrote to identical bytes, so
  nothing would have reported them until their content next changed. No claim is
  made that seven is the complete set across every possible run.
