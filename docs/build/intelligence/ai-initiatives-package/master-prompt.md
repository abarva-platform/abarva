# AI Initiatives Substrate Package · Master Prompt

**Surface scope:** Substrate-only. No UI changes in this package.
**Data scope:** 21 named AI initiatives across 3 demo tenants (7 per tenant) + supporting substrate (KPI history, stakeholder notes, decision traces, vendor intelligence, scenario library) for each initiative.
**Outcome:** After this package executes, Tower / Intelligence / Strategic Moves all surface real data instead of fragments.

---

## What this package does

Creates the canonical AI Initiatives Registry as substrate, then loads supporting data so every initiative has full context (KPIs, stakeholders, decisions, vendors, scenarios). After this lands, every number and card on Tower/Intelligence is grounded in a real, queryable initiative.

**Three demo tenants:**
- Apex Retail (retail · omnichannel · large)
- First Capital Financial (regional bank · regulated)
- Meridian Health (health system · regulated · multi-hospital)

**21 named initiatives** spread across 8 AI categories, each tied to a named business goal, each with stage / owner / committed $ / status.

---

## Why this matters

Every prior package (Setup Redesign, Intelligence Augmentation, Tower Fix) assumed substrate existed. This is the substrate. Without this load, those packages have nothing real to render.

After this package:
- Tower's "23 programs plotted" becomes literal — there are 21+ named programs in the registry across tenants
- Intelligence's "Art of the Possible" cards ground in real initiatives, not invented scenarios
- Strategic Moves' P0 Originate flow has real context for "what's already in flight"
- Sentinel and Atlas can cite real initiatives by name with real KPI history

---

## Files in this package

```
ai-initiatives-package/
├── master-prompt.md                                  (this file)
├── INVENTORY.md                                      (the 21 initiatives — human readable)
├── CATEGORY_TAXONOMY.md                              (the 8 categories with definitions)
├── BUSINESS_GOAL_LINKAGE.md                          (which goal each initiative serves)
├── DATA_MODEL.md                                     (database schema · table definitions)
├── SETUP_UI_SPEC.md                                  (where in Setup the registry surfaces)
├── LOAD_INSTRUCTIONS.md                              (step-by-step ingestion runbook)
└── templates/
    ├── apex-retail/
    │   ├── ai_initiatives.json                       (7 initiatives)
    │   ├── kpi_history.json                          (per initiative · 8 quarters)
    │   ├── stakeholder_notes.json                    (per initiative · 1-3 quotes each)
    │   ├── decision_traces.json                      (per initiative · key decisions)
    │   ├── vendor_intelligence.json                  (vendors named in initiatives)
    │   └── scenarios.json                            (forward-looking scenarios)
    ├── first-capital-financial/
    │   └── ... (same shape, FCF data)
    └── meridian-health/
        └── ... (same shape, Meridian data)
```

---

## Execution order · for Claude Code

1. **Read INVENTORY.md** to understand all 21 initiatives
2. **Read CATEGORY_TAXONOMY.md** to understand the 8 categories
3. **Read DATA_MODEL.md** to understand the database schema
4. **Read SETUP_UI_SPEC.md** to understand where this surfaces in Setup
5. **Read LOAD_INSTRUCTIONS.md** for the actual ingestion steps
6. **Apply the database migrations** (schema in DATA_MODEL.md)
7. **Load all template JSON files** into the database per LOAD_INSTRUCTIONS.md
8. **Build the Setup → AI Initiatives Registry view** per SETUP_UI_SPEC.md
9. **Verify via browser-Chrome MCP tool** that the registry renders for all 3 tenants
10. **Tag the substrate** as `ai_initiatives_v1.0.0` for downstream packages to depend on

After this lands, Tower Fix Package T-1/T-2/T-3 and Intelligence Augmentation Package can be revisited to bind to real data.

---

## Doctrine constraints · do not violate

1. **Real categories, real initiative shapes** — categories drawn from the actual landscape of enterprise AI work in 2026 (Copilot rollouts, vibe coding, ERP agents, ServiceNow agentic, etc.), not invented
2. **Each initiative tied to a business goal** — every initiative has `business_goal_id` foreign key; no orphaned initiatives
3. **Per-tenant variation is real** — Apex Retail's profile differs from FCF differs from Meridian, reflecting industry context
4. **Substrate provenance preserved** — every record carries `loaded_via_template` field with the template name (this is the day-1 manual-load marker that future integrations will replace)
5. **Confidence levels on all KPIs** — HIGH/MED/LOW per the platform doctrine
6. **Two "aligned with business goal" callouts per tenant** — explicit `aligned_callout: true` flag on the two highest-strategic-value initiatives per tenant

---

## What ships when

- **Day 1:** Schema migrations applied
- **Day 1-2:** Template JSON files loaded for all 3 tenants
- **Day 2-3:** Setup → AI Initiatives Registry view built
- **Day 3:** Browser-Chrome verification across all 3 tenants
- **Day 4:** Substrate tagged `ai_initiatives_v1.0.0`; downstream packages unblocked

Total: ~4 days for substrate + Setup view. After this, everything else can move.
