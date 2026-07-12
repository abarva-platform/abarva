# 2026-07-12-candidate-promotion-gate — Candidate Promotion Gate

## Release ID

`2026-07-12-candidate-promotion-gate`

## Status

`candidate`

## Plain-English Summary

This release adds the first explicit, non-destructive promotion gate for candidate tenant data versions. It evaluates a persisted candidate record, checks the linked proof bundle, records pass/fail/blocker status, requires operator approval, and writes a rollback-aware promotion decision record. It does not promote the candidate or change runtime tenant data.

## Layer Impact

- Release lane: `global-control-lane`.
- Candidate Tenant Data Version Store: reads the candidate metadata created by PR8 and validates it before any future promotion.
- Proof Harness: verifies proof bundle fingerprints and required dry-run quality gates.
- Active Tenant Access Layer: unchanged; no active pointer update is introduced.
- Module Context APIs / Module Memory / Outcome Ledger: unchanged; modules do not consume candidate data by default.

## Client Applicability

- All clients: the architecture and audit command apply to all tenant onboarding and upgrade candidates.
- Specific clients: none.
- Internal only: this is an internal platform proof/control release.
- Public/demo only: no.
- Feature flag: no runtime flag; promotion execution remains disabled.

## Changes Included

- Added `src/lib/enterprise-data/candidate-promotion-gate/candidate-promotion-gate.ts`.
- Added `scripts/audit/run-candidate-promotion-gate.ts`.
- Added `npm run audit:candidate-promotion-gate`.
- Added `docs/architecture/candidate-promotion-gate.md`.
- Added proof output under `reports/candidate-promotion-gates/minimal/`.

## QA / Validation

- Pass: `npm run audit:candidate-promotion-gate`
- Pass: `npm run audit:candidate-tenant-version`
- Pass: `npm run audit:enterprise-naming`
- Pass: isolated TypeScript compile for the PR9 evaluator and CLI
- Pass: `git diff --check`
- Pass: `npm run release:check`

## Rollout Plan

Merge through PR to `main`. The repo-owned Azure Container Apps main deploy workflow will build and deploy the resulting image. No database migration, active tenant data write, feature flag update, or module runtime behavior change is required.

## Deployment Authority

- Repo-owned deploy workflow: required for shared Product/Lab deployment after merge.
- Shared runtime mutators: none in this PR.
- Approved image digest: captured by the ACA main deploy workflow after merge.
- ACA runtime invariant: required after deployment.
- Worker image invariant: not changed by this PR.
- Feature/env flag update path: none.
- Live signed-in proof required: post-deploy health/runtime invariant/crawl after merge.

## Rollback Plan

Revert the PR or deploy the prior approved ACA image. Because the release only adds a non-mutating evaluator, docs, and report output, rollback does not require data repair. Any generated promotion-gate report is proof metadata only and is not active tenant truth.

## Audit Evidence

- PR URL: to be added when opened.
- Local validation output: to be captured before PR.
- ACA deployment run: to be captured after merge.
- Post-deploy crawl: to be captured after deployment.

## Known Gaps

- No active promotion execution path is implemented.
- No Active Tenant Access Layer pointer update is implemented.
- No candidate preview module read path is implemented.
- Operator approval capture is represented in the decision record but is not yet a runtime approval workflow.
