# 2026-06-06 — Finance/Treasury/ALM Function Pack: own-it discipline + architecture depth

## Release ID

`2026-06-06-treas-function-pack-encoding`

## Status

`candidate`

## Plain-English Summary

Deepens the typed Finance, Treasury & ALM Domain Function Pack (`src/lib/programs/expert-kernel/domain/financial-services/finance-treasury-alm.ts`) — the curated industry-depth layer the expert-kernel binds into a Move before it reasons, and which the deterministic board-grade renderers compose into Move artifacts.

This is the encoding of the TREAS Pattern Pack "Bible" (`docs/build/pattern-packs/domains/04-finance-treasury.md`) own-it discipline and platform-foundation architecture depth into the runtime kernel, mirroring the population-health precedent (`2026-06-06-popH-function-pack-own-it`). It injects the OWN-IT-vs-RENT discipline and the platform-foundation depth that were previously absent. After this change, the pack:

- Adds a pain theme **"Rented treasury intelligence"** — the failure mode where the forecasting, anomaly, and covenant-headroom models live inside a TMS or treasury-analytics SaaS the institution cannot audit, extend, or recalibrate, against the own-it thesis "rent the rails (TMS / payment factory), own the intelligence (models on the institution's own lakehouse)."
- Extends the Layer 7 `solution_architecture` deliverable outline with a **"Platform landing zone & private data plane"** section and an **"Ingestion & data-integration framework (own-it)"** section — naming the treasury feeds (bank statements BAI2/MT940/camt, ERP/GL, TMS/Kyriba, market data) and the own-it ingestion choice (DLT-META / the Databricks four-config framework, Lakeflow Connect landing in the institution's own Unity Catalog), rejecting a bespoke build or a rented destination SaaS.
- Strengthens the Layer 7 governance/controls section to name the platform governance spine explicitly: Unity Catalog access/lineage controls, SOX-auditable evidence, and preserved segregation of duties between initiation, approval, and release.
- Reframes the Layer 7 data-architecture section as an own-it, lakehouse-native layer rather than a rented treasury-analytics SaaS.
- Adds an **evidence anchor** for "the treasury intelligence layer is owned, not rented," with what good vs weak evidence looks like.
- Bumps the pack to `version 1.1.0`, `lastReviewed 2026-06-06`.

All additions are purely additive (no metric, archetype, pattern, key, or `metricsMoved` reference removed) and the pack remains a pure, deterministic, typed module — no I/O, no fabrication. The architecture-foundation depth was deliberately added ONLY to the Layer 7 `solution_architecture` deliverable outline, not to the Layer 4 `referenceSolutionPatterns` (the architecture renderer treats unmarked Layer-4 patterns as a mutually-exclusive option set and would render foundation as "rejected").

## Layer Impact

- `global-control-lane`: deepens shared expert-kernel domain depth that all clients' finance/treasury/ALM Moves inherit. No behavior is gated or client-specific; the pack is curated reference data the renderers read.

## Client Applicability

- All clients: Yes — any financial-services finance/treasury/ALM Move binds this pack.
- Specific clients: Strengthens the Lakeshore / Morgan Street HoldCo treasury context the TREAS Bible was authored against.
- Internal only: No.
- Public/demo only: No.
- Feature flag: N/A.

## Changes Included

- `src/lib/programs/expert-kernel/domain/financial-services/finance-treasury-alm.ts` — +1 pain theme, +1 evidence anchor, +2 Layer-7 `solution_architecture` sections, strengthened governance + data-architecture guidance, version bump.
- `docs/releases/records/2026-06-06-treas-function-pack-encoding.md` — this record.

## QA / Validation

- Status: PASS
- `npx jest src/lib/programs/expert-kernel/domain/__tests__` → **16 suites, 819 tests, all passing** (includes the §6 depth-bar test and the financial-services pack tests; the pack still meets all depth minimums and every benchmark range keeps its `planning-range` label).
- `npx tsc --noEmit` → **0 type errors in the changed file** (the only project-wide TS errors are pre-existing missing-optional-dependency noise — `@azure-rest/ai-document-intelligence`, `@axe-core/playwright` — unrelated to this change).
- Additive-only: pain themes 8→9, evidence anchors 5→6, `solution_architecture` sections 6→8; no keys removed, no `metricsMoved` references broken.
- Cross-cutting architecture depth kept out of Layer 4 `referenceSolutionPatterns` so the foundation is not rendered as a rejected option; no import of `cross-cutting-architecture-patterns.ts`.

## Rollout Plan

Merge to main. The deterministic board-grade renderers and the function-pack registry pick up the deepened pack immediately — no migration, no deploy step beyond the normal Vercel build. The own-it discipline and platform-foundation depth now flow into any finance/treasury/ALM Move's Discover / Business-Case / Solution-Architecture / Mobilization artifacts that bind this pack.

## Rollback Plan

Revert the PR. The pack returns to v1.0.0. No schema, migration, or persisted state involved.

## Audit Evidence

- PR: (this PR)
- Test run: `jest … domain/__tests__` 819/819 passing
- Pairs with: `docs/build/pattern-packs/domains/04-finance-treasury.md` (the authoring source / TREAS Bible), `docs/strategy/ABARVA-DOMAIN-FUNCTION-PACK-SPEC.md` (the schema spec), and the population-health precedent `docs/releases/records/2026-06-06-popH-function-pack-own-it.md`.

## Known Gaps

- This encodes the own-it discipline + platform-foundation architecture depth into the finance/treasury/ALM pack. There is no existing financial-services function key for cost-reduction / vendor-procurement, so the COST Bible pack (`docs/build/pattern-packs/domains/05-cost-reduction.md` and peers) has no kernel home yet — none was created in this change.
- Deeper TREAS-specific encodings (the bitemporal entity model, 13-week vs strategic forecast split, payment-anomaly SoD detail) remain follow-on edits in the same lane.
