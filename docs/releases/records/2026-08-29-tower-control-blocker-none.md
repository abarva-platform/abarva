# Tower — a rollout with no blocker is not a blocked rollout

## Release ID

`2026-08-29-tower-control-blocker-none`

## Status

`candidate`

## Plain-English Summary

`control_blocker` carries `none` as a real value: the rollout was reviewed and nothing was found.
Every consumer tested it for truthiness, and the non-empty string `none` passes that test. So a
rollout that had been checked and cleared was displayed as blocked.

Three surfaces said so:

- the Tools table printed `none` in alarm red, in the column headed "control blocker";
- the vendor panel counted those rollouts as blocked, and its footer read **"13 of 13 rollouts
  carry a named control blocker"** when two of the thirteen assert the opposite;
- Foundations rendered the same red `none`.

The name now drops to null when nothing is named, which makes the ordinary
`blocker ? red : grey` check correct by default, and a separate `controlBlockerReviewed` carries
whether the source said anything at all. That keeps three states apart that were previously two:
**named blocker** (red) · **reviewed, none found** (teal) · **never recorded** (grey). A cleared
rollout must not read as unknown, and an unknown one must not read as cleared.

Two further fixes on the same screen:

- **Half the vendor chart had no labels.** Recharts drops colliding category ticks by default, so
  ten bars rendered with five labels — and the dropped ones included the largest bar. The vendor
  with the most active users, and the most control blockers, was the one you could not identify.
  Every tick now renders and the frame grows with the row count.
- **An internal type name was on a client surface.** The footer read "Licensed-user counts are not
  loaded in `TowerAiView`". It now says what it means in the reader's own words.

## Layer Impact

Lane: `global-control-lane`. Layer 3 (serving reader) and the Tower product surface.

The `none` normalization happens once, in `readTowerCommandCenter`, so no consumer has to know the
sentinel exists. `controlBlockerReviewed` is new on `TowerMartAiPortfolioItem` and `TowerAiView`.
`controlBlockerCell` and `BLOCKER_TONE` move to `command-center/format.ts` so the three panels
render the three states identically. No loader, migration, or data change.

## Client Applicability

**All clients.** Every tenant whose Tower projection carries tool rollouts. Not flagged, not
tenant-scoped. Tenants whose rows never assert `none` see only the chart-label and wording fixes.

## Changes Included

- `src/lib/tower/readTowerCommandCenter.ts` — `controlBlockerFields` normalizes the sentinel.
- `src/lib/tower/current-layer-view-model.ts`, `command-center/types.ts`, `command-center/view-model.ts` — carry `controlBlockerReviewed`.
- `src/lib/tower/command-center/format.ts` — `controlBlockerCell` + `BLOCKER_TONE`.
- `views/ToolsTablePanel.tsx`, `views/FoundationsPanel.tsx` — render three states.
- `views/ToolsVendorPanel.tsx` — count named blockers only; `interval={0}` and a height that scales with rows; footer rewritten.
- `__fixtures__/design-fixture.ts` — rollouts now cover all three states.
- `__tests__/case-attribute-widening.test.ts` — six guards.

## QA / Validation

**Status: PASS.**

| Check | Result |
| --- | --- |
| `case-attribute-widening` | PASS — 23/23, six new or updated guards |
| Tower suites | PASS against baseline — 511 pass / 21 fail across 6 suites; failing set diffed against `origin/main` and **identical** |
| `tsc --noEmit` | PASS — clean |
| `eslint` | PASS — clean |
| Live signed-in proof | NOT RUN — pending deploy. See Known Gaps. |

One pre-existing guard pinned the reader's exact expression rather than its behavior, and failed
when the read moved into a helper. It was rewritten to assert that `control_blocker` reaches the
view, which is what it was there to protect.

## Rollout Plan

Ships with the next `main` deploy through the repo-owned ACA main deploy workflow. No flag, no env
change, no data build.

## Deployment Authority

`.github/workflows/aca-main-deploy.yml` on merge to `main`, digest-pinned. No ad-hoc `az` command
and no shared-traffic mutation from this branch.

## Rollback Plan

Revert the commit. Additive fields and a render change only; the revert restores the prior render
exactly.

## Known Gaps

- **Not yet live-proven.** The vendor footer will drop from 13 of 13 to the real named-blocker
  count once deployed.
- Seats purchased still are not surfaced; the vendor chart measures active users only, and now
  says so plainly.
- The sweep found `none` to be the only sentinel of its kind in the generator's value lists. Other
  sources may carry `n/a`, `tbd`, or similar, and nothing yet prevents one being added.

## Audit Evidence

Found by reading the deployed page at revision `ca-abarva-web-lab-eastus--m4a97e6af`: two rollouts
rendering `none` in red under "control blocker", a footer claiming 13 of 13 were blocked, and a bar
chart whose largest bar carried no label. The sentinel is a literal in
`scripts/tower/generate-meridian-layer1-source.mjs` line 1175.
