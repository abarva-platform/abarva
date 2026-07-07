# 2026-06-19-decision-storytelling-live-wiring — Transformation PR6: wire the deck into the live generate path (flag-gated)

## Release ID

`2026-06-19-decision-storytelling-live-wiring`

## Status

`candidate`

## Plain-English Summary

Wires the decision-storytelling pipeline (`MoveDecisionModel → Story Director → Visual Director →
deck`) into the **live** deliverable generate path, behind a **default-off tenant flag**
(`moves_decision_storytelling`). When a tenant is enrolled, its Move deliverables persist as the
**exhibit-led executive deck (HTML)** built from the SAME governed generation — not the prose HTML.
When the flag is off (every tenant by default), behavior is **completely unchanged**.

How it works: the orchestrator already produces a governed, cited `RenderableDeliverable`. A new
bridge (`deck-from-result.ts`) maps that into a `MoveDecisionModel` (recommendation → answer-first,
sections → claims with their citations, source register → evidence), runs it through the Story +
Visual Directors, and renders the deck. `persistDeliverable` swaps the prose HTML for the deck only
when the caller (the worker via `runDeliverableForTenant`) evaluates the flag as on; **any deck
error falls back to the prose render — a generation that passed the gates never fails on a deck
error.**

Honest scope today: the rich structured exhibits (architecture diagrams, the estimate-twice
economics) need the architecture adapters and the Workforce Economics engine (not yet wired), so the
live deck is **answer-first** (recommendation cover, conclusion headlines, evidence footers, a
decision scorecard, claim/issue trees) with honest gap-cards where a rich exhibit isn't available
yet. It is a structural live proof; richness arrives as those land.

## Layer Impact

- **`global-control-lane`** — shared deliverable generate/persist path + the feature-flag registry.
  Behavior change is gated by the default-off `moves_decision_storytelling` flag; no schema change.

## Client Applicability

- **Feature flag**: `moves_decision_storytelling` (tenant policy, default OFF). Enroll a tenant via
  `includeTenants` or the env allowlist `ABARVA_FEATURE_MOVES_DECISION_STORYTELLING_TENANTS`
  (canonical keys, e.g. `arcturus` for First Capital). All clients otherwise unaffected.

## Changes Included

- `src/lib/deliverables/deck-from-result.ts` — `decisionModelFromRenderable` + `buildDeckHtmlFromDocument`.
- `src/lib/deliverables/story/archetype-blueprints.ts` — `archetypeForOrchestratorType`.
- `src/lib/features/registry.ts` — the `moves_decision_storytelling` flag (default off).
- `src/lib/deliverables/orchestrator/persistence.ts` — `renderAsDeck`/`tenantKey` options; deck
  swap with prose fallback.
- `src/lib/deliverables/orchestrator/generate-service.ts` — evaluates the flag (Moves only, not when
  an explicit pptx/pdf is requested) and passes `renderAsDeck`.
- Tests: `deck-from-result.test.ts` (5), `persistence-deck.test.ts` (2).

## QA / Validation

- **PASS** — `jest`: deck-from-result + persistence-deck (7), and the full features + orchestrator
  suites (119) still green — flag off ⇒ prose docx unchanged; flag on ⇒ deck HTML.
- **PASS** — `tsc --noEmit` + `eslint` clean.
- **NOT-RUN (pending deploy)** — live ACA proof: deploy web + worker on the new image, set
  `ABARVA_FEATURE_MOVES_DECISION_STORYTELLING_TENANTS=arcturus` on the worker, generate a First
  Capital Move deliverable, and confirm the persisted artifact's HTML is the exhibit-led deck.

## Rollout Plan

Merge → `aca-main-deploy` (web) + update the deliverable worker job image to the new main image
(the flag is evaluated in the worker's `runDeliverableForTenant`). Then set the env allowlist on the
worker for one tenant and verify. Default-off means the merge itself is a no-op for behavior.

## Rollback Plan

Unset the env allowlist (instant, no deploy) to disable for all tenants; or revert the PR. No data
change. The prose-fallback path means even an enrolled tenant degrades safely on any deck error.

## Audit Evidence

- PR URL (added on open); CI run; the 7-test suite + the 119 unbroken existing tests.
- Live proof (added after deploy): worker env value, the generated Move run id, and the artifact id
  whose HTML is the deck.

## Known Gaps

- The live deck is answer-first + decision-scorecard + trees + honest gap-cards; the rich
  architecture/economics exhibits need the architecture adapters + the Workforce Economics engine
  (WE-1/WE-2), which are the next builds.
- Output is the HTML deck; native PPTX (reuse `pptx-renderer`/`svg-raster`) + the DOCX technical
  appendix are follow-ups.
