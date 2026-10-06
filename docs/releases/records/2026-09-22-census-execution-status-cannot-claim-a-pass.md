# 2026-09-22-census-execution-status-cannot-claim-a-pass — Test-coverage census stops publishing a pass it never observed

## Release ID

`2026-09-22-census-execution-status-cannot-claim-a-pass`

## Status

`candidate`

## Plain-English Summary

The repository keeps a census of which Jest suites CI actually runs. Alongside the per-directory
counts it publishes a per-file row, and that row carried three fields whose names promise that
something ran the file: `loaded`, `run` and `green`.

None of them was measured. `run` and `green` were each assigned the same value as `covered` — three
field names carrying one fact — and `loaded` was the literal `true` for every file. `covered` means
only "a GitHub workflow reaches a command that names this file". So `green: true` meant a workflow
command reaches the file, not that the file passed, and **78 files were published green having never
been executed**. The census executes nothing: it reads workflow files and returns over 2,363 test
files in about four seconds.

That matters because these rows are the queue the next triage draw is taken from, and the
instructions for that draw warn that a file which was never executed must not appear as green. An
agent that trusted the field would skip the running step, because the field already said green.

After this change the census cannot claim a pass for anything:

- **`green` is `"unknown"` for every file, with no exception.** The census holds an execution outcome
  for none of them, so it reports the refusal rather than inheriting a reachability fact.
- **`run` keeps the one execution fact reachability does settle** — a file no reachable command
  selects cannot have executed in CI, so `false` there is true — and is `"unknown"` otherwise,
  because selection is not execution.
- **`loaded` is renamed to `enumerated`.** Unlike the other two it had a real measurement underneath
  (the census did walk the tree and find the file), so it is renamed to what it measures rather than
  re-typed. The old key is gone rather than kept alongside the new one.

No count moves and no coverage decision changes. What changes is that the artifact no longer answers
a question it never asked.

## Layer Impact

**Release lane: `internal-admin`.** This is AbarVa-only repository quality tooling. It ships no
client-facing capability, touches no tenant data and is not feature-gated, so none of
`global-control-lane`, `client-data-lane`, `public-demo` or `experimental` applies.

- **Layer 4 — products:** none. No product surface, route, read path or rendered output is touched.
- **Test and release tooling:** `scripts/quality/test-ci-coverage-census.mjs` and the committed
  artifact `docs/architecture/test-ci-coverage-census.json` it writes. The census remains a
  measurement, not a gate: it still always exits 0 on the counts path, and its `--check` shape gate
  is unchanged and still passes.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes — repository quality tooling only
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/quality/test-ci-coverage-census.mjs` — per-file status fields made unable to imply an
  execution the census never performs; the published `method` note rewritten to say so.
- `src/__tests__/behaviors/test-ci-coverage-census.test.ts` — three new cases; the existing per-file
  status case updated because it pinned the defect as the contract.
- `docs/architecture/test-ci-coverage-census.json` — regenerated with
  `node scripts/quality/test-ci-coverage-census.mjs --write`.

## QA / Validation

**Premise re-verified on `origin/main` `06750c8e998e76a467f57f27c3caef330cd4dc23` by running the
census, not by reading it.** Of 168 `governedRiskFiles` rows, **168 had `run === green === covered`**,
`loaded` was false on **zero** rows, **78 rows carried `green: true`**, **zero** rows carried green
true with covered false, and `buildCensus` returned in **4.4 seconds** having executed nothing.

**Independent check on whether the field is wrong today, not merely unable to be right.** All 78
files the census published as green were listed and the **38 that are not integration suites were
executed**: `38 passed, 301 tests passed, 0 failed`. The remaining 40 are `src/__tests__/integration`,
which fail locally on placeholder data-plane credentials, so a local red there would say nothing
about CI and none is claimed. **So the census is not currently wrong about any of these files.** The
defect is that it *could not have been* wrong, which is what a run-status field exists to be.

**Red first, with the final test code, against the unchanged control** (implementation SHA-256
`75b80524055971ffd18b2cd31c8bf34e6a96054715c640afd478dc31c9922f63`): **4 failed, 37 passed, 41
total** — the three new cases and the one updated case, and no others.

**Clean baseline, same 29-file scope, same invocation both times** (every behavior suite naming the
census or a CI-coverage assertion):

| | Test Suites | Tests |
|---|---|---|
| Before (`06750c8e9`, unmodified) | 29 passed | **0 failed**, 167 passed, 167 total |
| After | 29 passed | **0 failed**, 170 passed, 170 total |

The +3 are the new cases. Nothing was deleted, quarantined, weakened or skipped.

**6 mutations, 6 caught, 0 escapes.** Each was applied to the real script, run, and reverted;
implementation SHA-256 confirmed byte-identical (`7b16413f35469a9163b166bc62a4e3a92bdbfdae159a05a09548a242b50b685d`)
after every one. The test fixture copies the real script at test time, so a mutation of the script is
a mutation of what the suite runs.

| # | Mutation | Result |
|---|---|---|
| M1 | `green: EXECUTION_UNKNOWN` → `green: result.covered` (the original defect, restored) | 3 failed — caught |
| M2 | `run: result.covered ? EXECUTION_UNKNOWN : false` → `run: result.covered` | 3 failed — caught |
| M3 | `const EXECUTION_UNKNOWN = "unknown"` → `= true` | 3 failed — caught |
| M4 | `enumerated: true` → `loaded: true` | 3 failed — caught |
| M5 | `green: EXECUTION_UNKNOWN` → `green: result.collected` | 3 failed — caught |
| M6 | `run: result.covered ? EXECUTION_UNKNOWN : false` → `run: EXECUTION_UNKNOWN` (drops the one true branch) | 2 failed — caught |

**The fail-closed control is proved against a file that genuinely cannot pass, established by a real
process rather than asserted.** The fixture's covered suite throws at module scope above its only
`it`, and the throwing statement is run on its own through `node --input-type=module -e` inside the
case, which exits non-zero. Establishing that with the census would have reproduced the defect inside
its own test — a claim of execution nothing executed. The census still reaches the file, still calls
it `covered: true`, and still refuses to call it green.

**Regenerated artifact**, verified by reading it back: 168 rows; `green` takes exactly one value,
`"unknown"`; `run` is `"unknown"` on 78 rows and `false` on 90; no row carries a `loaded` key;
`enumerated` is `true` on every row.

- `node scripts/quality/test-ci-coverage-census.mjs --check` — exit **0**; `census drift: committed
  census matches this run`, `census shape: coverage shape matches the committed census`.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` after deleting
  `tsconfig.tsbuildinfo` — **exit 0**, judged on the exit code. An earlier run of this same command
  exited **2** with three real errors introduced by this change, and they were fixed rather than
  filtered.
