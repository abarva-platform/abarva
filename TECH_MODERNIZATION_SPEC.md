# AbarVa — Tech Modernization Engagement Engine Spec
# Addition to CLAUDE_CODE_ENGAGEMENT_ENGINE.md
# Three tracks: Core System Modernization, ERP Selection & SI Governance,
#               Cloud Architecture Advisory
# Vendor Intelligence product integrates directly into Phase 2

---

## WHAT THIS ADDS

Technology Modernization is the third solution.
It operates on the same phase-gated engagement engine
(Phase 0 → 1 → 2 → 3 → 4) but with three distinct tracks:

TRACK 1 — CORE SYSTEM MODERNIZATION
  Which systems need replacing, wrapping, or optimising
  Evidence-based assessment from uploaded documents
  Vendor options scored against client data
  Programme governance — Maestro holds vendor accountable

TRACK 2 — ERP SELECTION & SI GOVERNANCE
  Product selection (SAP vs Oracle vs Workday vs Microsoft)
  SI selection (verified delivery track record — not marketing)
  Readiness assessment (can the client absorb this programme)
  Programme governance (Maestro holds SI accountable)
  
TRACK 3 — CLOUD ARCHITECTURE ADVISORY
  NOT building it — designing and governing it
  Architecture blueprint for specific use cases
  Vendor/SI selection for cloud implementation
  Governance of delivery against the blueprint

---

## THE CORE PRODUCT INSIGHT

When Phase 2 (Vendor Selection) is reached in ANY
Technology Modernization engagement:

  → Vendor Intelligence product activates automatically
  → Scores every relevant vendor against client's actual data
  → SI selection uses ERP Genome track record data
  → NOT analyst rankings — verified delivery patterns

This is what makes AbarVa unbeatable vs consulting firms:

CONSULTING FIRM:
"Based on our experience, Accenture is strong on SAP..."
(translation: Accenture is their alliance partner)

ABARVA:
"The Genome shows: for asset managers with your profile,
SAP implementations by Accenture ran 38% over budget
in 5 of 8 tracked engagements. The boutique firm Syntax
delivered on time in 8 of 9 for comparable mandates.
Your profile matches the Syntax success pattern."

That is pattern data. Not opinion. No consulting firm
has this structured and deployable. AbarVa does.

---

## PART A — PHASE 0 FOR TECH MODERNIZATION

### Six dimensions scored:

1. System inventory completeness
   Data: ARC-C04, MER-P04, or equivalent system inventory
   Scores: How many systems mapped, age, EOL status, cost

2. Migration / modernization history
   Data: ARC-P04 (3 Bloomberg post-mortems), MER-T02
   Scores: Prior attempts, cost, failure root cause, Genome match

3. Data architecture readiness
   Data: ARC-P02, MER-T01
   Scores: Golden records, integration complexity, data quality
   Note: Data readiness is where most modernizations fail (F003 68%)

4. Document-based technical assessment
   Data: Config files, dependency lists, API docs, data dictionaries
   Scores: API surface, coupling risk, portability assessment
   Note: This is the document-based version of deep technical analysis
   AbarVa does NOT require codebase access for Phase 0
   Deep technical analysis is a Phase 1 workstream if needed

5. Vendor dependency depth
   Data: ARC-P04, ARC-T03, MER-C02
   Scores: Which customizations are truly vendor-locked
   Contractual exit complexity

6. Internal capability to govern
   Data: ARC-C01, ARC-C03, MER-C03
   Scores: Can internal team run this without the vendor
   F001 pattern check — vendor dependency without capability

### Hardcoded Phase 0 for Arcturus × Tech Modernization:

```typescript
export const ARCTURUS_TECH_PHASE0 = {
  overall_score: 34,
  overall_verdict: 'partial',
  verdict_summary: 'Sufficient data to begin Phase 1. System inventory complete. Migration history documented — 3 post-mortems available. Data architecture gaps identified. Technical debt assessment partial — no config files uploaded yet.',

  dimension_scores: {
    system_inventory: {
      score: 72,
      evidence: '13 systems mapped. Ages 4-28 years. Total annual cost £37M. SQL Server DW: EOL October 2025 — already passed. Bloomberg AIM: 28 years, £8.4M annually, 14 customisations.',
      missing_data: 'Dependency mapping between systems incomplete',
      what_it_unlocks: 'Precise migration sequencing — which system breaks if another is removed first'
    },
    modernization_history: {
      score: 88,
      evidence: '3 Bloomberg AIM modernisation attempts fully documented. Total cost £32.6M. All 3 failed. Root cause identical in all 3: F002 — no named executive sponsor who survived programme duration. 2009 TCS: £8.2M. 2016 Accenture: £14.6M. 2021 Infosys: £9.8M.',
      missing_data: 'Nothing — post-mortems are complete',
      what_it_unlocks: 'Already fully unlocked'
    },
    data_architecture: {
      score: 18,
      evidence: '0 of 14 data domains have a golden record. 11 of 14 integrations are manual. SQL Server DW: 3-day reporting lag from manual extraction. Client data: 4 conflicting sources. ESG data: monthly manual compilation.',
      missing_data: 'Data dictionary for Bloomberg AIM position history',
      what_it_unlocks: 'Migration extraction complexity assessment for Bloomberg AIM'
    },
    technical_assessment: {
      score: 42,
      evidence: 'ARC-T02 loaded: Bloomberg AIM technical debt score 94/100. SQL Server DW 88/100. Charles River IMS 32/100 (best managed). API wrapper opportunity identified for 6 of 14 Bloomberg customisations.',
      missing_data: 'Bloomberg AIM configuration files, integration specification documents',
      what_it_unlocks: 'Precise API wrapper feasibility per customisation. Migration complexity score.'
    },
    vendor_dependency: {
      score: 14,
      evidence: 'Bloomberg LP owns 14 AIM customisations — no documentation. Wipro owns all FSC customisations — code escrow absent. Contractor owns enterprise architecture — no KT obligation. Google PSO engagement ended with 5% KT score.',
      missing_data: 'Bloomberg contract data portability clause (request from legal)',
      what_it_unlocks: 'Exit penalty and data portability rights — critical for migration decision'
    },
    internal_capability: {
      score: 22,
      evidence: 'CDO vacant 11 months — F002 confirmed. Portfolio Analytics squad: genuine capability (benchmark). EA function: contractor-led — critical risk. VP Engineering Data: contractor in permanent role. Only 2 squads have internal capability without vendor support.',
      missing_data: 'Individual capability assessments per squad lead',
      what_it_unlocks: 'Maestro team design — which gaps to fill first'
    }
  },

  genome_matches: [
    {
      code: 'F001',
      name: 'Vendor dependency without internal capability',
      failure_rate: 0.72,
      confidence: 'confirmed',
      evidence: 'Bloomberg LP engineers own 14 AIM customisations. Wipro owns all FSC customisations. Google PSO knowledge walked out. Internal team cannot govern any of these systems without vendor.',
      source_files: ['ARC-T02', 'ARC-T03', 'ARC-C01']
    },
    {
      code: 'F002',
      name: 'No named executive sponsor',
      failure_rate: 0.84,
      confidence: 'confirmed',
      evidence: 'All 3 Bloomberg AIM modernisation failures had F002 as root cause. CDO currently vacant 11 months — same structural gap that caused all 3 prior failures. Without addressing this first, attempt 4 will fail.',
      source_files: ['ARC-P04', 'ARC-C03']
    },
    {
      code: 'F003',
      name: 'Data readiness below threshold',
      failure_rate: 0.68,
      confidence: 'confirmed',
      evidence: '2016 Accenture attempt failed partly due to data migration complexity. 0 golden records currently. Bloomberg AIM position history in proprietary format with no data dictionary. Migration cannot begin without data extraction plan.',
      source_files: ['ARC-P02', 'ARC-P04']
    }
  ],

  top_findings: [
    {
      title: 'SQL Server DW: EOL passed. Running without security patches today.',
      description: 'Microsoft ended support for SQL Server 2017 in October 2025. Every day this system runs is a security and regulatory risk. Azure SQL migration is a 4-month project at £1.2M. This requires immediate action regardless of Bloomberg AIM decision.',
      severity: 'critical',
      source_files: ['ARC-C04'],
      genome_pattern: null,
      immediate_action: 'Commission Azure SQL migration within 30 days'
    },
    {
      title: '3 Bloomberg AIM modernisation failures. £32.6M spent. All failed for the same reason.',
      description: 'F002 — no named executive sponsor who survived the programme duration. 2009: CDO-equivalent absent. 2016: Programme director resigned month 18. 2021: CDO appointed, resigned 4 months. The technology was never the problem. Governance was. Attempt 4 with the same structure will produce the same result.',
      severity: 'critical',
      source_files: ['ARC-P04'],
      genome_pattern: 'F002',
      immediate_action: 'Name executive sponsor before scoping any modernisation approach'
    },
    {
      title: '6 of 14 Bloomberg customisations are portable. 8 are Bloomberg-only.',
      description: 'AIM-C011 (Geneva connector), AIM-C013 (ESG overlay), AIM-C005 (rebalancing workflow), AIM-C008 (mandate dashboard), AIM-C014 (board extract) — these are internal-built or low-complexity. An API wrapper approach covering these 6 would reduce dependency without the migration risk that killed all 3 prior attempts.',
      severity: 'high',
      source_files: ['ARC-P04', 'ARC-T02'],
      genome_pattern: 'F001',
      immediate_action: 'Commission API wrapper feasibility study for the 6 portable customisations'
    },
    {
      title: 'Charles River IMS + Portfolio Analytics: the proof that Arcturus can govern technology.',
      description: 'Charles River IMS scores 32/100 for technical debt — the best-managed system in the estate. Portfolio Analytics squad delivers at benchmark. These two prove the internal capability exists in pockets. Tech modernisation builds on these, not from zero.',
      severity: 'positive',
      source_files: ['ARC-T02', 'ARC-C01'],
      genome_pattern: null,
      immediate_action: 'Identify Portfolio Analytics and Charles River team as modernisation programme core'
    }
  ]
}
```

