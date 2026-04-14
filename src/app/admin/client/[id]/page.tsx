'use client'
import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useParams, useRouter } from 'next/navigation'
import AbarvaNav from '@/components/AbarvaNav'
import { arcturusFinancial, arcturusFinancials, arcturusTechnology, arcturusLeadership, arcturusRegulatory, arcturusIndustry } from '@/data/arcturus/index'
import { meridianHealth } from '@/data/meridian/index'
import { firstCapital } from '@/data/firstcapital/index'
import { apexRetail } from '@/data/apexretail/index'
import { nexoraRetail } from '@/data/nexora/index'

const BG='#060A12', CARD='#0D1520', BORDER='#1C2D45'
const TEAL='#2DD4C8', WHITE='#EFF6FF', MUTED='#94A3B8', DIM='#475569'
const RED='#EF4444', AMBER='#F59E0B', GREEN='#34D399', PURPLE='#818CF8'
const SANS='DM Sans, sans-serif', MONO='JetBrains Mono, monospace', SERIF='Georgia, serif'

interface Metric {
  label: string
  value: string
  benchmark: string
  status: 'critical' | 'warning'
  gap: string
}

interface Contradiction {
  id: string
  claim: string
  reality: string
  severity: string
}

interface GenomePattern {
  code: string
  name: string
  failureRate: number
  present: boolean
  mitigation: string
}

interface DataFile {
  name: string
  uploader: string
  date: string
  confidence: number
  type: 'active' | 'pending'
}

interface IndustryBenchmark {
  label: string
  ours: number | string
  peer: number | string
  unit: string
  gap: string
}

interface ClientData {
  name: string
  type: string
  revenue: number
  employees: number
  hq: string
  status: 'Active' | 'Setup'
  color: string
  metrics: Metric[]
  contradictions: Contradiction[]
  genomePatternsMatched: GenomePattern[]
  files: DataFile[]
  industryBenchmarks: IndustryBenchmark[]
}

