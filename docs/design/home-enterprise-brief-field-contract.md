# Home Enterprise Brief — field contract & visual recommendations

This pins the redesigned "Home Enterprise Brief (offline)" template's view-model
to the governed Home Knowledge Pack tables, so the design's camelCase bindings
and the pack's snake_case columns stop being a moving target. It also records
what the generator now produces vs. what the design still needs, and gives
concrete visual/chart recommendations grounded in the data that actually exists.

Runtime contract, unchanged: Home renders an **approved, governed pack
deterministically**. No live Claude call on page load. Claude authors the pack
offline; the design reads it.

---

## 1. Binding → pack-column map

The design uses a per-tenant view-model (`ex`, `T`, dimensions, etc.). Every
field below is fed from a governed column. A thin view-model transform
(snake_case → camelCase) is expected and fine.

### Executive read (section 01) — `home_knowledge_executive_read` (one row/pack) — NOW GENERATED

| Design binding | Pack column | Shape |
|---|---|---|
| `ex.archetype` / `execArchetype` | `archetype` | text |
| `ex.oneSentence` / `execOne` | `one_sentence` | text |
| `ex.tensionHeadline` / `execTension` | `tension_headline` | text |
| `ex.strengths[]` / `execStrengths` | `strengths` | `[{ text, evidence_refs[] }]` |
| `ex.constraints[]` / `execConstraints` | `constraints` | `[{ text, evidence_refs[] }]` |
| `ex.forces[]` / `execForces` | `industry_forces` | `string[]` (ordered) |
| `ex.reality[]` / `execReality` | `tenant_reality` | `string[]` (ordered, paired 1:1 with forces) |
| `ex.horizons[]` / `execHorizons` | `horizons` | `[{ horizon, tone, items[] }]` |
| `execConfPct` | `context_confidence_pct` | int 0–100 |
| `execConfNote` | `context_confidence_note` | text |
| `dataFoundation` | `data_foundation_summary` | text |

### Load tier (section H / activation panel) — `home_knowledge_pack_tier` (one row/pack) — NOW GENERATED

| Design binding | Pack column |
|---|---|
| `tenantTierLabel` / `T.tier_label` | `tier_label` |
| `tierTitle` / `T.tier_title` | `tier_title` |
| `tierBody` / `T.tier_body` | `tier_body` |
| `tierConditions[]` / `T.tier_conditions` | `tier_conditions` (`[{ text }]`) |
| (thin/partial/rich gate) | `tier` (enum) |

### AI readiness (section 04) — `home_knowledge_ai_readiness` — NOW GENERATED

| Design binding | Pack column |
|---|---|
| `aiReadiness[].dim` / `ar.dim` | `readiness_dimension` |
| `aiReadiness[].pct` / `ar.fill` | `score_pct` (0–100) |
| `aiReadiness[].tone` | `tone` (red/amber/green) |
| `aiReadiness[].label` / `ar.label` | `label` |
| (tooltip / disclosure) | `basis` **(required — a score with no basis is dropped at generation)** |

### Per-dimension module implications (dimension detail) — `home_knowledge_dimension_module_implications` — NOW GENERATED

| Design binding | Pack column |
|---|---|
| `dimZeroModules[].t` / `m.t` (per dimension) | `implication`, keyed by `dimension_key` + `module` |

### Already covered by earlier schema (v2/v3)

| Design section | Pack source |
|---|---|
| `priorities[]` (06, ranked+weighted) | `home_knowledge_use_cases` (priority_rank, total_priority_score, name, desc) |
| `runDifferently` / current→future / `r.gate` (05) | `use_cases` operating_model_change / change_strategy / evidence_gate |
| `divisions[]` (02) | `home_knowledge_enterprise_model_items` (item_type=division) — v3 |
| `office` front/middle/back (03) | `enterprise_model_items` (office_segment) + `operating_model_items` — v3 |
| relationship map / `graphEl` (03) | `home_knowledge_relationship_nodes` / `_edges` |
| `coverage[]` (07) | `home_knowledge_dimensions` confidence_status / pct |
| `topSystems[]` (04) | apps dimension rows |
| dimension detail: `dimWhy`, `dimLead`, `dimRows`, evidence table, quotes, gaps | `home_knowledge_dimensions` + `_rows` + `_evidence_sources` + v3 visual_specs / relationship_explanations |

