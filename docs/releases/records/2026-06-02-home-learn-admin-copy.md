# 2026-06-02-home-learn-admin-copy — Home Learn Admin Copy Alignment

## Release ID

`2026-06-02-home-learn-admin-copy`

## Status

`candidate`

## Plain-English Summary

Aligns remaining Home Learn copy with the approved Home/Admin separation. Operational guidance that used to say Setup now says Admin workspace, and the workflow labels direct users toward Admin connector requests and Admin substrate readiness instead of presenting setup work as part of Home.

## Layer Impact

Global control lane UI copy and QA. This updates Home Learn text and adds a focused regression test; it does not change routes, data access, ingestion, or private data-plane behavior.

## Client Applicability

- All clients: Users reading Home Learn see Admin-aligned terminology.
- Specific clients: None.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/lib/home/learn-sections.ts`
- `src/components/home/learn/GlossarySection.tsx`
- `src/lib/home/__tests__/learn-admin-copy.test.ts`

## QA / Validation

Local validation:

- PASS — `npx jest --runTestsByPath src/lib/home/__tests__/learn-admin-copy.test.ts --runInBand`
- PASS — `npx eslint src/lib/home/learn-sections.ts src/components/home/learn/GlossarySection.tsx src/lib/home/__tests__/learn-admin-copy.test.ts`
- PASS — `git diff --check`
- PASS — `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to `main` and deploy normally through Vercel. No migration, feature flag, or data-plane action is required.

## Rollback Plan

Revert the PR to restore the previous Learn copy and remove the regression test. No data rollback is required.

## Audit Evidence

Inspect the PR diff, local validation output, release-control gate, and CI results.

## Known Gaps

This does not implement new Admin workflows or private data-plane loading. It only keeps Home Learn terminology aligned with the approved product boundary.
