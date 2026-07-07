# 2026-06-06 — Population-Health Function Pack: own-it discipline + HEI + bias guardrail

## Release ID

`2026-06-06-popH-function-pack-own-it`

## Status

`candidate`

## Plain-English Summary

Deepens the typed Population-Health & Value-Based-Care Domain Function Pack (`src/lib/programs/expert-kernel/domain/healthcare/population-health-value-based-care.ts`) — the curated industry-depth layer the expert-kernel binds into a Move before it reasons, and which the deterministic board-grade renderers compose into Move artifacts.

This is the first encoding of the Pattern Pack "Bible" (`docs/build/pattern-packs/`, PR #3210) into the runtime kernel. It injects the OWN-IT-vs-RENT discipline that was previously absent: the pack used to list Innovaccer / Health Catalyst / Arcadia as the default "system of record" with no framing that those are vendor-hosted SaaS platforms that hold the client's data and models on the vendor side. After this change, the pack:

- Adds a pain theme **"Rented population intelligence"** — the failure mode where the population data layer, risk models, and quality logic live inside an outsourced platform the organisation cannot audit, extend, recalibrate, or move.
- Reframes the **reconciled population data layer** reference pattern and the system-of-record entry to make a lakehouse-native, client-owned layer (Databricks + Unity Catalog in the client's own account) the explicit own-it target, with the SaaS option named as a rent posture requiring surfaced rationale.
- Adds an **evidence anchor** for "the population intelligence layer is owned, not rented," with what good vs weak evidence looks like.
- Adds the **CMS Health Equity Index (HEI) reward** regulatory frame (2027 Star year) — turning SDOH/equity-stratified quality into a Star-revenue lever, on-thesis for D-SNP populations like PHS.
- Strengthens the risk-stratification equity control note with the named **Obermeyer et al. (Science 2019)** cost-as-proxy bias finding.
- Adds a canonical-term entry for the lakehouse-native (own-it) population layer.
- Bumps the pack to `version 1.1.0`, `lastReviewed 2026-06-06`.

All additions are purely additive (no metric, archetype, or pattern removed) and the pack remains a pure, deterministic, typed module — no I/O, no fabrication.

## Layer Impact

- `global-control-lane`: deepens shared expert-kernel domain depth that all clients' population-health / VBC Moves inherit. No behavior is gated or client-specific; the pack is curated reference data the renderers read.

## Client Applicability

- All clients: Yes — any healthcare-provider population-health / VBC Move binds this pack.
- Specific clients: Directly strengthens the PHS / Meridian population-health exemplar Move.
- Internal only: No.
- Public/demo only: No.
- Feature flag: N/A.

## Changes Included

- `src/lib/programs/expert-kernel/domain/healthcare/population-health-value-based-care.ts` — +1 pain theme, +1 evidence anchor, +1 regulatory frame, +1 canonical term, enhanced reference-pattern + system-of-record framing, strengthened equity control note, version bump.
- `docs/releases/records/2026-06-06-popH-function-pack-own-it.md` — this record.

## QA / Validation

- `npx jest src/lib/programs/expert-kernel/domain/__tests__` → **16 suites, 819 tests, all passing** (includes the §6 depth-bar test and the healthcare pack tests; the pack still meets all depth minimums and every benchmark range keeps its `planning-range` label).
- `npx tsc --noEmit` → **0 type errors in the changed file** (the only 3 project-wide TS errors are pre-existing missing-optional-dependency noise — `@azure-rest/ai-document-intelligence`, `@axe-core/playwright` — unrelated to this change).
- Additive-only: pain themes 8→9, evidence anchors 5→6; no keys removed, no `metricsMoved` references broken.

## Rollout Plan

Merge to main. The deterministic board-grade renderers and the function-pack registry pick up the deepened pack immediately — no migration, no deploy step beyond the normal Vercel build. The own-it discipline now flows into any population-health Move's Discover / Business-Case / Solution-Architecture / Mobilization artifacts that bind this pack.

## Rollback Plan

Revert the PR. The pack returns to v1.0.0. No schema, migration, or persisted state involved.

## Audit Evidence

- PR: (this PR)
- Test run: `jest … domain/__tests__` 819/819 passing
- Pairs with: `docs/build/pattern-packs/domains/01-population-health.md` (the authoring source), `docs/strategy/ABARVA-DOMAIN-FUNCTION-PACK-SPEC.md` (the schema spec), PR #3210 (the Bible)

## Known Gaps

- This encodes the own-it discipline + a few high-value POPH depth items into the VBC/economics pack. The care-delivery-specific POPH depth (HEDIS care-gap measure IDs, rising-risk operational workflow, chronic registries, PDC adherence) belongs in `care-delivery-care-management.ts` and is a follow-on edit in the same lane.
- CLIN and PAYER pack encodings (tasks #2, #3) and the cross-cutting → `solution-architecture-pack.ts` wiring (task #4) follow.
