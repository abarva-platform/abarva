# 2026-10-06-moves-authorship-only-gate-alias — A gate criterion reads both spellings its only producer offers

## Release ID

`2026-10-06-moves-authorship-only-gate-alias`

## Status

`candidate`

## Plain-English Summary

A Move leaves a phase by satisfying that phase's exit criteria. Most criteria are met by a document
the Move generates, or by the answers captured on the phase screens. A small number can be met only
by a record a person deliberately authors and signs off — a funding approval, an alignment record,
a handoff plan. Those are governance records, not documents a model should write, so nothing in the
generation set produces them and the capture screens deliberately cannot produce them either. The
only way one exists is the explicit accept-and-sign-off path.

That path keeps its own list of record types it will accept, and it tells the assistant which type
key to use. For the alignment record it offers two interchangeable spellings. The gate criterion
read only one of them.

So an authorized person could accept and sign off a real alignment record and have the criterion
named after it stay unmet — the outcome decided by which of two keys the assistant happened to pick
on that call. There was no second route: this criterion has no capture-text fallback, so a record
under the unread spelling was simply invisible. Because the criterion is advisory rather than
blocking, it failed quietly, as a row in the phase's gate panel that could never be satisfied.

This change makes the criterion read both spellings, and adds the guard that was missing: every
record type the accept-and-sign-off path will store must either reach a gate criterion or be named,
with a reason, as a working artifact nothing gates on. A spelling that reaches neither is a signed
record the product can never read.

## Layer Impact

Lane: `global-control-lane`.

- **Layer 4 (Products — Moves).** One phase-exit criterion accepts one additional deliverable type
  key. No criterion is added, removed, or re-graded; no severity changes; no phase generation set
  changes; no capture contract changes.
- **Layers 1–3 — no impact.** No schema, adapter, canonical object, or tenant data path is touched.
  The criterion reads the same table through the same query as before.

## Client Applicability

- All clients: yes. The criterion is evaluated for every Move at the affected phase.
- Specific clients: none singled out.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. This is a widening of what an existing criterion accepts, not new behavior
  behind a gate of its own. A Move with no such record is unaffected — the criterion reports unmet
  exactly as before.

## Changes Included

- `src/lib/programs/governance.ts` — the `sponsor_alignment_confirmed` criterion accepts
  `sponsor_alignment` alongside `stakeholder_alignment`, with the mechanism recorded at the call
  site. Same class as the `tower_metric_plan_drafted` fix already commented a few lines below it.
- `src/lib/programs/__tests__/authorship-only-gate-criterion-reachability.test.ts` — new, 9 cases.
  The complement of the existing `phase-gate-deliverable-reachability.test.ts`: that suite joins
  HARD, deliverable-only criteria against what a phase BUILDS, and structurally cannot see these
  three — they are advisory, and no generation set produces any key they accept.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

## QA / Validation

- **PASS** — `npx jest src/lib/programs/__tests__` — 126 suites, 1281 tests.
- **PASS** — `npx jest src/app/api/v1/programs src/lib/agent/tools/program` — 30 suites, 208 tests.
  These are the gate evaluator's route and tool callers; none changed behavior.
- **PASS** — the new suite, 9 cases: each pinned criterion is still declared advisory at its phase;
  each accepted spelling still appears in the evaluator; no phase generation set on any route
  produces any of them, which is this suite's whole premise; every spelling a criterion accepts is
  one the accept-and-sign-off path will actually store; every type key that path allows either
  reaches the evaluator or is named as a working artifact; that justification list contains nothing
  the evaluator does read; and — driving the real evaluator, not the declaration — a signed authored
  record satisfies the alignment criterion under either spelling, is still reported unmet with no
  record or with one not signed off, and the other two criteria are each satisfiable too.
- **PASS** — baseline check: with the one-line evaluator change reverted and the suite unchanged,
  3 of 9 cases fail, including the behavioral one. The suite is not describing the fix it ships
  with.
