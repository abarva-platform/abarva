# 2026-09-29 — Evidence-Bound Moves Phase Approval

## Release ID

`2026-09-29-moves-phase-approval-evidence-binding`

## Status

`candidate`

## Plain-English Summary

Moves phase approvals now record the exact approved-evidence revision reviewed by the approver. When approved evidence changes, the affected downstream gate no longer appears approved; the workspace reopens the earliest stale evidence-bound phase, and later phases cannot be approved until the preceding gate is current again. Reapproval records a new decision without moving the stored phase backward.

## Layer Impact

- `global-control-lane`: updates phase-gate evaluation, approval persistence, and the Moves phase workspace for all tenants. P0 origination remains independent of the later approved-evidence revision.
- `client-data-lane`: no schema, migration, or client-data write-path changes. Evidence revision metadata is stored in the existing phase snapshot JSON.

## Client Applicability

- All clients: yes, after the shared application deployment.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Evidence-review snapshot exposes the latest review activity timestamp for safe handling of approvals created before revision binding.
- New phase approvals persist the approved-evidence revision; cached `gatesPassed` markers no longer establish current approval by themselves.
- A stale prior gate blocks a later phase. A valid reapproval of an earlier phase appends a new approval snapshot without reducing `current_phase`.
- The phase workspace resolves stale prior approvals to the earliest phase requiring renewed review.
- Regression coverage includes stale and unchanged revisions, legacy snapshot handling, blocked progression, and non-regressing reapproval.

## QA / Validation

- Focused evidence-binding, evidence-snapshot, and phase-gate route suites: Pass (24 tests).
- Moves UI, phase tallies, governance, context-extract, and deliverable-signoff suites: Pass (138 tests); combined targeted validation is 9 suites / 162 tests, all passing.
- Mutation check: replacing evidence-revision equality with unconditional approval caused three regression assertions to fail; the production comparison was restored and the focused suite passed.
- Targeted ESLint: Pass.
- Full TypeScript check with Node 24 and `NODE_OPTIONS=--max-old-space-size=6144`: Pass.
- Test-CI coverage census regenerated and checked: Pass.
- `node scripts/release-check.mjs --base origin/main --head HEAD`: Pass; manual freshness, release record, deployment authority, tenant-input, and release-control gates all passed.
- PR CI, deployment, and signed-in smoke: pending.

## Rollout Plan

Merge through a protected pull request. Deploy only through the repository-owned ACA main deploy workflow, then verify the exact merge SHA, digest-pinned template and 100%-traffic revision, and worker image invariant. Complete signed-in verification on the affected Moves flow before calling this live-proven.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside the approved workflow.
- Approved image digest: pending exact-SHA workflow run.
- ACA runtime invariant: pending post-deploy proof.
- Worker image invariant: pending post-deploy proof.
- Feature/env flag update path: none.
- Live signed-in proof required: yes; verify evidence change stales approval, P1 reopens, current evidence/output can be reviewed and reapproved without phase rollback, and subsequent progression remains blocked until the preceding gate is current.

## Rollback Plan

Revert the release through a follow-up protected pull request and redeploy the previous approved digest through the repository-owned workflow. No database migration or rollback is required. Until rollback is deployed, reviewers should not treat an evidence-stale phase snapshot as current.

## Audit Evidence

- Pull request URL: pending.
- CI run: pending.
- ACA deployment run and exact-SHA runtime-invariant proof: pending.
- Signed-in smoke evidence: pending.

## Known Gaps

- The standard local TypeScript heap limit is insufficient; the full local check passed with a 6 GB heap.
- Existing approvals without an evidence revision are preserved only when no later evidence-review activity is recorded; otherwise they require a current gate review.
