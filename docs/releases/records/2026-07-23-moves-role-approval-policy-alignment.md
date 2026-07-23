# 2026-07-23-moves-role-approval-policy-alignment — Moves Role Approval Policy Alignment

## Release ID

`2026-07-23-moves-role-approval-policy-alignment`

## Status

`candidate`

## Plain-English Summary

Moves phase gates can require a deliverable to be signed off and independently approved by named role categories. The P4 Business Case requires business and finance approval before the Move can advance. During the First Capital sandbox P4 proof, the signed-in test persona was allowed to approve phase gates but was blocked from recording those required role approvals. This release aligns the deliverable role-approval endpoint with the same Move access policy used by phase-gate approval and client-approved artifact acceptance.

## Layer Impact

- Global control lane: Updates shared Strategic Moves approval-route authorization. It does not alter gate criteria, role requirements, candidate data behavior, data-layer promotion, or generated artifact content.

## Client Applicability

- All clients: Applies wherever Strategic Moves deliverable role approvals are enabled.
- Specific clients: First Capital sandbox proof exposed the issue.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None; this aligns an existing governed endpoint with existing access-policy behavior.

## Changes Included

- `src/app/api/v1/programs/[programId]/deliverables/[deliverableId]/role-approvals/route.ts`
  - Adds `loadUserProgramAccessPolicy`.
  - Allows callers with `canApproveGates` to record required deliverable role approvals.
  - Preserves existing `hasAuthority('approver')`, founder, and maestro paths.

## QA / Validation

- Pass: `npx eslint src/app/api/v1/programs/[programId]/deliverables/[deliverableId]/role-approvals/route.ts`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json`
- Pass: `git diff --check`
- Pass: `npm run release:check`
- Pending signed-in proof: Re-run First Capital sandbox business and finance role approvals.
- Pending signed-in proof: Re-run P4 phase gate approval and confirm P4 advances to P5.

## Rollout Plan

Merge through PR to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the digest-pinned web image. After deployment, verify the ACA runtime invariant and rerun the signed-in First Capital sandbox P4 proof.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Pending deploy.
- ACA runtime invariant: Pending deploy.
- Worker image invariant: Pending deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, First Capital sandbox P4 role approvals and phase gate.

## Rollback Plan

Revert the PR and redeploy through the ACA main deploy workflow. Rollback restores the stricter legacy endpoint behavior where `canApproveGates` alone cannot record deliverable role approvals.

## Audit Evidence

- First Capital sandbox blocked proof: `/tmp/firstcapital-p4-post-approval-2026-07-23T20-05-40-845Z/result.json`
- P4 generation/capture proof: `/tmp/firstcapital-p4-resume-2026-07-23T19-55-48-684Z/result.json`
- PR URL: Pending.
- ACA deploy proof: Pending.
- Live post-fix proof: Pending.

## Known Gaps

- This does not change the P4 Business Case requirement for business and finance approval.
- This does not address P4 generated document length/quality warnings.
- This does not change the multiple-upload UI limitation or File Cabinet display gaps.
