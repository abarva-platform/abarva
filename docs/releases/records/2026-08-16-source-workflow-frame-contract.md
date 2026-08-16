# 2026-08-16-source-workflow-frame-contract — Source Workflow Frame Shared Contract

## Release ID

`2026-08-16-source-workflow-frame-contract`

## Status

`candidate`

## Plain-English Summary

Source New Event and Optimize Contract now use one shared layout primitive for the left journey rail plus right workflow canvas. This prevents the two Source workflows from silently drifting when a width, rail, or canvas-frame fix lands on only one surface.

## Layer Impact

- Product UI: shared Source layout contract only.
- Data plane: no impact.
- Workflow persistence: no impact.
- Auth, upload, parser, approvals, and vendor dispatch: no impact.

## Client Applicability

- All clients: applies to clients using Source New Event or Source Optimize Contract.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none added.

## Changes Included

- Adds `src/components/source/SourceWorkflowFrame.tsx`.
- Updates `src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx` to use the shared frame for New Event.
- Updates `src/components/source/SourceOptimizeContractPage.tsx` to use the shared frame for Optimize Contract.
- Adds `src/components/source/__tests__/SourceWorkflowFrame.contract.test.ts` to catch drift back to hard-coded per-surface grid declarations.

## QA / Validation

- `pass` — `npm test -- --runTestsByPath src/components/source/__tests__/SourceWorkflowFrame.contract.test.ts src/components/source/__tests__/SourceOptimizeContractPage.test.tsx src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.newEventJourneySmoke.test.tsx --runInBand` passed, 38/38. Jest printed the existing duplicate manual mock warnings for markdown helpers.
- `pass` — `npx eslint src/components/source/SourceWorkflowFrame.tsx src/components/source/SourceOptimizeContractPage.tsx src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx src/components/source/__tests__/SourceWorkflowFrame.contract.test.ts`.
- `pass` — `npm run release:check -- --base origin/main --head HEAD`.

## Rollout Plan

Merge by PR to `main`, then use the repo-owned Azure Container Apps main deploy workflow. No manual runtime mutation is required.

## Deployment Authority

- Repo-owned deploy workflow: required for production rollout after merge.
- Shared runtime mutators: none in this change.
- Approved image digest: to be produced by the ACA main deploy workflow.
- ACA runtime invariant: required after deploy before claiming live.
- Worker image invariant: required after deploy before claiming live.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, visual/DOM proof for New Event and Optimize Contract shell width after deploy.

## Rollback Plan

Revert the PR. Both Source workflows would return to their prior local layout declarations. No data rollback is needed.

## Audit Evidence

- PR URL: pending.
- Local focused tests: passed as listed above.
- Local eslint: passed as listed above.
- Release gate: pending rerun after record correction.
- ACA deploy run: pending after merge.
- Signed-in browser proof: pending after deploy.

## Known Gaps

- This does not consolidate the workflow bodies, evidence logic, parser behavior, approval movement, or generated artifacts.
- This does not complete a broader Optimize Contract holistic design review; it only prevents layout-shell drift between Source New Event and Optimize Contract.
