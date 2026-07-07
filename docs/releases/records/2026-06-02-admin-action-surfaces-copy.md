# 2026-06-02-admin-action-surfaces-copy — Admin Action Surfaces Copy

## Release ID

`2026-06-02-admin-action-surfaces-copy`

## Status

`candidate`

## Plain-English Summary

This release updates the legacy overview runtime copy so Section 05 no longer presents setup/admin controls as "Home action surfaces." The section now says "Admin action surfaces" and the associated composer/test language reinforces that setup, access, readiness, and audit controls belong under Admin, while Home insight surfaces remain separate.

## Layer Impact

- `global-control-lane`: Runtime copy and tests for the shared Admin/Home overview model.
- `internal-admin`: Clarifies admin-only action panels and prevents future `/home/*` aliases from returning to the admin action panel model.

## Client Applicability

- All clients: The shared overview copy and guard apply anywhere this surface is rendered.
- Specific clients: None.
- Internal only: The release record and tests are internal release-control evidence.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/components/home/HomeOverviewV2.tsx` updates Section 05 title/lead from Home action language to Admin action language.
- `src/lib/admin/home-overview-v2.ts` updates composer comments around the Admin overview and retired AI Initiatives card.
- `src/lib/admin/__tests__/home-overview-v2-pre-w4-pr5.test.ts` adds a guard that admin action panel hrefs stay under `/admin`.

## QA / Validation

- PASS: `rg -n "Home action surfaces|setup panels|Setup panels|Setup panel|remaining setup panels|/home/ai-initiatives which now|Section 05" src/lib/admin src/components/home src/__tests__ -g '*.ts' -g '*.tsx'` returns only intentional Section 05 references.
- PASS: `npx jest --runTestsByPath src/lib/admin/__tests__/home-overview-v2-pre-w4-pr5.test.ts --runInBand`.
- PASS: `npx eslint src/components/home/HomeOverviewV2.tsx src/lib/admin/home-overview-v2.ts src/lib/admin/__tests__/home-overview-v2-pre-w4-pr5.test.ts`.
- PASS: `git diff --check`.
- PASS: `npm run release:check -- --base origin/main --head HEAD`.

## Rollout Plan

Merge to `main`. The change is immediately available with the next Vercel deployment.

## Rollback Plan

Revert the PR to restore the previous Section 05 copy and test expectations.

## Audit Evidence

- PR URL: pending.
- Local validation commands: grep audit, focused Jest, ESLint, `git diff --check`, and release control.

## Known Gaps

The exported type/function names still use `HomeOverviewV2` for backward compatibility. This PR only corrects visible copy and guardrail language; a symbol rename can be handled separately if needed.
