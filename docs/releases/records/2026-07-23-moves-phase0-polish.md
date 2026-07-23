# 2026-07-23-moves-phase0-polish — Moves phase workspace visual polish

## Release ID

`2026-07-23-moves-phase0-polish`

## Status

`candidate`

## Plain-English Summary

This is the Phase 0 Moves audit remediation slice. It polishes the live phase
workspace shell without changing gate rules, Approve & Build behavior,
generation, evidence persistence, schema, or tenant data.

The active contract-card phase shell now avoids showing saved input text twice,
removes the non-informative static "Provide" badge, splits phase progress into
workflow/gate/stage rows, keeps an owning workflow row active while users edit
inputs, gives next-phase readiness needs default visibility when real needs
exist, and tightens the phase lede copy.

## Layer Impact

- `global-control-lane`: shared Moves UI rendering only. The change affects the
  Strategic Moves phase workspace presentation for all tenants that can access
  the shared Moves runtime.
- No `client-data-lane` change. No data-plane write, loader, schema, migration,
  retrieval, or tenant-context mutation.

## Client Applicability

- All clients: yes, for users who access Strategic Moves phase workspaces.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`
  - removes duplicate captured-value rendering from the contract-card input
    detail pane
  - removes the static detail-top "Provide" badge
  - separates phase progress into workflow, gate, and stage rows
  - widens the phase lede line measure from `64ch` to `82ch`
  - maps selected input sections to one owning workflow row for active-state
    continuity
  - defaults next-phase readiness chips open when concrete needs exist
  - tightens phase `lede` copy and exports a copy audit helper
- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`
  - adds regression coverage for duplicate-input removal, workflow ownership,
    progress-card hierarchy, default visible readiness chips, and copy sentence
    length.

## QA / Validation

- `npx prettier --write src/components/strategic-moves/MovesPhaseStandaloneClient.tsx src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx` — passed.
- `npx jest src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx --runInBand` — passed, 47 tests.
- `git diff --check` — passed.
- `npm run release:check` — passed.
- `npx eslint src/components/strategic-moves/MovesPhaseStandaloneClient.tsx src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx` — passed.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` —
  blocked by existing Home dependency resolution errors for `@xyflow/react` and
  `@dagrejs/dagre`, outside this Moves Phase 0 slice.

Known test-run noise: Jest still reports pre-existing duplicate manual mock
warnings for markdown packages, and React still logs an existing `act(...)`
warning from the evidence-upload effect. Neither warning is introduced by this
change and the targeted suite exits 0.

## Rollout Plan

Merge to `main`, then deploy through the approved ACA main workflow for the
shared app runtime. Because this touches the shared Moves phase component, call
it `merged` after PR merge, `deployed` only after the ACA workflow completes,
and `live-proven` only after signed-in browser verification on a sandbox Move.

## Deployment Authority

- Repo-owned deploy workflow: required for live runtime rollout.
- Shared runtime mutators: none in this PR.
- Approved image digest: to be produced by the ACA main deploy workflow.
- ACA runtime invariant: required before claiming deployed/live.
- Worker image invariant: unaffected.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, before calling this live-proven.

## Rollback Plan

Revert this PR and redeploy through the ACA main workflow. No data rollback is
needed because this change does not mutate schema, tenant data, artifacts, gate
state, or generated deliverables.

## Audit Evidence

- PR URL: pending.
- Targeted test: `npx jest src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx --runInBand`.
- Release gate: pending.
- Signed-in browser proof: pending after deploy.

## Known Gaps

- Phase 1-3 items from the Moves audit handoff are out of scope.
- The deliverable digestion/rendering tracks A-D are out of scope.
- No ACA deploy or signed-in browser proof has been performed yet.
