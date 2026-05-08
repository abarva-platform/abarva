# AI Initiatives Substrate Package · README

**Version:** 1.0.0
**Locked:** 2026-05-07
**Outcome:** 21 real AI initiatives loaded into substrate across 3 demo tenants, surfaced via new Home → AI Initiatives panel. Downstream packages (Tower Fix, Intelligence Augmentation) get real data to bind to.

---

## What this package does

Creates the canonical AI Initiatives Registry as substrate. After this lands:

- Tower's "23 programs plotted" becomes literal — there are 21 named programs in the registry across tenants
- Intelligence's "Art of the Possible" cards ground in real initiatives, not invented scenarios
- Strategic Moves' P0 Originate flow has real context for "what's already in flight"
- Atlas / Sentinel / Steward can cite real initiatives by name with real KPI history
- The day-1 manual-load story is explicit and visible (every record carries `loaded_via_template`)

---

## Files in this package

```
ai-initiatives-package/
├── README.md                                  (this file)
├── master-prompt.md                           orchestration · execution order
├── INVENTORY.md                               21 initiatives · human-readable
├── CATEGORY_TAXONOMY.md                       8 AI categories with definitions
├── BUSINESS_GOAL_LINKAGE.md                   which business goal each initiative serves
├── DATA_MODEL.md                              database schema · DDL
├── HOME_UI_SPEC.md                           Home → AI Initiatives view spec
├── LOAD_INSTRUCTIONS.md                       step-by-step ingestion runbook
└── templates/
    ├── apex-retail/full_load.json             (7 initiatives + supporting data)
    ├── first-capital-financial/full_load.json (7 initiatives + supporting data)
    └── meridian-health/full_load.json         (7 initiatives + supporting data)
```

---

## How to execute

1. Read `master-prompt.md` first
2. Read `INVENTORY.md` to understand the 21 initiatives
3. Read `CATEGORY_TAXONOMY.md` and `BUSINESS_GOAL_LINKAGE.md` for the structure
4. Read `DATA_MODEL.md` for the database schema
5. Read `HOME_UI_SPEC.md` for the Home view to build
6. Follow `LOAD_INSTRUCTIONS.md` step-by-step

Total elapsed: 2-4 days for full execution by Claude Code.

---

## What's in each tenant

### Apex Retail (7 initiatives)

| ID | Name | Stage | $ | ⭐ |
|---|---|---|---|---|
| AR-01 | Store Associate Copilot | Pilot | $1.6M | |
| AR-02 | GitHub Copilot for Engineering | Scaled | $0.9M | |
| AR-03 | Autonomous Customer Service Agent | Pilot | $2.1M | ⭐ |
| AR-04 | SAP Joule for Merchandise Planning | Y1 of 2 | $3.4M | |
| AR-05 | Demand Forecasting Modernization | Scaled | $0.7M | ⭐ |
| AR-06 | AI Cost Attribution Platform | Pilot | $0.4M | |
| AR-07 | Personalization Engine v3 | Scaled | $2.8M | |

### First Capital Financial (7 initiatives)

| ID | Name | Stage | $ | ⭐ |
|---|---|---|---|---|
| FCF-01 | M365 Copilot for Knowledge Workers | Pilot | $1.4M | |
| FCF-02 | AI-Assisted Code Review for Risk Eng | Pilot | $0.3M | |
| FCF-03 | Advisor Decision-Support AI | Pilot | $1.1M | |
| FCF-04 | Credit Decisioning Modernization | Y1 of 2 | $4.6M | ⭐ |
| FCF-05 | Fraud Detection AI Refresh | In Move | $2.2M | |
| FCF-06 | Conversational Banking Assistant | Pilot | $1.7M | |
| FCF-07 | Model Risk Governance Operating Model | In progress | $0.8M | ⭐ |

### Meridian Health (7 initiatives)

| ID | Name | Stage | $ | ⭐ |
|---|---|---|---|---|
| MH-01 | Clinical Documentation Copilot | Scaled | $4.1M | ⭐ |
| MH-02 | Vibe Coding Rollout for IT | Pilot | $0.4M | |
| MH-03 | Autonomous Helpdesk via ServiceNow | Pilot | $0.9M | |
| MH-04 | Epic AI for Revenue Cycle | Y1 of 2 | $2.6M | ⭐ |
| MH-05 | Clinical Risk Stratification ML | Scaled | $0.6M | |
| MH-06 | Joule (SAP) Pilot for Finance | Pilot | $3.2M | |
| MH-07 | Model Governance & FinOps Platform | Y1 of 3 | $4.2M | |

