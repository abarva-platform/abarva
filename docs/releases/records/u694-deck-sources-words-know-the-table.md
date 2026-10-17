# u694 — The Sources slide's words know what its table holds

## Release ID

`2026-10-17-moves-deck-sources-words-know-the-table`

## Status

`candidate`

## Plain-English Summary

Since u686, a reference deck's last slide lists every source the deck rests on:
- approved public citations, or a row saying none is approved yet;
- the workshops recorded;
- the working assumptions;
- the value model and the approved estimate, where they exist.

The slide's words are drafted without seeing that table, and the writer still treated it as a citations slide. On the live validation deck it was titled "Approved citations are the only permitted evidence sources here", above a table whose rows were mostly workshops.

The writer now receives a fixed description of the Sources exhibit, and the instruction to write about what an exhibit shows. The description is product text, not case data. If the Sources slide renders only a confirmation panel (nothing recorded at all), the panel's title takes precedence, as u687 set up for panel slides. No other slide changes.

## Layer Impact

Release lane: `global-control-lane`.

- **Layer 4, products (Moves reference-deck preview):** the words prompt for one slide. No validator, data, route or flag change.

## Client Applicability

- **All clients:** the preview serves only the synthetic demo tenant today, behind `moves_reference_deck_v1`.
- **Specific clients:** none.
- **Internal only:** no.
- **Public/demo only:** no.
- **Feature flag:** unchanged.

## Changes Included

- `src/lib/deliverables/orchestrator/reference-deck-words.ts`:
  - `EXHIBIT_DESCRIPTIONS` for `sources`;
  - the description on the draft and on repairs;
  - one system sentence.
- `src/lib/deliverables/orchestrator/__tests__/reference-deck-words.test.ts`:
  - the description reaches the Sources slide only;
  - a panel title wins;
  - repairs carry the description.

## QA / Validation

- Words suite: pass, 65 / 65. Deck suites: pass, 78 suites, 1280 tests, before the two added tests.
- Mutation testing: 4 / 4 killed:
  - description dropped from the draft;
  - description dropped from the repair;
  - system sentence dropped;
  - description sent beside a panel title.
- `npm run typecheck`: pass. ESLint: pass. `npm run release:check`: pass (exit 0).

## Rollout Plan

Ships in the next repo-owned ACA main deploy. The next walk's validation slide 11 and investment slide 22 show the drafted titles.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: set by the main deploy.
- ACA runtime invariant: unchanged.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: the post-deploy walk's Sources slides.

## Rollback Plan

Revert the squash commit and redeploy.

## Known Gaps

- **This is a prompt change, so no rule enforces the title's subject.** The walk shows whether the writer follows the description. A rule would have to read meaning, which the deck rules avoid.

## Audit Evidence

- PR URL and CI run; walk 39025496004's validation slide 11 title before the change.
