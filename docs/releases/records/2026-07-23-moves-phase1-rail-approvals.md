# 2026-07-23-moves-phase1-rail-approvals — Moves mobile rail and approval role labels

## Release ID

`2026-07-23-moves-phase1-rail-approvals`

## Status

`candidate`

## Plain-English Summary

This is the first Phase 1 Moves audit remediation slice. It keeps phase and
workspace navigation reachable when the desktop side rail is hidden on narrow
screens, and it removes the static "Sponsor" label from the Approvals overview.

The Approvals overview now derives role labels from the existing deliverable
role-approval policy. Phases with no per-role approval requirement show a clear
"Not yet assigned" state instead of implying every phase has a Sponsor
approver.

## Layer Impact

- `global-control-lane`: shared Strategic Moves UI presentation and client
  navigation only.
- No `client-data-lane` change. No schema, migration, tenant-context, artifact,
  evidence, or gate-state mutation.

## Client Applicability

- All clients: yes, for users who access Strategic Moves phase workspaces.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`
  - adds compact phase/workspace controls for narrow layouts
  - keeps Files & Evidence, Phase Intelligence, Approvals, and phase switching
    reachable below the desktop rail breakpoint
  - derives Approvals overview role labels from existing deliverable role
    requirements
  - shows "Not yet assigned" for phases without a named/per-role requirement
- `src/lib/programs/deliverable-role-approval-policy.ts`
  - extracts the existing role-approval labels and requirement policy into a
    client-safe shared module
- `src/lib/programs/deliverable-role-approvals.ts`
  - re-exports the shared policy for existing server-side callers
- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`
  - adds regression coverage for compact navigation and non-static approvals
    role labels

## QA / Validation

- PASS — `npx prettier --write src/components/strategic-moves/MovesPhaseStandaloneClient.tsx src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx src/lib/programs/deliverable-role-approvals.ts src/lib/programs/deliverable-role-approval-policy.ts docs/releases/records/2026-07-23-moves-phase1-rail-approvals.md`.
- PASS — `npx jest src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx --runInBand`, 48 tests.
- PASS — `npx eslint src/components/strategic-moves/MovesPhaseStandaloneClient.tsx src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx src/lib/programs/deliverable-role-approvals.ts src/lib/programs/deliverable-role-approval-policy.ts`.
- PASS — `git diff --check`.
- BLOCKED locally, unrelated Home dependency resolution — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` reports missing `@xyflow/react` and `@dagrejs/dagre` declarations from Home files, outside this Moves Phase 1 slice.
- PASS — `npm run release:check`.
- PENDING — PR CI.
- PENDING — ACA deploy and signed-in browser proof after merge.

## Rollout Plan

Merge to `main`, then deploy through the approved ACA main workflow for the
shared app runtime. Because this touches the shared Moves phase component, call
it `merged` after PR merge, `deployed` only after the ACA workflow completes,
and `live-proven` only after signed-in browser verification on a reachable Move.

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
needed because this change does not mutate schema, tenant data, artifacts,
evidence, gate state, or generated deliverables.

## Audit Evidence

- PR URL: pending.
- Targeted test: pending.
- Release gate: pending.
- Signed-in browser proof: pending after deploy.

## Known Gaps

- Phase 1.3 Moves chat rich-answer wiring is out of scope for this PR.
- Phase 2-3 audit remediation items are out of scope.
- Deliverable digestion/rendering Tracks A-D are out of scope.
