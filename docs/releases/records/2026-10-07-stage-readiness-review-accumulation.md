# 2026-10-07-stage-readiness-review-accumulation — a workbook review recorded in two batches keeps both

## Release ID

`2026-10-07-stage-readiness-review-accumulation`

## Status

`candidate`

## Plain-English Summary

Advancing a Move from one phase to the next requires an accepted stage-readiness
transition workbook. The reviewer downloads a workbook, fills it in, uploads it,
and then accepts or rejects each parsed response. The transition opens only when
every response carries a decision, none is marked "needs validation", and at
least one is accepted.

A reviewer who did not accept everything in one go could never reach that state.
The stored proposal set is written once, at upload, with every response
`pending`; it is never rewritten. The review endpoint loaded that set and applied
only the decisions in the request it was handling, so a second batch recomputed
the whole review from all-pending and threw the first batch away.

Accepting thirty responses and then rejecting three therefore produced "0
accepted, 30 pending" — and the required-evidence packet for that transition
stayed open, so both forward controls kept refusing. Re-accepting the thirty then
dropped the three rejections. The counts oscillated and never both cleared, which
left the transition unreachable for any review that was not uniform. Rejecting a
weak answer is the point of a review, so this was the normal case, not an edge.

The phase workspace made it harder to see, because the reader was already
correct: the page seeds each response with the current review's decision, so the
screen showed the thirty acceptances right up until the next batch discarded
them. One stored decision, two readings, and only the reader accumulated.

The review endpoint now carries the current review's decisions forward as the
baseline for the next batch. A decision in the request always wins, so changing
one's mind still works; anything the batch leaves alone keeps the decision it
already had.

## Layer Impact

**Release lane: `global-control-lane`.** The stage-readiness review endpoint and
the gate precondition it feeds are shared control-plane behaviour, not
client-scoped and not feature-gated. Every client that advances a Move through
phases 1 to 4 reaches this code on the same path.

- **Layer 4 — products.** The Moves phase-transition precondition. A review
  recorded across more than one request now accumulates, so a mixed accept/reject
  review can satisfy the transition. No gate rule, criterion, severity or
  threshold moved: the conditions `pendingCount === 0`,
  `needsValidationCount === 0` and `acceptedCount > 0` are unchanged, and a
  transition that could not open before this change for any other reason still
  cannot.
- **Layer 3 — canonical model.** Unchanged. No schema, migration or table. The
  review is stored exactly as before, as a versioned `approval_artifact`; only
  the decision list written into it is now cumulative.
- Layers 1–2 untouched. No intake tab, no adapter, no ingestion path.

## Client Applicability

- All clients: yes. Any Move being taken through a phase transition benefits; the
  path is not gated.
- Specific clients: none singled out.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The stage-readiness workbook precondition is unconditional,
  which is why this defect could not be worked around by turning something off.

## Changes Included

- **Added** `src/lib/programs/stage-readiness-workbooks/review-accumulation.ts` —
  a new module rather than an edit to `proposals.ts`, which is shared by the
  parser, the resolver, the gate reader and the phase workspace. Two exports:
  - `mergeStageReadinessReviewDecisions` — pure. This batch's decisions first and
    unchanged, then the current review's decision for every proposal the batch
    left alone. Incoming decisions win. A carried-forward `accepted` is dropped
    when the response is blank, because `buildStageReadinessProposalReview`
    throws on that combination and a throw there would hard-block the transition
    rather than merely refuse one request.
  - `loadPriorStageReadinessReviewProposals` — reads the current review artifact
    for the transition's source phase and returns its decisions, or null. Both
    the artifact metadata and the stored body must reference this exact proposal
    set, which is the same pair of checks the phase workspace already makes
    before it seeds a stored review onto the screen, through the same
    `isReviewForStageReadinessProposalSet` helper. A re-uploaded workbook is a
    different proposal set and inherits nothing.
- **Modified**
  `src/app/api/v1/programs/[programId]/stage-readiness-workbook/route.ts` — the
  PATCH handler loads the prior decisions and passes the merged list to
  `persistStageReadinessProposalReview`. Everything downstream is unchanged: the
  summary counts, the accepted-response list and the artifact status are all
  derived from the decision list as they already were, so the stored review's own
  `decisions` field becomes the cumulative record without a separate migration.
  The existing 422 refusal for accepting a blank response still inspects only the
  decisions the request supplied, so no previously-accepted request becomes a
  refusal.
- **Added**
  `src/lib/programs/stage-readiness-workbooks/__tests__/review-accumulation.test.ts`
  — 14 cases. Placed in a directory the CI coverage census already records as
  swept, which the census delta below proves rather than assumes.
- **Modified** the stage-readiness workbook route suite — two cases for the
  two-batch path, and three mock widenings so the new module runs for real inside
  that suite instead of being stubbed around: `listMoveArtifacts` added to the
  artifact mock, the proposals mock spread from `jest.requireActual` so the real
  same-set guard runs, and an empty artifact list as the default so a first batch
  has nothing to carry forward.
- **Added** this release record.

## QA / Validation

| Check | Result |
|---|---|
| `npx jest` over the 9 stage-readiness suites, the workbook route, the gate-approval route, the generate-phase route and the phase workspace client | **PASS** — 13 suites / 353 tests, 0 failing |
| `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit` | **PASS** — exit 0. Judged on the exit code: this check exits 134 on V8 OOM while emitting no diagnostics, so grepping its output for `error TS` reports a false clean |
| `npx eslint` over the changed library directory and route directory | **PASS** — exit 0, no output |
| Mutation testing, 9 mutations over the new module and its call site | **PASS** — 9 of 9 killed |
| Census regeneration | **PASS** — regenerated on the rebased base; see below |
| Live signed-in walk | **NOT RUN** — see Deployment Authority |