### Hardcoded Phase 0 for Meridian × Tech Modernization:

```typescript
export const MERIDIAN_TECH_PHASE0 = {
  overall_score: 41,
  overall_verdict: 'partial',
  verdict_summary: 'Strong data on Epic and integration landscape. Cerner migration complexity partially assessed. Data migration planning gap is the most critical risk. Ready to begin Phase 1.',

  dimension_scores: {
    system_inventory: {
      score: 68,
      evidence: 'Epic EHR: primary clinical system. 42 HL7/FHIR integrations mapped. 2 hospitals on Cerner — migration target Q4 2026. Epic optimization score 58/100 vs 80 benchmark. $36.5M unrealized Epic value identified.',
      missing_data: 'Non-clinical system inventory (supply chain, HR, finance systems)',
      what_it_unlocks: 'Full technology modernization scope beyond clinical systems'
    },
    modernization_history: {
      score: 52,
      evidence: 'Epic go-live 2014 — 11 years on same instance. No major modernization failures in Epic. Cerner legacy at 2 hospitals — no prior migration attempts. Prior auth integration: 60% complete, stalled for 18 months.',
      missing_data: 'Root cause of prior auth integration stall — governance or technical',
      what_it_unlocks: 'Understanding of delivery blockers for current modernization'
    },
    data_architecture: {
      score: 44,
      evidence: '42 HL7/FHIR connections mapped. Prior auth integration 60% complete. CMS mandate January 2027 requires electronic prior auth. Data migration planning for Cerner → Epic not started. 14 years of Cerner history in proprietary format.',
      missing_data: 'Cerner data dictionary and patient record count',
      what_it_unlocks: 'Cerner migration complexity and timeline estimate'
    },
    technical_assessment: {
      score: 38,
      evidence: 'Epic optimization score 58/100. 18 of 22 licensed modules underutilized. MyChart adoption 34% vs 60% target. Prior auth module 8% activated vs 50% benchmark. $36.5M in licensed but unused capability.',
      missing_data: 'Epic configuration files for specific module settings',
      what_it_unlocks: 'Precise module activation sequence and configuration requirements'
    },
    vendor_dependency: {
      score: 48,
      evidence: 'Epic: good documentation, good KT score (62%). Ensemble Health Partners: high dependency, 18% KT score, contract ends 2026. Wipro Salesforce Health Cloud: 22% KT score. Contractor analysts: 12% KT score.',
      missing_data: 'Cerner contract exit terms',
      what_it_unlocks: 'Cerner exit cost and data portability rights'
    },
    internal_capability: {
      score: 54,
      evidence: 'Epic team: 12 FTE, capable. AWS cloud team: capable. Cybersecurity: capable. Gap: no CDO (search month 4), prior auth AI expertise absent, data analytics capacity thin.',
      missing_data: 'Individual Epic analyst capability assessments',
      what_it_unlocks: 'Precise Maestro team design for Epic optimization programme'
    }
  },

  genome_matches: [
    {
      code: 'F008',
      name: 'Change management gap',
      failure_rate: 0.61,
      confidence: 'confirmed',
      evidence: 'Epic training completion 41% vs 80% benchmark. MyChart adoption 34% vs 60% target. Prior auth module 8% activated. The technology exists and is licensed. Adoption failure is a change management failure, not a technology problem.',
      source_files: ['MER-T03', 'MER-P04']
    },
    {
      code: 'F003',
      name: 'Data readiness below threshold',
      failure_rate: 0.68,
      confidence: 'probable',
      evidence: '14 years of Cerner patient history in proprietary format. Data migration planning not started for Q4 2026 Cerner migration. 2016 Arcturus modernisation failed for same reason — data complexity underestimated.',
      source_files: ['MER-T02']
    },
    {
      code: 'F002',
      name: 'No named executive sponsor',
      failure_rate: 0.84,
      confidence: 'probable',
      evidence: 'CDO search active month 4 — vacant. Prior auth integration stalled 18 months — no accountable owner. Without CDO, technology modernization programme has no executive sponsor for the digital initiatives.',
      source_files: ['MER-C02', 'MER-T01']
    }
  ],

  top_findings: [
    {
      title: 'Epic optimization score 58/100. $36.5M unrealized value already paid for.',
      description: 'Meridian licenses 22 Epic modules. 18 are underutilized. The prior auth module — critical for the CMS January 2027 mandate — is 8% activated vs 50% benchmark. This is not a technology gap. The capability is licensed and configured. Change management and activation are the gaps.',
      severity: 'critical',
      source_files: ['MER-T03', 'MER-P04'],
      genome_pattern: 'F008'
    },
    {
      title: 'Cerner migration: Q4 2026 target. Data migration planning not started.',
      description: '2 hospitals on Cerner. 700 combined beds. 14 years of patient history. Migration target Q4 2026. Data migration planning not started. 2016 Arcturus modernisation failed for identical reason — data complexity underestimated before programme start. This is F003 at 68% failure rate.',
      severity: 'critical',
      source_files: ['MER-T02'],
      genome_pattern: 'F003'
    },
    {
      title: 'CMS mandate January 2027: 8 integrations require enhancement. 14 months to deadline.',
      description: '42 HL7/FHIR connections mapped. Prior auth integration 60% complete for 3 payers. CMS mandate requires electronic prior auth for all payers. 8 payer integrations need enhancement. 14 months is achievable with right programme governance.',
      severity: 'high',
      source_files: ['MER-T01', 'MER-T04'],
      genome_pattern: null
    }
  ]
}
```

