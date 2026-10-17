# u687 — Slide words know when a slide shows only a confirmation panel

## Release ID

`2026-10-17-moves-deck-words-know-gap-only-slides`

## Status

`candidate`

## Plain-English Summary

A reference deck's words (title, answer and notes) are drafted before the deck decides how each exhibit renders. When an exhibit has no confirmed input, the deck replaces it with a confirmation panel that names what is missing. The words never learned that. On the live validation deck, slide 6 showed such a panel, while its answer read "Each row below shows what is structurally expected" and its title counted "three capability areas". There were no rows.

The deck's exhibits depend only on its inputs, so the preview now builds the deck once with placeholder words to learn which slides will show only a panel. It marks those slides for the writer with the panel's own title. That title is a fixed sentence from the product's code, not case data. Words on those slides must speak to the missing input. A new rule refuses words on those slides that describe rows, a table, a chart, or items "listed below". The refusal goes through the existing repair rounds, with its own instruction. Slides whose exhibit renders are unaffected. If the placeholder build fails, drafting proceeds unmarked, as before.

## Layer Impact

Release lane: `global-control-lane`.

- **Layer 4, products (Moves reference-deck preview):** the words prompt, one validator rule and one extra in-memory build. No data, figure, route contract or flag change.

## Client Applicability

- **All clients:** the preview serves only the synthetic demo tenant today, behind `moves_reference_deck_v1`.
- **Specific clients:** none.
- **Internal only:** no.
- **Public/demo only:** no.
- **Feature flag:** unchanged.

## Changes Included

- `src/lib/deliverables/orchestrator/reference-deck-words.ts`:
  - `confirmationPanels` input;
  - prompt marking on the first draft and on repairs;
  - the `panel_only_exhibit_reference` rule and its repair instruction;
  - a system sentence.
- `src/app/api/v1/programs/[programId]/decks/[edition]/preview/route.ts`: the placeholder build that finds panel-only slides.
- Tests:
  - the rule refuses four exhibit phrasings on a panel slide and accepts them elsewhere;
  - an ordinary "below the threshold" passes;
  - prompt and repair marking;
  - a persistent refusal stays a fallback;
  - only panel-only slides are marked;
  - a failed probe drafts unmarked;
  - lineage-refusal tests now throw on every build.

## QA / Validation

- Words and preview-route suites: pass, 90 / 90.
- Mutation testing: 8 killed:
  - rule off;
  - rule everywhere;
  - prompt mark dropped;
  - repair mark dropped;
  - "listed below" phrasing dropped;
  - a compact panel counted as panel-only;
  - off-by-one slide numbering;
  - panels unwired.
- One behaviour-neutral survivor, reported: the repair candidate check without the panel flag. The final rule check still holds the slide's fallback.
- `npm run typecheck`: pass. ESLint: pass. Deck suites: 78 suites, 1246 tests, pass. `npm run release:check`: pass (exit 0).

## Rollout Plan

Ships in the next repo-owned ACA main deploy. The walk's `fallbackCauses` show whether the rule costs any slide. Its slides show whether panel slides speak to their panels.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: set by the main deploy.
- ACA runtime invariant: unchanged.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: the post-deploy walk's decks and `deck-fidelity.json`.

## Rollback Plan

Revert the squash commit and redeploy.

## Known Gaps

- **A count word such as "three" is not caught on a panel slide.** Spelled-out numbers are ordinary prose elsewhere. The prompt tells the writer not to describe the items of an exhibit there, and the walk will show whether that holds.

## Audit Evidence

- PR URL and CI run; the live walk's validation slide 6 before the change.
