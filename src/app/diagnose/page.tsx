'use client'
import { useState, useRef, useEffect, Suspense, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { filterIssuesByRole } from '@/lib/situation-intelligence'
import { meridianHealth } from '@/data/meridian/index'
import { firstCapital } from '@/data/firstcapital/index'
import { apexRetail } from '@/data/apexretail/index'
import { arcturusFinancial } from '@/data/arcturus/index'
import { nexoraRetail } from '@/data/nexora/index'

// ─── Theme ────────────────────────────────────────────────────────────────────

const T = {
  bg: '#060A12', surface: '#0D1520', surface2: '#162030',
  border: '#1C2D45', border2: '#2D3748',
  text: '#EFF6FF', text2: '#94A3B8', text3: '#94A3B8',
  teal: '#2DD4C8', blue: '#6366F1', amber: '#F59E0B',
  red: '#EF4444', green: '#10B981', purple: '#A371F7',
  mono: 'JetBrains Mono, Menlo, monospace',
  sans: 'DM Sans, Inter, system-ui, sans-serif',
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Severity = 'critical' | 'warning' | 'watch'
type RoleId = 'CIO' | 'CFO' | 'COO' | 'CMIO' | 'CEO' | 'CMO' | 'CRO' | 'Maestro'
type ClientId = 'meridian' | 'firstcapital' | 'apexretail' | 'arcturus' | 'nexora'

interface IssueSource { data: string; industry: string; genome: string }
interface Issue {
  id: string; severity: Severity; title: string
  body: string; impact: string; owner: string; roles: RoleId[]
  category: string; sources: IssueSource
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
      roles:['CFO','COO','CEO'], category:'rcm',
      sources: { data:'Ensemble Health Partners claims extract · Nov 2025', industry:'HFMA denial rate benchmark: 12.1% peer median', genome:'4 of 5 comparable systems resolved via prior auth automation' } },
    { id:'M02', severity:'critical', title:'CDO Role Vacant — AI Program Stalled',
      body:`CDO vacant 8 months. ${meridianAI_pilotsPurgatory()} AI pilots frozen. Three vendor decisions awaiting executive sign-off. AI program leadership gap is compounding every week.`,
      impact:'$42M stalled', owner:'CEO',
      roles:['CEO','CIO'], category:'ai',
      sources: { data:'HR vacancy report · Apr 2026', industry:'50% of health systems with CDO vacancy stall AI program', genome:'CDO absence correlates with 73% AI program failure rate in Genome' } },
    { id:'M03', severity:'critical', title:'Travel Nurse Cost $20M Over Target',
      body:`Travel nurse spend at $48M — $20M above the $28M operating target. Dependency has grown 3 consecutive quarters. No reduction roadmap in board materials.`,
      impact:'$20M / yr', owner:'COO + CNO',
      roles:['COO','CFO','CEO'], category:'workforce',
      sources: { data:'Labor cost ledger · Q4 FY2025', industry:'Travel nurse premium: 2.4× permanent equivalent rate', genome:'3 comparable systems reduced travel nurse spend 40% in 18 months via float pool' } },
    { id:'M04', severity:'warning', title:`Epic Optimization at ${meridianHealth.technology.ehr.optimizationScore}/100`,
      body:`Seven years post go-live, Epic optimization at ${meridianHealth.technology.ehr.optimizationScore} of 100. Six modules not yet activated. CMS value-based incentive at risk.`,
      impact:'$34M at risk', owner:'CMIO + CIO',
      roles:['CMIO','CIO','CFO'], category:'epic',
      sources: { data:'Epic optimization audit score · Mar 2026', industry:'Top-quartile health systems average 88/100 Epic score', genome:'Unrealized value per unactivated module: $2.1M avg from Genome' } },
    { id:'M05', severity:'warning', title:'Prior Auth Coverage: 23% vs 62% Peer',
      body:`Only ${meridianHealth.technology.ehr.knownGaps[3]?.includes('23%') ? '23' : '23'}% of payers have connected prior authorization — peers average 62%. Manual auth driving ${meridianHealth.technology.rcm.priorAuthAvgDays}-day average vs ${meridianHealth.technology.rcm.priorAuthPeerDays}-day peer median.`,
      impact:'Payer risk rising', owner:'CMIO + COO',
      roles:['CMIO','COO','CFO'], category:'prior_auth',
      sources: { data:'Payer connection audit · Nov 2025', industry:'62% peer prior auth automation rate · HFMA 2025', genome:'23% payer connection drives 4.2-day avg — Genome median is 1.8 days' } },
    { id:'M06', severity:'warning', title:`MA Star ${meridianHealth.healthPlan.medicareAdvantage.starRating} — Bonus Threshold Is 4.0`,
      body:`Medicare Advantage at ${meridianHealth.healthPlan.medicareAdvantage.starRating} stars — below the 4.0 threshold for maximum CMS bonus payments. Star measurement period closes in 8 months.`,
      impact:'$34M bonus at risk', owner:'CMO + CFO',
      roles:['CFO','CEO'], category:'clinical',
      sources: { data:'CMS HEDIS quality data · FY2025', industry:'4.0★ threshold for maximum CMS quality bonus payment', genome:'Star 3.2 → 4.0 transition delivers $34M annual bonus delta from Genome' } },
    { id:'M07', severity:'watch', title:'AI Pilots: Zero Have Scaled',
      body:`6 AI initiatives active. Zero have scaled beyond pilot. $42M invested with no documented outcome against any baseline.`,
      impact:'$42M untracked', owner:'CIO + CDO (vacant)',
      roles:['CIO','CEO'], category:'ai',
      sources: { data:'AI investment register · Apr 2026', industry:'$42M AI portfolio — zero outcome documentation', genome:'6 of 6 pilots lack baseline measurement — pattern in Genome: 91% failure rate' } },
  ],
  firstcapital: [
    { id:'FC01', severity:'critical', title:`Digital Adoption ${firstCapital.org.digitalAdoption}% vs 67% Benchmark`,
      body:`Digital adoption at ${firstCapital.org.digitalAdoption}% vs 67% peer benchmark. Mobile app rating 3.2/5. 180,000 customers at churn risk to neobanks offering same-day accounts.`,
      impact:'$48M revenue gap', owner:'CMO + CEO',
      roles:['CMO','CEO','CFO'], category:'digital',
      sources: { data:'Segment analytics platform · Mar 2026', industry:'67% peer digital adoption benchmark · Forrester 2025', genome:'180K customers at neobank churn risk — same pattern in 3 Genome regional banks' } },
    { id:'FC02', severity:'critical', title:'Core Banking System — 22 Years Old',
      body:`FIS HORIZON implemented 2004 — 22 years without modernization. Real-time AI scoring blocked by architecture. 76% of peer banks have modernized or added API layer.`,
      impact:'AI roadmap blocked', owner:'CTO + Board',
      roles:['CIO','CEO','CFO'], category:'technology',
      sources: { data:'IT architecture review · Apr 2026', industry:'76% of peer banks modernized or added API layer', genome:'FIS HORIZON → AI scoring latency: 2.3s avg in Genome vs 50ms with API layer' } },
    { id:'FC03', severity:'critical', title:'FedNow Not Live — January 2027 Deadline',
      body:`FedNow compliance: not achieved. ${firstCapital.technology.payments.peerBanksOnFedNow}% of peer banks are live. Commercial clients are asking. January 2027 is the hard regulatory deadline.`,
      impact:'$180M deposits at risk', owner:'CTO + COO',
      roles:['CIO','CFO','CEO'], category:'technology',
      sources: { data:'IT project register · Apr 2026', industry:'76% of peer banks live on FedNow · Federal Reserve 2025', genome:'Commercial client loss accelerates at 18 months non-compliance — Genome pattern' } },
    { id:'FC04', severity:'warning', title:'AI Spend With Zero Tracked Outcomes',
      body:`3 AI initiatives active, $1.6M invested. 0 have tracked outcomes against any baseline. Fraud Detection stuck in credit card only scope for 6 months.`,
      impact:'$1.6M untracked', owner:'CTO + CDO',
      roles:['CIO','CFO'], category:'ai',
      sources: { data:'AI investment ledger · Mar 2026', industry:'$1.6M invested — 0 tracked baselines out of 3 initiatives', genome:'Fraud detection scope-lock pattern: 4 of 5 Genome banks expanded after card-only start' } },
    { id:'FC05', severity:'warning', title:`Cost-to-Income ${firstCapital.org.costToIncomeRatio}% vs 55% Target`,
      body:`Cost-to-income at ${firstCapital.org.costToIncomeRatio}% — ${(firstCapital.org.costToIncomeRatio - 55).toFixed(0)}pp above the 55% best-in-class benchmark. Compliance cost alone is 34% of IT budget.`,
      impact:'$99M annual gap', owner:'CFO + CEO',
      roles:['CFO','COO','CEO'], category:'financial',
      sources: { data:'P&L statement · Q4 FY2025', industry:'55% best-in-class C/I ratio · McKinsey Banking 2025', genome:'Compliance IT at 34% of IT budget — top-quartile banks run at 18%' } },
  ],
  apexretail: [
    { id:'AX01', severity:'critical', title:'Einstein AI Licensed and Never Activated',
      body:`Salesforce Einstein purchased in the SFCC license. Never activated. 18 million loyalty members receiving identical, untailored experiences while competitors personalize in real time.`,
      impact:'$248M idle', owner:'CMO + CTO',
      roles:['CMO','CEO','CFO'], category:'ai',
      sources: { data:'Salesforce Einstein activation audit · Mar 2026', industry:'18M loyalty members — zero personalization ROI realized', genome:'Einstein idle license: Genome shows 100% activation rate among top-10 retailers' } },
    { id:'AX02', severity:'critical', title:'Cart Abandonment 14pp Above Benchmark',
      body:`72% cart abandonment vs 58% benchmark — an $840M recovery opportunity. Real-time trigger infrastructure via Segment and Klaviyo already exists. Not connected.`,
      impact:'$840M opportunity', owner:'CMO + CTO',
      roles:['CMO','CFO','CEO'], category:'digital',
      sources: { data:'eCommerce platform audit · Mar 2026', industry:'58% peer cart abandonment benchmark · Baymard 2025', genome:'Segment + Klaviyo idle: Genome shows $840M recovery opportunity within 90 days of connection' } },
    { id:'AX03', severity:'warning', title:`Inventory Turns ${apexRetail.financials.inventoryTurnover}x vs 6.8x Benchmark`,
      body:`Inventory turns at ${apexRetail.financials.inventoryTurnover}x vs 6.8x benchmark. $180M excess inventory on the balance sheet. o9 demand forecasting 40% implemented after 18 months.`,
      impact:'$180M tied up', owner:'CFO + CSCO',
      roles:['CFO','COO','CEO'], category:'operations',
      sources: { data:'ERP + o9 project review · Mar 2026', industry:'6.8x peer inventory turns benchmark · Gartner Retail 2025', genome:'o9 at 40% after 18 months — Genome: 3 comparable retailers reached 85%+ in same window' } },
    { id:'AX04', severity:'warning', title:'$38M Untracked Shadow IT Spend',
      body:`28,000 store employees using untracked SaaS tools. $38M in shadow IT spend. CDO role vacant — no AI strategy ownership. 8,400 SAP customizations blocking data flow.`,
      impact:'$38M unmanaged', owner:'CTO + CFO',
      roles:['CIO','CFO'], category:'technology',
      sources: { data:'IT spend audit · Apr 2026', industry:'Shadow IT spend at $38M across 28,000 store employees', genome:'8,400 SAP customizations blocking data flow — Genome: ECC EOS 2027 forces decision' } },
  ],
  arcturus: [
    { id:'AR01', severity:'critical', title:'$94M AI Investment — Zero Documented ROI',
      body:'28 AI initiatives active. 0 have documented baselines or outcome tracking. $94M committed. $0 return verified. CFO cannot defend this at the next board meeting.',
      impact:'$94M untracked', owner:'CIO + CFO',
      roles:['CFO','CIO','CEO'], category:'ai',
      sources: { data:'AI investment register · Apr 2026', industry:'$94M AI portfolio — zero outcome documentation across 28 initiatives', genome:'0 of 28 with baselines — Genome shows 91% failure rate for ungoverned AI portfolios' } },
    { id:'AR02', severity:'critical', title:'CDO Role Vacant 11 Months — 14 AI Initiatives Blocked',
      body:`CDO vacant 11 months. 14 of 28 AI initiatives cite CDO vacancy as primary stall reason. 3 search firms engaged with no hire. Every AI and data initiative is blocked or degraded.`,
      impact:'14 initiatives blocked', owner:'CEO',
      roles:['CEO','CIO'], category:'ai',
      sources: { data:'HR vacancy report · Apr 2026', industry:'Asset managers with CDO vacancy stall AI programme in 11+ months in 68% of cases', genome:'CDO absence correlates with 79% AI programme failure rate at this stage — Genome' } },
    { id:'AR03', severity:'critical', title:'MAS FEAT Overdue 4 Months — $2.4B AUM at Risk',
      body:'MAS FEAT explainability requirement overdue. Zero AI models have FEAT-compliant documentation. MAS supervisory action under consideration. $2.4B Singapore AUM at regulatory risk.',
      impact:'$2.4B AUM at risk', owner:'CRO + CEO',
      roles:['CEO','CFO'], category:'regulatory',
      sources: { data:'CRO regulatory report · Apr 2026', industry:'MAS FEAT deadline passed December 2025 — overdue 4 months', genome:'FEAT non-compliance at this stage carries $2.4B AUM exit risk based on Genome precedents' } },
    { id:'AR04', severity:'warning', title:'Cost-to-Income 71% vs 61% Peer Median — $840M Gap',
      body:'CIR at 71% vs 61% peer median. No credible cost-reduction programme in place. IT budget 35% above peer benchmark. AI efficiency gains stalled by CDO vacancy and governance freeze.',
      impact:'$840M efficiency gap', owner:'CFO + CEO',
      roles:['CFO','CEO','CIO'], category:'financial',
      sources: { data:'CFO financial data · Apr 2026', industry:'61% CIR peer median · McKinsey Asset Management 2025', genome:'AI-driven CIR improvement from 71% to 58% requires 18-24 months and a functional CDO — pattern in Genome' } },
    { id:'AR05', severity:'warning', title:'Salesforce FSC 44% Adoption — $38M Investment at Risk',
      body:'$38M invested in Salesforce FSC since August 2024. 44% adoption. NPS 31 vs industry median 58. SSO not wired to Bloomberg AIM — advisors have no reason to migrate.',
      impact:'$38M at risk', owner:'CIO + CRO',
      roles:['CIO','CFO'], category:'technology',
      sources: { data:'CTO data upload · Apr 2026', industry:'FSC adoption median: 72% at 18 months post go-live', genome:'44% adoption at 20 months matches Genome pattern: SSO gap is the #1 adoption blocker (87% correlation)' } },
    { id:'AR06', severity:'warning', title:'Aladdin Stress Testing Monthly vs SEC Daily Requirement',
      body:'BlackRock Aladdin configured for monthly stress testing. SEC requires daily cadence. 11-month gap in compliance with risk model regulatory requirement.',
      impact:'SEC regulatory exposure', owner:'CRO + Head of Technology',
      roles:['CFO','CIO'], category:'regulatory',
      sources: { data:'CRO compliance review · Apr 2026', industry:'SEC stress testing frequency requirement: daily for AUM above $500B', genome:'Monthly stress testing in daily-requirement context: direct SEC examination risk — Genome shows 3 exam failures on this specific gap' } },
  ],
  nexora: [
    { id:'NX01', severity:'critical', title:'Einstein AI Licensed 18 Months — Never Activated',
      body:`Salesforce Einstein licensed for 18 months. $14M/yr paid. Zero activation work started. 28.4M loyalty members receiving identical, untailored experiences. CIO and CMO ownership dispute unresolved.`,
      impact:'$248M idle', owner:'CMO + CIO',
      roles:['CMO','CEO','CFO'], category:'ai',
      sources: { data:'Salesforce Einstein activation audit · Apr 2026', industry:'28.4M loyalty members — zero personalisation ROI realised', genome:'Einstein idle license: 100% activation rate among top-10 global retailers — Genome' } },
    { id:'NX02', severity:'critical', title:'SAP R/3 EOL December 2027 — No Migration Programme',
      body:`SAP R/3 Continental Europe hits end-of-life December 2027. 20 months remaining. 8,200 customisations. No migration programme initiated. No budget allocated. No SI selected. Migration window is 18–24 months.`,
      impact:'$4.6B revenue region at risk', owner:'COO + CFO',
      roles:['COO','CFO','CEO'], category:'technology',
      sources: { data:'SAP EOL documentation + COO data upload · Apr 2026', industry:'SAP R/3 mainstream maintenance ends Dec 2025 — extended only until Dec 2027', genome:'ERP EOL <24 months with no migration plan: 83% failure rate — highest-risk Genome pattern' } },
    { id:'NX03', severity:'critical', title:'E-Commerce at -2.1% Margin — Growing Channel Destroying Blended Margin',
      body:'E-commerce running at -2.1% contribution margin. Revenue growing (22% of total). Every unit of ecommerce growth destroys blended margin. $346M excess fulfilment cost + $269M return cost = $615M annual drag.',
      impact:'$615M annual drag', owner:'CFO + CMO',
      roles:['CFO','CEO'], category:'financial',
      sources: { data:'CFO channel P&L · Apr 2026', industry:'E-commerce peer margin median: +2.8% (Nexora: -2.1%)', genome:'Negative ecom margin with growing channel: 64% of comparable retailers required fulfilment reset before margin recovery' } },
    { id:'NX04', severity:'warning', title:'o9 Demand Forecasting 40% After 18 Months — $900M Inventory Impact',
      body:`o9 demand forecasting 40% implemented after 18 months. $6.8M invested. Inventory turns 4.2x vs 6.8x benchmark. $900M excess inventory on balance sheet. Completion vs restart decision required.`,
      impact:'$900M trapped capital', owner:'COO + CFO',
      roles:['COO','CFO','CEO'], category:'operations',
      sources: { data:'COO operations data · Apr 2026', industry:'6.8x inventory turns benchmark · Gartner Retail 2025', genome:'o9 at 40% after 18 months — completion (85% success) vs restart (58% success) — Genome recommends completion' } },
    { id:'NX05', severity:'warning', title:'Shrinkage 2.8% vs 1.4% Benchmark — $259M Excess',
      body:'Shrinkage at 2.8% of revenue ($515M). Industry benchmark 1.4% ($257M). $259M excess annually. 12-store AI pilot proven 34% reduction. Scale decision pending with no executive sponsor named.',
      impact:'$259M above benchmark', owner:'COO + CEO',
      roles:['COO','CFO'], category:'operations',
      sources: { data:'COO shrinkage data · Apr 2026', industry:'1.4% industry median shrinkage rate', genome:'AI shrinkage detection pilot-to-scale: 71% success when executive sponsor named at start' } },
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
  arcturus: [
    { label: 'AI investment untracked ($94M)', amount: 94 },
    { label: 'CIR efficiency gap vs peer median', amount: 840 },
    { label: 'MAS FEAT — AUM at regulatory risk', amount: 2400 },
    { label: 'Salesforce FSC investment at risk', amount: 38 },
  ],
  nexora: [
    { label: 'Einstein idle (18 months)', amount: 248 },
    { label: 'E-commerce fulfilment drag ($615M)', amount: 615 },
    { label: 'Excess inventory ($900M)', amount: 900 },
    { label: 'Shrinkage excess vs benchmark', amount: 259 },
    { label: 'SAP R/3 migration (unfunded)', amount: 35 },
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
  arcturus: [
    { label: 'MAS FEAT overdue', note: '4 months past deadline — escalating', urgency: 'red' },
    { label: 'CDO hire', note: '11 months vacant — AI blocked', urgency: 'red' },
    { label: 'Aladdin cadence fix', note: 'Daily stress test required now', urgency: 'amber' },
    { label: 'Salesforce renewal', note: 'August 2026 — adoption at 44%', urgency: 'amber' },
  ],
  nexora: [
    { label: 'Einstein activation', note: '18 months idle — activate this week', urgency: 'red' },
    { label: 'SAP R/3 EOL', note: 'December 2027 — 20 months, no plan', urgency: 'red' },
    { label: 'o9 decision', note: 'Finish vs restart — Q2 2026 deadline', urgency: 'amber' },
    { label: 'SAP Oracle renewal', note: 'UK Oracle EBS Nov 2026', urgency: 'amber' },
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
  arcturus: [
    { n:1, horizon:'week', title:'MAS FEAT Remediation — Model Inventory This Week', rationale:'Overdue 4 months. MAS supervisory action imminent. $2.4B Singapore AUM at risk.', owner:'CRO + CIO', impact:'$2.4B AUM protected', effort:'3 months', risk:'HIGH' },
    { n:2, horizon:'week', title:'CDO Hire — Appoint Interim to Unblock 14 Initiatives', rationale:'11 months vacant. 14 of 28 AI initiatives explicitly blocked. Board will ask.', owner:'CEO', impact:'14 initiatives unblocked', effort:'1 week (interim)', risk:'HIGH' },
    { n:3, horizon:'month', title:'Aladdin Daily Stress Testing — Configuration Fix', rationale:'SEC requirement is daily. Running monthly. Direct regulatory exposure.', owner:'CRO + Head of Technology', impact:'SEC compliance', effort:'2 weeks', risk:'LOW' },
    { n:4, horizon:'month', title:'AI Portfolio Reset — Baseline Every Initiative', rationale:'$94M invested with zero documented outcomes. CFO board exposure next meeting.', owner:'CIO + CDO (interim)', impact:'$94M accountability', effort:'4 weeks', risk:'LOW' },
    { n:5, horizon:'month', title:'Salesforce FSC SSO — Bloomberg AIM Integration', rationale:'44% adoption driven by missing SSO. Advisors have no reason to switch without Bloomberg data.', owner:'Head of Technology', impact:'Adoption unblocked', effort:'8 weeks', risk:'MEDIUM' },
    { n:6, horizon:'quarter', title:'Golden Record Programme — CDO Led', rationale:'14 data silos. No golden record. 18 of 28 AI initiatives need this as foundation.', owner:'CDO (hire first)', impact:'18 AI initiatives unblocked', effort:'12 months', risk:'MEDIUM' },
  ],
  nexora: [
    { n:1, horizon:'week', title:'Einstein Ownership — Appoint Single Executive Now', rationale:'18 months idle due to CIO/CMO ownership dispute. Resolve this week.', owner:'CEO', impact:'$248M unblocked', effort:'1 week', risk:'LOW' },
    { n:2, horizon:'week', title:'SAP R/3 Migration — Start SI RFP Now', rationale:'EOL December 2027. 20 months left. Migration takes 18-24 months. No margin for delay.', owner:'COO + CFO', impact:'$4.6B revenue protected', effort:'3 months scoping', risk:'HIGH' },
    { n:3, horizon:'month', title:'Einstein Activation Sprint — 8 Weeks to Revenue', rationale:'$1.2M activation cost. $248M annual upside. 207:1 ROI. Highest-ROI action available.', owner:'CMO + CIO (joint ownership)', impact:'$248M activated', effort:'8 weeks', risk:'LOW' },
    { n:4, horizon:'month', title:'Cart Recovery — Connect Klaviyo + Segment', rationale:'Triggers built. Infrastructure paid for. Platform teams not coordinated.', owner:'CIO', impact:'$68M recovery', effort:'8 weeks', risk:'LOW' },
    { n:5, horizon:'month', title:'o9 Completion — Fixed-Fee Contract', rationale:'$6.8M invested, 40% done, $900M inventory at stake. Negotiate completion contract.', owner:'COO', impact:'$180M inventory freed', effort:'9 months', risk:'MEDIUM' },
    { n:6, horizon:'quarter', title:'Fulfilment Cost — Carrier Consolidation + Return Friction', rationale:'$615M annual drag from fulfilment + returns. CFO mandate: ecom margin positive.', owner:'CFO + COO', impact:'$269M fulfilment improvement', effort:'9 months', risk:'MEDIUM' },
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
  arcturus: {
    CIO: ['Golden record — what will it take and how long?','Bloomberg AIM API layer vs full replacement — what does the Genome say?','CDO interim vs external hire — fastest path to unblocking the AI programme?'],
    CFO: ['How do I defend the $94M AI spend at the next board meeting?','What is the fastest path to CIR improvement without a CDO?','Model risk governance — what does MAS FEAT actually require us to do?'],
    CRO: ['Which AI models are live and which have regulatory exposure right now?','FEAT remediation — what are the 3 most urgent actions?','SEC MRA — what is the remediation timeline?'],
    CEO: ['What is the board message on CDO vacancy?','How do we close the $840M CIR gap in 24 months?','What does an AI-native asset manager actually look like — and how far are we?'],
    Maestro: ['What data am I missing that would sharpen this picture?','Which finding needs the most urgent CXO attention?','Draft the CRO briefing on FEAT remediation'],
  },
  nexora: {
    CIO: ['Einstein — who owns the activation and why has it taken 18 months?','SAP R/3 migration — which SI should we talk to first?','o9 completion vs restart — what does the data say?'],
    CFO: ['E-commerce margin path to positive — what levers and what timeline?','SAP R/3 migration budget — what am I approving in the next 90 days?','ROI case for Einstein activation — what is the payback period?'],
    COO: ['o9 completion fixed-fee contract — what terms should I demand?','Inventory turns 4.2x to 6.0x — what is the realistic 18-month roadmap?','Shrinkage AI scale decision — what does the pilot data say about ROI?'],
    CMO: ['Einstein activation 8-week plan — who does what?','Loyalty active rate 42% to 65% — what is the 12-month programme?','Cart recovery 72% abandonment — what is blocking activation?'],
    Maestro: ['What data am I missing?','Which finding is most urgent?','Draft the CFO briefing on SAP migration decision'],
  },
}

const CLIENT_META: Record<ClientId, { name: string; confidence: number; color: string }> = {
  meridian: { name: 'Meridian Health System', confidence: 94, color: T.teal },
  firstcapital: { name: 'First Capital Financial', confidence: 81, color: T.blue },
  apexretail: { name: 'Apex Retail Group', confidence: 81, color: T.amber },
  arcturus: { name: 'Arcturus Financial Group', confidence: 88, color: T.blue },
  nexora: { name: 'Nexora Retail & Consumer', confidence: 87, color: T.teal },
}

const SEVERITY_COLOR: Record<Severity, string> = {
  critical: T.red, warning: T.amber, watch: T.text3,
}

// ─── Issue Metrics / KPI / Benchmark Data ─────────────────────────────────────

interface IssueMetric { label: string; current: string; benchmark: string; gap?: string }
interface KPIData {
  label: string; value: string; trend?: number[]
  direction?: 'up-bad' | 'down-bad'
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
  AR01: { label: 'AI ROI on $94M',    current: '$0 documented',   benchmark: '100% should track'                     },
  AR02: { label: 'CDO Vacancy',        current: '11 months',       benchmark: 'Filled'                                },
  AR03: { label: 'MAS FEAT',           current: 'Overdue 4 months',benchmark: 'Compliant Dec 2025'                    },
  AR04: { label: 'Cost-to-Income',     current: '71%',             benchmark: '61% peer median', gap: '+10pp'         },
  AR05: { label: 'FSC Adoption',       current: '44%',             benchmark: '72% avg', gap: '−28pp'                 },
  AR06: { label: 'Stress Test Freq',   current: 'Monthly',         benchmark: 'Daily (SEC req.)'                      },
  NX01: { label: 'Einstein Status',    current: 'Never activated', benchmark: '$14M/yr license paid'                  },
  NX02: { label: 'SAP R/3 Status',     current: 'EOL Dec 2027',    benchmark: 'Migration in progress'                 },
  NX03: { label: 'E-Com Margin',       current: '-2.1%',           benchmark: '+2.8% peer median', gap: '−4.9pp'      },
  NX04: { label: 'o9 Completion',      current: '40%',             benchmark: '100% in 18 months'                     },
  NX05: { label: 'Shrinkage Rate',     current: '2.8% ($515M)',    benchmark: '1.4% industry', gap: '+$259M/yr'       },
}

// Role-specific KPI tiles — each role sees metrics most relevant to their world
const ROLE_KPI_DATA: Record<ClientId, Record<string, KPIData[]>> = {
  meridian: {
    CIO: [
      { label: 'AI INITIATIVES',      value: '0 of 6 scaled', trend: [2, 4, 6],        target: '3 scaled',  gap: '$42M untracked',     sparkColor: '#EF4444' },
      { label: 'EPIC SCORE',          value: '61 / 100',      trend: [58, 59, 61],      target: '80 / 100',  gap: '$34M CMS risk',      sparkColor: '#F59E0B' },
      { label: 'PRIOR AUTH COV.',     value: '23%',           trend: [31, 27, 23],      target: '62%',       gap: '−39pp vs peers',     sparkColor: '#F59E0B' },
      { label: 'CDO VACANCY',         value: '8 months',      trend: [2, 5, 8],         target: 'Filled',    gap: 'AI program stalled', sparkColor: '#EF4444' },
    ],
    CFO: [
      { label: 'OPERATING MARGIN',    value: '1.8%',          trend: [3.2, 2.1, 1.8],  target: '4.0%',      gap: '$179M / yr gap',     sparkColor: '#EF4444' },
      { label: 'RCM DENIAL RATE',     value: '18.2%',         trend: [14.2, 16.8, 18.2],target: '12.1%',    gap: '$94M / yr at risk',  sparkColor: '#EF4444' },
      { label: 'TRAVEL NURSE COST',   value: '$48M',          trend: [38, 44, 48],      target: '$28M',      gap: '$20M over target',   sparkColor: '#EF4444' },
      { label: 'MA STAR RATING',      value: '3.2 ★',         trend: [3.8, 3.6, 3.2],  target: '4.0 ★',     gap: '$34M bonus at risk', sparkColor: '#F59E0B' },
    ],
    CMIO: [
      { label: 'EPIC SCORE',          value: '61 / 100',      trend: [58, 59, 61],      target: '88 / 100',  gap: '6 modules dark',     sparkColor: '#F59E0B' },
      { label: 'PRIOR AUTH DAYS',     value: '4.2d avg',      trend: [2.8, 3.6, 4.2],  target: '1.8d',      gap: '−2.4d vs peers',     sparkColor: '#EF4444' },
      { label: 'PRIOR AUTH COV.',     value: '23%',           trend: [31, 27, 23],      target: '62%',       gap: '3 payer contracts',  sparkColor: '#F59E0B' },
      { label: 'MA STAR RATING',      value: '3.2 ★',         trend: [3.8, 3.6, 3.2],  target: '4.0 ★',     gap: '$34M bonus at risk', sparkColor: '#F59E0B' },
    ],
    COO: [
      { label: 'TRAVEL NURSE COST',   value: '$48M',          trend: [38, 44, 48],      target: '$28M',      gap: '$20M over target',   sparkColor: '#EF4444' },
      { label: 'OPERATING MARGIN',    value: '1.8%',          trend: [3.2, 2.1, 1.8],  target: '4.0%',      gap: '$179M / yr gap',     sparkColor: '#EF4444' },
      { label: 'PRIOR AUTH DAYS',     value: '4.2d',          trend: [2.8, 3.6, 4.2],  target: '1.8d',      gap: 'Revenue delayed',    sparkColor: '#F59E0B' },
      { label: 'EPIC SCORE',          value: '61 / 100',      trend: [58, 59, 61],      target: '80 / 100',  gap: '$34M CMS risk',      sparkColor: '#F59E0B' },
    ],
    CEO: [
      { label: 'OPERATING MARGIN',    value: '1.8%',          trend: [3.2, 2.1, 1.8],  target: '4.0%',      gap: '$179M / yr gap',     sparkColor: '#EF4444' },
      { label: 'AI INITIATIVES',      value: '0 of 6 scaled', trend: [2, 4, 6],         target: '3 scaled',  gap: '$42M stalled',       sparkColor: '#F59E0B' },
      { label: 'MA STAR RATING',      value: '3.2 ★',         trend: [3.8, 3.6, 3.2],  target: '4.0 ★',     gap: '$34M bonus at risk', sparkColor: '#F59E0B' },
      { label: 'RCM DENIAL RATE',     value: '18.2%',         trend: [14.2, 16.8, 18.2],target: '12.1%',    gap: '$94M / yr at risk',  sparkColor: '#EF4444' },
    ],
    CMO: [
      { label: 'MA STAR RATING',      value: '3.2 ★',         trend: [3.8, 3.6, 3.2],  target: '4.0 ★',     gap: '$34M bonus at risk', sparkColor: '#F59E0B' },
      { label: 'OPERATING MARGIN',    value: '1.8%',          trend: [3.2, 2.1, 1.8],  target: '4.0%',      gap: '$179M / yr gap',     sparkColor: '#EF4444' },
      { label: 'PRIOR AUTH COV.',     value: '23%',           trend: [31, 27, 23],      target: '62%',       gap: 'Patient access risk',sparkColor: '#F59E0B' },
      { label: 'RCM DENIAL RATE',     value: '18.2%',         trend: [14.2, 16.8, 18.2],target: '12.1%',    gap: '$94M / yr at risk',  sparkColor: '#EF4444' },
    ],
    Maestro: [
      { label: 'OPERATING MARGIN',    value: '1.8%',          trend: [3.2, 2.1, 1.8],  target: '4.0%',      gap: '$179M / yr gap',     sparkColor: '#EF4444' },
      { label: 'RCM DENIAL RATE',     value: '18.2%',         trend: [14.2, 16.8, 18.2],target: '12.1%',    gap: '$94M / yr at risk',  sparkColor: '#EF4444' },
      { label: 'PRIOR AUTH COVERAGE', value: '23%',           trend: [31, 27, 23],      target: '62%',       gap: '−39pp vs peers',     sparkColor: '#F59E0B' },
      { label: 'MA STAR RATING',      value: '3.2 ★',         trend: [3.8, 3.6, 3.2],  target: '4.0 ★',     gap: '$34M bonus at risk', sparkColor: '#F59E0B' },
    ],
  },
  firstcapital: {
    CIO: [
      { label: 'CORE BANKING AGE',    value: '22 years',      trend: [20, 21, 22],      target: 'Modernized',gap: 'AI roadmap blocked', sparkColor: '#EF4444' },
      { label: 'FEDNOW STATUS',       value: 'Not live',      trend: [0, 0, 0],         target: 'Live Q2 \'26',gap: '76% peers live',  sparkColor: '#EF4444' },
      { label: 'AI OUTCOMES',         value: '0 of 3',        trend: [0, 0, 0],         target: '2 tracked', gap: '$1.6M untracked',   sparkColor: '#F59E0B' },
      { label: 'DIGITAL ADOPTION',    value: '41%',           trend: [35, 38, 41],      target: '67%',       gap: '−26pp vs peers',    sparkColor: '#F59E0B' },
    ],
    CFO: [
      { label: 'DIGITAL ADOPTION',    value: '41%',           trend: [35, 38, 41],      target: '67%',       gap: '−26pp vs peers'                         },
      { label: 'COST-TO-INCOME',      value: '68%',           trend: [66, 67, 68],      target: '55%',       gap: '$99M / yr gap',     sparkColor: '#EF4444' },
      { label: 'AML FALSE POSITIVE',  value: '78%',           trend: [72, 75, 78],      target: '30%',       gap: '6 excess FTE',      sparkColor: '#EF4444' },
      { label: 'MOBILE APP RATING',   value: '3.2 / 5',       trend: [3.4, 3.3, 3.2],  target: '4.5 / 5',   gap: '180K at churn risk',sparkColor: '#F59E0B' },
    ],
    CMO: [
      { label: 'DIGITAL ADOPTION',    value: '41%',           trend: [35, 38, 41],      target: '67%',       gap: '−26pp vs peers',    sparkColor: '#EF4444' },
      { label: 'MOBILE APP RATING',   value: '3.2 / 5',       trend: [3.4, 3.3, 3.2],  target: '4.5 / 5',   gap: '180K churn risk',   sparkColor: '#EF4444' },
      { label: 'CHURN-RISK CUST.',    value: '180K',          trend: [80, 130, 180],    target: '<50K',      gap: 'Neobank exposure',   sparkColor: '#EF4444' },
      { label: 'COST-TO-INCOME',      value: '68%',           trend: [66, 67, 68],      target: '55%',       gap: '$99M / yr gap',     sparkColor: '#F59E0B' },
    ],
    COO: [
      { label: 'COST-TO-INCOME',      value: '68%',           trend: [66, 67, 68],      target: '55%',       gap: '$99M / yr gap',     sparkColor: '#EF4444' },
      { label: 'AML FALSE POSITIVE',  value: '78%',           trend: [72, 75, 78],      target: '30%',       gap: 'OCC MRA active',    sparkColor: '#EF4444' },
      { label: 'FEDNOW STATUS',       value: 'Not live',      trend: [0, 0, 0],         target: 'Live',      gap: 'Commercial clients',sparkColor: '#EF4444' },
      { label: 'MOBILE APP RATING',   value: '3.2 / 5',       trend: [3.4, 3.3, 3.2],  target: '4.5 / 5',   gap: '180K at risk',      sparkColor: '#F59E0B' },
    ],
    CEO: [
      { label: 'DIGITAL ADOPTION',    value: '41%',           trend: [35, 38, 41],      target: '67%',       gap: '−26pp vs peers',    sparkColor: '#EF4444' },
      { label: 'COST-TO-INCOME',      value: '68%',           trend: [66, 67, 68],      target: '55%',       gap: '$99M / yr gap',     sparkColor: '#EF4444' },
      { label: 'FEDNOW STATUS',       value: 'Not live',      trend: [0, 0, 0],         target: 'Live',      gap: '$180M at risk',     sparkColor: '#EF4444' },
      { label: 'AI OUTCOMES',         value: '0 of 3',        trend: [0, 0, 0],         target: '2 tracked', gap: '$1.6M untracked',   sparkColor: '#F59E0B' },
    ],
    Maestro: [
      { label: 'DIGITAL ADOPTION',    value: '41%',           trend: [35, 38, 41],      target: '67%',       gap: '−26pp vs peers'                         },
      { label: 'COST-TO-INCOME',      value: '68%',           trend: [66, 67, 68],      target: '55%',       gap: '$99M / yr gap'                          },
      { label: 'AML FALSE POSITIVE',  value: '78%',           trend: [72, 75, 78],      target: '30%',       gap: '6 excess FTE'                           },
      { label: 'MOBILE APP RATING',   value: '3.2 / 5',       trend: [3.4, 3.3, 3.2],  target: '4.5 / 5',   gap: '180K at churn risk'                     },
    ],
  },
  apexretail: {
    CMO: [
      { label: 'EINSTEIN STATUS',     value: 'Idle',          trend: [0, 0, 0],         target: 'Active',    gap: '$248M idle',        sparkColor: '#EF4444' },
      { label: 'CART ABANDONMENT',    value: '72%',           trend: [68, 70, 72],      target: '58%',       gap: '$840M opportunity', sparkColor: '#EF4444' },
      { label: 'LOYALTY ACTIVE',      value: '42%',           trend: [48, 45, 42],      target: '68%',       gap: '−26pp vs peers',    sparkColor: '#F59E0B' },
      { label: 'MOBILE CONVERSION',   value: '2.3%',          trend: [2.6, 2.5, 2.3],  target: '3.8%',      gap: '$180M gap',         sparkColor: '#F59E0B' },
    ],
    CFO: [
      { label: 'CART ABANDONMENT',    value: '72%',           trend: [68, 70, 72],      target: '58%',       gap: '$840M opportunity', sparkColor: '#EF4444' },
      { label: 'INVENTORY TURNS',     value: '4.2x',          trend: [5.2, 4.8, 4.2],  target: '6.8x',      gap: '$180M tied up',     sparkColor: '#EF4444' },
      { label: 'OPERATING MARGIN',    value: '3.8%',          trend: [4.2, 4.0, 3.8],  target: '6.0%',      gap: '−2.2pp from target',sparkColor: '#EF4444' },
      { label: 'SHADOW IT SPEND',     value: '$38M',          trend: [28, 33, 38],      target: '$0 managed',gap: 'Rising unchecked',  sparkColor: '#F59E0B' },
    ],
    CIO: [
      { label: 'EINSTEIN STATUS',     value: 'Idle',          trend: [0, 0, 0],         target: 'Active',    gap: '$248M idle',        sparkColor: '#EF4444' },
      { label: 'SHADOW IT SPEND',     value: '$38M',          trend: [28, 33, 38],      target: '$0 managed',gap: '8,400 SAP blocks',  sparkColor: '#EF4444' },
      { label: 'O9 COMPLETION',       value: '40%',           trend: [10, 25, 40],      target: '100%',      gap: '18 months, $6.8M',  sparkColor: '#F59E0B' },
      { label: 'INVENTORY TURNS',     value: '4.2x',          trend: [5.2, 4.8, 4.2],  target: '6.8x',      gap: '$180M trapped',     sparkColor: '#F59E0B' },
    ],
    COO: [
      { label: 'INVENTORY TURNS',     value: '4.2x',          trend: [5.2, 4.8, 4.2],  target: '6.8x',      gap: '$180M tied up',     sparkColor: '#EF4444' },
      { label: 'O9 COMPLETION',       value: '40%',           trend: [10, 25, 40],      target: '100%',      gap: '18 months delayed', sparkColor: '#F59E0B' },
      { label: 'OPERATING MARGIN',    value: '3.8%',          trend: [4.2, 4.0, 3.8],  target: '6.0%',      gap: '−2.2pp from target',sparkColor: '#F59E0B' },
      { label: 'STORE TURNOVER',      value: '68%',           trend: [62, 65, 68],      target: '40%',       gap: 'AI training wasted', sparkColor: '#EF4444' },
    ],
    CEO: [
      { label: 'OPERATING MARGIN',    value: '3.8%',          trend: [4.2, 4.0, 3.8],  target: '6.0%',      gap: '−2.2pp from target',sparkColor: '#EF4444' },
      { label: 'CART ABANDONMENT',    value: '72%',           trend: [68, 70, 72],      target: '58%',       gap: '$840M opportunity', sparkColor: '#EF4444' },
      { label: 'EINSTEIN STATUS',     value: 'Idle',          trend: [0, 0, 0],         target: 'Active',    gap: '$248M idle',        sparkColor: '#F59E0B' },
      { label: 'INVENTORY TURNS',     value: '4.2x',          trend: [5.2, 4.8, 4.2],  target: '6.8x',      gap: '$180M tied up',     sparkColor: '#F59E0B' },
    ],
    Maestro: [
      { label: 'CART ABANDONMENT',    value: '72%',           trend: [68, 70, 72],      target: '58%',       gap: '$840M opportunity'                      },
      { label: 'INVENTORY TURNS',     value: '4.2x',          trend: [5.2, 4.8, 4.2],  target: '6.8x',      gap: '$180M tied up'                          },
      { label: 'LOYALTY ACTIVE',      value: '42%',           trend: [48, 45, 42],      target: '68%',       gap: '−26pp vs peers'                         },
      { label: 'OPERATING MARGIN',    value: '3.8%',          trend: [4.2, 4.0, 3.8],  target: '6.0%',      gap: '−2.2pp from target'                     },
    ],
  },
  arcturus: {
    CIO: [
      { label: 'AI INITIATIVES',      value: '3 of 28 live',  trend: [6, 4, 3],         target: '10+ live',  gap: '$94M untracked',     sparkColor: '#EF4444' },
      { label: 'CDO VACANCY',         value: '11 months',     trend: [4, 8, 11],        target: 'Filled',    gap: '14 initiatives stalled', sparkColor: '#EF4444' },
      { label: 'FSC ADOPTION',        value: '44%',           trend: [32, 38, 44],      target: '85%',       gap: '$38M at risk',       sparkColor: '#F59E0B' },
      { label: 'DATA SILOS',          value: '14 systems',    trend: [14, 14, 14],      target: '1 (golden record)', gap: 'AI blocked',  sparkColor: '#F59E0B' },
    ],
    CFO: [
      { label: 'COST-TO-INCOME',      value: '71%',           trend: [69, 70, 71],      target: '58%',       gap: '$840M gap',          sparkColor: '#EF4444' },
      { label: 'AI PORTFOLIO ROI',    value: '0% ($0/$94M)',  trend: [0, 0, 0],         target: '38% peers', gap: '$36M/yr shortfall',  sparkColor: '#EF4444' },
      { label: 'IT BUDGET VS PEERS',  value: '4.2% rev',      trend: [3.9, 4.0, 4.2],  target: '3.1%',      gap: '+$178M/yr',          sparkColor: '#F59E0B' },
      { label: 'FSC ADOPTION',        value: '44%',           trend: [32, 38, 44],      target: '85%',       gap: '$38M invested',      sparkColor: '#F59E0B' },
    ],
    CRO: [
      { label: 'MAS FEAT STATUS',     value: 'Overdue 4mo',   trend: [0, 0, 0],         target: 'Compliant', gap: '$2.4B AUM at risk',  sparkColor: '#EF4444' },
      { label: 'AI MODELS GOVERNED',  value: '0 of 28',       trend: [0, 0, 0],         target: '28 / 28',   gap: 'Regulatory exposure',sparkColor: '#EF4444' },
      { label: 'STRESS TEST FREQ',    value: 'Monthly',       trend: [0, 0, 0],         target: 'Daily',     gap: 'SEC requirement',    sparkColor: '#EF4444' },
      { label: 'SEC MRA',             value: 'Open (Sep 24)', trend: [0, 0, 0],         target: 'Closed',    gap: 'Exam risk',          sparkColor: '#F59E0B' },
    ],
    CEO: [
      { label: 'COST-TO-INCOME',      value: '71%',           trend: [69, 70, 71],      target: '58%',       gap: '$840M gap',          sparkColor: '#EF4444' },
      { label: 'AI PORTFOLIO ROI',    value: '0% ($0/$94M)',  trend: [0, 0, 0],         target: '38% peers', gap: '$94M untracked',     sparkColor: '#EF4444' },
      { label: 'MAS FEAT STATUS',     value: 'Overdue 4mo',   trend: [0, 0, 0],         target: 'Compliant', gap: '$2.4B AUM risk',     sparkColor: '#EF4444' },
      { label: 'CDO VACANCY',         value: '11 months',     trend: [4, 8, 11],        target: 'Filled',    gap: 'AI programme stalled', sparkColor: '#F59E0B' },
    ],
    Maestro: [
      { label: 'COST-TO-INCOME',      value: '71%',           trend: [69, 70, 71],      target: '58%',       gap: '$840M gap'                              },
      { label: 'AI PORTFOLIO ROI',    value: '0%',            trend: [0, 0, 0],         target: '38% peers', gap: '$94M untracked'                         },
      { label: 'CDO VACANCY',         value: '11 months',     trend: [4, 8, 11],        target: 'Filled',    gap: '14 initiatives stalled'                 },
      { label: 'MAS FEAT STATUS',     value: 'Overdue 4mo',   trend: [0, 0, 0],         target: 'Compliant', gap: '$2.4B AUM risk'                         },
    ],
  },
  nexora: {
    CMO: [
      { label: 'EINSTEIN STATUS',     value: 'Idle 18 months',trend: [0, 0, 0],         target: 'Active',    gap: '$248M idle',         sparkColor: '#EF4444' },
      { label: 'LOYALTY ACTIVE',      value: '42%',           trend: [48, 45, 42],      target: '68%',       gap: '16.5M inactive',     sparkColor: '#EF4444' },
      { label: 'CART ABANDONMENT',    value: '72%',           trend: [68, 70, 72],      target: '58%',       gap: '$68M idle',          sparkColor: '#F59E0B' },
      { label: 'EMAIL OPEN RATE',     value: '14%',           trend: [16, 15, 14],      target: '28%',       gap: '−14pp vs benchmark', sparkColor: '#F59E0B' },
    ],
    CFO: [
      { label: 'OPERATING MARGIN',    value: '3.2%',          trend: [4.8, 3.9, 3.2],  target: '6.5%',      gap: '$610M gap',          sparkColor: '#EF4444' },
      { label: 'ECOM MARGIN',         value: '-2.1%',         trend: [-1.2, -1.8, -2.1], target: '+2.8%',   gap: '$615M drag',         sparkColor: '#EF4444' },
      { label: 'AI ROI',              value: '8% ($12M)',     trend: [4, 6, 8],         target: '38% peers', gap: '$44M shortfall',     sparkColor: '#EF4444' },
      { label: 'INVENTORY EXCESS',    value: '$900M',         trend: [600, 750, 900],   target: '<$200M',    gap: '4.2x vs 6.8x',      sparkColor: '#F59E0B' },
    ],
    CIO: [
      { label: 'EINSTEIN STATUS',     value: 'Idle 18 months',trend: [0, 0, 0],         target: 'Active',    gap: '$248M idle',         sparkColor: '#EF4444' },
      { label: 'AI ROI',              value: '8% ($12M)',     trend: [4, 6, 8],         target: '38%',       gap: '$44M shortfall',     sparkColor: '#EF4444' },
      { label: 'ERP AI-READY',        value: '2 of 6 regions',trend: [1, 2, 2],         target: '6 of 6',    gap: 'SAP R/3 EOL 2027',  sparkColor: '#F59E0B' },
      { label: 'O9 COMPLETION',       value: '40%',           trend: [10, 25, 40],      target: '100%',      gap: '18 months stalled',  sparkColor: '#F59E0B' },
    ],
    COO: [
      { label: 'INVENTORY TURNS',     value: '4.2x',          trend: [5.2, 4.8, 4.2],  target: '6.8x',      gap: '$900M excess',       sparkColor: '#EF4444' },
      { label: 'ON-TIME DELIVERY',    value: '71%',           trend: [74, 72, 71],      target: '88%',       gap: '−17pp vs benchmark', sparkColor: '#EF4444' },
      { label: 'SHRINKAGE',           value: '2.8% ($515M)',  trend: [2.4, 2.6, 2.8],  target: '1.4%',      gap: '$259M excess',       sparkColor: '#F59E0B' },
      { label: 'O9 COMPLETION',       value: '40%',           trend: [10, 25, 40],      target: '100%',      gap: '$900M blocked',      sparkColor: '#F59E0B' },
    ],
    CEO: [
      { label: 'OPERATING MARGIN',    value: '3.2%',          trend: [4.8, 3.9, 3.2],  target: '6.5%',      gap: '$610M gap',          sparkColor: '#EF4444' },
      { label: 'EINSTEIN STATUS',     value: 'Idle 18 months',trend: [0, 0, 0],         target: 'Active',    gap: '$248M idle',         sparkColor: '#EF4444' },
      { label: 'SAP R/3 EOL',         value: 'Dec 2027',      trend: [0, 0, 0],         target: 'Migration started', gap: '20 months left', sparkColor: '#EF4444' },
      { label: 'ECOM MARGIN',         value: '-2.1%',         trend: [-1.2, -1.8, -2.1], target: '+2.8%',   gap: 'Growing & negative', sparkColor: '#F59E0B' },
    ],
    Maestro: [
      { label: 'OPERATING MARGIN',    value: '3.2%',          trend: [4.8, 3.9, 3.2],  target: '6.5%',      gap: '$610M gap'                              },
      { label: 'EINSTEIN STATUS',     value: 'Idle 18 months',trend: [0, 0, 0],         target: 'Active',    gap: '$248M idle'                             },
      { label: 'ECOM MARGIN',         value: '-2.1%',         trend: [-1.2, -1.8, -2.1], target: '+2.8%',   gap: '$615M drag'                             },
      { label: 'SAP R/3 EOL',         value: 'Dec 2027',      trend: [0, 0, 0],         target: 'Migration started', gap: '20 months left'                 },
    ],
  },
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
  arcturus: [
    { label: 'Cost-to-Income Ratio',  current: 71,  peerMedian: 61,  topQuartile: 52,   unit: '%',   lowerIsBetter: true },
    { label: 'AI ROI on Investment',  current: 0,   peerMedian: 38,  topQuartile: 72,   unit: '%'                        },
    { label: 'Client Portal Adoption',current: 44,  peerMedian: 72,  topQuartile: 88,   unit: '%'                        },
    { label: 'AUM per Employee',      current: 500, peerMedian: 620, topQuartile: 840,  unit: '$M'                       },
    { label: 'AI Maturity Score',     current: 28,  peerMedian: 54,  topQuartile: 78,   unit: '/100'                     },
  ],
  nexora: [
    { label: 'Operating Margin',      current: 3.2, peerMedian: 5.1, topQuartile: 7.8,  unit: '%'                        },
    { label: 'Inventory Turns',       current: 4.2, peerMedian: 5.6, topQuartile: 7.4,  unit: 'x'                        },
    { label: 'Shrinkage Rate',        current: 2.8, peerMedian: 1.4, topQuartile: 0.9,  unit: '%',   lowerIsBetter: true },
    { label: 'AI ROI on Investment',  current: 8,   peerMedian: 38,  topQuartile: 72,   unit: '%'                        },
    { label: 'Loyalty Active Rate',   current: 42,  peerMedian: 64,  topQuartile: 82,   unit: '%'                        },
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

type TrajData = { title: string; leftLabel: string; rightLabel: string; leftPts: number[]; rightPts: number[]; years: string[] }

const TRAJECTORY_DATA: Record<ClientId, TrajData> = {
  meridian:     { title: 'Revenue is growing. Margin is collapsing.',     leftLabel: 'Revenue ($B)', rightLabel: 'Op. Margin (%)', leftPts: [9.8, 10.1, 10.5, 10.9, 11.2], rightPts: [3.8, 3.4, 3.2, 2.1, 1.8], years: ['FY21','FY22','FY23','FY24','FY25'] },
  firstcapital: { title: 'Assets are growing. Efficiency is deteriorating.', leftLabel: 'Assets ($B)',  rightLabel: 'Cost/Income (%)', leftPts: [16.2, 16.8, 17.2, 17.8, 18.0], rightPts: [62, 64, 65, 67, 68], years: ['FY21','FY22','FY23','FY24','FY25'] },
  apexretail:   { title: 'Revenue is growing. Margin is under pressure.',   leftLabel: 'Revenue ($B)', rightLabel: 'Op. Margin (%)', leftPts: [10.8, 11.2, 11.6, 11.9, 12.2], rightPts: [5.8, 5.2, 4.8, 4.2, 3.8], years: ['FY21','FY22','FY23','FY24','FY25'] },
  arcturus:     { title: 'AUM is growing. Cost income ratio is worsening.', leftLabel: 'AUM ($B)',    rightLabel: 'Cost/Income (%)', leftPts: [12.8, 13.4, 14.2, 15.1, 16.2], rightPts: [65, 67, 69, 70, 71], years: ['FY21','FY22','FY23','FY24','FY25'] },
  nexora:       { title: 'Revenue is growing. Operating margin is declining.', leftLabel: 'Revenue ($B)', rightLabel: 'Op. Margin (%)', leftPts: [14.8, 15.6, 16.4, 17.1, 18.2], rightPts: [5.4, 4.8, 4.2, 3.6, 3.2], years: ['FY21','FY22','FY23','FY24','FY25'] },
}

// Role-specific trajectory charts — each role sees the story most relevant to their mandate
const ROLE_TRAJECTORY: Record<ClientId, Partial<Record<string, TrajData>>> = {
  meridian: {
    CIO:  { title: 'AI spend is growing. Outcomes are zero.',           leftLabel: 'IT + AI Spend ($M)', rightLabel: 'Pilots Scaled',   leftPts: [24, 30, 35, 40, 42], rightPts: [1, 2, 2, 1, 0],         years: ['FY21','FY22','FY23','FY24','FY25'] },
    CMIO: { title: 'Epic is deployed. Optimization is stalling.',       leftLabel: 'Years Post Go-Live', rightLabel: 'Epic Score',       leftPts: [3, 4, 5, 6, 7],     rightPts: [50, 54, 57, 59, 61],    years: ['FY21','FY22','FY23','FY24','FY25'] },
    COO:  { title: 'Patient volume is growing. Labor cost is out of control.', leftLabel: 'Discharges (K)', rightLabel: 'Travel Nurse ($M)', leftPts: [280, 295, 305, 318, 325], rightPts: [22, 28, 36, 44, 48], years: ['FY21','FY22','FY23','FY24','FY25'] },
  },
  firstcapital: {
    CIO: { title: 'Tech debt grows every year. AI delivery is zero.',   leftLabel: 'System Age (yr)',   rightLabel: 'AI Outcomes (#)', leftPts: [18, 19, 20, 21, 22], rightPts: [0, 1, 2, 1, 0],         years: ['FY21','FY22','FY23','FY24','FY25'] },
    CMO: { title: 'Customer base is growing. Engagement is falling.',  leftLabel: 'Customers (K)',     rightLabel: 'Digital Adopt. (%)', leftPts: [680, 720, 750, 780, 800], rightPts: [48, 45, 43, 42, 41], years: ['FY21','FY22','FY23','FY24','FY25'] },
  },
  apexretail: {
    CMO: { title: 'Loyalty base is growing. Engagement is falling.',   leftLabel: 'Members (M)',       rightLabel: 'Active Rate (%)', leftPts: [14.2, 15.8, 16.9, 17.6, 18.0], rightPts: [52, 49, 46, 44, 42], years: ['FY21','FY22','FY23','FY24','FY25'] },
    CIO: { title: 'AI tools are multiplying. Integration is declining.',leftLabel: 'AI Tools (#)',      rightLabel: 'Integrated (%)', leftPts: [8, 12, 18, 24, 28],  rightPts: [60, 50, 42, 35, 30],    years: ['FY21','FY22','FY23','FY24','FY25'] },
    COO: { title: 'Revenue is growing. Inventory cost compounds.',      leftLabel: 'Revenue ($B)',      rightLabel: 'Inv. Turns (x)', leftPts: [10.8, 11.2, 11.6, 11.9, 12.2], rightPts: [5.8, 5.2, 4.8, 4.4, 4.2], years: ['FY21','FY22','FY23','FY24','FY25'] },
  },
  arcturus: {
    CIO:  { title: 'AI investment is compounding. Outcomes are zero.',   leftLabel: 'AI Spend ($M)',    rightLabel: 'ROI (%)',         leftPts: [14, 22, 36, 58, 94],  rightPts: [12, 8, 4, 2, 0],         years: ['FY21','FY22','FY23','FY24','FY25'] },
    CFO:  { title: 'AUM is growing. CIR keeps widening.',               leftLabel: 'AUM ($B)',          rightLabel: 'Cost/Income (%)', leftPts: [12.8, 13.4, 14.2, 15.1, 16.2], rightPts: [65, 67, 69, 70, 71], years: ['FY21','FY22','FY23','FY24','FY25'] },
    CRO:  { title: 'AI models are proliferating. Governance is absent.', leftLabel: 'AI Models (#)',    rightLabel: 'Governed (%)',    leftPts: [4, 8, 14, 21, 28],    rightPts: [80, 62, 44, 28, 0],      years: ['FY21','FY22','FY23','FY24','FY25'] },
  },
  nexora: {
    CMO:  { title: 'Loyalty members are growing. Engagement is flat.',   leftLabel: 'Members (M)',      rightLabel: 'Active Rate (%)', leftPts: [18.4, 22.6, 25.1, 27.2, 28.4], rightPts: [54, 50, 46, 44, 42], years: ['FY21','FY22','FY23','FY24','FY25'] },
    COO:  { title: 'Revenue is growing. Inventory turns are declining.',  leftLabel: 'Revenue ($B)',     rightLabel: 'Inv. Turns (x)', leftPts: [14.8, 15.6, 16.4, 17.1, 18.2], rightPts: [5.8, 5.4, 5.0, 4.6, 4.2], years: ['FY21','FY22','FY23','FY24','FY25'] },
    CFO:  { title: 'eCommerce is growing. It is margin-negative.',        leftLabel: 'eComm Revenue ($B)', rightLabel: 'eComm Margin (%)', leftPts: [2.4, 3.2, 4.4, 5.8, 7.2], rightPts: [0.8, 0.2, -0.4, -1.2, -2.1], years: ['FY21','FY22','FY23','FY24','FY25'] },
  },
}

function TrajectoryChart({ clientId, role }: { clientId: ClientId; role: RoleId }) {
  const d = ROLE_TRAJECTORY[clientId]?.[role] ?? TRAJECTORY_DATA[clientId]
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
  const [animate, setAnimate] = useState(false)
  useEffect(() => {
    setAnimate(false)
    const t = setTimeout(() => setAnimate(true), 60)
    return () => clearTimeout(t)
  }, [issues])

  const counts = [
    issues.filter(i => i.severity === 'critical').length,
    issues.filter(i => i.severity === 'warning').length,
    issues.filter(i => i.severity === 'watch').length,
  ]
  const labels: Severity[] = ['critical', 'warning', 'watch']
  const colors = [T.red, T.amber, T.text3]
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
            {segs.map((s, i) => s.cnt > 0 ? (
              <path key={s.sev} d={arcPath(s.startD, s.endD)} fill="none"
                stroke={filter === null || filter === s.sev ? s.color : s.color + '30'}
                strokeWidth={filter === s.sev ? sw + 3 : sw} strokeLinecap="round"
                style={{ cursor: 'pointer', transition: `all 200ms, opacity 400ms ease ${i * 100}ms`, opacity: animate ? 1 : 0 }}
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
    <div style={{ background: T.surface, borderBottom: '1px solid ' + T.border, padding: '0 48px', display: 'flex', gap: '0', overflowX: 'auto' }}>
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

function IssueCard({ issue, expanded, onToggle, onGoToStep }: { issue: Issue; expanded: boolean; onToggle: () => void; onGoToStep: (n: number) => void }) {
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
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, background: T.teal + '18', color: T.teal, border: '1px solid ' + T.teal + '40', borderRadius: '12px', padding: '3px 10px' }}>{issue.impact}</span>
              <span style={{ fontSize: '11px', color: T.text3, background: T.surface2, borderRadius: '12px', padding: '3px 10px', border: '1px solid ' + T.border }}>{issue.owner}</span>
            </div>
            {/* Three-source attribution */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[
                { label: 'FROM YOUR DATA', text: issue.sources.data, bg: T.teal + '12', color: T.teal, border: T.teal + '35' },
                { label: 'FROM INDUSTRY',  text: issue.sources.industry, bg: '#6366F112', color: '#6366F1', border: '#6366F135' },
                { label: 'FROM GENOME',    text: issue.sources.genome, bg: '#EC489912', color: '#EC4899', border: '#EC489935' },
              ].map(s => (
                <div key={s.label} title={s.text} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '3px 8px', background: s.bg, border: '1px solid ' + s.border, borderRadius: '4px' }}>
                  <span style={{ fontSize: '8px', fontWeight: 800, color: s.color, letterSpacing: '0.08em', fontFamily: T.mono, whiteSpace: 'nowrap' }}>{s.label}</span>
                </div>
              ))}
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
            <button onClick={() => onGoToStep(2)} style={{ padding: '6px 14px', background: 'none', border: '1px solid ' + T.teal + '50', borderRadius: '6px', fontSize: '12px', color: T.teal, cursor: 'pointer', fontFamily: T.sans }}>
              See the data →
            </button>
            <button onClick={() => onGoToStep(5)} style={{ padding: '6px 14px', background: 'none', border: '1px solid ' + T.border2, borderRadius: '6px', fontSize: '12px', color: T.text2, cursor: 'pointer', fontFamily: T.sans }}>
              Who owns this →
            </button>
            <button onClick={() => onGoToStep(5)} style={{ padding: '6px 14px', background: 'none', border: '1px solid ' + T.border2, borderRadius: '6px', fontSize: '12px', color: T.text2, cursor: 'pointer', fontFamily: T.sans }}>
              What to do →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Zone 1 ───────────────────────────────────────────────────────────────────

function Zone1({ issues, role, clientId, onGoToStep }: { issues: Issue[]; role: RoleId; clientId: ClientId; onGoToStep: (n: number) => void }) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filter, setFilter] = useState<Severity | null>(null)

  const sorted = filterIssuesByRole(issues, role, clientId)

  const visible = filter ? sorted.filter(i => i.severity === filter) : sorted
  const kpis = ROLE_KPI_DATA[clientId][role] ?? ROLE_KPI_DATA[clientId]['Maestro']
  const benchmarks = CLIENT_BENCHMARKS[clientId]

  return (
    <div>
      {/* Trajectory chart — full width */}
      <TrajectoryChart clientId={clientId} role={role} />

      {/* Row 1: KPI tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {kpis.map((kpi, i) => <KPITile key={i} kpi={kpi} />)}
      </div>

      {/* Row 2: issue cards (2-col grid) + right sidebar */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 310px', gap: '28px', alignItems: 'start' }}>
        {/* Left: issue cards in 2-column grid */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: T.text3, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: T.mono }}>
              {visible.length} ISSUES · SORTED BY ROLE RELEVANCE
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', alignItems: 'start' }}>
            {visible.map(issue => (
              <IssueCard
                key={issue.id} issue={issue}
                expanded={expanded === issue.id}
                onToggle={() => setExpanded(expanded === issue.id ? null : issue.id)}
                onGoToStep={onGoToStep}
              />
            ))}
          </div>
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
  arcturus: [
    { id:'AR-C1', reported:'AI programme delivering ROI',  reportedSub:'CIO board update · Q3 2025',     actual:'$0 verified return on $94M', actualSub:'AI investment audit · March 2026',  gap:'$94M untracked',   gapSub:'Zero baselines locked',    reportedBy:'Raj Malhotra (CIO) · Q3 2025 board update',              dataSource:'AI investment audit · March 2026',                         gapStarted:'Q3 2024' },
    { id:'AR-C2', reported:'CDO search in final round',    reportedSub:'Board update · Q2 2025',         actual:'Vacant 11 months',           actualSub:'HR records · April 2026',           gap:'AI has no owner',  gapSub:'11 months of paralysis',   reportedBy:'Board presentation · Q2 2025',                           dataSource:'HR records · CDO role vacant since May 2025',              gapStarted:'May 2025' },
    { id:'AR-C3', reported:'MAS FEAT remediation underway',reportedSub:'CRO board brief · Q4 2025',      actual:'4 months overdue',           actualSub:'MAS correspondence · April 2026',   gap:'Regulatory risk',  gapSub:'Examination letter received', reportedBy:'Sarah Chen (CRO) · Q4 2025 board brief',                dataSource:'MAS FEAT correspondence · April 2026',                     gapStarted:'Q4 2025' },
    { id:'AR-C4', reported:'Aladdin stress testing daily', reportedSub:'Risk committee · Q3 2025',       actual:'Monthly configuration only', actualSub:'Aladdin audit log · March 2026',    gap:'SEC exposure',     gapSub:'$500B AUM requirement',    reportedBy:'Risk committee minutes · Q3 2025',                       dataSource:'BlackRock Aladdin configuration audit · March 2026',       gapStarted:'Q2 2025' },
    { id:'AR-C5', reported:'Salesforce FSC adopted',       reportedSub:'CRM programme update · Q4 2025', actual:'44% user adoption',         actualSub:'Salesforce analytics · April 2026',  gap:'56% dark',         gapSub:'Churn model data incomplete', reportedBy:'CRM programme director · Q4 2025 update',               dataSource:'Salesforce adoption analytics · April 2026',               gapStarted:'Q3 2024' },
  ],
  nexora: [
    { id:'NX-C1', reported:'Einstein personalisation live',reportedSub:'Salesforce contract · Jan 2024', actual:'Never activated',            actualSub:'Einstein audit · March 2026',       gap:'$248M idle',       gapSub:'18 months, zero activation', reportedBy:'Salesforce contract inception · January 2024',           dataSource:'Einstein activation audit · March 2026',                   gapStarted:'Contract inception Jan 2024' },
    { id:'NX-C2', reported:'o9 implementation complete',   reportedSub:'CSCO update · Q2 2025',          actual:'40% after 18 months',        actualSub:'o9 project review · March 2026',    gap:'$180M trapped',    gapSub:'NA only · 4 regions pending', reportedBy:'CSCO quarterly report · Q2 2025',                        dataSource:'o9 programme review · March 2026',                         gapStarted:'Q4 2024' },
    { id:'NX-C3', reported:'E-commerce profitable',        reportedSub:'CEO investor update · Q3 2025',  actual:'-2.1% contribution margin',  actualSub:'CFO management accounts · Q1 2026', gap:'$615M drag',       gapSub:'Growing a loss-making channel', reportedBy:'CEO investor update · Q3 2025',                          dataSource:'CFO management accounts · Q1 2026',                        gapStarted:'Q3 2024' },
    { id:'NX-C4', reported:'SAP migration on roadmap',     reportedSub:'IT strategy document · 2024',    actual:'Not started · 20 months to EOL', actualSub:'IT audit · April 2026',         gap:'Forced migration',  gapSub:'Dec 2027 hard EOL',         reportedBy:'IT 5-year strategy · 2024',                              dataSource:'SAP EOL notice + IT audit · April 2026',                   gapStarted:'EOL announced 2024' },
    { id:'NX-C5', reported:'Shrinkage AI expanding',       reportedSub:'COO board brief · Q4 2025',      actual:'12 stores only · no sponsor', actualSub:'Operations audit · March 2026',    gap:'$259M idle',       gapSub:'2,388 stores waiting',      reportedBy:'Priya Krishnamurthy (COO) · Q4 2025 board',              dataSource:'Operations programme audit · March 2026',                  gapStarted:'Q3 2025' },
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
    arcturus: [
      { level: 'HIGH', text: 'CDO vacancy 11 months → AI governance absent, MAS FEAT 4 months overdue' },
      { level: 'HIGH', text: '$94M AI investment with $0 verified return → CFO scrutiny mounting' },
      { level: 'HIGH', text: 'MAS FEAT overdue → regulatory examination risk, potential business restriction' },
      { level: 'MEDIUM', text: 'Bloomberg AIM Dec 2026 auto-renewal → no negotiation strategy in place' },
      { level: 'MEDIUM', text: 'Salesforce FSC 44% adoption → churn model trained on incomplete client data' },
    ],
    nexora: [
      { level: 'HIGH', text: 'Einstein idle 18 months → $248M annual revenue opportunity compounding daily' },
      { level: 'HIGH', text: 'SAP R/3 EOL Dec 2027 → forced migration with 8,200 customisations and 20 months left' },
      { level: 'HIGH', text: 'eCommerce -2.1% margin → CFO may block AI investment entirely if not resolved' },
      { level: 'MEDIUM', text: 'o9 at 40% stalled → $900M inventory trapped, COO credibility at risk' },
      { level: 'MEDIUM', text: 'Shrinkage AI pilot no sponsor → $259M opportunity with no scale decision' },
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
  "What leading advisory firms charge $1.8M and 8 weeks to produce. This took 4 minutes."
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
          "What leading advisory firms charge $1.8M and 8 weeks to produce. This took 4 minutes."
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
  const ROLES: RoleId[] = activeClient === 'arcturus'
    ? ['CIO', 'CFO', 'CRO', 'CEO', 'Maestro']
    : activeClient === 'nexora'
      ? ['CIO', 'CFO', 'CMO', 'COO', 'CEO', 'Maestro']
      : activeClient === 'apexretail'
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
    <div style={{minHeight:'100vh',background:'#060A12',fontFamily:'"DM Sans",sans-serif',color:'#EFF6FF'}}>

      {/* Product header */}
      <div style={{ background: T.surface, borderBottom: '1px solid ' + T.border }}>
        <div style={{ padding: '20px 48px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '10px', fontWeight: 800, color: T.teal, letterSpacing: '0.14em', fontFamily: T.mono, marginBottom: '8px' }}>
                ⚡ SITUATION INTELLIGENCE
              </div>
              <div style={{ fontSize: '28px', fontWeight: 500, color: T.text, marginBottom: '12px', maxWidth: '640px', lineHeight: 1.3, fontFamily: "'Fraunces', Georgia, serif" }}>
                "What's actually broken — and what is it costing you?"
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '13px', color: T.text3 }}>
                  Data confidence: <span style={{ fontWeight: 700, color: confidence >= meta.confidence ? meta.color : T.amber }}>{confidence}%</span>
                </span>
                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                  {(Object.keys(CLIENT_META) as ClientId[]).map(c => (
                    <button
                      key={c}
                      onClick={() => { setActiveClient(c); setStep(1); setCompletedSteps(new Set([1])); setRole('Maestro') }}
                      style={{ padding: '3px 10px', background: activeClient === c ? CLIENT_META[c].color + '20' : 'transparent', border: '1px solid ' + (activeClient === c ? CLIENT_META[c].color + '50' : T.border), borderRadius: '5px', fontSize: '10px', fontWeight: activeClient === c ? 700 : 400, color: activeClient === c ? CLIENT_META[c].color : T.text3, cursor: 'pointer', fontFamily: T.sans }}
                    >
                      {CLIENT_META[c].name.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: T.text3, letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: '4px', fontFamily: T.mono }}>VIEWING AS</div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: T.teal }}>{role}</div>
            </div>
          </div>
        </div>
        {/* Role tabs strip */}
        <div style={{ borderTop: '1px solid ' + T.border, padding: '8px 48px', display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '9px', fontWeight: 700, color: T.text2, fontFamily: T.mono, letterSpacing: '0.1em', marginRight: '8px', flexShrink: 0 }}>VIEWING AS</span>
          {ROLES.map(r => (
            <button key={r} onClick={() => setRole(r)}
              style={{
                padding: '4px 14px', height: '28px',
                background: role === r ? T.teal : 'transparent',
                border: `1px solid ${role === r ? T.teal : 'rgba(239,246,255,0.12)'}`,
                borderRadius: '20px',
                fontSize: '11px', fontWeight: role === r ? 700 : 400,
                color: role === r ? '#060A12' : T.text2,
                cursor: 'pointer', fontFamily: T.sans,
                whiteSpace: 'nowrap' as const,
                transition: 'all 0.12s',
              }}
            >{r}</button>
          ))}
        </div>
      </div>

      {/* Step navigator */}
      <StepNav step={step} setStep={n => { if (n !== step) { setCompletedSteps(prev => new Set([...prev, step])); setStep(n) } }} completedSteps={completedSteps} />

      {/* Zone content */}
      <div style={{ maxWidth: '1480px', margin: '0 auto', padding: '32px 48px' }}>

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

        {step === 1 && <Zone1 issues={issues} role={role} clientId={activeClient} onGoToStep={n => { setCompletedSteps(prev => new Set([...prev, step])); setStep(n) }} />}
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
