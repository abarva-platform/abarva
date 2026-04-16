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
  color: TEAL,
  textTransform: 'uppercase' as const,
  letterSpacing: '.06em',
  marginBottom: '6px',
}

const sectionTitle = (text: string) => (
  <div style={{ fontFamily: MONO, fontSize: '10px', color: TEAL, textTransform: 'uppercase' as const, letterSpacing: '.08em', marginBottom: '14px' }}>{text}</div>
)

// ─── ADMIN TAB ─────────────────────────────────────────────────────────────────

function AdminTab({ clientId, data, adminSection, setAdminSection, isReadOnly }: {
  clientId: string
  data: ClientData
  adminSection: string
  setAdminSection: (s: string) => void
  isReadOnly: boolean
}) {
  const pills = [
    { key: 'setup', label: 'Setup & engagement' },
    { key: 'data', label: 'Data & approvals' },
    { key: 'users', label: 'Maestro users' },
    { key: 'security', label: 'Security' },
  ]
  const [uploadedFiles, setUploadedFiles] = useState<DataFile[]>([])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [seeding, setSeeding] = useState(false)
  const [seedResult, setSeedResult] = useState<string | null>(null)

  async function seedClerkMetadata() {
    setSeeding(true)
    setSeedResult(null)
    try {
      const res = await fetch('/api/admin/seed-clerk-metadata', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { setSeedResult(`Error: ${data.error}`); return }
      const summary = data.results.map((r: any) => `${r.email.split('+')[0]}: ${r.status}`).join(' · ')
      setSeedResult(summary)
    } catch (err: any) {
      setSeedResult(`Error: ${err.message}`)
    } finally {
      setSeeding(false)
    }
  }

  const activeFiles = [...data.files.filter(f => f.type === 'active'), ...uploadedFiles]
  const pendingFiles = data.files.filter(f => f.type === 'pending')

  async function handleUpload(files: FileList) {
    setUploading(true)
    const added: DataFile[] = []
    for (const file of Array.from(files)) {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('clientId', clientId)
      fd.append('documentName', file.name.replace(/\.[^.]+$/, ''))
      try {
        const res = await fetch('/api/admin/upload-dataset', { method: 'POST', body: fd })
        if (res.ok) {
          const json = await res.json()
          added.push({
            name: json.documentName,
            uploader: json.uploader,
            date: json.date,
            confidence: json.confidence,
            type: 'active',
          })
        }
      } catch { /* ignore individual file errors */ }
    }
    setUploadedFiles(prev => [...prev, ...added])
    setUploading(false)
  }

  const products = [
    { name: 'Situation Diagnosis', href: `/diagnose?client=${clientId}` },
    { name: 'AI Value Realization', href: `/ai-strategy?client=${clientId}` },
    { name: 'Vendor Selection', href: `/select?client=${clientId}` },
    { name: 'Business Case', href: `/justify?client=${clientId}` },
    { name: 'Outcomes Tracking', href: `/outcomes?client=${clientId}` },
  ]

  const clientSolutions: string[] = clientId === 'arcturus'
    ? ['delivery', 'margin', 'tech', 'pdlc', 'ai-strategy']
    : clientId === 'meridian'
      ? ['tech', 'margin', 'pdlc']
      : []

  return (
    <div>
      {/* Demo engagements panel — admin only */}
      {!isReadOnly && <div style={{ marginBottom: '20px', padding: '16px 20px', background: 'rgba(45,212,200,0.04)', border: `1px solid rgba(45,212,200,0.15)`, borderRadius: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: clientSolutions.length > 0 ? '14px' : '0' }}>
          <div>
            <div style={{ fontFamily: MONO, fontSize: '10px', color: TEAL, letterSpacing: '.08em', textTransform: 'uppercase' as const }}>Demo Engagements</div>
            <div style={{ fontSize: '12px', color: MUTED, marginTop: '4px' }}>Pre-load complete demo data so clients and investors can explore live immediately.</div>
          </div>
          <SeedAllDemosButton compact />
        </div>
        {clientSolutions.length > 0 && (
          <div>
            <div style={{ fontFamily: MONO, fontSize: '9px', color: TEAL, textTransform: 'uppercase' as const, letterSpacing: '.06em', marginBottom: '8px' }}>Seed this client individually:</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
              {clientSolutions.map(solution => (
                <SeedSolutionButton key={solution} clientId={clientId} solution={solution} />
              ))}
            </div>
          </div>
        )}
      </div>}

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
                  <span style={{ fontFamily: MONO, fontSize: '9px', padding: '2px 8px', borderRadius: '10px', background: 'rgba(52,211,153,0.1)', color: MUTED, border: '1px solid rgba(52,211,153,0.2)' }}>Active</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {adminSection === 'data' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px', alignItems: 'start' }}>
          {/* Left 65%: file management */}
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '16px' }}>
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
                    <button disabled={isReadOnly} style={{ fontFamily: MONO, fontSize: '10px', padding: '4px 10px', borderRadius: '4px', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)', color: TEAL, cursor: isReadOnly ? 'default' : 'pointer', opacity: isReadOnly ? 0.4 : 1, marginRight: '6px' }}>Approve</button>
                    <button disabled={isReadOnly} style={{ fontFamily: MONO, fontSize: '10px', padding: '4px 10px', borderRadius: '4px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: MUTED, cursor: isReadOnly ? 'default' : 'pointer', opacity: isReadOnly ? 0.4 : 1 }}>Reject</button>
                  </div>
                ))
              }
            </div>
            <div style={cardStyle()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ fontFamily: MONO, fontSize: '10px', color: TEAL, textTransform: 'uppercase' as const, letterSpacing: '.08em' }}>Approved files</div>
                <button
                  onClick={() => !isReadOnly && fileInputRef.current?.click()}
                  disabled={uploading || isReadOnly}
                  style={{ fontFamily: MONO, fontSize: '10px', padding: '4px 12px', borderRadius: '4px', background: (uploading || isReadOnly) ? 'transparent' : 'rgba(45,212,200,0.1)', border: `1px solid ${(uploading || isReadOnly) ? BORDER : 'rgba(45,212,200,0.3)'}`, color: (uploading || isReadOnly) ? DIM : TEAL, cursor: (uploading || isReadOnly) ? 'default' : 'pointer', opacity: isReadOnly ? 0.5 : 1 }}>
                  {uploading ? 'Uploading…' : 'Upload files'}
                </button>
                <input ref={fileInputRef} type="file" multiple style={{ display: 'none' }} onChange={e => { if (e.target.files?.length) handleUpload(e.target.files); e.target.value = '' }} />
              </div>
              {activeFiles.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: i < activeFiles.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: GREEN, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', color: WHITE }}>{f.name}</div>
                    <div style={{ fontSize: '11px', color: DIM }}>{f.uploader} · {f.date} · {f.confidence}% confidence</div>
                  </div>
                  <button disabled={isReadOnly} style={{ fontFamily: MONO, fontSize: '10px', padding: '4px 10px', borderRadius: '4px', background: 'transparent', border: `1px solid ${BORDER}`, color: MUTED, cursor: isReadOnly ? 'default' : 'pointer', opacity: isReadOnly ? 0.4 : 1 }}>Replace</button>
                </div>
              ))}
            </div>
          </div>

          {/* Right 35%: sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '16px' }}>
            {/* Quick stats */}
            <div style={cardStyle()}>
              {sectionTitle('Data summary')}
              {[
                { label: 'Files loaded', value: String(activeFiles.length), color: WHITE, dot: GREEN },
                { label: 'Pending approval', value: String(pendingFiles.length), color: WHITE, dot: AMBER },
                { label: 'Avg confidence', value: activeFiles.length > 0 ? Math.round(activeFiles.reduce((s, f) => s + f.confidence, 0) / activeFiles.length) + '%' : '—', color: WHITE, dot: TEAL },
              ].map((stat, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: i < 2 ? '10px' : '0' }}>
                  <span style={{ fontSize: '12px', color: MUTED }}>{stat.label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    {(stat as any).dot && <span style={{ width: 5, height: 5, borderRadius: '50%', background: (stat as any).dot, flexShrink: 0, display: 'inline-block' }} />}
                    <span style={{ fontFamily: MONO, fontSize: '13px', color: stat.color, fontWeight: 600 }}>{stat.value}</span>
                  </div>
                </div>
              ))}
            </div>

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
                  <span style={{ fontFamily: MONO, fontSize: '9px', padding: '2px 8px', borderRadius: '10px', background: 'rgba(52,211,153,0.1)', color: MUTED, border: '1px solid rgba(52,211,153,0.2)' }}>Active</span>
                </div>
              ))}
            </div>

            {/* Key client metrics */}
            <div style={cardStyle()}>
              {sectionTitle('Client profile')}
              {[
                { label: 'Revenue', value: `$${data.revenue}B` },
                { label: 'Employees', value: data.employees.toLocaleString() },
                { label: 'Vertical', value: data.type },
                { label: 'HQ', value: data.hq },
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: i < 3 ? '8px' : '0' }}>
                  <span style={{ fontSize: '12px', color: DIM }}>{row.label}</span>
                  <span style={{ fontSize: '12px', color: WHITE }}>{row.value}</span>
                </div>
              ))}
            </div>

            {/* Dev tools — admin only */}
            {!isReadOnly && <div style={cardStyle()}>
              {sectionTitle('Dev tools')}
              <div style={{ fontSize: '12px', color: MUTED, marginBottom: '12px', lineHeight: 1.5 }}>
                Set Clerk publicMetadata for all demo accounts (role, clientId, preferredSolution).
              </div>
              <button
                onClick={seedClerkMetadata}
                disabled={seeding}
                style={{
                  width: '100%', fontFamily: MONO, fontSize: '10px', fontWeight: 700,
                  letterSpacing: '.06em', textTransform: 'uppercase' as const,
                  padding: '9px 0', borderRadius: '6px', cursor: seeding ? 'not-allowed' : 'pointer',
                  background: seeding ? 'transparent' : 'rgba(45,212,200,0.1)',
                  border: `1px solid ${seeding ? BORDER : 'rgba(45,212,200,0.3)'}`,
                  color: seeding ? DIM : TEAL,
                }}
              >
                {seeding ? 'Seeding...' : 'Seed demo user metadata'}
              </button>
              {seedResult && (
                <div style={{ marginTop: '10px', fontFamily: MONO, fontSize: '10px', color: seedResult.startsWith('Error') ? RED : GREEN, lineHeight: 1.6 }}>
                  {seedResult}
                </div>
              )}

              {/* Seed all demo engagements */}
              <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: `1px solid ${BORDER}` }}>
                <div style={{ fontFamily: MONO, fontSize: '10px', color: TEAL, letterSpacing: '.08em', textTransform: 'uppercase' as const, marginBottom: '6px' }}>
                  Seed All Demo Engagements
                </div>
                <div style={{ fontSize: '12px', color: MUTED, marginBottom: '12px', lineHeight: 1.5 }}>
                  Pre-load complete demo engagements for all 8 client × solution pairs. Investors see live data immediately.
                </div>
                <SeedAllDemosButton />
              </div>
            </div>}
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
                <span style={{ fontFamily: MONO, fontSize: '9px', padding: '2px 8px', borderRadius: '10px', background: 'rgba(52,211,153,0.1)', color: MUTED }}>{u.status}</span>
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
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(45,212,200,0.1)', border: `1px solid ${TEAL}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: MONO, fontSize: '11px', color: TEAL, flexShrink: 0 }}>{u.initials}</div>
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
              <span key={i} style={{ fontFamily: MONO, fontSize: '10px', padding: '4px 12px', borderRadius: '20px', border: `1px solid rgba(52,211,153,0.3)`, color: MUTED, background: 'rgba(52,211,153,0.06)' }}>{badge}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── OVERVIEW TAB ──────────────────────────────────────────────────────────────

