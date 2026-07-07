# 2026-06-06 — Clinical + payer function-pack own-it & architecture depth

## Release ID

`2026-06-06-clin-payer-pack-encoding`

## Status

`candidate`

## Plain-English Summary

Extends the proven own-it + architecture-foundation encoding (shipped first into the population-health function pack, #3212/#3213) into the two remaining healthcare hero packs — **clinical operations & documentation** (CLIN) and **payer / claims operations** (PAYER) — so a generated Solution Architecture artifact for either function inherits a real platform foundation and an explicit own-it-vs-rent posture instead of improvising them.

Each pack receives the same three additive enrichments the population-health pack received, adapted to the domain:

1. **Layer 7 `solution_architecture` deliverable outline** gains a "Platform landing zone & private data plane" section and an "Ingestion & data-integration framework (own-it)" section (naming DLT-META / the Databricks four-config framework / Lakeflow Connect landing in the client's own Unity Catalog, and rejecting bespoke-build or rented destination SaaS), and its governance section is strengthened to name Unity Catalog access/lineage controls + a HITRUST CSF mapping + HIPAA compliance security profile + dual BAA (cloud provider and lakehouse vendor), with PHI in the client's own account. The existing data section is also reframed to own-it.
2. **Layer 2 painThemes** gains one own-it "rented intelligence" failure mode:
   - CLIN — `rented_black_box_clinical_models`: black-box external clinical/coding models the organisation cannot validate, audit, or recalibrate on its own data, citing the **Epic Sepsis Model** cautionary case (Wong et al., *JAMA Internal Medicine* 2021: real-world AUC ≈0.63, ~two-thirds of sepsis cases missed, far below marketed performance).
   - PAYER — `rented_fragmented_point_solutions`: separate Stars / RA / PA / FWA point-solution SaaS vendors that each hold a data slice and the logic on the vendor side and prevent unifying plan + provider data, vs an own-it unified lakehouse.
3. **Layer 8 evidenceAnchors** gains one ownership anchor per pack (the intelligence layer / models are OWNED, not rented — good vs weak evidence).

Both packs bumped to **v1.1.0** with `lastReviewed: '2026-06-06'`.

Architecture depth lives ONLY in the Layer 7 `solution_architecture` outline (and the painTheme / evidence anchor) — it is deliberately NOT spread into `referenceSolutionPatterns` (Layer 4), because the solution-architecture renderer treats Layer 4 as a mutually-exclusive option set and would render foundation layers as "REJECTED alternatives". The cross-cutting pattern IDs are referenced as string guidance only; the cross-cutting module is not imported.

## Layer Impact

- `global-control-lane`: shared expert-kernel depth all clients' Moves can inherit. The packs are pure typed data; no behavior gated or client-specific.

## Client Applicability

- All clients: Yes — both packs are domain-general within the healthcare-provider vertical.
- Specific clients: Strengthens the Meridian Health clinical-documentation exemplar Move and any payer / integrated payer-provider Move.
- Internal only: No. Public/demo only: No. Feature flag: N/A.

## Changes Included

- `src/lib/programs/expert-kernel/domain/healthcare/clinical-operations-documentation.ts` — Layer 2 painTheme `rented_black_box_clinical_models` added; Layer 7 solution_architecture gains "Platform landing zone & private data plane" + "Ingestion & data-integration framework (own-it)" sections, EHR-integration + governance sections strengthened (Unity Catalog + HITRUST + HIPAA compliance security profile + dual BAA, own-it model validation / Epic Sepsis lesson); Layer 8 ownership evidence anchor added; version 1.0.0 → 1.1.0, lastReviewed → 2026-06-06.
- `src/lib/programs/expert-kernel/domain/healthcare/payer-claims-operations.ts` — Layer 2 painTheme `rented_fragmented_point_solutions` added; Layer 7 solution_architecture gains the same two foundation sections, data + governance sections strengthened (Unity Catalog + HITRUST + HIPAA compliance security profile + dual BAA, unified plan + provider lakehouse); Layer 8 ownership evidence anchor added; version 1.0.0 → 1.1.0, lastReviewed → 2026-06-06.
- `docs/releases/records/2026-06-06-clin-payer-pack-encoding.md` — this record.

## QA / Validation

- Status: PASS
- `npx jest src/lib/programs/expert-kernel/domain/__tests__` → **16 suites, 819 tests passing** (depth bar still met; additive-only — no keys removed, no `metricsMoved` changed).
- `npx tsc --noEmit` → **0 errors in expert-kernel/domain** (only the 3 pre-existing missing-optional-dependency errors remain: `@azure-rest/ai-document-intelligence` ×2, `@axe-core/playwright` ×1 — unrelated).
- Additive only: each pack gains one painTheme, two Layer 7 sections plus strengthened guidance, and one evidence anchor. Layer 4 `referenceSolutionPatterns` deliberately untouched (avoids the "REJECTED alternatives" render bug). No cross-cutting module import.

## Rollout Plan

Merge to main. The deterministic board-grade renderers and the function-pack registry pick up the deepened packs immediately — no migration, no extra deploy step.

## Rollback Plan

Revert the PR. Both packs return to v1.0.0. No schema, migration, or persisted state.

## Audit Evidence

- PR: (this PR)
- Test run: jest domain/__tests__ 819/819 passing
- Pairs with: `docs/build/pattern-packs/domains/02-clinical-performance.md` (CLIN authoring source, Epic Sepsis Model lesson) and `docs/build/pattern-packs/domains/03-payer-health-plan.md` (PAYER authoring source, point-solution anti-pattern PAYER-19); precedent `docs/releases/records/2026-06-06-cross-cutting-architecture-patterns.md`; #3212 (own-it discipline), #3213 (cross-cutting patterns); spec `docs/strategy/ABARVA-DOMAIN-FUNCTION-PACK-SPEC.md`.

## Known Gaps

- Architecture foundation depth is carried as string-level guidance referencing the cross-cutting pattern IDs, not a typed import. A future refactor could make `referenceSolutionPatterns` formally compose a shared cross-cutting set + domain set at the type level.
- Remaining tranche-1b / tranche-2 packs (retail, financial-services, other healthcare functions) still need the same own-it + architecture encoding — a mechanical follow-on.
