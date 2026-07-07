# 2026-06-02-home-admin-boundary-language — Home/Admin Boundary Language

## Release ID

`2026-06-02-home-admin-boundary-language`

## Status

`candidate`

## Plain-English Summary

Home now uses tenant-scoped language for the insight view and no longer says "Cross-workspace read." The Home layout comments and hygiene test were updated so Home remains an insight-first surface, while setup, users, connectors, templates, data loading, and policy work stay under Admin.

## Layer Impact

- `global-control-lane`: Updates shared Home/Admin control-plane copy and route-boundary regression coverage for all client workspaces.

## Client Applicability

- All clients: Applies to every authenticated client workspace using the Home and Admin shells.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/home/ImpactInsightsHome.tsx`: Replaces the ambiguous Home pill copy with "Tenant workspace read."
- `src/app/(maestro)/home/layout.tsx`: Updates stale Home layout comments to reflect the current Home/Admin separation.
- `src/app/(maestro)/home/__tests__/no-readmin-reexports.test.ts`: Adds regression coverage that Home copy stays tenant-scoped and avoids setup/admin framing.
- `src/proxy.ts`: Clarifies the `/setup` compatibility bridge comments.

## QA / Validation

- Passed: `npx jest --runTestsByPath 'src/app/(maestro)/home/__tests__/no-readmin-reexports.test.ts' --runInBand`
- Pending CI after PR: release control, typecheck, lint, route integrity, accessibility, browser matrix, and Vercel preview checks.

## Rollout Plan

Merge to `main`; Vercel deploys the shared control-plane UI through the normal pipeline. No database migration, feature flag, or manual runbook is required.

## Rollback Plan

Revert the PR to restore the previous Home copy and test behavior. No data rollback is required.

## Audit Evidence

- PR: pending.
- Local focused test output for the Home/Admin boundary hygiene test.
- CI check rollup after PR opens.

## Known Gaps

This does not implement private data-plane loading, template ingestion, or Admin setup workflows. Those remain separate private data-plane backlog items.
