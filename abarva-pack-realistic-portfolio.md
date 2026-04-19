# AbarVa Build Pack J · Realistic AI Portfolio Seed Data

**Date:** April 19, 2026
**Scope:** Named-vendor seed data for Meridian, First Capital, Apex. Payload spec for `npm run seed:enterprise` — this is what gets loaded.
**Effort:** ~1-2 days to write the seed scripts, data is in this doc.
**Why:** generic data feels generic. Named data feels real. A CTO who's evaluated Abridge, deployed Copilot, debated Cohere Health vs myNEXUS — that CTO instantly recognizes the portfolio or walks.

---

## Naming rule reminder

- **Forbidden** (strict): consulting firms (McKinsey, BCG, Deloitte, Accenture, Bain, Huron, Navigant), previously-real demo clients (MD Anderson, Presbyterian, PHS, CommonSpirit, HP Inc)
- **Allowed and encouraged**: vendor products — Abridge, Nuance DAX, Cohere Health, Microsoft Copilot, Claude Enterprise, GitHub Copilot, Codex, Moveworks, Glean, Harvey, Hebbia, Bloomreach, Blue Yonder, o9 Solutions, Aidoc, Paige.AI, Kensho, Feedzai, Signifyd, Cresta, Personetics, Algolia, Dynamic Yield, Afterpay, Epic, Oracle, Workday, SAP — every real tool they'd actually encounter
- **Composite when needed**: service partners ("national cloud SI," "offshore data engineering firm"), people names (always fictional composites)

---

# Client 1 · Meridian Health System

**Profile:** $14.2B revenue, 9 hospitals + 142 clinics + 3 research centers, 28,400 employees across 4 Midwest states, Epic EHR, AWS-primary cloud, Snowflake data platform.

## AI portfolio — 42 use cases across 4 states

### In production (12 use cases)

| # | Name | Vendor / Product | Status | Providers / Users | Adoption | Monthly Cost | Verified Value |
|---|---|---|---|---|---|---|---|
| 1 | Ambient clinical documentation (East + Central regions) | **Abridge** | Production · 18 months | 1,240 providers | 78% of eligible | $340K | 19% doc-time savings, verified via Epic time-stamps |
| 2 | Ambient clinical documentation (West region) | **Nuance DAX Copilot** (Microsoft) | Production · 14 months | 420 providers | 62% of eligible | $138K | 14% doc-time savings |
| 3 | M365 Copilot enterprise rollout | **Microsoft Copilot for M365** | Production · 22 months | 8,400 seats | 48% daily active | $252K | 11% meeting-time savings (Viva analytics) |
| 4 | Engineering code assist | **GitHub Copilot Enterprise** | Production · 16 months | 340 engineers | 76% weekly active | $12K | 28% feature cycle-time reduction |
| 5 | IT service desk copilot | **Moveworks** | Production · 11 months | 28,400 employees | 52% tickets deflected | $64K | $2.4M annual cost avoidance |
| 6 | Prior authorization (cardiology + orthopedics) | **Cohere Health** | Production · 9 months | 2 service lines | 89% automation | $42K | 11 days faster auth, $3.1M denied-revenue recovery |
| 7 | Enterprise search & knowledge | **Glean** | Production · 8 months | 6,800 seats | 41% WAU | $38K | Indirect — time-savings unverified |
| 8 | Discharge summary drafting | **Epic Art of Medicine + Azure OpenAI** | Production · 6 months | 9 hospitals | 71% acceptance rate | $58K | 12 min/discharge saved |
| 9 | Radiology reading prioritization | **Aidoc** | Production · 24 months | 4 hospitals (pulmonary, stroke) | 92% of scans triaged | $88K | 34% faster critical-finding identification |
| 10 | Pathology image analysis | **Paige.AI** | Production · 12 months | 3 hospitals | Prostate + breast | $54K | Second-read decision support, QA only |
| 11 | Claims denial prediction | **Internal (Claude Enterprise)** | Production · 7 months | Revenue cycle team | — | $32K LLM + $18K eng | $4.2M denials recovered |
| 12 | Clinical trial matching | **Epic + Flywheel.io** | Production · 10 months | Research centers | 340 trials actively matched | $22K | 28% higher enrollment |

### In scaling pilot (11 use cases)

