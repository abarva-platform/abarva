# 2026-10-01 — Moves Phase Readiness Truth

## Release ID

`2026-10-01-moves-phase-readiness-truth`

## Status

`candidate`

## Plain-English Summary

Moves now distinguishes captured phase inputs from a phase whose evidence and hard gates are actually ready. Design, roadmap, and handoff phases with no configured evidence checklist stay unready. aVa derives context-extract evidence counts from a tenant-scoped server read and the current approved-evidence revision, not from browser-supplied counts or freshness claims. Readiness workbooks are shown only for the transition they describe.

## Layer Impact

**Release lane: `global-control-lane`.** This changes shared Moves readiness and aVa context behavior for every client using the product; it is not behind a feature flag.

- **Product layer — Moves:** Phase progress no longer presents captured inputs as fully ready while a hard gate is open. A missing downstream evidence checklist fails closed.
- **Product layer — aVa:** Context-extract evidence counts are included only when the stored extract is current against the approved-evidence snapshot for the active phase.
- **Canonical model:** No schema or tenant data changes. Existing evidence and extract lineage are read-only inputs to readiness.

## Client Applicability

- All clients using Moves and Moves aVa receive the behavior after deployment.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Phase evidence checklist and hard-gate readiness display.
- Phase-scoped stage-readiness workbook previews.
- Server-verified context-extract freshness for aVa evidence counts.
- Regression tests for missing checklists, open hard gates, stale extract counts, and cross-phase workbook previews.

## QA / Validation

- Targeted Jest suites: `112 passed` across four suites.
- `npm run typecheck`: clean.
- Targeted ESLint: clean.
- Four mutations were caught: stale context extract counted as current, open P3 hard gate displayed green, missing P3 checklist displayed covered, and prior-transition workbook shown as current-phase readiness.
- `git diff --check`: clean. `node scripts/release-check.mjs --base origin/main --head HEAD`: exit 0 on the rebased candidate.
- Signed-in runtime verification: pending deployment; no governed approval will be submitted by this release process.

## Rollout Plan

Merge through a reviewed PR. Deploy only through the repository-owned ACA main deploy workflow. Verify the exact merge SHA, digest-pinned web and worker images, 100% traffic revision, and signed-in phase readiness/aVa behavior before marking released.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside the deploy workflow.
- Approved image digest: Pending exact-SHA deployment.
- ACA runtime invariant: Pending exact-SHA verification.
- Worker image invariant: Pending exact-SHA verification.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, for an affected synthetic Moves workflow; do not submit sponsor or client approvals.

## Rollback Plan

Use the repo-owned ACA main deploy workflow to redeploy the prior approved digest. No database migration or data mutation is included.

## Audit Evidence

- PR and exact-SHA CI checks: pending.
- Targeted test output and local validation: recorded in the PR.
- Exact-SHA ACA deployment, digest invariants, and signed-in proof: pending.

## Known Gaps

The deployed synthetic workflow has not yet been re-smoked against this candidate. Runtime evidence and user-visible verification remain required before release status can change to `released`.
