# 2026-06-06 — Cross-cutting architecture reference patterns

## Release ID

`2026-06-06-cross-cutting-architecture-patterns`

## Status

`candidate`

## Plain-English Summary

Adds a shared **cross-cutting architecture reference-pattern module** to the expert kernel and wires it into the population-health function pack — so a generated Solution Architecture artifact inherits a real platform foundation instead of improvising it. This closes the "architecture with no landing zone / reinvented or rented ingestion" failure mode at its source.

New module `src/lib/programs/expert-kernel/domain/cross-cutting-architecture-patterns.ts` exports five technical `ReferenceSolutionPattern`s that recur across every domain:

1. **Cloud landing zone & private data plane** (multi-account governance, private networking, PrivateLink, regional Unity Catalog metastore, platform-readiness gate) — Bible ARCH-01/ARCH-18.
2. **Metadata-driven (own-it) ingestion framework** (DLT-META / Databricks four-config / Lakeflow Connect into the client's own catalog) — Bible INGEST-01/02/05/15.
3. **Medallion data products** (OMOP/FHIR, own-it MPI via Splink/Zingg) — Bible MODEL-01/02/05.
4. **Governed model serving & monitoring** (Unity Catalog registry, drift monitoring, HIL gate, own-it RAG) — Bible MLOPS-01/07/09/14.
5. **Unity Catalog governance & HITRUST/HIPAA control spine** (HITRUST CSF mapping, compliance security profile + dual BAA, PHI in the client's own account) — Bible GOV-01/02/03.

Each pattern encodes the OWN-IT-vs-RENT discipline in its boundary (asset built into the client's estate, IP transfers to the client; vendor SaaS holding the data/models is a rent posture requiring surfaced rationale).

The population-health function pack (`population-health-value-based-care.ts`) now spreads these into its Layer 4 reference patterns (5 → 10) and its `solution_architecture` deliverable outline gains a "Platform landing zone & private data plane" section, an "Ingestion & data-integration framework (own-it)" section, and a strengthened governance section naming Unity Catalog + HITRUST + HIPAA. Pack bumped to v1.2.0.

This is the correct, reusable home for cross-cutting architecture depth (a pivot from an earlier plan to edit the case-bound `solution-architecture-pack.ts`, which is a demo-case renderer, not a reference library). The same `CROSS_CUTTING_ARCHITECTURE_PATTERNS` spread can now be wired into the other function packs.

## Layer Impact

- `global-control-lane`: shared expert-kernel depth all clients' Moves can inherit. The new module is pure typed data; the pop-health pack consumes it. No behavior gated or client-specific.

## Client Applicability

- All clients: Yes — the module is domain-general; population-health Moves consume it today, other packs as they are wired.
- Specific clients: Directly strengthens the PHS / Meridian population-health exemplar Move's architecture artifact.
- Internal only: No. Public/demo only: No. Feature flag: N/A.

## Changes Included

- `src/lib/programs/expert-kernel/domain/cross-cutting-architecture-patterns.ts` — new module, 5 cross-cutting reference patterns.
- `src/lib/programs/expert-kernel/domain/healthcare/population-health-value-based-care.ts` — import + spread into Layer 4 (5 → 10 patterns), three Layer 7 solution-architecture outline sections added/strengthened, version 1.1.0 → 1.2.0.
- `docs/releases/records/2026-06-06-cross-cutting-architecture-patterns.md` — this record.

## QA / Validation

- `npx jest src/lib/programs/expert-kernel/domain/__tests__` → **16 suites, 819 tests passing** (depth bar still met — pop-health referenceSolutionPatterns 10 ≥ 4 floor).
- `npx tsc --noEmit` → **0 errors in expert-kernel** (only the 3 pre-existing missing-optional-dependency errors remain, unrelated).
- Additive only: reference patterns 5 → 10; no keys removed; no `metricsMoved` affected.

## Rollout Plan

Merge to main. The deterministic board-grade renderers and the function-pack registry pick up the deepened pack and the new module immediately — no migration, no extra deploy step.

## Rollback Plan

Revert the PR. The module is removed and the pop-health pack returns to v1.1.0. No schema, migration, or persisted state.

## Audit Evidence

- PR: (this PR)
- Test run: jest domain/__tests__ 819/819 passing
- Pairs with: `docs/build/pattern-packs/cross-cutting/*` (the authoring source), #3210 (Bible), #3212 (own-it discipline encoding), spec `docs/strategy/ABARVA-DOMAIN-FUNCTION-PACK-SPEC.md`

## Known Gaps

- The cross-cutting module is wired into the population-health pack only. Wiring it into the other healthcare packs (and retail/financial-services) is a mechanical follow-on (same spread).
- A future refactor could make `referenceSolutionPatterns` formally compose a shared cross-cutting set + domain set at the type level; for now the spread is explicit per pack.
- CLIN and PAYER domain depth encodings remain (tasks #2, #3).
