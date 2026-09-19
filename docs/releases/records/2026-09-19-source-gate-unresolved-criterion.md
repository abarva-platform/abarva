# 2026-09-19-source-gate-unresolved-criterion — Source stage gate no longer walks past a criterion it cannot resolve

## Release ID

`2026-09-19-source-gate-unresolved-criterion`

## Status

`candidate`

## Plain-English Summary

A sourcing event may only move from one stage to the next when the current
stage's gate criteria are satisfied. Each criterion row carries an identifier,
and the gate looks that identifier up in the canonical criterion catalogue to
learn how severe the criterion is.

When the lookup failed — the identifier is not in the catalogue — the gate read
the missing severity as "not severe" and let the event advance, leaving that
criterion open behind it. The two behaviours were inconsistent within one file:
the same module already refuses to let a person mark an unresolvable criterion
as met, but the stage gate let the event walk past it without anyone marking it
at all.

The gate now treats an unresolvable criterion as a blocker and names the
identifier so the affected row can be found. Waiving it still clears the gate,
and a waiver is recorded with the approver, the time and the written reason, so
no event becomes permanently stuck. For a criterion whose definition does
resolve, nothing changes.

## Layer Impact

Release lane: `global-control-lane` — shared gate behaviour for every client,
not feature-gated and not client-scoped.

- Layer 4 (Products · Source): the stage-advance gate. Both server routes that
  advance a sourcing event evaluate the same contract, so both inherit the
  change. No product read model, projection or rendering changes.
- No change to layers 1–3. No schema, migration, tenant row or loader change.

## Client Applicability

- All clients: yes — the gate is shared, not client-scoped.
- Specific clients: none singled out.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The behaviour is unconditional.

Practical effect: an event whose criterion rows all resolve in the catalogue
behaves exactly as before. Only an event carrying a criterion the catalogue
cannot resolve is affected, and that event was previously advancing with that
criterion unassessed.

## Changes Included

- `src/lib/source/source-governance-enforcement.ts` — `evaluateStagePromotionReadiness`
  raises `criterion_definition_missing` for an unresolvable criterion that is
  neither `met` nor `waived`, instead of deriving "does not block" from an
  absent severity.
- `src/lib/source/__tests__/source-governance-enforcement.test.ts` — three cases:
  the gate blocks, the blocker names the identifier, and a waived unresolvable
  criterion still clears the gate.
- `.github/workflows/ai-surface-control-catalog.yml` — one step; this suite and
  the stage-advance contract suite ran in no workflow.

## QA / Validation

Measured on the exact merge base `620847e9768afce1351ee1b93c72a2e54b4339ae`.

**The defect, driven rather than described.** Before the change, a promotion
from `strategy` to `scope` with all three catalogue criteria `met` and one
further criterion `pending` whose identifier the catalogue cannot resolve
returned `ok: true` with `blockers: []` — an empty gate. After the change the
same input returns `ok: false` carrying `criterion_definition_missing`.

**Scoped before/after.** `source-governance-enforcement.test.ts` +
`gate-advance-contract.test.ts`: 2 suites, 0 failed / 21 tests, 0 failed before
any edit. With the new cases and before the fix: **2 of 20 failing** in the
governance suite. After the fix: **0 failing**, 24 tests across the two suites.

**Mutation checks — each caught by a different case.**

| Mutation | Result |
|---|---|
| Guard removed (condition forced false) | 2 failed / 18 passed |
| `waived` exemption dropped | 1 failed / 19 passed |
| Blocker detail stops naming the identifier | 1 failed / 19 passed |
| Restored | 20 passed |

**Wider scope, same baseline.** All 69 suites under `src/lib/source/__tests__`:
**6 suites / 15 tests failing before the change and 6 suites / 15 tests failing
after** — the same failures, none introduced here, all pre-existing on the merge
base (they are recorded as separate findings). Total rose 695 → 698, the three
new cases.

TypeScript `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false`
exit 0, no diagnostics. Scoped ESLint exit 0. `node scripts/release-check.mjs`
result recorded on the pull request.

## Rollout Plan

Merge to `main`. The repo-owned Azure Container Apps deploy workflow builds and
deploys the merge commit; no manual runtime mutation, image override, flag or
environment change is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, on merge to `main`.
- Shared runtime mutators: none in this change.
- Approved image digest: produced by that workflow; recorded on the pull request after the run completes.
- ACA runtime invariant: template image digest must equal the 100%-traffic revision digest; verified after deploy.
- Worker image invariant: required worker jobs must carry the same digest.
- Feature/env flag update path: not applicable — no flag.
- Live signed-in proof required: yes, and **owed**. The change is server-side
  gate logic; a signed-in advance attempt on an affected event has not been
  performed, and this record does not claim it has.

## Rollback Plan

Revert the pull request and redeploy through the same workflow. There is no
migration, no data write and no state to unwind: the change affects only how a
single pure function answers, so reverting restores the previous answer
immediately. An event blocked by the new behaviour can also be unblocked
without a revert, by waiving the criterion through the existing criterion-state
route, which records the approver, the time and the written reason.

## Audit Evidence

- The pull request, its diff and its check run.
- The three mutation results above, each reproducible by making the single
  stated edit and re-running the suite.
- The new workflow step, which must be observed executing in the real CI job —
  a step that is present but not running proves nothing.

## Known Gaps

- Signed-in acceptance is owed, as stated above.
- The change makes the gate honest about a criterion it cannot resolve; it does
  not repair the drift that produces such rows. `src/lib/source/artifact-gate-map.ts`
  maps artifact families to twenty criterion identifiers, none of which resolve
  in the canonical criterion catalogue. That is filed separately rather than
  fixed here, because choosing which catalogue criterion each artifact family
  should satisfy is a product taxonomy call, not a code repair.
- Six suites under `src/lib/source/__tests__` were already failing on the merge
  base and remain so. They are unrelated to this change and are recorded as
  separate findings; one of them is itself a validator asserting that a sibling
  map points at real catalogue identifiers, and it is red.