### Still not modeled (design binds it; nothing produces it yet)

- `constraints[].blocks` (06) — which use-case/dimension each enterprise constraint blocks. `strategic_narratives` (v3) has dependencies but not this explicit block-target edge. **Small follow-up.**
- Section-level stat cards (`s.v`/`s.l`, `ts.v`/`ts.l`) — the design wants *curated* exec stats, not raw counts. Some derive from dimension counts; the curated ones need a small `pack_stats` table or a JSONB field. **Decide per stat.**

---

## 2. What the generator now produces (proven)

Run offline via `build-home-knowledge-pack-v2.mjs --use-claude`. Cold-start
proof: SkyHarbor/Airline (no pre-authored narrative) produced, grounded in its
own loaded evidence:

- archetype "Global Passenger Airline + Cargo, Loyalty & MRO"
- one-sentence citing its real 613 systems / 2,278 relationships
- honest 42% context confidence
- strengths each carrying real source-file evidence refs (04_applications_systems.csv, 12_relationships.csv…)
- forces↔reality paired 6-and-6 ("AI-assisted IROPS recovery cockpits" ↔ "Candidate cockpit, no recovery baseline")
- tier = partial, "Broad inventory, thin proof"
- 5 AI-readiness scores (each with a stated basis) + 8 per-dimension module implications

Two grounding rules are enforced in **code**, not just the prompt: an
AI-readiness score with no `basis` is dropped; a strength must carry evidence.

Known source-data caveat: SkyHarbor's source pack labels all 8 use cases
identically ("AI opportunity"), so use-case *enrichment* can't map by name and
the build honestly warns `0/8` rather than fabricate a mapping. That is an
upstream source-data fix (real use-case names), not a generator bug.

---

## 3. Visual / chart recommendations for Claude Design

The design today hand-rolls: horizontal bars (AI readiness), a risk heatmap
(likelihood/impact/regulatory/trend), a relationship graph, and small
per-dimension charts — minimal SVG, no chart library. Recommendations, each
tied to data that now exists so nothing is a chart with no numbers behind it:

1. **Forces ↔ Reality: a paired "tension slope" chart, not two bullet lists.**
   `industry_forces[i]` and `tenant_reality[i]` are index-paired. Render each
   pair as a short left(industry)→right(tenant) connector with a gap indicator —
   the visual *is* the strategic tension. Far stronger than the current two
   stacked lists.

2. **AI readiness: keep the bars, add a certified-vs-target reference line.**
   `score_pct` + `tone` are real; add a faint target marker per bar so "52% and
   amber" reads as "building, short of the bar" at a glance. A radar is tempting
   but 4–6 unordered dimensions read more honestly as sorted bars.

3. **Context confidence: one gauge/meter, not a number in text.** `context_confidence_pct`
   is a single 0–100 — a compact arc gauge with the `context_confidence_note`
   as caption. Reuse the same meter for per-dimension `pct` in the coverage map.

4. **Coverage map (07): a small-multiples heat strip by dimension.** 19
   dimensions × confidence — a single-row heat strip (color = confidence_status)
   with counts on hover. Reads as "the honest map of confidence" in one glance.

5. **Relationship graph: this is the one place to use a real library.** The graph
   is 300–500 nodes / 280–340 edges per tenant — hand-rolled SVG will fight you.
   Use the React Flow + dagre pattern already in the repo (`HomeKnowledgeDesignContractSurface.tsx`),
   and **use short opaque node ids, never raw entity names** — raw names here
   already caused a zero-edges production bug (see that component's regression
   test). Color nodes by `node_type`, size by `size_score`, and let the graph
   *explain* dependency context — it must not compute any spend/value metric
   (that stays deterministic in Tower).

