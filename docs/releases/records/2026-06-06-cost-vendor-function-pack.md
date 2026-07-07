# 2026-06-06 — Cost-Optimization / Vendor-Management Function Pack: new typed kernel home for the COST Bible

## Release ID

`2026-06-06-cost-vendor-function-pack`

## Status

`candidate`

## Plain-English Summary

Creates a NEW typed Domain Function Pack so the Cost-Reduction / Vendor-Rationalization (COST) Pattern Pack "Bible" (`docs/build/pattern-packs/domains/05-cost-reduction-vendor.md`) finally has a kernel home and binds like every other catalogued pack.

The financial-services function taxonomy (`FinancialServicesFunctionKey` in `src/lib/programs/expert-kernel/domain/function-pack-types.ts`) previously had no cost-optimization / vendor-procurement function, so the COST Bible had no typed home — the known gap flagged in the TREAS function-pack record (`2026-06-06-treas-function-pack-encoding`). This change closes it. Cost / vendor rationalization is a corporate / G&A function, so it is placed under `financial-services` (the diversified-institution / HoldCo vertical — the Lakeshore / Morgan Street context the COST Bible was authored against).

After this change:

- A new function key **`cost_optimization_vendor_management`** is added to the `FinancialServicesFunctionKey` union (with a one-line JSDoc note).
- A new typed pack **`costOptimizationVendorManagementPack`** is authored at `src/lib/programs/expert-kernel/domain/financial-services/cost-optimization-vendor-management.ts`, encoding the COST Bible into the eight-layer schema and meeting the full §6 depth bar: 12 operating metrics, 8 pain themes, 6 AI use-case archetypes, 5 reference solution patterns, all 4 phase deliverable outlines, 5 evidence anchors. Every benchmark range is a labelled `planning-range`; every archetype carries a value mechanism; every deliverable outline is a real TOC with substantive guidance.
- The pack encodes the **three COST value spines** (rationalization savings, negotiation leverage, realized savings) and native vocabulary (vendor master, spend cube, spend taxonomy, consolidation, realization ledger, maverick / tail spend, enterprise-rate agreement, hard savings vs cost avoidance). Value math is sourced (Hackett / McKinsey / Deloitte / Gartner — 8–15% on rationalized spend, 25–35% SaaS waste, 20–40% GBS efficiency) or flagged "estimate — confirm with client data".
- The **own-it thesis** ("own the spend graph + savings logic" vs rented spend-analytics SaaS) is encoded as a **"Rented spend intelligence"** pain theme and an **ownership evidence anchor** ("the cost / vendor intelligence layer is owned, not rented").
- The **landing-zone + own-it-ingestion + governance** architecture depth is placed ONLY in the Layer 7 `solution_architecture` deliverable outline — a "Platform landing zone & private data plane" section, an "Ingestion & data-integration framework (own-it)" section, an owned-spend-graph target-state section, and a governance / value-assurance / responsible-AI controls section.
- The pack is registered in `FUNCTION_PACK_ENTRIES` (`function-pack-registry.ts`) and added to the depth-bar test PACKS array (`function-pack-depth.test.ts`).

The architecture-foundation depth was deliberately added ONLY to the Layer 7 `solution_architecture` outline, NOT to the Layer 4 `referenceSolutionPatterns` (the architecture renderer treats unmarked Layer-4 patterns as a mutually-exclusive option set and would render foundation as "rejected"). No import of `cross-cutting-architecture-patterns.ts`. The pack is a pure, deterministic, typed module — no I/O, no fabrication.

## Layer Impact

- `global-control-lane`: adds shared expert-kernel domain depth that all clients' cost / vendor Moves inherit. No behavior is gated or client-specific; the pack is curated reference data the deterministic board-grade renderers read, and the registry resolver now returns it for `(financial-services, cost_optimization_vendor_management)` instead of `null`.

## Client Applicability

- All clients: Yes — any financial-services cost / vendor Move binds this pack.
- Specific clients: Strengthens the Lakeshore / Morgan Street HoldCo cost-program context the COST Bible was authored against.
- Internal only: No.
- Public/demo only: No.
- Feature flag: N/A.