**The fix is pinned at the route, not only in the pure helper.** Removing the
merge call from the PATCH handler and leaving everything else in place fails
exactly one case, the two-batch one. That was measured, not assumed, because a
pure function with its own green suite proves nothing about whether the handler
calls it.

**Mutation table.** Each mutation was applied by a helper that refuses unless its
pattern occurs exactly once in the target file, so a mutation that silently edits
nothing cannot read as a survivor. Every mutation was reverted from the original
text and the suites re-run clean afterwards.

| # | Mutation | Result |
|---|---|---|
| 1 | The merge call is removed from the PATCH handler | **KILLED** |
| 2 | Carry-forward stops skipping proposals this batch decided | **KILLED** |
| 3 | The blank-response guard on a carried-forward acceptance is removed | **KILLED** |
| 4 | `pending` becomes a carryable disposition | **KILLED** |
| 5 | The artifact-metadata same-set check is removed | **KILLED** |
| 6 | The stored-body same-set check is removed | **KILLED** |
| 7 | The source-phase match on the review artifact is removed | **KILLED** |
| 8 | The merge order is reversed | **KILLED** |
| 9 | The empty-proposal-set-id short circuit is removed | **KILLED** |

Mutation 7 survived the first pass and the test was the fault, not the module:
the case that was supposed to rule out a review at another phase was passing
because its artifact download was unmocked and returned nothing, so the phase
check was never the reason it returned null. The case now supplies a fully
matching stored body and asserts the download is never attempted, which makes the
phase the only thing that can rule the review out. Re-run after that change:
killed.

**Census.** Measured on the rebased base, after the preceding Moves change landed
its own `+1`, so these are the true counts and not a stale pair inherited from an
earlier base. Committed before: `testFiles` 2788, `coveredTestFiles` 2624,
`uncoveredTestFiles` 164. Regenerated: 2789 / 2625 / 164. `testFiles` and
`coveredTestFiles` move by the same `+1` while `uncoveredTestFiles` is unchanged,
which is the proof that the new suite is wired to a CI job rather than merely
present on disk. The tenancy-fence census needed no change and is not touched.

The branch was rebased onto the merged base before the census was regenerated,
specifically to avoid writing a hunk identical to the preceding change's. Two
branches asserting the same census transition merge without a conflict and leave
the committed counts one short, which reddens the census gate for whoever merges
next.

## Rollout Plan

Merge to `main` via squash. The repo-owned ACA deploy workflow builds and deploys
the merge commit as it does for every merge; no separate rollout step, flag
flip, env var or worker job is involved. The change takes effect for a reviewer
the first time they record a second review batch after that deploy.

## Deployment Authority

No special authority required. This release touches no Azure Container Apps
template, deploy workflow, runtime image, feature flag, environment variable,
worker job, traffic weight, DNS record or environment promotion.

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unmodified.
- Shared runtime mutators: none. No `az` command is run by or for this change.
- Approved image digest: not applicable — no runtime image change is requested.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: not applicable — no flag.
- Live signed-in proof: **required before this is called live-proven, and not
  performed here.** Recording a second review batch against a Move is an
  in-product human review action; it is not an agent's to perform. This record
  claims `merged` on merge and nothing beyond it.

## Rollback Plan

Revert the merge commit. The runtime change is one call inside the PATCH handler;
reverting restores the previous single-batch behaviour exactly, including its
defect. No migration, no backfill, no data shape change, no partial-rollback
hazard.

Reviews written while this change is live are ordinary review artifacts whose
`decisions` list happens to be cumulative. After a revert they remain readable
and keep their stored counts: nothing reads the `decisions` field to recompute a
summary, and the gate reads only the summary and the accepted responses. A
reviewer on the reverted code would again have to decide everything in one batch.

## Audit Evidence

- `src/lib/programs/stage-readiness-workbooks/review-accumulation.ts` — the
  module doc comment states the mechanism, the state it produced and why the
  screen disagreed with the stored record.
- The two suites named above. Each case name states what it pins.
- The mutation table, reproducible by applying the listed mutation and re-running
  the two suites by path.
- `docs/architecture/test-ci-coverage-census.json` — the committed `+1`/`+1`/`+0`
  transition is the wiring proof for the new suite.
- Required CI checks on the pull request.

## Known Gaps

- **A review still cannot be recorded in two batches from a single screen
  interaction**, and this change does not add that. The review control sends one
  disposition for the current selection, so a mixed review is still two requests;
  it now accumulates across them instead of discarding. Making it one request
  would be a UI change to the control, and is worth doing separately.
- **The blank-response rule is unchanged and still holds a transition.** A
  partly-filled workbook's answered responses can be accepted, its blank rows
  stay pending, and the transition stays closed until the workbook is completed
  and uploaded again. That is deliberate and pre-existing; this change neither
  loosens nor tightens it. A blank row that is *rejected* carries forward like
  any other decision.
- **The `needs_validation` disposition now carries forward**, which is a
  behaviour change in the honest direction: previously a later batch silently
  cleared it back to pending. It still blocks the transition, as it always has,
  until it is replaced by an accept or a reject.
- **The workbook asks the same evidence families at every transition.** The
  endpoint resolves the family set without reference to the phase, so the
  P3-to-P4 workbook asks the P1-to-P2 questions. That is a content-quality gap in
  the resolver, measured while tracing this defect and deliberately not fixed
  here — it does not block a transition, and widening the resolver mid-flight
  would change what every open workbook asks.
- **No live signed-in proof is attached**, per Deployment Authority.
