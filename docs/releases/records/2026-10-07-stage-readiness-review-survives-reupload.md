# 2026-10-07-stage-readiness-review-survives-reupload — A corrected workbook keeps the decisions already made

## Release ID

`2026-10-07-stage-readiness-review-survives-reupload`

## Status

`candidate`

## Plain-English Summary

A Strategic Move crosses a phase boundary when a reviewer accepts, one by one,
the answers returned in that transition's readiness workbook. A required answer
that comes back with an empty Response cell cannot be accepted — correctly, a
required question must not pass unanswered — and the only way to clear it is to
complete that cell and upload the workbook again.

Uploading again used to cost the entire review. Every row of a re-uploaded
workbook is treated as a brand-new answer, including the rows nobody touched, so
each one went back to awaiting a decision. At the widest archetype in the
catalog that is 55 required answers re-judged to fix one. A reviewer who found a
single blank cell faced the whole workbook again, and the surface gave them no
hint that this was coming. In practice the transition was reachable only for a
workbook that came back complete on the first attempt.

This release restores the decisions that still apply. When a workbook is
uploaded again for the same transition, any response whose question, answer,
context, and named source are all unchanged keeps the decision the reviewer
already recorded against that exact text. Anything that was edited — in the
answer, the context, or the source — carries nothing and is judged again,
because an edited answer is a new answer. The API reports how many decisions it
kept, and each kept decision is stored with a note saying it was carried from
the previous upload, so the audit trail distinguishes it from a fresh judgement.

Nothing here can create a decision a human did not make. Every restored
disposition is one that was recorded against identical text, and a response the
reviewer has not seen in any form still arrives awaiting a decision.

## Layer Impact

Release lane: `global-control-lane` — shared application behaviour for all
clients, not client-scoped schema, seed, ingestion, or data-plane work.

- **Layer 3 (canonical model):** no change. No schema, no migration, and no new
  persisted field. The restored decisions are read off the answer fields already
  stored on each reviewed proposal in the existing review artifact, so reviews
  stored before this change are readable by it.
- **Layer 4 (products — Moves):** the readiness-workbook review API applies one
  additional reading before it records a review. The phase gate, the evidence
  packets, and the generation prompts are untouched: they continue to read only
  accepted responses, by exactly the predicates they read today.

## Client Applicability

- All clients: yes — control-plane behaviour of the Moves readiness-workbook
  review path.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The new reading only fires when a stored review belongs to
  a superseded proposal set, which is only reachable by re-uploading a workbook.

## Changes Included

- `src/lib/programs/stage-readiness-workbooks/review-carry-forward.ts` — new
  leaf module. `stageReadinessAnswerIdentity` reduces a response to the four
  fields a human judged (question, answer, context, named source), whitespace
  normalised, with nothing about the file it arrived in.
  `carryForwardStageReadinessDecisions` restores a recorded disposition onto a
  new proposal set wherever that identity matches.
- `src/lib/programs/stage-readiness-workbooks/review-accumulation.ts` — the
  stored-review lookup and body read are now one function,
  `loadStageReadinessStoredReview`, which reports whether the stored review
  belongs to the current proposal set or a superseded one. The existing
  `loadPriorStageReadinessReviewProposals` is kept, with its contract unchanged,
  as a policy over that one reading. The stored blob is read once.
- `src/app/api/v1/programs/[programId]/stage-readiness-workbook/route.ts` —
  the review PATCH resolves the stored review once and routes it to the
  multi-batch merge or to the carry-forward by its reported kind. The response
  gains `carriedForwardFromPriorUpload` and says so in its message when the
  count is non-zero.
- Tests: `src/lib/programs/__tests__/stage-readiness-review-carry-forward.test.ts`
  (new, 20 cases), plus cases added to the route suite and the
  review-accumulation suite.

## QA / Validation

- **PASS** `npx jest src/app/api/v1/programs src/lib/programs --runInBand` —
  347 suites, 4689 tests.
- **PASS** `npx jest src/lib/programs/__tests__ src/lib/programs/stage-readiness-workbooks/__tests__ --runInBand`
  — 147 suites, 1572 tests. The first of those directories is directory-swept by
  a required status check, which is why the consequential assertions were put
  there rather than beside the module.
- **PASS** `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`
  — exit 0.
- **PASS** `npx eslint` over the changed paths — exit 0.
- **PASS** mutation testing, 9 mutations, 8 killed. Killed: dropping the named
  source from the answer identity; dropping whitespace normalisation; making
  `pending` restorable; dropping the conflicting-decision guard; dropping the
  blank-acceptance guard; letting a restored decision override one taken in this
  batch; never feeding the carry-forward at all; inverting which stored review
  is reported as current.
- **SURVIVED, diagnosed, not papered over:** feeding both readings every stored
  proposal changes no behaviour, because the merge matches on proposal id (which
  a superseded set shares none of) and the carry-forward skips anything already
  decided, while a question id appears at most once per set. The split is kept
  for separability and the diagnosis is recorded at the call site rather than
  pinned by a contrived test.
- **PASS** `node scripts/audit/moves-gate-consistency.mjs`.
- **NOT RUN** live signed-in walk. Whether a reviewer can in practice take a
  transition from held to clear after a re-upload needs a stored proposal set
  for a real Move and a signed-in session. That is outside the code lane.

## Rollout Plan

Merge to `main` by squash. Active for all clients on the next repo-owned ACA main
deploy. No migration, no environment variable, no feature flag, and no
data-plane build.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this change.
- Approved image digest: assigned by the main deploy workflow; not pinned here.
- ACA runtime invariant: to be proven by that workflow after merge, not claimed
  by this record.
- Worker image invariant: unaffected — no worker job changes.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, before any claim that this is live-proven.
  Not performed here, and out of scope for the code lane.

## Rollback Plan

Revert the squash commit. Nothing persists that depends on the new reading: a
restored decision is written through the same review artifact as any other
decision, and after a revert those stored decisions are read exactly as they
were before. No migration to unwind.

## Audit Evidence

- The PR and its CI run.
- A restored decision is identifiable in the stored review by its note, which
  names the previous upload as its origin.
- The review API response reports `carriedForwardFromPriorUpload` for every
  review batch.

## Known Gaps

- **The review surface does not preview the restoration.** The page reads a
  stored review only when it belongs to the current proposal set, so immediately
  after a re-upload it shows every response awaiting a decision. The restoration
  happens when the reviewer submits their first decision on the new set, and the
  count comes back in that response. A reviewer therefore sees the full list
  before they see it collapse. Giving the surface its own preview of the
  restoration is a separate change.
- **A blank required response still holds the transition and still cannot be
  given any decision.** That is deliberate and unchanged. What changes is the
  cost of taking the one path that clears it.
- The identity treats a changed source reference as a changed answer, so a
  reviewer who corrects only a typo in column D re-judges that row. Narrowing
  the identity further would start accepting decisions made against text that is
  not the text on file.
- Whether the end-to-end transition clears after a re-upload is not provable
  from tests; it needs a signed-in walk against a real Move.
