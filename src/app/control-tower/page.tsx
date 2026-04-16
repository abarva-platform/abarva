'use client'
import { useState, Suspense } from 'react'
import AbarvaNav from '@/components/AbarvaNav'
import { useClientContext } from '@/lib/use-client-context'
import EngagementProgress from '@/components/EngagementProgress'
import { meridianAI } from '@/data/meridian/ai'

const S = {
  page: { minHeight: '100vh', background: '#F8FAFC', fontFamily: 'Inter, -apple-system, sans-serif' } as React.CSSProperties,
  card: { background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '24px' } as React.CSSProperties,
  label: { fontSize: '11px', fontWeight: 700, color: '#3C3C3C', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '8px' } as React.CSSProperties,
}

type TabId = 'overview' | 'portfolio' | 'adoption' | 'value' | 'risk' | 'cost' | 'responsible'

const TABS: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'portfolio', label: 'Portfolio' },
  { id: 'adoption', label: 'Adoption' },
  { id: 'value', label: 'Value' },
  { id: 'risk', label: 'Risk' },
  { id: 'cost', label: 'Cost' },
  { id: 'responsible', label: 'Responsible AI' },
]

const CLIENT_NAMES: Record<string, string> = {
  meridian: 'Meridian Health System',
  firstcapital: 'First Capital Financial',
  apexretail: 'Apex Retail Group',
}

// ─── Meridian AI inventory (registered + shadow) ──────────────────────────

const REGISTERED_TOOLS = [
  { id: 't-001', name: 'Sepsis Early Warning AI', owner: 'Dr. Sarah Okonkwo', platform: 'Azure ML', stage: 'Pilot', riskTier: 'High', valueStatus: 'Proven / Not Scaled', monthlyUsers: 84, overrideRate: 31, costPerMonth: 12400, annualValue: 24000000 },
  { id: 't-002', name: 'Denial Prediction Model', owner: 'Robert Chen', platform: 'Azure ML', stage: 'Validated', riskTier: 'Medium', valueStatus: 'Not Deployed', monthlyUsers: 0, overrideRate: 0, costPerMonth: 4200, annualValue: 37600000 },
  { id: 't-003', name: 'Clinical Documentation AI', owner: 'Dr. Sarah Okonkwo', platform: 'Nuance DAX', stage: 'Pilot', riskTier: 'Medium', valueStatus: 'Limited — 1 dept', monthlyUsers: 142, overrideRate: 18, costPerMonth: 8600, annualValue: 42000000 },
  { id: 't-004', name: 'Readmission Risk Scoring', owner: 'Marcus Webb', platform: 'Epic', stage: 'Development', riskTier: 'Medium', valueStatus: 'Unmeasured', monthlyUsers: 0, overrideRate: 0, costPerMonth: 2100, annualValue: 0 },
  { id: 't-005', name: 'AP Invoice Automation', owner: 'Robert Chen', platform: 'Esker', stage: 'Scaled', riskTier: 'Low', valueStatus: 'Positive', monthlyUsers: 42, overrideRate: 4, costPerMonth: 6800, annualValue: 4200000 },
  { id: 't-006', name: 'Azure Cost Optimization AI', owner: 'Marcus Webb', platform: 'Azure Advisor', stage: 'Scaled', riskTier: 'Low', valueStatus: 'Positive', monthlyUsers: 8, overrideRate: 2, costPerMonth: 800, annualValue: 4200000 },
]

const SHADOW_TOOLS = [
  { id: 's-001', name: 'ChatGPT (Web)', discoveredBy: 'Browser proxy log', users: 284, department: 'Nursing — multiple', riskLevel: 'Critical', lastSeen: '2 days ago', phiRisk: true },
  { id: 's-002', name: 'Doximity GPT', discoveredBy: 'MDM agent', users: 67, department: 'Physician — Internal Med', riskLevel: 'High', lastSeen: '1 week ago', phiRisk: true },
  { id: 's-003', name: 'Perplexity.ai', discoveredBy: 'Browser proxy log', users: 42, department: 'Finance — mixed', riskLevel: 'Medium', lastSeen: '3 days ago', phiRisk: false },
  { id: 's-004', name: 'GitHub Copilot (unlicensed)', discoveredBy: 'Azure AD log', users: 18, department: 'IT Engineering', riskLevel: 'Medium', lastSeen: '1 day ago', phiRisk: false },
  { id: 's-005', name: 'Otter.ai (clinical notes)', discoveredBy: 'MDM agent', users: 24, department: 'Outpatient Clinics', riskLevel: 'Critical', lastSeen: '4 days ago', phiRisk: true },
  { id: 's-006', name: 'Claude.ai (Web)', discoveredBy: 'Browser proxy log', users: 38, department: 'Revenue Cycle', riskLevel: 'High', lastSeen: '1 day ago', phiRisk: false },
]

// ─── Adoption data ────────────────────────────────────────────────────────

const ADOPTION_MONTHS = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar']
const ADOPTION_MAU: Record<string, number[]> = {
  't-001': [62, 68, 72, 80, 82, 84],
  't-003': [88, 102, 118, 128, 136, 142],
  't-005': [38, 39, 40, 41, 42, 42],
  't-006': [6, 6, 7, 7, 8, 8],
}

// ─── Drift / Risk data ────────────────────────────────────────────────────

const DRIFT_ALERTS = [
  { tool: 'Sepsis Early Warning AI', type: 'Concept Drift', severity: 'High', detected: '8 days ago', description: 'Input distribution shift — ICD-10 coding pattern changed after Epic upgrade', status: 'Open' },
  { tool: 'Denial Prediction Model', type: 'Data Staleness', severity: 'Medium', detected: '3 weeks ago', description: 'Training data is 14 months old. Payer mix has changed 18% since training.', status: 'Open' },
  { tool: 'Clinical Documentation AI', type: 'Performance Degradation', severity: 'Low', detected: '2 weeks ago', description: 'DAX accuracy on orthopedic notes dropped 6 points after scope expansion', status: 'In Review' },
]

const REGULATORY_ALIGNMENT = [
  { tool: 'Sepsis Early Warning AI', hipaa: true, hitrustReady: true, fdaStatus: 'Not Required', euAiAct: 'High Risk — Exempt (US only)', biasAssessed: false },
  { tool: 'Denial Prediction Model', hipaa: true, hitrustReady: false, fdaStatus: 'Not Required', euAiAct: 'Limited Risk', biasAssessed: true },
  { tool: 'Clinical Documentation AI', hipaa: true, hitrustReady: true, fdaStatus: 'Class II (Nuance)', euAiAct: 'High Risk — Nuance certified', biasAssessed: true },
  { tool: 'AP Invoice Automation', hipaa: false, hitrustReady: false, fdaStatus: 'Not Required', euAiAct: 'Minimal Risk', biasAssessed: false },
]

