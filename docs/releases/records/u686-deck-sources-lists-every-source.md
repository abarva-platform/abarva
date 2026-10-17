# u686 — The deck's Sources slide lists every source the deck rests on

## Release ID

`2026-10-17-moves-deck-sources-lists-every-source`

## Status

`candidate`

## Plain-English Summary

The last slide of a reference deck is Sources. It listed only approved published citations. A Move with no approved citation therefore ended on a gap panel, "Published evidence still needs to be confirmed", although the deck rests on three workshops, the working assumptions and, when there is one, the value model and the approved estimate. That is how the live validation deck ends today. With fewer than three citations, the judge also recorded a structure finding.

The synthetic golden decks end on a Sources page that names every input: evidence files, the estimate and the rate foundation. Ours now does the same, as a table of source, what it is, and what it is used for:

- **Published sources:** each approved citation, or one row "None approved yet" when there is none.
- **Workshop evidence:** the sponsor, discovery and design workshops, for each one actually recorded.
- **Working assumptions:** when the register holds any rows and this viewer may see them.
- **Value model:** only for an evaluated case with visible figures.
- **Delivery estimate:** investment edition only, when an estimate is approved.

The slide is still a gap panel when the deck rests on nothing at all.

## Layer Impact

Release lane: `global-control-lane`.

- **Layer 4, products (Moves reference decks):** one exhibit. No figure, source binding, route or flag change.

## Client Applicability

- **All clients:** wherever reference decks are generated (today the synthetic demo tenant, behind `moves_reference_deck_v1`).
- **Specific clients:** none.
- **Internal only:** no.
- **Public/demo only:** no.
- **Feature flag:** unchanged.

## Changes Included

- `src/lib/deliverables/orchestrator/reference-deck-edition.ts`: the Sources exhibit.
- `src/lib/deliverables/orchestrator/__tests__/reference-deck-edition.test.ts`: tests for:
  - the full investment list, with no judge finding on the rendered slide;
  - the validation edition naming no estimate and no investment term;
  - the "None approved yet" row;
  - the gap panel when nothing is recorded.

  Two existing tests now reflect that Sources is no longer a gap when workshops exist.

## QA / Validation

- Deck suites (orchestrator plus decks routes): pass, 78 suites, 1237 tests.
- Mutation testing: 6 / 6 killed:
  - "None approved yet" row dropped;
  - unrecorded workshops listed;
  - estimate shown in validation;
  - value model always listed;
  - gap never shown;
  - assumptions always listed.
- `npm run typecheck`: pass. ESLint: pass. `npm run release:check`: pass (exit 0).

## Rollout Plan

Ships in the next repo-owned ACA main deploy. The walk's last slide in each edition shows the source table.

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

- **The contents slide still describes section 05 as published evidence.** Its words come from the drafted contents row.

## Audit Evidence

- PR URL and CI run; the live walk's validation slide 11 before the change.
