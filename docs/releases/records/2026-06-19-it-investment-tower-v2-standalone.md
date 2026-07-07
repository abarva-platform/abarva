# 2026-06-19-it-investment-tower-v2-standalone — IT Investment Tower V2 Standalone

## Release ID

`2026-06-19-it-investment-tower-v2-standalone`

## Status

`candidate`

## Plain-English Summary

Replaces the current `/tower` React surface with the approved standalone IT Investment Tower v2 experience for every configured client. The page now renders the supplied investment dashboard shell as a mounted standalone asset: top navigation, fixed KPI band, Programs / Spend / Vendors / By Function / Actions tabs, Spend sub-slices, table/chart toggles, evidence drawers, Action routing simulation, and Ask Nexus dock mode.

## Layer Impact

- `global-control-lane`: `/tower` now mounts the approved v2 standalone shell instead of the prior AI Control Tower React component.
- `client-data-lane`: The authenticated Tower frame resolves only the signed-in active tenant and generates a v4 data script from that tenant's private dataset shape. It does not accept a cross-client query override.
- `public-demo`: The static `/tower-v2/index.html` asset preserves the offline synthetic First Capital Financial `$342M` demo model for laptop walkthroughs.

## Client Applicability

- All clients: `/tower` mounts the v2 shell for every configured app client: Apex Retail, Meridian Health, First Capital Financial, Northstar Clinical Technologies, SkyHarbor Air, and Lakeshore Holdings.
- Specific clients: Apex, Meridian, First Capital, SkyHarbor, and Lakeshore use their v4 synthetic packs. Northstar uses its existing synthetic v1 pack through an explicit adapter because no Northstar v4 pack exists in this repo state. No runtime cross-client reads are introduced.
- Internal only: None.
- Public/demo only: The static `/tower-v2/index.html` asset is an offline demo artifact.
- Feature flag: None.

## Changes Included

- Replaced `/tower` page rendering with a full-viewport iframe to the tenant-scoped `/api/tower/v2-frame`.
- Added `public/tower-v2/` standalone assets from `AbarVa Control Tower v2 (standalone) (2).html`.
- Added `src/app/api/tower/v2-frame/route.ts` to generate the authenticated tenant-scoped frame.
- Added `src/app/api/tower/v2-data/route.ts` as a tenant-scoped data-script endpoint.
- Added `src/lib/tower-v2/v4-data.ts` to normalize the active tenant's Tower pack into the approved Tower v2 data contract, including an explicit Northstar v1 adapter.
- Added all six configured client pack directories required by the runtime mapper.
- Updated Tower integration invariants to enforce the v2 standalone contract, authenticated active-client-only resolution, and one explicit Tower pack for every configured client.
- Narrowed two dynamic filesystem traces that caused Turbopack to scan the whole project after the new client packs were added.
- Raised Docker build-stage `NODE_OPTIONS` from 4096 MB to 6144 MB, matching existing CI build workflows and the passing local build smoke.

## QA / Validation

- Passed: `npx eslint 'src/lib/tower-v2/v4-data.ts' 'src/app/api/tower/v2-frame/route.ts' 'src/app/api/tower/v2-data/route.ts' 'src/app/(maestro)/tower/page.tsx' 'src/__tests__/integration/tower/tower-invariants.test.ts' 'src/__tests__/integration/tower/tower-authenticated-submenu-wiring.test.ts'`
- Passed: `npx jest src/__tests__/integration/tower/tower-invariants.test.ts src/__tests__/integration/tower/tower-authenticated-submenu-wiring.test.ts --runInBand` — 2 suites / 14 tests.
- Passed: `npm run release:check`
- Failed then fixed: default 4096 MB local `npm run build` compiled but OOMed during the Next build worker after the client packs were added.
- Passed: `NODE_OPTIONS='--max-old-space-size=6144' npm run build` — production build completed. The prior broad Turbopack dynamic-file tracing warnings were removed by static-scoping/ignoring runtime-only filesystem paths.
- Passed all-client mapper coverage in Jest:
  - Apex Retail -> `datasets/apex-retail-synthetic-v4`.
  - Meridian Health -> `datasets/meridian-health-synthetic-v4`.
  - First Capital Financial -> `datasets/first-capital-financial-synthetic-v4`.
  - Northstar Clinical Technologies -> `datasets/northstar-clinical-tech-synthetic-v1`.
  - SkyHarbor Air -> `datasets/skyharbor-air-synthetic-v4`.
  - Lakeshore Holdings -> `datasets/lakeshore-industries-synthetic-v4`.
