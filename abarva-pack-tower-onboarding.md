# AbarVa Build Pack G · Tower Onboarding & Data Ingestion

**Date:** April 19, 2026
**Scope:** Close the gap between "Tower exists" and "a new client can populate their Tower in 15 minutes." Five phases: in-app data source catalog, downloadable templates, demo data generator, guided onboarding flow, and upload classifier.
**Effort:** ~4-5 days. Fits Week 2-3, can run parallel with Pack C on a separate worktree.
**Why it matters:** without this pack, Shail asks *"how does my portfolio company populate this?"* and the honest answer is *"we hand-seeded Meridian."* With this pack, the answer is *"here's the catalog, here's the template, here's demo mode, here's the guided flow — pick a company tomorrow."*

---

## The problem

Today the Tower has one good ingestion affordance — the "Drop any file — I'll figure out what it is" drop zone at the bottom. That's not enough for production:

1. The customer doesn't know what to drop. *ServiceNow export? AWS Cost Explorer CSV? Something else?*
2. Even if they export something, they don't know which columns map to which Tower dimension.
3. A brand-new client lands on an empty Tower with five "no data" panels. First impression: broken product.
4. Nothing tells them the system can show ServiceNow, Workday, M365, AWS — they might not even know what to ask for.

Five phases below fix each of those.

---

## Phase 1 · In-app data source catalog

**Intent:** For each Tower dimension, show exactly what data we need, where to find it in common enterprise systems, and how to export it. Lives at `/tower/onboard` with per-dimension deep links.

### Layout

```
/tower/onboard?dimension=cost

CONTROL TOWER · DATA SETUP · 5 · COST
─────────────────────────────────────────────────────────────
Populate the Cost dimension — track AI spend across vendors,
compute, and licenses. Typical setup time: 15 minutes.

WHAT WE NEED
  ▸ Monthly spend by vendor (LLM API providers, SaaS licenses)
  ▸ Compute costs (cloud provider billing exports)
  ▸ License counts and prices (per-seat SaaS)
  ▸ Usage-based costs (tokens, API calls)

WHERE TO FIND IT
  ── AWS Cost Explorer ──────────────────────── [expand ▾]
  ── Azure Cost Management ─────────────────── [expand ▾]
  ── Google Cloud Billing ──────────────────── [expand ▾]
  ── Microsoft 365 / Copilot admin ─────────── [expand ▾]
  ── Anthropic / OpenAI usage console ──────── [expand ▾]
  ── ServiceNow (for license inventory) ────── [expand ▾]
  ── Workday (for cost center allocation) ──── [expand ▾]
  ── Don't have any of these? ──────────────── [Upload manual CSV ▸]

[Download template · Cost.csv]   [Download template · Cost.xlsx]   [Paste data ▸]
```

### Per-system accordion content (example: AWS)

When user clicks "AWS Cost Explorer":

```
AWS Cost Explorer — Export your AI-related spend

WHAT TO EXPORT
  A monthly cost report filtered to AI services (Bedrock, SageMaker,
  EC2 instances tagged for ML workloads, S3 buckets with AI datasets).

STEPS
  1. Go to AWS Console → Billing → Cost Explorer
  2. Filter: Service = Bedrock OR SageMaker OR "EC2 (ML instances)"
  3. Group by: Service, Usage type
  4. Granularity: Monthly
  5. Time range: Last 3 months
  6. Export → CSV

FIELDS WE USE
  ▸ Service name       → maps to vendor
  ▸ Usage type         → maps to cost category (compute, storage, API)
  ▸ Cost (USD)         → monthly_spend_usd
  ▸ Time period        → billing_month

TIP
  If you have multiple AWS accounts, export from the consolidated
  billing account to get org-wide visibility.

[Download AWS mapping template ▸]
```

Same treatment for each Tier 1 system.

### Tier 1 systems to ship with the pack (8)

| System | Dimension relevance |
|---|---|
| **ServiceNow** | Inventory (AI tool asset list), Risk (incident tickets) |
| **Workday** | Adoption (employee counts by function), Value (FTE cost for ROI calcs) |
| **Microsoft 365 / Graph** | Adoption (Copilot seats + usage), Cost (M365 licenses), Inventory |
| **AWS Cost + Usage** | Cost (compute spend), Inventory (services provisioned) |
| **Azure Cost Management** | Cost (LLM spend via Azure OpenAI), Inventory |
| **Google Cloud Billing** | Cost, Inventory |
| **Okta / Entra ID** | Adoption (license assignments), Risk (access patterns) |
| **Snowflake** | Value (model output → revenue attribution, if deployed there) |

