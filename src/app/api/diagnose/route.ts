import Anthropic from "@anthropic-ai/sdk";
import { meridianHealth, meridianFinancials, meridianTechnology, meridianClinical, meridianLeadership } from "@/data/meridian/index";
import { firstCapital } from "@/data/firstcapital/index";
import { apexRetail } from "@/data/apexretail/index";
import { arcturusFinancial } from "@/data/arcturus/index";
import { finservBenchmarks } from "@/data/knowledge/finserv";
import { retailBenchmarks } from "@/data/knowledge/retail";
import { crossIndustryKnowledge } from "@/data/knowledge/crossIndustry";

function getMeridianContext() {
  return `
CURRENT CLIENT: MERIDIAN HEALTH SYSTEM
Industry: Healthcare | Type: Integrated Delivery Network

ORGANIZATION:
- 23 hospitals across NC, SC, VA, TN
- 42,000 employees | $11.2B revenue
- Post-merger with Blue Ridge Health Network 2022 — integration incomplete
- Operating margin: ${meridianHealth.org.operatingMargin}% vs ${meridianHealth.financials.targetOperatingMargin}% board target

FINANCIAL DETAIL:
- RCM denial rate: ${meridianHealth.technology.rcm.denialRate}% vs 11.4% benchmark — $${meridianHealth.technology.rcm.denialWriteOff2023}M written off FY2023 (total economic impact $127M including rework labor and aged appeals)
- Denial rate trajectory: 14.2% (2021) → 16.8% (2022) → 18.2% (2023) — worsening despite Ensemble contract
- Net collection rate: reported 94.2% (internal methodology) vs actual 87.1% (HFMA standard) — $31M gap
- Days in AR: 52 vs 42 benchmark
- IT budget: $${meridianHealth.financials.itBudget2024}M — only $${meridianHealth.financials.itBudgetBreakdown.projectsAndTransformation}M for transformation vs $200M needed
- Consulting spend: $67M (2023), up from $44M (2021) — increasing while outcomes worsen
- MA star rating: ${meridianHealth.healthPlan.medicareAdvantage.starRating} — $34M quality bonus at risk below 4.0 stars
- Travel nurse cost: $148M (verified including $6M shadow agency spend) — 756 active travel nurses

TECHNOLOGY:
- Epic EHR: real optimization score ~44-47/100 (board materials say 71 — self-assessed in 2022, not updated)
  - 34% of clinical documentation happening outside Epic in workarounds
  - 12 of 47 Cogito dashboards live — implementation team disbanded
  - Healthy Planet (population health module) purchased, never implemented — $2.4M stranded
  - Cheers (CRM) purchased, never implemented — overlap with Salesforce Health Cloud
- MyChart: ${meridianTechnology.ehr.modules[2].adoption}% adoption vs 60% target — 847 one-star app store reviews
- Prior auth: 23% of payers connected — CMS rule requires 100% by January 2026 — deadline missed
- Blue Ridge Cerner migration: 2 hospitals (Blue Ridge East, Blue Ridge Valley) — 22 MONTHS overdue (was June 2023; now projected Q2 2026)
  - 22,847 patient records failed reconciliation — 14,447 with duplicate MRNs still unresolved — CLINICAL RISK
  - Stranded cost: $380K/month × 22 months = $8.4M wasted
  - Oracle Health invoice dispute ($1.8M) blocking go-live support
  - Migration delay also blocks: decommission of Roanoke data center ($2.8M/yr savings), 3 Blue Ridge scheduling AI sites, MyChart for 84,000 Blue Ridge patients
- Ensemble RCM: prior auth SLA 1.8 days (SLA) vs 4.2 days (actual per Epic data, not Ensemble's dashboard) — $2.1M SLA credit available, unclaimed
- Azure Synapse: 40% implemented — implementation team disbanded — 340 VMs running at <20% utilization ($1.8M waste)
- Technical debt: $48M annual cost — breakdown: Cerner dual-operation ($8.4M), Teradata legacy EDW ($6.2M), Oracle 11g ($4.8M), undocumented integrations ($9.6M), shadow IT ($7.2M), Azure waste ($1.8M), Roanoke DC ($2.8M), Epic optimization gap ($8.2M)

AI PROGRAM STATUS:
- Sepsis AI: Live at 5 hospitals (avg 82% alert acknowledgment, 28% mortality reduction), FAILING at 3 hospitals:
  * Blue Ridge East: 34% ack rate — nursing workflow integration not completed
  * Piedmont Regional: 31% ack rate — 6 new hospitalists in 8 months, no AI onboarding
  * Carolina Coast: 26% ack rate — physician resistance, low sepsis volume (1.2 cases/1,000 vs 4.8 average) → consider deprioritizing
  * Not deployed at 13 hospitals (9 on Cerner, 4 insufficient Epic data)
- Coding AI: AHEAD of committed — $17.2M run rate vs $16M committed. Why outperforming: Medicare/Medicaid claims have more standardized codes (96% automation), physicians restructured notes when they realized AI was reading them, 395 new DRG codes from Oct 2025 CMS update automated at 91% vs 64% industry average
- Denial Prevention AI: 4 months live, 18.2% → 16.1% denial rate — on track; watch: Q2 payer contract change with Blue Shield NC may reclassify 1,800 auth codes
- Staff Scheduling AI: 2 months live, Kronos integrated at 14 hospitals; 3 Blue Ridge paper-scheduling facilities excluded
- Clinical Documentation AI: 10-month pilot at Carolinas East ED with 94% physician satisfaction — $42M enterprise opportunity — stuck for lack of $4M budget approval from CFO; CMO does not have budget authority

LEADERSHIP DETAIL:
- CIO Marcus Webb (8 months): "I inherited a portfolio I did not fully understand until six weeks in. The real Epic score is 45, not 71. The CDO vacancy is killing us."
- CFO Robert Chen: "The $94M denial write-off keeps me up at night. I'm trying to renegotiate with Ensemble rather than trigger the $2.1M SLA penalty clause — but that's been my mistake."
- COO James Whitfield (11 years): "I'm spending $142M a year on travel nurses. What I need is predictive scheduling that works before I deploy it to 23 hospitals."
- CMIO Dr. Sarah Okonkwo: "We bought a Ferrari and use it as a golf cart. Epic isn't the problem. We called go-live done and never funded optimization."
- CNO Linda Reyes: "We keep losing nursing recruits to systems paying $6-8/hour more. The float pool is 180 nurses short."
- VP Revenue Cycle Diane Kowalski: "Ensemble reports 3.1-day prior auth avg. Our Epic data shows 4.2 days. The SLA is 1.8 days. That $2.1M credit is in dispute — CFO asked me to hold off."
- CDO: VACANT — 15 months since role approval, 2 finalists declined, 3rd search underway

CONTRADICTIONS (verified):
${meridianHealth.contradictions.map((c, i) => `${i + 1}. ${c}`).join("\n")}
7. Epic score: board materials say 71/100 — CIO's own assessment: 44-47/100 (24-27 point overstatement)
8. Denial write-off reported as $94M — total economic impact $127M including $33M in rework and secondary write-offs
9. Net collection rate reported as 94.2% — HFMA-standard calculation: 87.1% — $31M gap
10. COO says sepsis AI scaling "18 months minimum" — CMIO says technical deployment is 4-6 months; constraint is physician adoption program
11. Blue Ridge Cerner migration was "8 months overdue" — now 22 months overdue; projected date has slipped 3 times
12. Coding AI outperforming: board does not know the model retrain risk in Q3 2026 or the union discussion required in NC for 28-FTE reduction

INDUSTRY BENCHMARKS (Healthcare):
- RCM denial: Top quartile 8.2% | Median 11.4% | Bottom quartile 16.8%
- Operating margin: Top quartile 5.2% | Median 3.1%
- Epic optimization: Top quartile 88 | Median 72 (Meridian real score: 44-47)
- Nurse turnover: Top quartile 12% | Median 18%
- MA star bonus threshold: 4.0 stars — each 0.5-star improvement = $17-34M quality bonus
- Travel nurse benchmark: 8-12% of total nurse FTE (Meridian: 756 travelers, ~30% of bedside FTE)

VENDOR INTELLIGENCE:
- Ensemble: KLAS 3.2/5 — declining — $2.1M SLA credit available. Prior auth SLA breach documented in Epic data but disputed
- Waystar: KLAS 4.1 — AI-native RCM — strong prior auth automation — shortlisted for prior auth RFP
- Nuance DAX Copilot: Clinical documentation AI — validates the internal pilot's 94% satisfaction data
- Oracle Health: Raising Cerner fees 22% — $1.8M invoice dispute in legal — go-live support withheld
- Huron Consulting: Strongest Epic optimization track record

ACTIVE FAILURE PATTERNS:
- F001 Vendor Dependency: Ensemble RCM $48M/year — SLA missed, penalties not enforced, methodology dispute
- F003 Budget Mismatch: 4% margin target — only $84M transformation budget vs $200M required
- F005 Leadership Vacancy: CDO vacant 15 months — blocks data platform, AI governance, Azure Synapse decisions
- F006 Pilot Purgatory: Clinical Documentation AI at 94% satisfaction for 10 months — $42M unrealized
`;
}

