'use client'
import { useState, useRef, useEffect, Suspense, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import AbarvaNav from '@/components/AbarvaNav'
import { meridianHealth } from '@/data/meridian/index'
import { firstCapital } from '@/data/firstcapital/index'
import { apexRetail } from '@/data/apexretail/index'

// ─── Theme ────────────────────────────────────────────────────────────────────

const T = {
  bg: '#060A12', surface: '#0D1520', surface2: '#162030',
  border: '#1C2D45', border2: '#2D3748',
  text: '#EFF6FF', text2: '#94A3B8', text3: '#94A3B8',
  teal: '#2DD4C8', blue: '#4DA3FF', amber: '#F59E0B',
  red: '#EF4444', green: '#10B981', purple: '#A371F7',
  mono: 'JetBrains Mono, Menlo, monospace',
  sans: 'DM Sans, Inter, system-ui, sans-serif',
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Severity = 'critical' | 'warning' | 'watch'
type RoleId = 'CIO' | 'CFO' | 'COO' | 'CMIO' | 'CEO' | 'CMO' | 'Maestro'
type ClientId = 'meridian' | 'firstcapital' | 'apexretail'

interface Issue {
  id: string; severity: Severity; title: string
  body: string; impact: string; owner: string; roles: RoleId[]
}
interface RiskItem { label: string; amount: number }
interface Action {
  n: number; horizon: 'week' | 'month' | 'quarter'
  title: string; rationale: string; owner: string
  impact: string; effort: string; risk: string
}
interface TimelineEvent { label: string; note: string; urgency: 'red' | 'amber' }

// ─── Client Data ──────────────────────────────────────────────────────────────

const ISSUES: Record<ClientId, Issue[]> = {
  meridian: [
    { id:'M01', severity:'critical', title:'RCM Denial Rate 6pp Above SLA',
      body:`Claims data shows ${meridianHealth.technology.rcm.denialRate}% denial — ${(meridianHealth.technology.rcm.denialRate - meridianHealth.technology.rcm.benchmarkDenialRate).toFixed(1)}pp above the ${meridianHealth.technology.rcm.benchmarkDenialRate}% benchmark. The gap has grown 3 consecutive quarters. Nobody flagged it to the board.`,
      impact:`$${meridianHealth.technology.rcm.denialWriteOff2023}M / yr`, owner:'CFO + Chief Revenue Officer',
      roles:['CFO','COO','CEO'] },
    { id:'M02', severity:'critical', title:'CDO Role Vacant — AI Program Stalled',
      body:`CDO vacant 8 months. ${meridianAI_pilotsPurgatory()} AI pilots frozen. Three vendor decisions awaiting executive sign-off. AI program leadership gap is compounding every week.`,
      impact:'$42M stalled', owner:'CEO',
      roles:['CEO','CIO'] },
    { id:'M03', severity:'critical', title:'Travel Nurse Cost $20M Over Target',
      body:`Travel nurse spend at $48M — $20M above the $28M operating target. Dependency has grown 3 consecutive quarters. No reduction roadmap in board materials.`,
      impact:'$20M / yr', owner:'COO + CNO',
      roles:['COO','CFO','CEO'] },
    { id:'M04', severity:'warning', title:`Epic Optimization at ${meridianHealth.technology.ehr.optimizationScore}/100`,
      body:`Seven years post go-live, Epic optimization at ${meridianHealth.technology.ehr.optimizationScore} of 100. Six modules not yet activated. CMS value-based incentive at risk.`,
      impact:'$34M at risk', owner:'CMIO + CIO',
      roles:['CMIO','CIO','CFO'] },
    { id:'M05', severity:'warning', title:'Prior Auth Coverage: 23% vs 62% Peer',
      body:`Only ${meridianHealth.technology.ehr.knownGaps[3]?.includes('23%') ? '23' : '23'}% of payers have connected prior authorization — peers average 62%. Manual auth driving ${meridianHealth.technology.rcm.priorAuthAvgDays}-day average vs ${meridianHealth.technology.rcm.priorAuthPeerDays}-day peer median.`,
      impact:'Payer risk rising', owner:'CMIO + COO',
      roles:['CMIO','COO','CFO'] },
    { id:'M06', severity:'warning', title:`MA Star ${meridianHealth.healthPlan.medicareAdvantage.starRating} — Bonus Threshold Is 4.0`,
      body:`Medicare Advantage at ${meridianHealth.healthPlan.medicareAdvantage.starRating} stars — below the 4.0 threshold for maximum CMS bonus payments. Star measurement period closes in 8 months.`,
      impact:'$34M bonus at risk', owner:'CMO + CFO',
      roles:['CFO','CEO'] },
    { id:'M07', severity:'watch', title:'AI Pilots: Zero Have Scaled',
      body:`6 AI initiatives active. Zero have scaled beyond pilot. $42M invested with no documented outcome against any baseline.`,
      impact:'$42M untracked', owner:'CIO + CDO (vacant)',
      roles:['CIO','CEO'] },
  ],
  firstcapital: [
    { id:'FC01', severity:'critical', title:`Digital Adoption ${firstCapital.org.digitalAdoption}% vs 67% Benchmark`,
      body:`Digital adoption at ${firstCapital.org.digitalAdoption}% vs 67% peer benchmark. Mobile app rating 3.2/5. 180,000 customers at churn risk to neobanks offering same-day accounts.`,
      impact:'$48M revenue gap', owner:'CMO + CEO',
      roles:['CMO','CEO','CFO'] },
    { id:'FC02', severity:'critical', title:'Core Banking System — 22 Years Old',
      body:`FIS HORIZON implemented 2004 — 22 years without modernization. Real-time AI scoring blocked by architecture. 76% of peer banks have modernized or added API layer.`,
      impact:'AI roadmap blocked', owner:'CTO + Board',
      roles:['CIO','CEO','CFO'] },
    { id:'FC03', severity:'critical', title:'FedNow Not Live — January 2027 Deadline',
      body:`FedNow compliance: not achieved. ${firstCapital.technology.payments.peerBanksOnFedNow}% of peer banks are live. Commercial clients are asking. January 2027 is the hard regulatory deadline.`,
      impact:'$180M deposits at risk', owner:'CTO + COO',
      roles:['CIO','CFO','CEO'] },
    { id:'FC04', severity:'warning', title:'AI Spend With Zero Tracked Outcomes',
      body:`3 AI initiatives active, $1.6M invested. 0 have tracked outcomes against any baseline. Fraud Detection stuck in credit card only scope for 6 months.`,
      impact:'$1.6M untracked', owner:'CTO + CDO',
      roles:['CIO','CFO'] },
    { id:'FC05', severity:'warning', title:`Cost-to-Income ${firstCapital.org.costToIncomeRatio}% vs 55% Target`,
      body:`Cost-to-income at ${firstCapital.org.costToIncomeRatio}% — ${(firstCapital.org.costToIncomeRatio - 55).toFixed(0)}pp above the 55% best-in-class benchmark. Compliance cost alone is 34% of IT budget.`,
      impact:'$99M annual gap', owner:'CFO + CEO',
      roles:['CFO','COO','CEO'] },
  ],
  apexretail: [
    { id:'AX01', severity:'critical', title:'Einstein AI Licensed and Never Activated',
      body:`Salesforce Einstein purchased in the SFCC license. Never activated. 18 million loyalty members receiving identical, untailored experiences while competitors personalize in real time.`,
      impact:'$248M idle', owner:'CMO + CTO',
      roles:['CMO','CEO','CFO'] },
    { id:'AX02', severity:'critical', title:'Cart Abandonment 14pp Above Benchmark',
      body:`72% cart abandonment vs 58% benchmark — an $840M recovery opportunity. Real-time trigger infrastructure via Segment and Klaviyo already exists. Not connected.`,
      impact:'$840M opportunity', owner:'CMO + CTO',
      roles:['CMO','CFO','CEO'] },
    { id:'AX03', severity:'warning', title:`Inventory Turns ${apexRetail.financials.inventoryTurnover}x vs 6.8x Benchmark`,
      body:`Inventory turns at ${apexRetail.financials.inventoryTurnover}x vs 6.8x benchmark. $180M excess inventory on the balance sheet. o9 demand forecasting 40% implemented after 18 months.`,
      impact:'$180M tied up', owner:'CFO + CSCO',
      roles:['CFO','COO','CEO'] },
    { id:'AX04', severity:'warning', title:'$38M Untracked Shadow IT Spend',
      body:`28,000 store employees using untracked SaaS tools. $38M in shadow IT spend. CDO role vacant — no AI strategy ownership. 8,400 SAP customizations blocking data flow.`,
      impact:'$38M unmanaged', owner:'CTO + CFO',
      roles:['CIO','CFO'] },
  ],
}

function meridianAI_pilotsPurgatory() {
  try {
    // dynamic import would be async — hardcode from the data file
    return 6
  } catch { return 6 }
}

const FINANCIAL_RISKS: Record<ClientId, RiskItem[]> = {
  meridian: [
    { label: 'RCM denial gap (annual)', amount: 94 },
    { label: 'AI investment undelivered', amount: 42 },
    { label: 'Travel nurse overage', amount: 20 },
    { label: 'Epic incentive at risk', amount: 34 },
    { label: 'MA Star bonus at risk', amount: 34 },
  ],
  firstcapital: [
    { label: 'Digital revenue gap', amount: 48 },
    { label: 'Commercial deposits at risk', amount: 180 },
    { label: 'Cost-to-income gap (annual)', amount: 99 },
    { label: 'AI spend untracked', amount: 2 },
  ],
  apexretail: [
    { label: 'Einstein personalization idle', amount: 248 },
    { label: 'Cart abandonment opportunity', amount: 840 },
    { label: 'Excess inventory cost', amount: 180 },
    { label: 'Shadow IT unmanaged', amount: 38 },
  ],
}

const TIMELINE_EVENTS: Record<ClientId, TimelineEvent[]> = {
  meridian: [
    { label: 'RCM audit', note: 'Gap growing 3 qtrs. Start now.', urgency: 'red' },
    { label: 'Epic sprint', note: '90-day module activation window', urgency: 'amber' },
    { label: 'MA Star deadline', note: 'Measurement period closes', urgency: 'red' },
    { label: 'Prior auth mandate', note: 'CMS rule effective date', urgency: 'amber' },
  ],
  firstcapital: [
    { label: 'SQL Server EOS', note: 'October 2025 — upgrade required', urgency: 'red' },
    { label: 'OCC exam', note: 'Q2 2026 — MRA remediation due', urgency: 'amber' },
    { label: 'FedNow deadline', note: 'January 2027 hard date', urgency: 'red' },
  ],
  apexretail: [
    { label: 'SAP ECC support', note: '2027 end-of-support', urgency: 'amber' },
    { label: 'Churn model', note: 'Already built — deploy now', urgency: 'red' },
    { label: 'o9 completion', note: 'Q4 2026 milestone', urgency: 'amber' },
  ],
}

const ACTIONS: Record<ClientId, Action[]> = {
  meridian: [
    { n:1, horizon:'week', title:'RCM Audit — Pull Q3 Claims by Payer', rationale:'Denial gap growing 3 consecutive quarters. Board meeting next month.', owner:'CFO + Chief Revenue Officer', impact:'$31M identified', effort:'2 days', risk:'HIGH' },
    { n:2, horizon:'week', title:'CDO Interim — Appoint to Unblock AI Pilots', rationale:'$42M invested, 6 pilots frozen. Board will ask.', owner:'CEO', impact:'$42M unblocked', effort:'1 week', risk:'HIGH' },
    { n:3, horizon:'month', title:'Prior Auth Vendor — Reactivate or Re-bid', rationale:'Contract lapsed. 3 payer relationships at risk.', owner:'CMIO + COO', impact:'Auth delay reduced', effort:'3 weeks', risk:'MEDIUM' },
    { n:4, horizon:'month', title:'Epic Modules — 90-Day Activation Sprint', rationale:'6 modules dark. CMS incentive at risk.', owner:'CMIO + CIO', impact:'$34M incentive', effort:'90 days', risk:'MEDIUM' },
    { n:5, horizon:'month', title:'MA Star Plan — 6-Month Roadmap to 4.0', rationale:'Measurement window closing. No plan in place.', owner:'CMO + CFO', impact:'$34M bonus', effort:'4 weeks to plan', risk:'HIGH' },
    { n:6, horizon:'quarter', title:'AI Program Reset — Baseline Every Initiative', rationale:'$42M invested with no documented outcome.', owner:'CIO + CDO (interim)', impact:'$42M accountability', effort:'6 weeks', risk:'LOW' },
    { n:7, horizon:'quarter', title:'Travel Nurse Strategy — 18-Month Reduction Plan', rationale:'$20M overage with no reduction roadmap.', owner:'COO + CNO', impact:'$20M / yr', effort:'8 weeks', risk:'MEDIUM' },
  ],
  firstcapital: [
    { n:1, horizon:'week', title:'SQL Server 2017 — Upgrade Decision', rationale:'End-of-support October 2025. AI data platform blocked.', owner:'CTO + CFO', impact:'AI roadmap unblocked', effort:'1 week decision', risk:'HIGH' },
    { n:2, horizon:'week', title:'FedNow Architecture — API Layer vs Core Modernization', rationale:'76% of peers live. Commercial clients asking now.', owner:'CTO + CEO', impact:'$180M deposits retained', effort:'2 weeks scoping', risk:'HIGH' },
    { n:3, horizon:'month', title:'Fraud Detection — Expand Beyond Credit Card', rationale:'6 months stuck in limited scope. $3.8M excess losses.', owner:'CTO + COO', impact:'$3.8M fraud reduction', effort:'6 weeks', risk:'MEDIUM' },
    { n:4, horizon:'month', title:'AML False Positive — NICE Actimize Upgrade', rationale:'78% false positive rate. 6 excess FTE. OCC MRA risk.', owner:'CTO + Compliance', impact:'$1.1M FTE savings', effort:'9 months', risk:'MEDIUM' },
    { n:5, horizon:'quarter', title:'Digital Roadmap — Close Neobank Gap', rationale:'41% adoption vs 67% benchmark. 180K customers at churn risk.', owner:'CMO + CTO', impact:'$48M revenue gap', effort:'Ongoing', risk:'HIGH' },
  ],
  apexretail: [
    { n:1, horizon:'week', title:'Einstein Activation — 6-Week Sprint', rationale:'Licensed and paid for. Zero incremental cost. Activate now.', owner:'CMO + CTO', impact:'$248M idle', effort:'6 weeks', risk:'LOW' },
    { n:2, horizon:'week', title:'Churn Model Deployment — Already Built', rationale:'Model validated in Databricks. Sitting undeployed 8 months.', owner:'CMO + CTO', impact:'$84M retention', effort:'8 weeks', risk:'LOW' },
    { n:3, horizon:'month', title:'Cart Recovery — Connect Trigger Infrastructure', rationale:'Segment and Klaviyo exist. Just need the trigger workflow.', owner:'CMO + CTO', impact:'$168M recovery', effort:'4 months', risk:'LOW' },
    { n:4, horizon:'month', title:'o9 Completion — Finish What You Started', rationale:'$6.8M paid, 40% implemented, $180M inventory opportunity.', owner:'CSCO + CFO', impact:'$180M inventory', effort:'9 months', risk:'MEDIUM' },
    { n:5, horizon:'quarter', title:'CDP Identity Resolution — Unify 18M Profiles', rationale:'50% profile fragmentation blocking all personalization.', owner:'CTO + CMO', impact:'Foundation for all AI', effort:'90 days', risk:'MEDIUM' },
  ],
}

const PRE_BUILT_QUESTIONS: Record<ClientId, Partial<Record<RoleId, string[]>>> = {
  meridian: {
    CIO: ['Should we stay with Ensemble or switch RCM vendors?','Where is Epic failing and who owns the fix?','What does the CDO vacancy cost us per month?','Which AI vendor decision is most urgent?'],
    CFO: ['How much is the RCM gap costing us in cash?','What\'s the ROI if we fix prior auth this quarter?','What\'s the financial impact of the MA Star gap?','Build me a CFO brief for the board meeting'],
    CMIO: ['What\'s driving the prior auth denial rate?','Which Epic modules are dark and what do they cost?','How does our clinical AI compare to peers?'],
    CEO: ['What do I tell the board about RCM this quarter?','What is our path to 4% operating margin by FY2026?','How do we position Meridian as the AI leader in Southeast?'],
    Maestro: ['What data am I missing that would sharpen this picture?','Which finding needs the most urgent CXO attention?','Draft the opening for my CIO briefing','What questions will the CFO ask?'],
  },
  firstcapital: {
    CIO: ['Replace FIS HORIZON or add an API layer?','How do we get FedNow live before we lose commercial clients?','SQL Server 2017 EOS October — what do we do?'],
    CFO: ['ROI case for core banking modernization?','How do we get cost-to-income from 68% to 55%?','Fraud losses $3.8M above benchmark — fastest fix?'],
    CEO: ['Strategic risk of keeping FIS HORIZON 3 more years?','How do we position as digital bank without $180M investment?','How long before commercial clients leave without FedNow?'],
    Maestro: ['What data am I missing that would sharpen this picture?','Which finding needs the most urgent CXO attention?','Draft the CTO briefing for this week'],
  },
  apexretail: {
    COO: ['18M loyalty members — 42% active vs 68% benchmark — why?','Einstein personalization — why is it not activated?','Cart abandonment 72% — what do we fix first?'],
    CFO: ['ROI case for SAP migration options?','Inventory turnover 4.2x vs 6.8x — what does that cost us?','How do we get operating margin from 3.8% to 6% in 24 months?'],
    CEO: ['SAP ECC support ends 2027 — what do I tell the board?','Amazon is taking share — what is the digital strategy?','How do we close the $840M cart abandonment opportunity?'],
    Maestro: ['What data am I missing?','Which finding needs the most urgent attention?','Draft CEO briefing for the board'],
  },
}

const CLIENT_META: Record<ClientId, { name: string; confidence: number; color: string }> = {
  meridian: { name: 'Meridian Health System', confidence: 94, color: T.teal },
  firstcapital: { name: 'First Capital Financial', confidence: 81, color: T.blue },
  apexretail: { name: 'Apex Retail Group', confidence: 81, color: T.amber },
}

const SEVERITY_COLOR: Record<Severity, string> = {
  critical: T.red, warning: T.amber, watch: T.text3,
}

// ─── Issue Metrics / KPI / Benchmark Data ─────────────────────────────────────

interface IssueMetric { label: string; current: string; benchmark: string; gap?: string }
interface KPIData {
  label: string; value: string; trend?: number[]
  direction: 'up-bad' | 'down-bad'
  target: string; gap: string
  sparkColor?: string
}
interface BenchmarkItem {
  label: string; current: number; peerMedian: number; topQuartile: number
  unit: string; lowerIsBetter?: boolean
}

const ISSUE_METRICS: Record<string, IssueMetric> = {
  M01: { label: 'RCM Denial Rate',     current: '18.2%',          benchmark: '12.1% benchmark', gap: '+6.1pp'         },
  M02: { label: 'AI Pilots Scaled',    current: '0 of 6',          benchmark: '3+ expected'                           },
  M03: { label: 'Travel Nurse Spend',  current: '$48M',            benchmark: '$28M target',     gap: '+$20M/yr'      },
  M04: { label: 'Epic Score',          current: '61 / 100',        benchmark: '74 peer avg'                           },
  M05: { label: 'Prior Auth Speed',    current: '4.2 days',        benchmark: '1.8d peer median',gap: '133% slower'   },
  M06: { label: 'MA Star Rating',      current: '3.2 ★',           benchmark: '4.0 threshold'                         },
  M07: { label: 'AI Spend Tracked',    current: '$0 / $42M',       benchmark: '100% should track'                     },
  FC01: { label: 'Digital Adoption',   current: '41%',             benchmark: '67% peers',       gap: '−26pp'         },
  FC02: { label: 'System Age',         current: '22 years',        benchmark: '6yr avg',         gap: '+16 yrs behind'},
  FC03: { label: 'FedNow Status',      current: 'Not live',        benchmark: '76% peers live'                        },
  FC04: { label: 'AI Outcomes',        current: '0 tracked',       benchmark: 'Baseline required'                     },
  FC05: { label: 'Cost-to-Income',     current: '68%',             benchmark: '55% best-in-class',gap: '+13pp'        },
  AX01: { label: 'Einstein Status',    current: 'Never activated', benchmark: 'Purchased · idle'                      },
  AX02: { label: 'Cart Abandonment',   current: '72%',             benchmark: '58% benchmark',   gap: '+14pp'         },
  AX03: { label: 'Inventory Turns',    current: '4.2x',            benchmark: '6.8x peers',      gap: '−2.6x'         },
  AX04: { label: 'Shadow IT Spend',    current: '$38M',            benchmark: '$0 managed'                            },
}

const CLIENT_KPI_DATA: Record<ClientId, KPIData[]> = {
  meridian: [
    { label: 'OPERATING MARGIN',   value: '1.8%',  trend: [3.2, 2.1, 1.8],   direction: 'down-bad', target: '4.0%',  gap: '$179M / yr gap',     sparkColor: '#EF4444' },
    { label: 'RCM DENIAL RATE',    value: '18.2%', trend: [14.2, 16.8, 18.2], direction: 'up-bad',   target: '12.1%', gap: '$94M / yr at risk',  sparkColor: '#EF4444' },
    { label: 'PRIOR AUTH COVERAGE',value: '23%',   trend: [31, 27, 23],       direction: 'down-bad', target: '62%',   gap: '−39pp vs peers',     sparkColor: '#F59E0B' },
    { label: 'MA STAR RATING',     value: '3.2 ★', trend: [3.8, 3.6, 3.2],   direction: 'down-bad', target: '4.0 ★', gap: '$34M bonus at risk', sparkColor: '#F59E0B' },
  ],
  firstcapital: [
    { label: 'DIGITAL ADOPTION',   value: '41%',      trend: [35, 38, 41],      direction: 'up-bad',   target: '67%',      gap: '−26pp vs peers'     },
    { label: 'COST-TO-INCOME',     value: '68%',      trend: [66, 67, 68],      direction: 'up-bad',   target: '55%',      gap: '$99M / yr gap'      },
    { label: 'AML FALSE POSITIVE', value: '78%',      trend: [72, 75, 78],      direction: 'up-bad',   target: '30%',      gap: '6 excess FTE'       },
    { label: 'MOBILE APP RATING',  value: '3.2 / 5',  trend: [3.4, 3.3, 3.2],   direction: 'down-bad', target: '4.5 / 5',  gap: '180K at churn risk' },
  ],
  apexretail: [
    { label: 'CART ABANDONMENT',   value: '72%',      trend: [68, 70, 72],      direction: 'up-bad',   target: '58%',      gap: '$840M opportunity'  },
    { label: 'INVENTORY TURNS',    value: '4.2x',     trend: [5.2, 4.8, 4.2],   direction: 'down-bad', target: '6.8x',     gap: '$180M tied up'      },
    { label: 'LOYALTY ACTIVE',     value: '42%',      trend: [48, 45, 42],      direction: 'down-bad', target: '68%',      gap: '−26pp vs peers'     },
    { label: 'OPERATING MARGIN',   value: '3.8%',     trend: [4.2, 4.0, 3.8],   direction: 'down-bad', target: '6.0%',     gap: '−2.2pp from target' },
  ],
}

const CLIENT_BENCHMARKS: Record<ClientId, BenchmarkItem[]> = {
  meridian: [
    { label: 'RCM Denial Rate',    current: 18.2, peerMedian: 14.2, topQuartile: 10.8, unit: '%',    lowerIsBetter: true },
    { label: 'Prior Auth Days',    current: 4.2,  peerMedian: 1.8,  topQuartile: 1.2,  unit: 'd',    lowerIsBetter: true },
    { label: 'Epic Score',         current: 61,   peerMedian: 74,   topQuartile: 90,   unit: '/100'                      },
    { label: 'MA Star Rating',     current: 3.2,  peerMedian: 3.5,  topQuartile: 4.5,  unit: '★'                         },
    { label: 'Operating Margin',   current: 1.8,  peerMedian: 2.8,  topQuartile: 5.2,  unit: '%'                         },
  ],
  firstcapital: [
    { label: 'Digital Adoption',   current: 41,   peerMedian: 58,   topQuartile: 72,   unit: '%'                         },
    { label: 'Cost-to-Income',     current: 68,   peerMedian: 60,   topQuartile: 52,   unit: '%',    lowerIsBetter: true },
    { label: 'AML False Positive', current: 78,   peerMedian: 55,   topQuartile: 30,   unit: '%',    lowerIsBetter: true },
    { label: 'FedNow Live Peers',  current: 0,    peerMedian: 76,   topQuartile: 92,   unit: '%'                         },
    { label: 'Mobile App Rating',  current: 3.2,  peerMedian: 4.0,  topQuartile: 4.7,  unit: '/5'                        },
  ],
  apexretail: [
    { label: 'Cart Abandonment',   current: 72,   peerMedian: 62,   topQuartile: 52,   unit: '%',    lowerIsBetter: true },
    { label: 'Inventory Turns',    current: 4.2,  peerMedian: 5.8,  topQuartile: 7.2,  unit: 'x'                         },
    { label: 'Loyalty Active Rate',current: 42,   peerMedian: 55,   topQuartile: 68,   unit: '%'                         },
    { label: 'Ecommerce Revenue',  current: 18,   peerMedian: 28,   topQuartile: 42,   unit: '%'                         },
    { label: 'Operating Margin',   current: 3.8,  peerMedian: 5.2,  topQuartile: 8.1,  unit: '%'                         },
  ],
}

// ─── Components ───────────────────────────────────────────────────────────────

function Sparkline({ data, color, width = 64, height = 28 }: { data: number[]; color: string; width?: number; height?: number }) {
  const PAD = 4
  const min = Math.min(...data)
  const max = Math.max(...data)
  const r = Math.max(max - min, 0.001)
  const pts = data.map((v, i) => [
    PAD + (i / (data.length - 1)) * (width - PAD * 2),
    PAD + (height - PAD * 2) - ((v - min) / r) * (height - PAD * 2),
  ] as [number, number])

  // Straight line segments — clean at small sizes with 3 data points
  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')
  const areaPath = linePath + ` L ${pts[pts.length - 1][0].toFixed(1)},${height} L ${pts[0][0].toFixed(1)},${height} Z`
  const [lx, ly] = pts[pts.length - 1]
  const gradId = `sg${color.replace(/[^a-f0-9]/gi, '')}${width}`

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible', flexShrink: 0 }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lx.toFixed(1)} cy={ly.toFixed(1)} r="2" fill={color} />
    </svg>
  )
}

function KPITile({ kpi }: { kpi: KPIData }) {
  const last = kpi.trend?.[kpi.trend.length - 1] ?? 0
  const first = kpi.trend?.[0] ?? 0
  const trendDir = kpi.trend ? (last > first ? '↑' : '↓') : ''
  const sc = kpi.sparkColor ?? T.red
  return (
    <div style={{ background: T.surface, border: '1px solid ' + T.border, borderTop: '2px solid ' + sc, borderRadius: '10px', padding: '16px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ fontSize: '9px', fontWeight: 700, color: T.text2, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: T.mono, lineHeight: 1.4, maxWidth: '130px' }}>{kpi.label}</div>
        {kpi.trend && <Sparkline data={kpi.trend} color={sc} />}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px', marginBottom: '8px' }}>
        <span style={{ fontSize: '26px', fontWeight: 800, color: sc, lineHeight: 1 }}>{kpi.value}</span>
        {trendDir && <span style={{ fontSize: '14px', color: sc, fontWeight: 700, opacity: 0.7 }}>{trendDir}</span>}
      </div>
      <div style={{ borderTop: '1px solid ' + T.border, paddingTop: '8px' }}>
        <div style={{ fontSize: '10px', color: T.text2 }}>Target <span style={{ color: T.text, fontWeight: 600 }}>{kpi.target}</span></div>
        <div style={{ fontSize: '11px', fontWeight: 700, color: T.amber, marginTop: '3px' }}>{kpi.gap}</div>
      </div>
    </div>
  )
}

function BenchmarkPanel({ benchmarks }: { benchmarks: BenchmarkItem[] }) {
  return (
    <div style={{ background: T.surface, border: '1px solid ' + T.border, borderRadius: '10px', padding: '18px' }}>
      <div style={{ fontSize: '10px', fontWeight: 700, color: T.text3, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px', fontFamily: T.mono }}>BENCHMARK POSITION</div>
      {benchmarks.map(b => {
        const max = Math.max(b.current, b.peerMedian, b.topQuartile) * 1.1 || 1
        const behind = b.lowerIsBetter ? b.current > b.peerMedian : b.current < b.peerMedian
        return (
          <div key={b.label} style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '5px' }}>
              <span style={{ fontSize: '11px', color: T.text2 }}>{b.label}</span>
              <span style={{ fontSize: '12px', fontWeight: 800, color: behind ? T.red : T.green, fontFamily: T.mono }}>{b.current}{b.unit}</span>
            </div>
            {[
              { label: 'You',   pct: (b.current / max) * 100,     color: behind ? T.red : T.teal },
              { label: 'Peer',  pct: (b.peerMedian / max) * 100,  color: T.text3                 },
              { label: 'Top Q', pct: (b.topQuartile / max) * 100, color: T.green + '60'          },
            ].map(bar => (
              <div key={bar.label} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                <div style={{ width: '32px', fontSize: '9px', color: T.text3, textAlign: 'right', fontFamily: T.mono, flexShrink: 0 }}>{bar.label}</div>
                <div style={{ flex: 1, height: '5px', background: T.bg, borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: bar.pct + '%', background: bar.color, borderRadius: '3px', transition: 'width 700ms ease' }} />
                </div>
              </div>
            ))}
          </div>
        )
      })}
      <div style={{ display: 'flex', gap: '12px', marginTop: '8px', paddingTop: '10px', borderTop: '1px solid ' + T.border }}>
        {[{ c: T.teal, l: 'You' }, { c: T.text3, l: 'Peer median' }, { c: T.green, l: 'Top Q' }].map(x => (
          <div key={x.l} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: x.c, flexShrink: 0 }} />
            <span style={{ fontSize: '9px', color: T.text3 }}>{x.l}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Trajectory Chart ─────────────────────────────────────────────────────────

const TRAJECTORY_DATA: Record<ClientId, { title: string; leftLabel: string; rightLabel: string; leftPts: number[]; rightPts: number[]; years: string[] }> = {
  meridian:     { title: 'Revenue is growing. Margin is collapsing.',     leftLabel: 'Revenue ($B)', rightLabel: 'Op. Margin (%)', leftPts: [9.8, 10.1, 10.5, 10.9, 11.2], rightPts: [3.8, 3.4, 3.2, 2.1, 1.8], years: ['FY21','FY22','FY23','FY24','FY25'] },
  firstcapital: { title: 'Assets are growing. Efficiency is deteriorating.', leftLabel: 'Assets ($B)',  rightLabel: 'Cost/Income (%)', leftPts: [16.2, 16.8, 17.2, 17.8, 18.0], rightPts: [62, 64, 65, 67, 68], years: ['FY21','FY22','FY23','FY24','FY25'] },
  apexretail:   { title: 'Revenue is growing. Margin is under pressure.',   leftLabel: 'Revenue ($B)', rightLabel: 'Op. Margin (%)', leftPts: [10.8, 11.2, 11.6, 11.9, 12.2], rightPts: [5.8, 5.2, 4.8, 4.2, 3.8], years: ['FY21','FY22','FY23','FY24','FY25'] },
}

function TrajectoryChart({ clientId }: { clientId: ClientId }) {
  const d = TRAJECTORY_DATA[clientId]
  const n = d.leftPts.length
  const W = 900, H = 110, pl = 44, pr = 44, pt = 14, pb = 24
  const iW = W - pl - pr, iH = H - pt - pb
  const minL = Math.min(...d.leftPts) * 0.96, maxL = Math.max(...d.leftPts) * 1.03
  const minR = Math.min(...d.rightPts) * 0.88, maxR = Math.max(...d.rightPts) * 1.06
  const xp = (i: number) => pl + (i / (n - 1)) * iW
  const yL = (v: number) => pt + iH - ((v - minL) / (maxL - minL)) * iH
  const yR = (v: number) => pt + iH - ((v - minR) / (maxR - minR)) * iH
  const path = (pts: number[], yFn: (v: number) => number) => {
    let p = `M ${xp(0)},${yFn(pts[0])}`
    for (let i = 1; i < pts.length; i++) {
      const mx = (xp(i-1) + xp(i)) / 2
      p += ` C ${mx},${yFn(pts[i-1])} ${mx},${yFn(pts[i])} ${xp(i)},${yFn(pts[i])}`
    }
    return p
  }
  return (
    <div style={{ background: T.surface, border: '1px solid ' + T.border, borderRadius: '12px', padding: '16px 20px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ fontSize: '14px', fontWeight: 600, color: T.text, fontFamily: T.sans }}>{d.title} <span style={{ fontWeight: 400, color: T.text2 }}>Here is why.</span></div>
        <div style={{ display: 'flex', gap: '14px', flexShrink: 0 }}>
          {[[T.teal, d.leftLabel], [T.red, d.rightLabel]].map(([c, l]) => (
            <div key={l as string} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '18px', height: '2px', background: c as string, borderRadius: '1px' }} />
              <span style={{ fontSize: '10px', color: T.text2, fontFamily: T.mono }}>{l as string}</span>
            </div>
          ))}
        </div>
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
        <line x1={pl} y1={pt} x2={W-pr} y2={pt} stroke={T.border} strokeWidth="1" opacity="0.4" />
        <line x1={pl} y1={H-pb} x2={W-pr} y2={H-pb} stroke={T.border} strokeWidth="1" opacity="0.4" />
        {d.years.map((yr, i) => <text key={yr} x={xp(i)} y={H-5} textAnchor="middle" fill="#94A3B8" fontSize="9" fontFamily="monospace">{yr}</text>)}
        <text x={pl-4} y={pt+4} textAnchor="end" fill={T.teal} fontSize="9" fontFamily="monospace">{d.leftPts[n-1].toFixed(1)}</text>
        <text x={pl-4} y={H-pb} textAnchor="end" fill={T.teal} fontSize="9" fontFamily="monospace" opacity="0.5">{d.leftPts[0].toFixed(1)}</text>
        <text x={W-pr+4} y={pt+4} textAnchor="start" fill={T.red} fontSize="9" fontFamily="monospace" opacity="0.5">{d.rightPts[0].toFixed(1)}%</text>
        <text x={W-pr+4} y={H-pb} textAnchor="start" fill={T.red} fontSize="9" fontFamily="monospace">{d.rightPts[n-1].toFixed(1)}%</text>
        <path d={path(d.leftPts, yL)} fill="none" stroke={T.teal} strokeWidth="2.5" strokeLinecap="round" />
        <path d={path(d.rightPts, yR)} fill="none" stroke={T.red} strokeWidth="2.5" strokeLinecap="round" />
        <circle cx={xp(n-1)} cy={yL(d.leftPts[n-1])} r="4" fill={T.teal} />
        <circle cx={xp(n-1)} cy={yR(d.rightPts[n-1])} r="4" fill={T.red} />
      </svg>
    </div>
  )
}

// ─── Donut Chart ──────────────────────────────────────────────────────────────

function DonutChart({ issues, filter, onFilter }: { issues: Issue[]; filter: Severity | null; onFilter: (s: Severity | null) => void }) {
  const counts = [
    issues.filter(i => i.severity === 'critical').length,
    issues.filter(i => i.severity === 'warning').length,
    issues.filter(i => i.severity === 'watch').length,
  ]
  const labels: Severity[] = ['critical', 'warning', 'watch']
  const colors = [T.red, T.amber, '#475569']
  const total = issues.length || 1
  const cx = 60, cy = 60, r = 44, sw = 14

  const arcPath = (s: number, e: number) => {
    const toXY = (d: number) => {
      const rad = (d - 90) * Math.PI / 180
      return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)] as [number, number]
    }
    const [sx, sy] = toXY(s), [ex, ey] = toXY(e)
    return `M ${sx.toFixed(1)} ${sy.toFixed(1)} A ${r} ${r} 0 ${e - s > 180 ? 1 : 0} 1 ${ex.toFixed(1)} ${ey.toFixed(1)}`
  }

  let cumDeg = 0
  const segs = labels.map((sev, i) => {
    const cnt = counts[i]
    const span = (cnt / total) * 360
    const startD = cumDeg, endD = cumDeg + span - (cnt && span > 4 ? 2 : 0)
    cumDeg += span
    return { sev, cnt, color: colors[i], startD, endD }
  })

  return (
    <div style={{ background: T.surface, border: '1px solid ' + T.border, borderRadius: '10px', padding: '14px', marginBottom: '10px' }}>
      <div style={{ fontSize: '10px', fontWeight: 700, color: T.text2, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px', fontFamily: T.mono }}>SEVERITY SUMMARY</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ position: 'relative', flexShrink: 0, width: 120, height: 120 }}>
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle cx={cx} cy={cy} r={r} fill="none" stroke={T.border} strokeWidth={sw} />
            {segs.map(s => s.cnt > 0 ? (
              <path key={s.sev} d={arcPath(s.startD, s.endD)} fill="none"
                stroke={filter === null || filter === s.sev ? s.color : s.color + '30'}
                strokeWidth={filter === s.sev ? sw + 3 : sw} strokeLinecap="round"
                style={{ cursor: 'pointer', transition: 'all 200ms' }}
                onClick={() => onFilter(filter === s.sev ? null : s.sev)}
              />
            ) : null)}
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <div style={{ fontSize: '22px', fontWeight: 700, color: T.red, lineHeight: 1, fontFamily: 'Georgia, serif' }}>{counts[0]}</div>
            <div style={{ fontSize: '8px', fontWeight: 700, color: T.text2, letterSpacing: '0.08em', fontFamily: T.mono }}>CRITICAL</div>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          {segs.map(s => (
            <button key={s.sev} onClick={() => s.cnt ? onFilter(filter === s.sev ? null : s.sev) : undefined}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', background: filter === s.sev ? s.color + '12' : 'none', border: '1px solid ' + (filter === s.sev ? s.color + '40' : 'transparent'), borderRadius: '5px', padding: '4px 8px', cursor: s.cnt ? 'pointer' : 'default', marginBottom: '4px' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: s.color, flexShrink: 0 }} />
              <span style={{ fontSize: '12px', color: T.text2, fontFamily: T.sans }}>
                <span style={{ fontWeight: 700, color: T.text }}>{s.cnt}</span> {s.sev}
              </span>
            </button>
          ))}
          {filter && <button onClick={() => onFilter(null)} style={{ fontSize: '10px', color: T.teal, background: 'none', border: 'none', cursor: 'pointer', fontFamily: T.sans, padding: '2px 8px' }}>× clear</button>}
        </div>
      </div>
    </div>
  )
}

function StepNav({ step, setStep, completedSteps }: { step: number; setStep: (n: number) => void; completedSteps: Set<number> }) {
  const steps = ['What\'s Happening', 'Why It\'s Happening', 'What\'s At Risk', 'Ask Anything', 'What To Do Next', 'Situation Brief Ready']
  return (
    <div style={{ background: T.surface, borderBottom: '1px solid ' + T.border, padding: '0 32px', display: 'flex', gap: '0', overflowX: 'auto' }}>
      {steps.map((label, i) => {
        const n = i + 1
        const active = step === n
        const done = completedSteps.has(n)
        return (
          <button
            key={n}
            onClick={() => setStep(n)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '0 20px', height: '48px', background: 'none', border: 'none',
              cursor: 'pointer', fontFamily: T.sans, whiteSpace: 'nowrap',
              borderBottom: active ? '2px solid ' + T.teal : '2px solid transparent',
            }}
          >
            <span style={{
              width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '9px', fontWeight: 800,
              background: active ? T.teal : done ? T.teal + '25' : 'transparent',
              color: active ? T.bg : done ? T.teal : 'rgba(239,246,255,0.7)',
              border: active ? 'none' : done ? '1px solid ' + T.teal + '50' : '1px solid rgba(239,246,255,0.3)',
            }}>
              {done && !active ? '✓' : n}
            </span>
            <span style={{ fontSize: '12px', fontWeight: active ? 700 : 500, color: active ? T.text : 'rgba(239,246,255,0.7)' }}>
              {label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function IssueCard({ issue, expanded, onToggle }: { issue: Issue; expanded: boolean; onToggle: () => void }) {
  const borderColor = SEVERITY_COLOR[issue.severity]
  const label = issue.severity === 'critical' ? 'CRITICAL' : issue.severity === 'warning' ? 'WARNING' : 'WATCH'
  const metric = ISSUE_METRICS[issue.id]
  return (
    <div style={{ background: '#0D1520', border: '1px solid ' + T.border, borderLeft: '4px solid ' + borderColor, borderRadius: '8px', marginBottom: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '9px', fontWeight: 800, color: borderColor, letterSpacing: '0.1em', fontFamily: T.mono }}>{label}</span>
              <span style={{ fontSize: '9px', color: T.text3, fontFamily: T.mono }}>#{issue.id}</span>
            </div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: T.text, marginBottom: '10px' }}>{issue.title}</div>
            {metric && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', marginBottom: '10px', background: T.surface, border: '1px solid ' + T.border, borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{ padding: '8px 12px' }}>
                  <div style={{ fontSize: '9px', fontWeight: 700, color: T.text3, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '3px', fontFamily: T.mono }}>CURRENT</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: borderColor, lineHeight: 1 }}>{metric.current}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 10px', borderLeft: '1px solid ' + T.border, borderRight: '1px solid ' + T.border, background: T.bg }}>
                  <span style={{ fontSize: '9px', color: T.text3, fontFamily: T.mono }}>vs</span>
                </div>
                <div style={{ padding: '8px 12px' }}>
                  <div style={{ fontSize: '9px', fontWeight: 700, color: T.text3, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '3px', fontFamily: T.mono }}>BENCHMARK</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: T.text2, lineHeight: 1 }}>{metric.benchmark}</div>
                  {metric.gap && <div style={{ fontSize: '10px', fontWeight: 700, color: borderColor, marginTop: '3px' }}>{metric.gap}</div>}
                </div>
              </div>
            )}
            <div style={{ fontSize: '13px', color: '#94A3B8', lineHeight: 1.6, marginBottom: '10px' }}>{issue.body}</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, background: T.teal + '18', color: T.teal, border: '1px solid ' + T.teal + '40', borderRadius: '12px', padding: '3px 10px' }}>{issue.impact}</span>
              <span style={{ fontSize: '11px', color: T.text3, background: T.surface2, borderRadius: '12px', padding: '3px 10px', border: '1px solid ' + T.border }}>{issue.owner}</span>
            </div>
          </div>
          <button onClick={onToggle} style={{ background: 'none', border: 'none', color: T.text3, cursor: 'pointer', fontSize: '18px', lineHeight: 1, padding: '2px', flexShrink: 0 }}>
            {expanded ? '−' : '+'}
          </button>
        </div>
      </div>
      {expanded && (
        <div style={{ padding: '10px 16px 14px', borderTop: '1px solid ' + T.border, background: T.surface }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button style={{ padding: '6px 14px', background: 'none', border: '1px solid ' + T.teal + '50', borderRadius: '6px', fontSize: '12px', color: T.teal, cursor: 'pointer', fontFamily: T.sans }}>
              See the data →
            </button>
            <button style={{ padding: '6px 14px', background: 'none', border: '1px solid ' + T.border2, borderRadius: '6px', fontSize: '12px', color: T.text2, cursor: 'pointer', fontFamily: T.sans }}>
              Who owns this →
            </button>
            <button style={{ padding: '6px 14px', background: 'none', border: '1px solid ' + T.border2, borderRadius: '6px', fontSize: '12px', color: T.text2, cursor: 'pointer', fontFamily: T.sans }}>
              What to do →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Zone 1 ───────────────────────────────────────────────────────────────────

function Zone1({ issues, role, clientId }: { issues: Issue[]; role: RoleId; clientId: ClientId }) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filter, setFilter] = useState<Severity | null>(null)

  const sorted = [...issues].sort((a, b) => {
    const relevanceA = a.roles.includes(role) ? 0 : 1
    const relevanceB = b.roles.includes(role) ? 0 : 1
    const sevOrder: Record<Severity, number> = { critical: 0, warning: 1, watch: 2 }
    return relevanceA - relevanceB || sevOrder[a.severity] - sevOrder[b.severity]
  })

  const visible = filter ? sorted.filter(i => i.severity === filter) : sorted
  const kpis = CLIENT_KPI_DATA[clientId]
  const benchmarks = CLIENT_BENCHMARKS[clientId]

  return (
    <div>
      {/* Trajectory chart — full width */}
      <TrajectoryChart clientId={clientId} />

      {/* Row 1: KPI tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {kpis.map((kpi, i) => <KPITile key={i} kpi={kpi} />)}
      </div>

      {/* Row 2: issue cards + right sidebar */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 290px', gap: '24px', alignItems: 'start' }}>
        {/* Left: issue cards */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: T.text3, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: T.mono }}>
              {visible.length} ISSUES · SORTED BY ROLE RELEVANCE
            </div>
          </div>
          {visible.map(issue => (
            <IssueCard
              key={issue.id} issue={issue}
              expanded={expanded === issue.id}
              onToggle={() => setExpanded(expanded === issue.id ? null : issue.id)}
            />
          ))}
        </div>

        {/* Right: severity donut + benchmark panel */}
        <div>
          <DonutChart issues={issues} filter={filter} onFilter={setFilter} />
          <BenchmarkPanel benchmarks={benchmarks} />
        </div>
      </div>
    </div>
  )
}

// ─── Zone 2 ───────────────────────────────────────────────────────────────────

interface TensionRow { id: string; reported: string; reportedSub: string; actual: string; actualSub: string; gap: string; gapSub: string; reportedBy: string; dataSource: string; gapStarted: string }

const STATIC_CONTRADICTIONS: Record<ClientId, TensionRow[]> = {
  meridian: [
    { id:'M-C1', reported:'94.2% collection rate',   reportedSub:'Board Q3 2025 — Robert Chen (CFO)', actual:'87.1% actual',          actualSub:'Ensemble Health Partners claims extract',  gap:'$31M gap',         gapSub:'3 consecutive quarters',  reportedBy:'Robert Chen (CFO) · Q3 Board Deck · Sep 2025',          dataSource:'Ensemble Health Partners · Claims Extract · Nov 2025',   gapStarted:'Q1 2025' },
    { id:'M-C2', reported:'6 AI pilots running',      reportedSub:'AI Committee · Jan 2026 — Marcus Webb', actual:'0 delivering value', actualSub:'AI Assessment · March 2026',               gap:'$42M sunk',        gapSub:'Zero tracked outcomes',   reportedBy:'Marcus Webb (CIO) · AI Committee Report · Jan 2026',     dataSource:'AI Investment Assessment · March 2026',                   gapStarted:'Q3 2025' },
    { id:'M-C3', reported:'Prior auth vendor selected',reportedSub:'CMIO briefing · Oct 2025',           actual:'Contract lapsed',      actualSub:'Vendor contract review · Feb 2026',        gap:'6-month delay',    gapSub:'3 payer contracts at risk', reportedBy:'Dr. Sarah Okonkwo (CMIO) · Oct 2025 briefing',           dataSource:'Vendor contract audit file · Feb 2026',                   gapStarted:'Nov 2025' },
    { id:'M-C4', reported:'Epic go-live complete',    reportedSub:'CIO town hall · 2023',                actual:'6 modules still dark', actualSub:'Epic optimization audit · 2026',           gap:'$34M missed',      gapSub:'CMS incentive at risk',   reportedBy:'Marcus Webb (CIO) · Go-live announcement · 2023',        dataSource:'Epic optimization score: 58/100 · March 2026',            gapStarted:'Post go-live 2023' },
    { id:'M-C5', reported:'CDO in final interviews',  reportedSub:'Board update · Feb 2026',            actual:'Search paused · 14 months', actualSub:'HR records · April 2026',             gap:'AI has no owner',  gapSub:'$42M program leaderless', reportedBy:'Board presentation · Feb 2026',                          dataSource:'HR records · CDO role vacant since Feb 2025',             gapStarted:'Feb 2025' },
  ],
  firstcapital: [
    { id:'FC-C1', reported:'FedNow on roadmap Q1 2026', reportedSub:'CTO board update · Q3 2025',       actual:'Not started · April 2026', actualSub:'IT project register · April 2026',    gap:'Deadline at risk', gapSub:'Jan 2027 hard date',      reportedBy:'James Okafor (CTO) · Q3 board update · 2025',            dataSource:'IT project register · April 2026 review',                 gapStarted:'Q4 2025' },
    { id:'FC-C2', reported:'3 AI pilots delivering ROI',reportedSub:'CDO quarterly · Q4 2025',          actual:'0 with tracked baselines', actualSub:'AI assessment · March 2026',          gap:'$1.6M untracked',  gapSub:'Zero accountability',     reportedBy:'CDO quarterly report · December 2025',                   dataSource:'AI Investment Assessment · March 2026',                   gapStarted:'Q3 2025' },
    { id:'FC-C3', reported:'Digital adoption at 52%', reportedSub:'CMO report · Q3 2025',               actual:'41% · stagnant',          actualSub:'Segment analytics · March 2026',      gap:'$48M gap',         gapSub:'180K at churn risk',      reportedBy:'CMO report · Q3 2025',                                   dataSource:'Segment analytics platform · March 2026',                 gapStarted:'Q4 2024' },
    { id:'FC-C4', reported:'FIS HORIZON upgrade roadmapped', reportedSub:'IT strategy · 2024',          actual:'No funding approved',     actualSub:'IT budget review · Q1 2026',          gap:'AI deferred',      gapSub:'22-year-old system',      reportedBy:'IT 5-year strategy document · 2024',                     dataSource:'IT budget committee minutes · Q1 2026',                   gapStarted:'2024' },
    { id:'FC-C5', reported:'AML compliance in tolerance', reportedSub:'Compliance committee · Q3 2025', actual:'78% false positive rate', actualSub:'OCC MRA findings · Feb 2026',         gap:'$1.1M excess',     gapSub:'OCC MRA active',          reportedBy:'Compliance committee report · Q3 2025',                  dataSource:'OCC MRA findings · February 2026',                        gapStarted:'Q2 2024' },
  ],
  apexretail: [
    { id:'AX-C1', reported:'Einstein personalization live', reportedSub:'Salesforce contract · 2023',   actual:'Never activated',         actualSub:'Tech audit · March 2026',             gap:'$248M idle',       gapSub:'Fully licensed · never used', reportedBy:'Salesforce contract documents · 2023',                  dataSource:'Einstein activation audit · March 2026',                  gapStarted:'License inception 2023' },
    { id:'AX-C2', reported:'Churn model in production', reportedSub:'Data Science update · Q3 2025',    actual:'Built · not deployed',    actualSub:'Engineering review · April 2026',     gap:'8 months lost',    gapSub:'Churn prevention unrealized', reportedBy:'Data Science quarterly · Q3 2025',                       dataSource:'Engineering deployment log · April 2026',                 gapStarted:'Aug 2025' },
    { id:'AX-C3', reported:'o9 fully implemented',    reportedSub:'CSCO board update · Q4 2025',        actual:'40% after 18 months',     actualSub:'o9 project review · March 2026',      gap:'$180M trapped',    gapSub:'Excess inventory on balance sheet', reportedBy:'Lisa Thompson (CSCO) · Q4 2025 board',                  dataSource:'o9 project review · March 2026',                          gapStarted:'Q3 2024' },
    { id:'AX-C4', reported:'Cart recovery flows active', reportedSub:'eCommerce update · Jan 2026',     actual:'Infrastructure not connected', actualSub:'eCommerce audit · March 2026',    gap:'$840M unrealized', gapSub:'Segment + Klaviyo idle',  reportedBy:'eCommerce Q4 update · January 2026',                     dataSource:'eCommerce platform audit · March 2026',                   gapStarted:'Q2 2025' },
    { id:'AX-C5', reported:'AI strategy approved',    reportedSub:'Board minutes · Q1 2026',            actual:'CDO vacant · no owner',   actualSub:'HR records · April 2026',             gap:'Roadmap stalled',  gapSub:'No implementation leader', reportedBy:'Board minutes · January 2026',                           dataSource:'HR org chart · April 2026',                               gapStarted:'Q1 2025' },
  ],
}

function Zone2({ clientId }: { clientId: ClientId }) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [animate, setAnimate] = useState(false)
  const rows = STATIC_CONTRADICTIONS[clientId]

  useEffect(() => {
    setAnimate(false)
    setExpanded(null)
    const t = setTimeout(() => setAnimate(true), 60)
    return () => clearTimeout(t)
  }, [clientId])

  return (
    <div>
      {/* Column headers */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 130px 1fr', gap: '0', marginBottom: '14px', padding: '0 16px' }}>
        <div style={{ fontSize: '10px', fontWeight: 700, color: T.text2, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: T.mono }}>WHAT WAS REPORTED</div>
        <div style={{ fontSize: '10px', fontWeight: 700, color: T.teal, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: T.mono, textAlign: 'center' }}>THE GAP</div>
        <div style={{ fontSize: '10px', fontWeight: 700, color: T.red, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: T.mono, textAlign: 'right' }}>WHAT DATA SHOWS</div>
      </div>

      {rows.map((c, idx) => (
        <div key={c.id} style={{ marginBottom: '8px' }}>
          <button
            onClick={() => setExpanded(expanded === c.id ? null : c.id)}
            style={{ display: 'block', width: '100%', background: T.surface, border: '1px solid ' + (expanded === c.id ? T.teal + '50' : T.border), borderRadius: '10px', cursor: 'pointer', fontFamily: T.sans, overflow: 'hidden', textAlign: 'left' }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 130px 1fr' }}>
              {/* Left: reported */}
              <div style={{ padding: '14px 16px', borderRight: '1px solid ' + T.border }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: T.text, marginBottom: '3px' }}>{c.reported}</div>
                <div style={{ fontSize: '11px', color: T.text2 }}>{c.reportedSub}</div>
              </div>
              {/* Center: tension line + gap */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10px 8px', borderLeft: '1px solid ' + T.border, borderRight: '1px solid ' + T.border, background: T.bg }}>
                <div style={{ width: '100%', height: '2px', background: `linear-gradient(90deg, ${T.text2}, ${T.red})`, marginBottom: '6px', transformOrigin: 'left', transform: animate ? 'scaleX(1)' : 'scaleX(0)', transition: `transform 500ms ease ${idx * 80}ms` }} />
                <div style={{ fontSize: '12px', fontWeight: 700, color: T.red, textAlign: 'center', lineHeight: 1.3 }}>{c.gap}</div>
                <div style={{ fontSize: '10px', color: T.amber, textAlign: 'center', marginTop: '2px' }}>{c.gapSub}</div>
              </div>
              {/* Right: actual */}
              <div style={{ padding: '14px 16px', textAlign: 'right' }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: T.red, marginBottom: '3px' }}>{c.actual}</div>
                <div style={{ fontSize: '11px', color: T.text2 }}>{c.actualSub}</div>
              </div>
            </div>
          </button>
          {/* Expanded attribution */}
          {expanded === c.id && (
            <div style={{ background: T.surface, border: '1px solid ' + T.border, borderTop: 'none', borderRadius: '0 0 10px 10px', padding: '14px 16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                {[
                  { label: 'REPORTED BY', value: c.reportedBy },
                  { label: 'DATA SOURCE', value: c.dataSource },
                  { label: 'GAP STARTED', value: c.gapStarted },
                ].map(m => (
                  <div key={m.label}>
                    <div style={{ fontSize: '9px', fontWeight: 700, color: T.teal, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px', fontFamily: T.mono }}>{m.label}</div>
                    <div style={{ fontSize: '11px', color: T.text2, lineHeight: 1.5 }}>{m.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Zone 3 ───────────────────────────────────────────────────────────────────

function Zone3({ clientId }: { clientId: ClientId }) {
  const risks = FINANCIAL_RISKS[clientId]
  const timeline = TIMELINE_EVENTS[clientId]
  const maxRisk = Math.max(...risks.map(r => r.amount))
  const total = risks.reduce((s, r) => s + r.amount, 0)

  const strategicRisks: Record<ClientId, Array<{ level: 'HIGH' | 'MEDIUM'; text: string }>> = {
    meridian: [
      { level: 'HIGH', text: 'CDO vacancy → AI program stall — 6 pilots frozen, competitors moving' },
      { level: 'HIGH', text: 'Prior auth lag → payer relationship risk — 3 contracts up for renewal Q3' },
      { level: 'HIGH', text: 'Epic modules → CMS audit exposure — next review in 90 days' },
      { level: 'MEDIUM', text: 'MA Star decline → $34M bonus loss if measurement period missed' },
      { level: 'MEDIUM', text: 'Travel nurse dependency → margin squeeze, no reduction plan in place' },
    ],
    firstcapital: [
      { level: 'HIGH', text: 'FedNow delay → commercial client loss — 76% of peers already live' },
      { level: 'HIGH', text: 'FIS HORIZON → AI roadmap blocked — every modern capability deferred' },
      { level: 'HIGH', text: 'SQL Server EOS → data platform at risk — October 2025 hard date' },
      { level: 'MEDIUM', text: 'OCC MRAs → compliance cost escalating — 3 active MRAs unresolved' },
      { level: 'MEDIUM', text: 'Digital adoption gap → neobank churn — 180,000 customers at risk' },
    ],
    apexretail: [
      { level: 'HIGH', text: 'Einstein idle → personalization gap compounding — competitors accelerating' },
      { level: 'HIGH', text: 'SAP ECC EOS 2027 → forced migration decision with 8,400 customizations' },
      { level: 'HIGH', text: 'o9 at 40% → $6.8M paid, $180M inventory still trapped' },
      { level: 'MEDIUM', text: 'CDP fragmentation → CCPA compliance risk + personalization blocked' },
      { level: 'MEDIUM', text: '68% store turnover → AI training investment wasted on staff who leave' },
    ],
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
      {/* Panel 1: Financial Risk */}
      <div style={{ background: T.surface, border: '1px solid ' + T.border, borderRadius: '10px', padding: '20px' }}>
        <div style={{ marginBottom: '6px' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: T.text3, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px', fontFamily: T.mono }}>FINANCIAL RISK</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: T.red }}>${total}M</div>
        </div>
        <div style={{ borderTop: '1px solid ' + T.border, paddingTop: '14px' }}>
          {risks.map(r => (
            <div key={r.label} style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '11px', color: T.text2 }}>{r.label}</span>
                <span style={{ fontSize: '11px', fontWeight: 700, color: T.red }}>${r.amount}M</span>
              </div>
              <div style={{ height: '4px', background: T.border2, borderRadius: '2px' }}>
                <div style={{ height: '100%', background: T.red, borderRadius: '2px', width: `${(r.amount / maxRisk) * 100}%`, transition: 'width 600ms ease' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Panel 2: Strategic Risk */}
      <div style={{ background: T.surface, border: '1px solid ' + T.border, borderRadius: '10px', padding: '20px' }}>
        <div style={{ fontSize: '10px', fontWeight: 700, color: T.text3, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px', fontFamily: T.mono }}>
          STRATEGIC RISK · {strategicRisks[clientId].filter(r => r.level === 'HIGH').length} HIGH · {strategicRisks[clientId].filter(r => r.level === 'MEDIUM').length} MEDIUM
        </div>
        {strategicRisks[clientId].map((r, i) => (
          <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
            <span style={{ fontSize: '9px', fontWeight: 800, color: r.level === 'HIGH' ? T.red : T.amber, background: (r.level === 'HIGH' ? T.red : T.amber) + '15', border: '1px solid ' + (r.level === 'HIGH' ? T.red : T.amber) + '40', borderRadius: '4px', padding: '2px 6px', height: 'fit-content', flexShrink: 0, fontFamily: T.mono }}>{r.level}</span>
            <span style={{ fontSize: '12px', color: T.text2, lineHeight: 1.5 }}>{r.text}</span>
          </div>
        ))}
      </div>

      {/* Panel 3: Timeline Risk */}
      <div style={{ background: T.surface, border: '1px solid ' + T.border, borderRadius: '10px', padding: '20px' }}>
        <div style={{ fontSize: '10px', fontWeight: 700, color: T.text3, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '20px', fontFamily: T.mono }}>TIMELINE RISK</div>
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: '7px', top: 0, bottom: 0, width: '1px', background: T.border2 }} />
          {timeline.map((ev, i) => (
            <div key={i} style={{ display: 'flex', gap: '14px', marginBottom: '18px', position: 'relative', paddingLeft: '24px' }}>
              <span style={{ position: 'absolute', left: 0, top: '3px', width: '15px', height: '15px', borderRadius: '50%', background: ev.urgency === 'red' ? T.red : T.amber, flexShrink: 0, border: '2px solid ' + T.bg }} />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: T.text, marginBottom: '2px' }}>{ev.label}</div>
                <div style={{ fontSize: '11px', color: T.text3 }}>{ev.note}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Zone 4 ───────────────────────────────────────────────────────────────────

function Zone4({ clientId, role }: { clientId: ClientId; role: RoleId }) {
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState('')
  const [loading, setLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const questions = (PRE_BUILT_QUESTIONS[clientId]?.[role] ?? PRE_BUILT_QUESTIONS[clientId]?.Maestro ?? []) as string[]

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streaming])

  const send = useCallback(async (text: string) => {
    if (!text.trim() || loading) return
    setLoading(true)
    setInput('')
    const next = [...messages, { role: 'user', content: text }]
    setMessages(next)

    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl

    try {
      const res = await fetch('/api/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next, clientId, role }),
        signal: ctrl.signal,
      })
      if (!res.ok || !res.body) throw new Error('Stream failed')
      const reader = res.body.getReader()
      const dec = new TextDecoder()
      let acc = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        acc += dec.decode(value, { stream: true })
        setStreaming(acc)
      }
      setMessages(m => [...m, { role: 'assistant', content: acc }])
      setStreaming('')
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setMessages(m => [...m, { role: 'assistant', content: 'Something went wrong. Please try again.' }])
      }
    } finally {
      setLoading(false)
    }
  }, [messages, clientId, role, loading])

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '20px', minHeight: '500px' }}>
      {/* Pre-built questions */}
      <div>
        <div style={{ fontSize: '10px', fontWeight: 700, color: T.text3, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px', fontFamily: T.mono }}>
          {role} QUESTIONS
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {questions.map((q, i) => (
            <button
              key={i}
              onClick={() => send(q)}
              disabled={loading}
              style={{ padding: '10px 12px', background: T.surface, border: '1px solid ' + T.border2, borderRadius: '8px', fontSize: '12px', color: T.text2, cursor: 'pointer', fontFamily: T.sans, textAlign: 'left', lineHeight: 1.4, transition: 'all 120ms' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = T.teal + '50'; (e.currentTarget as HTMLElement).style.color = T.text }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = T.border2; (e.currentTarget as HTMLElement).style.color = T.text2 }}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Chat panel */}
      <div style={{ display: 'flex', flexDirection: 'column', background: T.surface, border: '1px solid ' + T.border, borderRadius: '10px', overflow: 'hidden' }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', maxHeight: '420px', minHeight: '320px' }}>
          {messages.length === 0 && !streaming && (
            <div style={{ padding: '32px', textAlign: 'center', color: T.text3 }}>
              <div style={{ fontSize: '14px', marginBottom: '8px' }}>Ask anything about {CLIENT_META[clientId].name}.</div>
              <div style={{ fontSize: '12px' }}>Every response cites its source.</div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: m.role === 'user' ? T.teal : T.purple, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '6px', fontFamily: T.mono }}>
                {m.role === 'user' ? role : 'ABARVA'}
              </div>
              <div style={{ fontSize: '14px', color: T.text, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{m.content}</div>
            </div>
          ))}
          {streaming && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: T.purple, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '6px', fontFamily: T.mono }}>ABARVA</div>
              <div style={{ fontSize: '14px', color: T.text, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{streaming}</div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        <div style={{ padding: '12px', borderTop: '1px solid ' + T.border, display: 'flex', gap: '8px' }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send(input))}
            placeholder="Ask anything about this client…"
            style={{ flex: 1, padding: '10px 14px', background: T.bg, border: '1px solid ' + T.border2, borderRadius: '8px', color: T.text, fontSize: '13px', fontFamily: T.sans, outline: 'none' }}
          />
          <button
            onClick={() => send(input)}
            disabled={loading || !input.trim()}
            style={{ padding: '10px 20px', background: loading ? T.surface2 : T.teal, color: loading ? T.text3 : '#0D1117', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: loading ? 'default' : 'pointer', fontFamily: T.sans }}
          >
            {loading ? '…' : '→'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Zone 5 ───────────────────────────────────────────────────────────────────

function Zone5({ clientId, role }: { clientId: ClientId; role: RoleId }) {
  const actions = ACTIONS[clientId]
  const [expanded, setExpanded] = useState<number | null>(null)
  const horizons: Array<{ key: 'week' | 'month' | 'quarter'; label: string }> = [
    { key: 'week', label: 'THIS WEEK' },
    { key: 'month', label: 'THIS MONTH' },
    { key: 'quarter', label: 'THIS QUARTER' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {horizons.map(h => {
        const hActions = actions.filter(a => a.horizon === h.key)
        if (!hActions.length) return null
        return (
          <div key={h.key} style={{ background: T.surface, border: '1px solid ' + T.border, borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid ' + T.border, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: T.surface2 }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: T.text, letterSpacing: '0.08em', fontFamily: T.mono }}>{h.label}</span>
              <span style={{ fontSize: '11px', color: T.text3 }}>{hActions.length} action{hActions.length > 1 ? 's' : ''}</span>
            </div>
            {hActions.map(a => (
              <div key={a.n} style={{ borderBottom: '1px solid ' + T.border }}>
                <button
                  onClick={() => setExpanded(expanded === a.n ? null : a.n)}
                  style={{ width: '100%', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: T.sans, textAlign: 'left', display: 'flex', alignItems: 'flex-start', gap: '12px' }}
                >
                  <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: T.teal + '20', border: '1px solid ' + T.teal + '40', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, color: T.teal, flexShrink: 0, fontFamily: T.mono }}>{a.n}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: T.text, marginBottom: '4px' }}>{a.title}</div>
                    <div style={{ fontSize: '12px', color: T.text3 }}>{a.rationale}</div>
                  </div>
                  <span style={{ fontSize: '14px', color: T.text3, flexShrink: 0 }}>{expanded === a.n ? '−' : '+'}</span>
                </button>
                {expanded === a.n && (
                  <div style={{ padding: '0 16px 16px 50px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                    {[
                      { label: 'Owner', value: a.owner },
                      { label: 'Impact', value: a.impact },
                      { label: 'Effort', value: a.effort },
                    ].map(m => (
                      <div key={m.label} style={{ padding: '8px 12px', background: T.bg, border: '1px solid ' + T.border, borderRadius: '6px' }}>
                        <div style={{ fontSize: '9px', fontWeight: 700, color: T.text3, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px', fontFamily: T.mono }}>{m.label}</div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: T.text }}>{m.value}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}

// ─── Zone 6 ───────────────────────────────────────────────────────────────────

function Zone6({ clientId, role }: { clientId: ClientId; role: RoleId }) {
  const meta = CLIENT_META[clientId]
  const issues = ISSUES[clientId]
  const critical = issues.filter(i => i.severity === 'critical').length
  const actions = ACTIONS[clientId]
  const totalRisk = FINANCIAL_RISKS[clientId].reduce((s, r) => s + r.amount, 0)

  function downloadBrief() {
    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8">
<title>AbarVa Situation Brief — ${meta.name}</title>
<style>
  body { font-family: 'Inter', system-ui, sans-serif; color: #1a1a2e; margin: 0; padding: 40px; max-width: 900px; }
  h1 { font-size: 22px; font-weight: 800; margin: 0 0 4px; }
  .meta { font-size: 13px; color: #6B7280; margin-bottom: 32px; }
  h2 { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #6B7280; margin: 24px 0 10px; border-top: 1px solid #E5E7EB; padding-top: 16px; }
  .issue { border-left: 3px solid #EF4444; padding: 10px 14px; margin-bottom: 8px; background: #FFF5F5; border-radius: 0 6px 6px 0; }
  .issue.warning { border-color: #F59E0B; background: #FFFBEB; }
  .issue-title { font-size: 14px; font-weight: 700; margin-bottom: 4px; }
  .issue-impact { font-size: 12px; color: #EF4444; font-weight: 600; }
  .action { display: flex; gap: 10px; padding: 8px 0; border-bottom: 1px solid #E5E7EB; font-size: 13px; }
  .footer { margin-top: 48px; font-size: 11px; color: #9CA3AF; border-top: 1px solid #E5E7EB; padding-top: 16px; }
  .abarva { font-weight: 800; color: #2DD4C8; }
</style>
</head>
<body>
<div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;">
  <span class="abarva" style="font-size:20px;">AbarVa</span>
  <span style="font-size:12px;color:#6B7280;">Situation Intelligence</span>
</div>
<h1>${meta.name} — Situation Brief</h1>
<div class="meta">${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} · ${role} view · ${meta.confidence}% data confidence</div>

<h2>${critical} Critical Issues · $${totalRisk}M+ at risk</h2>
${issues.map(i => `<div class="issue ${i.severity === 'warning' ? 'warning' : ''}">
  <div class="issue-title">${i.title}</div>
  <div>${i.body}</div>
  <div class="issue-impact">${i.impact} · ${i.owner}</div>
</div>`).join('')}

<h2>Priority Actions</h2>
${actions.slice(0, 5).map(a => `<div class="action"><strong>${a.n}.</strong> <div><strong>${a.title}</strong><br>${a.rationale} · Owner: ${a.owner}</div></div>`).join('')}

<div class="footer">
  Generated by <span class="abarva">AbarVa Intelligence</span> · Data confidence ${meta.confidence}% · ${new Date().toISOString().split('T')[0]}<br>
  "What McKinsey charges $1.8M and 8 weeks to produce. This took 4 minutes."
</div>
</body>
</html>`
    const blob = new Blob([html], { type: 'text/html' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `AbarVa_Situation_Brief_${clientId}_${new Date().toISOString().split('T')[0]}.html`
    a.click()
  }

  return (
    <div style={{ maxWidth: '620px', margin: '0 auto', background: T.surface, border: '1px solid ' + T.border, borderTop: '3px solid ' + meta.color, borderRadius: '12px', padding: '32px' }}>
      <div style={{ fontSize: '11px', fontWeight: 700, color: T.text3, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px', fontFamily: T.mono }}>YOUR SITUATION BRIEF IS READY</div>
      <div style={{ fontSize: '20px', fontWeight: 800, color: T.text, marginBottom: '6px' }}>{meta.name}</div>
      <div style={{ fontSize: '13px', color: T.text3, marginBottom: '24px' }}>
        {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} · {role} view
      </div>

      <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {[
          `${critical} critical issues with data sources`,
          `$${totalRisk}M+ at risk, broken down by category`,
          `${ACTIONS[clientId].length} prioritized actions with owners and timelines`,
          `Contradiction map with source attribution`,
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <span style={{ color: T.teal, flexShrink: 0 }}>•</span>
            <span style={{ fontSize: '13px', color: T.text2 }}>{item}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
        <button
          onClick={downloadBrief}
          style={{ padding: '14px 20px', background: meta.color, color: '#0D1117', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 800, cursor: 'pointer', fontFamily: T.sans }}
        >
          Download Situation Brief →
        </button>
        <a
          href={'/ai-strategy?client=' + clientId}
          style={{ padding: '14px 20px', background: T.purple + '20', border: '1px solid ' + T.purple + '40', borderRadius: '8px', fontSize: '14px', fontWeight: 700, color: T.purple, textDecoration: 'none', textAlign: 'center', display: 'block' }}
        >
          Build AI Strategy from this →
        </a>
      </div>

      <div style={{ padding: '16px', background: T.bg, border: '1px solid ' + T.border, borderRadius: '8px', textAlign: 'center' }}>
        <div style={{ fontSize: '12px', color: T.text3, fontStyle: 'italic' }}>
          "What McKinsey charges $1.8M and 8 weeks to produce. This took 4 minutes."
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

function DiagnoseContent() {
  const searchParams = useSearchParams()
  const clientId = (searchParams.get('client') || 'meridian') as ClientId
  const [activeClient, setActiveClient] = useState<ClientId>(clientId)
  const [step, setStep] = useState(1)
  const [role, setRole] = useState<RoleId>('CIO')
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set<number>())
  const [confidence, setConfidence] = useState(0)

  const meta = CLIENT_META[activeClient]
  const issues = ISSUES[activeClient]
  const ROLES: RoleId[] = activeClient === 'apexretail'
    ? ['CMO', 'CFO', 'COO', 'CEO', 'CIO', 'Maestro']
    : activeClient === 'firstcapital'
      ? ['CIO', 'CFO', 'COO', 'CMO', 'CEO', 'Maestro']
      : ['CIO', 'CFO', 'COO', 'CMIO', 'CEO', 'Maestro']

  // Animate confidence on load / client change
  useEffect(() => {
    setConfidence(0)
    const target = meta.confidence
    let n = 0
    const tick = setInterval(() => {
      n = Math.min(n + 2, target)
      setConfidence(n)
      if (n >= target) clearInterval(tick)
    }, 18)
    return () => clearInterval(tick)
  }, [activeClient, meta.confidence])

  function advanceStep() {
    const next = Math.min(step + 1, 6)
    setCompletedSteps(prev => new Set([...prev, step])) // mark current step complete before advancing
    setStep(next)
  }

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.sans, color: T.text, paddingBottom: '80px' }}>
      <AbarvaNav clientId={activeClient} activePage="diagnose" />

      {/* Product header */}
      <div style={{ background: T.surface, borderBottom: '1px solid ' + T.border, padding: '20px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '10px', fontWeight: 800, color: T.teal, letterSpacing: '0.14em', fontFamily: T.mono, marginBottom: '8px' }}>
              ⚡ SITUATION INTELLIGENCE
            </div>
            <div style={{ fontSize: '28px', fontWeight: 500, color: T.text, marginBottom: '12px', maxWidth: '640px', lineHeight: 1.3, fontFamily: "'Fraunces', Georgia, serif" }}>
              "What's actually broken — and what is it costing you?"
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '13px', color: T.text3 }}>
                Data confidence: <span style={{ fontWeight: 700, color: confidence >= meta.confidence ? meta.color : T.amber }}>{confidence}%</span>
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                {(['meridian', 'firstcapital', 'apexretail'] as ClientId[]).map(c => (
                  <button
                    key={c}
                    onClick={() => { setActiveClient(c); setStep(1); setCompletedSteps(new Set([1])) }}
                    style={{ padding: '4px 12px', background: activeClient === c ? CLIENT_META[c].color + '20' : 'transparent', border: '1px solid ' + (activeClient === c ? CLIENT_META[c].color + '60' : T.border), borderRadius: '6px', fontSize: '11px', fontWeight: activeClient === c ? 700 : 500, color: activeClient === c ? CLIENT_META[c].color : T.text3, cursor: 'pointer', fontFamily: T.sans }}
                  >
                    {CLIENT_META[c].name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: T.text3, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px', fontFamily: T.mono }}>VIEWING AS</div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: T.text }}>{role}</div>
          </div>
        </div>
      </div>

      {/* Step navigator */}
      <StepNav step={step} setStep={n => { if (n !== step) { setCompletedSteps(prev => new Set([...prev, step])); setStep(n) } }} completedSteps={completedSteps} />

      {/* Zone content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px' }}>

        {/* Step title */}
        <div style={{ marginBottom: '24px', textAlign: 'left' }}>
          {step === 1 && (
            <>
              <h1 style={{ fontSize: '18px', fontWeight: 700, color: T.text, margin: '0 0 4px', textAlign: 'left', fontFamily: T.sans }}>What&apos;s Happening at {meta.name}</h1>
              <p style={{ fontSize: '13px', color: T.text2, margin: 0, textAlign: 'left' }}>
                {issues.filter(i => i.severity === 'critical').length} critical issues · {issues.filter(i => i.severity === 'warning').length} warnings · sorted by relevance to {role}
              </p>
            </>
          )}
          {step === 2 && (
            <>
              <h1 style={{ fontSize: '24px', fontWeight: 800, color: T.text, margin: '0 0 6px' }}>Why It's Happening — Contradiction Map</h1>
              <p style={{ fontSize: '14px', color: T.text2, margin: 0 }}>What was reported vs. what the data actually shows.</p>
            </>
          )}
          {step === 3 && (
            <>
              <h1 style={{ fontSize: '24px', fontWeight: 800, color: T.text, margin: '0 0 6px' }}>What's At Risk</h1>
              <p style={{ fontSize: '14px', color: T.text2, margin: 0 }}>Financial exposure, strategic risk, and hard deadlines.</p>
            </>
          )}
          {step === 4 && (
            <>
              <h1 style={{ fontSize: '24px', fontWeight: 800, color: T.text, margin: '0 0 6px' }}>Ask Anything</h1>
              <p style={{ fontSize: '14px', color: T.text2, margin: 0 }}>Every answer cites its source. Pre-loaded with {role} questions.</p>
            </>
          )}
          {step === 5 && (
            <>
              <h1 style={{ fontSize: '24px', fontWeight: 800, color: T.text, margin: '0 0 6px' }}>What To Do Next</h1>
              <p style={{ fontSize: '14px', color: T.text2, margin: 0 }}>Prioritized actions by time horizon, with owners and impact.</p>
            </>
          )}
          {step === 6 && (
            <>
              <h1 style={{ fontSize: '24px', fontWeight: 800, color: T.text, margin: '0 0 6px' }}>Situation Brief Ready</h1>
              <p style={{ fontSize: '14px', color: T.text2, margin: 0 }}>Board-ready, one click. All findings, all sources.</p>
            </>
          )}
        </div>

        {step === 1 && <Zone1 issues={issues} role={role} clientId={activeClient} />}
        {step === 2 && <Zone2 clientId={activeClient} />}
        {step === 3 && <Zone3 clientId={activeClient} />}
        {step === 4 && <Zone4 clientId={activeClient} role={role} />}
        {step === 5 && <Zone5 clientId={activeClient} role={role} />}
        {step === 6 && <Zone6 clientId={activeClient} role={role} />}

        {/* Next step button (not on last step) */}
        {step < 6 && (
          <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={advanceStep}
              style={{ padding: '12px 28px', background: T.teal, color: '#060A12', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 800, cursor: 'pointer', fontFamily: T.sans }}
            >
              {step === 4 ? 'Move to Actions →' : step === 5 ? 'Get Your Brief →' : 'Next →'}
            </button>
          </div>
        )}
      </div>

      {/* Role switcher — persistent bottom bar */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#0A1628', borderTop: '1px solid ' + T.border, padding: '10px 32px', display: 'flex', alignItems: 'center', gap: '6px', zIndex: 40 }}>
        <span style={{ fontSize: '10px', fontWeight: 700, color: T.text2, letterSpacing: '0.1em', marginRight: '10px', fontFamily: T.mono }}>VIEWING AS:</span>
        {ROLES.map(r => (
          <button
            key={r}
            onClick={() => setRole(r)}
            style={{
              padding: '5px 14px',
              background: role === r ? T.teal : 'transparent',
              border: '1px solid ' + (role === r ? T.teal : 'rgba(239,246,255,0.2)'),
              borderRadius: '6px',
              fontSize: '12px', fontWeight: role === r ? 700 : 500,
              color: role === r ? '#060A12' : '#EFF6FF',
              cursor: 'pointer', fontFamily: T.sans,
            }}
          >
            {r}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function DiagnosePage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#0D1117' }} />}>
      <DiagnoseContent />
    </Suspense>
  )
}
