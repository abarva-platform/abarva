# 2026-07-09-moves-nav-overlap-and-locked-phase-redirect — Fix top-nav overlap and silent locked-phase redirect

## Release ID

`2026-07-09-moves-nav-overlap-and-locked-phase-redirect`

## Status

`candidate`

## Plain-English Summary

A live end-to-end look/feel audit of Moves (P0-P5) surfaced two real, reproducible bugs:

1. **Top nav visual collision.** At narrower desktop widths, the top navigation bar's "Tower" and
   "Learn" links visually run together into unreadable overlapping text ("ToweLearn"). Root cause:
   the header's 3-column CSS grid used bare `1fr` side columns, whose implicit minimum width is their
   content's full (nowrap) size — so once total content exceeded the viewport, the grid overflowed
   instead of shrinking, and the last nav item collided with the first right-rail item. Fixed by
   making the side columns `minmax(0, 1fr)` so they can actually shrink and let their existing
   `overflow: hidden` do its job. This bar is shared by all five surfaces (Home, Intelligence, Moves,
   Source, Tower) via one component, so the fix benefits all of them, not just Moves.
2. **Silent redirect off a locked phase.** Navigating directly to a Move phase URL that hasn't been
   reached yet (e.g. `/phase/4` while the Move is still at P2) silently redirects to the current
   phase with zero explanation — reads as a broken or wrong link if bookmarked, shared, or hit via
   browser back/forward. Fixed by carrying the requested phase as a query param on the redirect and
   showing a one-time, dismissible banner explaining why the user landed where they did.

An earlier candidate finding from the same audit ("active nav tab renders invisible black-on-black")
was investigated and disproven on closer inspection — the active tab is a correctly-contrast white
pill with dark text; the "invisible" impression came from JPEG screenshot compression at small size,
not a real bug. Not included in this release; noted here so it isn't rediscovered as a false lead.

## Layer Impact

- `global-control-lane`: `AppTopBar.tsx` is shared chrome mounted by every surface via `AppShell` —
  the grid fix applies platform-wide. The phase-redirect fix is scoped to the Moves phase workspace
  route only.

## Client Applicability

- All clients: yes — both fixes are in shared code paths, no tenant-specific behavior.
- Feature flag: none.

## Changes Included

- `src/components/shell/AppTopBar.tsx`: `gridTemplateColumns` changed from `"1fr auto 1fr"` to
  `"minmax(0, 1fr) auto minmax(0, 1fr)"`.
- `src/app/(maestro)/strategic-moves/[moveId]/phase/[phaseNum]/page.tsx`: the locked-phase redirect
  now appends `?phaseLocked=<requestedPhase>`.
- `src/components/strategic-moves/StrategicMovePhaseClient.tsx`: reads `phaseLocked` via
  `useSearchParams`, renders a dismissible amber status banner (reusing the existing
  `statusBanner`/`statusBannerAmber` styles already used elsewhere in this file) explaining the
  redirect; state is in-memory only (not persisted), so it never nags on a normal visit.
- `src/components/strategic-moves/__tests__/StrategicMovePhaseClient.operating-layer.test.tsx`: made
  `useSearchParams` mockable per-test; added a regression test reproducing the exact live-observed
  redirect (phase 4 requested, Move at phase 2) and asserting the banner shows and dismisses, plus a
  test confirming no banner on a normal visit.

## QA / Validation

- `npx jest src/components/strategic-moves/__tests__/StrategicMovePhaseClient.operating-layer.test.tsx`
  — 7/7 passed (5 pre-existing + 2 new).
- `NODE_OPTIONS="--max-old-space-size=8192" npx tsc --noEmit -p .` — 0 errors.
- `npx eslint` on all changed files — 0 errors.
- Root cause for both bugs confirmed via live signed-in browser testing against
  `https://app.abarva.ai` (computed-style inspection, DOM inspection, zoomed screenshots) before
  writing either fix — not guessed.
- Local dev-server visual reproduction was attempted but blocked by a Clerk cross-origin redirect in
  the preview harness; the CSS grid fix (`minmax(0, 1fr)`) is a well-established, standard pattern for
  exactly this "1fr implicit min-width" overflow class of bug, applied with high confidence and
  verified live post-deploy instead (see Rollout Plan).

## Rollout Plan

Merge to `main` → `aca-main-deploy.yml` builds/deploys → verify ACA runtime invariant → resize the
live signed-in browser to the exact width the collision reproduced at (1105px) and confirm "Tower"
and "Learn" no longer overlap → navigate to a locked future phase and confirm the banner appears and
dismisses correctly.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: to be confirmed post-merge.
- ACA runtime invariant: to be verified via `scripts/deploy/check-aca-runtime-invariant.mjs`.
- Worker image invariant: unaffected (no worker-facing change).
- Feature/env flag update path: none.
- Live signed-in proof required: yes — see Rollout Plan.

## Rollback Plan

Revert the commit; both changes are pure frontend/CSS + a query-param-driven UI notice — no
migration, no data mutation, no flag.

## Audit Evidence

- PR: [#4643](https://github.com/abarva-platform/abarva/pull/4643), 21/21 CI checks passed, squash-merged as `7545dc8d`. Deployed and runtime-invariant verified.
- **Locked-phase redirect banner: confirmed live and working**, including Dismiss.
- **Nav overlap: this release's `minmax(0, 1fr)` fix was necessary but NOT sufficient.** Live
  re-check post-deploy showed "Tower"/"Learn" still overlapping at the same viewport width. Root
  cause of the remainder (the right-rail container's `justifySelf: "end"` sizing the item to its own
  content instead of its grid track) fixed in a same-day follow-up:
  `docs/releases/records/2026-07-09-moves-nav-overlap-followup.md` (PR #4645) — see that record for
  the full second-fix evidence, including how a `getBoundingClientRect()` check initially looked like
  a repeat failure and required direct pixel inspection to correctly interpret.

## Known Gaps

- The full look/feel audit was not exhaustive — it covered Move list, P0/P2/P4 phase pages, and the
  origination flow. It did not sweep every phase (P1, P3, P5), mobile/responsive breakpoints, or
  whether the same nav-overlap class of bug reproduces on Source/Tower/Intelligence at other content
  lengths (e.g. a longer tenant name or user display name than tested here).
- Clicking a locked phase-rail dot (as opposed to deep-linking via URL) still gives no feedback
  (no cursor change, no tooltip) — noted in the original audit as lower priority, not fixed in this
  release.
