'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import AbarvaNav from '@/components/AbarvaNav'
import { supabase } from '@/lib/supabase'
import { FAILURE_PATTERNS, MERIDIAN_GENOME_SUMMARY } from '@/data/knowledge/failure-patterns'

// ─── Design Tokens ─────────────────────────────────────────────────────────────
const T = {
  bg: '#060A12',
  surface: '#0D1520',
  border: '#1C2D45',
  teal: '#2DD4C8',
  red: '#EF4444',
  amber: '#F59E0B',
  green: '#10B981',
  indigo: '#6366F1',
  text: '#EFF6FF',
  text2: '#94A3B8',
  mono: "'JetBrains Mono', monospace" as const,
  serif: "'Fraunces', serif" as const,
  sans: "'DM Sans', sans-serif" as const,
}

// ─── Per-Client Data ────────────────────────────────────────────────────────────
type Bet = {
  id: string
  rank: number
  name: string
  category: string
  phase: string
  wave: string
  annualValueLow: number
  annualValueHigh: number
  confidence: number
  roi: number
  timeline: string
  failureRisk: 'HIGH' | 'MEDIUM' | 'LOW'
  fromData: string[]
  fromIndustry: string[]
  fromGenome: string[]
  objection?: string
  response?: string
  leadDataPoint?: string
}

type FaultLine = {
  side1: string
  side2: string
  tension: 'HIGH RISK' | 'VALIDATED' | 'MODERATE'
  tensionColor: string
  dataPoint: string
  genomeNote: string
  talkingPoint?: string
}

type Opportunity = {
  id: string
  name: string
  value: number
  complexity: 'low' | 'medium' | 'high'
  confidence: number
  wave: 1 | 2 | 3
  isBet: boolean
}

type ClientProfile = {
  name: string
  tagline: string
  readiness: { data: number; tech: number; org: number }
  percentiles: { data: string; tech: string; org: string }
  gaugeBreakdown: {
    data: { clientItems: string[]; industryNote: string; genomeNote: string }
    tech: { clientItems: string[]; industryNote: string; genomeNote: string }
    org: { clientItems: string[]; industryNote: string; genomeNote: string }
  }
  faultLines: FaultLine[]
  bets: Bet[]
  opportunities: Opportunity[]
  wave1Plan: {
    days1_30: { tasks: string[]; owner: string; investment: string }
    days31_60: { tasks: string[]; owner: string; investment: string }
    days61_90: { tasks: string[]; owner: string; investment: string }
    total: { investment: string; annualValue: string; roi: string }
  }
  metrics: { bets: number; analyzed: number; value3yr: string; peers: number; patterns: number; confidence: number }
  cxo: string
}

