# 2026-06-02-legacy-setup-links — Canonical Admin Setup Links

## Release ID

`2026-06-02-legacy-setup-links`

## Status

`candidate`

## Plain-English Summary

Legacy setup links in Intelligence and Source empty states now point directly to `/admin/setup`, the canonical Admin Data Loads workspace. This avoids routing users through the compatibility `/setup` bridge and reinforces that setup/admin work belongs under Admin, not Home.

## Layer Impact

- `global-control-lane`: Updates shared navigation links and regression coverage for Intelligence and Source surfaces.

## Client Applicability

- All clients: Applies to authenticated client workspaces that see Intelligence or Source empty states.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/intelligence/decision/IntelligenceEmptyState.tsx`: Changes the setup CTA to `/admin/setup`.
- `src/components/intelligence/IntelligenceLensTabs.tsx`: Changes the substrate-loading link to `/admin/setup`.
- `src/components/source/SourceEmptyState.tsx`: Changes the setup-connectors CTA to `/admin/setup`.
- `src/components/__tests__/legacy-setup-links.test.ts`: Adds regression coverage against restoring these CTAs to `/setup`.

## QA / Validation

- Passed: `npx jest --runTestsByPath 'src/components/__tests__/legacy-setup-links.test.ts' 'src/components/shell/__tests__/topbar-nav-home-admin.test.ts' --runInBand`
- Passed: `npx eslint 'src/components/intelligence/decision/IntelligenceEmptyState.tsx' 'src/components/intelligence/IntelligenceLensTabs.tsx' 'src/components/source/SourceEmptyState.tsx' 'src/components/__tests__/legacy-setup-links.test.ts'`
- Passed: `git diff --check`
- Passed: `npm run release:check -- --base origin/main --head HEAD`
- Not run locally: full typecheck/build; covered by CI after PR.
- Pending CI after PR: release control, typecheck, lint, route integrity, accessibility, browser matrix, and Vercel preview checks.

## Rollout Plan

Merge to `main`; Vercel deploys the link updates through the normal control-plane pipeline. No migration or feature flag is required.

## Rollback Plan

Revert the PR. No data rollback is required.

## Audit Evidence

- PR: pending.
- Local focused test output.
- CI check rollup after PR opens.

## Known Gaps

This does not remove the `/setup` compatibility bridge or implement private data-plane loading. It only points visible CTAs at the canonical Admin setup page.
