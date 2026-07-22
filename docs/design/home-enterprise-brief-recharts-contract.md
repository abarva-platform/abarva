# Home Enterprise Brief — Recharts exhibit data contract (FINAL design)

**This is the design contract.** Source of truth: `Home Enterprise Brief
(offline).html` (the Recharts/D3 final). Every chart below is replicated
faithfully against **real governed pack data** — the frontend Recharts
components aggregate already-populated `home_knowledge_*` rows at render time;
they do not receive fabricated numbers. Two residual axes (noted at the end)
have no source and must be derived-or-dropped, never invented.

Companion: `home-enterprise-brief-field-contract.md` (prose bindings + tier
model). This doc is charts only.

Runtime rule unchanged: Home renders an approved governed pack deterministically;
no live model call on page load.

---

## Chart-by-chart contract

Colors reference the design's `CHART.*` tokens (slate / blue / amber / red /
green). Every exhibit ships: conclusion headline, scope/evidence subtitle,
semantic legend, 2–3 annotations, a populated Read, an evidence qualifier.

### 1. Strategic Agenda — `ScatterChart` (importance × readiness 2×2) — ✅ EXISTS
- **Recharts:** `ScatterChart` + `XAxis`(readiness) `YAxis`(importance) `ZAxis`(leverage→bubble) `Scatter` `Cell` `Tooltip` `ReferenceLine`(mid-lines) `ResponsiveContainer`.
- **Data shape:** `[{ name, x, y, z, evidenceColor }]`.
- **Pack feed:** `home_knowledge_use_cases` — `x = readiness_score`, `y = value_score`, `z = total_priority_score` (bubble), `evidenceColor` from `evidence_score` band (source-backed / partial / thin). Quadrant labels from the two axes.
- **Copy (already in design, keep):** "Ranking is judgment-based and approved — not a single computed weight." Show the four sub-scores + `priority_rationale` on hover, never a raw "weight 100".

### 2. Economics — `Waterfall` (budget composition) — ✅ GROUNDABLE (tenant-conditional)
- **Recharts:** stacked `BarChart` with an invisible `base` series + visible `delta` series (standard Recharts waterfall), `Cell` per bar, `Tooltip`, `ReferenceLine` at total.
- **Data shape:** `[{ name, base, delta, __color }]` (running cumulative).
- **Pack feed:** budget `home_knowledge_dimension_rows` where `amount_usd` is present (Meridian) — group by spend category (Run & sustain / Clinical systems / Data & analytics / Security & risk / Change portfolio), accumulate `base`+`delta`. **Spend composition only.** Do NOT waterfall `realized_value_usd` — governance forbids realized-value claims; that stays a hypothesis-status view.
- **Zero-state:** tenants without `amount_usd` (SkyHarbor: budget rows are `spend_category`+`calculation_basis`, FACTS says "Technology budget: Needs validation") render the honest "budget evidence required" panel, not a fabricated waterfall.

### 3. Technology & Ecosystem — `Landscape` (function × criticality stacked bars) — ✅ GROUNDABLE
- **Recharts:** horizontal stacked `BarChart` per function group; `Bar` per criticality tier; `Cell`; `Legend` (Mission-critical / Business-critical / Supporting); `Tooltip`.
- **Data shape:** `{ max, legend:[{label,color}], rows:[{ label, total, segs:[{label, v, color}] }] }`.
- **Pack feed:** apps `home_knowledge_dimension_rows` — group by `facet_1` (business_function) → `rows[].label`; within each, count by `criticality` (critical→Mission-critical, high→Business-critical, else Supporting) → `segs[].v`. All real counts.
- **Office label (front/middle/back):** a *display grouping* over the function rows, not a data source. It is a **derived classification** (industry-standard office taxonomy), tenant-to-confirm — label it as derived, never as a loaded fact. The chart's numbers are real regardless of the office banding. (Optional: a small deterministic function→office map can drive the banding; see field-contract §6.)

### 4. Risks & Controls — `Heatmap` — ✅ GROUNDABLE
- **Recharts:** grid via `BarChart`/custom cells or `ScatterChart` with `Cell` color-by-value; `Tooltip`; discrete 1–3 legend.
- **Data shape:** `{ cols:[{k,label}], rows:[{ label, vals:{k:1..3} }] }`.
- **Pack feed:** risks `home_knowledge_dimension_rows` — `rows[].label` = risk/gap title; `vals` from severity + governance `metric_boundary` (map High/Med/Low → 1..3 per column). Columns Likelihood / Impact / Regulatory / Trend where the source supplies them; otherwise fewer columns, honestly.

