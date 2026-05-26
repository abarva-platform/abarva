# Packet 20 — First Capital Financial Synthetic Substrate Pack v1

**Status:** Draft 2026-05-26. To hand to Codex once approved.
**Modeled on:** `docs/build/PACKET_19_MERIDIAN_SUBSTRATE_PROMPT.md` (healthcare-vertical packet) and `datasets/apex-retail-synthetic-v1/` (Apex v1 scaffold shape).
**Source seed brief:** `docs/specs/_meta/seed-data/first-capital-financial-comprehensive-seed.md` (660-line canonical company profile; treat as ground truth).
**Why this packet exists:** Apex Retail has a 13-folder / 120-app / 14-team / 45-vendor data pack (Packet 18). Meridian Health gets the parallel pack via Packet 19. First Capital Financial — the third demo composite — has rich narrative seed content but no structured substrate. Without it, Sentinel runs against First Capital will collapse to the same "0 P18 app records visible / org_topology unavailable / ai_tool_footprint pending / $0 visible run-cost basis" template we just patched. This packet authors the financial-services-vertical substrate at parity.

---

## Tenant identity (must hold across every row)

| Field | Value |
|---|---|
| Tenant key | `firstcapital` |
| Display name | First Capital Financial |
| Legal entity | First Capital Financial, Inc. (NYSE: FCF) — composite organization |
| HQ | Charlotte, North Carolina |
| Founded | 1932 |
| Total assets (FY25) | $362B |
| Total deposits | $284B |
| Total loans | $238B |
| Wealth AUM/AUA | $420B |
| Total revenue (FY25) | $18.2B (NII $11.1B + non-interest $7.1B) |
| Net income | $4.1B |
| ROTCE | 14.8% |
| Efficiency ratio | 56.2% |
| Tier 1 CET1 | 10.8% |
| Market cap | ~$48B |
| Employees | ~46,000 |
| Branches | 2,810 across 18 states |
| ATMs | ~4,800 |
| Retail customers | ~9.4M (digital active 7.1M) |
| Commercial clients | ~120,000 |
| Wealth households | ~48,000 |
| Annual IT operating budget | $1.85B (~10.2% of revenue, typical of large diversified bank) |
| CEO | Robert "Bo" Hargrove III (since Jan 2024) |
| COO | Camila Restrepo-Wang |
| CFO | Elaine Burakovsky-Park (since May 2025) |
| CRO | Dr. Vikram Shah |
| CCO (credit) | Douglas Okonjo |
| CCO (compliance) | Marcus Blythe (Consent Order remediation lead) |
| CIO | Angela Okafor-Hill (since 2022) |
| CDO | Ravi Deshmukh (elevated to ExCo Jan 2026) — likely AbarVa champion |
| CDigO | Jasmine Taylor-Vance |
| GC | Diana Aguilar-Reyes |
| Business segments | Consumer Banking & Lending ($6.8B), Commercial Banking ($5.4B), Wealth Management ($3.6B), Capital Markets ($2.4B) |
| Core banking | FIS Profile (deposits) + nCino commercial + custom legacy mortgage servicing |
| ERP | Oracle Cloud Financials + Workday HCM (post-2023 cutover) |
| CRM | Salesforce Financial Services Cloud (consumer + commercial), Black Diamond + Salesforce FSC for wealth |
| Channels | nCino (commercial), Q2 (digital banking platform), Backbase (mobile), Fiserv DNA at acquired wealth subsidiary (pending integration) |
| Wealth platform | Charles River IMS, BlackRock Aladdin (institutional), Envestnet, Pershing custody |
| Markets | Bloomberg Terminal, Refinitiv Eikon, Calypso (fixed income), Murex (FX/derivatives) |
| Risk & treasury | SAS Risk, Moody's RiskCalc, QRM (asset/liability), Numerix (derivatives valuation) |
| AML / KYC | Actimize (transaction monitoring — under Consent Order remediation), LexisNexis Bridger (sanctions), NICE Mantas (legacy, sunset in flight) |
| Payments | ACI Worldwide (real-time payments), FIS IST/Switch (card processing), Mastercard / Visa connections |
| Data & analytics | Snowflake (enterprise warehouse), Databricks (ML platform — newly contracted), Collibra (governance), Informatica (ingestion), Tableau + Power BI |
| Cloud | AWS primary (enterprise data + ML), Azure (M365 + selected SaaS), on-prem mainframe + distributed for core banking |
| Security | CrowdStrike, Splunk, Okta, Zscaler, Proofpoint, Recorded Future, BeyondTrust |
| Regulatory regime | OCC primary, FRB (BHC supervision), FDIC (deposit insurance), CFPB, SEC + FINRA (Capital Markets & Wealth), Treasury OFAC, state banking regulators in 18 states |
| Active Consent Order | BSA/AML — multi-year remediation under FRB |

