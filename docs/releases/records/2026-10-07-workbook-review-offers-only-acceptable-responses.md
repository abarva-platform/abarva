# 2026-10-07-workbook-review-offers-only-acceptable-responses — A partly filled readiness workbook can be reviewed

## Release ID

`2026-10-07-workbook-review-offers-only-acceptable-responses`

## Status

`candidate`

## Plain-English Summary

A Move's transition readiness workbook is filled in outside the product and
uploaded back. The reviewer then accepts the responses, and only accepted
responses are allowed to feed the next phase.

The review service refuses an entire submission if any response being accepted
is blank — one blank cell and nothing is saved. The upload screen, however,
pre-ticked **every** response that came back from a parse, blanks included. So
a reviewer who uploaded a workbook that was not yet 100% complete — the normal
case on a first pass — pressed the one available Accept button, received the
refusal, and saved nothing. There was no way to recover on the screen either: a
blank response's tick box is deliberately disabled, so it cannot be unticked,
and only the first few responses are listed at all. The only escapes were to
reload the page or to go back and complete every remaining cell in the
spreadsheet.

The screen already had the correct rule — it applied it when restoring a stored
review after a reload, just not after an upload. The two had drifted apart
because the rule was written out separately at each place that needed it.

After this change the rule lives in one place and every reading uses it. A
partly filled workbook now offers its answered responses for acceptance, that
progress is saved, and the reviewer can come back to the rest. Nothing is
loosened: blank responses are still not acceptable, the service's refusal is
untouched, and a blank response still holds the phase exactly as before.

## Layer Impact

Release lane: `global-control-lane` — shared app behavior for all clients, not
feature-gated.

- **Products (Moves)** — the phase workspace's readiness-workbook review
  control. Behavior change is confined to which responses are pre-selected and
  offered for review.
- **Canonical model** — none. No schema, no migration, no stored shape changes.
  The review artifact written on acceptance is the same shape as before.
- **Client intake / source adapters** — none.

## Client Applicability

- All clients: yes — the control is not feature-flagged.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The surrounding workbook actions render for phases 0–4
  wherever the phase workspace renders, under both the current and the
  redesigned capture layout.

## Changes Included

- `src/lib/programs/stage-readiness-workbooks/review-selection.ts` (new) —
  `isWorkbookProposalAcceptable`, `isWorkbookProposalOpenForReview`, and
  `selectableWorkbookProposalIds`. Pure, no data-plane access, no `server-only`
  import, so the client control can share it with server code.
- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx` — the eight
  places that each re-expressed the rule now call the shared predicates: the
  post-upload selection seed (the defect), the stored-preview seed, the
  post-review re-seed (the same defect on a second pass), the open-work count,
  the blank tally, the per-row tick box, and the per-row status label.
- `src/lib/programs/stage-readiness-workbooks/__tests__/review-selection.test.ts`
  (new) — 19 cases, including two that assert the predicate against the review
  writer itself rather than against a restatement of its rule.
- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`
  — one case covering the upload path end to end.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

## QA / Validation

- **PASS** `npx jest src/components/strategic-moves src/lib/programs/stage-readiness-workbooks src/app/api/v1/programs/[programId]/stage-readiness-workbook`
  — 56 suites, 722 tests.
- **PASS** `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit` — exit 0.
- **PASS** `npx eslint` over the four changed files — exit 0, 0 errors. Two
  pre-existing unused-import warnings in the component are unrelated to this
  change and were present before it.
- **PASS** Mutation check, 6 mutations, 6 killed:
  1. restore the old post-upload seed (select every id) — killed by the new
     component case;
  2. drop the blank-answer-state check — killed;
  3. drop the empty-response check — killed;
  4. widen the open-for-review dispositions — killed;
  5. drop the acceptability gate inside `isWorkbookProposalOpenForReview` — killed;
  6. keep empty proposal ids in the selection — killed.
  Mutation 2 survived the first draft of the suite, because every fixture that
  set a blank answer state also had an empty response cell. The answer state is
  blank when the row carried no user input, which is a different question from
  whether the cell is empty — a prefilled suggestion leaves text behind. Two
  cases were added for that shape, one of them asserting the review writer's own
  refusal on it, and the mutation then died.
- **PASS** `npm run audit:test-ci-coverage:write` — census regenerated;
  `testFiles` 2776 → 2777, `coveredTestFiles` 2612 → 2613, `uncoveredTestFiles`
  unchanged at 164. Both new test files land in directories a workflow command
  already reaches.
- **PASS** `npm run audit:tenancy-fence-coverage:write` — regenerated and
  unchanged, as this change adds no route and no data-plane read.
- **PASS** `npm run release:check -- --base origin/main --head HEAD` — 11 of 11
  gates passed.
- **NOT RUN** Live signed-in walk. Observing the fix needs a signed-in session
  on a deployed build and a partly filled workbook upload for a real Move. See
  Known Gaps.

## Rollout Plan

Merge to `main`. The repo-owned ACA main deploy workflow then builds a
digest-pinned image and shifts shared web traffic. No migration, no flag, no
worker job, no environment variable.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, on merge
  to `main`. This branch adds nothing to it.
- Shared runtime mutators: none. This change runs no Azure command.
- Approved image digest: assigned by the main deploy workflow; not pinned here.
- ACA runtime invariant: unchanged by this branch; the post-deploy check is the
  standard one (template image, 100%-traffic revision image, and worker job
  images all at the approved digest).
- Worker image invariant: unaffected — no worker job or operator script changes.
- Feature/env flag update path: not applicable; no flag.
- Live signed-in proof required: yes, before this is called live-proven. Not
  claimed here.

## Rollback Plan

Revert the squash commit and redeploy through the main deploy workflow. The
change is pure front-end selection logic over a new leaf module with no other
importers, so a revert restores the previous behavior exactly and cannot leave
stored data inconsistent: no schema, no stored shape, and no write path changed.

## Audit Evidence

- The PR and its CI run.
- The two new test files, and in particular the two cases that assert the
  predicate against `buildStageReadinessProposalReview`'s own refusal, so the
  claim "a selection built from this predicate is one the writer accepts" is
  checked against the writer and not against a copy of its rule.
- The mutation results recorded above.

## Known Gaps

- **Not live-proven.** No signed-in walk was performed. Observing it needs a
  deployed build, a Move at a phase that offers the workbook, and a workbook
  uploaded with some cells still blank.
- The response list on the review control still renders only the first few
  responses. That is now safe — the responses outside the rendered window can no
  longer be silently submitted and refused — but a reviewer working a workbook
  with dozens of questions still cannot see or individually act on all of them
  from this control. Widening or paginating that list is a separate change and
  is deliberately not in scope here.
- The review is still per-upload: correcting a blank response means completing
  the cell and uploading the workbook again. This change makes the partial
  progress stick between those uploads; it does not add in-product answering.
- The workbook ships with its evidence-or-source column pre-populated with the
  evidence the product suggests, and a later check treats a non-empty cell there
  as a named source. That remains open and is unchanged here; it makes that
  check easier to pass, never harder, and it is tracked separately as something
  to sequence after the end-to-end run is proven.
- Committed census arithmetic: other open branches each assert the pre-existing
  committed counts while adding a test file, so merge order decides which one
  leaves `main` reading short. Whichever lands last owes a census-only
  regeneration. Not something this branch can fix without being clobbered.
