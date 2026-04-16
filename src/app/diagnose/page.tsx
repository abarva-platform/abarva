'use client'
import { useState, useEffect, Suspense } from 'react'
import AbarvaNav from '@/components/AbarvaNav'
import { useClientContext } from '@/lib/use-client-context'
import { meridianHealth } from '@/data/meridian/index'
import { firstCapital } from '@/data/firstcapital/index'
import { apexRetail } from '@/data/apexretail/index'

// ─── Theme — matches homepage exactly ────────────────────────────────────────
const BG = '#060A12', CARD = '#0D1520', BORDER = '#1C2D45'
const WHITE = '#EFF6FF', MUTED = 'rgba(255,255,255,0.75)', DIM = 'rgba(255,255,255,0.46)'
const TEAL = '#2DD4C8'
// Status dot colors — for dots only, never for text
const DOT_RED = '#EF4444', DOT_AMBER = '#F59E0B'
const MONO = 'JetBrains Mono, monospace', SANS = 'DM Sans, sans-serif', SERIF = 'Georgia, serif'

// ─── Types ────────────────────────────────────────────────────────────────────
type Severity = 'critical' | 'warning' | 'watch'
type ClientId = 'meridian' | 'firstcapital' | 'apexretail' | 'arcturus' | 'nexora'
interface IssueSource { data: string; industry: string; genome: string }
interface Issue {
  id: string; severity: Severity; title: string
  body: string; impact: string; owner: string; roles?: string[]
  category: string; sources: IssueSource
}
interface RiskItem { label: string; amount: number }
interface Action {
  n: number; horizon: 'week' | 'month' | 'quarter'
  title: string; rationale: string; owner: string
  impact: string; effort: string; risk: string
}

// Severity dot colors — for dot indicators only
const SEV_COLOR: Record<Severity, string> = { critical: DOT_RED, warning: DOT_AMBER, watch: DIM }

// ─── Helper ───────────────────────────────────────────────────────────────────
function meridianAI_pilotsPurgatory() { return 2 }

