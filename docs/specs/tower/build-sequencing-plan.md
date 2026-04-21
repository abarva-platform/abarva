# AbarVa Control Tower · Build Sequencing Plan

**Purpose:** Dependency-chained work order for building the AbarVa Control Tower product. Ordered so Codex and Claude Code can always have next actions queued without blocking on each other. Not time-bound; structured around what unlocks what.

**Prerequisites:** Tower design spec (`abarva-tower-design-spec.md`, 5,969 lines) defines what Tower is. This document defines how it gets built. Read that first if you haven't.

**Context:** As of April 21, Tower exists as three visual mockups (`tower-mockups/` branch). The broader 19-page Tower surface isn't designed or built. The backend primitives (signals table, engagements, patterns, persons) exist. Atlas agent doesn't exist. Cohort benchmark computation doesn't exist. Signal firing engine doesn't exist. Roughly 15 new backend tables needed. Roughly 16 additional mockups needed before frontend work.

**Strategic position:** Tower is the second product in the AbarVa two-product story (Programs + Tower). The Programs build taught us that parallel Claude Code + Codex streams with clean dependencies ship fast. Tower build applies those lessons from day one, and should execute faster than Programs did because:

- Many backend primitives already exist (`signals`, `engagements`, `persons`, `clients`, `teams`, `patterns` tables)
- The agent pattern is proven (Nexus wiring generalizes to Atlas)
- Migration discipline is established (idempotent template, schema/seed separation, preview reset)
- Design system has canonical tokens (no longer authoring from scratch)
- The team (you, Codex, Claude Code) has velocity and trust

This document exploits those advantages.

---

## PART 1 · Dependency Graph

The Tower build is a DAG of 9 workstreams. Some are independent (start immediately). Some have hard predecessors (must wait). Some are loosely coupled (can start but finish depends on another stream).

### Workstreams

**W1 · Mockup completion** — remaining 16 Tower pages designed as static HTML mockups
**W2 · Design system Tower additions** — 3 new shared components authored into Design System spec
**W3 · Schema migrations** — 15 new tables, one PR each, idempotent, separated from seed
**W4 · Tower seed data authoring** — cohort peers, signal catalog, evidence chains, Atlas fixtures
**W5 · Atlas agent infrastructure** — system prompt, tool belt, message traces, scripted-vs-LLM routing
**W6 · Signal firing engine** — rules engine that emits signals when conditions met
**W7 · Cohort benchmark computation** — aggregate computation producing peer medians + variance
**W8 · Tower backend API routes** — portfolio, signals, cohort, Atlas chat, evidence chains
**W9 · Tower frontend implementation** — 19 pages built from mockups, wired to backend APIs

### Dependency graph

```
W1 Mockup completion
  ├── starts immediately (no predecessors)
  └── unlocks W9 (frontend can't build without mockups)

W2 Design system Tower additions
  ├── starts immediately (no predecessors)
  ├── depends partially on W1 (mockups may surface new component needs)
  └── unlocks W9 (frontend needs canonical components)

W3 Schema migrations
  ├── starts immediately (no predecessors)
  └── unlocks W4, W6, W7, W8 (can't seed or query without tables)

W4 Tower seed data authoring
  ├── depends on W3 (needs schema to write into)
  ├── seed content authored by you/Claude can start before schema (parallel drafting)
  └── unlocks W8 (API routes need seeded data to return anything substantive)

W5 Atlas agent infrastructure
  ├── depends on W3 (needs tables for message traces, observations)
  ├── depends partially on W4 (scripted responses need cohort data, signals)
  └── unlocks W8 (Atlas chat API needs agent infra)

W6 Signal firing engine
  ├── depends on W3 (needs signals table, signal_catalog)
  ├── depends on W4 (needs signal types defined in catalog)
  └── unlocks W7 (benchmarks depend on signals being computed)

W7 Cohort benchmark computation
  ├── depends on W3 (needs cohort_peers table, benchmarks table)
  ├── depends on W4 (needs peer data seeded)
  └── unlocks W8 (API routes need benchmarks computed)

W8 Tower backend API routes
  ├── depends on W3, W4, W5, W6, W7 (needs schema + data + agent + engine + benchmarks)
  └── unlocks W9 (frontend needs APIs to wire against)

W9 Tower frontend implementation
  ├── depends on W1, W2, W8 (mockups + design system + APIs)
  └── unlocks Shail demo readiness (terminal node)
```

### Critical path

The longest dependency chain from start to Shail-demoable Tower:

```
W3 Schema → W4 Seed → W8 Backend → W9 Frontend → Demo-ready
```

Every other stream branches off or feeds into this critical path.

### Parallel-executable streams at start

Three streams can begin immediately with zero predecessors:

- **W1 Mockup completion** (Codex, visual work)
- **W2 Design system Tower additions** (Codex or you, spec work)
- **W3 Schema migrations** (Claude Code, backend)

Three parallel streams is ideal for keeping your team busy on day one.

### Parallel-executable streams once W3 lands

After W3 schema migrations start landing, additional streams unlock:

- **W4 Tower seed data** (you + Claude drafting, Claude Code inserting)
- **W5 Atlas agent** (Claude Code)
- **W6 Signal firing engine** (Claude Code)
- **W7 Cohort benchmark computation** (Claude Code)

At peak parallelization: W1 (Codex mockups), W2 (spec writing), W4-W7 (Claude Code backend in 4 sub-streams), W9 preparation (Codex queueing frontend work against complete mockups). Seven streams, three actors.