| # | Name | Vendor / Product | Stage | Scope | Next milestone |
|---|---|---|---|---|---|
| 13 | Prior auth expansion (oncology + neurology + GI + endocrine + rheumatology) | **Cohere Health** | Scaling | 5 additional service lines | Q2 2026 full rollout |
| 14 | Patient messaging triage | **Hyro + Epic MyChart** | Pilot phase 3 | East region | Full system Q3 |
| 15 | Ambient documentation for nursing | **Abridge (nursing beta)** | Pilot | 180 nurses, 2 hospitals | Extend to 600 |
| 16 | Coding audit copilot | **3M 360 Encompass AI** | Pilot | 40 coders | Verify 6% coding yield lift |
| 17 | Sepsis early warning | **Epic + internal model** | Pilot | 4 hospitals | FDA-style validation ongoing |
| 18 | Medication interaction copilot | **First Databank + internal** | Pilot | ED units | Expand to inpatient |
| 19 | Staffing forecast + scheduling | **Kronos + AWS Forecast** | Pilot | Nursing only | Expand to imaging, lab |
| 20 | Interpreter assist (multilingual) | **Jeenie + Claude Enterprise** | Pilot | 2 hospitals | Scale to 5 |
| 21 | Recruiting screen assistant | **Paradox AI** | Pilot | Clinical roles | HR concerned about bias — under review |
| 22 | Revenue forecast assistant | **Anaplan + Claude Enterprise** | Pilot | Finance team | Verify accuracy vs current forecast |
| 23 | Learning & development personalization | **Docebo AI** | Pilot | Clinical staff | Measure completion lift |

### Stalled or problematic (5 use cases)

| # | Name | Vendor / Product | Status | Why stalled | Contradiction |
|---|---|---|---|---|---|
| 24 | Chart summarization (Claude-based) | **Claude Enterprise** | Stalled 90 days | Liability review unresolved — who signs off? | Legal + governance |
| 25 | Imaging copilot (cardiology) | **HeartFlow** | Stalled 120 days | Vendor contract dispute on data residency | Risk/legal |
| 26 | Patient portal Q&A | **Microsoft Copilot Studio** | Stalled 60 days | Answer quality below threshold in testing | Quality/trust |
| 27 | Physician burnout prediction | **Internal model** | Indefinite | Ethics committee concerns | Governance |
| 28 | OR scheduling optimization | **LeanTaaS iQueue** | Stalled 180 days | Change management failure — anesthesiologists refused workflow | Adoption |

### Research / innovation (5 use cases)

| # | Name | Vendor / Product | Status |
|---|---|---|---|
| 29 | Genomic data analysis | **Tempus Next + internal** | R&D, not yet clinical |
| 30 | Real-world evidence generation | **Komodo Health** | Research center only |
| 31 | Drug discovery partnership | **Recursion** | Partnership, research arm |
| 32 | Medical imaging research | **NVIDIA Clara** | Research center GPU cluster |
| 33 | Synthetic data for model training | **Syntegra** | R&D |

### Shadow AI — discovered, ungoverned (9 use cases)

| # | What's happening | Vendor | Discovered via | Risk |
|---|---|---|---|---|
| 34 | Cardiologists using **ChatGPT Plus** for differential diagnosis on personal accounts | OpenAI | Zscaler network logs | HIGH — PHI exposure risk |
| 35 | Marketing using **Midjourney** for campaigns without brand review | Midjourney | Invoice trail $2.8K/mo | MEDIUM — brand compliance |
| 36 | HR using **Eightfold AI** for resume screening | Eightfold | Okta login data | HIGH — EEOC bias risk |
| 37 | Research group running **Llama 3** locally on unapproved GPUs | Meta | Network monitoring | MEDIUM — unsanctioned compute |
| 38 | Finance team using **Claude.ai consumer** for analysis | Anthropic (consumer) | Credit card trail | MEDIUM — no BAA |
| 39 | Several clinicians on **Doximity GPT** | Doximity | Survey + traffic | LOW — industry-normed but untracked |
| 40 | Legal team drafting with **Harvey AI** (unsanctioned trial) | Harvey | IT ticket | MEDIUM — eventually sanctioned |
| 41 | Physicians using **Open Evidence** for literature Q&A | Open Evidence | Traffic logs | LOW — clinical reference use |
| 42 | Lab researchers using **Consensus** for paper discovery | Consensus | Traffic logs | LOW |

