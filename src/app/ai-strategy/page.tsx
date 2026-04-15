'use client'
import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import AbarvaNav from '@/components/AbarvaNav'
import { arcturusFinancial, arcturusTechnology, arcturusIndustry } from '@/data/arcturus/index'
import { arcturusAI } from '@/data/arcturus/ai'
import { meridianHealth } from '@/data/meridian/index'

// ─── Theme ────────────────────────────────────────────────────────────────────
const BG = '#060A12', CARD = '#0D1520', BORDER = '#1C2D45'
const TEAL = '#2DD4C8', WHITE = '#EFF6FF', MUTED = '#94A3B8', DIM = '#475569'
const AMBER = '#F59E0B', GREEN = '#34D399', BLUE = '#4DA3FF', RED = '#EF4444', PURPLE = '#818CF8'
const SANS = 'DM Sans, sans-serif', MONO = 'JetBrains Mono, monospace', SERIF = 'Georgia, serif'

// ─── Phase / Module map ───────────────────────────────────────────────────────
const PHASES = [
  {
    phase: 1, label: 'DIAGNOSE', color: BLUE,
    modules: [
      { num: 1, key: 'situation',     name: 'Situation Intelligence',     desc: 'What is broken — and what it costs',          output: 'SITUATION BRIEF · 48HRS' },
      { num: 2, key: 'contradiction', name: 'Contradiction Intelligence', desc: 'What was promised vs what data shows',         output: 'CONTRADICTION MAP · 72HRS' },
      { num: 3, key: 'data',          name: 'Data Intelligence',          desc: 'Data readiness before AI investment',          output: 'DATA CERTIFICATE · 1 WEEK' },
    ],
  },
  {
    phase: 2, label: 'PRESCRIBE', color: AMBER,
    modules: [
      { num: 4, key: 'technology',    name: 'Technology Intelligence',    desc: 'Current stack — inventory, spend, contracts',  output: 'AI READINESS CERT · 1 WEEK' },
      { num: 5, key: 'vendor',        name: 'Vendor Intelligence',        desc: 'Vendors scored against Genome outcomes',       output: 'VENDOR SCORECARD · 1 WEEK' },
      { num: 6, key: 'architecture',  name: 'Architecture Intelligence',  desc: 'Target state — AI stack blueprint',            output: 'ARCHITECTURE BLUEPRINT · 2WKS' },
      { num: 7, key: 'business-case', name: 'Business Case Intelligence', desc: 'CFO-grade case with Genome validation',        output: 'IC PACKAGE · 1 WEEK' },
    ],
  },
  {
    phase: 3, label: 'VALUE REALIZATION', color: GREEN,
    modules: [
      { num: 8, key: 'ai-delivery',   name: 'AI Delivery Intelligence',   desc: 'Portfolio, blockers, and delivery roadmap',    output: 'EXECUTION BASELINE · 2WKS' },
      { num: 9, key: 'outcome',       name: 'Outcome Intelligence',        desc: 'Baseline locked · verified delta · fee earned', output: 'LIVE OUTCOME DASHBOARD' },
    ],
  },
]

type ModuleInfo = { num: number; key: string; name: string; desc: string; output: string; phaseLabel: string; phaseColor: string }

function allModules(): ModuleInfo[] {
  return PHASES.flatMap(p => p.modules.map(m => ({ ...m, phaseLabel: p.label, phaseColor: p.color })))
}

// ─── Shared helpers ───────────────────────────────────────────────────────────
const card = (extra?: React.CSSProperties): React.CSSProperties => ({
  background: CARD, border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '18px 20px', ...extra,
})
const label = (text: string) => (
  <div style={{ fontFamily: MONO, fontSize: '9px', color: DIM, textTransform: 'uppercase' as const, letterSpacing: '.08em', marginBottom: '8px' }}>{text}</div>
)

// ─── Module panels ────────────────────────────────────────────────────────────

