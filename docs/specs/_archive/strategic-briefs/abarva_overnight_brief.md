# ABARVA OVERNIGHT BUILD — 3 TASKS, EXECUTE IN ORDER, COMMIT AFTER EACH

════════════════════════════════════════════════════════════════════════
TASK 1 — OVERNIGHT BUILD (5 subtasks in priority order)
════════════════════════════════════════════════════════════════════════

## SUBTASK 1.1 — CRITICAL: Fix Meridian RAG pipeline
During Meridian × Tech conversation, Maestro had no knowledge of ETL 
tools or analytics stack. Dataset upload failed to reach Pinecone.

1. Check Pinecone for vectors tagged clientId='meridian'
2. Check workstream message route — is it actually querying Pinecone 
   before calling Claude?
3. Re-embed Meridian tech dataset (from Task 2 below) with metadata:
   clientId='meridian', solution='tech'
4. Test: query "what ETL tools does Meridian use" — confirm retrieval
5. Fix message route if RAG retrieval not wired in

## SUBTASK 1.2 — Full demo datasets

### ARCTURUS — complete AI Strategy engagement, all 5 phases seeded

Phase 0 (Situation): already seeded — keep as is

Phase 1 (Margin + Tech + Delivery):
Each workstream needs 8-10 realistic messages + 1 published finding

Margin workstream data:
- Consulting spend: $42M (addressable)
- Bloomberg AIM: $8.4M annually (partially addressable)
- AI portfolio: $94M spend, $0 documented ROI (addressable)
- IT overspend: $23M (addressable)
- Structural costs: compensation, premises, regulatory (not addressable)
- Recovery timeline: Q1 $34M, Q2 $28M, Q3 $22M, Q4 $10M
- 1 finding published: "Addressable cost base $167M — 
  $94M AI spend with zero verified ROI is the single largest lever"

Technology workstream data:
- SQL Server 2017: EOL October 2025, running unpatched
- Bloomberg AIM: 28 years, 14 customisations, 6 portable, 
  8 Bloomberg-only (rebuild cost $12-18M)
- Murex 3.1: EOL December 2026, upgrade $4.8M deferred twice
- Netezza: IBM support ended 2019, running unsupported, 87TB
- Teradata: $4.2M annually, performance degrading
- 1 finding published: "Netezza running 7 years past vendor EOL —
  3 compliance reports with no alternative source. Regulatory risk."

Delivery workstream data:
- OMS squad: 127-day average cycle time (benchmark 94 days)
- CRM squad: 94-day average (at benchmark)
- Risk squad: 61-day average (below benchmark — strong)
- Programme: "Project Arcturus-1" — 34% over budget, 67 days late
- Root cause: F002 (no executive sponsor) + F006 (velocity decay)
- 1 finding published: "OMS squad 35% above velocity benchmark —
  root cause F002 confirmed: no named executive sponsor 
  who survived programme duration"

Phase 1 approved: CFO + CTO + COO timestamps

Phase 2 (Vendor + AI Strategy):

Vendor workstream:
- 3 anonymised Tier 1 SIs evaluated: SI-A, SI-B, SI-C
- Scored on: delivery track record, AI capability, FinServ experience,
  price, cultural fit, risk profile
- SI-A: 71% Genome match, strong delivery, weak AI capability
- SI-B: 87% Genome match, strong AI, FinServ depth, best price anchor
- SI-C: 64% Genome match, brand name, poor FinServ track record
- Winner: SI-B recommended
- Contract anchors: benchmark day rate $2,100 vs market $2,800 
  (negotiate 25% reduction)
- 3 contractual protections: outcome milestone gates, 
  key person clauses, IP ownership
- 1 finding published: "SI-B recommended — 87% Genome match to 
  successful FinServ transformations. Day rate $700 below market."

AI Strategy workstream:
- 3-year roadmap:
  Year 1: MLOps platform deployment, model governance framework,
          Bloomberg AIM portability assessment, Netezza migration start
  Year 2: Predictive margin engine (live), AI-powered delivery 
          tracking, Teradata hybrid cloud migration
  Year 3: Cross-portfolio intelligence, real-time outcome 
          accountability, full cloud-native architecture
