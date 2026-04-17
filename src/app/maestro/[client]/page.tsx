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

const MAESTRO_SOLUTIONS = [
  { slug: 'rcm',     name: 'Revenue Cycle Intelligence' },
  { slug: 'margin',  name: 'Margin Optimization' },
  { slug: 'tech',    name: 'Technology Modernization' },
  { slug: 'pdlc',    name: 'AI-Powered PDLC' },
  { slug: 'ai-pdlc', name: 'AI Portfolio Accountability' },
  { slug: 'delivery',name: 'Transformation Delivery' },
]

// ─── DATA DASHBOARD ───────────────────────────────────────────────────────────
type DimValColor = 'critical' | 'warning' | 'good' | 'normal'
type DimDotColor = 'red' | 'green' | 'amber' | 'grey'

interface DimMetric { name: string; value: string; vc: DimValColor; dot: DimDotColor; arrow?: string; label: string }
interface DimCard    { title: string; badge: string; badgeC: string; metrics: DimMetric[]; footer: string; href: string }

const VC: Record<DimValColor, string> = { critical: '#991B1B', warning: '#B45309', good: '#166534', normal: '#0F0E0D' }
const DC: Record<DimDotColor, string> = { red: '#991B1B', green: '#166534', amber: '#B45309', grey: '#706D66' }

const DASHBOARD_DATA: Record<string, DimCard[]> = {
  meridian: [
    {
      title: 'Financial Health', badge: 'Critical', badgeC: '#991B1B',
      metrics: [
        { name: 'RCM Denial Rate',      value: '18.2%',      vc: 'critical', dot: 'red',   arrow: '↑', label: '6pp above SLA'       },
        { name: 'Revenue at Risk',      value: '$94M/yr',    vc: 'critical', dot: 'red',              label: 'unrecovered'          },
        { name: 'Prior Auth Coverage',  value: '23%',        vc: 'warning',  dot: 'red',   arrow: '↓', label: 'vs 62% peer'         },
        { name: 'MA Star Rating',       value: '3.5',        vc: 'warning',  dot: 'grey',  arrow: '→', label: 'threshold 4.0'       },
      ],
      footer: 'View Situation Intelligence →', href: '/intelligence?client=meridian',
    },
    {
      title: 'Technology', badge: 'Attention', badgeC: '#B45309',
      metrics: [
        { name: 'Epic Go-Live',         value: 'Q3 2026',    vc: 'warning',  dot: 'grey',  arrow: '→', label: 'no AI path'           },
        { name: 'App Inventory',        value: '312',        vc: 'normal',   dot: 'red',              label: '42% redundant'        },
        { name: 'Shadow IT Spend',      value: '$38M',       vc: 'warning',  dot: 'red',   arrow: '↑', label: 'untracked SaaS'      },
        { name: 'Tech Mod Phase',       value: 'Ph 2',       vc: 'good',     dot: 'green', arrow: '↑', label: '65% complete'        },
      ],
      footer: 'View Technology Intelligence →', href: '/intelligence?client=meridian',
    },
    {
      title: 'Operations', badge: 'Critical', badgeC: '#991B1B',
      metrics: [
        { name: 'CDO Role',             value: 'Vacant',     vc: 'critical', dot: 'red',              label: 'F007 · 79% fail'      },
        { name: 'Travel Nurse Cost',    value: '$20M over',  vc: 'critical', dot: 'red',   arrow: '↑', label: 'vs target'           },
        { name: 'Epic Optimization',    value: '58/100',     vc: 'warning',  dot: 'grey',  arrow: '→', label: '$34M at risk'        },
        { name: 'Data Readiness',       value: '72/100',     vc: 'warning',  dot: 'green', arrow: '↑', label: '2 gaps remain'       },
      ],
      footer: 'View Contradiction Intelligence →', href: '/contradictions?client=meridian',
    },
  ],
  arcturus: [
    {
      title: 'Financial Health', badge: 'Critical', badgeC: '#991B1B',
      metrics: [
        { name: 'Cost-to-Income',       value: '71%',        vc: 'critical', dot: 'red',   arrow: '↑', label: 'vs 58% peer'         },
        { name: 'AI Initiative ROI',    value: '$0 tracked', vc: 'critical', dot: 'red',              label: '28 initiatives'       },
        { name: 'Bloomberg Contract',   value: '$14M/yr',    vc: 'warning',  dot: 'amber', arrow: '→', label: 'renewal Dec 2026'    },
        { name: 'Revenue',              value: '$2.8B',      vc: 'normal',   dot: 'green', arrow: '→', label: 'stable'              },
      ],
      footer: 'View Situation Intelligence →', href: '/intelligence?client=arcturus',
    },
    {
      title: 'Technology', badge: 'Attention', badgeC: '#B45309',
      metrics: [
        { name: 'Salesforce FSC',       value: '44%',        vc: 'critical', dot: 'red',   arrow: '↓', label: 'target 78%'          },
        { name: 'AI Maturity Score',    value: '34/100',     vc: 'critical', dot: 'red',              label: '26pp below peer'      },
        { name: 'Core Banking Age',     value: '14 yrs',     vc: 'warning',  dot: 'amber', arrow: '→', label: 'modernisation stalled' },
        { name: 'Tech Mod Plan',        value: '60%',        vc: 'normal',   dot: 'green', arrow: '↑', label: 'on track'            },
      ],
      footer: 'View Technology Intelligence →', href: '/intelligence?client=arcturus',
    },
    {
      title: 'Operations', badge: 'Critical', badgeC: '#991B1B',
      metrics: [
        { name: 'CDO Role',             value: 'Vacant',     vc: 'critical', dot: 'red',              label: '11 months vacant'     },
        { name: 'MAS FEAT Status',      value: 'Non-compliant', vc: 'critical', dot: 'red',           label: 'FCA review Q3'        },
        { name: 'AUM per Employee',     value: '$34M',       vc: 'warning',  dot: 'red',   arrow: '↓', label: 'vs $120M peer'       },
        { name: 'AI Governance',        value: '0 baselines',vc: 'critical', dot: 'red',              label: '28 initiatives'       },
      ],
      footer: 'View Contradiction Intelligence →', href: '/contradictions?client=arcturus',
    },
  ],
  apexretail: [
    {
      title: 'Financial Health', badge: 'Critical', badgeC: '#991B1B',
      metrics: [
        { name: 'E-com Conversion',     value: '2.8%',       vc: 'critical', dot: 'red',   arrow: '↓', label: 'vs 4.2% benchmark'   },
        { name: 'Revenue Gap',          value: '$248M',      vc: 'critical', dot: 'red',              label: 'conversion shortfall' },
        { name: 'Operating Margin',     value: '3.8%',       vc: 'warning',  dot: 'amber', arrow: '→', label: 'target 6.0%'         },
        { name: 'Cart Abandonment',     value: '72%',        vc: 'critical', dot: 'red',   arrow: '↑', label: 'vs 58% benchmark'    },
      ],
      footer: 'View Situation Intelligence →', href: '/intelligence?client=apexretail',
    },
    {
      title: 'Technology', badge: 'Critical', badgeC: '#991B1B',
      metrics: [
        { name: 'SAP ECC Age',          value: '14 yrs',     vc: 'critical', dot: 'red',   arrow: '↑', label: 'EOL 2027 · no decision' },
        { name: 'IT Spend (% Rev)',     value: '2.3%',       vc: 'critical', dot: 'red',   arrow: '↓', label: 'vs 6% digital-native' },
        { name: 'AI Utilisation',       value: '12%',        vc: 'critical', dot: 'red',              label: '$14M Einstein licensed' },
        { name: 'Supply Chain AI',      value: '62%',        vc: 'warning',  dot: 'amber', arrow: '→', label: '$180M forecast gap'  },
      ],
      footer: 'View Technology Intelligence →', href: '/intelligence?client=apexretail',
    },
    {
      title: 'Operations', badge: 'Warning', badgeC: '#B45309',
      metrics: [
        { name: 'Inventory Accuracy',   value: '84%',        vc: 'warning',  dot: 'amber', arrow: '↓', label: 'vs 95% benchmark'    },
        { name: 'On-time Delivery',     value: '82%',        vc: 'warning',  dot: 'amber', arrow: '↓', label: 'vs 95% benchmark'    },
        { name: 'Loyalty Active Rate',  value: '42%',        vc: 'critical', dot: 'red',   arrow: '↓', label: 'vs 68% target'       },
        { name: 'Demand Forecast',      value: '62%',        vc: 'critical', dot: 'red',   arrow: '↓', label: 'vs 84% peer'         },
      ],
      footer: 'View Contradiction Intelligence →', href: '/contradictions?client=apexretail',
    },
  ],
}

function DashboardGrid({ clientId }: { clientId: string }) {
  const cards = DASHBOARD_DATA[clientId] ?? DASHBOARD_DATA['meridian']
  const BDR = '#E8E6E3'
  const DOT: Record<DimDotColor, string> = { red: '#DC2626', green: '#16A34A', amber: '#D97706', grey: '#D1D5DB' }
  const F = SANS
  return (
    <div style={{ border: `1px solid ${BDR}`, borderRadius: '6px', marginBottom: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', background: '#fff' }}>
      {cards.map((card, ci) => (
        <div key={card.title} style={{ padding: '16px 20px', borderLeft: ci > 0 ? `1px solid ${BDR}` : 'none' }}>
          {/* Section label */}
          <div style={{ fontFamily: F, fontSize: '12px', color: '#9CA3AF', marginBottom: '12px' }}>{card.title}</div>
          {/* Metric rows */}
          {card.metrics.map((m, mi) => (
            <div key={m.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '36px', borderTop: mi > 0 ? `1px solid ${BDR}` : 'none' }}>
              <span style={{ fontFamily: F, fontSize: '13px', color: '#706D66' }}>{m.name}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                <span style={{ fontFamily: F, fontSize: '13px', fontWeight: 600, color: '#0F0E0D' }}>{m.value}</span>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: DOT[m.dot], display: 'inline-block', flexShrink: 0 }} />
              </span>
            </div>
          ))}
          {/* Footer */}
          <div style={{ borderTop: `1px solid ${BDR}`, marginTop: '4px', paddingTop: '10px' }}>
            <a href={card.href} style={{ fontFamily: F, fontSize: '12px', color: '#9CA3AF', textDecoration: 'none' }}>{card.footer}</a>
          </div>
        </div>
      ))}
    </div>
  )
}

