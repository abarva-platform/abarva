# 2026-09-28-t774-ops-scanner-rewrite — Three ops suites asked of the script instead of of its bytes

## Release ID

`2026-09-28-t774-ops-scanner-rewrite`

## Status

`candidate`

## Plain-English Summary

Three test suites checked three operator scripts by reading their source code and looking for
words in it. One asserted that the string `--json` appeared somewhere in a Python file. Another
asserted that no line mentioning `subprocess.run` also mentioned a destructive git verb. A third
matched import lines against a list of allowed module names.

None of those questions is about text. Each of the three subjects is an executable script with
documented exit codes and a `--json` output mode, so each question is answerable by running it —
and answering it by running it catches things the word search cannot see.

One of the suites went further and tested a *copy* of the script it was supposed to be testing: a
TypeScript re-implementation of a Python validator, written in the test file. That copy had already
drifted from the original. It accepted a pull-request reference as "any digits", which matches the
digits inside a commit hash; the real script requires `#123`, `PR 123` or `pull request 123`. So a
report the test called valid is rejected by the thing that actually runs, and no case in the file
could see it.

All the word searches are deleted rather than tightened — a narrower search over the same text is
the same problem with a longer fuse. The replacements run each script over fixtures in a throwaway
directory and check what it prints, what it returns, and what it does.

This is test-only work. No product code changed, and the three scripts are byte-identical to what
was there before.

## Layer Impact

**Release lane: `internal-admin`.** This is AbarVa-only engineering tooling. It ships no
client-visible behaviour, no data-plane change and no public or demo surface.

- **Layer 4 (products):** none. No product file, route, component, prompt or read model is touched.
- **Test/tooling:** three suites under `src/__tests__/integration/ops` rewritten; one new operator
  script, `scripts/integration/observe_python_run.py`, used only by tests; one new triage record.

## Client Applicability

- All clients: no change
- Specific clients: none
- Internal only: yes — engineering test scope only
- Public/demo only: no
- Feature flag: none

## Changes Included

- `src/__tests__/integration/ops/demo-pack-report-validator.test.ts` — rewritten. 14 cases → 28.
- `src/__tests__/integration/ops/duplicate-slice-preflight.test.ts` — one case replaced; dead import
  island removed. 11 cases → 11.
- `src/__tests__/integration/ops/worktree-cleanup-report.test.ts` — four-case `file contract` block
  replaced by four behavioural cases. 12 cases → 12.
- `scripts/integration/observe_python_run.py` — new. Runs a Python script and reports the top-level
  modules the run actually added that are not in `sys.stdlib_module_names`, with the socket entry
  points replaced by recorders that refuse the call.
- `docs/architecture/t774-ops-scanner-rewrite-triage.json` — new triage record. Declares the three
  paths `sourceTextScanner: false` so the scanner-wiring control resolves their classification from
  the latest record rather than from the historical draw.
- `.github/workflows/integration-suites.yml` — the three suites are wired, **as named file paths in
  their own step, never as the directory**. See *A rule collision this change had to resolve*.
- `docs/architecture/test-ci-coverage-census.json` — refreshed. The directory moves `uncovered` to
  `partial`; covered test files 2181 → 2184, uncovered 347 → 344.
- `src/__tests__/behaviors/t771-nda-suite-wiring.test.ts` — an existing control, lowered in the same
  commit because wiring these three turned it red. See *A control that inverted*.

## A rule collision this change had to resolve

The owning item says the wiring unit is the **directory**, so this change planned to wire nothing.
A repo-owned gate disagreed and failed the pull request: `check-integration-ci-visibility.mjs`
requires a changed integration suite to have an executable CI owner, and it named exactly these
three paths.

Both rules are right and they cannot both be satisfied by any per-file slice of this item — which
nobody had discovered because nobody had sliced it before. The resolution is to wire the three by
**named file path**, the form this workflow's own header sanctions, and a different operation from
the one the item forbids: a colliding *directory* is silent and drags in every sibling written
afterwards, while a named *file* is loud and enumerated. Naming the directory here would also
select the two red suites and the two remaining text-searching suites, and the scanner-wiring
control would correctly go red.

