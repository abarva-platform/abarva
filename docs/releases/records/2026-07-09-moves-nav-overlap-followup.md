# 2026-07-09-moves-nav-overlap-followup — Complete the top-nav overlap fix

## Release ID

`2026-07-09-moves-nav-overlap-followup`

## Status

`candidate`

## Plain-English Summary

The `minmax(0, 1fr)` grid fix shipped earlier today (`docs/releases/records/2026-07-09-moves-nav-overlap-and-locked-phase-redirect.md`) was necessary but not sufficient — live re-verification post-deploy showed "Tower" and "Learn" still visually overlapping at the same viewport width. Root cause of the remainder: the right-rail container used `justifySelf: "end"`, which sizes a grid item to its own content (not its track) and right-aligns it — so the item's border box could still be wider than its `minmax(0, 1fr)` track, and its own `overflow: hidden` had nothing to clip against (there was nothing outside the item's own, self-sized box). Fixed by using the grid default (`justifySelf: "stretch"`, i.e. removing the override) so the item's box actually equals the track width, with `justifyContent: "flex-end"` added to keep the content visually right-aligned within that now-correctly-sized, clippable box.

## Layer Impact

- `global-control-lane`: same shared `AppTopBar.tsx` component as the earlier fix — applies platform-wide.

## Client Applicability

- All clients: yes.
- Feature flag: none.

## Changes Included

- `src/components/shell/AppTopBar.tsx`: right-rail container changed from `justifySelf: "end"` to the grid default (removed), with `justifyContent: "flex-end"` added to the existing flex row to preserve right-alignment of its content.

## QA / Validation

- `npx eslint` — 0 errors.
- `NODE_OPTIONS="--max-old-space-size=8192" npx tsc --noEmit -p .` — 0 errors.
- No new automated test added for this specific CSS layout interaction — jsdom (this repo's test environment) does not run a real layout/overflow engine, so a component-render test could only assert the inline style properties themselves, not that they actually prevent the visual overlap. The real verification is the live, signed-in browser re-check at the exact reproducing viewport width (see Rollout Plan) — same standard already used to catch that the first fix was incomplete.

## Rollout Plan

Merge to `main` → `aca-main-deploy.yml` builds/deploys → verify ACA runtime invariant → resize/inspect the live signed-in browser at the exact width (1105px) where the overlap reproduced twice already, and confirm "Tower" and "Learn" render with clean separation this time.

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

- To be added once merged/deployed and the live re-check confirms the overlap is actually gone this time.

## Known Gaps

- This is the second attempt at the same bug. If the live re-check after this deploy still shows any
  collision, the next step should be measuring actual rendered content width of the right-rail's
  children against the track width directly (rather than reasoning about grid/flex box-sizing rules
  in the abstract) before attempting a third fix.