- Passed runtime mapper smoke with generated binding counts:
  - Apex Retail: 10 programs, 100 vendors, 14 initiatives.
  - Meridian Health: 12 programs, 95 vendors, 14 initiatives.
  - First Capital Financial: 13 programs, 120 vendors, 42 initiatives.
  - Northstar Clinical Technologies: 6 programs, 90 vendors, 55 initiatives.
  - SkyHarbor Air: 13 programs, 320 vendors, 30 initiatives.
  - Lakeshore Holdings: 10 programs, 90 vendors, 10 initiatives.
- Passed deterministic Playwright render harness with First Capital v4 data:
  - Programs / Spend / Vendors / By Function / Actions tabs render.
  - Tabs repaint the canvas from generated v4 data.
  - Table/chart toggle works.
  - Static `/tower-v2/index.html` remains available for the approved offline standalone demo.
- Protected-route check: unauthenticated `GET /api/tower/v2-frame` redirects to `/sign-in?redirect=%2Fapi%2Ftower%2Fv2-frame`, so tenant data is not served to unsigned sessions.

## Rollout Plan

Merge and deploy through the normal app runtime. No database migration or data-plane write is included.

## Deployment Authority

- Repo-owned deploy workflow: Required. This release must deploy through the repo-owned main deploy workflow only, using the Dockerfile build-stage heap setting validated in QA.
- Shared runtime mutators: No manual ACA template mutation, traffic shift, feature flag rollout, DNS change, or worker image mutation is included in this PR.
- Approved image digest: To be captured from the successful main deploy after merge.
- ACA runtime invariant: The ACA web template image and the 100% traffic revision image must match the repo-built main digest after rollout.
- Worker image invariant: Cron/event worker images must either remain unchanged or match the same approved repo-built digest when the deploy workflow updates them.
- Feature/env flag update path: None. `/tower` becomes active on normal deploy; no flag is introduced.
- Live signed-in proof required: Required after rollout. Verify `/tower` in a signed-in browser for at least one non-First-Capital client and confirm the v2 IT Investment Tower shell is present.

## Rollback Plan

Revert this PR to restore the prior `/tower` React surface and remove `public/tower-v2/`, the v2 API routes, the runtime pack mapper, the copied client packs, and the v2 route tests. No schema rollback is required.

## Audit Evidence

- Playwright screenshot: `outputs/tower-v2-qa.png`.
- Focused Jest output: 2 suites / 13 tests passing.
- Focused ESLint output passing.
- Release gate output passing.
- Production build output passing.
- Playwright screenshot: `outputs/tower-v2-firstcapital-v4-render.png`.
- Post-merge required evidence: approved image digest, ACA template image after update, 100% traffic revision image, worker job image export, rollback revision, and signed-in client proof after rollout.

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

- The static offline `/tower-v2/index.html` intentionally uses the approved synthetic First Capital Financial `$342M` standalone model. The authenticated `/tower` route uses only the signed-in active tenant's mapped Tower pack data script.
- Northstar does not yet have a v4 pack in this repo state; it is explicitly covered by a v1-pack adapter so `/tower` still renders Northstar-branded data instead of defaulting to another client.
- Authenticated `/tower` browser QA depends on an existing signed-in session; unauthenticated local access redirects to Clerk as expected.