const CLIENT_DATA: Record<string, ClientProfile> = {
  meridian: {
    name: 'Meridian Health System',
    tagline: 'Where should we place our AI bets — and which ones will fail?',
    readiness: { data: 67, tech: 52, org: 41 },
    percentiles: { data: '58th', tech: '43rd', org: '31st' },
    gaugeBreakdown: {
      data: {
        clientItems: ['Claims data ✓', 'Epic extract ✓', 'Payer contracts ✓', 'Interview transcripts ✗', 'Workforce data ✗'],
        industryNote: 'Health systems with 67%+ data readiness successfully pursue 8 of 12 AI opportunity types',
        genomeNote: 'Organisations with this exact data profile averaged $47M in Year 1 AI value when they prioritised RCM first',
      },
      tech: {
        clientItems: ['Azure Synapse ✓ (partial)', 'Epic native integration ✓', 'MLOps ✗', 'Real-time data pipeline ✗', 'AI governance ✗'],
        industryNote: 'Health systems at 52% tech readiness can deploy 4 of 5 Wave 1 use cases with existing Epic architecture',
        genomeNote: 'Absent MLOps is the most common Wave 2 blocker — requires 60-day build before clinical AI scale',
      },
      org: {
        clientItems: ['CFO urgency (denial rate) ✓', 'CMIO clinical champion ✓', 'CDO vacant ✗', 'Change capacity limited ✗', 'Prior AI failures ✗'],
        industryNote: '31st percentile org readiness is manageable for Wave 1 RCM focus — CFO and clinical champions reduce resistance',
        genomeNote: 'CDO vacancy is the highest-risk org signal — 75% of failures shared this characteristic at go-live',
      },
    },
    faultLines: [
      { side1: 'CFO: "Cost reduction first"', side2: 'CIO: "Clinical AI first"', tension: 'HIGH RISK', tensionColor: T.red, dataPoint: 'Revenue cycle AI delivers 3.5x more value than clinical AI at Meridian\'s data maturity', genomeNote: 'In 23 similar organisations with this fault line unresolved, AI programme ROI was 41% lower', talkingPoint: 'Ask CFO and CIO to agree on a shared ROI metric before vendor selection — this one conversation prevents the most common failure mode' },
      { side1: 'CIO: "Build on Epic"', side2: 'CMIO: "Buy best-of-breed"', tension: 'VALIDATED', tensionColor: T.green, dataPoint: '3 of 6 proposed Epic AI modules have <40% activation in peer systems', genomeNote: 'CMIO concern is validated by Genome data — best-of-breed beats native for clinical documentation AI by 2.4x ROI', talkingPoint: 'CMIO is right here — lead with the peer activation data and let the evidence validate the clinical perspective' },
      { side1: 'COO: "Fix travel nurses now"', side2: 'CIO: "Foundation first"', tension: 'MODERATE', tensionColor: T.amber, dataPoint: 'Travel nurse scheduling AI has 34% success rate when CDO is vacant', genomeNote: 'Wave 2 sequencing (after CDO appointed) improves scheduling AI success rate from 34% to 71%', talkingPoint: 'Acknowledge the COO urgency, then show the success-rate data — numbers convert urgency into sequencing buy-in' },
      { side1: 'CIO: "Prove one thing first"', side2: 'CFO: "Portfolio investment"', tension: 'MODERATE', tensionColor: T.amber, dataPoint: 'Organisations with 1–3 Wave 1 initiatives succeed at 83% vs 44% for >5 initiatives', genomeNote: 'Scope discipline is itself a success predictor; CIO instinct and data are aligned here', talkingPoint: 'CIO instinct is right — the data supports it. Use this to align CFO to a focused Wave 1 portfolio' },
      { side1: 'CMIO: "Sepsis model is ready"', side2: 'CIO: "No MLOps to deploy it"', tension: 'HIGH RISK', tensionColor: T.red, dataPoint: 'Undeployed validated models have a 19% eventual success rate vs 77% for deployed within 90 days', genomeNote: 'Undeployed validated models signal an MLOps gap that blocks all future AI scale — resolving this unblocks sepsis AND Wave 2', talkingPoint: 'The sepsis model is the proof point — use it to get MLOps investment approved. The model IS ready; the infrastructure is not' },
    ],
    bets: [
      { id: 'rcm', rank: 1, name: 'RCM AI Automation', category: 'Revenue Cycle · Middle Office', phase: 'Grow', wave: 'Wave 1 · 90 days', annualValueLow: 28, annualValueHigh: 39, confidence: 82, roi: 7, timeline: '14 months to full value', failureRisk: 'MEDIUM', fromData: ['Denial rate: 18.2%', 'Gap to peer median: 6.8pp', 'IT budget: $504M'], fromIndustry: ['47 deployments analysed', 'Median value: $19M', 'Top quartile: $34M'], fromGenome: ['34% fail rate overall', '3 risk signals present', 'CDO vacancy is key risk'], objection: 'Why RCM AI when we have clinical AI models already validated?', response: 'RCM AI produces CFO wins in 6 months that fund clinical AI in Year 2. Reversing the sequence has 44% lower ROI realisation based on Genome data.', leadDataPoint: '$94M denial write-off — every 1pp improvement is worth $13.8M annually' },
      { id: 'priorauth', rank: 2, name: 'Prior Auth AI', category: 'Revenue Cycle · Front Office', phase: 'Grow', wave: 'Wave 1 · 90 days', annualValueLow: 18, annualValueHigh: 24, confidence: 78, roi: 6, timeline: '9 months to full value', failureRisk: 'MEDIUM', fromData: ['23% payers connected', 'Manual processing: 77%', 'CMS deadline: Jan 2026'], fromIndustry: ['41 deployments analysed', 'Median value: $16M', 'CMS mandate creates urgency'], fromGenome: ['Data gap risk', 'Payer connectivity is key', 'Remediation sprint required'], objection: 'Prior auth AI requires payer connectivity we do not have yet.', response: 'A 30-day data sprint brings you to 55–60% — sufficient for pilot accuracy. CMS deadline creates external urgency that accelerates internal buy-in.', leadDataPoint: 'CMS Jan 2026 deadline — non-compliance is $1.2M in annual penalty exposure' },
      { id: 'clinicaldoc', rank: 3, name: 'Clinical Documentation AI', category: 'Clinical · Back Office', phase: 'Save', wave: 'Wave 1 · 90 days', annualValueLow: 12, annualValueHigh: 18, confidence: 74, roi: 4, timeline: '12 months to full value', failureRisk: 'LOW', fromData: ['2.1 hrs/day physician doc time', 'Epic native integration ✓', '1 dept pilot succeeded'], fromIndustry: ['38 deployments analysed', 'Median value: $14M', 'Epic-native 2.4x better ROI'], fromGenome: ['Low risk profile', 'CMIO champion present', 'Epic integration path clear'], objection: 'Physicians are already overloaded — adding a new tool increases burden.', response: 'The pilot department showed 68% physician satisfaction increase. The tool reduces burden, not adds to it. CMIO can champion this.', leadDataPoint: '68% physician burnout rate — documentation AI addresses the #1 reported cause' },
      { id: 'travelnurse', rank: 4, name: 'Travel Nurse Reduction', category: 'Workforce · Middle Office', phase: 'Save', wave: 'Wave 1 · 90 days', annualValueLow: 14, annualValueHigh: 20, confidence: 76, roi: 8, timeline: '6 months to full value', failureRisk: 'LOW', fromData: ['756 travel nurses', '$142M annual cost', 'Kronos data complete'], fromIndustry: ['29 deployments analysed', 'Median savings: $14M', 'Azure ML builds fastest'], fromGenome: ['Low risk — simple time-series', 'No MLOps required', '90-day advance booking key'], objection: 'We have tried scheduling optimisation before and it did not work.', response: 'Previous attempts were scheduling tools, not predictive models. Demand prediction 90 days in advance enables contract negotiation — the source of the savings.', leadDataPoint: '$142M travel nurse spend vs $24M permanent nurse equivalent for same coverage' },
      { id: 'epicopt', rank: 5, name: 'Epic Optimisation Sprint', category: 'Technology · Back Office', phase: 'Save', wave: 'Wave 1 · 90 days', annualValueLow: 8, annualValueHigh: 12, confidence: 88, roi: 21, timeline: '2 months to full value', failureRisk: 'LOW', fromData: ['340 VMs below 20% utilisation', '$1.8M identified waste', 'Azure Cost Management connected'], fromIndustry: ['24 deployments analysed', 'Median savings: $4.2M', 'Azure native fastest ROI'], fromGenome: ['Highest confidence bet', 'No integration risk', 'Azure Advisor native'], objection: 'IT team is fully allocated to Azure Synapse work.', response: 'Azure Advisor runs autonomously — no IT FTE required for Wave 1. Two-month payback is the fastest ROI in the portfolio.', leadDataPoint: '21x ROI — the highest-confidence, fastest-payback bet in the entire portfolio' },
    ],
    opportunities: [
      { id: 'mo-001', name: 'RCM AI Automation', value: 37600000, complexity: 'medium', confidence: 72, wave: 1, isBet: true },
      { id: 'fo-001', name: 'Prior Auth AI', value: 28000000, complexity: 'medium', confidence: 68, wave: 1, isBet: true },
      { id: 'bo-005', name: 'Clinical Documentation AI', value: 42000000, complexity: 'high', confidence: 66, wave: 1, isBet: true },
      { id: 'mo-004', name: 'Travel Nurse Demand Prediction', value: 14000000, complexity: 'low', confidence: 78, wave: 1, isBet: true },
      { id: 'bo-003', name: 'Epic Optimisation Sprint', value: 4200000, complexity: 'low', confidence: 92, wave: 1, isBet: true },
      { id: 'fo-004', name: 'Sepsis AI Scale-up', value: 24000000, complexity: 'low', confidence: 91, wave: 1, isBet: false },
      { id: 'mo-002', name: 'Coding Accuracy AI', value: 18000000, complexity: 'low', confidence: 82, wave: 1, isBet: false },
      { id: 'fo-002', name: 'Patient No-Show Prediction', value: 14700000, complexity: 'low', confidence: 84, wave: 1, isBet: false },
      { id: 'fo-003', name: 'MA Star Rating Optimisation', value: 34000000, complexity: 'high', confidence: 58, wave: 2, isBet: false },
      { id: 'mo-003', name: 'Nurse Scheduling Optimisation', value: 28000000, complexity: 'medium', confidence: 64, wave: 2, isBet: false },
      { id: 'bo-004', name: 'AIOps Incident Prediction', value: 8000000, complexity: 'high', confidence: 58, wave: 2, isBet: false },
      { id: 'mo-005', name: 'Supply Chain Forecasting', value: 8000000, complexity: 'low', confidence: 76, wave: 1, isBet: false },
    ],
    wave1Plan: {
      days1_30: { tasks: ['Baseline locked', 'RCM audit complete', 'CDO interim named'], owner: 'CFO + CRO', investment: '$4M' },
      days31_60: { tasks: ['Vendor selected', 'Contract signed', 'Data pipeline set'], owner: 'CIO', investment: '$2M' },
      days61_90: { tasks: ['Pilot live', 'Team trained', 'First results'], owner: 'CDO interim', investment: '$2M' },
      total: { investment: '$21M', annualValue: '$77M', roi: '3.7x' },
    },
    metrics: { bets: 5, analyzed: 12, value3yr: '$864M', peers: 47, patterns: 127, confidence: 87 },
    cxo: 'Marcus Webb, CIO',
  },
  firstcapital: {
    name: 'First Capital Bank',
    tagline: 'Where should we place our AI bets — and which technology constraints matter?',
    readiness: { data: 52, tech: 38, org: 44 },
    percentiles: { data: '42nd', tech: '28th', org: '48th' },
    gaugeBreakdown: {
      data: {
        clientItems: ['Transactional data ✓', 'AML data ✓', 'Customer profiles ✗ (T+1)', 'Real-time data ✗', 'Unified ID ✗'],
        industryNote: 'Community banks at 52% data readiness can deploy fraud and AML AI with batch scoring — real-time is Wave 2',
        genomeNote: 'Real-time data gap is the most common Wave 2 blocker for financial services AI — FedNow API layer resolves it',
      },
      tech: {
        clientItems: ['FIS HORIZON (blocks real-time) ✗', 'SQL Server 2017 EOS ✗', 'Azure Cloud ✓', 'Q2 Digital Platform ✓', 'NICE Actimize ✓'],
        industryNote: '28th percentile tech readiness is driven entirely by FIS HORIZON constraint — organisation has talent and cloud tools',
        genomeNote: 'Architecture constraint, not capability gap — 73% of similarly constrained banks succeeded by working within constraints for Wave 1',
      },
      org: {
        clientItems: ['Strong CFO sponsorship ✓', 'Regulatory urgency (OCC MRAs) ✓', 'No CDO role ✗', 'COO resistance ✗', 'Budget competition ✗'],
        industryNote: '48th percentile org readiness is above median for community banks — regulatory pressure is a positive forcing function',
        genomeNote: 'CFO-sponsored AI programmes have 81% success rate in financial services — this is the key positive signal',
      },
    },
    faultLines: [
      { side1: 'CTO: "Architecture first"', side2: 'CFO: "AI delivers now"', tension: 'MODERATE', tensionColor: T.amber, dataPoint: 'Wave 1 fraud and AML AI works within FIS HORIZON constraints — architecture is Wave 2 prerequisite, not Wave 1 blocker', genomeNote: 'In 14 similar banks, Wave 1 ROI funded the architecture modernisation — sequencing conflict resolved by data', talkingPoint: 'Show the CFO that Wave 1 ROI funds the architecture — one does not wait for the other' },
      { side1: 'COO: "Prove one thing"', side2: 'CMO: "Personalisation now"', tension: 'VALIDATED', tensionColor: T.green, dataPoint: 'Personalisation requires real-time data — impossible without FIS HORIZON modernisation. COO is right for Wave 1', genomeNote: 'T+1 data produces 40% lower personalisation ROI than real-time — CMO urgency is real but sequencing matters', talkingPoint: 'CMO is right about the value; COO is right about the timing — Wave 2 personalisation is the right answer' },
      { side1: 'CFO: "Compliance cost first"', side2: 'CTO: "Core banking first"', tension: 'HIGH RISK', tensionColor: T.red, dataPoint: 'AML false positive rate 74% — 3 OCC MRAs at risk. Compliance cost 34% of IT budget. CFO has the urgent case', genomeNote: 'Regulatory pressure is the most powerful forcing function for AI investment — use OCC MRA urgency to sequence compliance AI first', talkingPoint: 'The OCC MRAs are not a distraction — they are the reason Wave 1 AI investment is pre-approved' },
      { side1: 'CMO: "Digital experience"', side2: 'CIO: "Data quality first"', tension: 'VALIDATED', tensionColor: T.green, dataPoint: 'T+1 balance problem means real-time personalisation is impossible — CIO is right. Mobile rating 3.2 is the symptom', genomeNote: 'Data quality investment in Q1 unlocks 3x the CMO value in Q4 — validated sequence across 11 peers', talkingPoint: 'CMO wants the experience; CIO knows the constraint. Show them the Q4 plan for personalisation after FedNow' },
      { side1: 'CFO: "Cost-to-income to 55%"', side2: 'COO: "Projects go over budget"', tension: 'HIGH RISK', tensionColor: T.red, dataPoint: 'Cost-to-income 68% vs 55% target — $32M gap. AI in compliance and back office is the fastest path', genomeNote: 'COO resistance is a data point, not a blocker — outcome-based contracts address the root concern directly', talkingPoint: 'Use outcome-based contract structure to address COO concern. AbarVa earns only on verified savings' },
    ],
    bets: [
      { id: 'fraud', rank: 1, name: 'Real-Time Fraud Detection ML', category: 'Compliance · Front Office', phase: 'Protect', wave: 'Wave 1 · 90 days', annualValueLow: 3, annualValueHigh: 5, confidence: 84, roi: 10, timeline: '9 months to full value', failureRisk: 'MEDIUM', fromData: ['Fraud losses: $7M', 'Benchmark: $3.2M', 'Excess: $3.8M'], fromIndustry: ['31 deployments analysed', 'FedNow layer required', 'FICO Falcon performs best'], fromGenome: ['Real-time data gap risk', 'FedNow completion required', 'Architecture constraint manageable'], objection: 'FIS HORIZON blocks real-time scoring.', response: 'FedNow API layer completion (60 days) creates a real-time data pathway without changing FIS HORIZON. This is the architectural bridge.', leadDataPoint: '$3.8M annual excess fraud loss vs benchmark — every month of delay is $317K' },
      { id: 'aml', rank: 2, name: 'AML False Positive Reduction', category: 'Compliance · Middle Office', phase: 'Protect', wave: 'Wave 1 · 90 days', annualValueLow: 4, annualValueHigh: 6, confidence: 78, roi: 7, timeline: '12 months to full value', failureRisk: 'LOW', fromData: ['AML false positives: 74%', 'OCC MRAs: 3 open', 'NICE Actimize: outdated version'], fromIndustry: ['24 deployments analysed', 'NICE upgrade 2.4x improvement', 'Regulatory benefit accelerates ROI'], fromGenome: ['Regulatory forcing function', 'OCC urgency is positive signal', 'Version upgrade is low-risk path'], objection: 'NICE Actimize upgrade will take 18 months.', response: 'Actimize Cloud migration runs parallel to on-premise — 90-day pilot on Cloud instance while maintaining compliance on current system.', leadDataPoint: '3 open OCC MRAs — AML AI directly addresses the root cause regulators cited' },
      { id: 'underwriting', rank: 3, name: 'Credit Underwriting AI', category: 'Lending · Front Office', phase: 'Grow', wave: 'Wave 1 · 90 days', annualValueLow: 5, annualValueHigh: 8, confidence: 72, roi: 5, timeline: '9 months to full value', failureRisk: 'MEDIUM', fromData: ['Manual review: 68% of applications', 'Loss rate above peer median', 'Credit approval gap'], fromIndustry: ['19 deployments analysed', 'ML reduces manual review by 62%', 'Digital channel lift 2.4x'], fromGenome: ['FIS data quality gap', 'Batch scoring viable for underwriting', 'Digital channel is entry point'], objection: 'Credit AI requires real-time data we do not have.', response: 'Credit underwriting is batch, not real-time — T+1 data is sufficient. This is Wave 1 viable without FIS changes.', leadDataPoint: '68% manual review rate — AI brings this to 24%, freeing $2.8M in underwriter capacity annually' },
      { id: 'chatbot', rank: 4, name: 'Customer Service AI', category: 'Digital · Front Office', phase: 'Grow', wave: 'Wave 1 · 90 days', annualValueLow: 2, annualValueHigh: 3, confidence: 76, roi: 4, timeline: '4 months to full value', failureRisk: 'LOW', fromData: ['Call centre volume: 340K/year', 'Digital adoption: 41%', 'Q2 Platform connected'], fromIndustry: ['28 deployments analysed', 'Q2 chatbot 64% deflection rate', 'Mobile rating improvement 0.6 pts'], fromGenome: ['Low risk — existing Q2 licence', 'Quick win builds CMO credibility', 'Foundation for personalisation'], objection: 'Customers will not trust a chatbot for financial queries.', response: 'Q2 research shows 71% of customers prefer self-service for balance and transaction queries. Escalation to human remains available.', leadDataPoint: '41% digital adoption vs 67% peer benchmark — chatbot is the fastest path to close the gap' },
      { id: 'contracts', rank: 5, name: 'Contract Analytics AI', category: 'Operations · Back Office', phase: 'Save', wave: 'Wave 1 · 90 days', annualValueLow: 2, annualValueHigh: 3, confidence: 88, roi: 12, timeline: '3 months to full value', failureRisk: 'LOW', fromData: ['SLA penalties available: $3.2M', 'Enforced: $0', 'Vendor contracts: 847'], fromIndustry: ['21 deployments analysed', 'Azure OpenAI builds fastest', 'Median ROI: 10x'], fromGenome: ['Highest confidence bet', 'No integration required', 'CFO credibility builder'], objection: 'Legal will resist AI reviewing contracts.', response: 'AI flags, legal decides. 94% of flagged items are clear SLA breaches — legal time spent on judgement calls, not document review.', leadDataPoint: '$3.2M in available SLA penalties — $0 currently enforced. Pure found money in 90 days.' },
    ],
    opportunities: [
      { id: 'fo-001', name: 'Real-Time Fraud Detection', value: 3800000, complexity: 'medium', confidence: 68, wave: 1, isBet: true },
      { id: 'mo-001', name: 'AML False Positive Reduction', value: 4800000, complexity: 'medium', confidence: 78, wave: 1, isBet: true },
      { id: 'fo-003', name: 'Credit Underwriting AI', value: 6000000, complexity: 'medium', confidence: 72, wave: 1, isBet: true },
      { id: 'fo-004', name: 'Customer Service AI', value: 2400000, complexity: 'low', confidence: 76, wave: 1, isBet: true },
      { id: 'bo-001', name: 'Contract Analytics AI', value: 2000000, complexity: 'low', confidence: 88, wave: 1, isBet: true },
      { id: 'fo-002', name: 'Customer Churn Prediction', value: 8400000, complexity: 'medium', confidence: 62, wave: 2, isBet: false },
      { id: 'fo-005', name: 'Personalised Digital Banking', value: 12000000, complexity: 'high', confidence: 42, wave: 3, isBet: false },
      { id: 'mo-002', name: 'Document Processing AI', value: 3600000, complexity: 'low', confidence: 82, wave: 1, isBet: false },
      { id: 'mo-003', name: 'Loan Origination Automation', value: 4200000, complexity: 'medium', confidence: 64, wave: 2, isBet: false },
      { id: 'bo-002', name: 'Regulatory Reporting AI', value: 2800000, complexity: 'low', confidence: 76, wave: 1, isBet: false },
      { id: 'bo-003', name: 'Branch Network Optimisation', value: 1800000, complexity: 'high', confidence: 52, wave: 2, isBet: false },
      { id: 'mo-004', name: 'Collections Optimisation', value: 3200000, complexity: 'medium', confidence: 68, wave: 1, isBet: false },
    ],
    wave1Plan: {
      days1_30: { tasks: ['Baseline locked', 'FedNow API scoped', 'AML vendor shortlisted'], owner: 'CTO + CFO', investment: '$1.5M' },
      days31_60: { tasks: ['Fraud pilot live (batch)', 'AML vendor selected', 'Contract AI deployed'], owner: 'CTO', investment: '$1.2M' },
      days61_90: { tasks: ['Real-time scoring live', 'AML false positives measured', 'First CFO report'], owner: 'CDO (new)', investment: '$1.3M' },
      total: { investment: '$11M', annualValue: '$18M', roi: '1.6x' },
    },
    metrics: { bets: 5, analyzed: 12, value3yr: '$128M', peers: 31, patterns: 127, confidence: 81 },
    cxo: 'James Okafor, CTO',
  },
  apexretail: {
    name: 'Apex Retail Group',
    tagline: 'Where should we place our AI bets — and which ones to activate vs build?',
    readiness: { data: 54, tech: 48, org: 36 },
    percentiles: { data: '44th', tech: '51st', org: '24th' },
    gaugeBreakdown: {
      data: {
        clientItems: ['Transactional data ✓', 'Snowflake warehouse ✓', 'Segment CDP ✗ (50% fragmented)', 'SAP-Snowflake pipeline ✗', 'Store operations data ✗'],
        industryNote: 'Retail at 54% data readiness can activate existing tools (Einstein) and deploy validated models without new data investment',
        genomeNote: 'Identity resolution sprint (6 weeks) is the highest-ROI data investment — enables 3 of 5 Wave 1 bets immediately',
      },
      tech: {
        clientItems: ['Salesforce SFCC ✓', 'Databricks ✓', 'Snowflake ✓', 'SAP ECC (fragmented) ✗', 'CDO role ✗'],
        industryNote: 'Technology capability above median — tools exist, activation is the gap. Einstein paid for, unactivated.',
        genomeNote: 'Organisations with existing AI tools unactivated have the highest short-term ROI potential — activation beats build by 15x',
      },
      org: {
        clientItems: ['CEO urgency (revenue) ✓', 'CMO champion ✓', 'CDO vacant ✗', '68% staff turnover ✗', '4 failed pilots ✗'],
        industryNote: '24th percentile org readiness reflects change fatigue from 4 failed AI promises — CEO involvement is the primary corrective',
        genomeNote: 'Organisations recovering from failed AI promises succeed when they choose high-visibility quick wins for Wave 1 — Einstein activation is ideal',
      },
    },
    faultLines: [
      { side1: 'CEO: "Personalisation now"', side2: 'CTO: "Data foundation first"', tension: 'VALIDATED', tensionColor: T.green, dataPoint: 'Einstein activation requires identity resolution — 6-week sprint unblocks both CEO and CTO simultaneously', genomeNote: 'Data foundation and AI activation are not sequential — in 12 retail cases, concurrent approach delivered 2.1x faster time to value', talkingPoint: 'CTO and CEO are both right — the identity resolution sprint unlocks Einstein AND fixes the data foundation' },
      { side1: 'CFO: "Complete o9 first"', side2: 'CEO: "New capabilities"', tension: 'HIGH RISK', tensionColor: T.red, dataPoint: 'o9 completion requires SAP integration — 9 months. Einstein activation requires 6 weeks. Both can run in parallel.', genomeNote: 'Organisations that paused all AI for one system completion had 62% programme mortality — parallel tracks prevent this', talkingPoint: 'o9 and Einstein are different teams and budgets — parallel tracks eliminate the CFO concern and the CEO delay' },
      { side1: 'CMO: "Activate Einstein"', side2: 'CTO: "Segment fragmentation"', tension: 'VALIDATED', tensionColor: T.green, dataPoint: '6-week Segment identity resolution sprint brings fragmentation from 2.8x to 1.1x — Einstein activation follows immediately', genomeNote: 'CMO urgency is the forcing function that gets Segment sprint funded — use it', talkingPoint: 'CMO urgency about Einstein gets the Segment sprint funded — these two want the same thing' },
      { side1: 'COO: "Store staff turnover"', side2: 'CEO: "Store AI investment"', tension: 'HIGH RISK', tensionColor: T.red, dataPoint: '68% annual store staff turnover — AI tools deployed to staff who leave within 6 months have negative ROI on training', genomeNote: 'Store AI in this context has 28% success rate — Wave 1 should be centralised (personalisation, inventory) not store-dependent', talkingPoint: 'COO is right — store AI Wave 1 has poor ROI here. Centralised AI avoids the turnover problem' },
      { side1: 'CMO: "Loyalty reactivation"', side2: 'CFO: "Inventory first"', tension: 'MODERATE', tensionColor: T.amber, dataPoint: 'Loyalty reactivation Wave 1 value ($124M) is 2.6x inventory optimisation ($48M) — CMO bet produces faster CFO wins', genomeNote: 'Loyalty AI has shorter payback (4 months vs 10 months) — CMO and CFO goals aligned with correct sequencing', talkingPoint: 'Show the CFO the loyalty ROI timeline — 4-month payback vs 10-month for inventory. Same budget, faster returns.' },
    ],
    bets: [
      { id: 'einstein', rank: 1, name: 'Einstein Personalisation Activation', category: 'Digital · Front Office', phase: 'Grow', wave: 'Wave 1 · 6 weeks', annualValueLow: 180, annualValueHigh: 248, confidence: 86, roi: 310, timeline: '3 months to full value', failureRisk: 'LOW', fromData: ['18M loyalty members', 'Einstein: paid, unactivated', 'Cart abandonment: 72%'], fromIndustry: ['12 deployments analysed', 'Existing licence = zero software cost', 'Identity resolution is prerequisite'], fromGenome: ['Highest ROI bet in dataset', 'Activation beats build by 15x', 'CDP fragmentation is the only risk'], objection: 'We have been saying we will activate Einstein for 14 months.', response: 'The barrier was Segment fragmentation — now scoped and solvable in 6 weeks. This time the blocker has a known fix and a dedicated team.', leadDataPoint: '$248M opportunity — Einstein licence already paid. Pure activation cost, not software investment.' },
      { id: 'churn', rank: 2, name: 'Customer Churn Model Deployment', category: 'Digital · Front Office', phase: 'Retain', wave: 'Wave 1 · 8 weeks', annualValueLow: 64, annualValueHigh: 84, confidence: 88, roi: 140, timeline: '2 months to full value', failureRisk: 'LOW', fromData: ['Model built, undeployed 8 months', '18M members, 58% inactive', 'Databricks model validated'], fromIndustry: ['Deployment of existing model', 'No training cost required', 'Activation workflow 6-week build'], fromGenome: ['Built-validated-undeployed = highest risk pattern', 'Activation now or model becomes stale', 'CEO visibility opportunity'], objection: 'Why was this not deployed 8 months ago?', response: 'No activation workflow was built — the model was trained but the last-mile was missing. That is an 8-week build on top of a validated model.', leadDataPoint: 'Model validated 8 months ago — every month of non-deployment cost $7M in unaddressed churn' },
      { id: 'loyalty', rank: 3, name: 'Loyalty Reactivation AI', category: 'Digital · Front Office', phase: 'Retain', wave: 'Wave 1 · 90 days', annualValueLow: 84, annualValueHigh: 124, confidence: 72, roi: 30, timeline: '4 months to full value', failureRisk: 'MEDIUM', fromData: ['Loyalty active rate: 42%', 'Inactive members: 10.4M', 'Punchh platform connected'], fromIndustry: ['18 deployments analysed', 'Punchh ML outperforms generic email', 'Benchmark active rate: 68%'], fromGenome: ['CDP fragmentation risk', 'Identity sprint prerequisite', 'CEO visible quick win'], objection: 'We have tried loyalty campaigns — they do not work.', response: 'Previous campaigns were generic — same offer to all 18M members. This is ML-personalised by reactivation trigger. The Genome shows 3.8x improvement vs generic campaigns.', leadDataPoint: '10.4M inactive members — if you get 5% back at average spend, that is $620M in recovered revenue' },
      { id: 'cartabandonment', rank: 4, name: 'Cart Abandonment Recovery AI', category: 'Digital · Front Office', phase: 'Grow', wave: 'Wave 1 · 90 days', annualValueLow: 120, annualValueHigh: 168, confidence: 82, roi: 70, timeline: '4 months to full value', failureRisk: 'LOW', fromData: ['Cart abandonment: 72%', 'Benchmark: 58%', 'Yotpo platform connected'], fromIndustry: ['Klaviyo/Attentive ML', 'Trigger infrastructure exists', 'Benchmark recovery rate: 12–18%'], fromGenome: ['Low risk — infrastructure ready', 'Real-time trigger already available', 'Quick win for CEO'], objection: 'Recovery emails are annoying — customers unsubscribe.', response: 'Triggered at right time with personalised offer, recovery emails convert at 14% with 92% opt-in retention. Generic triggered emails cause unsubscribes — personalised ones do not.', leadDataPoint: '$840M recovery opportunity — at 15% recovery rate, that is $126M annual incremental revenue' },
      { id: 'o9completion', rank: 5, name: 'o9 Demand Forecasting Completion', category: 'Supply Chain · Middle Office', phase: 'Save', wave: 'Wave 1 · 90 days', annualValueLow: 32, annualValueHigh: 48, confidence: 74, roi: 7, timeline: '10 months to full value', failureRisk: 'MEDIUM', fromData: ['Current accuracy: 62%', 'Benchmark: 84%', 'Excess inventory: $180M'], fromIndustry: ['SAP integration required', 'o9 median improvement: 18pp accuracy', 'CFO balance sheet fix'], fromGenome: ['o9 completion requires SAP sprint', 'CDO needed to own data quality', 'Complete existing tool > new investment'], objection: 'o9 has already failed once — why will it work now?', response: 'o9 failed because SAP was not connected. The SAP integration sprint (9 weeks) is the specific fix — same tool, fixed data feed, proven methodology.', leadDataPoint: '$180M excess inventory on the balance sheet — every 10pp accuracy improvement frees $18M in capital' },
    ],
    opportunities: [
      { id: 'fo-001', name: 'Einstein Personalisation Activation', value: 248000000, complexity: 'low', confidence: 72, wave: 1, isBet: true },
      { id: 'fo-002', name: 'Customer Churn Model Deployment', value: 84000000, complexity: 'low', confidence: 86, wave: 1, isBet: true },
      { id: 'fo-003', name: 'Loyalty Reactivation AI', value: 124000000, complexity: 'medium', confidence: 64, wave: 1, isBet: true },
      { id: 'fo-004', name: 'Cart Abandonment Recovery', value: 168000000, complexity: 'low', confidence: 82, wave: 1, isBet: true },
      { id: 'mo-001', name: 'o9 Demand Forecasting', value: 48000000, complexity: 'high', confidence: 58, wave: 1, isBet: true },
      { id: 'fo-005', name: 'Loss Prevention AI', value: 28000000, complexity: 'medium', confidence: 72, wave: 1, isBet: false },
      { id: 'mo-002', name: 'Store Operations AI', value: 18000000, complexity: 'high', confidence: 44, wave: 2, isBet: false },
      { id: 'mo-003', name: 'Supplier Contract AI', value: 12000000, complexity: 'low', confidence: 76, wave: 1, isBet: false },
      { id: 'mo-004', name: 'Workforce Scheduling AI', value: 22000000, complexity: 'high', confidence: 38, wave: 3, isBet: false },
      { id: 'bo-001', name: 'AP Invoice Automation', value: 8000000, complexity: 'low', confidence: 82, wave: 1, isBet: false },
      { id: 'bo-002', name: 'Space Planning AI', value: 14000000, complexity: 'medium', confidence: 56, wave: 2, isBet: false },
      { id: 'bo-003', name: 'Fraud Detection AI', value: 24000000, complexity: 'medium', confidence: 66, wave: 1, isBet: false },
    ],
    wave1Plan: {
      days1_30: { tasks: ['Baseline locked', 'Segment sprint started', 'o9 SAP scope defined'], owner: 'CMO + CTO', investment: '$2M' },
      days31_60: { tasks: ['Identity resolution complete', 'Einstein pilot live', 'Churn model deployed'], owner: 'CMO', investment: '$1.5M' },
      days61_90: { tasks: ['Einstein at scale', 'Churn offers live', 'Cart abandonment live'], owner: 'CDO (new)', investment: '$1.5M' },
      total: { investment: '$18M', annualValue: '$480M', roi: '26.7x' },
    },
    metrics: { bets: 5, analyzed: 12, value3yr: '$2.1B', peers: 38, patterns: 127, confidence: 83 },
    cxo: 'Margaret Chen, CEO',
  },
}

