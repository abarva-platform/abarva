# 2026-07-14-nexus-nav-wordmark-clearance-fix — Fix NEXUS wordmark top-clipping in global nav

## Release ID

`2026-07-14-nexus-nav-wordmark-clearance-fix`

## Status

`candidate`

## Plain-English Summary

The "NEXUS" wordmark in the global top navigation (next to the AbarVa logo) was visibly
cropped at the top of the letters. Three prior merged PRs had tried to fix this by nudging
CSS (padding, `min-height`, `transform: translateY(...)`) around the logo image, but the
crop persisted because the problem was never in the CSS — it was inside the SVG artwork
file itself. The embedded NEXUS wordmark's internal coordinate box (`viewBox`) was too
short for the actual letterforms, so the browser silently clipped roughly the top 15
units of every tall glyph (the "N", "E", "U", "S") before any CSS was even applied. This
release replaces the wordmark asset with a corrected version that has proper internal
padding, so the full wordmark now renders every time, and removes the two compensating
CSS nudges that were only masking the old bug.

## Layer Impact

- **global-control-lane**: `NexusTopNav.tsx`/`NexusTopNav.module.css` render the shared
  authenticated top navigation for every client. This is the only surface touched.
- **Static brand assets**: two new SVG files added under `public/brand/nexus/`; existing
  asset filenames are untouched (kept for the nav-contract audit's existence check and any
  other historical reference), so this is additive, not a breaking rename.

## Client Applicability

- All clients: yes — every authenticated route rendering the global top nav.
- Specific clients: n/a
- Internal only: no
- Public/demo only: no
- Feature flag: none; this is a visual asset/CSS correctness fix, not a new capability.

## Changes Included

- `public/brand/nexus/abarva-nexus-navbar-dark-clearance.svg` (new) — corrected dark-theme
  AbarVa + NEXUS lockup; NEXUS wordmark's inner `viewBox` grown from `0 0 323 68` to
  `0 0 323 86` with content shifted down (`translate(0 20.672)`) so the full glyph set
  (previously spanning y=-14.67..59.15, i.e. 14.67 units above the old viewBox's top edge)
  now sits fully inside the box with ~6-unit top/bottom margins. Outer lockup viewBox grown
  from `0 0 390 52` to `0 0 390 60` and the NEXUS `<image>` box resized from
  `201x48` to `201x54` (height-only change) so the glyph renders at the same visual scale
  as before (`min(containerWidth/vbWidth, containerHeight/vbHeight)` stays width-constrained
  at the original 0.622 factor), just without the top slice missing.
- `public/brand/nexus/abarva-nexus-navbar-light-clearance.svg` (new) — identical fix applied
  to the light-theme variant, which shares the exact same glyph path data/transform bug
  (confirmed via diff before fixing), differing only in fill color (`#07111F` vs `#FFFFFF`).
  Not currently referenced by any component (only the dark lockup is used in
  `NexusTopNav.tsx` today), added for parity so the light variant isn't left broken if/when
  a light-theme nav is wired up.
- `src/components/navigation/NexusTopNav.tsx` — `NEXUS_NAV_LOCKUP` now points at the new
  `-clearance.svg` asset; the `<Image>` component's `height` prop updated from `32` to `37`
  to match the corrected asset's new intrinsic aspect ratio (390:60 vs the old 390:52),
  preventing `next/image`'s `height:auto` sizing from computing a slightly wrong height off
  the old aspect ratio.
- `src/components/navigation/NexusTopNav.module.css` — removed `transform: translateY(5px)`
  from both `.brandSlot` and `.actions`. These were CSS-only compensating nudges from
  earlier fix attempts that pushed the (still-clipped) logo and the sign-out/user cluster
  down to visually mask the crop. With the asset itself fixed, real-DOM measurement
  (`getBoundingClientRect()`) confirms the wordmark and the sign-out button now sit
  perfectly centered in the 72px nav bar without any transform — the nudges are no longer
  needed and were removed rather than left as dead compensation.

## QA / Validation

- Root-cause verified mathematically and then empirically: a headless-Chromium
  `getBBox()` check against the original embedded wordmark SVG confirmed real rendered
  content spans y=-14.672 to y=59.152 (height 73.824) inside a declared `viewBox` of only
  `0 0 323 68` — i.e., genuinely clipped above the top edge, not a CSS/layout illusion.
  The same check against the new corrected asset confirms content now spans y=6.0 to
  y=79.824, fully inside the new `0 0 323 86` viewBox with even top/bottom margins.
- `npm run audit:nexus-navigation` — passed.
- `npx jest src/components/navigation/__tests__/NexusTopNav.test.tsx` — 10/10 passed.
- `npx eslint src/components/navigation/NexusTopNav.tsx` — 0 errors.
- `git diff --check` — clean, no whitespace errors.
- Playwright screenshot proof (real, unmodified `NexusTopNav.module.css` applied verbatim
  against the real corrected SVG asset, in a static fixture mirroring the component's DOM
  structure, since full Clerk-authenticated rendering isn't available in this sandbox):
  desktop (1280px), tablet (820px), and mobile (400px) captures saved under
  `proof/nexus-nav-wordmark-final-preview-20260714/`. Real-DOM measurements confirm: full
  wordmark visible with no clipping; brand image vertically centered in the 72px nav bar
  (0.5px delta from true center); nav link vertically centered to the same tolerance;
  "Sign out" renders as a single line (`getClientRects().length === 1`) at all three
  widths; username (`displayName`) truthfully overflows and ellipsizes
  (`scrollWidth > clientWidth`) rather than wrapping/pushing the button.

## Rollout Plan

Merge to `main` via the protected PR lane (squash merge). No feature flag, no migration,
no worker job. Once merged, the shared web image rebuild happens through the repo-owned
`aca-main-deploy` workflow per the standard Azure Container Apps release lane — this
record does not itself perform or request that deploy; a separate deploy step (with its
own runtime-invariant proof) is required before this is "live" on `app.abarva.ai`.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (not yet run for
  this change as of this record).
- Shared runtime mutators: none used directly by this change; deploy proceeds through the
  standard workflow only.
- Approved image digest: N/A until the deploy workflow runs and produces one.
- ACA runtime invariant: to be proven after deploy (template image, 100%-traffic revision
  image, and worker job images must match the approved digest).
- Worker image invariant: N/A — no worker involved in this change.
- Feature/env flag update path: N/A — no flag.
- Live signed-in proof required: yes, on `app.abarva.ai` after deploy, before calling this
  "live-proven" (not yet performed as of this record).

## Rollback Plan

Revert the merge commit (single self-contained PR, no migration, no data change). The old
`abarva-nexus-navbar-dark-32h.svg`/`-light-32h.svg` assets are left in place untouched, so a
revert restores the exact prior behavior with no asset cleanup required.

## Audit Evidence

- Screenshots: `proof/nexus-nav-wordmark-final-preview-20260714/desktop-1280.png`,
  `tablet-820.png`, `mobile-400.png`.
- PR URL: to be added when opened.
- CI run: to be added when the PR's checks complete.
- Deployment URL / ACA revision: to be added after deploy (not yet performed).

## Known Gaps

- Light-theme nav variant asset (`abarva-nexus-navbar-light-clearance.svg`) is fixed and
  shipped for parity but has no live call site yet — nothing currently renders it.
- Deploy to `app.abarva.ai` and the required live signed-in browser proof have not been
  performed as part of this record; both are explicitly deferred pending approval per the
  task's own stated gate ("do not deploy until the screenshot is visually acceptable" /
  deploy only after explicit approval).