function getClientData(id: string): ClientData | null {
  if (id === 'arcturus') {
    return {
      name: arcturusFinancial.org.name,
      type: 'Asset Manager',
      revenue: arcturusFinancial.org.revenue,
      employees: arcturusFinancial.org.employees,
      hq: 'Global',
      status: 'Setup',
      color: '#818CF8',
      metrics: arcturusFinancial.situationMetrics.map(m => ({
        label: m.label,
        value: m.value,
        benchmark: m.benchmark,
        status: m.status,
        gap: m.gap,
      })),
      contradictions: arcturusFinancial.contradictions.map(c => ({
        id: c.id,
        claim: c.claim,
        reality: c.reality,
        severity: c.severity,
      })),
      genomePatternsMatched: [
        { code: 'F005', name: 'AI Governance Vacuum', failureRate: 82, present: true, mitigation: 'Appoint CDO, establish AI governance council, baseline all 28 initiatives within 60 days' },
        { code: 'F002', name: 'Cost Transformation Stall', failureRate: 84, present: true, mitigation: 'Independent CIR reduction programme with weekly CEO accountability' },
        { code: 'F009', name: 'Regulatory Debt Spiral', failureRate: 71, present: true, mitigation: 'Dedicated MAS FEAT remediation squad, FCA prep starting Q3' },
        { code: 'F014', name: 'Platform Adoption Failure', failureRate: 68, present: true, mitigation: 'Salesforce FSC adoption from 44% to 78% with behavioural change programme' },
      ],
      files: [
        { name: 'Financial Statements 2024', uploader: arcturusFinancials.uploadedBy, date: arcturusFinancials.uploadedAt, confidence: Math.round(arcturusFinancials.confidence * 100), type: 'active' },
        { name: 'Technology Landscape', uploader: 'Raj Malhotra (CIO)', date: arcturusTechnology.uploadedAt, confidence: Math.round(arcturusTechnology.confidence * 100), type: 'active' },
        { name: 'Leadership Profiles', uploader: 'Victoria Hargreaves (CEO)', date: arcturusLeadership.uploadedAt, confidence: Math.round(arcturusLeadership.confidence * 100), type: 'active' },
        { name: 'Regulatory Register', uploader: 'CRO Office', date: arcturusRegulatory.uploadedAt, confidence: Math.round(arcturusRegulatory.confidence * 100), type: 'active' },
        { name: 'Industry Benchmarks', uploader: 'AbarVa Research', date: '2026-04-01', confidence: Math.round(arcturusIndustry.confidence * 100), type: 'active' },
        { name: 'AI Initiative Inventory', uploader: 'Raj Malhotra (CIO)', date: '2026-04-05', confidence: 72, type: 'pending' },
      ],
      industryBenchmarks: [
        { label: 'Cost-to-Income Ratio', ours: arcturusIndustry.peerBenchmarks.costToIncomeRatio.arcturus, peer: arcturusIndustry.peerBenchmarks.costToIncomeRatio.peerMedian, unit: '%', gap: '+10pp vs peer median — $840M gap' },
        { label: 'AUM per Employee', ours: arcturusIndustry.peerBenchmarks.aumPerEmployee.arcturus, peer: arcturusIndustry.peerBenchmarks.aumPerEmployee.peerMedian, unit: '$M', gap: '-$120M/employee vs peers' },
        { label: 'AI Maturity Score', ours: arcturusIndustry.peerBenchmarks.aiMaturityScore.arcturus, peer: arcturusIndustry.peerBenchmarks.aiMaturityScore.peerMedian, unit: '/100', gap: '-26 points below peer median' },
        { label: 'Client Portal Adoption', ours: arcturusIndustry.peerBenchmarks.clientPortalAdoption.arcturus, peer: arcturusIndustry.peerBenchmarks.clientPortalAdoption.industryMedian, unit: '%', gap: '-34pp vs industry median' },
      ],
    }
  }

  if (id === 'meridian') {
    return {
      name: meridianHealth.org.name,
      type: 'IDN',
      revenue: meridianHealth.org.revenue,
      employees: meridianHealth.org.employees,
      hq: meridianHealth.org.headquarters,
      status: 'Active',
      color: TEAL,
      metrics: [
        { label: 'Denial Rate', value: `${meridianHealth.technology.rcm.denialRate}%`, benchmark: `${meridianHealth.technology.rcm.benchmarkDenialRate}% benchmark`, status: 'critical', gap: `$94M annual write-off` },
        { label: 'Operating Margin', value: `${meridianHealth.org.operatingMargin}%`, benchmark: `${meridianHealth.org.targetOperatingMargin}% target`, status: 'critical', gap: '2.2pp to target' },
        { label: 'Days in AR', value: `${meridianHealth.technology.rcm.daysInAR}`, benchmark: '35 benchmark', status: 'critical', gap: '17 days above benchmark' },
        { label: 'Prior Auth Avg Days', value: `${meridianHealth.technology.rcm.priorAuthAvgDays}`, benchmark: `${meridianHealth.technology.rcm.priorAuthPeerDays} peer`, status: 'critical', gap: '2.4 days above peer' },
        { label: 'MyChart Adoption', value: '34%', benchmark: '60% target', status: 'warning', gap: '26pp below target' },
        { label: 'Hospital Occupancy', value: `${meridianHealth.hospitals.occupancyRate}%`, benchmark: '76% target', status: 'warning', gap: '5pp below target' },
        { label: 'Epic Optimization Score', value: `${meridianHealth.technology.ehr.optimizationScore}/100`, benchmark: '80 benchmark', status: 'warning', gap: '22 points below benchmark' },
        { label: 'MA Star Rating', value: `${meridianHealth.healthPlan.medicareAdvantage.starRating}`, benchmark: '4.0 target', status: 'warning', gap: '0.5 stars to 4.0' },
      ],
      contradictions: [
        { id: 'c1', claim: 'RCM outsourced to Ensemble at $48M/yr to hit 12% denial rate', reality: `Denial rate at ${meridianHealth.technology.rcm.denialRate}% — $94M write-off. Penalties never enforced.`, severity: 'high' },
        { id: 'c2', claim: 'Epic fully deployed — CIO mandate for unified data platform', reality: 'Only 12 of 47 Cogito dashboards live. Blue Ridge still on legacy version.', severity: 'high' },
        { id: 'c3', claim: 'Board mandated 4% operating margin by FY2026', reality: 'Only $84M transformation budget approved vs $200M needed. Currently at 1.8%.', severity: 'critical' },
      ],
      genomePatternsMatched: [
        { code: 'F011', name: 'RCM Vendor Misalignment', failureRate: 74, present: true, mitigation: 'Renegotiate SLA with clawback provisions, pilot AI-assisted denial prevention' },
        { code: 'F003', name: 'EHR Under-Optimization', failureRate: 69, present: true, mitigation: 'Epic Cogito acceleration programme, CMIO-led dashboard rollout' },
        { code: 'F007', name: 'Margin Transformation Gap', failureRate: 77, present: true, mitigation: 'Prioritize top 5 highest-ROI initiatives with 90-day sprints' },
        { code: 'F015', name: 'Integration Fragmentation', failureRate: 65, present: true, mitigation: 'Unified data platform roadmap, Blue Ridge migration milestone-gated' },
      ],
      files: [
        { name: 'Financial Statements 2023', uploader: 'Robert Chen (CFO)', date: '2026-03-15', confidence: 88, type: 'active' },
        { name: 'RCM Performance Report', uploader: 'Ensemble Health Partners', date: '2026-03-20', confidence: 91, type: 'active' },
        { name: 'Epic Optimization Assessment', uploader: 'Marcus Webb (CIO)', date: '2026-03-22', confidence: 84, type: 'active' },
        { name: 'Leadership Profiles', uploader: 'AbarVa Research', date: '2026-03-25', confidence: 86, type: 'active' },
        { name: 'Payer Contract Analysis', uploader: 'CFO Office', date: '2026-03-28', confidence: 67, type: 'pending' },
        { name: 'Blue Ridge Integration Status', uploader: 'CIO Office', date: '2026-04-02', confidence: 71, type: 'pending' },
      ],
      industryBenchmarks: [
        { label: 'Denial Rate', ours: 18.2, peer: 12.0, unit: '%', gap: '+6.2pp — $94M write-off' },
        { label: 'Operating Margin', ours: 1.8, peer: 3.4, unit: '%', gap: '-1.6pp vs IDN median' },
        { label: 'Days in AR', ours: 52, peer: 35, unit: 'days', gap: '+17 days above benchmark' },
        { label: 'Epic Optimization', ours: 58, peer: 78, unit: '/100', gap: '-20 points below benchmark' },
      ],
    }
  }

  if (id === 'firstcapital') {
    return {
      name: firstCapital.org.name,
      type: 'Regional Bank',
      revenue: firstCapital.org.revenue,
      employees: firstCapital.org.employees,
      hq: firstCapital.org.headquarters,
      status: 'Active',
      color: '#6366F1',
      metrics: [
        { label: 'Cost-to-Income Ratio', value: `${firstCapital.org.costToIncomeRatio}%`, benchmark: `${firstCapital.org.targetCostToIncomeRatio}% target`, status: 'critical', gap: '13pp to target' },
        { label: 'Digital Adoption', value: `${firstCapital.org.digitalAdoption}%`, benchmark: '67% benchmark', status: 'critical', gap: '26pp below peers' },
        { label: 'Core Banking Age', value: `${firstCapital.org.coreBankingAge} years`, benchmark: '8 years (peers)', status: 'critical', gap: 'FIS EOL 2027' },
        { label: 'AML Automation', value: `${firstCapital.technology.aml.automationRate}%`, benchmark: `${firstCapital.technology.aml.benchmarkAutomationRate}% benchmark`, status: 'critical', gap: '38pp below peers' },
        { label: 'Mobile App Rating', value: `${firstCapital.technology.digital.mobileAppRating}`, benchmark: '3.8 threshold', status: 'warning', gap: '0.6 below competitive threshold' },
        { label: 'Fraud Losses', value: `$${firstCapital.financials.fraudLosses2023}M`, benchmark: `$${firstCapital.financials.benchmarkFraudLosses}M benchmark`, status: 'warning', gap: '$3.8M annual excess' },
        { label: 'Return on Assets', value: `${firstCapital.financials.returnOnAssets}%`, benchmark: '1.1% peer median', status: 'warning', gap: '0.28pp below peers' },
        { label: 'Account Opening Abandonment', value: `${firstCapital.technology.digital.accountOpeningAbandonmentRate}%`, benchmark: `${firstCapital.technology.digital.benchmarkAbandonmentRate}% benchmark`, status: 'warning', gap: '32pp above benchmark' },
      ],
      contradictions: [
        { id: 'c1', claim: 'Board demanding digital transformation', reality: 'IT budget at 9.2% — below 12% needed for digital leadership. Mobile app rating 3.2.', severity: 'high' },
        { id: 'c2', claim: 'FedNow and real-time payments as strategic priority', reality: 'FedNow not live. 68% of peer banks already on FedNow. $180M commercial deposit risk.', severity: 'critical' },
        { id: 'c3', claim: 'CDO role created to drive data strategy', reality: 'CDO reporting to CRO not CEO — signals compliance focus, not growth focus.', severity: 'medium' },
      ],
      genomePatternsMatched: [
        { code: 'F002', name: 'Cost Transformation Stall', failureRate: 84, present: true, mitigation: 'Core banking decision Q3, API layer as interim, CIR reduction programme' },
        { code: 'F008', name: 'Digital Adoption Lag', failureRate: 73, present: true, mitigation: 'UX improvement roadmap, account opening abandonment fix within 90 days' },
        { code: 'F012', name: 'Regulatory Technology Debt', failureRate: 68, present: true, mitigation: 'NICE Actimize upgrade to current version, FedNow go-live within 6 months' },
        { code: 'F006', name: 'Platform EOL Paralysis', failureRate: 71, present: true, mitigation: 'Force core banking decision by Q3 2026 — paralysis is the worst outcome' },
      ],
      files: [
        { name: 'FFIEC Financial Performance', uploader: 'Robert Martinez (CFO)', date: '2026-03-10', confidence: 88, type: 'active' },
        { name: 'Technology System Inventory', uploader: 'James Okafor (CTO)', date: '2026-03-12', confidence: 82, type: 'active' },
        { name: 'Compliance & Exam Findings', uploader: 'CRO Office', date: '2026-03-15', confidence: 78, type: 'active' },
        { name: 'Leadership Intelligence', uploader: 'AbarVa Research', date: '2026-03-18', confidence: 80, type: 'active' },
        { name: 'Vendor Contracts', uploader: 'CTO Office', date: '2026-03-22', confidence: 42, type: 'pending' },
        { name: 'Customer Analytics', uploader: 'CDO Office', date: 'Pending approval', confidence: 0, type: 'pending' },
      ],
      industryBenchmarks: [
        { label: 'Cost-to-Income Ratio', ours: 68, peer: 55, unit: '%', gap: '+13pp vs target' },
        { label: 'Digital Adoption', ours: 41, peer: 67, unit: '%', gap: '-26pp below peers' },
        { label: 'AML Automation', ours: 34, peer: 72, unit: '%', gap: '-38pp below benchmark' },
        { label: 'Mobile App Rating', ours: 3.2, peer: 4.1, unit: '/5', gap: '-0.9 below peers' },
      ],
    }
  }

  if (id === 'apexretail') {
    return {
      name: apexRetail.org.name,
      type: 'Retailer',
      revenue: apexRetail.org.revenue,
      employees: apexRetail.org.employees,
      hq: apexRetail.org.headquarters,
      status: 'Active',
      color: AMBER,
      metrics: [
        { label: 'Operating Margin', value: `${apexRetail.org.operatingMargin}%`, benchmark: `${apexRetail.org.targetOperatingMargin}% target`, status: 'critical', gap: '2.2pp to target' },
        { label: 'E-Commerce Mix', value: `${apexRetail.org.ecommercePercent}%`, benchmark: `${apexRetail.org.targetEcommercePercent}% target`, status: 'critical', gap: '17pp below target' },
        { label: 'Gross Margin', value: `${apexRetail.financials.grossMargin2023}%`, benchmark: '38% peers', status: 'warning', gap: '3.8pp below peers' },
        { label: 'Store Count', value: `${apexRetail.org.stores}`, benchmark: '850 peers avg', status: 'warning', gap: '50 below peers' },
        { label: 'Digital Revenue Growth', value: 'Below target', benchmark: '18% industry', status: 'critical', gap: 'E-comm margin negative' },
        { label: 'IT Modernization', value: 'In progress', benchmark: 'Complete (peers)', status: 'warning', gap: 'Legacy systems slowing speed' },
        { label: 'Revenue Growth YoY', value: `${((apexRetail.financials.revenue2023 - apexRetail.financials.revenue2022) / apexRetail.financials.revenue2022 * 100).toFixed(1)}%`, benchmark: '4.2% peers', status: 'warning', gap: 'Below peer median' },
        { label: 'Target Margin Gap', value: `${apexRetail.org.targetOperatingMargin - apexRetail.org.operatingMargin}pp`, benchmark: 'Target met (peers)', status: 'critical', gap: `~$280M annual gap` },
      ],
      contradictions: [
        { id: 'c1', claim: 'E-commerce as growth engine', reality: 'E-commerce margin is negative. Growing the channel destroys blended margin.', severity: 'critical' },
        { id: 'c2', claim: 'Omnichannel strategy delivering results', reality: 'Digital at 28% vs 45% target. Physical-digital integration incomplete.', severity: 'high' },
        { id: 'c3', claim: 'Cost reduction initiatives underway', reality: 'Operating margin stuck at 3.8% vs 6.0% target. No credible reduction programme.', severity: 'high' },
      ],
      genomePatternsMatched: [
        { code: 'F005', name: 'Digital-Physical Integration Failure', failureRate: 78, present: true, mitigation: 'Unified commerce platform, store-fulfilment economics remodel' },
        { code: 'F013', name: 'E-Commerce Margin Trap', failureRate: 72, present: true, mitigation: 'Contribution margin analysis by channel, selective growth strategy' },
        { code: 'F004', name: 'Inventory Optimization Gap', failureRate: 67, present: true, mitigation: 'Demand forecasting AI, markdown automation' },
        { code: 'F010', name: 'Cost Structure Rigidity', failureRate: 69, present: true, mitigation: 'Zero-based budgeting, workforce flexibility programme' },
      ],
      files: [
        { name: 'Financial Statements 2023', uploader: 'CFO Office', date: '2026-03-08', confidence: 86, type: 'active' },
        { name: 'Technology Assessment', uploader: 'CTO Office', date: '2026-03-10', confidence: 79, type: 'active' },
        { name: 'Store Operations Data', uploader: 'COO Office', date: '2026-03-14', confidence: 83, type: 'active' },
        { name: 'E-Commerce P&L', uploader: 'CFO Office', date: '2026-03-18', confidence: 88, type: 'active' },
        { name: 'Competitor Benchmarks', uploader: 'AbarVa Research', date: '2026-03-25', confidence: 74, type: 'pending' },
        { name: 'Customer Analytics', uploader: 'CMO Office', date: 'Pending', confidence: 55, type: 'pending' },
      ],
      industryBenchmarks: [
        { label: 'Operating Margin', ours: 3.8, peer: 5.8, unit: '%', gap: '-2pp vs peers' },
        { label: 'E-Commerce Mix', ours: 28, peer: 38, unit: '%', gap: '-10pp below industry' },
        { label: 'Gross Margin', ours: 34.2, peer: 38.0, unit: '%', gap: '-3.8pp vs peers' },
        { label: 'Inventory Turns', ours: 5.1, peer: 6.4, unit: 'x', gap: '-1.3x below peers' },
      ],
    }
  }

  if (id === 'nexora') {
    return {
      name: nexoraRetail.org.name,
      type: 'Retailer',
      revenue: nexoraRetail.org.revenue,
      employees: 58000,
      hq: 'Amsterdam, NL',
      status: 'Setup',
      color: '#F472B6',
      metrics: nexoraRetail.situationMetrics.map(m => ({
        label: m.label,
        value: m.value,
        benchmark: m.benchmark,
        status: m.status,
        gap: m.gap,
      })),
      contradictions: nexoraRetail.contradictions.map(c => ({
        id: c.id,
        claim: c.claim,
        reality: c.reality,
        severity: c.severity,
      })),
      genomePatternsMatched: [
        { code: 'F003', name: 'AI Investment Without Return', failureRate: 79, present: true, mitigation: 'Baseline all 8 AI initiatives, Einstein AI activation in 90 days' },
        { code: 'F006', name: 'ERP EOL Paralysis', failureRate: 71, present: true, mitigation: 'SAP S/4HANA migration programme start Q2 2026, SI selection by June' },
        { code: 'F013', name: 'E-Commerce Margin Trap', failureRate: 72, present: true, mitigation: 'Contribution margin remodel, selective channel investment' },
        { code: 'F004', name: 'Inventory Optimization Gap', failureRate: 67, present: true, mitigation: 'o9 acceleration — full deployment by Q4 2026' },
      ],
      files: [
        { name: 'Financial Statements 2025', uploader: 'CFO Office', date: '2026-04-05', confidence: 84, type: 'active' },
        { name: 'Technology Landscape', uploader: 'CIO Office', date: '2026-04-06', confidence: 79, type: 'active' },
        { name: 'Operations Overview', uploader: 'COO Office', date: '2026-04-07', confidence: 81, type: 'active' },
        { name: 'Industry Benchmarks', uploader: 'AbarVa Research', date: '2026-04-08', confidence: 77, type: 'active' },
        { name: 'AI Initiative Inventory', uploader: 'CIO Office', date: '2026-04-10', confidence: 63, type: 'pending' },
        { name: 'SAP Contracts & Licensing', uploader: 'CTO Office', date: 'Pending', confidence: 0, type: 'pending' },
      ],
      industryBenchmarks: [
        { label: 'Operating Margin', ours: '3.2%', peer: '5.1%', unit: '%', gap: '-1.9pp vs peer median' },
        { label: 'E-Commerce Margin', ours: '-2.1%', peer: '+2.8%', unit: '%', gap: '-4.9pp below peers' },
        { label: 'Inventory Turns', ours: 4.2, peer: 6.8, unit: 'x', gap: '-2.6x — $900M trapped capital' },
        { label: 'AI ROI', ours: '8%', peer: '38%', unit: '%', gap: '-30pp below peer median' },
      ],
    }
  }

  return null
}