---

## PART B — PHASE 1 WORKSTREAMS FOR TECH MODERNIZATION

Three tracks. Each has its own workstream set.
Client selects track(s) in Phase 0 scoping conversation.
Multi-track engagements run workstreams in parallel.

### TRACK 1 — Core System Modernization Workstreams:

```
Workstream 1: Failure Pattern Analysis
Opening (Arcturus):
"Three Bloomberg AIM modernisation attempts. £32.6M spent.
All three failed for exactly the same reason — no executive
sponsor who survived the duration. 2009, 2016, 2021.
Before we discuss what approach to take, I want to address
this directly: what is different this time? Because if the
answer is 'nothing', attempt 4 will have the same result."

Workstream 2: System Assessment (Replace vs Wrap vs Optimise)
Opening:
"Not every aging system needs replacement. The right question
is: what business outcome do you need from this system — and
what is the cheapest, lowest-risk path to that outcome?
For SQL Server DW: immediate Azure SQL migration — non-negotiable,
EOL has passed. For Bloomberg AIM: API wrapper approach scores
64/100 vs 28/100 for full replacement — three failures explain why.
For Salesforce FSC: optimise existing — platform is fine,
44% adoption is the problem not the technology.
Let me walk through each system in priority order."

Workstream 3: Data Migration Risk Assessment
Opening:
"28 years of Bloomberg AIM data in proprietary format.
No data dictionary. This stopped the 2016 Accenture attempt —
and nobody has solved it since. Before we commit to any path,
I need to understand: has your team ever mapped what's actually
in the AIM position history? Is there any documentation —
even partial — of the data model?"

Workstream 4: Document-Based Technical Analysis
(Activates when config files/API docs are uploaded)
Opening:
"I can see from the configuration documents uploaded that
[X] API endpoints are accessible externally, [Y] customisations
use Bloomberg-proprietary functions, and [Z] integrations
could be rebuilt using standard protocols.
Let me walk through the portability assessment..."
```

