# 2026-08-21-home-preview-workbench-qa — Home Preview Workbench QA

## Release ID

`2026-08-21-home-preview-workbench-qa`

## Status

`candidate`

## Plain-English Summary

Replaces weak Home preview evidence screens with workbench-style views that can be crawled and
visually checked before deployment. The architecture page now renders a current-state architecture
map across business capability, applications/core systems, integration/data, and platforms/hosting
instead of a function-ranking portfolio board; the loaded-context and browse-record pages are
denser fact exploration surfaces; and record browsers use object-specific columns, filters,
metrics, and detail panes.

Follow-up patch: Home v4 now honors hash-routed evidence pages (`#architecture`, `#data-flow`,
`#current-state`, `#browse-the-data`, and `#tech:*`) on load and on hash changes. This makes the
preview pages directly crawlable and prevents browser QA from staying on the default executive
brief while claiming evidence-page coverage.

Architecture follow-up: the prior visual QA only proved the old striped tile page disappeared. It
did not prove that the replacement answered an architecture question. This patch changes both the
surface and the proof: architecture QA now checks for architecture lanes, full estate data-movement
and platform inputs, explicit platform-join limits, and absence of the old workbench/roster labels.

Geometry follow-up: live visual proof showed that text assertions alone were still too weak. The
architecture canvas now reduces rail and arrow width, compacts the governed-lakehouse layer grid,
and exposes per-zone markers so browser QA can prove zones are visible instead of merely present in
the DOM.

Full Home design pass: all Home preview tabs now get a stronger shared treatment without changing
the underlying evidence. Briefing chapters use a dossier-style header and framed evidence bands;
loaded context adds an object-family pulse; browse adds a domain signal map; record tabs get a
stronger workbench/table/detail treatment; and data-flow now falls back to a movement profile when
end-to-end lineage is not admitted.

CXO relationship pass: the design pass now surfaces the relationships already present in the
record. Architecture includes an enterprise relationship crosswalk across functions, hosting/cloud
posture, vendors, owners, lifecycle, and data movement; record browsers behave like slice/dice
workbenches with dimension selectors; and leadership interview evidence is visible in the briefing
tabs instead of hidden inside flat signal rows.

Route replacement follow-up: `/home` now mounts the same v4 Home executive readout as the reviewed
preview surface. The retired horizontal-tab enterprise-landscape reader remains on disk for history
and tests, but it is no longer the default Home route.

## Layer Impact

Layer 4 Products only. Home presentation, route wiring, and QA proof scripts changed; canonical
source data, adapters, database tables, loaders, migrations, and product data-plane refresh paths
are not changed.

## Client Applicability

- All clients: No automatic client data-plane change.
- Specific clients: None.
- Internal only: Home preview review and QA workflow.
- Public/demo only: Checked-in Home preview golden-snapshot surfaces.
- Feature flag: None.

## Changes Included

- Home v4 architecture page now routes architecture admission through a shared resolver and renders
  a current-state architecture map instead of the oversized weighted tile layout or the later
  function/category roster.
- Home v4 data-flow page uses the same resolver and renders a refusal state when the record cannot
  support an end-to-end flow diagram.
- Current-state and browse-record preview pages were rebuilt as dense evidence exploration views.
- Technology record browser now uses object-specific columns, filters, summary metrics, and a
  selected-record detail pane.
- Added a boundary test so Home v4 architecture pages cannot import projection builders directly.
- Added `scripts/qa/render-home-v4-pages-proof.tsx` for page-level browser proof.
- Home v4 rail selection and hash navigation now stay in sync so direct evidence-page URLs render
  the selected page rather than the default executive brief.
- Architecture proof rendering now passes applications, integrations, and infrastructure into the
  architecture page so the proof cannot pass with zero data movements or zero platforms.
- Visual polish follow-up shortened the platform-lane title so the current-state architecture map
  does not force long infrastructure copy into the narrow rightmost lane.
- Reference-architecture follow-up replaces the simple lane map with a zone-and-arrow data
  architecture canvas: source zone, ingestion zone, governed lakehouse, intelligence zone, and
  consumption zone, plus governance/storage/consumer foundation bands.
- Architecture geometry follow-up reduces the scope rail and map gutters, compacts the lakehouse
  layer grid, and tags each architecture zone so browser proof can catch a clipped zone instead of
  passing on text presence alone.
- Full Home design pass improves the rail active state, briefing chapter headers and claim bands,
  loaded-context overview, browse-record command surface, record-browser workbench, and data-flow
  fallback. The fallback preserves the resolver boundary: it shows recorded movement evidence while
  saying why an end-to-end data-flow diagram is not yet proven.
- Page proof harness now renders every briefing chapter as well as evidence and record pages for
  both checked-in tenants, so QA covers 32 Home surfaces instead of only the evidence subset.
- Briefing chapter tabs now add a CXO readout that summarizes the executive decision, evidence
  signal, exposure to watch, and generated question without dropping the existing record/follows/
  exposure/not-established bands.
