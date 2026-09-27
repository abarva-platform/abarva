# 2026-09-27-source-terminal-stage-gate-contract — State what the terminal Source stage's gate says

## Release ID

`2026-09-27-source-terminal-stage-gate-contract`

## Status

`candidate`

## Plain-English Summary

Every Source sourcing event moves through an ordered list of stages, and each stage
ends at an approval gate. On all but the last stage the gate has an obvious thing to
say: approve this, and the event advances to the next stage. The **last** stage has
no next stage, so "approve and advance to …" has nothing to point at.

Nothing in the code said what the last stage's gate says instead. Five places each
worked it out for themselves, and four of the five decided it by checking whether a
"next stage name" field happened to be empty. That field is not always empty on the
last stage: the illustrative stage template shipped with the word `Closed` in it —
a label that is not one of the product's stages, is absent from the canonical stage
order, and cannot be produced by the function that resolves the next stage. It was
an invented destination.

It was not cosmetic, and here is the precise claim. The block of text the product
hands to the model when a user asks about a gate read that field directly. Driven with
the final stage's own illustrative view, that builder emits, verbatim,
`Next stage on approval: Closed.` — an onward stage that does not exist, named with
confidence. That is measured, printed by a failing assertion on the base commit, not
inferred from reading the source.

**What is deliberately NOT claimed: that a live request reached that state.** The two
callers that build a stage view in production each happen to empty the field first —
one through the journey adapter on the event page, the other through the stage-order
function inside the live fact builder. So the right answer was being reconstructed
independently in several places rather than stated in one, which is the defect. The
assistant's stage-gate summary is the near miss that shows the cost: its fallback to
the view's own label fires **only** when the stage-order function returns nothing,
which on a recognised stage means the stage is terminal — so it asked the view for an
answer the order had just said does not exist, and the illustrative view answers
`Closed`. One caller passing an unadapted view is all that separated the two states.

This change states the contract once, in a single module: the final stage's gate asks
for a **completion review**, its outcome **closes the event**, and it has **no onward
target**. The contract is derived from the canonical stage order rather than typed a
second time, so appending a stage after today's last one moves it automatically. It is
then *enforced* at the two points a stage view is built for a reader or for the model,
rather than left as a constant nobody calls, and the illustrative template no longer
asserts a destination at all.

Deriving the rest of that stage's content from real event facts is deliberately **not**
part of this change; it depends on this contract existing first.

## Layer Impact

Release lane: `global-control-lane` — shared application behaviour for all clients, not
feature-gated and not client-scoped.

- **Layer 4 — Products (Source).** The stage-gate view and its copy. The gate for the
  final stage now states a completion review and its closing outcome instead of
  implying an advance, and the component reads terminality from the stage key it was
  already being handed rather than from a nullable label.
- **Model grounding (control lane).** The stage-gate grounding block and the assistant's
  stage-gate summary now take terminality from the stage, so carried template copy can
  no longer put an invented onward stage into a prompt. A new `gateDecisionKind` fact
  (`advance` / `completion_review`) is stated in both, so a reader of the packet does
  not have to re-derive it from an absent label.
- **No data-plane change.** No schema, migration, loader, adapter, projection or tenant
  data is touched. Nothing under `src/lib/source/facts/evaluators` changed, and no
  number moved.

## Client Applicability

- All clients: yes — the copy and grounding change applies to every tenant that reaches
  a Source event's final stage. No tenant-specific behaviour, no tenant-specific data.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none added. The affected view is already behind the existing
  `source_analytics` path for the live builder; the illustrative path is unflagged.

## Changes Included

- `src/lib/source/stage-terminal-contract.ts` — **new.** The stated contract:
  `TERMINAL_SOURCE_STAGE_KEY` (read from the canonical order), `isTerminalSourceStage`
  (legacy aliases normalised first), `sourceGateDecisionKindFor`,
  `SOURCE_TERMINAL_GATE_CONTRACT` and `withTerminalGateContract`, the enforcement that
  removes an onward target from a terminal gate and leaves every other stage untouched.