// ─── SVG Gauge Dial ─────────────────────────────────────────────────────────────
function GaugeDial({ pct, color, label, percentile }: { pct: number; color: string; label: string; percentile: string }) {
  const [animPct, setAnimPct] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setAnimPct(pct), 200)
    return () => clearTimeout(t)
  }, [pct])
  const r = 44, cx = 55, cy = 58
  const circ = Math.PI * r
  const dashOffset = circ * (1 - animPct / 100)
  return (
    <div style={{ textAlign: 'center', flex: 1 }}>
      <svg viewBox="0 0 110 80" style={{ width: '100%', maxWidth: '140px' }}>
        <path d={`M ${cx - r},${cy} A ${r},${r} 0 0,0 ${cx + r},${cy}`} fill="none" stroke={T.border} strokeWidth={10} strokeLinecap="round" />
        <path d={`M ${cx - r},${cy} A ${r},${r} 0 0,0 ${cx + r},${cy}`} fill="none" stroke={color} strokeWidth={10} strokeLinecap="round"
          strokeDasharray={`${circ} ${circ}`} strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 1.4s ease-out' }} />
        <text x={cx} y={cy - 14} textAnchor="middle" fill={T.text} fontSize={20} fontWeight={700} fontFamily="Fraunces, serif">{pct}%</text>
        <text x={cx} y={cy + 2} textAnchor="middle" fill={T.text2} fontSize={8} fontFamily="JetBrains Mono, monospace">{percentile} percentile</text>
      </svg>
      <div style={{ fontSize: '10px', fontFamily: T.mono, fontWeight: 700, color: T.text, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '-8px' }}>{label}</div>
    </div>
  )
}

