'use client'
import { useState, useRef, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useParams, useRouter } from 'next/navigation'
import AbarvaNav from '@/components/AbarvaNav'
import { arcturusFinancial, arcturusFinancials, arcturusTechnology, arcturusLeadership, arcturusRegulatory, arcturusIndustry } from '@/data/arcturus/index'
import { meridianHealth } from '@/data/meridian/index'
import { apexRetail } from '@/data/apexretail/index'

const BG='#F8F7F4', CARD='#FFFFFF', BORDER='#E2E1DC'
const TEAL='#2DD4C8', WHITE='#0C0C0C', MUTED='#3C3C3C', DIM='#888888'
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

interface HeroNumber {
  value: string
  label: string
  sub: string
  color: string
}

interface HeroFinding {
  code: string
  rate: number
  severity: 'critical' | 'high' | 'medium'
  headline: string
  detail: string
  addressable: string
  primaryCta: string
  secondaryCta: string
  solutionSlug: string
}

interface SolutionProgress {
  name: string
  fullName: string
  phase: number
  complete: boolean
  progress: number
  outcome: string
  cta: string
  slug: string
}

interface ClientData {
  name: string
  type: string
  revenue: number
  employees: number
  hq: string
  status: 'Active' | 'Setup'
  color: string
  hero: {
    welcome: string
    statement: string
    numbers: HeroNumber[]
  }
  heroFindings: HeroFinding[]
  solutionProgress: SolutionProgress[]
  activeEngagement: string
  updatedAgo: string
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
      hero: {
        welcome: 'Welcome to your AbarVa workspace, Arcturus.',
        statement: '71% cost-to-income ratio. Your peers are at 58%. There is $840M sitting in that gap.',
        numbers: [
          { value: '$840M', label: 'Efficiency gap', sub: 'vs peer median cost-to-income', color: RED },
          { value: '0 of 28', label: 'AI initiatives', sub: 'with a tracked ROI baseline', color: RED },
          { value: '71%', label: 'Cost-to-income', sub: 'Peer median 58% · gap is $840M', color: AMBER },
        ],
      },
      heroFindings: [
        {
          code: 'F008', rate: 94, severity: 'critical',
          headline: '"$94M in AI spend. Zero verified return."',
          detail: '28 initiatives. 0 baselines. CDO vacancy 11 months. No programme has a documented outcome baseline.',
          addressable: '$60–120M recoverable',
          primaryCta: 'Start Margin →', secondaryCta: 'View Analysis →',
          solutionSlug: 'margin',
        },
        {
          code: 'F002', rate: 89, severity: 'critical',
          headline: '"71% cost-to-income. Peers are at 58%."',
          detail: '$840M efficiency gap. No transformation programme accountable for closure. CEO aware, no owner.',
          addressable: '$840M efficiency gap',
          primaryCta: 'Start Margin →', secondaryCta: 'View Intelligence →',
          solutionSlug: 'margin',
        },
        {
          code: 'F009', rate: 71, severity: 'high',
          headline: '"MAS FEAT non-compliant. FCA review pending Q3."',
          detail: 'Regulatory debt accruing quarterly. No dedicated remediation squad in place. Deadline at risk.',
          addressable: 'Regulatory exposure',
          primaryCta: 'View Remediation →', secondaryCta: 'View Detail →',
          solutionSlug: 'pdlc',
        },
      ],
      solutionProgress: [
        { name: 'MARGIN OPT', fullName: 'Margin Optimization', phase: 1, complete: false, progress: 40, outcome: '$60–120M', cta: 'Continue →', slug: 'margin' },
        { name: 'AI PDLC', fullName: 'AI-Powered PDLC', phase: 0, complete: true, progress: 100, outcome: '+40%', cta: 'View Ph1 →', slug: 'pdlc' },
        { name: 'TECHNOLOGY', fullName: 'Technology Modernization', phase: 0, complete: false, progress: 60, outcome: '34/100', cta: 'Start →', slug: 'tech' },
      ],
      activeEngagement: 'Margin Phase 1 active',
      updatedAgo: '2hrs ago',
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
      hero: {
        welcome: 'Welcome back, Meridian Health.',
        statement: 'You committed $94M to AI. Zero initiatives have a documented baseline. We found out why.',
        numbers: [
          { value: '$94M', label: 'AI spend', sub: 'No ROI tracked on any initiative', color: RED },
          { value: '18.2%', label: 'Denial rate', sub: 'Benchmark 12% · $94M/yr gap', color: RED },
          { value: '1.8%', label: 'Operating margin', sub: 'Target 4.0% · $220M shortfall', color: AMBER },
        ],
      },
      heroFindings: [
        {
          code: 'F011', rate: 74, severity: 'critical',
          headline: '"RCM outsourced at $48M/yr. Denial rate still 18.2%."',
          detail: '$94M annual write-off. Ensemble SLA penalties never enforced. Board does not know.',
          addressable: '$94M/yr write-off',
          primaryCta: 'Start RCM Solution →', secondaryCta: 'View Intelligence →',
          solutionSlug: 'tech',
        },
        {
          code: 'F007', rate: 77, severity: 'critical',
          headline: '"Board target 4.0% margin. Current reality 1.8%."',
          detail: 'Only $84M transformation budget approved vs $200M needed. $220M shortfall with no path to close.',
          addressable: '$220M shortfall',
          primaryCta: 'Start Margin →', secondaryCta: 'View Analysis →',
          solutionSlug: 'margin',
        },
        {
          code: 'F003', rate: 69, severity: 'high',
          headline: '"Epic fully deployed." 12 of 47 dashboards live."',
          detail: 'Blue Ridge still on legacy EHR. CMIO mandate not enforced. $48M EHR investment underperforming.',
          addressable: 'Epic ROI at risk',
          primaryCta: 'View Blueprint →', secondaryCta: 'View Detail →',
          solutionSlug: 'pdlc',
        },
      ],
      solutionProgress: [
        { name: 'TECH MOD', fullName: 'Technology Modernization', phase: 1, complete: false, progress: 65, outcome: '$94M/yr', cta: 'Continue →', slug: 'tech' },
        { name: 'MARGIN', fullName: 'Margin Optimization', phase: 0, complete: false, progress: 30, outcome: '$220M', cta: 'Start →', slug: 'margin' },
        { name: 'AI PDLC', fullName: 'AI-Powered PDLC', phase: 0, complete: false, progress: 20, outcome: '85%', cta: 'Start →', slug: 'pdlc' },
      ],
      activeEngagement: 'Tech Modernization Phase 1 active',
      updatedAgo: '4hrs ago',
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

