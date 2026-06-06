# 2026-06-05-logo-doc-refresh - Option 2 Logo Refresh For Demo Docs

## Release ID

`2026-06-05-logo-doc-refresh`

## Status

`candidate`

## Plain-English Summary

This release refreshes the polished AbarVa demo documents, Source wireframes,
Strategic Moves journey maps, and product architecture pages so their visible
navigation bars and brand marks use the new Option 2 logo assets instead of the
older handwritten wordmark or generic "A" placeholders.

## Layer Impact

- `public-demo`: Updates static HTML and markdown artifacts used for demos,
  architecture walkthroughs, and buyer-facing product explanation.
- `global-control-lane`: No runtime control-plane behavior changes. The docs now
  align with the already-adopted global app navigation logo direction.

## Client Applicability

- All clients: No runtime app behavior change.
- Specific clients: Demo artifacts for PHS, MedTech, Apex, Lakeshore, and
  related architecture walkthroughs use the refreshed brand treatment.
- Internal only: Historical implementation-review notes remain unchanged where
  they describe prior asset decisions.
- Public/demo only: Static documentation and visual demo pages.
- Feature flag: None.

## Changes Included

- Refreshed logo usage in Source design screens and wireframe atlas docs.
- Refreshed logo usage in Strategic Moves homepage, workspace, and flow cascade
  journey-map docs.
- Refreshed logo usage in the MedTech executive briefing and training move guide.
- Refreshed product architecture docs including the knowledge-layer architecture
  index and four-surface workspace architecture wireframe.
- Updated authoring/spec references so future docs point at the Option 2 asset
  folder.

## QA / Validation

Local validation:

- Pass: `rg` audit for stale old-logo visual references across demo/design/build
  docs. Remaining matches are historical implementation-review markdown only.
- Pass: Option 2 image path resolver across refreshed static HTML docs.
- Pass: `git diff --check`
- Pass: `npm run release:check -- --base origin/main --head HEAD`
- Pass: `npx jest src/__tests__/integration/design/abarva-logo.test.ts
  src/__tests__/integration/qa/logo-usage-enforcement.test.ts --runInBand`
  (24 tests passed; Jest emitted pre-existing duplicate manual mock warnings).
- Pass: Browser visual spot-check of six representative static HTML pages;
  all refreshed Option 2 logo images rendered with nonzero natural dimensions.

## Rollout Plan

Merge to main. No database migration, tenant data-plane change, Azure deployment,
or feature flag is required. Static docs and demo pages pick up the refreshed
assets from the existing `public/brand/abarva-option2-hq-logo-assets/` folder.

## Rollback Plan

Revert this release record and the static documentation changes. No data or
infrastructure rollback is required.

## Audit Evidence

- Pull request diff.
- Stale-reference search output.
- Release check output.
- Focused logo guard output.
- Browser visual spot-check output and screenshots:
  `/tmp/abarva-logo-doc-refresh-screens/source-executive-decision.png`,
  `/tmp/abarva-logo-doc-refresh-screens/workspace-architecture.png`,
  `/tmp/abarva-logo-doc-refresh-screens/training-guide.png`.

## Known Gaps

Historical implementation-review markdown still contains old asset names where
those documents describe previous logo decisions. Those are not rendered demo
surfaces and were left intact for audit history.
