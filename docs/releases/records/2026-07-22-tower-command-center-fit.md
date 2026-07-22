# 2026-07-22-tower-command-center-fit — Command Center step nav reads as navigation, and the first screen fits

## Release ID

`2026-07-22-tower-command-center-fit`

## Status

`candidate`

## Plain-English Summary

Two problems observed on the live Command Center, both raised from direct review of the running product.

1. **The step nav did not look clickable.** Posture / Signals / Decide were card-shaped buttons — white cards with a hairline border and a soft shadow, sitting on a near-white page. They read as three static summary tiles, so nothing invited a click and the second and third steps went unvisited. They are now one connected **segmented control**, the same visual language already used by the analysis sub-tabs on AI Portfolio, Decision Lanes, and Evidence:
   - the active segment is filled with the ink color and its number badge goes teal;
   - inactive segments show a `→` and lift on hover/focus with a background and shadow change;
   - the control carries `role="tablist"` / `role="tab"` / `aria-selected`, so it announces itself as navigation to assistive technology instead of as three unrelated buttons.

2. **The first screen required scrolling.** The three metric cards beside the verdict card were being stretched to the verdict card's height by the default grid `align-items: stretch`, leaving roughly 90px of empty space in each. Combined with generous page padding and a 62px-tall step nav, the posture content was pushed below the fold. Fixed by letting each hero card size to its own content (`align-items: start`), trimming the verdict card's padding and floor, and reclaiming vertical space from the page padding and the now-shorter step nav — roughly 130px recovered in total, with no content removed and no font or color change to the design system.

No data, query, or mart logic changed.

## Layer Impact

- `global-control-lane`: `src/components/tower/TowerIndexPage.tsx` — presentation only within the Tower Command Center. No data path, query, or schema change.

## Client Applicability

- All clients: yes (Tower surface presentation).
- Feature flag: none.

## Changes Included

- `src/components/tower/TowerIndexPage.tsx` — step nav rebuilt as a segmented control with hover/focus state and tab semantics; hero grid switched to `align-items: start`; verdict card padding/min-height, page padding, and step section margin tightened.
- `src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx` — the stepper assertion now checks tab semantics and single-selection rather than the old grid template.

## QA / Validation

- Pass: `tsc --noEmit` — zero errors.
- Pass: `jest src/components/tower/__tests__/` — 19/19.
- **Not yet measured:** whether the Command Center fully clears the fold. Local verification was not possible in this session because another process held the Next dev-server lock on the working directory. The fold must be measured on the live signed-in page after deploy (compare `document.documentElement.scrollHeight` against `window.innerHeight`) before this is called done.

## Rollout Plan

Squash-merge to `main`; `aca-main-deploy` builds the digest-pinned image and deploys. Presentation-only; no migration, no job, no data change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (existing, unmodified).
- Shared runtime mutators: none.
- ACA runtime invariant: unaffected; still verified before claiming live-proven.
- Live signed-in proof required: yes — confirm the segmented control renders with a filled active segment and working hover, that clicking Signals and Decide switches the step, and measure the fold.

## Rollback Plan

Revert the PR. Presentation-only.

## Audit Evidence

- Before: live signed-in captures of the Command Center showing the three card-shaped step tiles and the stretched hero cards with large empty areas; provided in-session.
- PR URL: pending.

## Known Gaps

- The fit is an informed reduction (~130px recovered), not a measured one. If the live measurement still shows overflow, the next candidates are the right-hand metric column and the budget narrative block — both carry content, so any further reduction is a density decision rather than a spacing cleanup, and should be made against a measurement rather than by eye.
