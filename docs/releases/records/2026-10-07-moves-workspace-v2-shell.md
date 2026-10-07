# 2026-10-07-moves-workspace-v2-shell — Moves phase-workspace v2 shell (Increment 1)

## Release ID

`2026-10-07-moves-workspace-v2-shell`

## Status

`candidate`

## Plain-English Summary

Increment 1 of the Moves phase-workspace redesign: the phase-workspace **shell**,
behind a new feature flag that is OFF for everyone by default. With the flag off,
the product renders exactly as it does today.

Today the redesigned capture flow shows two navigators stacked with the legacy
gate stepper and a competing workspace-tab row, so a person works a phase through
several bars that each claim to be "where you are". This change consolidates that
into one clear structure:

- **One slim phase rail.** The capture flow presents a single slim P0–P5 rail plus
  a non-interactive hand-off-to-delivery marker. The stacked legacy gate stepper
  and the repeated stage head come off the phase view.
- **A four-stage sub-step spine.** Within a phase, the step bar becomes the
  redesign's four-stage shape — CAPTURE steps (the phase's real step groups), then
  a GENERATE bridge, an OUTCOME step (the existing hand-off recap), and a
  GATE/attest step — in the v3 locked-light palette.
- **Readiness-workbook actions move to the gate step.** The download / upload /
  preview readiness-workbook controls used to sit on the per-step stage head, so
  they read as "across all steps". They now sit on the phase's gate step, beside
  the governed approve control, in one consistent place for every phase.
- **Workspace views stay reachable as a secondary control.** Files & Evidence,
  Intelligence and Approvals remain reachable, de-emphasised out of the primary
  phase-flow chrome.

This is a presentation and arrangement change only. The capture fields, structured
inputs, saves and autosave, the gate/approve pipeline, evidence, approvals and the
readiness-workbook upload/accept all behave exactly as before; the capture flow's
view-state machine, resume, Continue-gating and hand-off recap reachability are
untouched.

## Layer Impact

Lane: `global-control-lane`.

- **Products (Moves):** the phase-workspace presentation layer only. No product
  owns data here and none is introduced — the capture flow is a projection of the
  canonical capture-contract sections, which this change neither reads differently
  nor writes. No change to the canonical model, loaders, adapters, tenancy, or any
  gate/evidence logic.

## Client Applicability

- All clients: no — flag is OFF by default, so behaviour is unchanged.
- Specific clients: none enrolled in this change.
- Internal only: no.
- Public/demo only: intended for signed-in review enrolment later, per the flag.
- Feature flag: `moves_workspace_v2` (`tenant` policy, `includeTenants: []`,
  default OFF). Conjoined server-side with `moves_capture_v2`; it subsumes the
  `moves_capture_composition_v1` polish in the host.

## Changes Included

- `src/lib/features/registry.ts` — adds the `moves_workspace_v2` flag (default OFF).
- `src/app/(maestro)/strategic-moves/[moveId]/phase/[phaseNum]/page.tsx` — resolves
  `workspaceV2Enabled` as the conjunction with `moves_capture_v2` and passes it to
  the host.
- `src/components/strategic-moves/MovesCaptureFlow.tsx` — flag-gated slim phase
  rail, four-stage sub-step spine, v3 light tokens, and a `gateExtras` slot for the
  gate step. Legacy presentation unchanged when the flag is off.
- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx` — threads the
  flag, folds it into the composition path, moves the readiness-workbook actions
  onto the capture flow's gate step, and de-emphasises the workspace-view row.
- `src/lib/programs/moves-workspace-v2-spine.ts` — new pure module deriving the
  four-stage spine from the real step groups and the current view.
- Tests: `moves-workspace-v2-spine.test.ts` (new), plus v2-shell cases added to
  `MovesCaptureFlow.test.tsx` and `MovesPhaseStandaloneClient.test.tsx`.

## QA / Validation

- `npx jest src/components/strategic-moves/__tests__ src/lib/programs/__tests__/moves-workspace-v2-spine.test.ts` — 45 suites, 672 + 13 tests pass.
- `npx jest --runTestsByPath .../MovesCaptureFlow.test.tsx` — 33 pass (incl. the v2
  shell cases and a flag-off control case pinning the legacy chrome unchanged).
- `npx jest --runTestsByPath .../is-feature-enabled.test.ts` — 16 pass.
- `tsc --noEmit` — clean.
- `npx eslint` on all changed files — 0 errors (2 pre-existing unused-import
  warnings, not introduced here).
- `npm run release:check -- --base origin/main --head HEAD` — pass.

## Rollout Plan

Merge to `main` via squash after human review (auto-merge intentionally NOT
enabled). No runtime rollout is triggered by this change: the flag is OFF for every
tenant, so merging changes no client's behaviour. Enrolment for signed-in review is
a later, separate flag flip through the normal feature-flag path.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (unchanged).
- Shared runtime mutators: none — this PR mutates no shared runtime.
- Approved image digest: n/a (no image/runtime change in this PR).
- ACA runtime invariant: unaffected (no deploy in this PR).
- Worker image invariant: unaffected.
- Feature/env flag update path: `moves_workspace_v2` ships OFF; any later enrolment
  goes through `includeTenants` / the approved env override, not this PR.
- Live signed-in proof required: not for this PR (flag OFF, no behaviour change);
  required before any future enrolment flip is called live-proven.

## Rollback Plan

Revert the PR, or leave the flag OFF (its default), which already disables every
behaviour in this change. No migration, data build, or runtime image is involved,
so there is no state to roll back.

## Audit Evidence

- PR URL: see the pull request opened for branch `feat/moves-v2-shell`.
- CI: the PR's checks on `main`.
- Test output: the jest / tsc / eslint / release:check results listed under
  QA / Validation.

## Known Gaps

- This is the SHELL only. The OUTCOME step currently shows the existing hand-off
  recap; the findings/charts/intelligence content is deferred to later increments.
- The GENERATE and GATE spine stages are faithful markers; the governed
  generate+approve control itself stays in the footer / recap, unchanged.
- Increments 2–4 (outcome findings surface, charts/intelligence, full content
  polish) are tracked separately.