### TRACK 2 — ERP Selection & SI Governance Workstreams:

```
Workstream 1: ERP Readiness Assessment
Opening:
"Before we score any ERP product, I want to assess whether
you are ready to run this programme. Most ERP implementations
fail not because of the technology choice — but because the
organisation wasn't ready. The Genome shows 7 readiness
dimensions that predict success. Let me walk through each.
Starting with the most important: data quality.
What percentage of your master data has been cleansed and
validated in the last 12 months?"

Workstream 2: ERP Product Selection
Opening:
"I have scored the relevant ERP products against your specific
profile — not a generic RFP. The scoring uses Genome data from
[N] similar implementations across your industry and size.
Your profile: [industry], $[X]B revenue, [complexity level],
[cloud readiness], current estate.
The Genome shows [Product X] as the strongest match at [score]/100.
Before I walk through the full scoring, I want to understand
your board's constraints: is there a preference for a vendor
you already have a relationship with — and if so, what's
driving that preference?"

Workstream 3: SI Selection (Genome-Powered)
Opening:
"SI selection is where most clients get the worst advice —
because advisory firms have alliance agreements with the SIs
they recommend. AbarVa has no alliances. We score SIs against
verified delivery track record from the Genome.
For your profile — [ERP product], [industry], [$X]B revenue —
the Genome shows [SI] has delivered on time in [X] of [Y]
comparable engagements. [SI 2] has averaged [Z]% budget overrun.
Let me show you the full scoring before you make any decisions."

Workstream 4: Programme Governance Design
Opening:
"Once ERP and SI are selected, the most important decision
is the governance model. The Genome shows that 84% of ERP
failures had F002 — no named executive sponsor whose performance
review was tied to the programme. We need to design a governance
structure that addresses this directly. That means: one named
C-suite owner, a Maestro embedded from Day 1, baseline locked
before SI engagement starts, and milestone-based fees so the
SI has skin in the game. Let me walk through the governance
design I'd recommend for your programme."
```

### TRACK 3 — Cloud Architecture Advisory Workstreams:

```
Workstream 1: Use Case Definition
Opening:
"Cloud architecture advisory starts with the use case —
not the technology. What business problem are you trying
to solve? The architecture follows from that, not the
other way around. Based on your uploaded data, I can see
three potential use cases that would deliver the highest
value: [1] prior auth automation (CMS mandate, $37.6M value),
[2] clinical documentation AI ($42M physician productivity),
[3] data platform for golden record (enables all AI initiatives).
Which of these is the highest priority for your board right now?"

Workstream 2: Architecture Design
Opening:
"For [use case], the right architecture pattern is [pattern].
I have designed blueprints for this pattern across [N]
similar implementations. The key components are [list].
The critical decisions you need to make are:
1. AWS vs Azure (your current estate is [X] — this matters)
2. Build vs buy for [specific component]
3. Data residency requirements for [regulated data type]
Let me walk through each decision with the trade-offs."

Workstream 3: Vendor/SI Selection for Cloud Build
Opening:
"For this architecture, three vendors/SIs have the strongest
track record from the Genome: [1], [2], [3].
AbarVa does not build cloud platforms — we design them,
select who builds them, and govern the delivery.
The SI selection for cloud is similar to ERP: Genome-scored
against verified delivery track record, not marketing materials.
For [use case] on [cloud provider], the Genome shows [SI]
has the best delivery record. Shall I show you the scoring?"

Workstream 4: Governance & Delivery Management
Opening:
"Once the architecture is agreed and SI selected, the Maestro
governs delivery against the blueprint. This means:
baseline locked (cost, timeline, performance SLAs),
milestone-based SI fee structure, weekly progress review,
knowledge transfer from SI to internal team from Day 1.
The blueprint you approve in Phase 2 becomes the contract.
Any deviation requires Maestro sign-off. Let me walk through
what the governance model looks like for this programme."
```

---

## PART C — PHASE 2 VENDOR INTELLIGENCE INTEGRATION

When Phase 2 is reached in Tech Modernization:

### Vendor Intelligence activates for:

1. Core System Modernization:
   → Score migration vendors (SS&C, ION, Murex, Fidessa)
   → Score implementation partners (TCS, Infosys, Accenture)
   → Score API wrapper specialists
   → Use: ARC-T01 modernisation options + Vendor Genome data

