# 2026-10-09 — Moves step page template and P3 Gate readiness

## Release ID

`2026-10-09-moves-gate-readiness-step-page`

## Status

`candidate`

## Plain-English Summary

Moves phases are being rebuilt on one finalized step page template: every step
answers "what should I do to move forward?" first, in one sentence, with the
work grouped below it (needs your decision, drafts to review, settled). This
change ships the template itself and its first step, P3 Gate readiness, behind
a flag that is on only for the synthetic demo tenant.

On the Gate readiness page the consultant sees the gate's checks (from the
gate evaluator, with each unmet check's reason), builds the gate documents,
signs each one off against its current version, writes the approval
rationale, and approves and submits the phase in one action. Before this, the
build automatically submitted the gate with a fixed sentence as the recorded
rationale, sign-off lived in two places under two labels, and a consultant had
to leave the phase steps to cross the gate.

aVa is not redrawn: the step page renders as the workspace of the product's
existing aVa dock (the same collapse, hide, expand and full-screen behaviour,
the same Ask aVa mark and the same thread as the capture flow), and aVa's
step briefing is its opening turn.

Nothing about what the gate requires changes. The page uses the same build,
sign-off and gate-submission paths the existing control uses; it only changes
where the consultant acts, and records the approver's own rationale.

## Layer Impact

- Release lane: `global-control-lane` (feature-flagged; on for the synthetic
  demo tenant only).
- Product projection: Moves phase workspace. New flagged branch renders the
  Gate readiness step page for P3 at `?step=gate`; with the flag on, the
  capture flow's final P3 step links to it instead of rendering the old
  build-and-sign ledger.
- Shared logic, behaviour-neutral for existing surfaces:
  - the deliverable sign-off request moved into one hook used by the existing
    sign-off control and the new page;
  - the phase document build (enqueue, run polling, settlement) moved verbatim
    into one hook used by the existing build control and the new page;
  - the P3 document set reads the same change-profile rule as capture and step
    depth (`resolveChangeProfile`), replacing a third copy of the rule;
  - gate criteria now carry the evaluator's reason on an unmet criterion
    (additive optional field).
- Gate submission accepts an optional human rationale; without one it records
  the same sentence as before.
- Canonical model: no schema, data or tenant change.
- Document generation: unchanged.

## Client Applicability

- All clients: shared refactors only, with no behaviour change.
- Specific clients: the step page is enabled for the synthetic demo tenant.
- Internal only: no.
- Public/demo only: no.
- Feature flag: `moves_step_pages_v3` (tenant policy, demo tenant only;
  requires `moves_capture_v2`).

## Changes Included

- `src/lib/programs/step-page-model.ts` (new): the template's rules — row
  groups, the next-action sentence (three-clause cap), the settled count and
  the five page states.
- `src/lib/programs/gate-readiness-step.ts` (new): gate checks, document
  sign-off states (signed, superseded, unsigned, unknown when the sign-off
  read failed), the next action, and when approve-and-submit is offered.
- `src/components/strategic-moves/step-page/` (new): `MovesStepPage` (the
  template, ported from the final design's stylesheet with scoped light/dark
  tokens) and `GateReadinessStep`.
- `src/components/strategic-moves/use-deliverable-sign-off.ts`,
  `use-phase-document-build.ts` (new): the shared governed paths.
- `DeliverableApprovalAction.tsx`, `PhaseApproveAndBuild.tsx`: consume the
  shared hooks; behaviour unchanged.
- `MovesPhaseStandaloneClient.tsx`, the phase page: flagged mount and entry
  link; optional human rationale on gate submission.
- `MovesCaptureWorkspace.tsx`: optional `content` (a step page in place of the
  capture flow) and `openingBriefing` (aVa's first turn) on the existing dock.
- `deliverable-registry.ts`: P3 document set reads `resolveChangeProfile`.
- `transformers.ts`, `types.ui.ts`: optional `reason` on gate criteria.
- `src/lib/features/registry.ts`: `moves_step_pages_v3`.
- `.github/workflows/ai-surface-control-catalog.yml`: the new step-page suite
  directory is swept as a directory.

## QA / Validation

- New suites: step page model (25), gate readiness model (23), step page
  render (13), gate readiness render (13), host mount (5).
- Mutation checks: 7 on the template rules, 9 on the gate readiness model and
  page (submit without rationale, non-approver submit, unreadable gate read as
  unmet, unread sign-off shown, superseded read as signed, no checks read as
  ready, rationale dropped from the submission, rebuild without the
  signed-version warning, acknowledgement dropped), 4 on the host flag guards.
  Every mutation failed the suites; files restored.
- Existing suites: the 9 suites covering the build control (431 tests), the
  sign-off control, the host and capture-flow suites, the document-set suites
  and the approval write-route coverage behaviours pass unchanged — 22 suites,
  651 tests in the final combined run.
- `npm run typecheck` (includes tests), ESLint and Prettier on new files.
- Visual: the real component rendered with fixture data and compared with the
  final design at 1440px and 375px, light and dark, in the in-progress,
  not-built, non-approver and blocked states. No horizontal overflow; main
  renders before Ava on a phone.

## Rollout Plan

Merge through the protected main branch. The repo-owned ACA main deploy
workflow builds and deploys the digest-pinned image. The flag is on only for
the synthetic demo tenant; no migration or data job.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: assigned by the workflow.
- ACA runtime invariant: verify web template and serving revision match the
  approved digest.
- Worker image invariant: verify required worker images match the approved
  digest.
- Feature/env flag update path: code registry (`includeTenants`).
- Live signed-in proof required: open the demo Move's P3 at `?step=gate` as
  an approver and as a non-approver; confirm checks, document states and the
  held submission match the gate.

## Rollback Plan

Remove the demo tenant from `moves_step_pages_v3` (or revert through a pull
request). The flag-off path renders exactly as before; the shared hooks are
behaviour-neutral, so no data needs repair.

## Audit Evidence

- Pull request and CI results.
- The suites and mutation results above.

## Known Gaps

- The approval rationale is written by the approver; Ava drafting it is a
  later increment.
- A build rebuilds the phase's whole document set, so rebuilding one failed
  document supersedes every signature; the page says so before rebuilding.
  Per-document rebuild needs a generate-phase change.
- Not yet on the page: the advisory risk band row, the readiness workbook
  context line, the "What Roadmap will inherit" card, and P3 Steps 1–4 as
  step pages (they remain the existing capture flow).
