# 2026-06-23-home-know-thread-composer — Home KNOW Thread Composer

## Release ID

`2026-06-23-home-know-thread-composer`

## Status

`candidate`

## Plain-English Summary

Home KNOW now behaves like a real ask thread. The composer no longer blocks the user from typing a follow-up while an answer is pending, every answer is visibly tied to the question that produced it, and completed tenant-session turns are restored from browser session storage.

## Layer Impact

- `global-control-lane`: Updates the shared Home KNOW client component used by all tenants on `/home`.
- `public-demo`: Improves the signed-in buyer-facing Home experience by making prompt history and follow-up questions visible and usable.

## Client Applicability

- All clients: Yes, all tenants using the Home KNOW surface.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: No new flag.

## Changes Included

- `src/components/home/know/HomeKnowAsk.tsx`
- `src/components/home/know/__tests__/HomeKnowAsk.test.tsx`

## QA / Validation

- `npm test -- --runTestsByPath src/components/home/know/__tests__/HomeKnowAsk.test.tsx` — passed.
- `npx eslint src/components/home/know/HomeKnowAsk.tsx src/components/home/know/__tests__/HomeKnowAsk.test.tsx` — passed.

## Rollout Plan

Merge to `main`, then deploy through the repo-owned Azure Container Apps main deployment workflow. No manual ACA mutation is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: No new mutator.
- Approved image digest: Resolved by the ACA main deploy workflow after merge.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: No worker behavior change, but workflow keeps worker image aligned.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, verify `/home` accepts two sequential questions and displays conversation history for a signed-in tenant.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main workflow. This change is client-only and does not alter database schema or tenant data.

## Audit Evidence

- PR URL: To be filled when opened.
- CI: Focused Home KNOW component tests and release checks.
- Runtime: ACA runtime invariant after deployment.
- Browser: Signed-in `/home` proof with at least two questions in history.

## Known Gaps

History is session-scoped browser storage, not a cross-device or database-backed thread store. Durable cross-surface continuity remains a separate backend/threading lane.
