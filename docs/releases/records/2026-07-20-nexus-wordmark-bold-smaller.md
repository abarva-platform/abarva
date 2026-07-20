# 2026-07-20-nexus-wordmark-bold-smaller — NEXUS wordmark: bolder letterforms, smaller footprint

## Release ID

`2026-07-20-nexus-wordmark-bold-smaller`

## Status

`released`

## Plain-English Summary

The user asked for the global nav's "NEXUS" wordmark to read as higher
quality: smaller but bolder. The existing wordmark's letterforms (real vector
outlines, not text) were a light/thin weight that read as insubstantial next
to the AbarVa mark. This release adds a faux-bold stroke overlay to each
letter's existing vector outline (thickening the strokes without altering
letter proportions or introducing a new typeface), thickens the X's two
diagonal accent strokes to match, and shrinks the wordmark's rendered box by
about 30% within the same overall lockup canvas. The AbarVa mark, the outer
combined-lockup dimensions consumed by `NexusTopNav.tsx` (`width={240}
height={37}`), and the wordmark's real vector-artwork status are all
unchanged — this is a weight/size adjustment to the same asset, not a
rebuild.

## Layer Impact

- **global-control-lane**: two static SVG assets consumed by every
  authenticated page through the shared `NexusTopNav` component. No code
  change — `NexusTopNav.tsx` already references these exact file paths; only
  the SVG content changes.

## Client Applicability

- All clients: yes — every authenticated user sees the updated nav wordmark.
- Specific clients: n/a
- Internal only: no
- Public/demo only: no
- Feature flag: none — static asset swap, takes effect on next deploy.

## Changes Included

- `public/brand/nexus/abarva-nexus-navbar-dark-clearance.svg` and
  `-light-clearance.svg` — regenerated:
  - Each of the 4 outline-based letters (N, E, U, S) gets a matching-color
    `stroke` (`stroke-width="110"` in the glyph's pre-scale coordinate space,
    `stroke-linejoin="round"`, `stroke-miterlimit="1"`) added to its existing
    `fill`-only `<path>`, faux-bolding the vector letterforms without
    altering their outline geometry. Chosen after testing a heavier pass
    (`stroke-width="230"`) that closed up the N/E/S letter counters —
    rejected as illegible before settling on 110.
  - The X's two diagonal gradient strokes thickened from `stroke-width="8"`
    to `"12"` to stay proportionally matched to the bolder letters.
  - The wordmark's `<image>` box inside the combined lockup shrunk from
    `x="181" y="3" width="201" height="54"` to `x="181" y="11" width="141"
    height="38"` — same left edge, vertically re-centered in the unchanged
    60-unit-tall outer canvas, ~30% smaller footprint. The inner wordmark SVG
    keeps its own `viewBox="0 0 323.0 86"` with
    `preserveAspectRatio="xMinYMid meet"`, which by construction cannot
    overflow a smaller container box — it letterboxes/shrinks to fit, so this
    resize cannot reintroduce the clipping bug fixed on 2026-07-14.
  - The unused legacy `-32h` variant files (confirmed via repo-wide grep to
    have zero references) were left untouched — out of scope.

## QA / Validation

