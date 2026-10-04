# 2026-10-03 — Moves P3–P5 Workflow Clarity

## Release ID

`2026-10-03-moves-workflow-clarity`

## Status

`candidate`

## Plain-English Summary

P3–P5 workflow bodies now leave the step header as the single place for the next primary action. Redundant decision-upload and evidence-navigation buttons are removed from those steps, and the final approval step no longer repeats the full editable input form. Structured baseline facts must contain at least one parsed row before the shared Continue action treats them as complete.

## Layer Impact

- Release lane: `global-control-lane` — shared Moves workflow presentation for all clients.
- **Layer 4 — Products / Moves:** Presentation and step-level completeness feedback only. No tenant facts, saved values, gate criteria, evidence policy, approvals, or artifact generation are changed.

## Client Applicability

- All clients: Shared Moves workflow presentation.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None; uses the existing shared phase canvas.

## Changes Included

- P3 decision step keeps a non-actionable note directing users to Files & Evidence; the step header remains the sole next-step action.
- P4 value evidence count is informational rather than a second navigation action.
- P3–P5 final approval screens no longer render a duplicate compact input editor; existing input steps remain available in the phase navigation.
- Empty structured facts arrays remain incomplete for Continue; existing structured validation for business-change, solution-route, and estimate-model captures is preserved.
- Regression coverage verifies one header action, progressive disclosure, final-step layout, and empty-facts blocking.

## QA / Validation

- `npx jest src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx --runInBand --silent` — 120 tests passed.
- `npx eslint src/components/strategic-moves/MovesPhaseStandaloneClient.tsx src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx` — zero errors; two existing unused-variable warnings.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` — exit 0, no diagnostics. The default-heap attempt exhausted the local Node heap; the 6 GB retry passed.
- `npm run release:check -- --base origin/main --head HEAD` — 11/11 gates passed.
- Live signed-in P3–P5 walk — required after deployment; not yet performed.

## Rollout Plan

Merge through a squash PR to `main`. Production rollout is exclusively through `.github/workflows/aca-main-deploy.yml`. No migration or feature-flag change is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: None outside the approved workflow.
- Approved image digest: Pending the exact merge-SHA workflow run.
- ACA runtime invariant: Must be verified before claiming deployed/live.
- Worker image invariant: Must match the approved digest where required by the release workflow.
- Feature/env flag update path: None.
- Live signed-in proof required: Walk a Move through P3, P4, and P5; verify one primary next action, capture-dependent readiness, and next-phase preparation shown only on Approve & Build.

## Rollback Plan

Revert the release commit through a follow-up PR and deploy it through the repo-owned ACA main deploy workflow. No data rollback is required because the change does not alter persisted data or workflow decisions.

## Audit Evidence

- PR: Pending.
- Focused Jest output: 120/120 passed.
- CI, deployment, runtime invariant, and signed-in walk: Pending.

## Known Gaps

The release is not live-proven until the exact merged revision is deployed, the ACA image invariant is verified, and the signed-in P3–P5 walk is captured.
