'use client'
import { useState, useEffect } from 'react'
import AbarvaNav from '@/components/AbarvaNav'

const T = {
  bg: '#0D1117',
  surface: '#161B22',
  surface2: '#1C2128',
  border: '#21262D',
  border2: '#30363D',
  text: '#E6EDF3',
  text2: '#C9D1D9',
  text3: '#8B949E',
  teal: '#2DD4C8',
  blue: '#4DA3FF',
  green: '#6EE7B7',
  amber: '#F59E0B',
  red: '#EF4444',
  purple: '#A78BFA',
}

const LINKS = [
  { href: '/admin', label: 'Engagement Hub', active: true },
  { href: '/admin/new-client', label: 'New Engagement' },
  { href: '/admin/playbook', label: 'Playbook' },
  { href: '/admin/data', label: 'Data Loader' },
  { href: '/admin/approvals', label: 'Approvals' },
  { href: '/admin/outcomes', label: 'Outcome Tracker' },
  { href: '/admin/intelligence', label: 'Intelligence' },
  { href: '/admin/revenue', label: 'Revenue' },
]

const ENGAGEMENTS = [
  {
    id: 'meridian',
    name: 'Meridian Health System',
    industry: 'Healthcare',
    confidence: 94,
    completeness: 87,
    phase: 'AI Strategy',
    lastActivity: '2 hours ago',
    pending: 2,
    milestone: 'AI Strategy Board Presentation',
    milestoneDate: 'Apr 18',
    value: '$292M',
    color: T.blue,
    metrics: [
      { label: 'Operating Margin', value: '1.8%', target: 'Target 4.0%', alert: true },
      { label: 'RCM Denial Rate', value: '18.2%', target: 'SLA 12%', alert: true },
      { label: 'Prior Auth Days', value: '4.2d', target: 'Peer 1.8d', alert: true },
    ],
    plan: { license: '$625K', solutions: 2, maestroHrsRemaining: 18, maestroHrsTotal: 40 },
  },
  {
    id: 'firstcapital',
    name: 'First Capital Financial',
    industry: 'Financial Services',
    confidence: 88,
    completeness: 72,
    phase: 'Diagnose',
    lastActivity: '1 day ago',
    pending: 1,
    milestone: 'FedNow Architecture Review',
    milestoneDate: 'Apr 22',
    value: '$198M',
    color: T.purple,
    metrics: [
      { label: 'FedNow Live', value: 'No', target: '68% peers live', alert: true },
      { label: 'Cost-to-Income', value: '68%', target: 'Target 55%', alert: true },
      { label: 'Mobile Rating', value: '2.8', target: 'Threshold 3.8', alert: true },
    ],
    plan: { license: '$500K', solutions: 1, maestroHrsRemaining: 28, maestroHrsTotal: 40 },
  },
  {
    id: 'apexretail',
    name: 'Apex Retail Group',
    industry: 'Retail',
    confidence: 86,
    completeness: 68,
    phase: 'Justify',
    lastActivity: '3 hours ago',
    pending: 0,
    milestone: 'Einstein Activation Business Case',
    milestoneDate: 'Apr 15',
    value: '$624M',
    color: T.green,
    metrics: [
      { label: 'Einstein Active', value: 'No', target: '$248M idle', alert: true },
      { label: 'Inventory Turns', value: '4.2x', target: 'Benchmark 6.8x', alert: true },
      { label: 'Cart Abandon', value: '72%', target: 'Benchmark 58%', alert: true },
    ],
    plan: { license: '$750K', solutions: 3, maestroHrsRemaining: 8, maestroHrsTotal: 40 },
  },
]

