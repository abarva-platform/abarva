# 2026-08-21-deliverable-role-approval-strict-mode — Deliverable Role Approval Strict Mode

## Release ID

`2026-08-21-deliverable-role-approval-strict-mode`

## Status

`candidate`

## Plain-English Summary

Deliverable role approvals now use the same strict-mode switch as the rest of the Strategic Moves gate model. In pilot/default mode, a Move runner with approval authority can self-approve role-gated deliverables and carry a Move forward. In strict mode, self-approval and same-reviewer multi-role approval remain blocked.

## Layer Impact

- global-control-lane / Layer 4 Products: Updates Strategic Moves approval policy enforcement for role-gated deliverables.
- No Layer 1, Layer 2, or Layer 3 data impact. This does not mutate tenant inputs, adapters, canonical objects, projections, or retrieval indexes.

## Client Applicability

- All clients: Strategic Moves deliverable role approval behavior.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: `GATE_APPROVAL_STRICT_MODE`.

## Changes Included

- Routes deliverable role approval self-approval checks through the existing strict-mode policy switch.
- Routes same-reviewer multi-role approval checks through the existing strict-mode policy switch.
- Adds an audit note to pilot/default role approval records when the same reviewer or deliverable creator is permitted to approve.
- Adds tests proving strict-mode blocking and pilot/default approval audit notes.

## QA / Validation

- Focused approval-policy tests: pass — `npx jest --runTestsByPath src/lib/programs/__tests__/deliverable-role-approvals.test.ts --runInBand`.
- ESLint: pass — `npx eslint src/lib/programs/deliverable-role-approvals.ts src/lib/programs/__tests__/deliverable-role-approvals.test.ts`.
- TypeScript: pass — `npx tsc --noEmit --pretty false`.
- Release control: pass — `npm run release:check`.

## Rollout Plan

Merge to main through the repository PR flow. The repo-owned ACA main deploy workflow may rebuild and deploy the runtime image after merge. No migration, data-plane load, tenant-data mutation, registry activation, or runtime flag change is included.

## Deployment Authority

- Repo-owned deploy workflow: Allowed for this session.
- Shared runtime mutators: None beyond the repo-owned deploy workflow.
- Approved image digest: Captured by the ACA deploy workflow after merge.
- ACA runtime invariant: Required after deploy before claiming runtime availability.
- Worker image invariant: Required after deploy before claiming worker availability.
- Feature/env flag update path: No flag update in this release.
- Live signed-in proof required: Yes, for the blocked Strategic Moves P4 role approval and gate retry.

## Rollback Plan

Revert the PR. Strict-mode behavior remains available through the environment flag; reverting restores unconditional separation enforcement in the deliverable role-approval helper.

## Audit Evidence

- PR URL: To be added after PR creation.
- Local validation: To be added before PR.
- Runtime proof: To be captured after merge and repo-owned deploy.

## Known Gaps

- This does not approve funding, full implementation, annual savings, ROI, NPV, payback, or any live-client truth claim.