function getFirstCapitalContext() {
  return `
CURRENT CLIENT: FIRST CAPITAL FINANCIAL
Industry: Financial Services | Type: Regional Bank

ORGANIZATION:
- $18B assets | 4,200 employees | 84 branches
- Mid-Atlantic market: MD, VA, DC, PA, DE
- Cost-to-income: ${firstCapital.financials.costToIncomeRatio}% vs ${firstCapital.financials.targetCostToIncomeRatio}% target

FINANCIAL:
- Total assets: $${firstCapital.org.assets}B
- Cost-to-income: ${firstCapital.financials.costToIncomeRatio}% vs 55% target | Benchmark: 61%
- Return on assets: ${firstCapital.financials.returnOnAssets}% vs 1.1% benchmark
- Fraud losses: $${firstCapital.financials.fraudLosses2023}M vs $${firstCapital.financials.benchmarkFraudLosses}M benchmark
- IT budget: $${firstCapital.financials.itBudget}M — ${firstCapital.financials.complianceCostAsPercentIT}% consumed by compliance
- Annual fraud excess: $${firstCapital.financials.annualFraudExcess}M above benchmark

TECHNOLOGY:
- Core banking: FIS HORIZON ${firstCapital.technology.coreBanking.version} — ${firstCapital.technology.coreBanking.age} years old — 87% peak capacity
- FedNow: NOT LIVE — ${firstCapital.technology.payments.peerBanksOnFedNow}% of peers live — $${firstCapital.technology.payments.commercialDepositRisk}M commercial deposit risk
- Digital banking: Q2 Platform — showing T+1 balances — 24-hour stale data
- Mobile app rating: ${firstCapital.technology.digital.mobileAppRating}/5 vs 3.8 competitive threshold
- Digital adoption: ${firstCapital.technology.digital.digitalAdoptionRate}% vs 67% benchmark
- Account opening abandonment: ${firstCapital.technology.digital.accountOpeningAbandonmentRate}% vs 32% benchmark
- AML: NICE Actimize — ${firstCapital.technology.aml.automationRate}% automation vs ${firstCapital.technology.aml.benchmarkAutomationRate}% benchmark — 78% false positive rate
- SQL Server 2017: data warehouse — end of support October 2025
- Cloud adoption: 28% vs 48% peer median

LEADERSHIP:
- CTO James Okafor (18 months): "We have 14 years of technical debt and 2 years to fix it."
- CFO Robert Martinez: "I am not writing a $180M check at 68% cost-to-income."
- COO Sandra Williams: "Every system implemented took twice as long and cost twice as much."
- CMO David Park: "1.8M digital customers seeing yesterday's balances — that is not digital banking."

CONTRADICTIONS:
${firstCapital.contradictions.map((c, i) => `${i + 1}. ${c}`).join("\n")}

INDUSTRY BENCHMARKS (Financial Services):
- Cost-to-income: Top quartile 52% | Median 61% | Bottom quartile 70%
- Digital adoption: Top quartile 78% | Median 67%
- Core banking age: Modern <5 yrs | Aging 12+ | Legacy 20+ | Critical 25+
- AML automation: Top quartile 82% | Median 72%
- Return on assets: Top quartile 1.4% | Median 1.1%

REGULATORY ALERTS:
- FedNow: Active urgency — 68% of peers live — commercial clients leaving now
- SQL Server 2017: End of support October 2025 — 6 months away
- CFPB Section 1033: 2026 — API layer required — FIS HORIZON cannot support natively
- OCC MRAs: 3 active from March 2023 exam — MFA gaps, vendor risk, BCP

VENDOR INTELLIGENCE:
- FIS HORIZON: Raising fees 18% in 2025 — last major feature release 2018
- Temenos: Best cloud-native replacement for $18B bank — $25-80M implementation
- Thought Machine: Highest upside, highest risk — best for digital-first strategy
- NICE Actimize: 2 major versions behind — missing ML detection models
`;
}