---

## PART 2 · Workstream Definitions

Each workstream: purpose, outputs, dependencies, unlocks, concrete sub-tasks.

### W1 · Mockup completion

**Purpose:** Complete the visual design of all Tower pages as static HTML mockups, so frontend build has a reference artifact for every screen.

**Current state:** 3 mockups exist (dashboard, signal-detail, mobile CXO). 16 more needed.

**Output:** 16 additional HTML mockups in `tower-mockups/` directory, each reviewed by you, each matching Design System tokens.

**Depends on:** Nothing (can start immediately).

**Unlocks:** W9 frontend implementation (frontend builds against mockups).

**The 16 pages to mockup (from Page Design Backlog):**

1. Tower landing (role-gated — CIO default view differs from Maestro default view)
2. Portfolio dashboard — Maestro variant (denser, more program-centric)
3. Pipeline sub-surface (programs in flight, grouped by phase)
4. Use Cases table (sortable, filterable, groupable by multiple axes)
5. Use Cases detail page (per use case, deep view)
6. Signals management view (all signals across portfolio, not just one)
7. Signal detail — full page variant (for when user clicks into a signal vs. slide-in)
8. Data & Integrations tab — Integrations sub-tab
9. Data & Integrations tab — Uploads sub-tab
10. Data & Integrations tab — Templates sub-tab
11. Data & Integrations tab — Data Quality sub-tab
12. Settings — Client configuration
13. Settings — Users and roles
14. Settings — Cohort configuration (which peers, which benchmarks)
15. Patterns page (Genome patterns with applicability to this client's portfolio)
16. Atlas full-screen chat (when user expands Atlas from right-rail to primary surface)

**Sub-tasks for Codex:**

1. Review current 3 mockups against my feedback (in conversation history, re: Scripted opening label, left rail contrast, Composite client only toggle, etc.) → produce pass 2 of existing mockups
2. Author 16 new mockups in priority order. Recommended priority: Portfolio dashboard Maestro variant, Use Cases table, Use Cases detail, Pipeline sub-surface, Signals management, Signal detail full-page, remaining Data/Settings/Patterns/Atlas expansion
3. Each mockup reviewed by you (15-20 min per review) before Codex moves to next
4. Each mockup committed to `tower-mockups/` branch with descriptive filename

**Acceptance:** 19 total mockups in `tower-mockups/`, all reviewed, all aligned with Design System tokens, all covering the page surfaces defined in the Page Design Backlog.

**Branch strategy:** All work on `tower-mockups` branch. PR to main when all 19 mockups complete + reviewed.

---

### W2 · Design system Tower additions

**Purpose:** Author three new shared components into the Design System spec before frontend work uses them. Prevents divergence between Tower-built-in-isolation and the rest of the platform.

**Output:** Three new component specs added to `abarva-design-system-spec.md` Packet 2 (Components):

1. **Signal slide-in panel** — 400px right-side panel, overlays dashboard, has close button, action pinned at bottom, supports severity header band
2. **Evidence chain card** — card component showing a vendor/source/artifact with title, dollar amount, descriptive prose, collapsible for multiple in a stack
3. **Cohort peer visualization** — bar comparison of this client's metric vs peer median with transparency chip showing n=X peer count

**Depends on:** Nothing strictly, but benefits from W1 mockup review surfacing edge cases.

**Unlocks:** W9 frontend implementation (frontend uses these as canonical components, not one-offs).

**Sub-tasks:**

1. Draft component spec for signal slide-in panel (states: closed/opening/open/closing, transitions, mobile variant, keyboard behavior, severity header colors)
2. Draft component spec for evidence chain card (variants: expanded/collapsed, stack behavior when multiple, typography rules)
3. Draft component spec for cohort peer visualization (data shape expected, transparency chip rules, variant when n<3 peers)
4. Merge into Design System spec under Packet 2
5. Generate design tokens if any new tokens needed (check Packet 1, probably reuses existing tokens)
6. Codex generates Storybook-style demo for each component against tokens

**Acceptance:** Three components spec'd in Design System. Each has states, variants, token usage, accessibility notes. Each has a visual demo (can be mockup-style HTML). Frontend builds against these specs.

**Note:** Can be authored by you, Claude, or Codex. Probably Claude drafts specs, you review, Codex produces the demo HTML.

---

### W3 · Schema migrations

**Purpose:** Add the 15 new tables Tower needs. Apply migration discipline learned from PR #12/#13 grind: one table per PR, idempotent, schema separate from seed.

**Output:** 15 schema migrations landing on main, each PR'd and reviewed separately.

**Depends on:** Nothing (can start immediately).

**Unlocks:** W4 (seed data inserts), W5 (Atlas infra tables), W6 (signal engine queries), W7 (benchmark queries), W8 (API queries).

**The 15 new tables:**

1. `cohort_peers` — synthetic peer client records with portfolio profile metrics
2. `cohort_benchmarks` — computed benchmark aggregates per metric per cohort
3. `signal_catalog` — catalog of signal types with firing rules, severity, evidence schema
4. `signal_firings` — instances of signals fired (extends existing `signals` table, or replaces if appropriate)
5. `signal_evidence_chains` — evidence entries per signal firing (vendor/source/artifact)
6. `atlas_observations` — Atlas-generated observations about the portfolio
7. `atlas_threads` — Atlas conversation threads (if separate from Nexus threads; may share infra)
8. `atlas_message_traces` — telemetry for Atlas responses (scripted vs LLM, tool calls used)
9. `trustworthiness_observations` — raw observations feeding trustworthiness score
10. `trustworthiness_scores` — computed scores per use case / per program
11. `portfolio_aggregates` — materialized view or table for dashboard aggregates
12. `data_integrations` — registered third-party data source integrations per client
13. `data_uploads` — upload history for manual data loads
14. `integration_health` — status/sync/quality per integration
15. `tower_user_preferences` — user-specific settings (which dashboard variant, filter defaults)

**Sub-tasks per table:**

1. Design schema (columns, types, constraints, indexes, foreign keys)
2. Write migration file following idempotent template (CREATE TABLE IF NOT EXISTS, CREATE INDEX IF NOT EXISTS)
3. Write rollback note in migration comment
4. Open PR against main
5. Preview branch CI runs (migration applies cleanly + no drift)
6. You or Claude Code review
7. Merge on green

**Ordering:** Tables can mostly land in any order. Recommended sequence to minimize rework:

**Wave 1 (no deps):** `cohort_peers`, `signal_catalog`, `data_integrations`, `tower_user_preferences`  
**Wave 2 (depends on Wave 1):** `signal_firings`, `cohort_benchmarks`, `data_uploads`, `integration_health`  
**Wave 3 (depends on Wave 2):** `signal_evidence_chains`, `atlas_observations`, `atlas_threads`, `atlas_message_traces`  
**Wave 4 (depends on Wave 3):** `trustworthiness_observations`, `trustworthiness_scores`, `portfolio_aggregates`

Four waves, 15 tables, ~4 tables per wave. Each wave can land in parallel within the wave.

**Critical discipline:**

- Schema migration only (no INSERT, no UPDATE). Seed data goes in W4.
- Each migration idempotent (IF NOT EXISTS, ON CONFLICT DO NOTHING or WHERE NOT EXISTS).
- Migration file names: `1XX_description.sql` for Tower schema (reserving 100-199 range for Tower).
- Preview branch resets between PR runs (avoids false "already exists" errors).
- Local pre-flight before push: `supabase db reset && supabase db push`.

**Acceptance:** All 15 tables live on prod. Migration list shows all applied. No drift warnings. Queryable via raw SQL.

---

### W4 · Tower seed data authoring

**Purpose:** Populate the Tower tables with realistic data so APIs return substantive content and demo flows work.

**Output:** Seed content across six data categories, inserted via migrations numbered 2XX+ (separate from schema 1XX migrations).

**Depends on:** W3 (needs target tables). Content drafting can start before schema — Claude drafts into markdown staging, then Claude Code converts to migration inserts once tables exist.

**Unlocks:** W8 (APIs return real data), demo flows work.

**Seed data to author:**

**Category A · Cohort peers** (extends Data Layer spec Packet 7.11)

15 synthetic cohort peer records:
- 7-8 retail peers (sizes $10B-$50B revenue, varied AI maturity)
- 5-6 financial services peers (banks, insurers, wealth managers)
- 2-3 healthcare peers (for future, stubs acceptable)

Each peer has:
- Display name (composite label, never real client name)
- Industry, sub-industry, revenue band, workforce size
- Portfolio summary (total use cases, by function, by objective, by lifecycle)
- Portfolio metrics (AI spend, adoption penetration avg, trustworthiness avg, shadow AI estimate)
- Regulatory profile
- Stack profile (light — platforms used)
- Source label: `synthetic_expert_composite`
- Confidence tier: `moderate` (we authored them, we believe them directionally)

Authored by: you + Claude in drafting session, format directly into migration insert.

**Category B · Signal catalog**

14 signal types seeded for Apex + First Capital:

For Apex:
1. Shadow AI detected (the hero signal — $2.3M annualized)
2. Stale attestation (Demand Forecasting 31 days overdue)
3. Drift alert remaining open (Returns Fraud 8% accuracy drop)
4. Adoption plateau (agent-assist usage flatlined)
5. Cost escalation (API spend exceeding budget by 40%+)
6. Vendor concentration risk (one vendor >60% of AI spend)
7. Sponsor disengagement (no sponsor activity 60+ days)

For First Capital:
8. Compliance gap (AI use case without risk assessment on file)
9. Model performance decay (accuracy below control threshold)
10. Contractual risk (vendor SLA missed 2+ periods)
11. Budget overrun (use case exceeds authorized spend)
12. Cross-function dependency risk (program depends on another delayed program)

Plus 2 generic:
13. Unattended baseline (baseline locked >180 days, no re-verification)
14. Knowledge gap (no Genome pattern match for ambitious new use case)

Each signal has:
- Signal type name + description
- Firing rule (what condition triggers it, in pseudo-code or SQL)
- Severity (critical/warning/advisory)
- Evidence schema (what fields appear in evidence chain)
- Recommended actions per severity
- Atlas framing when surfaced (scripted template)

**Category C · Signal firings for Apex demo**

Seeded firings (not computed, explicitly authored for demo reliability):

- Shadow AI firing with 3-entry evidence chain (Jasper, Abridge, Grammarly)
- Demand Forecasting stale attestation (31 days overdue)
- Returns Fraud drift alert (8% accuracy drop over 6 months)

These are the signals visible on the dashboard mockup. They must exist as real rows when the UI queries them.

**Category D · Atlas observations + scripted openings**

10-15 scripted Atlas observations for common CXO morning contexts:

- "Three things need attention before the first executive call" (mobile CXO opener)
- "Your portfolio coverage is 13 use cases with 54% adoption, 8 points below retail peer median"
- "Shadow AI is still the loudest issue — $2.3M annualized across three tools"
- "The Demand Forecasting attestation is 31 days overdue and the CIO has asked for status twice"
- "Returns Fraud drift was triaged but still needs a retraining window"
- "Cost allocation tags are incomplete on Azure — we can't separate AI from general compute"
- "Priya Sethi is traveling this week — she'll be back for the Thursday review"
- etc.

Each has: trigger context (time of day, user role, portfolio state), scripted text, variable slots, follow-up suggestions.

**Category E · Trustworthiness observations**

30-40 observations seeded for Apex's active use cases:

- Per use case: 5-10 observations across the 4 trustworthiness dimensions (performance, governance, adoption, business value)
- Each observation: timestamp, source, dimension, score impact (-1 to +1), provenance

These feed the computed trustworthiness scores that Tower surfaces.

**Category F · Data integrations status**

For Apex demo, 5 seeded integrations:

- Shopify (connected, green, syncing)
- Salesforce Commerce (connected, green, syncing)
- Snowflake (connected, yellow, partial sync — cost allocation tags incomplete)
- Google CCAI (disconnected, available to connect)
- Microsoft 365 (disconnected, available to connect)

**Migration file structure:**

- `200_cohort_peers_seed.sql` — category A
- `201_signal_catalog_seed.sql` — category B
- `202_apex_signal_firings_seed.sql` — category C
- `203_atlas_scripted_observations_seed.sql` — category D
- `204_trustworthiness_observations_seed.sql` — category E
- `205_data_integrations_seed.sql` — category F

Each migration idempotent (WHERE NOT EXISTS on natural keys).

**Authoring workflow:**

1. You + Claude in drafting session, produce content in markdown/JSON format
2. Claude Code converts to migration insert SQL
3. PR per migration (6 PRs)
4. Preview branch validates
5. Merge on green

**Acceptance:** All 6 migrations applied on prod. APIs querying these tables return substantive data. Dashboard mockup can be populated from real database rows.

---

### W5 · Atlas agent infrastructure

**Purpose:** Build Atlas the way Nexus was built — system prompt, tool belt, scripted-vs-LLM routing, message traces, observations.

**Output:** Atlas agent wired to database, responsive in chat, able to surface observations proactively.

**Depends on:** W3 (tables for threads, messages, observations). Partially W4 (scripted observations need to exist to be served).

**Unlocks:** W8 (Atlas chat API needs agent infra).

**Sub-tasks:**

1. Author Atlas system prompt (tone: senior CIO chief-of-staff, concise, evidence-grounded, never speculates beyond data)
2. Define Atlas tool belt:
   - `query_portfolio_aggregates` — returns portfolio metrics for active client
   - `query_signals` — returns active signals filtered by severity/type
   - `query_signal_evidence` — returns evidence chain for a specific signal
   - `query_cohort_benchmarks` — returns benchmark comparison for a metric
   - `query_use_cases` — returns use cases filtered by attributes
   - `query_programs` — returns program roster
   - `get_scripted_opening` — returns pre-authored opening message for time-of-day context
   - `log_observation` — stores an Atlas-generated observation
3. Wire Atlas to same classifier pattern as Nexus: short-path scripted routing for known intents, LLM routing for novel queries
4. Implement message trace telemetry (same infrastructure as Nexus message traces)
5. Build proactive observation generation (Atlas surfaces observations without being asked, on specific triggers: new signal fired, benchmark drift, user login after absence)
6. Handle Atlas vs Nexus vs Sentinel disambiguation (user asks "what's happening with demand forecasting?" — does Atlas or Nexus respond? Depends on current surface context)

**System prompt highlights (drafted here for reference):**

```
You are Atlas, the CIO chief-of-staff for AbarVa Tower. You help senior operators
understand the state of their AI portfolio at a glance. You are evidence-grounded,
concise, and direct.

You operate in the Tower surface — the strategic operator view of the AI portfolio.
You are not Nexus (who runs programs) or Sentinel (who runs Intelligence research).

When surfacing observations, you must:
- Ground claims in specific data (use tool calls to retrieve real metrics)
- Disclose confidence level when evidence is weak
- Offer next actions, not just descriptions
- Acknowledge when you don't know something

You must never:
- Speculate about metrics without a tool call backing the number
- Narrate UI behaviors (don't promise redirects, loads, or transitions)
- Overclaim certainty when evidence is from one data point
- Invent evidence chains when you lack provenance

Tone: Senior advisor, not cheerful assistant. Specific, not generic. Useful
in 30 seconds, not 3 minutes.
```

**Scripted vs LLM routing:**

Same architecture as Nexus. Classifier detects intent:
- "What's the portfolio look like?" → scripted morning summary (fast, reliable)
- "Tell me more about Shadow AI" → scripted signal deep-dive (if signal exists in catalog)
- "What would happen if we consolidated those three vendors?" → LLM path with tools

Scripted paths have <500ms latency; LLM paths have 3-8s latency with streaming.

**Acceptance:** Atlas responds to queries with real data. Proactive observations fire on expected triggers. Message traces logged. Scripted vs LLM routing splits correctly (target: 70% scripted for common queries, 30% LLM for novel).

---

### W6 · Signal firing engine

**Purpose:** Build the rules engine that emits signals when portfolio conditions match catalog definitions.

**Output:** Background job (cron or event-driven) that evaluates signal catalog rules against current data and fires signal_firings rows when conditions met.

**Depends on:** W3 (signals, signal_catalog tables). W4 (signal catalog seeded with 14 signal types).

**Unlocks:** Real-time signal surfacing (vs. manually-seeded demo firings).

**Sub-tasks:**

1. Design signal rule schema. Rules are pseudo-SQL queries evaluated against portfolio data. Example:

```json
{
  "signal_type": "shadow_ai_detected",
  "firing_rule": {
    "query": "SELECT COUNT(*) FROM ai_tools WHERE tool_id NOT IN (SELECT approved_tool_id FROM governed_inventory)",
    "threshold": ">= 1",
    "severity_map": {
      "1-2 tools": "warning",
      "3+ tools": "critical"
    }
  },
  "cooldown_hours": 168,
  "evidence_generator": "shadow_ai_evidence_v1"
}
```

2. Build rules engine that reads catalog, evaluates each rule against current data, decides fire/no-fire
3. Implement cooldown (don't fire same signal repeatedly — wait N hours between firings)
4. Implement evidence generation (each signal type has an evidence generator function producing the evidence chain rows)
5. Schedule evaluation (nightly cron + on-demand trigger when specific data changes)
6. Handle signal state transitions (NEW → ACKNOWLEDGED → RESOLVED, with timestamps)

**For Apex demo:**

Initially, Apex's signal firings are seeded (W4 Category C) to ensure demo reliability. The signal engine runs but is checked to not overwrite seeded firings. Post-demo, engine takes over.

**Acceptance:** Signal engine runs nightly. Produces firings when rules match. Respects cooldown. Generates evidence chains. Seeded Apex firings persist.

---

### W7 · Cohort benchmark computation

**Purpose:** Compute benchmark aggregates (median, p25, p75) across cohort peers for each Tower metric, so cohort comparisons on dashboard are real.

**Output:** Computed benchmark rows in `cohort_benchmarks` table, refreshed on a schedule.

**Depends on:** W3 (cohort_peers, cohort_benchmarks tables). W4 (peers seeded).

**Unlocks:** W8 (API returns benchmark data for dashboard "retail peers · n=7 · median X" chips).

**Sub-tasks:**

1. Define benchmark metric list (which metrics are cohort-comparable):
   - Portfolio coverage (# use cases)
   - Adoption penetration %
   - Avg trustworthiness score
   - Shadow AI spend estimate
   - Total AI spend % of IT budget
   - Use case distribution (front/middle/back office split)
   - Lifecycle distribution (active/steady/sunset split)
2. Compute benchmark per metric per cohort:
   - Group peers by cohort definition (retail $10B-$50B, FS $50B-$200B, etc.)
   - Compute median, p25, p75, n
   - Write to cohort_benchmarks with timestamp
3. Schedule recomputation (weekly is fine — peer data doesn't change fast)
4. Handle low-n cohorts (if n<3, benchmark is flagged low-confidence, UI shows "insufficient peer data")
5. Produce per-client comparison query (given client X's metric, return cohort median + position)

**Acceptance:** Benchmarks computed for all metrics across defined cohorts. Dashboard cohort chips ("retail peers · n=7 · median $1.1M") return real numbers. Low-n cohorts handled gracefully.

---

### W8 · Tower backend API routes

**Purpose:** Expose Tower data via API routes that frontend pages query.

**Output:** ~15-20 API routes covering portfolio, signals, cohort, Atlas, evidence.

**Depends on:** W3 (tables), W4 (data seeded), W5 (Atlas infra), W6 (signal engine), W7 (benchmarks).

**Unlocks:** W9 (frontend wires to APIs).

**Sub-tasks:**

API routes needed (rough list, Claude Code refines):

1. `GET /api/tower/portfolio-aggregates?client_id=X` — returns dashboard aggregate data
2. `GET /api/tower/signals?client_id=X&severity=Y&status=Z` — returns signals list
3. `GET /api/tower/signals/:signal_id` — returns signal detail + evidence chain
4. `POST /api/tower/signals/:signal_id/acknowledge` — updates signal state
5. `POST /api/tower/signals/:signal_id/originate-program` — creates Program from signal (Path 3)
6. `GET /api/tower/cohort-benchmarks?client_id=X&metric=Y` — returns benchmark comparison
7. `GET /api/tower/use-cases?client_id=X&[filters]` — returns use cases table
8. `GET /api/tower/use-cases/:use_case_id` — returns use case detail
9. `GET /api/tower/pipeline?client_id=X` — returns programs in flight grouped by phase
10. `POST /api/tower/atlas/chat` — Atlas conversation endpoint (streaming)
11. `GET /api/tower/atlas/observations?client_id=X` — returns Atlas-generated observations
12. `GET /api/tower/integrations?client_id=X` — returns integration status
13. `POST /api/tower/uploads` — handles data upload
14. `GET /api/tower/data-quality?client_id=X` — returns data quality issues
15. `GET /api/tower/patterns?client_id=X` — returns Genome patterns applicable to this client
16. `GET /api/tower/trustworthiness?client_id=X&use_case_id=Y` — returns trustworthiness detail

Each route:
- TypeScript typed input and output
- Auth check (client-scoped, role-aware)
- Tenancy enforcement (user can only see their own client's data unless admin)
- Error handling (proper status codes, informative messages)
- Telemetry (log route invocations, latency, errors)

**Authentication/authorization patterns:**

Follow the same tenancy context pattern as Programs. Every Tower API route receives `TenancyCtx` derived from authenticated user. All queries scoped through this context.

**Testing:**

Each API route has:
- Unit test (direct function call)
- Integration test (via HTTP with auth)
- Happy path + 1-2 error paths covered

**Acceptance:** All routes deployed. Frontend can call them. Auth enforced. Types compile. Integration tests green.

---

### W9 · Tower frontend implementation

**Purpose:** Build the 19 Tower pages from mockups, wired to backend APIs.

**Output:** Tower surface navigable, functional, demoable for Apex Retail.

**Depends on:** W1 (mockups), W2 (design system components), W8 (APIs).

**Unlocks:** Shail demo with live Tower.

**Sub-tasks:**

Group the 19 pages into build waves by shared patterns:

**Wave 1 (base patterns — build first):**
- Tower landing / Portfolio dashboard (CXO variant) — reference for all dashboard patterns
- Signal detail slide-in panel — reference for panel pattern

**Wave 2 (dashboard variants):**
- Portfolio dashboard (Maestro variant)
- Mobile CXO view
- Atlas full-screen chat

**Wave 3 (table-centric pages):**
- Use Cases table
- Use Cases detail
- Signals management view
- Pipeline sub-surface

**Wave 4 (sub-tab pages):**
- Data & Integrations · all 4 sub-tabs
- Settings · all 3 sub-tabs
- Patterns page

**Wave 5 (variants + misc):**
- Signal detail full-page
- Use Cases detail (if not built in Wave 3)
- Any remaining variants surfaced during build

**Per-page sub-tasks:**

For each page:
1. Codex starts with mockup as visual reference
2. Codex imports Design System components (from W2 additions)
3. Codex wires to API (from W8)
4. Codex handles loading, error, empty states
5. Codex ensures responsive behavior (mobile variants)
6. Codex writes integration test (at minimum: page loads without crash, renders seeded data)
7. You review in local dev
8. Merge to main

**Branch strategy:**

Long-lived `tower-build` branch rebased weekly from main. Sub-feature branches like `tower-build-pipeline`, `tower-build-atlas-chat` PR into `tower-build`, not into main. Only when Tower is demo-ready does `tower-build` merge to main.

Reasoning: Tower construction involves incomplete states. Pages exist but APIs aren't ready. Signals fire but evidence chains aren't populated. Merging to main during this state could break Programs demo. Long-lived feature branch contains the mess.

When merging `tower-build` → main, merge commit is ceremonial: "Tower ships to production." Triggers Shail-demo-readiness declaration.

**Acceptance:** All 19 pages render. All wire to real APIs. All handle loading/error/empty states. Responsive on mobile. Apex demo flow walks from dashboard → signal detail → originate program → (transitions to Programs surface, existing flow).

---

## PART 3 · Parallel Execution Strategy

### Claude Code vs Codex allocation

**Claude Code owns:** W3, W4 (migrations), W5 (agent infra), W6 (signal engine), W7 (benchmarks), W8 (API routes). Backend work.

**Codex owns:** W1 (mockups), W9 (frontend). Visual and frontend work.

**You own:** W2 (design system spec additions), W4 (content drafting), review of all streams.

**Claude (me) owns:** Spec authoring, content drafting support for W4, review of agent prompts for W5.

### Daily parallel state (at peak)

On a given day during mid-build, expect this state:

- **Codex:** Working on mockup #7 of 16 (W1) and simultaneously building Use Cases table page (W9 Wave 3)
- **Claude Code:** Landing migration #9 of 15 (W3 Wave 3) and implementing benchmark computation (W7)
- **You:** Reviewing yesterday's mockups, drafting scripted Atlas observations (W4), answering design questions from Codex
- **Me:** Writing signal catalog rules (W4) and reviewing Atlas system prompt draft (W5)

Five streams active, four actors. No one blocked.

### Branch hygiene across streams

- `main` — protected, stays green, Programs demo-ready always
- `tower-mockups` — Codex mockup work, PRs to main when pass reviewed
- `tower-build` — Codex frontend work, long-lived
- `tower-schema-N` — Claude Code per-migration branches, PRs to main individually
- `tower-seed-N` — Claude Code per-seed-migration branches, PRs to main individually
- `tower-atlas` — Claude Code Atlas agent work, PRs to main when wave complete
- `tower-signals-engine` — Claude Code signal engine work, PRs to main when wave complete
- `tower-benchmarks` — Claude Code benchmark computation, PRs to main when complete
- `tower-api-routes` — Claude Code API work, PRs to main per-route or per-wave

### Integration points

Moments in the build where streams converge and need validation:

**Integration Point 1 — W3 Wave 1 complete, W4 can begin.**
When first wave of schema migrations land, seed data work starts. No dependency issues expected; validation is "does seed migration apply cleanly."

**Integration Point 2 — W3 complete, W5 starts heavily.**
Atlas agent needs full schema. Before Atlas chat routes are built, all Atlas-related tables (threads, messages, traces, observations) must be live.

**Integration Point 3 — W4 + W5 + W6 + W7 complete, W8 becomes fully populated.**
API routes without data return empty responses. API routes with incomplete agent/engine return error states. Validate that all four upstream streams have landed substantively before W8 work races ahead.

**Integration Point 4 — W8 + W1 + W2 complete, W9 becomes real.**
Frontend cannot wire to APIs that don't exist. Frontend cannot use components not in Design System. Both must be ready before page-by-page frontend work starts in earnest.

**Integration Point 5 — Tower demo smoke test.**
Before declaring Tower "Shail demo ready," a full walk-through is performed: log in as Apex user, open Tower, see dashboard, click Shadow AI signal, see evidence chain, click Originate Program, arrive in Programs with charter pre-populated. End-to-end in <2 minutes. If any step breaks, fix before declaring ready.

---

## PART 4 · Migration and Schema Sequencing

Applying lessons from PR #12/#13.

### Rules (inherited from Programs build)

1. **One table per PR.** No "Tower schema v1" mega-PR.
2. **Idempotent.** CREATE TABLE IF NOT EXISTS, CREATE INDEX IF NOT EXISTS, WHERE NOT EXISTS on seed inserts.
3. **Schema and seed separated.** Schema in `1XX_*.sql`, seed in `2XX_*.sql`.
4. **Local pre-flight.** Before push: `supabase db reset && supabase db push`.
5. **Preview branch reset between PRs.** Ensures no state persistence from failed runs.
6. **Rollback notes in migration comments.** Capture how to unwind if needed.

### Tower-specific discipline

**Naming convention:**

- `100_cohort_peers_schema.sql`
- `101_cohort_benchmarks_schema.sql`
- `102_signal_catalog_schema.sql`
- ... etc
- `200_cohort_peers_seed.sql`
- `201_signal_catalog_seed.sql`
- ... etc

Schema 100-199 reserved for Tower. Seed 200-299 reserved for Tower.

**ON CONFLICT discipline (learned from PR #13):**

Before using `ON CONFLICT (col) DO NOTHING`, verify that `col` has a unique constraint (not just a unique index, which the query planner doesn't always accept). When in doubt, use `WHERE NOT EXISTS (SELECT 1 FROM table WHERE col = value)` pattern instead. Safer.

**Audit script run before each PR:**

`node scripts/audit-migrations.mjs` catches common issues (mixed DML in schema migrations, missing IF NOT EXISTS clauses, etc.). Run locally before every push.

### Recovery playbook

If a Tower migration fails on preview and state persists:

1. Do not try to force-apply. Reset preview branch first (`supabase db branches reset [preview-branch]`).
2. If not resettable, reach out in Discord / support. Supabase team can reset manually.
3. Fix the migration idempotently.
4. Re-push.

### Special handling for seed data

Seed migrations can conflict with manual data loads during demo prep. To prevent:

- Seed migrations use explicit UUIDs or natural keys (never auto-increment) so repeated runs don't produce duplicates
- Seed migrations include UPDATE paths for refresh (not just INSERT)
- Demo data can be deleted and re-seeded via `npm run seed:tower-demo` wrapper

---

## PART 5 · Design System Additions Required

Three new components must land in Design System spec before frontend work uses them.

### Component 1 · Signal slide-in panel

**Location:** Design System Packet 2 (Components), new subsection 2.15.

**Specification needed:**

```
Component: Signal slide-in panel
Purpose: Overlay right-side panel for viewing signal detail without losing dashboard context.

States:
- Closed (not rendered or display:none)
- Opening (slide-in animation, 220ms ease-out)
- Open (400px wide, full-height, right-aligned)
- Closing (slide-out animation, 180ms ease-in)

Structure:
- Top severity band (4px tall, color per severity)
- Close button (top-right, 44x44px tap target, Esc keybind)
- Signal header section (title, amount, metadata)
- Evidence chain section (stack of Evidence Chain cards)
- Cohort context section (Cohort Peer Visualization component)
- Pinned action bar (bottom, 3-4 action buttons)

Behaviors:
- Dashboard behind panel dims to 40% opacity (not 80%, per feedback)
- Esc key closes panel
- Click outside panel closes panel (or not — decide: I lean toward NOT, for accidental-close protection)
- Panel content scrolls internally; dashboard behind stays fixed

Responsive:
- Desktop ≥1024px: 400px wide panel
- Tablet 768-1024px: 60% viewport width
- Mobile <768px: full-screen modal instead of side panel

Accessibility:
- aria-modal="true"
- Focus trap on open
- Focus restoration on close
- Screen reader announces "Signal detail for [signal name], critical severity"

Token usage:
- Background: surface-elevated
- Border: divider
- Severity band: severity-critical / severity-warning / severity-advisory tokens
- Typography: heading-display for title, body-lg for amount, meta-mono for metadata
```

### Component 2 · Evidence chain card

**Location:** Design System Packet 2, new subsection 2.16.

**Specification needed:**

```
Component: Evidence chain card
Purpose: Display one entry in an evidence chain (vendor, source, artifact).

States:
- Collapsed (title + amount only, 48px tall)
- Expanded (title + amount + description, variable height)

Structure:
- Title (e.g., "Jasper · $800K / year")
- Expand/collapse icon
- Description prose (when expanded)
- Optional metadata footer (source type, provenance)

Stack behavior:
- Multiple cards stack vertically with 8px gap
- First card expanded by default
- Subsequent cards collapsed
- User can expand/collapse each independently

Token usage:
- Background: surface-secondary
- Border: divider-subtle
- Typography: heading-md for title, body-md for description, meta-mono for footer
```

### Component 3 · Cohort peer visualization

**Location:** Design System Packet 2, new subsection 2.17.

**Specification needed:**

```
Component: Cohort peer visualization
Purpose: Compare this client's metric to peer median with transparency about peer count.

Structure:
- Metric label + this client's value (primary emphasis)
- Horizontal bar comparison: this client bar, peer median line, p25-p75 range shaded
- Transparency chip: "Retail peers · $10B-$50B · n=7"

Variants:
- High-n variant (n≥5): full comparison with confidence
- Low-n variant (n<5): comparison shown with "limited peer data" caveat
- Insufficient-data variant (n<3): no visualization, shows "insufficient peer data — add more integrations"

Behavior:
- Hover on chip shows full cohort definition
- Click on chip opens cohort configuration (Settings)

Token usage:
- This client bar: accent-primary
- Peer median line: neutral-strong
- Range shading: neutral-faint
- Transparency chip: meta-mono typography, border surface-tertiary
```

---

## PART 6 · Integration Gates

Before declaring each gate passed, these specific validations must happen.

### Gate A · Backend Wave 1 complete

W3 Wave 1 migrations + W4 Categories A+B (cohort peers, signal catalog) applied.

Validation:
- Query cohort_peers → returns 15 rows
- Query signal_catalog → returns 14 rows
- No migration drift on prod

Once passed: W5, W6, W7 can begin.

### Gate B · Atlas agent minimum viable

W5 produces Atlas responding to at least 3 scripted queries + 1 LLM query, with tool calls succeeding.

Validation:
- POST /api/tower/atlas/chat with "good morning" → returns scripted opener
- POST /api/tower/atlas/chat with "tell me about Shadow AI" → returns evidence-grounded response with tool call visible in trace
- POST /api/tower/atlas/chat with "what would happen if we moved all programs to Q3?" → LLM path, substantive response
- Atlas message traces logged correctly

Once passed: W8 Atlas routes can be declared ready.

### Gate C · Signal engine + benchmarks live

W6 + W7 complete. Signal engine fires correctly. Benchmarks computed.

Validation:
- Run signal engine manually → produces firings for seeded Apex scenarios
- Query cohort_benchmarks → returns aggregates for all metrics
- Dashboard "retail peers · n=7 · median X" chips return real values

Once passed: Dashboard W9 work can wire to live data, not mock.

### Gate D · API surface complete

W8 complete. All routes deployed. Integration tests green.

Validation:
- All 15-20 routes deployed
- All auth-gated correctly
- All tenancy-enforced correctly
- Integration tests pass for each route

Once passed: W9 frontend can wire against real APIs.

### Gate E · Tower demo smoke passes

End-to-end walk passes.

Validation path:
1. Log in as Apex user Priya Sethi
2. Navigate to Tower
3. Dashboard loads with real data (signals, aggregates, cohort chips)
4. Click Shadow AI signal → slide-in panel opens with 3 evidence chain cards
5. Click "Originate Program" in panel → navigates to Programs with charter pre-populated
6. Return to Tower → dashboard shows same state (persistence works)
7. Mobile view: pull up same dashboard on phone → renders correctly

Once passed: Tower declared Shail-demo-ready.

---

## PART 7 · Minimum Viable Live Tower for Shail

Not everything in the full Tower spec needs to ship for Shail demo. Define the minimum viable set.

### What must work live

- Tower landing page / Portfolio dashboard (Apex view)
- Shadow AI signal fully functional (dashboard card + slide-in detail panel + evidence chain + Originate Program action)
- At least 2 other signals visible but don't need deep functionality (Demand Forecasting stale, Returns Fraud drift)
- Atlas right-rail with scripted morning opener
- Cohort comparison chip (retail peers n=7)
- Mobile CXO view functional
- Originate Program flow ends in Programs (existing Programs flow)

### What can be static/mockup for Shail

- Maestro dashboard variant
- Use Cases table (static seeded list OK)
- Pipeline sub-surface
- Data & Integrations sub-tabs (shown but not interactive)
- Settings
- Patterns page
- Atlas full-screen chat (right-rail is enough)
- Signals management full-page view

### What can be deferred entirely post-seed

- Multi-client switching (Apex only)
- Upload flow
- Integration configuration
- Atlas LLM path (scripted only is fine for demo)
- Trustworthiness score dynamic computation (seeded values fine)
- Real signal firing engine running (seeded firings fine)

### Shail demo acceptance

Shail can walk through:
1. Tower dashboard, understand portfolio state in 30 seconds
2. Shadow AI signal deep-dive, see evidence chain
3. Click Originate Program, see transition to Programs
4. Back to Tower, see same state
5. Pull up mobile CXO view, see Atlas morning summary

That's it. Everything else is "and here's where we're going" — mockup territory fine.

### Reducing scope implications

Of the 19 Tower pages in the full build, roughly 8 need to be live-functional for Shail. 11 can remain as mockups with basic navigation but no real interaction.

This reduces W9 frontend work by ~40% for the pre-Shail target. Full Tower build continues post-Shail to deliver all 19 live.

---

## Summary

**9 workstreams. 3 parallel at start (W1, W2, W3). Peak of 7 parallel mid-build.**

**Dependency order:** W3 → {W4, W5, W6, W7} → W8 → W9. W1 and W2 run parallel from start, feed into W9.

**Actor allocation:** Claude Code owns backend (W3-W8). Codex owns visual (W1, W9). You own spec + content (W2, W4 drafting) + review. Claude (me) supports content + prompts.

**Discipline inherited from Programs build:** Idempotent migrations, schema/seed separated, one PR per table, preview branch reset between PRs, local pre-flight before push.

**Shail demo target:** Reduced scope — 8 of 19 pages fully live, rest mockup-only with navigation. Cuts frontend work by ~40% for demo milestone. Full build continues post-seed.

---

**END OF DOCUMENT**
