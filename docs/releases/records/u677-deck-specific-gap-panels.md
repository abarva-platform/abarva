# u677 — Each reference-deck gap panel names its own missing input and next action

## Release ID

`2026-10-17-moves-deck-specific-gap-panels`

## Status

`candidate`

## Plain-English Summary

A Move without confirmed inputs (the demo Move today) gets an investment deck with about ten gap panels: full-width boxes saying an exhibit's input is not confirmed. Every panel carried the same two sentences: "The evidence for this exhibit is still being confirmed with your team." and "Confirm the source and owner before relying on this exhibit." The live walk's deck repeated them ten times.

Each panel now says what is missing and the one action that closes it. Examples:
- **Handoffs:** "The steps between owners have not been recorded as a usable sequence." Next: "Map each handoff, with its owner, in a working session."
- **Delivery sequence:** "The order of releases comes from the approved delivery estimate." Next: "Approve the delivery estimate, then sequence the releases."
- **Published evidence:** "No published source has been approved for this case." Next: "Review and approve the public sources that support the case."

The validation edition's panels avoid its excluded words.

The headline slide's third metric showed an assumption's ID ("[A:A1]") as its big number. It now shows the open-assumption count, bound to the assumptions register like every other deck figure.

## Layer Impact

Release lane: `global-control-lane`, behind the existing `moves_reference_deck_v1` flag.

- **Layer 4, products (reference-deck edition):** fixed panel sentences and one metric's source. No schema, data or route change.

## Client Applicability

- **All clients:** yes, where the reference deck preview is enabled.
- **Specific clients:** none.
- **Internal only:** no.
- **Public/demo only:** no.
- **Feature flag:** `moves_reference_deck_v1` (existing).

## Changes Included

- `src/lib/deliverables/orchestrator/reference-deck-edition.ts`: `gapPanel(title, detail, nextAction)` at each of its call sites, slide-specific all-metrics panels, and the bound open-assumption metric.
- `src/lib/deliverables/orchestrator/__tests__/reference-deck-edition.test.ts`:
  - in both editions, with inputs missing, no two panels share a detail or a next action;
  - the validation panels avoid excluded words;
  - the deck validates;
  - the headline metric is the bound open count.

## QA / Validation

- Orchestrator suites: pass, 1,164 / 1,164. `npm run typecheck`: pass. ESLint: pass.

## Rollout Plan

Ships in the next repo-owned ACA main deploy after the deck chain.

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

- **A gap panel is still a gap.** It costs fidelity points until the input is confirmed.

## Audit Evidence

- PR URL and CI run.
