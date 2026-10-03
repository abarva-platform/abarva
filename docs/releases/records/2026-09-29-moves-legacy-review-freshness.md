# 2026-09-29 — Moves Legacy Review Freshness

## Release ID

`2026-09-29-moves-legacy-review-freshness`

## Status

`candidate`

## Plain-English Summary

Moves now determines the latest evidence-review activity from the timestamps on the review records themselves, rather than relying on a database sort that can rank an older update above a later review. Existing phase approvals without revision hashes therefore reopen when later evidence-review activity is present. If review history exceeds the bounded scan, the evidence snapshot fails closed.

## Layer Impact

- `global-control-lane`: corrects legacy phase-approval freshness evaluation for Moves across tenants.
- `client-data-lane`: no schema, migration, or data mutation. The change reads existing tenant-scoped evidence-review timestamps.

## Client Applicability

- All clients: yes, after the shared application deployment.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- The approved-evidence snapshot loader computes the maximum valid review timestamp across a bounded, tenant-and-Move-scoped review history.
- Regression coverage proves a later `reviewed_at` cannot be hidden by an older `updated_at`, and that an over-limit scan fails closed.

## QA / Validation

- Planted regression before the fix: Fail as expected; the old loader returned 18:00 instead of the later 19:00 review and left the legacy P1 approval current.
- Evidence snapshot, phase-binding, and phase-gate approval route suites: Pass (3 suites, 26 tests).
- Broader Programs and Moves run: 287 suites / 3,764 tests passed; one untouched learning-writeback suite had 2 failures. No files in that module changed; the failures are recorded for CI comparison.
- Targeted ESLint: Pass.
- Typecheck: Pass (`npm run typecheck`).
- `node scripts/release-check.mjs --base origin/main --head HEAD`: Pass.
- CI, deployment, and signed-in verification: Not run yet.

## Rollout Plan

Merge through a protected pull request. The repository-owned ACA main deploy workflow builds and deploys the exact merge SHA. Recheck the digest-pinned template, 100%-traffic revision, and worker images, then verify the signed-in phase gate reports P1 stale and reopens it for review.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside the approved workflow.
- Approved image digest: Not run yet.
- ACA runtime invariant: Not run yet.
- Worker image invariant: Not run yet.
- Feature/env flag update path: none.
- Live signed-in proof required: yes; verify the prior P1 approval no longer satisfies the gate after later approved-evidence review activity.

## Rollback Plan

Revert through a follow-up protected pull request and redeploy the prior approved digest through the repository-owned workflow. No database migration or data rollback is required.

## Audit Evidence

- Pull request URL: Not run yet.
- CI run: Not run yet.
- ACA deployment run and exact-SHA runtime-invariant proof: Not run yet.
- Signed-in smoke evidence: Not run yet.

## Known Gaps

- New approvals bind directly to the evidence revision. Legacy approvals still depend on review timestamps until they are reapproved through the current gate path.
