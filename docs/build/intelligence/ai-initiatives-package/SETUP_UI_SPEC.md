# Setup UI Spec · AI Initiatives Registry View

The registry surfaces in Setup as a new panel: **Setup → AI Initiatives**. This becomes the canonical "what AI is in flight" view for a tenant. Every other surface (Tower, Intelligence, Strategic Moves) reads from this registry.

---

## Setup nav placement

Per the Setup Redesign Package, Setup nav is being reduced from 10 panels to 6. Add AI Initiatives as the 7th panel:

```
Setup nav (post-redesign + this package):
  Overview · Data Trust · AI Initiatives · Agent Readiness · Connectors · Tenant Profile · Configuration
```

AI Initiatives sits between Data Trust and Agent Readiness because it depends on Data Trust (substrate must be loaded) and feeds Agent Readiness (agents need to know what initiatives exist to reason about them).

---

## Page · `/setup/ai-initiatives`

### Header

> **AI Initiatives Registry**
> The canonical inventory of AI initiatives across [tenant name]. 21 initiatives loaded · last refreshed [timestamp].

### Primary toggle · view mode

```
[ By Business Goal (default) ] [ By Category ] [ All initiatives (table) ]
```

Default view: By Business Goal (because that's what CXO recognizes; category is platform internal).

---

## View 1 · By Business Goal (default)

For each business goal, list the initiatives serving it:

```
┌─────────────────────────────────────────────────────────────┐
│ MH-GOAL-01 · Address physician burnout · improve retention  │
│ Strategic context: physician shortage acute. Burnout-driven │
│ attrition costing $400K-$1.2M per departing physician.      │
│ Documentation burden cited as #1 driver.                    │
│                                                             │
│ Initiatives serving this goal:                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ⭐ MH-01 · Clinical Documentation Copilot               │ │
│ │ LLM Productivity · Scaled · Dr. A. Hassan · CMIO        │ │
│ │ $4.1M annual · Healthy · physician satisfaction +21 pts │ │
│ │ [ View detail ] [ Loaded from template → ]              │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ MH-GOAL-02 · Restore margin · accelerate financial recovery │
│ ...                                                          │
│ Initiatives:                                                 │
│   ⭐ MH-04 · Epic AI for Revenue Cycle  · $2.6M · Y1 of 2   │
│      MH-06 · Joule (SAP) Pilot for Finance · $3.2M · Pilot  │
└─────────────────────────────────────────────────────────────┘

[... 2 more goals ...]
```

⭐ marker on aligned-callout initiatives.

---

## View 2 · By Category

For each AI category, list the initiatives in that category:

```
┌─────────────────────────────────────────────────────────────┐
│ CAT-01 · LLM Productivity                                    │
│ General-purpose AI assistants embedded in everyday work.     │
│                                                              │
│ Initiatives in this category (1):                            │
│   ⭐ MH-01 · Clinical Documentation Copilot · $4.1M          │
│      Goal: Address physician burnout                         │
│      Owner: Dr. A. Hassan · CMIO                             │
└─────────────────────────────────────────────────────────────┘

[... 7 more categories shown only if initiatives exist ...]
```

Categories with no initiatives for this tenant are hidden (not shown empty).

---

## View 3 · All Initiatives (table)

Flat sortable / filterable table:

| ⭐ | ID | Initiative | Category | Goal | Stage | Owner | $ | Status | Provenance |
|---|---|---|---|---|---|---|---|---|---|
| ⭐ | MH-01 | Clinical Documentation Copilot | LLM Productivity | Burnout | Scaled | Hassan | $4.1M | Healthy | template→ |
| | MH-02 | Vibe Coding Rollout | Developer SDLC | Foundation | Pilot | Iyer | $0.4M | Pilot | template→ |
| | MH-03 | Autonomous Helpdesk | Agentic Ops | Foundation | Pilot | Park | $0.9M | Duplication | template→ |
| ⭐ | MH-04 | Epic AI Revenue Cycle | ERP Agents | Margin | Y1 of 2 | Williams | $2.6M | Mid-deploy | template→ |
| | MH-05 | Clinical Risk ML | Predictive ML | Outcomes | Scaled | Kim | $0.6M | Healthy | template→ |
| | MH-06 | Joule for Finance | ERP Agents | Margin | Pilot | SAP COE | $3.2M | Value lag | template→ |
| | MH-07 | Governance & FinOps Platform | AI Infra | Foundation | Y1 of 3 | Iyer/Castillo | $4.2M | Foundation | template→ |

Filters: category · stage · status · owner · aligned-only
Sort: any column

---

## Initiative detail page · `/setup/ai-initiatives/[initiative-id]`

Per-initiative deep view. Tabs:

```
[ Overview ] [ KPIs ] [ Stakeholders ] [ Decisions ] [ Vendors ] [ Scenarios ] [ Provenance ]
```

### Overview tab
- Full description
- Category + goal links
- Stage / owner / committed / measured value
- Status flag with confidence
- Aligned-callout rationale (if aligned)
- Edit affordances (admin only)

### KPIs tab
Table of all KPIs over time with trend visualization. Columns: KPI · Q1-2024 · Q2-2024 · ... · current quarter. Confidence indicator per cell.

### Stakeholders tab
List of stakeholder notes. Each note: name · title · interview date · quote · themes · attribution consent flag.

### Decisions tab
List of decisions traced for this initiative. Each: decision name · date · sponsor · status · dissent (if any).

### Vendors tab
List of vendors involved. Each: vendor · contract value · renewal date · financial health · notes.

### Scenarios tab
Forward-looking scenarios. Each: scenario name · trigger · time horizon · probability · impact.

### Provenance tab
The "how did this get loaded" view. Shows:
- Template name and version that loaded each piece of substrate
- Last refresh timestamp per substrate type
- Integration target (when manual templates will be replaced by real integrations)

This is the "day-1 vs future" honesty surface — explicit about what's manual now and what's planned to be integrated.

---

## Cross-surface implications

After the registry exists in Setup:

**Tower** reads from `ai_initiatives` to populate the strategic alignment 2×2. The "23 programs plotted" claim becomes literal — there are exactly N programs in the registry, and the chart shows them. No invention.

**Intelligence** reads from `ai_initiatives` to ground its Move recommendations. "Credit decisioning modernization" as a candidate Move ties to FCF-04 in the registry. Sentinel can answer "what AI initiatives are running?" by querying the registry directly.

**Strategic Moves** reads from `ai_initiatives` when scoping a new Move's "What's already in flight" section. Move-to-initiative linkage allows tracking when a Move advances an initiative or sunsets one.

**Atlas (Tower right rail)** cites initiatives by ID. "P-VALUE-2026-05" cards now link to the underlying initiative MH-06 (Joule for Finance) so a CXO can click through to see the full context.

This is the substrate everything has been waiting for.

---

## Acceptance criteria for Setup → AI Initiatives view

1. Page loads at `/setup/ai-initiatives` for authenticated tenant context
2. Default view is "By Business Goal"
3. Toggle switches to "By Category" and "All initiatives" without page reload
4. ⭐ marker visible on the 2 aligned-callout initiatives per tenant
5. Each initiative card shows: name · category · stage · owner · $ · status · provenance link
6. Click into initiative opens detail page with 7 tabs
7. Provenance tab shows `loaded_via_template` value for each substrate piece
8. Filtering / sorting works on table view
9. Empty state if no initiatives loaded: "No AI initiatives loaded yet · Run substrate load via [link]"
10. View renders correctly for all 3 demo tenants (Apex Retail · FCF · Meridian)

---

## QA · browser-Chrome verification

```
Step 1 · Navigate to /setup (authenticated as Castillo · Meridian)
  - assert: AI Initiatives appears in Setup nav (7th panel)
  - screenshot

Step 2 · Click AI Initiatives
  - assert: page loads with "By Business Goal" view active by default
  - assert: 4 business goal sections render (MH-GOAL-01 through MH-GOAL-04)
  - assert: 7 initiatives total visible across goals
  - assert: 2 ⭐ markers visible (MH-01, MH-04)
  - screenshot

Step 3 · Toggle to "By Category" view
  - assert: 6 category sections render (no LLM Productivity standalone since MH has only 1; no Customer-Facing AI for Meridian)
  - actually: 6 categories represented for Meridian per inventory
  - screenshot

Step 4 · Toggle to "All initiatives (table)" view
  - assert: 7 rows render
  - assert: filterable / sortable
  - screenshot

Step 5 · Click into MH-01 · Clinical Documentation Copilot
  - assert: detail page loads with 7 tabs
  - assert: Overview tab default
  - assert: aligned-callout rationale visible
  - screenshot

Step 6 · Click Provenance tab
  - assert: shows template name and version that loaded each substrate piece
  - assert: shows refresh timestamps
  - screenshot

Step 7 · Switch tenant to First Capital Financial
  - assert: registry now shows FCF's 7 initiatives
  - assert: 2 ⭐ markers (FCF-04, FCF-07)
  - screenshot

Step 8 · Switch tenant to Apex Retail
  - assert: registry shows Apex's 7 initiatives
  - assert: 2 ⭐ markers (AR-03, AR-05)
  - screenshot
```

8 browser-Chrome screenshots minimum.
