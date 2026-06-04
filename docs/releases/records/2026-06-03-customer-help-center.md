# 2026-06-03-customer-help-center - Customer Help Center

## Release ID

`2026-06-03-customer-help-center`

## Status

`candidate`

## Plain-English Summary

Adds an authenticated `/docs` help-center landing page for pilot users. The page
explains where users should start, which controls live in Admin/Setup, how
module workflows should be used, and how to escalate feedback or incidents
without exposing internal security/legal material.

## Layer Impact

- Global control lane: adds a shared authenticated product-docs surface for all
  clients.
- Internal admin: reinforces the Home/Admin separation and points admins to the
  canonical setup workspace.

## Client Applicability

- All clients: the authenticated help center is available to any signed-in
  client user.
- Specific clients: none.
- Internal only: none.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `src/app/(maestro)/docs/page.tsx`
- `src/app/(maestro)/docs/__tests__/product-docs-page.test.tsx`
- `src/lib/help-center/product-docs.ts`

## QA / Validation

- `git diff --check origin/main...HEAD` - passed.
- `npm run release:check -- --base origin/main --head HEAD` - passed.
- `npx jest --runTestsByPath 'src/app/(maestro)/docs/__tests__/product-docs-page.test.tsx' --runInBand` - passed.
- `npx eslint 'src/app/(maestro)/docs/page.tsx' 'src/app/(maestro)/docs/__tests__/product-docs-page.test.tsx' src/lib/help-center/product-docs.ts` - passed.
- `npx tsc --noEmit --pretty false` - blocked locally by existing missing optional packages `@azure-rest/ai-document-intelligence` and `@axe-core/playwright`; no help-center type errors were reported before the dependency failures.

## Rollout Plan

Merge to `main`. The page becomes available at `/docs` inside the authenticated
Maestro shell. No database migration, feature flag, data load, or client-data
movement is required.

## Rollback Plan

Revert the docs PR if the route content or information architecture is rejected.
No data rollback is required.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/2972
- CI checks: pending on PR #2972.
- Local validation: focused Jest, focused ESLint, release gate, and diff check passed; full local TypeScript blocked by existing optional dependency gaps.

## Known Gaps

- This creates the help-center landing page and guide taxonomy. It does not yet
  create a full article CMS, search index, or external help-center domain.
