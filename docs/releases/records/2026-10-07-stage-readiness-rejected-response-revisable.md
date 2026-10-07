# 2026-10-07 — A rejected required readiness response stays revisable

## Release ID

`2026-10-07-stage-readiness-rejected-response-revisable`

## Status

`candidate`

## Plain-English Summary

Closing a Moves phase gate requires a human to review each response captured in
that transition's readiness workbook. The review surface offers three decisions
on a selected response: accept, reject, or send back for validation.

Rejecting a required response is not a resting state for it. Every forward
control reads the decision as "accepted or not": the phase gate and the phase
build both treat a required response that is not accepted as an open evidence
item, and both refuse while one remains. So a reader who rejected a weak
required answer — which is the entire purpose of a review — put the phase into
a state only a new decision could leave.

The surface then closed itself in exactly that state. The row of action buttons
rendered only while responses were still awaiting a first decision, and once
every response carried one there were none left, so the buttons disappeared. The
rejected row's own checkbox was disabled, because the surface treated a
rejection as final. Between them, not one control on the page could revise the
single decision that was holding the phase, while the gate's own blocker text
went on instructing the reader to accept each required response. The server
never locked this: the review writer applies whatever decision arrives and the
incoming decision wins, so the decision was always changeable — only the screen
said otherwise.

Now a review that is still holding the phase keeps its controls. A response
whose decision can be changed stays selectable, and the action row stays on the
page, so the reader can tick the response they want to revisit and choose again.
A review that holds nothing stays closed, which is what it means for a review to
be finished.

Two guards come with it. Decided responses are never pre-selected, so one click
of "Accept selected" cannot silently reverse a deliberate rejection — revising a
decision is a deliberate act. And a workbook whose every response is blank is
offered no action row at all, because a blank response can never be accepted and
buttons that could never enable would be a second dead end; completing the cells
and uploading the workbook again remains its only path, which the existing blank
message already says.

The surface also now states how many required responses are not accepted and
that the phase stays held until each one is. A finished-looking review that
reported "reviewed, nothing still open" previously named none of them.

## Layer Impact

- `global-control-lane`: shared product behavior in the Moves phase workspace.
  The change is confined to which responses the review surface lets a reader
  select and when its action row renders, plus one new sentence. No gate rule,
  no evidence rule, no API contract, and no stored record changed. The review
  request body is built from the same selection the reader sees, so what the
  server accepts and refuses is unchanged.

## Client Applicability

- All clients: yes, wherever the readiness workbook review surface is offered.
- Specific clients: none singled out.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. This surface has no flag of its own; it renders whenever a
  stored proposal set is present for the phase being viewed.

## Changes Included

- `src/lib/programs/stage-readiness-workbooks/review-selection.ts` — add
  `isWorkbookProposalReviewable`, the predicate for a decision that may still be
  changed, alongside the existing one for a decision not yet made. Its doc
  comment states why the two must stay distinct and why only the narrower one
  may seed a selection.
- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx` — count the
  required responses that are not accepted; keep the action row and the per-row
  checkboxes available while a decision is still holding the phase; hold both
  back when no response could ever be acted on; state the held count and what
  clears it.
- `src/lib/programs/stage-readiness-workbooks/__tests__/review-selection.test.ts`
  — the new predicate's cases, including that it is strictly wider than the
  open-for-review set and therefore must not seed a selection, and a writer case
  showing a previously rejected response being accepted.
- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`
  — four new cases: a review holding the phase with no open work keeps the
  rejected response changeable and names it; that response is not pre-selected
  and the bulk control stays disabled until it is ticked; only the ticked
  response is sent, and nothing is left selected afterwards; an all-blank
  workbook is offered no action row.

## QA / Validation

- PASS `npx jest --runTestsByPath src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx` — 230 of 230 (4 new).
- PASS `npx jest src/lib/programs/stage-readiness-workbooks src/components/strategic-moves/__tests__` — 53 suites, 723 tests, before the fourth host case was added.
- PASS `npx jest src/lib/programs/stage-readiness-workbooks/__tests__/review-selection.test.ts` — 26 of 26.
- PASS mutation probe, 9 of 9 killed: revert the new predicate to the
  open-for-review one; put the checkbox back on the open-for-review predicate;
  put the action row back on the open-work count alone; drop the held-required
  arm of the revisable condition; drop its blank guard; count only pending
  rather than not-accepted; widen the mount selection seed; widen the
  post-review selection seed; remove the held-phase sentence. A tenth mutation —
  widening the post-UPLOAD selection seed — survived and was diagnosed rather
  than reported as a coverage gap: a freshly uploaded proposal set is written
  all-pending, so the two predicates cannot differ on that path and the mutation
  changes no behavior there.
- PASS `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit` — exit 0.
- PASS `npx eslint` on all four changed files — 0 errors (2 pre-existing unused-import warnings in the host file).
- NOT RUN census regeneration — no test file was added or removed, so no census
  delta is owed.
- NOT RUN live signed-in walk. No runtime deploy is part of this record, and the
  surface cannot be exercised end to end until a stored proposal set exists for
  the demonstration Move, which is a separate data step.

## Rollout Plan

Merge to `main` by squash. No migration, no flag, no environment variable, and
no worker job. The change reaches users with the next repo-owned ACA main deploy
in the ordinary course; nothing here requires or authorizes a deploy of its own.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged by this record.
- Shared runtime mutators: none. No Azure command is part of this change.
- Approved image digest: not applicable; no runtime update is requested here.
- ACA runtime invariant: unchanged; this record makes no deploy claim.
- Worker image invariant: unchanged; no worker job touched.
- Feature/env flag update path: not applicable; no flag added or changed.
- Live signed-in proof required: yes, before this surface may be called
  live-proven. Not claimed by this record.

## Rollback Plan

Revert the single squash commit. The change is selection-side and presentational
only: no schema, no stored artifact shape, and no API contract moved, so a revert
restores the prior behavior with no data migration and nothing to reconcile.
Reviews recorded through the control while this change is live are
byte-identical in shape to reviews recorded before it, because the request body
is built the same way. The one consequence of a revert is that the earlier dead
end returns: a required response rejected before the revert could no longer be
taken back from the screen, and clearing it would again need the workbook to be
completed and uploaded a second time.

## Audit Evidence

- The pull request for this record, its diff, and its CI run, including the
  required `AI surface control catalog` check, which runs the host suite by
  exact path.
- The four new host test cases named under Changes Included, which fail on the
  parent commit.
- The mutation probe results listed under QA / Validation.

## Known Gaps

- A response with no text in its Response cell still cannot be given any
  decision, so it stays awaiting one and holds the transition. Completing the
  cell and uploading the workbook again remains its only path. That is
  deliberate — a required question must not pass unanswered — but it means a
  workbook returned with one empty cell costs a full re-issue, and the change
  here does not shorten that.
- The gate's own blocker text still reports a reviewed-but-held workbook as
  though no review had happened, because the loader that supplies the gate its
  decisions returns nothing at all unless every response is accepted or
  rejected. The reader is told to complete a workbook they completed, and the
  held response is named on the review surface rather than in the blocker. The
  surface now names it; the blocker does not.
- The review request still sends one disposition per call, so a mixed review is
  two or more calls. That is a property of the route, not of this surface.
- The predicate's own suite sits in a directory that runs in CI but is not among
  the required status checks. The consequential assertions — what renders and
  what a reader can act on — are in the host component suite, which is required.
- Whether a reader can in practice take a transition from held to clear is not
  provable from tests: it needs a stored proposal set for a real Move and a
  signed-in walk.