function getApexRetailContext() {
  return `
CURRENT CLIENT: APEX RETAIL GROUP
Industry: Retail | Type: Omnichannel Retailer

ORGANIZATION:
- 800 stores across 42 states | 28,000 employees
- $${apexRetail.org.revenue}B revenue | Operating margin: ${apexRetail.org.operatingMargin}% vs ${apexRetail.org.targetOperatingMargin}% target
- Headquarters: Columbus OH | Categories: Apparel, Home, Electronics, Beauty, Sports

FINANCIAL:
- Revenue: $${apexRetail.financials.revenue2023}B (FY2023) | $${apexRetail.financials.revenue2022}B (FY2022)
- Operating margin: ${apexRetail.financials.operatingMargin2023}% vs ${apexRetail.financials.targetOperatingMargin}% target | Benchmark: 5.8%
- Gross margin: ${apexRetail.financials.grossMargin2023}% vs 38.4% benchmark — $496M gap
- Inventory turnover: ${apexRetail.financials.inventoryTurnover}x vs 6.8x benchmark — $180M excess inventory
- Shrinkage: ${apexRetail.financials.shrinkageRate}% — $347M annual loss vs 1.4% benchmark
- Digital revenue: ${apexRetail.org.ecommercePercent}% of total vs 38% benchmark — $1.24B Amazon risk
- Loyalty active: ${apexRetail.financials.loyaltyMemberPercent}% of 18M members vs 68% benchmark — $1.24B opportunity
- IT budget: $${apexRetail.financials.itBudget}M — ${apexRetail.financials.itBudgetAsPercentRevenue}% of revenue vs 3.1% benchmark

TECHNOLOGY:
- SAP ECC 6.0: ${apexRetail.technology.erp.age} years old — ${apexRetail.technology.erp.customizations.toLocaleString()} customizations — support ending 2027
- Salesforce Commerce Cloud: ${apexRetail.technology.commercePlatform.ecommerce.pageLoadTime}s page load vs 2.0 benchmark — costs $48M per second
- Cart abandonment: ${apexRetail.technology.commercePlatform.ecommerce.cartAbandonmentRate}% vs ${apexRetail.technology.commercePlatform.ecommerce.benchmarkCartAbandonmentRate}% benchmark — $840M recovery opportunity
- o9 Demand Planning: 40% implemented — forecast accuracy ${apexRetail.technology.supplyChain.demandPlanning.forecastAccuracy.current}% vs ${apexRetail.technology.supplyChain.demandPlanning.forecastAccuracy.benchmarkAccuracy}% benchmark
- IBM Sterling OMS: 3 versions behind — overselling events 3x per month
- Inventory accuracy: ${apexRetail.operations.supplyChain.inventoryAccuracy}% vs 98% benchmark — omnichannel impossible
- CDP (Segment): 50% profile fragmentation — same customer counted 2.8 times
- Loyalty (Punchh): 28% redemption vs 52% benchmark — not connected to ecommerce checkout
- Databricks: recently deployed — only 3 models in production
- Personalization: NONE deployed — $248M revenue opportunity identified

LEADERSHIP:
- CEO Margaret Chen: "We have 800 stores and a website that does not talk to them. That is not omnichannel."
- CTO James Okafor: "14 years of technical debt and 2 years to fix it before SAP pulls support."
- CFO Robert Martinez: "I am not writing a $180M check for SAP S4 HANA at 3.8% margin."
- COO Sandra Williams: "Every system implemented took twice as long and cost twice as much."
- CMO David Park: "18 million loyalty members and we market to them like strangers."
- CSCO Lisa Thompson: "48% China sourcing is a strategic risk — same exposure as 2020-2022."

CONTRADICTIONS:
${apexRetail.contradictions.map((c, i) => `${i + 1}. ${c}`).join("\n")}

AI OPPORTUNITIES:
- Demand forecasting: $180M savings | 9 months | 8x ROI
- Personalization engine: $248M revenue | 6 months | 12x ROI
- Dynamic pricing: $124M revenue | 12 months | 9x ROI
- Loss prevention AI: $84M savings | 6 months | 14x ROI
- Store labor optimization: $48M savings | 9 months | 8x ROI
- Supply chain route optimization: $96M savings | 12 months | 10x ROI

INDUSTRY BENCHMARKS (Retail):
- Operating margin: Top quartile 8.2% | Median 5.8%
- Gross margin: Top quartile 42% | Median 36%
- Inventory turnover: Top quartile 8.4x | Median 6.2x
- Digital revenue: Top quartile 52% | Median 38%
- Loyalty active rate: Top quartile 72% | Median 58%
- Forecast accuracy: Top quartile 88% | Median 78%

REGULATORY ALERTS:
- SAP ECC support: Ending 2027 — board decision needed by Q3 2024 — missed
- UFLPA enforcement: 48% China sourcing — 12 suppliers in high-risk regions — CBP seizure risk
- CCPA expansion: CDP fragmentation means cannot honor opt-out requests accurately
- Minimum wage: 14 states increasing through 2026 — $48M annual labor cost increase

VENDOR INTELLIGENCE:
- SAP S4 HANA: $80-200M implementation | 36-48 months | 67% go over budget
- Microsoft Dynamics 365: $20-60M | 18-30 months | fastest growing retail ERP
- Dynamic Yield: Best personalization ROI — 6 month payback — should evaluate first
- Salesforce Einstein: Already owned in SFCC — activate before buying new vendor
- Manhattan Associates OMS: Market leader — significant upgrade from IBM Sterling
- Publicis Sapient: Best retail digital SI
`;
}

