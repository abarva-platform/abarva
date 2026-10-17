# u693 — Deck estimate and value rules accept a missing basis stated as a prerequisite

## Release ID

`2026-10-17-moves-deck-estimate-value-prerequisites`

## Status

`candidate`

## Plain-English Summary

u678 (#9568) fixed two deck claim rules, the baseline rule and the owner rule. Both had been refusing honest prerequisite wording such as "until a measured baseline is agreed". The estimate and value rules had the same defect, but the walk showed no fallbacks from them at the time, so they were left alone.

That changed with u687 (#9577). Slides that show only a confirmation panel now pass that panel's title to the writer, for example "The shared delivery basis still needs an approved estimate". The writer echoes it, and the estimate rule refused "needs an approved estimate". On the first walk after #9577 deployed, two investment slides (15 and 16) fell back to fixed wording for this reason, after the deck had reached zero fallbacks.

The estimate and value rules now use the same clause-scoped framing as the baseline and owner rules. A claim is refused only where its own clause asserts it. An absence in that clause, or a condition before the claim, passes: "needs an approved estimate", "without an approved estimate", "depends on an approved estimate", "until the annual value is confirmed", "has not been confirmed". "The approved estimate is the funding basis" is still refused. So is "…, and the credited value is counted", where the frame sits in another clause.

## Layer Impact

Release lane: `global-control-lane`.

- **Layer 4, products (Moves reference decks):** the deck-language validator only. No data, route, flag or rendering change.

## Client Applicability

- **All clients:** wherever reference decks are generated (today the synthetic demo tenant, behind `moves_reference_deck_v1`).
- **Specific clients:** none.
- **Internal only:** no.
- **Public/demo only:** no.
- **Feature flag:** unchanged.

## Changes Included

- `src/lib/deliverables/orchestrator/reference-deck-model.ts`: the value and estimate rules call `assertsClaim`.
- `src/lib/deliverables/orchestrator/__tests__/reference-deck-narrative-claims.test.ts`: six prerequisite sentences pass, and four assertions are still refused, including one cross-clause case.

## QA / Validation

- Narrative-claims suite: pass, 36 / 36. Deck suites: pass, 78 suites, 1278 tests.
- Mutation testing: 2 / 2 killed (value rule reverted; estimate rule reverted).
- A probe on main refused all four prerequisite phrasings before the change.
- `npm run typecheck`: pass. ESLint: pass. `npm run release:check`: pass (exit 0).

## Rollout Plan

Ships in the next repo-owned ACA main deploy. The walk's `fallbackCauses` should no longer show `unavailable_estimate_claim` on panel slides.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: set by the main deploy.
- ACA runtime invariant: unchanged.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: the post-deploy walk's `deck-fidelity.json`.

## Rollback Plan

Revert the squash commit and redeploy.

## Known Gaps

- **The AI-scenario and public-source rules keep their own wording checks.** Neither appears among the walk's fallback causes.

## Audit Evidence

- PR URL and CI run; walk 39022998412 showing `15:unavailable_estimate_claim,16:unavailable_estimate_claim`.