// ─── Scatter Plot ────────────────────────────────────────────────────────────────
// [xPct, yPct] — x = complexity (left=low, right=high), y = value (top=high)
const SCATTER_POS: Record<string, [number, number]> = {
  'mo-001': [46, 26], 'fo-001': [54, 36], 'bo-005': [82, 16], 'mo-004': [14, 52],
  'bo-003': [10, 84], 'fo-004': [16, 40], 'mo-002': [20, 48], 'fo-002': [24, 54],
  'fo-003': [86, 28], 'mo-003': [50, 34], 'bo-004': [84, 76], 'mo-005': [26, 76],
}
// First Capital positions
const SCATTER_POS_FC: Record<string, [number, number]> = {
  'fo-001': [48, 68], 'mo-001': [50, 62], 'fo-003': [46, 56], 'fo-004': [16, 72],
  'bo-001': [14, 78], 'fo-002': [54, 46], 'fo-005': [84, 36], 'mo-002': [20, 70],
  'mo-003': [52, 60], 'bo-002': [22, 74], 'bo-003': [82, 80], 'mo-004': [44, 64],
}
// Apex positions
const SCATTER_POS_APEX: Record<string, [number, number]> = {
  'fo-001': [16, 8], 'fo-002': [14, 30], 'fo-003': [48, 18], 'fo-004': [18, 12],
  'mo-001': [84, 34], 'fo-005': [50, 38], 'mo-002': [82, 52], 'mo-003': [20, 54],
  'mo-004': [84, 42], 'bo-001': [22, 62], 'bo-002': [50, 50], 'bo-003': [54, 40],
}

