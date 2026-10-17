# u684 — The deck summary shows a restated outcome once

## Release ID

`2026-10-17-moves-deck-outcome-not-a-restated-problem`

## Status

`candidate`

## Plain-English Summary

Slide 2 of the reference deck is the one-page summary, the slide a reader sees first. It prints the Move's problem and its outcome on separate lines. On the live demo Move the recorded outcome repeats the problem word for word under a label, so the slide read:

- "Problem: A governed semantic layer and data-quality controls so later AI use cases reuse the same trusted entities…"
- "Outcome: Working outcome hypothesis: A governed semantic layer and data-quality controls so later AI use cases reuse the same trusted entities…"

When the outcome restates the problem, the summary now says so instead of printing it twice: "Outcome: to confirm; the recorded outcome repeats the problem."

An outcome counts as a restatement when its words, ignoring case and punctuation, are the same as the problem's. It also counts when one of the two contains the other and the shorter is at least 20 characters. That way a short phrase that appears inside a longer problem is not mistaken for a restatement. The recorded text is not changed; only the summary line is.

## Layer Impact

Release lane: `global-control-lane`.

- **Layer 4, products (Moves reference decks):** one summary line. No data, route or flag change.

## Client Applicability

- **All clients:** wherever reference decks are generated (today the synthetic demo tenant, behind `moves_reference_deck_v1`).
- **Specific clients:** none.
- **Internal only:** no.
- **Public/demo only:** no.
- **Feature flag:** unchanged.

## Changes Included

- `src/lib/deliverables/orchestrator/reference-deck-edition.ts`: `restatesProblem`, used by the one-page summary's outcome line.
- `src/lib/deliverables/orchestrator/__tests__/reference-deck-edition.test.ts`: covers:
  - a labelled restatement;
  - a differently punctuated restatement;
  - an outcome that is part of the problem;
  - a distinct outcome;
  - identical short text;
  - a short phrase inside a long problem;
  - an empty outcome.

## QA / Validation

- Deck suites (orchestrator plus decks routes, plus route-export reachability): pass, 79 suites, 1237 tests.
- Mutation testing: 5 / 5 killed. The mutants dropped punctuation folding, dropped equality, dropped the length threshold, made containment one-way, and unwired the check. Two redundant guards found by mutation (a label strip and an empty check) were removed rather than kept.
- `npm run typecheck`: pass. ESLint: pass. `npm run release:check`: pass (exit 0).

## Rollout Plan

Ships in the next repo-owned ACA main deploy. The walk's investment and validation summaries show the outcome line.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: set by the main deploy.
- ACA runtime invariant: unchanged.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: the post-deploy walk's slide 2.

## Rollback Plan

Revert the squash commit and redeploy.

## Known Gaps

- **Other slides still quote the problem by design.** For example, "Need:" on the context slide restates the problem as that slide's subject.

## Audit Evidence

- PR URL and CI run; the live walk's slide 2 before the change.