function MaestroEngagementChat({ clientId, clientName, initSolution, onClose }: {
  clientId: string
  clientName: string
  initSolution: string | null
  onClose: () => void
}) {
  type Step = 0 | 1 | 2 | 'done'
  const [step, setStep] = useState<Step>(initSolution ? 1 : 0)
  const [directive, setDirective] = useState('')
  const [solution, setSolution] = useState(initSolution ?? '')
  const [sponsor, setSponsor] = useState('')
  const [input, setInput] = useState('')

  const W = '#FFFFFF'
  const initSolName = MAESTRO_SOLUTIONS.find(s => s.slug === initSolution)?.name ?? initSolution ?? ''

  return (
    <div style={{ background: '#060A12', borderBottom: '1px solid #1C2D45' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 48px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'start' }}>

        {/* Left — Chat */}
        <div>
          <div style={{ fontFamily: MONO, fontSize: 11, color: TEAL, textTransform: 'uppercase' as const, letterSpacing: '.12em', marginBottom: 20 }}>
            New Engagement · {clientName}
          </div>

          {step === 0 && (
            <div>
              <div style={{ fontFamily: SERIF, fontSize: 22, color: W, marginBottom: 16, lineHeight: 1.3 }}>
                What is the leadership directive?
              </div>
              <p style={{ fontFamily: SANS, fontSize: 14, color: '#9CA3AF', marginBottom: 20, lineHeight: 1.65 }}>
                Describe it exactly as it was given to you. Don&apos;t filter it.
              </p>
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="e.g. The board wants our denial rate below 14% before Epic goes live in Q3..."
                rows={4}
                style={{ width: '100%', background: '#0D1520', border: '1px solid #1C2D45', borderRadius: 8, padding: '14px 16px', fontFamily: SANS, fontSize: 14, color: W, resize: 'none', outline: 'none', boxSizing: 'border-box' as const }}
              />
              <button
                onClick={() => { if (input.trim()) { setDirective(input.trim()); setInput(''); setStep(1) } }}
                disabled={!input.trim()}
                style={{ marginTop: 12, padding: '12px 28px', background: input.trim() ? W : '#1C2D45', color: input.trim() ? '#060A12' : '#475569', border: 'none', borderRadius: 6, fontFamily: SANS, fontSize: 14, fontWeight: 700, cursor: input.trim() ? 'pointer' : 'not-allowed' }}
              >
                Next →
              </button>
            </div>
          )}

          {step === 1 && (
            <div>
              {directive && (
                <div style={{ background: '#0D1520', border: '1px solid #1C2D45', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontFamily: SANS, fontSize: 14, color: '#9CA3AF', fontStyle: 'italic' }}>
                  &ldquo;{directive}&rdquo;
                </div>
              )}
              <div style={{ fontFamily: SERIF, fontSize: 22, color: W, marginBottom: 16, lineHeight: 1.3 }}>
                Which solution aligns to this?
              </div>
              {initSolName && (
                <div style={{ background: 'rgba(45,212,200,0.08)', border: '1px solid rgba(45,212,200,0.3)', borderRadius: 8, padding: '12px 16px', marginBottom: 16, fontFamily: SANS, fontSize: 14, color: TEAL }}>
                  ✓ Pre-selected: {initSolName}
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
                {MAESTRO_SOLUTIONS.map(s => (
                  <button
                    key={s.slug}
                    onClick={() => setSolution(s.slug)}
                    style={{ textAlign: 'left' as const, padding: '12px 16px', background: solution === s.slug ? 'rgba(45,212,200,0.1)' : '#0D1520', border: `1px solid ${solution === s.slug ? 'rgba(45,212,200,0.5)' : '#1C2D45'}`, borderRadius: 8, fontFamily: SANS, fontSize: 14, color: solution === s.slug ? TEAL : W, cursor: 'pointer' }}
                  >
                    {solution === s.slug ? '✓ ' : ''}{s.name}
                  </button>
                ))}
              </div>
              <button
                onClick={() => { if (solution) setStep(2) }}
                disabled={!solution}
                style={{ marginTop: 16, padding: '12px 28px', background: solution ? W : '#1C2D45', color: solution ? '#060A12' : '#475569', border: 'none', borderRadius: 6, fontFamily: SANS, fontSize: 14, fontWeight: 700, cursor: solution ? 'pointer' : 'not-allowed' }}
              >
                Next →
              </button>
            </div>
          )}

          {step === 2 && (
            <div>
              <div style={{ fontFamily: SERIF, fontSize: 22, color: W, marginBottom: 16, lineHeight: 1.3 }}>
                Who is the executive sponsor?
              </div>
              <p style={{ fontFamily: SANS, fontSize: 14, color: '#9CA3AF', marginBottom: 20, lineHeight: 1.65 }}>
                The named CXO who owns outcomes and has budget authority.
              </p>
              <input
                type="text"
                value={sponsor}
                onChange={e => setSponsor(e.target.value)}
                placeholder="e.g. Sarah Chen, CMO"
                style={{ width: '100%', background: '#0D1520', border: '1px solid #1C2D45', borderRadius: 8, padding: '14px 16px', fontFamily: SANS, fontSize: 14, color: W, outline: 'none', boxSizing: 'border-box' as const }}
              />
              <button
                onClick={() => { if (sponsor.trim()) setStep('done') }}
                disabled={!sponsor.trim()}
                style={{ marginTop: 12, padding: '12px 28px', background: sponsor.trim() ? TEAL : '#1C2D45', color: sponsor.trim() ? '#060A12' : '#475569', border: 'none', borderRadius: 6, fontFamily: SANS, fontSize: 14, fontWeight: 700, cursor: sponsor.trim() ? 'pointer' : 'not-allowed' }}
              >
                Create Engagement →
              </button>
            </div>
          )}

          {step === 'done' && (
            <div>
              <div style={{ fontFamily: SERIF, fontSize: 28, color: W, marginBottom: 16, lineHeight: 1.2 }}>
                Engagement created.
              </div>
              <p style={{ fontFamily: SANS, fontSize: 15, color: '#9CA3AF', lineHeight: 1.65, marginBottom: 24 }}>
                The engagement context has been captured. Your Admin portal has been notified and the engagement will appear in the Active Engagements list below.
              </p>
              <button onClick={onClose} style={{ padding: '12px 28px', background: W, color: '#060A12', border: 'none', borderRadius: 6, fontFamily: SANS, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                View Active Engagements
              </button>
            </div>
          )}
        </div>

        {/* Right — Canvas */}
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, color: TEAL, textTransform: 'uppercase' as const, letterSpacing: '.1em', marginBottom: 4 }}>Engagement Canvas</div>
          {[
            { label: 'CLIENT', value: clientName, locked: true },
            { label: 'SOLUTION TYPE', value: MAESTRO_SOLUTIONS.find(s => s.slug === solution)?.name ?? (solution || null), locked: !!initSolution },
            { label: 'DIRECTIVE', value: directive || null, locked: false },
            { label: 'EXECUTIVE SPONSOR', value: step === 'done' ? sponsor : null, locked: false },
          ].map((item, i) => (
            <div key={i} style={{ background: item.value ? '#0D1520' : 'transparent', border: item.value ? '1px solid #1C2D45' : '1px dashed #1C2D45', borderLeft: item.value ? `3px solid ${TEAL}` : '1px dashed #1C2D45', borderRadius: 8, padding: '12px 14px', opacity: item.value ? 1 : 0.4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <div style={{ fontFamily: MONO, fontSize: 10, color: TEAL, textTransform: 'uppercase' as const, letterSpacing: '.08em' }}>{item.label}</div>
                {item.value && <span style={{ fontFamily: MONO, fontSize: 9, color: TEAL }}>{item.locked ? '✓ pre-selected' : '✓ confirmed'}</span>}
              </div>
              <div style={{ fontFamily: SANS, fontSize: 14, color: item.value ? W : '#475569', fontStyle: item.label === 'DIRECTIVE' && item.value ? 'italic' : 'normal' }}>
                {item.value ? (item.label === 'DIRECTIVE' ? `"${item.value}"` : item.value) : 'Awaiting your answer...'}
              </div>
            </div>
          ))}

          <button onClick={onClose} style={{ marginTop: 8, background: 'none', border: 'none', fontFamily: SANS, fontSize: 13, color: '#475569', cursor: 'pointer', textAlign: 'left' as const }}>
            ← Cancel
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


// ─── ENGAGEMENT DATA ─────────────────────────────────────────────────────────
interface EngagementRecord {
  id: string; name: string; type: string; phase: number; status: string
  sponsor: string; function: string; value: string; priority: string
  progress: number; maestro: string; slug: string; lastActivity: string
}
const ENGAGEMENT_DATA: Record<string, EngagementRecord[]> = {
  meridian: [
    { id: 'E001', name: 'RCM AI — Denial Prevention', type: 'AI Value Realization', phase: 1, status: 'In Progress', sponsor: 'Dr. Sarah Chen · CMO', function: 'Revenue Cycle', value: '$94M', priority: 'Critical', progress: 45, maestro: 'Anand S.', slug: 'margin', lastActivity: '2 hours ago' },
    { id: 'E002', name: 'Technology Modernization', type: 'Solutions', phase: 2, status: 'In Progress', sponsor: 'Mark Rivera · CTO', function: 'Technology', value: '$38M', priority: 'High', progress: 62, maestro: 'Anand S.', slug: 'tech', lastActivity: 'Yesterday' },
    { id: 'E003', name: 'Margin Optimization', type: 'Solutions', phase: 0, status: 'Backlog', sponsor: '—', function: 'Finance', value: '$28M', priority: 'Normal', progress: 0, maestro: '—', slug: 'margin', lastActivity: '1 week ago' },
  ],
  arcturus: [
    { id: 'E004', name: 'Cost-to-Income Reduction', type: 'AI Value Realization', phase: 0, status: 'Backlog', sponsor: 'Victoria Hargreaves · CEO', function: 'Finance', value: '$840M', priority: 'Critical', progress: 0, maestro: '—', slug: 'margin', lastActivity: 'Not started' },
    { id: 'E005', name: 'MAS FEAT Compliance', type: 'Solutions', phase: 0, status: 'Assigned', sponsor: 'Raj Malhotra · CIO', function: 'Technology', value: '$0 (regulatory)', priority: 'Critical', progress: 8, maestro: 'TBD', slug: 'pdlc', lastActivity: '3 days ago' },
  ],
  apexretail: [
    { id: 'E006', name: 'Retail AI Transformation', type: 'AI Value Realization', phase: 1, status: 'In Progress', sponsor: 'CMO · Digital', function: 'Digital Commerce', value: '$120M', priority: 'High', progress: 30, maestro: 'Anand S.', slug: 'delivery', lastActivity: 'Today' },
  ],
}

// ─── DATA RECORDS ────────────────────────────────────────────────────────────
interface DataRecord {
  name: string; owner: string; date: string; confidence: number
  status: 'approved' | 'missing' | 'processing'; category: string
  segment: 'business' | 'it' | 'third-party'; privacy: 'available' | 'private'
}
const DATA_RECORDS_MAP: Record<string, DataRecord[]> = {
  meridian: [
    { name: 'Annual Financial Statements FY2025', owner: 'CFO Office', date: '2026-02-28', confidence: 96, status: 'approved', category: 'Financial', segment: 'business', privacy: 'private' },
    { name: 'Payer Contract Analysis', owner: '—', date: '—', confidence: 0, status: 'missing', category: 'Financial', segment: 'business', privacy: 'private' },
    { name: 'RCM Vendor RFP Responses (6 vendors)', owner: 'Procurement', date: '2026-04-05', confidence: 90, status: 'approved', category: 'Vendors', segment: 'business', privacy: 'private' },
    { name: 'Baseline Outcome Metrics (Day 0 Lock)', owner: 'Internal Audit', date: '2026-04-10', confidence: 97, status: 'approved', category: 'Outcomes', segment: 'business', privacy: 'available' },
    { name: 'Vendor Contracts & SLA Register', owner: 'Procurement', date: '2026-03-28', confidence: 91, status: 'approved', category: 'Vendors', segment: 'business', privacy: 'private' },
    { name: 'CDO Profile + Org Chart', owner: '—', date: '—', confidence: 0, status: 'missing', category: 'Leadership', segment: 'business', privacy: 'private' },
    { name: 'Technology Landscape Assessment', owner: 'CTO', date: '2026-03-15', confidence: 88, status: 'approved', category: 'Technology', segment: 'it', privacy: 'available' },
    { name: 'Full Technology Inventory (312 systems)', owner: 'IT Dept', date: '2026-03-20', confidence: 92, status: 'approved', category: 'Technology', segment: 'it', privacy: 'available' },
    { name: 'IT Architecture & Data Flow Diagrams', owner: 'CTO', date: '2026-04-01', confidence: 86, status: 'approved', category: 'Technology', segment: 'it', privacy: 'private' },
    { name: 'AI Initiative Portfolio Register ($42M)', owner: 'CIO', date: '2026-03-22', confidence: 87, status: 'approved', category: 'AI', segment: 'it', privacy: 'available' },
    { name: 'Clinical Quality Metrics & HEDIS Data', owner: 'CMO Office', date: '2026-03-01', confidence: 89, status: 'approved', category: 'Clinical', segment: 'third-party', privacy: 'available' },
    { name: 'Executive Interview Transcripts (7 leaders)', owner: 'AbarVa', date: '2026-04-01', confidence: 85, status: 'approved', category: 'Intelligence', segment: 'third-party', privacy: 'private' },
    { name: 'HFMA Industry Benchmarks 2025', owner: 'AbarVa Research', date: '2026-03-10', confidence: 98, status: 'approved', category: 'Benchmarks', segment: 'third-party', privacy: 'available' },
    { name: 'Leadership Profiles & Org Chart', owner: 'HR Dept', date: '2026-03-25', confidence: 94, status: 'approved', category: 'Leadership', segment: 'third-party', privacy: 'private' },
  ],
  arcturus: [
    { name: 'AUM & Revenue Breakdown FY2025', owner: 'Finance', date: '2026-03-12', confidence: 94, status: 'approved', category: 'Financial', segment: 'business', privacy: 'private' },
    { name: 'MAS FEAT Compliance Assessment', owner: 'CRO', date: '2026-03-28', confidence: 89, status: 'approved', category: 'Regulatory', segment: 'business', privacy: 'private' },
    { name: 'Bloomberg AIM Contract & Usage Data', owner: 'Procurement', date: '2026-04-05', confidence: 92, status: 'approved', category: 'Vendors', segment: 'business', privacy: 'private' },
    { name: 'CDO Vacancy & Search Status Report', owner: 'HR', date: '2026-04-08', confidence: 84, status: 'approved', category: 'Leadership', segment: 'business', privacy: 'private' },
    { name: 'Stress Testing Configuration Audit', owner: '—', date: '—', confidence: 0, status: 'missing', category: 'Regulatory', segment: 'business', privacy: 'private' },
    { name: 'Salesforce FSC Implementation Report', owner: 'IT Dept', date: '2026-03-20', confidence: 88, status: 'approved', category: 'Technology', segment: 'it', privacy: 'available' },
    { name: 'Technology Stack & Vendor Inventory', owner: 'CTO', date: '2026-03-22', confidence: 87, status: 'approved', category: 'Technology', segment: 'it', privacy: 'available' },
    { name: 'Aladdin Risk System Configuration Report', owner: 'CRO', date: '2026-04-02', confidence: 86, status: 'approved', category: 'Technology', segment: 'it', privacy: 'private' },
    { name: 'AI Initiative Register ($94M, 28 initiatives)', owner: 'CIO', date: '2026-03-18', confidence: 91, status: 'approved', category: 'AI', segment: 'it', privacy: 'available' },
    { name: 'Wealth Management Industry Benchmarks', owner: 'AbarVa Research', date: '2026-03-10', confidence: 98, status: 'approved', category: 'Benchmarks', segment: 'third-party', privacy: 'available' },
    { name: 'Executive Interview Transcripts (5 leaders)', owner: 'AbarVa', date: '2026-04-10', confidence: 85, status: 'approved', category: 'Intelligence', segment: 'third-party', privacy: 'private' },
    { name: 'Leadership Profiles & Board Composition', owner: 'HR', date: '2026-03-25', confidence: 93, status: 'approved', category: 'Leadership', segment: 'third-party', privacy: 'private' },
  ],
  apexretail: [
    { name: 'P&L Statement by Channel FY2025', owner: 'CFO', date: '2026-03-10', confidence: 95, status: 'approved', category: 'Financial', segment: 'business', privacy: 'private' },
    { name: 'Inventory & Supply Chain Data', owner: 'COO', date: '2026-03-20', confidence: 90, status: 'approved', category: 'Operations', segment: 'business', privacy: 'private' },
    { name: 'CDO Vacancy Profile', owner: '—', date: '—', confidence: 0, status: 'missing', category: 'Leadership', segment: 'business', privacy: 'private' },
    { name: 'Digital P&L Detail', owner: '—', date: '—', confidence: 0, status: 'missing', category: 'Financial', segment: 'business', privacy: 'private' },
    { name: 'Technology Inventory (28,000 employees)', owner: 'IT Dept', date: '2026-03-22', confidence: 86, status: 'approved', category: 'Technology', segment: 'it', privacy: 'available' },
    { name: 'Salesforce Einstein License & Usage Audit', owner: 'CMO', date: '2026-03-15', confidence: 92, status: 'approved', category: 'AI', segment: 'it', privacy: 'available' },
    { name: 'E-commerce Platform Analytics (72% abandon)', owner: 'CMO / CTO', date: '2026-03-18', confidence: 88, status: 'approved', category: 'Digital', segment: 'it', privacy: 'available' },
    { name: 'Retail Industry Benchmarks 2025', owner: 'AbarVa Research', date: '2026-03-10', confidence: 98, status: 'approved', category: 'Benchmarks', segment: 'third-party', privacy: 'available' },
    { name: 'Executive Interview Transcripts (4 leaders)', owner: 'AbarVa', date: '2026-04-01', confidence: 85, status: 'approved', category: 'Intelligence', segment: 'third-party', privacy: 'private' },
  ],
}

// ─── INSIGHT DATA ────────────────────────────────────────────────────────────
interface InsightRecord {
  source: 'CLIENT DATA' | 'GENOME' | 'KNOWLEDGE LAYER'
  title: string; detail: string; confidence: number; implication: string
  severity: 'critical' | 'high' | 'medium'
}
const INSIGHT_DATA: Record<string, InsightRecord[]> = {
  meridian: [
    { source: 'CLIENT DATA', title: '18.3% denial rate — 4.3pp above peer benchmark', detail: 'Derived from RCM data and HFMA benchmarks. 4.3pp gap translates to $94M recoverable revenue per annum.', confidence: 92, implication: 'Start RCM AI engagement before Q3 Epic go-live window closes.', severity: 'critical' },
    { source: 'CLIENT DATA', title: '$42M AI portfolio — 0 outcome baselines locked', detail: '14 AI initiatives identified. None have a documented Day 0 outcome baseline. Unable to verify ROI or course-correct.', confidence: 88, implication: 'Lock baselines before Phase 2 gate. Every quarter without a baseline is unrecoverable.', severity: 'critical' },
    { source: 'CLIENT DATA', title: '312 systems — 41% on unsupported versions', detail: 'IT inventory reveals significant technical debt. Epic integration complexity is underestimated in current plans.', confidence: 85, implication: 'Technology Modernization engagement is a critical path item.', severity: 'high' },
    { source: 'GENOME', title: 'F011 — Epic go-live failure pattern active', detail: '71% of health systems in F011 fail AI initiatives within 12 months of EHR go-live without a dedicated AI runway 18 months prior.', confidence: 94, implication: 'Meridian has 14 months. Must start RCM AI workstream immediately.', severity: 'critical' },
    { source: 'GENOME', title: 'F008 — CDO vacancy creates governance gap', detail: '89% of orgs without a CDO for 6+ months fail to achieve ROI on AI investments. Meridian CDO role vacant 9 months.', confidence: 87, implication: 'Interim CDO governance structure required as Phase 1 deliverable.', severity: 'high' },
    { source: 'GENOME', title: 'F022 — Supply chain AI: 90-day payback in 23 deployments', detail: 'F022 present in 23 similar health systems. Pattern produces initial savings in 90 days, full maturity in 9 months.', confidence: 91, implication: 'Baseline locked. Outcome timeline confirmed. Proceed.', severity: 'medium' },
    { source: 'KNOWLEDGE LAYER', title: 'CMS RADV audit scope expanded — Q3 2026 deadline', detail: 'CMS announced expanded RADV audit scope. Health systems with unverified quality metrics face 15–22% revenue adjustment risk.', confidence: 96, implication: 'MA quality programme must be scoped before Q3. $34M bonus opportunity at 4.0 stars.', severity: 'critical' },
    { source: 'KNOWLEDGE LAYER', title: 'Epic AI module pricing +34% from FY2027', detail: 'Epic signalled 34% pricing increase on AI-embedded modules for FY2027. Organisations without negotiated contracts will face higher costs.', confidence: 78, implication: 'Negotiate AI module terms now while RCM engagement establishes value leverage.', severity: 'high' },
    { source: 'KNOWLEDGE LAYER', title: 'HFMA: top quartile RCM at 13.1% denial rate', detail: '2025 HFMA data. Median 16.8%, top quartile 13.1%. Meridian at 18.3% — gap to top quartile is 5.2pp.', confidence: 98, implication: 'Gap to top quartile is approximately $120M addressable at scale.', severity: 'medium' },
  ],
  arcturus: [
    { source: 'CLIENT DATA', title: '$94M AI spend — 0 verified returns across 28 initiatives', detail: 'AI Initiative Register shows $94M committed. No initiative has a documented outcome baseline. Effectively an unmanaged portfolio.', confidence: 91, implication: 'CDO governance and baseline programme must precede any new AI investment.', severity: 'critical' },
    { source: 'CLIENT DATA', title: '71% cost-to-income vs 58% peer median — $840M gap', detail: 'Derived from AUM revenue breakdown and industry benchmarks. Gap confirmed across 3 independent data sources.', confidence: 94, implication: 'Cost-to-income reduction engagement is the highest-value single initiative available.', severity: 'critical' },
    { source: 'CLIENT DATA', title: 'Bloomberg AIM contract 2.3x market rate', detail: 'Bloomberg AIM current at $8.4M/yr. Peer contracts (3 comparable asset managers) show $3.6M achievable.', confidence: 88, implication: '$4.8M/yr savings available on next renewal window (Oct 2026).', severity: 'high' },
    { source: 'GENOME', title: 'F008 — Untracked AI spend is confirmed failure pattern', detail: 'F008 present in 94% of asset managers who fail to achieve AI ROI. Absence of CDO + no baselines = confirmed failure trajectory.', confidence: 94, implication: 'Intervention before Year 2 saves $60–120M in recoverable value.', severity: 'critical' },
    { source: 'GENOME', title: 'F002 — Efficiency gap with no accountable owner', detail: 'CEO aware of $840M gap. No transformation owner. No closure plan. 3 of 5 similar asset managers closed gap with a named CFO sponsor.', confidence: 89, implication: 'Engagement requires named CEO/CFO sponsor as gate condition.', severity: 'critical' },
    { source: 'GENOME', title: 'F009 — MAS FEAT non-compliance risk escalating', detail: '71% of firms in F009 pattern face regulatory action without dedicated remediation squad. Q3 2026 deadline is firm.', confidence: 87, implication: 'MAS FEAT engagement is non-negotiable. Primary risk vector.', severity: 'high' },
    { source: 'KNOWLEDGE LAYER', title: 'MAS FEAT enforcement begins Oct 2026', detail: 'MAS confirmed enforcement of FEAT principles from Oct 2026. Non-compliant firms face enhanced supervision and potential licence conditions.', confidence: 98, implication: 'MAS FEAT engagement must begin immediately. 6 months to remediation completion.', severity: 'critical' },
    { source: 'KNOWLEDGE LAYER', title: 'Asset manager C/I top quartile: 52% — 19pp gap to Arcturus', detail: '2025 McKinsey wealth survey: top quartile C/I at 52%. Arcturus at 71%. Gap is widening year-on-year.', confidence: 96, implication: '$840M addressable. Year 1 target: 68%. Requires 3–5 year programme with named owner.', severity: 'high' },
    { source: 'KNOWLEDGE LAYER', title: 'FCA AI governance: firms with $50M+ AI must show frameworks by Q2 2027', detail: 'FCA consultation closed Q1 2026. Asset managers with AI portfolios over $50M must demonstrate governance frameworks.', confidence: 82, implication: 'Arcturus $94M AI portfolio requires governance framework. CDO hire is now a regulatory necessity.', severity: 'high' },
  ],
  apexretail: [
    { source: 'CLIENT DATA', title: '72% cart abandonment — $200M+ revenue leakage', detail: 'E-commerce analytics show 72% abandonment rate. Industry average 68%. Gap recoverable through AI-driven personalisation.', confidence: 88, implication: 'AI personalisation engagement projected to recover $40–80M in 12 months.', severity: 'critical' },
    { source: 'CLIENT DATA', title: 'Einstein AI: $14M licensed, 12% utilisation rate', detail: 'Salesforce Einstein audit: $14M spent, 12% feature utilisation. $12M in unused capability.', confidence: 92, implication: 'Optimise or renegotiate Einstein contract before Q3 renewal.', severity: 'high' },
    { source: 'GENOME', title: 'F022 — Retail AI pattern: 90-day payback confirmed', detail: 'F022 present in 3 comparable retail transformations. All achieved payback within 90 days of AI personalisation deployment.', confidence: 91, implication: 'Pattern match strong. Move to Phase 1 immediately.', severity: 'medium' },
    { source: 'KNOWLEDGE LAYER', title: 'Retail AI investment at $12B globally in 2026', detail: 'Gartner projects $12B retail AI investment in 2026. Competitors implementing AI personalisation at scale. First-mover window closing.', confidence: 85, implication: 'Start Phase 1 immediately to capture competitive advantage before Q4 window closes.', severity: 'high' },
  ],
}

function BriefTab({ data, clientId, onCreateEngagement }: { data: ClientData; clientId: string; onCreateEngagement: (slug: string) => void }) {
  const finding = data.heroFindings[0]
  const [showAllSignals, setShowAllSignals] = useState(false)
  const sponsors = CLIENT_SPONSORS[clientId] ?? ['Executive Sponsor', 'Executive Sponsor', 'Executive Sponsor']
  const readinessScore = CLIENT_READINESS[clientId] ?? 65
  const missingFiles = CLIENT_MISSING[clientId] ?? []

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
                onClick={() => onCreateEngagement(finding.solutionSlug)}
                style={{ padding: '12px 24px', background: '#FFFFFF', color: '#060A12', border: 'none', borderRadius: 6, fontFamily: SANS, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
              >
                Create Engagement →
              </button>
              <a href={`/diagnose?client=${clientId}`} style={{ padding: '12px 24px', border: '1px solid rgba(255,255,255,0.35)', color: '#FFFFFF', borderRadius: 6, fontFamily: SANS, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
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

        {/* See all signals — inline toggle */}
        <div style={{ marginTop: 24, textAlign: 'right' as const }}>
          <button onClick={() => setShowAllSignals(s => !s)} style={{ fontFamily: SANS, fontSize: 13, color: TEAL, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
            {showAllSignals ? 'Hide signals' : `See all ${data.heroFindings.length} signals →`}
          </button>
        </div>
      </section>

      {/* ── ALL SIGNALS (expanded) ───────────────────────────────────── */}
      {showAllSignals && (
        <section style={{ background: '#0D1520', padding: '32px 48px', borderTop: '1px solid #1C2D45' }}>
          <div style={{ fontFamily: MONO, fontSize: 11, color: TEAL, textTransform: 'uppercase' as const, letterSpacing: '.12em', marginBottom: 20 }}>
            All Signals · {data.name}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 16 }}>
            {data.heroFindings.map((f, i) => {
              const fParts = f.addressable.split(' ')
              const fStat = fParts[0].replace('/yr', '')
              const fLabel = fParts.slice(1).join(' ') || 'exposure'
              return (
                <div key={i} style={{ background: '#060A12', border: '1px solid #1C2D45', borderLeft: `4px solid ${f.severity === 'critical' ? '#EF4444' : f.severity === 'high' ? '#F59E0B' : TEAL}`, borderRadius: 8, padding: '24px 28px', display: 'grid', gridTemplateColumns: '1fr auto', gap: 32, alignItems: 'center' }}>
                  <div>
                    <div style={{ fontFamily: MONO, fontSize: 9, color: f.severity === 'critical' ? '#EF4444' : f.severity === 'high' ? '#F59E0B' : TEAL, letterSpacing: '.1em', textTransform: 'uppercase' as const, marginBottom: 8 }}>
                      {f.code} · {f.severity.toUpperCase()} · {f.rate}% Genome failure rate
                    </div>
                    <div style={{ fontFamily: SERIF, fontSize: 20, color: '#FFFFFF', marginBottom: 8, lineHeight: 1.3 }}>{f.headline.replace(/"/g, '')}</div>
                    <div style={{ fontFamily: SANS, fontSize: 14, color: '#9CA3AF', lineHeight: 1.65 }}>{f.detail}</div>
                  </div>
                  <div style={{ textAlign: 'right' as const, flexShrink: 0 }}>
                    <div style={{ fontFamily: SERIF, fontSize: 36, fontWeight: 700, color: TEAL, marginBottom: 4 }}>{fStat}</div>
                    <div style={{ fontFamily: SANS, fontSize: 12, color: '#9CA3AF', marginBottom: 16 }}>{fLabel}</div>
                    <button onClick={() => onCreateEngagement(f.solutionSlug)} style={{ padding: '9px 20px', background: '#FFFFFF', color: '#060A12', border: 'none', borderRadius: 6, fontFamily: SANS, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                      Create Engagement →
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ── SECTION 2 — ACTIVE ENGAGEMENTS ───────────────────────────── */}
      <section style={{ background: BG, padding: '40px 48px', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div style={{ fontFamily: SANS, fontSize: 18, fontWeight: 600, color: WHITE }}>Active Engagements</div>
          <button onClick={() => onCreateEngagement('')} style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, color: '#FFFFFF', background: WHITE, border: 'none', borderRadius: 6, padding: '10px 20px', cursor: 'pointer' }}>
            + New Engagement
          </button>
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
                <a
                  href={isActive ? `/engage/${clientId}/${s.slug}` : '#'}
                  onClick={isBacklog ? (e) => { e.preventDefault(); onCreateEngagement(s.slug) } : undefined}
                  style={{ display: 'block', width: '100%', padding: '12px', background: btnBg, color: '#FFFFFF', border: 'none', borderRadius: 6, fontFamily: SANS, fontSize: 14, fontWeight: 600, cursor: 'pointer', textAlign: 'center' as const, textDecoration: 'none', boxSizing: 'border-box' as const }}
                >
                  {btnLabel}
                </a>
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

    </div>
  )
}


// ─── ENGAGEMENTS TAB ─────────────────────────────────────────────────────────
function NewEngagementsTab({ data, clientId, initSolution }: { data: ClientData; clientId: string; initSolution?: string | null }) {
  const engagements = ENGAGEMENT_DATA[clientId] ?? []
  const activeCount = engagements.filter(e => e.status === 'In Progress').length
  const [createMode, setCreateMode] = useState(!!initSolution)
  const [createSolution, setCreateSolution] = useState<string | null>(initSolution ?? null)
  const totalValue = clientId === 'arcturus' ? '$840M+' : clientId === 'apexretail' ? '$120M' : '$160M'
  const PCOLOR: Record<string, string> = { Critical: RED, High: AMBER, Normal: DIM }
  const SCOLOR: Record<string, string> = { 'In Progress': TEAL, 'Assigned': AMBER, 'Backlog': DIM, 'Complete': GREEN }

  return (
    <div>
      {/* Inline engagement creation chat */}
      {createMode && (
        <MaestroEngagementChat
          clientId={clientId}
          clientName={data.name}
          initSolution={createSolution}
          onClose={() => { setCreateMode(false); setCreateSolution(null) }}
        />
      )}
      {/* Dark hero */}
      <section style={{ background: '#060A12', padding: '40px 48px' }}>
        <div style={{ fontFamily: MONO, fontSize: 11, color: TEAL, textTransform: 'uppercase' as const, letterSpacing: '.12em', marginBottom: 12 }}>
          {data.name} · Engagement Portfolio
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 32, gap: 16 }}>
          <h2 style={{ fontFamily: SERIF, fontSize: 42, color: '#FFFFFF', margin: 0, lineHeight: 1.15 }}>
            {engagements.length} engagement{engagements.length !== 1 ? 's' : ''}.<br />{activeCount} in flight.
          </h2>
          <button onClick={() => { setCreateMode(true); setCreateSolution(null) }} style={{ padding: '12px 24px', background: '#FFFFFF', color: '#060A12', border: 'none', borderRadius: 6, fontFamily: SANS, fontSize: 14, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
            + New Engagement
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {[
            { value: String(activeCount), label: 'ACTIVE', color: TEAL },
            { value: String(engagements.filter(e => e.status === 'Backlog').length), label: 'IN BACKLOG', color: DIM },
            { value: totalValue, label: 'VALUE AT STAKE', color: '#FFFFFF' },
            { value: String(engagements.filter(e => e.priority === 'Critical').length), label: 'CRITICAL PRIORITY', color: RED },
          ].map((s, i) => (
            <div key={i} style={{ background: '#0D1520', border: '1px solid #1F2937', borderRadius: 8, padding: '20px 24px' }}>
              <div style={{ fontFamily: SERIF, fontSize: 40, fontWeight: 700, color: s.color, lineHeight: 1, marginBottom: 6 }}>{s.value}</div>
              <div style={{ fontFamily: MONO, fontSize: 10, color: TEAL, textTransform: 'uppercase' as const, letterSpacing: '.08em' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Engagement cards */}
      <section style={{ background: BG, padding: '32px 48px' }}>
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 16 }}>
          {engagements.map(e => (
            <div key={e.id} style={{ background: CARD, border: `1px solid ${BORDER}`, borderLeft: `4px solid ${SCOLOR[e.status] ?? DIM}`, borderRadius: 8, padding: '24px 32px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20 }}>

                {/* Left: name + meta */}
                <div style={{ flex: '1 1 0', minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' as const }}>
                    <span style={{ fontFamily: MONO, fontSize: 9, padding: '3px 8px', borderRadius: 3, background: e.type === 'AI Value Realization' ? 'rgba(45,212,200,0.12)' : '#F3F4F6', color: e.type === 'AI Value Realization' ? TEAL : DIM, textTransform: 'uppercase' as const, letterSpacing: '.06em' }}>
                      {e.type === 'AI Value Realization' ? 'AVR' : 'SOL'}
                    </span>
                    <span style={{ fontFamily: MONO, fontSize: 9, padding: '3px 8px', borderRadius: 3, background: `${SCOLOR[e.status] ?? DIM}15`, color: SCOLOR[e.status] ?? DIM, textTransform: 'uppercase' as const, letterSpacing: '.06em' }}>
                      {e.status}
                    </span>
                    <span style={{ fontFamily: MONO, fontSize: 9, padding: '3px 8px', borderRadius: 3, background: `${PCOLOR[e.priority] ?? DIM}12`, color: PCOLOR[e.priority] ?? DIM, textTransform: 'uppercase' as const, letterSpacing: '.06em' }}>
                      ● {e.priority}
                    </span>
                  </div>
                  <div style={{ fontFamily: SANS, fontSize: 20, fontWeight: 700, color: WHITE, marginBottom: 6 }}>{e.name}</div>
                  <div style={{ fontFamily: SANS, fontSize: 14, color: TEAL, marginBottom: 4 }}>{e.function} · Phase {e.phase}</div>
                  <div style={{ fontFamily: SANS, fontSize: 14, color: DIM }}>Sponsor: {e.sponsor} · Maestro: {e.maestro}</div>
                </div>

                {/* Middle: progress */}
                <div style={{ flex: '0 0 180px' }}>
                  <div style={{ fontFamily: MONO, fontSize: 9, color: DIM, textTransform: 'uppercase' as const, letterSpacing: '.06em', marginBottom: 8 }}>Progress</div>
                  <div style={{ height: 6, background: BORDER, borderRadius: 3, marginBottom: 6 }}>
                    <div style={{ height: 6, borderRadius: 3, width: `${e.progress}%`, background: SCOLOR[e.status] ?? DIM }} />
                  </div>
                  <div style={{ fontFamily: SANS, fontSize: 13, color: MUTED }}>{e.progress}% complete</div>
                  <div style={{ fontFamily: SANS, fontSize: 12, color: DIM, marginTop: 4 }}>Last activity: {e.lastActivity}</div>
                </div>

                {/* Right: value + CTA */}
                <div style={{ flex: '0 0 140px', textAlign: 'right' as const }}>
                  <div style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 700, color: WHITE, marginBottom: 4 }}>{e.value}</div>
                  <div style={{ fontFamily: MONO, fontSize: 9, color: DIM, textTransform: 'uppercase' as const, letterSpacing: '.06em', marginBottom: 16 }}>Value at stake</div>
                  <a
                    href={e.status === 'In Progress' ? `/engage/${clientId}/${e.slug}` : '#'}
                    style={{ display: 'block', padding: '9px 16px', background: e.status === 'In Progress' ? WHITE : 'transparent', color: e.status === 'In Progress' ? BG : WHITE, border: `1px solid ${WHITE}`, borderRadius: 6, fontFamily: SANS, fontSize: 13, fontWeight: 600, cursor: 'pointer', width: '100%', textAlign: 'center' as const, textDecoration: 'none', boxSizing: 'border-box' as const }}
                  >
                    {e.status === 'In Progress' ? 'Open Workspace →' : e.status === 'Backlog' ? 'Set Up →' : 'View →'}
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}

// ─── DATA TAB ────────────────────────────────────────────────────────────────
function DataTab({ clientId }: { clientId: string }) {
  const records = DATA_RECORDS_MAP[clientId] ?? []
  const [privacy, setPrivacy] = useState<Record<string, 'available' | 'private'>>(() => {
    const init: Record<string, 'available' | 'private'> = {}
    records.forEach(r => { init[r.name] = r.privacy })
    return init
  })

  const segments: { key: 'business' | 'it' | 'third-party'; label: string; icon: string; desc: string }[] = [
    { key: 'business',    label: 'Business',       icon: '◈', desc: 'Financials, contracts, strategy, leadership' },
    { key: 'it',          label: 'IT & Technology', icon: '⬡', desc: 'Systems, architecture, AI initiatives' },
    { key: 'third-party', label: 'Third Party',     icon: '◆', desc: 'Benchmarks, research, AbarVa intelligence' },
  ]

  const totalApproved = records.filter(r => r.status === 'approved').length
  const totalMissing  = records.filter(r => r.status === 'missing').length
  const confRecords   = records.filter(r => r.confidence > 0)
  const avgConf = confRecords.length > 0 ? Math.round(confRecords.reduce((a, b) => a + b.confidence, 0) / confRecords.length) : 0

  const togglePrivacy = (name: string) =>
    setPrivacy(prev => ({ ...prev, [name]: prev[name] === 'available' ? 'private' : 'available' }))

  return (
    <div>
      {/* Dark header */}
      <section style={{ background: '#060A12', padding: '40px 48px' }}>
        <div style={{ fontFamily: MONO, fontSize: 11, color: TEAL, textTransform: 'uppercase' as const, letterSpacing: '.12em', marginBottom: 12 }}>
          Data Repository · {clientId.charAt(0).toUpperCase() + clientId.slice(1)}
        </div>
        <h2 style={{ fontFamily: SERIF, fontSize: 42, color: '#FFFFFF', margin: '0 0 32px', lineHeight: 1.15 }}>
          {totalApproved} datasets ingested.{totalMissing > 0 ? <br /> : ' '}{totalMissing > 0 ? `${totalMissing} still missing.` : 'No gaps.'}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {[
            { value: String(records.length),  label: 'TOTAL FILES',     color: '#FFFFFF' },
            { value: String(totalApproved),    label: 'APPROVED',        color: GREEN },
            { value: String(totalMissing),     label: 'MISSING',         color: totalMissing > 0 ? RED : DIM },
            { value: `${avgConf}%`,            label: 'AVG CONFIDENCE',  color: TEAL },
          ].map((s, i) => (
            <div key={i} style={{ background: '#0D1520', border: '1px solid #1F2937', borderRadius: 8, padding: '20px 24px' }}>
              <div style={{ fontFamily: SERIF, fontSize: 40, fontWeight: 700, color: s.color, lineHeight: 1, marginBottom: 6 }}>{s.value}</div>
              <div style={{ fontFamily: MONO, fontSize: 10, color: TEAL, textTransform: 'uppercase' as const, letterSpacing: '.08em' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Segments */}
      <section style={{ background: BG, padding: '32px 48px' }}>
        {segments.map(seg => {
          const segRecords = records.filter(r => r.segment === seg.key)
          if (segRecords.length === 0) return null
          return (
            <div key={seg.key} style={{ marginBottom: 36 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <span style={{ fontFamily: MONO, fontSize: 18, color: TEAL }}>{seg.icon}</span>
                <div>
                  <div style={{ fontFamily: SANS, fontSize: 18, fontWeight: 600, color: WHITE }}>{seg.label}</div>
                  <div style={{ fontFamily: SANS, fontSize: 13, color: DIM }}>{seg.desc}</div>
                </div>
                <div style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 11, color: TEAL }}>
                  {segRecords.filter(r => r.status === 'approved').length} / {segRecords.length} approved
                </div>
              </div>
              <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, overflow: 'hidden' }}>
                {/* Header row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 130px 90px 80px 100px 110px', background: '#F3F4F5', borderBottom: `1px solid ${BORDER}`, padding: '10px 20px', gap: 8 }}>
                  {['File', 'Owner', 'Date', 'Conf.', 'Status', 'Access'].map(h => (
                    <div key={h} style={{ fontFamily: MONO, fontSize: 9, color: DIM, textTransform: 'uppercase' as const, letterSpacing: '.08em' }}>{h}</div>
                  ))}
                </div>
                {segRecords.map((r, i) => (
                  <div key={i} style={{
                    display: 'grid', gridTemplateColumns: '1fr 130px 90px 80px 100px 110px', gap: 8,
                    padding: '13px 20px', alignItems: 'center',
                    borderBottom: i < segRecords.length - 1 ? `1px solid ${BORDER}` : 'none',
                    background: r.status === 'missing' ? 'rgba(239,68,68,0.03)' : 'transparent',
                  }}>
                    <div>
                      <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, color: r.status === 'missing' ? RED : WHITE, marginBottom: 3 }}>
                        {r.status === 'missing' ? '○ ' : ''}{r.name}
                      </div>
                      <span style={{ fontFamily: MONO, fontSize: 8, color: DIM, background: '#F3F4F5', padding: '2px 6px', borderRadius: 3 }}>{r.category}</span>
                    </div>
                    <div style={{ fontFamily: SANS, fontSize: 12, color: MUTED }}>{r.owner}</div>
                    <div style={{ fontFamily: MONO, fontSize: 11, color: DIM }}>{r.date === '—' ? '—' : r.date.slice(5)}</div>
                    <div>
                      {r.confidence > 0 ? (
                        <>
                          <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, color: r.confidence >= 90 ? GREEN : r.confidence >= 80 ? TEAL : AMBER }}>{r.confidence}%</div>
                          <div style={{ height: 3, background: BORDER, borderRadius: 2, marginTop: 3 }}>
                            <div style={{ height: 3, borderRadius: 2, width: `${r.confidence}%`, background: r.confidence >= 90 ? GREEN : r.confidence >= 80 ? TEAL : AMBER }} />
                          </div>
                        </>
                      ) : <span style={{ fontFamily: MONO, fontSize: 11, color: DIM }}>—</span>}
                    </div>
                    <div>
                      <span style={{ fontFamily: MONO, fontSize: 9, padding: '3px 8px', borderRadius: 3, textTransform: 'uppercase' as const, letterSpacing: '.06em',
                        background: r.status === 'approved' ? 'rgba(52,211,153,0.12)' : r.status === 'missing' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                        color: r.status === 'approved' ? GREEN : r.status === 'missing' ? RED : AMBER
                      }}>{r.status}</span>
                    </div>
                    <div>
                      {r.status !== 'missing' ? (
                        <button onClick={() => togglePrivacy(r.name)} style={{
                          display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px',
                          border: `1px solid ${privacy[r.name] === 'available' ? TEAL : BORDER}`,
                          borderRadius: 5, background: privacy[r.name] === 'available' ? 'rgba(45,212,200,0.08)' : '#F9F9F9',
                          cursor: 'pointer', fontFamily: SANS, fontSize: 11, fontWeight: 600,
                          color: privacy[r.name] === 'available' ? TEAL : DIM,
                        }}>
                          <span>{privacy[r.name] === 'available' ? '◉' : '○'}</span>
                          {privacy[r.name] === 'available' ? 'Available' : 'Private'}
                        </button>
                      ) : <span style={{ fontFamily: MONO, fontSize: 11, color: DIM }}>—</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </section>
    </div>
  )
}

// ─── INSIGHTS TAB ────────────────────────────────────────────────────────────
function InsightsTab({ data, clientId }: { data: ClientData; clientId: string }) {
  const allInsights  = INSIGHT_DATA[clientId] ?? []
  const cdInsights   = allInsights.filter(i => i.source === 'CLIENT DATA')
  const genInsights  = allInsights.filter(i => i.source === 'GENOME')
  const klInsights   = allInsights.filter(i => i.source === 'KNOWLEDGE LAYER')
  const SCOLOR: Record<string, string> = { critical: RED, high: AMBER, medium: TEAL }

  const benchmarks = clientId === 'arcturus' ? [
    { metric: 'Cost-to-Income Ratio',    client: '71%',             peer: '58%',        topQ: '52%' },
    { metric: 'AI Initiative ROI',       client: '$0 tracked',      peer: '$12M avg',   topQ: '$34M avg' },
    { metric: 'CDO in Post',             client: 'Vacant (11mo)',   peer: '78% filled', topQ: '100% filled' },
    { metric: 'Bloomberg Cost / AUM',    client: '0.34%',           peer: '0.18%',      topQ: '0.12%' },
  ] : clientId === 'meridian' ? [
    { metric: 'Payer Denial Rate',       client: '18.3%',           peer: '16.8%',      topQ: '13.1%' },
    { metric: 'AI Initiative ROI',       client: '$0 tracked',      peer: '$8M avg',    topQ: '$22M avg' },
    { metric: 'Technology Debt',         client: '41% unsupported', peer: '22% avg',    topQ: '8% top Q' },
    { metric: 'CDO in Post',             client: 'Vacant (9mo)',    peer: '71% filled', topQ: '100% filled' },
  ] : [
    { metric: 'Cart Abandonment Rate',   client: '72%',             peer: '68%',        topQ: '61%' },
    { metric: 'AI Feature Utilisation',  client: '12%',             peer: '45%',        topQ: '78%' },
  ]

  function InsightCard({ ins }: { ins: InsightRecord }) {
    return (
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderLeft: `3px solid ${SCOLOR[ins.severity]}`, borderRadius: 8, padding: '18px 20px', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 8, color: SCOLOR[ins.severity] }}>●</span>
          <span style={{ fontFamily: MONO, fontSize: 9, color: SCOLOR[ins.severity], textTransform: 'uppercase' as const, letterSpacing: '.06em' }}>{ins.severity}</span>
          <span style={{ fontFamily: MONO, fontSize: 9, color: DIM, marginLeft: 'auto' }}>{ins.confidence}% conf.</span>
        </div>
        <div style={{ fontFamily: SANS, fontSize: 14, fontWeight: 700, color: WHITE, marginBottom: 8, lineHeight: 1.4 }}>{ins.title}</div>
        <div style={{ fontFamily: SANS, fontSize: 12, color: MUTED, lineHeight: 1.6, marginBottom: 10 }}>{ins.detail}</div>
        <div style={{ height: 2, background: BORDER, borderRadius: 1, marginBottom: 10 }}>
          <div style={{ height: 2, borderRadius: 1, width: `${ins.confidence}%`, background: SCOLOR[ins.severity] }} />
        </div>
        <div style={{ fontFamily: SANS, fontSize: 12, fontWeight: 600, color: TEAL }}>→ {ins.implication}</div>
      </div>
    )
  }

  const PURPLE = '#818CF8'

  return (
    <div>
      {/* Dark hero */}
      <section style={{ background: '#060A12', padding: '40px 48px' }}>
        <div style={{ fontFamily: MONO, fontSize: 11, color: TEAL, textTransform: 'uppercase' as const, letterSpacing: '.12em', marginBottom: 12 }}>
          AbarVa Intelligence · {data.name}
        </div>
        <h2 style={{ fontFamily: SERIF, fontSize: 42, color: '#FFFFFF', margin: '0 0 12px', lineHeight: 1.15 }}>
          {allInsights.length} insights generated<br />across 3 intelligence dimensions.
        </h2>
        <p style={{ fontFamily: SANS, fontSize: 16, color: '#9CA3AF', margin: '0 0 32px', maxWidth: 560 }}>
          Derived from your uploaded data, the AbarVa Genome, and our sector knowledge layer.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[
            { value: String(cdInsights.length),  label: 'CLIENT DATA INSIGHTS', color: TEAL },
            { value: String(genInsights.length),  label: 'GENOME PATTERNS',      color: PURPLE },
            { value: String(klInsights.length),   label: 'KNOWLEDGE LAYER',      color: AMBER },
          ].map((s, i) => (
            <div key={i} style={{ background: '#0D1520', border: '1px solid #1F2937', borderRadius: 8, padding: '20px 24px' }}>
              <div style={{ fontFamily: SERIF, fontSize: 40, fontWeight: 700, color: s.color, lineHeight: 1, marginBottom: 6 }}>{s.value}</div>
              <div style={{ fontFamily: MONO, fontSize: 10, color: TEAL, textTransform: 'uppercase' as const, letterSpacing: '.08em' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Benchmark comparison table */}
      <section style={{ background: BG, padding: '32px 48px 0' }}>
        <div style={{ fontFamily: MONO, fontSize: 11, color: TEAL, textTransform: 'uppercase' as const, letterSpacing: '.1em', marginBottom: 8 }}>Benchmark Comparison</div>
        <h3 style={{ fontFamily: SERIF, fontSize: 28, color: WHITE, margin: '0 0 20px' }}>Where you stand against your peers.</h3>
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, overflow: 'hidden', marginBottom: 32 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', background: '#F3F4F5', borderBottom: `1px solid ${BORDER}`, padding: '10px 20px', gap: 8 }}>
            {['Metric', 'Your Position', 'Peer Median', 'Top Quartile'].map(h => (
              <div key={h} style={{ fontFamily: MONO, fontSize: 9, color: DIM, textTransform: 'uppercase' as const, letterSpacing: '.08em' }}>{h}</div>
            ))}
          </div>
          {benchmarks.map((b, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '14px 20px', borderBottom: i < benchmarks.length - 1 ? `1px solid ${BORDER}` : 'none', alignItems: 'center', gap: 8 }}>
              <div style={{ fontFamily: SANS, fontSize: 14, fontWeight: 600, color: WHITE }}>{b.metric}</div>
              <div style={{ fontFamily: SANS, fontSize: 15, fontWeight: 700, color: RED }}>{b.client}</div>
              <div style={{ fontFamily: SANS, fontSize: 15, color: AMBER }}>{b.peer}</div>
              <div style={{ fontFamily: SANS, fontSize: 15, color: GREEN }}>{b.topQ}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Three insight columns */}
      <section style={{ background: BG, padding: '0 48px 48px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: TEAL, display: 'inline-block' }} />
              <span style={{ fontFamily: MONO, fontSize: 11, color: TEAL, textTransform: 'uppercase' as const, letterSpacing: '.1em' }}>Client Data</span>
            </div>
            <div style={{ fontFamily: SANS, fontSize: 13, color: DIM, marginBottom: 16 }}>Extracted from your uploaded files and documents.</div>
            {cdInsights.map((ins, i) => <InsightCard key={i} ins={ins} />)}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: PURPLE, display: 'inline-block' }} />
              <span style={{ fontFamily: MONO, fontSize: 11, color: PURPLE, textTransform: 'uppercase' as const, letterSpacing: '.1em' }}>Genome</span>
            </div>
            <div style={{ fontFamily: SANS, fontSize: 13, color: DIM, marginBottom: 16 }}>F-code failure patterns matched to your profile from 1,200+ transformation programmes.</div>
            {genInsights.map((ins, i) => <InsightCard key={i} ins={ins} />)}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: AMBER, display: 'inline-block' }} />
              <span style={{ fontFamily: MONO, fontSize: 11, color: AMBER, textTransform: 'uppercase' as const, letterSpacing: '.1em' }}>Knowledge Layer</span>
            </div>
            <div style={{ fontFamily: SANS, fontSize: 13, color: DIM, marginBottom: 16 }}>Sector intelligence, regulatory signals, and market data from AbarVa's research layer.</div>
            {klInsights.map((ins, i) => <InsightCard key={i} ins={ins} />)}
          </div>

        </div>
      </section>
    </div>
  )
}

// ─── SIDEBAR SECTION TYPE ────────────────────────────────────────────────────
type SidebarSection =
  | 'engagements' | 'situation' | 'findings' | 'contradictions' | 'genome'
  | 'uploads' | 'data-readiness' | 'sensitive-access'
  | 'value-dashboard' | 'monthly-reviews' | 'fee-tracker'
  | 'deliverables' | 'board-packs'

// ─── ENGAGEMENTS SECTION — spec Page 2 layout ────────────────────────────────
function EngagementsSection({
  data, clientId, onNavigate,
}: { data: ClientData; clientId: string; onNavigate: (s: SidebarSection) => void }) {
  const [showChat, setShowChat] = useState(false)
  const [chatSolution, setChatSolution] = useState<string | null>(null)
  const engagements = ENGAGEMENT_DATA[clientId] ?? []
  const activeCount = engagements.filter(eng => eng.status === 'In Progress').length
  const readinessScore = CLIENT_READINESS[clientId] ?? 65
  const missingFiles = CLIENT_MISSING[clientId] ?? []
  const now = new Date()
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
  const BDR = '#E8E6E3'

  return (
    <div style={{ padding: '24px 28px' }}>
      {showChat && (
        <div style={{ margin: '-24px -28px 20px' }}>
          <MaestroEngagementChat
            clientId={clientId}
            clientName={data.name}
            initSolution={chatSolution}
            onClose={() => { setShowChat(false); setChatSolution(null) }}
          />
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <div style={{ fontFamily: SANS, fontSize: '20px', fontWeight: 700, color: '#0F0E0D' }}>{data.name}</div>
          <div style={{ fontFamily: SANS, fontSize: '13px', color: '#9CA3AF', marginTop: '4px' }}>
            Last updated: Today {timeStr} · {activeCount} active engagement{activeCount !== 1 ? 's' : ''}
          </div>
        </div>
        <button
          onClick={() => { setChatSolution(null); setShowChat(true) }}
          style={{ fontFamily: SANS, fontSize: '13px', fontWeight: 600, background: '#0F0E0D', color: '#fff', padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
        >
          + New Engagement
        </button>
      </div>

      <DashboardGrid clientId={clientId} />

      {/* Engagements Table */}
      <div style={{ fontFamily: SANS, fontSize: '13px', color: '#9CA3AF', marginBottom: '8px' }}>Active Engagements</div>
      <div style={{ border: `1px solid ${BDR}`, borderRadius: '6px', overflow: 'hidden', background: '#fff' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontFamily: SANS, fontSize: '15px' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${BDR}` }}>
              {['Engagement', 'Sponsor', 'Phase', 'Status', 'Maestro', 'Value', 'Priority', ''].map(h => (
                <th key={h} style={{ padding: '11px 16px', fontFamily: SANS, fontSize: '13px', fontWeight: 400, color: '#9CA3AF', textAlign: 'left' as const, background: '#FAFAF9' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {engagements.map((eng, i) => {
              const bd = i < engagements.length - 1 ? `1px solid ${BDR}` : 'none'
              const td: React.CSSProperties = { padding: '13px 16px', borderBottom: bd, color: '#0F0E0D', verticalAlign: 'middle' }
              const tdg: React.CSSProperties = { padding: '13px 16px', borderBottom: bd, color: '#706D66', verticalAlign: 'middle' }
              return (
                <tr key={eng.id}>
                  <td style={td}>{eng.name}</td>
                  <td style={tdg}>{eng.sponsor.split(' · ')[0]}</td>
                  <td style={tdg}>Phase {eng.phase}</td>
                  <td style={tdg}>{eng.status}</td>
                  <td style={tdg}>{eng.maestro}</td>
                  <td style={{ ...td, fontWeight: 600 }}>{eng.value}</td>
                  <td style={tdg}>{eng.priority}</td>
                  <td style={{ ...tdg, textAlign: 'right' }}>
                    <a
                      href={eng.status === 'In Progress' ? `/engage/${clientId}/${eng.slug}` : '#'}
                      onClick={eng.status !== 'In Progress' ? (ev) => { ev.preventDefault(); setChatSolution(null); setShowChat(true) } : undefined}
                      style={{ color: '#0F0E0D', textDecoration: 'none' }}
                    >
                      {eng.status === 'In Progress' ? 'Continue →' : 'Start →'}
                    </a>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Data Readiness */}
      <div style={{ border: `1px solid ${BDR}`, borderRadius: '6px', background: '#fff', marginTop: '10px', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px', borderBottom: `1px solid ${BDR}` }}>
          <span style={{ fontFamily: SANS, fontSize: '12px', color: '#9CA3AF' }}>Data Readiness</span>
          <span style={{ fontFamily: SANS, fontSize: '13px', fontWeight: 600, color: '#0F0E0D' }}>{readinessScore} / 100</span>
        </div>
        {missingFiles.map((f, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px', borderBottom: idx < missingFiles.length - 1 ? `1px solid ${BDR}` : 'none' }}>
            <span style={{ fontFamily: SANS, fontSize: '13px', color: '#706D66' }}>{f}</span>
            <span style={{ fontFamily: SANS, fontSize: '12px', color: '#9CA3AF' }}>Missing</span>
          </div>
        ))}
        <div style={{ padding: '11px 16px', borderTop: missingFiles.length > 0 ? `1px solid ${BDR}` : 'none' }}>
          <button onClick={() => onNavigate('uploads')} style={{ fontFamily: SANS, fontSize: '13px', color: '#706D66', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
            Upload data →
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────

export default function MaestroClientPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const params = useParams()
  const clientId = params.client as string

  const [activeSection, setActiveSection] = useState<SidebarSection>('engagements')

  if (!isLoaded) return <div style={{ minHeight: '100vh', background: BG }} />
  if (!user) { router.push('/sign-in'); return null }

  const metaRole = user.publicMetadata?.role as string | undefined
  const isAdmin  = metaRole === 'admin'

  const data = getClientData(clientId)
  if (!data) return (
    <div style={{ minHeight: '100vh', background: BG, color: WHITE, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS }}>
      Client not found
    </div>
  )

  const SB_BG        = '#060A12'
  const SB_ACTIVE_BG = 'rgba(45,212,200,0.12)'
  const SB_TEXT_MUT  = 'rgba(255,255,255,0.6)'

  function sbItem(section: SidebarSection, icon: string, label: string) {
    const active = activeSection === section
    return (
      <button
        key={section}
        onClick={() => setActiveSection(section)}
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 5, width: '100%', border: 'none', cursor: 'pointer', marginBottom: 1, textAlign: 'left' as const, background: active ? SB_ACTIVE_BG : 'transparent', fontFamily: SANS }}
        onMouseEnter={ev => { if (!active) (ev.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)' }}
        onMouseLeave={ev => { if (!active) (ev.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
      >
        <span style={{ width: 14, fontSize: 11, color: active ? TEAL : '#6B7280', textAlign: 'center' as const }}>{icon}</span>
        <span style={{ fontSize: 12, color: active ? TEAL : SB_TEXT_MUT, fontWeight: active ? 600 : 400 }}>{label}</span>
      </button>
    )
  }

  function renderContent() {
    switch (activeSection) {
      case 'engagements':
        return <EngagementsSection data={data!} clientId={clientId} onNavigate={setActiveSection} />
      case 'situation':
        return <BriefTab data={data!} clientId={clientId} onCreateEngagement={() => setActiveSection('engagements')} />
      case 'findings':
      case 'contradictions':
      case 'genome':
        return <InsightsTab data={data!} clientId={clientId} />
      case 'uploads':
      case 'data-readiness':
      case 'sensitive-access':
        return <DataTab clientId={clientId} />
      case 'value-dashboard':
      case 'monthly-reviews':
      case 'fee-tracker':
        return <ValueDashboard clientId={clientId} />
      case 'deliverables':
      case 'board-packs':
        return (
          <div style={{ padding: '24px 28px' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#0C0C0C', fontFamily: SANS, marginBottom: 8 }}>
              {activeSection === 'deliverables' ? 'Deliverables' : 'Board Packs'}
            </div>
            <div style={{ fontSize: 13, color: '#6B7280', fontFamily: SANS }}>Coming soon.</div>
          </div>
        )
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: SANS }}>
      <AbarvaNav activePage="maestro" />

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 60px)' }}>

        {/* ── LEFT SIDEBAR ──────────────────────────────────────── */}
        <div style={{ width: 220, minWidth: 220, background: SB_BG, display: 'flex', flexDirection: 'column' as const, paddingTop: 20, borderRight: '1px solid rgba(255,255,255,0.06)' }}>

          {/* Active Client */}
          <div style={{ padding: '0 16px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: 8 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#4B5563', textTransform: 'uppercase' as const, letterSpacing: '.1em', marginBottom: 6, fontFamily: MONO }}>Active Client</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{data.name}</div>
            <div style={{ fontSize: 11, color: '#6B7280', fontFamily: SANS }}>{data.type} · ${(data.revenue / 1e9).toFixed(1)}B</div>
          </div>

          {/* Intelligence */}
          <div style={{ padding: '12px 16px 4px' }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#4B5563', textTransform: 'uppercase' as const, letterSpacing: '.1em', marginBottom: 6, fontFamily: MONO }}>Intelligence</div>
            {sbItem('situation',      '◎', 'Situation')}
            {sbItem('findings',       '◈', 'Findings')}
            {sbItem('contradictions', '⚡', 'Contradictions')}
            {sbItem('genome',         '⬡', 'Genome')}
          </div>

          {/* Engagements */}
          <div style={{ padding: '12px 16px 4px' }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#4B5563', textTransform: 'uppercase' as const, letterSpacing: '.1em', marginBottom: 6, fontFamily: MONO }}>Engagements</div>
            {sbItem('engagements', '≡', 'All Engagements')}
            <button
              onClick={() => setActiveSection('engagements')}
              style={{ margin: '4px 0 0', padding: '6px 10px', background: 'rgba(45,212,200,0.1)', border: '1px solid rgba(45,212,200,0.3)', borderRadius: 5, fontSize: 11, fontWeight: 600, color: TEAL, cursor: 'pointer', textAlign: 'center' as const, width: '100%', fontFamily: SANS }}
            >
              + New Engagement
            </button>
          </div>

          {/* Data */}
          <div style={{ padding: '12px 16px 4px' }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#4B5563', textTransform: 'uppercase' as const, letterSpacing: '.1em', marginBottom: 6, fontFamily: MONO }}>Data</div>
            {sbItem('uploads',          '↑',  'Uploads')}
            {sbItem('data-readiness',   '◉',  'Data Readiness')}
            {sbItem('sensitive-access', '🔒', 'Request Sensitive Access')}
          </div>

          {/* Value */}
          <div style={{ padding: '12px 16px 4px' }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#4B5563', textTransform: 'uppercase' as const, letterSpacing: '.1em', marginBottom: 6, fontFamily: MONO }}>Value</div>
            {sbItem('value-dashboard', '$',  'Value Dashboard')}
            {sbItem('monthly-reviews', '📋', 'Monthly Reviews')}
            {sbItem('fee-tracker',     '%',  'Fee Tracker')}
          </div>

          {/* Outputs */}
          <div style={{ padding: '12px 16px 4px' }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#4B5563', textTransform: 'uppercase' as const, letterSpacing: '.1em', marginBottom: 6, fontFamily: MONO }}>Outputs</div>
            {sbItem('deliverables', '📄', 'Deliverables')}
            {sbItem('board-packs',  '📊', 'Board Packs')}
          </div>

          {/* Back link */}
          <div style={{ marginTop: 'auto', padding: '14px 16px 20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <a href="/maestro" style={{ fontSize: 11, color: '#6B7280', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, fontFamily: SANS }}>
              ← All Clients
            </a>
          </div>
        </div>

        {/* ── MAIN CONTENT ──────────────────────────────────────── */}
        <div style={{ flex: 1, background: BG, overflowY: 'auto' as const }}>
          {renderContent()}
        </div>

      </div>

      {isAdmin && <SeedDemosFloatMenu clientId={clientId} />}
    </div>
  )
}
