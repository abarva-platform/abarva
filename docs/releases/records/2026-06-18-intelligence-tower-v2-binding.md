# 2026-06-18-intelligence-tower-v2-binding — Intelligence and Tower V2 Binding

## Release ID

`2026-06-18-intelligence-tower-v2-binding`

## Status

`candidate`

## Plain-English Summary

Rebuilds the Intelligence and AI Control Tower pages around the new context and AI Control Tower read model. Tower now reads a normalized model across initiatives, adoption, productivity, agents, spend, risk, evidence, actions, and function segments instead of the older legacy initiative/vendor rows. Intelligence now combines enterprise context coverage with the Tower substrate so Sentinel can answer executive questions with structured rows, citations, and honest missing-context disclosures.

## Layer Impact

- `global-control-lane`: Shared `/tower` and `/intelligence` user experience, read-model logic, and component tests changed for all tenants.
- `client-data-lane`: The read model binds to tenant-scoped `ai_control_*` data-plane rows and exposes committed/fallback/empty data state explicitly.

## Client Applicability

- All clients: Receive the rebuilt page shells and normalized empty-state behavior.
- Specific clients: First Capital receives a clearly labeled local synthetic fallback when committed AI Control Tower rows are absent, so the demo can still show the v2 substrate shape without claiming a data-plane commit.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Added `src/lib/ai-control-tower/read-model.ts`.
- Rebuilt `src/components/tower/AiControlTowerPage.tsx`.
- Simplified `src/app/(maestro)/tower/page.tsx` to pass the normalized read model.
- Rebuilt `src/components/intelligence-v4/ContextCorpusExplorerPage.tsx`.
- Updated `src/app/(maestro)/intelligence/page.tsx` to bind the Tower model beside the enterprise context overview.
- Updated/added tests:
  - `src/lib/ai-control-tower/__tests__/read-model.test.ts`
  - `src/components/tower/__tests__/AiControlTowerPage.test.tsx`
  - `src/__tests__/integration/intelligence/context-corpus-explorer-route.test.ts`

## QA / Validation

- Passed: `npx eslint src/lib/ai-control-tower/read-model.ts src/components/tower/AiControlTowerPage.tsx src/components/tower/__tests__/AiControlTowerPage.test.tsx src/components/intelligence-v4/ContextCorpusExplorerPage.tsx 'src/app/(maestro)/tower/page.tsx' 'src/app/(maestro)/intelligence/page.tsx' src/__tests__/integration/intelligence/context-corpus-explorer-route.test.ts src/lib/ai-control-tower/__tests__/read-model.test.ts`
- Passed: `npm test -- --runTestsByPath src/lib/ai-control-tower/__tests__/read-model.test.ts src/components/tower/__tests__/AiControlTowerPage.test.tsx src/__tests__/integration/intelligence/context-corpus-explorer-route.test.ts --runInBand`
- Browser/dev-server check: `npm run dev` starts successfully on `http://localhost:3000`.
- Browser auth check: unauthenticated `/tower` correctly redirects to `/sign-in?redirect=%2Ftower`.
- Browser sign-in attempt for `cio@firstcapital.example.com` using the documented demo password/code reached Clerk but failed with `demo_user_not_found`; visual protected-route QA is blocked until local/prod Clerk is seeded.
- Full `npx tsc --noEmit --pretty false` still fails on unrelated missing optional type/module declarations already present on main: `js-yaml`, `@azure-rest/ai-document-intelligence`, and `@axe-core/playwright`.

## Rollout Plan

Merge to main and deploy through the normal app runtime deployment. No schema migration is included in this release; the pages read existing `ai_control_*` tables when present and fail soft otherwise.

## Rollback Plan

Revert this release's changed files to restore the prior Tower and Intelligence pages. No database rollback is required.

## Audit Evidence

- Focused Jest output for 3 suites / 7 tests passing.
- Focused ESLint output passing.
- Dev server startup output showing Next.js ready on port 3000.
- Browser sign-in gate output showing protected route redirect and Clerk provisioning blocker.

## Context Ingestion Evidence

This release changes read binding and UI rendering only. It does not run ingestion, parsing, Blob staging, queue handoff, embedding refresh, or a new client data-plane load.

- Local artifact generated: Not applicable.
- Local parse/preflight: Not applicable.
- Product loader/API acceptance: Not applicable.
- Azure Blob/object storage staging: Not applicable.
- Queue/private worker handoff: Not applicable.
- Parser extraction with source citations: Not applicable.
- Review/approval queue: Not applicable.
- Client data-plane commit: Not applicable.
- Embedding/search refresh: Not applicable.
- Live signed-in retrieval or answer QA: Blocked by missing local Clerk demo user for `cio@firstcapital.example.com`.

Path type: UI/read-model binding only; no ingestion path changed.

## Known Gaps

- Protected browser QA requires Clerk seeding for the First Capital demo user.
- Full repository TypeScript check is blocked by existing unrelated optional package/type declaration gaps on main.
- The First Capital local synthetic fallback is explicitly labeled and should be retired once the AI Control Tower rows are committed in the data plane for every demo tenant.
