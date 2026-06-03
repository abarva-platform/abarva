# Codex Brief — Moves Rate-Card: Research → Comprehensive Solution → Corpus

**Owner:** Anand · **Date:** 2026-06-03 · **Mode:** multi-agent, parallel where independent
**Inputs handed over (2 files):**
1. `Moves_Sourcing_Pricing_RateCards_v2.xlsx` — the canonical template (filled with placeholder rows).
2. `docs/build/MOVES_RATE_CARD_INGESTION_SPEC_2026-06-03.md` — the authoritative contract.

Read the spec first. The workbook conforms to it. Where they disagree, **the spec wins**.

---

## Mission

Stand up the **rate-card capability** end-to-end so a client can upload internal + vendor rate cards
and the Moves estimator produces credible **insource / outsource / hybrid** cost estimates by
function × level × geography. Two tracks: **Research** (real numbers) and **Build** (code + corpus).
They are independent until integration — run them in parallel.

---

## TRACK A — Research (produce real, cited rates)

Goal: replace every placeholder/`RESEARCH NEEDED` cell with a **real, sourced, dated** value. Deliver
both the filled workbook **and** a machine-readable seed (`docs/enterprise-context/rate-cards/seed.json`)
matching the spec's column contract.

A1. **Internal LCR (national baseline)** — fully-loaded annual comp by `function_group × role_level`
across the spec's functions (Digital, Full-Stack, Data/Analytics, Legacy/Mainframe, EPIC/Clarity,
ERP, Infra/Cloud, PMO, Security, Integration). Base + a `benefits_overhead_pct` typical for US
enterprise (cite). Provide low/high; engine takes midpoint.

A2. **Geo modifier index** — multiplier vs National Baseline for the listed metros (NJ, NYC, Bay
Area, Chicago, Austin, Dallas/Houston, Miami, Raleigh, Atlanta, Cleveland/Columbus) + Offshore/India.
Cite sources (cost-of-labor / COL indices). National Baseline = 1.00 by definition.

A3. **Vendor / SI benchmarks** — hourly **bill** rates (low/high) by `vendor_tier × functional_tower
× role_level × sourcing_location`. Tiers: Big 4 Advisory (EY/KPMG/PwC/Deloitte advisory), SI Tier-1
Onshore (Accenture/Deloitte delivery), SI Tier-1 Offshore (TCS/Infosys/Wipro/Cognizant/HCL), Boutique.
**Populate the SAME role/level across tiers** so role-constant comparisons are valid (spec §5).

A4. Every row: `source`, `as_of`, `confidence`. **No fabricated numbers** — if a cell can't be
sourced, leave it flagged, don't invent. Cross-check against the existing researched benchmark in
`src/lib/programs/expert-kernel/rate-card/benchmark-rate-card.ts` and reconcile material deltas.

**Track A acceptance:** filled workbook + `seed.json`; ≥90% of cells sourced+dated; a short
`RESEARCH_NOTES.md` listing sources, method, and any cells left as gaps.

---

## TRACK B — Build (corpus + estimator + surface)

Wire targets (verified to exist):
- Corpus segments: `src/lib/admin/setup-acts-registry.ts` (`SEGMENT_KEYS`) · enterprise workbooks:
  `src/lib/enterprise-context/template-schema.ts` · context templates:
  `src/lib/context-ingestion/template-registry.ts`
- Ingestion broker: `src/lib/admin/setup-data-broker.ts` (tables `data_inventory_segments`,
  `data_inventory_audit_log`, `data_ingestion_runs`)
- Estimator: `src/lib/programs/expert-kernel/effort-estimator.ts` (`resolveRateCard`, `RoleRateCard`,
  `KernelRateCard`), `rate-card/derived-planning-rate-card.ts` (`RateCardSource`),
  `rate-card/comprehensive-rate-card.ts`
- Data Loads surface (recently rebuilt): `src/components/admin/SetupDataLoadCenter.tsx`,
  `src/lib/admin/setup-load-studio-view.ts`, page `src/app/(maestro)/admin/setup/page.tsx`
- Source/negotiation consumers: `src/lib/source/pricing-normalization-model.ts`,
  `src/lib/source/stage-packs/S5_bafo.ts`

B1. **Schema + migration** — add the three objects from spec §1 (`rate_card_internal`,
`rate_card_vendor`, `geo_modifier`) as tenant-scoped tables/segments with RLS. Use the
`npm run db:migrate` runner; **do not** hand-apply or mutate prod. Confirm segment-id allocation.

B2. **Template registration** — add the two upload templates to the registry + enterprise workbook
schema so they appear in `/admin/templates` and validate on upload. Columns exactly per spec §1.

B3. **Ingestion parser + validator** — parse the workbook/CSV, run spec §4 validation, and
**compute** the derived columns server-side per spec §2 (never trust uploaded formula cells).
Quarantine restricted data. Surface rejects in the Data Loads validation step.

B4. **Estimator binding** — extend `RoleRateCard`/`KernelRateCard` with the `geo`, `function_group`,
and `role_level` dimensions; implement geo localization (spec §3); make `client_specific` /
`comprehensive` read the committed corpus rows with researched-benchmark fallback + provenance.

B5. **Sourcing-comparison output** — implement the role-constant comparison contract (spec §5):
insource / outsource-onshore / outsource-offshore / hybrid, with governance overhead and "planning
range, not a quote" labelling. Expose it where Moves builds the business case
(`src/lib/programs/move-business-case.ts`) and make it consumable by the Source/BAFO normalizer.

B6. **Tests** — pure unit tests for compute rules (midpoint/loaded/geo/annual + hybrid blend),
validation rejects, provenance/fallback, and tenant isolation. Honest empty-state test (no rows →
benchmark fallback, never fabricated).

B7. **Release record** under `docs/releases/records/` + `npm run release:check`.

**Track B acceptance:** upload the filled v2 workbook for a test tenant → commits → estimator
produces a role-constant insource/outsource/hybrid comparison from real rates; absent rows fall back
to benchmark with provenance; eslint + tsc + targeted jest green; tenant isolation proven.

---

## Guardrails (non-negotiable)

- **Build for pilot, not demo:** no fabricated numbers; honest empty states; provenance on every
  figure (`feedback_no_demo_thinking`).
- **Azure/Postgres data plane only** (DATABASE_URL); no new Supabase runtime deps.
- **Broker boundary:** app tier reads rate cards via a typed broker, never the substrate directly
  (`feedback_broker_boundary`).
- **No prod DB mutation** outside the migrate/seed runners; typecheck-clean commits.
- **Tenant isolation:** rate cards never cross tenants; geo + researched benchmark are the only
  shared fallbacks.
- Every researched number carries source + as-of + confidence.

## Suggested agent split (parallel)
`research-internal-lcr` · `research-geo-index` · `research-vendor-benchmarks` (Track A, independent)
‖ `schema+ingestion` · `estimator-binding` · `sourcing-comparison+tests` (Track B). Integrate +
release last.
