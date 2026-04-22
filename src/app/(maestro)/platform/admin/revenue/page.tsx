'use client'
import { useState } from 'react'

const T = {
  bg: '#0D1117', surface: '#161B22', surface2: '#1C2128',
  border: '#21262D', border2: '#30363D',
  text: '#E6EDF3', text2: '#C9D1D9', text3: '#8B949E',
  teal: '#14B8A6', blue: '#4DA3FF', green: '#6EE7B7', amber: '#F59E0B', red: '#EF4444',
  purple: '#A78BFA',
}

const STREAMS = [
  {
    id: 'license',
    label: 'Enterprise License',
    badge: 'ACTIVE',
    badgeColor: T.green,
    description: 'Flat annual fee — full platform, unlimited users, named Maestro',
    icon: '◈',
    color: T.teal,
    total: 1_875_000,
    projected: 3_750_000,
    note: '3 design partners × $500–750K avg',
    engagements: [
      { name: 'Meridian Health', fee: 750_000, status: 'Active', renewalDate: 'Apr 2027' },
      { name: 'First Capital Bank', fee: 625_000, status: 'Active', renewalDate: 'Jun 2027' },
      { name: 'Apex Retail Group', fee: 500_000, status: 'Active', renewalDate: 'Jul 2027' },
    ],
  },
  {
    id: 'addon',
    label: 'Solution Add-Ons',
    badge: 'ACTIVE',
    badgeColor: T.green,
    description: 'Maestro-led 8–12 week deployments for specific CXO problems',
    icon: '◇',
    color: T.blue,
    total: 360_000,
    projected: 960_000,
    note: 'Avg $180K × 2 active add-ons (2 pending)',
    engagements: [
      { name: 'Meridian — Prior Auth AI', fee: 180_000, status: 'In flight', renewalDate: 'Jul 2026' },
      { name: 'First Capital — FedNow', fee: 180_000, status: 'Scoping', renewalDate: 'Aug 2026' },
      { name: 'Apex — Demand Forecast', fee: 0, status: 'Pending', renewalDate: '—' },
      { name: 'Meridian — RCM Automation', fee: 0, status: 'Pending', renewalDate: '—' },
    ],
  },
  {
    id: 'referral',
    label: 'Marketplace Referral',
    badge: 'ACTIVE',
    badgeColor: T.green,
    description: 'Disclosed referral on vendor recommendations — 10–15% of Year 1 spend. Never affects score.',
    icon: '◉',
    color: T.amber,
    total: 84_000,
    projected: 420_000,
    note: 'Cohere Health + Finzly closed. 3 pending.',
    engagements: [
      { name: 'Cohere Health → Meridian', fee: 42_000, status: 'Closed', renewalDate: 'Apr 2026' },
      { name: 'Finzly → First Capital', fee: 42_000, status: 'Closed', renewalDate: 'May 2026' },
      { name: 'Databricks → Apex', fee: 0, status: 'Pending decision', renewalDate: '—' },
      { name: 'Gong → First Capital', fee: 0, status: 'Pending decision', renewalDate: '—' },
      { name: 'Cohere Health → Apex', fee: 0, status: 'Scoping', renewalDate: '—' },
    ],
  },
  {
    id: 'outcome',
    label: 'Outcome Fee',
    badge: 'SERIES A UNLOCK',
    badgeColor: T.purple,
    description: '15–20% of verified, baseline-documented savings. Activates once three auditable outcomes are documented.',
    icon: '◎',
    color: T.purple,
    total: 0,
    projected: 4_200_000,
    note: 'Meridian projected: $28M savings → $4.2–5.6M fee',
    engagements: [
      { name: 'Meridian Health (baseline set)', fee: 0, status: 'Tracking', renewalDate: 'Series A' },
      { name: 'First Capital Bank', fee: 0, status: 'Baseline pending', renewalDate: 'Series A' },
      { name: 'Apex Retail Group', fee: 0, status: 'Baseline pending', renewalDate: 'Series A' },
    ],
  },
]