**Forbidden facts** (must never appear): Epic Hyperspace, MyChart, HIPAA, Beaker, Sectra, Innovaccer, Workday HCM (used at Meridian — Workday is fine here but don't echo Meridian's clinical Workday context), SAP ECC, AS-400, Punchh, Wipro AMS, Apex Retail, Meridian Health, "480 stores", "1,420 staffed beds", "$24.8B retail revenue". These belong to Apex or Meridian and must not bleed.

---

## Folder structure (mirrors `datasets/apex-retail-synthetic-v1/` and `datasets/meridian-health-synthetic-v1/`)

```
datasets/firstcapital-financial-synthetic-v1/
├── 01-portfolio/
│   ├── application-portfolio.csv           # 180 application rows (larger than retail/health — Fortune-200 financial)
│   ├── integration-topology.json           # 520 directed edges
│   ├── initiatives-active.csv              # 32 active initiatives (matches the seed brief's "21 named majors" + 11 second-tier)
│   └── initiatives-closed.csv              # 16 closed initiatives
├── 02-financial/
│   ├── run-cost-by-application.csv         # 180 rows, FY25 actual + FY26 budget
│   ├── renewal-calendar.csv                # 62 vendor renewals next 18 months
│   ├── initiative-commitments.csv          # 32 active × 4 quarters
│   ├── capex-opex-summary.csv              # 8 categories × 3 years (incl. mainframe depreciation)
│   ├── workbook-summary.json
│   └── workbooks/                          # 2 xlsx (annual tech budget, renewal pipeline)
├── 03-org/
│   ├── teams.csv                           # 22 IT/data/digital teams
│   ├── roles.csv                           # ~3,400 role inventory (IT + data + cyber + digital)
│   ├── leadership-bench.csv                # 56 director+ roles
│   └── spans-of-control.csv
├── 04-vendors/
│   ├── vendor-contracts.csv                # 70 application/SaaS contracts
│   ├── infrastructure-contracts.csv        # 18 infra/managed-service contracts (incl. mainframe MSPs)
│   ├── vendor-scorecards.csv
│   └── contract-pdfs/                      # 40 synthetic PDFs
├── 05-dora/
│   └── dora-baseline.csv                   # 6 weeks × 22 teams = 132 obs
├── 06-devex/
│   └── devex-survey-fy25.csv               # 4 quarters × 18 cohorts
├── 07-ai-tools/
│   ├── ai-tool-footprint.csv               # 22 tools (sanctioned + shadow)
│   └── ai-usage-telemetry.csv              # 6 months utilization
├── 08-sponsor-signal/
│   └── sponsor-pulse.jsonl                 # 45 sponsor-pulse observations (incl. Consent Order weekly readouts)
├── 09-charters/
│   └── charter-pdfs/                       # 14 Wave-0 initiative charters
├── 10-incidents-changes/
│   ├── incidents.csv                       # 90-day incident sample (incl. 2 P1 ATM-network and 1 fraud-system incidents)
│   └── changes.csv                         # 90-day change sample
├── 11-regulatory/
│   ├── consent-order-bsa-aml.csv           # active remediation milestones
│   ├── occ-mra-mrias.csv                   # Matters Requiring Attention / Immediate Attention
│   ├── frb-supervisory-letters.csv
│   ├── sr-11-7-model-inventory.csv         # Fed SR 11-7 model risk inventory
│   ├── basel-iii-capital-attestation.csv
│   ├── ccar-stress-test-readiness.csv      # 2027 CCAR prep
│   ├── cra-modernization-mapping.csv
│   ├── cfpb-complaints-snapshot.csv
│   └── sox-itgc-controls.csv               # 48 ITGC controls × maturity
├── 12-benchmarks/
│   ├── gartner-banking-it-spend-quartiles.csv
│   ├── celent-vendor-rankings.csv
│   ├── aite-novarica-medians.csv
│   └── fdic-call-report-peer-comps.csv
├── 13-context/
│   ├── enterprise-context-source-files.csv # 60 Discovery Kit source rows
│   └── client-data-corpus.jsonl            # 400 retrieval chunks (larger than healthcare due to regulatory + 4-segment scope)
├── 99-verification/
│   ├── expected-sentinel-answers.json      # 16-question expected target
│   └── expected-row-counts.json
├── CHANGELOG.md
├── README.md
└── manifest.yaml
```

