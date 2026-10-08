# u600 — The capture step repair places every question it reports placing

## Release ID

`2026-10-08-capture-repair-places-every-question`

## Status

`candidate`

## Plain-English Summary

A Move's phase capture screen asks a fixed set of questions, and two separate
declarations have to agree about them: the capture contract declares WHICH
questions a phase asks, and a step-group declaration declares WHICH of the
flow's three steps each question is rendered on. A reconciler
(`phaseStepPlan`) joins the two and repairs any disagreement, so that — in its
own words — every declared question is reachable in some step.

That guarantee had a hole. The repair placed unanticipated questions by
appending them to the LAST step, guarded on there being a step to append to.
When a phase has no step-group declaration at all there is no last step, so the
guard skipped the append entirely and the questions were dropped on the floor —
while the plan still REPORTED every one of them as appended. So the plan claimed
a placement it had not made, which also made the condition unobservable through
the very field that exists to expose it.

What that produces on screen: a blank three-step shell. No question is mounted,
so the flow's step panel resolves to nothing, its per-step completeness check
reads false, and Continue stays disabled with no way to satisfy it — while the
completeness evaluator reads the same capture contract and goes on requiring
every one of those answers. That is exactly the lost-question failure the
reconciler exists to prevent, and it is the failure mode that has stalled phase
progression before.

The condition is reachable only for a phase number the capture contract answers
for but the step-group declaration does not cover. The contract answers for any
phase, with a generic four-question set as its fallback; the step-group
declaration covers the six phases of the canonical phase model. Today the phase
route parser refuses to serve a phase outside that set, so no user can open such
a screen — the defect is latent, not live. It becomes live on the first edit
that widens the served phase range without also writing step copy, and the
existing audit of these two declarations could never catch it: that audit
derives the phases it checks from the same route parser, so the uncovered phase
is outside its own scope.

This change makes the repair honour its stated guarantee for every phase the
reconciler can be asked about. When there is no grouping to repair, it now
synthesizes the flow's three steps and spreads the declared questions across
them in contract order, with plain rather than invented copy. The reported
basis stays `repaired` and the reported key list stays complete, so the
condition remains visible as what it is — a phase whose step copy was never
written — rather than silently losing the questions.

## Layer Impact

Lane: `global-control-lane` — shared control-plane behaviour for all clients,
not feature-gated.

Layer 4 (Products) only, and only in the Moves phase-capture surface's step
reconciliation. Layer 1 (Client Intake), Layer 2 (Source Adapters) and Layer 3
(Canonical Model) are untouched: no schema, migration, adapter, intake,
read-model or data-plane change. No tenant data is read or written by any line
of this change. The capture contract itself is unchanged — this changes only
how declared questions are grouped into steps when no grouping exists.

## Client Applicability

- All clients: no behaviour change on any phase the product serves today. The
  reconciler returns byte-identical plans for every phase of the canonical phase
  model and for every confirmed solution-route variant, because those all
  resolve on the `default` or `variant` basis and never enter the repair path.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none added. The capture flow this serves is already behind its
  own existing capture flag; this change adds no new gate.

## Changes Included

- `src/lib/programs/moves-phase-step-plan.ts`
  - The repair's append is no longer silently skipped when there is no step to
    append to. A new `synthesizeSteps` helper produces the step-bar's worth of
    steps carrying the declared keys in contract order, spread as evenly as the
    count allows.
  - `MOVES_CAPTURE_STEP_BAR_STEPS` is now declared here, in the module that has
    to PRODUCE a plan of that shape, with the reason the count is load-bearing:
    the flow hardcodes it, keys its submit action on the last step index, and
    advances only below that index, so a grouping with fewer steps never reaches
    Submit.
  - The `appendedKeys` doc now states that those keys may be carried by
    synthesized steps rather than only by the last existing one.
- `src/lib/programs/capture-step-plan-integrity.ts` — imports and re-exports
  `MOVES_CAPTURE_STEP_BAR_STEPS` from the module above instead of declaring its
  own copy, so the producer of the shape and the audit of the shape cannot read
  two different numbers. Every existing importer keeps its import path.
- `src/lib/programs/__tests__/moves-phase-step-plan.test.ts` — six new cases, in
  a directory an existing required workflow step already sweeps.

## QA / Validation

- **PASS** — `npx jest src/lib/programs/__tests__/moves-phase-step-plan.test.ts
  src/lib/programs/__tests__/capture-step-plan-integrity.test.ts
  src/lib/programs/__tests__/moves-phase-step-groups.test.ts` → 55 of 55 pass
  (the plan suite goes from 25 to 31 cases).
- **PASS** — `npx jest src/lib/programs/__tests__` → 172 suites, 2232 cases.
- **PASS** — `npx jest src/components/strategic-moves/__tests__` → 47 suites,
  709 cases. Run in full because the change alters what the capture flow's host
  receives, and five suites in that directory exercise the flow or the modules
  changed here.