## Active AI projects — 14 in flight

| Project | Vendor ecosystem | Budget | Phase | % Complete |
|---|---|---|---|---|
| Abridge scale to full provider base | Abridge | $18M | 3 of 4 | 62% |
| Prior auth AI expansion (5 specialties) | Cohere Health | $4.2M | 2 of 3 | 48% |
| AI governance program | Internal + outside counsel | $4.2M | Ongoing | 40% |
| Revenue cycle AI consolidation | Claude Enterprise + 3M | $12M | 2 of 4 | 30% |
| Ambient nursing deployment | Abridge | $6M | 1 of 3 | 18% |
| M365 Copilot full rollout | Microsoft | $8.4M | 3 of 3 | 88% |
| Claims triage copilot (Claude-based) | Claude Enterprise | $3.8M | 3 of 4 | 72% |
| Patient portal AI | Hyro + Epic | $5.4M | 2 of 4 | 45% |
| Sepsis model validation | Epic | $2.2M | FDA-style testing | 55% |
| Interpreter assist expansion | Jeenie + Claude | $1.8M | Pilot scale | 35% |
| Radiology AI consolidation | Aidoc + vendor selection | $4.8M | Evaluation | 25% |
| Shadow AI discovery + governance | Zscaler + internal | $2.4M | Discovery complete, remediation in flight | 50% |
| Data platform modernization (Snowflake + AI-ready) | Snowflake + Databricks + dbt | $38M | 3 of 4 | 68% |
| Clinical data quality program | Informatica + internal | $6.8M | 1 of 3 | 22% |

## Contradictions (live, structured)

1. **HIGH · Cost vs Adoption** — Abridge at $340K/mo reaching 78% of East+Central providers while DAX at $138K/mo reaching 62% of West providers. Regional sponsor decisions made independently. Consolidation opportunity: $48K-$180K/mo depending on direction.

2. **HIGH · Vendor overlap** — Abridge + Nuance DAX + Nabla (lightly piloted in 1 clinic) all deploying ambient. Three vendors, same job. Contract terms differ, no single owner reconciling.

3. **HIGH · Shadow AI** — 9 confirmed shadow AI use cases (Zscaler). Three involve PHI exposure risk (cardiology ChatGPT usage). None in inventory.

4. **HIGH · Risk vs Data** — Paige.AI image data flows to third-party cloud. BAA in place, but data-processing addendum references 2023 subprocessor list; hasn't been refreshed against current subprocessors.

5. **MEDIUM · Cost trajectory** — AI-related cloud spend (Bedrock + AWS + Azure OpenAI) growing 1.8x in 12 months. Projected 6-mo: $2.4M/mo. No consumption governance implemented.

6. **MEDIUM · Value vs Adoption** — Chart summarization piloted 6 months ago, paused. Adoption was 72% where tested but liability review blocks production. Product team frustrated.

7. **MEDIUM · Governance gap** — AI governance committee meets monthly; 18 of 42 use cases never reviewed. 4 of 18 are in production.

8. **MEDIUM · Bias incident trail** — 2 documented bias incidents in Paradox AI recruiting screen over past 4 months. Incident reports closed but no cross-cohort retrain triggered.

9. **LOW · Research-production bleed** — Tempus Next research access credentials appear to have clinical-user logins (Epic audit). Research-only tool touching PHI via ambiguous clinical access.

## Cost breakdown (monthly, realistic)

| Category | Vendors | Monthly $ |
|---|---|---|
| LLM APIs (direct) | Anthropic, Azure OpenAI, OpenAI | $1.8M |
| AI-SaaS licenses | Abridge, DAX, Cohere Health, Moveworks, Glean, Aidoc, Paige.AI, Cresta | $1.4M |
| Copilot seats | Microsoft Copilot, GitHub Copilot | $284K |
| Compute (ML, GPU) | AWS Bedrock, SageMaker, p5 instances | $1.9M |
| Data platform | Snowflake, Databricks, dbt | $780K |
| Staff aug (AI-specific) | 4 vendor partnerships, 120 FTE | $2.1M |
| Services (SI) | 3 partners | $890K |
| Observability + governance | Datadog, Credo AI, internal | $180K |
| Unknown / shadow (est.) | Various | $180K |
| **Total** | | **$9.5M/mo** |

