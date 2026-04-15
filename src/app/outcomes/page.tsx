'use client'
import { useState, Suspense } from 'react'
import AbarvaNav from '@/components/AbarvaNav'
import { useClientContext, ALL_CLIENTS } from '@/lib/use-client-context'

const T = {
  bg: '#060A12', surface: '#0D1520', surface2: '#162030',
  border: '#1C2D45', border2: '#2D3748',
  text: '#EFF6FF', text2: 'rgba(255,255,255,0.75)', text3: 'rgba(255,255,255,0.75)',
  teal: '#2DD4C8', blue: '#6366F1', green: '#10B981',
  amber: '#F59E0B', red: '#EF4444', purple: '#A78BFA',
}

type TabId = 'portfolio' | 'detail' | 'verification' | 'forecast' | 'board'

const TABS: { id: TabId; label: string; num: number }[] = [
  { id: 'portfolio', label: 'Portfolio Overview', num: 1 },
  { id: 'detail', label: 'Initiative Detail', num: 2 },
  { id: 'verification', label: 'Outcome Verification', num: 3 },
  { id: 'forecast', label: 'Forecast', num: 4 },
  { id: 'board', label: 'Board Report', num: 5 },
]

const MERIDIAN_INITIATIVES = [
  {
    id: 'prior-auth',
    title: 'Prior Auth Automation',
    category: 'Revenue Cycle',
    status: 'on-track' as const,
    baseline: '18.2%',
    current: '18.2%',
    target: '12.0%',
    metric: 'Denial Rate',
    dollarImpact: '$37.6M',
    dollarGap: '$37.6M remaining',
    attributionConf: 91,
    week: 1,
    totalWeeks: 24,
    owner: 'Robert Chen, CIO',
    vendor: 'Cohere Health (pending)',
    commentary: 'Week 1: Baseline confirmed. Cohere Health RFP issued. Ensemble penalty clause formally invoked — $8M leverage in negotiation.',
    history: [18.2, 17.9, 17.6, 17.2, 16.8, 16.2],
  },
  {
    id: 'cdo-hire',
    title: 'CDO Executive Hire',
    category: 'Leadership',
    status: 'at-risk' as const,
    baseline: 'Vacant',
    current: 'Search active',
    target: 'Hired by Month 5',
    metric: 'Search Progress',
    dollarImpact: '$94M',
    dollarGap: '$94M blocked',
    attributionConf: 72,
    week: 1,
    totalWeeks: 20,
    owner: 'Sarah Mitchell, CEO',
    vendor: 'Korn Ferry (engaged)',
    commentary: 'Search firm engaged Week 2. JD drafted. CDO vacancy blocking AI governance and data strategy — $94M pipeline depends on this hire.',
    history: [0, 10, 10, 25, 40, 60],
  },
  {
    id: 'epic-optimization',
    title: 'Epic Optimization Sprint',
    category: 'Clinical Systems',
    status: 'behind' as const,
    baseline: '58/100',
    current: '58/100',
    target: '78/100 by Month 6',
    metric: 'KLAS Optimization Score',
    dollarImpact: '$12M',
    dollarGap: '$12M behind',
    attributionConf: 68,
    week: 1,
    totalWeeks: 24,
    owner: 'Dr. Patricia Osei, CMIO',
    vendor: 'Tegria / Epic PS',
    commentary: 'Epic optimization requires CDO hire to proceed. Physician burnout score 6.2/10 linked to workflow inefficiency. 7-year optimization gap requires structured sprint.',
    history: [58, 58, 59, 60, 62, 64],
  },
]

