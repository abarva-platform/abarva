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

- PR: [#4645](https://github.com/abarva-platform/abarva/pull/4645), 21/21 CI checks passed, squash-merged as `c3dfcb14`.
- Deploy: workflow run [29044013962](https://github.com/abarva-platform/abarva/actions/runs/29044013962), succeeded.
- ACA runtime invariant: passed — active revision `ca-abarva-web-lab-eastus--mc3dfcb14`, 100% traffic.
- Live verification, done carefully given this was the second attempt:
  1. First check was `getBoundingClientRect()` on the "Tower" and "Learn" `<a>` elements — this
     reported an apparent 29.8px overlap (`Tower.right = 741.6`, `Learn.left = 711.8`), which looked
     like the fix had failed again.
  2. Before reporting failure, cross-checked with a direct zoomed pixel screenshot of the same header
     region. Visually, "Tower" is fully legible and **"Learn" is not rendered at all** — no overlap,
     no illegible text, nothing painted there.
  3. Reconciled the two: `getBoundingClientRect()` returns an element's *geometric layout position*,
     which is independent of whether an ancestor's `overflow: hidden` actually paints it.
     `railRect` (the right-rail container) measured exactly `width: 307.39px` — matching its
     `minmax(0, 1fr)` track exactly, confirming the container-sizing part of this fix worked. Because
     total right-rail content (Learn + admin badge + avatar + name) still exceeds 307px and none of it
     has `flex-shrink: 0` overridden, "Learn" is laid out past the container's left edge, then clipped
     from paint by the container's `overflow: hidden` — the geometric rect was real, but nothing at
     that rect is actually visible.
  4. **Conclusion: the original bug (illegible overlapping nav text) is fixed**, confirmed by direct
     pixel inspection, not just computed layout math. The trade-off is that "Learn" disappears
     entirely (not truncated, not ellipsized) at this exact narrow width — a real but much less severe
     issue than the original illegible overlap, tracked below rather than silently accepted.
  - Verified on a second, different Move (`25bdec8b-3be0-4221-abb4-8686d8d38da3`, a Meridian-tenant
    demo Move) after the original Lakeshore Move became inaccessible mid-verification because the
    browser session's server-resolved active-client context had switched tenants (unrelated to this
    fix — likely a side effect of concurrent Meridian V6/V7 work landing in the same window). The
    phase-lock banner from the earlier release also re-confirmed working on this Move: requesting
    `/phase/4` at P0 landed on `/phase/0?phaseLocked=4` with the banner visible, and Dismiss removed it.

## Known Gaps

- **"Learn" disappears entirely (not gracefully truncated) at narrow viewport widths** once the
  right-rail's content no longer fits — a real, lower-severity follow-up. The fix should give `flex-
  shrink: 0` to the avatar+name group and let the tenant-name/user-name spans (which already have
  `textOverflow: "ellipsis"`) absorb the squeeze first, keeping "Learn" reliably visible instead of an
  all-or-nothing disappearance.
- Minor cosmetic: the locked-phase banner's headline renders as "P4ISN'T open yet" with no space
  between the phase number and "isn't" (a JSX text-node adjacency artifact — same class of thing as
  the "Tower"/"Learn" split investigated here). The full explanatory sentence below it is unaffected
  and reads correctly; low priority, noted for a follow-up pass rather than a third same-day fix.