- Iterative visual proof via `@resvg/resvg-js` (same rasteriser already used
  elsewhere in this codebase for PPTX/DOCX exhibit export — no new
  dependency): rendered the exact final SVG file at the real production
  pixel dimensions (240×37, matching `NexusTopNav.tsx`'s `<Image
  width={240} height={37}>`) for both dark and light variants, inspected
  visually before and after each iteration (three weight passes, two size
  passes) to confirm no clipping, open letter counters, and correct color/
  gradient on both backgrounds.
- User reviewed three renders in sequence (15%-smaller/bold, 30%-smaller/
  same bold) and explicitly approved the final 30%-smaller version shown
  above before this change was written to the real asset files.
- Because the inner wordmark SVG's own `viewBox`/`preserveAspectRatio`
  contract makes overflow impossible for any container box equal to or
  larger than needed, no headless-browser `getBBox()` re-verification (the
  method used for the original clipping bug fix) was required — the
  rasteriser proof at the exact real dimensions serves the same purpose for
  a pure resize.
- `npm run audit:nexus-navigation` — fails, but confirmed via `git stash`
  that the exact same 2 failures ("AppShell must import the canonical
  NexusTopNav directly", "/home/learn layout must import the canonical
  NexusTopNav directly") are present on a clean `origin/main` checkout with
  none of this change's edits applied. Pre-existing, unrelated to this
  SVG-only change, not introduced or worsened by it.
- `git diff --check` — clean.
- No `.ts`/`.tsx` files changed — ESLint/typecheck/jest are not exercised by
  this diff; CI's asset-relevant checks (image/route/hygiene gates) are
  authoritative.

## Rollout Plan

Merge to `main` via the protected PR lane (squash merge). Pure static-asset
change — no code, no migration, no flag. Deploy proceeds through the
repo-owned `aca-main-deploy` workflow; takes effect immediately for every
authenticated page once the new revision receives traffic.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, run
  [29743856162](https://github.com/abarva-platform/abarva/actions/runs/29743856162)
  (headSha `95a4c84f52a4bb02c82b82ec2aba3e8ff5d47ff3`, the #5134 merge
  commit), conclusion `success`.
- Shared runtime mutators: none used directly; deploy proceeded entirely
  through the standard workflow.
- Approved image digest:
  `acrabarvalab001.azurecr.io/abarva/web@sha256:ecd93ec74bb81034246fad3f00b99052b0ad8821e08b288a5e37b1553a09bdbb`.
- ACA runtime invariant: **proven.** `az containerapp show` and `az
  containerapp revision list` confirm the template image and the
  100%-traffic revision (`ca-abarva-web-lab-eastus--m95a4c84f`) both resolve
  to the digest above.
- Worker image invariant: N/A — no worker job serves this static asset path.
- Feature/env flag update path: N/A — no flag.
- Live signed-in proof: **performed.** Navigated to `app.abarva.ai` post-
  deploy (already signed in) and visually confirmed the nav wordmark renders
  bolder and ~30% smaller with no clipping, on the actual production
  Container App — matching the rasteriser proof exactly.

## Rollback Plan

Revert the merge commit — restores the exact prior SVG bytes. No schema or
data touched; a rollback is a pure asset swap back, with no other
dependency.

## Audit Evidence

- PR: [abarva-platform/abarva#5134](https://github.com/abarva-platform/abarva/pull/5134),
  all required checks passed, squash-merged as
  `95a4c84f52a4bb02c82b82ec2aba3e8ff5d47ff3`.
- CI/deploy run: [aca-main-deploy #29743856162](https://github.com/abarva-platform/abarva/actions/runs/29743856162),
  conclusion `success`.
- Deployment: ACA revision `ca-abarva-web-lab-eastus--m95a4c84f` in
  `rg-abarva-controlplane-lab-eastus`, 100% ingress traffic, image digest
  `sha256:ecd93ec74bb81034246fad3f00b99052b0ad8821e08b288a5e37b1553a09bdbb`.
- Live proof: signed-in navigation to `app.abarva.ai` post-deploy, visually
  confirmed the bolder/smaller wordmark renders correctly with no clipping
  on `/strategic-moves` (full-strength nav render, matching every other page
  behind Clerk auth).

## Known Gaps

- **`npm run audit:nexus-navigation` is already red on `main`**, for reasons
  unrelated to this change (see QA section). Not fixed here — fixing the
  `AppShell`/`home/learn` canonical-import contract is a separate, pre-
  existing issue this release does not touch or claim to resolve.
- **No dedicated Playwright/e2e test asserts the wordmark's visual weight or
  size** — this is a purely visual, subjective design change with no
  objective pass/fail contract to encode as an automated test; validation
  rests on the rasteriser proof plus explicit user sign-off on the exact
  rendered output, not an automated assertion.