function SituationPanel({ clientId }: { clientId: string }) {
  const metrics = clientId === 'arcturus' ? arcturusFinancial.situationMetrics : [
    { label: 'Denial Rate', value: `${meridianHealth.technology.rcm.denialRate}%`, benchmark: `${meridianHealth.technology.rcm.benchmarkDenialRate}% benchmark`, status: 'critical' as const, gap: '$94M annual write-off' },
    { label: 'Operating Margin', value: `${meridianHealth.org.operatingMargin}%`, benchmark: `${meridianHealth.org.targetOperatingMargin}% target`, status: 'critical' as const, gap: '2.2pp to target' },
    { label: 'Days in AR', value: `${meridianHealth.technology.rcm.daysInAR}`, benchmark: '35 benchmark', status: 'critical' as const, gap: '17 days above benchmark' },
    { label: 'Prior Auth Avg Days', value: `${meridianHealth.technology.rcm.priorAuthAvgDays}`, benchmark: `${meridianHealth.technology.rcm.priorAuthPeerDays} peer`, status: 'critical' as const, gap: '2.4 days above peer' },
    { label: 'MyChart Adoption', value: '34%', benchmark: '60% target', status: 'warning' as const, gap: '26pp below target' },
    { label: 'Epic Optimization', value: `${meridianHealth.technology.ehr.optimizationScore}/100`, benchmark: '80 benchmark', status: 'warning' as const, gap: '22 points below benchmark' },
    { label: 'MA Star Rating', value: `${meridianHealth.healthPlan.medicareAdvantage.starRating}`, benchmark: '4.0 target', status: 'warning' as const, gap: '0.5 stars to target' },
    { label: 'Hospital Occupancy', value: `${meridianHealth.hospitals.occupancyRate}%`, benchmark: '76% target', status: 'warning' as const, gap: '5pp below target' },
  ]
  const crit = metrics.filter(m => m.status === 'critical').length
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '24px' }}>
        {metrics.map((m, i) => (
          <div key={i} style={card({ borderColor: m.status === 'critical' ? 'rgba(239,68,68,0.25)' : 'rgba(245,158,11,0.2)' })}>
            {label(m.label)}
            <div style={{ fontFamily: MONO, fontSize: '22px', fontWeight: 700, color: m.status === 'critical' ? RED : AMBER, lineHeight: 1 }}>{m.value}</div>
            <div style={{ fontFamily: MONO, fontSize: '10px', color: DIM, marginTop: '4px' }}>{m.benchmark}</div>
            <div style={{ fontSize: '11px', color: MUTED, marginTop: '6px' }}>{m.gap}</div>
          </div>
        ))}
      </div>
      <div style={card({ borderColor: 'rgba(239,68,68,0.15)', background: 'rgba(239,68,68,0.03)' })}>
        {label(`${crit} critical gaps identified by Genome · 340 patterns run`)}
        <div style={{ fontSize: '13px', color: MUTED, lineHeight: 1.6 }}>
          Every gap above has been cross-referenced against the AbarVa Genome library — 340 patterns from prior transformations. Each metric sits in the bottom quartile of its peer group. The combined economic exposure exceeds what any individual initiative can recover alone.
        </div>
      </div>
    </div>
  )
}

function ContradictionPanel({ clientId }: { clientId: string }) {
  const contradictions = clientId === 'arcturus' ? arcturusFinancial.contradictions : meridianHealth.contradictions.slice(0, 8).map((c, i) => ({
    id: `c${i}`, claim: c.split(' — ')[0], reality: c.split(' — ').slice(1).join(' — '), severity: i < 3 ? 'critical' as const : 'high' as const, source: 'AbarVa data cross-reference',
  }))
  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '12px' }}>
      {contradictions.map((c: any, i: number) => (
        <div key={i} style={card({ borderColor: c.severity === 'critical' ? 'rgba(239,68,68,0.25)' : 'rgba(245,158,11,0.18)' })}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '8px' }}>
            <div>
              {label('Claim')}
              <div style={{ fontSize: '13px', color: MUTED, lineHeight: 1.5 }}>{c.claim}</div>
            </div>
            <div>
              {label('Reality')}
              <div style={{ fontSize: '13px', color: WHITE, lineHeight: 1.5 }}>{c.reality}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span style={{ fontFamily: MONO, fontSize: '9px', padding: '2px 8px', borderRadius: '10px', background: c.severity === 'critical' ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)', color: c.severity === 'critical' ? RED : AMBER }}>
              {(c.severity as string).toUpperCase()}
            </span>
            {c.source && <span style={{ fontFamily: MONO, fontSize: '9px', color: DIM }}>{c.source}</span>}
          </div>
        </div>
      ))}
    </div>
  )
}