function getArcturusContext() {
  const a = arcturusFinancial;
  return `
CURRENT CLIENT: ARCTURUS FINANCIAL GROUP
Industry: Asset Management | Type: Global Asset Manager
AUM: $${a.org.aum}B | Revenue: $${a.org.revenue}B | Employees: ${a.org.employees.toLocaleString()}

FINANCIAL DETAIL:
- Cost-to-income ratio: 71% vs 61% peer median — $840M efficiency gap
- CIR trajectory: 66% (2021) → 67% (2022) → 69% (2023) → 71% (2024) — worsening every year. At current trajectory: 73% by 2026 without structural intervention.
- The stated target of 58% requires $840M in cost reduction — no credible programme exists
- AUM growth: 3.1% (2024) vs 6.8% peer median — $30B implied AUM underperformance vs peer trajectory
- Client retention: 96.1% (2024), declining 4 consecutive years (97.2%→96.8%→96.4%→96.1%) — at current AUM: $32.8B annual outflow from departing clients
- IT budget: $680M (2024) — 4.2% of revenue vs 3.1% peer benchmark — $178M above peers — grew 12% in 2024 while revenue grew 2.5%
- AI spend: $94M committed — $0 documented ROI — $0 initiatives with baselines
- Shadow IT: $18M estimated ungoverned SaaS across business units

TECHNOLOGY:
- Bloomberg AIM (OMS): 28 years old — 3 FAILED modernisations — combined sunk cost $22.2M
  * Phase 1 (2016): $4.2M — failed because 847 custom Bloomberg formula dependencies discovered at month 14
  * Phase 2 (2019): $6.8M — failed because Bloomberg rate-limited API at 500 calls/hour vs 50,000 needed; unofficial scraping layer threatened license termination
  * Phase 3 (2022-23 — "Project Aurora"): $11.2M — failed because 3 trading desks had undocumented Bloomberg AIM configurations. Day 1 of UAT: 23 unmatched positions. KEY FACT: Current Head of Technology Michael Santos was the Accenture partner who led Project Aurora before being hired to fix what he built.
  * Phase 4 (current): $22M approved — not yet started — requires Bloomberg cooperation that depends on CDO hire
  * Bloomberg contract auto-renews December 2026 — this is the only negotiation window for API terms
- Salesforce FSC: 44% adoption after 18 months (target: 85%, privately reset to 70% in Nov 2025 without informing board)
  * Adoption trajectory: 12% (go-live Aug 2024) → 28% (Nov 2024) → 38% (Feb 2025) → 41% (May 2025, after incentive program) → 42% (Aug 2025) → 44% (Feb 2026) — essentially flat for 3 quarters
  * Root cause: Bloomberg shows real-time positions, FSC shows 72-hour lag. 78% of non-adopters cite this as primary reason. SSO integration (the fix) is 6 months away.
  * Einstein AI: licensed but NOT activated — CRO freeze applies
  * $38M invested, NPS 31 vs 58 industry median
- 14 siloed systems — no golden record — 3-day reporting lag blocks every real-time AI use case
- BlackRock Aladdin: stress testing monthly vs SEC daily requirement — direct compliance gap
- 180ms Bloomberg AIM to Azure latency — blocks real-time AI inference (requires <50ms)

AI PORTFOLIO (28 initiatives — the architecture of failure):
- 3 LIVE (all underperforming or limited scope):
  * Client Churn Prediction: 61% accuracy vs 78% design (44% FSC adoption = 56% of signals missing)
  * Trade Surveillance AI: EMEA only — 60% of trading volume excluded; US desk FIX format incompatible
  * ESG Screening Rules Engine: legacy rules-based, not ML — 3 institutional clients want dynamic scoring it cannot deliver
- 14 STALLED — blocked by 4 root causes:
  * CDO vacancy blocks (5 initiatives): Intelligent Portfolio Construction ($18.4M), Alternative Data Platform ($6.2M), Client Onboarding AI ($3.2M), Performance Attribution Explainer ($1.9M), Automated ESG Scoring ($8.6M)
  * CRO freeze blocks (4 initiatives): Regulatory Change Monitor ($7.8M), Liquidity Risk AI ($4.1M), Counterparty Credit AI ($3.6M), Market Regime Detection ($2.8M)
  * Salesforce FSC adoption gap blocks (3 more): Client Risk Profiling AI ($5.2M), Advisor Next Best Action ($4.4M), Portfolio Attribution AI ($3.4M)
  * Bloomberg data restrictions block (2): Trade Cost Analysis AI ($2.8M — missing 38% of FIX fields), Portfolio Attribution AI (Aladdin won't expose calculation API)
- 2 CANCELLED:
  * Real-Time FX Sentiment: Bloomberg data quality too poor for NLP ($1.4M written off)
  * AI-Driven Strategic Asset Allocation: $3.8M cancelled when model recommended 40% TIPS during simulated equity rally, contradicting Investment Committee guidance — CRO and CIO jointly cancelled it (most revealing cancellation: AI cannot operate without a governance framework for human-AI authority conflicts)
- 9 IN PLANNING: $0 drawn. All blocked pending CDO hire or governance framework.

REGULATORY:
- MAS FEAT: Overdue 4 months (December 2025 deadline) — zero models with FEAT-compliant documentation — MAS supervisory action "under consideration" — $2.4B Singapore AUM at risk
- SEC MRA (Model Risk Governance): Open since September 2024 (198 days) — 14 models in production with no validation documentation
- FCA Consumer Duty: 40% complete, stalled pending CDO — 2 AI recommendation models with no outcome tracking
- EU AI Act: 6 EU-deployed models may require reclassification as high-risk — no gap assessment completed
- SEC Rule 18f-4 Daily Stress Testing: Aladdin runs monthly — direct compliance gap — fix is configuration only, no migration required

LEADERSHIP DETAIL:
- CEO Victoria Hargreaves (3 years, former BlackRock COO): "We have the capital. We have the mandate. What we don't have is a data foundation that lets AI actually work."
- CFO Thomas Kellner (6 years, former Deutsche Bank): "AI is not a strategy. AI with baselines and outcome tracking is a strategy. We don't have the second thing." — will not approve new AI spend without ROI baselines
- CIO Raj Malhotra (8 months, former JPMorgan Markets AI): "I inherited a portfolio of experiments, not a programme. Governance first, then acceleration." — inherited 28 ungoverned initiatives with zero baselines
- CRO Sarah Chen (4 years, former Federal Reserve Model Risk): "I've stopped approving new AI deployments. The regulatory exposure from ungoverned models is not acceptable." — active freeze on all new AI deployments
- CDO: VACANT 11 months — 3 search firms engaged — 3rd CDO search round underway April 2026
- Head of Technology Michael Santos (2 years): Was Accenture partner who led Project Aurora (failed Bloomberg modernisation Phase 3) before being hired by Arcturus

CONTRADICTIONS:
${a.contradictions.map((c, i) => `${i + 1}. CLAIM: "${c.claim}" — REALITY: ${c.reality} [${c.source}]`).join("\n")}

ACTIVE FAILURE PATTERNS:
- F001 Vendor Dependency: Bloomberg AIM — 3 failed migrations, $22.2M sunk — auto-renew Dec 2026 is only leverage window
- F002 Pilot Purgatory: 14 of 28 AI initiatives stalled — all independently blocked by 1 of 4 root causes
- F004 Measurement Vacuum: $94M AI spend — $0 ROI tracked — CRO and board pressure building simultaneously
- F009 Governance Without Accountability: CDO vacant 11 months — CRO freeze in place — circular dependency

INDUSTRY BENCHMARKS (Asset Management):
- Cost-to-income: Top quartile 55% | Median 61% | Bottom quartile 70% (Arcturus: 71%, worsening)
- AUM growth: Top quartile 9.4% | Median 6.8% (Arcturus: 3.1%)
- Digital portal adoption: Top quartile 82% | Median 78% (Arcturus: 44%)
- AI maturity: Top quartile 72 | Median 54 (Arcturus: 28/100)
- IT budget as % revenue: Top quartile 2.8% | Median 3.1% (Arcturus: 4.2%)
- Client retention: Top quartile 98.4% | Median 97.2% (Arcturus: 96.1%, declining)
`;
}

