# u667 — Don't fail a reference-deck slide on the form of a title that is never shown

## Release ID

`2026-10-17-moves-deck-withheld-title-form`

## Status

`candidate`

## Plain-English Summary

Across the last six live walks, the generated investment deck scored between 0 and 25, with 3 to 14 of its 22 slides falling back to placeholder words. The first failing slide was almost always slide 2 (the one-page summary) or slide 5, usually on `title_format`: the rule that a title has at least five words and is one sentence.

Those slides' titles must carry a figure (annual value, three-year value, the delivery estimate) that the demo Move does not have yet. When a title holds an unavailable figure, the deck never shows it. It shows its own sentence, such as "The value case still needs a confirmed basis", and keeps the draft in the speaker notes. Yet the form rule on that hidden title rejected the whole slide, throwing away a good answer and notes and replacing them with "Draft words unavailable."

The form rule now skips a title the deck will withhold. The test for "withheld" is the one the deck itself uses: any figure in the title is unavailable. Every content rule still applies to that title:
- no invented figure;
- no internal word;
- no claim that an unavailable figure exists;
- the required figure token must be present.

A title whose figures are available is held to the form rule exactly as before.

## Layer Impact

Release lane: `global-control-lane`, behind the existing `moves_reference_deck_v1` flag.

- **Layer 4, products (reference-deck words step):** one rule's scope. No schema, data or route change.

## Client Applicability

- **All clients:** yes, where the reference deck preview is enabled.
- **Specific clients:** none.
- **Internal only:** no.
- **Public/demo only:** no.
- **Feature flag:** `moves_reference_deck_v1` (existing).

## Changes Included

- `src/lib/deliverables/orchestrator/reference-deck-words.ts`: `title_format` is not applied to a title that holds an unavailable figure.
- Tests in `reference-deck-words.test.ts`:
  - a withheld title passes on form but still fails on an invented figure or an internal word;
  - one unavailable figure among several is enough to withhold the title;
  - the slide keeps its drafted answer and notes, with no repair call.
- Test in `reference-deck-edition.test.ts`: the withheld title is replaced by the deck's own sentence, the draft stays in the notes, and the deck validates and renders.

## QA / Validation

- Words and edition suites: 79 / 79 pass.
- Mutation check: 3 hand mutants, all killed (exemption removed; `every` in place of `some`; exemption applied always).
- `npm run typecheck` clean; ESLint clean.
- Evidence for the cause: the deck results from the six most recent live walks (runs 38807179912 through 38981883588), recorded on the PR. The next walk, with u665's cause header, shows the effect slide by slide.

## Rollout Plan

Ships in the next repo-owned ACA main deploy after u665.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: set by the main deploy.
- ACA runtime invariant: unchanged.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: the post-deploy walk's investment-deck fallback count and causes.

## Rollback Plan

Revert the squash commit and redeploy.

## Known Gaps

- **Other fallback causes may remain.** The u665 cause header will name them.

## Audit Evidence

- PR URL and CI run.
- The walk table in the PR description.
