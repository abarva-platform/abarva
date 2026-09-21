# 2026-09-21-t472-stale-suite-triage — Second draw of unrun test suites, triaged by running them

## Release ID

`2026-09-21-t472-stale-suite-triage`

## Status

`candidate`

## Plain-English Summary

The repository holds test suites that no CI workflow ever runs. A routine of
drawing a batch of them, running each one, and recording a verdict per file has
been running for a few days; this is the second batch.

Sixteen files were drawn and every one of them was executed before any judgement
was written about it. The headline result contradicts the batch's own framing:
**eleven of the sixteen are passing**. They are not stale, broken, or abandoned
code — they are current contracts that simply nothing runs. Five are failing,
and the failures were read rather than assumed: four are expectations that
drifted behind a deliberate product change, and one is a test that is correct
and has caught real behavior on a customer-facing surface.

This change records those sixteen verdicts in a machine-readable file and adds a
control that fails if a verdict is dropped, if a named file disappears, or — the
case that matters most — if a failing suite is quietly relabelled as safe to
turn on.

**No suite under test was edited, wired, deleted, or made to pass.** This change
triages; a separate change will act on each verdict.

## Layer Impact

Release lane: `internal-admin`.

None. Nothing in layers 1–4 of the data operating model is touched: no intake
tab, no source adapter, no canonical object, and no product surface. The two
files added are a documentation artifact and a test that reads it.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes — engineering quality tooling
- Public/demo only: no
- Feature flag: none

## Changes Included

- `docs/architecture/t472-stale-suite-triage.json` (new) — the verdict record:
  sixteen suites, each with its measured run counts, the evidence behind its
  verdict, and the follow-on item that owns it.
- `src/__tests__/behaviors/t472-stale-suite-triage-record.test.ts` (new) — the
  control over that record.
- This release record.

## QA / Validation

**Every file was run before it was judged.** Two batches, both on
`989db2363c54d3e69ab6aff736a1fa96bde95b8f`:

| batch | suites | failing suites | tests | failing | passing |
|---|---|---|---|---|---|
| the fourteen named at directory grain | 14 | 3 | 131 | 8 | 123 |
| the two resolved by the census's per-file mode | 2 | 2 | 83 | 5 | 78 |

`--runTestsByPath` was used rather than a bare pattern because four of the
sixteen paths contain bracketed route segments; a bare jest pattern is a regex,
a bracketed segment is a character class, and such a run matches nothing while
reporting a clean slate.

**Green was not accepted as evidence on its own.** One of the two data-plane
client families resolves a failed read to a null that a caller reads back as
"no rows", so a suite behind it can pass *because* its read failed. The eleven
passing suites were therefore re-run with that client made loud: **11 passed,
119 tests, identical to the unprobed run — none of them reaches it unstubbed.**

The probe was proved able to fire before its result was trusted. A throwaway
suite that reaches the swallowing client directly passes without the probe
(reproducing the swallow) and fails with it. Both runs were performed; the
throwaway suite was deleted.

**Red first, then the record.** The control was written and run before the
record existed: 2 failing / 0 passing. With the record in place: 2 passing / 0
failing.

**Ten mutations, ten caught, no escapes.** Each was applied to the committed
record and the control re-run: a dropped suite row; a failing suite relabelled
`wire_into_ci`; a passing suite promoted with its probe result erased; a `green`
flag set true while its failure count stayed non-zero; the per-file-mode answer
flipped; the probe's negative control marked unable to fail; a named path
pointed at a file that does not exist; a batch total nudged by one; a file under
test claimed as a write; and the probe count decoupled from the number of
passing suites.

**Baseline over the same scope, both sides at the same base:** clean 92 suites /
785 tests / 0 failing, branch 93 / 787 / 0 failing. The two added tests are the
whole difference.

The new control is reached by CI rather than merely present: `coverage-threshold`
runs `npm run coverage:behavior-gate`, which runs the directory it lives in. That
gate was run locally and passed — 787 tests, exit 0, coverage above every
threshold.

`tsc --noEmit --pretty false` exit 0 (exit code judged, not grepped),
`eslint` exit 0, `release-check` exit 0.

## Rollout Plan

Merge to `main`. The repo-owned deploy workflow will build and deploy as usual.
There is no runtime rollout: no file under `src/` outside the test directory
changes, and the artifact is read only by its own control.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged
- Shared runtime mutators: none — no `az` command is run by this change
- Approved image digest: n/a, no runtime behavior changes
- ACA runtime invariant: asserted after merge from the deploy run's own proof
  artifact, as for any merge
- Worker image invariant: unchanged
- Feature/env flag update path: none
- Live signed-in proof required: **no**, and none is claimed. No client-visible
  surface can reach either added file.

## Rollback Plan

Revert the commit. Two added files, nothing else references them, no migration,
no data, no flag.

## Audit Evidence

Inspect, in this order:

- the pull request diff — two added files and this record, nothing else;
- `docs/architecture/t472-stale-suite-triage.json` itself, which carries the
  per-suite run counts, the evidence behind each verdict, and the follow-on item
  that owns it;
- the two jest JSON outputs the record names, `/tmp/t472-jest-current.json` and
  `/tmp/t472-jest-extra.json`, whose totals the control reconciles against the
  per-suite rows;
- the `coverage-threshold` workflow run on the merge commit, whose
  `npm run coverage:behavior-gate` step is what actually executes the new
  control — the point being that the control is reached by CI, not merely
  present in the tree;
- the deploy run's own immutable runtime-invariant proof artifact, for the
  ordinary merge path.

## Known Gaps

- **Eleven passing suites still run in no workflow.** This change records that
  they are safe to turn on; it does not turn them on. That edits CI and belongs
  in its own reviewable change (T-516). Until it lands, the finding is written
  down and not yet acted on.
- **One failing suite is reporting real behavior, and what to do about it is a
  product decision.** Long advisor prose on one surface is truncated mid-argument
  by a shared response budget. The compaction template the suite is named after
  is *not* being applied — that part of the control passes. Whether the budget
  should apply to that surface is not a call this change makes; filed as C-500,
  `decision needed`, with the measurement attached.
- **Four expectation refreshes are recorded and not performed** (T-517, T-518,
  T-519). Each carries its reason so the next change does not re-derive it.
- **A follow-on item's stated blocker is false and was corrected rather than
  worked around.** The measurement tool already resolves unrun files by name;
  what it still lacks is per-file run/pass status. That item should be narrowed
  to the half that is genuinely missing rather than closed.
- No signed-in acceptance is performed, owed, or implied.
