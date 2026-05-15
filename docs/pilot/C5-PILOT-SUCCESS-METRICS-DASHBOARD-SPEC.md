# C5 · Pilot Success Metrics Dashboard — spec

> Design spec. Owner: founder. Last updated 2026-05-15. Pair-read with `docs/pilot/FIRST-PILOT-RUNBOOK.md` and `docs/pilot/SUPPORT-MODEL.md`.

---

## Why this exists

C2/C3 (the support model PR #1944) defines what pilot success looks like *contractually* — 99.5% availability, P1 response in ≤1h, quarterly availability report. C1 (the runbook PR #1944) defines what "kicked off" looks like — first CXO logged in, 5 CXOs activated within 30 days, 3 AbarVa-recommended moves shaped by month 5.

What's missing: a single **weekly-cadence operational dashboard** for the founder to look at every Monday and answer: "is this pilot landing?" Without it, support is reactive — incidents are visible, but the slow erosion of engagement isn't.

This spec is the design for that dashboard. Implementation is a follow-on item; the spec is shippable today and informs Codex's Azure observability work (App Insights / Log Analytics queries already in place from PRs #1938 + #1940).

---

## Audience

The dashboard has three audiences with different cadences:

| Audience | Cadence | What they need |
|---|---|---|
| Founder | Weekly | Per-pilot health-check; is this customer renewing or churning? |
| Customer CXO | Monthly | Executive summary; what value did the platform produce; what's next? |
| Customer infosec | Quarterly | SLA conformance, incident summary, control evidence |

This spec covers all three views in one dashboard, with role-based collapsing of detail.

---

## Layout

Single page at `/admin/pilot/<tenantKey>` (admin-only via Clerk role).

Four panels, top-to-bottom:

### Panel 1 — Pilot health at a glance (5 cards)

A row of 5 KPI cards. Each card is a single number + a trend arrow against the prior week. Red/amber/green tone by threshold.

| Card | Number | Healthy threshold | Source |
|---|---|---|---|
| **CXO activation** | Distinct CXO users who logged in this week / total CXOs in the pilot | ≥ 80% | Clerk session events |
| **Sentinel queries** | Number of Sentinel questions asked this week, all CXOs combined | ≥ 5/week per active CXO | `turn_traces` table (read via `/api/turn/[id]/trace`) |
| **Move shaping** | Strategic Moves moved through a phase gate this week | ≥ 1/week | `programs` table phase transitions |
| **Substrate freshness** | Days since the most recent successful broker refresh | ≤ 7 days | `tenant_refresh_log` (TBD — A2c is the wrapper, doesn't yet log to a table) |
| **Incidents** | Count of P1/P2 incidents this week + open count | 0 | Incident-response-runbook + PagerDuty (planned) |

### Panel 2 — Engagement quality (3 panels side-by-side)

Slightly deeper than the KPI cards. These answer "are CXOs getting real value or just clicking around?"

| Panel | Visualization | Source |
|---|---|---|
| **Top 10 Sentinel questions this month** | Table: question text · CXO asker · "demo grade" rating (A/B/C/D/F per the audit's rubric, if rated) | `turn_traces` + audit-grade tags |
| **Agent-quality sample** | 5 random Sentinel answers per week pulled for manual review. Each row shows the question, answer excerpt, and a "graded" button | `turn_traces` |
| **Cross-surface handoffs** | Count of "Pattern → Move shaped" + "Move → Source event created" + "Source → Tower-watchlist add" actions this week | `programs` table cross-references |

The agent-quality sample is the founder's weekly gut-check that Sentinel still produces consultant-grade output for this specific tenant. Catches drift early.

### Panel 3 — Substrate health

| Panel | Visualization | Source |
|---|---|---|
| **15 coverage-by-domain tiles** | Grid of 15 chips with row counts (`org_decision_rights: 87`, etc.). Each chip is green if non-empty, red if zero. | `buildEnterpriseContextOverview` (already shipped) |
| **6 synthesized context cards** | List of 6 with "rendered/not rendered" state | Same |
| **Sensitive-data quarantine queue** | Count of items in quarantine, with link to `/admin/quarantine` (B5c, PR #1955) | `stubQuarantineAuditDataSource` today; live table when B5b lands |

Tells the founder *and* the customer's data steward: "your substrate is in good shape" or "your KPI dictionary is sparse — schedule another seed-pack drop."

### Panel 4 — SLA conformance (for the C4 / C3 commitment)

| Panel | Visualization | Source |
|---|---|---|
| **Availability rolling 30d** | % uptime; goal 99.5% pilot / 99.9% production | App Insights + Vercel uptime |
| **P1 response time histogram** | Last 10 P1s with time-to-ack and time-to-resolve | PagerDuty + incident log |
| **Time since last incident** | Single big number (days) | Incident log |

This panel is what gets exported as the **quarterly availability report** the support model commits to (C3).

---

## Data sources — what exists vs what's new

| Card / Panel | Source exists today? | Notes |
|---|---|---|
| CXO activation | Partial (Clerk session events accessible) | Need a "last login" denormalized field or a Clerk webhook capturing logins |
| Sentinel queries | Yes (`turn_traces` table) | Existing — `/api/turn/[id]/trace` reads it, just need an aggregate view |
| Move shaping | Yes (`programs` table) | Need to define what counts as "phase transition" precisely |
| Substrate freshness | **No — needs new table** | Propose `tenant_refresh_log` writing one row per `tenant:refresh` invocation |
| Incidents | **No — needs incident table** | PagerDuty webhook → Supabase incident log; production-readiness gate already references this pattern |
| Top 10 Sentinel questions | Yes (`turn_traces`) | Aggregate query |
| Agent-quality sample | Yes (`turn_traces`) | Add a `manual_grade` column to capture founder rating |
| Cross-surface handoffs | Yes (existing telemetry events in `programs` + `source_events`) | Aggregate |
| 15 coverage tiles | Yes — already powers `/intelligence#enterprise-context` | Reuse existing query |
| 6 context cards | Same | Reuse |
| Quarantine queue | Yes (data-source contract from B5c PR #1955) | Stub today; live when B5b lands |
| Availability | Partial (App Insights queries) | Need to standardize the query that produces the 30-day rolling number |
| P1 response time | **No — needs PagerDuty integration** | Or any incident-tracking system; we don't have one yet (per support-model open items) |
| Time since last incident | Same — needs incident log | |

**Net new persistence: 2 tables.**
- `tenant_refresh_log(id, tenant_client_key, started_at, completed_at, success, tiles_populated, cards_populated, notes)`
- `incident_log(id, tenant_client_key, opened_at, severity, response_at, resolved_at, notes_url)`

Migrations to be authored as part of the implementation PR.

---

## Implementation phasing

| Phase | Scope | Effort |
|-------|-------|--------|
| 1 | Panel 3 (substrate health) — reuse existing data sources, no new tables. Surfaces the most pilot-actionable information first. | 0.5 day |
| 2 | Panel 2 (engagement quality) — query `turn_traces` aggregates; add `manual_grade` column for the agent-quality sample | 1 day |
| 3 | Panel 1 (KPI strip) — most cards work; substrate-freshness card requires new `tenant_refresh_log` table | 1 day |
| 4 | Panel 4 (SLA conformance) — gated on actual incident tracking; defer until first real P1 lands or PagerDuty wired | 1 day after PagerDuty |

Phase 1 + 2 + 3 are shippable now and give 80% of the dashboard value. Phase 4 follows when the support-model open items close.

---

## What this looks like to the customer

In the customer-facing monthly QBR (C3 commitment), the dashboard becomes the talking-points scaffold:

> "This month at Apex Retail, we saw 4 of 5 CXOs activate, averaging 12 Sentinel questions per CXO per week. Carlos shaped 3 strategic moves — the AI Workforce Scheduling bet went from candidate to charter, and the Adobe contract renewal got a binding pattern attached before going to your CFO. Substrate refreshed twice; the 15 coverage tiles are all green. Zero quarantine events. Zero P1 incidents. Availability: 99.7%."

Every claim in that paragraph is a number on the dashboard. The QBR writes itself.

---

## Open items

- **PagerDuty integration** is the long pole for Panel 4. Until it lands, manually populate the incident log via a simple admin form.
- **Manual-grade UI for the agent-quality sample** is a follow-up; until that ships, the founder can grade via a SQL update.
- **Multi-pilot view** — when there are 3+ paid pilots, swap the per-tenant page for a portfolio cockpit. Reuse the same data sources.
- **Customer-facing read-only embed** — let the customer's CXO view this dashboard directly (filtered to "show me my numbers, not the SLA conformance gory bits"). Read-only mode is a future feature flag (A3 contract from PR #1943 — `customer_view_pilot_dashboard`, tenant-default-off).

---

## Companion artifacts

- `docs/pilot/FIRST-PILOT-RUNBOOK.md` — what kickoff looks like
- `docs/pilot/SUPPORT-MODEL.md` — the SLA commitments this dashboard tracks
- `docs/security/INFOSEC-ACCELERATOR.md` — the CISO doc that quarterly availability reports feed
- `src/lib/security/quarantine-audit-types.ts` — data source for the quarantine queue card (B5c)
- `docs/BACKLOG-2026-05-14.md` — backlog (add C5 row as a follow-on)
