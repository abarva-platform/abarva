# 2026-09-10-source-command-center-design - Source Command Center Design Alignment

## Release ID

`2026-09-10-source-command-center-design`

## Status

`candidate`

## Plain-English Summary

Source workspace now follows the Source Command Center design contract more closely. The top Source workspace tabs become Command, Contracts, Levers, Evidence, and Coverage. The landing view is no longer a generic contract table with repeated explanatory strips; it is a command center that shows executive KPIs, this week's governed read, the decision queue, vendor concentration, evidence lanes, and explicit data-quality boundaries.

## Layer Impact

Layer 4 PRODUCTS, lane `global-control-lane`: Source presentation and client-side projection only. The release changes how existing governed Source workspace rows are arranged, summarized, and navigated. It does not add migrations, canonical columns, loaders, tenant data, data-plane writes, or Azure job mutations.

## Client Applicability

- All clients: Source workspace users receive the redesigned command center when the Source workspace route is available.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Source route availability only.

## Changes Included

- Replaced the portfolio-level Source tabs with Command, Contracts, Levers, Evidence, and Coverage.
- Removed the duplicate top-right action toolbar from the Source workspace shell.
- Replaced the repeated claim/instruction strip with a command-center layout bound to cockpit, impact, contract, vendor, action, and evidence rows.
- Added a Coverage page with readiness-versus-value scatter, archetype coverage, and declared-play backfill guidance.
- Added an action detail drawer for governed action candidate rows.
- Added a Source Command Center data contract for downstream design work and data-layer enrichment planning.
- Updated Source workspace browser-surface tests to prove the new navigation, no duplicate action toolbar, no stale claim strips, Coverage route, and selected-contract workflow.

## QA / Validation

- PASS: Targeted Source workspace Jest proof, 52/52 tests.
- PASS: Broader Source workspace Jest proof, 12 suites / 129 tests.
- PASS: TypeScript `tsc --noEmit`.
- PASS: ESLint on touched Source workspace files.
- PASS: Prettier write on touched Source workspace files.
- PASS: Production `next build` with Turbopack after installing real workspace dependencies.
- PASS: Release control check.
- PASS: `git diff --check`.
- PASS: Cloud-consumption package plan gate for the selected data-platform contract package. The package plan reconciled Layer 2 source rows, Layer 3 canonical/read-model rows, Layer 4 Contract 360 projections, and quality-gate richness checks in plan mode.
- NOT VERIFIED LOCALLY: Live Azure/Postgres Source substrate readback from this workstation. The local read-only lineage command could not resolve the Azure PostgreSQL host, so deployed readback still has to be captured through the approved environment path.
- NOT VERIFIED LOCALLY: Signed-in visual smoke against localhost. The local Clerk server-ticket helper timed out before the route mounted. Production signed-in smoke remains required after deployment.

## Rollout Plan

Open a pull request, merge through the protected repository workflow, then deploy through the repository-owned Azure Container Apps main deploy workflow. No manual ACA traffic mutation, direct Container App update, database migration, data-build job, or feature-flag update is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: Required before the change is live.
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Not available until the repo-owned deploy workflow builds the merged SHA.
- ACA runtime invariant: Required after deployment.
- Worker image invariant: Required after deployment.
- Feature/env flag update path: None.
- Live signed-in proof required: Source workspace Command, Contracts, Levers, Evidence, Coverage, selected vendor, selected contract, and selected contract Optimize smoke after deployment.

## Rollback Plan

Revert the Source presentation change or roll production back to the previous healthy ACA revision. No data rollback is required because this release does not mutate tenant data or schema.

## Audit Evidence

Pull request, CI checks, release-control output, targeted Jest output, TypeScript output, ESLint output, ACA deploy workflow output, runtime-invariant output, and live signed-in Source workspace smoke notes after deployment.

## Known Gaps

This release does not reload, reparse, or enrich tenant data. The Source Command Center data contract documents the data-layer work required for selected contracts to render every Contract 360 tab densely without empty cells. The legacy graph renderer remains in code but is no longer reachable from the Source command IA; remove it in a focused cleanup after the command-center route is live.