- `src/lib/source/sourcing-motion-journeys.ts` — the contract is applied in
  `adaptStageViewToSourceJourney` **before** its early return. That early return was the
  hole: with no journey supplied the function returned its input untouched, so template
  copy passed through to the reader and to the model intact. This is the single funnel
  every stage view goes through on the event page and in the canvas.
- `src/lib/source/facts/view/stage-analytics-builder.ts` — the contract replaces an
  ad-hoc stage-name comparison that lived inside one of two branches. The literal it
  replaces was correct and unreachable from the derived branch, so a future
  fact-derived terminal gate would have lost the approver role silently.
- `src/lib/source/ava/mode-grounding.ts` — the terminal sentence is keyed to the stage,
  not to whether the gate carries a label, and `gateDecisionKind` is added to the
  quotable facts. The non-terminal unresolved case now says the next stage has not been
  resolved rather than asserting the stage is final.
- `src/lib/source/ava/module-expert.ts` — the fallback to the view's own label fired
  *only* when the stage is terminal, which is exactly when the template's invented label
  was the value it read. It now returns the absence on a terminal stage and keeps the
  fallback for an unrecognised stage key, where the order genuinely cannot answer.
- `src/components/source/canvas/analytics/sample-view-model.ts` — the illustrative
  final-stage gate no longer names an onward stage.
- `src/components/source/canvas/analytics/ScopeGate.tsx` — the "what good looks like"
  sentence no longer promises the workspace "advances the event" on a stage with nothing
  onward, and terminality is read from the `stageKey` prop the component already
  declared and no caller's value was ever used for.
- `docs/architecture/u533-stage-scaffold-provenance.json` — regenerated. One verdict
  moves: the final stage's next-stage field goes from
  `computed_differs_from_exemplar` to `computed_agrees_with_exemplar`, because the
  template stopped asserting a value the builder disagreed with. The suite's separate
  disagreeing probe still disagrees, so "computed" does not rest on agreement.
- `docs/architecture/source-builder-vocabulary-render-coverage.json` — regenerated. The
  canvas's import closure grows by exactly one file: the new contract module.
- `src/lib/source/__tests__/stage-terminal-contract.test.ts` — **new**, 22 cases.
- `src/components/source/canvas/analytics/__tests__/ScopeGate.u406TerminalContract.test.tsx`
  — **new**, 3 cases.

## QA / Validation

**Red first, measured on a clean checkout of the base commit `fc5cb87d28` with the two
new suites and the new contract module present and nothing calling it.**

- New suites: **9 failing / 16 passing before → 0 failing / 25 passing after.**
  The nine reds included the one that matters most: driven with the final stage's own
  illustrative view, the grounding builder emitted `Next stage on approval: Closed.`
  verbatim, printed in the failure output rather than argued from the source. That is a
  statement about the builder given that input, not about a live request — see the
  summary above for what is not claimed.
- Three of the sixteen that passed before are deliberate guardrails an over-broad fix
  would break — the non-terminal branches. They are not padding; they are the reason
  the fix cannot be "delete advance language everywhere".
- Scoped regression, same scope both times (`npx jest src/lib/source src/components/source`):
  **4 suites / 13 tests failing before → 2 suites / 4 tests failing after.** The two
  that remain fail identically at the base commit, verified by reverting the six
  modified source files and re-running them; they are unrelated
  (`vendor-proposals/governed-vendor-proposal-facts`, `pricing-submissions/parser`).
- **Six mutations, six caught**, each naming a distinct case, and each mutation's byte
  change asserted before the run so a no-op could not read as a pass:
  1. template reasserts the invented onward target → 3 red (2 contract cases + the
     provenance artifact);
  2. the assistant's summary falls back to the view's label on a terminal stage → 1 red;
  3. the grounding block reads terminality off the gate label again → 1 red;
  4. the live builder stops applying the contract → 7 red, including four cases of the
     existing provenance control, which is the check that the approver-role behaviour
     established earlier survived this refactor rather than being quietly re-broken;
  5. the journey funnel returns its input untouched again → 2 red;
  6. the gate component reads terminality off the gate label again → 1 red.
