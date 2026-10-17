# u695 — A deck title states a finding, never a description of its slide

## Release ID

`2026-10-17-moves-deck-title-not-a-slide-description`

## Status

`candidate`

## Plain-English Summary

u694 (#9584) gave the writer a fixed description of the Sources slide's table, so its words would stop treating the slide as citations only. On the next live walk, the validation deck's Sources title became that description: "A table of every source this deck rests on". The writing instructions already say a title is a finding (what the evidence shows or what remains unconfirmed), never a description of the slide. The model copied the description anyway, because it read like a title.

There are three changes:
- **The description no longer reads like a title.** It now lists the rows the table holds ("Rows for: approved public citations…").
- **The instruction is explicit.** The writer is told to "title it with a finding about what it shows, never with a description of the exhibit or the slide".
- **A rule now enforces it.** A non-cover title that opens by naming the slide's furniture ("A table…", "This slide…", "The chart…", "These tables…") is refused and sent through the repair rounds with its own instruction. Titles that mention a table further into the sentence, or open with "This deck" or "The case", are unaffected.

## Layer Impact

Release lane: `global-control-lane`.

- **Layer 4, products (Moves reference-deck preview):** the words prompt and one validator rule. No data, route or flag change.

## Client Applicability

- **All clients:** the preview serves only the synthetic demo tenant today, behind `moves_reference_deck_v1`.
- **Specific clients:** none.
- **Internal only:** no.
- **Public/demo only:** no.
- **Feature flag:** unchanged.

## Changes Included

- `src/lib/deliverables/orchestrator/reference-deck-words.ts`:
  - the reworded Sources description;
  - the system sentence;
  - the `title_describes_slide` rule and its repair instruction.
- `src/lib/deliverables/orchestrator/__tests__/reference-deck-words.test.ts`:
  - four slide-describing titles are refused;
  - four findings pass, including one that mentions the table mid-sentence;
  - a repair replaces the refused title;
  - the description and system pins are updated.

## QA / Validation

- Words suite: pass, 74 / 74. Deck suites: pass, 78 suites, 1290 tests.
- Mutation testing: 2 / 2 killed (rule removed; start anchor dropped).
- `npm run typecheck`: pass. ESLint: pass. `npm run release:check`: pass (exit 0).

## Rollout Plan

Ships in the next repo-owned ACA main deploy. The walk's Sources titles and `fallbackCauses` show the effect. A refused title that two repair rounds cannot fix would appear as `title_describes_slide`.

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

- **An idiom that opens with one of those nouns is refused too.** "The table stakes…" is an example. The repair rounds rewrite it.

## Audit Evidence

- PR URL and CI run; walk 39028712779's validation slide 11 title.
