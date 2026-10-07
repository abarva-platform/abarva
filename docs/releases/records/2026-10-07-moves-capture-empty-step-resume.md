# 2026-10-07-moves-capture-empty-step-resume — A capture step that asks nothing is done, not undone

## Release ID

`2026-10-07-moves-capture-empty-step-resume`

## Status

`candidate`

## Plain-English Summary

A phase screen in the Moves capture flow is presented as three steps, and when
you come back to it the screen opens on the first step that still needs answers.
When everything is answered it opens on the LAST step, because that is where the
governed "approve and build" action sits and arriving there is what keeps the
decision an explicit act rather than something you stumble into.

One phase can legitimately end up with a step that asks no questions at all. The
Design phase re-shapes its question set once the preceding phase settles how the
work will be delivered: some of those shapes do not ask the two questions that
make up the default second step. When that happens the grouping is repaired — the
questions that are no longer asked are removed, any new ones are added to the
last step, and the step COUNT is deliberately preserved so the other steps keep
their numbers. The second step is then simply empty.

The screen handled that state wrongly. It counted a step with no questions as a
step that still needed answers, so it stopped there — every time, no matter how
complete the phase was, because a step with nothing on it can never become
complete. The result was a blank panel on arrival, with the approval action one
unexplained "Continue" away and the step after it greyed out in the step bar.
Two readings inside the same screen disagreed about the same step: the resume
rule called it unfinished, while the rule that enables "Continue" called it
finished. The resume rule won.

A step that asks nothing is finished the moment it is shown. This change says so,
in a module of its own, and the screen now opens a fully answered phase on its
last step as it was always meant to.

## Layer Impact

Release lane: `global-control-lane`. Shared app behaviour for every client, with
no feature gate of its own.

- **4 Products (Moves).** One rule in the phase-capture screen's resume
  behaviour, plus a new module that holds it. No change to what is asked, what is
  stored, what the gate reads, or what a phase builds.
- Layers 1–3 unchanged. No intake tab, adapter, canonical object, schema,
  migration or dataset is touched.

## Client Applicability

- All clients: yes, for every workspace that renders the three-step capture
  screens. The behaviour is identical for any phase whose grouping already fits
  its questions, which is every phase in the shipped configuration today.
- Specific clients: none singled out.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none added. The screen this corrects is reached through the
  existing capture flag; this change adds no new gate of its own.

## Changes Included

- `src/lib/programs/capture-step-resume.ts` — new. `captureStepResumeIndex`
  takes each step's mounted-question count, its unmounted-reference count and
  whether its mounted questions read complete, and returns the step to open on.
- `src/lib/programs/__tests__/capture-step-resume.test.ts` — new, 11 cases.
- `src/components/strategic-moves/MovesCaptureFlow.tsx` — the inline
  `firstIncompleteStep` scan is replaced by a call to the new rule. No other
  behaviour in the component changes.
- `src/components/strategic-moves/__tests__/MovesCaptureFlow.test.tsx` — three
  cases added for the repaired-grouping shape.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

## QA / Validation

- **PASS** — `npx jest src/lib/programs/__tests__/capture-step-resume.test.ts`:
  11 cases, all passing.
- **PASS** — `npx jest src/components/strategic-moves/__tests__`: 43 suites,
  611 tests (27 of them in the capture-flow suite).
- **PASS** — `npx jest src/lib/programs/__tests__`: 134 suites, 1362 tests.
- **PASS** — the defect was reproduced first-hand before the fix and the new
  component case fails against the previous logic, naming it exactly: *Unable to
  find an accessible element with the role "heading" and name "Make it safe &
  real"* — the screen was on the empty step instead.
- **PASS** — mutation check, 9 mutations over the new rule and its call site,
  7 killed. Both survivors are the same documented condition and are diagnosed
  in Known Gaps rather than reported as coverage.
- **PASS** — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json
  --noEmit`, exit 0.
- **PASS** — `npx eslint` over the four changed source files, exit 0.
- **PASS** — `npm run release:check -- --base origin/main --head HEAD`.
- **NOT RUN** — live signed-in walk. The repaired grouping is not the shape any
  phase presents in the shipped configuration, so there is nothing for a walk to
  observe that the component cases do not already pin. See Known Gaps.

## Rollout Plan

Merge to main, then the repo-owned ACA main deploy workflow in its normal course.
No migration, no flag, no environment variable, no worker job, no manual runbook
step. Nothing in this change alters a shared runtime template.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged.
- Shared runtime mutators: none. No `az containerapp update`, no traffic shift,
  no revision weight change from this branch.
- Approved image digest: not applicable — this record requests no runtime image
  change; it ships with the next ordinary main deploy.
- ACA runtime invariant: unchanged by this record; the next main deploy proves it
  in the normal way.
- Worker image invariant: unchanged; no worker job image or argument changes.
- Feature/env flag update path: not applicable; no flag is added or enrolled.
- Live signed-in proof required: no for the behaviour this corrects, which no
  shipped phase shape reaches. Yes before anyone relies on the repaired grouping
  in front of a client.

## Rollback Plan

Revert the squash commit. The change is one call site and one new module: nothing
is stored, nothing is migrated, no flag is retired, and the resume index for every
grouping that fits its questions is identical before and after — which is itself
one of the tests. Reverting restores the previous resume rule exactly.

## Audit Evidence

- The pull request for this branch and its CI run.
- `src/lib/programs/__tests__/capture-step-resume.test.ts` — in particular the
  case asserting an empty step is skipped even when the caller reports it as
  incomplete, the case asserting a step with an unmounted reference is still
  stopped at, and the case asserting every phase whose grouping already fits
  resumes exactly where it did before.
- `src/components/strategic-moves/__tests__/MovesCaptureFlow.test.tsx` — the
  three repaired-grouping cases, including the one that confirms the grouping
  really does leave a step with no questions before asserting what the screen
  does with it.

## Known Gaps

- **Two mutations survive, and both are the same documented condition.**
  Replacing the screen's mounted-question count with its referenced-question
  count, and replacing its unmounted count with zero, change nothing a test can
  see. The grouping the screen is handed has already been repaired, so every
  reference it holds is a question the contract declares and the two counts are
  equal by construction. The rule keeps both readings because they are the honest
  ones for a caller that passes an unrepaired grouping, and the module says so at
  the definition. This is unobservable, not untested.
- **Nothing on a surface says the grouping was repaired.** The plan already
  reports which keys it dropped and which it appended, and no screen renders any
  of it. An operator still diagnoses an empty step by reading output. A step with
  no questions is now harmless rather than a dead landing, but it is still a step
  with no editorial reason to exist, and the place to say so is the setup surface
  that does not exist yet.
- **The repaired grouping is not a shape any phase presents today.** Both of the
  Design phase's re-shaped question sets are covered exactly by a declared
  variant, so the repair path is a safety net rather than a live configuration.
  That is why this carries no signed-in proof. It is one hand-maintained key
  spelling away from being live, which is why it is worth closing now rather than
  after it bites.
- **The step bar still disables every step after the current one.** That is
  unchanged and deliberate here; this change only moves where the screen lands.
- **The capture census ordering is unresolved and not this change's to fix.** The
  committed census was three merges behind the tree before this branch; the
  regeneration here is correct for a tree that contains this branch and nothing
  merged after it. A single regeneration PR once the queue drains is still owed.
