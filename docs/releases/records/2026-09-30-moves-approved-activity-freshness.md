# 2026-09-30 — Approved Evidence Activity Freshness

## Release ID

`2026-09-30-moves-approved-activity-freshness`

## Status

`candidate`

## Plain-English Summary

Phase approvals now require both a matching approved-evidence revision and no later approved-evidence activity. A matching revision hash can no longer mask approved evidence activity that occurred after the gate decision. Pending or rejected review activity does not invalidate an approval.

## Layer Impact

- `global-control-lane`: corrects Moves phase-approval freshness evaluation for all tenants without changing the approval policy or phase data.
- `client-data-lane`: no schema, migration, or data mutation. Reads remain scoped to the current tenant and Move.

## Client Applicability

- All clients: yes, after the shared application deployment.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Evidence revision equality remains required when an approval carries a revision hash; approved-evidence activity timestamps are also checked for every approval.
- Review activity used for freshness is limited to approved review rows, so pending and rejected reviews do not stale the gate.
- Route and unit regressions cover a same-hash approval with later approved activity, plus pending activity exclusion.

## QA / Validation

- Planted route regression with the former hash-only return restored: Fail as expected (`approved: true`, `approvalStale: false`); restored implementation: Pass.
- Focused approved-evidence snapshot, phase-binding, and phase-gate route suites: Pass (29 tests across 3 suites).
- Node 24 `npm run typecheck` with a 6 GB heap: Pass (`typecheck: clean`).
- Targeted ESLint and `git diff --check`: Pass.
- `node scripts/release-check.mjs --base origin/main --head HEAD`: Pass.
- CI, deployment, and post-fix signed-in verification: Not run yet.
- The preceding deployed implementation was signed-in repro'd: after approved evidence was added and approved, the gate still returned current. Post-fix signed-in proof is pending deployment.

## Rollout Plan

Merge through a protected pull request. The repository-owned ACA main deploy workflow builds and deploys the exact merge SHA. Verify the digest-pinned template, 100%-traffic revision, and worker images, then confirm through the signed-in phase-gate route that the prior approval is stale after later approved evidence activity.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside the approved workflow.
- Approved image digest: Not run yet.
- ACA runtime invariant: Not run yet.
- Worker image invariant: Not run yet.
- Feature/env flag update path: none.
- Live signed-in proof required: yes; verify the old approval reports stale and the Move reopens at the earliest phase requiring review, without manually changing phase state.

## Rollback Plan

Revert through a follow-up protected pull request and redeploy the prior approved digest through the repository-owned workflow. No database migration or data rollback is required.

## Audit Evidence

- Pull request URL: Not run yet.
- CI run: Not run yet.
- ACA deployment run and exact-SHA runtime-invariant proof: Not run yet.
- Signed-in smoke evidence: Not run yet.

## Known Gaps

- None known in the freshness rule; merged, deployed, and signed-in acceptance remain pending.
