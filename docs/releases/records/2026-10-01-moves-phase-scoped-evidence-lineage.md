# 2026-10-01 — Moves phase-scoped evidence lineage

## Release ID

`2026-10-01-moves-phase-scoped-evidence-lineage`

## Status

`candidate`

## Plain-English Summary

Generated Moves deliverables, approvals, context extracts, and queued builds now bind to the evidence for their canonical phase. Later-phase evidence changes no longer invalidate an earlier phase's work; same-phase changes still make affected outputs stale. Legacy whole-Move evidence hashes are accepted only when timestamps show the changed activity was outside the relevant phase. Missing or ambiguous lineage remains blocked.

## Layer Impact

- `global-control-lane`: Updates the shared Moves evidence-freshness and approval behavior for every tenant using Moves.
- `Products`: Moves generation, artifact review, sign-off, phase approval, and governance checks consume the same phase-aware evidence basis.
- `Canonical model`: No schema or canonical identity changes. Existing evidence and artifact records carry additive phase-lineage metadata.

## Client Applicability

- All clients: All tenants using Moves after the application release.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Adds phase-scoped evidence revisions and activity timestamps to the approved-evidence snapshot.
- Persists phase lineage through generation, queue processing, context extraction, artifact records, approval, sign-off, and phase-gate evaluation.
- Preserves unrelated-phase artifacts when later-phase evidence changes, while invalidating outputs on same-phase evidence activity.
- Adds regression coverage for phase isolation, same-phase staleness, legacy lineage, and worker execution-time validation.

## QA / Validation

- Focused Moves/generation/approval validation: 12 suites, 177 tests passed.
- `npm run test:behaviors`: 173 suites, 1,826 tests passed.
- Programs governance integration slice: 26 suites, 518 passed, 12 skipped.
- `npm run typecheck`: clean.
- ESLint on all changed TypeScript and TSX files: clean.
- `git diff --check`: clean.
- Mutation check: replacing phase-scoped revision lookup with the whole-Move hash made the P1-after-P2 regression fail; restoring phase scoping made it pass.
- Release check and CI: pending.
- Synthetic signed-in end-to-end validation on the deployed runtime: pending; this candidate is not live-proven.

## Rollout Plan

Merge through the protected `main` branch. Deploy only through `.github/workflows/aca-main-deploy.yml`, then verify the exact merged SHA, digest-pinned web and worker images, 100% traffic revision, and signed-in Moves workflow before describing the change as live-proven. No database migration is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: None outside that workflow.
- Approved image digest: Pending the exact-SHA workflow run.
- ACA runtime invariant: Pending post-deploy verification.
- Worker image invariant: Pending post-deploy verification.
- Feature/env flag update path: None; no flag change.
- Live signed-in proof required: Yes. Verify an earlier-phase artifact remains current after later-phase evidence activity, same-phase changes invalidate it, and the normal approval/gate workflow remains enforced.

## Rollback Plan

Revert the merged code through a reviewed PR and redeploy the prior approved digest using the repo-owned workflow. No data migration is introduced; additive metadata is ignored by the prior code path.

## Audit Evidence

- Pull request and exact-SHA CI results: pending.
- Release-check output: pending.
- Exact-SHA ACA deployment and digest invariant: pending.
- Signed-in synthetic workflow evidence: pending.

## Known Gaps

This candidate has not yet been merged, deployed, or proven in a signed-in runtime. Full synthetic Moves progression through P5 remains outstanding and must continue after this fix is live.
