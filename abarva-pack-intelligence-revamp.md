# AbarVa Build Pack E · Intelligence Revamp

**Date:** April 19, 2026
**Scope:** Intelligence becomes the surface that *exposes the moat*. Three sub-surfaces: Library (what Nexus knows), Insights (what Nexus has learned from your engagements), Live (what's happening right now). Replaces the current "9 products" page.
**Effort:** ~2-3 days. Depends on Pack B (knowledge layer populated) and Pack C (reasoning graph populated).
**Demo value:** this is where Shail sees the flywheel. Engagement data + graph + industry knowledge + future outcomes, all exposed as one navigable surface.

---

## The shift

**Before:** Intelligence page listed 9 "products" (Situation, Signal, Strategy, etc.) with CXO questions. Legible but static. No depth behind each.

**After:** Intelligence has three live sub-surfaces — Library, Insights, Live — each powered by the knowledge layer + graph + engagement data. The 9 lenses become filter chips on Library, not standalone pages.

The shift is from *"here's what we offer"* to *"here's what we know, what we've learned, what's happening right now."* Same intelligence, different posture.

---

## Menu

Intelligence remains a top-level nav item. Click reveals three sub-tabs inside:

```
Intelligence
  ├── Library    (default tab — browsable catalog)
  ├── Insights   (cross-engagement meta-patterns)
  └── Live       (operational pulse)
```

Sub-tabs rendered as horizontal pills below the top nav. State persisted via URL: `/intelligence/library`, `/intelligence/insights`, `/intelligence/live`.

---

## Sub-surface 1 · Library — "What Nexus knows"

Browsable catalog of every knowledge source ingested. The entire global layer, visible and explorable.

### Layout

```
INTELLIGENCE · LIBRARY
────────────────────────────────────────────────────────────
[All] [Regulations] [Frameworks] [Benchmarks] [Vendors]
[Research] [Patterns] [News]

Filter by industry:  [All] [Healthcare] [FinServ] [Retail]
Search: [                                    ]  39 sources

┌────────────────────────────────────────────────────────┐
│ NIST AI Risk Management Framework 1.0                  │
│ NIST · Public domain · Published 2023-01-26           │
│ Healthcare · FinServ · Retail · AI Governance          │
│ 147 chunks · Last refreshed 2 days ago                 │
│                                  [View]  [Graph]       │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│ CMS Hospital Compare · 30-day readmission benchmarks   │
│ CMS · Public domain · As of 2024-Q4                    │
│ Healthcare                                              │
│ National median 21.8% · p25 19.2% · p75 24.1%         │
│ 3,847 hospitals                           [View][Graph]│
└────────────────────────────────────────────────────────┘

...
```

Each card shows: title, publisher, license class, industry + topic tags, last refresh date, chunk count. Two actions: **View** (full chunks + metadata in a drawer) and **Graph** (opens the reasoning graph viz centered on this node).

### Filter chips

Top of the page: content type filters (Regulations, Frameworks, Benchmarks, Vendors, Research, Patterns, News), industry filter, search bar, source count.

### Nine lenses as filter chips (optional)

The 9 intelligence names from v1 become filters that slice Library by relevance:

```
Filter by lens:
  [Situation] [Signal] [Strategy] [Structure] [Sequence]
  [Signal-Noise] [Spend] [Scenario] [Seat]
```

Click "Situation" → Library filters to sources most relevant to situational diagnosis (NIST AI RMF, Genome patterns, industry benchmarks). This is *one way* to navigate — the lens framing preserved without standalone pages.

### Deep detail drawer

Click **View** on a card → right-side drawer opens:

```
NIST AI Risk Management Framework 1.0
────────────────────────────────────
Publisher:  NIST
Published:  2023-01-26
License:    Public domain
Sections:   147 chunks across GOVERN, MAP, MEASURE, MANAGE

Cited in 23 Nexus turns across 7 engagements.
Most recently: Meridian · 4 hours ago

[Browse sections]
  ├ § 1.1 Audience and use
  ├ § 2.1 Risk management overview
  ├ § 2.2 Test, evaluation, verification
  ├ § 3.2.1 Continuous monitoring  ← most-cited
  ...

[Open in graph]  [Open source URL]
```

"Most-cited" + "Cited in N Nexus turns" is the flywheel surfaced. The longer the product runs, the richer this gets.

### Structured tables for benchmarks

Benchmark sources (CMS, FDIC, FFIEC, BLS) aren't narrative text — they're structured data. Render as inline data tables with sort + filter + search:

```
CMS Hospital Compare · Readmission Rates
─────────────────────────────────────────
[Search hospital...]    Metric: [30-day HF ▾]

Hospital              30-day HF  Volume   As-of
Meridian Health       15.2% ◆   1,840    2024-Q4
Mercy Medical         17.8%     2,340    2024-Q4
St. Jude's            19.1%     1,200    2024-Q4
National median       21.8%                    
St. Francis           23.4%     890      2024-Q4
```

Meridian is marked with ◆ because it's a client in your system. Clickable — opens their Tower.

---

## Sub-surface 2 · Insights — "What Nexus has learned from your engagements"

Auto-generated cross-engagement meta-patterns. This is the board slide.

### What generates Insights

A nightly worker runs 8-10 insight detectors against the engagement + pattern data. Each detector produces 0-N insight cards. Cards are cached in `engagement_insights` table and surfaced here.

Detectors (v1):

1. **Pattern co-occurrence winners** — "Patterns X and Y together → 4x success rate"
2. **Phase timing outliers** — "Engagements with longer Phase 1 succeed 2x more"
3. **Maestro behavior → outcome** — "When you push back in Phase 0, engagements finish 40% faster"
4. **Data completeness correlation** — "Clients who uploaded DPA hit Phase 0 completion 3x faster"
5. **Industry pattern concentration** — "F008 triggers in 67% of your healthcare IDN engagements"
6. **Cross-client contradiction drift** — "Shadow AI spend growing in 3 of 3 tracked clients"
7. **Benchmark position trends** — "Meridian is 2x ahead of healthcare median on readmissions"
8. **Pattern ↔ regulation collision** — "F012 (vendor lock-in) violates NIST AI RMF GOVERN 3.2 in 4 of your engagements"
9. **Vendor posture shifts** — "Anthropic DPA updated; 3 of your use cases affected"
10. **Time-to-insight** — "Average turns to first pattern trigger dropped 30% over last 10 engagements"

### Layout

```
INTELLIGENCE · INSIGHTS
────────────────────────────────────────────────────────────
Generated 6h ago · 7 active insights · 3 new this week

[All] [Patterns] [Timing] [Outcomes] [Trends] [New only]

┌────────────────────────────────────────────────────────┐
│ PATTERN CO-OCCURRENCE           ● NEW · high confidence│
│                                                        │
│ F008 triggers in 12 of your 18 healthcare IDN         │
│ engagements. The 4 that succeeded all had F003 (CFO   │
│ in governance) co-triggered.                          │
│                                                        │
│ Implication: when F008 fires, check if CFO is in      │
│ governance structure. If not — that's your action.    │
│                                                        │
│                       [See engagements]  [Open graph] │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│ PHASE TIMING                            ● 2 weeks old  │
│                                                        │
│ Phase 1 Diagnose averages 14 days across your          │
│ engagements. Engagements that took > 20 days           │
│ succeeded at 2x the rate.                              │
│                                                        │
│ Depth wins. Don't rush diagnosis.                      │
│                                                        │
│                                 [See breakdown]       │
└────────────────────────────────────────────────────────┘
```

Each card: category tag, freshness dot, insight statement, implication, 1-2 actions.

### Freshness

Cards age. Insights stale after 30 days are auto-archived unless they're still true on re-run. "New this week" badge on first 7 days.

### Acceptance criteria

- Worker runs nightly, generates ≥ 5 insight cards within 24h of pack landing (even with only 3 demo engagements, pattern-level insights should fire)
- Cards load in < 200ms from cache
- "See engagements" links land on the engagement list filtered correctly
- "Open graph" opens the reasoning graph viz on the relevant node(s)

### Data model

```sql
CREATE TABLE engagement_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  detector_key TEXT NOT NULL,          -- 'pattern_co_occurrence', 'phase_timing', etc.
  category TEXT NOT NULL,              -- 'patterns', 'timing', 'outcomes', 'trends'
  confidence_level TEXT NOT NULL,      -- 'high', 'medium', 'low'
  title TEXT NOT NULL,
  statement TEXT NOT NULL,             -- the main finding
  implication TEXT,                    -- the "so what"
  evidence JSONB NOT NULL,             -- structured data backing the claim
  related_engagements UUID[],
  related_patterns TEXT[],
  related_nodes JSONB DEFAULT '{}'::jsonb,  -- graph node refs for visualization
  first_generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_confirmed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at TIMESTAMPTZ,
  UNIQUE (detector_key, title)
);

CREATE INDEX idx_insights_category ON engagement_insights(category);
CREATE INDEX idx_insights_active ON engagement_insights(last_confirmed_at) WHERE archived_at IS NULL;
```

### Worker

`src/scripts/insights/generate-nightly.ts` — runs via Vercel Cron at 2am UTC. Each detector is a function returning `InsightCandidate[]`. Results upserted by `(detector_key, title)` — stable IDs across runs, `last_confirmed_at` bumps if the same insight persists.

---

## Sub-surface 3 · Live — "What Nexus is reasoning about right now"

Operational pulse across all engagements + Tower + knowledge refreshes. The "system working" view.

### Layout

```
INTELLIGENCE · LIVE
────────────────────────────────────────────────────────────
Last updated · 12 seconds ago · auto-refresh every 30s

┌──── ACTIVE ENGAGEMENTS ────────────────────────────────┐
│                                                        │
│ ● Meridian · Analytics Modernization                   │
│   Phase 1 Diagnose · last turn 4m ago by Sarah Chen    │
│   Currently referencing: NIST AI RMF § 3.2.1, HIPAA    │
│                                                        │
│ ● First Capital · Advisor Copilot Rollout              │
│   Phase 0 Charter · last turn 2h ago                   │
│   Currently referencing: FINRA AI guidance             │
│                                                        │
│ ○ Apex Retail · HR Assistant Governance                │
│   Phase 2 Design · last turn 18h ago                   │
└────────────────────────────────────────────────────────┘

┌──── TOWER PULSE ───────────────────────────────────────┐
│                                                        │
│ 5 contradictions active across 3 clients               │
│   3 HIGH · 2 MEDIUM                                    │
│   Newest: Shadow AI at Meridian · 3h ago               │
│                                                        │
│ Cost trajectory: 2 clients projected >1.5x in 6mo      │
│ Vendor postures: 1 update pending review (Anthropic)   │
└────────────────────────────────────────────────────────┘

┌──── KNOWLEDGE PULSE ───────────────────────────────────┐
│                                                        │
│ 34 sources active · 3 refreshed today · 2 stale        │
│                                                        │
│ Recent refreshes:                                      │
│   ✓ NIST AI RMF · 2h ago · no changes                  │
│   ✓ HHS OCR enforcement · 4h ago · 2 new cases         │
│   ✓ CMS Hospital Compare · 6h ago · Q4 data published  │
│                                                        │
│ Stale:                                                 │
│   ⚠ ISO 42001 abstract · 94 days since check           │
│   ⚠ FDIC Quarterly · 62 days since check               │
└────────────────────────────────────────────────────────┘

┌──── PATTERN ACTIVITY · LAST 24H ──────────────────────┐
│                                                        │
│ F008 · AI investment without verified ROI              │
│   Triggered in Meridian (3h ago), First Capital (1d ago)│
│                                                        │
│ F007 · CDO vacancy                                     │
│   Triggered in Meridian (6h ago)                       │
│                                                        │
│ F012 · Vendor lock-in                                  │
│   Triggered in Apex Retail (9h ago) — first in retail  │
└────────────────────────────────────────────────────────┘
```

### What it does

- Pulls active engagements (last turn < 48h) and shows what they're currently referencing (from turn traces via Pack D Principle 6)
- Summarizes Tower contradictions across clients
- Shows knowledge refresh health
- Pattern activity feed

### Auto-refresh

Every 30s via SWR. Optimistic — if the tab is backgrounded, refresh pauses.

### Powers

Primarily read-only aggregations over data that already exists. No new data model. ~1 day of work.

---

## Menu restructure (bundled here — also in Pack F)

Intelligence remains top-level. When user clicks Intelligence, they land on Library by default. Sub-tabs for Insights + Live.

The 9 old "product" pages (Situation Intelligence, Signal Intelligence, etc.) **redirect to Library with the matching lens filter preselected.** Old URLs continue to work — nothing 404s.

### Redirect map

| Old route | New route |
|---|---|
| `/intelligence/situation` | `/intelligence/library?lens=situation` |
| `/intelligence/signal` | `/intelligence/library?lens=signal` |
| ... | ... |
| `/intelligence` | `/intelligence/library` |

Clean redirect, no dead links, old bookmarks preserved.

---

## Acceptance criteria

Anand opens `/intelligence`:

- Library tab active by default. Sees 39 source cards, filterable by content type + industry + search.
- Insights tab has ≥ 5 live cards within 24h of pack landing.
- Live tab shows Meridian engagement with current references, Tower pulse, knowledge health, pattern activity.
- Clicking any entity (source, pattern, engagement) opens the reasoning graph centered on that node.
- Nothing breaks when no engagements are active — empty states are graceful.

**The moment it's working:** Anand can walk Shail from Library ("this is what Nexus knows — 39 sources across regulations, frameworks, benchmarks, vendors") → Insights ("this is what Nexus has learned from three engagements — it already sees F008 concentrating in healthcare, it already sees phase timing matters") → Live ("this is what's happening across the portfolio right now"). Three clicks, one narrative, visible moat.

---

## What this pack ships

Intelligence goes from a list of 9 product names to three lived surfaces. Each grows stronger with every engagement, every knowledge refresh, every pattern trigger.

The 9-lens framing doesn't disappear — it becomes filter chips on Library, still available to anyone who wants to navigate by lens.

This is the pack that makes the flywheel *visible*.
