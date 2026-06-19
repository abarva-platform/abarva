# 2026-06-19-story-director — Transformation PR2: Story Director + the 8 archetype page-sequences

## Release ID

`2026-06-19-story-director`

## Status

`candidate`

## Plain-English Summary

Transformation PR2 (depends on PR1 `MoveDecisionModel`). Adds the **Story Director** and the **8
founder-confirmed archetype blueprints** (spec §9). This replaces "section/topic → content" with
"decision → story → pages → exhibits": each archetype is an ordered sequence of executive pages,
every page carries a narrative role, a hero exhibit type, and a binding to the `MoveDecisionModel`.

The Story Director is deterministic in this PR: given a decision model + an archetype it produces a
realized `Story` (answer-first where the model supplies the conclusion; evidence bound from the
model; an exhibit plan), and `validateStory` enforces the hard rules (every mandatory exhibit
present, a decision page exists) and surfaces warnings (answer-first within 2 pages — flagging the
§9 Charter's problem-first sequence without overriding it; pages still needing the conclusion
authoring pass; content gaps).

This PR is **additive and inert** — nothing wires it into the live path yet (the Visual Director and
the renderer come in PR3–PR5). The Workforce Economics convergence is visible here: the Value Model
archetype routes the estimate-twice to a `ValueWaterfall` page.

## Layer Impact

- **`global-control-lane`** — new shared library `src/lib/deliverables/story/**`. No schema, route,
  or runtime behavior change.

## Client Applicability

- All clients: **Yes** (shared engine foundation), inert until wired. No feature flag, no
  client-specific behavior. Specific clients: No. Internal only: No. Public/demo only: No.

## Changes Included

- `src/lib/deliverables/story/types.ts` — `ExhibitType`, `RoleInStory`, `ModelSource`,
  `StoryPageBlueprint`, `ArchetypeBlueprint`, `StoryPage`, `Story`, validation-issue codes.
- `src/lib/deliverables/story/archetype-blueprints.ts` — the 8 blueprints (spec §9) + the
  registry-key → archetype map.
- `src/lib/deliverables/story/story-director.ts` — `buildStory` (deterministic model→pages) +
  `validateStory`.
- `src/lib/deliverables/story/__tests__/story-director.test.ts` — 14 tests.

## QA / Validation

- **PASS** — `jest` story suite: 14/14 (answer-first binding, claim-evidence binding, the WE
  estimate-twice → ValueWaterfall convergence, every one of the 8 archetypes builds with zero
  validation errors + all mandatory exhibits + a decision page, the Charter answer-first warning,
  and the registry→archetype map).
- **PASS** — `tsc --noEmit` clean on the new files; `eslint` clean.
- **NOT-RUN (by design)** — no live/ACA path: not yet wired into the orchestrator.

## Rollout Plan

Merge to `main` after PR1 (`MoveDecisionModel`). No runtime effect (nothing imports it yet). Later
PRs: Visual Director (PR4) maps the exhibit plan to the expert-kernel `svg-*` library; the renderer
(PR5) emits the deck.

## Rollback Plan

Revert the PR. Zero impact — no caller depends on the module.

## Audit Evidence

- PR URL (added on open); CI run; the 14-test suite is the behavioral evidence.

## Known Gaps

- Headlines are model-derived conclusions where the model supplies one, else the blueprint's intent
  slot; the LLM conclusion-authoring pass (spec §6) that fills the remaining slots is a later PR
  (flagged per-page by `validateStory`).
- The §9 Initiative Charter opens problem-first, in tension with spec §6/§17 (answer-first within 2
  pages); kept as authoritative and surfaced as a warning, not silently reordered.