---

## Application portfolio composition (`01-portfolio/application-portfolio.csv`)

180 rows. Same CSV header as Apex's and Meridian's `application-portfolio.csv`. Vertical distribution targets:

| Domain | Count | Examples |
|---|---|---|
| Core banking & deposits | 14 | FIS Profile, Hogan-derivative custom deposit master, Fiserv DNA (acquired wealth sub), Sycorlex teller automation, IBM CICS legacy mainframe components |
| Lending & credit | 18 | nCino commercial origination, Black Knight LoanSphere (mortgage), FICO Decision Manager, Equifax InterConnect (consumer credit), Experian PowerCurve, LeasePilot (equipment finance) |
| Wealth platforms | 16 | Charles River IMS, BlackRock Aladdin, Envestnet, Pershing NetX360, Black Diamond, eMoney Advisor, Addepar (acquired wealth subsidiary), Salesforce FSC for advisors |
| Capital markets & trading | 14 | Bloomberg Terminal (~640 seats), Refinitiv Eikon, Calypso (FI/repo), Murex (derivatives), FXall, MarketAxess connectivity, ION Trading, Charles River Compliance |
| Payments & cards | 12 | ACI Worldwide RTP, FIS IST/Switch, TSYS Prime (card management), Mastercard MAES, Visa DPS, ZelleHub connector, Early Warning Services, FedNow gateway |
| AML / Fraud / Compliance | 14 | NICE Actimize SAM (transaction monitoring — under Consent Order rebuild), Actimize CDD (customer due diligence), LexisNexis Bridger (sanctions), Refinitiv WorldCheck, NetReveal (legacy AML, sunset), Featurespace ARIC (fraud), FICO Falcon, BAE Systems NetReveal |
| Risk, finance & treasury | 18 | SAS Enterprise Risk, Moody's RiskCalc, QRM (ALM), Numerix derivatives valuation, Oracle Financial Services Analytical Applications (OFSAA), Axiom regulatory reporting, Wolters Kluwer OneSumX, Adenza ControllerView |
| ERP, HR, workforce | 12 | Oracle Cloud Financials, Workday HCM (financial-services-only context — no clinical), Workday SCM (limited), Coupa procurement, ServiceNow ITSM/HRSD, BambooHR (legacy at acquired wealth sub, decommission planned) |
| Customer / CRM / digital | 14 | Salesforce Financial Services Cloud, Q2 digital banking, Backbase mobile, Adobe Experience Manager, Adobe Analytics, Optimizely, Twilio (SMS notifications), Glia (chat), Personetics (financial insights) |
| Data, analytics & AI | 18 | Snowflake (enterprise warehouse), Databricks (new ML platform), Collibra (governance), Alation (catalog), Informatica IDQ, dbt Cloud, Looker, Tableau Server, Power BI Premium, MLflow, Domino Data Lab (model registry), H2O Driverless AI (legacy) |
| Infrastructure & platform | 18 | AWS primary, Azure (M365 + SaaS), VMware, Red Hat OpenShift, IBM z/OS mainframe partition, IBM Db2 z/OS, Oracle Exadata, Pure Storage, Cisco UCS, Confluent Kafka, Splunk Enterprise, Cribl, GitHub Enterprise, GitLab (commercial banking pocket) |
| Security & identity | 14 | CrowdStrike, Splunk SIEM, Okta Workforce + Customer, Zscaler ZIA/ZPA, Proofpoint, Recorded Future, BeyondTrust PAM, SailPoint IdentityIQ, Microsoft Defender, Tanium, Saviynt (commercial pilot) |
| Specialty & line-of-business | 12 | DocuSign, DocuSign CLM, Hyland OnBase (document management), Kofax (capture), Pega (case management for ops), Genesys Cloud (contact center), Verint WFM, Calabrio QM |
| Legacy / sunset candidates | 16 | NetReveal legacy AML, Sycorlex teller (post-modernization), Hogan deposit master (gradual migration to FIS Profile), McCracken Strategy commercial loan servicing (legacy), Lawson at acquired wealth sub, IBM Db2 z/OS workloads being unwound to distributed, branch-side homegrown Access / Lotus Notes residuals |

