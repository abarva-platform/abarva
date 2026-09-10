# 2026-09-09-source-vendor-depth-coverage — Source Vendor Coverage Alignment

## Release ID

`2026-09-09-source-vendor-depth-coverage`

## Status

`live-proven`

## Plain-English Summary

Source now calculates the selected-vendor evidence metrics from the same alias-aware coverage rollup used by the vendor evidence table. This keeps the selected-vendor panel consistent with the row a user clicked when a supplier relationship is assembled from multiple evidence-backed vendor references, including suppliers that have both register rows and supplemental depth evidence aliases.

## Layer Impact

Layer 4 Products: Source presentation logic only. The change affects vendor detail metric display and does not change loaders, adapters, canonical records, migrations, or data-plane writes.

## Client Applicability

- All clients: Source workspace vendor evidence views.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Uses alias-aware coverage aggregation for the selected-vendor panel.
- Uses the same alias-aware action-row count in the selected-vendor metric tile.
- Preserves evidence aliases when a selected vendor also exists in the governed register.
- Adds a behavioral regression for selected-vendor coverage across evidence vendor aliases.
- Adds a behavioral regression for register vendors with supplemental evidence aliases.

## QA / Validation

- `npx jest --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceExecutiveShell.performance.test.ts' --runInBand` — pass.
- `npx eslint 'src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx' 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceExecutiveShell.performance.test.ts'` — pass.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` — pass.
- `npm run release:check` — pass.
- Pull request checks for the selected-vendor coverage, action-row, and evidence-alias follow-ups — pass.
- Live Source workspace smoke on the deployed image — pass: portfolio headline stayed register-owned; the contract list showed register and supplemental depth rows; the evidence-depth vendor table and selected-vendor panels agreed for both an evidence-only supplier relationship and a register-backed supplier relationship with supplemental aliases.
- Live aVa smoke from Contract 360 context — pass: the selected contract was recognized, optimization levers rendered with rationale, confidence, evidence grade, and governed visuals.

## Rollout Plan

Merged by pull request into `main` and rolled out through the repo-owned Azure Container Apps main deploy workflow. No migration, loader, feature flag, or manual data operation was required.

## Deployment Authority

- Repo-owned deploy workflow: required for production web rollout.
- Shared runtime mutators: none outside the repo-owned deploy workflow.
- Approved image digest: `sha256:5921a0f01ddbf32b7c436e2c105ff5dac2a21273ea4fd0b4e060d66e114a1100`.
- Deployed SHA: `fc2e3a188f13294979089efc2f3ea99a9f0c2c8c`.
- ACA revision: `ca-abarva-web-lab-eastus--mfc2e3a18`.
- ACA runtime invariant: passed; template image and 100%-traffic revision image matched the approved digest.
- Worker image invariant: passed for the required worker jobs.
- Feature/env flag update path: not applicable.
- Live signed-in proof: Source workspace selected-vendor evidence metrics, grouped-contract panel, Contract 360 context, and aVa contract-context response.

## Rollback Plan

Revert the Source presentation commit and redeploy through the repo-owned ACA main deploy workflow. No data rollback is required because this is a presentation-only change.

## Audit Evidence

Pull requests, CI checks, deployment workflow run `34417770151`, workflow evidence bundle, independent ACA runtime-invariant proof at `/tmp/source-vendor-depth-selected-aliases-runtime-invariant-fc2e3a18`, and live signed-in Source workspace/aVa smoke-test notes.

## Known Gaps

This release does not widen the vendor concentration table, change vendor ranking, or change portfolio denominator math. It only aligns the selected-vendor detail metrics with evidence rows that are already visible in the Source vendor evidence view.