// ─── Cost data ────────────────────────────────────────────────────────────

const COST_BY_TOOL = [
  { name: 'Sepsis Early Warning AI', monthlySpend: 12400, benchmarkSpend: 8200, perInference: 0.42, inferenceCount: 29524, platform: 'Azure ML', vendorConc: 'Azure', roi: 2.1 },
  { name: 'Clinical Documentation AI', monthlySpend: 8600, benchmarkSpend: 6400, perInference: 1.82, inferenceCount: 4725, platform: 'Nuance DAX', vendorConc: 'Microsoft', roi: 1.8 },
  { name: 'Denial Prediction Model', monthlySpend: 4200, benchmarkSpend: 4200, perInference: 0.31, inferenceCount: 13548, platform: 'Azure ML', vendorConc: 'Azure', roi: -1 },
  { name: 'AP Invoice Automation', monthlySpend: 6800, benchmarkSpend: 5200, perInference: 0.18, inferenceCount: 37778, platform: 'Esker', vendorConc: 'Esker', roi: 4.2 },
  { name: 'Readmission Risk Scoring', monthlySpend: 2100, benchmarkSpend: 1800, perInference: 0.28, inferenceCount: 7500, platform: 'Epic', vendorConc: 'Epic', roi: -1 },
  { name: 'Azure Cost Optimization AI', monthlySpend: 800, benchmarkSpend: 800, perInference: 0.04, inferenceCount: 20000, platform: 'Azure Advisor', vendorConc: 'Azure', roi: 22.0 },
]

// Azure = 12400 + 4200 + 2100 + 800 = 19500 / total 34900 = 55.9% → vendor concentration risk
const TOTAL_MONTHLY_SPEND = COST_BY_TOOL.reduce((s, t) => s + t.monthlySpend, 0)
const AZURE_SPEND = 12400 + 4200 + 2100 + 800 // 55.9%
const AZURE_PCT = Math.round((AZURE_SPEND / TOTAL_MONTHLY_SPEND) * 100)

// ─── Responsible AI score calculation ─────────────────────────────────────

const RA_DIMENSIONS = [
  { id: 'inventory', label: 'Inventory Completeness', score: 72, note: '6 of 12 known tools formally registered' },
  { id: 'ownership', label: 'Ownership Coverage', score: 83, note: '5 of 6 registered tools have named owners' },
  { id: 'bias', label: 'Bias Assessment Coverage', score: 50, note: '3 of 6 tools have completed bias assessments' },
  { id: 'audit', label: 'Audit Trail Coverage', score: 67, note: 'Audit logs enabled on 4 of 6 tools' },
  { id: 'policy', label: 'Policy Completeness', score: 58, note: 'AI policy exists but shadow AI and PHI use not addressed' },
  { id: 'incident', label: 'Incident Response Readiness', score: 40, note: 'No AI-specific incident playbook. Generic IT playbook only.' },
  { id: 'training', label: 'Training Completion', score: 34, note: '34% of clinical staff completed AI literacy training (target: 80%)' },
]

const RA_SCORE = Math.round(RA_DIMENSIONS.reduce((s, d) => s + d.score, 0) / RA_DIMENSIONS.length)

const EU_AI_ACT_ITEMS = [
  { item: 'High-risk AI system inventory', status: 'Partial', note: 'Sepsis AI and DAX identified. 3 others unclear.' },
  { item: 'Conformity assessments for high-risk systems', status: 'Not Done', note: 'Required before EU deployment. Not planned.' },
  { item: 'Human oversight mechanisms documented', status: 'Partial', note: 'Override mechanisms exist. Not documented per EU standard.' },
  { item: 'Technical documentation (Art. 11)', status: 'Not Done', note: 'Not in scope until EU patient encounter.' },
  { item: 'Data governance for training sets', status: 'Partial', note: 'Epic data governance covers some. Azure ML training sets undocumented.' },
  { item: 'Bias monitoring and testing', status: 'Partial', note: '2 of 4 high-risk tools have bias testing.' },
  { item: 'Logging and record-keeping (Art. 12)', status: 'Done', note: 'Azure ML logging enabled. Audit trail active.' },
]

// ─── Sub-components ───────────────────────────────────────────────────────

