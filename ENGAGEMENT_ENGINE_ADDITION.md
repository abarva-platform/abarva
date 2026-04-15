# AbarVa — Engagement Engine ADDITION
# Margin Opportunity Map + Dynamic Data Request Generator
# Add to CLAUDE_CODE_ENGAGEMENT_ENGINE.md implementation

---

## WHAT THIS ADDS

Two new components that make Margin Optimization work properly:

1. MARGIN OPPORTUNITY MAP — visual in Phase 0 showing the full 
   universe of where margin leaks, what's already analysed,
   what requires data uploads to unlock

2. DYNAMIC DATA REQUEST GENERATOR — when Maestro + client 
   select a focus area, platform generates a specific, 
   client-facing upload checklist

These apply to Margin Optimization solution.
The same pattern (broader scope → scope narrowing → dynamic requests)
should eventually apply to all solutions.

---

## THE CORE INSIGHT

Healthcare margin is not one problem. It is a portfolio:

REVENUE SIDE
  - Revenue Cycle (denial, prior auth, coding, billing)
  - Clinical productivity (GenAI documentation, RVUs)
  - Quality/value-based (MA Star Rating, readmissions)
  - AI portfolio reorientation

COST SIDE — BACK OFFICE / BPO
  - Finance & Accounting (AP/AR, close cycle, reporting)
  - Revenue Cycle Administration (billing ops, collections)
  - Supply Chain & Procurement (GPO compliance, inventory)
  - HR Operations (recruitment, benefits, payroll)
  - IT Operations (helpdesk, managed services)

CLINICAL OPERATIONS
  - Workforce (travel nurse, agency ratio, productivity)
  - Care delivery (LOS, OR utilization, readmissions)

Each lever has its own data requirements.
We will never have all the data upfront.
The engagement scopes to what the client wants to solve.

---

## PART A — MARGIN OPPORTUNITY MAP COMPONENT

### What it is:
A visual in Phase 0 (and persistent in Phase 1) that shows
the FULL universe of margin opportunities for the client's
vertical. Not just what we have data for.

### Three states per opportunity lever:

STATE 1 — ANALYSED (teal)
  Data is loaded. AbarVa has already run analysis.
  Shows: opportunity range, Genome confidence, key finding.
  Example: "Prior Auth Automation — $37.6M — 91% confidence"

STATE 2 — GENOME ESTIMATE (amber)  
  No client data. But Genome has benchmarks for this
  client's profile (revenue, vertical, bed count, etc.)
  Shows: "Typical for $11B health system: $X-Y"
  CTA: "Upload data for precise analysis →"
  Example: "Supply Chain GPO Compliance — typically $6-14M 
  for health systems your size — upload spend data"

STATE 3 — UNLOCK REQUIRED (grey)
  Cannot estimate without data. Shows what to upload.
  CTA: "Upload X to unlock this analysis →"
  Example: "OR Utilization — upload OR scheduling data"

### Where it lives:
- Phase 0: Full map shown after readiness scores
- Phase 1: Collapsed panel, persistent on right side
  Shows which areas are being analysed vs locked
- Maestro workspace: Always visible in right panel

### Component spec:

```tsx
// components/engage/MarginOpportunityMap.tsx

interface MarginLever {
  id: string
  category: string
  // 'revenue_rcm' | 'revenue_clinical' | 'back_office_finance' |
  // 'back_office_supply_chain' | 'back_office_hr' | 'it_ops' |
  // 'clinical_ops' | 'ai_portfolio'
  lever: string
  opportunity_min_m: number | null  // null = cannot estimate
  opportunity_max_m: number | null
  genome_confidence: number | null  // 0-1
  status: 'analysed' | 'genome_estimate' | 'unlock_required'
  data_available: boolean
  data_required: string[]           // list of files/data needed
  three_number_alternative: string  // "enter 3 numbers instead"
  key_finding: string | null        // if analysed
  wave: 1 | 2 | 3
}

// For Meridian (healthcare) the full lever list comes from
// MER-M05_Margin_Opportunity_Map.xlsx
// For Arcturus (asset management) from ARC-M04_Margin_Opportunity_Map.xlsx

// Display as category-grouped cards
// Category headers: Revenue | Back Office | Supply Chain | 
//                   Workforce | IT Operations | Clinical
// Within each category: lever cards in status order (analysed first)

// Total at top: 
// "£X-YM already analysed · £A-BM available with additional data"
// "Focus areas: [dropdown] All | Revenue | Back Office | Supply Chain..."
```