  if (id === 'apexretail') {
    return {
      name: apexRetail.org.name,
      type: 'Omnichannel Retailer',
      revenue: apexRetail.org.revenue,
      employees: apexRetail.org.employees,
      hq: apexRetail.org.headquarters,
      status: 'Setup',
      color: '#F59E0B',
      hero: {
        welcome: 'Welcome to your AbarVa workspace, Apex Retail.',
        statement: '800 stores. A website that does not talk to them. $496M in supply chain waste sitting in the gap.',
        numbers: [
          { value: '$496M', label: 'Supply chain waste', sub: 'Excess cost vs optimised peers', color: RED },
          { value: '2.8%', label: 'E-commerce conversion', sub: 'Benchmark 4.2% · $248M revenue gap', color: RED },
          { value: '3.8%', label: 'Operating margin', sub: 'Target 6.0% · $272M shortfall', color: AMBER },
        ],
      },
      heroFindings: [
        {
          code: 'F016', rate: 81, severity: 'critical',
          headline: '"800 stores. A website that does not talk to them."',
          detail: 'CEO mandate is digital-first. IT budget is 2.3% of revenue. Digital-native competitors spend 6–8%.',
          addressable: '$248M e-commerce revenue gap',
          primaryCta: 'Start Digital →', secondaryCta: 'View Analysis →',
          solutionSlug: 'tech',
        },
        {
          code: 'F012', rate: 76, severity: 'critical',
          headline: '"SAP ECC end-of-life 2027. No decision made."',
          detail: 'CFO blocking $180M investment. Board demanding Q3 decision. 8,400 customizations complicate migration.',
          addressable: '$180M migration risk',
          primaryCta: 'Build Business Case →', secondaryCta: 'View Intelligence →',
          solutionSlug: 'margin',
        },
        {
          code: 'F004', rate: 72, severity: 'high',
          headline: '"Demand forecasting at 62%. Benchmark is 84%."',
          detail: '$180M excess inventory from poor forecasting. o9 implementation 40% complete, adoption at 48%.',
          addressable: '$180M inventory savings',
          primaryCta: 'View Remediation →', secondaryCta: 'View Detail →',
          solutionSlug: 'pdlc',
        },
      ],
      solutionProgress: [
        { name: 'TECH MOD', fullName: 'Technology Modernization', phase: 0, complete: false, progress: 15, outcome: '$248M', cta: 'Start →', slug: 'tech' },
        { name: 'MARGIN OPT', fullName: 'Margin Optimization', phase: 0, complete: false, progress: 0, outcome: '$272M', cta: 'Start →', slug: 'margin' },
        { name: 'AI PDLC', fullName: 'AI-Powered PDLC', phase: 0, complete: false, progress: 0, outcome: '+40%', cta: 'Start →', slug: 'pdlc' },
      ],
      activeEngagement: 'Setup in progress',
      updatedAgo: '1hr ago',
      metrics: [
        { label: 'E-com Conversion Rate', value: '2.8%', benchmark: '4.2% benchmark', status: 'critical', gap: '$248M annual revenue gap' },
        { label: 'Operating Margin', value: `${apexRetail.org.operatingMargin}%`, benchmark: `${apexRetail.org.targetOperatingMargin}% target`, status: 'critical', gap: '$272M shortfall' },
        { label: 'Demand Forecast Accuracy', value: '62%', benchmark: '84% benchmark', status: 'critical', gap: '$180M excess inventory' },
        { label: 'Cart Abandonment', value: '72%', benchmark: '58% benchmark', status: 'critical', gap: '14pp above benchmark' },
        { label: 'Inventory Accuracy', value: '84%', benchmark: '95% benchmark', status: 'warning', gap: '11pp below benchmark' },
        { label: 'Loyalty Active Rate', value: '42%', benchmark: '68% target', status: 'warning', gap: '26pp below target' },
        { label: 'On-time Store Delivery', value: '82%', benchmark: '95% benchmark', status: 'warning', gap: '13pp below benchmark' },
        { label: 'SAP ECC Age', value: '14 yrs', benchmark: '7 yr typical', status: 'critical', gap: 'EOL 2027 — decision pending' },
      ],
      contradictions: apexRetail.contradictions.map((c: string, i: number) => {
        const parts = c.split(' but ')
        return {
          id: `c${i + 1}`,
          claim: parts[0] || c,
          reality: parts[1] ? `But: ${parts[1]}` : c,
          severity: i < 2 ? 'critical' : i < 4 ? 'high' : 'medium',
        }
      }),
      genomePatternsMatched: [
        { code: 'F016', name: 'Digital-Physical Integration Failure', failureRate: 81, present: true, mitigation: 'Unified commerce platform — connect store + digital inventory with real-time sync' },
        { code: 'F012', name: 'ERP End-of-Life Paralysis', failureRate: 76, present: true, mitigation: 'Independent SAP assessment with CFO-aligned business case; Q3 board decision framework' },
        { code: 'F004', name: 'Analytics-to-Action Gap', failureRate: 72, present: true, mitigation: 'Complete o9 implementation, activate customer churn model, deploy personalization engine' },
        { code: 'F019', name: 'Loyalty Programme Disconnection', failureRate: 68, present: true, mitigation: 'Connect 18M loyalty members to e-commerce checkout — 26pp activation gap is recoverable' },
      ],
      files: apexRetail.dataInventory.map((d: { category: string; confidence: number; status: string; source: string }) => ({
        name: d.category,
        uploader: d.source,
        date: '2026-04-01',
        confidence: d.confidence,
        type: d.status === 'loaded' ? 'active' as const : 'pending' as const,
      })),
      industryBenchmarks: [
        { label: 'E-com Conversion Rate', ours: 2.8, peer: 4.2, unit: '%', gap: '-1.4pp — $248M revenue gap' },
        { label: 'Operating Margin', ours: 3.8, peer: 5.2, unit: '%', gap: '-1.4pp vs retail median' },
        { label: 'Demand Forecast Accuracy', ours: 62, peer: 84, unit: '%', gap: '-22pp — $180M excess inventory' },
        { label: 'IT Spend (% Revenue)', ours: 2.3, peer: 6.0, unit: '%', gap: '-3.7pp vs digital-native peers' },
      ],
    }
  }