function ScoreGauge({ score, size = 72 }: { score: number; size?: number }) {
  const color = score >= 75 ? '#059669' : score >= 55 ? '#D97706' : '#DC2626'
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 72 72">
        <circle cx="36" cy="36" r="28" fill="none" stroke="#F1F5F9" strokeWidth="8" />
        <circle
          cx="36" cy="36" r="28" fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${(score / 100) * 175.9} 175.9`}
          strokeLinecap="round"
          transform="rotate(-90 36 36)"
        />
      </svg>
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: size / 4, fontWeight: 800, color }}>{score}</span>
      </div>
    </div>
  )
}

function TrafficLight({ rate, greenMax = 15, amberMax = 25 }: { rate: number; greenMax?: number; amberMax?: number }) {
  const isGreen = rate < greenMax
  const isAmber = rate >= greenMax && rate < amberMax
  const isRed = rate >= amberMax
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
        {[
          { on: isRed, color: '#DC2626' },
          { on: isAmber, color: '#D97706' },
          { on: isGreen, color: '#059669' },
        ].map((l, i) => (
          <div key={i} style={{ width: '12px', height: '12px', borderRadius: '50%', background: l.on ? l.color : '#E2E8F0' }} />
        ))}
      </div>
      <div>
        <div style={{ fontSize: '22px', fontWeight: 800, color: isRed ? '#DC2626' : isAmber ? '#D97706' : '#059669' }}>{rate}%</div>
        <div style={{ fontSize: '11px', color: '#3C3C3C' }}>Override Rate</div>
      </div>
    </div>
  )
}

function RiskBadge({ level }: { level: string }) {
  const cfg: Record<string, { bg: string; color: string; border: string }> = {
    Critical: { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA' },
    High: { bg: '#FFF7ED', color: '#C2410C', border: '#FED7AA' },
    Medium: { bg: '#FFFBEB', color: '#D97706', border: '#FDE68A' },
    Low: { bg: '#F0FDF4', color: '#059669', border: '#A7F3D0' },
  }
  const c = cfg[level] ?? cfg.Medium
  return (
    <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px', background: c.bg, color: c.color, border: '1px solid ' + c.border }}>
      {level}
    </span>
  )
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = { Scaled: '#059669', Pilot: '#D97706', Validated: '#4DA3FF', Development: '#888888', Retired: '#EF4444' }
  const color = colors[status] ?? '#888888'
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', color }}>
      <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: color, display: 'inline-block' }} />
      {status}
    </span>
  )
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0F172A', margin: 0 }}>{title}</h2>
      {subtitle && <p style={{ fontSize: '14px', color: '#64748B', margin: '4px 0 0' }}>{subtitle}</p>}
    </div>
  )
}

// ─── Tab content components ───────────────────────────────────────────────

function OverviewTab({ clientId }: { clientId: string }) {
  const ai = meridianAI
  const shadowCount = SHADOW_TOOLS.length
  const scaledCount = REGISTERED_TOOLS.filter(t => t.stage === 'Scaled').length
  const totalMonthlySpend = TOTAL_MONTHLY_SPEND
  const avgOverride = Math.round(REGISTERED_TOOLS.filter(t => t.overrideRate > 0).reduce((s, t) => s + t.overrideRate, 0) / REGISTERED_TOOLS.filter(t => t.overrideRate > 0).length)
  const portfolioHealth = Math.round((scaledCount / REGISTERED_TOOLS.length) * 100)

  const scorecards = [
    { label: 'Portfolio Health', value: portfolioHealth + '%', sub: `${scaledCount} of ${REGISTERED_TOOLS.length} tools scaled`, color: portfolioHealth >= 50 ? '#059669' : '#D97706', bg: portfolioHealth >= 50 ? '#F0FDF4' : '#FFFBEB' },
    { label: 'Monthly AI Spend', value: '$' + (totalMonthlySpend / 1000).toFixed(0) + 'K', sub: 'Across ' + REGISTERED_TOOLS.length + ' registered tools', color: '#4DA3FF', bg: '#EFF6FF' },
    { label: 'Avg Override Rate', value: avgOverride + '%', sub: avgOverride >= 25 ? 'Above threshold — review' : 'Within acceptable range', color: avgOverride >= 25 ? '#DC2626' : '#D97706', bg: avgOverride >= 25 ? '#FEF2F2' : '#FFFBEB' },
    { label: 'Responsible AI Score', value: RA_SCORE + '/100', sub: 'Training & incident response gaps', color: RA_SCORE >= 75 ? '#059669' : '#D97706', bg: RA_SCORE >= 75 ? '#F0FDF4' : '#FFFBEB' },
    { label: 'Shadow AI Alerts', value: shadowCount + ' tools', sub: 'Found outside IT registry', color: '#DC2626', bg: '#FEF2F2' },
  ]

  return (
    <div>
      <SectionHeader title="AI Control Tower — Overview" subtitle={`${CLIENT_NAMES[clientId] ?? 'Your Organization'} · Updated today`} />

      {/* Shadow AI alert banner */}
      <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', padding: '14px 20px', marginBottom: '28px', display: 'flex', alignItems: 'center', gap: '14px' }}>
        <span style={{ fontSize: '20px' }}>⚠️</span>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#DC2626' }}>{shadowCount} AI tools found outside the IT registry — potential PHI exposure</div>
          <div style={{ fontSize: '13px', color: '#9B1C1C', marginTop: '2px' }}>ChatGPT used by 284 clinical staff. Otter.ai recording clinical conversations. Review Portfolio tab.</div>
        </div>
        <a href="#portfolio" style={{ marginLeft: 'auto', fontSize: '13px', fontWeight: 600, color: '#DC2626', textDecoration: 'none', whiteSpace: 'nowrap' }}>View all →</a>
      </div>

      {/* Scorecards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '32px' }}>
        {scorecards.map(c => (
          <div key={c.label} style={{ ...S.card, padding: '20px', background: c.bg, border: '1px solid ' + c.bg.replace('F0', 'A7').replace('FF', 'BB') + '' }}>
            <div style={S.label}>{c.label}</div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: c.color, lineHeight: 1.1 }}>{c.value}</div>
            <div style={{ fontSize: '12px', color: '#3C3C3C', marginTop: '6px' }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* AI Maturity summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        <div style={S.card}>
          <div style={S.label}>AI Readiness by Dimension</div>
          {[
            { label: 'Data Readiness', score: ai.maturity.dataReadiness.overall },
            { label: 'Technology Readiness', score: ai.maturity.techReadiness.overall },
            { label: 'Org Readiness', score: ai.maturity.orgReadiness.overall },
            { label: 'Change Readiness', score: ai.changeReadiness.overall },
          ].map(d => (
            <div key={d.label} style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '13px', color: '#3C3C3C' }}>{d.label}</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: d.score >= 60 ? '#059669' : d.score >= 40 ? '#D97706' : '#DC2626' }}>{d.score}</span>
              </div>
              <div style={{ height: '6px', background: '#F1F5F9', borderRadius: '3px' }}>
                <div style={{ height: '6px', borderRadius: '3px', width: d.score + '%', background: d.score >= 60 ? '#059669' : d.score >= 40 ? '#D97706' : '#DC2626' }} />
              </div>
            </div>
          ))}
        </div>

        <div style={S.card}>
          <div style={S.label}>Portfolio Stage Distribution</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
            {['Scaled', 'Pilot', 'Validated', 'Development'].map(stage => {
              const count = REGISTERED_TOOLS.filter(t => t.stage === stage).length
              const pct = Math.round((count / REGISTERED_TOOLS.length) * 100)
              return (
                <div key={stage} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <StatusDot status={stage} />
                  <div style={{ flex: 1, height: '8px', background: '#F1F5F9', borderRadius: '4px' }}>
                    <div style={{ height: '8px', borderRadius: '4px', width: pct + '%', background: stage === 'Scaled' ? '#059669' : stage === 'Pilot' ? '#D97706' : stage === 'Validated' ? '#4DA3FF' : '#888888' }} />
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#3C3C3C', minWidth: '28px' }}>{count}</span>
                </div>
              )
            })}
          </div>
          <div style={{ marginTop: '20px', padding: '12px', background: '#FFFBEB', borderRadius: '8px', border: '1px solid #FDE68A' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#92400E' }}>AbarVa Pattern: PILOT PURGATORY</div>
            <div style={{ fontSize: '12px', color: '#92400E', marginTop: '4px' }}>6 initiatives started in 24 months. 0 scaled to enterprise. Root cause: No MLOps, no CDO.</div>
          </div>
        </div>
      </div>

      {/* Key actions */}
      <div style={S.card}>
        <div style={S.label}>Actions Required This Week</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            { priority: 'Critical', action: 'Block ChatGPT access from clinical VLAN — 284 users, PHI exposure risk', owner: 'Marcus Webb' },
            { priority: 'Critical', action: 'Halt Otter.ai use in outpatient clinics — clinical audio without BAA', owner: 'Dr. Sarah Okonkwo' },
            { priority: 'High', action: 'Retrain Sepsis AI — concept drift detected, 8 days unresolved', owner: 'Marcus Webb' },
            { priority: 'High', action: 'Retrain Denial Model — 14-month-old training data, payer mix changed 18%', owner: 'Robert Chen' },
            { priority: 'Medium', action: 'Establish AI policy addendum for shadow AI and LLM use', owner: 'Legal + Marcus Webb' },
          ].map((a, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px', background: a.priority === 'Critical' ? '#FEF2F2' : a.priority === 'High' ? '#FFF7ED' : '#FFFBEB', borderRadius: '8px' }}>
              <RiskBadge level={a.priority} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', color: '#1E293B' }}>{a.action}</div>
                <div style={{ fontSize: '11px', color: '#3C3C3C', marginTop: '2px' }}>Owner: {a.owner}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function PortfolioTab() {
  const [showShadow, setShowShadow] = useState(true)

  return (
    <div>
      <SectionHeader title="AI Portfolio" subtitle={`${REGISTERED_TOOLS.length} registered tools · ${SHADOW_TOOLS.length} shadow tools detected`} />

      {/* Shadow AI alert */}
      <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '10px', padding: '16px 20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showShadow ? '16px' : '0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '18px' }}>⚠️</span>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#DC2626' }}>{SHADOW_TOOLS.length} AI tools found not in the IT registry</div>
              <div style={{ fontSize: '12px', color: '#9B1C1C' }}>Discovered via browser proxy logs and MDM agent · {SHADOW_TOOLS.filter(t => t.phiRisk).length} with potential PHI exposure</div>
            </div>
          </div>
          <button onClick={() => setShowShadow(!showShadow)} style={{ fontSize: '12px', color: '#DC2626', background: 'none', border: '1px solid #FCA5A5', borderRadius: '6px', padding: '4px 12px', cursor: 'pointer' }}>
            {showShadow ? 'Collapse' : 'Expand'}
          </button>
        </div>
        {showShadow && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr>
                {['Tool', 'Discovered By', 'Users', 'Department', 'PHI Risk', 'Risk Level', 'Last Seen'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '6px 8px', color: '#7F1D1D', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', borderBottom: '1px solid #FCA5A5' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SHADOW_TOOLS.map(t => (
                <tr key={t.id} style={{ borderBottom: '1px solid #FEE2E2' }}>
                  <td style={{ padding: '8px', fontWeight: 600, color: '#1E293B' }}>{t.name}</td>
                  <td style={{ padding: '8px', color: '#3C3C3C' }}>{t.discoveredBy}</td>
                  <td style={{ padding: '8px', fontWeight: 700, color: '#DC2626' }}>{t.users}</td>
                  <td style={{ padding: '8px', color: '#3C3C3C' }}>{t.department}</td>
                  <td style={{ padding: '8px' }}>
                    {t.phiRisk
                      ? <span style={{ fontSize: '11px', fontWeight: 700, color: '#DC2626', background: '#FEF2F2', padding: '2px 6px', borderRadius: '6px', border: '1px solid #FECACA' }}>PHI Risk</span>
                      : <span style={{ fontSize: '11px', color: '#3C3C3C' }}>Low</span>}
                  </td>
                  <td style={{ padding: '8px' }}><RiskBadge level={t.riskLevel} /></td>
                  <td style={{ padding: '8px', color: '#3C3C3C' }}>{t.lastSeen}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Registered inventory */}
      <div style={S.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={S.label}>Registered AI Inventory</div>
          <span style={{ fontSize: '12px', color: '#3C3C3C' }}>6 tools · Last updated today</span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
              {['Tool', 'Owner', 'Platform', 'Stage', 'Risk Tier', 'Value Status', 'MAU', 'Override %'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '8px', color: '#3C3C3C', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {REGISTERED_TOOLS.map(t => (
              <tr key={t.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={{ padding: '10px 8px', fontWeight: 600, color: '#1E293B' }}>{t.name}</td>
                <td style={{ padding: '10px 8px', color: '#3C3C3C' }}>{t.owner}</td>
                <td style={{ padding: '10px 8px', color: '#3C3C3C' }}>{t.platform}</td>
                <td style={{ padding: '10px 8px' }}><StatusDot status={t.stage} /></td>
                <td style={{ padding: '10px 8px' }}><RiskBadge level={t.riskTier} /></td>
                <td style={{ padding: '10px 8px', color: '#3C3C3C', fontSize: '12px' }}>{t.valueStatus}</td>
                <td style={{ padding: '10px 8px', fontWeight: t.monthlyUsers > 0 ? 600 : 400, color: t.monthlyUsers > 0 ? '#1E293B' : '#888888' }}>{t.monthlyUsers > 0 ? t.monthlyUsers : '—'}</td>
                <td style={{ padding: '10px 8px' }}>
                  {t.overrideRate > 0
                    ? <span style={{ fontWeight: 700, color: t.overrideRate >= 25 ? '#DC2626' : t.overrideRate >= 15 ? '#D97706' : '#059669' }}>{t.overrideRate}%</span>
                    : <span style={{ color: '#888888' }}>—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function AdoptionTab() {
  const sepsisMAU = ADOPTION_MAU['t-001']
  const dacMAU = ADOPTION_MAU['t-003']

  return (
    <div>
      <SectionHeader title="Adoption Intelligence" subtitle="Monthly active users, override rates, workflow integration" />

      {/* Key adoption metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Total Monthly Active Users', value: '276', sub: 'Across all registered tools', color: '#4DA3FF' },
          { label: 'AI-Assisted Workflows', value: '12%', sub: 'Of clinical encounters touch AI', color: '#059669' },
          { label: 'Tier 1 Resolution Rate', value: '31%', sub: 'AP + Azure Cost tools only', color: '#7C3AED' },
          { label: 'Training Completion', value: '34%', sub: 'Of clinical staff — target: 80%', color: '#D97706' },
        ].map(m => (
          <div key={m.label} style={S.card}>
            <div style={S.label}>{m.label}</div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: m.color }}>{m.value}</div>
            <div style={{ fontSize: '12px', color: '#3C3C3C', marginTop: '4px' }}>{m.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        {/* Override rate traffic lights */}
        <div style={S.card}>
          <div style={S.label}>Override Rate by Tool</div>
          <div style={{ fontSize: '12px', color: '#3C3C3C', marginBottom: '16px' }}>Green &lt;15% · Amber 15–25% · Red &gt;25%</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {REGISTERED_TOOLS.filter(t => t.overrideRate > 0).map(t => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#1E293B' }}>{t.name}</div>
                  <div style={{ fontSize: '11px', color: '#3C3C3C' }}>MAU: {t.monthlyUsers}</div>
                </div>
                <TrafficLight rate={t.overrideRate} />
              </div>
            ))}
          </div>
          <div style={{ marginTop: '16px', padding: '10px', background: '#FEF2F2', borderRadius: '8px', border: '1px solid #FECACA' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#DC2626' }}>Sepsis AI at 31% — CMIO action required</div>
            <div style={{ fontSize: '12px', color: '#7F1D1D', marginTop: '2px' }}>Dr. Okonkwo has flagged this as &ldquo;alert fatigue&rdquo; not diagnostic distrust. Threshold calibration recommended.</div>
          </div>
        </div>

        {/* MAU trend chart */}
        <div style={S.card}>
          <div style={S.label}>MAU Trend — Top 2 Tools (6 months)</div>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: '#DC2626' }}>● Sepsis AI</span>
            <span style={{ fontSize: '12px', color: '#4DA3FF' }}>● Clinical Doc AI</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '120px', padding: '8px 0' }}>
            {ADOPTION_MONTHS.map((month, i) => (
              <div key={month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '100%', display: 'flex', gap: '2px', alignItems: 'flex-end', height: '90px' }}>
                  <div style={{ flex: 1, background: '#FCA5A5', borderRadius: '3px 3px 0 0', height: ((sepsisMAU[i] / 160) * 90) + 'px' }} />
                  <div style={{ flex: 1, background: '#93C5FD', borderRadius: '3px 3px 0 0', height: ((dacMAU[i] / 160) * 90) + 'px' }} />
                </div>
                <div style={{ fontSize: '10px', color: '#888888' }}>{month}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
            <span style={{ fontSize: '11px', color: '#3C3C3C' }}>Sepsis: {sepsisMAU[0]} → {sepsisMAU[sepsisMAU.length - 1]} MAU</span>
            <span style={{ fontSize: '11px', color: '#3C3C3C' }}>Doc AI: {dacMAU[0]} → {dacMAU[dacMAU.length - 1]} MAU</span>
          </div>
        </div>
      </div>

      {/* Adoption gap analysis */}
      <div style={S.card}>
        <div style={S.label}>Adoption Gap Analysis</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            { tool: 'Denial Prediction Model', status: 'Validated — 0 users', gap: 'MLOps platform not deployed. Model cannot reach production without it.', action: 'Priority: Deploy Azure ML Managed Endpoints by Q2', severity: 'Critical' },
            { tool: 'Sepsis Early Warning AI', status: '84 users / 2 hospitals', gap: 'Proven at Mercy West and St. Mary\'s. 21 hospitals have zero access. CDO seat vacant.', action: 'Assign interim AI deployment lead. Scale in 90 days.', severity: 'High' },
            { tool: 'Readmission Risk Scoring', status: '0 users — in development', gap: 'In development 4 months. No go-live date. Epic integration not started.', action: 'Review build vs. buy — vendor solutions available in 60 days.', severity: 'Medium' },
          ].map((g, i) => (
            <div key={i} style={{ padding: '14px', background: g.severity === 'Critical' ? '#FEF2F2' : g.severity === 'High' ? '#FFF7ED' : '#FFFBEB', borderRadius: '8px', border: '1px solid ' + (g.severity === 'Critical' ? '#FECACA' : g.severity === 'High' ? '#FED7AA' : '#FDE68A') }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <RiskBadge level={g.severity} />
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B' }}>{g.tool}</span>
                <span style={{ fontSize: '12px', color: '#3C3C3C' }}>— {g.status}</span>
              </div>
              <div style={{ fontSize: '13px', color: '#3C3C3C', marginBottom: '4px' }}>{g.gap}</div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#3C3C3C' }}>→ {g.action}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ValueTab() {
  return (
    <div>
      <SectionHeader title="Business Value Tracking" subtitle="Per-tool baseline → current → improvement · Links to Outcome Intelligence baseline framework" />

      {/* Value summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Hours Saved / Month', value: '2,840', sub: 'Across scaled tools', color: '#059669' },
          { label: 'FTEs Redeployed', value: '4.2', sub: 'Equivalent redeployment', color: '#7C3AED' },
          { label: 'Annual Cost Reduction', value: '$8.4M', sub: 'AP + Azure Cost tools', color: '#4DA3FF' },
          { label: 'Revenue Impact', value: '$0 documented', sub: 'Clinical tools not yet measured', color: '#D97706' },
        ].map(m => (
          <div key={m.label} style={S.card}>
            <div style={S.label}>{m.label}</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: m.color }}>{m.value}</div>
            <div style={{ fontSize: '12px', color: '#3C3C3C', marginTop: '4px' }}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Value tracking table */}
      <div style={{ ...S.card, overflowX: 'auto', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={S.label}>Value by Tool</div>
          <a href="/admin/outcomes" style={{ fontSize: '12px', color: '#4DA3FF', textDecoration: 'none', fontWeight: 600 }}>Outcome Baseline Framework →</a>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '700px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
              {['Tool', 'Metric', 'Baseline', 'Current', 'Improvement', 'Annualized Savings', 'ROI Status'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '8px', color: '#3C3C3C', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { tool: 'Sepsis Early Warning AI', metric: 'Mortality Rate', baseline: '3.2%', current: '2.2%', improvement: '−31%', savings: '$24M (projected)', roiStatus: 'Pilot Only' },
              { tool: 'Clinical Documentation AI', metric: 'Doc time/encounter', baseline: '2.1 hrs', current: '1.6 hrs', improvement: '−24%', savings: '$42M (not scaled)', roiStatus: 'Pilot Only' },
              { tool: 'AP Invoice Automation', metric: 'Manual invoices %', baseline: '84%', current: '22%', improvement: '−62%', savings: '$4.2M/year', roiStatus: 'Positive' },
              { tool: 'Azure Cost Optimization AI', metric: 'Azure waste', baseline: '$1.8M/yr', current: '$420K/yr', improvement: '−77%', savings: '$4.2M/year', roiStatus: 'Positive' },
              { tool: 'Denial Prediction Model', metric: 'Denial Rate', baseline: '18.2%', current: '18.2%', improvement: 'No change', savings: '$0 (not deployed)', roiStatus: 'Not Deployed' },
              { tool: 'Readmission Risk', metric: 'Readmission Rate', baseline: 'TBD', current: 'TBD', improvement: 'Unmeasured', savings: 'Unmeasured', roiStatus: 'In Development' },
            ].map((r, i) => {
              const roiColor = r.roiStatus === 'Positive' ? '#059669' : r.roiStatus === 'Pilot Only' ? '#D97706' : r.roiStatus === 'Not Deployed' ? '#DC2626' : '#888888'
              return (
                <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '10px 8px', fontWeight: 600, color: '#1E293B' }}>{r.tool}</td>
                  <td style={{ padding: '10px 8px', color: '#3C3C3C' }}>{r.metric}</td>
                  <td style={{ padding: '10px 8px', color: '#3C3C3C' }}>{r.baseline}</td>
                  <td style={{ padding: '10px 8px', color: '#3C3C3C' }}>{r.current}</td>
                  <td style={{ padding: '10px 8px', fontWeight: 700, color: r.improvement.startsWith('−') ? '#059669' : '#888888' }}>{r.improvement}</td>
                  <td style={{ padding: '10px 8px', color: '#3C3C3C' }}>{r.savings}</td>
                  <td style={{ padding: '10px 8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: roiColor }}>{r.roiStatus}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Value gap callout */}
      <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '10px', padding: '16px 20px' }}>
        <div style={{ fontSize: '14px', fontWeight: 700, color: '#92400E', marginBottom: '8px' }}>$66M in potential savings — currently unprovable</div>
        <div style={{ fontSize: '13px', color: '#78350F', lineHeight: 1.5 }}>
          The Sepsis AI and Clinical Documentation AI show pilot-proven outcomes that cannot be attributed at enterprise scale because no baseline was established before deployment. AbarVa Outcome Baseline Framework required before any future pilot launch. Without a baseline, savings cannot be credited — or monetized.
        </div>
        <div style={{ marginTop: '10px' }}>
          <a href="/admin/outcomes" style={{ fontSize: '13px', fontWeight: 600, color: '#92400E', textDecoration: 'none' }}>→ Set up outcome baseline for all Wave 1 initiatives</a>
        </div>
      </div>
    </div>
  )
}

function RiskTab() {
  return (
    <div>
      <SectionHeader title="AI Risk & Compliance" subtitle="Bias coverage, drift alerts, PHI incidents, regulatory alignment" />

      {/* PHI incident callout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ ...S.card, background: '#F0FDF4', border: '1px solid #A7F3D0' }}>
          <div style={S.label}>PHI Incidents (Registered Tools)</div>
          <div style={{ fontSize: '36px', fontWeight: 800, color: '#059669' }}>0</div>
          <div style={{ fontSize: '12px', color: '#065F46' }}>No PHI incidents from registered AI tools in past 90 days</div>
        </div>
        <div style={{ ...S.card, background: '#FEF2F2', border: '1px solid #FECACA' }}>
          <div style={S.label}>Shadow AI PHI Risk</div>
          <div style={{ fontSize: '36px', fontWeight: 800, color: '#DC2626' }}>3</div>
          <div style={{ fontSize: '12px', color: '#9B1C1C' }}>ChatGPT, Doximity GPT, and Otter.ai — clinical data likely transmitted</div>
        </div>
        <div style={{ ...S.card, background: '#FFF7ED', border: '1px solid #FED7AA' }}>
          <div style={S.label}>Bias Assessment Coverage</div>
          <div style={{ fontSize: '36px', fontWeight: 800, color: '#C2410C' }}>50%</div>
          <div style={{ fontSize: '12px', color: '#7C2D12' }}>3 of 6 tools. Sepsis AI bias assessment overdue 6 months.</div>
        </div>
      </div>

      {/* Drift alerts */}
      <div style={{ ...S.card, marginBottom: '20px' }}>
        <div style={S.label}>Active Drift Alerts</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {DRIFT_ALERTS.map((a, i) => (
            <div key={i} style={{ padding: '14px', background: a.severity === 'High' ? '#FFF7ED' : a.severity === 'Medium' ? '#FFFBEB' : '#F8FAFC', borderRadius: '8px', border: '1px solid ' + (a.severity === 'High' ? '#FED7AA' : a.severity === 'Medium' ? '#FDE68A' : '#E2E8F0') }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <RiskBadge level={a.severity} />
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B' }}>{a.tool}</span>
                <span style={{ fontSize: '11px', color: '#3C3C3C' }}>{a.type} · Detected {a.detected}</span>
                <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: 600, color: a.status === 'Open' ? '#DC2626' : '#D97706' }}>{a.status}</span>
              </div>
              <div style={{ fontSize: '13px', color: '#3C3C3C' }}>{a.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Regulatory alignment table */}
      <div style={{ ...S.card, overflowX: 'auto' }}>
        <div style={S.label}>Regulatory Alignment by Tool</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '600px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
              {['Tool', 'HIPAA', 'HITRUST Ready', 'FDA Classification', 'EU AI Act', 'Bias Assessed'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '8px', color: '#3C3C3C', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {REGULATORY_ALIGNMENT.map((r, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={{ padding: '10px 8px', fontWeight: 600, color: '#1E293B' }}>{r.tool}</td>
                <td style={{ padding: '10px 8px' }}><CheckOrX val={r.hipaa} /></td>
                <td style={{ padding: '10px 8px' }}><CheckOrX val={r.hitrustReady} /></td>
                <td style={{ padding: '10px 8px', fontSize: '12px', color: '#3C3C3C' }}>{r.fdaStatus}</td>
                <td style={{ padding: '10px 8px', fontSize: '12px', color: '#3C3C3C' }}>{r.euAiAct}</td>
                <td style={{ padding: '10px 8px' }}><CheckOrX val={r.biasAssessed} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function CheckOrX({ val }: { val: boolean }) {
  return <span style={{ fontSize: '16px', color: val ? '#059669' : '#DC2626' }}>{val ? '✓' : '✗'}</span>
}

function CostTab() {
  return (
    <div>
      <SectionHeader title="AI Cost Intelligence" subtitle={`$${(TOTAL_MONTHLY_SPEND / 1000).toFixed(0)}K/month total · ${AZURE_PCT}% Azure concentration`} />

      {/* Cost summary scorecards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Total Monthly Spend', value: '$' + (TOTAL_MONTHLY_SPEND / 1000).toFixed(0) + 'K', sub: 'Across 6 registered tools', color: '#4DA3FF' },
          { label: 'Annual Run Rate', value: '$' + (TOTAL_MONTHLY_SPEND * 12 / 1000).toFixed(0) + 'K', sub: 'Excl. shadow AI', color: '#3C3C3C' },
          { label: 'Azure Concentration', value: AZURE_PCT + '%', sub: AZURE_PCT > 60 ? 'Flag: >60% single vendor' : 'Within acceptable range', color: AZURE_PCT > 60 ? '#DC2626' : '#059669' },
          { label: 'Retirement Candidates', value: '1', sub: 'Denial model — $4.2K/mo, 0 users', color: '#D97706' },
        ].map(m => (
          <div key={m.label} style={S.card}>
            <div style={S.label}>{m.label}</div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: m.color }}>{m.value}</div>
            <div style={{ fontSize: '12px', color: '#3C3C3C', marginTop: '4px' }}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Vendor concentration warning */}
      {AZURE_PCT > 60 && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', padding: '14px 20px', marginBottom: '20px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#DC2626' }}>Vendor Concentration Risk: {AZURE_PCT}% of AI spend is on Azure (threshold: 60%)</div>
          <div style={{ fontSize: '12px', color: '#9B1C1C', marginTop: '4px' }}>Azure ML outage or price increase directly impacts 4 of 6 registered tools. Consider multi-cloud MLOps layer.</div>
        </div>
      )}

      {/* Spend by tool + ROI */}
      <div style={{ ...S.card, overflowX: 'auto', marginBottom: '20px' }}>
        <div style={S.label}>Cost and ROI by Tool</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '650px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
              {['Tool', 'Platform', 'Monthly Spend', 'Benchmark', 'vs Benchmark', 'Per Inference', 'Monthly Volume', 'ROI'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '8px', color: '#3C3C3C', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COST_BY_TOOL.map((t, i) => {
              const delta = t.monthlySpend - t.benchmarkSpend
              const deltaColor = delta > 0 ? '#DC2626' : '#059669'
              const roiLabel = t.roi < 0 ? 'Unmeasured' : t.roi < 1 ? 'Negative' : t.roi > 5 ? 'Strong' : t.roi > 2 ? 'Positive' : 'Marginal'
              const roiColor = t.roi < 0 ? '#888888' : t.roi < 1 ? '#DC2626' : t.roi > 5 ? '#059669' : t.roi > 2 ? '#4DA3FF' : '#D97706'
              return (
                <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '10px 8px', fontWeight: 600, color: '#1E293B', fontSize: '12px' }}>{t.name}</td>
                  <td style={{ padding: '10px 8px', color: '#3C3C3C', fontSize: '12px' }}>{t.platform}</td>
                  <td style={{ padding: '10px 8px', fontWeight: 600, color: '#3C3C3C' }}>${(t.monthlySpend / 1000).toFixed(1)}K</td>
                  <td style={{ padding: '10px 8px', color: '#888888' }}>${(t.benchmarkSpend / 1000).toFixed(1)}K</td>
                  <td style={{ padding: '10px 8px', fontWeight: 700, color: deltaColor }}>{delta > 0 ? '+' : ''}{Math.round((delta / t.benchmarkSpend) * 100)}%</td>
                  <td style={{ padding: '10px 8px', color: '#3C3C3C' }}>${t.perInference.toFixed(2)}</td>
                  <td style={{ padding: '10px 8px', color: '#3C3C3C' }}>{t.inferenceCount.toLocaleString()}</td>
                  <td style={{ padding: '10px 8px' }}><span style={{ fontSize: '11px', fontWeight: 700, color: roiColor }}>{roiLabel}</span></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Spend visualization */}
      <div style={S.card}>
        <div style={S.label}>Monthly Spend Distribution</div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', height: '120px', marginTop: '8px' }}>
          {COST_BY_TOOL.map((t, i) => {
            const pct = (t.monthlySpend / TOTAL_MONTHLY_SPEND) * 100
            const colors = ['#4DA3FF', '#2DD4C8', '#A78BFA', '#6EE7B7', '#F59E0B', '#FB923C']
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: colors[i] }}>{Math.round(pct)}%</div>
                <div style={{ width: '100%', height: (pct / 100 * 90) + 'px', background: colors[i], borderRadius: '4px 4px 0 0', opacity: 0.85 }} />
                <div style={{ fontSize: '9px', color: '#3C3C3C', textAlign: 'center', lineHeight: 1.2 }}>{t.name.split(' ').slice(0, 2).join(' ')}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function ResponsibleAITab() {
  return (
    <div>
      <SectionHeader title="Responsible AI" subtitle="Governance score, EU AI Act readiness, board attestation" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', marginBottom: '24px' }}>
        {/* Score gauge */}
        <div style={{ ...S.card, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px' }}>
          <div style={S.label}>Responsible AI Score</div>
          <ScoreGauge score={RA_SCORE} size={120} />
          <div style={{ marginTop: '16px', fontSize: '14px', color: '#3C3C3C', textAlign: 'center' }}>
            <strong style={{ color: RA_SCORE >= 75 ? '#059669' : '#D97706' }}>
              {RA_SCORE >= 75 ? 'Good' : RA_SCORE >= 55 ? 'Needs Improvement' : 'At Risk'}
            </strong>
            <div style={{ fontSize: '12px', color: '#3C3C3C', marginTop: '4px' }}>Incident response and training are the primary gaps</div>
          </div>
        </div>

        {/* Score breakdown */}
        <div style={S.card}>
          <div style={S.label}>Score by Dimension</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {RA_DIMENSIONS.map(d => (
              <div key={d.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#1E293B' }}>{d.label}</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: d.score >= 75 ? '#059669' : d.score >= 55 ? '#D97706' : '#DC2626' }}>{d.score}/100</span>
                </div>
                <div style={{ height: '6px', background: '#F1F5F9', borderRadius: '3px', marginBottom: '3px' }}>
                  <div style={{ height: '6px', borderRadius: '3px', width: d.score + '%', background: d.score >= 75 ? '#059669' : d.score >= 55 ? '#D97706' : '#DC2626' }} />
                </div>
                <div style={{ fontSize: '11px', color: '#3C3C3C' }}>{d.note}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* EU AI Act checklist */}
      <div style={{ ...S.card, marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div style={S.label}>EU AI Act Readiness</div>
          <span style={{ fontSize: '11px', background: '#EFF6FF', color: '#1D4ED8', padding: '2px 8px', borderRadius: '10px', border: '1px solid #BFDBFE', fontWeight: 600 }}>Note: Meridian operates in US only. Track for future EU patient encounters.</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {EU_AI_ACT_ITEMS.map((item, i) => {
            const statusColor = item.status === 'Done' ? '#059669' : item.status === 'Partial' ? '#D97706' : '#DC2626'
            const statusBg = item.status === 'Done' ? '#F0FDF4' : item.status === 'Partial' ? '#FFFBEB' : '#FEF2F2'
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '10px', background: statusBg, borderRadius: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: statusColor, minWidth: '70px', marginTop: '1px' }}>{item.status}</span>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#1E293B' }}>{item.item}</div>
                  <div style={{ fontSize: '12px', color: '#3C3C3C', marginTop: '2px' }}>{item.note}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Board attestation template */}
      <div style={S.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={S.label}>Board-Ready Responsible AI Attestation</div>
          <button style={{ fontSize: '12px', fontWeight: 600, color: '#FFFFFF', background: '#2DD4C8', border: 'none', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer' }}>
            Export PDF
          </button>
        </div>
        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '20px', fontSize: '13px', lineHeight: 1.7, color: '#3C3C3C' }}>
          <div style={{ fontWeight: 700, fontSize: '14px', color: '#0F172A', marginBottom: '12px' }}>MERIDIAN HEALTH SYSTEM — AI GOVERNANCE ATTESTATION</div>
          <div style={{ marginBottom: '8px' }}><strong>Reporting Period:</strong> Q1 2026 (January – March)</div>
          <div style={{ marginBottom: '8px' }}><strong>Accountable Executive:</strong> Marcus Webb, CIO</div>
          <div style={{ marginBottom: '16px' }}><strong>Scope:</strong> 6 registered AI tools across clinical, financial, and operational domains</div>
          <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '12px', marginBottom: '8px', fontWeight: 600, color: '#0F172A' }}>Key Attestations:</div>
          {[
            `AI inventory is complete to the best of management's knowledge — 6 tools registered, 6 shadow tools identified and being remediated`,
            `Zero PHI incidents from registered AI tools in Q1 2026`,
            `Bias assessments completed for 3 of 6 tools — Sepsis AI assessment overdue and scheduled for Q2 2026`,
            `Audit logging enabled and retained for minimum 24 months on all production AI tools`,
            `AI policy updated Q4 2025 — shadow AI addendum in progress, target completion Q2 2026`,
            `No EU-regulated patient encounters — EU AI Act provisions tracked but not yet mandatory`,
          ].map((att, i) => (
            <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
              <span style={{ color: '#059669', marginTop: '1px' }}>✓</span>
              <span>{att}</span>
            </div>
          ))}
          <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '12px', marginTop: '8px', color: '#3C3C3C', fontSize: '12px' }}>
            Responsible AI Score: {RA_SCORE}/100 · Prepared by AbarVa Intelligence Platform · {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────

function ControlTowerInner() {
  const { clientId } = useClientContext()
  const [activeClient, setActiveClient] = useState(clientId)
  const [activeTab, setActiveTab] = useState<TabId>('overview')

  const clientName = CLIENT_NAMES[activeClient] ?? 'Your Organization'

  return (
    <div style={S.page}>
      <AbarvaNav />
      <EngagementProgress />

      <div style={{ maxWidth: '1480px', margin: '0 auto', padding: '32px 24px' }}>
        {/* Page header */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 14px', borderRadius: '20px', background: '#F0FDF4', border: '1px solid #A7F3D0', marginBottom: '16px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#059669', display: 'block' }} />
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.08em' }}>AI Control Tower</span>
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#0F172A', margin: '0 0 6px' }}>AI Portfolio Intelligence</h1>
          <p style={{ fontSize: '15px', color: '#64748B', margin: 0 }}>{clientName} · Govern what you own. Track what it costs. Prove what it delivers.</p>
        </div>

        {/* Tab navigation */}
        <div style={{ display: 'flex', gap: '4px', borderBottom: '2px solid #E2E8F0', marginBottom: '28px', overflowX: 'auto' }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '10px 20px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                border: 'none',
                background: 'none',
                color: activeTab === tab.id ? '#0F172A' : '#3C3C3C',
                borderBottom: activeTab === tab.id ? '2px solid #2DD4C8' : '2px solid transparent',
                marginBottom: '-2px',
                whiteSpace: 'nowrap',
                transition: 'color 150ms',
              }}
            >
              {tab.label}
              {tab.id === 'portfolio' && <span style={{ marginLeft: '6px', fontSize: '10px', fontWeight: 700, background: '#FEF2F2', color: '#DC2626', padding: '1px 5px', borderRadius: '8px', border: '1px solid #FECACA' }}>6</span>}
              {tab.id === 'risk' && DRIFT_ALERTS.filter(a => a.status === 'Open').length > 0 && <span style={{ marginLeft: '6px', fontSize: '10px', fontWeight: 700, background: '#FFFBEB', color: '#D97706', padding: '1px 5px', borderRadius: '8px', border: '1px solid #FDE68A' }}>{DRIFT_ALERTS.filter(a => a.status === 'Open').length}</span>}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'overview' && <OverviewTab clientId={activeClient} />}
        {activeTab === 'portfolio' && <PortfolioTab />}
        {activeTab === 'adoption' && <AdoptionTab />}
        {activeTab === 'value' && <ValueTab />}
        {activeTab === 'risk' && <RiskTab />}
        {activeTab === 'cost' && <CostTab />}
        {activeTab === 'responsible' && <ResponsibleAITab />}
      </div>
    </div>
  )
}

export default function ControlTowerPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: '#3C3C3C' }}>Loading AI Control Tower...</div>}>
      <ControlTowerInner />
    </Suspense>
  )
}
