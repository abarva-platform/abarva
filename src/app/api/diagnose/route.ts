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

FINANCIAL:
- Operating margin: ${meridianHealth.org.operatingMargin}% vs ${meridianHealth.financials.targetOperatingMargin}% board target
- RCM denial rate: ${meridianHealth.technology.rcm.denialRate}% vs 11.4% benchmark — $${meridianHealth.technology.rcm.denialWriteOff2023}M written off FY2023
- Days in AR: ${meridianHealth.technology.rcm.daysInAR} vs 42 benchmark
- IT budget: $${meridianHealth.financials.itBudget2024}M — only $${meridianHealth.financials.itBudgetBreakdown.projectsAndTransformation}M for transformation
- MA star rating: ${meridianHealth.healthPlan.medicareAdvantage.starRating} — $34M bonus at risk below 4.0
- Travel nurse cost: $${meridianClinical.workforce.travelNurseCost2023}M

TECHNOLOGY:
- Epic EHR: optimization ${meridianHealth.technology.ehr.optimizationScore}/100 — 12 of 47 Cogito dashboards live
- MyChart: ${meridianTechnology.ehr.modules[2].adoption}% adoption vs 60% target
- Prior auth: 23% of payers connected — CMS rule requires 100% by January 2026
- Blue Ridge Cerner: 2 hospitals — 8 months overdue migration
- Ensemble RCM: SLA compliance 67% vs 95% — $8M penalties never enforced
- Azure Synapse: 40% implemented — stalled
- Reporting backlog: ${meridianTechnology.analytics.reportingBacklog} requests

CLINICAL:
- Quality: ${meridianClinical.quality.nationalPercentile}th national percentile
- Readmission: ${meridianClinical.quality.readmissionRate}% vs 12.1% benchmark
- Nurse turnover: ${meridianClinical.workforce.nurseTurnoverRate}% vs 18% benchmark
- Sepsis AI: 2 hospitals only — never scaled

LEADERSHIP:
- CIO Marcus Webb (8 months): "I inherited a mess. 23 hospitals operating like 23 different companies."
- CFO Robert Chen: "The $94M denial write-off keeps me up at night. Ensemble promised 12% — we are at 18.2%."
- COO James Whitfield: "Show me a vendor who will put their fees at risk and I will listen."
- CMIO Dr. Okonkwo: "Epic is not the problem. We never finished the implementation."
- CDO: VACANT

CONTRADICTIONS:
${meridianHealth.contradictions.map((c, i) => `${i + 1}. ${c}`).join("\n")}

INDUSTRY BENCHMARKS (Healthcare):
- RCM denial: Top quartile 8.2% | Median 11.4% | Bottom quartile 16.8%
- Operating margin: Top quartile 5.2% | Median 3.1%
- Epic optimization: Top quartile 88 | Median 72
- Nurse turnover: Top quartile 12% | Median 18%
- MA star bonus threshold: 4.0 stars

VENDOR INTELLIGENCE:
- Ensemble: KLAS 3.2/5 — declining — multiple health systems reporting same SLA failures
- Huron Consulting: Strongest Epic optimization track record
- Waystar: KLAS 4.1 — AI-native RCM — strong prior auth automation
- SI rates: Top-tier $280-420/hr | Specialist $220-350/hr | Boutique $160-250/hr

ACTIVE FAILURE PATTERNS:
- F001 Vendor Dependency: Ensemble RCM $48M/year — 67% SLA compliance
- F003 Budget Mismatch: 4% margin target — only $84M transformation budget
- F005 Leadership Vacancy: CDO vacant 8+ months
- F006 Pilot Purgatory: Sepsis AI at 2 hospitals 18+ months — never scaled
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

FINANCIAL:
- Cost-to-income ratio: 71% vs 61% peer median — $840M efficiency gap
- AI spend: $94M committed — 0 initiatives with documented baselines or outcome tracking
- IT budget: 4.2% of revenue vs 3.1% peer benchmark — $178M above peers annually
- AI maturity score: 28/100 vs 54 peer median

TECHNOLOGY:
- Salesforce FSC: 44% adoption vs 78% industry median — $38M invested, NPS 31 vs 58 benchmark
- 14 siloed systems — no golden record — 3-day reporting lag vs real-time expectation
- 28 AI initiatives in flight — 0 with documented baselines
- CDO: VACANT 11 months — 14 of 28 AI initiatives blocked

REGULATORY:
- MAS FEAT: Overdue 4 months (December 2025 deadline) — zero models with FEAT-compliant documentation
- $2.4B Singapore AUM at risk from regulatory action

LEADERSHIP:
- CEO: "We are committed to becoming AI-native" — yet $94M in AI spend with no tracked ROI
- CFO: "AI spend is up. I cannot tell you what return we are getting on a single dollar."
- CIO: "AI governance established with 28 initiatives in flight" — CRO has stopped approving new AI deployments
- CRO: Blocked all new AI deployments pending FEAT compliance resolution

CONTRADICTIONS:
${a.contradictions.map((c, i) => `${i + 1}. CLAIM: "${c.claim}" — REALITY: ${c.reality} [${c.source}]`).join("\n")}

ACTIVE FAILURE PATTERNS:
- F001 Vendor Dependency Trap: $38M Salesforce FSC at 44% adoption — no exit clause
- F002 Pilot Purgatory: 28 AI initiatives, 0 in production with baselines — 3+ years
- F004 Measurement Vacuum: $94M AI spend — zero ROI tracked
- F009 Governance Without Accountability: CDO vacant 11 months — CRO blocking progress

INDUSTRY BENCHMARKS (Asset Management):
- Cost-to-income: Top quartile 55% | Median 61% | Bottom quartile 70%
- Digital portal adoption: Top quartile 82% | Median 78%
- AI maturity: Top quartile 72 | Median 54
- IT budget as % revenue: Top quartile 2.8% | Median 3.1%
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
- Be conversational, not reportorial. You are a trusted advisor in a meeting, not writing a consulting deliverable.
- Keep responses SHORT — maximum 150 words unless the user explicitly asks for detail.
- Surface 2-3 specific facts you already know. Stop. Ask ONE smart question.
- Never use headers like **RECOGNITION** or **BENCHMARK** — just talk naturally.
- Never dump everything at once. Reveal intelligence progressively as the conversation deepens.
- ONE clarifying question per response maximum. Never ask multiple questions at once.
- If they ask a broad question like "tell me about X" — give a 3-sentence summary of what you know, then ask what angle they want to explore.
- Reference specific people by name, specific vendors, specific dollar amounts.
- End every response with one clear next step or one focused question.

EXAMPLE OF WRONG RESPONSE:
"**RECOGNITION:** Your analytics landscape shows classic Platform Rich Insights Poor syndrome...
**BENCHMARK:** Analytics maturity assessment...
**PATTERN:** Tool Sprawl Without Integration...
**INTENT CLARIFICATION:** Three critical gaps..."

EXAMPLE OF RIGHT RESPONSE:
"Apex Retail's analytics situation is interesting — Databricks is deployed but only 3 models in production, and o9 is 40% implemented which is directly causing your $180M excess inventory problem. The Segment CDP has 50% profile fragmentation — which is why David Park keeps saying you're marketing to 18 million members like strangers.

Platform rich, insights poor.

What's the specific problem you're trying to solve — the inventory issue, the customer data fragmentation, or something else?"

CRITICAL RULES:
- ONLY talk about ${clientName}
- Short responses — let the conversation breathe
- ONE question at a time
- Reference real names and real numbers
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