function DataPanel({ clientId }: { clientId: string }) {
  const dimensions = clientId === 'arcturus' ? [
    { dim: 'Portfolio Positions', score: arcturusAI.maturity.dataReadiness.portfolioPositions, note: 'Bloomberg AIM data — siloed, limited API' },
    { dim: 'Client Relationship', score: arcturusAI.maturity.dataReadiness.clientRelationship, note: 'FSC 44% adoption — 56% of signals missing' },
    { dim: 'Risk Analytics', score: arcturusAI.maturity.dataReadiness.riskAnalytics, note: 'Aladdin disconnected — monthly vs daily cadence' },
    { dim: 'Regulatory Compliance', score: arcturusAI.maturity.dataReadiness.regulatory, note: 'Charles River exists — compliance gaps remain' },
    { dim: 'Finance Reporting', score: arcturusAI.maturity.dataReadiness.financeReporting, note: 'Geneva functional — not AI-connected' },
    { dim: 'ML Platform Readiness', score: arcturusAI.maturity.techReadiness.mlPlatform, note: 'No ML platform — no Azure ML, no Databricks' },
    { dim: 'Data Platform', score: arcturusAI.maturity.techReadiness.dataPlatform, note: '14 silos — no unified platform, no golden record' },
    { dim: 'MLOps', score: arcturusAI.maturity.techReadiness.mlops, note: 'No MLOps — models cannot be deployed at scale' },
  ] : [
    { dim: 'EHR Clinical Data', score: meridianHealth.technology.ehr.optimizationScore, note: 'Epic deployed — 34% of docs still in workarounds' },
    { dim: 'Revenue Cycle Data', score: 72, note: 'Ensemble RCM — denial patterns poorly structured' },
    { dim: 'Patient Identity', score: 38, note: 'No golden MRN across 23 hospitals' },
    { dim: 'Prior Auth Data', score: 45, note: 'Only 23% of payers on automation' },
    { dim: 'Analytics / BI', score: 42, note: 'Only 12 of 47 Cogito dashboards live' },
    { dim: 'Integration Layer', score: 31, note: '14+ point-to-point interfaces — no unified platform' },
    { dim: 'AI Readiness', score: 35, note: 'Data too fragmented for reliable ML training' },
    { dim: 'Data Governance', score: 29, note: 'No CDO equivalent — CIO carrying both roles' },
  ]
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '20px' }}>
        {dimensions.map((d, i) => {
          const color = d.score >= 70 ? GREEN : d.score >= 50 ? AMBER : RED
          return (
            <div key={i} style={card()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div style={{ fontSize: '13px', color: WHITE, fontWeight: 500 }}>{d.dim}</div>
                <div style={{ fontFamily: MONO, fontSize: '18px', fontWeight: 700, color }}>{d.score}</div>
              </div>
              <div style={{ height: '4px', background: BORDER, borderRadius: '2px', marginBottom: '8px' }}>
                <div style={{ height: '100%', width: `${d.score}%`, background: color, borderRadius: '2px' }} />
              </div>
              <div style={{ fontSize: '11px', color: MUTED }}>{d.note}</div>
            </div>
          )
        })}
      </div>
      <div style={card({ borderColor: 'rgba(45,212,200,0.2)' })}>
        {label('Data Readiness Certificate — not yet issuable')}
        <div style={{ fontSize: '13px', color: MUTED, lineHeight: 1.6 }}>
          A data readiness certificate is issued when all 12 dimensions score above 70. Current state requires remediation before AI investment can be responsibly approved. Specific pipeline gaps and remediation steps are included in the full report.
        </div>
      </div>
    </div>
  )
}

