# 2026-07-24-home-explorer-full-catalog — Mac Finder-style explorer, full 38-concept catalog

## Release ID

`2026-07-24-home-explorer-full-catalog`

## Status

`candidate`

## Plain-English Summary

Direct follow-up to the same-day nav dedup (PR #5559) and density pass (PR #5563), and to explicit
user direction: restore every real enterprise concept the earlier dedup had collapsed away for
lack of a dedicated renderer, using a Mac Finder-style collapsible tree instead of a flat list —
so the surface stays calm (collapsed by default) without deleting real concepts.

**What changed:**

1. **`ViewKey` expanded from 14 to 42 values**, one per concept in
   `scripts/knowledge/build-home-knowledge-v4-review-pack.mjs`'s `expandedDimensionCatalog` (the
   canonical 38-key V4 dimension catalog, mirrored here by hand — same convention as
   `homeV4Visual.ts`) plus the 4 special hand-built views (`snapshot`, `operating`, `map`,
   `coverage`). Every concept gets its own `ViewKey`/`dimKey` pair; concepts with no generated V2
   content yet fall through to `DimensionView`'s existing honest fallback ("available for
   exploration, but the generated brief has not yet authored a strong executive interpretation")
   — nothing is fabricated to fill a gap.
2. **Fixed two real bugs found while doing this**: `integrations`'s `dimKey` previously pointed at
   `"rel"` (should be its own key — likely a copy/paste artifact); the old `constraints` ViewKey
   duplicated `risks`' `dimKey` exactly (flagged as an open question in the same-day pipeline
   audit) — retired in favor of the real, distinct `structural_constraints` catalog concept
   instead of a same-content duplicate.
3. **Sidebar rebuilt as a collapsible Finder-style tree**: 8 group headers (unchanged from the
   prior dedup), each with a disclosure triangle, an inline monochrome SVG icon (new — 8 icons,
   one per group, no icon-library dependency), and — when expanded — every real concept in that
   group as an individually clickable item. Enterprise Brief and Executive Brief open by default;
   the other 6 groups start collapsed, so first paint stays calm while every concept remains one
   click away.

## Layer Impact

- `global-control-lane`: live for every tenant on `/home` — same page, no new route.

## Client Applicability

- All clients — shared `/home` sidebar, not tenant-specific content.
- Feature flag: none.

## Changes Included

- `src/components/home/HomeEnterpriseBriefApp.tsx`:
  - `ViewKey` type: 14 → 42 values.
  - `VIEW_META`: rewritten with all 42 entries; fixed `integrations` dimKey bug; replaced
    `constraints` (duplicate of `risks`) with `structural_constraints` (real, distinct concept).
  - `NAV_GROUPS`: rewritten with all 38 catalog concepts distributed across the same 8 groups used
    since the earlier dedup, each with an `icon` field.
  - New `ExplorerGroupIcon` component + `EXPLORER_ICON_PATHS`: 8 inline SVG line icons.
  - Sidebar rendering: flat list → collapsible tree with per-group open/closed state
    (`openGroups`), disclosure triangle, default-open only for the first two groups.

## QA / Validation

- `pass` — `npx eslint`, exit 0.
- `pass` — full `npm run build` (production Turbopack build), clean — 17 pre-existing warnings in
  unrelated files (admin/pricing modules), none touching this change.
- `pending` — live signed-in browser verification post-deploy: confirm all 8 groups expand/collapse,
  icons render, and at least one previously-collapsed concept (e.g. "Front / Middle / Back Office")
  is reachable again and shows the honest not-yet-authored fallback rather than an error.

## Rollout Plan

Merge through the normal PR path → `aca-main-deploy.yml` builds and deploys automatically. After
deploy: confirm the ACA runtime invariant, screenshot the expanded/collapsed states on `/home` for
a real tenant.

## Deployment Authority

- Repo-owned deploy workflow: Azure Container Apps main deploy after merge.
- Shared runtime mutators: none — pure component change, no data, no schema.
- Live signed-in proof required: yes — same standing requirement as every other live `/home`
  change this session.

## Rollback Plan

Revert the PR. Sidebar reverts to the prior flat 14-item list — no data or schema involved either
way.

## Audit Evidence

- Same-day pipeline audit (delivered inline, not a separate file) identified the `integrations`
  dimKey bug and the `constraints`/`risks` duplicate this release fixes.
- User's explicit design direction: "LET US GET THE MAC EXPLORER DESIGN - WITH ICONS AND ABILITY
  TO HIDE DETAILS WITHIN CATEGORIES- WE WILL HAVE MANY DISTINCT CONCEPTS AS BEFORE" → "ALL 38"
  (full catalog, not a partial restore).

## Known Gaps

- Most of the 38 concepts have no generated content on the live V2 pipeline yet — they will show
  the existing honest fallback message, not real synthesis. That's expected and by design (no
  fabrication), not a defect of this release.
- Two concepts (`operating`, `coverage`) remain V2-only hand-built views outside the 38-key V4
  catalog — kept because they provide real, distinct value (interview-driven operating-model
  narrative; knowledge-confidence overview) with no equivalent in the 38-key catalog.
- Icon set is a first pass (8 group-level icons); no per-item icons. Could be extended later if
  useful, not required for this release's goal.