**Required columns** (match Apex/Meridian CSV header order):
`app_id, name, vendor, category, business_owner, it_owner, deployment, lifecycle_stage, criticality, run_cost_fy25_usd, primary_dataclass, integration_count, last_modernization_review, ai_eligibility_score, notes`

Lifecycle distribution: ~50 invest, ~80 maintain, ~30 contain, ~20 retire.
Criticality: ~36 critical (incl. core banking + AML + payments + fraud + capital markets), ~74 high, ~52 medium, ~18 low.
AI eligibility score: 0.1–0.9; capital markets research, AML investigations, mortgage operations, contact-center, and wealth advisor productivity skew higher (0.55–0.85); core banking general ledger and SOX-controlled financial close skew lower.
Run cost: total must roll up to ~$1.42B of the $1.85B IT operating budget (remainder is people + non-app infra). Distribute log-normal: 12 apps above $30M (FIS Profile, Bloomberg seats, Workday, Salesforce, AWS commit, Azure commit, Snowflake, Splunk, CrowdStrike, mainframe MIPS+software, SAS, Actimize), long tail under $250K.

---

## Integration topology (`integration-topology.json`)

520 directed edges. Required shapes (financial-services-grounded):

- FIS Profile as hub with 110+ outbound edges (postings → GL, balances → digital channels, customer master → CRM, KYC → Actimize, FedWire/SWIFT, ACH NACHA, RTP, FedNow)
- nCino → 38 commercial banking integrations (Salesforce FSC, credit decisioning, document services, treasury onboarding)
- Charles River IMS → 32 wealth platform edges (Aladdin, Pershing custody, Black Diamond performance, market data)
- Bloomberg/Refinitiv → 26 trading floor consumers (Calypso, Murex, risk, P&L attribution)
- Salesforce FSC → 44 inbound/outbound (consumer relationship, commercial pipeline, wealth advisor desk, marketing automation)
- 22 legacy point-to-point integrations flagged `risk: high` (Hogan ↔ Sycorlex, NetReveal residuals, McCracken Strategy, branch-side Access/Notes shadow stores)
- 14 regulatory reporting outbound (Axiom → OCC Call Report, Wolters Kluwer → FFIEC, FRB Y-9C, SEC EDGAR via internal, FINRA OATS / TRACE, Treasury OFAC inbound)
- 8 payment-network edges (Mastercard, Visa, ZelleHub, FedNow, FedWire, SWIFT, ACH, Plaid for fintech connect)
- 6 credit bureau edges (Equifax, Experian, TransUnion, FICO score acquisition + LOS feeds)
- 12 third-party AML/sanctions inbound (LexisNexis Bridger, Dow Jones risk, ICE Compliance, ComplyAdvantage post-Consent-Order pilot)
- 18 internal-data inbound (Snowflake from 80+ source systems via Confluent Kafka + Informatica)

Each edge: `edge_id, source_app, target_app, protocol (ISO20022|SWIFT|NACHA|FIX|FpML|REST|SOAP|MQ|Kafka|JDBC|SFTP|FTPS|file-drop), direction, message_type, dataclass (public|internal|confidential|restricted-pii|restricted-nonpublic-customer), latency_p95_ms, error_rate_30d, owner_team, notes`.

---

## Initiatives (`initiatives-active.csv`)

32 active initiatives. The 14 headline initiatives MUST be present (these are the demo backbone — the Sentinel verification set in `99-verification/` references them and the seed brief Part 5 lists them):