Realistic. A $14B IDN spending $114M/year on AI-adjacent. CFO would recognize the order of magnitude.

---

# Client 2 · First Capital Financial

**Profile:** $28B revenue regional bank, 34,000 employees, 890 branches + 2,400 ATMs, 6 East Coast states, core banking on Finxact + legacy, Snowflake + AWS primary.

## AI portfolio — 34 use cases

### In production (11)

| # | Name | Vendor / Product | Users | Adoption | Monthly Cost | Verified Value |
|---|---|---|---|---|---|---|
| 1 | M365 Copilot broad rollout | **Microsoft Copilot for M365** | 22,400 seats | 54% DAU | $672K | 14% meeting-time savings |
| 2 | Engineering code assist | **GitHub Copilot Enterprise** | 1,820 engineers | 82% WAU | $62K | 31% PR cycle-time reduction |
| 3 | IT service desk copilot | **Moveworks** | 34,000 employees | 61% deflection | $142K | $8.4M annual cost avoidance |
| 4 | Enterprise search | **Glean** | 18,000 knowledge workers | 47% WAU | $118K | Productivity measured indirectly |
| 5 | Investment research copilot | **Hebbia** | 240 research analysts | 78% DAU | $96K | 40% faster memo drafting |
| 6 | Legal & compliance copilot | **Harvey AI** | 80 legal staff | 88% WAU | $72K | 35% faster contract review |
| 7 | Fraud scoring (card + wire) | **Feedzai** | All transactions | Real-time | $340K | 28% fraud loss reduction YoY |
| 8 | AML transaction monitoring | **NICE Actimize + internal** | 180 investigators | — | $220K | 42% false-positive reduction |
| 9 | Customer service copilot | **Cresta + Genesys** | 3,800 agents | 91% call coverage | $240K | AHT -47 sec, CSAT +6 pts |
| 10 | Market data intelligence | **Kensho** | 140 traders + researchers | Licensed | $180K | — |
| 11 | Financial wellness personalization | **Personetics** | 2.4M customers | — | $280K | 12% deposit growth in cohort |

### In scaling pilot (10)

| # | Name | Vendor / Product | Stage |
|---|---|---|---|
| 12 | Advisor copilot for wealth | **Claude Enterprise (custom)** | Pilot phase 3 — 120 advisors |
| 13 | Commercial underwriting assistant | **Claude Enterprise + internal** | Pilot — 40 underwriters |
| 14 | Mortgage processing AI | **Ocrolus + Blend** | Scaling — expanding from 20% to 60% of applications |
| 15 | KYC + onboarding | **Hummingbird** | Pilot — retail banking |
| 16 | Branch traffic forecast | **SAS + internal** | Pilot — 180 branches |
| 17 | Loan collections optimization | **TrueAccord AI** | Pilot |
| 18 | Digital banking conversational AI | **Kasisto** | Pilot — mobile |
| 19 | Trade surveillance | **Behavox** | Pilot — 220 traders |
| 20 | Credit card merchant disputes | **Quavo** | Pilot |
| 21 | ESG reporting automation | **Watershed + Claude** | Pilot |

### Stalled (4)

| # | Name | Vendor / Product | Why |
|---|---|---|---|
| 22 | Small business credit decisioning | **Zest AI** | Fair lending review — 90+ days |
| 23 | Wealth management pitch generator | **Saifr** | Compliance rejected current output quality |
| 24 | Call center sentiment coaching | **Observe.AI** | Lost to Cresta, sunset planned |
| 25 | Credit card upsell personalization | **Personetics** | Paused for experiment design |

### Research / exploratory (5)

| # | Name | Vendor / Product |
|---|---|---|
| 26 | Quantitative research augmentation | **Claude Enterprise + Bloomberg** |
| 27 | Alternative data signals | **AlphaSense + Cohere** |
| 28 | Synthetic financial data for model training | **Mostly AI** |
| 29 | RegTech automation | **ComplyAdvantage** |
| 30 | Open banking signal extraction | **Plaid + internal** |

### Shadow AI (4)