function TechnologyPanel({ clientId }: { clientId: string }) {
  const items = clientId === 'arcturus' ? [
    { platform: 'Bloomberg AIM', status: 'critical', detail: '3 consecutive modernisation failures · $22.2M total', issues: ['API rate limit 100x below ML requirements', 'Data exports missing 38% of required fields', 'Contract auto-renews Dec 2026 with no improvement terms'] },
    { platform: 'Salesforce FSC', status: 'critical', detail: '$38M investment · 44% adoption after 18 months', issues: ['Adoption target reset 85%→70% without board disclosure', 'NPS 31 vs 58 industry median', '4 AI initiatives blocked by adoption failure'] },
    { platform: 'Shadow IT', status: 'warning', detail: 'Est. $18M annually ungoverned', issues: ['3 BUs with direct procurement — no IT gate', 'IT budget grew 12% vs 2.5% revenue growth', '$178M above peer benchmark annually'] },
  ] : [
    { platform: 'Epic EHR', status: 'warning', detail: `Optimization: ${meridianHealth.technology.ehr.optimizationScore}/100 (reported 71, actual 44-47)`, issues: meridianHealth.technology.ehr.knownGaps },
    { platform: 'Ensemble Health Partners (RCM)', status: 'critical', detail: `$${meridianHealth.technology.rcm.contractValue}M/yr · denial rate ${meridianHealth.technology.rcm.denialRate}%`, issues: [`${meridianHealth.technology.rcm.denialRate}% denial vs ${meridianHealth.technology.rcm.benchmarkDenialRate}% benchmark`, 'Prior auth avg 4.2 days vs 1.8 peer', 'Contract penalties $8M — never enforced'] },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '14px' }}>
      {items.map((item, i) => (
        <div key={i} style={card({ borderColor: item.status === 'critical' ? 'rgba(239,68,68,0.22)' : 'rgba(245,158,11,0.18)' })}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: WHITE }}>{item.platform}</div>
              <div style={{ fontSize: '12px', color: MUTED, marginTop: '3px' }}>{item.detail}</div>
            </div>
            <span style={{ fontFamily: MONO, fontSize: '9px', padding: '3px 10px', borderRadius: '10px', background: item.status === 'critical' ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)', color: item.status === 'critical' ? RED : AMBER, marginLeft: '12px', flexShrink: 0 }}>
              {item.status.toUpperCase()}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '5px' }}>
            {item.issues.map((iss, j) => (
              <div key={j} style={{ display: 'flex', gap: '8px' }}>
                <span style={{ color: RED, fontSize: '10px', marginTop: '2px', flexShrink: 0 }}>▸</span>
                <span style={{ fontSize: '12px', color: MUTED, lineHeight: 1.5 }}>{iss}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function VendorPanel({ clientId }: { clientId: string }) {
  const vendors = clientId === 'arcturus' ? [
    { name: 'Salesforce FSC', category: 'CRM / Client Platform', score: 34, risk: 'critical', genomeFail: 68, issue: 'Platform adoption failure pattern active. 44% adoption after 18 months is below the 55% threshold where Genome patterns show recovery is possible without programme reset.' },
    { name: 'Bloomberg AIM', category: 'Portfolio Management', score: 28, risk: 'critical', genomeFail: 71, issue: '3 failed modernisation attempts. Pattern F008 (vendor lock with technical debt) confirmed. $22.2M spent. Contract auto-renews Dec 2026 — no leverage without immediate action.' },
    { name: 'Accenture (historical)', category: 'Systems Integrator', score: 22, risk: 'high', genomeFail: 74, issue: 'Head of Technology recruited post-failure of Project Aurora — conflict of interest not surfaced to board. Genome pattern F013 (post-failure hire) present.' },
  ] : [
    { name: 'Ensemble Health Partners', category: 'Revenue Cycle Management', score: 41, risk: 'critical', genomeFail: 74, issue: 'SLA breach on denial rate commitment. 18.2% vs 12% contracted. $8M in penalties exist but have never been enforced. Pattern F011 (RCM vendor misalignment) active.' },
    { name: 'Epic Systems', category: 'EHR', score: 55, risk: 'warning', genomeFail: 69, issue: 'Under-optimization pattern active. 58/100 score reported — actual 44-47. Only 12 of 47 Cogito dashboards live. No accountable owner for optimization programme.' },
    { name: 'Experian Health', category: 'Patient Access', score: 60, risk: 'low', genomeFail: 42, issue: 'Prior auth automation at 23% of payers only. Module purchased, deployment plan absent. Low failure risk but significant value locked.' },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '14px' }}>
      {vendors.map((v, i) => {
        const riskColor = v.risk === 'critical' ? RED : v.risk === 'high' ? AMBER : GREEN
        return (
          <div key={i} style={card({ borderColor: `${riskColor}25` })}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: WHITE }}>{v.name}</div>
                <div style={{ fontFamily: MONO, fontSize: '10px', color: DIM, marginTop: '2px' }}>{v.category}</div>
              </div>
              <div style={{ textAlign: 'right' as const, flexShrink: 0, marginLeft: '16px' }}>
                <div style={{ fontFamily: MONO, fontSize: '22px', fontWeight: 700, color: riskColor }}>{v.score}</div>
                <div style={{ fontFamily: MONO, fontSize: '9px', color: DIM }}>genome score /100</div>
                <div style={{ fontFamily: MONO, fontSize: '9px', color: RED, marginTop: '2px' }}>{v.genomeFail}% fail rate</div>
              </div>
            </div>
            <div style={{ fontSize: '12px', color: MUTED, lineHeight: 1.6 }}>{v.issue}</div>
          </div>
        )
      })}
    </div>
  )
}

const ARCH_LAYERS: Record<string, { current: { layer: string; systems: string[] }[]; gaps: string[]; target: string[] }> = {
  arcturus: {
    current: [
      { layer: 'Portfolio', systems: ['Bloomberg AIM', 'Bloomberg Terminal (13 seats)', 'Legacy IBOR'] },
      { layer: 'Client', systems: ['Salesforce FSC (44%)', 'Legacy CRM (still live)', 'Manual Excel reporting'] },
      { layer: 'Data', systems: ['14 siloed systems', 'No golden record', '3-day reporting lag'] },
      { layer: 'AI', systems: ['28 initiatives (0 baselined)', 'No MLOps', 'Ad-hoc Python in BUs'] },
    ],
    gaps: ['Bloomberg API 100x below ML requirements', 'Dual CRM running — data split 44/56', 'No unified data platform', 'CDO vacant 11 months — no AI governance'],
    target: ['Bloomberg AIM modernised with API-first layer', 'Single CRM at 90%+ adoption', 'Unified cloud data platform', 'AI governance with baselines across all 28 initiatives'],
  },
  meridian: {
    current: [
      { layer: 'Clinical', systems: ['Epic EHR (23 hospitals)', 'Legacy Epic at Blue Ridge', 'Cerner (pre-migration)'] },
      { layer: 'Revenue', systems: ['Ensemble RCM', 'Experian Health', 'Waystar clearinghouse'] },
      { layer: 'Analytics', systems: ['12 of 47 Cogito dashboards', 'Tableau (dept)', 'Excel reporting'] },
      { layer: 'Integration', systems: ['Mulesoft (limited)', '14+ point-to-point', 'No unified platform'] },
    ],
    gaps: ['No golden MRN across 23 hospitals', 'Blue Ridge on legacy Epic — blocked', '34% docs outside Epic (workarounds)', 'Prior auth automation 23% of payers only'],
    target: ['Unified Epic all 23 hospitals by Q4 2026', 'Real-time RCM + AI denial prevention', 'All 47 Cogito dashboards live', 'HL7 FHIR integration layer'],
  },
}