- **PASS** — mutation check, 8 of 8 killed off a green baseline: drop the added spelling (3
  failures); accept a present-but-unsigned record instead of a signed one (1); drop one accepted
  spelling from each of the other two criteria (3 and 3); delete one entry from the
  nothing-gates-on-this list (1); add to that list a key the evaluator does read (1); re-grade the
  criterion as blocking (1); add one of these keys to a phase generation set, contradicting the
  premise (1).
- **PASS** — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`, exit 0.
- **PASS** — `npx eslint` on both changed files, exit 0.
- **NOT RUN** — any signed-in walk. This criterion is reached by advancing a real Move off the
  private data plane, which a development machine cannot do; it is not live-proven until that walk.
- Coverage census regenerated: covered test files 2596 → 2599 with uncovered test files unchanged at
  164, which is the evidence the new suite runs in CI rather than only locally. One of the three is
  this change's suite. Measured in isolation on the unmodified base, regenerating already moved test
  files 2760 → 2762, so the committed census was stale by two files before this branch existed; the
  census stores counts and no file list, so those two cannot be named from the artifact. Stated
  rather than claimed. The fence census is unchanged — no tenant-scoped file is added.

## Rollout Plan

Merge to main. The repo-owned ACA main deploy workflow builds and deploys the image. No migration,
no flag change, no Azure command, no data backfill. Any Move that already carries a signed record
under the previously unread spelling has its criterion satisfied on the next evaluation, with no
write of any kind.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` — the only path that may shift
  shared web traffic.
- Shared runtime mutators: none in this change.
- Approved image digest: assigned by the main deploy workflow on merge; not pinned by this record.
- ACA runtime invariant: unchanged by this record; the merge deploy's own proof applies.
- Worker image invariant: unaffected — no worker job, image, or queue behavior changes.
- Feature/env flag update path: not used. No flag, env var, or secret is added or changed.
- Live signed-in proof required: **yes** — advancing a Move at the affected phase with such a record
  on file. Until that walk this record is `candidate`, not `live-proven`.

## Rollback Plan

Revert the merge commit. The change is one widened key list plus one test file; reverting restores
the previous evaluation exactly. Nothing is migrated, nothing is written, and no record created
while this is live becomes unreadable afterward — a record under the previously unread spelling
simply goes back to being invisible to the criterion, which is the state it was in before.

## Audit Evidence

- The PR for this branch and its CI run.
- The baseline check and the mutation table above, reproducible against the branch head.
- `docs/architecture/test-ci-coverage-census.json` — the covered/uncovered delta.
- `.github/workflows/ai-surface-control-catalog.yml`, step `Exercise the Programs unit suites` — the
  directory sweep that reaches the new suite, in a required status check.

## Known Gaps

- **Six allowed record types reach no gate criterion, by design, and that is now asserted rather
  than proven.** The new guard requires each to be named with a reason, which makes the claim
  explicit and reviewable; it does not independently verify that nothing should gate on them. Each
  reason is a product judgment recorded in the suite, not a measurement.
- **The guard proves darkness, never wiring.** It asks whether a type key appears as a quoted
  literal in the evaluator. A key that does not appear definitely cannot be read; a key that does
  appear is only plausibly read, since the occurrence could be unrelated. The behavioral cases cover
  the three criteria pinned here; the same source-text probe used by the existing sibling suite
  carries the same limitation, and is why the behavioral cases exist.
- **The criterion→key join is still not declared anywhere.** Those lists are inline literals inside
  the evaluator's criteria switch, which is why both this suite and its sibling write their
  expectations out as literals and assert the spellings still appear. Lifting the join into a
  declared source the evaluator consumes would let a guard enumerate it rather than restate it.
  That is a larger change to a shared file and is not taken here.
- **One criterion case is declared by no gate rule.** `current_state_summary_drafted` is implemented
  in the evaluator's switch but named in no phase's criteria list, so it is never evaluated. Left
  alone: removing it is a separate judgment about whether the criterion is wanted.
- **No signed-in proof.** See QA above.