| # | What | Vendor |
|---|---|---|
| 31 | Investment analysts using ChatGPT Plus / Claude.ai for research | OpenAI / Anthropic consumer |
| 32 | Marketing using Jasper for email copy | Jasper |
| 33 | HR using consumer AI tools for job descriptions | Various |
| 34 | Quants running local Mistral models on lab hardware | Mistral |

## Active AI projects — 13

| Project | Vendor | Budget | Phase % |
|---|---|---|---|
| Advisor copilot expansion | Claude Enterprise + Salesforce Financial Services Cloud | $14M | 55% |
| M365 Copilot full deployment | Microsoft | $24M | 92% |
| Fraud platform consolidation (Feedzai vs internal ML vs SAS) | Feedzai | $8.8M | 40% |
| AML investigator workbench | NICE Actimize + internal LLM | $12M | 35% |
| Mortgage AI expansion | Ocrolus + Blend | $9M | 60% |
| Contact center transformation | Cresta + Genesys Cloud CX | $16M | 70% |
| Harvey legal rollout | Harvey | $2.2M | 80% |
| KYC automation | Hummingbird + Socure | $6.4M | 45% |
| Alternative data platform | AlphaSense + Cohere + internal | $8M | 30% |
| AI governance program | Internal + Credo AI | $4.8M | 50% |
| Data platform AI-readiness (Snowflake Cortex) | Snowflake | $11M | 58% |
| Engineering productivity (Copilot + Devin pilot + Codeium eval) | GitHub + Cognition | $3.2M | 62% |
| Shadow AI discovery | Netskope | $1.8M | 72% |

## Contradictions (6)

1. **HIGH · Cost trajectory** — M365 Copilot at $672K/mo scaling to $1.1M/mo projected. Engagement audit shows 34% of seats inactive last 30 days. $230K/mo waste projected.
2. **HIGH · Shadow AI** — Quant research analysts using consumer Claude.ai without DPA. Known to IT, not governed. MNPI exposure risk.
3. **HIGH · Vendor overlap** — Cresta (new) + Observe.AI (legacy) + Verint (seat-licensed but underused) — three agent assist stacks. $180K/mo in overlap.
4. **MEDIUM · Risk vs Data** — Hebbia research workspace indexing sensitive deal memos. DPA exists but data-residency requires US-only; Hebbia multi-region by default.
5. **MEDIUM · Value vs Adoption** — Personetics at $280K/mo with 12% deposit growth claim — but baseline cohort comparison flawed. Finance challenges attribution.
6. **MEDIUM · Governance gap** — 14 of 34 use cases never reviewed by AI governance committee. Committee formed 9 months ago, meets quarterly.

## Cost monthly: ~$6.8M ($82M/yr) — realistic for $28B regional bank with heavier regulatory investment

---

# Client 3 · Apex Retail Group

**Profile:** $18B revenue omnichannel retailer, 72,000 employees (retail-heavy), 480 stores + 12 DCs + e-commerce platform, national US footprint, Shopify Plus + Salesforce Commerce + SAP S/4.

## AI portfolio — 29 use cases

### In production (9)

| # | Name | Vendor / Product | Users | Adoption | Monthly Cost | Verified Value |
|---|---|---|---|---|---|---|
| 1 | M365 Copilot (corporate) | **Microsoft Copilot** | 4,200 corporate seats | 44% DAU | $126K | 9% meeting savings |
| 2 | Frontline AI assistant (stores) | **Microsoft Copilot for Frontline** | 28,000 store associates | 32% WAU | $182K | Training time reduction |
| 3 | Engineering code assist | **GitHub Copilot** | 450 engineers | 79% WAU | $15K | 26% PR cycle-time reduction |
| 4 | Site personalization | **Bloomreach Engagement + Discovery** | Full e-commerce | Sitewide | $280K | 14% conversion lift verified |
| 5 | Site search | **Algolia + internal rerank** | Sitewide | 620M queries/mo | $88K | — |
| 6 | On-site A/B testing | **Dynamic Yield** | Digital product team | 12 concurrent | $72K | — |
| 7 | Fraud detection (e-commerce) | **Signifyd** | All online transactions | Real-time | $240K | 38% fraud loss reduction |
| 8 | Call center copilot | **Cresta** | 1,400 agents | Full | $88K | AHT -38 sec |
| 9 | Demand forecasting | **o9 Solutions** | Planning + merchandising | Full | $320K | 4pt forecast accuracy lift |

