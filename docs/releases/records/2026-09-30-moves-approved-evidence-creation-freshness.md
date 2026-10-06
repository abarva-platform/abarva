# 2026-09-30 — Moves Approved Evidence Creation Freshness

## Release ID

`2026-09-30-moves-approved-evidence-creation-freshness`

## Status

`candidate`

## Plain-English Summary

Legacy phase approvals are now invalidated when an approved evidence object was created after the approval, even if its review timestamps do not show that later activity. This keeps old outputs from satisfying a gate after the approved evidence set has changed.

## Layer Impact

- `global-control-lane`: corrects Moves phase-approval freshness evaluation for all tenants without changing the approval policy.
- `client-data-lane`: no schema, migration, or data mutation. The read path remains scoped to the current tenant and Move.

## Client Applicability

- All clients: yes, after the shared application deployment.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Approved-evidence freshness now considers both review activity and the creation timestamps of the approved evidence rows included in the current revision.
- Regression coverage proves a later-created approved evidence object reopens a legacy phase approval.

## QA / Validation

- Planted regression against the merged implementation: Fail as expected; evidence creation at 19:00 was ignored behind an 18:00 review timestamp.
- Approved evidence snapshot, phase binding, phase-gate approval route, and phase-capture integration suites: Pass (34 tests across 4 suites).
- `npm run typecheck`: Pass.
- Targeted ESLint: Pass.
- `node scripts/release-check.mjs --base origin/main --head HEAD`: Pass.
- Signed-in verification on the preceding release: Fail as expected for this regression; after later evidence activity, the phase-gate API still returned `approved: true` and `approvalStale: false`.
- CI, deployment, and post-fix signed-in verification: Not run yet.

## Rollout Plan

Merge through a protected pull request. The repository-owned ACA main deploy workflow builds and deploys the exact merge SHA. Verify the digest-pinned template, 100%-traffic revision, and worker images, then confirm the signed-in phase gate reports the legacy approval stale when approved evidence was created later.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside the approved workflow.
- Approved image digest: Not run yet.
- ACA runtime invariant: Not run yet.
- Worker image invariant: Not run yet.
- Feature/env flag update path: none.
- Live signed-in proof required: yes; verify the prior phase approval no longer satisfies the gate after later approved evidence activity.

## Rollback Plan

Revert through a follow-up protected pull request and redeploy the prior approved digest through the repository-owned workflow. No database migration or data rollback is required.

## Audit Evidence

- Pull request URL: Not run yet.
- CI run: Not run yet.
- ACA deployment run and exact-SHA runtime-invariant proof: Not run yet.
- Signed-in smoke evidence: Not run yet.

## Known Gaps

- Legacy approvals remain timestamp-based until they are reapproved against an evidence revision hash.
