# u678 — Deck claim rules accept a missing basis stated as a prerequisite

## Release ID

`2026-10-17-moves-deck-prerequisite-claims`

## Status

`candidate`

## Plain-English Summary

Two deck rules refuse slide language that claims a fact the evidence lacks. One covers a measured baseline. The other covers decision owners who are mapped, assigned or accepted. When either rule fires, the slide falls back to fixed wording. The repair instruction then asks the writer to "describe confirmation as a prerequisite".

Both rules matched the claim words wherever they appeared. They recognised only a short list of qualifiers ("missing", "not yet", "to confirm"). So they also refused the prerequisite wording the repair asked for: "until a measured baseline is agreed", "without a measured baseline", "a measured baseline is the first prerequisite". They even refused the plain statement "the measured baseline has not been confirmed". A probe of seven such baseline sentences was refused seven times. This matches the live walk: the baseline rule was the only cause of fallback on the validation deck, and it fired on two to three investment slides per run.

A claim is now refused only where it is asserted. The claim's own clause may state an absence ("has not been confirmed", "pending", "prerequisite"), or open with a condition before the claim ("until", "without", "only after", "needs", "once"). Either form passes. A frame in a different clause does not excuse the claim, and neither does a condition placed after it. "Finance raised no objection, and the measured baseline is confirmed" is still refused.

## Layer Impact

Release lane: `global-control-lane`.

- **Layer 4, products (Moves reference decks):** the deck-language validator only. No data, route, flag or rendering change.

## Client Applicability

- **All clients:** yes, wherever reference decks are generated.
- **Specific clients:** none.
- **Internal only:** no.
- **Public/demo only:** no.
- **Feature flag:** none (reference decks keep their own flag).

## Changes Included

- `src/lib/deliverables/orchestrator/reference-deck-model.ts`: `assertsClaim` adds two frames, `ABSENCE_FRAME` and `CONDITION_FRAME`, scoped to the claim's clause. The baseline and owner rules call it.
- `src/lib/deliverables/orchestrator/__tests__/reference-deck-narrative-claims.test.ts`: 13 prerequisite sentences pass. 12 assertions are still refused, including cross-clause and trailing-condition cases. With the basis present, nothing is refused.

## QA / Validation

- New suite: pass, 26 / 26.
- Mutation testing: 8 / 8 mutants killed. The mutants removed the absence frame, removed the condition frame, let a condition anywhere in the clause count, removed clause scoping, reverted either rule to a plain match, and dropped the negation verb list.
- Orchestrator and decks-route suites: pass, 79 suites, 1211 tests. Typecheck: pass. ESLint: pass. `npm run release:check`: pass (exit 0). `audit:lib-orphans`: no change.
- Live effect: not yet measured. Read `fallbackCauses` in the first post-deploy walk.

## Rollout Plan

Ships in the next repo-owned ACA main deploy. The post-deploy Moves walk records each deck's fallback causes.

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

- **A condition word that opens a clause excuses that clause.** For example, "we must note the measured baseline is confirmed" passes. The writer is instructed against such claims, and the evidence flags still drive the visible gap panels.
- **The value, estimate and public-source rules are unchanged.** None of them appears among the walk's fallback causes.

## Audit Evidence

- PR URL and CI run; the before/after probe table in the PR.
