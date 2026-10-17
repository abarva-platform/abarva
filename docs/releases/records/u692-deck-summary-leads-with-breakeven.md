# u692 — The investment summary leads with breakeven, not a return on build cost

## Release ID

`2026-10-17-moves-deck-summary-leads-with-breakeven`

## Status

`candidate`

## Plain-English Summary

The investment deck's one-page summary showed four figures: annual value, credited value, the delivery estimate, and a three-year return on investment. That return divides value by the build cost alone. The approved estimate prices the delivery effort only, not run cost, internal time or licences, so the return is an upper bound that reads as a firm figure on the deck's most-read slide. The synthetic golden P4 investment deck makes the same point on its economics slide ("quote breakeven, not ROI") and puts a breakeven figure on its summary.

The summary's fourth figure is now **breakeven realisation**: the share of the modelled value that must come true for NPV to reach zero (from #9571 and #9575). It is bound to the same source as the value-ledger row, so the two read as one figure. The three-year return stays on the three-year value slide, beside the bases it is computed from. The validation edition's summary is unchanged.

## Layer Impact

Release lane: `global-control-lane`.

- **Layer 4, products (Moves investment reference deck):** one summary tile. No figure, source, route or flag change.

## Client Applicability

- **All clients:** wherever investment decks are generated (today the synthetic demo tenant, behind `moves_reference_deck_v1`).
- **Specific clients:** none.
- **Internal only:** no.
- **Public/demo only:** no.
- **Feature flag:** unchanged.

## Changes Included

- `src/lib/deliverables/orchestrator/reference-deck-edition.ts`: the investment summary's fourth tile.
- `src/lib/deliverables/orchestrator/__tests__/reference-deck-edition.test.ts`:
  - the summary tiles and their values;
  - one display for the shared source;
  - ROI kept on the three-year slide;
  - the validation summary unchanged;
  - the rendered summary slide judged with no finding;
  - the calculated-label test no longer lists the retired ROI caption.

## QA / Validation

- Edition suite: pass, 81 / 81. Deck suites: pass, 78 suites, 1268 tests, before the two added tests.
- Mutation testing: 1 / 1 killed (ROI tile restored).
- `npm run typecheck`: pass. ESLint: pass. `npm run release:check`: pass (exit 0).

## Rollout Plan

Ships in the next repo-owned ACA main deploy. On the demo Move the tile reads "To confirm" until a value case exists.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: set by the main deploy.
- ACA runtime invariant: unchanged.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: an investment deck from a Move with an evaluated value case.

## Rollback Plan

Revert the squash commit and redeploy.

## Known Gaps

- **The summary title still carries the annual value.** The golden summary title states payback. Changing which figure a title must carry changes the writer's required slot, and is left for a separate, measured change.

## Audit Evidence

- PR URL and CI run.
