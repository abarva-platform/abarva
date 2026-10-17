# u675 — An investment title must carry its figure only when the figure exists

## Release ID

`2026-10-17-moves-deck-required-figure-when-available`

## Status

`candidate`

## Plain-English Summary

The first live walk with fallback causes (u665) named every investment-deck fallback slide:

`2:title_format, 3:internal_client_word, 5:title_format, 8:title_format, 9:missing_title_slot, 11:missing_title_slot`

u667 handles the `title_format` slides. This release handles `missing_title_slot`.

The investment deck required each figure slide's title to contain its figure token, such as the three-year value, even when that figure does not exist yet. The model rightly declined to cite a figure it was told is unavailable. The slide was rejected, and the deck replaced its whole drafted text with fallback words.

The figure token is now required only when the figure exists. Without it, the model writes an honest title in its own words ("The annual case needs a reviewed basis"), still checked by every narrative rule that stops a claim about an unavailable figure. A title that does include the token is withheld and replaced, as before.

## Layer Impact

Release lane: `global-control-lane`, behind the existing `moves_reference_deck_v1` flag.

- **Layer 4, products (reference-deck words):** one required-slot condition and its retry sentence. No schema, data or route change.

## Client Applicability

- **All clients:** yes, where the reference deck preview is enabled.
- **Specific clients:** none.
- **Internal only:** no.
- **Public/demo only:** no.
- **Feature flag:** `moves_reference_deck_v1` (existing).

## Changes Included

- `src/lib/deliverables/orchestrator/reference-deck-words.ts`: the slide's own figure token is required only when its display exists. The `missing_title_slot` retry sentence no longer asks for a token for unavailable evidence.
- `src/lib/deliverables/orchestrator/__tests__/reference-deck-words.test.ts`: with the figure missing, the honest title stands with no repair call and the prompt asks for no token. With it present, the existing retry contract is unchanged.

## QA / Validation

- Orchestrator suites: pass, 1,159 / 1,159. `npm run typecheck`: pass.
- Mutation check: requiring the token always fails the new test.
- Evidence: the cause header from live walk 39009314263 on deploy 76760bf458, quoted above.

## Rollout Plan

Ships in the next repo-owned ACA main deploy after the deck chain (u667, u669, u673, u674).

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: set by the main deploy.
- ACA runtime invariant: unchanged.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: the post-deploy walk's investment fallback causes.

## Rollback Plan

Revert the squash commit and redeploy.

## Known Gaps

- **`internal_client_word` on the contents slide remains a genuine wording failure that repair sometimes misses.**

## Audit Evidence

- PR URL and CI run.