function OverviewTab({ data }: { data: ClientData }) {
  const top4 = data.metrics.slice(0, 4)
  const topContradiction = data.contradictions[0]
  return (
    <div>
      {/* 4 large situation cards — 2×2 grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '40px' }}>
        {top4.map((m, i) => (
          <div key={i} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '32px 28px', borderLeft: `4px solid ${m.status === 'critical' ? RED : AMBER}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: m.status === 'critical' ? RED : AMBER, flexShrink: 0, display: 'inline-block' }} />
              <div style={{ fontFamily: MONO, fontSize: '10px', color: TEAL, textTransform: 'uppercase' as const, letterSpacing: '.12em' }}>{m.label}</div>
            </div>
            <div style={{ fontFamily: SERIF, fontSize: '52px', lineHeight: 1, color: WHITE, marginBottom: '14px' }}>{m.value}</div>
            <div style={{ fontSize: '13px', color: DIM, marginBottom: '4px' }}>{m.benchmark}</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: m.status === 'critical' ? RED : AMBER }}>{m.gap}</div>
          </div>
        ))}
      </div>

      {/* Two-column body */}
      <div style={{ display: 'flex', gap: '28px', alignItems: 'start' }}>
        {/* Left — key finding + next actions */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' as const, gap: '16px' }}>

          {/* Top contradiction — full prominence */}
          {topContradiction && (
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderLeft: `4px solid ${topContradiction.severity === 'critical' ? RED : AMBER}`, borderRadius: '10px', padding: '32px' }}>
              <div style={{ fontFamily: MONO, fontSize: '10px', color: topContradiction.severity === 'critical' ? RED : AMBER, textTransform: 'uppercase' as const, letterSpacing: '.1em', marginBottom: '16px' }}>
                {topContradiction.severity === 'critical' ? '● Critical finding' : '● High priority'}
              </div>
              <div style={{ fontFamily: SERIF, fontSize: '18px', color: MUTED, fontStyle: 'italic', lineHeight: 1.6, marginBottom: '16px' }}>
                "{topContradiction.claim}"
              </div>
              <div style={{ fontSize: '15px', color: WHITE, fontWeight: 500, lineHeight: 1.7 }}>
                {topContradiction.reality}
              </div>
            </div>
          )}

          {/* Next actions */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '28px' }}>
            <div style={{ fontFamily: MONO, fontSize: '10px', color: TEAL, textTransform: 'uppercase' as const, letterSpacing: '.1em', marginBottom: '20px' }}>Next actions</div>
            {[
              `Lock baseline metrics with ${data.type === 'Asset Manager' ? 'Victoria Hargreaves (CEO)' : 'executive team'}`,
              'Complete data confidence review — upload missing files',
              'Schedule Situation Diagnosis walkthrough with client stakeholders',
            ].map((action, i) => (
              <div key={i} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', paddingBottom: i < 2 ? '16px' : '0', marginBottom: i < 2 ? '16px' : '0', borderBottom: i < 2 ? `1px solid ${BORDER}` : 'none' }}>
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(45,212,200,0.08)', border: `1px solid ${TEAL}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: MONO, fontSize: '10px', color: TEAL, marginTop: '2px' }}>{i + 1}</div>
                <div style={{ fontSize: '14px', color: WHITE, lineHeight: 1.65 }}>{action}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right sidebar — genome patterns */}
        <div style={{ width: '300px', flexShrink: 0 }}>
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '28px' }}>
            <div style={{ fontFamily: MONO, fontSize: '10px', color: TEAL, textTransform: 'uppercase' as const, letterSpacing: '.1em', marginBottom: '24px' }}>Genome patterns</div>
            {data.genomePatternsMatched.slice(0, 3).map((p, i) => (
              <div key={i} style={{ paddingBottom: i < 2 ? '20px' : '0', marginBottom: i < 2 ? '20px' : '0', borderBottom: i < 2 ? `1px solid ${BORDER}` : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: RED, flexShrink: 0, display: 'inline-block' }} />
                  <div style={{ fontFamily: SERIF, fontSize: '26px', color: WHITE }}>{p.failureRate}%</div>
                  <div style={{ fontFamily: MONO, fontSize: '9px', color: RED, letterSpacing: '.06em' }}>failure rate</div>
                </div>
                <div style={{ fontSize: '13px', color: WHITE, fontWeight: 500, marginBottom: '5px' }}>{p.code} · {p.name}</div>
                <div style={{ fontSize: '12px', color: DIM, lineHeight: 1.55 }}>{p.mitigation}</div>
              </div>
            ))}
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
                <span style={{ fontFamily: MONO, fontSize: '11px', color: WHITE }}>{f.confidence}%</span>
              </div>
            ))}
            {pendingFiles.length > 0 && (
              <>
                <div style={{ marginTop: '16px', marginBottom: '8px', fontFamily: MONO, fontSize: '10px', color: TEAL, textTransform: 'uppercase' as const, letterSpacing: '.06em' }}>Pending / missing</div>
                {pendingFiles.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: i < pendingFiles.length - 1 ? `1px solid ${BORDER}` : 'none', opacity: 0.6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', border: `2px solid ${AMBER}`, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '12px', color: MUTED }}>{f.name}</div>
                      <div style={{ fontSize: '11px', color: DIM }}>{f.uploader}</div>
                    </div>
                    <span style={{ fontFamily: MONO, fontSize: '11px', color: MUTED }}>{f.confidence > 0 ? `${f.confidence}%` : 'Missing'}</span>
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
                    <span style={{ fontFamily: MONO, fontSize: '11px', color: WHITE }}>{f.confidence}%</span>
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
                    <span style={{ fontFamily: MONO, fontSize: '12px', color: WHITE }}>{b.ours}{b.unit}</span>
                    <span style={{ fontFamily: MONO, fontSize: '12px', color: MUTED }}>{b.peer}{b.unit}</span>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: RED, flexShrink: 0, display: 'inline-block' }} />
                  <div style={{ fontFamily: SERIF, fontSize: '16px', color: WHITE }}>{b.gap.split(' ')[0]}</div>
                </div>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: RED, flexShrink: 0, display: 'inline-block' }} />
                      <div style={{ fontFamily: SERIF, fontSize: '24px', color: WHITE }}>{p.failureRate}%</div>
                    </div>
                    <div style={{ fontFamily: MONO, fontSize: '9px', color: MUTED }}>failure rate</div>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: '4px' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: RED, flexShrink: 0, display: 'inline-block' }} />
                <div style={{ fontFamily: SERIF, fontSize: '36px', color: WHITE }}>{data.genomePatternsMatched.filter(p => p.present).length}</div>
              </div>
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
                  <div style={{ color: TEAL, flexShrink: 0 }}>+</div>
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

