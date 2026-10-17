# u680 — The deck preview names the findings behind its fidelity score

## Release ID

`2026-10-17-moves-deck-fidelity-findings-header`

## Status

`candidate`

## Plain-English Summary

The reference-deck preview gives every deck a fidelity score: 100, less 5 for each finding of the rendered-deck judge. The post-deploy walk recorded the score but not the findings. On the latest walk, for example, the validation deck had no fallback slides and still scored 75, and nothing said why.

The preview now sends a findings header next to the score. It lists each finding as `slide:kind/detailCode`, for example `4:reference_gap,9:reference_count_dump/count_dump_answer`. A deck-wide finding has no slide and shows `-`. A deck with no findings reads `none`. The header carries codes only, never the finding's message or any slide wording. Above 40 entries the list is capped, and the remainder is shown as `+N`.

The walk records the header in `deck-fidelity.json` and adds it to the "below 90" failure line. It also checks that the score equals 100 less 5 per finding.

## Layer Impact

Release lane: `global-control-lane`.

- **Layer 4, products (Moves reference-deck preview):** one response header and one walk field. No data, flag or rendering change.

## Client Applicability

- **All clients:** the preview route serves only the synthetic demo tenant today, behind its flag.
- **Specific clients:** none.
- **Internal only:** no.
- **Public/demo only:** no.
- **Feature flag:** `moves_reference_deck_v1`, unchanged.

## Changes Included

- `src/app/api/v1/programs/[programId]/decks/[edition]/preview/route.ts`: `X-AbarVa-Deck-Fidelity-Findings` on the PPTX, PDF and render-refusal responses, wherever the deck was judged.
- `src/app/api/v1/programs/[programId]/decks/[edition]/preview/__tests__/route.test.ts`: tests that:
  - the header names every finding, for both formats;
  - no message text leaks;
  - a deck-wide finding reads `-`;
  - the cap holds at 40 and at 41;
  - a refusal carries the header;
  - an unjudged deck has no header.
- `tests/e2e/moves-step-pages-live-walk.spec.ts`: records `fidelityFindings` and checks the count against the score.

## QA / Validation

- Deck route suites: pass, 25 / 25 for the preview.
- Mutation testing: 8 / 8 mutants killed. They dropped the header from each of the three responses, moved the cap boundary both ways, dropped the deck-wide marker, dropped the detail code, and blanked the no-findings value.
- `npm run typecheck` (which includes the walk spec): pass. The walk spec still lists all 6 tests.
- ESLint: pass. `npm run release:check`: pass (exit 0). Route-export reachability: pass.

## Rollout Plan

Ships in the next repo-owned ACA main deploy. The first walk after it records the findings for both editions.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: set by the main deploy.
- ACA runtime invariant: unchanged.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: `deck-fidelity.json` from the post-deploy walk.

## Rollback Plan

Revert the squash commit and redeploy.

## Known Gaps

- **The PDF's own page findings stay in its refusal body.** The header carries the rendered-PPTX judge's findings, which are what the score counts.

## Audit Evidence

- PR URL and CI run; the first post-deploy `deck-fidelity.json`.
