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

## Layer Impact

Layer 4 Products only. Home preview presentation and QA proof scripts changed; canonical source
data, adapters, database tables, loaders, migrations, and product data-plane refresh paths are not
changed.

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
- Live signed-in proof required: Yes, Home preview route.

## Rollback Plan

Revert the PR and redeploy the previous ACA image through the repo-owned deploy workflow. No
migration rollback or data-plane repair is required because this release does not mutate
persistence.

## Audit Evidence

- Local clean worktree: `/tmp/nexus-home-preview-fix-141954`.
- Page proof directory: `/tmp/home-v4-pages-proof-141954`.
- Browser crawl report: `/tmp/home-v4-pages-proof-141954/browser-crawl-report.json`.
- Architecture map proof directory: `/tmp/home-v4-pages-proof-archmap-20260821-final`.

## Known Gaps

This is not deployed yet and is not live-proven. Signed-in production route proof is required after
merge and ACA deployment.
