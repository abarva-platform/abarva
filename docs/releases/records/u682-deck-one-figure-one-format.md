# u682 — A deck figure reads the same in its title and in its exhibit

## Release ID

`2026-10-17-moves-deck-one-figure-one-format`

## Status

`candidate`

## Plain-English Summary

Reference decks bind every figure to a source in a figure ledger. One source reached the ledger through two formatters:

- the slot that titles and answer bars use wrote full dollars and one-decimal percentages (`$3,600,000`, `1100.0%`);
- the exhibit built from the same engine value wrote the consultant form (`$3.60M`, `1100%`).

So one figure could read "$3,600,000" in a slide's title and "$3.60M" in the table beneath it, and the companion workbook listed both. A reviewer reads that as two numbers, or as sloppiness. Annual value, three-year credited value, return on investment and the approved estimate total were all affected. The live demo Move has no value figures yet, so the defect had not shown up in a walk.

Slots now use the same formatters as the exhibits. Each ledger source has exactly one display, and a test fails if any source gains a second.

The same test also caught a split in the AI-assisted scenario added by #9560. The comparison exhibit shows a signed difference, for example `−3 weeks` and `−$80.0K`. The slot that the slide's words use shows the saving, for example `3` and `$80.0K`. Both were bound to one source ID. They are different figures, so the saving slots now carry their own IDs: `weeks_saved`, `hours_saved` and `cost_saved`.

## Layer Impact

Release lane: `global-control-lane`.

- **Layer 4, products (Moves reference decks):** the display format of governed slot figures. No value, source, route or flag change.

## Client Applicability

- **All clients:** wherever reference decks are generated (today the synthetic demo tenant, behind `moves_reference_deck_v1`).
- **Specific clients:** none.
- **Internal only:** no.
- **Public/demo only:** no.
- **Feature flag:** unchanged.

## Changes Included

- `src/lib/deliverables/orchestrator/reference-deck-slots.ts`: the slot money and ratio formats use `formatConsultantCents` and `formatConsultantPercent`. The AI-scenario saving slots have their own source IDs.
- `src/lib/deliverables/orchestrator/__tests__/reference-deck-edition.test.ts`:
  - new: every ledger source has one display, in both editions, including the approved estimate and the AI scenario;
  - existing tests now expect the compact form and the saving IDs.

## QA / Validation

- Deck suites (orchestrator plus decks routes), after merging #9560: pass, 78 suites, 1239 tests.
- Mutation testing: 3 / 3 killed:
  - restoring the old money format splits annual value and three-year credited value;
  - restoring the old ratio format splits ROI;
  - restoring a shared scenario ID splits the scenario cost.
- `npm run typecheck`: pass. ESLint: pass. `npm run release:check`: pass (exit 0).

## Rollout Plan

Ships in the next repo-owned ACA main deploy.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: set by the main deploy.
- ACA runtime invariant: unchanged.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: a deck from a Move with value figures.

## Rollback Plan

Revert the squash commit and redeploy.

## Known Gaps

- **Compact money rounds to the formatter's digits:** $1.20M, $550K becomes $0.55M. Exact values stay in the companion workbook's engine sources.

## Audit Evidence

- PR URL and CI run.
