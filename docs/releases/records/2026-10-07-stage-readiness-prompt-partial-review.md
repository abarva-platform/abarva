# 2026-10-07-stage-readiness-prompt-partial-review — the next phase is written from the transition answers a human accepted

## Release ID

`2026-10-07-stage-readiness-prompt-partial-review`

## Status

`candidate`

## Plain-English Summary

Before a Move can leave a phase, someone fills in a transition readiness
workbook and a reviewer accepts each answer. The point of that work is the next
phase: the documents the next phase generates are supposed to be written from
those accepted, sourced answers rather than from generic assumptions.

Those answers were being thrown away. Both places that hand the accepted
answers to a generation prompt reached them through a reader that returns
nothing at all unless the whole review is finished — no response left
undecided, none awaiting validation, at least one acceptance. One undecided
response anywhere in the workbook and the prompt received an empty block, with
nothing written anywhere to say so.

That is not an unlikely state; on the current demo configuration it is the
likely one. Questions belonging to a non-required input area are written as
recommended rather than required, an empty cell parses as blank, and a blank
response cannot be accepted or rejected at all — so one optional question left
unanswered is a permanently undecided response. The forward controls were
recently taught to read a partly reviewed workbook for exactly that reason, so
the phase now advances while the prompt is handed nothing: dozens of accepted,
human-sourced answers silently dropped from every document the next phase
writes.

The strict reading was never what kept unaccepted answers out of a prompt. The
stored review lists its accepted responses separately, built only from
responses a human accepted, so pending, rejected and awaiting-validation
responses are excluded before any reader sees them. The counts test answers a
different question — "is this review finished" — which is a forward-control
policy and belongs with the forward controls.

So the read of the stored review is now one shared step, and each caller
applies its own policy to it. The two prompt readings take the accepted answers
as they stand and the prompt block now states, in the block itself, how many
responses are still undecided and excluded, so a partly reviewed transition is
never presented as a completed one.

No gate moved. Nothing in this change is consulted by the phase gate approval
route, the evidence-packet assessment, or the readiness gate assessor. The
finished-review policy is unchanged and still asserts both of the two count
readings it always asserted, including the belt-and-braces second one, which
now has its own test.

## Layer Impact

Release lane: `global-control-lane` — shared app behaviour for all clients,
with no feature gate.

- Layer 4 (Products — Moves): the generation prompt for a phase build, and the
  Moves generation dependency bundle, receive the accepted transition answers
  from a review that is still open. Prompt content only.
- Layer 3 (Canonical model): untouched. No schema, migration, read model,
  artifact shape or stored record changed. The review artifact is read, never
  written.
- Layer 2 / Layer 1: untouched.

## Client Applicability

- All clients: yes, for any Move at phases 2–5 whose preceding transition has a
  reviewed readiness workbook. The reading is derived from the stored review, so
  no client is singled out.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. Both call sites already ran unconditionally; only which
  reading they use changed.

## Changes Included

- `src/lib/programs/stage-readiness-workbooks/accepted-context.ts` — the
  artifact lookup and the body read are split into one shared reader
  (`loadStoredStageReadinessReview`). `loadAcceptedStageReadinessContext` keeps
  its exact behaviour as the finished-review policy over that reader, including
  the artifact-row short-circuit that avoids downloading bytes it would discard.
  The shared prompt renderer takes an optional open-response count and states it
  inside the block.
- `src/lib/programs/stage-readiness-workbooks/prompt-context.ts` — new leaf
  module holding the prompt policy: every accepted response on the stored
  review, plus how much of the review is still undecided.
- `src/app/api/v1/deliverables/generate-phase/route.ts` — the prompt reading
  uses the prompt policy. The gate reading immediately above it is untouched and
  still uses the finished-review policy.
- `src/lib/deliverables/moves-generate-deps.ts` — same substitution in
  `retrieveCurrentState`.
- Tests: `src/lib/programs/__tests__/stage-readiness-prompt-context.test.ts`
  (new), plus wiring cases in
  `src/app/api/v1/deliverables/generate-phase/__tests__/route.test.ts` and
  `src/lib/deliverables/__tests__/moves-generate-deps.test.ts`.

The new suite sits in `src/lib/programs/__tests__` deliberately: that directory
is swept by a required check, while the workbook library's own test directory is
swept only by a non-required workflow.

## QA / Validation

- PASS `npx jest src/lib/programs/__tests__/stage-readiness-prompt-context.test.ts`
  — 15 tests, all new. They include the defect as a direct comparison: on one
  stored review, the prompt policy returns the accepted answers and the
  finished-review policy returns nothing.