// ─── Shared card style ─────────────────────────────────────────────────────────
const cardStyle = (extra?: React.CSSProperties): React.CSSProperties => ({
  background: CARD,
  border: `1px solid ${BORDER}`,
  borderRadius: '8px',
  padding: '20px',
  ...extra,
})

const labelStyle: React.CSSProperties = {
  fontFamily: MONO,
  fontSize: '10px',
  color: DIM,
  textTransform: 'uppercase' as const,
  letterSpacing: '.06em',
  marginBottom: '6px',
}

const sectionTitle = (text: string) => (
  <div style={{ fontFamily: MONO, fontSize: '10px', color: DIM, textTransform: 'uppercase' as const, letterSpacing: '.08em', marginBottom: '14px' }}>{text}</div>
)

// ─── ADMIN TAB ─────────────────────────────────────────────────────────────────

function AdminTab({ clientId, data, adminSection, setAdminSection }: {
  clientId: string
  data: ClientData
  adminSection: string
  setAdminSection: (s: string) => void
}) {
  const pills = [
    { key: 'setup', label: 'Setup & engagement' },
    { key: 'data', label: 'Data & approvals' },
    { key: 'users', label: 'Maestro users' },
    { key: 'security', label: 'Security' },
  ]
  const activeFiles = data.files.filter(f => f.type === 'active')
  const pendingFiles = data.files.filter(f => f.type === 'pending')

  const products = [
    { name: 'Situation Diagnosis', href: `/diagnose?client=${clientId}` },
    { name: 'AI Strategy', href: `/ai-strategy?client=${clientId}` },
    { name: 'Vendor Selection', href: `/select?client=${clientId}` },
    { name: 'Business Case', href: `/justify?client=${clientId}` },
    { name: 'Outcomes Tracking', href: `/outcomes?client=${clientId}` },
  ]

  return (
    <div>
      {/* Sub-section pills */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' as const }}>
        {pills.map(p => (
          <button key={p.key} onClick={() => setAdminSection(p.key)}
            style={{ fontFamily: MONO, fontSize: '11px', padding: '6px 14px', borderRadius: '20px', border: `1px solid ${adminSection === p.key ? TEAL : BORDER}`, background: adminSection === p.key ? 'rgba(45,212,200,0.1)' : 'transparent', color: adminSection === p.key ? TEAL : MUTED, cursor: 'pointer' }}>
            {p.label}
          </button>
        ))}
      </div>

      {adminSection === 'setup' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px', alignItems: 'start' }}>
          {/* Left: steps */}
          <div>
            {[
              {
                n: 1, done: true,
                title: 'Organization confirmed',
                body: <span style={{ fontSize: '12px', color: MUTED }}>{data.name} · {data.type} · ${data.revenue}B revenue</span>,
              },
              {
                n: 2, done: activeFiles.length >= 4,
                title: 'Foundation data uploaded',
                body: (
                  <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '6px' }}>
                    {activeFiles.slice(0, 4).map((f, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: GREEN, flexShrink: 0 }} />
                        <span style={{ fontSize: '12px', color: WHITE }}>{f.name}</span>
                        <span style={{ fontSize: '11px', color: DIM }}>· {f.uploader} · {f.date} · {f.confidence}%</span>
                      </div>
                    ))}
                  </div>
                ),
              },
              {
                n: 3, done: true,
                title: 'Maestro users set up',
                body: <span style={{ fontSize: '12px', color: MUTED }}>2 Maestros active · 1 client stakeholder invited</span>,
              },
              {
                n: 4, done: clientId === 'arcturus',
                title: 'Baseline locked',
                body: <span style={{ fontSize: '12px', color: MUTED }}>
                  {clientId === 'arcturus'
                    ? 'Apr 14, 2026 · Confirmed by Victoria Hargreaves (CEO)'
                    : 'Pending baseline interview'}
                </span>,
              },
            ].map((step, i) => (
              <div key={i} style={{ ...cardStyle({ marginBottom: '12px', display: 'flex', gap: '16px' }), border: `1px solid ${step.done ? 'rgba(52,211,153,0.3)' : BORDER}` }}>
                <div style={{ width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: step.done ? 'rgba(52,211,153,0.15)' : 'rgba(45,212,200,0.08)', border: `1px solid ${step.done ? GREEN : TEAL}` }}>
                  {step.done
                    ? <span style={{ color: GREEN, fontSize: '12px' }}>✓</span>
                    : <span style={{ fontFamily: MONO, fontSize: '10px', color: TEAL }}>{step.n}</span>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: WHITE, marginBottom: '6px' }}>{step.title}</div>
                  {step.body}
                </div>
              </div>
            ))}
          </div>

          {/* Right: cards */}
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '16px' }}>
            {/* Engagement settings */}
            <div style={cardStyle()}>
              {sectionTitle('Engagement settings')}
              <div style={{ fontSize: '12px', color: MUTED, lineHeight: 2 }}>
                <div><span style={{ color: DIM }}>Fee model:</span> 15% of verified savings</div>
                <div><span style={{ color: DIM }}>Admin:</span> Anand Sundaram</div>
                <div><span style={{ color: DIM }}>Start:</span> Apr 2026</div>
              </div>
            </div>
            {/* Products unlocked */}
            <div style={cardStyle()}>
              {sectionTitle('Products unlocked')}
              {products.map((p, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: i < products.length - 1 ? '10px' : '0' }}>
                  <a href={p.href} style={{ fontSize: '12px', color: WHITE, textDecoration: 'none' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = TEAL }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = WHITE }}>
                    {p.name}
                  </a>
                  <span style={{ fontFamily: MONO, fontSize: '9px', padding: '2px 8px', borderRadius: '10px', background: 'rgba(52,211,153,0.1)', color: GREEN, border: '1px solid rgba(52,211,153,0.2)' }}>Active</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {adminSection === 'data' && (
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '24px' }}>
          <div style={cardStyle()}>
            {sectionTitle('Pending approval')}
            {pendingFiles.length === 0
              ? <div style={{ fontSize: '12px', color: DIM }}>No files pending approval.</div>
              : pendingFiles.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: i < pendingFiles.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: AMBER, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', color: WHITE }}>{f.name}</div>
                    <div style={{ fontSize: '11px', color: DIM }}>{f.uploader} · {f.date}</div>
                  </div>
                  <button style={{ fontFamily: MONO, fontSize: '10px', padding: '4px 10px', borderRadius: '4px', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)', color: GREEN, cursor: 'pointer', marginRight: '6px' }}>Approve</button>
                  <button style={{ fontFamily: MONO, fontSize: '10px', padding: '4px 10px', borderRadius: '4px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: RED, cursor: 'pointer' }}>Reject</button>
                </div>
              ))
            }
          </div>
          <div style={cardStyle()}>
            {sectionTitle('Approved files')}
            {activeFiles.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: i < activeFiles.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: GREEN, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', color: WHITE }}>{f.name}</div>
                  <div style={{ fontSize: '11px', color: DIM }}>{f.uploader} · {f.date} · {f.confidence}% confidence</div>
                </div>
                <button style={{ fontFamily: MONO, fontSize: '10px', padding: '4px 10px', borderRadius: '4px', background: 'transparent', border: `1px solid ${BORDER}`, color: MUTED, cursor: 'pointer' }}>Replace</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {adminSection === 'users' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div style={cardStyle()}>
            {sectionTitle('Maestros')}
            {[
              { initials: 'AS', name: 'Anand Sundaram', role: 'Lead Maestro', status: 'Active' },
              { initials: 'VK', name: 'Vikram Kapoor', role: 'Associate Maestro', status: 'Active' },
            ].map((u, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: i === 0 ? '12px' : '0' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(45,212,200,0.15)', border: `1px solid ${TEAL}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: MONO, fontSize: '11px', color: TEAL, flexShrink: 0 }}>{u.initials}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', color: WHITE }}>{u.name}</div>
                  <div style={{ fontSize: '11px', color: DIM }}>{u.role}</div>
                </div>
                <span style={{ fontFamily: MONO, fontSize: '9px', padding: '2px 8px', borderRadius: '10px', background: 'rgba(52,211,153,0.1)', color: GREEN }}>{u.status}</span>
              </div>
            ))}
          </div>
          <div style={cardStyle()}>
            {sectionTitle('Client stakeholders')}
            {[
              { initials: 'VH', name: 'Victoria Hargreaves', role: 'CEO', status: 'Invited' },
              { initials: 'TK', name: 'Thomas Kellner', role: 'CFO', status: 'Active' },
              { initials: 'RM', name: 'Raj Malhotra', role: 'CIO', status: 'Invited' },
            ].map((u, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: i < 2 ? '12px' : '0' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(129,140,248,0.15)', border: `1px solid ${PURPLE}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: MONO, fontSize: '11px', color: PURPLE, flexShrink: 0 }}>{u.initials}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', color: WHITE }}>{u.name}</div>
                  <div style={{ fontSize: '11px', color: DIM }}>{u.role}</div>
                </div>
                <span style={{ fontFamily: MONO, fontSize: '9px', padding: '2px 8px', borderRadius: '10px', background: u.status === 'Active' ? 'rgba(52,211,153,0.1)' : 'rgba(245,158,11,0.1)', color: u.status === 'Active' ? GREEN : AMBER }}>{u.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {adminSection === 'security' && (
        <div style={cardStyle()}>
          {sectionTitle('Security & compliance')}
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '14px' }}>
            {[
              { label: 'Two-factor authentication', on: true },
              { label: 'Data encryption at rest', on: true },
              { label: 'Audit logging', on: true },
              { label: 'Client portal access controls', on: true },
              { label: 'IP allowlist enforcement', on: false },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: WHITE }}>{item.label}</span>
                <div style={{ width: '36px', height: '20px', borderRadius: '10px', background: item.on ? 'rgba(52,211,153,0.3)' : BORDER, border: `1px solid ${item.on ? GREEN : BORDER}`, position: 'relative' as const, cursor: 'pointer' }}>
                  <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: item.on ? GREEN : DIM, position: 'absolute', top: '2px', left: item.on ? '18px' : '2px', transition: 'left 0.2s' }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px', flexWrap: 'wrap' as const }}>
            {['SOC 2 Type II', 'ISO 27001', 'GDPR Compliant'].map((badge, i) => (
              <span key={i} style={{ fontFamily: MONO, fontSize: '10px', padding: '4px 12px', borderRadius: '20px', border: `1px solid rgba(52,211,153,0.3)`, color: GREEN, background: 'rgba(52,211,153,0.06)' }}>{badge}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── OVERVIEW TAB ──────────────────────────────────────────────────────────────

function OverviewTab({ data }: { data: ClientData }) {
  const metrics8 = data.metrics.slice(0, 8)
  return (
    <div>
      {/* 8 metric cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '24px' }}>
        {metrics8.map((m, i) => (
          <div key={i} style={{ ...cardStyle({ borderLeft: `3px solid ${m.status === 'critical' ? RED : AMBER}`, padding: '16px 20px' }) }}>
            <div style={labelStyle}>{m.label}</div>
            <div style={{ fontFamily: SERIF, fontSize: '22px', color: m.status === 'critical' ? RED : AMBER, marginBottom: '6px' }}>{m.value}</div>
            <div style={{ fontSize: '11px', color: DIM, marginBottom: '4px' }}>{m.benchmark}</div>
            <div style={{ fontSize: '11px', fontWeight: 500, color: m.status === 'critical' ? RED : AMBER }}>{m.gap}</div>
          </div>
        ))}
      </div>

      {/* Two-column body */}
      <div style={{ display: 'flex', gap: '24px', alignItems: 'start' }}>
        {/* Left */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' as const, gap: '16px' }}>
          {/* Key findings */}
          <div style={cardStyle()}>
            {sectionTitle('Key findings')}
            {data.contradictions.slice(0, 3).map((c, i) => (
              <div key={i} style={{ display: 'flex', gap: '12px', marginBottom: i < 2 ? '16px' : '0', paddingBottom: i < 2 ? '16px' : '0', borderBottom: i < 2 ? `1px solid ${BORDER}` : 'none' }}>
                <div style={{ width: '3px', borderRadius: '2px', background: c.severity === 'critical' ? RED : c.severity === 'high' ? AMBER : '#F97316', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', color: MUTED, fontStyle: 'italic', marginBottom: '4px' }}>{c.claim}</div>
                  <div style={{ fontSize: '12px', color: WHITE }}>{c.reality}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Next actions */}
          <div style={cardStyle()}>
            {sectionTitle('Next actions')}
            {[
              `Lock baseline metrics with ${data.type === 'Asset Manager' ? 'Victoria Hargreaves (CEO)' : 'executive team'}`,
              'Complete data confidence review — upload missing files',
              'Schedule Situation Diagnosis walkthrough with client stakeholders',
            ].map((action, i) => (
              <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: i < 2 ? '12px' : '0' }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(45,212,200,0.1)', border: `1px solid ${TEAL}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: MONO, fontSize: '10px', color: TEAL }}>{i + 1}</div>
                <div style={{ fontSize: '13px', color: WHITE, lineHeight: 1.5 }}>{action}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right sidebar */}
        <div style={{ width: '260px', display: 'flex', flexDirection: 'column' as const, gap: '16px' }}>
          {/* Genome patterns */}
          <div style={cardStyle()}>
            {sectionTitle('Genome patterns')}
            {data.genomePatternsMatched.slice(0, 3).map((p, i) => (
              <div key={i} style={{ marginBottom: i < 2 ? '14px' : '0', paddingBottom: i < 2 ? '14px' : '0', borderBottom: i < 2 ? `1px solid ${BORDER}` : 'none' }}>
                <div style={{ fontFamily: SERIF, fontSize: '18px', color: RED, marginBottom: '2px' }}>{p.failureRate}%</div>
                <div style={{ fontSize: '12px', color: WHITE, marginBottom: '4px' }}>{p.code} — {p.name}</div>
                <div style={{ fontSize: '11px', color: DIM }}>{p.mitigation}</div>
              </div>
            ))}
          </div>

          {/* Recent activity */}
          <div style={cardStyle()}>
            {sectionTitle('Recent activity')}
            {[
              { time: '2h ago', text: 'Data file reviewed', actor: 'Anand S.' },
              { time: '5h ago', text: 'Baseline interview scheduled', actor: 'System' },
              { time: '1d ago', text: 'File approved', actor: 'Anand S.' },
              { time: '2d ago', text: 'New file uploaded', actor: 'Client' },
              { time: '3d ago', text: 'Engagement opened', actor: 'System' },
            ].map((a, i) => (
              <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: i < 4 ? '10px' : '0' }}>
                <span style={{ fontFamily: MONO, fontSize: '10px', color: DIM, flexShrink: 0, paddingTop: '1px' }}>{a.time}</span>
                <div>
                  <div style={{ fontSize: '12px', color: WHITE }}>{a.text}</div>
                  <div style={{ fontSize: '10px', color: DIM }}>{a.actor}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Pending approvals */}
          <div style={cardStyle()}>
            {sectionTitle('Pending approvals')}
            {[
              'AI Initiative Inventory',
              'SAP Contract Details',
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: i === 0 ? '10px' : '4px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: AMBER, flexShrink: 0 }} />
                <span style={{ fontSize: '12px', color: WHITE }}>{item}</span>
              </div>
            ))}
            <a href="#" style={{ fontSize: '11px', color: TEAL, textDecoration: 'none', display: 'block', marginTop: '10px' }}>Review all →</a>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── DATA INTELLIGENCE TAB ─────────────────────────────────────────────────────

function DataIntelligenceTab({ data, diTab, setDiTab }: {
  data: ClientData
  diTab: string
  setDiTab: (t: string) => void
}) {
  const subTabs = [
    { key: 'client', label: 'Client data' },
    { key: 'industry', label: 'Industry' },
    { key: 'public', label: 'Public data' },
    { key: 'genome', label: 'Genome patterns' },
  ]

  const activeFiles = data.files.filter(f => f.type === 'active')
  const pendingFiles = data.files.filter(f => f.type === 'pending')

  return (
    <div>
      {/* Sub-tab pills */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {subTabs.map(t => (
          <button key={t.key} onClick={() => setDiTab(t.key)}
            style={{ fontFamily: MONO, fontSize: '11px', padding: '6px 14px', borderRadius: '20px', border: `1px solid ${diTab === t.key ? TEAL : BORDER}`, background: diTab === t.key ? 'rgba(45,212,200,0.1)' : 'transparent', color: diTab === t.key ? TEAL : MUTED, cursor: 'pointer' }}>
            {t.label}
          </button>
        ))}
      </div>

      {diTab === 'client' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '24px' }}>
          <div style={cardStyle()}>
            {sectionTitle('Uploaded files')}
            {activeFiles.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', borderBottom: i < activeFiles.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                <div style={{ color: TEAL, fontSize: '16px', flexShrink: 0 }}>⬡</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', color: WHITE }}>{f.name}</div>
                  <div style={{ fontSize: '11px', color: DIM }}>{f.uploader} · {f.date}</div>
                </div>
                <span style={{ fontFamily: MONO, fontSize: '11px', color: f.confidence >= 85 ? GREEN : AMBER }}>{f.confidence}%</span>
              </div>
            ))}
            {pendingFiles.length > 0 && (
              <>
                <div style={{ marginTop: '16px', marginBottom: '8px', fontFamily: MONO, fontSize: '10px', color: DIM, textTransform: 'uppercase' as const, letterSpacing: '.06em' }}>Pending / missing</div>
                {pendingFiles.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: i < pendingFiles.length - 1 ? `1px solid ${BORDER}` : 'none', opacity: 0.6 }}>
                    <div style={{ color: AMBER, fontSize: '16px', flexShrink: 0 }}>○</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '12px', color: MUTED }}>{f.name}</div>
                      <div style={{ fontSize: '11px', color: DIM }}>{f.uploader}</div>
                    </div>
                    <span style={{ fontFamily: MONO, fontSize: '11px', color: f.confidence > 0 ? AMBER : RED }}>{f.confidence > 0 ? `${f.confidence}%` : 'Missing'}</span>
                  </div>
                ))}
              </>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '16px' }}>
            <div style={cardStyle()}>
              {sectionTitle('Data confidence')}
              {activeFiles.map((f, i) => (
                <div key={i} style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', color: MUTED }}>{f.name.split(' ').slice(0, 2).join(' ')}</span>
                    <span style={{ fontFamily: MONO, fontSize: '11px', color: f.confidence >= 85 ? GREEN : AMBER }}>{f.confidence}%</span>
                  </div>
                  <div style={{ height: '4px', background: BORDER, borderRadius: '2px' }}>
                    <div style={{ height: '4px', borderRadius: '2px', width: `${f.confidence}%`, background: f.confidence >= 85 ? GREEN : AMBER }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={cardStyle()}>
              {sectionTitle('Critical findings')}
              {data.contradictions.slice(0, 2).map((c, i) => (
                <div key={i} style={{ fontSize: '12px', color: MUTED, marginBottom: i === 0 ? '10px' : '0', paddingBottom: i === 0 ? '10px' : '0', borderBottom: i === 0 ? `1px solid ${BORDER}` : 'none' }}>{c.reality.slice(0, 80)}…</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {diTab === 'industry' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '24px' }}>
          <div style={cardStyle()}>
            {sectionTitle('Industry benchmarks')}
            {data.industryBenchmarks.map((b, i) => (
              <div key={i} style={{ padding: '14px 0', borderBottom: i < data.industryBenchmarks.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '13px', color: WHITE }}>{b.label}</span>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <span style={{ fontFamily: MONO, fontSize: '12px', color: RED }}>{b.ours}{b.unit}</span>
                    <span style={{ fontFamily: MONO, fontSize: '12px', color: GREEN }}>{b.peer}{b.unit}</span>
                  </div>
                </div>
                <div style={{ fontSize: '11px', color: DIM }}>{b.gap}</div>
              </div>
            ))}
          </div>
          <div style={cardStyle()}>
            {sectionTitle('Top 3 gaps')}
            {data.industryBenchmarks.slice(0, 3).map((b, i) => (
              <div key={i} style={{ marginBottom: i < 2 ? '14px' : '0', paddingBottom: i < 2 ? '14px' : '0', borderBottom: i < 2 ? `1px solid ${BORDER}` : 'none' }}>
                <div style={{ fontSize: '12px', color: WHITE, marginBottom: '4px' }}>{b.label}</div>
                <div style={{ fontFamily: SERIF, fontSize: '16px', color: RED }}>{b.gap.split(' ')[0]}</div>
                <div style={{ fontSize: '11px', color: DIM, marginTop: '2px' }}>{b.gap}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {diTab === 'public' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '24px' }}>
          <div style={cardStyle()}>
            {sectionTitle('Public data sources')}
            {[
              { name: data.name + ' Annual Report', status: 'Ingested', date: '2026-03-01' },
              { name: 'SEC ADV Filing', status: 'Ingested', date: '2026-03-10' },
              { name: 'MAS FEAT Registry', status: 'Ingested', date: '2026-03-15' },
              { name: 'FCA Register', status: 'Ingested', date: '2026-03-15' },
              { name: 'News monitoring (90d)', status: 'Live', date: '2026-04-14' },
              { name: 'Analyst coverage', status: 'Partial', date: '2026-03-28' },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: i < 5 ? `1px solid ${BORDER}` : 'none' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: s.status === 'Live' ? GREEN : s.status === 'Ingested' ? TEAL : AMBER, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', color: WHITE }}>{s.name}</div>
                  <div style={{ fontSize: '11px', color: DIM }}>{s.date}</div>
                </div>
                <span style={{ fontFamily: MONO, fontSize: '10px', color: s.status === 'Live' ? GREEN : s.status === 'Ingested' ? TEAL : AMBER }}>{s.status}</span>
              </div>
            ))}
          </div>
          <div style={cardStyle()}>
            {sectionTitle('Critical findings from public data')}
            {data.contradictions.slice(0, 3).map((c, i) => (
              <div key={i} style={{ marginBottom: i < 2 ? '14px' : '0', paddingBottom: i < 2 ? '14px' : '0', borderBottom: i < 2 ? `1px solid ${BORDER}` : 'none' }}>
                <div style={{ fontFamily: MONO, fontSize: '9px', color: c.severity === 'critical' ? RED : AMBER, textTransform: 'uppercase' as const, letterSpacing: '.08em', marginBottom: '4px' }}>{c.severity}</div>
                <div style={{ fontSize: '12px', color: WHITE }}>{c.claim.slice(0, 80)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {diTab === 'genome' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '24px' }}>
          <div style={cardStyle()}>
            {sectionTitle('Genome patterns matched')}
            {data.genomePatternsMatched.map((p, i) => (
              <div key={i} style={{ padding: '16px 0', borderBottom: i < data.genomePatternsMatched.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontFamily: MONO, fontSize: '10px', color: DIM, marginBottom: '2px' }}>{p.code}</div>
                    <div style={{ fontFamily: SERIF, fontSize: '24px', color: RED }}>{p.failureRate}%</div>
                    <div style={{ fontFamily: MONO, fontSize: '9px', color: RED }}>failure rate</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: 500, color: WHITE, marginBottom: '6px' }}>{p.name}</div>
                    <div style={{ fontSize: '12px', color: DIM }}>{p.mitigation}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '16px' }}>
            <div style={cardStyle()}>
              {sectionTitle('All patterns present')}
              <div style={{ fontFamily: SERIF, fontSize: '36px', color: RED, marginBottom: '4px' }}>{data.genomePatternsMatched.filter(p => p.present).length}</div>
              <div style={{ fontSize: '12px', color: MUTED }}>patterns matched in this engagement — requires immediate programme design.</div>
            </div>
            <div style={cardStyle()}>
              {sectionTitle('Positive signals')}
              {[
                'CEO actively engaged and funding available',
                'CIO with relevant market experience',
                'Regulatory pressure creating urgency',
              ].map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: i < 2 ? '10px' : '0' }}>
                  <div style={{ color: GREEN, flexShrink: 0 }}>+</div>
                  <div style={{ fontSize: '12px', color: MUTED }}>{s}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── PROJECTS TAB ──────────────────────────────────────────────────────────────

function ProjectsTab({ clientId, projView, setProjView, showNewProject, setShowNewProject }: {
  clientId: string
  projView: string
  setProjView: (v: string) => void
  showNewProject: boolean
  setShowNewProject: (v: boolean) => void
}) {
  const projects = [
    { id: 'P001', name: 'Situation Diagnosis', status: 'Active', maestro: 'Anand S.', updated: '2026-04-12', progress: 65 },
    { id: 'P002', name: 'AI Strategy Blueprint', status: 'Pending', maestro: 'Vikram K.', updated: '2026-04-08', progress: 20 },
    { id: 'P003', name: 'MAS FEAT Remediation', status: 'Active', maestro: 'Anand S.', updated: '2026-04-10', progress: 40 },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { key: 'dashboard', label: 'Dashboard' },
            { key: 'table', label: 'All projects' },
          ].map(v => (
            <button key={v.key} onClick={() => setProjView(v.key)}
              style={{ fontFamily: MONO, fontSize: '11px', padding: '6px 14px', borderRadius: '20px', border: `1px solid ${projView === v.key ? TEAL : BORDER}`, background: projView === v.key ? 'rgba(45,212,200,0.1)' : 'transparent', color: projView === v.key ? TEAL : MUTED, cursor: 'pointer' }}>
              {v.label}
            </button>
          ))}
        </div>
        <button onClick={() => setShowNewProject(!showNewProject)}
          style={{ fontFamily: MONO, fontSize: '11px', padding: '6px 16px', borderRadius: '6px', border: `1px solid ${TEAL}`, background: 'rgba(45,212,200,0.1)', color: TEAL, cursor: 'pointer' }}>
          + New project
        </button>
      </div>

      {showNewProject && (
        <div style={{ ...cardStyle({ marginBottom: '24px', borderColor: TEAL }) }}>
          {sectionTitle('New project')}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            {['Project name', 'Product', 'Maestro'].map((label, i) => (
              <div key={i}>
                <div style={{ fontSize: '11px', color: DIM, marginBottom: '6px' }}>{label}</div>
                <input style={{ width: '100%', background: BG, border: `1px solid ${BORDER}`, borderRadius: '4px', padding: '8px 12px', color: WHITE, fontSize: '13px', fontFamily: SANS, boxSizing: 'border-box' as const }} placeholder={`Enter ${label.toLowerCase()}`} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button style={{ fontFamily: MONO, fontSize: '11px', padding: '8px 20px', borderRadius: '6px', background: 'rgba(45,212,200,0.15)', border: `1px solid ${TEAL}`, color: TEAL, cursor: 'pointer' }}>Create project</button>
            <button onClick={() => setShowNewProject(false)} style={{ fontFamily: MONO, fontSize: '11px', padding: '8px 20px', borderRadius: '6px', background: 'transparent', border: `1px solid ${BORDER}`, color: MUTED, cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      {projView === 'dashboard' && (
        <div>
          {/* Stats strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '12px', marginBottom: '24px' }}>
            {[
              { label: 'Total projects', value: '3' },
              { label: 'Active', value: '2' },
              { label: 'Pending', value: '1' },
              { label: 'Maestros', value: '2' },
              { label: 'Avg progress', value: '42%' },
            ].map((s, i) => (
              <div key={i} style={cardStyle({ textAlign: 'center' as const, padding: '16px' })}>
                <div style={{ fontFamily: SERIF, fontSize: '24px', color: TEAL, marginBottom: '4px' }}>{s.value}</div>
                <div style={labelStyle}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Maestro usage */}
          <div style={{ ...cardStyle({ marginBottom: '24px' }) }}>
            {sectionTitle('Maestro usage')}
            <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
              <thead>
                <tr>{['Maestro', 'Projects', 'Hours (30d)', 'Status'].map(h => (
                  <th key={h} style={{ fontFamily: MONO, fontSize: '10px', color: DIM, textAlign: 'left' as const, padding: '0 12px 10px 0', textTransform: 'uppercase' as const, letterSpacing: '.06em' }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {[
                  { name: 'Anand Sundaram', projects: 2, hours: 42, status: 'Active' },
                  { name: 'Vikram Kapoor', projects: 1, hours: 18, status: 'Active' },
                ].map((r, i) => (
                  <tr key={i}>
                    <td style={{ fontSize: '13px', color: WHITE, padding: '10px 12px 10px 0' }}>{r.name}</td>
                    <td style={{ fontFamily: MONO, fontSize: '12px', color: TEAL, padding: '10px 12px 10px 0' }}>{r.projects}</td>
                    <td style={{ fontFamily: MONO, fontSize: '12px', color: MUTED, padding: '10px 12px 10px 0' }}>{r.hours}h</td>
                    <td style={{ padding: '10px 0' }}><span style={{ fontFamily: MONO, fontSize: '9px', padding: '2px 8px', borderRadius: '10px', background: 'rgba(52,211,153,0.1)', color: GREEN }}>{r.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Active projects quick view */}
          <div style={cardStyle()}>
            {sectionTitle('Active projects')}
            {projects.filter(p => p.status === 'Active').map((p, i) => (
              <div key={i} style={{ padding: '12px 0', borderBottom: i === 0 ? `1px solid ${BORDER}` : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div>
                    <span style={{ fontFamily: MONO, fontSize: '10px', color: DIM, marginRight: '8px' }}>{p.id}</span>
                    <span style={{ fontSize: '13px', color: WHITE }}>{p.name}</span>
                  </div>
                  <span style={{ fontSize: '11px', color: DIM }}>{p.maestro}</span>
                </div>
                <div style={{ height: '4px', background: BORDER, borderRadius: '2px' }}>
                  <div style={{ height: '4px', borderRadius: '2px', width: `${p.progress}%`, background: TEAL }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {projView === 'table' && (
        <div style={cardStyle()}>
          {/* Filter bar */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
            {['All', 'Active', 'Pending', 'Complete'].map((f, i) => (
              <button key={i} style={{ fontFamily: MONO, fontSize: '10px', padding: '4px 12px', borderRadius: '20px', border: `1px solid ${i === 0 ? TEAL : BORDER}`, background: i === 0 ? 'rgba(45,212,200,0.1)' : 'transparent', color: i === 0 ? TEAL : MUTED, cursor: 'pointer' }}>{f}</button>
            ))}
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
            <thead>
              <tr>{['ID', 'Project', 'Status', 'Maestro', 'Progress', 'Last updated'].map(h => (
                <th key={h} style={{ fontFamily: MONO, fontSize: '10px', color: DIM, textAlign: 'left' as const, padding: '0 12px 12px 0', textTransform: 'uppercase' as const, letterSpacing: '.06em' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {projects.map((p, i) => (
                <tr key={i} style={{ borderTop: `1px solid ${BORDER}` }}>
                  <td style={{ fontFamily: MONO, fontSize: '11px', color: DIM, padding: '12px 12px 12px 0' }}>{p.id}</td>
                  <td style={{ fontSize: '13px', color: WHITE, padding: '12px 12px 12px 0' }}>{p.name}</td>
                  <td style={{ padding: '12px 12px 12px 0' }}>
                    <span style={{ fontFamily: MONO, fontSize: '9px', padding: '2px 8px', borderRadius: '10px', background: p.status === 'Active' ? 'rgba(52,211,153,0.1)' : 'rgba(245,158,11,0.1)', color: p.status === 'Active' ? GREEN : AMBER }}>{p.status}</span>
                  </td>
                  <td style={{ fontSize: '12px', color: MUTED, padding: '12px 12px 12px 0' }}>{p.maestro}</td>
                  <td style={{ padding: '12px 12px 12px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '80px', height: '4px', background: BORDER, borderRadius: '2px' }}>
                        <div style={{ height: '4px', borderRadius: '2px', width: `${p.progress}%`, background: TEAL }} />
                      </div>
                      <span style={{ fontFamily: MONO, fontSize: '10px', color: MUTED }}>{p.progress}%</span>
                    </div>
                  </td>
                  <td style={{ fontSize: '11px', color: DIM, padding: '12px 0' }}>{p.updated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── APPROVALS TAB ─────────────────────────────────────────────────────────────

function ApprovalsTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '24px' }}>
      {/* Pending */}
      <div style={cardStyle()}>
        {sectionTitle('Pending approval')}
        {[
          { name: 'AI Initiative Inventory', uploader: 'Raj Malhotra (CIO)', date: '2026-04-05', size: '2.1 MB' },
          { name: 'SAP Contract Details', uploader: 'Thomas Kellner (CFO)', date: '2026-04-08', size: '840 KB' },
        ].map((f, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', borderBottom: i === 0 ? `1px solid ${BORDER}` : 'none' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: AMBER, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', color: WHITE }}>{f.name}</div>
              <div style={{ fontSize: '11px', color: DIM }}>{f.uploader} · {f.date} · {f.size}</div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button style={{ fontFamily: MONO, fontSize: '10px', padding: '4px 12px', borderRadius: '4px', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)', color: GREEN, cursor: 'pointer' }}>Approve</button>
              <button style={{ fontFamily: MONO, fontSize: '10px', padding: '4px 12px', borderRadius: '4px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: AMBER, cursor: 'pointer' }}>Restrict</button>
              <button style={{ fontFamily: MONO, fontSize: '10px', padding: '4px 12px', borderRadius: '4px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: RED, cursor: 'pointer' }}>Reject</button>
            </div>
          </div>
        ))}
      </div>

      {/* Sent to client */}
      <div style={cardStyle()}>
        {sectionTitle('Sent to client')}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: TEAL, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', color: WHITE }}>Situation Analysis — Draft v1</div>
            <div style={{ fontSize: '11px', color: DIM }}>Sent to Victoria Hargreaves · 2026-04-10 · Awaiting review</div>
          </div>
          <span style={{ fontFamily: MONO, fontSize: '10px', color: AMBER }}>Awaiting</span>
        </div>
      </div>

      {/* Resolved */}
      <div style={cardStyle()}>
        {sectionTitle('Resolved')}
        {[
          { name: 'Financial Statements 2024', outcome: 'Approved', by: 'Anand Sundaram', date: '2026-03-30' },
          { name: 'Regulatory Register', outcome: 'Approved', by: 'Anand Sundaram', date: '2026-04-01' },
        ].map((r, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: i === 0 ? `1px solid ${BORDER}` : 'none' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: GREEN, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '12px', color: MUTED }}>{r.name}</div>
              <div style={{ fontSize: '11px', color: DIM }}>{r.by} · {r.date}</div>
            </div>
            <span style={{ fontFamily: MONO, fontSize: '10px', color: GREEN }}>{r.outcome}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── ACTIVITY TAB ──────────────────────────────────────────────────────────────

function ActivityTab({ data }: { data: ClientData }) {
  const activityProjects = [
    {
      name: 'Situation Diagnosis',
      rows: [
        { time: 'Apr 14, 10:22', actor: 'Anand Sundaram', action: 'Reviewed genome pattern F005 match', type: 'Analysis' },
        { time: 'Apr 13, 16:40', actor: 'Raj Malhotra', action: 'Added comment on AI maturity score', type: 'Comment' },
        { time: 'Apr 12, 14:15', actor: 'Anand Sundaram', action: 'Updated situation metrics', type: 'Data' },
        { time: 'Apr 11, 09:00', actor: 'System', action: 'Industry benchmarks refreshed', type: 'System' },
      ],
    },
    {
      name: 'MAS FEAT Remediation',
      rows: [
        { time: 'Apr 14, 08:30', actor: 'Vikram Kapoor', action: 'Created remediation workplan v1', type: 'Document' },
        { time: 'Apr 13, 11:20', actor: 'Anand Sundaram', action: 'Assigned to Vikram Kapoor', type: 'Admin' },
        { time: 'Apr 10, 15:45', actor: 'System', action: 'Regulatory deadline alert triggered', type: 'Alert' },
        { time: 'Apr 08, 12:00', actor: 'Anand Sundaram', action: 'Project created', type: 'Admin' },
      ],
    },
  ]

  const typeColor = (type: string) => {
    if (type === 'Analysis') return PURPLE
    if (type === 'Comment') return TEAL
    if (type === 'Data') return GREEN
    if (type === 'Document') return '#F472B6'
    if (type === 'Alert') return RED
    return DIM
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '24px' }}>
      {activityProjects.map((proj, pi) => (
        <div key={pi} style={cardStyle()}>
          <div style={{ fontSize: '14px', fontWeight: 500, color: WHITE, marginBottom: '16px' }}>{proj.name}</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
            <thead>
              <tr>{['Time', 'Actor', 'Action', 'Type'].map(h => (
                <th key={h} style={{ fontFamily: MONO, fontSize: '10px', color: DIM, textAlign: 'left' as const, padding: '0 12px 10px 0', textTransform: 'uppercase' as const, letterSpacing: '.06em' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {proj.rows.map((r, i) => (
                <tr key={i} style={{ borderTop: `1px solid ${BORDER}` }}>
                  <td style={{ fontFamily: MONO, fontSize: '11px', color: DIM, padding: '10px 12px 10px 0', whiteSpace: 'nowrap' as const }}>{r.time}</td>
                  <td style={{ fontSize: '12px', color: MUTED, padding: '10px 12px 10px 0' }}>{r.actor}</td>
                  <td style={{ fontSize: '12px', color: WHITE, padding: '10px 12px 10px 0' }}>{r.action}</td>
                  <td style={{ padding: '10px 0' }}>
                    <span style={{ fontFamily: MONO, fontSize: '9px', padding: '2px 8px', borderRadius: '10px', background: `${typeColor(r.type)}15`, color: typeColor(r.type), border: `1px solid ${typeColor(r.type)}30` }}>{r.type}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  )
}

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────

export default function AdminClientPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const params = useParams()
  const clientId = params.id as string

  const [tab, setTab] = useState('overview')
  const [adminSection, setAdminSection] = useState('setup')
  const [diTab, setDiTab] = useState('client')
  const [projView, setProjView] = useState('dashboard')
  const [showNewProject, setShowNewProject] = useState(false)

  if (!isLoaded) return <div style={{ minHeight: '100vh', background: BG }} />
  if (!user) { router.push('/sign-in'); return null }

  const data = getClientData(clientId)
  if (!data) return (
    <div style={{ minHeight: '100vh', background: BG, color: WHITE, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS }}>
      Client not found
    </div>
  )

  const tabs = [
    { key: 'admin', label: 'Admin' },
    { key: 'overview', label: 'Overview' },
    { key: 'data', label: 'Data Intelligence' },
    { key: 'projects', label: 'Projects' },
    { key: 'approvals', label: 'Approvals', badge: '2' },
    { key: 'activity', label: 'Activity' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: SANS, color: WHITE }}>
      <AbarvaNav activePage="maestro" clientId={clientId} />

      {/* Breadcrumb */}
      <div style={{ background: CARD, borderBottom: `1px solid ${BORDER}`, padding: '0 32px', height: '40px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <a href={user?.publicMetadata?.role === 'admin' ? '/admin' : `/admin/client/${user?.publicMetadata?.clientId || clientId}`} style={{ fontFamily: MONO, fontSize: '10px', color: TEAL, textDecoration: 'none', letterSpacing: '.05em', textTransform: 'uppercase' as const, cursor: 'pointer' }}>← All engagements</a>
        <div style={{ width: '1px', height: '16px', background: BORDER }} />
        <span style={{ fontSize: '12px', color: MUTED }}>{data.name}</span>
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 28px 80px' }}>

        {/* Client header */}
        <div style={{ padding: '20px 0 16px', display: 'flex', alignItems: 'center', gap: '14px', borderBottom: `1px solid ${BORDER}`, marginBottom: '0' }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: data.color, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '22px', fontWeight: 500, color: WHITE, lineHeight: 1.2 }}>{data.name}</div>
            <div style={{ fontSize: '12px', color: MUTED, marginTop: '4px' }}>{data.type} · ${data.revenue}B revenue · {data.employees.toLocaleString()} employees · {data.hq}</div>
          </div>
          <span style={{
            fontFamily: MONO, fontSize: '10px', padding: '3px 10px', borderRadius: '20px',
            background: data.status === 'Active' ? 'rgba(52,211,153,0.12)' : 'rgba(245,158,11,0.12)',
            color: data.status === 'Active' ? GREEN : AMBER,
            border: `1px solid ${data.status === 'Active' ? 'rgba(52,211,153,0.25)' : 'rgba(245,158,11,0.25)'}`,
            letterSpacing: '.06em', textTransform: 'uppercase' as const,
          }}>
            {data.status}
          </span>
        </div>

        {/* Tab bar */}
        <div style={{ height: '44px', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'stretch', marginBottom: '28px' }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                fontFamily: SANS, fontSize: '13px',
                color: tab === t.key ? TEAL : MUTED,
                borderBottom: tab === t.key ? `2px solid ${TEAL}` : '2px solid transparent',
                padding: '0 18px',
                display: 'flex', alignItems: 'center', gap: '6px',
                whiteSpace: 'nowrap' as const,
              }}>
              {t.label}
              {t.badge && (
                <span style={{ fontFamily: MONO, fontSize: '9px', background: 'rgba(239,68,68,0.15)', color: RED, padding: '1px 5px', borderRadius: '10px' }}>
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'admin' && (
          <AdminTab clientId={clientId} data={data} adminSection={adminSection} setAdminSection={setAdminSection} />
        )}
        {tab === 'overview' && (
          <OverviewTab data={data} />
        )}
        {tab === 'data' && (
          <DataIntelligenceTab data={data} diTab={diTab} setDiTab={setDiTab} />
        )}
        {tab === 'projects' && (
          <ProjectsTab clientId={clientId} projView={projView} setProjView={setProjView} showNewProject={showNewProject} setShowNewProject={setShowNewProject} />
        )}
        {tab === 'approvals' && (
          <ApprovalsTab />
        )}
        {tab === 'activity' && (
          <ActivityTab data={data} />
        )}
      </div>
    </div>
  )
}
