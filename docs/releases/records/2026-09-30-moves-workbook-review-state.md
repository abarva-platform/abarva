# 2026-09-30 — Moves Workbook Review State

## Release ID

`2026-09-30-moves-workbook-review-state`

## Status

`candidate`

## Plain-English Summary

The P1-to-P2 readiness workbook now shows its persisted human-review result instead of presenting the original uploaded proposal rows as still pending. A saved review applies only to the exact proposal-set artifact and version it reviewed; unresolved responses remain available for follow-up, while completed responses are read-only in the review panel.

## Layer Impact

- `global-control-lane`: corrects the shared Moves workbook review and phase-navigation presentation. The existing approval and evidence rules remain unchanged.
- No canonical model, client data, schema, adapter, or evidence policy changes.

## Client Applicability

- All clients: users who upload and review a Moves stage-readiness workbook.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- The Moves phase loader correlates review state with the exact proposal-set ID, artifact ID, and version before using it for P2 navigation or the review panel.
- The workbook review panel updates immediately after a saved review and restores accepted, rejected, needs-validation, and pending dispositions on reload.
- Completed proposal rows no longer offer repeat decision actions; unresolved rows remain reviewable.
- Regression coverage proves that accepted responses stop displaying as pending and that a review from another artifact version does not match.

## QA / Validation

- The UI regression assertion was run against the pre-fix implementation and failed on the stale review state.
- Targeted Moves UI and proposal suites: 99 tests passed.
- Full typecheck: clean.
- Changed-file ESLint: clean.
- Prettier and release check: pending final pass.
- CI, merge, deployment, and signed-in review-state verification: pending.

## Rollout Plan

Merge to `main`, then deploy through the repository-owned ACA main deploy workflow. No migration, flag change, or direct data mutation is required. Verify the exact deployed SHA and confirm in the signed-in synthetic Move that the accepted workbook review no longer appears pending and that P2 navigation still requires the matching review.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside the approved workflow.
- Approved image digest: pending merge/deploy.
- ACA runtime invariant: pending exact-SHA deployment verification.
- Worker image invariant: verify against the deployed digest.
- Feature/env flag update path: none.
- Live signed-in proof required: yes; inspect the persisted workbook review and phase-navigation state.

## Rollback Plan

Revert the release in a follow-up PR and deploy the resulting `main` SHA through the same ACA workflow. No data rollback is required; the immutable workbook and review artifacts remain available.

## Audit Evidence

- PR and CI results: pending.
- Exact-SHA ACA workflow run and digest alignment: pending.
- Signed-in workbook review and phase-navigation proof: pending.

## Known Gaps

The broader synthetic Moves journey remains in progress. This release only reconciles persisted workbook review state; it does not mark insufficient evidence as complete or bypass the P1 charter approval gate.