function ProjectsTab({ clientId, data, projView, setProjView, showNewProject, setShowNewProject, isReadOnly }: {
  clientId: string
  data: ClientData
  projView: string
  setProjView: (v: string) => void
  showNewProject: boolean
  setShowNewProject: (v: boolean) => void
  isReadOnly: boolean
}) {
  const router = useRouter()
  const projects = data.solutionProgress.map((s, i) => ({
    id: `P00${i + 1}`,
    name: s.fullName,
    status: s.complete ? 'Complete' : s.progress > 0 ? 'Active' : 'Pending',
    progress: s.progress,
    phase: s.phase,
    slug: s.slug,
    cta: s.cta,
  }))

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
        {!isReadOnly && (
          <button onClick={() => setShowNewProject(!showNewProject)}
            style={{ fontFamily: MONO, fontSize: '11px', padding: '6px 16px', borderRadius: '6px', border: `1px solid ${TEAL}`, background: 'rgba(45,212,200,0.1)', color: TEAL, cursor: 'pointer' }}>
            + New project
          </button>
        )}
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

      {/* Solution engagement cards — always visible, both views */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginBottom: '24px' }}>
        {projects.map((p, i) => {
          const statusColor = p.status === 'Complete' ? GREEN : p.progress > 0 ? TEAL : AMBER
          return (
            <div key={i} onClick={() => router.push(`/engage/${clientId}/${p.slug}`)}
              style={{ ...cardStyle({ borderTop: `3px solid ${statusColor}`, cursor: 'pointer' }), transition: 'border-color 0.2s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div>
                  <div style={{ fontFamily: MONO, fontSize: '9px', color: TEAL, letterSpacing: '.1em', textTransform: 'uppercase' as const, marginBottom: '3px' }}>{p.id}</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: WHITE }}>{p.name}</div>
                </div>
                <span style={{ fontFamily: MONO, fontSize: '9px', padding: '2px 8px', borderRadius: '10px', background: p.status === 'Active' ? 'rgba(45,212,200,0.1)' : p.status === 'Complete' ? 'rgba(52,211,153,0.1)' : 'rgba(245,158,11,0.1)', color: statusColor }}>{p.status}</span>
              </div>
              <div style={{ fontSize: '11px', color: DIM, marginBottom: '10px' }}>Phase {p.phase}{p.status === 'Complete' ? ' · Complete ✓' : ` · ${p.progress}%`}</div>
              <div style={{ height: '3px', background: BORDER, borderRadius: '2px', marginBottom: '12px' }}>
                <div style={{ height: '3px', borderRadius: '2px', width: `${p.progress}%`, background: statusColor }} />
              </div>
              <button onClick={e => { e.stopPropagation(); router.push(`/engage/${clientId}/${p.slug}`) }}
                style={{ fontFamily: MONO, fontSize: '10px', color: TEAL, background: 'none', border: `1px solid ${TEAL}`, borderRadius: '4px', padding: '5px 12px', cursor: 'pointer', width: '100%', textAlign: 'center' as const }}>
                {p.cta}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── APPROVALS TAB ─────────────────────────────────────────────────────────────

function ApprovalsTab({ isReadOnly }: { isReadOnly: boolean }) {
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
              <button disabled={isReadOnly} style={{ fontFamily: MONO, fontSize: '10px', padding: '4px 12px', borderRadius: '4px', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)', color: TEAL, cursor: isReadOnly ? 'default' : 'pointer', opacity: isReadOnly ? 0.4 : 1 }}>Approve</button>
              <button disabled={isReadOnly} style={{ fontFamily: MONO, fontSize: '10px', padding: '4px 12px', borderRadius: '4px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: MUTED, cursor: isReadOnly ? 'default' : 'pointer', opacity: isReadOnly ? 0.4 : 1 }}>Restrict</button>
              <button disabled={isReadOnly} style={{ fontFamily: MONO, fontSize: '10px', padding: '4px 12px', borderRadius: '4px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: MUTED, cursor: isReadOnly ? 'default' : 'pointer', opacity: isReadOnly ? 0.4 : 1 }}>Reject</button>
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
          <span style={{ fontFamily: MONO, fontSize: '10px', color: MUTED }}>Awaiting</span>
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
            <span style={{ fontFamily: MONO, fontSize: '10px', color: MUTED }}>{r.outcome}</span>
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
                <th key={h} style={{ fontFamily: MONO, fontSize: '10px', color: TEAL, textAlign: 'left' as const, padding: '0 12px 10px 0', textTransform: 'uppercase' as const, letterSpacing: '.06em' }}>{h}</th>
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

function BreadcrumbBar({ data }: { data: ClientData }) {
  return (
    <div style={{ padding: '8px 0 8px 24px' }}>
      <span style={{ fontFamily: MONO, fontSize: '12px', color: '#9CA3AF', letterSpacing: '.04em' }}>
        Maestro · {data.name}
      </span>
    </div>
  )
}

function LeftPanel({ data, clientId, centerView, setCenterView, isAdmin, adminSection, setAdminSection }: {
  data: ClientData
  clientId: string
  centerView: string
  setCenterView: (v: string) => void
  isAdmin: boolean
  adminSection: string
  setAdminSection: (s: string) => void
}) {
  const navLinks = [
    { key: 'dashboard', icon: '⬡', label: 'Intel Feed' },
    { key: 'engagements', icon: '◈', label: 'Engagements' },
    { key: 'findings', icon: '◎', label: 'Findings' },
    { key: 'data', icon: '⊞', label: 'Outputs' },
    { key: 'genome', icon: '⬖', label: 'Genome' },
  ]
  const solColor = (s: SolutionProgress) => s.complete ? GREEN : s.progress > 50 ? TEAL : AMBER

  return (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '18px' }}>
      {/* Client */}
      <div style={{ fontFamily: MONO, fontSize: '9px', color: TEAL, textTransform: 'uppercase' as const, letterSpacing: '.12em', marginBottom: '10px' }}>Client Context</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '18px' }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: data.color, flexShrink: 0, display: 'inline-block' }} />
        <div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: WHITE, lineHeight: 1.25 }}>
            {data.name.split(' ').slice(0, -1).join(' ')}
          </div>
          <div style={{ fontSize: '11px', color: DIM }}>{data.name.split(' ').slice(-1)[0]}</div>
        </div>
      </div>

      {/* Solutions */}
      <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: '14px', marginBottom: '14px' }}>
        <div style={{ fontFamily: MONO, fontSize: '9px', color: TEAL, textTransform: 'uppercase' as const, letterSpacing: '.12em', marginBottom: '12px' }}>Active Solutions</div>
        {data.solutionProgress.map((s, i) => (
          <div key={i} style={{ marginBottom: i < data.solutionProgress.length - 1 ? '12px' : '0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: WHITE }}>{s.name}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontFamily: MONO, fontSize: '9px', color: DIM }}>Ph{s.phase}</span>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: solColor(s), display: 'inline-block' }} />
              </div>
            </div>
            <div style={{ height: '3px', background: BORDER, borderRadius: '2px', marginBottom: '2px' }}>
              <div style={{ height: '3px', borderRadius: '2px', width: `${s.progress}%`, background: solColor(s), transition: 'width 0.3s' }} />
            </div>
            <div style={{ fontFamily: MONO, fontSize: '9px', color: DIM }}>{s.progress}%</div>
          </div>
        ))}
      </div>

      {/* Nav links */}
      <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: '12px' }}>
        {navLinks.map(n => (
          <button key={n.key} onClick={() => setCenterView(n.key)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '6px 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' as const }}>
            <span style={{ fontSize: '13px', color: centerView === n.key ? TEAL : DIM, width: '16px', flexShrink: 0 }}>{n.icon}</span>
            <span style={{ fontSize: '12px', color: centerView === n.key ? TEAL : MUTED, fontFamily: SANS, fontWeight: centerView === n.key ? 600 : 400 }}>{n.label}</span>
          </button>
        ))}
        {isAdmin && (
          <div style={{ borderTop: `1px solid ${BORDER}`, marginTop: '6px', paddingTop: '10px' }}>
            <a
              href="/admin"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '6px 0', textDecoration: 'none' }}
            >
              <span style={{ fontSize: '11px', color: TEAL }}>⚙</span>
              <span style={{ fontSize: '11px', color: MUTED, fontFamily: SANS }}>Admin Portal →</span>
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

function HeroCarousel({ data, clientId }: { data: ClientData, clientId: string }) {
  const router = useRouter()
  const [idx, setIdx] = useState(0)
  const [hoverSecondary, setHoverSecondary] = useState(false)
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % data.heroFindings.length), 6000)
    return () => clearInterval(t)
  }, [data.heroFindings.length])
  const f = data.heroFindings[idx]
  const sevColor = f.severity === 'critical' ? RED : f.severity === 'high' ? AMBER : PURPLE

  return (
    <div style={{ background: '#0C0C0C', borderRadius: '12px', padding: '32px 36px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '22px' }}>
        <span style={{ fontFamily: MONO, fontSize: '10px', color: sevColor, letterSpacing: '.1em' }}>{f.code} · {f.rate}%</span>
        <span style={{ fontFamily: MONO, fontSize: '9px', padding: '2px 8px', borderRadius: '20px', background: `${sevColor}25`, color: sevColor, letterSpacing: '.08em', textTransform: 'uppercase' as const }}>{f.severity}</span>
      </div>
      <div style={{ fontFamily: SERIF, fontSize: '26px', color: '#EFF6FF', lineHeight: 1.35, marginBottom: '14px' }}>{f.headline}</div>
      <div style={{ fontSize: '14px', color: 'rgba(239,246,255,0.60)', lineHeight: 1.7, marginBottom: '18px' }}>{f.detail}</div>
      <div style={{ fontFamily: MONO, fontSize: '11px', color: TEAL, letterSpacing: '.08em', marginBottom: '28px' }}>Addressable: {f.addressable}</div>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '26px' }}>
        <button
          onClick={() => router.push(`/engage/${clientId}/${f.solutionSlug}`)}
          style={{ fontFamily: MONO, fontSize: '11px', fontWeight: 700, padding: '9px 20px', borderRadius: '6px', background: TEAL, color: '#060A12', border: 'none', cursor: 'pointer' }}>{f.primaryCta}</button>
        <div style={{ position: 'relative' as const, display: 'inline-block' }}>
          <button
            onMouseEnter={() => setHoverSecondary(true)}
            onMouseLeave={() => setHoverSecondary(false)}
            style={{ fontFamily: MONO, fontSize: '11px', padding: '9px 20px', borderRadius: '6px', background: 'transparent', color: 'rgba(239,246,255,0.30)', border: '1px solid rgba(239,246,255,0.08)', cursor: 'default', opacity: 0.5 }}>{f.secondaryCta}</button>
          {hoverSecondary && (
            <div style={{ position: 'absolute' as const, bottom: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap' as const, background: '#1C2D45', border: '1px solid rgba(239,246,255,0.12)', borderRadius: '6px', padding: '5px 10px', fontFamily: MONO, fontSize: '10px', color: 'rgba(239,246,255,0.65)', pointerEvents: 'none' as const, zIndex: 10 }}>
              In development
              <div style={{ position: 'absolute' as const, top: '100%', left: '50%', transform: 'translateX(-50%)', border: '5px solid transparent', borderTopColor: '#1C2D45' }} />
            </div>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        {data.heroFindings.map((_, i) => (
          <button key={i} onClick={() => setIdx(i)}
            style={{ width: i === idx ? '22px' : '6px', height: '6px', borderRadius: '3px', background: i === idx ? TEAL : 'rgba(239,246,255,0.18)', border: 'none', cursor: 'pointer', transition: 'all 0.25s', padding: 0 }} />
        ))}
      </div>
    </div>
  )
}

function SolutionEntryCards({ data, clientId }: { data: ClientData, clientId: string }) {
  const router = useRouter()
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
      {data.solutionProgress.map((s, i) => {
        const statusColor = s.complete ? GREEN : s.progress > 50 ? TEAL : AMBER
        return (
          <div key={i} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '20px', borderTop: `3px solid ${statusColor}` }}>
            <div style={{ fontFamily: MONO, fontSize: '9px', color: TEAL, textTransform: 'uppercase' as const, letterSpacing: '.1em', marginBottom: '4px' }}>{s.name}</div>
            <div style={{ fontSize: '11px', color: DIM, marginBottom: '14px' }}>Phase {s.phase}{s.complete ? ' · Complete ✓' : ` · ${s.progress}%`}</div>
            <div style={{ fontFamily: SERIF, fontSize: '22px', color: WHITE, lineHeight: 1, marginBottom: '3px' }}>{s.outcome}</div>
            <div style={{ fontSize: '11px', color: DIM, marginBottom: '16px' }}>addressable</div>
            <button onClick={() => router.push(`/engage/${clientId}/${s.slug}?client=${clientId}`)}
              style={{ fontFamily: MONO, fontSize: '10px', color: TEAL, background: 'none', border: `1px solid ${TEAL}`, borderRadius: '4px', padding: '5px 12px', cursor: 'pointer', width: '100%', textAlign: 'center' as const }}>
              {s.cta}
            </button>
          </div>
        )
      })}
    </div>
  )
}

