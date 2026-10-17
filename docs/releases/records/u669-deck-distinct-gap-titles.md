# u669 — Each reference-deck gap slide names its own missing input

## Release ID

`2026-10-17-moves-deck-distinct-gap-titles`

## Status

`candidate`

## Plain-English Summary

When a Move has no value case or approved estimate yet (the demo Move today), the deck shows a fixed sentence on each slide whose figure is missing. Every value slide shared one title, "The value case still needs a confirmed basis": up to five slides in the investment deck. The three estimate slides shared another. A reader saw the same sentence again and again.

Each gap slide now names its own missing input. Examples:
- "The headline value still needs a confirmed basis";
- "The three-year value still needs a confirmed basis";
- "Credited and program value still need a confirmed basis";
- "The release sequence still needs an approved estimate";
- "The delivery hours still need an approved estimate".

The delivery team slide also gets its own sentence, separate from the decision owners slide.

Every sentence still states what is missing and claims no figure. Nothing changes when the figure is available.

## Layer Impact

Release lane: `global-control-lane`, behind the existing `moves_reference_deck_v1` flag.

- **Layer 4, products (reference-deck edition):** fixed sentences only. No schema, data or route change.

## Client Applicability

- **All clients:** yes, where the reference deck preview is enabled.
- **Specific clients:** none.
- **Internal only:** no.
- **Public/demo only:** no.
- **Feature flag:** `moves_reference_deck_v1` (existing).

## Changes Included

- `src/lib/deliverables/orchestrator/reference-deck-edition.ts`: one missing-input title and answer per slide type.
- `src/lib/deliverables/orchestrator/__tests__/reference-deck-edition.test.ts`: for both editions, with no value case and the deterministic words, no two slides share a title. The deck validates, and renders without client-copy or edition findings. The existing assertions are updated to the new sentences.

## QA / Validation

- Orchestrator suites: 1,153 / 1,153 pass. `npm run typecheck` clean; ESLint clean.
- Mutation check: restoring the shared value title fails the new test in both editions.

## Rollout Plan

Ships in the next repo-owned ACA main deploy after u667.

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

- **A gap slide is still a gap.** It costs fidelity points until the Move has the figure.

## Audit Evidence

- PR URL and CI run.
