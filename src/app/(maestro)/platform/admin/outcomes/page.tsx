'use client'
import { useState } from 'react'
import AbarvaNav from '@/components/AbarvaNav'

const S = {
  page: { minHeight: '100vh', background: '#F8FAFC', fontFamily: 'Inter, -apple-system, sans-serif' } as React.CSSProperties,
  card: { background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '24px' } as React.CSSProperties,
  label: { fontSize: '11px', fontWeight: 700, color: '#3C3C3C', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '8px' } as React.CSSProperties,
}

const LINKS = [
  { href: '/platform/admin', label: 'Engagement Hub' },
  { href: '/platform/admin/data-governance', label: 'Data Governance' },
  { href: '/platform/admin/revenue', label: 'Revenue' },
  { href: '/platform/admin/outcomes', label: 'Outcome Tracker', active: true },
]

type TrafficLight = 'green' | 'amber' | 'red'
type Attribution = 'High' | 'Medium' | 'Low'

interface OutcomeMetric {
  id: string
  client: string
  initiative: string
  metric: string
  baseline: string
  baselineNum: number
  current: string
  currentNum: number
  target: string
  targetNum: number
  unit: string
  changeDir: 'down' | 'up'
  status: TrafficLight
  attributionConfidence: Attribution
  measurementSource: string
  outcomeFee: string
  outcomeFeeNum: number
  history: number[]
  commentary: string
}

const OUTCOME_METRICS: OutcomeMetric[] = [
  {
    id: 'm-001', client: 'Meridian Health System', initiative: 'AP Invoice Automation',
    metric: 'Manual Invoice Rate', baseline: '84%', baselineNum: 84, current: '22%', currentNum: 22,
    target: '<15%', targetNum: 15, unit: '%', changeDir: 'down',
    status: 'green', attributionConfidence: 'High',
    measurementSource: 'Esker platform API · AP team verification',
    outcomeFee: '$840K', outcomeFeeNum: 840000,
    history: [84, 71, 58, 42, 32, 22],
    commentary: 'Ahead of target. 62% reduction in 6 months. $4.2M annual savings run rate confirmed.',
  },
  {
    id: 'm-002', client: 'Meridian Health System', initiative: 'Azure Cost Optimization',
    metric: 'Azure Identified Waste', baseline: '$1.8M/yr', baselineNum: 1800000, current: '$420K/yr', currentNum: 420000,
    target: '<$300K/yr', targetNum: 300000, unit: '$', changeDir: 'down',
    status: 'green', attributionConfidence: 'High',
    measurementSource: 'Azure Cost Management API · Automated monthly export',
    outcomeFee: '$672K', outcomeFeeNum: 672000,
    history: [1800000, 1620000, 1240000, 880000, 620000, 420000],
    commentary: 'On track. 77% reduction. 340 VMs right-sized. 3 reserved instance blocks converted.',
  },
  {
    id: 'm-003', client: 'Meridian Health System', initiative: 'Prior Auth Automation',
    metric: 'Prior Auth Approval Time', baseline: '4.2 days', baselineNum: 4.2, current: '4.1 days', currentNum: 4.1,
    target: '<1.8 days', targetNum: 1.8, unit: 'days', changeDir: 'down',
    status: 'amber', attributionConfidence: 'Medium',
    measurementSource: 'Epic scheduling + Cohere Health API',
    outcomeFee: '$5.6M at full outcome', outcomeFeeNum: 5600000,
    history: [4.2, 4.2, 4.2, 4.1, 4.1, 4.1],
    commentary: 'Implementation just started (Week 2). No improvement yet — expected at Month 3. On track per implementation plan.',
  },
  {
    id: 'm-004', client: 'Meridian Health System', initiative: 'Sepsis AI Scale-up',
    metric: 'Hospitals with Sepsis AI Active', baseline: '2', baselineNum: 2, current: '2', currentNum: 2,
    target: '23 hospitals', targetNum: 23, unit: 'hospitals', changeDir: 'up',
    status: 'red', attributionConfidence: 'High',
    measurementSource: 'IT deployment tracker · Epic integration logs',
    outcomeFee: '$4.8M at full scale', outcomeFeeNum: 4800000,
    history: [2, 2, 2, 2, 2, 2],
    commentary: 'Stalled. CDO vacancy (8+ months) is the blocking issue. No MLOps platform. Board intervention required. AbarVa escalated to CIO on March 28.',
  },
  {
    id: 'm-005', client: 'Meridian Health System', initiative: 'Denial Prediction Model',
    metric: 'RCM Denial Rate', baseline: '18.2%', baselineNum: 18.2, current: '18.2%', currentNum: 18.2,
    target: '<12%', targetNum: 12, unit: '%', changeDir: 'down',
    status: 'red', attributionConfidence: 'Low',
    measurementSource: 'Ensemble Health Partners monthly report',
    outcomeFee: '$7.5M at target', outcomeFeeNum: 7500000,
    history: [18.2, 18.2, 18.2, 18.2, 18.2, 18.2],
    commentary: 'Model validated but not deployed. MLOps gap blocking production. No outcome possible until Azure ML Managed Endpoints deployed. Q2 deadline at risk.',
  },
  {
    id: 'm-006', client: 'Apex Retail Group', initiative: 'Einstein Personalization',
    metric: 'Loyalty Program Active Users', baseline: '38%', baselineNum: 38, current: '44%', currentNum: 44,
    target: '60%', targetNum: 60, unit: '%', changeDir: 'up',
    status: 'amber', attributionConfidence: 'Medium',
    measurementSource: 'Salesforce CDP · Marketing Cloud engagement data',
    outcomeFee: '2% of incremental revenue', outcomeFeeNum: 4960000,
    history: [38, 38, 39, 41, 43, 44],
    commentary: 'Identity resolution complete. Activation in progress. On track for Q3 target. Revenue attribution pending 90-day window.',
  },
  {
    id: 'm-007', client: 'First Capital Financial', initiative: 'FedNow API Layer',
    metric: 'FedNow-Connected Customers', baseline: '0%', baselineNum: 0, current: '0%', currentNum: 0,
    target: '100% eligible', targetNum: 100, unit: '%', changeDir: 'up',
    status: 'amber', attributionConfidence: 'Low',
    measurementSource: 'Finzly integration logs · Core banking API',
    outcomeFee: '$360K at go-live', outcomeFeeNum: 360000,
    history: [0, 0, 0, 0, 0, 0],
    commentary: 'Architecture approved. Finzly implementation starting May 1. Go-live targeted Q3 2026. On track per contract.',
  },
]