6. **Risk heatmap: keep it — it's the right form.** The existing likelihood/
   impact/regulatory/trend heatmap maps cleanly to the risks dimension. Just
   drive it from `home_knowledge_dimension_rows` (risks) + governance
   `metric_boundary`, not hardcoded rows.

7. **Trends — the honest gap.** The design (and your request) wants trends, but
   **the governed data has almost no time-series.** Per the corpus governance
   rule and this session's own "no false precision" finding, do **not** draw a
   trend line where there's a single planning-grade snapshot. Two honest
   substitutes: (a) the horizons object (`Act now → Build next → Prove later`)
   rendered as a **sequence/roadmap band**, which is a *time-ordered* visual
   backed by real data; (b) a maturity-progression marker (current tier →
   next tier) driven by `pack_tier` + `tier_conditions`. Save real trend lines
   for when Tower feeds actual period-over-period metrics in.

8. **Don't over-chart the executive read.** archetype / one-sentence / tension
   are prose thesis statements — they carry the page as *typography*, not charts.
   Resist turning them into visuals.

Palette/interaction: `tone` (red/amber/green) is a semantic status field on
readiness and risk — treat it as the status ramp, and keep it distinct from any
brand accent, so "amber" always means the same thing across readiness, risk, and
coverage.

---

## 4. Open decisions for you + Claude Design

