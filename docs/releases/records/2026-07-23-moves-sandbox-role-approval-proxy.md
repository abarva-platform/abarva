# 2026-07-23-moves-sandbox-role-approval-proxy

## Release ID

`2026-07-23-moves-sandbox-role-approval-proxy`

## Status

`candidate`

## Plain-English Summary

The sanctioned First Capital P0-P5 sandbox proof reached P4 and correctly found
that Business Case approval requires separate Business and Finance role
approvals. The previous route-policy alignment allowed the signed-in automation
persona to reach the role-approval endpoint, but the deeper deliverable control
then blocked with `self_approval_violation`: the automation persona created the
client-approved sandbox deliverable and therefore could not approve it as the
business or finance role.

That control is correct for real Moves. This release keeps it intact and adds a
narrow, explicit sandbox proxy path only for `Codex Proof...` Moves. A caller
must have `canApproveGates`, must explicitly send `sandboxProxyApproval: true`,
and the Move name must start with `Codex Proof`. The stored approver user id is
marked as a role-scoped sandbox proxy (`sandbox-proxy:<role>:<actor>`) so this
cannot be mistaken for a real client identity. The endpoint also now returns
policy violations as clear `409` responses instead of leaking them as generic
500s.

## Layer Impact

- `global-control-lane`: shared Moves deliverable role-approval API and helper.
- No schema change.
- No change to production role-approval controls for real client Moves.

## Client Applicability

- All clients: no, normal Moves retain the same no-self and separation-of-duties
  enforcement.
- Specific clients: First Capital sandbox proof Move only.
- Internal only: yes, this is for sanctioned `Codex Proof` E2E proof workflow.
- Public/demo only: no.
- Feature flag: none; guarded by explicit request plus `Codex Proof` Move name.

## Changes Included

- `src/lib/programs/deliverable-role-approvals.ts`
  - Adds an opt-in `sandboxProxyApproval` option.
  - Preserves normal `self_approval_violation` and
    `separation_of_duties_violation` behavior by default.
  - Records sandbox proxy approvals with role-scoped proxy ids.
- `src/app/api/v1/programs/[programId]/deliverables/[deliverableId]/role-approvals/route.ts`
  - Allows `sandboxProxyApproval: true` only when the caller can approve gates
    and the Move name starts with `Codex Proof`.
  - Returns self-approval / separation failures as `409` with actionable detail.
- `src/lib/programs/__tests__/deliverable-role-approvals.test.ts`
  - Adds regression coverage proving the sandbox proxy path does not collapse
    both roles onto one stored approver identity.

## QA / Validation

- Pass: `npx jest src/lib/programs/__tests__/deliverable-role-approvals.test.ts --runInBand`
- Pass: `npx eslint src/lib/programs/deliverable-role-approvals.ts src/app/api/v1/programs/[programId]/deliverables/[deliverableId]/role-approvals/route.ts`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json`
- Pending: `npm run release:check`
- Pass: `git diff --check`
- Pending: ACA deploy and signed-in First Capital sandbox P4 retry.

## Deployment Authority

Deployment authority is the repo-owned ACA main deploy workflow for
`app.abarva.ai`. This release must not be proven from a local dev server,
feature branch deploy, Vercel URL, or ad-hoc ACA template mutation. After merge,
proof requires the ACA web template image, the 100% traffic revision image, and
the worker job images to match the approved digest for the merge SHA.

## Rollout Plan

Merge by PR to `main`, deploy through the repo-owned ACA main deploy workflow,
verify web and worker runtime invariant, then retry the First Capital sandbox P4
role approvals and gate approval. Continue to P5 only after P4 advances.

## Rollback Plan

Revert this release and redeploy. Rollback removes only the sandbox proxy path
and the improved `409` response handling; normal role-approval enforcement
returns to the prior behavior.

## Known Gaps

- This does not create a general multi-persona Clerk test lane. The long-term
  test solution should provision explicit business/finance/sponsor personas per
  tenant so sandbox proof does not need a proxy path.
- This does not change real client separation-of-duties policy.
- This does not advance the First Capital sandbox by itself; P4 must still be
  retried in a signed-in browser/API proof after ACA deployment.
- This does not address unrelated Moves UX gaps discovered during the P0-P5
  run, including upload-list visibility, document length controls, and workflow
  clarity.

## Audit Evidence

- Pre-fix signed-in proof:
  `/tmp/firstcapital-p4-role-policy-live-2026-07-23T20-20-41-613Z/result.json`
  showed role-approval POSTs returning `self_approval_violation` and P4 gate
  still blocked on `business_case_approved`.
- PR, merge SHA, ACA invariant, and post-fix signed-in proof: pending.