export async function POST(request: Request) {
  const body = await request.json();
  const { messages, role } = body;
  // Accept both `clientId` (page sends this) and `client` (legacy) for the client identifier
  const clientId: string = body.clientId || body.client || 'meridian';

  if (!process.env.ANTHROPIC_API_KEY) {
    const fallbacks: Record<string, string> = {
      meridian: `The travel nurse dependency at Meridian is one of the clearest financial levers I can see. You're at $142M annually versus a benchmark of $68M — that's $74M in excess cost, and it's almost entirely structural.\n\nThe root cause isn't nurse availability. It's the 28% turnover rate on permanent staff, which creates the dependency on travel nurses in the first place. Marcus Webb flagged this in his first 90 days — "we are treating symptoms, not causes."\n\nThe fastest path: workforce analytics to identify which units have the highest turnover and why. Epic has the data — it's just not connected to your HR system yet.\n\nWhat specific units are driving the highest travel nurse spend? OR and ICU tend to be the most expensive — is that where the pressure is?`,
      firstcapital: `The cost-to-income ratio at 68% is the number the board watches most closely — and right now it's moving the wrong direction.\n\nThe fastest lever isn't cost cutting. It's the AML false positive rate at 78%. You have 6 FTE analysts reviewing transactions that AI should auto-clear. That's approximately $1.8M in direct labor, but the bigger cost is what they're not doing.\n\nNICE Actimize is 2 major versions behind — the ML detection models in 8.2 and 8.3 are specifically designed to reduce false positives. Before any new hire or system purchase, an Actimize upgrade is the right first step.\n\nIs the OCC MRA on the AML system the main pressure to fix this, or is it more the operational cost?`,
      apexretail: `The $248M Einstein opportunity is the most striking finding in your data — 14 months of paid licenses with zero activation. The fee is $1.1M annually. The revenue opportunity is $248M. That ratio doesn't happen often.\n\nThe blocker isn't technical — it's the Segment CDP fragmentation. You have 18M loyalty members counted 2.8 times on average. If Einstein activates against fragmented profiles, it personalizes to ghost customers. The fix takes 2 weeks and costs nothing.\n\nSo the sequence is: fix Segment identity resolution first, then activate Einstein. Six weeks to first revenue at $800K total cost.\n\nWhat's the internal resistance — is it the Salesforce PS engagement cost, or is it that no one owns the Einstein activation?`,
      arcturus: `The number that should worry everyone is $94M in AI spend with zero documented baselines. Not a single one of the 28 initiatives has a measurable starting point — so there's no way to prove ROI, no way to satisfy MAS FEAT, and no way to defend the budget.\n\nThe CRO has already started blocking new AI deployments. That's the pressure point. The CDO vacancy — 11 months now — means no one is resolving it.\n\nThe fastest path forward: pick the two or three AI initiatives with the clearest potential for compliance documentation and build baselines from existing data. That unblocks the CRO and gives the board something concrete.\n\nWhat's the CFO's current read — is the AI spend freeze coming, or is it already in effect?`,
    }
    const fallback = fallbacks[clientId] || fallbacks.meridian
    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(fallback))
        controller.close()
      }
    })
    return new Response(readable, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  let orgContext = getMeridianContext();
  let clientName = "Meridian Health System";

  if (clientId === 'firstcapital') {
    orgContext = getFirstCapitalContext();
    clientName = "First Capital Financial";
  } else if (clientId === 'apexretail') {
    orgContext = getApexRetailContext();
    clientName = "Apex Retail Group";
  } else if (clientId === 'arcturus') {
    orgContext = getArcturusContext();
    clientName = "Arcturus Financial Group";
  }

  const crossIndustryContext = `
TRANSFORMATION SUCCESS PATTERNS:
${crossIndustryKnowledge.transformationPatterns.successPatterns.map(p => `- ${p.name}: ${p.description} (${p.successRate}% success rate)`).join("\n")}

TRANSFORMATION FAILURE PATTERNS:
${crossIndustryKnowledge.transformationPatterns.failurePatterns.map(p => `- ${p.name}: ${p.description}`).join("\n")}

NEGOTIATION PRINCIPLES:
- Software list price is always 30-50% negotiable
- SI contracts: demand senior staff named, milestone-based payments, 90-day out clause
- Outcomes-based components should be 15-25% of total fees
`;

  const systemPrompt = `You are AbarVa — an elite enterprise transformation advisor embedded with ${clientName}. You know this organization deeply.

CRITICAL: You are ONLY talking about ${clientName}. Never reference other clients or industries.

THE USER'S ROLE: ${role || 'CIO'}

CONVERSATION STYLE — THIS IS CRITICAL:
- Be conversational, not reportorial. You are a trusted advisor in a meeting, not a consulting deliverable.
- Keep the narrative portion SHORT — maximum 120 words before the choices block.
- Surface 2-3 specific facts. Make the numbers hit hard. Then immediately offer choices.
- Never use headers like **RECOGNITION** or **BENCHMARK** — just talk naturally.
- Never dump everything at once. Reveal intelligence progressively as the conversation deepens.
- Reference specific people by name, specific vendors, specific dollar amounts.

CHOICE-DRIVEN INVESTIGATION — MANDATORY FROM YOUR SECOND RESPONSE ONWARD:
Every response after the first MUST end with this exact block — no exceptions:

[CHOICES]
A) [Specific investigation path using a real metric or system from ${clientName}]
B) [Different angle — different data dimension, stakeholder, or risk category]
C) [Highest-leverage untouched area — the one thing that unlocks the most value]

Rules for choices:
- Each choice must reference a real number, person, or system from ${clientName}'s actual data
- Choices must open meaningfully different threads — not variations of the same question
- Never repeat a choice the user has already selected
- Make choices feel like genuine decisions a ${role || 'CIO'} would face — urgent and specific
- Format must be EXACT: [CHOICES] on its own line, then A) B) C) each on their own line

EXAMPLE OF RIGHT RESPONSE (with choices):
"The travel nurse dependency is the clearest financial lever right now. You're at $142M annually versus a benchmark of $68M — that's $74M in excess cost, and it's structural, not cyclical. Marcus Webb flagged the root cause in his first 90 days: 28% permanent staff turnover creates the dependency. Epic has the data to fix this — it's just not connected to your HR system yet.

[CHOICES]
A) Drill into which specific units — OR, ICU, or ED — are driving the highest travel nurse spend and why
B) Quantify the Epic-HR integration gap: what does it cost to connect them and what does it unlock
C) Shift to the $48M Ensemble RCM underperformance — SLA compliance at 67% vs 95% target with $2.3M in unenforced penalties"

CRITICAL RULES:
- ONLY talk about ${clientName}
- Short narrative, then always offer choices (from response 2 onward)
- Reference real names and real numbers from the client intelligence below
- Never generic advice

CLIENT INTELLIGENCE — ${clientName}:
${orgContext}

CROSS-INDUSTRY PATTERNS:
${crossIndustryContext}`;

  let stream;
  try {
    stream = await client.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: systemPrompt,
      messages: messages,
    });
  } catch (err) {
    console.error("Diagnose stream init error:", err);
    return new Response("Error initializing AI response. Please try again.", {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(chunk.delta.text));
          }
        }
        controller.close();
      } catch (err) {
        console.error("Diagnose stream error:", err);
        controller.error(err);
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
    },
  });
}
