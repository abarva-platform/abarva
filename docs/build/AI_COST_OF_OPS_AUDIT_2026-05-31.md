# AI Cost-of-Ops Audit — 2026-05-31

## Executive Summary

The AI cost-of-ops wave is complete at the product layer. AbarVa can now model, carry, render, negotiate, and monitor AI operating cost as a first-class dimension instead of treating AI programs as labor-only business cases.

The wave added:

- A typed AI operating cost model for inference, prompt cache, embeddings, eval, fine-tune, pricing-tier breach, and model-tier drift.
- Effort-estimator and Move business-case wiring so AI Ops cost travels alongside build cost and change cost.
- Board-grade and UI render paths that show a three-axis cost view and unit economics.
- Vendor scorecard inference economics and Source BAFO pricing-tier lock language.
- Four new AI cost failure modes, expanding the failure-mode library from 12 to 16.
- A Tower AI Ops Cost Ledger shown in parallel with the Value Ledger.

The result is a stronger product: every funded AI Move can now answer the CFO question, "What does this cost to run?", before pilot scale.

## PRs Shipped

| Slice | PR | Merge SHA | What changed |
| --- | --- | --- | --- |
| A1 · AI Ops cost schema | https://github.com/anandsundaram-hash/abarva/pull/2660 | `d6efb3289750b3392e156b8440fe07d333320382` | Added the AI Ops cost schema, public rate-card catalogs, calculators, tier breach warnings, model drift warnings, and calculator tests. |
| Wave 0 · CXO answer quality gates | https://github.com/anandsundaram-hash/abarva/pull/2662 | `24001d554d102605b3d2ea0a71faa3fe85b5403a` | Added answer-quality checks for CXO readability, raw-id leakage, tenant leak probes, and golden response hygiene. |
| A2 · Effort estimator wiring | https://github.com/anandsundaram-hash/abarva/pull/2663 | `1cadff64147a4befce9471d320e630e463d3420f` | Added optional AI Ops inputs and estimates to the expert-kernel effort estimator and Move business-case path. |
| A3 · Business-case renderer | https://github.com/anandsundaram-hash/abarva/pull/2665 | `1a9eb6207642d69cc281bd85c64d9e17ffc43010` | Added board-grade AI Ops panels, three-axis cost rendering, unit economics, and warning callouts. |
| B1 · Vendor scorecard inference economics | https://github.com/anandsundaram-hash/abarva/pull/2668 | `baceef5d839d0a575ac3883e941a42e090d2b50f` | Added structured inference economics to vendor scorecards and broker retrieval. |
| B2 · Source pricing-tier lock | https://github.com/anandsundaram-hash/abarva/pull/2669 | `fe1a32256ecc7fc0de0255a698acaf62fc01da63` | Added BAFO pricing-tier lock clause generation when projected usage approaches vendor thresholds. |
| C1 · AI cost failure modes | https://github.com/anandsundaram-hash/abarva/pull/2671 | `7f46785b67948a05ebad67d06b136d856dc032fe` | Added four AI cost failure modes: token cost explosion, model selection drift, embedding refresh surprise, and eval cost growth. |
| Support · tenant onboarding alias registry | https://github.com/anandsundaram-hash/abarva/pull/2672 | `c852d08e75bcdced7f44b404259aa49c1abeac3d` | Fixed a behavior-test blocker by updating tenant onboarding to write the current alias registry. |
| C2 · Tower AI Ops Cost Ledger | https://github.com/anandsundaram-hash/abarva/pull/2673 | `a2cd7aeb96de18775428649349396df27b09b3e8` | Added a Tower AI Ops Cost Ledger in parallel with the Value Ledger, including estimated projection, realized-to-date proxy, variance reason codes, and alerts. |

## What Is Now Possible

1. Move teams can estimate AI run cost before funding.
2. Business cases can show build cost, change cost, and AI Ops cost as separate decision dimensions.
3. Board-grade exports can show cost-per-decision and tier-breach warnings.
4. Vendor scorecards can expose inference pricing gaps instead of burying them in narrative notes.
5. Source can propose pricing-tier lock language before adoption crosses a vendor threshold.
6. PatternOps can flag four cost-specific AI failure modes during Move design.
7. Tower can show AI run-cost variance beside realized business value.

## Primer Refresh

The CXO primer HTML files in `~/Downloads` and `~/Downloads/abarva-primer-pack` were refreshed for Apex Retail, Meridian Health, and SkyHarbor Air.

The refresh adds:

- A separate client-substrate snapshot section.
- Restored navigation targets for the product surfaces.
- A Move business-case section naming the three cost axes: build cost, change cost, AI Ops cost.
- A Tower section showing Value Ledger and AI Ops Cost Ledger in parallel.
- A 16-mode failure-mode heatmap with the four new AI cost modes as the final row.

Files refreshed:

- `/Users/anand/Downloads/apex-cxo-primer.html`
- `/Users/anand/Downloads/meridian-cxo-primer.html`
- `/Users/anand/Downloads/skyharbor-cxo-primer.html`
- `/Users/anand/Downloads/abarva-primer-pack/apex-cxo-primer.html`
- `/Users/anand/Downloads/abarva-primer-pack/meridian-cxo-primer.html`
- `/Users/anand/Downloads/abarva-primer-pack/skyharbor-cxo-primer.html`

## Validation

Local validation run during the wave:

- Focused AI Ops cost calculator tests.
- Effort estimator AI Ops tests.
- Business-case renderer snapshot tests.
- Vendor scorecard inference economics tests.
- BAFO pricing-tier lock snapshot tests.
- AI cost failure-mode loader tests.
- Tower AI Ops Cost Ledger tests.
- `npm run test:behaviors` after the C2 closeout.
- Typecheck on the product PRs before merge.
- Release checks for product PRs.
- CI required checks green before merge, except where explicitly pre-authorized project-wide infrastructure precedent applied.

Primer refresh validation:

- Every refreshed primer has the expected section IDs: `you`, `industry`, `arch`, `home`, `intel`, `moves`, `source`, `tower`, `fail`, `patternops`, `compound`, `plan`, `voice`.
- Each primer has exactly one `16 FAILURE MODES` heatmap.
- The heatmap appears only under `#fail`.
- `Token cost explosion at adoption inflection` appears only once per primer and only inside the failure-mode section.
- No stale `12 failure modes`, `12 ways`, `All 12 modes`, or `these 12 failure modes` wording remains.
- Each primer includes multiple `AI Ops cost` references.

## Honesty Notes

- Tower AI Ops Cost Ledger values are labeled as estimated when they derive from Tower license-dollar data rather than direct inference, embedding, and eval billing telemetry.
- Vendor inference economics fields allow `null` where contract data is not known. The gap is intentionally visible.
- AI Ops catalogs include explicit `asOf` dates so rate-card staleness is inspectable.
- The wave did not claim real-time vendor pricing ingestion. That remains deferred.

## Deferred

The following are deliberate next-wave candidates, not gaps in this wave's definition of done:

1. Real-time pricing-page and vendor-announcement ingestion.
2. Direct model-gateway billing telemetry for realized inference, embedding, and eval cost.
3. Carbon or sustainability cost overlays.
4. Probabilistic value forecasting and sensitivity tables.
5. Multi-vendor inference cost optimization.
6. Workforce displacement and reskilling cost modeling.
7. Customer trust and brand-risk overlays for customer-facing AI.

## Readiness Verdict

Ready for pilot-facing use at the product-model layer. The product now has the structure to discuss AI operating cost honestly, visibly, and repeatedly across Moves, Source, Tower, and CXO primer material.