### Visual design:

```
MARGIN OPPORTUNITY MAP — Arcturus Financial Group
─────────────────────────────────────────────────────────────────
Already analysed: £122-158M    |    Upload to unlock: £48-72M
─────────────────────────────────────────────────────────────────

AI PORTFOLIO                                              ●●●●●
  AI portfolio reorientation — £94M committed, £0 ROI    [ANALYSED]
  ████████████████████████  £94M · 89% confidence
  "£94M committed. 28 initiatives. Zero verified return."
  
  CDO hire — unblocks 14 initiatives                     [ANALYSED]
  ████████████████████████  £94M unlocked · 84% confidence
  "Single hire. Highest leverage decision in the portfolio."

IT COST                                                   ●●●●○
  Consulting spend — £42M, 24% KT                        [ANALYSED]
  ████████████████████  £16-28M · 84% confidence
  
  Bloomberg AIM overpay — £8.4M vs £2.1M peer            [ANALYSED]
  ████████████  £6M · 78% confidence

MIDDLE OFFICE                                             ●●○○○
  Settlement STP automation                               [ESTIMATE]
  ░░░░░░░░░░░  Typical for firm your size: £2-5M
  "Upload settlement failure log for precise analysis →"
  [Upload file]  [Enter 3 numbers instead]
  
  Client reporting automation                             [UNLOCK]
  ░░░░░░░░░░░  Upload: client reporting ops data
  [Upload file]  [Enter 3 numbers instead]

REVENUE                                                   ●●○○○
  Fee yield analysis                                      [ESTIMATE]
  ░░░░░░░░░░░  Typical: £8-16M for £840B AUM manager
  "Upload revenue by strategy for precise analysis →"
  [Upload file]  [Enter 3 numbers instead]
```

---

## PART B — DYNAMIC DATA REQUEST GENERATOR

### What it is:
When Phase 0 scoping conversation identifies focus areas,
the platform generates a specific, client-facing upload
checklist — exactly what files to upload and why.

### How it works:

Step 1 — Maestro selects focus areas in Phase 0 chat
  (or client selects from the opportunity map)

Step 2 — Platform queries data_request_templates.xlsx
  Filters by: solution + focus area
  Returns: ordered list of data requests

Step 3 — Platform generates a "Data Request" card
  Visible to client in their portal
  Shows: what to upload, why, what it unlocks
  Each item has: Upload file OR Enter 3 numbers

Step 4 — Client uploads or enters numbers
  Files go to engagement_uploads table
  Numbers captured in phase_chat as structured message
  Maestro notified immediately
  Phase 0 analysis updates with new data

### Data Request Card (client portal view):

```
YOUR MAESTRO HAS REQUESTED THE FOLLOWING DATA
To give you a precise recovery range, we need:

PRIORITY — Supply Chain Analysis
─────────────────────────────────────────────
□ Annual spend by category (GPO vs non-GPO)
  Why: We can see from benchmarks that health systems 
  your size typically have $8-14M in GPO compliance 
  savings. Your data will tell us your exact number.
  
  [Upload Excel/CSV file]
  
  OR answer 3 questions instead:
  1. Total annual supply spend: $____M
  2. % under GPO contract: ____%
  3. % actually compliant with GPO pricing: ____%
  [Save answers]

─────────────────────────────────────────────
□ Top 50 suppliers by spend
  Why: Consolidation opportunity analysis.
  [Upload file]  |  [Skip for now]

─────────────────────────────────────────────
OPTIONAL — adds depth, not required to proceed

□ Inventory turns by category
  Why: Excess inventory and stockout analysis.
  [Upload file]  |  [Skip for now]

─────────────────────────────────────────────
[Submit what I have →]
"You can upload more data at any time during the engagement"
```