  return null
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
const cardStyle = (extra?: React.CSSProperties): React.CSSProperties => ({
  background: CARD, border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '20px', ...extra,
})

const labelStyle: React.CSSProperties = {
  fontFamily: MONO,
  fontSize: '10px',
  color: TEAL,
  textTransform: 'uppercase' as const,
  letterSpacing: '.06em',
  marginBottom: '6px',
}

// ─── SEED HELPERS (admin utility, FAB bottom-right) ───────────────────────────

// ─── SEED ALL DEMOS BUTTON ───────────────────────────────────────────────────

function SeedAllDemosButton({ compact }: { compact?: boolean }) {
  const [seeding, setSeeding] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [details, setDetails] = useState<{ client: string; solution: string; status: string; message?: string }[]>([])

  async function handleSeedAll() {
    setSeeding(true)
    setResult(null)
    setDetails([])
    try {
      const res = await fetch('/api/admin/seed-all-demos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ createdBy: 'admin' }),
      })
      const data = await res.json()
      setResult(data.summary || data.error || 'Done')
      if (data.results) setDetails(data.results)
    } catch (err: any) {
      setResult(`Error: ${err.message}`)
    } finally {
      setSeeding(false)
    }
  }

  return (
    <div style={{ flexShrink: 0 }}>
      <button
        onClick={handleSeedAll}
        disabled={seeding}
        style={{
          fontFamily: MONO, fontSize: '10px', fontWeight: 700,
          letterSpacing: '.06em', textTransform: 'uppercase' as const,
          padding: compact ? '7px 16px' : '9px 0',
          width: compact ? 'auto' : '100%',
          borderRadius: '6px', cursor: seeding ? 'not-allowed' : 'pointer',
          background: seeding ? 'transparent' : 'rgba(45,212,200,0.1)',
          border: `1px solid ${seeding ? BORDER : 'rgba(45,212,200,0.3)'}`,
          color: seeding ? DIM : TEAL,
          whiteSpace: 'nowrap' as const,
        }}
      >
        {seeding ? 'Seeding…' : compact ? 'Seed all (8 pairs)' : 'Seed all demo engagements (8 pairs)'}
      </button>
      {result && (
        <div style={{ marginTop: '6px', fontFamily: MONO, fontSize: '10px', color: result.includes('error') ? RED : GREEN, lineHeight: 1.6 }}>
          {result}
        </div>
      )}
      {details.filter(d => d.status === 'error').map((d, i) => (
        <div key={i} style={{ marginTop: '4px', fontFamily: MONO, fontSize: '9px', color: RED, lineHeight: 1.5 }}>
          ✗ {d.client}/{d.solution}: {d.message}
        </div>
      ))}
    </div>
  )
}

