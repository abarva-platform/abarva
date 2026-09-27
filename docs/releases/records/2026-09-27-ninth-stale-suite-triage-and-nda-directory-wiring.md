# 2026-09-27-ninth-stale-suite-triage-and-nda-directory-wiring — Ninth stale-suite triage, and the one directory it could wire

## Release ID

`2026-09-27-ninth-stale-suite-triage-and-nda-directory-wiring`

## Status

`candidate`

## Plain-English Summary

The repository keeps a census of which test files any CI job actually runs, and a ranking that
answers "which unrun suites should be triaged next". Item T-771 named twenty files from that
ranking. Running all twenty on the current tip turned up two things the item did not predict.

First, **eleven of the twenty had already been judged.** Each of the eleven — every one of the
governed-risk-banded files the item named — already carries an explicit verdict in a repo-owned
triage record, with a written reason and a named owning item, recorded before T-771 was filed. The
draw could not have known, because the ranking's only input is a count of "untriaged" files, and
that predicate means *not run by CI and not on a quarantine list*. It never consults triage records.
So a file with a verdict, a reason and an owner is still counted untriaged and is still ranked, and
the ranking keeps re-offering judged work. Measured on this base: 71 of the 304 files the census
calls untriaged already carry a verdict. The repository already has a script that reports exactly
that number — and it exits 0 whatever it finds, so nothing objects. Filed as a follow-on item.

Second, **one of those eleven verdicts had a reason that was already discharged.** A suite covering
a governed supplier-agreement authority read was recorded red in an earlier triage: one exhaustive
expectation had not been widened when the module gained a signature-evidence field group. That
triage deliberately refused to repair it in place and handed the widening to a later item, with the
instruction not to reach green by loosening the assertion. That item did widen it, correctly, and
then did not wire the suite — so a green suite covering code two live product paths import has run
nowhere since. This change wires it, as a directory, and adds a control that holds the wiring in
place and fails if the widened assertion is ever narrowed back.

The remaining fourteen files are the genuinely untriaged half, and they are all triaged here with
verdicts and reasons. Their directory is **not** wired, with a reason that is now machine-enforced
rather than narrated: two of the fourteen are red, and five of them confine a source-text scanner to
one block, which a control merged earlier today refuses to let any CI command reach. Twelve green
suites holding 286 cases stay dark for that reason, and the successor item to free them is filed.

## Layer Impact

Release lane: **`global-control-lane`** — it changes shared repository control behaviour, namely
which test directory a pull-request job executes, for every client at once and behind no feature
gate. It is lane-shared rather than `client-data-lane` because no tenant schema, seed, ingestion,
retrieval or private data-plane path is touched, and not `experimental` because the wiring and its
control are on by default.

- **No product layer changes.** No canonical model, adapter, intake, loader, read model, route or
  product surface is touched. No tenant data is read or written.
- **Test and CI tooling only**: one workflow step, one ratchet baseline line, one triage record, one
  behavioural control, and the regenerated census snapshot.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes — CI coverage and triage bookkeeping
- Public/demo only: no
- Feature flag: none

## Changes Included

- `docs/architecture/t771-stale-suite-triage.json` — new. 25 rows, each executed on its own on the
  base SHA, with `green`, `totalTests`, `failedTests`, an explicit `sourceTextScanner` and
  `textIsTheSubject` judgement, a verdict and a rationale. Records the filing correction, the census
  blind spot with its measured numbers, the discharged hold with its evidence, and the two held
  directories with their reasons.
- `.github/workflows/unit-suites.yml` — one step added, naming `src/lib/source/nda/__tests__` as a
  DIRECTORY, with the reason for the wiring in a comment above it.
- `src/__tests__/behaviors/product-directory-ci-coverage.baseline.json` — that directory's line
  removed in the same change; the ratchet asserts set equality in both directions.
- `src/__tests__/behaviors/t771-nda-suite-wiring.test.ts` — new control, 31 cases.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

## QA / Validation

**Failing test first, then the fix, then the fix broken deliberately.**

- The new control was written and run **before** the workflow step and baseline edit existed:
  **4 failing of 31**. After the wiring: **31 passed, 0 failing**.
- **Four mutations, four caught, and each mutation was verified to be a real edit before its effect
  was believed** — a no-op mutation reads exactly like a caught one. Each fired the case intended
  and no other:
  - remove the wiring step entirely (1,092 bytes) → 3 failures: the unrun case, the
    directory-naming case, and the step-worth measurement.
  - re-add the directory to the dark baseline (152 → 153 rows) → 1 failure, the baseline case.
  - name the FILE instead of the directory → 1 failure, the directory-naming case. This is the
    mutation that matters most: "reached" alone would have passed.
  - narrow the widened expectation back to a partial match → 1 failure, the widening case. Every
    other case stayed green, which is the point of having it.
  - tree restored after each: **31 passed**.