2. ERP Selection:
   → Score ERP products (SAP, Oracle, Workday, Microsoft, NetSuite)
   → Score SIs (Accenture, Deloitte, KPMG, Syntax, etc.)
   → Use: ERP-G01 ERP Genome data (product + SI track record)

3. Cloud Architecture:
   → Score cloud providers (AWS vs Azure vs GCP) for use case
   → Score cloud implementation partners
   → Use: CLOUD-A01 architecture patterns + Vendor Genome

### How it works in the UI:

Maestro workspace → Phase 2 → Vendor Selection workstream
"Run Vendor Intelligence" button appears
→ System queries relevant Genome data for client profile
→ Returns scored vendor list with evidence
→ Maestro reviews, adds context, edits scoring rationale
→ Publishes to client: "AbarVa recommends X (score Y/100).
   Here is why — scored against your specific situation."

### Vendor Intelligence output structure:

```typescript
interface VendorIntelligenceOutput {
  track: 'core_system' | 'erp' | 'cloud'
  client_profile: {
    industry: string
    revenue_m: number
    complexity: 'low' | 'medium' | 'high'
    cloud_readiness: number  // 0-100
    current_estate: string[]
  }
  vendors: {
    name: string
    category: 'product' | 'si' | 'boutique'
    genome_score: number  // 0-100
    delivery_track_record: {
      engagements: number
      on_time_pct: number
      avg_overrun_pct: number
      kt_score: number
    }
    strengths: string[]
    watch_outs: string[]
    recommended: boolean
    rationale: string
  }[]
  recommendation: string
  confidence: number  // Genome confidence %
  source: 'ERP-G01' | 'ARC-T01' | 'CLOUD-A01' | 'Genome'
}
```

---

## PART D — PHASE 2 OUTPUT: SOLUTION DESIGN FOR TECH

The Solution Design for Technology Modernization has
different sections per track:

### Track 1 — Core System Modernization:

```
SECTION 1: System Disposition Matrix
  For each system: Replace | Wrap | Optimise | Stay
  Evidence per decision (not opinion)
  
SECTION 2: Vendor Recommendations
  Powered by Vendor Intelligence product
  Scored against client data

SECTION 3: Migration Sequencing
  Why this order (dependencies + risk)
  What each migration unlocks for the next

SECTION 4: Technical Approach
  API wrapper design (for wrap decisions)
  Migration architecture (for replace decisions)
  Optimisation plan (for stay decisions)

SECTION 5: Business Case
  Maintenance cost reduction (per system retired)
  Capability unlocked (what AI becomes possible)
  Risk reduction (regulatory, operational)
  Three scenarios: conservative / base / optimistic
```

### Track 2 — ERP Selection:

```
SECTION 1: Readiness Assessment Results
  7 dimensions scored
  Red flags identified
  Go/no-go recommendation with conditions

SECTION 2: ERP Product Recommendation
  Powered by Vendor Intelligence + ERP Genome
  Scored against client profile
  Top 2 options with trade-offs

SECTION 3: SI Recommendation
  Powered by ERP Genome SI track record
  Scored against: ERP product + industry + size
  Top 2 SIs with verified delivery data

SECTION 4: Implementation Approach
  Big bang vs phased vs two-tier
  Genome says which works for client profile
  
SECTION 5: Programme Governance Model
  Executive sponsor design
  Maestro role throughout programme
  SI accountability framework
  Baseline lock methodology

SECTION 6: Business Case
  Total cost of ownership (5 year)
  Genome-validated — not vendor's estimate
  Contingency recommendation (+30-45%)
  Three scenarios
```

### Track 3 — Cloud Architecture Advisory:

```
SECTION 1: Use Case Architecture Blueprint
  Component diagram
  Service selection rationale
  Data flow design
  Security and compliance approach

SECTION 2: Build vs Buy Decision
  For each component: build internally | buy SaaS | use SI
  Evidence per decision

SECTION 3: Vendor/SI Recommendation
  Cloud provider recommendation
  Implementation partner recommendation
  Powered by Vendor Intelligence

SECTION 4: Governance Framework
  Blueprint as contract
  Milestone-based SI fee structure
  Knowledge transfer requirements
  Internal team capability build plan

SECTION 5: Investment and Timeline
  Build cost estimate (independent, not SI estimate)
  Run cost estimate (ongoing cloud spend)
  Timeline with milestones
  Three scenarios
```

