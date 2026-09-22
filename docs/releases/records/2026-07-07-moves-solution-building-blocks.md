# 2026-07-07-moves-solution-building-blocks — Moves solution building-blocks model (docs only)

## Release ID
`2026-07-07-moves-solution-building-blocks`

## Status
`released`

## Plain-English Summary
Adds the canonical "solution building blocks" model for Moves and aligns the redesign brief + analytics spec to it. A Move is a **composed bundle of 3–6 reusable building blocks** (from a governed set of 10, each with a 14-field advisory playbook), not a single archetype label. Docs only.

## Layer Impact
- `global-control-lane`: documentation only (`docs/build/moves-design/`). No runtime/schema/flag change; informs future shared Moves behavior.

## Client Applicability
- All clients: No (no runtime change). Internal only: Yes.

## Changes Included
- `docs/build/moves-design/MOVES_SOLUTION_BUILDING_BLOCKS.md` (new — canonical model).
- `docs/build/moves-design/MOVES_BUILDING_BLOCK_SPINE.md` (new — phase-flow build spec: blocks as lanes P2→P3→P4→P5→Tower + the 5 product features).
- `docs/build/moves-design/MOVES_PORTFOLIO_HEALTHCARE_PLAYBOOK.md` (new — portfolio model: foundation vs outcome Moves, shared-foundation dependencies, wave sequencing, portfolio view; healthcare worked example).
- `docs/build/moves-design/MOVES_DYNAMIC_PATTERN_ASSEMBLY.md` (new — the AbarVa⇄Claude contract: AbarVa builds a Pattern Assembly Packet + validates; Claude assembles the pattern; not "archetype").
- `docs/build/moves-design/MOVES_REDESIGN_CLAUDE_DESIGN_BRIEF.md` (§4 → building-blocks bundle + card).
- `docs/build/moves-design/MOVES_ANALYTICS_LAYER_SPEC.md` (§5 → bundle recommender; types).

## QA / Validation
- **Content review — PASS:** cross-checked against existing `solution-archetype-taxonomy.ts` + `suitability/agentic-suitability.ts`.
- **Build/test — not-run:** docs-only, no runtime surface.

## Rollout Plan
Merge to `main` via squash PR. No runtime rollout.

## Deployment Authority
- Repo-owned deploy workflow: n/a (docs only). Live signed-in proof required: No.

## Rollback Plan
Revert the PR. No state involved.

## Audit Evidence
- PR URL (added on open); the three docs under `docs/build/moves-design/`.

## Known Gaps
- Planning artifacts only; the `src/lib/programs/analytics/` build + block registry is follow-on work.
