# Moves Files Workspace

## Release ID

`2026-10-13-moves-files-workspace`

## Status

`candidate`

## Plain-English Summary

Remove the bulk session-notes form from the P0/P1 step pages. Keep Files and Record in the same workspace header, theme and phase navigation as Steps. Add a phase-based file explorer with search, version history and a selected-file detail panel. Upload and evidence-review controls remain available through their existing authorization paths.

## Release Lane

`global-control-lane`

## Layer Impact

`global-control-lane`, Layer 4 presentation only. The explorer groups the existing canonical artifact readback by its declared phase. It does not infer identity, create evidence, change gate outcomes, or modify stored answers or approvals.

## Client Applicability

- All clients: existing Moves artifact reads and review paths are unchanged.
- Feature flag: the shared Files/Record shell uses the existing phase-step-page enrollment; explicitly requested legacy views retain their existing shell.
- P0/P1 text step pages: the bulk-notes form is removed; direct field editing and existing drafts remain available.

## Changes Included

Shared step workspace header; Files/Record host composition; phase folders and selected artifact detail; P0/P1 bulk-notes removal; focused regression tests in existing CI-covered suites. No migration, data load, authentication change or new dependency.

## QA / Validation

- Red-first: three focused tests failed against the unchanged implementation, then passed after the fixes.
- Seven affected component suites: 511 tests passed, including existing upload, review-readback and approval-refusal coverage.
- Mutation proof: restoring the notes input, bypassing phase filtering, or bypassing the Files shell each caused its focused regression test to fail. Every mutation was reverted.
- Local browser fixture: desktop 1440px and phone 390px, light/dark; no document overflow. The fixture uses synthetic read-only responses, not live data acceptance.
- TypeScript: passed with an 8GB Node heap after the default heap exhausted memory.
- Focused ESLint: passed. Nexus manual freshness check: passed.
- Final-head release and CI results are recorded with the PR. A signed-in post-deploy check is still required before calling this live-proven.

## Rollout Plan

Squash merge the reviewed PR to main. The repo-owned ACA main deploy workflow builds and deploys the exact main SHA. No flags or tenant data are changed by this release.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: only that workflow.
- Approved image digest: supplied by the main deploy evidence after merge.
- ACA runtime invariant: digest-pinned template and healthy 100%-traffic revision must agree.
- Worker image invariant: both required workers must use that same approved digest.
- Feature/env flag update path: no update required.
- Live signed-in proof required: P0/P1 step has no bulk-notes form; Files/Record retain the shared workspace navigation; phase folders, search and selected-file detail render without writes.

## Rollback Plan

Revert this UI commit through a PR and let the repo-owned ACA main workflow deploy the revert. No database or artifact rollback is needed.

## Audit Evidence

PR diff, existing component-suite results, red-first and mutation test summaries, local visual fixture screenshots, and subsequent main deploy/runtime/signed-in proof. Private browser evidence is retained outside the public repository.

## Known Gaps

This release does not complete a Move's missing evidence, deterministic value case, approvals or Tower handoff. Existing smoke records are not deleted. Historical approval versus current step readiness is unchanged.
