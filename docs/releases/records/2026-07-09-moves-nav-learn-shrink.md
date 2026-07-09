# 2026-07-09-moves-nav-learn-shrink — Graceful degradation for the top-nav right rail

## Release ID

`2026-07-09-moves-nav-learn-shrink`

## Status

`candidate`

## Plain-English Summary

Fixing the top-nav overlap (two prior releases today) traded an illegible overlap bug for a lesser one: at narrow viewport widths, once the right rail's content (Learn, admin badge, avatar + name, sign-out) no longer all fit, the whole "Learn" link disappeared entirely rather than something truncating gracefully. Fixed by making the display-name text the one thing allowed to shrink (it already had `textOverflow: "ellipsis"`, it just needed its ancestor chain to have `minWidth: 0` so the browser would actually let it shrink below its content size) and pinning everything else — Learn, the admin badge, the avatar circle, and the sign-out button — to `flexShrink: 0` so none of them can ever disappear. Squeeze now always lands on the tenant/user name text, truncating with `...`, never on a nav control vanishing.

## Layer Impact

- `global-control-lane`: same shared `AppTopBar.tsx` component — applies to all five surfaces.

## Client Applicability

- All clients: yes.
- Feature flag: none.

## Changes Included

- `src/components/shell/AppTopBar.tsx`: `flexShrink: 0` added to the "Learn" link, the admin inbox badge (wrapped in a span since the badge itself is an external component), the avatar circle, and the sign-out button. `minWidth: 0` added to the avatar+name wrapper div so the display-name span's existing ellipsis can actually engage under squeeze.

## QA / Validation

- `npx eslint`: PASS — 0 errors.
- `NODE_OPTIONS="--max-old-space-size=8192" npx tsc --noEmit -p .`: PASS — 0 errors.
- Automated component test: NOT RUN — jsdom doesn't run a real layout engine, so a component test could only assert inline style properties, not that they actually produce graceful truncation. Same reasoning as the prior nav-overlap follow-up release.
- Live post-deploy verification: PENDING — see Rollout Plan; same standard used to catch that the first two nav fixes needed correction.

## Rollout Plan

Merge to `main` → `aca-main-deploy.yml` builds/deploys → verify ACA runtime invariant → live-check at the same narrow viewport width used throughout this thread and confirm: Learn, the admin badge, the avatar, and Sign out are all still visible, and only the tenant/user name text truncates with an ellipsis if space is tight.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: to be confirmed post-merge.
- ACA runtime invariant: to be verified via `scripts/deploy/check-aca-runtime-invariant.mjs`.
- Worker image invariant: unaffected.
- Feature/env flag update path: none.
- Live signed-in proof required: yes — see Rollout Plan.

## Rollback Plan

Revert the commit; pure CSS/layout change, no data/migration/flag impact.

## Audit Evidence

- PR: [#4651](https://github.com/abarva-platform/abarva/pull/4651), 21/21 CI checks passed on the first run (no runner-backlog reruns needed), squash-merged as `8090be6b`.
- Deploy: workflow run [29053882487](https://github.com/abarva-platform/abarva/actions/runs/29053882487), succeeded.
- ACA runtime invariant: passed — active revision `ca-abarva-web-lab-eastus--m8090be6b`, 100% traffic, healthy.
- Live verification via direct `getBoundingClientRect()` measurement (not just a visual glance, learning
  from the prior release's false alarm):
  - `Learn`: `left: 765.6, right: 825.5, width: 59.9, visible: true` — positioned entirely within the
    right-rail's track (previously measured at `left: 711.8`, outside the track and clipped from view).
  - `Sign out`: `left: 994.3, right: 1073, width: 78.7, visible: true`.
  - Zoomed screenshot of the full right-rail region confirms visually: `Source`, `Tower`, `Learn`, the
    avatar, a truncated display name (`Anand S...`), and `Sign out` all render cleanly with no overlap
    and nothing missing.

This closes out the three-part nav-overlap thread from today's Moves polish audit, all three now
confirmed live with direct measurement, not just deploy success:
1. `2026-07-09-moves-nav-overlap-and-locked-phase-redirect.md` — original `minmax(0, 1fr)` fix
   (necessary but incomplete) + the locked-phase redirect banner (worked on the first attempt).
2. `2026-07-09-moves-nav-overlap-followup.md` — the real remaining cause (`justifySelf: "end"`),
   which actually fixed the illegible overlap.
3. This record — the graceful-degradation follow-up so fixing the overlap didn't just trade it for
   nav items disappearing at narrow widths.

## Known Gaps

- None identified for this specific change. The broader look/feel audit that started this thread was
  still not exhaustive (see the first record's Known Gaps) — other phases, other surfaces, and other
  viewport widths were not swept.