function ScatterPlot({ opps, clientKey }: { opps: Opportunity[]; clientKey: string }) {
  const W = 600, H = 220
  const posMap = clientKey === 'firstcapital' ? SCATTER_POS_FC : clientKey === 'apexretail' ? SCATTER_POS_APEX : SCATTER_POS
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', border: `1px solid ${T.border}`, borderRadius: '8px', background: T.surface }}>
        <text x={10} y={14} fill={T.text2} fontSize={9} fontFamily="JetBrains Mono, monospace">HIGH VALUE</text>
        <text x={10} y={H - 6} fill={T.text2} fontSize={9} fontFamily="JetBrains Mono, monospace">LOW VALUE</text>
        <text x={W / 2 - 80} y={H - 6} fill={T.text2} fontSize={9} fontFamily="JetBrains Mono, monospace">← LOW COMPLEXITY         HIGH COMPLEXITY →</text>
        <line x1={38} y1={18} x2={38} y2={H - 18} stroke={T.border} strokeWidth={1} strokeDasharray="3,3" />
        <line x1={38} y1={H - 18} x2={W - 18} y2={H - 18} stroke={T.border} strokeWidth={1} strokeDasharray="3,3" />
        {opps.map(opp => {
          const pos = posMap[opp.id]
          if (!pos) return null
          const x = 38 + (pos[0] / 100) * (W - 56)
          const y = 18 + (pos[1] / 100) * (H - 36)
          const r2 = 4 + (opp.confidence / 100) * 8
          const col = opp.isBet ? T.teal : opp.wave === 2 ? '#3B82F6' : '#334155'
          return (
            <g key={opp.id}>
              <circle cx={x} cy={y} r={r2} fill={col} fillOpacity={opp.isBet ? 0.9 : 0.55} stroke={col} strokeWidth={1} />
              {opp.isBet && <circle cx={x} cy={y} r={r2 + 4} fill="none" stroke={T.teal} strokeWidth={1} strokeOpacity={0.35} />}
            </g>
          )
        })}
      </svg>
      <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
        {[{ col: T.teal, label: 'Recommended Bet' }, { col: '#3B82F6', label: 'Wave 2' }, { col: '#334155', label: 'Wave 3 / Deprioritised' }].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: l.col }} />
            <span style={{ fontSize: '11px', color: T.text2, fontFamily: T.mono }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Bet Card ────────────────────────────────────────────────────────────────────
function BetCard({ bet, onGenome, confirmedBets, removedBets, onConfirm, onRemove, mode }: {
  bet: Bet; onGenome: () => void; confirmedBets: Set<string>; removedBets: Set<string>
  onConfirm: (id: string) => void; onRemove: (id: string) => void; mode: 'prep' | 'live'
}) {
  const [interaction, setInteraction] = useState<'none' | 'challenge' | 'remove' | 'suggest'>('none')
  const [suggestText, setSuggestText] = useState('')
  const isConfirmed = confirmedBets.has(bet.id)
  const isRemoved = removedBets.has(bet.id)
  const riskColor = bet.failureRisk === 'HIGH' ? T.red : bet.failureRisk === 'MEDIUM' ? T.amber : T.green
  const riskIcon = bet.failureRisk === 'HIGH' ? '🔴' : bet.failureRisk === 'MEDIUM' ? '🟡' : '🟢'

  return (
    <div style={{ minWidth: '340px', background: T.surface, border: `1px solid ${T.border}`, borderTop: `3px solid ${isConfirmed ? T.teal : riskColor}`, borderRadius: '10px', padding: '20px', opacity: isRemoved ? 0.5 : 1, flexShrink: 0, transition: 'opacity 0.3s' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div style={{ fontSize: '10px', fontFamily: T.mono, color: T.teal, fontWeight: 700, letterSpacing: '0.08em' }}>⭐ BET {bet.rank} — RECOMMENDED</div>
        <div style={{ fontSize: '10px', fontFamily: T.mono, color: T.text2, background: T.bg, padding: '2px 8px', borderRadius: '4px' }}>{bet.wave}</div>
      </div>
      <div style={{ fontSize: '16px', fontWeight: 700, color: T.text, fontFamily: T.sans, marginBottom: '2px' }}>{bet.name}</div>
      <div style={{ fontSize: '11px', color: T.text2, marginBottom: '14px' }}>{bet.category}</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginBottom: '14px' }}>
        {[
          { label: 'FROM YOUR DATA', items: bet.fromData, col: T.teal },
          { label: 'FROM INDUSTRY', items: bet.fromIndustry, col: '#3B82F6' },
          { label: 'FROM GENOME', items: bet.fromGenome, col: '#A78BFA' },
        ].map(src => (
          <div key={src.label} style={{ background: T.bg, borderRadius: '6px', padding: '8px' }}>
            <div style={{ fontSize: '8px', fontFamily: T.mono, color: src.col, fontWeight: 700, letterSpacing: '0.08em', marginBottom: '6px' }}>{src.label}</div>
            {src.items.map((item, i) => <div key={i} style={{ fontSize: '10px', color: T.text, lineHeight: 1.5 }}>{item}</div>)}
          </div>
        ))}
      </div>

      <div style={{ marginBottom: '10px' }}>
        <div style={{ fontSize: '10px', fontFamily: T.mono, color: T.text2, letterSpacing: '0.06em', marginBottom: '4px' }}>YOUR ESTIMATED VALUE</div>
        <div style={{ fontSize: '13px', color: T.text }}>
          <strong style={{ color: T.teal }}>${bet.annualValueLow}–{bet.annualValueHigh}M</strong> annually · {bet.confidence}% confidence · {bet.roi}x ROI · {bet.timeline}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div style={{ fontSize: '11px', color: riskColor }}>FAILURE RISK: {riskIcon} <strong>{bet.failureRisk}</strong></div>
        <button onClick={onGenome} style={{ fontSize: '10px', color: T.teal, background: 'none', border: `1px solid ${T.teal}`, borderRadius: '4px', padding: '3px 8px', cursor: 'pointer', fontFamily: T.mono }}>View Failure Genome →</button>
      </div>

      {mode === 'prep' && bet.objection && interaction === 'none' && (
        <div style={{ background: T.bg, border: `1px solid ${T.indigo}40`, borderRadius: '6px', padding: '10px', marginBottom: '12px' }}>
          <div style={{ fontSize: '9px', fontFamily: T.mono, color: T.indigo, fontWeight: 700, marginBottom: '6px' }}>MAESTRO PREP — LIKELY OBJECTION</div>
          <div style={{ fontSize: '11px', color: T.text, marginBottom: '6px', fontStyle: 'italic' }}>"{bet.objection}"</div>
          <div style={{ fontSize: '9px', fontFamily: T.mono, color: T.teal, fontWeight: 700, marginBottom: '4px' }}>SUGGESTED RESPONSE</div>
          <div style={{ fontSize: '11px', color: T.text, marginBottom: bet.leadDataPoint ? '8px' : '0' }}>{bet.response}</div>
          {bet.leadDataPoint && <>
            <div style={{ fontSize: '9px', fontFamily: T.mono, color: T.amber, fontWeight: 700, marginTop: '8px', marginBottom: '4px' }}>DATA POINT TO LEAD WITH</div>
            <div style={{ fontSize: '11px', color: T.text }}>{bet.leadDataPoint}</div>
          </>}
        </div>
      )}

      {interaction === 'challenge' && (
        <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: '6px', padding: '14px', marginBottom: '12px' }}>
          <div style={{ fontSize: '10px', fontFamily: T.mono, color: T.text, fontWeight: 700, marginBottom: '10px' }}>CHALLENGE: {bet.name.toUpperCase()}</div>
          <div style={{ fontSize: '11px', color: T.text2, marginBottom: '10px' }}>You questioned this recommendation. Here is the evidence.</div>
          {[
            { label: 'FROM YOUR DATA', col: T.teal, text: `${bet.fromData.join(' · ')}. This is the source of the $${bet.annualValueLow}–${bet.annualValueHigh}M estimate.` },
            { label: 'FROM INDUSTRY', col: '#3B82F6', text: `${bet.fromIndustry.join(' · ')}. Your situation maps closest to the organisations that succeeded.` },
            { label: 'FROM GENOME', col: '#A78BFA', text: `${bet.fromGenome.join(' · ')}. AbarVa still recommends this. The risks are real but manageable.` },
          ].map(s => (
            <div key={s.label} style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '9px', fontFamily: T.mono, color: s.col, fontWeight: 700, marginBottom: '4px' }}>{s.label}</div>
              <div style={{ fontSize: '11px', color: T.text }}>{s.text}</div>
            </div>
          ))}
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <button onClick={() => { setInteraction('none'); onConfirm(bet.id) }} style={{ flex: 1, padding: '8px', background: T.teal, color: T.bg, border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', fontFamily: T.sans }}>I understand — keep this bet</button>
            <button onClick={() => setInteraction('remove')} style={{ padding: '8px 14px', background: 'none', color: T.red, border: `1px solid ${T.red}`, borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontFamily: T.sans }}>Still remove it →</button>
          </div>
        </div>
      )}

      {interaction === 'remove' && (
        <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: '6px', padding: '14px', marginBottom: '12px' }}>
          <div style={{ fontSize: '10px', fontFamily: T.mono, color: T.text, fontWeight: 700, marginBottom: '10px' }}>TRADE-OFF ANALYSIS</div>
          <div style={{ fontSize: '12px', color: T.text, marginBottom: '8px' }}>You removed: <strong>{bet.name}</strong></div>
          <div style={{ fontSize: '12px', color: T.text, lineHeight: 1.8 }}>
            · 3-year value drops by <strong style={{ color: T.red }}>–${bet.annualValueLow * 3}M+</strong><br />
            · Wave 1 ROI reduced significantly<br />
            · The gap this addresses remains unresolved<br />
            · Your CXO will likely ask about this at the next review
          </div>
          <div style={{ marginTop: '12px', fontSize: '11px', color: T.text2 }}>What would you replace it with?</div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button onClick={() => setInteraction('suggest')} style={{ flex: 1, padding: '8px', background: T.teal, color: T.bg, border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', fontFamily: T.sans }}>Suggest your own →</button>
            <button onClick={() => { setInteraction('none'); onRemove(bet.id) }} style={{ padding: '8px 14px', background: 'none', color: T.red, border: `1px solid ${T.red}`, borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontFamily: T.sans }}>Confirm remove</button>
          </div>
        </div>
      )}

      {interaction === 'suggest' && (
        <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: '6px', padding: '14px', marginBottom: '12px' }}>
          <div style={{ fontSize: '10px', fontFamily: T.mono, color: T.text, fontWeight: 700, marginBottom: '8px' }}>ASSESS AN ALTERNATIVE</div>
          <div style={{ fontSize: '11px', color: T.text2, marginBottom: '8px' }}>What initiative would you like to explore?</div>
          <textarea value={suggestText} onChange={e => setSuggestText(e.target.value)} placeholder="Describe the AI initiative..." style={{ width: '100%', background: T.surface, border: `1px solid ${T.border}`, borderRadius: '6px', padding: '8px', color: T.text, fontSize: '12px', resize: 'none', height: '60px', boxSizing: 'border-box' as const, fontFamily: T.sans }} />
          <button onClick={() => setInteraction('none')} style={{ marginTop: '8px', width: '100%', padding: '8px', background: T.teal, color: T.bg, border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', fontFamily: T.sans }}>Assess this →</button>
        </div>
      )}

      {interaction === 'none' && (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => onConfirm(bet.id)} style={{ flex: 1, padding: '8px', background: isConfirmed ? T.teal : 'none', color: isConfirmed ? T.bg : T.teal, border: `1px solid ${T.teal}`, borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', fontFamily: T.sans }}>
            {isConfirmed ? '✓ Confirmed' : '✓ Keep this bet'}
          </button>
          <button onClick={() => setInteraction('remove')} style={{ padding: '8px 12px', background: 'none', color: T.red, border: `1px solid ${T.red}`, borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontFamily: T.sans }}>✗ Remove</button>
          <button onClick={() => setInteraction('challenge')} style={{ padding: '8px 12px', background: 'none', color: T.text2, border: `1px solid ${T.border}`, borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontFamily: T.sans }}>? Challenge</button>
        </div>
      )}
    </div>
  )
}