const ARCTURUS_INITIATIVES = [
  {
    id: 'ai-governance',
    title: 'AI Governance Framework',
    category: 'Compliance',
    status: 'at-risk' as const,
    baseline: 'None',
    current: 'Vendor Selected',
    target: 'MAS FEAT Compliant by Month 4',
    metric: 'Compliance Status',
    dollarImpact: '$35M',
    dollarGap: '$35M penalty exposure',
    attributionConf: 86,
    week: 1,
    totalWeeks: 16,
    owner: 'Interim CDO',
    vendor: 'Collibra (pending)',
    commentary: 'Week 1: Interim CDO appointed. Collibra FEAT template selected. MAS model inventory sprint begins Week 3. 4 months overdue — 16-week remediation programme started.',
    history: [0, 5, 10, 18, 28, 40],
  },
  {
    id: 'cdo-hire',
    title: 'CDO Executive Appointment',
    category: 'Leadership',
    status: 'at-risk' as const,
    baseline: 'Vacant (11 months)',
    current: 'Interim appointed',
    target: 'Permanent CDO by Month 5',
    metric: 'Leadership Coverage',
    dollarImpact: '$94M',
    dollarGap: '$94M AI pipeline blocked',
    attributionConf: 78,
    week: 1,
    totalWeeks: 20,
    owner: 'Victoria Hargreaves, CEO',
    vendor: 'Odgers Berndtson (interim) + Korn Ferry (permanent)',
    commentary: 'Interim CDO in seat Week 2. Permanent search launched Week 1 via Korn Ferry. All AI initiatives unblocked once interim is in role.',
    history: [0, 0, 20, 40, 60, 65],
  },
  {
    id: 'stress-testing',
    title: 'Daily Aladdin Stress Testing',
    category: 'Risk & Compliance',
    status: 'on-track' as const,
    baseline: 'Monthly',
    current: 'Monthly',
    target: 'Daily by Week 6',
    metric: 'Stress Test Frequency',
    dollarImpact: '$18M',
    dollarGap: 'SEC compliance gap',
    attributionConf: 92,
    week: 1,
    totalWeeks: 6,
    owner: 'Raj Malhotra, CIO',
    vendor: 'BlackRock Aladdin (configuration only)',
    commentary: 'Configuration-only change — no new vendor required. SEC daily requirement confirmed. Aladdin configuration sprint scoped for Weeks 2–6. Highest-confidence initiative in the programme.',
    history: [1, 1, 1, 1, 1, 1],
  },
]

const NEXORA_INITIATIVES = [
  {
    id: 'einstein-activation',
    title: 'Einstein Personalisation Activation',
    category: 'Digital Commerce',
    status: 'on-track' as const,
    baseline: 'Not Activated',
    current: 'Owner Appointed',
    target: 'Live for 28.4M Members by Week 8',
    metric: 'Activation Status',
    dollarImpact: '$248M',
    dollarGap: '$248M idle revenue',
    attributionConf: 88,
    week: 1,
    totalWeeks: 8,
    owner: 'Sophie Laurent, CMO',
    vendor: 'Salesforce Professional Services',
    commentary: 'CEO appointed CMO as single owner Day 1. Salesforce PS engagement letter signed Week 2. Pilot for 5M loyalty members live by Week 4, full 28.4M rollout by Week 8.',
    history: [0, 10, 10, 30, 55, 70],
  },
  {
    id: 'o9-completion',
    title: 'o9 Demand Forecasting Completion',
    category: 'Supply Chain',
    status: 'at-risk' as const,
    baseline: '40% (NA only)',
    current: '40%',
    target: '100% by Month 9',
    metric: 'Implementation Progress',
    dollarImpact: '$180M',
    dollarGap: '$900M inventory trapped',
    attributionConf: 78,
    week: 1,
    totalWeeks: 36,
    owner: 'Priya Krishnamurthy, COO',
    vendor: 'o9 Solutions (fixed-fee completion)',
    commentary: 'Fixed-fee completion contract under negotiation. COO named as single owner. EMEA sprint starts Week 4. NA model serves as template for remaining 4 regions.',
    history: [40, 40, 40, 42, 44, 46],
  },
  {
    id: 'fulfilment-cost',
    title: 'E-Commerce Fulfilment Cost Reduction',
    category: 'Operations',
    status: 'on-track' as const,
    baseline: '$18.40/order',
    current: '$18.40/order',
    target: '$11.20/order by Month 9',
    metric: 'Fulfilment Cost Per Order',
    dollarImpact: '$269M',
    dollarGap: '$615M drag (fulfilment + returns)',
    attributionConf: 76,
    week: 1,
    totalWeeks: 36,
    owner: 'Kirsten Mueller, CFO',
    vendor: 'Shipbob + Manhattan Associates',
    commentary: 'Carrier consolidation RFP issued Week 1. Return friction pilot scoped for 3 markets. CFO mandated margin positive before year-end — this programme is the path.',
    history: [18.4, 18.4, 18.3, 18.2, 18.0, 17.8],
  },
]

type Initiative = typeof MERIDIAN_INITIATIVES[number]