const MONTHS = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar']

function TrafficLightDot({ status }: { status: TrafficLight }) {
  const colors: Record<TrafficLight, string> = { green: '#059669', amber: '#D97706', red: '#DC2626' }
  const bgs: Record<TrafficLight, string> = { green: '#F0FDF4', amber: '#FFFBEB', red: '#FEF2F2' }
  const borders: Record<TrafficLight, string> = { green: '#A7F3D0', amber: '#FDE68A', red: '#FECACA' }
  const labels: Record<TrafficLight, string> = { green: 'On Track', amber: 'Watch', red: 'At Risk' }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px', background: bgs[status], color: colors[status], border: '1px solid ' + borders[status] }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: colors[status], display: 'inline-block' }} />
      {labels[status]}
    </span>
  )
}

function AttributionBadge({ level }: { level: Attribution }) {
  const cfg: Record<Attribution, { color: string; bg: string; border: string }> = {
    High: { color: '#059669', bg: '#F0FDF4', border: '#A7F3D0' },
    Medium: { color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
    Low: { color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
  }
  const c = cfg[level]
  return <span style={{ fontSize: '11px', fontWeight: 700, padding: '1px 7px', borderRadius: '8px', background: c.bg, color: c.color, border: '1px solid ' + c.border }}>{level} Attribution</span>
}

function MiniChart({ history, changeDir, status }: { history: number[]; changeDir: 'up' | 'down'; status: TrafficLight }) {
  const min = Math.min(...history)
  const max = Math.max(...history)
  const range = max - min || 1
  const pcts = history.map(v => ((v - min) / range) * 36)
  const color = status === 'green' ? '#059669' : status === 'amber' ? '#D97706' : '#DC2626'
  return (
    <svg width="64" height="40" style={{ display: 'block' }}>
      <polyline
        points={pcts.map((p, i) => `${i * 12.8},${changeDir === 'down' ? p : 36 - p}`).join(' ')}
        fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round"
      />
      {pcts.map((p, i) => (
        <circle key={i} cx={i * 12.8} cy={changeDir === 'down' ? p : 36 - p} r="2" fill={i === pcts.length - 1 ? color : '#E2E8F0'} />
      ))}
    </svg>
  )
}

export default function AdminOutcomes() {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [clientFilter, setClientFilter] = useState<string>('all')

  const clients = [...new Set(OUTCOME_METRICS.map(m => m.client))]
  const filtered = clientFilter === 'all' ? OUTCOME_METRICS : OUTCOME_METRICS.filter(m => m.client === clientFilter)

  const totalFeeAtRisk = OUTCOME_METRICS.reduce((s, m) => s + m.outcomeFeeNum, 0)
  const feeLocked = OUTCOME_METRICS.filter(m => m.status === 'green').reduce((s, m) => s + m.outcomeFeeNum, 0)
  const greenCount = OUTCOME_METRICS.filter(m => m.status === 'green').length
  const redCount = OUTCOME_METRICS.filter(m => m.status === 'red').length

  return (
    <div style={S.page}>
      <AbarvaNav activePage="admin" />

      {/* Subnav */}
      <div style={{ display: 'flex', gap: '8px', padding: '12px 32px', background: '#FFFFFF', borderBottom: '1px solid #E2E8F0', overflowX: 'auto' }}>
        {LINKS.map(l => (
          <a key={l.href} href={l.href} style={{ padding: '6px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, textDecoration: 'none', background: l.active ? '#1E3A5F' : '#F8FAFC', color: l.active ? '#FFFFFF' : '#475569', border: '1px solid #E2E8F0', flexShrink: 0 }}>{l.label}</a>
        ))}
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 48px' }}>
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Outcome Tracker</h1>
          <p style={{ fontSize: '14px', color: '#3C3C3C' }}>Every committed initiative tracked against baseline. AbarVa fees tied to verified results.</p>
        </div>

        {/* Summary scorecards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
          {[
            { label: 'Total Fee at Outcome', value: '$' + (totalFeeAtRisk / 1000000).toFixed(1) + 'M', sub: 'Across all active initiatives', color: '#3C3C3C' },
            { label: 'Fees Earned (Partial)', value: '$' + ((feeLocked * 0.3) / 1000000).toFixed(1) + 'M', sub: 'From green-status outcomes', color: '#059669' },
            { label: 'On Track', value: greenCount + ' of ' + OUTCOME_METRICS.length, sub: 'Initiatives meeting trajectory', color: '#059669' },
            { label: 'At Risk', value: redCount + ' of ' + OUTCOME_METRICS.length, sub: 'Requires action', color: '#DC2626' },
          ].map(m => (
            <div key={m.label} style={S.card}>
              <div style={S.label}>{m.label}</div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: m.color }}>{m.value}</div>
              <div style={{ fontSize: '12px', color: '#3C3C3C', marginTop: '4px' }}>{m.sub}</div>
            </div>
          ))}
        </div>

        {/* Client filter */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          {['all', ...clients].map(c => (
            <button key={c} onClick={() => setClientFilter(c)} style={{ padding: '6px 14px', fontSize: '12px', fontWeight: 600, borderRadius: '20px', border: '1px solid #E2E8F0', cursor: 'pointer', background: clientFilter === c ? '#F0FDF4' : '#FFFFFF', color: clientFilter === c ? '#059669' : '#3C3C3C', borderColor: clientFilter === c ? '#14B8A6' : '#E2E8F0' }}>
              {c === 'all' ? 'All Clients' : c.split(' ').slice(0, 2).join(' ')}
            </button>
          ))}
        </div>

        {/* Metrics table */}
        <div style={{ ...S.card, overflowX: 'auto', marginBottom: '20px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '900px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #E2E8F0' }}>
                {['', 'Initiative', 'Metric', 'Baseline', 'Current', 'Target', 'Change', 'Trend', 'Status', 'Attribution', 'Fee at Outcome'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 8px', color: '#3C3C3C', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => {
                const change = m.changeDir === 'down'
                  ? m.currentNum - m.baselineNum
                  : m.currentNum - m.baselineNum
                const changePct = m.baselineNum !== 0 ? Math.round((Math.abs(change) / m.baselineNum) * 100) : 0
                const improving = m.changeDir === 'down' ? change < 0 : change > 0
                const isExpanded = expandedId === m.id

                return [
                  <tr key={m.id} onClick={() => setExpandedId(isExpanded ? null : m.id)} style={{ borderBottom: isExpanded ? 'none' : '1px solid #F1F5F9', cursor: 'pointer' }}>
                    <td style={{ padding: '12px 8px', width: '20px' }}>
                      <span style={{ fontSize: '10px', color: '#888888' }}>{isExpanded ? '▼' : '▶'}</span>
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      <div style={{ fontSize: '12px', color: '#3C3C3C' }}>{m.client.split(' ').slice(0, 2).join(' ')}</div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B' }}>{m.initiative}</div>
                    </td>
                    <td style={{ padding: '12px 8px', color: '#3C3C3C' }}>{m.metric}</td>
                    <td style={{ padding: '12px 8px', color: '#3C3C3C' }}>{m.baseline}</td>
                    <td style={{ padding: '12px 8px', fontWeight: 700, color: '#1E293B' }}>{m.current}</td>
                    <td style={{ padding: '12px 8px', color: '#3C3C3C' }}>{m.target}</td>
                    <td style={{ padding: '12px 8px' }}>
                      {change === 0 ? (
                        <span style={{ fontSize: '12px', color: '#888888' }}>No change</span>
                      ) : (
                        <span style={{ fontSize: '13px', fontWeight: 700, color: improving ? '#059669' : '#DC2626' }}>
                          {improving ? '↓' : '→'} {changePct}%
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      <MiniChart history={m.history} changeDir={m.changeDir} status={m.status} />
                    </td>
                    <td style={{ padding: '12px 8px' }}><TrafficLightDot status={m.status} /></td>
                    <td style={{ padding: '12px 8px' }}><AttributionBadge level={m.attributionConfidence} /></td>
                    <td style={{ padding: '12px 8px', fontWeight: 700, color: '#2563EB' }}>{m.outcomeFee}</td>
                  </tr>,
                  isExpanded && (
                    <tr key={m.id + '-detail'} style={{ borderBottom: '1px solid #F1F5F9', background: '#F8FAFC' }}>
                      <td />
                      <td colSpan={10} style={{ padding: '16px 8px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                          <div>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: '#3C3C3C', textTransform: 'uppercase', marginBottom: '6px' }}>Commentary</div>
                            <div style={{ fontSize: '13px', color: '#3C3C3C', lineHeight: 1.5 }}>{m.commentary}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: '#3C3C3C', textTransform: 'uppercase', marginBottom: '6px' }}>Monthly Trend</div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              {MONTHS.map((mo, i) => (
                                <div key={mo} style={{ textAlign: 'center', flex: 1 }}>
                                  <div style={{ fontSize: '11px', fontWeight: 600, color: m.status === 'green' ? '#059669' : m.status === 'amber' ? '#D97706' : '#DC2626' }}>
                                    {typeof m.history[i] === 'number' && m.history[i] >= 1000000 ? '$' + (m.history[i] / 1000000).toFixed(1) + 'M' : m.history[i]}
                                    {m.unit === '%' ? '%' : ''}
                                  </div>
                                  <div style={{ fontSize: '10px', color: '#888888' }}>{mo}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: '#3C3C3C', textTransform: 'uppercase', marginBottom: '6px' }}>Measurement</div>
                            <div style={{ fontSize: '13px', color: '#3C3C3C', marginBottom: '8px' }}>{m.measurementSource}</div>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: '#3C3C3C', textTransform: 'uppercase', marginBottom: '4px' }}>Attribution Note</div>
                            <div style={{ fontSize: '12px', color: '#3C3C3C' }}>
                              {m.attributionConfidence === 'High' ? 'Direct causal link confirmed. No significant confounding factors.' : m.attributionConfidence === 'Medium' ? 'Likely attribution. Partial confounding from external factors.' : 'Causal link unconfirmed. Multiple factors in play. Monitoring only.'}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ),
                ].filter(Boolean)
              })}
            </tbody>
          </table>
        </div>

        {/* Outcome fee projection */}
        <div style={S.card}>
          <div style={{ marginBottom: '16px' }}>
            <div style={S.label}>Outcome Fee Projection</div>
            <div style={{ fontSize: '13px', color: '#3C3C3C' }}>Series A activation trigger: 3 documented outcomes with verified baselines</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {[
              { label: 'Total Fee Potential', value: '$' + (totalFeeAtRisk / 1000000).toFixed(1) + 'M', sub: 'Across all 7 tracked initiatives', color: '#3C3C3C' },
              { label: 'Docs Required for Series A', value: '2 more', sub: 'AP Automation + Azure Cost fully documented', color: '#4DA3FF' },
              { label: 'Projected Q3 2026 Fee', value: '$1.5M', sub: 'Two green outcomes × 15% fee rate', color: '#059669' },
            ].map(m => (
              <div key={m.label} style={{ padding: '16px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <div style={S.label}>{m.label}</div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: m.color }}>{m.value}</div>
                <div style={{ fontSize: '12px', color: '#3C3C3C', marginTop: '4px' }}>{m.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
