# u683 — Decks claim a calculated case only when one exists

## Release ID

`2026-10-17-moves-deck-no-calculated-claim-without-case`

## Status

`candidate`

## Plain-English Summary

Several reference-deck exhibits carried fixed labels that name a calculated value case: "Calculated case", "Case model", "Calculated cost" and "Calculated base". They were written whether or not a case existed. On the live demo Move, which has no value case yet, the investment deck therefore showed:

- a value-ledger table whose figures read "To confirm" next to the claim "Calculated case · Case model";
- an architecture panel whose Measures box read "Calculated case".

Both state a fact the deck's own inputs contradict.

Each label is now written only when the value case is evaluated and its figures are visible to the viewer. Otherwise the cell is a gap: the reader sees "To confirm", or the exhibit collapses into its own gap panel, as the other value exhibits already do.

## Layer Impact

Release lane: `global-control-lane`.

- **Layer 4, products (Moves reference decks):** exhibit labels only. No figure, source, route or flag change.

## Client Applicability

- **All clients:** wherever reference decks are generated (today the synthetic demo tenant, behind `moves_reference_deck_v1`).
- **Specific clients:** none.
- **Internal only:** no.
- **Public/demo only:** no.
- **Feature flag:** unchanged.

## Changes Included

- `src/lib/deliverables/orchestrator/reference-deck-edition.ts`: the `calculated()` label gate is used by the one-page summary, one-step value, three-year value, value ledger and target-state exhibits.
- `src/lib/deliverables/orchestrator/__tests__/reference-deck-edition.test.ts`:
  - no calculated label in either edition when the value case is empty, failed, withheld, blocked, or evaluated without figures;
  - every label present when the case is evaluated.

## QA / Validation

- Deck suites (orchestrator plus decks routes): pass, 78 suites, 1218 tests.
- Mutation testing: 5 mutants killed:
  - the label always shown;
  - the figures check dropped;
  - the architecture label reverted;
  - the ledger labels reverted;
  - the one-step label reverted.
- 3 behaviour-neutral survivors, reported rather than claimed:
  - dropping the status check: the engine returns no economics for a blocked case;
  - reverting the cost label: its table always collapses to a gap panel without a case;
  - reverting the summary metric's meaning: its metrics block does the same.
- `npm run typecheck`: pass. ESLint: pass. `npm run release:check`: pass (exit 0).

## Rollout Plan

Ships in the next repo-owned ACA main deploy. The post-deploy walk's investment deck shows the ledger as a gap panel and the Measures box as "To confirm".

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: set by the main deploy.
- ACA runtime invariant: unchanged.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: the post-deploy walk's investment deck.

## Rollback Plan

Revert the squash commit and redeploy.

## Known Gaps

- **Other fixed labels were not audited one by one.** Examples are "Check timing", "Earned or paid is explicit" and "Shared records". They name review steps or structure, not facts about the case.

## Audit Evidence

- PR URL and CI run; the live walk's slides 11 and 13 before the change.