function FindingsFeed({ data }: { data: ClientData }) {
  const sevColor = (s: string) => s === 'critical' ? RED : s === 'high' ? AMBER : PURPLE
  return (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '20px' }}>
      <div style={{ fontFamily: MONO, fontSize: '9px', color: TEAL, textTransform: 'uppercase' as const, letterSpacing: '.12em', marginBottom: '14px' }}>Recent Findings</div>
      {data.contradictions.slice(0, 3).map((c, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', paddingBottom: i < 2 ? '12px' : '0', marginBottom: i < 2 ? '12px' : '0', borderBottom: i < 2 ? `1px solid ${BORDER}` : 'none' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: sevColor(c.severity), flexShrink: 0, marginTop: '4px', display: 'inline-block' }} />
          <div style={{ flex: 1 }}>
            <span style={{ fontFamily: MONO, fontSize: '9px', color: sevColor(c.severity), letterSpacing: '.08em', marginRight: '8px', textTransform: 'uppercase' as const }}>{c.severity}</span>
            <span style={{ fontSize: '12px', color: MUTED, lineHeight: 1.5 }}>{c.claim.slice(0, 80)}{c.claim.length > 80 ? '…' : ''}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Pre-engagement gap check modal ───────────────────────────────────────────
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

function RightPanel({ data, clientId, isReadOnly }: { data: ClientData, clientId: string, isReadOnly: boolean }) {
  const router = useRouter()
  const [gapModal, setGapModal] = useState<{ name: string; slug: string } | null>(null)
  const criticalCount = data.contradictions.filter(c => c.severity === 'critical' || c.severity === 'high').length
  const activeEngagement = data.solutionProgress.find(s => s.progress > 0 && !s.complete) || data.solutionProgress[0]

  const isMeridian = clientId === 'meridian'

  // Readiness checks
  const readiness = isMeridian ? {
    data: [
      { ok: true,  label: 'Financial Statements', pct: '96%' },
      { ok: true,  label: 'Technology Landscape', pct: '88%' },
      { ok: false, label: 'Payer Contract Analysis', pct: 'MISSING' },
      { ok: false, label: 'CDO Profile', pct: 'MISSING' },
    ],
    engagement: [
      { ok: true,  label: 'Client profile complete' },
      { ok: true,  label: 'Fee model confirmed' },
      { ok: true,  label: 'Use case defined' },
      { ok: false, label: 'CEO briefed (pending)' },
    ],
    overall: 'amber' as 'green' | 'amber' | 'red',
    summary: 'PARTIALLY READY — 2 data gaps noted',
  } : {
    data: [
      { ok: true,  label: 'Annual Report 2025', pct: '94%' },
      { ok: false, label: 'MAS FEAT Gap Analysis', pct: '72% (pending)' },
    ],
    engagement: [
      { ok: true,  label: 'Client profile complete' },
      { ok: false, label: 'Regulatory timeline locked' },
    ],
    overall: 'amber' as 'green' | 'amber' | 'red',
    summary: 'PARTIALLY READY — complete setup',
  }

  const overallColor = readiness.overall === 'green' ? GREEN : readiness.overall === 'amber' ? AMBER : RED

  // Engagement queue for this Maestro
  const myEngagements = isMeridian ? [
    { name: 'RCM AI — Denial Prevention', phase: 1, status: 'In Progress', type: 'avr', slug: `/ai-strategy?client=${clientId}` },
    { name: 'Tech Modernization', phase: 2, status: 'In Progress', type: 'sol', slug: `/engage/${clientId}/tech?client=${clientId}` },
    { name: 'Margin Optimization', phase: 0, status: 'Not Started', type: 'sol', slug: `/engage/${clientId}/margin?client=${clientId}` },
  ] : [
    { name: 'Cost-to-Income Reduction', phase: 0, status: 'Not Started', type: 'avr', slug: `/ai-strategy?client=${clientId}` },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '12px' }}>

      {/* Readiness Status */}
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '18px' }}>
        <div style={{ fontFamily: MONO, fontSize: '9px', color: TEAL, textTransform: 'uppercase' as const, letterSpacing: '.12em', marginBottom: '12px' }}>Readiness Status</div>

        <div style={{ fontFamily: MONO, fontSize: '8px', color: TEAL, textTransform: 'uppercase' as const, letterSpacing: '.08em', marginBottom: '6px' }}>Data</div>
        {readiness.data.map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '5px' }}>
            <span style={{ fontSize: '10px', color: d.ok ? GREEN : AMBER }}>{d.ok ? '✓' : '⚠'}</span>
            <span style={{ fontSize: '11px', color: d.ok ? MUTED : WHITE, fontFamily: SANS, flex: 1 }}>{d.label}</span>
            <span style={{ fontFamily: MONO, fontSize: '9px', color: d.ok ? GREEN : AMBER }}>{d.pct}</span>
          </div>
        ))}

        <div style={{ fontFamily: MONO, fontSize: '8px', color: TEAL, textTransform: 'uppercase' as const, letterSpacing: '.08em', margin: '12px 0 6px' }}>Engagement</div>
        {readiness.engagement.map((e, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <span style={{ fontSize: '10px', color: e.ok ? GREEN : DIM }}>{e.ok ? '✓' : '○'}</span>
            <span style={{ fontSize: '11px', color: MUTED, fontFamily: SANS }}>{e.label}</span>
          </div>
        ))}

        <div style={{ marginTop: '12px', padding: '7px 10px', background: `${overallColor}12`, border: `1px solid ${overallColor}40`, borderRadius: '6px' }}>
          <div style={{ fontFamily: MONO, fontSize: '9px', color: overallColor }}>{readiness.summary}</div>
        </div>
        <a href="/admin?section=data" style={{ fontFamily: MONO, fontSize: '9px', color: TEAL, display: 'block', marginTop: '8px', textDecoration: 'none' }}>
          Go to Admin Setup →
        </a>
      </div>

      {/* Action */}
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderLeft: `3px solid ${TEAL}`, borderRadius: '10px', padding: '18px' }}>
        <div style={{ fontFamily: MONO, fontSize: '9px', color: TEAL, textTransform: 'uppercase' as const, letterSpacing: '.12em', marginBottom: '10px' }}>Your Action</div>
        <div style={{ fontSize: '13px', fontWeight: 600, color: WHITE, marginBottom: '6px' }}>Phase 1 ready for review</div>
        <div style={{ fontSize: '12px', color: MUTED, marginBottom: '3px' }}>{data.contradictions.length} findings</div>
        <div style={{ fontSize: '12px', color: RED, marginBottom: '16px' }}>{criticalCount} CRITICAL</div>
        {!isReadOnly && (
          <button
            onClick={() => setGapModal({ name: activeEngagement?.fullName ?? activeEngagement?.name ?? 'Engagement', slug: `/engage/${clientId}/${activeEngagement?.slug || data.solutionProgress[0].slug}` })}
            style={{ fontFamily: MONO, fontSize: '10px', fontWeight: 700, padding: '9px 14px', borderRadius: '6px', background: TEAL, color: '#060A12', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'center' as const }}>
            Open Engagement →
          </button>
        )}
      </div>

      {/* Your Engagements */}
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '18px' }}>
        <div style={{ fontFamily: MONO, fontSize: '9px', color: TEAL, textTransform: 'uppercase' as const, letterSpacing: '.12em', marginBottom: '12px' }}>Your Engagements</div>
        {myEngagements.map((e, i) => (
          <div key={i} style={{ marginBottom: i < myEngagements.length - 1 ? '10px' : '0', paddingBottom: i < myEngagements.length - 1 ? '10px' : '0', borderBottom: i < myEngagements.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: WHITE, fontFamily: SANS, flex: 1, paddingRight: 6, lineHeight: 1.3 }}>{e.name}</div>
              <span style={{ fontFamily: MONO, fontSize: '8px', color: e.type === 'avr' ? TEAL : PURPLE, background: e.type === 'avr' ? 'rgba(45,212,200,0.12)' : 'rgba(129,140,248,0.12)', padding: '2px 5px', borderRadius: '3px', flexShrink: 0 }}>
                {e.type === 'avr' ? 'AVR' : 'SOL'}
              </span>
            </div>
            <div style={{ fontFamily: MONO, fontSize: '9px', color: DIM, marginBottom: '6px' }}>Ph {e.phase} · {e.status}</div>
            {!isReadOnly && (
              <button
                onClick={() => setGapModal({ name: e.name, slug: e.slug })}
                style={{ fontFamily: MONO, fontSize: '9px', color: e.status === 'Not Started' ? AMBER : TEAL, background: 'none', border: `1px solid ${e.status === 'Not Started' ? AMBER : TEAL}`, borderRadius: '4px', padding: '4px 10px', cursor: 'pointer', width: '100%', textAlign: 'center' as const }}
              >
                {e.status === 'Not Started' ? 'Start via ' : 'Continue in '}{e.type === 'avr' ? 'AI Value Realization' : 'Solutions'} →
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Genome signals */}
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '18px' }}>
        <div style={{ fontFamily: MONO, fontSize: '9px', color: TEAL, textTransform: 'uppercase' as const, letterSpacing: '.12em', marginBottom: '14px' }}>Genome Signals</div>
        {data.genomePatternsMatched.slice(0, 5).map((p, i) => (
          <div key={i} style={{ marginBottom: i < 4 ? '10px' : '0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontFamily: MONO, fontSize: '9px', color: DIM }}>{p.code}</span>
              <span style={{ fontFamily: MONO, fontSize: '9px', color: RED, fontWeight: 600 }}>{p.failureRate}%</span>
            </div>
            <div style={{ height: '3px', background: BORDER, borderRadius: '2px' }}>
              <div style={{ height: '3px', borderRadius: '2px', width: `${p.failureRate}%`, background: `linear-gradient(90deg, ${RED}, ${AMBER})` }} />
            </div>
          </div>
        ))}
        <div style={{ fontFamily: MONO, fontSize: '10px', color: TEAL, marginTop: '12px', cursor: 'pointer' }}>View all {data.genomePatternsMatched.length} →</div>
      </div>

      {/* Platform stats */}
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '18px' }}>
        <div style={{ fontFamily: MONO, fontSize: '9px', color: TEAL, textTransform: 'uppercase' as const, letterSpacing: '.12em', marginBottom: '14px' }}>Platform Stats</div>
        {[
          { value: '340', label: 'Genome patterns' },
          { value: '9', label: 'Intel modules' },
          { value: '$167M', label: 'Gap identified' },
          { value: '$0', label: 'Fee until move' },
        ].map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: i < 3 ? '8px' : '0' }}>
            <span style={{ fontFamily: SERIF, fontSize: '20px', color: WHITE, lineHeight: 1 }}>{s.value}</span>
            <span style={{ fontSize: '11px', color: DIM }}>{s.label}</span>
          </div>
        ))}
      </div>

      {gapModal && (
        <PreEngagementModal
          engagementName={gapModal.name}
          clientId={clientId}
          targetSlug={gapModal.slug}
          onClose={() => setGapModal(null)}
        />
      )}
    </div>
  )
}

