# 2026-06-06 — Foundation-aware solution-architecture renderer

## Release ID

`2026-06-06-foundation-aware-architecture-render`

## Status

`candidate`

## Plain-English Summary

Makes the Moves board-grade solution-architecture renderer foundation-aware so cross-cutting platform-foundation patterns (cloud landing zone, own-it ingestion framework, medallion data products, governed model serving, Unity Catalog / HITRUST governance) can live in a Domain Function Pack's `referenceSolutionPatterns` (Layer 4) and render as ADOPTED foundation — never as ranked or rejected options.

Background: the renderer treats `referenceSolutionPatterns` as a mutually-exclusive OPTION scorecard — it selects the lowest-autonomy (most human-accountable) pattern and names the rest as rejected alternatives. That is correct for genuinely-competing options but wrong for cross-cutting foundation, which is adopted, not chosen-among. When the cross-cutting patterns were previously spread into Layer 4 they rendered as "REJECTED — higher-autonomy alternative" (the defect backed out in #3216).

Fix: a new OPTIONAL `dispositionKind?: 'option' | 'foundation'` field on `ReferenceSolutionPattern` lets a pattern declare itself as adopted foundation. The model partitions the pack's patterns into options (ranked; one selected, the rest named as alternatives) and foundation (all adopted); the select-one/reject-rest logic runs ONLY over options. The renderer adds an "Adopted platform foundation" exhibit on the target-architecture slide, visually distinct from the option scorecard (a blue "Adopted" treatment, never the red rejected treatment). The five cross-cutting patterns are tagged `dispositionKind: 'foundation'` and re-added to the population-health pack (v1.2.1 → v1.3.0). The field is optional, so every existing pack with no foundation patterns renders exactly as before.

## Layer Impact

- `global-control-lane`: corrects and extends how shared expert-kernel architecture depth renders into Move solution-architecture artifacts for all clients. Schema change is additive/optional; no data-plane, RLS, or persisted-state change.

## Client Applicability

- All clients: Yes — the renderer change applies to every Move's solution-architecture artifact; packs with no foundation patterns are unaffected.
- Specific clients: The re-render proof uses the PHS / Meridian population-health exemplar.
- Internal only: No. Public/demo only: No. Feature flag: N/A.

## Changes Included

- `src/lib/programs/expert-kernel/domain/function-pack-types.ts` — added optional `dispositionKind?: 'option' | 'foundation'` to `ReferenceSolutionPattern` (back-compatible).
- `src/lib/programs/expert-kernel/domain/cross-cutting-architecture-patterns.ts` — tagged all 5 patterns `dispositionKind: 'foundation'`; updated the header comment (now supported as foundation, may be spread into a pack's `referenceSolutionPatterns`).
- `src/lib/programs/expert-kernel/exports/board-grade/move-solution-architecture-model.ts` — partitions options vs foundation; option scorecard (selected/rejected, decision options, autonomy-expansion decision) runs over options only; added a `foundation` array to the target-state section; corrected derived counts ("N options + M adopted foundation components").
- `src/lib/programs/expert-kernel/exports/board-grade/move-solution-architecture-renderer.ts` — added the "Adopted platform foundation" exhibit (cards + table, adopted chip, distinct `pattern-foundation` styling); renders nothing when a pack carries no foundation patterns.
- `src/lib/programs/expert-kernel/domain/healthcare/population-health-value-based-care.ts` — re-added the cross-cutting import; spread `...CROSS_CUTTING_ARCHITECTURE_PATTERNS` into `referenceSolutionPatterns`; replaced the removal NOTE; v1.2.1 → v1.3.0.
- `src/lib/programs/expert-kernel/exports/board-grade/__tests__/move-board-grade-solution-architecture.test.ts` — added a foundation-aware partition describe block (4 tests).
- `docs/build/meridian-phs-success-brief/exemplar-move/*.html` — re-rendered exemplar artifacts.
- `docs/releases/records/2026-06-06-foundation-aware-architecture-render.md` — this record.

## QA / Validation

**Status: PASS.**

- `npx jest src/lib/programs/expert-kernel` → **69 suites, 1599 tests passing** (was 1595 on origin/main; +4 new foundation-partition tests). No existing assertion was weakened; the depth tests use `>=` minimums (still satisfied) and the per-vertical scorecard tests (retail / clinical-ops / fraud packs carry no foundation patterns) are unchanged.
- `npx tsc --noEmit` → **0 errors in expert-kernel**; only the 2 pre-existing missing-optional-dependency errors remain (`@azure-rest/ai-document-intelligence`, `@axe-core/playwright`), unrelated.
- Render proof: `npx tsx scripts/phs/render-phs-population-health-exemplar.ts` → 4/4 artifacts `bound: YES`. In `phs-solution-architecture.html`:
  - (a) ADOPTED — the "Adopted platform foundation" exhibit renders all 5 foundation patterns (Cloud landing zone, Metadata-driven own-it ingestion framework, Medallion data products, Governed model serving, Unity Catalog governance & HITRUST) in `pattern-foundation` cards with the "Adopted" chip (5 foundation cards, 10 adopted chips across cards + table).
  - (b) NOT REJECTED — the literal word "Rejected" appears 0 times in the document; the 3 `pattern-rejected` cards are genuine competing domain OPTIONS (reconciled population data layer, risk model with periodic validation loop, contract-decision simulation harness); 0 foundation names appear inside any rejected card.

## Rollout Plan

Merge to main. Deterministic renderers pick up the corrected model/renderer + the updated pack immediately — no migration, no deploy step, no data-plane change. The exemplar artifacts are static docs.

## Rollback Plan

Revert the PR. The `dispositionKind` field is optional and unused elsewhere; reverting restores the prior renderer and drops the cross-cutting spread from the population-health pack (back to v1.2.1). No schema or persisted state.

## Audit Evidence

- Exemplar artifacts: `docs/build/meridian-phs-success-brief/exemplar-move/`
- Harness: `scripts/phs/render-phs-population-health-exemplar.ts`
- Test run: jest 1599/1599 passing
- Pairs with #3210 (Bible), #3212 (own-it), #3213 (cross-cutting), #3216 (backed-out mis-render), and the PHS exemplar record `2026-06-06-phs-exemplar-move.md`

## Known Gaps

- Other domain packs (CLIN, PAYER, retail, finserv) can now adopt the same foundation patterns by spreading `CROSS_CUTTING_ARCHITECTURE_PATTERNS` (or a domain-appropriate subset) into their `referenceSolutionPatterns`; only the population-health pack is wired in this change.