const ACTIVITY = [
  { time: '2h', action: 'AI Strategy Step 4 completed', client: 'Meridian', type: 'product' },
  { time: '3h', action: 'Einstein business case exported', client: 'Apex Retail', type: 'export' },
  { time: '5h', action: 'Q2 financials uploaded', client: 'First Capital', type: 'data' },
  { time: '8h', action: 'Regulatory alert — CMS Prior Auth rule', client: 'Meridian', type: 'alert' },
  { time: '1d', action: 'FedNow architecture review scheduled', client: 'First Capital', type: 'milestone' },
  { time: '1d', action: 'Contradiction map reviewed by Marcus Webb', client: 'Meridian', type: 'client' },
]

const ALERTS = [
  { label: 'CMS Prior Auth mandate — Jan 2026', color: T.red },
  { label: 'First Capital OCC exam — Q2 2026', color: T.amber },
  { label: 'Apex SAP ECC EOS — 2027', color: T.amber },
  { label: 'Meridian MA Stars deadline — Sep 2025', color: T.red },
]

function ConfidenceRing({ value, color, size = 52 }: { value: number; color: string; size?: number }) {
  const r = (size / 2) - 5
  const circ = 2 * Math.PI * r
  const dash = circ * (value / 100)
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={T.border2} strokeWidth="4" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="4"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 1s ease' }}
      />
    </svg>
  )
}

function ActivityDot({ type }: { type: string }) {
  const c: Record<string, string> = { product: T.blue, export: T.green, data: T.purple, alert: T.red, milestone: T.teal, client: T.amber }
  return <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: c[type] ?? T.text3, flexShrink: 0, marginTop: '5px', display: 'block' }} />
}

