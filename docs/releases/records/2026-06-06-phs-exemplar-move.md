# 2026-06-06 — PHS population-health exemplar Move + foundation-rendering fix

## Release ID

`2026-06-06-phs-exemplar-move`

## Status

`candidate`

## Plain-English Summary

Proves the Pattern Pack Bible → Domain Function Pack encoding end-to-end by composing a Presbyterian-Healthcare-Services-inspired population-health Move in memory and rendering it through the real expert-kernel board-grade renderers (solution architecture, discover brief, business case, mobilize packet). All four artifacts bind to the curated `population_health_value_based_care` function pack and render grounded content — no database, no fabrication.

The end-to-end run surfaced a real rendering defect and fixes it: the cross-cutting architecture patterns added in #3213 were spread into the pack's `referenceSolutionPatterns` (Layer 4), but the solution-architecture renderer treats that array as a mutually-exclusive option set (selects the most human-accountable pattern, rejects the rest) — so the landing zone, ingestion framework, and governance spine rendered as "REJECTED — higher-autonomy alternatives," which is wrong and buyer-confusing.

Fix: the cross-cutting foundation depth is delivered through the pack's `solution_architecture` deliverable outline (Layer 7) — which renders correctly as an inherited "Platform landing zone & private data plane" section and an "Ingestion & data-integration framework (own-it)" section — and is removed from Layer 4. The typed `cross-cutting-architecture-patterns.ts` module is retained as the source of truth, awaiting a foundation-aware renderer. Pack bumped v1.2.0 → v1.2.1.

## Layer Impact

- `global-control-lane`: corrects how shared expert-kernel architecture depth renders into Move solution-architecture artifacts for all clients; adds a reusable composition/proof script and the rendered PHS exemplar artifacts.

## Client Applicability

- All clients: Yes — the rendering fix affects every population-health Move's solution-architecture artifact.
- Specific clients: The exemplar is the PHS / Meridian demo proof.
- Internal only: No. Public/demo only: No. Feature flag: N/A.

## Changes Included

- `src/lib/programs/expert-kernel/domain/healthcare/population-health-value-based-care.ts` — removed the cross-cutting Layer 4 spread (referenceSolutionPatterns back to the 5 domain patterns); Layer 7 outline depth retained; v1.2.0 → v1.2.1.
- `src/lib/programs/expert-kernel/domain/cross-cutting-architecture-patterns.ts` — header updated to reflect Layer 7 delivery + foundation-aware-renderer intent (no longer "spread into referenceSolutionPatterns").
- `scripts/phs/render-phs-population-health-exemplar.ts` — new in-memory composition harness.
- `docs/build/meridian-phs-success-brief/exemplar-move/*.html` (4 rendered artifacts) + `README.md` — the proof.
- `docs/releases/records/2026-06-06-phs-exemplar-move.md` — this record.

## QA / Validation

**Status: PASS.**

- `npx jest src/lib/programs/expert-kernel/domain/__tests__ …/exports/board-grade/__tests__` → **36 suites, 1213 tests passing.**
- `npx tsc --noEmit` → **0 errors in the changed kernel files or the new script** (only the 2 pre-existing missing-optional-dependency errors remain, unrelated).
- Render verification: 4/4 artifacts `bound: YES`; the solution-architecture scorecard no longer lists foundation patterns as rejected; the inherited outline retains the landing-zone + own-it ingestion sections; the discover brief reconciles 4 recorded metrics and names 8 honest seed gaps (33% baseline coverage).

## Rollout Plan

Merge to main. Deterministic renderers pick up the corrected pack immediately — no migration, no deploy step. The exemplar artifacts are static docs.

## Rollback Plan

Revert the PR. Pack returns to v1.2.0 (re-introducing the Layer 4 mis-render). No schema or persisted state.

## Audit Evidence

- Exemplar artifacts: `docs/build/meridian-phs-success-brief/exemplar-move/`
- Harness: `scripts/phs/render-phs-population-health-exemplar.ts`
- Test run: jest 1213/1213 passing
- Pairs with #3210 (Bible), #3212 (own-it), #3213 (cross-cutting), spec `docs/strategy/ABARVA-DOMAIN-FUNCTION-PACK-SPEC.md`

## Known Gaps

- Foundation-aware renderer (present `cross-cutting-architecture-patterns.ts` as adopted foundation components in the architecture artifact, not just outline guidance) is the next enhancement.
- CLIN + PAYER domain encodings remain (tasks #2, #3); other function packs can adopt the same Layer 7 architecture-outline depth.