### Files

- `src/app/tower/onboard/page.tsx` — dimension selector + catalog
- `src/app/tower/onboard/[dimension]/page.tsx` — per-dimension page
- `src/lib/tower/onboarding-catalog.ts` — structured data for all 8 systems × 5 dimensions
- `public/templates/tower/` — downloadable templates (Phase 2)

### Commit

```
feat(tower-onboard): in-app data source catalog with per-dimension guidance for 8 Tier-1 systems
```

---

## Phase 2 · Downloadable templates

**Intent:** Six templates the customer can download, fill, and drop back into Tower. Validated, versioned, self-describing.

### Templates to ship

| Template | Format | Purpose |
|---|---|---|
| `tower-inventory.csv` | CSV | Use case list with status, owner, vendor |
| `tower-inventory.xlsx` | Excel w/ validation | Same, with dropdowns for status, vendor, data classes |
| `tower-adoption.csv` | CSV | DAU/WAU, penetration, drop-off per use case |
| `tower-value.csv` | CSV | Baseline vs observed metrics, verified value |
| `tower-risk.csv` | CSV | Approval status, data classes, vendor posture, incidents |
| `tower-cost.csv` | CSV | Monthly spend by vendor × category × use case |
| `tower-bundle.xlsx` | Excel workbook | All 5 above as sheets, with README sheet |
| `tower-bundle.json` | JSON | API-style ingestion, fully typed |

### Template structure — example: `tower-inventory.csv`

```csv
# AbarVa Control Tower · Inventory Template v1.0
# Fill one row per AI use case. Required columns marked with *.
# Download updated versions from /tower/onboard?dimension=inventory

use_case_id*,name*,description,status*,business_owner,technical_owner,vendor,product,data_classes,launch_date,last_reviewed
# Example row:
uc_001,Copilot Clinical Documentation,Ambient clinical documentation for providers,production,Dr. Sarah Chen,IT Platform Team,Microsoft,Copilot Clinical,PHI|clinical_notes,2024-11-15,2025-09-22
# Status options: pilot | production | stalled | sunset
# Data classes: PHI | PII | financial | clinical_notes | public (pipe-separated for multiple)
```

Every template has a header comment block explaining:
- What the template is for
- Which columns are required
- Enum values for constrained fields
- Where to find the data in common systems
- Version stamp so we can evolve without breaking existing uploads

### Excel bundle — interactive validation

`tower-bundle.xlsx` has:
- **README sheet** — overview, legend, version, links to in-app catalog
- **Inventory, Adoption, Value, Risk, Cost** — five data sheets
- Cell-level validation: dropdowns for status/data_classes, date pickers for date fields, number format enforcement for costs/percentages
- Conditional formatting: red cells for missing required data, green for complete
- Data validation rules defined in `src/scripts/templates/generate-xlsx.ts` so the Excel is *generated* from schema, not hand-maintained

### JSON template — for API-style ingestion

`tower-bundle.json`:

```json
{
  "template_version": "1.0",
  "client_reference": "meridian",
  "as_of_date": "2025-10-15",
  "inventory": [ { "use_case_id": "uc_001", "name": "...", "status": "production", ... } ],
  "adoption": [ { "use_case_id": "uc_001", "dau": 1240, "wau": 3850, "penetration_pct": 47.2, ... } ],
  "value": [ { "use_case_id": "uc_001", "metric_name": "documentation_time_saved", "baseline": 12.5, "observed": 8.2, "unit": "minutes_per_encounter", ... } ],
  "risk": [ { "use_case_id": "uc_001", "approval_status": "approved", "data_classes": ["PHI", "clinical_notes"], "vendor_posture": { "hipaa_baa": true, "soc2": true }, ... } ],
  "cost": [ { "use_case_id": "uc_001", "month": "2025-10", "category": "license", "vendor": "Microsoft", "amount_usd": 45000 }, ... ]
}
```

A customer with engineering resources POSTs this to `/api/tower/ingest` and skips the CSV dance entirely.

### Files