function BottomBar({ data, user }: { data: ClientData, user: { firstName?: string | null, lastName?: string | null } | null }) {
  const maestroName = user?.firstName && user?.lastName
    ? `${user.firstName} ${user.lastName}`
    : user?.firstName || 'Anand Sundaram'
  return (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#060A12', borderTop: '1px solid #1C2D45', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', zIndex: 900 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: MONO, fontSize: '10px', color: 'rgba(239,246,255,0.5)', letterSpacing: '.06em' }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: GREEN, display: 'inline-block' }} />
        <span style={{ color: GREEN }}>LIVE</span>
        <span>·</span>
        <span style={{ color: 'rgba(239,246,255,0.75)' }}>{data.name}</span>
        <span>·</span>
        <span>{data.activeEngagement}</span>
        <span>·</span>
        <span>Updated {data.updatedAgo}</span>
      </div>
      <div style={{ fontFamily: MONO, fontSize: '9px', color: 'rgba(239,246,255,0.28)', letterSpacing: '.1em', textTransform: 'uppercase' as const }}>
        AbarVa Intelligence Platform
      </div>
      <div style={{ fontFamily: MONO, fontSize: '10px', color: 'rgba(239,246,255,0.5)', letterSpacing: '.06em' }}>
        Maestro: {maestroName} · Active
      </div>
    </div>
  )
}

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────

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