## Changes Included

- `src/lib/programs/expert-kernel/domain/function-pack-types.ts` — +1 function key (`cost_optimization_vendor_management`) on the `FinancialServicesFunctionKey` union with a JSDoc note.
- `src/lib/programs/expert-kernel/domain/financial-services/cost-optimization-vendor-management.ts` — NEW typed pack (all eight layers, full depth bar).
- `src/lib/programs/expert-kernel/domain/function-pack-registry.ts` — import + `FUNCTION_PACK_ENTRIES` array entry.
- `src/lib/programs/expert-kernel/domain/__tests__/function-pack-depth.test.ts` — import + PACKS array entry so the new pack is exercised by the §6 depth-bar suite.
- `docs/releases/records/2026-06-06-cost-vendor-function-pack.md` — this record.

## QA / Validation

- Status: PASS
- `npx jest src/lib/programs/expert-kernel` → **71 suites, 1622 tests, all passing** — includes the §6 depth-bar test for the new pack AND the corpus grounding battery (`__tests__/corpus-grounding-battery.test.ts`), whose auto-generated coverage questions rose from 140 to **143** (3 new questions for the new catalogued pack: bind-with-≥10-metrics, ≥5-archetypes, 4-section solution_architecture outline) — all 143 ground with no fallback.
- `npx tsc --noEmit` → **0 type errors in expert-kernel**; the only project-wide TS errors are the pre-existing missing-optional-dependency noise (`@azure-rest/ai-document-intelligence` ×2, `@axe-core/playwright` ×1) unrelated to this change.
- Depth bar met: 12 metrics (≥10), 8 pain themes (≥6), 6 archetypes (≥5), 5 reference patterns (≥4), 4/4 deliverable outlines, 5 evidence anchors (≥4); every benchmark range carries `label: 'planning-range'`; every archetype `metricsMoved` reference resolves to a metric the pack defines.
- Cross-cutting architecture depth kept out of Layer 4 `referenceSolutionPatterns` so foundation is not rendered as a rejected option; no import of `cross-cutting-architecture-patterns.ts`.

## Rollout Plan

Merge to main. The deterministic board-grade renderers and the function-pack registry pick up the new pack immediately — no migration, no deploy step beyond the normal Vercel build. The cost / vendor own-it discipline and platform-foundation depth now flow into any financial-services cost / vendor Move's Discover / Business-Case / Solution-Architecture / Mobilization artifacts that bind this pack, and `resolveFunctionPack('financial-services', 'cost_optimization_vendor_management')` now returns the pack rather than `null`.

## Rollback Plan

Revert the PR. The function key, the pack file, the registry entry, and the test entry are removed; the resolver returns to `null` for the cost / vendor function. No schema, migration, or persisted state involved.

## Audit Evidence

- PR: (this PR)
- Test run: `jest … src/lib/programs/expert-kernel` 1622/1622 passing; corpus grounding battery 143/143.
- Pairs with: `docs/build/pattern-packs/domains/05-cost-reduction-vendor.md` (the authoring source / COST Bible), `docs/strategy/ABARVA-DOMAIN-FUNCTION-PACK-SPEC.md` (the schema spec), and the precedents `docs/releases/records/2026-06-06-treas-function-pack-encoding.md` (which flagged this as a known gap) and `docs/releases/records/2026-06-06-popH-function-pack-own-it.md`.

## Known Gaps

- The pack encodes the COST Bible's three value spines, own-it thesis, and platform-foundation architecture depth into a single function pack. Deeper COST-specific encodings (e.g. a dedicated insurance-program-federation archetype, fourth-party / sub-processor concentration detail, dynamic-discounting math shared with the treasury pack) remain follow-on edits in the same lane.
- The COST Bible composes with the cross-cutting packs (`ARCH`, `INGEST`, `MODEL`, `MLOPS`, `GOV`, `FINOPS`) and the adjacent `TREAS` domain pack; those compositions are referenced in the Layer 7 outline guidance but are not separately encoded as kernel artifacts here.
