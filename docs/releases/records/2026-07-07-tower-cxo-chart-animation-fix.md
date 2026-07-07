# 2026-07-07-tower-cxo-chart-animation-fix — fix empty bar charts, shorten the masthead

## Release ID

`2026-07-07-tower-cxo-chart-animation-fix`

## Status

`candidate`

## Plain-English Summary

Live re-verification of #4542 (the grid-track fix) found a severe new
regression: **every bar chart on `/tower` rendered zero bar shapes** — not
tiny, not mislabeled, but structurally absent (`<g class="recharts-layer
recharts-inactive-bar"></g>` with zero children). This affected the Value
tab's flagship bridge chart, the Portfolio tab's value-proven chart, and the
Budget tab's run/change chart alike, confirmed via direct DOM inspection
(`.recharts-bar-rectangle` groups present with the correct count, but empty).

Root cause: Recharts' default grow-in-place animation for `<Bar>`/`<Radar>`
computes its target geometry from the container's measured width at mount.
#4542's fix corrected the _final_ container width but, by changing when that
width stabilizes, introduced a resize-during-mount-animation race that
Recharts does not recover from cleanly — the animation state gets abandoned
mid-flight and never paints a shape.

Fix: `isAnimationActive={false}` on every `<Bar>` and `<Radar>` in
`TowerCxoCharts.tsx` (11 `<Bar>` + 1 `<Radar>`). This removes the animation
entirely rather than trying to time it correctly, which is both the simplest
fix and arguably the right call for an executive dashboard that gets
reviewed repeatedly — instant, stable rendering over a grow-in animation.

Verified by reproducing the exact failure and the fix in a throwaway local
route (`/scratch-chart-debug`, added under a temporary public-route pattern,
both fully reverted before commit — not part of this diff) rendering the
real chart components with realistic mock data in a real browser, avoiding
another risky prod round-trip.

Also included: the outer masthead ("Tower" / "CIO portfolio command center"
/ a 17-word sentence) is replaced with the approved mockup's tighter mast
("Portfolio" eyebrow in teal / tenant name / "Every number citable."),
removing the duplicate header that stacked above the CXO command center's
own "Executive operating view" callout. Low-risk, self-contained JSX change.

## Layer Impact

Release lane: `global-control-lane` (same shared `/tower` route).

- **Component layer**: `TowerCxoCharts.tsx` — animation disabled on every
  animatable chart primitive. `TowerIndexPage.tsx` — outer masthead
  rewritten; `TEAL`/`TEAL_TINT` design tokens added.

## Client Applicability

- All clients: yes — animation and masthead are not tenant-specific.

## Changes Included

2 files. `src/components/tower/charts/TowerCxoCharts.tsx` (`isAnimationActive={false}`
on 11 `<Bar>` + 1 `<Radar>`). `src/components/tower/TowerIndexPage.tsx`
(masthead rewrite + 2 new design tokens).

## QA / Validation

- Regression found via live signed-in DOM inspection of
  `https://app.abarva.ai/tower` — `.recharts-bar-rectangle` groups present
  but structurally empty across all 3 chart-bearing tabs.
- Fix verified by reproducing both the failure and the fix in a local,
  throwaway, unauthenticated route rendering the real components with
  representative mock data in a real browser (not jsdom, which can't
  reproduce ResponsiveContainer's real-layout-dependent behavior) — confirmed
  real `<path>` shapes with correct fills/widths for every bar, and confirmed
  the Budget chart's per-segment labels are correct and distinct (run
  $22.6M / change $13.9M / total $36.5M — not the #4541 duplicate-value bug).
  The scratch route and its temporary public-route-pattern entry were fully
  reverted before this commit — `git diff` confirms zero trace in this PR.
- Real `npm run build` off latest `origin/main` — compiles clean.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit` (exact CI
  command) — pre-existing baseline errors only, zero in touched files.
- `npx eslint` — 0 errors.
- Chart smoke tests — 7/7 passing.

## Rollout Plan

Standard ACA rollout on merge. No migration, no flag.

**Required after deploy**: live re-verification — this is the fourth
iteration on this chart work in one session, so the bar is: confirm real
`<path>` shapes render (not just axis ticks/labels) on Value, Budget, and
Benchmark tabs, via DOM inspection, not a screenshot.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/*aca-main-deploy*`
- Shared runtime mutators: none added
- Approved image digest: assigned at deploy time via `az acr build` from
  merge SHA
- ACA runtime invariant: `ca-abarva-web-lab-eastus`, unchanged
- Live signed-in proof required: **yes**

## Rollback Plan

Revert the merge commit; redeploy the previous image via the ACA workflow.

## Audit Evidence

- PR URL: (to be filled in when opened)
- Regression + fix evidence: DOM/SVG inspection output (prod and local
  repro) captured in session transcript.

## Known Gaps

This is the fourth release in a single-session iteration on Tower's CXO
charts (#4538 design fidelity, #4541 label/overflow bugs, #4542 grid-track
fix, this release for the animation regression that fix introduced). A
broader Tower page redesign (persistent left-rail Ask aVa panel, Portfolio
tab entity-card view, full mockup fidelity per `Tower · Redesign v4 ·
standalone (2).html`) is in progress separately and not part of this
release.
