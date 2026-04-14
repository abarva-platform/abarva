'use client'
import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import AbarvaNav from '@/components/AbarvaNav'
import EngagementProgress from '@/components/EngagementProgress'

const T = {
  bg: '#0D1117', surface: '#161B22', surface2: '#1C2128',
  border: '#21262D', border2: '#30363D',
  text: '#E6EDF3', text2: '#C9D1D9', text3: '#8B949E',
  teal: '#2DD4C8', blue: '#4DA3FF', green: '#6EE7B7',
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

function TabPortfolio() {
  return (
    <div>
      {/* Heat map summary row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '32px' }}>
        {MERIDIAN_INITIATIVES.map(init => (
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
            {MERIDIAN_INITIATIVES.map((init, i) => (
              <tr key={init.id} style={{ borderBottom: i < MERIDIAN_INITIATIVES.length - 1 ? `1px solid ${T.border}` : 'none' }}>
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
          <div style={{ fontSize: '12px', color: T.text3 }}>Total pipeline: 3 initiatives · $146M combined impact</div>
          <div style={{ fontSize: '12px', fontWeight: 700, color: T.teal }}>$0 verified · Tracking begins Month 3</div>
        </div>
      </div>
    </div>
  )
}

function TabDetail() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {MERIDIAN_INITIATIVES.map(init => (
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
  const searchParams = useSearchParams()
  const clientId = searchParams.get('client') || 'meridian'
  const [tab, setTab] = useState<TabId>('portfolio')

  const clientName = clientId === 'firstcapital' ? 'First Capital Financial' : clientId === 'apexretail' ? 'Apex Retail Group' : 'Meridian Health System'
  const isMeridian = clientId === 'meridian'

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: 'Inter, -apple-system, sans-serif' }}>
      <AbarvaNav clientId={clientId} activePage="outcomes" />
      <EngagementProgress />

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
        {isMeridian ? (
          <>
            {tab === 'portfolio' && <TabPortfolio />}
            {tab === 'detail' && <TabDetail />}
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
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#0D1117', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280', fontFamily: 'Inter, sans-serif' }}>Loading...</div>}>
      <OutcomesContent />
    </Suspense>
  )
}