function SeedSolutionButton({ clientId, solution }: { clientId: string; solution: string }) {
  const [seeding, setSeeding] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSeed() {
    if (done) return
    setSeeding(true)
    try {
      await fetch(`/api/engage/${clientId}/${solution}/seed-demo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ createdBy: 'admin', fullDemo: true }),
      })
      setDone(true)
    } catch { /* ignore */ } finally {
      setSeeding(false)
    }
  }

  return (
    <button
      onClick={handleSeed}
      disabled={seeding || done}
      style={{
        fontFamily: MONO, fontSize: '10px',
        padding: '5px 12px', borderRadius: '4px',
        background: done ? 'rgba(52,211,153,0.1)' : 'rgba(45,212,200,0.07)',
        border: `1px solid ${done ? 'rgba(52,211,153,0.3)' : BORDER}`,
        color: done ? GREEN : MUTED,
        cursor: seeding || done ? 'default' : 'pointer',
        textTransform: 'uppercase' as const, letterSpacing: '.05em',
        whiteSpace: 'nowrap' as const,
        transition: 'all 0.2s',
      }}
    >
      {seeding ? '…' : done ? `✓ ${solution}` : `${solution} →`}
    </button>
  )
}

// ─── DASHBOARD COMPONENTS ──────────────────────────────────────────────────────

function PreEngagementModal({ engagementName, clientId, targetSlug, onClose }: {
  engagementName: string
  clientId: string
  targetSlug: string
  onClose: () => void
}) {
  const router = useRouter()
  const isMeridian = clientId === 'meridian'

  type Check = { ok: boolean; label: string; detail: string; blocking?: boolean }

  const checks: Check[] = isMeridian ? [
    { ok: true,  label: 'Use case defined',          detail: 'Revenue Cycle AI — Denial Prevention (Phase 1)' },
    { ok: true,  label: 'Target outcome confirmed',  detail: 'Denial rate → below 14% by Q4 2026 ($94M gap)' },
    { ok: true,  label: 'Deadline anchored',         detail: 'Epic go-live Q3 2026 — 14-month window confirmed' },
    { ok: true,  label: 'Data confidence avg',       detail: '88% across 3 approved files' },
    { ok: false, label: 'Payer Contract Analysis',   detail: 'Missing. Phase 1 SLA intelligence will be limited. Request from CFO before Phase 2.', blocking: false },
    { ok: false, label: 'Genome F011 active',        detail: 'Epic EHR go-live pattern — 71% failure rate without 12-month AI runway. Must start now.', blocking: false },
    { ok: true,  label: 'CEO briefing',              detail: 'Phase 0 — not yet required' },
  ] : [
    { ok: true,  label: 'Use case defined',          detail: 'Cost-to-income reduction programme' },
    { ok: true,  label: 'Data confidence avg',       detail: '81% across approved files' },
    { ok: false, label: 'MAS FEAT gap analysis',     detail: 'Regulatory deadline overdue. Complete before proceeding with any AI deployment.', blocking: true },
  ]

  const hasBlocker = checks.some(c => !c.ok && c.blocking)
  const warnings = checks.filter(c => !c.ok && !c.blocking)

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(6,10,18,0.82)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 32, maxWidth: 520, width: '90%', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>
        <div style={{ fontFamily: MONO, fontSize: '9px', color: TEAL, letterSpacing: '.1em', textTransform: 'uppercase' as const, marginBottom: 6 }}>Pre-Engagement Check</div>
        <h2 style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 700, color: WHITE, margin: '0 0 20px', lineHeight: 1.2 }}>
          Before you start — {engagementName}
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 7, marginBottom: 20 }}>
          {checks.map((c, i) => (
            <div key={i} style={{
              display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 10px',
              background: c.ok ? 'transparent' : c.blocking ? `${RED}08` : `${AMBER}08`,
              border: `1px solid ${c.ok ? BORDER : c.blocking ? RED + '40' : AMBER + '40'}`,
              borderRadius: 6,
            }}>
              <span style={{ fontSize: 13, color: c.ok ? GREEN : c.blocking ? RED : AMBER, flexShrink: 0, marginTop: 1 }}>
                {c.ok ? '✓' : c.blocking ? '✕' : '⚠'}
              </span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: c.ok ? MUTED : WHITE, fontFamily: SANS }}>{c.label}</div>
                <div style={{ fontSize: 11, color: DIM, fontFamily: SANS, marginTop: 2, lineHeight: 1.5 }}>{c.detail}</div>
              </div>
              {!c.ok && (
                <span style={{ fontFamily: MONO, fontSize: 8, color: c.blocking ? RED : AMBER, background: c.blocking ? `${RED}15` : `${AMBER}15`, padding: '2px 5px', borderRadius: 3, flexShrink: 0, marginTop: 2 }}>
                  {c.blocking ? 'BLOCKING' : 'ADVISORY'}
                </span>
              )}
            </div>
          ))}
        </div>

        {(hasBlocker || warnings.length > 0) && (
          <div style={{ background: hasBlocker ? `${RED}10` : `${AMBER}10`, border: `1px solid ${hasBlocker ? RED : AMBER}40`, borderRadius: 8, padding: '10px 14px', marginBottom: 20 }}>
            <div style={{ fontFamily: MONO, fontSize: 9, color: hasBlocker ? RED : AMBER, textTransform: 'uppercase' as const, letterSpacing: '.08em' }}>
              {hasBlocker ? 'Blocking issue — complete setup before proceeding' : `${warnings.length} advisory gap${warnings.length > 1 ? 's' : ''} — non-blocking, proceed with awareness`}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => { onClose(); window.location.href = '/admin?section=data' }}
            style={{ flex: 1, padding: '10px 0', background: 'transparent', border: `1px solid ${BORDER}`, borderRadius: 8, fontFamily: SANS, fontSize: 13, color: MUTED, cursor: 'pointer' }}
          >
            Address gaps first
          </button>
          <button
            onClick={() => { if (!hasBlocker) { onClose(); router.push(targetSlug) } }}
            disabled={hasBlocker}
            style={{ flex: 2, padding: '10px 0', background: hasBlocker ? '#1C2D45' : TEAL, border: 'none', borderRadius: 8, fontFamily: SANS, fontSize: 13, fontWeight: 700, color: hasBlocker ? '#475569' : '#060A12', cursor: hasBlocker ? 'not-allowed' : 'pointer' }}
          >
            {hasBlocker ? 'Resolve blocker first' : 'Proceed with noted gaps →'}
          </button>
        </div>
      </div>
    </div>
  )
}

function SeedDemosFloatMenu({ clientId }: { clientId: string }) {
  const [open, setOpen] = useState(false)
  const clientSolutions: string[] = clientId === 'arcturus'
    ? ['delivery', 'margin', 'tech', 'pdlc', 'ai-strategy']
    : clientId === 'meridian'
      ? ['tech', 'margin', 'pdlc']
      : []

  return (
    <div style={{ position: 'fixed', bottom: '28px', right: '28px', zIndex: 1000, fontFamily: SANS }}>
      {/* Expanded panel */}
      {open && (
        <div style={{
          position: 'absolute', bottom: '52px', right: 0,
          width: '280px', background: CARD, border: `1px solid rgba(45,212,200,0.3)`,
          borderRadius: '10px', padding: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        }}>
          <div style={{ fontFamily: MONO, fontSize: '9px', color: TEAL, letterSpacing: '.1em', textTransform: 'uppercase' as const, marginBottom: '12px' }}>
            Seed Demo Engagements
          </div>

          {/* Seed all */}
          <SeedAllDemosButton />

          {/* Per-solution for this client */}
          {clientSolutions.length > 0 && (
            <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: `1px solid ${BORDER}` }}>
              <div style={{ fontFamily: MONO, fontSize: '9px', color: TEAL, textTransform: 'uppercase' as const, letterSpacing: '.06em', marginBottom: '8px' }}>
                This client only:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '6px' }}>
                {clientSolutions.map(s => (
                  <SeedSolutionButton key={s} clientId={clientId} solution={s} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* FAB trigger */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          fontFamily: MONO, fontSize: '11px', fontWeight: 700,
          letterSpacing: '.06em', textTransform: 'uppercase' as const,
          padding: '10px 18px', borderRadius: '24px',
          background: open ? 'rgba(45,212,200,0.2)' : 'rgba(45,212,200,0.12)',
          border: `1px solid ${open ? TEAL : 'rgba(45,212,200,0.4)'}`,
          color: TEAL, cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          transition: 'all 0.15s',
        }}
      >
        <span style={{ fontSize: '14px', lineHeight: 1 }}>{open ? '×' : '▶'}</span>
        Seed Demos
      </button>
    </div>
  )
}

// ── Value Dashboard ────────────────────────────────────────────────────────────
function ValueDashboard({ clientId }: { clientId: string }) {
  const isMeridian = clientId === 'meridian'
  const PAGE  = '#F8F7F4', CARD = '#FFFFFF', BDR = '#E5E7EB'
  const TEXT = '#0C0C0C', TEXT2 = '#3C3C3C', MUTED = '#6B7280'
  const DARK = '#060A12', DARK2 = '#0D1520'

  const statCards = isMeridian ? [
    { value: '$22.4M', label: 'VERIFIED SAVINGS TO DATE', sub: 'Audited by KPMG · Month 3', color: TEAL },
    { value: '$3.92M', label: 'FEE EARNED BY ABARVA', sub: 'Invoice MER-FEE-001', color: GREEN },
    { value: '5.7x', label: 'ROI ON ABARVA FEE', sub: '$22.4M ÷ $3.92M fee', color: WHITE },
    { value: '210bps', label: 'MARGIN IMPROVEMENT', sub: 'C/I: 71.2% → 69.1%', color: TEAL },
  ] : [
    { value: '$19.1M', label: 'VERIFIED SAVINGS', sub: 'OpEx reduction confirmed', color: TEAL },
    { value: '$2.8M', label: 'FEE EARNED', sub: 'Invoice ARC-FEE-001', color: GREEN },
    { value: '6.8x', label: 'ROI ON FEE', sub: '$19.1M ÷ $2.8M', color: WHITE },
    { value: '-1.3pp', label: 'C/I IMPROVEMENT', sub: '71.2% → 69.9%', color: TEAL },
  ]

  const plCards = [
    {
      label: 'OPEX IMPACT', value: '$19.1M', color: TEAL, bdColor: TEAL,
      items: ['Bloomberg contract: $3.3M/yr', 'Consulting reduction: $8.4M freed', 'AI ROI verified: $7.4M'],
      progress: 31, target: '$60M Year 1 target',
    },
    {
      label: 'CAPEX AVOIDANCE', value: '$6.2M', color: '#F59E0B', bdColor: '#F59E0B',
      items: ['AI pilots killed: $3.8M avoided', 'Infrastructure deferred: $2.4M'],
      progress: 52, target: '$12M Year 1 target',
    },
    {
      label: 'REVENUE PROTECTED', value: '$2.4B', color: GREEN, bdColor: GREEN,
      items: ['MAS FEAT compliance: active', 'FCA review preparation: in progress'],
      progress: 100, target: 'Regulatory risk cleared',
    },
  ]

  const nextActions = [
    { urgency: 'URGENT', bdColor: RED, title: 'Ensemble contract — Dec 2026', value: '$14M termination fee avoided if SLA enforced now', cta: 'Start →' },
    { urgency: 'HIGH VALUE', bdColor: TEAL, title: 'MA Star Rating — $34M bonus', value: '$34M CMS performance bonus at 4.0 stars', cta: 'Start →' },
    { urgency: 'FOUNDATION', bdColor: MUTED, title: 'CDO + AI governance — $220M', value: 'Baseline 28 AI initiatives. Every untracked dollar is risk.', cta: 'Explore →' },
  ]

  return (
    <div style={{ background: PAGE, minHeight: '100vh' }}>
      {/* Hero dark section */}
      <div style={{ background: DARK, padding: '56px 48px' }}>
        <div style={{ fontFamily: MONO, fontSize: 11, color: TEAL, textTransform: 'uppercase' as const, letterSpacing: '.12em', marginBottom: 12 }}>
          {isMeridian ? 'Meridian Health System' : 'Arcturus Financial'} · Value Delivered
        </div>
        <h1 style={{ fontFamily: SERIF, fontSize: 52, fontWeight: 700, color: '#FFFFFF', margin: '0 0 12px', lineHeight: 1.1 }}>
          {isMeridian ? '$25.3M verified.\n$11.6M projected by Month 12.' : '$21.9M verified.\n$9.4M projected by Month 12.'}
        </h1>
        <p style={{ fontFamily: SANS, fontSize: 18, color: '#9CA3AF', margin: '0 0 40px' }}>
          Across {isMeridian ? 2 : 2} active engagements. Baseline locked Day 0. Every number auditable.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
          {statCards.map((s, i) => (
            <div key={i} style={{ background: DARK2, border: '1px solid #1F2937', borderRadius: 8, padding: 24 }}>
              <div style={{ fontFamily: SERIF, fontSize: 52, fontWeight: 700, color: s.color, lineHeight: 1, marginBottom: 8 }}>{s.value}</div>
              <div style={{ fontFamily: MONO, fontSize: 10, color: TEAL, textTransform: 'uppercase' as const, letterSpacing: '.08em', marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontFamily: SANS, fontSize: 12, color: '#4B5563' }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* P&L Impact */}
      <div style={{ padding: '56px 48px', background: PAGE }}>
        <div style={{ fontFamily: MONO, fontSize: 11, color: TEAL, textTransform: 'uppercase' as const, letterSpacing: '.12em', marginBottom: 12 }}>How This Maps to Your P&L</div>
        <h2 style={{ fontFamily: SERIF, fontSize: 48, fontWeight: 700, color: TEXT, margin: '0 0 40px' }}>Every engagement maps to a line on your P&L.</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
          {plCards.map((p, i) => (
            <div key={i} style={{ background: CARD, border: `1px solid ${BDR}`, borderLeft: `6px solid ${p.bdColor}`, borderRadius: 8, padding: 32 }}>
              <div style={{ fontFamily: MONO, fontSize: 11, color: p.color, textTransform: 'uppercase' as const, letterSpacing: '.1em', marginBottom: 10 }}>{p.label}</div>
              <div style={{ fontFamily: SERIF, fontSize: 52, fontWeight: 700, color: TEXT, lineHeight: 1, marginBottom: 16 }}>{p.value}</div>
              {p.items.map((item, j) => (
                <div key={j} style={{ fontFamily: SANS, fontSize: 15, color: TEXT2, marginBottom: 6 }}>• {item}</div>
              ))}
              <div style={{ marginTop: 20 }}>
                <div style={{ fontFamily: SANS, fontSize: 13, color: MUTED, marginBottom: 6 }}>{p.progress}% of {p.target}</div>
                <div style={{ height: 6, background: BDR, borderRadius: 3 }}>
                  <div style={{ height: 6, borderRadius: 3, width: `${p.progress}%`, background: p.bdColor }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Review */}
      <div style={{ padding: '0 48px 56px' }}>
        <div style={{ background: CARD, borderTop: `4px solid ${TEAL}`, border: `1px solid ${BDR}`, borderRadius: 8, padding: 36 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3 style={{ fontFamily: SERIF, fontSize: 24, color: TEXT, margin: '0 0 8px' }}>Monthly Review</h3>
              <p style={{ fontFamily: SANS, fontSize: 15, color: TEXT2, margin: '0 0 20px', maxWidth: 500 }}>Auto-generated on the 1st of each month from verified actuals.</p>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8, marginBottom: 24 }}>
                {['$22.4M verified to date', 'Phase 3 milestone hit — Month 3', 'Next: Bloomberg billing verification Month 4'].map((b, i) => (
                  <div key={i} style={{ fontFamily: SANS, fontSize: 16, color: TEXT2 }}>• {b}</div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button style={{ background: TEXT, color: '#FFFFFF', fontFamily: SANS, fontSize: 15, fontWeight: 600, height: 44, padding: '0 24px', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
                  Download April Review →
                </button>
                <button style={{ background: 'transparent', color: TEAL, fontFamily: SANS, fontSize: 15, border: 'none', cursor: 'pointer', padding: 0 }}>
                  View all monthly reviews →
                </button>
              </div>
            </div>
            <div style={{ textAlign: 'right' as const }}>
              <div style={{ fontFamily: SERIF, fontSize: 64, fontWeight: 700, color: TEAL, lineHeight: 1 }}>April</div>
              <div style={{ fontFamily: MONO, fontSize: 11, color: MUTED, marginTop: 4 }}>MONTHLY REVIEW READY</div>
            </div>
          </div>
        </div>
      </div>

      {/* What's next */}
      <div style={{ background: DARK, padding: '56px 48px' }}>
        <div style={{ fontFamily: MONO, fontSize: 11, color: TEAL, textTransform: 'uppercase' as const, letterSpacing: '.12em', marginBottom: 12 }}>Next 90 Days</div>
        <h2 style={{ fontFamily: SERIF, fontSize: 48, fontWeight: 700, color: '#FFFFFF', margin: '0 0 40px' }}>The window still open.</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
          {nextActions.map((a, i) => (
            <div key={i} style={{ background: DARK2, border: '1px solid #1F2937', borderLeft: `6px solid ${a.bdColor}`, borderRadius: 8, padding: 28 }}>
              <div style={{ fontFamily: MONO, fontSize: 10, color: a.bdColor, textTransform: 'uppercase' as const, letterSpacing: '.08em', marginBottom: 10 }}>{a.urgency}</div>
              <div style={{ fontFamily: SANS, fontSize: 18, fontWeight: 600, color: '#FFFFFF', marginBottom: 10 }}>{a.title}</div>
              <div style={{ fontFamily: SANS, fontSize: 15, color: '#9CA3AF', marginBottom: 24, lineHeight: 1.6 }}>{a.value}</div>
              <button style={{ background: 'transparent', color: TEAL, fontFamily: SANS, fontSize: 15, border: `1px solid rgba(45,212,200,0.3)`, borderRadius: 6, padding: '8px 16px', cursor: 'pointer' }}>{a.cta}</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Engagements Tab ────────────────────────────────────────────────────────────
function EngagementsTab({ data, clientId }: { data: ClientData; clientId: string }) {
  const [selectedIdx, setSelectedIdx] = useState(0)
  const PAGE  = '#F8F7F4', CARD = '#FFFFFF', BDR = '#E5E7EB'
  const TEXT = '#0C0C0C', TEXT2 = '#3C3C3C', MUTED = '#6B7280'

  const engagements = data.solutionProgress.map((s, i) => ({
    id: `P00${i + 1}`,
    name: s.fullName,
    sponsor: i === 0 ? 'Victoria Hargreaves · CEO' : i === 1 ? 'Raj Malhotra · CIO' : 'Thomas Kellner · CFO',
    function: i === 0 ? 'Finance' : i === 1 ? 'Technology' : 'Operations',
    status: s.complete ? 'Complete' : s.progress > 0 ? 'In Progress' : 'Backlog',
    phase: s.phase,
    value: s.outcome,
    progress: s.progress,
    slug: s.slug,
    problem: i === 0 ? '$840M efficiency gap. 71% C/I vs 58% peer median. No transformation programme with a named owner.'
      : i === 1 ? 'MAS FEAT non-compliant. FCA review pending Q3 2026. No dedicated remediation squad.'
      : 'AI spend untracked. 28 initiatives, zero baselines. CDO vacancy 11 months.',
  }))

  const sel = engagements[selectedIdx]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '35fr 65fr', gap: 0, minHeight: 600, background: PAGE }}>
      {/* Left — list */}
      <div style={{ background: CARD, borderRight: `1px solid ${BDR}`, padding: 24 }}>
        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 28, fontWeight: 700, color: TEXT, margin: '0 0 20px' }}>All Engagements</h2>
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
          {engagements.map((e, i) => {
            const active = i === selectedIdx
            const sc = e.status === 'In Progress' ? TEAL : e.status === 'Complete' ? '#34D399' : '#F59E0B'
            return (
              <button key={i} onClick={() => setSelectedIdx(i)} style={{
                display: 'block', width: '100%', textAlign: 'left' as const,
                background: active ? 'rgba(45,212,200,0.06)' : 'transparent',
                border: `1px solid ${active ? TEAL : BDR}`,
                borderLeft: `4px solid ${sc}`, borderRadius: 8, padding: '16px 16px', cursor: 'pointer',
              }}>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 16, fontWeight: 600, color: TEXT, marginBottom: 4 }}>{e.name}</div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: TEAL, marginBottom: 6 }}>{e.sponsor}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: sc, background: `${sc}18`, padding: '2px 8px', borderRadius: 4 }}>{e.status}</span>
                  <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: TEAL, fontWeight: 700 }}>{e.value}</span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Right — detail */}
      <div style={{ overflowY: 'auto' as const, background: PAGE }}>
        {/* Dark header */}
        <div style={{ background: '#060A12', padding: '32px 36px', marginBottom: 0 }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: TEAL, textTransform: 'uppercase' as const, letterSpacing: '.1em', marginBottom: 8 }}>
            {sel.function} · Phase {sel.phase}
          </div>
          <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 32, fontWeight: 700, color: '#FFFFFF', margin: '0 0 10px' }}>{sel.name}</h3>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 16, color: '#9CA3AF', margin: '0 0 16px', lineHeight: 1.6 }}>{sel.problem}</p>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 16, color: '#FFFFFF' }}>Executive Sponsor: <span style={{ color: TEAL }}>{sel.sponsor}</span></div>
        </div>

        {/* Detail sections */}
        <div style={{ padding: '24px 36px', display: 'flex', flexDirection: 'column' as const, gap: 20 }}>

          {/* Problem */}
          <div style={{ background: CARD, border: `1px solid ${BDR}`, borderRadius: 8, padding: 28 }}>
            <h4 style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: TEXT, margin: '0 0 16px' }}>What the data showed.</h4>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 16, color: TEXT2, lineHeight: 1.6 }}>{sel.problem}</div>
          </div>

          {/* Success metrics */}
          <div style={{ background: CARD, border: `1px solid ${BDR}`, borderRadius: 8, padding: 28 }}>
            <h4 style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: TEXT, margin: '0 0 16px' }}>What We're Measuring</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
              <thead>
                <tr style={{ background: PAGE, borderBottom: `1px solid ${BDR}` }}>
                  {['Metric', 'Baseline', 'Target', 'Status'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left' as const, fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 700, color: MUTED, textTransform: 'uppercase' as const, letterSpacing: '.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { metric: 'C/I Ratio', baseline: '71.2%', target: '63%', status: 'On track' },
                  { metric: 'AI Initiative ROI', baseline: '$0 tracked', target: '$60M', status: 'In progress' },
                  { metric: 'Bloomberg cost', baseline: '$8.4M/yr', target: '$5.1M/yr', status: 'Verified' },
                ].map((r, i) => (
                  <tr key={i} style={{ borderTop: `1px solid ${BDR}` }}>
                    <td style={{ padding: '14px 16px', fontFamily: 'DM Sans, sans-serif', fontSize: 15, color: TEXT, fontWeight: 600 }}>{r.metric}</td>
                    <td style={{ padding: '14px 16px', fontFamily: 'DM Sans, sans-serif', fontSize: 15, color: TEXT2 }}>{r.baseline}</td>
                    <td style={{ padding: '14px 16px', fontFamily: 'DM Sans, sans-serif', fontSize: 15, color: TEXT2 }}>{r.target}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 4, color: r.status === 'Verified' ? '#34D399' : r.status === 'On track' ? TEAL : '#F59E0B', background: r.status === 'Verified' ? 'rgba(52,211,153,0.12)' : r.status === 'On track' ? 'rgba(45,212,200,0.12)' : 'rgba(245,158,11,0.1)' }}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Execution progress */}
          <div style={{ background: CARD, border: `1px solid ${BDR}`, borderRadius: 8, padding: 28 }}>
            <h4 style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: TEXT, margin: '0 0 16px' }}>Execution Progress</h4>
            <div style={{ height: 8, background: BDR, borderRadius: 4, marginBottom: 10 }}>
              <div style={{ height: 8, borderRadius: 4, width: `${sel.progress}%`, background: TEAL }} />
            </div>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 15, color: MUTED }}>{sel.progress}% complete · Phase {sel.phase}</div>
          </div>

          {/* Fee summary */}
          <div style={{ background: CARD, border: `1px solid ${BDR}`, borderTop: `4px solid ${TEAL}`, borderRadius: 8, padding: 28 }}>
            <h4 style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: TEXT, margin: '0 0 8px' }}>Fee Summary</h4>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 32, fontWeight: 700, color: TEAL, marginBottom: 8 }}>$3.92M earned</div>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 15, color: TEXT2, fontStyle: 'italic' }}>15% of $22.4M verified savings · Invoice MER-FEE-001</div>
          </div>
        </div>
      </div>
    </div>
  )
}


// ─── BRIEF TAB ─────────────────────────────────────────────────────────────────

const CLIENT_SPONSORS: Record<string, string[]> = {
  meridian:     ['Marcus Webb · CIO',           'Dr. Sarah Chen · CMO',       'Dr. Sarah Chen · CMO'],
  arcturus:     ['Victoria Hargreaves · CEO',   'Raj Malhotra · CIO',         'Thomas Kellner · CFO'],
  apexretail:   ['CMO · Digital',               'CFO · Finance',               'COO · Operations'],
}

const CLIENT_READINESS: Record<string, number> = {
  meridian: 72, arcturus: 81, apexretail: 58,
}

const CLIENT_MISSING: Record<string, string[]> = {
  meridian:   ['Payer Contract Analysis', 'CDO Profile + Org Chart'],
  arcturus:   ['Stress Testing Config Audit', 'CDO Hire Status Update'],
  apexretail: ['CDO Vacancy Profile', 'Digital P&L Detail'],
}

function BriefTab({ data, clientId }: { data: ClientData; clientId: string }) {
  const finding = data.heroFindings[0]
  const sponsors = CLIENT_SPONSORS[clientId] ?? ['Executive Sponsor', 'Executive Sponsor', 'Executive Sponsor']
  const readinessScore = CLIENT_READINESS[clientId] ?? 65
  const missingFiles = CLIENT_MISSING[clientId] ?? []
  const [engModal, setEngModal] = useState<{ name: string; slug: string } | null>(null)

  // Extract big stat from addressable string
  const statParts = finding.addressable.split(' ')
  const bigStat = statParts[0].replace('/yr', '')
  const statLabel = statParts.slice(1).join(' ') || 'annual exposure'

  return (
    <div>
      {/* ── SECTION 1 — THE SIGNAL ───────────────────────────────────── */}
      <section style={{ background: '#060A12', padding: '40px 48px', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '60fr 40fr', gap: 64, alignItems: 'center' }}>

          {/* Left */}
          <div>
            <div style={{ fontFamily: MONO, fontSize: 11, color: TEAL, textTransform: 'uppercase' as const, letterSpacing: '.12em', marginBottom: 16 }}>
              MOST URGENT · {data.name.toUpperCase()}
            </div>
            <h2 style={{ fontFamily: SERIF, fontSize: 36, fontWeight: 700, color: '#FFFFFF', lineHeight: 1.2, margin: '0 0 16px' }}>
              {finding.headline.replace(/"/g, '')}
            </h2>
            <p style={{ fontFamily: SANS, fontSize: 16, color: '#9CA3AF', lineHeight: 1.75, margin: '0 0 28px' }}>
              {finding.detail}
            </p>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' as const }}>
              <button
                onClick={() => setEngModal({ name: data.heroFindings[0].headline.replace(/"/g, ''), slug: `/engage/${clientId}/${finding.solutionSlug}` })}
                style={{ padding: '12px 24px', background: TEAL, color: '#060A12', border: 'none', borderRadius: 6, fontFamily: SANS, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
              >
                {finding.primaryCta}
              </button>
              <a href={`/diagnose?client=${clientId}`} style={{ padding: '12px 24px', border: '1px solid rgba(255,255,255,0.18)', color: '#9CA3AF', borderRadius: 6, fontFamily: SANS, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
                {finding.secondaryCta}
              </a>
            </div>
          </div>

          {/* Right */}
          <div style={{ textAlign: 'right' as const }}>
            <div style={{ fontFamily: SERIF, fontSize: 80, fontWeight: 700, color: TEAL, lineHeight: 1, marginBottom: 8 }}>
              {bigStat}
            </div>
            <div style={{ fontFamily: SANS, fontSize: 16, color: '#9CA3AF', marginBottom: 20 }}>
              {statLabel}
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6 }}>
              <span style={{ fontFamily: MONO, fontSize: 11, color: '#EF4444' }}>
                {finding.code} · {finding.rate}% Genome failure rate
              </span>
            </div>
          </div>
        </div>

        {/* See all link */}
        <div style={{ marginTop: 24, textAlign: 'right' as const }}>
          <a href={`/intelligence?client=${clientId}`} style={{ fontFamily: SANS, fontSize: 13, color: TEAL, textDecoration: 'none' }}>
            See all {data.heroFindings.length} signals →
          </a>
        </div>
      </section>

      {/* ── SECTION 2 — ACTIVE ENGAGEMENTS ───────────────────────────── */}
      <section style={{ background: BG, padding: '40px 48px', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div style={{ fontFamily: SANS, fontSize: 18, fontWeight: 600, color: WHITE }}>Active Engagements</div>
          <a href={`/solutions?client=${clientId}`} style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, color: '#FFFFFF', background: WHITE, border: 'none', borderRadius: 6, padding: '10px 20px', cursor: 'pointer', textDecoration: 'none' }}>
            + New Engagement
          </a>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {data.solutionProgress.slice(0, 3).map((s, i) => {
            const isActive  = s.progress > 0 && !s.complete
            const isBacklog = s.phase === 0 && s.progress === 0
            const topColor  = s.complete ? GREEN : isActive ? TEAL : AMBER
            const priority  = i === 0 ? 'Critical' : i === 1 ? 'High' : 'Normal'
            const pColor    = priority === 'Critical' ? RED : priority === 'High' ? AMBER : MUTED
            const pBg       = priority === 'Critical' ? 'rgba(239,68,68,0.08)' : priority === 'High' ? 'rgba(245,158,11,0.08)' : '#F3F4F6'
            const btnLabel  = s.complete ? 'View Outcomes →' : s.progress > 0 ? 'Continue Engagement →' : 'Start →'
            const btnBg     = isBacklog ? '#9CA3AF' : isActive ? WHITE : AMBER

            return (
              <div key={i} style={{ background: CARD, border: `1px solid ${BORDER}`, borderTop: `3px solid ${topColor}`, borderRadius: 8, padding: 24, display: 'flex', flexDirection: 'column' as const }}>
                {/* Phase + priority */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontFamily: MONO, fontSize: 10, color: TEAL, textTransform: 'uppercase' as const, letterSpacing: '.08em' }}>
                    Phase {s.phase} · {s.complete ? 'Complete' : isActive ? 'Active' : 'Backlog'}
                  </span>
                  <span style={{ fontFamily: SANS, fontSize: 11, fontWeight: 600, color: pColor, background: pBg, padding: '3px 8px', borderRadius: 4 }}>
                    {priority}
                  </span>
                </div>

                {/* Title */}
                <div style={{ fontFamily: SANS, fontSize: 18, fontWeight: 600, color: WHITE, marginBottom: 6, flex: '0 0 auto' }}>{s.fullName}</div>

                {/* Sponsor */}
                <div style={{ fontFamily: SANS, fontSize: 14, color: TEAL, marginBottom: 16 }}>{sponsors[i]}</div>

                {/* Progress */}
                <div style={{ height: 3, background: BORDER, borderRadius: 2, marginBottom: 6 }}>
                  <div style={{ height: 3, borderRadius: 2, width: `${s.progress}%`, background: topColor }} />
                </div>
                <div style={{ fontFamily: SANS, fontSize: 13, color: MUTED, marginBottom: 16 }}>
                  Phase {s.phase} · {s.progress}% complete
                </div>

                {/* Value */}
                <div style={{ fontFamily: SANS, fontSize: 20, fontWeight: 600, color: WHITE, marginBottom: 20, flex: 1 }}>
                  {s.outcome} at stake
                </div>

                {/* ONE CTA */}
                <button
                  onClick={() => setEngModal({ name: s.fullName, slug: `/engage/${clientId}/${s.slug}` })}
                  style={{ width: '100%', padding: '12px', background: btnBg, color: '#FFFFFF', border: 'none', borderRadius: 6, fontFamily: SANS, fontSize: 14, fontWeight: 600, cursor: 'pointer', textAlign: 'center' as const }}
                >
                  {btnLabel}
                </button>
              </div>
            )
          })}
        </div>

        {data.solutionProgress.length > 3 && (
          <div style={{ marginTop: 16, textAlign: 'center' as const }}>
            <a href="#" style={{ fontFamily: SANS, fontSize: 14, color: TEAL, textDecoration: 'none' }}>
              View all {data.solutionProgress.length} engagements →
            </a>
          </div>
        )}
      </section>

      {/* ── SECTION 3 — DATA READINESS ────────────────────────────────── */}
      <section style={{ padding: '0 48px 40px', overflow: 'hidden' }}>
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '24px 32px', display: 'flex', alignItems: 'center', gap: 40, flexWrap: 'wrap' as const }}>
          {/* Label */}
          <div style={{ flexShrink: 0 }}>
            <div style={{ fontFamily: SANS, fontSize: 16, fontWeight: 600, color: WHITE, marginBottom: 2 }}>Data Readiness</div>
            <div style={{ fontFamily: SANS, fontSize: 14, color: MUTED }}>{data.name}</div>
          </div>

          {/* Score */}
          <div style={{ flexShrink: 0 }}>
            <div style={{ fontFamily: SANS, fontSize: 36, fontWeight: 700, color: AMBER, lineHeight: 1 }}>{readinessScore} / 100</div>
            <div style={{ fontFamily: SANS, fontSize: 13, color: MUTED, marginTop: 2 }}>AI Readiness Score</div>
          </div>

          {/* Missing files */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' as const }}>
            {missingFiles.map((f, i) => (
              <span key={i} style={{ fontFamily: SANS, fontSize: 13, color: AMBER, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', padding: '6px 14px', borderRadius: 20, whiteSpace: 'nowrap' as const }}>
                ○ {f} — MISSING
              </span>
            ))}
          </div>

          {/* Link */}
          <a href="/admin" style={{ flexShrink: 0, fontFamily: SANS, fontSize: 14, color: TEAL, textDecoration: 'none', whiteSpace: 'nowrap' as const }}>
            Go to Data Uploads →
          </a>
        </div>
      </section>

      {engModal && (
        <PreEngagementModal
          engagementName={engModal.name}
          clientId={clientId}
          targetSlug={engModal.slug}
          onClose={() => setEngModal(null)}
        />
      )}
    </div>
  )
}

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────

export default function AdminClientPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const params = useParams()
  const clientId = params.id as string

  const [activeTab, setActiveTab] = useState<'brief' | 'engagements' | 'value'>('brief')

  if (!isLoaded) return <div style={{ minHeight: '100vh', background: BG }} />
  if (!user) { router.push('/sign-in'); return null }

  const metaRole = user.publicMetadata?.role as string | undefined
  const isAdmin  = metaRole === 'admin' || metaRole === 'investor'

  const data = getClientData(clientId)
  if (!data) return (
    <div style={{ minHeight: '100vh', background: BG, color: WHITE, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS }}>
      Client not found
    </div>
  )

  const now = new Date()
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

  const tabs = [
    { key: 'brief' as const,       label: 'Brief' },
    { key: 'engagements' as const, label: 'Engagements' },
    { key: 'value' as const,       label: 'Value Dashboard' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: SANS, color: WHITE }}>
      <AbarvaNav activePage="maestro" />

      {/* Breadcrumb */}
      <div style={{ height: 40, background: '#FFFFFF', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 48px' }}>
        <div style={{ fontFamily: SANS, fontSize: 14, color: '#6B7280' }}>
          Maestro · {data.name}
        </div>
        <div style={{ fontFamily: SANS, fontSize: 12, color: '#9CA3AF' }}>
          Last updated: Today {timeStr}
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E7EB', height: 44, display: 'flex', alignItems: 'center', padding: '0 48px', gap: 0 }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
            fontFamily: SANS, fontSize: 14, fontWeight: 600,
            color: activeTab === t.key ? '#0C0C0C' : '#6B7280',
            background: 'none', border: 'none',
            borderBottom: activeTab === t.key ? '2px solid #2DD4C8' : '2px solid transparent',
            height: 44, padding: '0 20px', cursor: 'pointer',
            transition: 'color 0.15s',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'brief'       && <BriefTab data={data} clientId={clientId} />}
      {activeTab === 'engagements' && <EngagementsTab data={data} clientId={clientId} />}
      {activeTab === 'value'       && <ValueDashboard clientId={clientId} />}

      {isAdmin && <SeedDemosFloatMenu clientId={clientId} />}
    </div>
  )
}