function ArchitecturePanel({ clientId }: { clientId: string }) {
  const arch = ARCH_LAYERS[clientId] ?? ARCH_LAYERS.meridian
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
      <div style={card()}>
        {label('Current state')}
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '16px' }}>
          {arch.current.map((l, i) => (
            <div key={i}>
              <div style={{ fontFamily: MONO, fontSize: '9px', color: MUTED, textTransform: 'uppercase' as const, letterSpacing: '.07em', marginBottom: '5px' }}>{l.layer}</div>
              {l.systems.map((s, j) => (
                <div key={j} style={{ fontSize: '12px', color: WHITE, padding: '4px 0', borderBottom: j < l.systems.length - 1 ? `1px solid ${BORDER}` : 'none' }}>{s}</div>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '14px' }}>
        <div style={card({ borderColor: 'rgba(239,68,68,0.2)' })}>
          {label('Architecture gaps')}
          {arch.gaps.map((g, i) => (
            <div key={i} style={{ display: 'flex', gap: '8px', padding: '4px 0' }}>
              <span style={{ color: RED, fontSize: '10px', marginTop: '2px', flexShrink: 0 }}>▸</span>
              <span style={{ fontSize: '12px', color: MUTED, lineHeight: 1.5 }}>{g}</span>
            </div>
          ))}
        </div>
        <div style={card({ borderColor: 'rgba(52,211,153,0.18)' })}>
          {label('Target architecture')}
          {arch.target.map((t, i) => (
            <div key={i} style={{ display: 'flex', gap: '8px', padding: '4px 0' }}>
              <span style={{ color: GREEN, fontSize: '10px', marginTop: '2px', flexShrink: 0 }}>▸</span>
              <span style={{ fontSize: '12px', color: MUTED, lineHeight: 1.5 }}>{t}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function BusinessCasePanel({ clientId }: { clientId: string }) {
  const benchmarks = clientId === 'arcturus' ? [
    { metric: 'Cost-to-Income Ratio', ours: '71%', peer: '61%', gap: '$840M efficiency gap', color: RED },
    { metric: 'AUM per Employee', ours: '$65M', peer: '$185M', gap: '-$120M per employee vs peers', color: RED },
    { metric: 'AI Maturity Score', ours: '28/100', peer: '54/100', gap: '26 points below peer median', color: RED },
    { metric: 'Client Portal Adoption', ours: '44%', peer: '78%', gap: '-34pp vs industry median', color: RED },
  ] : [
    { metric: 'Denial Rate', ours: '18.2%', peer: '12.0%', gap: '$94M annual write-off', color: RED },
    { metric: 'Operating Margin', ours: '1.8%', peer: '3.4%', gap: '-1.6pp vs IDN median', color: RED },
    { metric: 'Days in AR', ours: '52', peer: '35', gap: '+17 days — working capital drag', color: RED },
    { metric: 'Epic Optimization', ours: '58/100', peer: '78/100', gap: '-20 points below benchmark', color: AMBER },
  ]
  return (
    <div>
      <div style={{ border: `1px solid ${BORDER}`, borderRadius: '8px', overflow: 'hidden', marginBottom: '20px' }}>
        {benchmarks.map((b, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '14px 20px', background: CARD, borderBottom: i < benchmarks.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
            <div style={{ flex: 1, fontSize: '13px', color: MUTED }}>{b.metric}</div>
            <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
              <div style={{ textAlign: 'right' as const }}>
                <div style={{ fontFamily: MONO, fontSize: '16px', fontWeight: 700, color: b.color }}>{b.ours}</div>
                <div style={{ fontFamily: MONO, fontSize: '9px', color: DIM }}>current</div>
              </div>
              <div style={{ textAlign: 'right' as const }}>
                <div style={{ fontFamily: MONO, fontSize: '16px', fontWeight: 700, color: GREEN }}>{b.peer}</div>
                <div style={{ fontFamily: MONO, fontSize: '9px', color: DIM }}>peer median</div>
              </div>
              <div style={{ fontFamily: MONO, fontSize: '11px', color: AMBER, minWidth: '220px', textAlign: 'right' as const }}>{b.gap}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={card({ borderColor: 'rgba(52,211,153,0.2)', background: 'rgba(52,211,153,0.03)' })}>
        {label('AbarVa engagement model')}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          {[
            { k: 'Fee model', v: 'Outcome-linked', d: 'Fee tied to verified performance improvements only' },
            { k: 'Scenarios', v: 'Bear / Base / Bull', d: 'Three-scenario IC package built from your data + Genome' },
            { k: 'Assurance', v: 'Maestro', d: 'Embedded operator holds vendors accountable throughout' },
          ].map((x, i) => (
            <div key={i}>
              {label(x.k)}
              <div style={{ fontSize: '14px', fontWeight: 600, color: GREEN, marginBottom: '4px' }}>{x.v}</div>
              <div style={{ fontSize: '12px', color: MUTED }}>{x.d}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function AIDeliveryPanel({ clientId }: { clientId: string }) {
  const initiatives = clientId === 'arcturus'
    ? arcturusAI.maturity.currentInitiatives.slice(0, 6).map((x: any) => ({
        name: x.name, status: x.status, type: x.category,
        blocker: x.blocker || x.rootCause?.slice(0, 100),
        inv: x.investment ? `$${(x.investment / 1e6).toFixed(1)}M` : undefined,
      }))
    : [
        { name: 'Coding AI (Optum360)', status: 'Live — On Track', type: 'NLP · Code optimization', blocker: undefined, inv: undefined },
        { name: 'Sepsis Early Warning', status: 'Live — Partial', type: 'Predictive · Clinical', blocker: 'Live 5 hospitals, failing 3, blocked 13', inv: undefined },
        { name: 'Prior Auth AI', status: 'Blocked', type: 'Workflow · RCM', blocker: 'Epic module purchased, 23% deployed', inv: undefined },
        { name: 'Unified Data Platform', status: 'Planning', type: 'Data infrastructure', blocker: 'Blue Ridge migration must complete first', inv: '$84M approved' },
      ]

  const statusColor = (s: string) => {
    if (s.includes('Track') || s.includes('Live')) return GREEN
    if (s.includes('Partial') || s.includes('Planning')) return AMBER
    return RED
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '10px' }}>
      {initiatives.map((item: any, i: number) => (
        <div key={i} style={card({ borderColor: `${statusColor(item.status)}25` })}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: item.blocker ? '8px' : 0 }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: WHITE }}>{item.name}</div>
              <div style={{ fontFamily: MONO, fontSize: '10px', color: DIM, marginTop: '2px' }}>{item.type}{item.inv ? ` · ${item.inv}` : ''}</div>
            </div>
            <span style={{ fontFamily: MONO, fontSize: '9px', padding: '3px 10px', borderRadius: '10px', background: `${statusColor(item.status)}18`, color: statusColor(item.status), flexShrink: 0, marginLeft: '12px' }}>
              {item.status.toUpperCase()}
            </span>
          </div>
          {item.blocker && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <span style={{ color: RED, fontSize: '10px', marginTop: '2px', flexShrink: 0 }}>▸</span>
              <span style={{ fontSize: '12px', color: MUTED }}>{item.blocker}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function OutcomePanel({ clientId }: { clientId: string }) {
  const outcomes = clientId === 'meridian' ? [
    { name: 'RCM Denial Rate', baseline: '18.2%', committed: '12.0%', current: '15.4%', trend: 'improving', feeStatus: 'partial', savingsToDate: 14.2 },
    { name: 'Operating Margin', baseline: '1.8%', committed: '3.2%', current: '2.1%', trend: 'improving', feeStatus: 'partial', savingsToDate: 7.8 },
    { name: 'Days in AR', baseline: '52 days', committed: '38 days', current: '47 days', trend: 'improving', feeStatus: 'partial', savingsToDate: 4.1 },
    { name: 'Epic Optimization', baseline: '58/100', committed: '78/100', current: '63/100', trend: 'improving', feeStatus: 'locked', savingsToDate: 0 },
  ] : [
    { name: 'AI Initiative ROI', baseline: '$0 verified', committed: '$94M tracked', current: 'In setup', trend: 'locked', feeStatus: 'locked', savingsToDate: 0 },
    { name: 'Cost-to-Income Ratio', baseline: '71%', committed: '64%', current: 'Baseline phase', trend: 'locked', feeStatus: 'locked', savingsToDate: 0 },
    { name: 'MAS FEAT Compliance', baseline: 'Overdue 4mo', committed: 'Compliant', current: 'In remediation', trend: 'in-progress', feeStatus: 'locked', savingsToDate: 0 },
  ]
  const trendColor = (t: string) => t === 'improving' ? GREEN : t === 'in-progress' ? AMBER : DIM
  return (
    <div>
      <div style={{ border: `1px solid ${BORDER}`, borderRadius: '8px', overflow: 'hidden', marginBottom: '20px' }}>
        {outcomes.map((o, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 120px', gap: '0', padding: '14px 20px', background: CARD, borderBottom: i < outcomes.length - 1 ? `1px solid ${BORDER}` : 'none', alignItems: 'center' }}>
            <div style={{ fontSize: '13px', color: WHITE, fontWeight: 500 }}>{o.name}</div>
            <div>
              {label('Baseline')}
              <div style={{ fontFamily: MONO, fontSize: '13px', color: MUTED }}>{o.baseline}</div>
            </div>
            <div>
              {label('Committed')}
              <div style={{ fontFamily: MONO, fontSize: '13px', color: TEAL }}>{o.committed}</div>
            </div>
            <div>
              {label('Current')}
              <div style={{ fontFamily: MONO, fontSize: '13px', color: trendColor(o.trend) }}>{o.current}</div>
            </div>
            <div style={{ textAlign: 'right' as const }}>
              {label('Savings')}
              <div style={{ fontFamily: MONO, fontSize: '13px', color: o.savingsToDate > 0 ? GREEN : DIM }}>
                {o.savingsToDate > 0 ? `$${o.savingsToDate}M` : '—'}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div style={card({ borderColor: 'rgba(45,212,200,0.2)' })}>
        {label('Fee model — outcome-linked only')}
        <div style={{ fontSize: '13px', color: MUTED, lineHeight: 1.6 }}>
          Baseline locked Day 0. Monthly actuals vs baseline tracked in real time. AbarVa fee released only on verified, audited savings — independently confirmed. Zero fee if baseline does not move.
        </div>
      </div>
    </div>
  )
}

function ModuleContent({ moduleKey, clientId }: { moduleKey: string; clientId: string }) {
  switch (moduleKey) {
    case 'situation':     return <SituationPanel clientId={clientId} />
    case 'contradiction': return <ContradictionPanel clientId={clientId} />
    case 'data':          return <DataPanel clientId={clientId} />
    case 'technology':    return <TechnologyPanel clientId={clientId} />
    case 'vendor':        return <VendorPanel clientId={clientId} />
    case 'architecture':  return <ArchitecturePanel clientId={clientId} />
    case 'business-case': return <BusinessCasePanel clientId={clientId} />
    case 'ai-delivery':   return <AIDeliveryPanel clientId={clientId} />
    case 'outcome':       return <OutcomePanel clientId={clientId} />
    default: return null
  }
}

// ─── Main canvas ──────────────────────────────────────────────────────────────

function AVRCanvas() {
  const searchParams = useSearchParams()
  const clientId = searchParams.get('client') || 'meridian'
  const clientName = clientId === 'arcturus' ? 'Arcturus Financial' : 'Meridian Health'
  const clientColor = clientId === 'arcturus' ? PURPLE : TEAL

  const [phaseFilter, setPhaseFilter] = useState<number | null>(null)
  const [activeModule, setActiveModule] = useState<ModuleInfo | null>(null)

  const visiblePhases = phaseFilter ? PHASES.filter(p => p.phase === phaseFilter) : PHASES

  // ── Module view ──────────────────────────────────────────────────────────────
  if (activeModule) {
    return (
      <div style={{ minHeight: '100vh', background: BG, fontFamily: SANS, color: WHITE }}>
        <AbarvaNav activePage={activeModule.key} />

        {/* Explorer breadcrumb */}
        <div style={{ background: CARD, borderBottom: `1px solid ${BORDER}`, height: '40px', display: 'flex', alignItems: 'center', padding: '0 48px', gap: '10px' }}>
          <button
            onClick={() => setActiveModule(null)}
            style={{ fontFamily: MONO, fontSize: '9px', color: TEAL, background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '.07em', padding: 0 }}
          >
            AI Value Realization
          </button>
          <span style={{ fontFamily: MONO, fontSize: '9px', color: BORDER }}>›</span>
          <span style={{ fontFamily: MONO, fontSize: '9px', color: activeModule.phaseColor, letterSpacing: '.07em' }}>
            Phase {PHASES.findIndex(p => p.modules.some(m => m.key === activeModule.key)) + 1} — {activeModule.phaseLabel}
          </span>
          <span style={{ fontFamily: MONO, fontSize: '9px', color: BORDER }}>›</span>
          <span style={{ fontFamily: MONO, fontSize: '9px', color: 'rgba(255,255,255,0.45)', letterSpacing: '.06em' }}>{activeModule.name}</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: clientColor }} />
            <span style={{ fontFamily: MONO, fontSize: '9px', color: clientColor }}>{clientName}</span>
          </div>
        </div>

        {/* Module content */}
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '36px 48px 80px' }}>
          <div style={{ marginBottom: '28px' }}>
            <div style={{ fontFamily: MONO, fontSize: '9px', color: activeModule.phaseColor, letterSpacing: '.1em', textTransform: 'uppercase' as const, marginBottom: '6px' }}>
              Module {String(activeModule.num).padStart(2, '0')} · {activeModule.output}
            </div>
            <h1 style={{ fontFamily: SERIF, fontSize: '32px', fontWeight: 500, color: WHITE, margin: 0 }}>{activeModule.name}</h1>
            <p style={{ fontSize: '14px', color: MUTED, marginTop: '8px' }}>{activeModule.desc}</p>
          </div>
          <ModuleContent moduleKey={activeModule.key} clientId={clientId} />
        </div>
      </div>
    )
  }

  // ── Canvas view ──────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: SANS, color: WHITE }}>
      <AbarvaNav activePage="avr" />

      {/* Canvas header */}
      <div style={{ background: CARD, borderBottom: `1px solid ${BORDER}`, padding: '0 48px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', alignItems: 'center', height: '52px', gap: '16px' }}>
          <div style={{ fontFamily: SERIF, fontSize: '18px', fontWeight: 500, color: WHITE }}>AI Value Realization</div>
          <div style={{ width: 1, height: 20, background: BORDER }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: clientColor }} />
            <span style={{ fontFamily: MONO, fontSize: '10px', color: clientColor }}>{clientName}</span>
          </div>
          <div style={{ width: 1, height: 20, background: BORDER }} />
          <span style={{ fontFamily: MONO, fontSize: '10px', color: DIM }}>9 intelligence modules · 3 phases</span>
          {/* Phase filter tabs — right aligned */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'stretch', height: '100%' }}>
            {[
              { label: 'All', value: null, color: WHITE },
              { label: 'Phase 1 — DIAGNOSE', value: 1, color: BLUE },
              { label: 'Phase 2 — PRESCRIBE', value: 2, color: AMBER },
              { label: 'Phase 3 — VALUE REALIZATION', value: 3, color: GREEN },
            ].map(tab => (
              <button
                key={tab.label}
                onClick={() => setPhaseFilter(tab.value)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontFamily: MONO, fontSize: '9px', letterSpacing: '.07em',
                  color: phaseFilter === tab.value ? tab.color : DIM,
                  borderBottom: phaseFilter === tab.value ? `2px solid ${tab.color}` : '2px solid transparent',
                  padding: '0 14px',
                  transition: 'color 0.15s',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Module cards */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 48px 80px' }}>
        {visiblePhases.map((phase, pi) => (
          <div key={phase.phase} style={{ marginBottom: '32px' }}>
            {pi > 0 && <div style={{ height: '1px', background: BORDER, margin: '0 0 32px' }} />}

            {/* Phase label */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ fontFamily: MONO, fontSize: '9px', color: phase.color, letterSpacing: '.12em' }}>
                PHASE {phase.phase} — {phase.label}
              </div>
              <div style={{ flex: 1, height: 1, background: BORDER }} />
              <div style={{ fontFamily: MONO, fontSize: '9px', color: DIM }}>{phase.modules.length} modules</div>
            </div>

            {/* Module cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '12px' }}>
              {phase.modules.map(mod => (
                <div
                  key={mod.key}
                  onClick={() => setActiveModule({ ...mod, phaseLabel: phase.label, phaseColor: phase.color })}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.querySelector('[data-card]') as HTMLElement).style.borderColor = `${phase.color}50`}
                  onMouseLeave={e => (e.currentTarget.querySelector('[data-card]') as HTMLElement).style.borderColor = BORDER}
                >
                  <div data-card="" style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '20px 22px', transition: 'border-color 0.15s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <div style={{ width: 28, height: 28, borderRadius: '6px', background: `${phase.color}12`, border: `1px solid ${phase.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: MONO, fontSize: '10px', color: phase.color, fontWeight: 600, flexShrink: 0 }}>
                          {String(mod.num).padStart(2, '0')}
                        </div>
                        <div style={{ fontSize: '15px', fontWeight: 600, color: WHITE }}>{mod.name}</div>
                      </div>
                      <div style={{ fontFamily: MONO, fontSize: '8px', color: TEAL, background: 'rgba(45,212,200,0.08)', border: '1px solid rgba(45,212,200,0.18)', borderRadius: '4px', padding: '3px 7px', flexShrink: 0, marginLeft: '8px' }}>
                        {mod.output}
                      </div>
                    </div>
                    <div style={{ fontSize: '12px', color: MUTED, lineHeight: 1.6, marginBottom: '12px' }}>{mod.desc}</div>
                    <div style={{ fontSize: '12px', color: phase.color, textAlign: 'right' as const }}>Open module →</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AIStrategyPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#060A12' }} />}>
      <AVRCanvas />
    </Suspense>
  )
}
