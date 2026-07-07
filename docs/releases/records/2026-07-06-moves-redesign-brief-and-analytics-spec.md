# 2026-07-06-moves-redesign-brief-and-analytics-spec — Moves redesign brief + analytics-layer spec (docs only)

## Release ID

`2026-07-06-moves-redesign-brief-and-analytics-spec`

## Status

`released`

## Plain-English Summary

Two design/engineering documents under `docs/build/moves-design/`, added so the design agent ("Claude Design") and engineers can act on the decision to bring the Moves phase workspace to the Source module's redesigned look/feel and to surface phase intelligence on the page (instead of trapping it in generated deliverables):

- `MOVES_REDESIGN_CLAUDE_DESIGN_BRIEF.md` — hand-off brief for a standalone HTML mockup of the P2 Discover and P4 Business Case phase pages in the Source visual language: stage shell, inline findings surface, gate-as-attestations, Recharts advanced visuals, archetype-benchmarked.
- `MOVES_ANALYTICS_LAYER_SPEC.md` — engineering spec for a new `src/lib/programs/analytics/` that mirrors `src/lib/source/analytics/*` + `src/lib/source/archetypes/*`: typed `MoveFinding` extraction per phase, a transformation-archetype corpus, Recharts view-models, deliverables consuming findings, and a finding-status collaboration lifecycle.

No code, schema, runtime, or flag change — documentation only.

## Layer Impact

- Documentation only. No lane behavior changes. Informs future work in `global-control-lane` (Moves phase workspace) but ships no runtime change.

## Client Applicability

- All clients: No (no runtime change).
- Specific clients: n/a
- Internal only: Yes — internal design/engineering hand-off docs.
- Public/demo only: No
- Feature flag: None.

## Changes Included

- `docs/build/moves-design/MOVES_REDESIGN_CLAUDE_DESIGN_BRIEF.md` (new)
- `docs/build/moves-design/MOVES_ANALYTICS_LAYER_SPEC.md` (new)

## QA / Validation

- **Docs-only — NOT-APPLICABLE (no runtime):** no build/test surface. `npm run release:check` run locally to satisfy the release gate.
- **Content review — PASS:** codebase paths in both docs verified against `origin/main` (Source `lib/source/analytics/*` + `archetypes/*`, Moves `strategic-moves/*` + `programs/board-artifacts|deliverables/*`, `recharts@3.8.1` present in package.json, archetype docs under `docs/build/moves-design` / `docs/strategy`).

## Rollout Plan

Merge to `main` via squash PR. No runtime rollout, no ACA deploy, no migration.

## Deployment Authority

- Repo-owned deploy workflow: n/a (docs only; no runtime image change).
- Shared runtime mutators: none.
- Live signed-in proof required: No (no runtime change).

## Rollback Plan

Revert the PR. No state involved.

## Audit Evidence

- PR URL: added on open.
- The two documents under `docs/build/moves-design/`.

## Known Gaps

- These are planning artifacts; they do not themselves implement the redesign or the analytics layer. The `src/lib/programs/analytics/` build and the phase-page redesign are follow-on work.
