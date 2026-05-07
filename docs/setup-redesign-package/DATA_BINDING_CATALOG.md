# Data Binding Catalog — Setup Redesign Package
## Every block · every field · every fallback

| | |
|---|---|
| **Doc ID** | `DATA_BINDING_CATALOG_2026-05-07` |
| **Audience** | Claude Code session implementing the Setup redesign |
| **Authority** | This catalog is authoritative for data binding. If reality differs, log spec drift and proceed with best judgment. |
| **Companion** | `WIREFRAME_REFERENCE.html` is authoritative for layout. |

---

## §0 · How to read this catalog

For each block on each panel, this catalog specifies:

1. **What the block shows** — user-facing content
2. **Data source** — substrate table(s), columns, computation
3. **Fallback behavior** — what renders if substrate is incomplete
4. **Refresh strategy** — page-load / cached / live
5. **State variations** — empty / partial / mature

If a binding cannot be satisfied (substrate field missing, computation impossible), use the fallback and log the gap to `SUBSTRATE_GAP_REGISTER.md`.

**Common substrate references:**
- `tenants` — tenant table; `display_name`, `slug`, `tenant_id`
- `data_inventory_segments` — the 23-segment inventory; `segment_id`, `segment_name`, `family_number`, `family_name`, `record_count`, `loaded_at`, `last_reviewed_at`, `coverage_pct`, `health_status`
- `data_inventory_records` — partitioned by segment; the actual loaded records
- `tenant_expected_baselines` — what's expected per tenant per segment (drives "expected vs actual")
- `agent_capability_assessments` — per-agent per-segment capability ratings (DOES THIS EXIST? — see §X gap)
- Steward, Sentinel, Atlas, Nexus agent definitions and prompts (in code, not substrate)

**Tenant resolution** — every binding assumes the canonical tenant resolution per the fix shipped in Setup Fix Package PR 2. Use the same path Overview uses; do not reinvent.

---

## §1 · Panel 1: Overview (PR A)

### Block 1.1 — Status header (single line)

**Shows:**
> [Tenant display name] · Setup readiness: [%] · Agents at [partial/decision-grade] · [N] of 6 capability tracks blocked

**Data source:**
- Tenant display name: `tenants.display_name` for current session tenant
- Setup readiness %: computed as `(decision-grade segments + 0.5 * partial segments) / 14 * 100`, rounded to integer. Read `health_status` from `data_inventory_segments` filtered by current tenant.
- Agents at [level]: derived from average capability assessment across 4 agents. Mapping: avg ≥ 0.75 = "decision-grade", 0.5–0.75 = "partial", <0.5 = "thin", 0 = "blank".
- N of 6 capability tracks blocked: count capability columns in the matrix where ALL 14 segments are empty or thin. (Capability columns are: Cite evidence, Model run-rate, Detect risk, Synthesize cross-program, Advance lifecycle, Audit / govern.)

**Fallback:**
- If `agent_capability_assessments` table doesn't exist, derive readiness from segment health alone. State "agents at [level]" using the same readiness % thresholds as a proxy. Log substrate gap.
- If readiness % can't be computed (no segments loaded), show "Setup readiness: starting · 6 of 6 capability tracks blocked".

**Refresh:** page-load.

**State variations:**
- Empty: "First Capital Financial · Setup readiness: starting · agents not yet active · 6 of 6 capability tracks blocked"
- Partial: "First Capital Financial · Setup readiness: 42% · agents at partial · 4 of 6 capability tracks blocked"
- Mature: "First Capital Financial · Setup readiness: 87% · agents at decision-grade · 0 of 6 capability tracks blocked"

---

### Block 1.2 — Steward orientation (3 sentences max)

**Shows:**
A 3-sentence Steward narrative, anchored to current loaded data. Sentence 1 names the tenant in plain terms. Sentence 2 names what's loaded vs. missing in plain categories (not segment numbers). Sentence 3 names the single highest-impact next load with consequence.