---

## The 8 AI categories

1. **CAT-01 · LLM Productivity** — Copilot rollouts, M365 Copilot, SAP Joule, internal Copilot pilots
2. **CAT-02 · Developer & IT SDLC AI** — Cursor, GitHub Copilot, AI code review
3. **CAT-03 · Agentic Operations** — ServiceNow Now Assist, Sierra, autonomous agents
4. **CAT-04 · ERP & Domain Agents** — SAP Joule for finance, Epic AI for revenue cycle
5. **CAT-05 · Predictive ML** — credit decisioning, fraud detection, clinical risk
6. **CAT-06 · AI Infrastructure & FinOps** — token routing, model governance platforms
7. **CAT-07 · Customer-Facing AI** — chatbots, personalization, conversational banking
8. **CAT-08 · Compliance & Governance AI** — automated control monitoring, model risk

Distribution per tenant favors industry context (Apex heavy on customer-facing; FCF heavy on predictive ML + compliance; Meridian heavy on ERP agents + infrastructure).

---

## The 12 business goals

Each tenant has 4 named business goals. Initiatives link to goals via FK. UI defaults to "By Business Goal" view because that's what CXO recognizes.

**Apex Retail:** defend margin · improve cost-to-serve · accelerate digital growth · build AI foundation
**First Capital:** defend NIM · achieve regulatory posture · reduce loss · productivity uplift
**Meridian Health:** address physician burnout · restore margin · improve outcomes · build safe AI foundation

---

## Why this matters

Every prior package (Setup Redesign, Intelligence Augmentation, Tower Fix) assumed substrate existed. **This is the substrate.** Without it those packages render fragments.

After this lands, the demo story is legible:

- "What AI initiatives are you tracking?" → answered by the registry, not invention
- "Where did that number come from?" → click-through to substrate via provenance tab
- "How did you load all this?" → Home → Data Trust + Provenance tab show templates and refresh state
- "What will this look like in production?" → templates marked as day-1; integrations come later replacing them

This is the substrate-ahead-of-surface discipline applied honestly. Surface work resumes after substrate is real.

---

## Dependencies and downstream effects

**Upstream:** Home Redesign Package (Home nav must be in modern shape before AI Initiatives panel adds to it). If Home Redesign hasn't shipped, AI Initiatives panel can be added to current Home nav and migrated when Home Redesign lands.

**Downstream:**
- Tower Fix Package — strategic alignment 2×2 binds to real initiatives
- Intelligence Augmentation Package — Move cards bind to real initiatives + business goals
- Strategic Moves — initiative reference field added to Nexus capture
- Source — vendor intelligence binds to vendors named in initiatives

---

## What NOT to do

- Do not invent additional initiatives beyond the 21 in INVENTORY.md (the inventory is the source of truth)
- Do not skip provenance fields (every record must have `loaded_via_template`)
- Do not change category taxonomy without doctrine update (8 categories are locked)
- Do not change the aligned-callout count (2 per tenant, by design — they're the strategic anchors)
- Do not load before schema migrations apply (FK constraints will fail)

---

## Done state

After execution:

- 21 initiatives in DB
- 12 business goals in DB
- ~50 KPI history records, ~12 stakeholder notes, ~15 decisions, ~14 vendor records, ~10 scenarios
- Home → AI Initiatives view renders for all 3 tenants with By Goal / By Category / Table views
- Detail page works with 7 tabs per initiative
- Provenance tab shows template name and version
- Substrate tagged `ai_initiatives_v1.0.0`
- Downstream packages unblocked

Total: ~2-4 days execution.

---

## Final note

This package is the foundation everything else has been waiting for. Ship this first; everything downstream becomes easier. Without this, every demo has to invent context that doesn't exist in substrate. With this, every demo grounds in something real and queryable.

Recommended execution order across all packages now:

1. **AI Initiatives Substrate Package** (this one) — ship first
2. **Home Redesign Package** — can ship in parallel
3. **Tower Fix Package** — ships after this; revised T-1/T-2/T-3 specs bind to real data
4. **Intelligence Augmentation Package** — ships after this; data binding catalog already references the new substrate