- `src/scripts/templates/schema.ts` — shared schema
- `src/scripts/templates/generate-csv.ts` — generates CSV templates with headers
- `src/scripts/templates/generate-xlsx.ts` — generates Excel bundle with validation
- `src/scripts/templates/generate-json.ts` — generates empty JSON bundle
- `src/scripts/templates/build-all.ts` — runs all three generators, outputs to `public/templates/tower/`

### Build step

Add to `package.json`:
```json
"scripts": {
  "templates:build": "tsx src/scripts/templates/build-all.ts"
}
```

Run at build time (`npm run build`) or manually when the schema evolves.

### Commit

```
feat(tower-onboard): downloadable templates — CSV, Excel with validation, JSON bundle
```

---

## Phase 3 · Demo data generator

**Intent:** One-click seed realistic synthetic data for any client. Lights up all 5 Tower dimensions + at least 3 contradictions. Clearly labeled demo, dismissible.

### Parameters

```typescript
interface DemoDataOptions {
  clientId: string;
  industry: 'HEALTHCARE_IDN' | 'FINSERV' | 'RETAIL';
  orgSize: 'small' | 'mid' | 'enterprise';     // affects use case count + scale
  aiMaturity: 'early' | 'scaling' | 'mature';   // affects patterns + contradictions
}
```

### Industry × maturity patterns

**Healthcare IDN × Scaling** (like Meridian today):
- 10 use cases mixing clinical + operational
- Copilot Clinical, Claims Triage, Patient Messaging, Chart Summarization, etc.
- 1-2 PHI classifications
- F008 (AI ROI) triggering
- Cost trajectory 1.5-2x projected
- Contradictions: cost_vs_adoption on Copilot, shadow_ai on untracked OpenAI spend

**FinServ × Early**:
- 5-7 use cases, mostly pilots
- Advisor Copilot, Alt-Asset Classifier, Fraud Signal Assistant
- High shadow AI (early maturity)
- Low verified value
- Cost rising rapidly
- Contradictions: shadow_ai high, risk_vs_data on PII/financial

**Retail × Mature**:
- 12-15 use cases, more production
- Personalization engine, demand forecast, HR assistant, knowledge assistant
- Governance in place, lower shadow AI
- Verified value emerging
- Cost stabilizing
- Contradictions: value_vs_adoption on older pilots, vendor_consolidation opportunity

Full maturity × industry matrix documented in `src/scripts/demo-data/patterns.ts`.

### Generator architecture

```typescript
// src/scripts/demo-data/generate.ts
export async function seedDemoData(options: DemoDataOptions) {
  const useCases = generateUseCases(options);                    // 5-15 realistic use cases
  const adoption = generateAdoption(useCases, options);          // DAU/WAU scaled to orgSize
  const value = generateValue(useCases, options);                // baseline/observed with realistic gaps
  const risk = generateRisk(useCases, options);                  // approval mix, data classes
  const cost = generateCost(useCases, options);                  // monthly spend with trajectory
  const contradictions = detectContradictions({adoption, value, risk, cost}); // run the same detectors as real Tower

  await writeToPostgres(options.clientId, {useCases, adoption, value, risk, cost, contradictions});
  await markAsDemoData(options.clientId);
}
```

### Demo data hygiene

Every row inserted by the generator gets:
- `is_demo_data: true` column (add to all tower tables)
- `demo_seed_version` with the generator version
- `created_by: 'demo_seed'`

In the UI, when a client has demo data, a banner at the top of Tower:
```
◆ Demo data · This client's Tower is populated with synthetic
  data for exploration. Your real data will replace it when
  you upload. [Remove demo data] [Start upload]
```

One click to wipe:
```typescript
export async function removeDemoData(clientId: string) {
  await supabase.from('use_cases').delete().eq('client_id', clientId).eq('is_demo_data', true);
  // ... same for all tower tables
}
```

### Naming rule enforcement (critical)

The generator MUST NOT produce vendor names, client names, or person names from the forbidden list. Every generated string passes through `assertAllowedClientName` (from Pack F). Vendor list restricted to: Microsoft, Anthropic, OpenAI, Google, Salesforce, ServiceNow, Workday, AWS, Azure, Snowflake, Databricks, Hugging Face — vetted list, no incumbents.

Composite org names for demo clients only: "Meridian Health System", "First Capital Financial", "Apex Retail Group" — or new composites generated programmatically that don't match real firm names.