| ID | Name | Posture | Stage | Sponsor |
|---|---|---|---|---|
| FC-01 | BSA/AML Remediation Program (Consent Order) | Watch | Build | CCO Blythe + CRO Shah |
| FC-02 | Enterprise AI Platform & Governance Build | Aligned | Plan | CDO Deshmukh + CIO Okafor-Hill + CRO Shah |
| FC-03 | Wealth Acquisition Integration (Q1 2025 deal) | Healthy | Build | President FCW Kolluri-Anderson |
| FC-04 | Branch Network Optimization (2026 closure list + 8-market new format pilots) | Aligned | Scale | Head Consumer Hess-McKinley |
| FC-05 | Core Banking Platform Modernization (Deposits in-flight, Lending in design) | Watch | Build | CIO Okafor-Hill + Hess-McKinley |
| FC-06 | Enterprise Customer Data Platform (Phase 1 consumer-wealth in prod, Phase 2 commercial in build) | Healthy | Scale | CDO Deshmukh + segment leads |
| FC-07 | Cross-Franchise Referral Program (measurement + incentive design) | Aligned | Build | COO Restrepo-Wang + segment leads |
| FC-08 | Commercial Lending Analytics Enhancement (healthcare-vertical underwriting pilot) | Healthy | Pilot | Head Commercial Chen-Worthy + CCO Okonjo |
| FC-09 | Capital Markets Strategic Review (activist context — internal, not public) | Plan | Plan | Head CM Rosenmeyer + CFO Burakovsky-Park |
| FC-10 | 2027 CCAR Preparation (evolving stress test framework) | Aligned | Plan | CFO Burakovsky-Park + CRO Shah |
| FC-11 | M365 Copilot Enterprise rollout (non-trader, scoped) | Healthy | Pilot | CIO Okafor-Hill |
| FC-12 | Real-time payments expansion (FedNow + RTP) | Aligned | Build | Payments Head + CIO |
| FC-13 | Contact center AI assist (consumer + commercial, sanctioned) | Pilot | Pilot | Head Consumer + CDigO Taylor-Vance |
| FC-14 | Model risk inventory rebuild under SR 11-7 (tied to FC-02) | Aligned | Build | CRO Shah + CDO Deshmukh |

Plus 18 more "second-tier" initiatives spanning payments modernization, CRE portfolio management, retirement services growth, climate-reporting infrastructure, government banking expansion, small-business digital, mortgage platform modernization, treasury enhancement, IB build-out, and enterprise workforce strategy.

Closed initiatives (`initiatives-closed.csv`) — 16 rows, including 4 explicit failures (e.g. earlier NetReveal AML rebuild abandoned 2023, prior CDP attempt killed 2022, robo-advisor consumer pilot wound down 2024, retail cryptocurrency pilot shelved 2024 post-SEC enforcement environment).

---

## Vendor & contracts (`04-vendors/`)

70 application/SaaS contracts. Financial-services-vertical-grounded mix:

FIS, Fiserv, Jack Henry, nCino, Salesforce, Microsoft, AWS, Snowflake, Databricks, Bloomberg, Refinitiv (LSEG), ICE, Calypso (Adenza), Murex, BlackRock Aladdin, Charles River (SS&C), Pershing (BNY), Envestnet, Black Diamond, eMoney, Addepar, Actimize (NICE), LexisNexis Risk Solutions, Refinitiv WorldCheck, Dow Jones Risk, FICO, Equifax, Experian, TransUnion, ACI Worldwide, TSYS (Global Payments), Mastercard, Visa, Early Warning Services, SAS, Moody's Analytics, QRM, Numerix, Oracle (OFSAA + Cloud Financials), Workday, Coupa, ServiceNow, Adobe (DX Cloud), Q2, Backbase, Glia, Personetics, Twilio, Genesys, Hyland, Kofax, Pega, DocuSign, Splunk, CrowdStrike, Okta, Zscaler, Proofpoint, BeyondTrust, SailPoint, Recorded Future, Tanium, Microsoft Defender, IBM (mainframe SW + Db2 z/OS + CICS support), Red Hat, VMware, Pure Storage, Cisco, Confluent, Cribl, GitHub.

18 infrastructure/managed-service contracts (Accenture banking transformation advisory, Deloitte Consent Order remediation MSP, Cognizant infra ops, TCS mainframe modernization support, EY model-validation services, KPMG SR 11-7 advisory, Tata branch-IT field support).

40 synthetic contract PDFs across highest-value renewals (FIS multi-year, Bloomberg, Workday, Snowflake, Databricks, SAS, Actimize, Splunk, CrowdStrike, Okta, Salesforce, Oracle, AWS commit, Azure commit).

**Renewal pressure curve:** 18 renewals in next 6 months (this is the "renewal stress" pattern Sentinel should surface when asked about FY26 budget risk under efficiency-ratio commitment).

---

## Org topology (`03-org/`)

22 IT/data/digital/cyber teams totaling ~3,400 roles. Financial-services-appropriate functions:

- Core Banking Engineering (Deposits, Lending, Mortgage, Servicing) — 4 teams, ~580 FTE
- Commercial Banking Tech (nCino + treasury + commercial cards) — 1 team, ~240 FTE
- Wealth Technology (Charles River, advisor desktop, performance) — 1 team, ~180 FTE
- Capital Markets Technology (trade floor, market data, post-trade) — 1 team, ~210 FTE
- Payments Engineering (RTP/FedNow/cards/ACH) — 1 team, ~145 FTE
- AML & Financial Crimes Technology (Consent Order delivery team) — 1 team, ~190 FTE (notably oversized due to remediation)
- Fraud Technology — 1 team, ~95 FTE
- Risk & Treasury Technology (ALM, derivatives valuation, regulatory reporting) — 1 team, ~165 FTE
- Data Platform & Engineering (Snowflake, Databricks, Kafka, governance) — 1 team, ~220 FTE
- AI Platform & MLOps (newly formed Q1 2026 under Deshmukh) — 1 team, ~70 FTE
- Analytics & BI — 1 team, ~140 FTE
- Digital Channels (mobile, online, conversational) — 1 team, ~210 FTE
- Customer Experience & Marketing Tech — 1 team, ~95 FTE
- Cybersecurity & Identity — 1 team, ~280 FTE
- Cloud & Platform Engineering (AWS + Azure landing zones) — 1 team, ~165 FTE
- Infrastructure & Mainframe Operations — 1 team, ~310 FTE (mainframe still significant)
- ITSM & Service Desk — 1 team, ~240 FTE
- Branch & ATM Field Technology — 1 team, ~180 FTE
- Corporate Tech (HR, Finance, Procurement, Workplace) — 1 team, ~115 FTE
- PMO & Tech Governance — 1 team, ~85 FTE
- Innovation & Emerging Tech (small, advisor-facing AI pilots) — 1 team, ~25 FTE
- Compliance Tech (Consent Order + ongoing) — 1 team, ~165 FTE

Leadership bench: 56 director+ roles with name, hire date, span, prior employer (use anonymized stand-ins; only the 17 named executives from the seed brief are real-composite names).

---

## AI tool footprint (`07-ai-tools/`)

22 tools across sanctioned + shadow categories. The financial-services twist: model-risk governance (SR 11-7) and the BSA/AML Consent Order make AI governance a board-watched topic, so shadow-AI proliferation is a named pattern in the seed (§6.1):

| Tool | Vendor | Use case | Status | Users |
|---|---|---|---|---|
| Microsoft 365 Copilot E5 | Microsoft | Non-trader productivity | Pilot | 4,200 licenses (rollout in flight, blocked at trader desktops) |
| GitHub Copilot Business | Microsoft | Developer productivity | Scale | 1,400 devs |
| GitHub Copilot Enterprise | Microsoft | Org-aware code search | Pilot | 240 devs |
| Glean | Glean | Enterprise search (sanctioned pilot) | Pilot | 900 users |
| Notion AI | Notion | Documentation | Pilot | 280 users |
| Salesforce Einstein Copilot | Salesforce | Advisor + relationship banker assist | Pilot | 380 wealth + commercial |
| Personetics | Personetics | Consumer financial insights | Scale | embedded in mobile, ~3.4M users touched |
| Pega Customer Decision Hub | Pegasystems | Next-best-action | Scale | embedded in contact center |
| Genesys AI (sanctioned) | Genesys | Contact center summarization, agent assist | Pilot | 1,200 agents |
| ComplyAdvantage Copilot | ComplyAdvantage | AML investigation accel | Pilot | 95 investigators (Consent Order workflow) |
| Hummingbird | Hummingbird | SAR case management | Pilot | 70 investigators |
| Featurespace ARIC | Featurespace | Real-time fraud scoring | Scale | embedded in card auth |
| FICO Falcon | FICO | Card fraud | Scale | embedded |
| H2O Driverless AI | H2O.ai | Legacy auto-ML for credit scoring (sunset planned) | Wind-down | 22 modelers |
| Databricks AutoML | Databricks | ML platform (new) | Build | 120 modelers |
| MLflow + Domino | Open + Domino | Model registry & MLOps | Build | 120 modelers |
| Bloomberg GPT (preview) | Bloomberg | Capital markets research assist | Pilot | 18 traders |
| Refinitiv Workspace AI | LSEG | Research summarization | Pilot | 40 analysts |
| AlphaSense | AlphaSense | Equity research / commercial banking due diligence | Scale | 240 users |
| ChatGPT Enterprise (sanctioned tenant) | OpenAI | Research allowance | Pilot | 180 users |
| Azure OpenAI (gpt-4o internal RAG) | Microsoft | Internal Q&A on policies | Build | platform |
| **Shadow AI register** | Various | Tracked discovery (ChatGPT free/Plus on personal devices, GitHub Copilot personal-MSA, Claude.ai personal) | Discovery | est. 4,800 instances flagged by Zscaler logs — Pattern 01 |

