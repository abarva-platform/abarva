# 2026-08-21-p4-readiness-change-plan — P4 Readiness And Change Plan

## Release ID

`2026-08-21-p4-readiness-change-plan`

## Status

`candidate`

## Plain-English Summary

The P4 generation batch now produces the readiness and change plan required by the P4 exit gate. This keeps the gate honest: phase advancement depends on a reviewed readiness artifact instead of raw capture text or an unrelated document.

## Layer Impact

- global-control-lane / Layer 4 Products: Updates the Strategic Moves deliverable registry, orchestrator mapping, artifact profile, and quality bar for the P4 workflow.
- No Layer 1, Layer 2, or Layer 3 data impact. This does not mutate tenant inputs, adapters, canonical objects, or projections.

## Client Applicability

- All clients: Strategic Moves P4 generation and gate-readiness behavior.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Adds `readiness_and_change_plan` to the P4 canonical deliverable set.
- Adds a fixed, compact readiness/change structure and quality bar.
- Registers the artifact in the deliverable profile and orchestrator key maps.
- Adds regression coverage for phase membership, orchestrator routing, and fixed readiness structure.
- Adds a non-generic quality bar for the existing P3 requirements traceability artifact so canonical phase artifacts do not fall through the generic quality profile.

## QA / Validation

- `npx jest --runTestsByPath src/lib/deliverables/orchestrator/__tests__/brief-library.test.ts src/lib/programs/__tests__/phase-deliverables.test.ts src/lib/programs/__tests__/orchestrated-deliverable-map.test.ts --runInBand` — passed, 33/33.

## Rollout Plan

Merge to main through the repository PR flow. The repo-owned ACA main deploy workflow may rebuild and deploy the runtime image after merge. No migration, feature flag, data-plane load, tenant-data mutation, or registry activation is required.

## Deployment Authority

- Repo-owned deploy workflow: Allowed for this session.
- Shared runtime mutators: None beyond the repo-owned deploy workflow.
- Approved image digest: Captured by the ACA deploy workflow after merge.
- ACA runtime invariant: Required after deploy before claiming runtime availability.
- Worker image invariant: Required after deploy before claiming worker availability.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, for the Strategic Moves P4 generation/gate proof.

## Rollback Plan

Revert the PR. Existing signed artifacts remain immutable records; future P4 generation would return to the prior four-artifact batch until the reverted change is restored.

## Audit Evidence

- PR URL: To be added after PR creation.
- Local validation: Targeted Jest command listed above.
- Runtime proof: To be captured after merge and repo-owned deploy.

## Known Gaps

- This does not itself record business or finance role approvals for any business-case deliverable.
- This does not approve funding, full implementation, annual savings, ROI, NPV, payback, or any live-client truth claim.