Below the narrative: two CTAs — "Go to Data Trust →" and "Go to Agent Readiness →".

**Data source:**
- Tenant context: `tenants.display_name`, `tenants.industry_classification` (e.g., "regulated financial-services")
- What's loaded: query `data_inventory_segments` for current tenant where `health_status IN ('decision-grade', 'usable evidence', 'partial')`. Group by `family_name`. Generate plain-language summary.
- What's missing: query same table where `health_status IN ('empty', 'thin')`. Group by `family_name`.
- Highest-impact next load: rank empty/thin segments by impact score (see §6 Action Queue Ranking).
- Consequence copy: pull from segment metadata or hardcoded mapping (see §7 Segment-to-consequence map).

**Fallback:**
- If tenant industry classification missing, omit it from sentence 1 ("First Capital Financial is your AbarVa tenant.")
- If consequence copy not in mapping, generate from segment description: "Loading [segment name] would unlock [first capability the segment grounds]."

**Refresh:** page-load.

**Implementation note:** This is generated copy, not free-form Steward output. Use a template:
```
Sentence 1: "[tenant.display_name] is [industry classification + business lines]."
Sentence 2: "[Plain-language summary of loaded categories]; [plain-language summary of missing categories]."
Sentence 3: "The next move is to load [highest-impact segment] — [consequence copy]."
```

This is deterministic copy generation, not LLM at runtime. Server-side template fill.

---

### Block 1.3 — Action queue (only shown if non-empty)

**Shows:**
"Pending your decision (N)" with up to 5 ranked items. Each item: severity dot (red/amber/green), name, plain-language consequence, link to resolving panel.

**Data source:**
- Pending data loads: empty/thin segments ranked by impact score
- Pending SSO: check `tenant_settings.sso_configured = false` → emit "Configure SSO to invite users"
- Pending connector decisions: query `connectors` for current tenant where `state IN ('decision_pending', 'awaiting_review')` (if this table exists; if not, omit and log gap)
- Severity: high impact = red, medium = amber, low = green
- Resolving panel link: hardcoded per item type — data loads → Data Trust, SSO → Users & Access, connectors → Connectors

**Fallback:**
- If connector decision pending state can't be queried, omit connector items from queue
- If no items pending, hide entire block (not "Action queue: empty" — actually hide it)

**Refresh:** page-load.

**Sort order:** impact score descending. High-impact items first.

**Cap:** show top 5. If more than 5 pending, show "View all (N) →" link to a future "all actions" view (out of scope this PR; link to Data Trust action queue for now).

**State variations:**
- Empty: hide block entirely
- Partial: show 1-3 items
- Mature: show 0-1 items (most resolved)

---

### Block 1.4 — Recent activity (max 5 items)

**Shows:**
"Last 7 days" with up to 5 real activity entries. Each entry: small timestamp, plain-language summary.

**Data source:**
- Query an activity log for current tenant filtered to last 7 days. Possible sources:
  - If `audit_events` or `activity_log` table exists, use it
  - If not, derive from `data_inventory_segments.last_reviewed_at` and `data_inventory_segments.loaded_at` for events in the last 7 days
- Filter to events where event_type IN ('segment_loaded', 'segment_reviewed', 'segment_marked_ready', 'connector_configured', 'sso_configured', 'admin_action')
- Exclude events that are platform-administrative (page views, auth events, internal seeding)