### The "3 numbers instead" concept:

Critical product insight: clients cannot always upload files.
Sometimes the right answer is:
"Tell me 3 numbers and I'll give you a Genome-calibrated estimate"

For every data request, provide an alternative:
  Instead of uploading AP invoice data:
  "Tell us: 1) Monthly invoice count  2) Cost per invoice $  
   3) % matched automatically"
  → AbarVa uses Genome benchmarks to calibrate an estimate
  → Confidence shown as: "Genome estimate (62% confidence) 
    vs Precise analysis (91% confidence with your data)"

This removes the "we need to gather data for 3 months before 
we can tell you anything" objection that kills consulting 
engagements before they start.

---

## PART C — PHASE 0 SCOPING CONVERSATION FOR MARGIN

The Phase 0 chat for Margin is different from other solutions.
It needs to:
1. Show what we already know (from uploaded data)
2. Present the full opportunity map
3. Help the Maestro + client decide where to focus
4. Generate the data request for chosen focus areas

### Phase 0 Maestro AI opening (Margin × Arcturus):

"I have analysed your uploaded datasets. Before we go into 
Phase 1, I want to show you the full picture of where margin 
typically leaks for an asset manager your size — and separate 
what I can already see from what would require additional data.

From what's already loaded, I can see three things clearly:

First: £94M committed to 28 AI initiatives. £0 verified 
return. This is not a technology problem — it's a governance 
problem. The CDO vacancy is the most expensive unfilled role 
in the firm.

Second: £42M in consulting spend with an average knowledge 
transfer score of 24%. Knowledge walks out every Friday.

Third: C/I ratio 71% vs 58% target — a £840M efficiency gap. 
Your IT spend at 4.2% of revenue vs 3.1% peer adds £178M of 
structural overspend.

These three together are £250-320M of addressable margin — 
already visible from your data.

But there are six more areas I haven't been able to look at 
yet: middle office operations, fee yield by strategy, client 
retention, fund accounting efficiency, regulatory reporting 
cost, and KYC/AML operations. These typically add another 
£40-80M for a firm your profile.

Where would you like to focus first — the areas we already 
see clearly, or should we gather data on the areas we 
haven't looked at yet?"

### After focus area selected — data request generation:

If client says "Let's focus on middle office first":

"For the middle office analysis, I need three things:

1. Settlement failure log (12 months) — your settlement 
   failure rate of 2.1% vs 0.8% benchmark is visible from 
   public data, but the cost breakdown and FTE count will 
   let me calculate the precise recovery range.

2. Reconciliation breaks by type — your AIM vs Aladdin 
   reconciliation gap is visible in the data. The break 
   count and age will quantify the automation opportunity.

3. Client reporting production data — FTE count and current 
   process will let me model the offshore + automation case.

Alternatively, you can answer 3 questions each and I'll give 
you a Genome-calibrated estimate in 10 minutes.

Shall I generate the data request for your team?"

---

## PART D — DATABASE ADDITIONS

Add to the engagement schema:

```sql
-- Scope selections per engagement
CREATE TABLE engagement_scope (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  engagement_id UUID REFERENCES engagements(id),
  focus_area TEXT NOT NULL,
  -- 'revenue_rcm' | 'back_office_finance' | 'supply_chain' |
  -- 'workforce' | 'it_ops' | 'clinical_ops' | 'ai_portfolio' |
  -- 'middle_office' | 'fee_yield' | 'client_retention'
  selected_by TEXT,
  selected_at TIMESTAMPTZ DEFAULT NOW(),
  rationale TEXT
);

-- Data requests generated for each scope area
CREATE TABLE data_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  engagement_id UUID REFERENCES engagements(id),
  focus_area TEXT NOT NULL,
  file_requested TEXT NOT NULL,
  why_needed TEXT NOT NULL,
  what_it_unlocks TEXT NOT NULL,
  three_number_alternative TEXT,
  priority TEXT DEFAULT 'high',
  status TEXT DEFAULT 'pending',
  -- 'pending' | 'uploaded' | 'numbers_entered' | 'skipped'
  response_file_url TEXT,
  response_numbers JSONB,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Margin opportunity map status per engagement
CREATE TABLE margin_opportunity_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  engagement_id UUID REFERENCES engagements(id),
  lever_id TEXT NOT NULL,
  lever_name TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL,
  -- 'analysed' | 'genome_estimate' | 'unlock_required'
  opportunity_min_m DECIMAL,
  opportunity_max_m DECIMAL,
  genome_confidence DECIMAL,
  key_finding TEXT,
  data_required TEXT[],
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## PART E — API ROUTES (ADDITIONS)

### GET /api/engage/[engagementId]/opportunity-map
Returns the full margin opportunity map for the client.
Combines: what's loaded + Genome estimates + unlock requirements.
Used to render the MarginOpportunityMap component.

### POST /api/engage/[engagementId]/select-scope
body: { focus_areas: string[] }
Creates engagement_scope records.
Triggers data request generation for selected areas.
Returns: data_requests[] for the selected focus areas.

### GET /api/engage/[engagementId]/data-requests
Returns all data requests for the engagement.
Filtered by: status (pending/completed/skipped).
Used by client portal to show upload checklist.

### POST /api/engage/[engagementId]/data-request/[requestId]/respond
body: { file_url?: string, numbers?: object, skip?: boolean }
Records response to data request.
If file: triggers analysis, updates opportunity map.
If numbers: records in phase_chat, updates Genome estimate.
Returns: updated opportunity map for affected lever.

---

## PART F — SOLUTION CONFIG ADDITIONS

Add to solution-config.ts for margin solution:

```typescript
margin: {
  // ... existing config ...
  
  opportunity_map: {
    // For each vertical, the full lever list
    healthcare: [
      { id: 'rcm_prior_auth', category: 'revenue_rcm', 
        lever: 'Prior auth automation',
        genome_range: { min_pct: 0.004, max_pct: 0.008 },
        // as % of net revenue — calibrates to client size
        genome_confidence: 0.91,
        data_files: ['MER-M01'],
        data_request_ids: ['prior_auth_denial_log', 'payer_contracts'] },
      { id: 'rcm_coding', category: 'revenue_rcm',
        lever: 'Clinical coding accuracy',
        genome_range: { min_pct: 0.001, max_pct: 0.003 },
        genome_confidence: 0.82,
        data_files: ['MER-M01'],
        data_request_ids: ['coding_accuracy_report'] },
      { id: 'gendoc', category: 'revenue_clinical',
        lever: 'GenAI clinical documentation',
        genome_range: { min_pct: 0.003, max_pct: 0.006 },
        genome_confidence: 0.88,
        data_files: ['MER-M04'],
        data_request_ids: ['physician_productivity_data'] },
      { id: 'back_office_finance', category: 'back_office',
        lever: 'Finance & accounting BPO',
        genome_range: { min_pct: 0.0005, max_pct: 0.001 },
        genome_confidence: 0.74,
        data_files: ['MER-BO01'],
        data_request_ids: ['finance_ftes', 'ap_invoice_data', 'close_cycle'] },
      { id: 'supply_chain_gpo', category: 'supply_chain',
        lever: 'GPO compliance improvement',
        genome_range: { min_pct: 0.0008, max_pct: 0.0015 },
        genome_confidence: 0.78,
        data_files: ['MER-SC01'],
        data_request_ids: ['spend_by_category', 'top_50_suppliers'] },
      // ... all levers from MER-M05 ...
    ],
    asset_management: [
      { id: 'ai_portfolio', category: 'ai_portfolio',
        lever: 'AI portfolio reorientation',
        genome_range: { min_pct: 0.005, max_pct: 0.010 },
        genome_confidence: 0.89,
        data_files: ['ARC-M02'],
        data_request_ids: [] },  // already have data
      { id: 'consulting_reduction', category: 'it_cost',
        lever: 'Consulting spend reduction',
        genome_range: { min_pct: 0.001, max_pct: 0.002 },
        genome_confidence: 0.84,
        data_files: ['ARC-D01'],
        data_request_ids: [] },  // already have data
      { id: 'middle_office_stp', category: 'middle_office',
        lever: 'Settlement STP automation',
        genome_range: { min_pct: 0.0003, max_pct: 0.0006 },
        genome_confidence: 0.78,
        data_files: ['ARC-BO01'],
        data_request_ids: ['settlement_failure_log', 'reconciliation_breaks'] },
      // ... all levers from ARC-M04 ...
    ]
  },
  
  // Data request template IDs (maps to data_request_templates.xlsx)
  data_request_templates: {
    // Key = data_request_id, Value = template config
    prior_auth_denial_log: {
      file_description: "Prior auth denial log by procedure code (12 months)",
      format: "Excel/CSV",
      why: "Procedure-level prior auth denial rate analysis",
      unlocks: "Cohere Health ROI. Electronic prior auth opportunity by payer.",
      three_numbers: [
        "Overall prior auth denial rate %",
        "Top denied procedure or category",
        "Average days from request to decision"
      ]
    },
    // ... all templates from data_request_templates.xlsx ...
  }
}
```

---

## PART G — QA ADDITIONS

### Margin Opportunity Map
□ Phase 0 shows full opportunity map for Arcturus Margin engagement
□ Analysed levers show in teal with finding and confidence
□ Genome estimate levers show in amber with typical range
□ Unlock required levers show in grey with upload CTA
□ "Upload file" and "Enter 3 numbers" both work per lever
□ Numbers entry captures data, shows Genome estimate update
□ File upload triggers re-analysis, updates lever status to analysed
□ Total at top updates as levers move from estimate → analysed

### Data Request Generator  
□ When focus area selected in Phase 0 chat, data request card generated
□ Client portal shows data request card clearly
□ Each request item has: description, why, upload button, 3-number alt
□ File upload from client → Maestro notified → analysis runs
□ Number entry from client → captured in phase_chat → Genome estimate shown
□ "Skip for now" records skip, Maestro can re-request later
□ Data request status visible in Maestro workspace

### Phase 0 Scoping
□ Phase 0 chat opens with: what we know + full opportunity map
□ Maestro can select focus areas via chat or map clicks
□ Selecting focus area generates data request automatically
□ Client sees data request in portal within minutes of Maestro selection
□ Phase 1 opens with scoped analysis (not trying to cover everything)

---

## COMMIT

feat: margin opportunity map + dynamic data request generator
- MarginOpportunityMap component (3 states: analysed/estimate/unlock)
- Dynamic data request generation per focus area selection
- "3 numbers instead of file upload" capability
- Database: engagement_scope, data_requests, margin_opportunity_status
- API: opportunity-map, select-scope, data-requests, respond
- Phase 0 scoping conversation for Margin solution
- solution-config.ts: opportunity_map per vertical + data_request_templates

---

## NEW DATASETS (already generated — add to datasets/ folder)

Run in datasets/ folder:
  python3 generate_margin_extended.py

Generates 8 new files:
  meridian/margin/MER-BO01_Back_Office_BPO_Opportunity.xlsx
  meridian/margin/MER-SC01_Supply_Chain_Procurement.xlsx
  meridian/margin/MER-HR01_Workforce_Operations.xlsx
  meridian/margin/MER-IT01_IT_Operations.xlsx
  meridian/margin/MER-M05_Margin_Opportunity_Map.xlsx
  arcturus/margin/ARC-BO01_Middle_Office_Operations.xlsx
  arcturus/margin/ARC-M04_Margin_Opportunity_Map.xlsx
  data_request_templates.xlsx

These power the opportunity map and data request generator.
The data_request_templates.xlsx is the library of all possible
data requests across all solutions and focus areas.

Commit: "datasets: margin extended — BPO, supply chain, HR, IT ops + 
         data request template library"