- `npm run test:behaviors`: **146 suites / 1551 tests passed, 0 failed.**
- `npm run test:nav`: 1 suite / 26 tests passed.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` after deleting
  `tsconfig.tsbuildinfo`: **exit 0**, judged by exit status rather than by grepping the
  output. The first run of it exited 2 on one real error in the new module, which was
  fixed.
- `npx eslint` over all nine changed and added files: exit 0.
- `node scripts/release-check.mjs --base origin/main --head HEAD`: see Audit Evidence.

## Rollout Plan

Merge to `main` by squash. The repo-owned ACA main deploy workflow builds the image and
shifts traffic; no manual Azure command is run and no shared runtime is mutated from a
branch. No migration, no flag change, no environment variable change, no worker job.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, on merge to `main`.
- Shared runtime mutators: none in this change. No `az containerapp` command is run by
  hand, and no branch workflow touches the shared web Container App.
- Approved image digest: assigned by the deploy workflow from the merge SHA; recorded in
  Audit Evidence once the run completes.
- ACA runtime invariant: to be proven after the deploy run — Container App template image
  == the 100%-traffic revision image == the required worker job images, all digest-pinned.
- Worker image invariant: unchanged by this release; asserted as part of the invariant
  check above rather than assumed.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: **no** for the model-facing half, which is proved by
  driving the real grounding and packet builders. **Yes, and it is a separate item's
  work** for the rendered gate: the component this change also touches is mounted by no
  route today, so no signed-in reader can reach that copy, and this record makes no
  claim that one can. See Known Gaps.

## Rollback Plan

Revert the squash commit. The change is pure application code plus two regenerated
measurement artifacts; there is no migration, no data write and no flag to unwind. The
two artifacts are regenerated by the commands their own suites document, so a revert
returns them to the base values in the same commit.

## Audit Evidence

- Pull request and CI run: recorded on the PR.
- The base-commit red measurement and each mutation's red output: reproducible with the
  commands in QA / Validation; both new suites are ordinary jest suites with no
  environment dependency.
- `docs/architecture/u533-stage-scaffold-provenance.json` — the one-verdict diff is the
  artifact's own record that the template stopped asserting a destination.
- `docs/architecture/source-builder-vocabulary-render-coverage.json` — the +1 import
  closure entry is the artifact's own record that the contract module is now reachable
  from the canvas.
- Deploy run, image digest and ACA runtime invariant: to be appended after the merge.

## Known Gaps

- **The rendered gate copy is not user-reachable, and this record does not pretend it
  is.** `ScopeGate` is mounted by `ScopeAnalyticsStage`, which no route imports. That
  asymmetry was established by an earlier item and is unchanged here. The copy is fixed
  and pinned so it is correct whenever that component is mounted; backlog item 28
  ("mount or delete") owns the mounting decision.
- **The final stage's gate content is still illustrative.** Its three confirmation boxes
  and its deliverable list are template copy, declared as such by the existing beat
  provenance field. This change states the *decision* the gate asks for; deriving the
  *content* from a real tenant-scoped realized-value signal is the follow-on work, and
  its acceptance depends on this contract existing.
- **One signed-in readback remains owed on this stage and is not attempted here.** It
  needs a human session and is recorded against the backlog item rather than claimed.
- **No live request was shown to have emitted the invented onward stage**, and no attempt
  was made to construct one. The change removes the possibility rather than repairing an
  observed production failure; a reader who wants the stronger claim should treat it as
  absent, not as implied.
- The two pre-existing failing suites in the scoped run are untouched and unrelated; no
  attempt was made to fix or silence them.
