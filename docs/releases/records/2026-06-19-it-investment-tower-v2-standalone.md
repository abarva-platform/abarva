# 2026-06-19-it-investment-tower-v2-standalone — IT Investment Tower V2 Standalone

## Release ID

`2026-06-19-it-investment-tower-v2-standalone`

## Status

`candidate`

## Plain-English Summary

Replaces the current `/tower` React surface with the approved standalone IT Investment Tower v2 experience. The page now renders the supplied First Capital Financial dashboard shell exactly as a mounted standalone asset: top navigation, fixed KPI band, Programs / Spend / Vendors / By Function / Actions tabs, Spend sub-slices, table/chart toggles, evidence drawers, Action routing simulation, and Ask Nexus dock mode.

## Layer Impact

- `global-control-lane`: `/tower` now mounts the approved v2 standalone shell instead of the prior AI Control Tower React component.
- `client-data-lane`: The authenticated Tower frame resolves only the signed-in active tenant and generates a v4 data script from that tenant's private dataset shape. It does not accept a cross-client query override.
- `public-demo`: The static `/tower-v2/index.html` asset preserves the offline synthetic First Capital Financial `$342M` demo model for laptop walkthroughs.

## Client Applicability

- All clients: The v2 shell code is reusable, but each authenticated request resolves only the signed-in active tenant and that tenant's private data-plane pack.
- Specific clients: This candidate was validated against the Lakeshore v4 synthetic pack for the active-tenant path. Other clients require their own private data-plane deployment/validation; no runtime cross-client reads are introduced.
- Internal only: None.
- Public/demo only: The static `/tower-v2/index.html` asset is an offline demo artifact.
- Feature flag: None.

## Changes Included

- Replaced `/tower` page rendering with a full-viewport iframe to the tenant-scoped `/api/tower/v2-frame`.
- Added `public/tower-v2/` standalone assets from `AbarVa Control Tower v2 (standalone) (2).html`.
- Added `src/app/api/tower/v2-frame/route.ts` to generate the authenticated tenant-scoped frame.
- Added `src/app/api/tower/v2-data/route.ts` as a tenant-scoped data-script endpoint.
- Added `src/lib/tower-v2/v4-data.ts` to normalize the active tenant's v4 pack into the approved Tower v2 data contract.
- Updated the Docker runtime stage to copy only `datasets/lakeshore-industries-synthetic-v4` so the tenant-scoped frame has its private demo substrate at runtime.
- Updated Tower integration invariants to enforce the v2 standalone contract instead of the retired React Tower page.

## QA / Validation

- Passed: `npx eslint 'src/lib/tower-v2/v4-data.ts' 'src/app/api/tower/v2-frame/route.ts' 'src/app/api/tower/v2-data/route.ts' 'src/app/(maestro)/tower/page.tsx' 'src/__tests__/integration/tower/tower-invariants.test.ts' 'src/__tests__/integration/tower/tower-authenticated-submenu-wiring.test.ts'`
- Passed: `npx jest src/__tests__/integration/tower/tower-invariants.test.ts src/__tests__/integration/tower/tower-authenticated-submenu-wiring.test.ts --runInBand` — 2 suites / 13 tests.
- Passed: `npm run release:check`
- Passed: `npm run build` — production build completed; earlier broad dynamic-file tracing warning was removed by statically scoping the v4 reader under `datasets/`.
- Passed Lakeshore active-tenant data binding smoke:
  - Source: `datasets/lakeshore-industries-synthetic-v4`.
  - Generated binding: 10 programs, 90 vendors, 10 initiatives, 10 spend rows, 10 benefit rows.
  - Generated totals: $877.8M budget, $604.0M run, $273.7M change, $105.7M AI budget, $91.8M realized value.
- Passed deterministic Playwright render harness with Lakeshore v4 data:
  - Programs / Spend / Vendors / By Function / Actions tabs render.
  - Tabs repaint the canvas from generated v4 data.
  - Table/chart toggle works.
  - Static `/tower-v2/index.html` remains available for the approved offline standalone demo.
- Protected-route check: unauthenticated `GET /api/tower/v2-frame` redirects to `/sign-in?redirect=%2Fapi%2Ftower%2Fv2-frame`, so tenant data is not served to unsigned sessions.

## Rollout Plan

Merge and deploy through the normal app runtime. No database migration or data-plane write is included.

## Rollback Plan

Revert `/tower` page and remove `public/tower-v2/` assets plus the v2 route tests. No schema rollback is required.

## Audit Evidence

- Playwright screenshot: `outputs/tower-v2-qa.png`.
- Focused Jest output: 2 suites / 13 tests passing.
- Focused ESLint output passing.
- Release gate output passing.
- Production build output passing.
- Playwright screenshot: `outputs/tower-v2-firstcapital-v4-render.png`.

## Context Ingestion Evidence

This release changes Tower rendering and tenant-scoped demo data binding only. It does not run ingestion, parsing, Blob staging, queue handoff, embedding refresh, or a new client data-plane load.

- Local artifact generated: Static v2 Tower assets staged under `public/tower-v2/`.
- Local parse/preflight: Standalone HTML unpacked and browser-tested locally.
- Product loader/API acceptance: Not applicable.
- Azure Blob/object storage staging: Not applicable.
- Queue/private worker handoff: Not applicable.
- Parser extraction with source citations: Not applicable.
- Review/approval queue: Not applicable.
- Client data-plane commit: Not applicable.
- Embedding/search refresh: Not applicable.
- Live signed-in retrieval or answer QA: Not run in this change; browser QA used the same static v2 shell mounted by `/tower`.

Path type: UI/static standalone demo mount plus tenant-scoped v4 data-script generation; no ingestion path changed.

## Known Gaps

- The static offline `/tower-v2/index.html` intentionally uses the approved synthetic First Capital Financial `$342M` standalone model. The authenticated `/tower` route uses only the signed-in active tenant's v4 pack data script.
- Authenticated `/tower` browser QA depends on an existing signed-in session; unauthenticated local access redirects to Clerk as expected.
