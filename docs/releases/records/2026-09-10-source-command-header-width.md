# 2026-09-10-source-command-header-width - Source Header Canvas Use

## Release ID

`2026-09-10-source-command-header-width`

## Status

`candidate`

## Plain-English Summary

Source workspace headers now use the available canvas width before wrapping. The headline and subhead no longer give up space unnecessarily to the control strip on desktop and laptop widths, while the controls still move below the heading when the viewport is narrower.

## Layer Impact

Layer 4 PRODUCTS, lane `global-control-lane`: Source presentation only. This release changes Source workspace CSS and a layout regression test. It does not add migrations, canonical fields, loaders, tenant data, Azure jobs, or model behavior.

## Client Applicability

- All clients: Source workspace users receive the improved header layout.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Source route availability only.

## Changes Included

- Changed the Source workspace topbar from a flex layout to a grid layout so the narrative text column owns the remaining canvas width.
- Expanded the headline and subhead maximum widths.
- Moved the control strip below the heading on laptop widths before it forces premature text wrapping.
- Added a regression assertion for the canvas-width header contract.

## QA / Validation

- pass: Focused Source layout test, 1 suite / 46 tests.
- pass: Broader Source workspace Jest proof, 13 suites / 134 tests.
- pass: TypeScript `tsc --noEmit`.
- pass: ESLint on touched Source workspace files.
- pass: Production `next build` with Turbopack. The build emitted existing broad-file-pattern warnings outside this Source change.
- pass: Release control check.
- pass: `git diff --check`.
- not-run: Deployed ACA workflow and runtime invariant.
- not-run: Live signed-in Source workspace smoke proving headers and subheads use the canvas width before wrapping.

## Rollout Plan

Open a pull request, merge through the protected repository workflow, then deploy through the repository-owned Azure Container Apps main deploy workflow. No manual ACA traffic mutation, direct Container App update, database migration, data-build job, or feature-flag update is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: Required before the change is live.
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Not available until the repo-owned deploy workflow builds the merged SHA.
- ACA runtime invariant: Required after deployment.
- Worker image invariant: Required after deployment.
- Feature/env flag update path: None.
- Live signed-in proof required: Source workspace header and subhead layout after deployment.

## Rollback Plan

Revert this presentation change or roll production back to the previous healthy ACA revision. No data rollback is required because this release does not mutate tenant data or schema.

## Audit Evidence

Pull request, CI checks, release-control output, targeted Jest output, TypeScript output, ESLint output, ACA deploy workflow output, runtime-invariant output, and live signed-in Source workspace smoke notes after deployment.

## Known Gaps

This release does not reload, reparse, or enrich contract data. It only changes header layout behavior.