- **`constraints[].blocks`** and **curated section stats** — model them (small
  schema add) or let the design derive them client-side? Recommend modeling
  `blocks` (it's a real evidenced edge), deriving raw stats.
- **AI readiness dimensions** — the generator currently lets Claude choose the
  4–6 readiness axes per tenant. If the design wants a *fixed* axis set (Data /
  Governance / Platform / Talent), say so and it becomes a closed enum.
- **Tenant tier thresholds** — the generator lets Claude judge thin/partial/rich
  from evidence depth. If you want a deterministic rule (e.g. % of dimensions
  source-backed), that can move to code and stop being a judgment call.

---

## 5. Exhibit data contract (from the 2026-07-22 design review)

The review's standard is right: **every chapter needs one signature exhibit that
makes a strategic argument impossible to miss**, and each chapter should read as a
single consulting slide. The risk that standard creates is exhibits outrunning
data — a beautiful chart with no numbers behind it. This maps each requested
signature exhibit to whether the pack can feed it today, so Design builds what's
ready now and we schedule a data pass for the rest. **Do not build an exhibit
marked GAP until its data lands — draw the honest zero-state instead.**

| Chapter | Signature exhibit | Data status | Feed |
|---|---|---|---|
| Strategic Agenda | Strategic-importance × execution-readiness portfolio (2×2) | **EXISTS** | `use_cases.value_score` (importance axis) × `readiness_score` (readiness axis); bubble = `total_priority_score`; color = `evidence_score`. Stop showing "weight 100"; show the four sub-scores + `priority_rationale`. |
| Change Thesis | Current→future operating-model swimlane | **EXISTS** | v3 `strategic_narratives` (narrative_type=new_way_of_operating): `current_state` → `target_state_or_relevance`, `dependencies`, `evidence_gate`. |
| Technology & Ecosystem | Applications-to-functions dependency matrix | **PARTIAL (buildable now)** | rows = apps `dimension_rows` (facet_1 business_function, facet_2 owner, status lifecycle/criticality); cell strength = `relationship_edges` where type=`uses_system`. Enough to build the matrix; a dedicated criticality weight is a nice-to-have, not a blocker. |
| Enterprise Model | Front/Middle/Back-office capability landscape | **PARTIAL** | v3 `enterprise_model_items` (office_segment + business_capability) exists; needs the capability↔function↔office linkage (see GAP-1) to become a true landscape rather than three lists. |
| Evidence & Trust | Evidence coverage × freshness × confidence heatmap | **PARTIAL** | `evidence_sources` has loaded_at (freshness), source_status, confidence, row_count. Missing the full loaded→parsed→indexed→cited→agent-ready pipeline (GAP-2). Build a coverage×confidence heatmap now; add the freshness/status axis after GAP-2. |
| Operating Model | Value-stream / process Sankey | **GAP-3** | v3 `operating_model_items` are flat (value_stream/process/handoff as items), not typed flow edges (from→to→magnitude). A Sankey needs real flow — do not fake it. Until GAP-3 lands, render the honest alternative: a left-to-right value-stream *band* (front→middle→back) from the office-segment data, no invented flow volumes. |

### Data GAPs to schedule (a coherent "v5" pass — I own these)

- **GAP-1 · capability↔function↔office linkage** — so the Enterprise Model exhibit is a landscape, not three lists. Add typed links between `enterprise_model_items` (capability) and (office_segment / function).
- **GAP-2 · evidence status pipeline** — extend `evidence_sources` with the governance-defined states (loaded / parsed / indexed / cited / agent_ready), conflicts, staleness, and downstream-decision-impact. This is what turns Evidence & Trust from six bars into a real evidence-governance workspace (review item #8), and it's already the governance model in AGENTS.md — the schema just needs to carry each state separately.
- **GAP-3 · value-stream flow edges** — typed from→to flow so the Operating Model Sankey has real magnitude behind it, or an explicit decision to keep the band form.
- **GAP-4 · interview-signal scales** (review #4) — emit per-signal `{ axis, scale_type, value, label }` with the CORRECT semantic ramp per axis: mentions = limited/repeated/dominant; urgency = low/moderate/immediate; alignment = fragmented/mixed/strong; sentiment = concerned/neutral/positive (**diverging**, not a maturity ramp). Today the design reuses nascent/developing/mature for all four, which is wrong for sentiment especially.
- **GAP-5 · graph projection modes + expanded node taxonomy** (review #9) — the graph is one 6-class overview. Add a `mode` tag to edges (enterprise-structure / operating-model / technology-dependency / change-impact / value-flow / evidence-lineage) and widen node types (capabilities, value streams, processes, roles, data domains, integrations, platforms, vendors, contracts, programs, use cases, metrics, controls, evidence, change theses). The selected-node drawer is already fed by v3 `relationship_explanations`. **Keep the short-opaque-id rule** — raw entity names as ids already caused a zero-edges production bug.
- **GAP-6 · dimension-specific collection routes** (review #10/#12) — add a `collection_route` to v3 `next_evidence_requests` so a zero-state gives the right route per dimension (capability→workshop, industry→governed corpus, decision-rights→DoA docs, process→workflow data, benefits→Tower metrics + finance attestation) instead of a generic "upload a client export". Also: industry movements should be primarily corpus-fed, not a tenant upload dimension.

### Already handled by this PR's generation (review #7, #5, partial #6)

- **Overclaim ban** — the generation prompt now forbids "proven" / "value is real" / "fully loaded" / "realized savings" / "achieved ROI" / "production-ready" as assertions, requires synthetic-scenario qualifiers, and forces the loaded-fact / derived-measure / industry-pattern / strategic-inference distinction. Design should mirror this in any static copy it authors.
- **Honest completeness state** (review #5) — `pack_tier.tier` + `executive_read.context_confidence_pct` + per-dimension `confidence_status` already give an honest "Rich context tier · 76% confidence · process/value evidence incomplete". Replace "RICH TIER · FULLY LOADED" with these. No data change needed — it's a wording/computation fix on the design side.
- **Ranking basis** (review #6) — `use_cases` already carries `value_score` / `readiness_score` / `evidence_score` / `dependency_risk_score` / `priority_rationale`. Map to Strategic importance / Execution readiness / Evidence strength / Dependency risk / Ranking basis. No data change.

### Pure-design items (no data dependency — Design owns fully)

Nav clipping at 1440px (Evidence & Trust truncation); the empty READ boxes on
Business Functions and Interview Signals; per-exhibit conclusion headline +
semantic legend + annotations + populated Read + evidence qualifier; dimension-
appropriate sub-tab labels (the raw fields to fill them already live in
`dimension_rows`). None of these need a pack change.
