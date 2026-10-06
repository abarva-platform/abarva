# 2026-09-10-source-command-center-loading-nav - Source Loading Navigation Alignment

## Release ID

`2026-09-10-source-command-center-loading-nav`

## Status

`candidate`

## Plain-English Summary

Source workspace now keeps the main application navigation and command-center tab pattern visible while the governed workspace data is loading. The loading state no longer shows the previous Verdict, Vendors, Optimize, and Contract graph tab set, and the live Source workspace uses green active button states aligned with the Tower command-center pattern.

## Layer Impact

Layer 4 PRODUCTS, lane `global-control-lane`: Source presentation only. This release changes the route loading shell, top application navigation, and tab styling. It does not add migrations, canonical fields, loader behavior, tenant data, Azure jobs, or model behavior.

## Client Applicability

- All clients: Source workspace users receive the aligned loading and tab navigation behavior.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Source route availability only.

## Changes Included

- Added a Source workspace main application navigation bar with Source marked as the active product.
- Updated the Source workspace loading shell to match the Command, Contracts, Levers, Evidence, and Coverage navigation contract.
- Changed portfolio and contract-detail tab active states to green button states instead of the previous underline or dark active treatment.
- Added tests that guard the loading shell and hydrated workspace against drifting back to the old six-tab Source layout.

## QA / Validation

- PASS: Focused Source route and browser-surface Jest proof, 3 suites / 22 tests.
- PASS: Broader Source workspace Jest proof, 13 suites / 134 tests.
- PASS: TypeScript `tsc --noEmit`.
- PASS: ESLint on touched Source workspace files.
- PASS: Production `next build` with Turbopack. The build emitted existing broad-file-pattern warnings outside this Source change.
- PASS: Release control check.
- PASS: `git diff --check`.
- PENDING: Deployed ACA workflow and runtime invariant.
- PENDING: Live signed-in Source workspace smoke proving the main app nav and green active Source tabs appear during loading and after hydration.

## Rollout Plan

Open a pull request, merge through the protected repository workflow, then deploy through the repository-owned Azure Container Apps main deploy workflow. No manual ACA traffic mutation, direct Container App update, database migration, data-build job, or feature-flag update is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: Required before the change is live.
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Not available until the repo-owned deploy workflow builds the merged SHA.
- ACA runtime invariant: Required after deployment.
- Worker image invariant: Required after deployment.
- Feature/env flag update path: None.
- Live signed-in proof required: Source workspace loading shell, command-center tabs, selected contract command tabs, and Source active app navigation after deployment.

## Rollback Plan

Revert this presentation change or roll production back to the previous healthy ACA revision. No data rollback is required because this release does not mutate tenant data or schema.

## Audit Evidence

Pull request, CI checks, release-control output, targeted Jest output, TypeScript output, ESLint output, ACA deploy workflow output, runtime-invariant output, and live signed-in Source workspace smoke notes after deployment.

## Known Gaps

This release does not reload, reparse, or enrich contract data. It only fixes the navigation and loading-state presentation drift introduced by the command-center redesign.