### 5. Per-dimension — `Bar` ×4 — ✅ GROUNDABLE
- **Recharts:** `BarChart` + `Bar` (+ `Cell` for per-bar color), `XAxis`(xKey), `YAxis`, `Tooltip`, `CartesianGrid`, `ResponsiveContainer`. One variant uses `angle` ticks + money formatting.
- **Data shape:** `{ xKey, height, bars:[{key, color}], data:[{...}] }`.
- **Pack feed:** the dimension's `home_knowledge_dimension_rows` aggregated by `facet_1`/`facet_2` (categorical counts) or `display_payload` numeric fields where present. Deterministic; no model needed.

### 6. Evidence & Trust — `Heatmap` (coverage × confidence) — 🟡 PARTIAL
- **Data shape:** `{ caption, cols, rows:[{label, vals}] }`.
- **Pack feed NOW:** `home_knowledge_evidence_sources` — rows by dimension, `vals` from `confidence` + `row_count` coverage. Build coverage × confidence today.
- **GAP (do not fake):** the freshness / loaded→parsed→indexed→cited→agent-ready axis is owned by `src/lib/governance/context-corpus-policy.ts` (`index_state`, `agent_readiness_status`, `indexed_at`, `cited_render_verified_at`). Home should READ those governed states when wired, not invent them. Until then, omit that axis.

### 7. Interview Signals — `Heatmap` — 🟡 PARTIAL (one real axis, three to derive-or-drop)
- **Data shape:** `{ legendItems, caption, cols:[Mentions,Urgency,Alignment,Sentiment], rows:[{label, vals}] }`.
- **Pack feed NOW:** **Mentions** is honestly derivable — count interview quotes per theme/role from the SIGNALS/interview evidence (a real frequency). Legend: Limited / Repeated / Dominant.
- **GAP (do not fake):** **Urgency, Alignment, Sentiment** have NO source scores (SIGNALS is free-text `{role,quote}` or `{title,body}`). Two honest options: (a) a scored generation pass that emits a value **with a stated basis per cell** (same discipline as ai_readiness — no score without a basis), or (b) drop those three columns and show the Mentions frequency + the quotes. **Never** reuse the maturity ramp (nascent/developing/mature) for sentiment; sentiment needs a diverging scale (Concerned / Neutral / Positive) and must not be manufactured from prose without a basis.

### 8. Relationship graph — (not Recharts; keep the existing graph)
- Fed by `home_knowledge_relationship_nodes`/`_edges`. Keep **short opaque node ids** (raw entity names as ids caused a zero-edges production bug). Recharts is not the tool here — the existing graph component stands.

---

## What "true to the design" requires from the data side

- **5 of 7 Recharts exhibits (1–5) are fully feedable from data the pack already
  ships** — the frontend aggregates `dimension_rows` (`amount_usd`,
  `business_function`, `criticality`, `severity`) and `use_cases` scores directly.
  No new schema, no generation, no fabrication.
- **2 exhibits (6, 7) are partial** — build the real axis now (evidence
  confidence; signal Mentions-frequency), and treat the residual axes (evidence
  freshness/pipeline; signal urgency/alignment/sentiment) as derive-with-basis or
  drop, never invent. The evidence pipeline is a governance read, not a generator
  output.
- **Correction to the earlier groundability audit:** the "office capability
  landscape" was previously flagged NOT-GROUNDABLE. That was wrong — the *chart's
  data* is function×criticality counts, which exist. Only the front/middle/back
  *label* is a derived classification (industry taxonomy, tenant-to-confirm), not
  a data gap. Budget waterfall was also under-called: Meridian has `amount_usd`,
  so it grounds (spend composition, not realized value).

## Faithful-replication checklist (per chart)

1. Recharts component set as specified above (no substituting a different chart).
2. Data aggregated from the named pack field — verify the numbers trace to
   `dimension_rows`/`use_cases`/`evidence_sources`, not hardcoded sample data.
3. Every chart carries: headline, scope/evidence subtitle, semantic legend, 2–3
   annotations, populated Read, evidence qualifier.
4. Tenant-conditional charts (waterfall) render the honest zero-state where the
   feeding field is absent — never a fabricated chart.
5. No manufactured scores on the two residual axes (evidence pipeline; signal
   subjective axes) — derive-with-basis or omit.
6. Theme-aware colors from `CHART.*`; semantic status ramp (red/amber/green)
   distinct from brand accent.