### In scaling pilot (8)

| # | Name | Vendor / Product | Stage |
|---|---|---|---|
| 10 | IT + HR service desk copilot | **Moveworks** | Pilot — 18,000 seats covered |
| 11 | Store operations copilot (frontline) | **Claude Enterprise + custom** | Pilot — 40 stores |
| 12 | Pricing optimization | **Blue Yonder + o9** | Scaling from 12 categories to 48 |
| 13 | Returns intelligence | **Optoro** | Pilot — 80 stores |
| 14 | Inventory allocation | **RELEX Solutions** | Pilot — fresh / apparel |
| 15 | Loss prevention (CV) | **Everseen** | Pilot — 60 stores |
| 16 | Supply chain visibility | **FourKites** | Pilot — inbound logistics |
| 17 | Recommender system overhaul | **Nosto + internal** | Pilot — mobile first |

### Stalled (3)

| # | Name | Vendor / Product | Why |
|---|---|---|---|
| 18 | Visual search | **Syte** | ROI below threshold in pilot |
| 19 | Chat-based shopping agent | **Shopify Magic** | Quality concerns in tests |
| 20 | Associate scheduling optimization | **Reflexis (Zebra)** | Change management — union negotiations |

### Research / exploratory (4)

| # | Name | Vendor / Product |
|---|---|---|
| 21 | Agentic customer service | **Sierra** (in eval) |
| 22 | Product content generation | **Jasper + Anthropic** |
| 23 | Synthetic shopper data | **Yepic AI** |
| 24 | Marketing mix modeling | **Analytic Partners + Claude** |

### Shadow AI (5)

| # | What | Vendor |
|---|---|---|
| 25 | Merchants using consumer ChatGPT for product descriptions | OpenAI |
| 26 | Marketing design using Midjourney at scale | Midjourney |
| 27 | Buyers using AlphaSense trial unlicensed | AlphaSense |
| 28 | Content writers using Jasper on personal accounts | Jasper |
| 29 | Supply chain analysts using Claude.ai consumer | Anthropic consumer |

## Active AI projects — 11

| Project | Vendor | Budget | Phase % |
|---|---|---|---|
| Personalization platform consolidation | Bloomreach + Dynamic Yield | $7M | 45% |
| Pricing AI expansion | Blue Yonder + o9 | $9.2M | 58% |
| Store operations AI | Claude Enterprise | $5.4M | 30% |
| Moveworks deployment | Moveworks | $3.8M | 60% |
| Supply chain digital twin | o9 + internal | $14M | 35% |
| Returns intelligence rollout | Optoro | $2.6M | 55% |
| Loss prevention expansion | Everseen | $4.4M | 40% |
| Marketing AI stack (content + campaign) | Jasper + Anthropic + Persado | $3.2M | 25% |
| Demand forecasting accuracy program | o9 + internal | $6M | 72% |
| Agentic customer service (Sierra eval) | Sierra | $1.2M | 20% |
| Frontline Copilot scale | Microsoft | $8.4M | 65% |

## Contradictions (5)

1. **HIGH · Cost vs Adoption** — Frontline Copilot at $182K/mo, 32% WAU. 68% of 28,000 seats effectively inactive. Considering scale-down vs retrain effort.
2. **HIGH · Vendor overlap** — Bloomreach + Dynamic Yield + Nosto all running personalization. Three platforms, unclear attribution. $430K/mo combined.
3. **MEDIUM · Shadow AI** — Marketing's Midjourney usage is ~$8K/mo at enterprise scale, no brand compliance review.
4. **MEDIUM · Risk vs Data** — Signifyd receives transaction data including customer PII. DPA exists, subprocessor refresh 14 months overdue.
5. **MEDIUM · Governance gap** — Store-level AI tools (copilot, scheduling, CV) adopted via line-of-business budget, not in central AI inventory.

## Cost monthly: ~$4.2M ($50M/yr) — realistic for $18B retailer

---

# Seed execution

### Files to update

```
src/scripts/seed/meridian-enterprise.ts    — full payload from Section 1
src/scripts/seed/firstcapital-enterprise.ts — full payload from Section 2
src/scripts/seed/apex-enterprise.ts        — full payload from Section 3
src/scripts/seed/_shared/vendor-whitelist.ts — expand to include all named products above
```