// ─── Failure Genome Drawer ────────────────────────────────────────────────────────
function GenomeDrawer({ clientKey, onClose }: { clientKey: string; onClose: () => void }) {
  const summary = MERIDIAN_GENOME_SUMMARY
  const clientPat = clientKey as 'meridian' | 'firstcapital' | 'apexretail'
  return (
    <div style={{ position: 'fixed', top: 0, right: 0, width: '420px', height: '100vh', background: T.surface, borderLeft: `1px solid ${T.border}`, zIndex: 100, overflowY: 'auto', boxShadow: '-8px 0 32px rgba(0,0,0,0.5)' }}>
      <div style={{ padding: '20px', borderBottom: `1px solid ${T.border}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '10px', fontFamily: T.mono, color: T.teal, fontWeight: 700, letterSpacing: '0.1em', marginBottom: '4px' }}>FAILURE GENOME</div>
            <div style={{ fontSize: '13px', color: T.text, fontWeight: 600 }}>RCM AI Automation · {clientKey === 'meridian' ? 'Meridian Health' : clientKey === 'firstcapital' ? 'First Capital Bank' : 'Apex Retail'}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: T.text2, cursor: 'pointer', fontSize: '18px', lineHeight: 1 }}>✕</button>
        </div>
      </div>
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.border}`, background: T.bg }}>
        <div style={{ fontSize: '11px', color: T.text2, fontFamily: T.mono, marginBottom: '4px' }}>FROM THE GENOME: {summary.totalAnalyzed} deployments analysed</div>
        <div style={{ fontSize: '12px', color: T.text }}>{summary.succeeded} succeeded ({summary.overallSuccessRate}%) · {summary.failed} failed ({100 - summary.overallSuccessRate}%)</div>
        <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, fontFamily: T.mono, background: '#F59E0B20', color: T.amber, border: `1px solid ${T.amber}` }}>
            OVERALL RISK: 🟡 {summary.riskRating}
          </span>
          <span style={{ fontSize: '11px', color: T.text2 }}>{summary.patternsPresent} of 7 patterns present</span>
        </div>
      </div>
      <div style={{ paddingBottom: '80px' }}>
        {FAILURE_PATTERNS.map((fp, i) => {
          const clientData = fp.clients[clientPat] || fp.clients.meridian
          const riskColor = clientData.riskLevel === 'HIGH' ? T.red : clientData.riskLevel === 'MEDIUM' ? T.amber : T.green
          const riskIcon = clientData.riskLevel === 'HIGH' ? '🔴' : clientData.riskLevel === 'MEDIUM' ? '🟡' : '🟢'
          return (
            <div key={fp.id} style={{ padding: '16px 20px', borderBottom: `1px solid ${T.border}` }}>
              <div style={{ fontSize: '9px', fontFamily: T.mono, color: T.teal, fontWeight: 700, letterSpacing: '0.1em', marginBottom: '6px' }}>
                PATTERN {i + 1}: {fp.name.toUpperCase()}
              </div>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, fontFamily: T.mono, background: riskColor + '20', color: riskColor, border: `1px solid ${riskColor}` }}>
                  {riskIcon} {clientData.riskLevel === 'NONE' ? 'NOT PRESENT' : clientData.riskLevel} — {clientData.present ? 'PRESENT' : 'NOT PRESENT'}
                </span>
              </div>
              {clientData.present ? (
                <>
                  <div style={{ fontSize: '9px', fontFamily: T.mono, color: '#64748B', letterSpacing: '0.08em', marginBottom: '3px' }}>FROM GENOME</div>
                  <div style={{ fontSize: '11px', color: T.text2, marginBottom: '8px' }}>{fp.inFailures} of {fp.inFailures + fp.inSuccesses} deployments with this pattern failed</div>
                  <div style={{ fontSize: '9px', fontFamily: T.mono, color: T.teal, letterSpacing: '0.08em', marginBottom: '3px' }}>AT CLIENT</div>
                  <div style={{ fontSize: '11px', color: T.text, marginBottom: '8px' }}>{clientData.evidence}</div>
                  <div style={{ fontSize: '9px', fontFamily: T.mono, color: T.amber, letterSpacing: '0.08em', marginBottom: '3px' }}>MITIGATION</div>
                  <div style={{ fontSize: '11px', color: T.text, marginBottom: '10px' }}>{clientData.mitigation}</div>
                  <button style={{ fontSize: '10px', color: T.teal, background: 'none', border: `1px solid ${T.teal}`, borderRadius: '4px', padding: '4px 10px', cursor: 'pointer', fontFamily: T.mono }}>
                    {clientData.specificAction} →
                  </button>
                </>
              ) : (
                <div style={{ fontSize: '11px', color: T.green }}>✓ {clientData.evidence}</div>
              )}
            </div>
          )
        })}
        <div style={{ margin: '16px 20px', padding: '16px', background: T.bg, border: `2px solid ${T.teal}`, borderRadius: '8px' }}>
          <div style={{ fontSize: '10px', fontFamily: T.mono, color: T.teal, fontWeight: 700, letterSpacing: '0.08em', marginBottom: '8px' }}>BOTTOM LINE</div>
          <div style={{ fontSize: '13px', color: T.text, lineHeight: 1.7 }}>{summary.bottomLine}</div>
          <div style={{ marginTop: '10px', fontSize: '12px', color: T.teal }}>
            Mitigate 2 patterns → success probability <strong>{summary.adjustedSuccessRate}%</strong> (vs {summary.overallSuccessRate}% baseline)
          </div>
          <button style={{ marginTop: '12px', width: '100%', padding: '10px', background: T.teal, color: T.bg, border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: T.sans }}>
            Generate full risk mitigation plan →
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Board Deck Act ───────────────────────────────────────────────────────────────
const SLIDE_TITLES = ['Executive Summary', 'Your Situation', 'Where Leadership Disagrees', 'The Opportunity Landscape', 'Your Five Bets', 'The Wave 1 Plan', 'The Investment Case', 'Risk Mitigation', 'What We Need to Proceed', 'The Outcome Commitment']