- Leadership evidence is now visible inside the chapter surface through a leadership voice strip:
  interview testimony, consensus themes, and contradiction/conflict counts are pulled from cited
  interview signals.
- Architecture now adds an enterprise relationship crosswalk showing recorded mappings from
  function to hosting/cloud posture, function to vendor exposure, owner to lifecycle posture, and
  data domain to integration/platform posture. The architecture evidence boundary remains explicit
  where platform hosting joins are not recorded.
- Technology record browsers now use slice/dice dimension selectors, distribution strips, and a
  relationship lens. Applications can be inspected by business function, deployment model, vendor,
  owner, lifecycle, criticality, and data domain without losing the underlying row table/detail.
- Mobile record tables collapse to the identity column while preserving full content in the
  selected-record detail pane and cube controls, preventing spreadsheet-width overflow on phone
  viewports.
- The default `/home` route now resolves the signed-in tenant through the canonical tenant resolver,
  selects an accepted Home v4 golden snapshot when one exists, and renders `HomePreviewAppRoot`
  directly instead of the retired `HomeEnterpriseLandscapeV2` reader.
- Home boundary tests now assert that `/home` mounts v4 and rejects the old enterprise-landscape
  route entrypoint.

## QA / Validation

- `npx eslint src/components/home/v4/ArchitecturePage.tsx src/components/home/v4/DataFlowPage.tsx src/components/home/v4/RecordBrowser.tsx src/components/home/v4/ArchitectureRefusal.tsx src/components/home/v4/HomeV4App.tsx src/components/home/preview/CurrentState.tsx src/components/home/preview/BrowseTheData.tsx src/lib/visual-system/resolveArchitectureView.ts scripts/qa/render-home-v4-proof.tsx scripts/qa/render-home-v4-pages-proof.tsx` passed.
- `npm test -- --runTestsByPath src/components/home/v4/__tests__/architecture-boundary.test.ts tests/behaviors/architecture-view-formats.test.ts --runInBand` passed. Jest still reports existing duplicate manual mock warnings.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false` passed.
- `npx tsx scripts/qa/render-home-v4-pages-proof.tsx --out /tmp/home-v4-pages-proof-141954` rendered 16 proof pages.
- Chromium crawl covered 12 page proofs across desktop and mobile viewports: 24 checks, zero old
  marker hits, and zero horizontal overflow. Report:
  `/tmp/home-v4-pages-proof-141954/browser-crawl-report.json`.
- Follow-up validation: `npx eslint src/components/home/v4/HomeV4App.tsx src/components/home/v4/Rail.tsx` passed.
- Follow-up validation: `npm test -- --runTestsByPath src/components/home/v4/__tests__/architecture-boundary.test.ts tests/behaviors/architecture-view-formats.test.ts --runInBand` passed. Jest still reports existing duplicate manual mock warnings.
- Follow-up validation: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false` passed.
- Architecture follow-up validation: `npx eslint src/components/home/v4/ArchitecturePage.tsx src/components/home/v4/HomeV4App.tsx scripts/qa/render-home-v4-pages-proof.tsx` passed.
- Architecture follow-up validation: `npx tsx scripts/qa/render-home-v4-pages-proof.tsx --out /tmp/home-v4-pages-proof-archmap-20260821-final` rendered 16 proof pages.
- Architecture follow-up Chromium proof passed semantic assertions for current-state architecture
  map, business/application/integration/platform lanes, 540 data movements, 66 platforms, explicit
  platform-join limits, zero old workbench/roster labels, and zero horizontal overflow. Report:
  `/tmp/home-v4-pages-proof-archmap-20260821-final/architecture-browser-report.json`. Screenshot:
  `/tmp/home-v4-pages-proof-archmap-20260821-final/meridian-health-architecture-browser.png`.