**Same scope, measured from a separate clean worktree checked out at the base SHA, not from a
stash.** `npx jest src/__tests__/behaviors`:

| | suites | tests | failing |
|---|---|---|---|
| base `83b3a384da` | 151 | 1627 | 0 |
| this branch | 152 | 1658 | 0 |

The delta is exactly the new control: +1 suite, +31 tests. No pre-existing failure is claimed as
caused or fixed here.

**Every one of the 25 judged files was executed individually** with
`npx jest --runTestsByPath <path>` on the base SHA. 20 green, 5 red. The counts in the record are
counts of suites RUN, never counts read from the census — "not reached by CI" is not the claim
"fails", and three of the five reds had never been reported by anything.

**Census deltas** (`npm run audit:test-ci-coverage:write`), which are the measurement behind the
first finding: `coveredTestFiles` 2170 → 2172, `uncoveredTestFiles` 356 → 355,
`directoriesFullyCovered` 310 → 311, `directoriesUncovered` 158 → 157,
`untriagedUnrunTestFiles` 304 → 303, `highGovernedRiskDirectories` 6 → 5. **Twenty-five files were
triaged and the census's untriaged count moved by one.** That is not a defect in this change; it is
the blind spot, stated as a number.

**Gates, all exit 0:** `audit:test-ci-coverage:check`, `audit:triage-record-reconciliation`,
`audit:named-suite-requiredness`, `test:integration:ci-visibility`. The control merged earlier today
that refuses a CI command reaching a declared source-text scanner still passes (7 of 7) with the
five new scanner declarations in this record, because none of the five is reached by any command.

**Typecheck** `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` with
`tsconfig.tsbuildinfo` removed first: **exit 0**, judged on the exit code rather than on a grep, and
0 `error TS` lines. **Scoped ESLint on the new file: exit 0.**

Nothing was weakened, de-required, skipped, quarantined or deleted to reach green. No failing test
was changed. The record edits none of the 25 files it judges, and its `forbiddenEdits` field states
that constraint.

## Rollout Plan

Merge to `main` via squash. The repo-owned ACA main deploy workflow runs on merge. Nothing here
changes runtime behaviour: the new workflow step runs an existing test suite, and the census
snapshot, triage record and baseline are build-time artifacts. No image, flag, env var, scale or
traffic change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged.
- Shared runtime mutators: none. This change mutates no Container App, revision, traffic weight or
  template.
- Approved image digest: not applicable — no runtime image change is requested by this release.
- ACA runtime invariant: to be captured after merge from the deploy run at or after the merge SHA.
- Worker image invariant: unchanged.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: **no.** Nothing user-visible changes; the evidence for this release
  is CI-shaped and is listed above in full.

## Rollback Plan

Revert the squash commit. The workflow step, the baseline line and the census snapshot go back
together, which is what keeps the ratchet's set equality true in both directions. No migration, no
data change, nothing to unwind outside git.

## Audit Evidence

- The pull request and its check run.
- `docs/architecture/t771-stale-suite-triage.json` — per-file evidence for all 25 judgements, and
  the three findings with the measurements behind each.
- The before/after behaviours numbers above, reproducible by checking out the base SHA in a separate
  worktree and running the same command.
- `src/__tests__/behaviors/t771-nda-suite-wiring.test.ts` — the wiring is answered through the
  census's own four-hop resolver, never by grepping a workflow for a string. Three backlog items
  were filed false on that grep.

## Known Gaps

- The census's untriaged predicate still ignores triage records, so 70 files carry a verdict and are
  ranked anyway. The reconciliation script measures it and exits 0. Filed as a follow-on item; not
  fixed here, because changing what the ranking is drawn from is a larger change than a triage.
- `src/__tests__/integration/ops` stays unwired: 12 of 14 green with 286 cases, held by 2 reds and 5
  confined source-text scanners. Both reds are diagnosed to a single cause each in the record, and
  neither is repaired here — a triage may not edit a file it judges. Filed as a follow-on item.
- Six partially covered directories in this draw cannot be wired on this item's evidence, because a
  directory sweep would reach siblings the draw did not judge and two of them hold a file another
  open item owns. Recorded, not attempted.
- One of the five reds is a live governance violation rather than a stale expectation: a
  control-plane literal-leak prohibition reports five occurrences across three modules and runs in
  no job. It already has a verdict and an owning item; this release reports the re-measurement and
  does not take it.