function BoardDeckAct({ profile, clientId, onConfirmOpen }: { profile: ClientProfile; clientId: string; onConfirmOpen: () => void }) {
  const [selectedSlide, setSelectedSlide] = useState(0)
  const [editingSlide, setEditingSlide] = useState<number | null>(null)
  void clientId
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '24px' }}>
      <div>
        <div style={{ fontSize: '10px', fontFamily: T.mono, color: T.text2, letterSpacing: '0.1em', marginBottom: '12px' }}>10 SLIDES · READY TO PRESENT</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {SLIDE_TITLES.map((title, i) => (
            <div key={i} onClick={() => setSelectedSlide(i)} style={{ background: selectedSlide === i ? T.teal + '15' : T.surface, border: `1px solid ${selectedSlide === i ? T.teal : T.border}`, borderRadius: '8px', padding: '14px', cursor: 'pointer', transition: 'all 0.15s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <div style={{ fontSize: '9px', fontFamily: T.mono, color: T.text2 }}>SLIDE {i + 1}</div>
                <button onClick={e => { e.stopPropagation(); setEditingSlide(editingSlide === i ? null : i) }} style={{ fontSize: '10px', background: 'none', border: 'none', color: T.text2, cursor: 'pointer', padding: 0 }}>✏</button>
              </div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: selectedSlide === i ? T.teal : T.text }}>{title}</div>
              {i === 0 && <div style={{ fontSize: '10px', color: T.text2, marginTop: '3px' }}>5 AI bets · {profile.metrics.value3yr} 3-year value</div>}
              {i === 4 && <div style={{ fontSize: '10px', color: T.text2, marginTop: '3px', whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile.bets.map(b => b.name).join(', ')}</div>}
              {editingSlide === i && (
                <div style={{ marginTop: '8px' }} onClick={e => e.stopPropagation()}>
                  <textarea style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: '4px', color: T.text, fontSize: '10px', padding: '4px', resize: 'none', height: '40px', boxSizing: 'border-box' as const }} placeholder="Adjust content..." />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <div>
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '10px', padding: '24px' }}>
          <div style={{ fontSize: '10px', fontFamily: T.mono, color: T.teal, fontWeight: 700, letterSpacing: '0.1em', marginBottom: '6px' }}>YOUR BOARD DECK IS READY</div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: T.text, marginBottom: '2px' }}>{profile.name}</div>
          <div style={{ fontSize: '12px', color: T.text2, marginBottom: '20px' }}>AI Investment Strategy 2026 · Prepared by AbarVa</div>
          <div style={{ fontSize: '10px', fontFamily: T.mono, color: T.text2, letterSpacing: '0.06em', marginBottom: '10px', borderBottom: `1px solid ${T.border}`, paddingBottom: '8px' }}>DOWNLOAD OPTIONS</div>
          {[
            { icon: '📊', label: 'Present Now →', sub: 'Open full-screen. Keyboard navigable. Speaker notes visible to presenter only.' },
            { icon: '⬇', label: 'Download HTML →', sub: 'Single file. Opens in any browser. Send to board before the meeting.' },
            { icon: '📈', label: 'Business Case Excel →', sub: 'CFO-ready financial model. 3 scenarios with sensitivity analysis.' },
            { icon: '🗺', label: 'Technical Roadmap →', sub: 'CIO-ready implementation plan. Wave 1 detail with owners and dates.' },
          ].map(item => (
            <button key={item.label} style={{ display: 'block', width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: '8px', padding: '12px 14px', marginBottom: '8px', cursor: 'pointer', textAlign: 'left' as const }}>
              <div style={{ fontSize: '12px', color: T.text, fontWeight: 600, marginBottom: '2px' }}>{item.icon} {item.label}</div>
              <div style={{ fontSize: '10px', color: T.text2 }}>{item.sub}</div>
            </button>
          ))}
          <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: `1px solid ${T.border}` }}>
            <div style={{ fontSize: '10px', fontFamily: T.mono, color: T.indigo, fontWeight: 700, letterSpacing: '0.06em', marginBottom: '8px' }}>MAESTRO PREP PACK</div>
            {[
              { label: '📋 Talking Points Doc →', sub: 'One page per bet. Objections and suggested responses.' },
              { label: '❓ Likely Questions →', sub: 'What the CIO, CFO, and CMIO will ask. Answers with evidence.' },
            ].map(item => (
              <button key={item.label} style={{ display: 'block', width: '100%', background: T.bg, border: `1px solid ${T.indigo}40`, borderRadius: '8px', padding: '10px 14px', marginBottom: '8px', cursor: 'pointer', textAlign: 'left' as const }}>
                <div style={{ fontSize: '12px', color: T.text, fontWeight: 600, marginBottom: '2px' }}>{item.label}</div>
                <div style={{ fontSize: '10px', color: T.text2 }}>{item.sub}</div>
              </button>
            ))}
          </div>
          <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: `1px solid ${T.border}` }}>
            <div style={{ fontSize: '10px', fontFamily: T.mono, color: T.text2, letterSpacing: '0.06em', marginBottom: '8px' }}>WHAT HAPPENS NEXT</div>
            {['AbarVa locks the baseline metrics today', 'Wave 1 begins — 90-day clock starts', 'Outcomes tracked monthly in the platform', 'Fee triggers only on verified savings'].map((item, i) => (
              <div key={i} style={{ fontSize: '11px', color: T.text, marginBottom: '6px' }}>
                <span style={{ color: T.teal, fontFamily: T.mono, marginRight: '6px' }}>{i + 1}.</span>{item}
              </div>
            ))}
          </div>
          <button onClick={onConfirmOpen} style={{ marginTop: '16px', width: '100%', padding: '14px', background: T.teal, color: T.bg, border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: T.sans }}>
            Confirm bets and set baseline →
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Confirm Modal ─────────────────────────────────────────────────────────────────
function ConfirmModal({ profile, clientId, onClose }: { profile: ClientProfile; clientId: string; onClose: () => void }) {
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  async function handleConfirm() {
    setSaving(true)
    try {
      await supabase.from('ai_baselines').insert({
        client_id: clientId,
        client_name: profile.name,
        bets: profile.bets.map(b => ({ id: b.id, name: b.name, targetLow: b.annualValueLow, targetHigh: b.annualValueHigh })),
        total_wave1_target: profile.wave1Plan.total.annualValue,
        locked_at: new Date().toISOString(),
        cxo_signer: profile.cxo,
      })
    } catch (_) { /* table may not exist in demo */ }
    setTimeout(() => { setSaving(false); setDone(true) }, 800)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(6,10,18,0.88)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '12px', padding: '32px', maxWidth: '540px', width: '100%', margin: '0 20px' }}>
        {done ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>✅</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: T.teal, fontFamily: T.serif, marginBottom: '8px' }}>Baseline Locked</div>
            <div style={{ fontSize: '13px', color: T.text2, marginBottom: '24px' }}>{profile.name} now appears in Outcome Intelligence. Wave 1 clock starts today.</div>
            <button onClick={onClose} style={{ padding: '12px 32px', background: T.teal, color: T.bg, border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: T.sans }}>Continue →</button>
          </div>
        ) : (
          <>
            <div style={{ fontSize: '10px', fontFamily: T.mono, color: T.teal, fontWeight: 700, letterSpacing: '0.1em', marginBottom: '4px' }}>CONFIRM YOUR FIVE BETS</div>
            <div style={{ fontSize: '13px', color: T.text2, marginBottom: '20px' }}>{profile.name} · {today}</div>
            <div style={{ fontSize: '12px', color: T.text2, marginBottom: '8px' }}>You are confirming:</div>
            {profile.bets.map((b, i) => (
              <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
                <div style={{ fontSize: '13px', color: T.text }}><span style={{ color: T.teal, marginRight: '8px' }}>{i + 1}.</span>{b.name}</div>
                <div style={{ fontSize: '12px', color: T.teal, fontFamily: T.mono }}>${b.annualValueLow}–{b.annualValueHigh}M</div>
              </div>
            ))}
            <div style={{ marginTop: '14px', padding: '12px', background: T.bg, borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: T.text2 }}>Total Wave 1 target</span>
              <span style={{ fontSize: '16px', color: T.teal, fontWeight: 700, fontFamily: T.mono }}>{profile.wave1Plan.total.annualValue} annual value</span>
            </div>
            <div style={{ marginTop: '14px', padding: '14px', background: T.bg, border: `1px solid ${T.border}`, borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', color: T.text2, lineHeight: 1.7, marginBottom: '10px' }}>
                AbarVa will: lock today's metrics as baseline · begin monthly outcome tracking · report progress in Outcome Intelligence · fee triggers only when savings are verified
              </div>
              <div style={{ fontSize: '14px', fontFamily: T.serif, color: T.text }}>{profile.cxo} confirms this commitment</div>
              <div style={{ borderBottom: `1px solid ${T.text}`, marginTop: '8px', paddingBottom: '2px', fontSize: '12px', color: T.text2 }}>Signed: _______________</div>
              <div style={{ fontSize: '11px', color: T.text2, marginTop: '6px' }}>Date: {today}</div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button onClick={handleConfirm} disabled={saving} style={{ flex: 1, padding: '14px', background: T.teal, color: T.bg, border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: saving ? 'default' : 'pointer', fontFamily: T.sans, opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Locking baseline...' : 'Confirm and Lock Baseline →'}
              </button>
              <button onClick={onClose} style={{ padding: '14px 20px', background: 'none', color: T.text2, border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontFamily: T.sans }}>
                Not yet →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Main Content ─────────────────────────────────────────────────────────────────
function AiStrategyContent() {
  const params = useSearchParams()
  const clientId = params.get('client') || 'meridian'
  const profile = CLIENT_DATA[clientId] || CLIENT_DATA.meridian

  const [act, setAct] = useState<1 | 2 | 3>(1)
  const [mode, setMode] = useState<'prep' | 'live'>('prep')
  const [showStepNav, setShowStepNav] = useState(false)
  const [showGenomeDrawer, setShowGenomeDrawer] = useState(false)
  const [confirmedBets, setConfirmedBets] = useState<Set<string>>(new Set())
  const [removedBets, setRemovedBets] = useState<Set<string>>(new Set())
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [expandedGauge, setExpandedGauge] = useState<'data' | 'tech' | 'org' | null>(null)

  const bd = profile.gaugeBreakdown
  const STEPS = ['Ground Truth', 'Executives Disagree', 'Every Opportunity', 'Your Five Bets', 'Wave 1 Plan', 'Business Case', 'Failure Genome', 'Board Deck Ready']
  const ACT_STEPS: Record<number, number[]> = { 1: [0, 1], 2: [2, 3, 4, 5, 6], 3: [7] }

  const ANIM_CSS = `
    @keyframes fadein { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
    .act-fade { animation: fadein 0.3s ease-out; }
  `

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.sans }}>
      <style dangerouslySetInnerHTML={{ __html: ANIM_CSS }} />
      <AbarvaNav />

      {/* Product Header */}
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: '20px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '10px', fontFamily: T.mono, color: T.teal, fontWeight: 700, letterSpacing: '0.12em', marginBottom: '6px' }}>💡 AI INVESTMENT INTELLIGENCE</div>
              <div style={{ fontSize: '24px', fontFamily: T.serif, fontWeight: 700, color: T.text, marginBottom: '8px', maxWidth: '600px', lineHeight: 1.3 }}>{profile.tagline}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: T.text }}>{profile.metrics.bets} recommended bets</span>
                <span style={{ color: T.border }}>·</span>
                <span style={{ fontSize: '13px', color: T.text }}>{profile.metrics.analyzed} opportunities analysed</span>
                <span style={{ color: T.border }}>·</span>
                <span style={{ fontSize: '13px', color: T.teal, fontWeight: 600 }}>{profile.metrics.value3yr} 3-year value</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginTop: '4px', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: T.text2 }}>Knowledge layer: {profile.metrics.peers} peer deployments</span>
                <span style={{ color: T.border }}>·</span>
                <span style={{ fontSize: '11px', color: T.text2 }}>Genome: {profile.metrics.patterns} patterns</span>
                <span style={{ color: T.border }}>·</span>
                <span style={{ fontSize: '11px', color: T.text2 }}>Confidence: {profile.metrics.confidence}%</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
              <div style={{ fontSize: '11px', color: T.text, fontFamily: T.mono }}>{profile.name}</div>
              <div style={{ display: 'flex', borderRadius: '8px', overflow: 'hidden', border: `1px solid ${T.border}` }}>
                {(['prep', 'live'] as const).map(m => (
                  <button key={m} onClick={() => setMode(m)} style={{ padding: '8px 16px', background: mode === m ? T.teal : T.bg, color: mode === m ? T.bg : T.text, border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: mode === m ? 700 : 400, fontFamily: T.sans, transition: 'all 0.15s' }}>
                    {m === 'prep' ? 'Maestro Prep' : 'Live Session'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Three-Act Navigation */}
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
            {([1, 2, 3] as const).map(a => (
              <button key={a} onClick={() => setAct(a)} style={{ padding: '16px', background: act === a ? T.teal : 'none', color: act === a ? T.bg : T.text, border: 'none', borderRight: a < 3 ? `1px solid ${T.border}` : 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 700, fontFamily: T.sans, transition: 'all 0.15s', letterSpacing: '0.01em' }}>
                {a === 1 ? 'ACT 1: THE TRUTH' : a === 2 ? 'ACT 2: THE BETS' : 'ACT 3: THE BOARD DECK'}
              </button>
            ))}
          </div>
          <div style={{ borderTop: `1px solid ${T.border}` }}>
            <button onClick={() => setShowStepNav(s => !s)} style={{ width: '100%', padding: '8px 24px', background: 'none', border: 'none', color: T.text2, cursor: 'pointer', textAlign: 'left' as const, fontSize: '11px', fontFamily: T.mono, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ transition: 'transform 0.2s', display: 'inline-block', transform: showStepNav ? 'rotate(90deg)' : 'none' }}>▸</span>
              {showStepNav ? 'Hide steps' : 'Show all 8 steps'}
            </button>
            {showStepNav && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '8px 24px 14px' }}>
                {STEPS.map((step, i) => {
                  const actForStep = Object.entries(ACT_STEPS).find(([, steps]) => steps.includes(i))
                  const stepAct = actForStep ? parseInt(actForStep[0]) : 1
                  return (
                    <button key={i} onClick={() => setAct(stepAct as 1 | 2 | 3)} style={{ padding: '4px 10px', background: 'none', border: `1px solid ${T.border}`, borderRadius: '4px', color: T.text, fontSize: '11px', cursor: 'pointer', fontFamily: T.mono }}>
                      {['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧'][i]} {step}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Act Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }} className="act-fade">

        {/* ACT 1 */}
        {act === 1 && (
          <div style={{ display: 'grid', gridTemplateColumns: '45% 55%', gap: '32px' }}>
            <div>
              <div style={{ fontSize: '10px', fontFamily: T.mono, color: T.teal, fontWeight: 700, letterSpacing: '0.1em', marginBottom: '6px' }}>AI READINESS ASSESSMENT</div>
              <div style={{ fontSize: '20px', fontFamily: T.serif, color: T.text, marginBottom: '20px' }}>Before placing bets, here is what your data actually shows.</div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                <GaugeDial pct={profile.readiness.data} color={T.teal} label="Data Readiness" percentile={profile.percentiles.data} />
                <GaugeDial pct={profile.readiness.tech} color="#3B82F6" label="Technology" percentile={profile.percentiles.tech} />
                <GaugeDial pct={profile.readiness.org} color={T.amber} label="Org Readiness" percentile={profile.percentiles.org} />
              </div>
              {(['data', 'tech', 'org'] as const).map(g => {
                const gaugeData = bd[g]
                const isExpanded = expandedGauge === g
                const gColor = g === 'data' ? T.teal : g === 'tech' ? '#3B82F6' : T.amber
                return (
                  <div key={g} style={{ marginBottom: '8px', border: `1px solid ${T.border}`, borderRadius: '8px', overflow: 'hidden' }}>
                    <button onClick={() => setExpandedGauge(isExpanded ? null : g)} style={{ width: '100%', padding: '12px 14px', background: T.surface, border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '11px', fontFamily: T.mono, fontWeight: 700, color: gColor, letterSpacing: '0.08em' }}>{g.toUpperCase()} READINESS — {profile.readiness[g]}%</div>
                      <span style={{ color: T.text2, fontSize: '11px' }}>{isExpanded ? '▲' : '▼'}</span>
                    </button>
                    {isExpanded && (
                      <div style={{ padding: '14px', background: T.bg }}>
                        {[
                          { label: 'FROM YOUR DATA', col: T.teal, content: gaugeData.clientItems.join(', ') },
                          { label: 'FROM INDUSTRY', col: '#3B82F6', content: gaugeData.industryNote },
                          { label: 'FROM GENOME', col: '#A78BFA', content: gaugeData.genomeNote },
                        ].map(s => (
                          <div key={s.label} style={{ marginBottom: '10px' }}>
                            <div style={{ fontSize: '9px', fontFamily: T.mono, color: s.col, fontWeight: 700, letterSpacing: '0.08em', marginBottom: '4px' }}>{s.label}</div>
                            <div style={{ fontSize: '11px', color: T.text }}>{s.content}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            <div>
              <div style={{ fontSize: '10px', fontFamily: T.mono, color: T.teal, fontWeight: 700, letterSpacing: '0.1em', marginBottom: '6px' }}>EXECUTIVE FAULT LINES</div>
              <div style={{ fontSize: '20px', fontFamily: T.serif, color: T.text, marginBottom: '4px' }}>Where your leadership team disagrees</div>
              <div style={{ fontSize: '12px', color: T.text2, marginBottom: '20px' }}>These fault lines predict which AI initiatives will face internal resistance.</div>
              {profile.faultLines.map((fl, i) => (
                <div key={i} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '10px', padding: '14px', marginBottom: '10px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ fontSize: '11px', color: T.text, fontWeight: 600, padding: '5px 9px', background: T.bg, borderRadius: '6px', border: `1px solid ${T.border}` }}>{fl.side1}</div>
                    <div style={{ textAlign: 'center' as const }}>
                      <div style={{ fontSize: '9px', fontFamily: T.mono, color: fl.tensionColor, fontWeight: 700, letterSpacing: '0.05em', padding: '3px 7px', background: fl.tensionColor + '20', borderRadius: '4px', whiteSpace: 'nowrap' as const }}>{fl.tension}</div>
                    </div>
                    <div style={{ fontSize: '11px', color: T.text, fontWeight: 600, padding: '5px 9px', background: T.bg, borderRadius: '6px', border: `1px solid ${T.border}` }}>{fl.side2}</div>
                  </div>
                  <div style={{ fontSize: '11px', color: T.text, marginBottom: '6px' }}>
                    <span style={{ fontSize: '9px', fontFamily: T.mono, color: T.teal, fontWeight: 700 }}>DATA: </span>{fl.dataPoint}
                  </div>
                  <div style={{ fontSize: '11px', color: T.text2, paddingTop: '6px', borderTop: `1px solid ${T.border}` }}>
                    <span style={{ fontSize: '9px', fontFamily: T.mono, color: '#A78BFA', fontWeight: 700 }}>FROM GENOME: </span>{fl.genomeNote}
                  </div>
                  {mode === 'prep' && fl.talkingPoint && (
                    <div style={{ marginTop: '8px', padding: '8px', background: T.indigo + '15', border: `1px solid ${T.indigo}40`, borderRadius: '6px' }}>
                      <div style={{ fontSize: '9px', fontFamily: T.mono, color: T.indigo, fontWeight: 700, marginBottom: '4px' }}>MAESTRO — TALKING POINT</div>
                      <div style={{ fontSize: '11px', color: T.text }}>{fl.talkingPoint}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ACT 2 */}
        {act === 2 && (
          <div>
            <div style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontSize: '10px', fontFamily: T.mono, color: T.teal, fontWeight: 700, letterSpacing: '0.1em', marginBottom: '4px' }}>OPPORTUNITY LANDSCAPE</div>
                  <div style={{ fontSize: '16px', fontFamily: T.serif, color: T.text }}>Every opportunity as a bubble — high value + low complexity = obvious Wave 1</div>
                </div>
                <div style={{ fontSize: '11px', color: T.text2, textAlign: 'right' as const }}>
                  <div style={{ color: T.text, fontWeight: 600 }}>{profile.metrics.analyzed} opportunities analysed</div>
                  <div>bubble size = confidence score</div>
                </div>
              </div>
              <ScatterPlot opps={profile.opportunities} clientKey={clientId} />
            </div>

            <div style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div>
                  <div style={{ fontSize: '10px', fontFamily: T.mono, color: T.teal, fontWeight: 700, letterSpacing: '0.1em', marginBottom: '4px' }}>YOUR FIVE BETS</div>
                  <div style={{ fontSize: '16px', fontFamily: T.serif, color: T.text }}>Five recommended bets with three-source attribution</div>
                </div>
                <button style={{ padding: '8px 14px', background: 'none', border: `1px solid ${T.border}`, borderRadius: '6px', color: T.text2, fontSize: '11px', cursor: 'pointer', fontFamily: T.mono }}>Show all {profile.metrics.analyzed} →</button>
              </div>
              <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '8px' }}>
                {profile.bets.map(bet => (
                  <BetCard key={bet.id} bet={bet} onGenome={() => setShowGenomeDrawer(true)} confirmedBets={confirmedBets} removedBets={removedBets} onConfirm={id => setConfirmedBets(prev => new Set([...prev, id]))} onRemove={id => setRemovedBets(prev => new Set([...prev, id]))} mode={mode} />
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '10px', fontFamily: T.mono, color: T.teal, fontWeight: 700, letterSpacing: '0.1em', marginBottom: '12px' }}>WAVE 1 PLAN — STARTS IN 90 DAYS</div>
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '10px', overflow: 'hidden', marginBottom: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderBottom: `1px solid ${T.border}` }}>
                  {(['days1_30', 'days31_60', 'days61_90'] as const).map((phase, i) => {
                    const p = profile.wave1Plan[phase]
                    const label = ['DAYS 1–30', 'DAYS 31–60', 'DAYS 61–90'][i]
                    return (
                      <div key={phase} style={{ padding: '16px', borderRight: i < 2 ? `1px solid ${T.border}` : 'none' }}>
                        <div style={{ fontSize: '10px', fontFamily: T.mono, color: T.text, fontWeight: 700, letterSpacing: '0.08em', marginBottom: '10px', paddingBottom: '8px', borderBottom: `2px solid ${T.teal}` }}>{label}</div>
                        {p.tasks.map((t, j) => <div key={j} style={{ fontSize: '12px', color: T.text, marginBottom: '4px' }}>· {t}</div>)}
                        <div style={{ marginTop: '10px', fontSize: '10px', color: T.text2 }}>Owner: <span style={{ color: T.text }}>{p.owner}</span></div>
                        <div style={{ fontSize: '10px', color: T.text2 }}>Investment: <span style={{ color: T.teal }}>{p.investment}</span></div>
                      </div>
                    )
                  })}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', padding: '16px', gap: '16px' }}>
                  {[
                    { label: 'Total Investment', value: profile.wave1Plan.total.investment },
                    { label: 'Annual Value', value: profile.wave1Plan.total.annualValue },
                    { label: 'Blended ROI', value: profile.wave1Plan.total.roi },
                    { label: 'Time to Value', value: '14 months' },
                  ].map(m => (
                    <div key={m.label} style={{ textAlign: 'center' as const }}>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: T.teal, fontFamily: T.mono }}>{m.value}</div>
                      <div style={{ fontSize: '9px', color: T.text2, fontFamily: T.mono, letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>{m.label}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '10px', padding: '20px' }}>
                <div style={{ fontSize: '10px', fontFamily: T.mono, color: T.teal, fontWeight: 700, letterSpacing: '0.1em', marginBottom: '8px' }}>INDUSTRY CONTEXT</div>
                <div style={{ fontSize: '13px', color: T.text, lineHeight: 1.7 }}>
                  Organisations your size that completed this analysis and acted within 90 days achieved <strong style={{ color: T.teal }}>2.3x more value</strong> than those that waited 6 months.<br />
                  The window for Wave 1 pricing from current vendors closes in approximately 4 months based on market trends.<br />
                  <span style={{ color: T.text2, fontSize: '12px' }}>Leading advisory firms charge $2–4M and 16 weeks to produce a less data-specific version of this output.</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ACT 3 */}
        {act === 3 && (
          <BoardDeckAct profile={profile} clientId={clientId} onConfirmOpen={() => setShowConfirmModal(true)} />
        )}
      </div>

      {showGenomeDrawer && <GenomeDrawer clientKey={clientId} onClose={() => setShowGenomeDrawer(false)} />}
      {showConfirmModal && <ConfirmModal profile={profile} clientId={clientId} onClose={() => setShowConfirmModal(false)} />}
    </div>
  )
}

// ─── Page Export ──────────────────────────────────────────────────────────────────
export default function AiStrategyPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#060A12', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#2DD4C8', fontFamily: "'JetBrains Mono', monospace", fontSize: '12px' }}>Loading AI Intelligence...</div>
      </div>
    }>
      <AiStrategyContent />
    </Suspense>
  )
}
