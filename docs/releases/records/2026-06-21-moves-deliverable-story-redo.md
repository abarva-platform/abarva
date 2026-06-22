# 2026-06-21-moves-deliverable-story-redo — Moves deliverable story-led redo (PR-A foundation)

## Release ID

`2026-06-21-moves-deliverable-story-redo`

## Status

`candidate`

## Plain-English Summary

Redoes the shared Moves deliverable generation standard so client-facing artifacts are **story-led,
context-grounded, and exhibit-led** — reasoning current state → gaps → target state and rendering that
as visuals — instead of mechanical prose section-packs. This PR-A is the **enforcement foundation**
(inert until the renderer/generation PRs land): a reasoning-plan contract, new profile fields, and a
quality gate that fails storyless / prose-only / visual-less / incomplete-architecture artifacts. It
does NOT use word/section limits as a control — depth is allowed; long artifacts are never rejected
for length. Shared across every tenant; no per-client code.

## Layer Impact

- `global-control-lane` lane: shared deliverable-quality contract + profile registry (control-plane
  library). Additive; the new gate dimensions self-gate on profile flags, so only profiles that adopt
  the standard (currently `target_state_architecture`) are newly enforced.

## Client Applicability

- All clients: the shared standard applies to all tenants by construction.
- Specific clients: none singled out (SkyHarbor is only a proof point).
- Internal only: enforcement strictness lands as the renderer/generation PRs emit the signals.
- Feature flag: rides the existing `deliverable_structured_exhibits` / `deliverable_quality_contract`.

## Changes Included

- `docs/build/MOVES_DELIVERABLE_STORY_REDO_STANDARD.md` — the authoritative standard + build sequence.
- `src/lib/deliverables/planning/deliverable-plan.ts` — the reason-first DeliverablePlan + validator.
- `src/lib/deliverables/profiles/types.ts` — §13 profile fields + new quality dimensions.
- `src/lib/deliverables/profiles/registry.ts` — `target_state_architecture` adopts the standard.
- `src/lib/deliverables/quality/deliverable-quality-contract.ts` — story/current-state/gap-to-target/
  architecture-completeness/visual-exhibit checks + new failure states.

## QA / Validation

- `tsc --noEmit` clean.
- `jest` — 248 tests green (incl. plan validation + the story/visual/architecture gate; "long is not
  rejected for length" asserted; prose-only architecture → `blocked_missing_visuals`).
- `node scripts/release-check.mjs` run locally.

## Rollout Plan

No runtime behavior change until the renderer (PR-C) + generation passes (PR-D) emit the story/visual
signals. Merge carries the contract; architecture artifacts will then correctly fail the gate until
they render real visuals — staged behind the existing flags.

## Deployment Authority

Not applicable — no ACA/deploy/image/worker/flag/traffic change in this PR.

## Rollback Plan

Revert the PR. The new gate dimensions self-gate on profile flags; reverting restores prior behavior.

## Audit Evidence

PR URL; CI run; local `tsc` + 248 jest tests; release-check pass.

## Known Gaps

- PR-B (ArchitectureModel v2: current-state-flow + gaps map + gap-to-target bridge +
  conceptual/logical/physical), PR-C (render all 13 exhibits as real SVG/HTML), PR-D (reasoning-plan +
  visual-model generation passes/prompts), PR-E (PPT visual-first), PR-F (re-run SkyHarbor IROPS) are
  not in this PR. This PR makes the standard enforceable; the rich rendering + prompts follow.
