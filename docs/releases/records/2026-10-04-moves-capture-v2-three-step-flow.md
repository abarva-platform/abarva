# 2026-10-04-moves-capture-v2-three-step-flow — Moves: 3-step capture flow (flag OFF)

## Release ID

`2026-10-04-moves-capture-v2-three-step-flow`

## Status

`candidate`

## Plain-English Summary

The Moves phase screens were overloaded and hard to act on. This adds a
redesigned capture experience behind a feature flag (`moves_capture_v2`, **off
for every tenant**): each phase becomes one repeatable flow — a slim P0–P5
journey strip, a bold 3-step bar, two to three questions per step, one primary
action, and a hand-off at the end. aVa is the same Source New `AgentDock` (its
look, feel and logic), driven by the existing governed draft engine; a field can
be filled from aVa's proposal with an explicit "Insert as draft" (propose →
review, nothing written until the person acts). The final step uses the existing
`PhaseApproveAndBuild`, so generation and the gate run through the current
pipeline unchanged.

Because the flag is off everywhere, there is **no change to the live product**;
this lands the code so it can be enabled per tenant for a signed-in review.

## Layer Impact

Release lane: `experimental` — feature-flagged, non-default capability
(`moves_capture_v2`, off for all tenants).

- `4 PRODUCTS` (Moves): presentation/interaction only. Reuses the canonical
  capture sections/keys, saves/revision, structured editors, aVa draft engine,
  gate and generation pipeline — none of those change. When the flag is on,
  phases 1–5 render the 3-step flow in place of the contract-steps canvas.

## Client Applicability

- All clients: No (flag off for all).
- Specific clients: None yet.
- Internal only: No.
- Public/demo only: No.
- Feature flag: `moves_capture_v2` (tenant policy, `includeTenants: []`).

## Changes Included

- `src/lib/programs/moves-phase-step-groups.ts` — 3-step grouping of each phase's
  real capture keys (+ invariant test).
- `src/components/strategic-moves/MovesCaptureFlow.tsx` — the 3-step capture
  shell (phase strip, step bar, question panel, footer, hand-off; slots for the
  section input, the aVa dock, and the governed approve control).
- `src/components/strategic-moves/ava-dock-adapter.ts` — maps the aVa thread +
  questions to `AgentDock` shapes.
- `src/components/strategic-moves/MovesCaptureWorkspace.tsx` — composes
  `AgentDock` (aVa) around the capture flow as its workspace.
- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx` — flag-gated
  render path; reuses the structured editors, surfaces aVa drafts per field,
  renders the real `PhaseApproveAndBuild` on the final step; suppresses the old
  bespoke aVa FAB on the flag path.
- `src/lib/features/registry.ts` + the phase page — registers/resolves/passes the
  `moves_capture_v2` flag.
- Tests for all of the above.

## QA / Validation

- `jest` — **PASS**: 145/145 across the five new/affected suites
  (`MovesPhaseStandaloneClient`, `MovesCaptureFlow`, `MovesCaptureWorkspace`,
  `ava-dock-adapter`, `moves-phase-step-groups`), including flag-on/off
  integration.
- `eslint` — **PASS**: 0 errors (2 pre-existing unused-var warnings, unrelated).
- `tsc --noEmit` — **PASS**: no type errors in the changed files.
- Visual signed-in walk — **NOT RUN**: no signed-in data-backed render off the
  private data plane from a dev box. Owed once enabled for a tenant.

## Rollout Plan

Merge to `main` via squash PR. Flag is off for all tenants, so there is no
runtime behavior change on merge. Ships with the next ACA web image via the
repo-owned `aca-main-deploy` workflow. Enabling for a tenant (adding it to
`includeTenants`, or the env override) is a separate controlled change for the
signed-in review.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this change
- Approved image digest: set by the main deploy workflow at build time
- ACA runtime invariant: unchanged by this PR; proven at deploy time
- Worker image invariant: n/a
- Feature/env flag update path: `moves_capture_v2` via `includeTenants` /
  env override — a separate change, not in this PR
- Live signed-in proof required: Yes — once enabled for a tenant, a signed-in
  walk of a Move's phases confirming the 3-step flow, aVa dock, governed draft
  insert, and that the final step generates + gates. Not claimed here.

## Rollback Plan

Revert the PR, or simply leave the flag off (no tenant has it). Pure UI/flag;
no migration or data rollback.

## Audit Evidence

- PR URL: (added on open)
- CI run: (added on open)
- Local test/lint/type output recorded under QA / Validation.

## Known Gaps

- S5 remainder: relaxing the per-field evidence-lock on charter inputs is the
  evidence lane's change (coordinated separately); evidence gating is preserved
  as-is here.
- S4 polish deferred (flag-off): a paste-client-notes "fill" affordance in the
  dock, and composition polish (suppress the duplicate stage-head, move the tabs
  inside the dock).
- The Moves Home landing surface is a separate workstream (not in this PR).
- Live signed-in proof owed once enabled for a tenant.