- `npx eslint` on both changed source files — exit 0.

`src/__tests__/behaviors` is fully covered in the census by `coverage:behavior-gate`, so this control
runs in CI rather than only locally.

## Rollout Plan

Merge to `main`. The repo-owned ACA main deploy workflow will build and deploy the merge commit as it
does for any merge, but nothing in this change reaches the runtime: no product code, route, prompt,
env var, flag or image behaviour is touched.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged by this release.
- Shared runtime mutators: none. No `az` command is run by this change.
- Approved image digest: not set by this release; the deploy workflow resolves it.
- ACA runtime invariant: to be read from the carrying run's own `Verify ACA runtime invariant` step
  after merge, and recorded in the register.
- Worker image invariant: unchanged; no worker job is touched.
- Feature/env flag update path: none.
- Live signed-in proof required: **no.** No product code changed and no rendered output moves.

## Rollback Plan

Revert the single squash commit. There is no migration, no data write and no runtime state, so the
revert is complete on merge. If only the artifact needs restoring, re-run
`node scripts/quality/test-ci-coverage-census.mjs --write` on the reverted script.

## Audit Evidence

- The PR and its checks.
- The before/after and mutation tables above, each measured over the stated scope with the stated
  invocation.
- `docs/architecture/test-ci-coverage-census.json` — the regenerated artifact, readable directly.
- `src/__tests__/behaviors/test-ci-coverage-census.test.ts` — the three new cases, which fail against
  the previous script.

## Known Gaps

- **The census still cannot report a covered-but-failing file — it now says so instead of guessing.**
  Making `green` a real run status would require the census to execute 2,363 suites, which is a
  different tool from a four-second reachability measurement. `"unknown"` is an honest refusal, not a
  measurement, and a reader who needs the answer must still run the files. The instructions for the
  next triage draw already say so; this change makes the artifact agree with them.
- **`collected` is deliberately not renamed.** It is the one remaining field whose name comes from
  runner vocabulary, and it was left because "collected" means path selection in Jest's own terms,
  which is exactly what the census measures. Named here so the next reader knows it was considered
  rather than missed.
- **`enumerated` is still the literal `true` on every row.** That is now a true statement — the
  census did find each file — but the field carries no information, and a future reader may
  reasonably decide a constant does not earn a place in the artifact. It is kept because two
  consecutive triage draws were blocked for want of this per-file grain and removing part of it
  returns them toward that state.
- **The drift line remains reported and never enforced**, so a stale committed artifact still fails
  nothing. That is a separate open item and is not changed here.
- No signed-in acceptance is owed.