const QUARTERLY = [
  { q: 'Q2 2026', license: 468_750, addon: 90_000, referral: 42_000, outcome: 0 },
  { q: 'Q3 2026', license: 468_750, addon: 135_000, referral: 72_000, outcome: 0 },
  { q: 'Q4 2026', license: 468_750, addon: 180_000, referral: 126_000, outcome: 0 },
  { q: 'Q1 2027', license: 562_500, addon: 225_000, referral: 180_000, outcome: 0 },
]

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n}`
}

function StatusPill({ status }: { status: string }) {
  const color =
    status === 'Active' || status === 'Closed' ? T.green :
    status === 'In flight' ? T.teal :
    status === 'Scoping' ? T.blue :
    status === 'Tracking' ? T.purple :
    T.text3
  return (
    <span style={{ fontSize: '11px', fontWeight: 700, color, background: color + '18', borderRadius: '4px', padding: '2px 8px' }}>
      {status}
    </span>
  )
}

export default function RevenueDashboard() {
  const [activeStream, setActiveStream] = useState<string>('license')
  const stream = STREAMS.find(s => s.id === activeStream)!

  const totalEarned = STREAMS.reduce((sum, s) => sum + s.total, 0)
  const totalProjected = STREAMS.reduce((sum, s) => sum + s.projected, 0)
  const activePlusPending = STREAMS.slice(0, 3).reduce((sum, s) => sum + s.projected, 0)

  const maxQ = Math.max(...QUARTERLY.map(q => q.license + q.addon + q.referral))

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: 'Inter, sans-serif', color: T.text }}>
      {/* Header */}
      <div style={{ background: T.surface, borderBottom: '1px solid ' + T.border, padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <a href="/platform/admin" style={{ fontSize: '13px', color: T.text3, textDecoration: 'none', marginBottom: '4px', display: 'block' }}>← Engagement Hub</a>
          <div style={{ fontSize: '18px', fontWeight: 700 }}>Revenue Dashboard</div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ fontSize: '12px', color: T.text3, background: T.surface2, border: '1px solid ' + T.border2, borderRadius: '6px', padding: '6px 12px' }}>Maestro view only</div>
          <div style={{ fontSize: '12px', color: T.text3 }}>As of Apr 14, 2026</div>
        </div>
      </div>

      <div style={{ maxWidth: '1480px', margin: '0 auto', padding: '32px 24px' }}>

        {/* Portfolio Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
          {[
            { label: 'Earned to Date', value: fmt(totalEarned), sub: '3 active engagements', color: T.teal },
            { label: 'Projected ARR (3 streams)', value: fmt(activePlusPending), sub: 'License + add-ons + referral', color: T.green },
            { label: 'Series A ARR Target', value: '$5.0M', sub: '$5M with 3 case studies', color: T.purple },
            { label: 'Outcome Fee Pipeline', value: fmt(4_200_000), sub: 'Meridian — Series A activation', color: T.purple },
          ].map(card => (
            <div key={card.label} style={{ background: T.surface, border: '1px solid ' + T.border, borderRadius: '12px', padding: '20px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>{card.label}</div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: card.color, marginBottom: '4px' }}>{card.value}</div>
              <div style={{ fontSize: '12px', color: T.text3 }}>{card.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '24px' }}>

          {/* Stream Selector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Revenue Streams</div>
            {STREAMS.map(s => (
              <button
                key={s.id}
                onClick={() => setActiveStream(s.id)}
                style={{
                  background: activeStream === s.id ? s.color + '18' : T.surface,
                  border: '1px solid ' + (activeStream === s.id ? s.color : T.border),
                  borderRadius: '10px',
                  padding: '14px 16px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'all 150ms',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px', color: s.color }}>{s.icon}</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: activeStream === s.id ? s.color : T.text2 }}>{s.label}</span>
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: 800, color: s.badgeColor, background: s.badgeColor + '18', borderRadius: '4px', padding: '2px 6px' }}>{s.badge}</span>
                </div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: s.id === 'outcome' ? T.text3 : s.color }}>
                  {s.id === 'outcome' ? '—' : fmt(s.total)}
                </div>
                <div style={{ fontSize: '11px', color: T.text3, marginTop: '2px' }}>earned · {fmt(s.projected)} projected</div>
              </button>
            ))}
          </div>

          {/* Stream Detail */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Stream Header */}
            <div style={{ background: T.surface, border: '1px solid ' + T.border, borderRadius: '12px', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '20px', color: stream.color }}>{stream.icon}</span>
                    <span style={{ fontSize: '20px', fontWeight: 800, color: T.text }}>{stream.label}</span>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: stream.badgeColor, background: stream.badgeColor + '18', borderRadius: '4px', padding: '3px 8px' }}>{stream.badge}</span>
                  </div>
                  <div style={{ fontSize: '13px', color: T.text3, maxWidth: '520px' }}>{stream.description}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '32px', fontWeight: 800, color: stream.id === 'outcome' ? T.text3 : stream.color }}>
                    {stream.id === 'outcome' ? '—' : fmt(stream.total)}
                  </div>
                  <div style={{ fontSize: '12px', color: T.text3 }}>{fmt(stream.projected)} projected</div>
                </div>
              </div>
              <div style={{ background: T.surface2, border: '1px solid ' + T.border2, borderRadius: '8px', padding: '10px 14px', fontSize: '12px', color: T.text3 }}>
                ◈ {stream.note}
              </div>
              {stream.id === 'outcome' && (
                <div style={{ marginTop: '12px', background: T.purple + '0D', border: '1px solid ' + T.purple + '40', borderRadius: '8px', padding: '12px 16px', fontSize: '13px', color: T.text3 }}>
                  <strong style={{ color: T.purple }}>Series A unlock condition:</strong> Three documented baselines + three verified outcomes. Infrastructure built at seed. Activation trigger: close Series A. Never surface outcome fee language to clients at seed stage.
                </div>
              )}
              {stream.id === 'referral' && (
                <div style={{ marginTop: '12px', background: T.amber + '0D', border: '1px solid ' + T.amber + '40', borderRadius: '8px', padding: '12px 16px', fontSize: '13px', color: T.text3 }}>
                  <strong style={{ color: T.amber }}>Referral disclosure policy:</strong> All referral relationships are disclosed on every recommendation card. Referral status never affects vendor scores — the scoring is public and methodology-documented.
                </div>
              )}
            </div>

            {/* Engagement Breakdown */}
            <div style={{ background: T.surface, border: '1px solid ' + T.border, borderRadius: '12px', padding: '24px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: T.text2, marginBottom: '16px' }}>Engagement Breakdown</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {/* Table header */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 140px 120px', gap: '16px', padding: '8px 12px', fontSize: '11px', fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  <span>Engagement</span>
                  <span>Fee</span>
                  <span>Status</span>
                  <span>Expected</span>
                </div>
                {stream.engagements.map((eng, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 140px 120px', gap: '16px', padding: '12px', background: i % 2 === 0 ? T.surface2 : 'transparent', borderRadius: '6px', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: T.text }}>{eng.name}</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: eng.fee > 0 ? T.green : T.text3 }}>
                      {eng.fee > 0 ? fmt(eng.fee) : '—'}
                    </span>
                    <StatusPill status={eng.status} />
                    <span style={{ fontSize: '12px', color: T.text3 }}>{eng.renewalDate}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quarterly Revenue Trend */}
        <div style={{ marginTop: '24px', background: T.surface, border: '1px solid ' + T.border, borderRadius: '12px', padding: '24px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: T.text2, marginBottom: '4px' }}>Quarterly Revenue — Active Streams Only</div>
          <div style={{ fontSize: '12px', color: T.text3, marginBottom: '20px' }}>License + add-ons + referral. Outcome fee not included until Series A.</div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            {QUARTERLY.map(q => {
              const total = q.license + q.addon + q.referral
              const barH = Math.round((total / maxQ) * 120)
              return (
                <div key={q.q} style={{ textAlign: 'center' }}>
                  <div style={{ height: '140px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', gap: '2px', marginBottom: '8px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: T.teal, marginBottom: '4px' }}>{fmt(total)}</div>
                    <div style={{ width: '48px', display: 'flex', flexDirection: 'column', gap: '1px', alignItems: 'stretch' }}>
                      {/* stacked bar — referral */}
                      <div style={{ height: `${Math.round((q.referral / maxQ) * 120)}px`, background: T.amber + '80', borderRadius: '2px 2px 0 0', minHeight: q.referral > 0 ? '4px' : '0' }} />
                      {/* addon */}
                      <div style={{ height: `${Math.round((q.addon / maxQ) * 120)}px`, background: T.blue + '80', minHeight: q.addon > 0 ? '4px' : '0' }} />
                      {/* license */}
                      <div style={{ height: `${Math.round((q.license / maxQ) * 120)}px`, background: T.teal + '80', borderRadius: '0 0 2px 2px' }} />
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: T.text2 }}>{q.q}</div>
                  <div style={{ fontSize: '10px', color: T.text3, marginTop: '4px' }}>
                    {fmt(q.license)} · {q.addon > 0 ? fmt(q.addon) : '—'} · {q.referral > 0 ? fmt(q.referral) : '—'}
                  </div>
                </div>
              )
            })}
          </div>

          <div style={{ display: 'flex', gap: '20px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid ' + T.border }}>
            {[
              { label: 'License', color: T.teal },
              { label: 'Add-Ons', color: T.blue },
              { label: 'Referral', color: T.amber },
            ].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '10px', height: '10px', background: l.color + '80', borderRadius: '2px' }} />
                <span style={{ fontSize: '11px', color: T.text3 }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Series A Roadmap */}
        <div style={{ marginTop: '24px', background: T.purple + '0D', border: '1px solid ' + T.purple + '30', borderRadius: '12px', padding: '24px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: T.purple, marginBottom: '4px' }}>Series A Roadmap</div>
          <div style={{ fontSize: '13px', color: T.text3, marginBottom: '16px' }}>
            $8M raise at $25M cap → 18 months → $1.5M ARR + 3 design partners + 1 auditable outcome → Series A at $5M ARR / $80–100M pre-money
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            {[
              { label: '3 Design Partners', current: '3 of 3', status: 'done', note: 'Meridian · First Capital · Apex' },
              { label: '$1.5M ARR', current: fmt(totalEarned) + ' earned', status: 'in-progress', note: 'Active 3-stream run-rate tracking' },
              { label: '1 Auditable Outcome', current: 'Baseline set', status: 'in-progress', note: 'Meridian RCM — Q4 2026 verification' },
            ].map(item => (
              <div key={item.label} style={{ background: T.surface, border: '1px solid ' + T.border, borderRadius: '10px', padding: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: item.status === 'done' ? T.green : T.amber, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
                  {item.status === 'done' ? '✓ Complete' : '◌ In Progress'}
                </div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: T.text, marginBottom: '4px' }}>{item.label}</div>
                <div style={{ fontSize: '13px', color: T.teal, marginBottom: '4px' }}>{item.current}</div>
                <div style={{ fontSize: '11px', color: T.text3 }}>{item.note}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