// ─── Issues ───────────────────────────────────────────────────────────────────
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
      body:'Travel nurse spend at $48M — $20M above the $28M operating target. Dependency has grown 3 consecutive quarters. No reduction roadmap in board materials.',
      impact:'$20M / yr', owner:'COO + CNO',
      roles:['COO','CFO','CEO'], category:'workforce',
      sources: { data:'Labor cost ledger · Q4 FY2025', industry:'Travel nurse premium: 2.4× permanent equivalent rate', genome:'3 comparable systems reduced travel nurse spend 40% in 18 months via float pool' } },
    { id:'M04', severity:'warning', title:`Epic Optimization at ${meridianHealth.technology.ehr.optimizationScore}/100`,
      body:`Seven years post go-live, Epic optimization at ${meridianHealth.technology.ehr.optimizationScore} of 100. Six modules not yet activated. CMS value-based incentive at risk.`,
      impact:'$34M at risk', owner:'CMIO + CIO',
      roles:['CMIO','CIO','CFO'], category:'epic',
      sources: { data:'Epic optimization audit score · Mar 2026', industry:'Top-quartile health systems average 88/100 Epic score', genome:'Unrealized value per unactivated module: $2.1M avg from Genome' } },
    { id:'M05', severity:'warning', title:'Prior Auth Coverage: 23% vs 62% Peer',
      body:'Only 23% of payers have connected prior authorization — peers average 62%. Manual auth driving 4.2-day average vs 1.8-day peer median.',
      impact:'Payer risk rising', owner:'CMIO + COO',
      roles:['CMIO','COO','CFO'], category:'prior_auth',
      sources: { data:'Payer connection audit · Nov 2025', industry:'62% peer prior auth automation rate · HFMA 2025', genome:'23% payer connection drives 4.2-day avg — Genome median is 1.8 days' } },
    { id:'M06', severity:'warning', title:`MA Star ${meridianHealth.healthPlan.medicareAdvantage.starRating} — Bonus Threshold Is 4.0`,
      body:`Medicare Advantage at ${meridianHealth.healthPlan.medicareAdvantage.starRating} stars — below the 4.0 threshold for maximum CMS bonus payments. Star measurement period closes in 8 months.`,
      impact:'$34M bonus at risk', owner:'CMO + CFO',
      roles:['CFO','CEO'], category:'clinical',
      sources: { data:'CMS HEDIS quality data · FY2025', industry:'4.0★ threshold for maximum CMS quality bonus payment', genome:'Star 3.2 → 4.0 transition delivers $34M annual bonus delta from Genome' } },
    { id:'M07', severity:'watch', title:'AI Pilots: Zero Have Scaled',
      body:'6 AI initiatives active. Zero have scaled beyond pilot. $42M invested with no documented outcome against any baseline.',
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
      body:'FIS HORIZON implemented 2004 — 22 years without modernization. Real-time AI scoring blocked by architecture. 76% of peer banks have modernized or added API layer.',
      impact:'AI roadmap blocked', owner:'CTO + Board',
      roles:['CIO','CEO','CFO'], category:'technology',
      sources: { data:'IT architecture review · Apr 2026', industry:'76% of peer banks modernized or added API layer', genome:'FIS HORIZON → AI scoring latency: 2.3s avg in Genome vs 50ms with API layer' } },
    { id:'FC03', severity:'critical', title:'FedNow Not Live — January 2027 Deadline',
      body:`FedNow compliance: not achieved. ${firstCapital.technology.payments.peerBanksOnFedNow}% of peer banks are live. Commercial clients are asking. January 2027 is the hard regulatory deadline.`,
      impact:'$180M deposits at risk', owner:'CTO + COO',
      roles:['CIO','CFO','CEO'], category:'technology',
      sources: { data:'IT project register · Apr 2026', industry:'76% of peer banks live on FedNow · Federal Reserve 2025', genome:'Commercial client loss accelerates at 18 months non-compliance — Genome pattern' } },
    { id:'FC04', severity:'warning', title:'AI Spend With Zero Tracked Outcomes',
      body:'3 AI initiatives active, $1.6M invested. 0 have tracked outcomes against any baseline. Fraud Detection stuck in credit card only scope for 6 months.',
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
      body:'Salesforce Einstein purchased in the SFCC license. Never activated. 18 million loyalty members receiving identical, untailored experiences while competitors personalize in real time.',
      impact:'$248M idle', owner:'CMO + CTO',
      roles:['CMO','CEO','CFO'], category:'ai',
      sources: { data:'Salesforce Einstein activation audit · Mar 2026', industry:'18M loyalty members — zero personalization ROI realized', genome:'Einstein idle license: Genome shows 100% activation rate among top-10 retailers' } },
    { id:'AX02', severity:'critical', title:'Cart Abandonment 14pp Above Benchmark',
      body:'72% cart abandonment vs 58% benchmark — an $840M recovery opportunity. Real-time trigger infrastructure via Segment and Klaviyo already exists. Not connected.',
      impact:'$840M opportunity', owner:'CMO + CTO',
      roles:['CMO','CFO','CEO'], category:'digital',
      sources: { data:'eCommerce platform audit · Mar 2026', industry:'58% peer cart abandonment benchmark · Baymard 2025', genome:'Segment + Klaviyo idle: Genome shows $840M recovery opportunity within 90 days of connection' } },
    { id:'AX03', severity:'warning', title:`Inventory Turns ${apexRetail.financials.inventoryTurnover}x vs 6.8x Benchmark`,
      body:`Inventory turns at ${apexRetail.financials.inventoryTurnover}x vs 6.8x benchmark. $180M excess inventory on the balance sheet. o9 demand forecasting 40% implemented after 18 months.`,
      impact:'$180M tied up', owner:'CFO + CSCO',
      roles:['CFO','COO','CEO'], category:'operations',
      sources: { data:'ERP + o9 project review · Mar 2026', industry:'6.8x peer inventory turns benchmark · Gartner Retail 2025', genome:'o9 at 40% after 18 months — Genome: 3 comparable retailers reached 85%+ in same window' } },
    { id:'AX04', severity:'warning', title:'$38M Untracked Shadow IT Spend',
      body:'28,000 store employees using untracked SaaS tools. $38M in shadow IT spend. CDO role vacant — no AI strategy ownership. 8,400 SAP customizations blocking data flow.',
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
      body:'CDO vacant 11 months. 14 of 28 AI initiatives cite CDO vacancy as primary stall reason. 3 search firms engaged with no hire. Every AI and data initiative is blocked or degraded.',
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
      body:'Salesforce Einstein licensed for 18 months. $14M/yr paid. Zero activation work started. 28.4M loyalty members receiving identical, untailored experiences. CIO and CMO ownership dispute unresolved.',
      impact:'$248M idle', owner:'CMO + CIO',
      roles:['CMO','CEO','CFO'], category:'ai',
      sources: { data:'Salesforce Einstein activation audit · Apr 2026', industry:'28.4M loyalty members — zero personalisation ROI realised', genome:'Einstein idle license: 100% activation rate among top-10 global retailers — Genome' } },
    { id:'NX02', severity:'critical', title:'SAP R/3 EOL December 2027 — No Migration Programme',
      body:'SAP R/3 Continental Europe hits end-of-life December 2027. 20 months remaining. 8,200 customisations. No migration programme initiated. No budget allocated. No SI selected. Migration window is 18–24 months.',
      impact:'$4.6B revenue region at risk', owner:'COO + CFO',
      roles:['COO','CFO','CEO'], category:'technology',
      sources: { data:'SAP EOL documentation + COO data upload · Apr 2026', industry:'SAP R/3 mainstream maintenance ends Dec 2025 — extended only until Dec 2027', genome:'ERP EOL <24 months with no migration plan: 83% failure rate — highest-risk Genome pattern' } },
    { id:'NX03', severity:'critical', title:'E-Commerce at -2.1% Margin — Growing Channel Destroying Blended Margin',
      body:'E-commerce running at -2.1% contribution margin. Revenue growing (22% of total). Every unit of ecommerce growth destroys blended margin. $346M excess fulfilment cost + $269M return cost = $615M annual drag.',
      impact:'$615M annual drag', owner:'CFO + CMO',
      roles:['CFO','CEO'], category:'financial',
      sources: { data:'CFO channel P&L · Apr 2026', industry:'E-commerce peer margin median: +2.8% (Nexora: -2.1%)', genome:'Negative ecom margin with growing channel: 64% of comparable retailers required fulfilment reset before margin recovery' } },
    { id:'NX04', severity:'warning', title:'o9 Demand Forecasting 40% After 18 Months — $900M Inventory Impact',
      body:'o9 demand forecasting 40% implemented after 18 months. $6.8M invested. Inventory turns 4.2x vs 6.8x benchmark. $900M excess inventory on balance sheet. Completion vs restart decision required.',
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

// ─── Financial Risks ──────────────────────────────────────────────────────────
const FINANCIAL_RISKS: Record<ClientId, RiskItem[]> = {
  meridian:     [ { label: 'RCM denial gap', amount: 94 }, { label: 'AI investment undelivered', amount: 42 }, { label: 'Travel nurse overage', amount: 20 }, { label: 'Epic incentive at risk', amount: 34 }, { label: 'MA Star bonus at risk', amount: 34 } ],
  firstcapital: [ { label: 'Digital revenue gap', amount: 48 }, { label: 'Commercial deposits at risk', amount: 180 }, { label: 'Cost-to-income gap', amount: 99 }, { label: 'AI spend untracked', amount: 2 } ],
  apexretail:   [ { label: 'Einstein personalization idle', amount: 248 }, { label: 'Cart abandonment opportunity', amount: 840 }, { label: 'Excess inventory cost', amount: 180 }, { label: 'Shadow IT unmanaged', amount: 38 } ],
  arcturus:     [ { label: 'AI investment untracked', amount: 94 }, { label: 'CIR efficiency gap vs peer median', amount: 840 }, { label: 'MAS FEAT — AUM at regulatory risk', amount: 2400 }, { label: 'Salesforce FSC investment at risk', amount: 38 } ],
  nexora:       [ { label: 'Einstein idle (18 months)', amount: 248 }, { label: 'E-commerce fulfilment drag', amount: 615 }, { label: 'Excess inventory', amount: 900 }, { label: 'Shrinkage excess vs benchmark', amount: 259 }, { label: 'SAP R/3 migration (unfunded)', amount: 35 } ],
}

// ─── Actions ──────────────────────────────────────────────────────────────────
const ACTIONS: Record<ClientId, Action[]> = {
  meridian: [
    { n:1, horizon:'week',    title:'RCM Audit — Pull Q3 Claims by Payer',                  rationale:'Denial gap growing 3 consecutive quarters. Board meeting next month.',    owner:'CFO + Chief Revenue Officer', impact:'$31M identified',        effort:'2 days',    risk:'HIGH' },
    { n:2, horizon:'week',    title:'CDO Interim — Appoint to Unblock AI Pilots',            rationale:'$42M invested, 6 pilots frozen. Board will ask.',                         owner:'CEO',                         impact:'$42M unblocked',         effort:'1 week',    risk:'HIGH' },
    { n:3, horizon:'month',   title:'Prior Auth Vendor — Reactivate or Re-bid',              rationale:'Contract lapsed. 3 payer relationships at risk.',                         owner:'CMIO + COO',                  impact:'Auth delay reduced',      effort:'3 weeks',   risk:'MEDIUM' },
    { n:4, horizon:'month',   title:'Epic Modules — 90-Day Activation Sprint',               rationale:'6 modules dark. CMS incentive at risk.',                                  owner:'CMIO + CIO',                  impact:'$34M incentive',          effort:'90 days',   risk:'MEDIUM' },
    { n:5, horizon:'month',   title:'MA Star Plan — 6-Month Roadmap to 4.0',                rationale:'Measurement window closing. No plan in place.',                            owner:'CMO + CFO',                   impact:'$34M bonus',              effort:'4 weeks',   risk:'HIGH' },
    { n:6, horizon:'quarter', title:'AI Program Reset — Baseline Every Initiative',          rationale:'$42M invested with no documented outcome.',                               owner:'CIO + CDO (interim)',          impact:'$42M accountability',     effort:'6 weeks',   risk:'LOW' },
    { n:7, horizon:'quarter', title:'Travel Nurse Strategy — 18-Month Reduction Plan',       rationale:'$20M overage with no reduction roadmap.',                                 owner:'COO + CNO',                   impact:'$20M / yr',               effort:'8 weeks',   risk:'MEDIUM' },
  ],
  firstcapital: [
    { n:1, horizon:'week',    title:'SQL Server 2017 — Upgrade Decision',                    rationale:'End-of-support October 2025. AI data platform blocked.',                  owner:'CTO + CFO',                   impact:'AI roadmap unblocked',    effort:'1 week',    risk:'HIGH' },
    { n:2, horizon:'week',    title:'FedNow Architecture — API Layer vs Core Modernization', rationale:'76% of peers live. Commercial clients asking now.',                        owner:'CTO + CEO',                   impact:'$180M deposits retained', effort:'2 weeks',   risk:'HIGH' },
    { n:3, horizon:'month',   title:'Fraud Detection — Expand Beyond Credit Card',           rationale:'6 months stuck in limited scope. $3.8M excess losses.',                   owner:'CTO + COO',                   impact:'$3.8M fraud reduction',   effort:'6 weeks',   risk:'MEDIUM' },
    { n:4, horizon:'month',   title:'AML False Positive — NICE Actimize Upgrade',           rationale:'78% false positive rate. 6 excess FTE. OCC MRA risk.',                   owner:'CTO + Compliance',            impact:'$1.1M FTE savings',       effort:'9 months',  risk:'MEDIUM' },
    { n:5, horizon:'quarter', title:'Digital Roadmap — Close Neobank Gap',                   rationale:'41% adoption vs 67% benchmark. 180K customers at churn risk.',            owner:'CMO + CTO',                   impact:'$48M revenue gap',        effort:'Ongoing',   risk:'HIGH' },
  ],
  apexretail: [
    { n:1, horizon:'week',    title:'Einstein Activation — 6-Week Sprint',                   rationale:'Licensed and paid for. Zero incremental cost. Activate now.',              owner:'CMO + CTO',                   impact:'$248M idle',              effort:'6 weeks',   risk:'LOW' },
    { n:2, horizon:'week',    title:'Churn Model Deployment — Already Built',                rationale:'Model validated in Databricks. Sitting undeployed 8 months.',              owner:'CMO + CTO',                   impact:'$84M retention',          effort:'8 weeks',   risk:'LOW' },
    { n:3, horizon:'month',   title:'Cart Recovery — Connect Trigger Infrastructure',        rationale:'Segment and Klaviyo exist. Just need the trigger workflow.',               owner:'CMO + CTO',                   impact:'$168M recovery',          effort:'4 months',  risk:'LOW' },
    { n:4, horizon:'month',   title:'o9 Completion — Finish What You Started',              rationale:'$6.8M paid, 40% implemented, $180M inventory opportunity.',               owner:'CSCO + CFO',                  impact:'$180M inventory',         effort:'9 months',  risk:'MEDIUM' },
    { n:5, horizon:'quarter', title:'CDP Identity Resolution — Unify 18M Profiles',         rationale:'50% profile fragmentation blocking all personalization.',                   owner:'CTO + CMO',                   impact:'Foundation for all AI',   effort:'90 days',   risk:'MEDIUM' },
  ],
  arcturus: [
    { n:1, horizon:'week',    title:'MAS FEAT Remediation — Model Inventory This Week',      rationale:'Overdue 4 months. MAS supervisory action imminent. $2.4B Singapore AUM at risk.', owner:'CRO + CIO',           impact:'$2.4B AUM protected',     effort:'3 months',  risk:'HIGH' },
    { n:2, horizon:'week',    title:'CDO Hire — Appoint Interim to Unblock 14 Initiatives', rationale:'11 months vacant. 14 of 28 AI initiatives explicitly blocked. Board will ask.', owner:'CEO',                  impact:'14 initiatives unblocked',effort:'1 week',    risk:'HIGH' },
    { n:3, horizon:'month',   title:'Aladdin Daily Stress Testing — Configuration Fix',      rationale:'SEC requirement is daily. Running monthly. Direct regulatory exposure.',   owner:'CRO + Head of Technology',    impact:'SEC compliance',          effort:'2 weeks',   risk:'LOW' },
    { n:4, horizon:'month',   title:'AI Portfolio Reset — Baseline Every Initiative',        rationale:'$94M invested with zero documented outcomes. CFO board exposure next meeting.', owner:'CIO + CDO (interim)',   impact:'$94M accountability',     effort:'4 weeks',   risk:'LOW' },
    { n:5, horizon:'month',   title:'Salesforce FSC SSO — Bloomberg AIM Integration',        rationale:'44% adoption driven by missing SSO. Advisors have no reason to switch.',  owner:'Head of Technology',          impact:'Adoption unblocked',      effort:'8 weeks',   risk:'MEDIUM' },
    { n:6, horizon:'quarter', title:'Golden Record Programme — CDO Led',                     rationale:'14 data silos. No golden record. 18 of 28 AI initiatives need this.',     owner:'CDO (hire first)',             impact:'18 AI initiatives unblocked', effort:'12 months', risk:'MEDIUM' },
  ],
  nexora: [
    { n:1, horizon:'week',    title:'Einstein Ownership — Appoint Single Executive Now',     rationale:'18 months idle due to CIO/CMO ownership dispute. Resolve this week.',      owner:'CEO',                         impact:'$248M unblocked',         effort:'1 week',    risk:'LOW' },
    { n:2, horizon:'week',    title:'SAP R/3 Migration — Start SI RFP Now',                 rationale:'EOL December 2027. 20 months left. Migration takes 18-24 months. No margin for delay.', owner:'COO + CFO',        impact:'$4.6B revenue protected', effort:'3 months',  risk:'HIGH' },
    { n:3, horizon:'month',   title:'Einstein Activation Sprint — 8 Weeks to Revenue',      rationale:'$1.2M activation cost. $248M annual upside. 207:1 ROI.',                   owner:'CMO + CIO (joint ownership)', impact:'$248M activated',         effort:'8 weeks',   risk:'LOW' },
    { n:4, horizon:'month',   title:'Cart Recovery — Connect Klaviyo + Segment',            rationale:'Triggers built. Infrastructure paid for. Platform teams not coordinated.',  owner:'CIO',                         impact:'$68M recovery',           effort:'8 weeks',   risk:'LOW' },
    { n:5, horizon:'month',   title:'o9 Completion — Fixed-Fee Contract',                   rationale:'$6.8M invested, 40% done, $900M inventory at stake.',                      owner:'COO',                         impact:'$180M inventory freed',   effort:'9 months',  risk:'MEDIUM' },
    { n:6, horizon:'quarter', title:'Fulfilment Cost — Carrier Consolidation + Return Friction', rationale:'$615M annual drag from fulfilment + returns. CFO mandate: ecom margin positive.', owner:'CFO + COO',       impact:'$269M fulfilment improvement', effort:'9 months', risk:'MEDIUM' },
  ],
}

// ─── Issue Metrics ────────────────────────────────────────────────────────────
const ISSUE_METRICS: Record<string, { label: string; current: string; benchmark: string; gap?: string }> = {
  M01: { label: 'RCM Denial Rate',    current: '18.2%',           benchmark: '12.1% benchmark',    gap: '+6.1pp' },
  M02: { label: 'AI Pilots Scaled',   current: '0 of 6',          benchmark: '3+ expected' },
  M03: { label: 'Travel Nurse Spend', current: '$48M',            benchmark: '$28M target',         gap: '+$20M/yr' },
  M04: { label: 'Epic Score',         current: '61 / 100',        benchmark: '74 peer avg' },
  M05: { label: 'Prior Auth Speed',   current: '4.2 days',        benchmark: '1.8d peer median',    gap: '133% slower' },
  M06: { label: 'MA Star Rating',     current: '3.2 ★',           benchmark: '4.0 threshold' },
  M07: { label: 'AI Spend Tracked',   current: '$0 / $42M',       benchmark: '100% should track' },
  FC01: { label: 'Digital Adoption',  current: '41%',             benchmark: '67% peers',           gap: '−26pp' },
  FC02: { label: 'System Age',        current: '22 years',        benchmark: '6yr avg',             gap: '+16 yrs behind' },
  FC03: { label: 'FedNow Status',     current: 'Not live',        benchmark: '76% peers live' },
  FC04: { label: 'AI Outcomes',       current: '0 tracked',       benchmark: 'Baseline required' },
  FC05: { label: 'Cost-to-Income',    current: '68%',             benchmark: '55% best-in-class',   gap: '+13pp' },
  AX01: { label: 'Einstein Status',   current: 'Never activated', benchmark: 'Purchased · idle' },
  AX02: { label: 'Cart Abandonment',  current: '72%',             benchmark: '58% benchmark',       gap: '+14pp' },
  AX03: { label: 'Inventory Turns',   current: '4.2x',            benchmark: '6.8x peers',          gap: '−2.6x' },
  AX04: { label: 'Shadow IT Spend',   current: '$38M',            benchmark: '$0 managed' },
  AR01: { label: 'AI ROI on $94M',    current: '$0 documented',   benchmark: '100% should track' },
  AR02: { label: 'CDO Vacancy',       current: '11 months',       benchmark: 'Filled' },
  AR03: { label: 'MAS FEAT',          current: 'Overdue 4 months',benchmark: 'Compliant Dec 2025' },
  AR04: { label: 'Cost-to-Income',    current: '71%',             benchmark: '61% peer median',     gap: '+10pp' },
  AR05: { label: 'FSC Adoption',      current: '44%',             benchmark: '72% avg',             gap: '−28pp' },
  AR06: { label: 'Stress Test Freq',  current: 'Monthly',         benchmark: 'Daily (SEC req.)' },
  NX01: { label: 'Einstein Status',   current: 'Never activated', benchmark: '$14M/yr license paid' },
  NX02: { label: 'SAP R/3 Status',    current: 'EOL Dec 2027',    benchmark: 'Migration in progress' },
  NX03: { label: 'E-Com Margin',      current: '-2.1%',           benchmark: '+2.8% peer median',   gap: '−4.9pp' },
  NX04: { label: 'o9 Completion',     current: '40%',             benchmark: '100% in 18 months' },
  NX05: { label: 'Shrinkage Rate',    current: '2.8% ($515M)',    benchmark: '1.4% industry',       gap: '+$259M/yr' },
}

// ─── Client metadata ──────────────────────────────────────────────────────────
const CLIENT_META: Record<ClientId, { name: string; shortName: string; confidence: number; accent: string }> = {
  meridian:     { name: 'Meridian Health System',       shortName: 'Meridian',      confidence: 94, accent: '#4DA3FF' },
  firstcapital: { name: 'First Capital Financial',      shortName: 'First Capital', confidence: 81, accent: '#FF9900' },
  apexretail:   { name: 'Apex Retail Group',            shortName: 'Apex Retail',   confidence: 81, accent: '#34D399' },
  arcturus:     { name: 'Arcturus Financial Group',     shortName: 'Arcturus',      confidence: 88, accent: '#818CF8' },
  nexora:       { name: 'Nexora Retail & Consumer',     shortName: 'Nexora',        confidence: 87, accent: '#F59E0B' },
}

const CLIENTS_LIST: { id: ClientId; name: string; accent: string }[] = [
  { id: 'meridian',     name: 'Meridian Health',    accent: '#4DA3FF' },
  { id: 'arcturus',     name: 'Arcturus Financial', accent: '#818CF8' },
  { id: 'apexretail',   name: 'Apex Retail',        accent: '#34D399' },
  { id: 'firstcapital', name: 'First Capital',      accent: '#FF9900' },
  { id: 'nexora',       name: 'Nexora Retail',      accent: '#F59E0B' },
]

// Map each issue ID → its best-matching action index in ACTIONS[clientId]
const ISSUE_ACTION_IDX: Record<string, number> = {
  M01: 0, M02: 1, M03: 6, M04: 3, M05: 2, M06: 4, M07: 5,
  FC01: 4, FC02: 0, FC03: 1, FC04: 2, FC05: 3,
  AX01: 0, AX02: 2, AX03: 3, AX04: 4,
  AR01: 3, AR02: 1, AR03: 0, AR04: 5, AR05: 4, AR06: 2,
  NX01: 0, NX02: 1, NX03: 5, NX04: 4, NX05: 5,
}

function getActionForIssue(clientId: ClientId, issueId: string): Action | undefined {
  const actions = ACTIONS[clientId]
  if (!actions?.length) return undefined
  const idx = ISSUE_ACTION_IDX[issueId]
  return idx !== undefined ? actions[Math.min(idx, actions.length - 1)] : actions[0]
}

// ─── Main component ───────────────────────────────────────────────────────────
function DiagnoseContent() {
  const { clientId: ctxClientId, allowedClients } = useClientContext()
  const clientId = ctxClientId as ClientId
  const [activeClient, setActiveClient] = useState<ClientId>(clientId)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => { setActiveClient(clientId) }, [clientId])

  const meta = CLIENT_META[activeClient]
  const allIssues = ISSUES[activeClient] ?? []
  const sortedIssues = [...allIssues].sort((a, b) => {
    const order: Record<Severity, number> = { critical: 0, warning: 1, watch: 2 }
    return order[a.severity] - order[b.severity]
  })
  const selected = sortedIssues.find(i => i.id === selectedId) ?? sortedIssues[0]
  const critCount = allIssues.filter(i => i.severity === 'critical').length
  const warnCount = allIssues.filter(i => i.severity === 'warning').length
  const totalRisk = FINANCIAL_RISKS[activeClient]?.reduce((s, r) => s + r.amount, 0) ?? 0

  const visibleClients = CLIENTS_LIST.filter(c => allowedClients.find(a => a.id === c.id))

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: SANS, color: WHITE }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes critPulse { 0%{opacity:.7;transform:scale(1)} 100%{opacity:0;transform:scale(2.4)} }
        @keyframes warnPulse { 0%{opacity:.5;transform:scale(1)} 100%{opacity:0;transform:scale(1.9)} }
        .si-crit-ring { animation: critPulse 2s ease-out infinite; transform-box:fill-box; transform-origin:center; }
        .si-warn-ring { animation: warnPulse 2.8s ease-out infinite; transform-box:fill-box; transform-origin:center; }
        .si-row { transition: background 0.12s; }
        .si-row:hover { background: rgba(255,255,255,0.03) !important; }
      ` }} />

      <AbarvaNav activePage="diagnose" />

      {/* Client tabs + summary bar */}
      <div style={{ background: '#08101C', borderBottom: `1px solid ${BORDER}`, padding: '0 32px', display: 'flex', alignItems: 'center' }}>
        {visibleClients.map(c => (
          <button key={c.id} onClick={() => { setActiveClient(c.id); setSelectedId(null) }}
            style={{ padding: '11px 20px', fontFamily: MONO, fontSize: '10px', fontWeight: 600, cursor: 'pointer', border: 'none',
              borderBottom: activeClient === c.id ? `2px solid ${TEAL}` : '2px solid transparent',
              background: 'transparent', color: activeClient === c.id ? WHITE : MUTED, transition: 'color 0.12s' }}>
            {c.name}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '20px', fontFamily: MONO, fontSize: '9px', letterSpacing: '.08em' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: MUTED }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: DOT_RED, display: 'inline-block' }} />
            {critCount} CRITICAL
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: MUTED }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: DOT_AMBER, display: 'inline-block' }} />
            {warnCount} WARNING
          </span>
          <span style={{ color: MUTED }}>${totalRisk.toLocaleString()}M AT RISK</span>
        </div>
      </div>

      {/* Two-panel layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', height: 'calc(100vh - 96px)' }}>

        {/* LEFT: Issue list */}
        <div style={{ borderRight: `1px solid ${BORDER}`, overflowY: 'auto' as const, background: BG }}>

          {/* Header */}
          <div style={{ padding: '20px', borderBottom: `1px solid ${BORDER}` }}>
            <div style={{ fontFamily: MONO, fontSize: '9px', color: TEAL, letterSpacing: '.14em', textTransform: 'uppercase' as const, marginBottom: '8px' }}>
              Situation Intelligence
            </div>
            <div style={{ fontFamily: SERIF, fontSize: '22px', color: WHITE, lineHeight: 1.2, marginBottom: '4px' }}>
              {sortedIssues.length} issues · {meta.shortName}
            </div>
            <div style={{ fontFamily: MONO, fontSize: '9px', color: MUTED }}>
              {meta.confidence}% data confidence
            </div>
          </div>

          {/* Issue rows */}
          {sortedIssues.map(issue => {
            const color = SEV_COLOR[issue.severity]
            const isSelected = selected?.id === issue.id
            return (
              <div
                key={issue.id}
                className="si-row"
                onClick={() => setSelectedId(issue.id)}
                style={{
                  padding: '16px 20px',
                  borderBottom: `1px solid ${BORDER}`,
                  background: isSelected ? CARD : 'transparent',
                  borderLeft: isSelected ? `3px solid ${TEAL}` : '3px solid transparent',
                  cursor: 'pointer',
                }}
              >
                {/* Severity dot + badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '7px' }}>
                  <div style={{ position: 'relative', width: 8, height: 8, flexShrink: 0 }}>
                    <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: color }} />
                    {issue.severity === 'critical' && (
                      <div className="si-crit-ring" style={{ position: 'absolute', inset: -3, borderRadius: '50%', border: `1px solid ${color}`, opacity: 0 }} />
                    )}
                    {issue.severity === 'warning' && (
                      <div className="si-warn-ring" style={{ position: 'absolute', inset: -3, borderRadius: '50%', border: `1px solid ${color}`, opacity: 0 }} />
                    )}
                  </div>
                  <span style={{ fontFamily: MONO, fontSize: '9px', fontWeight: 600, color: MUTED, letterSpacing: '.1em', textTransform: 'uppercase' as const }}>
                    {issue.severity}
                  </span>
                </div>

                {/* Title */}
                <div style={{ fontSize: '13px', fontWeight: isSelected ? 600 : 400, color: isSelected ? WHITE : MUTED, lineHeight: 1.45, marginBottom: '6px' }}>
                  {issue.title}
                </div>

                {/* Impact */}
                <div style={{ fontFamily: MONO, fontSize: '10px', color: WHITE, fontWeight: 600 }}>
                  {issue.impact}
                </div>
              </div>
            )
          })}
        </div>

        {/* RIGHT: Detail panel */}
        <div style={{ overflowY: 'auto' as const, padding: '32px 40px', background: BG }}>
          {selected && (() => {
            const color = SEV_COLOR[selected.severity]
            const metric = ISSUE_METRICS[selected.id]
            const action = getActionForIssue(activeClient, selected.id)

            return (
              <div style={{ maxWidth: '780px' }}>

                {/* Severity pill + title */}
                <div style={{ marginBottom: '28px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: color }} />
                      <span style={{ fontFamily: MONO, fontSize: '9px', fontWeight: 600, color: MUTED, letterSpacing: '.12em', textTransform: 'uppercase' as const }}>{selected.severity}</span>
                    </span>
                  </div>
                  <h2 style={{ fontFamily: SERIF, fontSize: '26px', fontWeight: 500, color: WHITE, lineHeight: 1.3, margin: '0 0 16px' }}>
                    {selected.title}
                  </h2>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '7px 16px', borderRadius: '8px', background: 'rgba(239,68,68,0.06)', border: `1px solid ${BORDER}` }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: DOT_RED, flexShrink: 0 }} />
                    <span style={{ fontFamily: MONO, fontSize: '9px', color: MUTED, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase' as const }}>Financial Exposure</span>
                    <span style={{ fontFamily: SERIF, fontSize: '16px', color: WHITE, fontWeight: 400 }}>{selected.impact}</span>
                  </div>
                </div>

                {/* Current vs Benchmark — homepage stat card style */}
                {metric && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', marginBottom: '24px', background: CARD, border: `1px solid ${BORDER}`, borderRadius: '10px', overflow: 'hidden' }}>
                    <div style={{ padding: '18px 20px' }}>
                      <div style={{ fontFamily: MONO, fontSize: '9px', color: MUTED, textTransform: 'uppercase' as const, letterSpacing: '.08em', marginBottom: '8px' }}>Current</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
                        <div style={{ fontFamily: SERIF, fontSize: '28px', color: WHITE, lineHeight: 1 }}>{metric.current}</div>
                      </div>
                      {metric.gap && <div style={{ fontFamily: MONO, fontSize: '10px', color: MUTED, marginTop: '6px', fontWeight: 600 }}>{metric.gap}</div>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', padding: '0 16px', borderLeft: `1px solid ${BORDER}`, borderRight: `1px solid ${BORDER}` }}>
                      <span style={{ fontFamily: MONO, fontSize: '9px', color: DIM }}>vs</span>
                    </div>
                    <div style={{ padding: '18px 20px' }}>
                      <div style={{ fontFamily: MONO, fontSize: '9px', color: MUTED, textTransform: 'uppercase' as const, letterSpacing: '.08em', marginBottom: '8px' }}>Benchmark</div>
                      <div style={{ fontFamily: SERIF, fontSize: '28px', color: MUTED, lineHeight: 1 }}>{metric.benchmark}</div>
                    </div>
                  </div>
                )}

                {/* 4 cards — top-border style matching homepage stat cards */}
                {[
                  { label: 'What we found',         text: selected.body,              topColor: TEAL },
                  { label: 'Genome pattern',         text: selected.sources.genome,    topColor: BORDER },
                  { label: 'Evidence basis',         text: selected.sources.data + (selected.sources.industry ? ' · ' + selected.sources.industry : ''), topColor: BORDER },
                  ...(action ? [{ label: 'AbarVa recommendation', text: `${action.title} · ${action.rationale} Owner: ${action.owner}. Effort: ${action.effort}. Expected impact: ${action.impact}.`, topColor: TEAL }] : []),
                ].map((section, i) => (
                  <div key={i} style={{ marginBottom: '12px', padding: '18px 20px', borderRadius: '10px', background: CARD, border: `1px solid ${BORDER}`, borderTop: `2px solid ${section.topColor}` }}>
                    <div style={{ fontFamily: MONO, fontSize: '9px', color: MUTED, textTransform: 'uppercase' as const, letterSpacing: '.08em', marginBottom: '10px' }}>
                      {section.label}
                    </div>
                    <p style={{ fontSize: '14px', color: MUTED, lineHeight: 1.75, margin: 0 }}>{section.text}</p>
                  </div>
                ))}

                {/* Owner row */}
                <div style={{ marginTop: '16px', padding: '12px 20px', background: CARD, border: `1px solid ${BORDER}`, borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ fontFamily: MONO, fontSize: '9px', color: MUTED, letterSpacing: '.08em', textTransform: 'uppercase' as const, flexShrink: 0 }}>Owner</span>
                  <span style={{ fontSize: '13px', color: WHITE }}>{selected.owner}</span>
                </div>

                {/* Other issues pills */}
                <div style={{ marginTop: '28px', borderTop: `1px solid ${BORDER}`, paddingTop: '18px' }}>
                  <div style={{ fontFamily: MONO, fontSize: '9px', color: MUTED, marginBottom: '12px', letterSpacing: '.08em', textTransform: 'uppercase' as const }}>Other issues</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '8px' }}>
                    {sortedIssues.filter(i => i.id !== selected.id).map(issue => {
                      const dotColor = SEV_COLOR[issue.severity]
                      const short = issue.title.split(' — ')[0].split(' · ')[0].split(' ').slice(0, 4).join(' ')
                      return (
                        <button key={issue.id} onClick={() => setSelectedId(issue.id)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: '20px', fontFamily: MONO, fontSize: '9px', fontWeight: 600, cursor: 'pointer', background: 'transparent', color: MUTED, border: `1px solid ${BORDER}` }}>
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
                          {short}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* CTAs */}
                <div style={{ marginTop: '28px', display: 'flex', gap: '10px' }}>
                  <a href={'/ai-strategy?client=' + activeClient}
                    style={{ flex: 1, padding: '12px', borderRadius: '8px', background: TEAL, color: BG, textDecoration: 'none', fontSize: '13px', fontWeight: 600, textAlign: 'center' as const, fontFamily: SANS }}>
                    Build AI Strategy from this →
                  </a>
                  <a href="/contradictions"
                    style={{ flex: 1, padding: '12px', borderRadius: '8px', background: 'transparent', color: MUTED, textDecoration: 'none', fontSize: '13px', textAlign: 'center' as const, border: `1px solid ${BORDER}`, fontFamily: SANS }}>
                    Contradiction Map →
                  </a>
                </div>
              </div>
            )
          })()}
        </div>
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