Usage telemetry: 6 months of weekly active users + tasks supported + risk-tier classification (per Pattern 01 in seed). Shadow AI rows MUST be tagged with `governance_status = unsanctioned` to feed the existing Shadow-AI Governance pattern pack.

---

## Sentinel verification set (`99-verification/expected-sentinel-answers.json`)

16 questions with grounded expected facets. Must include the canonical 5 questions every stress run uses plus 11 financial-services-specific scenarios:

1. As CIO, what AI investments should we prioritize for the next two quarters under the efficiency-ratio commitment?
2. How do we de-risk a GenAI workload platform decision under SR 11-7 model governance and the active BSA/AML Consent Order?
3. Walk me through our application portfolio. Where is legacy concentrated?
4. Which initiatives should we kill this quarter to fund Consent Order remediation?
5. What blocks killing NetReveal residuals at the branch perimeter?
6. What's the FY26 renewal pressure and which renewals are most exposed under the efficiency-ratio commitment?
7. Where is Microsoft 365 Copilot working vs. where is it stuck (trader-desktop block)?
8. How does the Commercial Lending Analytics pilot pencil out against credit-loss exposure?
9. What's our shadow-AI exposure and how do we close it without killing legitimate productivity?
10. Where are we exposed on Basel III finalization, CRA modernization, and CFPB §1033 simultaneously?
11. Map our integration topology — where is the legacy mainframe debt concentrated and what's the unwind cost?
12. What's our AI cost-to-serve across consumer / commercial / wealth / capital markets, and where is it growing fastest?
13. What sibling moves should I bundle with the Hogan deposit-master unwind?
14. CDO 30-60-90 plan synthesis given current substrate (for Ravi Deshmukh's January 2026 ExCo elevation).
15. CCO 30-60-90 for BSA/AML Consent Order milestone risk (for Marcus Blythe).
16. CEO synthesis: what does the activist context (Capital Markets Strategic Review) imply for the FY27 tech investment plan?

For each question: `intent`, `must_cite_apps[]`, `must_cite_initiatives[]`, `must_cite_regulators[]`, `forbidden_terms[]` (always includes Apex/Meridian/Epic/HIPAA/AS-400/SAP-ECC), `expected_dissent[]`, `expected_one_click_action`.

---

## Retrieval substrate (`13-context/`)

- `enterprise-context-source-files.csv` — 60 rows. Mix: CEO Bo Hargrove 30-60-90, CFO efficiency-ratio commitment memo, CDO ExCo elevation announcement + 90-day plan, CCO Consent Order milestone tracker, CRO model-inventory rebuild, board Technology Committee minutes (redacted), regulatory exam letters (synthetic), Activist Day talking points (synthetic), 10-K and 10-Q excerpts (synthetic, mirrored on real banking 10-K shape), Capital Markets Strategic Review charter (confidential).
- `client-data-corpus.jsonl` — 400 retrieval chunks (~600 tokens each). Stratify: 80 core-banking & operations, 70 commercial & wealth, 60 capital markets, 60 risk & treasury, 55 regulatory & compliance (incl. Consent Order subset), 45 IT strategy, 30 cyber & identity, 20 vendor/contract.
  Each chunk: `id, source_file_id, tenant_id (must be firstcapital), title, text, dataclass (NPI/PII tagged where applicable), last_updated, depth_score (8–10)`.

The depth_score >= 8 filter is what `searchCorpus` uses; chunks below 8 do not surface. Apex's pack has ~280 chunks pre-loaded, Meridian targets 320 — First Capital MUST match or exceed at 400 to reflect the larger 4-segment regulatory surface.

---

## Ingestion & verification

The pack lands in two phases (parallel to the Apex P18 and Meridian P19 model):

**Phase A — static scaffold (parallels PR #2342 for Apex):**
- Author all files under `datasets/firstcapital-financial-synthetic-v1/`
- Add `scripts/verify/firstcapital-data-pack-scaffold.mjs` (deterministic: row counts, JSON parse, manifest checksum, forbidden-term scan including healthcare and retail terms)
- Release record `docs/releases/records/2026-MM-DD-p20-firstcapital-data-pack-scaffold.md`
- Verification: `npm run verify:firstcapital-data-pack`

**Phase B — ingestion into Supabase:**
- Loader script `scripts/seed/firstcapital-substrate.ts` writes 180 apps, 520 edges, 32 active initiatives, 16 closed, 22 teams, ~3,400 roles, 70 vendor contracts, 22 AI tools, 400 corpus chunks
- Tenant rows scoped to `clients.tenant_key = 'firstcapital'`
- All rows tagged `dataclass = 'internal' | 'confidential' | 'restricted-pii' | 'restricted-nonpublic-customer'` per the GLBA / Reg P framework
- Embeddings: enqueue 400 chunks through the existing corpus embed worker (do NOT inline a new provider call — use the AI Egress Control Plane)

**Cross-tenant guard:** the scaffold verifier MUST grep every authored file for the forbidden terms list (Apex Retail, Meridian Health, Epic, MyChart, HIPAA, Beaker, Sectra, Innovaccer, SAP ECC, AS-400, Punchh, Wipro AMS, "480 stores", "1,420 staffed beds", "$24.8B retail revenue") and fail the build if any match. Add an additional financial-vertical guard rail: every chunk tagged `dataclass = 'restricted-nonpublic-customer'` MUST also include an NPI disclaimer marker so the synthesizer's redaction guard can confirm it never echoes.

---

## Acceptance criteria

A successful Packet 20 ships when:

1. All 13 folders and 99-verification populated; row counts match manifest.
2. `npm run verify:firstcapital-data-pack` passes deterministically.
3. Re-running the full-module stress test against First Capital shows:
   - 0 occurrences of "0 P18 app records visible" or "org_topology unavailable"
   - Sentinel structured turns cite at least 6 distinct First Capital apps and 4 distinct First Capital initiatives across the 16 verification questions
   - Cross-tenant guard: 0 leakage of Apex/Meridian/Epic/HIPAA/SAP/AS-400 terms in any agent response
   - The Consent Order question (Q5 / Q15) returns a response that explicitly cites the BSA/AML Consent Order, names Marcus Blythe + Vikram Shah, and refuses to surface NPI even when the question is framed adversarially
4. Intent classifier verification: Q3/Q4/Q5 (post-PR #2346) do NOT misclassify as `it_productivity` AND the canned-template-repeat detector reports 0 fingerprint collisions across all 16 turns.
5. Run-cost rollup in audit report shows non-zero $ when Sentinel cites `run_cost_fy25_usd` from the loaded portfolio (or, if usage isn't yet logged in `request_metadata`, the runner reports `cost_source: 'not_logged'` rather than misleading `$0.0000`).
6. SR 11-7 model-inventory CSV is referenced when Sentinel reasons about any AI investment — confirming the model-risk overlay is operative.

---

## Out of scope for this packet

- New product surfaces — Watchlist weights, executive-brief page, etc. — tracked separately.
- Live ingestion harness in CI — Phase B ships ingestion code; running it in CI on every PR is a later concern.
- Real-time Consent Order milestone API integration — the CSV is the substrate; live FRB reporting is enterprise integration work, not synthetic data work.
- Real customer NPI of any kind — the entire pack is composite by construction.
- Tenant-RLS pen-test rerun — covered by separate task #17.

---

## Cross-tenant matrix (for the three composites)

| Aspect | Apex Retail (P18) | Meridian Health (P19) | First Capital (P20) |
|---|---|---|---|
| Vertical | Retail | Healthcare IDN | Diversified Financial Services |
| Tenant key | `apexretail` | `meridian` | `firstcapital` |
| Annual revenue | $24.8B | $4.8B net patient revenue | $18.2B |
| Employees | 96,000 | 18,400 | 46,000 |
| IT budget | $545M | $215M | $1.85B |
| Apps in pack | 120 | 140 | 180 |
| Integration edges | 320 | 380 | 520 |
| Initiatives (active) | 30 | 28 | 32 |
| Teams | 14 | 16 | 22 |
| Roles | 1,420 | 1,650 | 3,400 |
| Vendor contracts | 45 | 50 | 70 |
| AI tools | 14 | 18 | 22 |
| Retrieval chunks | 280 | 320 | 400 |
| Verification questions | 12 | 14 | 16 |
| Dominant regulatory regime | PCI-DSS + state retail | HIPAA + Joint Commission + CMS | OCC + FRB + FDIC + CFPB + SEC + FINRA + BSA/AML Consent Order |
| Distinguishing AI risk | Loyalty/personalization | HIPAA PHI in clinical AI | SR 11-7 model risk + Consent Order overlay |
| CIO/CDO archetype | Modernization-blocked | Newly-arrived CDIO (Anita) | Newly-elevated CDO (Ravi Deshmukh) |

This matrix is the single canonical view of how the three composite tenants differ — keep it updated as the packs evolve.
