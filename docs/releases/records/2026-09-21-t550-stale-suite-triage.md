# 2026-09-21-t550-stale-suite-triage — Triage draw of twenty unrun test suites

## Release ID

`2026-09-21-t550-stale-suite-triage`

## Status

`candidate`

## Plain-English Summary

The repository has 2,361 Jest test files and CI runs 1,821 of them. The rest sit in
directories no workflow names, so they are neither protecting anything nor telling
anyone they have stopped working. They are being triaged in draws, and this is the
next draw of twenty, taken highest governed-risk band first.

Every one of the twenty was **executed** before a verdict was written for it, in a
single Jest run: 20 suites, 144 tests, 19 suites green and 1 red. Seventeen are
sound tests of real behaviour or view-model output that simply no workflow runs, and
they are recorded as `wire_into_ci` for a later item to turn on. Three are not: they
assert against the raw **text** of a component file rather than against what the
component does, and they are recorded as `rewrite_as_behavior`.

The red one is the clearest illustration of why that distinction matters. It requires
a loading component's source to contain the sentence `Preparing Source command
center.`; that sentence exists nowhere in the application any more, because the
surface now announces itself differently. Editing the expected string would turn the
suite green again and leave behind a check that a code comment could satisfy. That
is the same shape as the gate which, in an earlier incident, went on passing after
the control it guarded had been deleted, because the control's *name* was still
present in the file. So the copy drift is recorded as the symptom and the
byte-matching assertion as the defect.

**Nothing under test was changed by this release.** No suite was edited, wired,
repaired, deleted or made green. This release adds one measurement record and one
guard suite, and hands every drawn file to a named follow-on item.

## Layer Impact

Release lane: `internal-admin`.

No product layer changes. This touches only test/tooling evidence:

- **Layer 4 (Products):** unaffected. No route, component, adapter or query changed.
- **Layer 3 (Canonical model):** unaffected. No schema, migration or read model changed.

## Client Applicability

- All clients: no change
- Specific clients: none
- Internal only: yes — engineering test-coverage evidence
- Public/demo only: no
- Feature flag: none

## Changes Included

- `docs/architecture/t550-stale-suite-triage.json` (new) — the measurement record: per file,
  its governed-risk band, the executed test counts, whether it asserts source text, its
  verdict, the rationale, and the follow-on item that owns it.
- `src/__tests__/behaviors/t550-stale-suite-triage-record.test.ts` (new) — the guard.
- `docs/releases/records/2026-09-21-t550-stale-suite-triage.md` (new) — this record.

## QA / Validation

**The draw was executed, not read.** `npx jest --runTestsByPath <20 paths>` —
20 suites, 19 passed, 1 failed; 144 tests, 143 passed, 1 failed, **0 pending, 0 todo**.
`--runTestsByPath` is required and not a preference: every drawn path contains the
route-group segment `(maestro)`, and a bare Jest pattern is a regular expression in
which those parentheses are a capture group.

**Baseline over the same scope, both sides measured:** clean tree at the same base —
95 suites / 793 tests / 0 failing. With this branch — 96 suites / 803 tests / 0 failing.
The one added suite and its ten tests are the entire difference.

**Falsifiability: 17 deliberate mutations, 17 caught, 0 escapes.** The record was
mutated in a scratch copy and the guard re-run for each; the record was restored
byte-identical afterwards and verified with `diff`. The mutations include the ones
that matter: wiring a source-text scanner into CI, wiring the red suite, claiming
green for a suite that executed zero tests, claiming green while `run` is false,
claiming green alongside a failure, wiring a suite with a skipped case, flipping the
scanner flag off to hide all three, publishing a count that disagrees with its rows,
and adding a judged file to the record's own write list. The first mutation is the
red-first state: a naive draw that marks all twenty `wire_into_ci` fails the guard.

**The census's own status fields were deliberately not trusted**, and the reason is
filed as item T-551. In `buildCensus`, `loaded` is the literal `true` and `run`,
`green` and `covered` are all assigned the same value, so `green` cannot disagree
with `covered` and no file is ever executed to produce it. Measured at this base:
168 of 168 `governedRiskFiles` rows have `run === green === covered`, `loaded` is
`false` nowhere, no row has `green` true with `covered` false, and **78 rows are
published as green having never been run**. Every `green` in this record comes from
the Jest run above instead.

**The swallowing-client probe is recorded as not applicable rather than skipped.**
None of the twenty files references `postgresCompat`, `getPostgres`, `db.query` or an
azure-read path, checked by grep across all twenty, so the read that can be swallowed
into a null is not reachable from this draw.

`NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` — exit 0,
judged by exit code. `npx eslint` on the new suite — exit 0.

## Rollout Plan

Merge to `main`. The repo-owned ACA main deploy workflow will build and deploy the
resulting image as it does for any merge. No runtime behaviour depends on this change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unmodified
- Shared runtime mutators: none; no Azure command is run by this change
- Approved image digest: set by the deploy workflow for the merge SHA
- ACA runtime invariant: asserted by the deploy workflow's own invariant proof artifact
- Worker image invariant: unchanged; no worker job definition is touched
- Feature/env flag update path: none
- Live signed-in proof required: **no** — no file under `src/` outside
  `src/__tests__/behaviors` changes, so no client-visible surface can reach this.

## Rollback Plan

Revert the PR. The three added files are additive and nothing imports them at runtime;
removing them restores the previous state exactly. No migration, no data, no flag.

## Audit Evidence

- The PR and its CI checks
- `docs/architecture/t550-stale-suite-triage.json` — per-file executed counts and verdicts
- `src/__tests__/behaviors/t550-stale-suite-triage-record.test.ts` — the guard, which runs
  in the gated behaviours scope
- The deploy workflow run for the merge SHA and its runtime-invariant proof artifact

## Known Gaps

- **The twenty are triaged, not fixed.** Seventeen still run in no workflow; turning
  them on is item T-552 and edits a workflow file currently held by another item's
  claim. The three source-text scanners are item T-553.
- **The draw is twenty of a larger pool.** 90 untriaged files sit in governed-risk
  directories at this base and 490 across the tree; nine already-triaged files were
  skipped by name.
- **The census status defect (T-551) is filed, not fixed.** Both the script and the
  committed census artifact are named in other items' live claims, so this release
  measures the defect and leaves the repair to its owner.
- No signed-in acceptance was performed, and none is owed for this change.