const statusColor = { 'on-track': T.green, 'at-risk': T.amber, 'behind': T.red }
const statusLabel = { 'on-track': 'On Track', 'at-risk': 'At Risk', 'behind': 'Behind' }

function MiniSparkline({ history, status }: { history: number[]; status: string }) {
  const min = Math.min(...history)
  const max = Math.max(...history)
  const range = max - min || 1
  const w = 80, h = 32
  const pts = history.map((v, i) => {
    const x = (i / (history.length - 1)) * w
    const y = h - ((v - min) / range) * (h - 4) - 2
    return `${x},${y}`
  }).join(' ')
  const col = status === 'on-track' ? T.green : status === 'at-risk' ? T.amber : T.red
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline points={pts} fill="none" stroke={col} strokeWidth="1.5" strokeLinejoin="round" opacity="0.8" />
      <circle cx={history.length > 1 ? ((history.length - 1) / (history.length - 1)) * w : 0} cy={h - ((history[history.length - 1] - min) / range) * (h - 4) - 2} r="3" fill={col} />
    </svg>
  )
}

function TabPortfolio({ initiatives }: { initiatives: Initiative[] }) {
  return (
    <div>
      {/* Heat map summary row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '32px' }}>
        {initiatives.map(init => (
          <div key={init.id} style={{ background: T.surface, border: `1px solid ${statusColor[init.status]}40`, borderRadius: '12px', padding: '20px', position: 'relative' as const }}>
            <div style={{ position: 'absolute' as const, top: '16px', right: '16px', width: '8px', height: '8px', borderRadius: '50%', background: statusColor[init.status] }} />
            <div style={{ fontSize: '10px', fontWeight: 700, color: T.text3, textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: '6px' }}>{init.category}</div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: T.text, marginBottom: '4px' }}>{init.title}</div>
            <div style={{ fontSize: '22px', fontWeight: 900, color: statusColor[init.status], letterSpacing: '-0.02em', marginBottom: '4px' }}>{init.dollarImpact}</div>
            <div style={{ fontSize: '11px', color: T.text3, marginBottom: '12px' }}>{init.dollarGap}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '10px', color: T.text3, marginBottom: '2px' }}>Week {init.week} of {init.totalWeeks}</div>
                <div style={{ width: '120px', height: '4px', background: T.border2, borderRadius: '2px' }}>
                  <div style={{ width: `${(init.week / init.totalWeeks) * 100}%`, height: '100%', background: statusColor[init.status], borderRadius: '2px' }} />
                </div>
              </div>
              <MiniSparkline history={init.history} status={init.status} />
            </div>
          </div>
        ))}
      </div>

      {/* Portfolio heat map table */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: T.text2 }}>ALL INITIATIVES — DOLLAR GAPS</div>
          <div style={{ fontSize: '11px', color: T.text3 }}>Meridian Health System · Week 1</div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
          <thead>
            <tr style={{ background: T.surface2 }}>
              {['Initiative', 'Category', 'Baseline', 'Current', 'Target', 'Impact', 'Status', 'Owner'].map(h => (
                <th key={h} style={{ padding: '10px 14px', fontSize: '10px', fontWeight: 700, color: T.text3, textAlign: 'left' as const, textTransform: 'uppercase' as const, letterSpacing: '0.06em', borderBottom: `1px solid ${T.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {initiatives.map((init, i) => (
              <tr key={init.id} style={{ borderBottom: i < initiatives.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: 600, color: T.text }}>{init.title}</td>
                <td style={{ padding: '12px 14px', fontSize: '12px', color: T.text3 }}>{init.category}</td>
                <td style={{ padding: '12px 14px', fontSize: '12px', color: T.text3 }}>{init.baseline}</td>
                <td style={{ padding: '12px 14px', fontSize: '12px', fontWeight: 700, color: T.text }}>{init.current}</td>
                <td style={{ padding: '12px 14px', fontSize: '12px', color: T.teal }}>{init.target}</td>
                <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: 700, color: statusColor[init.status] }}>{init.dollarImpact}</td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ padding: '3px 10px', borderRadius: '100px', background: statusColor[init.status] + '20', border: `1px solid ${statusColor[init.status]}40`, fontSize: '11px', fontWeight: 700, color: statusColor[init.status] }}>
                    {statusLabel[init.status]}
                  </span>
                </td>
                <td style={{ padding: '12px 14px', fontSize: '11px', color: T.text3 }}>{init.owner.split(',')[0]}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ padding: '14px 20px', borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '12px', color: T.text3 }}>Total pipeline: {initiatives.length} initiatives · tracking active</div>
          <div style={{ fontSize: '12px', fontWeight: 700, color: T.teal }}>$0 verified · Tracking begins Month 3</div>
        </div>
      </div>
    </div>
  )
}

function TabDetail({ initiatives }: { initiatives: Initiative[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {initiatives.map(init => (
        <div key={init.id} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '12px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
            <div>
              <div style={{ fontSize: '10px', fontWeight: 700, color: T.text3, textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: '6px' }}>{init.category}</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: T.text, marginBottom: '4px' }}>{init.title}</div>
              <div style={{ fontSize: '12px', color: T.text3 }}>Owner: {init.owner} · Vendor: {init.vendor}</div>
            </div>
            <span style={{ padding: '4px 14px', borderRadius: '100px', background: statusColor[init.status] + '20', border: `1px solid ${statusColor[init.status]}40`, fontSize: '12px', fontWeight: 700, color: statusColor[init.status], flexShrink: 0 }}>
              {statusLabel[init.status]}
            </span>
          </div>
          {/* Sparkline */}
          <div style={{ background: T.bg, borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: T.text3, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '8px' }}>{init.metric} Trend</div>
            <svg width="100%" height="56" viewBox="0 0 480 56" preserveAspectRatio="none">
              <line x1="0" y1="50" x2="480" y2="50" stroke={T.border} strokeWidth="1" />
              <line x1="0" y1="6" x2="480" y2="6" stroke={T.teal} strokeWidth="1" strokeDasharray="4,4" opacity="0.4" />
              {init.history.map((v, i) => {
                const min = Math.min(...init.history), max = Math.max(...init.history), range = max - min || 1
                const x = (i / (init.history.length - 1)) * 480
                const y = 50 - ((v - min) / range) * 44
                return i === 0 ? null : (
                  <line key={i}
                    x1={(( i - 1) / (init.history.length - 1)) * 480}
                    y1={50 - ((init.history[i-1] - min) / range) * 44}
                    x2={x} y2={y}
                    stroke={statusColor[init.status]} strokeWidth="2" />
                )
              })}
              {init.history.map((v, i) => {
                const min = Math.min(...init.history), max = Math.max(...init.history), range = max - min || 1
                const x = (i / (init.history.length - 1)) * 480
                const y = 50 - ((v - min) / range) * 44
                return <circle key={i} cx={x} cy={y} r={i === 0 ? 4 : 3} fill={i === 0 ? statusColor[init.status] : statusColor[init.status] + '80'} />
              })}
              <text x="4" y="5" fontSize="8" fill={T.teal}>Target: {init.target}</text>
              <text x="4" y="16" fontSize="8" fill={T.text}>Baseline: {init.baseline}</text>
            </svg>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '16px' }}>
            {[
              { label: 'Baseline', value: init.baseline, color: T.text3 },
              { label: 'Current', value: init.current, color: T.text },
              { label: 'Target', value: init.target, color: T.teal },
              { label: 'Dollar Impact', value: init.dollarImpact, color: statusColor[init.status] },
            ].map((m, i) => (
              <div key={i} style={{ padding: '12px', background: T.bg, borderRadius: '8px', border: `1px solid ${T.border}` }}>
                <div style={{ fontSize: '10px', color: T.text3, marginBottom: '4px' }}>{m.label}</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: m.color }}>{m.value}</div>
              </div>
            ))}
          </div>
          <div style={{ background: T.bg, borderRadius: '8px', padding: '14px', border: `1px solid ${T.border}` }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: T.text3, textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: '6px' }}>Week 1 Commentary</div>
            <div style={{ fontSize: '12px', color: T.text2, lineHeight: 1.6 }}>{init.commentary}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

function TabVerification() {
  return (
    <div>
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '12px', overflow: 'hidden', marginBottom: '20px' }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.border}` }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: T.text2 }}>OUTCOME VERIFICATION — BASELINE vs CURRENT vs TARGET</div>
          <div style={{ fontSize: '11px', color: T.text3, marginTop: '4px' }}>Verification methodology: Independent data pull · AbarVa does not self-report savings</div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
          <thead>
            <tr style={{ background: T.surface2 }}>
              {['Initiative', 'Metric', 'Baseline', 'Current', 'Delta', 'Target', 'Attribution', 'Source'].map(h => (
                <th key={h} style={{ padding: '10px 14px', fontSize: '10px', fontWeight: 700, color: T.text3, textAlign: 'left' as const, textTransform: 'uppercase' as const, letterSpacing: '0.06em', borderBottom: `1px solid ${T.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              {
                title: 'Prior Auth Automation',
                metric: 'Denial Rate',
                baseline: '18.2%', current: '18.2%', delta: '0.0 pts', target: '12.0%',
                attribution: '91%', attributionColor: T.green,
                source: 'Ensemble RCM extract',
                status: 'baseline-only',
              },
              {
                title: 'CDO Executive Hire',
                metric: 'Search Progress',
                baseline: 'Vacant', current: 'Search Active', delta: '+1 step', target: 'Hired',
                attribution: '72%', attributionColor: T.amber,
                source: 'Korn Ferry portal',
                status: 'in-progress',
              },
              {
                title: 'Epic Optimization',
                metric: 'KLAS Score',
                baseline: '58/100', current: '58/100', delta: '0 pts', target: '78/100',
                attribution: '68%', attributionColor: T.amber,
                source: 'Epic MyChart analytics',
                status: 'baseline-only',
              },
            ].map((row, i) => (
              <tr key={i} style={{ borderBottom: i < 2 ? `1px solid ${T.border}` : 'none' }}>
                <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: 600, color: T.text }}>{row.title}</td>
                <td style={{ padding: '12px 14px', fontSize: '12px', color: T.text3 }}>{row.metric}</td>
                <td style={{ padding: '12px 14px', fontSize: '12px', color: T.text3 }}>{row.baseline}</td>
                <td style={{ padding: '12px 14px', fontSize: '12px', fontWeight: 700, color: T.text }}>{row.current}</td>
                <td style={{ padding: '12px 14px', fontSize: '12px', color: T.text3 }}>{row.delta}</td>
                <td style={{ padding: '12px 14px', fontSize: '12px', color: T.teal }}>{row.target}</td>
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: row.attributionColor }}>{row.attribution}</span>
                    <div style={{ width: '40px', height: '4px', background: T.border2, borderRadius: '2px' }}>
                      <div style={{ width: row.attribution, height: '100%', background: row.attributionColor, borderRadius: '2px' }} />
                    </div>
                  </div>
                </td>
                <td style={{ padding: '12px 14px', fontSize: '11px', color: T.text3 }}>{row.source}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ padding: '14px 20px', background: T.surface2, borderTop: `1px solid ${T.border}` }}>
          <div style={{ fontSize: '11px', color: T.text3 }}>
            Attribution confidence = probability that measured change is caused by AbarVa-guided intervention vs external factors.
            Verified savings calculation begins Month 3 when first baseline-to-actual delta is confirmed by independent data pull.
          </div>
        </div>
      </div>

      {/* Attribution methodology */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '12px', padding: '20px' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: T.text3, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '16px' }}>ATTRIBUTION METHODOLOGY</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {[
            { step: '1', title: 'Baseline Locked', desc: 'Week 1: Independent data pull establishes baseline. Client signs off. No retroactive adjustment allowed.', color: T.teal },
            { step: '2', title: 'Intervention Mapped', desc: 'Every AbarVa recommendation is tagged to a specific metric. Attribution only claimed for mapped interventions.', color: T.blue },
            { step: '3', title: 'Delta Verified', desc: 'Month 3+: Change measured against locked baseline. Third-party data source required for attribution claim.', color: T.green },
          ].map(m => (
            <div key={m.step} style={{ padding: '16px', background: T.bg, borderRadius: '8px', border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: '20px', fontWeight: 900, color: m.color, marginBottom: '6px' }}>{m.step}</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: T.text, marginBottom: '6px' }}>{m.title}</div>
              <div style={{ fontSize: '11px', color: T.text3, lineHeight: 1.5 }}>{m.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function TabForecast() {
  return (
    <div>
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '12px', padding: '24px', marginBottom: '20px' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: T.text3, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '16px' }}>YEAR 1 SAVINGS FORECAST — THREE SCENARIOS</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {[
            { label: 'Conservative', savings: '$72M', fee: '$10.8M', prob: '85%', color: T.text3, note: 'Prior auth only, CDO hire delayed' },
            { label: 'Base Case', savings: '$146M', fee: '$21.9M', prob: '65%', color: T.teal, note: 'All 3 initiatives on track' },
            { label: 'Upside', savings: '$218M', fee: '$32.7M', prob: '35%', color: T.green, note: 'Ahead of schedule on denial rate' },
          ].map(s => (
            <div key={s.label} style={{ padding: '20px', background: T.bg, borderRadius: '10px', border: `1px solid ${s.color}40` }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: s.color, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '8px' }}>{s.label}</div>
              <div style={{ fontSize: '26px', fontWeight: 900, color: s.color, letterSpacing: '-0.02em', marginBottom: '2px' }}>{s.savings}</div>
              <div style={{ fontSize: '12px', color: T.text3, marginBottom: '12px' }}>client savings · AbarVa fee: {s.fee}</div>
              <div style={{ fontSize: '11px', color: T.text3, marginBottom: '8px' }}>{s.note}</div>
              <div style={{ fontSize: '11px', color: T.text3 }}>Probability: <span style={{ fontWeight: 700, color: s.color }}>{s.prob}</span></div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '12px', padding: '20px' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: T.text3, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '12px' }}>OUTCOME FEE PROJECTION (SERIES A ACTIVATION)</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          {[
            { label: 'Month 3 First Verification', value: '$0', sub: 'Baseline period', color: T.text3 },
            { label: 'Month 6 Partial Savings', value: '$4.2M', sub: 'Fee at 15%', color: T.amber },
            { label: 'Month 12 Full Year', value: '$21.9M', sub: 'Base case fee', color: T.teal },
            { label: 'Series A Trigger', value: '3 verified', sub: 'Documented outcomes', color: T.green },
          ].map((m, i) => (
            <div key={i} style={{ padding: '14px', background: T.bg, borderRadius: '8px', border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: '10px', color: T.text3, marginBottom: '4px', lineHeight: 1.3 }}>{m.label}</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: m.color }}>{m.value}</div>
              <div style={{ fontSize: '10px', color: T.text3, marginTop: '2px' }}>{m.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function TabBoard() {
  return (
    <div>
      {/* Board-ready header */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '12px', padding: '32px', marginBottom: '20px', textAlign: 'center' as const }}>
        <div style={{ fontSize: '10px', fontWeight: 700, color: T.teal, textTransform: 'uppercase' as const, letterSpacing: '0.12em', marginBottom: '12px' }}>BOARD REPORT — AI TRANSFORMATION OUTCOMES</div>
        <div style={{ fontSize: '24px', fontWeight: 800, color: T.text, marginBottom: '4px' }}>Meridian Health System</div>
        <div style={{ fontSize: '13px', color: T.text3 }}>Week 1 of 24 · Prepared by AbarVa · April 2026</div>
      </div>

      {/* Outcome cards — no activity metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
        {[
          { title: 'Revenue Recovery', value: '$94M', sub: 'RCM initiative — baseline locked', status: 'Tracking', color: T.blue },
          { title: 'Operating Margin', value: '$94M', sub: 'Board target: 4.0% vs 1.8%', status: 'Tracking', color: T.amber },
          { title: 'Year 1 Fee Projection', value: '$21.9M', sub: 'At base case $146M savings', status: 'Projected', color: T.teal },
        ].map((card, i) => (
          <div key={i} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '12px', padding: '24px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: card.color, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '8px' }}>{card.title}</div>
            <div style={{ fontSize: '32px', fontWeight: 900, color: T.text, letterSpacing: '-0.03em', marginBottom: '4px' }}>{card.value}</div>
            <div style={{ fontSize: '12px', color: T.text3, marginBottom: '8px' }}>{card.sub}</div>
            <span style={{ padding: '3px 10px', borderRadius: '100px', background: card.color + '20', border: `1px solid ${card.color}40`, fontSize: '11px', fontWeight: 700, color: card.color }}>
              {card.status}
            </span>
          </div>
        ))}
      </div>

      {/* Board narrative */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '12px', padding: '24px', marginBottom: '20px' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: T.text3, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '16px' }}>BOARD SUMMARY</div>
        {[
          { heading: 'What we committed to', body: 'Three initiatives with a combined $146M savings potential. Baselines locked Week 1. Outcome fee activates at Month 3 when first delta is verified.' },
          { heading: 'Where we are', body: 'Week 1 complete. All baselines confirmed. Prior auth RFP issued with Ensemble leverage invoked. CDO search firm engaged. Epic optimization sprint scoped.' },
          { heading: 'What the board needs to know', body: 'No activity metrics in this report. Zero savings verified to date — tracking begins Month 3. The $21.9M fee projection is base-case only. Conservative scenario: $10.8M. AbarVa fee is zero until savings are independently verified.' },
        ].map((item, i) => (
          <div key={i} style={{ marginBottom: i < 2 ? '16px' : '0', paddingBottom: i < 2 ? '16px' : '0', borderBottom: i < 2 ? `1px solid ${T.border}` : 'none' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: T.text, marginBottom: '6px' }}>{item.heading}</div>
            <div style={{ fontSize: '13px', color: T.text3, lineHeight: 1.6 }}>{item.body}</div>
          </div>
        ))}
      </div>

      {/* Export */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <button style={{ padding: '10px 20px', borderRadius: '8px', background: T.teal, color: T.bg, fontSize: '13px', fontWeight: 700, border: 'none', cursor: 'pointer' }}>
          Export Board PDF
        </button>
        <button style={{ padding: '10px 20px', borderRadius: '8px', background: T.surface, color: T.text2, fontSize: '13px', fontWeight: 600, border: `1px solid ${T.border}`, cursor: 'pointer' }}>
          Export to PowerPoint
        </button>
      </div>
    </div>
  )
}

function OutcomesContent() {
  const { clientId } = useClientContext()
  const [tab, setTab] = useState<TabId>('portfolio')
  const [role, setRole] = useState('Maestro')

  const clientMeta = ALL_CLIENTS.find(c => c.id === clientId)
  const clientVertical = clientMeta?.vertical || 'Healthcare'
  const clientName = clientMeta?.name || 'Meridian Health System'

  const clientIndustry = clientVertical === 'Financial Services' ? 'FinServ'
    : clientVertical === 'Retail' ? 'Retail'
    : 'Healthcare'
  const ROLES = clientIndustry === 'FinServ'
    ? ['CIO', 'CFO', 'CRO', 'CEO', 'Maestro']
    : clientIndustry === 'Retail'
    ? ['CIO', 'CFO', 'CMO', 'COO', 'CEO', 'Maestro']
    : ['CIO', 'CFO', 'CMIO', 'COO', 'CEO', 'Maestro']

  const initiatives: Initiative[] = clientId === 'arcturus' ? ARCTURUS_INITIATIVES
    : clientId === 'meridian' ? MERIDIAN_INITIATIVES
    : []

  const hasInitiatives = initiatives.length > 0

  return (
    <div style={{minHeight:'100vh',background:'#060A12',fontFamily:'"DM Sans",sans-serif',color:'#EFF6FF'}}>
      <AbarvaNav activePage="outcomes" />

      {/* Header */}
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: '20px 40px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: T.teal, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '6px' }}>Outcome Intelligence</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: T.text, letterSpacing: '-0.02em', marginBottom: '2px' }}>{clientName}</div>
            <div style={{ fontSize: '12px', color: T.text3 }}>Week 1 of 24 · Fee calculation begins Month 3 · $146M pipeline</div>
          </div>
          <div style={{ display: 'flex', gap: '20px', textAlign: 'right' as const }}>
            {[
              { label: 'Verified Savings', value: '$0', color: T.text3 },
              { label: 'Total Pipeline', value: '$146M', color: T.teal },
              { label: 'Projected Fee', value: '$21.9M', color: T.green },
            ].map((m, i) => (
              <div key={i}>
                <div style={{ fontSize: '10px', color: T.text3, marginBottom: '2px' }}>{m.label}</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: m.color }}>{m.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Role tabs strip */}
      <div style={{ background: '#060E18', borderBottom: `1px solid ${T.border}`, padding: '0 40px', display: 'flex', alignItems: 'center', gap: '2px', height: '38px' }}>
        {ROLES.map(r => {
          const isActive = role === r
          return (
            <button key={r} onClick={() => setRole(r)}
              style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '10px', letterSpacing: '0.06em', textTransform: 'uppercase' as const, padding: '4px 14px', borderRadius: '5px', border: 'none', cursor: 'pointer', height: '28px', background: isActive ? T.teal : 'transparent', color: isActive ? T.bg : 'rgba(255,255,255,0.75)', fontWeight: isActive ? 700 : 400 }}
              onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.color = T.text }}
              onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.75)' }}
            >{r}</button>
          )
        })}
        <div style={{ marginLeft: 'auto', fontFamily: '"JetBrains Mono", monospace', fontSize: '9px', color: '#374151', letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>
          Viewing as <span style={{ color: T.teal, fontWeight: 600 }}>{role}</span>
        </div>
      </div>

      {/* Role lens */}
      <div style={{ background: `${T.teal}08`, borderBottom: `1px solid ${T.border}`, padding: '12px 40px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '24px' }}>
          {(() => {
            const ROLE_CAT: Record<string, string[]> = {
              CIO:    ['platform', 'tech', 'data', 'ai', 'system'],
              CFO:    ['cost', 'contract', 'rcm', 'revenue', 'financial'],
              CMO:    ['customer', 'einstein', 'crm', 'marketing', 'revenue'],
              COO:    ['ops', 'supply', 'fulfil', 'workforce', 'scheduling'],
              CRO:    ['risk', 'governance', 'compliance', 'stress'],
              CMIO:   ['clinical', 'prior', 'patient', 'physician'],
              CEO:    [],
              Maestro: [],
            }
            const cats = ROLE_CAT[role] || []
            const scopeInits = cats.length === 0 ? initiatives
              : initiatives.filter(init =>
                  cats.some(k => init.title.toLowerCase().includes(k) || (init.category || '').toLowerCase().includes(k))
                )
            const onTrack = scopeInits.filter(i => i.status === 'on-track').length
            const parseDollar = (s: string) => parseFloat(s.replace(/[^0-9.]/g, '')) * (s.includes('M') ? 1_000_000 : s.includes('K') ? 1_000 : 1)
            const bestDollar = scopeInits.length > 0 ? scopeInits[0] : initiatives[0] || null
            const totalParsed = scopeInits.reduce((s, i) => s + parseDollar(i.dollarImpact as string || '$0'), 0)
            const pipelineStr = totalParsed >= 1_000_000 ? `$${(totalParsed/1_000_000).toFixed(0)}M` : totalParsed > 0 ? `$${totalParsed.toLocaleString()}` : '$146M'
            return [
              { label: 'Initiatives in Scope', value: scopeInits.length > 0 ? `${scopeInits.length} active` : 'All initiatives' },
              { label: role === 'CFO' ? 'Revenue at Stake' : 'Pipeline Value', value: pipelineStr },
              { label: 'Top Initiative', value: bestDollar ? bestDollar.title : initiatives[0]?.title || '—', sub: onTrack + ' on track' },
            ].map((item, i) => (
              <div key={i}>
                <div style={{ fontSize: '9px', fontWeight: 700, color: T.teal, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '3px' }}>{item.label}</div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: T.text }}>{item.value}</div>
                {item.sub && <div style={{ fontSize: '10px', color: T.teal, fontWeight: 600, marginTop: '2px' }}>{item.sub}</div>}
              </div>
            ))
          })()}
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 40px', display: 'flex', gap: '0' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{
                padding: '12px 20px', background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '13px', fontWeight: tab === t.id ? 700 : 500,
                color: tab === t.id ? T.teal : T.text3,
                borderBottom: tab === t.id ? `2px solid ${T.teal}` : '2px solid transparent',
                display: 'flex', alignItems: 'center', gap: '6px',
              }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: tab === t.id ? T.teal : T.text3, opacity: 0.6 }}>{t.num}</span>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '28px 40px' }}>
        {hasInitiatives ? (
          <>
            {tab === 'portfolio' && <TabPortfolio initiatives={initiatives} />}
            {tab === 'detail' && <TabDetail initiatives={initiatives} />}
            {tab === 'verification' && <TabVerification />}
            {tab === 'forecast' && <TabForecast />}
            {tab === 'board' && <TabBoard />}
          </>
        ) : (
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '12px', padding: '40px', textAlign: 'center' as const }}>
            <div style={{ fontSize: '14px', color: T.text3, marginBottom: '8px' }}>{clientName}</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: T.text, marginBottom: '8px' }}>Engagement Week 1 — Baseline in Progress</div>
            <div style={{ fontSize: '13px', color: T.text3 }}>Outcome tracking begins Month 3 once baselines are confirmed.</div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function OutcomesPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#060A12', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.75)', fontFamily: '"DM Sans", sans-serif' }}>Loading...</div>}>
      <OutcomesContent />
    </Suspense>
  )
}
