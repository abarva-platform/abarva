# Moves — Rate-Card Corpus Ingestion Spec (v1, 2026-06-03)

Canonical contract for the **Sourcing & Pricing Rate Cards** the client uploads through Data Loads
and that the Moves estimator consumes. The companion workbook
`Moves_Sourcing_Pricing_RateCards_v2.xlsx` is the human-facing template; **this spec is
authoritative** — where the two disagree, the spec wins.

---

## 0. Why this exists

Today the Moves estimator (`src/lib/programs/expert-kernel/**`) ships a *researched benchmark*
rate card (SI tier × location × specialization) and already supports a client override
(`RateCardSource = researched_benchmark | client_specific | comprehensive` in
`rate-card/derived-planning-rate-card.ts`). What is **missing** is the corpus intake: a
tenant-scoped place for the client's own **internal loaded cost rates** and **vendor/SI rates**,
plus the **state/city geography** dimension. This spec defines that intake and how it binds to the
estimator. No fabricated numbers — honest empty states + provenance, per
`feedback_no_demo_thinking`.

---

## 1. Objects (corpus)

Three tenant-scoped tables, committed via the governed Data Loads flow
(`src/lib/admin/setup-data-broker.ts` → `data_inventory_segments` family). Recommend a new segment
family **`resource_rate_card`** (internal) + **`vendor_rate_card`** (vendor) + a tenant-agnostic
**`geo_modifier`** reference (seedable centrally, client-overridable). Codex to confirm the exact
segment-id allocation against `src/lib/admin/setup-acts-registry.ts` (`SEGMENT_KEYS`).

### 1.1 `rate_card_internal` — in-house fully-loaded rates (NATIONAL base)
| Column | Type | Required | Notes |
|---|---|---|---|
| function_group | enum | yes | Digital, Full-Stack Dev, Data/Analytics, Legacy/Mainframe, EPIC/Clarity, ERP, Infra/Cloud, PMO, Security, Integration |
| specialization | string | yes | free text (e.g. "Data Engineer (Spark/Python)") |
| role_level | enum | yes | Junior, Mid-Level, Senior, Lead/Architect |
| base_annual_low_usd | number | yes | **national baseline**, not local |
| base_annual_high_usd | number | yes | ≥ low |
| benefits_overhead_pct | number(0..1) | yes | e.g. 0.28 |
| source | string | yes | citation/system of record |
| as_of | date | yes | research/effective date |
| confidence | enum | yes | low / medium / high |

> **Geo is NOT stored per row.** The national base is localized at estimate time (§3).

### 1.2 `rate_card_vendor` — external SI/vendor hourly rates
| Column | Type | Required | Notes |
|---|---|---|---|
| vendor_tier | enum | yes | Big 4 Advisory, SI Tier-1 (Onshore), SI Tier-1 (Offshore), Boutique Specialist, Custom Vendor |
| named_vendor | string | no | Deloitte, TCS, … (optional) |
| functional_tower | enum | yes | same vocab as function_group |
| role_level | enum | yes | Junior … Lead/Architect |
| sourcing_location | enum | yes | Onshore, Nearshore, Offshore |
| hourly_low_usd | number | yes | contracted/quoted **bill** rate (already includes vendor margin+overhead) |
| hourly_high_usd | number | yes | ≥ low |
| source / as_of / confidence | — | yes | as above |

### 1.3 `geo_modifier` — locale scaling (reference; seed centrally, client-overridable)
| Column | Type | Required | Notes |
|---|---|---|---|
| region | string | yes | "National Baseline" (=1.00), "NJ (Newark/NYC Metro)", "Offshore / India Baseline", … |
| geo_index | number(>0) | yes | multiplier vs national |
| source / as_of / confidence | — | yes | |

### 1.4 Constants
`annual_billable_hours = 1880` · `vendor_governance_overhead_default = 0.12`. Stored as named
config, overridable per estimate.

---

## 2. Server-side compute rules (NEVER trust uploaded formula cells)

The workbook shows grey "midpoint/loaded/annual" columns as a **preview only**. On ingest the engine
**recomputes** them deterministically from the white input cells. Headless/CSV ingest cannot
evaluate Excel formulas, and auditable math must live in code.

```
internal_national_midpoint      = avg(base_annual_low, base_annual_high)
internal_loaded_national_mid    = internal_national_midpoint * (1 + benefits_overhead_pct)
internal_localized_annual(geo)  = internal_loaded_national_mid * geo_index[target_region]

vendor_hourly_midpoint          = avg(hourly_low, hourly_high)
vendor_annual_equivalent        = vendor_hourly_midpoint * annual_billable_hours
vendor_cost_to_client(gov)      = vendor_annual_equivalent * (1 + governance_overhead)
```

**Midpoint is the planning value** (matches the existing kernel convention in
`derived-planning-rate-card.ts`). Low/high are retained for range display + sensitivity.

---

## 3. Estimator binding

1. On commit, the two cards become tenant-scoped corpus rows.
2. The estimator resolves rates via `resolveRateCard` (`effort-estimator.ts`):
   - internal rows → **`client_specific`** (override the benchmark for this tenant);
   - vendor rows + internal rows + benchmark fallback → **`comprehensive`** blend.
3. **Geo localization** applies `geo_index[target_region]` to the loaded national midpoint at
   estimate time (so one national row serves every locale; no double-count).
4. Where the client has **not** supplied a row, fall back to the researched benchmark and **label
   provenance** ("AbarVa benchmark — upload your rate card to sharpen"). Never silently fabricate.

---

## 4. Validation (ingest gate)

Reject/flag a row when: low > high; benefits ∉ [0,1]; geo_index ≤ 0; enum value off-list; missing
`source`/`as_of` (→ force `confidence=low` + warn); negative or zero rates. Quarantine on any
restricted-data detection (PHI/PII) per existing upload guard. All rejections surfaced in the Data
Loads validation step, not silently dropped.

---

## 5. Sourcing-comparison output contract (role-constant)

A comparison MUST fix `function_group + specialization + role_level` and vary only the sourcing
mode. For the reference role, emit:

| Option | Formula |
|---|---|
| 100% Insourced (locale) | `internal_localized_annual(target_region)` |
| 100% Outsourced — Onshore (tier) | `vendor_cost_to_client(onshore row, gov)` |
| 100% Outsourced — Offshore (tier) | `vendor_cost_to_client(offshore row, gov)` |
| Hybrid (x% local / y% offshore) | `insourced*x + offshore*y` (x+y=1) |

Each line carries provenance + confidence + "planning range, not a quote." Onshore/offshore vendor
rows for the comparison **must be the same role/level** (else mark RESEARCH NEEDED). This is the
surface the Source/BAFO flow (`pricing-normalization-model.ts`, `S5_bafo.ts`) can consume for
negotiation.

---

## 6. Governance / non-negotiables

- **Tenant isolation:** rate cards are per-tenant; never priced against another tenant's data
  (broker boundary, `feedback_broker_boundary`). The shared `geo_modifier` + researched benchmark
  are the only common fallbacks.
- **Versioned + audited:** updates ride the Data Loads commit (re-upload supersedes; audit-log
  records who/what/when). Inline cell-editing is a later phase (SME write perms).
- **Honesty:** every estimate states its rate provenance; absent data → benchmark fallback labelled
  as such; no invented numbers.