A rewrite nobody runs proves nothing, so the gate is right, and the item's sentence was written for
the closing change rather than for a slice.

## A control that inverted

Wiring the three turned `t771-nda-suite-wiring.test.ts` red — **3 failed of 32**. That control
asserts every path its draw judged and did not wire is *still unreached*, so it fails the moment a
later item legitimately wires one. It went red because the corpus improved, which is the wrong
direction for a gate to point.

It is lowered in the same commit and **not** by exempting three paths. Its unreached list now
subtracts any path a *strictly later* triage record declares wired, resolved by timestamp — the
same supersession rule the scanner-wiring control already documents, and for the same reason. The
freed set is read from the records, so a later item cannot free a path by editing the control.

The subtraction is not a weakening, and that is asserted rather than claimed. A new case makes each
freed path pay for its exemption twice: a later record must **name** it, and a command in a required
job must actually **select** it. Proven by deleting the workflow step while leaving the record
claiming the wiring — exactly that case fails, and nothing else does. The partition case that
pinned three fixed counts now asserts conserved arithmetic instead, so the next item to wire one of
these paths reads a number rather than lowering one.

No script under test was modified. Mutations used to prove the suites were applied to working
copies and reverted; `git diff` over those three scripts is empty.

## QA / Validation

Clean baseline over the same scope, taken from a worktree cut at `origin/main` `ec4a2c28c9`:

| scope | before | after |
|---|---|---|
| `src/__tests__/integration/ops` (14 files) | 379 cases, 12 suites green / 2 red, **30 failing** | 393 cases, 12 green / 2 red, **30 failing** |
| `demo-pack-report-validator.test.ts` | 14 passed, 0 failed | 28 passed, 0 failed |
| `duplicate-slice-preflight.test.ts` | 11 passed, 0 failed | 11 passed, 0 failed |
| `worktree-cleanup-report.test.ts` | 12 passed, 0 failed | 12 passed, 0 failed |

The 30 failing cases are the two suites this change does not touch, failing identically before and
after. **That is a pre-existing count and is not caused here.**

- `npx tsc --noEmit --pretty false` after removing `tsconfig.tsbuildinfo` — **exit 0**, judged on
  the exit code, zero lines of output.
- `npx eslint` over the three changed suites — exit 0.
- `npm run test:behaviors` — 153 suites, **1668 passed / 0 failed** before the wiring; 153 suites,
  **1666 passed / 0 failed** after. The net −2 is exact and accounted for: three per-path cases left
  the unreached list and one exemption case replaced them.
- `node scripts/quality/check-integration-ci-visibility.mjs --base origin/main` — **failed before
  the wiring step, naming all three paths; exit 0 after.**
- `npm run audit:test-ci-coverage:check` — drift reported before the census refresh, exit 0 after.
- `src/__tests__/behaviors/t770-scanner-wiring-refusal.test.ts` — 7 passed before and after. Live
  declared scanners **34 → 31**, measured by re-deriving the set from the records, not asserted;
  floor is 25.
- All 11 triage-record gates — 161 passed. `npm run audit:triage-record-reconciliation` — exit 0.

**Thirteen mutations, each asserted to have changed the file before the suite ran, and each also
run against the deleted code restored from a snapshot:**