---

## PART E — PHASE 3: BASELINE FOR TECH MODERNIZATION

### Track 1 baseline metrics:
  - Annual maintenance cost per system (locked per system)
  - System age (does not change — reference point)
  - Number of manual integrations (current count)
  - Data pipeline lag (hours from source to reporting)
  - Vendor dependency ratio (% of changes requiring vendor)

### Track 2 (ERP) baseline metrics:
  - Current ERP annual licence + support cost
  - Process variant count (before standardisation)
  - Data quality score (before MDM programme)
  - Manual process count (before automation)
  - Timeline: go-live date locked

### Track 3 (Cloud) baseline metrics:
  - Current cost of manual process being replaced
  - Current FTE count for process being automated
  - Current process time (days/hours)
  - Current error rate or quality metric

### The baseline lock for ERP is special:

ERP baselines require board sign-off specifically because
ERP implementations frequently suffer from scope creep and
cost overruns. The baseline must include:

1. Total approved budget (with contingency %)
2. Go-live date (locked — cannot change without board approval)
3. Scope definition (modules, business units, geographies)
4. Success metrics (what "done" looks like)
5. SI penalty structure (what SI pays for overruns)

Statement included in every ERP baseline:
"The Genome shows ERP implementations average 30-45% cost
overrun vs initial estimate. This baseline includes [X]%
contingency. If actual costs exceed baseline + contingency,
programme review is triggered automatically."

---

## PART F — DATABASE ADDITIONS

Add to engagement schema for Tech Modernization:

```sql
-- Track selection per engagement
CREATE TABLE tech_engagement_tracks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  engagement_id UUID REFERENCES engagements(id),
  track TEXT NOT NULL,
  -- 'core_system' | 'erp' | 'cloud_advisory'
  selected_at TIMESTAMPTZ DEFAULT NOW(),
  selected_by TEXT,
  rationale TEXT
);

-- System disposition decisions (Track 1)
CREATE TABLE system_dispositions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  engagement_id UUID REFERENCES engagements(id),
  system_name TEXT NOT NULL,
  decision TEXT NOT NULL,
  -- 'replace' | 'wrap' | 'optimise' | 'stay' | 'decommission'
  evidence TEXT,
  vendor_recommended TEXT,
  vendor_genome_score INT,
  migration_complexity INT,  -- 0-100
  estimated_cost_m DECIMAL,
  wave INT,
  rationale TEXT,
  maestro_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ERP selection results (Track 2)
CREATE TABLE erp_selection_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  engagement_id UUID REFERENCES engagements(id),
  readiness_score INT,  -- 0-100
  readiness_verdict TEXT,
  recommended_erp TEXT,
  erp_genome_score INT,
  recommended_si TEXT,
  si_genome_score INT,
  implementation_approach TEXT,
  estimated_total_cost_m DECIMAL,
  estimated_months INT,
  contingency_pct DECIMAL,
  rationale TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cloud architecture blueprints (Track 3)
CREATE TABLE cloud_blueprints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  engagement_id UUID REFERENCES engagements(id),
  use_case TEXT NOT NULL,
  pattern TEXT NOT NULL,
  cloud_provider TEXT,
  key_services TEXT[],
  estimated_build_cost_m DECIMAL,
  estimated_run_cost_m DECIMAL,
  recommended_si TEXT,
  si_genome_score INT,
  blueprint_content JSONB,
  maestro_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## PART G — SOLUTION PAGE CONTENT FOR /solutions/tech

### Not-logged-in marketing view:

Hero:
  Intelligence name: TECHNOLOGY INTELLIGENCE
  CXO Question: "Which systems are blocking us —
                and what do we actually do?"

Stat cards (2×2):
  Average ERP overrun:     34%  (Genome validated — not vendor estimate)
  Failed migrations cost:  £32M (3 attempts, same root cause)
  Systems at EOL today:    42%  (of enterprise systems Genome-tracked)
  SI selection wrong:       68%  (when based on analyst rankings alone)

Three tracks explained:
  Track 1: Core System Modernization
  Track 2: ERP Selection & SI Governance
  Track 3: Cloud Architecture Advisory

Genome patterns for tech:
  F001 72% — Vendor dependency without internal capability
  F002 84% — No executive sponsor who survives the programme
  F003 68% — Data readiness below threshold before migration

CTA: "Login to see your technology situation →"

### Logged-in state (Arcturus):

AbarVa speaks first with top 3 findings from Phase 0:

Finding 1 (red):
  "Bloomberg AIM 28 years old. 3 failed modernisations.
   £32.6M spent. All three failed for the same reason."
  F002 · 84% · [ARC-P04]

Finding 2 (red):
  "SQL Server DW: EOL October 2025 — already passed.
   Running without security patches today."
  Immediate action required · [ARC-C04]

Finding 3 (amber):
  "6 of 14 Bloomberg customisations are portable.
   API wrapper approach has not been tried."
  F001 · 72% · [ARC-P04] [ARC-T02]

Then: Track selector
  [Core System Modernization]
  [ERP Selection & SI Governance]
  [Cloud Architecture Advisory]
  [All three — comprehensive assessment]

→ Routes to /engage/arcturus/tech with selected track(s)

---

## PART H — QA CHECKLIST (Tech Modernization)

### Phase 0
□ 6 dimensions scored correctly for Arcturus
□ 6 dimensions scored correctly for Meridian
□ Hardcoded findings show with correct sources
□ F002 identified from ARC-P04 post-mortems
□ F003 identified from ARC-P02 data architecture
□ Track selector appears after findings
□ Maestro can approve Phase 0 → Phase 1 unlocks

### Phase 1
□ Correct workstreams load per track selected
□ Track 1 opens with failure pattern analysis
□ Track 2 opens with readiness assessment
□ Track 3 opens with use case definition
□ Multi-track: workstreams from all tracks available
□ Document upload mid-phase → analysis updates
□ Situation Brief generated from all workstream conversations

### Phase 2 — Vendor Intelligence
□ "Run Vendor Intelligence" button appears in Phase 2
□ For Track 1: scores migration vendors + implementation partners
□ For Track 2: scores ERP products + SIs from ERP-G01
□ For Track 3: scores cloud providers + implementation partners
□ Vendor scoring uses ERP-G01 data for ERP track
□ Maestro can edit vendor scores and rationale
□ Published to client: "AbarVa recommends X — here is why"

### Phase 3 — Baseline
□ Track-specific baseline metrics locked correctly
□ ERP baseline: board sign-off flow activated
□ Contingency warning shown for ERP track
□ Baseline statement: immutable after signature

### Solution Page
□ /solutions/tech → marketing (not logged in)
□ /solutions/tech → logged in Arcturus → findings + track selector
□ Track selection → routes to /engage/arcturus/tech
□ Stat cards show correct Genome numbers
□ Three tracks clearly explained

---

## DATASETS (already generated — in datasets/ folder)

Run in datasets/ folder:
  python3 generate_tech_extended.py

Generates 6 new files:
  arcturus/tech/ARC-T02_Technical_Debt_Assessment.xlsx
  arcturus/tech/ARC-T03_Vendor_Contract_Intelligence.xlsx
  meridian/tech/MER-T03_Epic_Optimization_Roadmap.xlsx
  meridian/tech/MER-T04_Integration_Enhancement_Plan.xlsx
  erp_genome/ERP-G01_ERP_Product_SI_Genome.xlsx
  tech_advisory/CLOUD-A01_Architecture_Advisory_Patterns.xlsx

Key files for Vendor Intelligence integration:
  ERP-G01: 8 ERP products scored + 12 SIs with track record
           + Readiness assessment template (3 sheets)
  CLOUD-A01: 7 architecture patterns with service specs,
             build/run costs, SI recommendations
  ARC-T02: Technical debt scores + API wrapper opportunities
  ARC-T03: Vendor contract exit analysis + leverage points

---

## COMMIT

feat: tech modernization engagement engine — 3 tracks
- Phase 0: 6 dimensions, hardcoded for Arcturus + Meridian
- Phase 1: Track-specific workstreams (Core/ERP/Cloud)
- Phase 2: Vendor Intelligence integration — ERP Genome powered
- Phase 3: Track-specific baseline metrics + ERP board sign-off flow
- solution-config.ts: tech solution with 3 tracks
- /solutions/tech: marketing + logged-in track selector
- New DB tables: tech_engagement_tracks, system_dispositions,
  erp_selection_results, cloud_blueprints
- ERP Genome: 8 products + 12 SIs with verified track record
- Cloud Advisory: 7 blueprint patterns with service specs
