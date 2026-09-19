# 2026-09-19-source-canvas-off-stage-label — Source canvas states when a stage is off-stage

## Release ID

`2026-09-19-source-canvas-off-stage-label`

## Status

`released`

## Plain-English Summary

Any stage of a sourcing event can be opened directly by URL, including one the
event has not reached yet and one it has already left. Until now the canvas gave
no sign of that: a stage three steps ahead of where the event actually sits
looked exactly like the live one, so a user could draft, upload and work a gate
in a stage that nothing they did would advance.

An earlier version of the canvas did say so. That statement was dropped when the
canvas was rebuilt into its three-column layout, and nothing replaced it. This
restores the statement on the surface that is mounted today, and makes it more
specific than the one that was lost: it distinguishes a stage the event has not
reached from one it has already passed, names both the stage being read and the
stage the event is actually in, and says plainly that nothing saved there
advances the event.

The notice sits above the workspace rather than inside the stage header, because
the header renders only on the step list — and evidence upload, approvals and
intelligence are exactly the panes where off-stage work is most likely.

## Layer Impact

- `global-control-lane`. Product layer 4 only, and within it one surface: the
  Source event canvas. No adapter, canonical model or data-plane change; nothing
  reads or writes a record. The notice is derived entirely from view-model
  fields the canvas already receives — the viewed stage key, the event's current
  stage key, and the journey's own stage order.

## Client Applicability

- All clients: yes. The notice renders for any tenant on any sourcing event
  whose viewed stage differs from its current stage.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The condition is the render gate.

## Changes Included

- `src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx` — adds
  `OffStageNotice` and renders it above the workspace pane.
- `src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.offStage.test.tsx`
  — five cases driving the real canvas component.

## QA / Validation

All commands run from a dedicated worktree at `origin/main` `eb077d313`, and all
gate results judged by exit code.

**Defect reproduced before any edit.** `grep -rn "Previewing" src` returned zero
matches on clean `main`. The statement had existed: it was removed in the
three-column rebuild, where it was gated on the same condition used here.

**Failing first, over the real component, not its source text.** The new suite
renders `SourceAnalyticsCanvas` — the component the event route mounts — in
jsdom: **4 failed / 1 passed before → 0 failed / 5 passed after.**

The one case that passes on unfixed code is deliberate and load-bearing: it
asserts that the notice is *absent* when the viewed stage is the current stage.
Without it the cheapest wrong repair — a notice that always renders — would
pass, and every ordinary visit to the live stage would be labelled off-stage.

**Five mutations, five caught** (failures in brackets, each file byte-restored
afterwards and the restore verified with `diff -q`):

1. Delete the render entirely [4]
2. Remove the on-stage guard so it always renders [1 — the guardrail above]
3. Render it inside `StageHeader`, i.e. on the step list only [1 — the
   non-steps-workspace case]
4. Collapse the two directions into one generic wording [1]
5. Drop the event's current stage from the wording, keeping only the viewed one
   [2]

Mutations 3 and 5 are the two that pin what makes this useful rather than
decorative: a notice a reader never sees on the pane they are uploading into,
and a notice that says "off-stage" without saying off-stage *from what*, are
both indistinguishable from the defect in practice.

**Baselines, same command either side.**

- `npx jest src/components/source/canvas/analytics`: **0 failing before, 0
  after**; 27 suites / 168 tests → 28 / 173.
- `npx jest src/components/source`: **3 suites / 3 tests failing before, 3 / 3
  after** — identical failing-suite list, all pre-existing and unrelated;
  passing 388 → 393.
- `npx jest src/__tests__/integration/source`: **25 suites / 68 tests failing
  before, 25 / 68 after** — failing-suite lists diffed and identical apart from
  one suite's elapsed-time string. Pre-existing; these suites need credentials
  this environment does not have.

**Gates.** `tsc --noEmit` exit 0 with `tsconfig.tsbuildinfo` removed first;
`eslint` over both changed files exit 0 with no output; `release:check` exit 0
against a clean tree.

The suite is deliberately *not* placed under `src/__tests__/behaviors`: that
directory is inside the coverage denominator the same CI job enforces, and a
suite mounting this canvas would pull its dependency graph into that
measurement. It runs in the AI surface control catalog job's component sweep
instead, alongside the sibling canvas suites.

## Rollout Plan

Merge to `main`. The repo-owned ACA main deploy workflow builds the image and
shifts traffic; no migration, no flag, no operator step. The change is inert for
any event whose viewed stage equals its current stage, which is the ordinary
case, so the blast radius on merge is a new element on off-stage visits only.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, on merge
  to `main`. No manual Azure command was run for this change.
- Shared runtime mutators: none. No env var, flag, scale or secret change.
- Approved image digest: recorded below once the deploy run completes.
- ACA runtime invariant: to be proven after merge — Container App template image
  must equal the 100%-traffic revision image, digest-pinned.
- Worker image invariant: both non-manual worker jobs must carry the same digest.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: **yes.** This changes what a reader sees on a
  mounted surface, so the proof that belongs to it is a signed-in session
  opening an event at a stage other than its current one.

## Rollback Plan

Revert the PR and let the deploy workflow ship the previous digest. The change
is additive and read-only — one conditional element in one component, no schema,
no migration, no persisted state — so revert restores the prior surface exactly
and there is nothing to unwind.

## Audit Evidence

- The pull request and its CI run.
- The new suite executing in the real CI job before merge, not merely present.
- The failing-first, after, and five mutation results recorded above.
- The three before/after baselines above, each run with the same command on
  either side.
- The ACA deploy run keyed at or after the merge SHA, and the runtime-invariant
  readback.

## Known Gaps

- **Signed-in acceptance is owed and was not attempted.** A visible change on a
  mounted surface deserves a browser check, and this run had no human present to
  authorize a session against a shared lab environment. Merged and deployed is
  not live-proven; this record does not claim it.
- **The wording is a judgement, not a measured one.** No one has read this
  notice next to the other statements on the canvas to check it does not compete
  with the readiness counter for attention. The substance — direction, both
  stage names, and the consequence — is pinned by tests; the phrasing is not,
  deliberately, so it can be improved without fighting an assertion.
- **The unknown-direction branch has no test.** When either stage falls outside
  the event's own journey the notice renders without a direction. That is
  reachable only for a motion that hides the stage being viewed, which the
  current journeys do not produce through this route, so it is written to fail
  safe rather than covered by a case that would have to invent the state.