| subject | mutation | new suite | deleted code |
|---|---|---|---|
| report validator | drop a required section | 5 of 28 failed | 0 of 14 |
| report validator | adopt the stale copy's pull-request pattern | 1 of 28 failed | 0 of 14 |
| report validator | promote the short-report warning to an error | 5 of 28 failed | 0 of 14 |
| report validator | append to the report after reading it | 1 of 28 failed | 0 of 14 |
| report validator | promote a field warning to an error | 1 of 28 failed | 0 of 14 |
| report validator | report only the first missing section | 1 of 28 failed | 0 of 14 |
| slice preflight | third-party module loaded with no import statement | 1 of 11 failed | 0 of 11 |
| slice preflight | network call through an aliased socket | 1 of 11 failed | 0 of 11 |
| slice preflight | the same load on one branch only | 1 of 11 failed | 0 of 11 |
| cleanup report | destructive git verb assembled in a variable | 1 of 12 failed | 0 of 12 |
| cleanup report | third-party module loaded with no import statement | 1 of 12 failed | 0 of 12 |
| cleanup report | broken shebang | 2 of 12 failed | 1 of 12 |
| cleanup report | destructive git verb as a one-line literal | 1 of 12 failed | 1 of 12 |

The new suites catch **13 of 13**. The deleted code catches **2 of 13**, and both of those are the
cases written as plain literals on a single line — which is the entire shape a text search can see.

**Two measurement failures are recorded rather than hidden**, because each would have produced a
wrong number:

1. A fourteenth mutation was **refused by its own guard**: the replacement text did not match, so
   the file was unchanged and the run stopped instead of reporting a survivor. It was re-anchored
   and then caught. A no-op mutation reads exactly like a surviving one.
2. The first pass at the cleanup-report table restored the rewritten suite with
   `git checkout -- <path>`. That path was unstaged, so the checkout restored the **old** suite, and
   two rows labelled "new suite" were the old suite run twice — one of them appearing to survive.
   Every row above was re-run with both suites restored from snapshots held outside the working
   tree. The re-measured result is the opposite of the first.

## Rollout Plan

Merge to `main`. No runtime rollout: nothing under `src/` outside `__tests__` changes, no route,
image, flag, environment variable or migration is touched. The repo-owned ACA workflow will build
and deploy the merge commit as it does for every merge; this change cannot alter product behaviour.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unmodified.
- Shared runtime mutators: none. No `az` command is run by or for this change.
- Approved image digest: not applicable — no runtime change is being claimed.
- ACA runtime invariant: recorded in the pulse for the merge SHA. Not a precondition of this change.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: **no**, and none is owed. No product surface is reachable from
  anything changed here.

## Rollback Plan

Revert the squash commit. There is no data, schema or runtime state to unwind: the change is three
test files, one test-only script and one document. Reverting restores the deleted text searches,
which is a loss of assurance rather than a restoration of it.

## Audit Evidence

- The pull request and its checks.
- `docs/architecture/t774-ops-scanner-rewrite-triage.json` — full per-suite rationale, the mutation
  table, the corrected scope count, the measurement correction, and an explicit statement of what
  this record does **not** enforce.
- The three commits on the branch, each carrying its own before/after numbers.

## Known Gaps

- **The directory is still wired into no workflow, and that is deliberate.** The owning backlog
  item makes the wiring unit the whole directory, so wiring these three files individually is
  forbidden by the acceptance. Two of the fourteen files are red and two text-searching suites
  remain; either alone blocks wiring.
- **The owning item cannot be closed by an agent on today's evidence.** One of the two red suites
  turns on a vocabulary decision — a committed data file declares a lifecycle state its own reader
  does not admit, and the data file and the reader shipped in the same commit, so they have never
  agreed. Repairing the data and widening the reader are both coherent; choosing is an owner call
  and the acceptance says not to guess. This is recorded on the item so the next run does not
  rediscover it.
- No gate asserts that a suite declared free of text searching has actually stopped. The evidence
  for that claim is the mutation table above, measured in both directions.
- **A correction to an earlier draft of this record**, kept rather than quietly edited away. It
  claimed the triage record was independently unenforced, because nothing was wired. That was true
  when written and is now false: with the three suites wired, a declared text search that *is*
  reached is a breach. Verified by execution — with the record removed, the scanner-wiring control
  goes 2 failed of 7 and names all three paths together with the exact selecting command; restored,
  7 passed.