- 1 finding published: "14 live models, zero monitored. 
  MLOps platform is Year 1 priority — credit scoring model 
  has not been retrained since 2019. Regulatory exposure."

Phase 2 approved: CEO timestamp

Phase 3 (Justify + Select):

Justify workstream:
- Investment: $94M (existing AI spend redeployed)
- Return: $180M over 3 years
- Base case: $140M | Bear case: $95M | Bull case: $220M
- Payback: 14 months
- Benchmark: "3 comparable FinServ transformations in Genome 
  averaged $160M return on similar investment profile"
- Risk-adjusted IRR: 34%
- 1 finding published: "Business case stress-tested against 
  3 Genome comparables. Bear case $95M still 1.0x ROI — 
  floor is break-even, ceiling is $220M."

Select workstream:
- Final selection: SI-B confirmed
- Contract negotiation: $2,100 day rate locked (vs $2,800 market)
- 3 contractual protections documented and agreed
- Programme structure: 3 Maestro-embedded leads
- 1 finding published: "SI-B contract signed. $700/day below 
  market rate. Outcome milestone gates in contract — 
  AbarVa fee tied to verified delivery."

Phase 3 approved: CFO timestamp (investment committee sign-off)

Phase 4 (Outcomes — live tracking):
- Month 1: C/I ratio 71% → 68% (target 67%) — on track
- Month 2: Consulting spend $42M → $38M (target $36M) — slightly behind
- Month 3: AI portfolio rationalized 14 → 9 models — ahead of target
- Month 3: Netezza migration 30% complete — on schedule
- Fee trigger: "$8.4M verified savings × 18% = $1.5M fee released"
- Engagement status: COMPLETE

Add "Load Full Demo" button in engagement switcher (admin only):
- Creates named slot "[Client] — Shail Demo"
- Seeds all completed data into that slot
- Current slot preserved

### MERIDIAN — partial, Phase 1 in progress

Phase 0: keep existing — strong, do not change

Phase 1: 3 workstreams

Technology Diagnosis workstream (7 messages seeded):
- Maestro opening: specific to Epic Clarity 4-day lag, 
  SQL Server 2017 EOL, 89 direct Tableau-to-Clarity connections
- 2 Anand questions, Maestro responds with specific data
- 1 finding published: "Epic-to-analytics pipeline 4-day lag —
  clinical decisions being made on stale population health data.
  89 Tableau workbooks connect directly to Clarity — 
  all will break on next Epic upgrade."

AI Readiness workstream (5 messages seeded):
- Maestro: 3 AI initiatives identified, zero with documented ROI
- Readmission model built 2021, never deployed (MLOps gap)
- Sepsis warning live in 2 of 6 hospitals — no outcome tracking
- 1 genome match confirmed: F008 (AI spend, zero verified ROI)
- 1 finding published: "$4.2M annual value locked in readmission 
  model that has never been deployed. MLOps platform is 
  the unlock."

Delivery Velocity workstream (BLANK — live demo workstream):
- Maestro opening message only:
  "Meridian's delivery pattern is consistent with F006 — 
  velocity decay after month 4 without structured intervention.
  Before I pull the squad data, tell me: which programme 
  is causing the most pain right now?"
- Leave everything else empty — this is where Shail types live

## SUBTASK 1.3 — Stage gate architecture

THREE GATE TYPES:

HARD GATE — between major phases in AI Strategy engagement
- "Awaiting [Role] approval" with padlock icon on locked phases
- CXO approval button in client portal — teal, full width, prominent
- Digital timestamp + approver name + role logged on approval
- Cannot proceed without approval — no client override
- Approved phases: green dot + "Approved by [name] · [date]"

SOFT GATE — between workstreams within a solution
- "Maestro recommends approval before proceeding"
- Client can override: "Proceed anyway" + reason field
- Override logged in activity feed with reason

ADMIN BYPASS — Anand only
- Small "Unlock Phase ↑" button in workspace header
- Visible only to role='admin'
- Confirmation modal: "Unlock [Phase Name] for [Client]?"
- Logged as "Admin override by Anand Sundaram · [timestamp]"
- Used for design partners, late-entry clients, demos