### Trigger

From Tower on an empty client:
```
CONTROL TOWER · Meridian Health
─────────────────────────────────
No data yet. Three ways to get started:

[📤 Upload data]   [🔌 Connect integrations]   [✨ Seed demo data]
```

Click "Seed demo data" → modal:
```
Seed demo data for Meridian Health?
Industry: Healthcare IDN (detected)
[Small] [Mid] [●Enterprise]
[Early] [●Scaling] [Mature]

[Cancel]   [Seed data (~5 seconds)]
```

Seed runs in ~3 seconds via batch insert. Tower lights up. Banner shows "demo data — remove when ready."

### Files

- `src/scripts/demo-data/generate.ts` — main generator
- `src/scripts/demo-data/patterns.ts` — industry × maturity patterns
- `src/scripts/demo-data/use-case-library.ts` — realistic use case names per industry
- `src/app/api/tower/seed-demo/route.ts` — API endpoint
- `src/app/api/tower/remove-demo/route.ts` — wipe endpoint
- `src/components/tower/DemoDataBanner.tsx` — banner component
- Migration: add `is_demo_data`, `demo_seed_version`, `created_by` to all tower tables

### Commit

```
feat(tower-demo): synthetic demo data generator parameterized by industry × size × AI maturity
```

---

## Phase 4 · Guided onboarding flow

**Intent:** When a client has zero Tower data, don't show five "no data" panels. Show a guided flow.

### Empty state layout

