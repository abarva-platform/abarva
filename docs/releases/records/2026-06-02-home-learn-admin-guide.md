# 2026-06-02-home-learn-admin-guide — Home Learn Admin Guide

## Release ID

`2026-06-02-home-learn-admin-guide`

## Status

`candidate`

## Plain-English Summary

This release keeps Home's Learn surface educational while removing setup as a Home navigation category. The guide now labels operational substrate/connectors material as an Admin Guide, exposes it at `/home/learn/admin`, and redirects the old `/home/learn/setup` route to the Admin guide.

## Layer Impact

- `global-control-lane`: Updates shared Home Learn navigation and the Learn dynamic route.
- `internal-admin`: Clarifies that setup/connectors are Admin workspace topics, not Home taxonomy.

## Client Applicability

- All clients: The Learn navigation and copy are shared across clients.
- Specific clients: None.
- Internal only: Release record and regression tests.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/lib/home/learn-nav.ts` changes the Learn side-nav group from Setup to Admin Guide.
- `src/app/(maestro)/home/learn/[section]/page.tsx` serves `/home/learn/admin` and redirects `/home/learn/setup` to the Admin guide.
- `src/components/home/learn/SetupSection.tsx` updates visible copy from Setup wording to Admin workspace wording.
- `src/lib/home/__tests__/learn-nav.test.ts` prevents Setup from returning as a Home Learn category.

## QA / Validation

- PASS: `npx jest --runTestsByPath src/lib/home/__tests__/learn-nav.test.ts --runInBand`.
- PASS: `npx eslint src/lib/home/learn-nav.ts src/lib/home/__tests__/learn-nav.test.ts 'src/app/(maestro)/home/learn/[section]/page.tsx' src/components/home/learn/SetupSection.tsx`.
- PASS: `git diff --check`.
- PASS: `npm run release:check -- --base origin/main --head HEAD`.

## Rollout Plan

Merge to `main`. The Learn navigation/copy updates with the next Vercel deployment.

## Rollback Plan

Revert the PR to restore the previous Learn navigation and setup route behavior.

## Audit Evidence

- PR URL: pending.
- Local validation commands: focused Jest, ESLint, `git diff --check`, and release control.

## Known Gaps

The React component remains named `SetupSection` for compatibility in this narrow PR. The visible route, navigation, and copy now use Admin framing.
