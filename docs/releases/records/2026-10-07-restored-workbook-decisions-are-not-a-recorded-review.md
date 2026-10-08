# 2026-10-07-restored-workbook-decisions-are-not-a-recorded-review — A previewed review no longer answers a phase gate

## Release ID

`2026-10-07-restored-workbook-decisions-are-not-a-recorded-review`

## Status

`candidate`

## Plain-English Summary

A Move's transition readiness workbook is filled in outside the product and
uploaded back, and a human reviews each response. Correcting one cell and
uploading again produces a brand-new set of responses with new identifiers, so
a review already completed no longer belongs to the set now on screen. The
product keeps those decisions: when the reviewer next submits, each decision
recorded against identical text is restored onto the new set.

A recent change made that restoration visible before the reviewer acts, so a
re-upload no longer presents every response as undecided. That is correct and
stays. What it also did, unintentionally, was put those restored decisions into
the same list the phase workspace projects into its gate reading. The gate's
question for this phase is whether every required response is accepted — so a
preview of what a human would be asked to confirm began answering whether they
already had. The Charter phase then read as having a complete transition
workbook review when no review of the set under review existed at all.

Decisions a human genuinely made were being shown, so nothing was invented; but
they had not been recorded for the responses now on file, and a gate must read
what is on record. This change keeps the restoration on screen and keeps it out
of every gate reading, by recording on each response where its decision came
from.

It also adds the control that reading makes necessary. A re-upload that changed
nothing leaves no response pending and none unaccepted, so the ordinary review
buttons have nothing to act on — while the phase is now, correctly, still held.
Without a way to put the kept decisions on record, the reviewer would face a
blocker with no control that could clear it. A single action now records them,
each as the disposition already recorded for it: a kept rejection is recorded
as a rejection, never re-decided.

Each response also now says, in its own row, when its decision was kept from a
previous upload and is not yet recorded. Previously only a total was reported,
which did not tell a reviewer which rows they could leave alone.

## Layer Impact

Release lane: `global-control-lane` — shared app behavior for all clients, not
feature-gated.

- **Products (Moves)** — the phase workspace's readiness-workbook review
  control and the phase page's evidence-packet/gate projection. The behavior
  change is which dispositions a gate may read, plus two surface additions.
- **Canonical model** — none. No schema, no migration, no stored shape change.
  The review artifact written on submission is the same shape as before, and
  the server's own carry-forward rules are untouched.
- **Client intake / source adapters** — none.

## Client Applicability

- All clients: yes — not feature-flagged.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/programs/stage-readiness-workbooks/review-provenance.ts` (new) —
  `seedProposalsFromReviewPreview` (applies a preview's dispositions and marks
  the restored ones in the same place), `isRestoredDisposition`,
  `recordedDispositionsOnly` (restored dispositions return to `pending` for any
  gate reading), and `keptDecisionsToRecord` (the decisions a reviewer can put
  on record, each as its own disposition).
- `src/app/(maestro)/strategic-moves/[moveId]/phase/[phaseNum]/page.tsx` — the
  inline seeding map is replaced by the marking helper, and the
  `StageReadinessGateProposal` projection reads `recordedDispositionsOnly`.
  This is the defect.
- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx` — per-row
  provenance text; a `Record N kept decisions` action; the revisable condition
  gains the kept-decision term so the surface stays open in the one state where
  neither existing term is positive; the review submit path is generalised so
  the new action and the existing ones share one request, and every restored
  mark is cleared on a successful submission because the route records the rest
  by carry-forward.
- `src/lib/programs/__tests__/stage-readiness-review-provenance.test.ts` (new) —
  9 cases run over the real composition (preview → seeding → recorded-only →
  `applyStageReadinessToEvidencePackets`), so the assertion that a previewed
  review holds the phase is checked against the evidence-packet reading itself
  rather than a restatement of it.
- `src/__tests__/integration/programs/stage-readiness-review-provenance-wiring.test.ts`
  (new) — 4 source-level assertions pinning the page's wiring, including the
  absence of the pre-fix expression. The phase page is a server component with
  no render harness; this follows the existing precedent in
  `program-route-shell-enforcement`.
- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`
  — 4 cases: the per-row marks, the control in the state where a re-upload left
  nothing pending, the state where every restored decision is an acceptance,
  and the absence of both once the decisions are on record.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

## QA / Validation

- **PASS** `npx jest src/lib/programs src/components/strategic-moves src/app/api/v1/programs src/__tests__/integration/programs`
  — 466 suites passed (1 skipped), 6965 tests passed, 20 skipped.
- **PASS** `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit` — exit 0.
- **PASS** `npx eslint` over the six changed files — 0 errors. Two pre-existing
  unused-import warnings in the component predate this change.
- **PASS** Mutation check, 12 mutations, 12 killed:
  1. `recordedDispositionsOnly` returns rows untouched — killed;
  2. seeding never marks provenance — killed;
  3. seeding marks every source as restored — killed;
  4. `isRestoredDisposition` always false — killed;
  5. `keptDecisionsToRecord` includes already-recorded rows — killed;
  6. `keptDecisionsToRecord` forces `accepted` — killed;
  7. the page projects gate proposals from the seeded list (the defect itself,
     restored) — killed by the wiring pin;
  8. the page seeds with an inline map, losing provenance — killed by the
     wiring pin;
  9. the revisable condition drops the kept-decision term — killed;
  10. the per-row restored marker is dropped — killed;
  11. the restored marks are kept after recording — killed;
  12. the kept-decisions control is hidden — killed.
  Mutation 9 survived the first pass and the survivor was real, not spurious:
  the fixture it ran against held a restored REJECTION, which leaves a required
  response unaccepted and so holds the surface open by an existing term. The
  state the new term exists for is the one where every restored decision is an
  acceptance. A case for exactly that shape was added and the mutation then
  died — the same shape of gap as a fixture that cannot reach the branch it is
  supposed to cover.
- **PASS** `npm run audit:test-ci-coverage:write` — `testFiles` 2793 → 2796,
  `coveredTestFiles` 2629 → 2632, `uncoveredTestFiles` unchanged at 164. Both
  new test files land in directories a workflow command already reaches. The
  delta is three, not two: a branch that landed on `main` while this one was in
  flight added a test file while asserting the pre-existing counts, so this
  regeneration absorbs that one as well. It is an honest regeneration of the
  tree as it stands, not an assertion about this branch alone.
- **PASS** `npm run audit:tenancy-fence-coverage:write` — regenerated and
  unchanged; this change adds no route and no data-plane read.
- **PASS** `npm run release:check -- --base origin/main --head HEAD`.
- **NOT RUN** Live signed-in walk. Observing this needs a signed-in session on
  a deployed build, a Move at a phase that offers the workbook, a completed
  review, and then a re-upload. See Known Gaps.

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
- Worker image invariant: unaffected — no worker job or operator script change.
- Feature/env flag update path: not applicable; no flag.
- Live signed-in proof required: yes, before this is called live-proven. Not
  claimed here.

## Rollback Plan

Revert the squash commit and redeploy through the main deploy workflow. The
new module has no importers outside the two files changed here, and no schema,
stored shape, or write path changed, so a revert restores the previous behavior
exactly and cannot leave stored data inconsistent. Note that reverting
reinstates the defect — a previewed review answering the phase-1 gate reading —
so a revert should be paired with reverting the change that introduced the
preview, or with holding the phase by other means.

## Audit Evidence

- The PR and its CI run.
- `stage-readiness-review-provenance.test.ts`, whose gate assertions run
  through `applyStageReadinessToEvidencePackets` itself, so the claim is
  checked against the reading that was wrong rather than against a copy of it.
- The wiring pin, including its assertion that the pre-fix expression is
  absent, which is what keeps the pin from being satisfiable by an unrelated
  call added elsewhere in the file.
- The mutation results recorded above, including the diagnosis of the one
  survivor and the case added to kill it.

## Known Gaps

- **Not live-proven.** No signed-in walk was performed.
- The restored decisions are recorded by one action over all of them. A
  reviewer who wants to record some and re-judge others must re-judge first and
  then record the remainder; there is no per-row "record this one" control.
- The readiness split is still omitted rather than re-measured for a review
  restored from an earlier upload. The counts beside it are recomputed from
  what actually stands, so the omission is conservative, but the split could be
  derived for the current set from the same accepted answer states the server
  uses. Deliberately out of scope here and unchanged by this branch.
- The gate reading this change protects is the phase-1 evidence-packet branch.
  The same page projects the same list for phases 2 to 4; those branches ask a
  different question and were not reached by this defect, but they now read the
  same recorded-only list, which is the intended posture rather than a measured
  one.
- Committed census arithmetic: this branch was rebuilt onto a `main` that moved
  under it, and its regeneration absorbs one test file a just-landed branch had
  left uncounted, so no separate census-only regeneration is owed behind it. A
  branch that lands after this one while asserting the earlier counts would
  reopen the same arithmetic; that is a property of the file, not of this
  change.
