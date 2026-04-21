# Keystone Intelligence Layer · Validation Results

Validation run for the north-star schema + Keystone overlay implementation on `codex/intelligence-layer-keystone`.

## Schema migration results

- Applied migration: `supabase/migrations/20260421152500_intelligence_layer_core.sql`
- New tables added:
  - `access_scopes`
  - `benchmark_cohorts`
  - `external_sources`
  - `external_events`
  - `evidence`
  - `kpis`
  - `pattern_packs`
  - `telemetry_sources`
- Existing tenant behavior preserved:
  - Apex, Meridian, First Capital seed-wave verification still passed
  - Apex, Meridian, First Capital seed-wave smoke checks still passed
  - Benchmark compatibility pattern preserved: benchmark details remain in `org_master_data.benchmark_data`

## Base seed ingestion results

Raw output from `npm run db:seed:wave -- --tenant keystone`:

```text
Keystone Energy Holdings
  client row     · 63931f84-4fc8-4d13-baac-aa16b035bff2 (Keystone Energy Holdings / Keystone Energy Holdings, Inc.)
  people         · 41
  vip profiles   · 12
  initiatives    · 21
  patterns       · 7
  benchmarks     · 0
  prior programs · 2
  knowledge rows · 50
```

## Intelligence overlay ingestion results

Raw output from `npm run db:seed:keystone-intelligence`:

```text
Keystone intelligence layer seeded
  access scopes      · 31
  benchmark cohorts  · 3
  external sources   · 8
  external events    · 6
  kpis               · 41
  pattern packs      · 7
  telemetry sources  · 9
  evidence           · 63
```

## Verification results

Raw output from `npm run db:verify:keystone-intelligence`:

```text
Keystone intelligence layer verification
  PASS · access scopes >= 6 · 31
  PASS · benchmark cohorts >= 3 · 3
  PASS · external sources >= 8 · 8
  PASS · external events >= 6 · 6
  PASS · kpis >= 35 (current overlay enumerates 41) · 41
  PASS · pattern packs = 7 · 7
  PASS · telemetry sources = 9 · 9
  PASS · evidence >= 57 · 63
  PASS · kpis all scoped · 0
  PASS · patterns all scoped · 0
  PASS · telemetry all scoped · 0
```

## Smoke test results

Raw output from `npm run db:smoke:keystone-intelligence`:

```text
Q: What is Keystone's current SAIDI?
A: SAIDI (System Average Interruption Duration Index): 108 minutes as of 2025-12-31; target 95 minutes; benchmark median 130.
PASS: yes

Q: Who owns the interconnection queue duration metric?
A: James Oppenheim owns Interconnection Queue Duration; role SVP Transmission; current 18 months.
PASS: yes

Q: How does Keystone compare on allowed ROE vs peers?
A: Allowed ROE Weighted Average: current 9.5% vs peer median 9.6% ; Subsidiary range: 9.25% (MD) to 10.10% (PA)
PASS: yes

Q: What KPIs does the Shadow AI pattern degrade?
A: Shadow AI in Customer Operations and Grid Analytics: degrades AI Governance Maturity Score, Cybersecurity Maturity Score, First Call Resolution Rate, Customer Complaint Rate per 1,000 Customers.
PASS: yes

Q: What patterns are active at Keystone?
A: Shadow AI in Customer Operations and Grid Analytics: 11 tools, $1.6M annualized, 17 teams, 7/11 with auto-renewal, 4/11 with unreviewed data sharing (NERC CIP implications) | AMI Data Underutilization: 18 TB annual AMI data · 12% utilization · 34 use cases identified, 7 production, 11 piloted, 16 unimplemented · AMI 2.0 will multiply data volume 4-6x | Data Center Load Interconnection Queue Bottleneck: 32 GW pending (from 14 GW in early 2024) · 18-month study duration vs 9-month target · $1.4B delayed revenue · $340M accelerated transmission investment · 4-6% projected residential rate increase if not large-load-allocated | Storm Response Coordination Fragmentation: Dec 2024 ice storm after-action: 14 inter-company handoffs · 34-minute average notification lag · 7 recurring coordination failure modes · 4 distinct OMS platforms across 6 subsidiaries | Grid Modernization Capital vs Rate Recovery Gap: $1.8B deployed capital in regulatory lag · $92M annualized cost of carry · credit agency commentary on deployment pace · four concurrent rate cases with expected outcomes Q2-Q4 2026 | Cross-Jurisdictional Regulatory Coordination Gap: 5 state PUCs + DC PSC + FERC + NERC + PJM · ROE range 9.25% (MD) to 10.10% (PA) · subsidiary-level regulatory teams with limited enterprise coordination · four concurrent rate cases | Workforce Attrition in Specialized Grid Operations: 27% transmission engineering turnover vs 14% target · 43% of departures in 8-15 year band · 58% moving to renewable developers/IPPs · 18-month replacement time
PASS: yes

Q: What interventions apply to the Data Center Load Interconnection pattern?
A: Data Center Load Interconnection Queue Bottleneck: Study process modernization and engineering capacity expansion
- Large-load tariff filings across jurisdictions
- Co-location and flexible load arrangements
- Transmission expansion capital plan recalibration
- Engagement with FERC/PJM on large-load rulemaking. Sponsor: Chief Regulatory Officer, Chief Customer and Technology Officer, or CEO · enterprise scope · high political capital · extensive time commitment
PASS: yes

Q: What Phase 2 deliverables does Storm Response Coordination pattern require?
A: Storm Response Coordination Fragmentation Phase 2: Platform options (unified new build, orchestration layer over existing | OMS rationalization) | AI prediction capability assessment | workflow modernization options
PASS: yes

Q: What operational telemetry sources are registered?
A: CFO Scorecard Power BI Dashboard (api) | Enterprise PMO Initiative Tracker (api) | Customer Operations Dashboard Suite (api) | Reliability Performance Dashboard (api) | Safety Performance Dashboard (api) | Regulatory Proceedings Tracker (api) | Workforce Analytics Dashboard (api) | Weekly Business Review Deck (export) | Technology Investment and Architecture Tracker (share_link)
PASS: yes

Q: Can a Customer Experience program maestro see the CFO scorecard?
A: CFO Scorecard reasoning scope keystone_scope_finance_transformation_program_executive_advisory_program; disclosure scope keystone_scope_finance_transformation_full_executive_advisory_full_others_reasoning_only_specific_values_; disclosure notes Disclosure scope:** Finance Transformation (full) · Executive Advisory (full) · others (reasoning-only; specific values never disclosed)
PASS: yes

Q: What's the NERC CIP-sensitive data handling?
A: Reliability dashboard compliance NERC CIP (critical infrastructure — partitioned access), state PUC reporting obligations; disclosure notes Disclosure scope:** Operational Excellence programs (aggregate full; specific substation reasoning-only due to NERC CIP) · Storm Response (relevant subset) · Executive Advisory (aggregate) · others (public-level metrics only)
PASS: yes

Q: Should Keystone prioritize billing system consolidation or digital self-service portal?
A: Digital self-service is the faster Phase 1 move: adoption sits at 47% vs target 68%. Bill accuracy is already 99.2%, so billing consolidation matters but is less urgent as the immediate customer-impact lever. Capital sequencing is constrained by active rate cases and CFO-scored investment envelope, so billing consolidation likely wants a scoped Phase 2 behind the portal push.
PASS: yes

Q: What's changed at Keystone this quarter?
A: 2026-04-10: Shadow AI governance exposure surfaced across 17 teams | 2026-04-01: Four active rate cases entered peak decision cycle | 2026-03-31: Grid modernization capital plan at 22% of full-year pace through Q1 | 2026-03-15: Illinois large-load tariff filing submitted | 2026-02-01: Jonathan Aldridge appointed EVP and Chief Customer and Technology Officer
PASS: yes
```

## Preservation checks

Raw output from `npm run db:verify:wave`:

```text
Apex Retail Group
  vip profiles resolved  · 14
  initiatives w sponsor  · 11
  patterns w evidence    · 7
  benchmark rows sourced · 0
  categories present     · 11

Meridian Health System
  vip profiles resolved  · 10
  initiatives w sponsor  · 9
  patterns w evidence    · 7
  benchmark rows sourced · 0
  categories present     · 11

First Capital Financial
  vip profiles resolved  · 13
  initiatives w sponsor  · 10
  patterns w evidence    · 7
  benchmark rows sourced · 0
  categories present     · 11

Keystone Energy Holdings
  vip profiles resolved  · 12
  initiatives w sponsor  · 21
  patterns w evidence    · 7
  benchmark rows sourced · 0
  categories present     · 14

Seed wave verification passed.
```

Raw output from `npm run db:smoke:wave` ended with:

```text
Seed wave smoke checks passed.
```

## Caveats and deferred work

1. KPI count mismatch inside the overlay spec:
   - Overlay prose says "35 first-class KPI objects"
   - Enumerated Part 2 KPI blocks currently define 41 distinct KPI entries
   - The ingestion pipeline honors the enumerated blocks, so 41 KPIs were seeded

2. Initiative count mismatch inside the base seed:
   - Base seed prose says "all 22 active initiatives"
   - Part 6 currently contains 21 `**Initiative ...**` blocks
   - The ingestion pipeline honors the authored initiative blocks, so 21 initiatives were seeded

3. Benchmark compatibility rule preserved:
   - `benchmark_history` remains unused for this composite wave
   - Benchmark detail continues to live in `org_master_data.benchmark_data` per the established PR #22 compatibility constraint

4. Build note for this worktree:
   - `next build` under Turbopack failed because the temporary worktree uses a symlinked `node_modules`
   - `next build --webpack` succeeded cleanly