### Vendor whitelist expansion

Add to `vendor-whitelist.ts`:

```typescript
export const ALLOWED_AI_VENDORS = [
  // Foundation model providers
  'Anthropic', 'OpenAI', 'Microsoft', 'Google', 'Meta', 'Mistral', 'Cohere',

  // Healthcare AI
  'Abridge', 'Nuance DAX', 'Nabla', 'Cohere Health', 'Aidoc', 'Paige.AI',
  'HeartFlow', 'Epic', 'Tempus Next', 'Flywheel.io', 'Hyro', '3M 360 Encompass',
  'First Databank', 'Jeenie', 'Paradox AI', 'Docebo', 'Recursion', 'Komodo Health',
  'NVIDIA Clara', 'Syntegra', 'LeanTaaS iQueue',

  // FinServ AI
  'Hebbia', 'Harvey', 'Kensho', 'Feedzai', 'NICE Actimize', 'Cresta',
  'Personetics', 'Ocrolus', 'Blend', 'Hummingbird', 'Socure', 'Kasisto',
  'Behavox', 'Quavo', 'TrueAccord', 'Zest AI', 'Saifr', 'Observe.AI',
  'AlphaSense', 'Mostly AI', 'ComplyAdvantage', 'Plaid', 'Credo AI',

  // Retail AI
  'Bloomreach', 'Algolia', 'Dynamic Yield', 'Nosto', 'Constructor.io',
  'Signifyd', 'Forter', 'o9 Solutions', 'Blue Yonder', 'RELEX Solutions',
  'Everseen', 'FourKites', 'Optoro', 'Reflexis', 'Syte', 'Shopify Magic',
  'Sierra', 'Yepic AI', 'Analytic Partners', 'Persado', 'Jasper',

  // Horizontal AI
  'Microsoft Copilot', 'GitHub Copilot', 'Claude Enterprise', 'Moveworks',
  'Glean', 'Watershed', 'Notion AI', 'Codeium', 'Cursor', 'Cognition',
  'Doximity', 'Open Evidence', 'Consensus', 'Midjourney', 'Eightfold',

  // Infra / Platform
  'Snowflake', 'Databricks', 'dbt', 'Informatica', 'AWS', 'Azure', 'GCP',
  'Oracle', 'Workday', 'SAP', 'Salesforce', 'ServiceNow', 'Genesys',
  'Zscaler', 'Netskope', 'Datadog', 'Bloomberg'
];
```

Guard is permissive for vendors (they exist; naming them is authentic), strict only for forbidden consulting firms + historic demo names.

### Run

```bash
npm run seed:enterprise -- --clients meridian,firstcapital,apex --refresh
```

Idempotent upsert on natural keys. Existing rows update, new rows insert. Demo data flag set on all rows.

---

## Paste-to-Claude-Code

> "Pack J · Realistic AI Portfolio Seed Data. Expand vendor whitelist and load the full named-vendor portfolios for Meridian, First Capital, Apex per the three client sections. Healthcare uses Abridge + Nuance DAX + Cohere Health + Aidoc + Paige.AI + Moveworks + Glean + Microsoft/GitHub Copilot + Claude Enterprise. FinServ uses Hebbia + Harvey + Feedzai + NICE Actimize + Cresta + Personetics + Moveworks + M365 Copilot. Retail uses Bloomreach + o9 Solutions + Blue Yonder + Signifyd + Cresta + Moveworks + Claude Enterprise. Naming rules: vendor products are ALLOWED and encouraged; only consulting firms and historic-real-client names are forbidden. Seed scripts idempotent upsert; every row marked `is_demo_data: true`. Run `npm run seed:enterprise --refresh` after migration. Report after ship."

---

## What this pack ships

The three composite clients stop looking like generic enterprises and start looking like the actual portfolios a senior practitioner would recognize: Abridge + DAX regional split, Cohere Health for prior auth expanding specialty-by-specialty, Harvey deployed in legal, Feedzai in fraud, Bloomreach + Dynamic Yield overlap, M365 Copilot with inactive-seat waste, shadow ChatGPT in cardiology. Specific. Real. Demo-credible to anyone who lives this world.