- Visual polish validation: `npx eslint src/components/home/v4/ArchitecturePage.tsx` passed.
- Reference-architecture validation: `npx eslint src/components/home/v4/ArchitecturePage.tsx` passed.
- Reference-architecture validation: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false` passed.
- Reference-architecture validation: `npx tsx scripts/qa/render-home-v4-pages-proof.tsx --out /tmp/home-v4-pages-proof-reference-arch-20260821-final` rendered 16 proof pages.
- Reference-architecture Chromium proof passed semantic assertions for source/ingestion/governed
  lakehouse/intelligence/consumption zones, ingest/land/analyze/serve arrows, RAW/ODS/canonical/marts
  layer terms, foundation bands, explicit architecture boundary, no old workbench label, and zero
  horizontal overflow. Report: `/tmp/home-v4-pages-proof-reference-arch-20260821-final/reference-architecture-browser-report.json`.
- Geometry follow-up validation: `npx eslint src/components/home/v4/ArchitecturePage.tsx` passed.
- Geometry follow-up validation: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false` passed.
- Full Home design-pass validation: `npx eslint src/components/home/v4/ArchitectureRefusal.tsx src/components/home/v4/ArchitecturePage.tsx src/components/home/v4/DataFlowPage.tsx src/components/home/v4/Rail.tsx src/components/home/v4/bands.tsx src/components/home/v4/RecordBrowser.tsx src/components/home/preview/CurrentState.tsx src/components/home/preview/BrowseTheData.tsx scripts/qa/render-home-v4-pages-proof.tsx` passed.
- Full Home design-pass validation: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false` passed.
- Full Home design-pass validation: `npm test -- --runTestsByPath src/components/home/v4/__tests__/architecture-boundary.test.ts tests/behaviors/architecture-view-formats.test.ts --runInBand` passed. Jest still reports existing duplicate manual mock warnings.
- Full Home design-pass validation: `npx tsx scripts/qa/render-home-v4-pages-proof.tsx --out /tmp/home-v4-pages-proof-full-design-pass-20260821` rendered 32 Home proof pages: 16 briefing chapters, 8 evidence pages, and 8 technology record pages across both checked-in tenants.
- Full Home two-viewport Playwright crawl passed 64 checks across desktop and mobile: required page markers present, old architecture markers absent, zero horizontal overflow, and desktop architecture zones visible in-map. Report: `/tmp/home-v4-pages-proof-full-design-pass-20260821/full-home-playwright-viewport-report.json`.
- CXO relationship-pass validation: `npx eslint src/components/home/v4/ArchitecturePage.tsx src/components/home/v4/ChapterPage.tsx src/components/home/v4/RecordBrowser.tsx` passed.
- CXO relationship-pass validation: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false` passed.
- CXO relationship-pass validation: `npm test -- --runTestsByPath src/components/home/v4/__tests__/architecture-boundary.test.ts tests/behaviors/architecture-view-formats.test.ts --runInBand` passed. Jest still reports existing duplicate manual mock warnings.
- CXO relationship-pass validation: `npx tsx scripts/qa/render-home-v4-pages-proof.tsx --out /tmp/home-v4-pages-proof-cxo-left-rail-20260821-v4` rendered 32 Home proof pages.
- CXO relationship-pass browser QA initially failed mobile record-table geometry, then passed after
  the table collapsed to an identity-column mobile view. Final Playwright crawl passed 64 desktop
  and mobile checks: chapter CXO readouts, leadership interview strip, architecture relationship
  crosswalk, architecture zones, record slice/dice controls, record relationship lens, and zero
  horizontal overflow. Report:
  `/tmp/home-v4-pages-proof-cxo-left-rail-20260821-v4/full-viewport-crawl.json`.
- Route replacement validation: `npx eslint 'src/app/(maestro)/home/page.tsx' 'src/app/(maestro)/home/layout.tsx' 'src/app/(maestro)/home/__tests__/home-admin-boundary-contract.test.ts' 'src/app/(maestro)/home/__tests__/home-layer-boundary-contract.test.ts'` passed.
- Route replacement validation: `npm test -- --runTestsByPath 'src/app/(maestro)/home/__tests__/home-admin-boundary-contract.test.ts' 'src/app/(maestro)/home/__tests__/home-layer-boundary-contract.test.ts' --runInBand` passed. Jest still reports existing duplicate manual mock warnings.
- Route replacement validation: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false` passed.
- Route replacement validation: `npm run release:check` passed.

## Rollout Plan

Open a PR, merge to `main`, and let the repo-owned Azure Container Apps main deploy workflow build
and deploy the web image. After deployment, run signed-in browser proof on the Home preview route
before calling the change live.

## Deployment Authority

- Repo-owned deploy workflow: Required for shared runtime rollout.
- Shared runtime mutators: None in this branch.
- Approved image digest: Not applicable until main deploy workflow builds the image.
- ACA runtime invariant: Must be proven after deployment before live claim.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, default Home route and Home preview route.

## Rollback Plan

Revert the PR and redeploy the previous ACA image through the repo-owned deploy workflow. No
migration rollback or data-plane repair is required because this release does not mutate
persistence.

## Audit Evidence

- Local clean worktree: `/tmp/nexus-home-preview-fix-141954`.
- Page proof directory: `/tmp/home-v4-pages-proof-141954`.
- Browser crawl report: `/tmp/home-v4-pages-proof-141954/browser-crawl-report.json`.
- Architecture map proof directory: `/tmp/home-v4-pages-proof-archmap-20260821-final`.
- CXO relationship proof directory: `/tmp/home-v4-pages-proof-cxo-left-rail-20260821-v4`.
- CXO relationship full crawl report:
  `/tmp/home-v4-pages-proof-cxo-left-rail-20260821-v4/full-viewport-crawl.json`.
- CXO relationship spot screenshots are in the proof directory alongside the crawl report.

## Known Gaps

This is not deployed yet and is not live-proven. Signed-in production route proof is required after
merge and ACA deployment.
