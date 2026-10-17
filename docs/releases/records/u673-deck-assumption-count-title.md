# u673 — The investment deck's assumptions title states the open-assumption count

## Release ID

`2026-10-17-moves-deck-assumption-count-title`

## Status

`candidate`

## Plain-English Summary

Consulting decks state numbers in their titles. The investment deck's figure-bearing titles depend on the value case and the approved estimate. A Move that has neither yet (the demo Move today) shows no sourced figure in any title, and the live walk fails it for exactly that.

The assumptions register is available earlier. When it has open assumptions, the investment assumptions slide's title must now carry the open count as a governed figure, for example "The {register.count.open} open assumptions decide what can be claimed". The count is bound to the register like every other deck figure. With no open assumptions, an unreadable register, or in the validation edition, nothing changes.

## Layer Impact

Release lane: `global-control-lane`, behind the existing `moves_reference_deck_v1` flag.

- **Layer 4, products (reference-deck words):** one required-slot rule. No schema, data or route change.

## Client Applicability

- **All clients:** yes, where the reference deck preview is enabled.
- **Specific clients:** none.
- **Internal only:** no.
- **Public/demo only:** no.
- **Feature flag:** `moves_reference_deck_v1` (existing).

## Changes Included

- `src/lib/deliverables/orchestrator/reference-deck-words.ts`: the required title slot comes from one rule (the slide's own figure, or the open count on the assumptions slide when non-zero). It is used by the word check, the prompt and the repair prompt.
- Tests in `reference-deck-words.test.ts`.

## QA / Validation

- Orchestrator suites: pass, 1,156 / 1,156. `npm run typecheck`: pass. ESLint: pass.
- Mutation check: 3 hand mutants, all killed (the assumptions rule removed; a zero count required; any edition).

## Rollout Plan

Ships in the next repo-owned ACA main deploy after u667 and u669.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: set by the main deploy.
- ACA runtime invariant: unchanged.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: the post-deploy walk's investment `titleFigureCount`.

## Rollback Plan

Revert the squash commit and redeploy.

## Known Gaps

- **The deterministic fallback title does not carry the count.** A slide whose drafted words fall back keeps the general sentence.

## Audit Evidence

- PR URL and CI run.
