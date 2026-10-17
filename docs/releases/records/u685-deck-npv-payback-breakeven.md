# u685 — The investment deck states NPV, payback and breakeven realisation

## Release ID

`2026-10-17-moves-deck-npv-payback-breakeven`

## Status

`candidate`

## Plain-English Summary

An investment committee reads three figures first: what the case is worth after its cost (NPV), when the cash repays the cost (payback), and how much of the modelled value has to come true to break even. The synthetic golden P4 investment deck leads with them. Its summary title is "Fund a $0.55M build that pays back in month 13", and one slide is an NPV and payback table. Our investment deck stated none of the three, although the value engine computes all of them.

The investment deck now carries them:

- **Value-ledger slide:** a metrics row under the credited and program ledger:
  - Net present value (credited cash received);
  - Payback (the month cumulative cash covers the investment);
  - Breakeven realisation (the share of modelled value at which NPV is zero, from #9571).
- **Governed slots:** `value.npv.plan`, `value.payback.plan` and `value.breakeven.realisation`. Titles and answers can state these figures. Each slot is bound to the same source and display as the exhibit, so a title and the metrics read the same figure.

A payback that the engine says is never reached within the horizon reads "Not within horizon": a finding, not a gap. Payback reads in months, for example "13 months". These are the same words the AI-scenario comparison already uses for the same source, so the figure reads the same on both slides. The slot carries the matching phrase. A negative NPV reads in accounting form, for example `$(0.12)M`. The validation edition stays free of investment economics, by the edition rule. The three-year slide keeps its year-by-year chart, which the reference standard requires.

## Layer Impact

Release lane: `global-control-lane`.

- **Layer 4, products (Moves reference decks):** one exhibit row and three slots, all from existing engine outputs. No value, route or flag change. Tower is not touched.

## Client Applicability

- **All clients:** wherever investment decks are generated (today the synthetic demo tenant, behind `moves_reference_deck_v1`).
- **Specific clients:** none.
- **Internal only:** no.
- **Public/demo only:** no.
- **Feature flag:** unchanged.

## Changes Included

- `src/lib/deliverables/orchestrator/reference-deck-slots.ts`: three investment-edition slots.
- `src/lib/deliverables/orchestrator/reference-deck-edition.ts`: the bound economics figures and the value-ledger metrics row.
- `src/lib/deliverables/orchestrator/__tests__/reference-deck-edition.test.ts`:
  - figures, sources and one display per source;
  - render and judge with no finding on the slide;
  - a payback never reached and a negative NPV;
  - NPV and payback bound once for both the scenario comparison and the ledger;
  - the validation edition free of all three;
  - no row when the case carries none.

## QA / Validation

- Deck suites (orchestrator plus decks routes): pass, 78 suites, 1240 tests.
- Mutation testing: 8 / 8 killed, including payback words that differ from the comparison's:
  - row removed;
  - "not within the horizon" finding dropped;
  - NPV allowed into validation;
  - payback wording changed;
  - slot phrase dropped;
  - slot source ID changed;
  - slot edition widened.
- `npm run typecheck`: pass. ESLint: pass. `npm run release:check`: pass (exit 0).

## Rollout Plan

Ships in the next repo-owned ACA main deploy. Live proof needs a Move with an evaluated value case. The demo Move has none until its P4 value step.

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

- **No title is required to carry payback.** The summary and ledger titles keep their existing required figures. The new slots are offered to the writer but not required, so this change cannot add fallback slides.

## Audit Evidence

- PR URL and CI run.
