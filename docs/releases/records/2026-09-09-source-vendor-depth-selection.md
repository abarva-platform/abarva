# 2026-09-09-source-vendor-depth-selection — Source Evidence Vendor Selection

## Release ID

`2026-09-09-source-vendor-depth-selection`

## Status

`candidate`

## Plain-English Summary

Source now resolves a selected vendor from the same evidence-aware vendor set it renders in the vendor evidence view. This lets a user open a supplier relationship that is visible only because loaded contract-depth or action evidence exists, while preserving the governed register as the source for portfolio headline counts.

## Layer Impact

Layer 4 Products: Source presentation logic only. The change affects selected-vendor resolution in the Source workspace and does not change loaders, adapters, canonical records, migrations, or data-plane writes.

## Client Applicability

- All clients: Source workspace vendor evidence views.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Adds a selected-vendor resolver that falls back from the governed vendor register to evidence-backed vendor rows already rendered in Source.
- Adds a regression test for selecting an evidence-only vendor and populating the vendor detail panel.

## QA / Validation

- `npx jest --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceExecutiveShell.performance.test.ts' --runInBand` — pass.

## Rollout Plan

Merge by pull request into `main`. The repo-owned Azure Container Apps main deploy workflow will build and deploy the approved main image. No migration, loader, feature flag, or manual data operation is required.

## Deployment Authority

- Repo-owned deploy workflow: required for production web rollout.
- Shared runtime mutators: none outside the repo-owned deploy workflow.
- Approved image digest: to be captured by the deploy workflow.
- ACA runtime invariant: required after deploy.
- Worker image invariant: required after deploy.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: Source workspace vendor evidence selection and grouped-contract panel.

## Rollback Plan

Revert the Source presentation commit and redeploy through the repo-owned ACA main deploy workflow. No data rollback is required because this is a presentation-only change.

## Audit Evidence

Pull request, CI checks, deployment workflow run, ACA runtime-invariant proof, and live Source workspace smoke-test notes.

## Known Gaps

This release does not widen the vendor concentration table or change portfolio denominator math. Evidence-backed vendors that are not part of the top concentration rows are still reached through the vendor evidence view or contract search; that is intentional for this release so ranked portfolio visuals remain register-based.