export default function AdminClientPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const params = useParams()
  const clientId = params.id as string

  const [masterTab, setMasterTab]     = useState<'intel' | 'value' | 'engagements'>('intel')
  const [centerView, setCenterView] = useState('dashboard')
  const [adminSection, setAdminSection] = useState('setup')
  const [diTab, setDiTab] = useState('client')
  const [projView, setProjView] = useState('dashboard')
  const [showNewProject, setShowNewProject] = useState(false)

  if (!isLoaded) return <div style={{ minHeight: '100vh', background: BG }} />
  if (!user) { router.push('/sign-in'); return null }

  const metaRole = user.publicMetadata?.role as string | undefined
  const isMaestro = metaRole === 'admin' || metaRole === 'investor'
  const isReadOnly = !isMaestro
  const isAdmin = isMaestro  // investors play Maestro role — full dashboard access

  const data = getClientData(clientId)
  if (!data) return (
    <div style={{ minHeight: '100vh', background: BG, color: WHITE, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS }}>
      Client not found
    </div>
  )

  const renderCenter = () => {
    if (centerView === 'admin')
      return <AdminTab clientId={clientId} data={data} adminSection={adminSection} setAdminSection={setAdminSection} isReadOnly={isReadOnly} />
    if (centerView === 'data')
      return <DataIntelligenceTab data={data} diTab={diTab} setDiTab={setDiTab} />
    if (centerView === 'engagements')
      return <ProjectsTab clientId={clientId} data={data} projView={projView} setProjView={setProjView} showNewProject={showNewProject} setShowNewProject={setShowNewProject} isReadOnly={isReadOnly} />
    if (centerView === 'findings')
      return <OverviewTab data={data} />
    if (centerView === 'genome')
      return <DataIntelligenceTab data={data} diTab="genome" setDiTab={setDiTab} />
    return (
      <>
        <HeroCarousel data={data} clientId={clientId} />
        <SolutionEntryCards data={data} clientId={clientId} />
        <FindingsFeed data={data} />
      </>
    )
  }

  const TAB_BAR_TABS = [
    { key: 'intel' as const,       label: 'Intel Feed' },
    { key: 'value' as const,       label: 'Value Dashboard' },
    { key: 'engagements' as const, label: 'Engagements' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: SANS, color: WHITE, paddingBottom: '34px' }}>
      <AbarvaNav activePage="maestro" />
      <BreadcrumbBar data={data} />

      {/* Top-level tab bar */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E7EB', height: 44, display: 'flex', alignItems: 'center', padding: '0 48px', gap: 0 }}>
        {TAB_BAR_TABS.map(t => (
          <button key={t.key} onClick={() => setMasterTab(t.key)} style={{
            fontFamily: SANS, fontSize: 14, fontWeight: 600,
            color: masterTab === t.key ? '#0C0C0C' : '#6B7280',
            background: 'none', border: 'none',
            borderBottom: masterTab === t.key ? '2px solid #2DD4C8' : '2px solid transparent',
            height: 44, padding: '0 20px', cursor: 'pointer',
            transition: 'all 0.15s',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {masterTab === 'value' && <ValueDashboard clientId={clientId} />}
      {masterTab === 'engagements' && <EngagementsTab data={data} clientId={clientId} />}

      {masterTab === 'intel' && (
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '16px 28px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          {/* Left panel */}
          <div style={{ width: '220px', flexShrink: 0 }}>
            <LeftPanel
              data={data}
              clientId={clientId}
              centerView={centerView}
              setCenterView={setCenterView}
              isAdmin={isAdmin}
              adminSection={adminSection}
              setAdminSection={setAdminSection}
            />
          </div>

          {/* Center */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' as const, gap: '12px', minWidth: 0 }}>
            {renderCenter()}
          </div>

          {/* Right panel */}
          <div style={{ width: '280px', flexShrink: 0 }}>
            <RightPanel data={data} clientId={clientId} isReadOnly={isReadOnly} />
          </div>
        </div>
      )}

      <BottomBar data={data} user={user} />
      {!isReadOnly && <SeedDemosFloatMenu clientId={clientId} />}
    </div>
  )
}
