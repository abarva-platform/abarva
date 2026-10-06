# Source — a commercial question stops being answered as a product how-to

## Release ID

2026-10-05-ava-how-do-i-overcapture

## Status

Merged — not deployed and not live-proven by this record.

## Plain-English Summary

aVa picks an answer mode with a keyword classifier. One of its rules,
`workflow_how_to.how_do_i`, carried a bare `how do i` pattern, so it captured **any** question
opening that way regardless of subject — and answered it as a guide to operating the product.

Measured against the classifier, four genuine commercial questions resolved to `workflow_how_to`:

| Question | Resolved to |
|---|---|
| how do i justify this renewal to finance? | `workflow_how_to` |
| how do i know this pricing is competitive? | `workflow_how_to` |
| how do i read the exit clause in this agreement? | `workflow_how_to` |
| how do i compare this against what the plan side pays? | `workflow_how_to` |

The last is a cross-segment vendor comparison — answered as which control to press.

The bare pattern was **removed, not narrowed**. It was also redundant: a question about operating
the product names a product verb or a place, and the rule's two other alternatives already match
those, so `how do i upload the signed NDA` still resolves to `workflow_how_to`. A `how do i` naming
neither is a commercial question, and its home is `general_advisory` — reached by falling through,
which is what the no-match fallback already does.

## Layer Impact

Release lane: **global-control-lane**.

Layer 4 (product) only: one alternative removed from one rule in
`src/lib/source/ava/answer-mode.ts`. No new rule, no new mode, no change to the fallback, no schema
or read-model change.

This satisfies the backlog's own constraint for B6 — *"General contract question path; no new regex
modes"* — by subtraction. The general path already existed and worked: a no-match question returns
`general_advisory` with `matchedRule: "no_match"`. What was wrong was that the rule captured
questions before they could reach it.

## Client Applicability

**All clients**, through the shared global control lane, with no per-client gating and no feature
flag. Affects which answer mode aVa selects for a question; it changes no stored data.

## Changes Included

- `src/lib/source/ava/answer-mode.ts` — the bare alternative removed, with the reasoning recorded
  at the rule.
- `src/__tests__/behaviors/source-ava-how-do-i-overcapture.test.ts` — new suite.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

## QA / Validation

| Check | Status |
|---|---|
| New suite | PASS — 14 cases |
| Pre-existing aVa answer-mode suites | PASS — 2 suites, 84 tests, no regression |
| TypeScript `tsc --noEmit`, by exit code | PASS — exit 0, 0 errors |
| Mutation — restore the bare `how do i` (the defect) | PASS — **5 cases** failed as intended |
| Mutation — also remove the product-verb alternative | PASS — **5 cases** failed as intended |
| Mutation — remove the where-do-i alternative | PASS — 2 cases failed as intended |
| Mutation — route every no-match to `workflow_how_to` | PASS — 5 cases failed as intended |
| ESLint, `audit:lib-orphans`, census check | PASS |
| Signed-in acceptance | NOT RUN |

The first two mutations matter together: restoring the defect fails, and over-correcting by removing
too much also fails. The suite pins the behaviour from **both** directions, so neither a revert nor
an over-zealous tidy can pass.

No pre-existing test asserted the bare pattern, checked before changing it, so no other agent's
guard was weakened to make this pass.

## Rollout Plan

Merge to `main`; the repo-owned main deploy workflow builds and deploys. No flag, no configuration,
no data step, no migration.

## Deployment Authority

Repo-owned main deploy workflow only. No ad-hoc Azure command, no traffic or revision change.

## Rollback Plan

Revert the commit. The rule regains the bare alternative and commercial how-do-i questions are
answered as product how-tos again.

## Audit Evidence

- The suite's mis-routing cases are the **exact questions measured against the classifier**, not
  paraphrases of them.
- A mutation that restores the removed pattern fails, which is the specific regression this closes.
- A control asserts that `risk_exposure`, `value_at_stake` and `vendor_comparison` still route, so
  the negative assertions cannot be passing against a classifier that has stopped routing.

## Known Gaps

- **The classifier is still a keyword classifier.** This removes one over-broad alternative; it does
  not replace regex routing with anything better. Nineteen rules remain, each a pattern list, and
  the same class of over-capture is possible in any of them. Prior work on this class
  (`project_intelligence_decision_table_artifacts`) found regex classifiers were themselves the
  defect — that conclusion stands and is not addressed here.
- Only the `how_do_i` rule was measured. The other eighteen were not probed for over-capture.
- A second mis-route was observed and **not fixed**: `where do i click to approve the gate?` resolves
  to `stage_gate.blockers` rather than `workflow_how_to`. It is arguably defensible — the question
  names a gate — so it is recorded rather than changed.
- B6 also asks for the general contract question path; that path already existed and is unchanged.
  This closes the capture half of the item.
- Not deployed and not live-proven. No signed-in readback.