- PASS `npx jest src/app/api/v1/deliverables/generate-phase/__tests__/route.test.ts`
  — 25 tests, 2 new. The wiring pin drives the two readings apart on one
  request: the gate reading stays satisfied while the finished-review reading of
  this phase's own transition refuses, and the accepted answers must still reach
  the queued job.
- PASS `npx jest src/lib/deliverables/__tests__/moves-generate-deps.test.ts` —
  6 tests, 2 new. This suite did not previously mock the reader at all, and the
  call site swallows errors, so it could not have seen the defect.
- PASS `npx jest src/lib/programs/__tests__ src/lib/programs/stage-readiness-workbooks/__tests__ src/lib/deliverables/__tests__ src/app/api/v1/deliverables/generate-phase <workbook route> <phase-gate-approval route>`
  — 183 suites, 1859 tests.
- PASS mutation testing: 13 mutations applied, 13 killed. Coverage spans both
  call-site wirings (each reverted to the finished-review policy
  independently), re-adding either count gate to the prompt policy, dropping
  awaiting-validation from the open count, suppressing the open-review caveat,
  dropping the open count on the way to the renderer, removing the
  zero-acceptance refusal, removing the review identity check, and each of the
  finished-review policy's two count readings including the second one on its
  own. One mutation survived its first pass — removing the finished-review
  policy's body-side count check changed nothing, because the artifact row and
  the body agree in every fixture. Since that second reading is deliberately
  preserved, it now has two cases of its own where the row reads finished and
  the body does not, and the mutation is killed.
- PASS `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`
  — exit 0.
- PASS `npx eslint` on all changed files — 0 errors, 0 warnings.
- PASS `npm run release:check -- --base origin/main --head HEAD`.
- Census: one new test file. The regenerated report moves `testFiles`
  2789→2791 and `coveredTestFiles` 2625→2627 with `uncoveredTestFiles` flat at
  164, because the committed report on the base branch was already one file
  behind the tree. Regenerating here lands at the true counts and discharges
  that drift as well. The tenancy fence report is unchanged.
- NOT RUN: live signed-in walk. Proving the prompt block reaches a generated
  document needs a signed-in authorized approver on a Move with a reviewed
  transition workbook, which is a human-in-the-loop step outside this lane.

## Rollout Plan

Squash merge to `main`. The repo-owned ACA main deploy workflow builds and
deploys the image; no migration, no flag, no environment variable, no worker job
and no manual runbook step. Effective on the next phase build after that
revision carries 100% traffic.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this change. No Azure command is run from
  this branch and no shared traffic, revision weight or container template is
  touched.
- Approved image digest: assigned by the main deploy workflow for the squash
  commit; not pinned here.
- ACA runtime invariant: to be proven after deploy — template image,
  100%-traffic revision image and worker job images must all match that digest.
- Worker image invariant: unchanged. No worker, job or queue contract changed.
- Feature/env flag update path: not applicable; no flag was added or enrolled.
- Live signed-in proof required: yes, before this may be called live-proven. The
  proof is one phase build on a Move whose preceding transition review is
  accepted but not finished, with the accepted answers and the open-review
  caveat present in the generated document's context.

## Rollback Plan

Revert the squash commit and redeploy the prior digest-pinned image. The change
is additive and read-only: it adds one module, splits one reader into two
functions without changing either policy's outcome, and alters only prompt text.
Nothing is written to any table, so a revert restores the previous behaviour
exactly — including the dropped context this fixes. No migration, no data
backfill, no flag to unset.

## Audit Evidence

- PR URL and its CI run (unit suites, typecheck, lint, release gate, census
  gates).
- The three test suites named above, which an auditor can run directly.
- The mutation table in the PR body: 13 of 13 killed, with both call-site
  wirings reverted independently as negative controls.

## Known Gaps

- The prompt now says how many responses are undecided, but not which ones. The
  stored review carries enough to name them; whether a prompt should list
  undecided questions, or only state the count, is a content decision left open.
- A rejected response is excluded with no trace in the prompt, exactly as before.
  A document written from a transition where a reviewer rejected an answer cannot
  tell that the answer was considered and refused.
- The readiness summary line is rendered from the stored review's own counts. For
  a partly reviewed workbook those counts describe the review so far, which is
  correct but can read as a smaller assessment than the workbook will finally
  carry.
- The transition review that feeds the prompt is the one for the phase being
  built. A phase whose own transition workbook was never uploaded gets no block
  at all, which is unchanged and correct, but means a skipped workbook is silent
  on the prompt side as well.
- Not live-proven. Merged and deployed is not the same as proven; the signed-in
  walk above is still owed.