Gate sequence for full AI Strategy engagement:
Phase 0 (Situation) → [HARD GATE: CEO approval]
Phase 1 (Margin + Tech + Delivery) → [HARD GATE: CFO + CTO + COO — all 3]
Phase 2 (Vendor + AI Strategy) → [HARD GATE: CEO approval]
Phase 3 (Justify + Select) → [HARD GATE: CFO — investment committee]
Phase 4 (Outcomes) → [SOFT GATE: monthly client confirmation]

DB additions needed:
- gate_type: 'hard' | 'soft' | 'admin_bypass' on phases table
- approval_required_role on phases table
- Extend existing approved_by, approved_at fields
- For Phase 1: require_all_approvers: boolean + approvers_required: string[]

## SUBTASK 1.4 — AI Strategy page + nav restructure

NAV CHANGE:
Before: Intelligence ▾ | Solutions ▾ | Platform | Clients
After:  Solutions ▾ | AI Strategy | Platform | Clients

AI STRATEGY PAGE (/ai-strategy):

Hero:
  "The complete AI strategy engagement."
  "9 Intelligence modules. One outcome."
  Subhead: "From diagnosis to verified ROI — 
  the full transformation lifecycle at a fraction of 
  traditional consulting cost."

9 modules shown as a pipeline (not a grid):

Row 1 — Diagnose:
  Situation Intelligence → output: Situation Brief (48hrs)

Row 2 — Analyse (parallel):
  Margin Intelligence → output: Margin Recovery Plan
  Technology Intelligence → output: AI Readiness Certificate  
  Delivery Intelligence → output: Velocity Scorecard

Row 3 — Design (parallel):
  Vendor Intelligence → output: Vendor Scorecard
  AI Strategy Intelligence → output: Board-Ready AI Narrative

Row 4 — Justify (parallel):
  Justify Intelligence → output: Investment Committee Package
  Select Intelligence → output: Procurement Shortlist