export default function AdminHub() {
  const totalPending = ENGAGEMENTS.reduce((s, e) => s + e.pending, 0)
  const [alertIdx, setAlertIdx] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setAlertIdx(i => (i + 1) % ALERTS.length), 4000)
    return () => clearInterval(t)
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: 'Inter, -apple-system, sans-serif', color: T.text }}>
      <AbarvaNav clientId="meridian" activePage="admin" />

      {/* Subnav */}
      <div style={{ background: T.surface, borderBottom: '1px solid ' + T.border, padding: '0 24px', display: 'flex', gap: '0', overflowX: 'auto' }}>
        {LINKS.map(link => (
          <a key={link.href} href={link.href} style={{ display: 'block', padding: '0 16px', height: '44px', lineHeight: '44px', fontSize: '13px', fontWeight: link.active ? 700 : 500, textDecoration: 'none', color: link.active ? T.teal : T.text3, borderBottom: link.active ? '2px solid ' + T.teal : '2px solid transparent', whiteSpace: 'nowrap' }}>
            {link.label}
            {link.label === 'Approvals' && totalPending > 0 && (
              <span style={{ marginLeft: '6px', background: T.red, color: '#fff', borderRadius: '10px', fontSize: '10px', fontWeight: 800, padding: '1px 5px' }}>{totalPending}</span>
            )}
          </a>
        ))}
      </div>

      {/* Zone 1 — Command Header */}
      <div style={{ background: T.surface2, borderBottom: '1px solid ' + T.border, padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: T.text3, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '2px' }}>Anand Sundaram · Maestro</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '18px', fontWeight: 800, color: T.text }}>Engagement Hub</span>
            <span style={{ fontSize: '11px', fontWeight: 700, background: '#0D4A3A', color: T.green, border: '1px solid ' + T.green + '40', borderRadius: '4px', padding: '2px 8px' }}>3 ACTIVE</span>
            {totalPending > 0 && <span style={{ fontSize: '11px', fontWeight: 700, background: '#3B1515', color: T.red, border: '1px solid ' + T.red + '40', borderRadius: '4px', padding: '2px 8px' }}>{totalPending} PENDING</span>}
          </div>
        </div>

        {/* Portfolio metrics */}
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          {[
            { label: 'Portfolio Value', value: '$1.65B', color: T.teal },
            { label: 'Avg Confidence', value: '89%', color: T.blue },
            { label: 'Intelligence Score', value: '84/100', color: T.green },
          ].map((m, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: T.text3, marginBottom: '2px' }}>{m.label}</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: m.color }}>{m.value}</div>
            </div>
          ))}
        </div>

        <a href="/admin/new-client" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: T.teal, color: '#0D1117', textDecoration: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '13px', fontWeight: 800, flexShrink: 0, whiteSpace: 'nowrap' }}>
          + New Engagement
        </a>
      </div>

      {/* Zone 2 + 3 */}
      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px', display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px', alignItems: 'start' }}>

        {/* Zone 2 — Engagement Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: T.text3, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Active Engagements</div>
          {ENGAGEMENTS.map(eng => (
            <div key={eng.id} style={{ background: T.surface, border: '1px solid ' + T.border, borderLeft: '4px solid ' + eng.color, borderRadius: '12px', padding: '20px 24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '20px', alignItems: 'start', marginBottom: '16px' }}>
                {/* Confidence ring */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <div style={{ position: 'relative', width: '52px', height: '52px' }}>
                    <ConfidenceRing value={eng.confidence} color={eng.color} size={52} />
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: T.text }}>{eng.confidence}%</span>
                    </div>
                  </div>
                  <span style={{ fontSize: '9px', color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Confidence</span>
                </div>

                {/* Name + metrics */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '16px', fontWeight: 700, color: T.text }}>{eng.name}</span>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: eng.color, background: eng.color + '15', border: '1px solid ' + eng.color + '30', borderRadius: '4px', padding: '1px 6px' }}>{eng.phase.toUpperCase()}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: T.text3, marginBottom: '12px' }}>{eng.industry} · Last: {eng.lastActivity}</div>

                  {/* 3 live metrics */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    {eng.metrics.map((m, i) => (
                      <div key={i} style={{ background: T.surface2, border: '1px solid ' + (m.alert ? T.red + '30' : T.border), borderRadius: '6px', padding: '8px 10px' }}>
                        <div style={{ fontSize: '10px', color: T.text3, marginBottom: '2px' }}>{m.label}</div>
                        <div style={{ fontSize: '15px', fontWeight: 700, color: m.alert ? T.red : T.text }}>{m.value}</div>
                        <div style={{ fontSize: '10px', color: T.text3 }}>{m.target}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Value + action buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: T.teal }}>{eng.value}</div>
                    <div style={{ fontSize: '10px', color: T.text3 }}>value identified</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%', minWidth: '120px' }}>
                    <a href={`/diagnose?client=${eng.id}`} style={{ display: 'block', padding: '6px 12px', background: eng.color, color: '#0D1117', textDecoration: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 700, textAlign: 'center' }}>Open →</a>
                    <a href={`/brief?client=${eng.id}`} style={{ display: 'block', padding: '6px 12px', background: T.surface2, color: T.text, textDecoration: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, textAlign: 'center', border: '1px solid ' + T.border2 }}>Brief →</a>
                    <a href={`/outcomes?client=${eng.id}`} style={{ display: 'block', padding: '6px 12px', background: T.surface2, color: T.green, textDecoration: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, textAlign: 'center', border: '1px solid ' + T.green + '30' }}>Outcomes →</a>
                    {eng.pending > 0 && <a href="/admin/approvals" style={{ display: 'block', padding: '6px 12px', background: T.red + '15', color: T.red, textDecoration: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 700, textAlign: 'center', border: '1px solid ' + T.red + '30' }}>{eng.pending} pending</a>}
                  </div>
                </div>
              </div>

              {/* Completeness bar + milestone + plan */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', paddingTop: '14px', borderTop: '1px solid ' + T.border }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '10px', color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Data Completeness</span>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: T.text2 }}>{eng.completeness}%</span>
                  </div>
                  <div style={{ height: '4px', background: T.border2, borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: eng.completeness + '%', background: eng.completeness > 80 ? T.green : eng.completeness > 60 ? T.amber : T.red, borderRadius: '2px', transition: 'width 1s ease' }} />
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: T.text3, marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Next Milestone</div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: T.text }}>{eng.milestone}</div>
                  <div style={{ fontSize: '11px', color: T.amber }}>{eng.milestoneDate}</div>
                </div>
              </div>

              {/* Engagement plan */}
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', paddingTop: '12px', marginTop: '12px', borderTop: '1px solid ' + T.border, fontSize: '11px', color: T.text3 }}>
                <span>License: <strong style={{ color: T.teal }}>{eng.plan.license}</strong></span>
                <span>·</span>
                <span>Solutions: <strong style={{ color: T.text }}>{eng.plan.solutions}</strong></span>
                <span>·</span>
                <span>Maestro hrs: <strong style={{ color: eng.plan.maestroHrsRemaining < 10 ? T.red : T.text }}>{eng.plan.maestroHrsRemaining}/{eng.plan.maestroHrsTotal}</strong> remaining</span>
              </div>
            </div>
          ))}
        </div>

        {/* Zone 3 — Right Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Portfolio summary */}
          <div style={{ background: T.surface, border: '1px solid ' + T.border, borderRadius: '12px', padding: '16px' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: T.text3, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '12px' }}>Portfolio Summary</div>
            {[
              { label: 'Total value identified', value: '$1.65B', color: T.teal },
              { label: 'Active engagements', value: '3', color: T.blue },
              { label: 'Avg confidence', value: '89%', color: T.green },
              { label: 'Pending approvals', value: String(totalPending), color: totalPending > 0 ? T.red : T.green },
            ].map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < 3 ? '1px solid ' + T.border : 'none' }}>
                <span style={{ fontSize: '12px', color: T.text3 }}>{m.label}</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: m.color }}>{m.value}</span>
              </div>
            ))}
          </div>

          {/* Regulatory alert ticker */}
          <div style={{ background: T.surface, border: '1px solid ' + T.amber + '40', borderRadius: '12px', padding: '12px 16px' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: T.amber, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>Regulatory Alerts</div>
            <div style={{ minHeight: '40px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: ALERTS[alertIdx].color, flexShrink: 0 }} />
              <span style={{ fontSize: '12px', color: T.text2 }}>{ALERTS[alertIdx].label}</span>
            </div>
            <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
              {ALERTS.map((_, i) => (
                <span key={i} style={{ width: '6px', height: '2px', borderRadius: '1px', background: i === alertIdx ? T.amber : T.border2 }} />
              ))}
            </div>
          </div>

          {/* Approvals queue */}
          {totalPending > 0 && (
            <div style={{ background: T.surface, border: '1px solid ' + T.red + '30', borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: T.red, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '12px' }}>Approvals Queue</div>
              {[
                { item: 'Vendor comparison — Finzly vs Fiserv', client: 'First Capital', action: 'Review' },
                { item: 'AI investment roadmap export', client: 'Meridian', action: 'Approve' },
              ].slice(0, totalPending).map((a, i) => (
                <div key={i} style={{ padding: '8px 0', borderBottom: i < totalPending - 1 ? '1px solid ' + T.border : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: T.text, marginBottom: '2px' }}>{a.item}</div>
                    <div style={{ fontSize: '11px', color: T.text3 }}>{a.client}</div>
                  </div>
                  <a href="/admin/approvals" style={{ fontSize: '11px', fontWeight: 700, color: T.teal, textDecoration: 'none', background: T.teal + '15', border: '1px solid ' + T.teal + '30', borderRadius: '4px', padding: '3px 8px', whiteSpace: 'nowrap' }}>{a.action}</a>
                </div>
              ))}
            </div>
          )}

          {/* Activity feed */}
          <div style={{ background: T.surface, border: '1px solid ' + T.border, borderRadius: '12px', padding: '16px' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: T.text3, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '12px' }}>Activity Feed</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {ACTIVITY.map((act, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <ActivityDot type={act.type} />
                  <div>
                    <div style={{ fontSize: '12px', color: T.text2, lineHeight: 1.4 }}>{act.action}</div>
                    <div style={{ fontSize: '11px', color: T.text3 }}>{act.client} · {act.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