**Fallback:**
- If no activity log exists at all, derive from segment metadata: "[segment name] marked '[status]' [N days ago]"
- If no real activity in last 7 days, hide the entire block (don't show "No recent activity" — actually hide)

**Refresh:** page-load.

**Sort order:** most recent first.

**State variations:**
- Empty: hide block
- Partial: show 1-5 items
- Mature: show 1-5 items (always trimmed to most recent 5)

**Note:** the current Overview's "Recent activity" with one fake-looking "Steward authored financial-services setup posture" entry should NOT carry forward. That's not real activity — it's the page existing. Filter such entries out.

---

## §2 · Panel 2: Data Trust (PR B)

### Block 2.1 — State header (top-line counts, 4 metrics)

**Shows:**
Four metric cards in a row: Segments loaded · Records · Decision-grade · Empty/blocking

**Data source:**
- Segments loaded: `count(*)` from `data_inventory_segments` for current tenant where `health_status NOT IN ('empty', 'not_loaded')` / 14
- Records: `sum(record_count)` from same table
- Decision-grade: `count(*)` where `health_status = 'decision-grade'`
- Empty/blocking: `count(*)` where `health_status IN ('empty', 'thin')` AND segment is in critical-path list (see §8 Critical-path segments)

**Fallback:**
- If `health_status` not normalized, derive from coverage_pct: ≥0.85 = decision-grade, 0.6-0.85 = usable evidence, 0.3-0.6 = partial, <0.3 = thin, 0 = empty
- If record_count not maintained, query `data_inventory_records` count grouped by segment

**Refresh:** page-load.

---

### Block 2.2 — What's loaded (plain-language category buckets)

**Shows:**
3-5 buckets, each with green/amber/red dot, bucket name, segment list grounding it, and brief category status.

Suggested bucket-to-segment mapping (call this the "plain-language layer"):

| Bucket | Segments | Plain description |
|---|---|---|
| Who you are | 01 Enterprise + 02 Org + 13 Industry context | legal entity, business lines, regulators |
| What you run on | 03 IT Systems + 11 Vendor & contract | system inventory, vendors, contracts |
| What rules apply | 12 Compliance posture | regulatory framework, controls, audit findings |
| How you measure performance | 04 IT Financials + 05 KPI Dictionary + 10 Operating telemetry + 15 KPI History + 18 Financial model | financial actuals, KPIs, operating metrics |
| What you have in flight | 06 Active portfolio + 08 Program deliverables + 14 Cross-program signals + 19 Decision traces | programs, deliverables, decisions |
| How you compare | 17 Peer benchmarks + 16 Stakeholder notes + 20 Scenario library + 21 Vendor intelligence + 22 Graph relationships + 23 AI Transformation | competitive position, executive voice, scenarios |
| Evidence base | 09 Evidence ledger | citations and audit trail (cuts across all buckets) |

**Data source:**
- For each bucket: aggregate `health_status` of constituent segments
- Bucket-level status: green if all segments are usable evidence or above, amber if mixed, red if all are empty/thin
- Use the mapping table above as static config; load segment data from `data_inventory_segments`

**Fallback:**
- If a segment in a bucket doesn't exist or isn't loaded, treat as empty for the bucket calculation
- If bucket would be all-empty, still show the row (with red dot) — empty buckets are signal, not noise

**Refresh:** page-load.

**State variations:**
- Empty: all buckets red, "we don't yet know who you are"
- Partial: 2-3 buckets green, others amber/red
- Mature: most buckets green, evidence base mature

---

### Block 2.3 — Action queue ("Next loads, ranked by impact")

**Shows:**
Up to 5 ranked items. Each: severity dot, segment name, consequence copy, "Template ↓" CTA, "Upload →" CTA.

**Data source:**
- Empty/thin segments ranked by impact score (see §6 Action Queue Ranking)
- Severity: high = red, medium = amber, low = green
- Consequence copy: from §7 Segment-to-consequence map
- Template link: `/setup-templates/[segment-slug].[ext]` per PR 4 of Setup Fix Package
- Upload link: opens upload flow (per Wave 27 status, may be stub — that's OK)

**Fallback:**
- If consequence copy not in map, use generic: "Loading [segment name] would deepen [primary capability]."
- If template doesn't exist for the segment yet, hide "Template ↓" CTA but show "Upload →"

**Refresh:** page-load.

**Cap:** top 5. Add "View all → [Trust ladder section below]" if more pending.

---

### Block 2.4 — Trust ladder per segment (collapsible technical inventory)

**Shows:**
Table with columns: Segment · Records · Trust rung · Unlocks · Next action

**Data source:**
- One row per segment from `data_inventory_segments` for current tenant
- Records: `record_count`
- Trust rung: derived from `health_status` (Loaded / Available / Usable evidence / Agent-usable / Decision-grade — 5 rungs)
- Unlocks: brief copy describing primary capability the segment grounds. Static map (see §7).
- Next action: contextual — "Promote" if loaded but not decision-grade; "Load" if empty; "—" if decision-grade

**Fallback:**
- If trust rung mapping unclear, default to mapping coverage_pct: <0.2 = Loaded, 0.2-0.5 = Available, 0.5-0.75 = Usable evidence, 0.75-0.9 = Agent-usable, ≥0.9 = Decision-grade
- If "Unlocks" copy missing, derive from segment description

**Refresh:** page-load.

**Sort order:** by family_number (segment 1 first, segment 23 last).

**Collapsible:** default collapsed below 7 rows; expand to show all 14 (or 23 post-Wave 4).

---

## §3 · Panel 3: Connectors (NOT redesigned in this package)

Note: Connectors panel is NOT redesigned in this package. Per the original Setup Fix Package, PR 7 (Connectors redesign) was paused at Gate 3 awaiting design output. This redesign package focuses on Overview, Data Trust, Agent Readiness only.

The wireframe shows Connectors with the wireframe block structure, but **do not implement Connectors redesign in this package**. Connectors stays in its current shipped state (post Setup Fix Package PR 2 tenant-binding fix). It is unchanged by this redesign package.

If Anand later wants to ship Connectors redesign, that is a follow-up package using this catalog as a reference.

---

## §4 · Panel 4: Users & Access (NOT redesigned in this package)

Same as §3. Users & Access stays in its current shipped state (post Setup Fix Package PR 5). Unchanged by this redesign package.

---

## §5 · Panel 5: Agent Readiness (PR C)

### Block 5.1 — State header (per-agent quick reads, 4 metrics)

**Shows:**
Four metric cards: Nexus · Sentinel · Steward · Atlas. Each shows agent name and current capability level.

**Data source:**
- Per-agent capability level: derived from average capability assessment across the 14 segments per agent
- If `agent_capability_assessments` table exists, query directly
- If not, derive: each agent has a primary segment-set it depends on (see §9 Agent-segment-dependency map). Average the health_status of those segments → maps to thin/partial/decision-grade.

**Fallback:**
- If agent-segment dependency map not configured, default each agent to "partial" if 50%+ of segments are loaded, otherwise "thin"
- Log substrate gap if `agent_capability_assessments` doesn't exist

**Refresh:** page-load.

---

### Block 5.2 — Capability constellation matrix (the page hero)

**Shows:**
14 segments × 6 capabilities matrix. Each cell shows a state: deep (green) / partial (amber) / thin (red) / empty (grey).

**Data source:**
- Rows: 14 segments from `data_inventory_segments`. Sort by family_number.
- Columns: 6 capability tracks — Cite evidence · Model run-rate · Detect risk · Synthesize cross-program · Advance lifecycle · Audit / govern
- Cells: per-segment-per-capability assessment. If `segment_capability_matrix` table exists, query directly. If not, derive from segment health_status using a rule table (see §10 Segment-capability rule table).

**Fallback:**
- If matrix table doesn't exist, generate from segment health using §10 rule table
- Log substrate gap recommending segment_capability_matrix as future schema

**Refresh:** page-load.

**Interactivity:** clicking a cell expands a tooltip/popover showing what would deepen that cell (e.g., "Detect risk on segment 12 Compliance is partial. Would deepen with: open control gaps + exam responses loaded.").

**State variations:**
- Empty: all cells empty/grey
- Partial: scattered deep cells in foundational segments (1-3), thin elsewhere
- Mature: most cells deep across most segments

---

### Block 5.3 — Per-agent next-action (admin-actionable vs engineering-tracked)

**Shows:**
Two sections, visually distinct:

**Admin-actionable** (top section):
List of items per agent — what each agent can't yet do, what data load closes the gap, link to Data Trust.

**Engineering-tracked** (bottom section, visually muted):
Items the admin cannot resolve — platform engineering work tracked in Wave [N].

**Data source:**

For admin-actionable:
- Per agent, identify capability cells in matrix that are empty/thin
- For each, identify the segment the agent depends on for that capability
- Generate: "[Agent] → can't do [capability] · needs [segment(s)] loaded · [Data Trust →]"

For engineering-tracked:
- Static list (or queried from a `platform_capability_state` table if it exists). Items like:
  - "Live access mutation pipeline (Wave 27)"
  - "Confidence scoring on live evidence (Wave 27)"
  - "Pressure cards on live data (Wave 28)"

**Fallback:**
- If platform capability state isn't queryable, hardcode the engineering-tracked items as a static list maintained in a config file. Log substrate gap.
- If agent-capability-segment dependency mapping isn't clean, generate generic items: "[Agent] → would deepen with [count] more segments loaded · [Data Trust →]"

**Refresh:** page-load.

**Visual treatment per the wireframe:**
- Admin-actionable: red/amber severity dots, prominent
- Engineering-tracked: grey, italic, no severity dot, smaller text

**This is the most important visual distinction in PR C.** The previous Agent Readiness panel conflated these two; the redesign separates them.

---

## §6 · Action Queue Ranking (cross-cutting algorithm)

Used by Block 1.3 (Overview action queue) and Block 2.3 (Data Trust action queue).

### Algorithm:

1. Get all empty/thin segments for current tenant
2. Score each on impact:
   - **Foundational segments** (1, 2, 3, 12) = score 100
   - **Performance segments** (4, 5, 10) = score 80
   - **Portfolio segments** (6, 8, 14) = score 80
   - **Evidence segments** (9) = score 90
   - **Industry / context** (11, 13) = score 60
   - **Tier 1 enrichment** (15, 16) = score 50
   - **Tier 2-4 enrichment** (17-23) = score 30
3. Apply tenant-specific multipliers if defined (some tenants have priority orderings — e.g., a regulated financial tenant prioritizes 12 Compliance higher than a retail tenant)
4. Sort descending. Top 5 are surfaced.

**Fallback:** if scoring config missing, default to family_number ascending (segment 1 highest priority, segment 23 lowest).

---

## §7 · Segment-to-consequence map

Used by Block 1.2 (orientation), Block 1.3 (action queue), Block 2.3 (Data Trust action queue), Block 2.4 (Trust ladder "Unlocks" column).

### Static mapping (load into config or substrate; Claude Code can implement as code-side const for now):

| Segment | "Unlocks" copy |
|---|---|
| 01 Enterprise Profile | Steward can anchor the tenant to legal entity, regulators, and strategic priorities |
| 02 Org Structure | Decision-rights mapping — Nexus can identify sponsors and approvers per program |
| 03 IT System Landscape | Atlas can reason about authoritative systems for customer / account / risk data |
| 04 IT Financials | Run-rate modeling — variance vs plan, cost attribution |
| 05 KPI Dictionary | Outcome attribution — Nexus can tie programs to measured KPIs |
| 06 Active Portfolio | Nexus phase-gate reasoning across active programs |
| 07 Sourcing Artifacts | Sentinel reasoning across vendor responses, RFPs, evaluations |
| 08 Program Deliverables | Charter / OKR / design-brief grounding for each program |
| 09 Evidence Ledger | Citation discipline — every claim resolves to evidence |
| 10 Operating Telemetry | Workflow-change detection, milestone telemetry, gate-readiness |
| 11 Vendor & Contract | Renewal calendar, contract-term reasoning, vendor risk |
| 12 Compliance Posture | Steward gating on AI / sourcing / programs against control requirements |
| 13 Industry Context | Industry-pattern overlay on Sentinel and Atlas reasoning |
| 14 Cross-Program Signals | SME conflict detection, dependency reasoning, portfolio risk |
| 15 KPI History | Trend reasoning — "when did this start", rate of change |
| 16 Stakeholder Notes | Executive voice grounding — what was actually said |
| 17 Peer Benchmarks | Competitive positioning, "where are we vs peers" |
| 18 Financial Model | Variance vs plan, NPV sensitivity, run-rate modeling |
| 19 Decision Traces | Decision-history, dissent tracking, escalation patterns |
| 20 Scenario Library | "What if" modeling, stress testing |
| 21 Vendor Intelligence | Vendor financial health, references, alternatives |
| 22 Graph Relationships | Typed-edge reasoning across substrate |
| 23 AI Transformation | AI trajectory, metric impact across front/middle/back office, domain standards |

---

## §8 · Critical-path segments

Used by Block 2.1 (Empty/blocking metric).

The "blocking" metric counts empty/thin segments that are critical-path for any agent to reach decision-grade.

Critical-path segments: 1, 2, 3, 4, 5, 6, 9, 12.

If any of these is empty, the platform cannot reach decision-grade for the corresponding capabilities. Other empty segments are gaps but not blocking.

---

## §9 · Agent-segment-dependency map

Used by Block 5.1 (per-agent state header) and Block 5.3 (per-agent next-action).

| Agent | Primary segments | Capability profile |
|---|---|---|
| Steward | 1, 9, 12 | Citation discipline, gating, compliance |
| Sentinel | 7, 11, 13, 21 | Sourcing reasoning, vendor risk, market context |
| Nexus | 6, 8, 10, 14 | Program lifecycle, gate-readiness, cross-program |
| Atlas | 3, 4, 5, 22 | System reasoning, financial modeling, graph traversal |

Per-agent state = average health_status across primary segments.

Cross-cutting: all agents benefit from 9 Evidence Ledger and 16 Stakeholder Notes; both are weighted into all four agents' state with secondary weight.

---

## §10 · Segment-capability rule table

Used by Block 5.2 (matrix cells) when no `segment_capability_matrix` table exists.

For each segment-capability pair, derive cell state from segment health_status:

**Cite evidence** column:
- Decision-grade segments → deep cell
- Usable evidence segments → partial cell
- Available segments → thin cell
- Loaded only → empty cell
- Empty → empty cell

**Model run-rate** column:
- Only segments 4, 5, 10, 18 contribute
- Decision-grade on these → deep
- Else partial/thin/empty by segment health
- All other segments → grey/empty (capability not relevant)

**Detect risk** column:
- Segments 1, 9, 10, 11, 12, 13, 19 contribute
- Mapping by health_status

**Synthesize cross-program** column:
- Segments 6, 8, 14, 19, 22 contribute
- Mapping by health_status

**Advance lifecycle** column:
- Segments 6, 7, 8, 10 contribute
- Mapping by health_status

**Audit / govern** column:
- Segments 1, 9, 12, 19 contribute
- Mapping by health_status

If a segment doesn't contribute to a capability column, render that cell as grey/empty (not "thin" — visually distinct).

---

## §11 · Common fallbacks summary

If you encounter substrate that doesn't exist:

1. **Log to `SUBSTRATE_GAP_REGISTER.md`** with: PR number, what was needed, what was substituted, recommendation
2. **Use the catalog's specified fallback** for that block
3. **Continue with implementation** — do not block the PR on a single missing field
4. **Note in PR description** which blocks used fallbacks

---

## §12 · Out of scope for this package

These are NOT data bindings to implement in this package, but should be flagged for future:

- `agent_capability_assessments` table (would replace derived calculation in §10)
- `segment_capability_matrix` table (would replace derived calculation)
- `platform_capability_state` table (would replace hardcoded engineering-tracked items)
- Activity log normalization (currently derived from segment metadata)
- Template registry as shared platform service (deferred per master prompt §3.3)

Each is a substrate addition with cross-surface implications. Defer to architectural decisions.

End of catalog.