Row 5 — Track:
  Outcomes Intelligence → output: Live Outcome Dashboard
  (this is what triggers AbarVa's fee)

Mid-page section — "The land and expand model":
  "Start with a Solution ($150–300K)
   Prove the intelligence layer in 6 weeks.
   Scale to a full AI Strategy engagement ($500K–2M)."
  
  Show: Solution → AI Strategy arrow diagram

Bottom CTA:
  "Start with a diagnostic →" links to /sign-in
  "Talk to us →" links to contact

SOLUTIONS PAGES — add "Powered by Intelligence" section:
Each solution page gets small teal tag row above the CTA:
  Margin Optimization: 
    "Powered by: Situation Intelligence · Margin Intelligence · 
     Contradiction Intelligence"
  AI-Powered PDLC:
    "Powered by: Situation Intelligence · Delivery Intelligence · 
     Technology Intelligence"
  Technology Modernization:
    "Powered by: Situation Intelligence · Technology Intelligence · 
     Vendor Intelligence"
Each tag links to the relevant intelligence page (methodology view)

HOMEPAGE — add one line under hero subhead:
"Start with a solution. Scale to a full AI Strategy engagement."

## SUBTASK 1.5 — PDLC scorecard verify
Check if Arcturus × PDLC Phase 0 scorecard is now populated.
If blank — delete engagement from Supabase and restart.
If populated — skip this subtask.

COMMIT SEQUENCE (one commit per subtask):
fix: Meridian RAG pipeline — dataset embedding and retrieval
feat: full demo datasets — Arcturus complete, Meridian partial
feat: stage gate architecture — hard/soft/admin bypass
feat: AI Strategy flagship page + nav restructure  
fix: PDLC scorecard — verify and restart if needed

════════════════════════════════════════════════════════════════════════
TASK 2 — MERIDIAN HEALTH SYSTEM DATASET
Embed into Pinecone: clientId='meridian', solution='tech'
Use as foundation for all Phase 0 + Phase 1 workstream content.
════════════════════════════════════════════════════════════════════════

MERIDIAN HEALTH SYSTEM
Technology Landscape — Current State Dataset

CORE CLINICAL SYSTEMS
EHR: Epic (Cogito analytics module)
- Version: Epic 2020 (2 versions behind current)
- Modules live: Inpatient, Ambulatory, Emergency, 
  Cadence (scheduling), Prelude (registration)
- NOT live: Epic Cosmos (deferred 2023 budget cut)
- Cogito data warehouse: on-premise, SQL Server 2017
  EOL: October 2025 — currently running unpatched
- Clarity (Epic reporting database): 
  14TB, refreshed nightly — 4-day analytical lag 
  on complex population health queries
- Caboodle (Epic dimensional model):
  Partially implemented — 6 of 14 subject areas built
  Clinical, scheduling, billing complete
  Population health, quality measures, research INCOMPLETE
- Epic ODBC connections: 47 active report connections
  direct to Clarity — bypassing Caboodle entirely
  Creates schema dependency risk on every Epic upgrade

ANALYTICS & REPORTING STACK
Primary BI: Tableau Server 2021.4
- On-premise, Windows Server 2019
- 847 published workbooks
- 340 active users (monthly)
- 89 workbooks connecting directly to Clarity
  (will break on Epic upgrade)
- License cost: $340K annually
- Tableau Prep: used by 6 analysts only — no enterprise standardization

Secondary: Microsoft Power BI (shadow IT)
- 23 departmental Power BI workspaces — not governed
- No data catalog
- Finance and HR built independently
- Duplicates 40% of Tableau content

Legacy: Crystal Reports
- 156 Crystal Reports still in production
- 12 mission-critical (regulatory, billing)
- Zero developers who can maintain them
- Running on Windows Server 2012 R2 
  (EOL October 2023 — 2 years past end of life)

DATA PIPELINES & ETL
Primary ETL: Informatica PowerCenter 10.2
- On-premise, 14 production mappings
- Maintained by 2 developers (1 retiring Q2 2026)
- No documentation on 6 of 14 mappings
- Average pipeline age: 7.3 years
- Nightly batch only — no real-time capability

Secondary ETL: SSIS (SQL Server Integration Services)
- 34 SSIS packages in production
- Mixed ownership — IT and business analysts
- No version control on 18 packages
- Dependencies undocumented

Emerging: Azure Data Factory (pilot)
- 3 pipelines in production (non-critical):
  Claims Management → Azure SQL
  HR data → Power BI
  Vendor invoices → Finance system
- No formal governance or standards

Real-time capability: NONE
- All pipelines are nightly batch
- Clinical alerting runs on Epic in-database triggers
  (not integrated with analytics layer)
- 4-day lag from clinical event to analytical availability
  on population health queries

DATA WAREHOUSE & STORAGE
Primary EDW: SQL Server 2017 on-premise
- EOL: October 2025 (currently running unpatched)
- 47TB total data
- 3 databases: Clinical, Financial, Operational
- No partitioning strategy — query performance degrading
- Backup: tape, 48-hour recovery time objective
- DBA team: 2 people (1 vacancy unfilled 18 months)

Secondary: SQL Server 2019 (upgrade attempt 2022)
- Partial migration — 40% of workloads moved
- Stalled due to Clarity schema dependencies
- Running in parallel — $340K annual duplicate cost

Azure (current state — limited):
- Azure SQL: 3 databases (pilot workloads only)
- Azure Blob Storage: 14TB (unstructured — scans, images)
- Azure Data Factory: 3 pipelines (see ETL above)
- No Azure Synapse, no Azure Purview
- Azure spend: $180K annually (unoptimized)
- No FinOps governance

WORKLOAD CLASSIFICATION
Clinical Workloads:
- EHR transactions: 2.3M patient records
- Daily clinical events: ~45,000
- Critical real-time: on Epic (not in analytics layer)
- Regulatory reporting: monthly batch to CMS, state DOH
- HIPAA audit logs: SQL Server, 7-year retention

Population Health Workloads:
- Risk stratification: monthly batch, Informatica
- Care gap analysis: weekly, manual analyst process
- Readmission prediction: model built 2021,
  never deployed to production (MLOps gap)
- Social determinants: spreadsheet-based, not integrated

Enterprise Workloads:
- Finance: Workday (cloud) + SQL Server EDW integration
  Nightly sync, 2-day lag on financial reporting
- HR: Workday (cloud) — Power BI direct connect
  No integration with clinical workforce data
- Supply chain: Legacy Oracle EBS 12.1
  EOL vendor support — upgrade deferred 3 times
- Revenue cycle: Epic + 3 bolt-on vendors
  No unified revenue analytics view

USER & DATA VOLUMES
Total users: 12,400 staff
- Clinical: 8,200 (Epic access)
- Analytics consumers: 340 active monthly (Tableau)
- Power users / analysts: 47
- Data engineers: 4 (2 Informatica, 2 generalist)
- Data scientists: 2 (no MLOps platform)

Data volumes:
- Structured: 47TB (EDW)
- Unstructured: 14TB (Azure Blob — images, scans)
- Epic Clarity: 14TB (subset of EDW)
- Annual growth rate: 23% YoY
- Retention: 10 years clinical, 7 years financial

CLOUD MODERNIZATION HISTORY
2019 — "Cloud First" strategy announced
- Azure selected as primary cloud provider
- Business case: $4.2M savings over 5 years
- Outcome: 3 pilot workloads only — stalled

2021 — Clarity migration attempt
- Goal: move Epic Clarity to Azure SQL
- Budget: $1.8M
- Outcome: FAILED at 60% completion
- Root cause: 89 direct Tableau-to-Clarity connections
  broke during migration — rolled back
- $840K spent with no outcome

2022 — SQL Server 2019 upgrade (partial)
- Goal: full EDW on SQL Server 2019
- Budget: $620K
- Outcome: 40% complete — stalled
- Root cause: Informatica compatibility issues
- Running dual environment — $340K annual overspend

2023 — Azure Synapse evaluation
- Proof of concept: 6 months
- Outcome: deferred — "not ready for healthcare"
- Real reason: no internal expertise, no budget approved
- $180K consulting spend (Big 4) — report only, no implementation

2024 — Current state
- No active modernization programme
- 3 failed attempts in 5 years
- $2.84M spent with no material outcome
- CTO changed twice in 3 years
- No named executive sponsor on technology programmes
- Epic upgrade to 2023 version blocked by Clarity dependency

AI & ADVANCED ANALYTICS
AI initiatives: 3 active

1. Readmission prediction model (built 2021)
   Model: logistic regression, scikit-learn
   Status: never deployed — sitting in Jupyter notebook
   Reason: no MLOps platform, no deployment pipeline
   Potential value: $4.2M annual (reduced readmissions)

2. Sepsis early warning (vendor: Wolters Kluwer)
   Status: live in 2 of 6 hospitals
   Integration: Epic in-database alert only
   Analytics: not connected to EDW — no outcome tracking
   Annual cost: $340K — ROI undocumented

3. Revenue cycle AI (vendor: Waystar)
   Status: live for claims scrubbing
   Outcome: $2.1M annual in avoided denials (documented)
   Only AI initiative with documented ROI

MLOps: NONE
- No model registry
- No deployment pipeline
- No monitoring for any production model
- Data science team: 2 FTEs, no deployment capability

GENOME PATTERN MATCHES
F001 (92%): No MLOps — models built, never deployed
F002 (88%): No named tech executive sponsor (CTO changed twice in 3 years)
F006 (84%): Repeated failed modernization — same root cause each time
F009 (79%): Legacy maintenance consuming capacity —
            4 data engineers maintaining 7-year-old pipelines
F011 (71%): Shadow BI proliferation — 
            23 ungoverned Power BI workspaces

════════════════════════════════════════════════════════════════════════
TASK 3 — ARCTURUS FINANCIAL GROUP DATASET
Embed into Pinecone: clientId='arcturus', all solutions
Use as foundation for all Phase 1 workstream content.
════════════════════════════════════════════════════════════════════════

ARCTURUS FINANCIAL GROUP
Technology Landscape — Current State Dataset

CORE FINANCIAL SYSTEMS
Trading & Risk:
- Bloomberg Terminal: 340 seats, $8.4M annually
- Bloomberg AIM (Asset & Investment Management):
  28 years in production
  14 customisations total:
    6 portable (standard API integrations)
    8 Bloomberg-only (proprietary hooks — cannot migrate)
  Customisation rebuild cost estimate: $12-18M
  Annual maintenance: $2.1M (internal + vendor)
- Murex (derivatives trading): v3.1, on-premise
  EOL vendor support: December 2026
  Upgrade to Murex 3.1.50: $4.8M quoted, deferred twice
- Charles River IMS: portfolio management
  Cloud version available — not yet migrated
  On-premise version: 6 years old

Core Banking / Back Office:
- Broadridge: settlement and reconciliation (SaaS)
- SimCorp Dimension: fund accounting, on-premise
  Version 6.2 — 2 major versions behind
  Upgrade cost: $3.2M — in budget planning
- FIS: general ledger, on-premise
  Integration layer: 34 custom point-to-point connections
  No enterprise service bus

DATA WAREHOUSE & ANALYTICS
Primary EDW: Teradata (on-premise)
- Version: Teradata 16.20
- Size: 340TB
- Workloads: risk, portfolio, regulatory reporting
- 847 active queries daily
- Performance degrading: 23% of queries exceed SLA
  (target <30 seconds, actual avg 47 seconds)
- Annual cost: $4.2M (hardware + license + support)
- Teradata contract renewal: Q3 2026 — decision point

Secondary: Netezza (IBM PureData)
- Version: Netezza 7.2
- EOL: IBM ended support 2019 — running unsupported
- Size: 87TB
- Workloads: historical trade data, compliance archive
- Risk: no security patches since 2019
- Migration estimate: $6.8M — deferred 4 times
- 3 compliance reports run exclusively from Netezza
  No alternative source exists

Data Marts:
- 14 departmental data marts (SQL Server)
- Risk: 4, Finance: 3, Compliance: 3, Operations: 4
- No master data management
- Conflicting definitions: "AUM" calculated differently in 3 marts

ANALYTICS & BI
Primary BI: Tableau Server
- 1,240 published workbooks
- 680 active users monthly
- Direct Teradata connections: 340 workbooks (performance bottleneck)
- License cost: $680K annually

Secondary: MicroStrategy (legacy)
- 340 reports still in production
- Maintained by 3 dedicated developers
- Zero new development since 2021
- Decommission planned 2023 — still running 2026

Emerging: Power BI (shadow IT)
- 47 departmental workspaces — not governed
- Finance and Compliance most active
- Duplicates 60% of Tableau content

Regulatory Reporting:
- CCAR/DFAST: custom Python + SQL Server
  Manual process — 3 analysts, 6 weeks each cycle
- MiFID II: vendor tool (Axiom SL)
- Basel IV: in-house model, Teradata-dependent
  Timeline risk: Basel IV deadline Q1 2027

ETL & DATA PIPELINES
Primary ETL: Informatica PowerCenter
- On-premise, 89 production mappings
- Average mapping age: 11 years
- Documentation: exists for 34 of 89 mappings
- 3 developers — 1 retiring Q3 2026, 1 contractor expiring Q4 2026
- No knowledge transfer plan

Secondary ETL: Ab Initio
- 23 production graphs (complex transformations)
- Risk and compliance workloads exclusively
- 2 developers globally with expertise
- License cost: $1.1M annually
- Vendor: limited roadmap investment

Real-time: IBM MQ + custom Java
- 14 real-time feeds (trade, price, position)
- Average age: 9 years
- No monitoring — failures discovered reactively
- 3 P1 incidents in last 12 months from MQ failures

Emerging: Apache Kafka (pilot)
- 2 topics in production (non-critical)
- Real-time FX rates: Bloomberg → Kafka → Tableau
- No dedicated platform team — proof of concept only

CLOUD JOURNEY
Cloud strategy: Azure (selected 2020)

2020 — Cloud strategy approved
- Business case: $12M savings over 5 years
- Azure Enterprise Agreement signed
- Outcome: dev/test workloads only migrated

2021 — Teradata to Azure Synapse evaluation
- POC: 6 months, $2.1M consulting (Big 4)
- Outcome: FAILED — latency unacceptable for real-time risk
- Report: "Cloud not ready for financial services EDW"
- Real issue: lift-and-shift architecture — no cloud-native redesign

2022 — "Hybrid cloud" strategy pivot
- Keep Teradata on-premise for risk workloads
- Move analytics/reporting to Azure
- Outcome: 3 data marts moved to Azure SQL (non-critical only)
- Teradata still primary — no material change

2023 — Bloomberg AIM cloud evaluation
- Bloomberg cloud offering evaluated
- Outcome: rejected — 8 proprietary customisations cannot migrate
- $840K assessment cost — decision: stay on-premise

2024 — Azure current state
- Azure Synapse: 1 workspace (non-production)
- Azure Data Factory: 7 pipelines (non-critical)
- Azure ML: 0 models in production
- Azure spend: $2.1M annually (unoptimized)
- Estimated waste: 34% ($714K) — no FinOps governance

2025 — Netezza migration (active)
- Budget approved: $6.8M
- Target: Azure Synapse
- Vendor selected: Cognizant
- Risk: 3 compliance reports with no documented source logic
- Completion target: Q4 2026

WORKLOAD CLASSIFICATION
Risk Workloads (Teradata — cannot move yet):
- Real-time VaR calculation: 47 models
- Counterparty credit risk: daily batch
- Stress testing: CCAR/DFAST quarterly
- Latency requirement: <100ms — cloud currently fails this

Portfolio Workloads (hybrid candidate):
- Portfolio attribution: nightly batch, Teradata
- Performance reporting: T+1, Tableau
- Client reporting: monthly, MicroStrategy + manual
- Could move to Azure Synapse with cloud-native redesign

Compliance Workloads (highest risk):
- Regulatory capital: Basel IV, Teradata
- Trade surveillance: Actimize (SaaS) + Netezza
- AML screening: NICE Actimize (cloud)
- MiFID II transaction reporting: Axiom SL

Historical Archive (Netezza):
- 87TB trade history — 15 years
- 3 live compliance reports — source only Netezza
- Migration complexity: HIGH (undocumented logic)

AI PORTFOLIO
14 models in production:
- 0 with documented ROI
- 0 with monitoring or drift detection
- All deployed manually from notebooks
- No MLOps platform
- Excel spreadsheet used as model registry

Named initiatives:
1. Credit scoring model (2019)
   Logistic regression, Python
   Never retrained — data drift undetected
   Powers: 340 daily credit decisions
   Risk: HIGH — stale model, no monitoring
   Last validation: original deployment 2019

2. Trade surveillance anomaly detection (2021)
   Isolation forest, scikit-learn
   Compliance-critical — flags suspicious trades
   Last validation: 18 months ago
   False positive rate: unknown (not tracked)

3. Bloomberg AIM price prediction (2022)
   Linear regression on Bloomberg data
   Used by: 12 portfolio managers
   Accuracy: self-reported — not independently validated

4-14: 11 additional models
   Mix of Python/R, all notebook-deployed
   Documentation: exists for 4 of 11
   1 P2 incident last 6 months (credit scoring —
   discovered by business, not by monitoring)

AI spend: $94M annually
- Bloomberg AIM: $8.4M
- Vendor AI tools (14 platforms): $31M
- Internal AI team: $12M (3 data scientists + infrastructure)
- Consulting for AI strategy: $42M
  (3 engagements, 0 with deployed outcome)
- Documented ROI: $0

GENOME PATTERN MATCHES
F001 (94%): No MLOps — 14 models live, zero monitored
F002 (89%): No named AI executive sponsor —
            3 consulting engagements, all stalled
F003 (82%): Vendor lock-in preventing modernization —
            Bloomberg 8 proprietary hooks,
            Netezza 3 undocumented compliance reports
F006 (78%): Repeated cloud migration failure —
            same root cause (lift-and-shift, no redesign)
F008 (91%): $94M AI spend, $0 documented ROI —
            highest confidence pattern match in Genome
F011 (74%): Shadow BI — 47 ungoverned Power BI workspaces,
            conflicting metric definitions across 3 data marts