```
CONTROL TOWER · First Capital Financial
──────────────────────────────────────────────────────────────
Let's populate your AI Control Tower in 15 minutes.

Three dimensions populated                               0 of 5
[░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]

┌──── 📤 UPLOAD DATA ──────────────────────────────────────┐
│                                                          │
│   Drop a CSV, Excel, or JSON file. Nexus will classify   │
│   it and route to the correct dimension.                 │
│                                                          │
│   Need templates?                                        │
│   → Cost template · Inventory template · All templates   │
│                                                          │
│   [Choose file]   or drag-and-drop anywhere              │
│                                                          │
└──────────────────────────────────────────────────────────┘

┌──── 🔌 CONNECT INTEGRATIONS ─────────────────────────────┐
│                                                          │
│   We pull data directly from 8 systems.                  │
│                                                          │
│   ServiceNow · Workday · Microsoft 365 · AWS · Azure     │
│   Google Cloud · Okta · Snowflake                        │
│                                                          │
│   [See integration guides] [Request a connector]         │
│                                                          │
└──────────────────────────────────────────────────────────┘

┌──── ✨ SEED DEMO DATA ──────────────────────────────────┐
│                                                          │
│   Populate with synthetic data to explore the Tower.     │
│   Removable anytime.                                     │
│                                                          │
│   [Seed demo data]                                       │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Progress tracker

Lives at the top of Tower whenever coverage < 5/5. Shows which dimensions have data, which don't, and the next step to populate each.

### Coverage breakdown

As dimensions populate, the empty-state cards shrink and the actual dimension panels appear. No jarring transition — the view evolves as data arrives.

### Files

- `src/components/tower/EmptyState.tsx` — the three-card guided view
- `src/components/tower/OnboardingProgress.tsx` — progress tracker
- `src/lib/tower/coverage.ts` — helper that returns `{populated: [], missing: [], percentage: N}`

### Commit

```
feat(tower-onboard): guided empty-state flow with three paths (upload / integrate / demo)
```

---

## Phase 5 · Upload classifier upgrade

**Intent:** Improve the existing "Drop any file — I'll figure out what it is" to auto-route based on file contents.

### Current state (partial)

The drop zone accepts files but the classification logic is minimal. Upload a CSV labeled "cost-data.csv" and it might land anywhere.

### Upgrade

Haiku classification pass on every upload:

```typescript
// src/lib/tower/classifier.ts
const CLASSIFIER_PROMPT = (fileName: string, firstRows: string, columns: string[]) => `
Classify this uploaded file into one of the Tower dimensions:
inventory | adoption | value | risk | cost | unknown

FILENAME: ${fileName}
COLUMNS: ${columns.join(', ')}
FIRST 5 ROWS (sample):
${firstRows}

Respond with JSON:
{
  "dimension": "cost",
  "confidence": "high" | "medium" | "low",
  "detected_source": "AWS Cost Explorer" | "M365 admin" | "ServiceNow" | "manual CSV" | "unknown",
  "suggested_mappings": [
    { "source_column": "Service", "target_field": "vendor" },
    { "source_column": "Cost", "target_field": "monthly_spend_usd" }
  ],
  "warnings": ["missing required column: use_case_id"]
}
`;
```

After classification:
- **High confidence**: auto-map and ingest. Toast: *"Ingested 847 rows of cost data, routed to Cost dimension. [Review mapping] [Undo]"*
- **Medium confidence**: show mapping preview, user confirms or adjusts before ingest
- **Low confidence**: show the full mapping UI, guide user through

### Conversation fallback

If classifier returns `unknown` or user rejects mapping, open a Nexus-Data conversation:

> *"I got this file but I'm not sure what it is. Looking at the columns — employee_id, role, department, hire_date — this looks like an HR export, probably from Workday. Does this map to the Adoption dimension (employee counts for penetration calcs)? Or are you trying to load something else?"*

User responds, Nexus refines, ingests.

### Files

- `src/lib/tower/classifier.ts` — Haiku-backed classifier
- `src/lib/tower/mapping-ui.tsx` — mapping preview/adjustment component
- `src/app/api/tower/classify/route.ts` — upload endpoint calling classifier
- `src/app/api/tower/confirm-mapping/route.ts` — apply user-confirmed mapping

### Commit

```
feat(tower-onboard): Haiku-backed upload classifier with auto-routing and mapping preview
```

---

## Acceptance

Anand creates a new client called "Test Partners Corp":

1. Opens `/tower?clientId=test-partners-corp` → guided empty state with three paths and 0-of-5 progress
2. Clicks "Seed demo data" → selects Mid / Scaling → Tower populates in ~5 seconds with 8 use cases, adoption, value, risk, cost, 3 contradictions
3. Demo banner appears: "Demo data · [Remove] [Start upload]"
4. Clicks "Start upload" → opens `/tower/onboard?dimension=cost` → expands AWS accordion → downloads template → fills with 3 real rows → drags back into Tower
5. Classifier detects: Cost dimension, high confidence, AWS source, suggests field mapping → auto-ingests
6. Demo banner now says: "Mixed data · 3 rows real, 47 rows demo. [View details]"
7. One more upload from M365 Copilot admin → adoption dimension lights up with real data
8. Coverage: 2 of 5 real + 3 of 5 demo = progress bar shows mixed state

End-to-end guided path. No dead ends, no "contact support," no guessing.

---

## Open items after this pack

| Item | When |
|---|---|
| Live API connectors to Tier 1 systems (OAuth, incremental sync) | Pack 11 (Tier 1 integrations) |
| Vertical-specific templates (Epic, Guidewire, Shopify) | Post-seed |
| Shadow AI discovery via network logs (Zscaler, Netskope) | Pack 12 (Tower intelligence) |
| Scheduled recurring uploads (SFTP watchers, email parsers) | Pack 11 |
| Customer-hosted ingestion proxy (for air-gapped enterprises) | Year 2 |

---

## What this pack ships

- New client → populated Tower in 15 minutes (or 5 seconds with demo data)
- Integration guidance in-product for 8 enterprise systems
- 7 downloadable templates (CSV, Excel with validation, JSON bundle)
- Demo data generator with 9 industry × maturity presets, clearly labeled, one-click removable
- Guided empty-state flow with three paths
- Haiku-backed upload classifier that auto-routes files to the right dimension

**Impact:** Tower stops being "impressive demo on Meridian" and becomes "a product any new client can populate themselves." That's the shift from "this is a prototype" to "this is enterprise software."

---

## Paste-to-Claude-Code

> "Pack G · Tower Onboarding & Data Ingestion. Five phases: data source catalog for 8 Tier-1 systems, downloadable CSV/Excel/JSON templates, demo data generator parameterized by industry × size × AI maturity, guided empty-state flow, Haiku-backed upload classifier. Slots into Week 2-3 on a new worktree `feat/tower-onboard` from main. Can run parallel with Pack C. Respect naming rules — vendor list is whitelisted, client names pass through `assertAllowedClientName`. Phase 3 demo data adds `is_demo_data` column to all tower tables via new migration. Report after each phase ships."