- **PASS** — mutation testing, five mutations, all five killed:
  1. Remove the synthesis so the keys are dropped again → 5 of the 6 new cases
     fail. The sixth is the non-vacuity guard, which is indifferent to it by
     design.
  2. Synthesize one step instead of the step-bar's count → 3 fail (the shape
     case, the distribution case, and the fewer-questions-than-steps case).
  3. Put every key on the first step → 1 fails (the distribution case), so the
     spread is asserted and not merely the coverage.
  4. Change `MOVES_CAPTURE_STEP_BAR_STEPS` from 3 to 4 → 5 fail, including four
     cases in the integrity audit's own suite. This is the proof that the
     re-export is a live binding and that producer and audit now read one
     number, rather than two numbers that happen to agree.
  5. Make the capture contract answer the uncovered phase with no questions at
     all → the non-vacuity guard fails first. Without that guard the coverage
     and shape cases would pass vacuously on an empty question set, which is the
     way this class of assertion rots.
- **PASS** — the derived-phase property: the new cases do not name a phase
  number. They resolve the first phase for which the step-group declaration has
  no copy, so writing copy for it moves the cases to the next such phase instead
  of making them vacuous.
- **PASS** — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json
  --noEmit`, exit 0.
- **PASS** — `npx eslint` on all three changed files, exit 0.
- **PASS** — `npm run audit:test-ci-coverage:write` →
  `census drift: committed census matches this run`, and both census artifacts
  are unmodified. This change adds no test file and no source file, so it
  carries no census delta and cannot contend with another in-flight change over
  those artifacts.
- **PASS** — `npm run audit:tenancy-fence-coverage:write`, no change.
- **PASS** — `npm run release:check -- --base origin/main --head HEAD`.
- **NOT RUN** — no signed-in walk. The defect this closes is not reachable from
  any served phase route, so there is no live surface on which a walk could
  observe either the defect or its repair. Nothing here is claimed as
  live-proven.
- **NOT RUN** — no measurement of how the synthesized copy reads to a user. It
  is deliberately plain and marked `repaired`; writing real step copy for a new
  phase remains the proper fix for any phase that gains one. See Known Gaps.

## Rollout Plan

Merge to `main` via squash. No image build, no Azure Container Apps deploy, no
migration, no flag change, no data build. The reconciler is pure and is
evaluated per render, so the next deployment of the web image carries it with no
rollout step of its own.

## Deployment Authority

- Repo-owned deploy workflow: the shared Product/Lab web image is built and
  deployed only by `.github/workflows/aca-main-deploy.yml`. This change
  introduces no other deploy path.
- Shared runtime mutators: none. No `az containerapp` command, no traffic split,
  no revision weight, no web or worker template edit, no secret or env change.
- Approved image digest: not applicable — this change requests no runtime
  update, so it pins no digest.
- ACA runtime invariant: unaffected by this change. It will be carried by
  whichever digest-pinned image the main deploy workflow next builds, under that
  workflow's own invariant proof.
- Worker image invariant: unaffected. No data-build job, worker image or ACA Job
  contract is touched.
- Feature/env flag update path: not applicable. No flag is added, enrolled or
  changed.
- Live signed-in proof required: no. The changed branch is not reachable from a
  served route, so there is nothing for a signed-in walk to observe. This record
  claims `candidate`, not `live-proven`.

## Rollback Plan

Revert the squash commit. Three files, no state, no data and no deployed
artifact. Reverting restores the previous behaviour exactly: the repair's append
becomes conditional again and the step-bar count returns to a second declaration
in the audit module. Because the defect is latent, a revert has no immediate
product consequence; it only re-opens the hole.

## Audit Evidence

- The pull request for this record and its CI run, including the required AI
  surface control catalog step whose directory sweep already covers
  `src/lib/programs/__tests__`, so the new cases are merge-blocking without any
  workflow edit.
- `src/lib/programs/__tests__/moves-phase-step-plan.test.ts` — the six cases,
  including the non-vacuity guard and the case asserting that the reported
  appended keys are all actually placed, in both repair directions.
- `src/lib/programs/__tests__/capture-step-plan-integrity.test.ts` — unchanged,
  and the mutation that moves the step-bar count proves it now reads the
  producer's number.
- The mutation results above, each naming which cases failed and which stayed
  green.

## Known Gaps

- The synthesized copy is plain by construction. A phase that gains a served
  route still needs real step copy written for it; this change only guarantees
  that until then no declared question is lost and the phase can still be
  submitted.
- Where the two invariants cannot both hold — fewer declared questions than the
  step bar has steps — this change keeps the step COUNT and accepts a trailing
  step holding nothing. That is the safer of the two: an empty trailing step is
  vacuously complete and Submit stays reachable, whereas a short grouping can
  never reach Submit. It does mean the no-empty-step invariant is not absolute.
- The audit of these two declarations still derives the phases it checks from
  the phase route parser. That is correct for its own purpose — auditing a
  screen nobody can open would assert nothing — but it means the audit remains
  unable to see this class of gap, and the guarantee is now held by the
  reconciler and its own suite rather than by that audit. Widening the audit
  would require deciding what it should say about a phase the product does not
  serve, which is a separate question.
- The capture contract's generic fallback answers EVERY phase number, including
  ones that correspond to no phase of the canonical phase model. Whether that
  fallback should exist at all, or should return nothing outside the declared
  phases, is a design question this change does not settle — it makes the
  fallback's consequences safe rather than removing the fallback.
