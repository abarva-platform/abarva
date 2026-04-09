'use client'
import { useState } from 'react'

const SECTIONS = [
  { id: 'problem', label: 'The Problem' },
  { id: 'moat', label: 'Why Not General AI' },
  { id: 'clients', label: 'Live Client Economics' },
  { id: 'revenue', label: 'Revenue Model' },
  { id: 'compounding', label: 'The Compounding Moat' },
  { id: 'seed', label: 'Seed Round' },
]

const CLIENTS = [
  {
    id: 'meridian', name: 'Meridian Health System',
    industry: 'Healthcare · 23 Hospitals · $11.2B Revenue',
    tier: 'Enterprise', platformFee: 500000,
    savingsRealized: 28000000, outcomeFee: 4200000,
    totalYear1: 4700000, roi: 5.25, payback: 8.2,
    consultingAvoided: 4000000,
    color: '#1B4FD8',
    finding: 'The RCM vendor contract guarantees a 12% denial rate. Actual rate: 18.2%. That is $8M in contractual penalties — never once enforced in three years.',
    wow: 'How did it know about the penalty clause before the first meeting?',
    metrics: [
      { label: 'Operating Margin', value: '1.8%', target: 'Target 4.0%', bad: true },
      { label: 'RCM Denial Rate', value: '18.2%', target: 'Contract SLA: 12%', bad: true },
      { label: 'AI Pilots Scaled', value: '0 of 6', target: '24 months of effort', bad: true },
      { label: 'Epic Optimization', value: '58/100', target: 'Benchmark: 80+', bad: false },
    ],
  },
  {
    id: 'firstcapital', name: 'First Capital Financial',
    industry: 'Regional Bank · $18B Assets · $1.84B Revenue',
    tier: 'Growth', platformFee: 350000,
    savingsRealized: 12000000, outcomeFee: 1800000,
    totalYear1: 2150000, roi: 4.9, payback: 10.4,
    consultingAvoided: 2500000,
    color: '#6D28D9',
    finding: 'Real-time payments infrastructure is not live. 68% of peer institutions are live. Three commercial clients have formally inquired about alternatives in the past 90 days.',
    wow: 'How did it know the exact peer benchmark and deposit risk exposure?',
    metrics: [
      { label: 'Cost-to-Income', value: '68%', target: 'Benchmark: 61%', bad: true },
      { label: 'Digital Adoption', value: '41%', target: 'Benchmark: 67%', bad: true },
      { label: 'Core Banking Age', value: '22 years', target: 'Critical: 20yr', bad: true },
      { label: 'AML False Positives', value: '78%', target: 'Benchmark: 25%', bad: true },
    ],
  },
  {
    id: 'apexretail', name: 'Apex Retail Group',
    industry: 'Omnichannel Retail · 800 Stores · $12.4B Revenue',
    tier: 'Enterprise', platformFee: 500000,
    savingsRealized: 248000000, outcomeFee: 37200000,
    totalYear1: 37700000, roi: 22.2, payback: 2.8,
    consultingAvoided: 3500000,
    color: '#047857',
    finding: 'The personalization engine has been in the existing software license for 14 months. Never activated. $248M annual revenue opportunity. Activation cost: $800K. Time to value: 6 weeks.',
    wow: 'How did it know the tool was purchased but sitting idle — before anyone said a word?',
    metrics: [
      { label: 'Operating Margin', value: '3.8%', target: 'Target: 6.0%', bad: true },
      { label: 'Cart Abandonment', value: '72%', target: 'Benchmark: 58%', bad: true },
      { label: 'Loyalty Active Rate', value: '42%', target: 'Benchmark: 68%', bad: true },
      { label: 'Forecast Accuracy', value: '62%', target: 'Benchmark: 84%', bad: true },
    ],
  },
]

const TIERS = [
  { name: 'Starter', price: '$200K', clients: 40, color: '#374151',
    features: ['Diagnose', 'AI Strategy', 'Justify', '1 Maestro — 4 hrs/month', 'Quarterly outcome review'],
    best: 'First engagement. Proof of value.' },
  { name: 'Growth', price: '$350K', clients: 40, color: '#1B4FD8', featured: true,
    features: ['All Starter features', 'Select', 'Maestro Admin', '1 Maestro — 10 hrs/month', 'Monthly outcome tracking', 'Vendor negotiation support'],
    best: 'Active transformation program.' },
  { name: 'Enterprise', price: '$500K', clients: 20, color: '#6D28D9',
    features: ['All Growth features', 'Transform and Track', 'Procurement intelligence', '2 Maestros — Unlimited hours', 'Weekly outcome review', 'Board presentation support'],
    best: 'Multi-year transformation partner.' },
]

function fmt(n: number) {
  if (n >= 1000000000) return '$' + (n/1e9).toFixed(1) + 'B'
  if (n >= 1000000) return '$' + (n/1e6).toFixed(1) + 'M'
  if (n >= 1000) return '$' + (n/1e3).toFixed(0) + 'K'
  return '$' + n.toLocaleString()
}

export default function InvestorPage() {
  const [section, setSection] = useState('problem')
  const [clientIdx, setClientIdx] = useState(0)
  const client = CLIENTS[clientIdx]
  const platformARR = 40*200000 + 40*350000 + 20*500000
  const totalY1 = platformARR + 24000000

  const T = {
    page: { minHeight: '100vh', background: '#FAFAFA', fontFamily: "'DM Sans', -apple-system, sans-serif", color: '#111827' } as React.CSSProperties,
    nav: { background: '#FFFFFF', borderBottom: '1px solid #E5E7EB', height: '60px', display: 'flex', alignItems: 'center', padding: '0 40px', justifyContent: 'space-between', position: 'sticky' as const, top: 0, zIndex: 50 } as React.CSSProperties,
    sidebar: { width: '240px', background: '#FFFFFF', borderRight: '1px solid #E5E7EB', padding: '32px 20px', position: 'sticky' as const, top: '60px', height: 'calc(100vh - 60px)', overflowY: 'auto' as const, flexShrink: 0 } as React.CSSProperties,
    content: { flex: 1, padding: '48px 56px', maxWidth: '840px' } as React.CSSProperties,
    label: { fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#6B7280', marginBottom: '8px', display: 'block' } as React.CSSProperties,
    h1: { fontSize: '40px', fontWeight: 700, lineHeight: 1.1, color: '#111827', marginBottom: '16px', letterSpacing: '-0.02em' } as React.CSSProperties,
    h2: { fontSize: '28px', fontWeight: 700, lineHeight: 1.2, color: '#111827', marginBottom: '12px', letterSpacing: '-0.01em' } as React.CSSProperties,
    body: { fontSize: '16px', lineHeight: 1.75, color: '#4B5563', marginBottom: '32px', maxWidth: '640px' } as React.CSSProperties,
    card: { background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '24px' } as React.CSSProperties,
    statCard: { background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px' } as React.CSSProperties,
    tag: (color: string) => ({ display: 'inline-block', fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' as const, padding: '3px 10px', borderRadius: '100px', background: color + '15', color }) as React.CSSProperties,
    divider: { height: '1px', background: '#F3F4F6', margin: '32px 0' } as React.CSSProperties,
  }

  return (
    <div style={T.page}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* NAV */}
      <nav style={T.nav}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '32px', height: '32px', background: '#111827', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontSize: '14px', fontWeight: 700 }}>A</span>
          </div>
          <span style={{ fontSize: '16px', fontWeight: 600, color: '#111827', letterSpacing: '-0.01em' }}>Abarva</span>
          <span style={{ fontSize: '12px', color: '#9CA3AF', padding: '2px 10px', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '100px' }}>Investor Overview · Confidential</span>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <a href="/diagnose?client=meridian" style={{ padding: '8px 18px', borderRadius: '8px', background: '#111827', color: 'white', textDecoration: 'none', fontSize: '13px', fontWeight: 600, letterSpacing: '-0.01em' }}>Healthcare Demo</a>
          <a href="/diagnose?client=apexretail" style={{ padding: '8px 18px', borderRadius: '8px', background: '#047857', color: 'white', textDecoration: 'none', fontSize: '13px', fontWeight: 600, letterSpacing: '-0.01em' }}>Retail Demo</a>
          <a href="/" style={{ fontSize: '13px', color: '#6B7280', textDecoration: 'none', marginLeft: '8px' }}>← Platform</a>
        </div>
      </nav>

      <div style={{ display: 'flex' }}>

        {/* SIDEBAR */}
        <aside style={T.sidebar}>
          {/* Key metrics */}
          <div style={{ marginBottom: '32px' }}>
            {[
              { label: 'TAM', value: '$200B', sub: 'Enterprise transformation' },
              { label: 'Year 1 Revenue', value: fmt(totalY1), sub: '100 clients · conservative' },
              { label: 'Seed Ask', value: '$10–15M', sub: '5 → 100 clients' },
              { label: 'Time to Value', value: '2 hours', sub: 'vs 16 weeks traditional' },
            ].map((m, i) => (
              <div key={i} style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#9CA3AF', marginBottom: '2px' }}>{m.label}</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#111827', letterSpacing: '-0.02em', lineHeight: 1.1 }}>{m.value}</div>
                <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '2px' }}>{m.sub}</div>
              </div>
            ))}
          </div>

          <div style={{ height: '1px', background: '#F3F4F6', marginBottom: '20px' }} />

          {/* Section nav */}
          <div style={{ marginBottom: '32px' }}>
            {SECTIONS.map(s => (
              <button key={s.id} onClick={() => setSection(s.id)}
                style={{ width: '100%', textAlign: 'left', padding: '9px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: section === s.id ? 600 : 400, cursor: 'pointer', border: 'none', background: section === s.id ? '#F3F4F6' : 'transparent', color: section === s.id ? '#111827' : '#6B7280', marginBottom: '2px', transition: 'all 0.12s', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {section === s.id && <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#111827', flexShrink: 0, display: 'block' }} />}
                {s.label}
              </button>
            ))}
          </div>

          <div style={{ height: '1px', background: '#F3F4F6', marginBottom: '20px' }} />

          {/* Demos */}
          <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#9CA3AF', marginBottom: '12px' }}>Live Demos</div>
          {[
            { label: 'Healthcare CIO', href: '/diagnose?client=meridian', color: '#1B4FD8' },
            { label: 'Retail CIO', href: '/diagnose?client=apexretail', color: '#047857' },
            { label: 'Financial Services', href: '/diagnose?client=firstcapital', color: '#6D28D9' },
          ].map((d, i) => (
            <a key={i} href={d.href} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, textDecoration: 'none', color: d.color, background: d.color + '08', marginBottom: '6px', border: '1px solid ' + d.color + '20' }}>
              {d.label}
              <span style={{ fontSize: '12px' }}>→</span>
            </a>
          ))}
        </aside>

        {/* CONTENT */}
        <main style={T.content}>

          {/* THE PROBLEM */}
          {section === 'problem' && (
            <div>
              <span style={T.label}>The Problem</span>
              <h1 style={T.h1}>$200B spent on transformation consulting. Outcomes are almost never tracked.</h1>
              <p style={T.body}>Every large enterprise spends $50–200M on transformation programs. Consultants leave. Knowledge walks out the door. The next engagement starts from zero. Nobody is accountable for whether it worked.</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderRadius: '12px', overflow: 'hidden', border: '1px solid #E5E7EB', marginBottom: '40px' }}>
                <div style={{ padding: '28px', background: '#FEF2F2', borderRight: '1px solid #FECACA' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#DC2626', marginBottom: '20px' }}>Traditional Consulting</div>
                  {[
                    ['Time to first insight', '16 weeks'],
                    ['Cost per engagement', '$3–5M'],
                    ['Data foundation', 'Interviews and surveys'],
                    ['Benchmarks', '18-month-old industry data'],
                    ['Accountability', 'None — paid regardless'],
                    ['Knowledge retained', 'Walks out the door'],
                    ['Updates when things change', 'New engagement required'],
                  ].map(([k, v], i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '8px 0', borderBottom: '1px solid #FECACA' }}>
                      <span style={{ fontSize: '13px', color: '#6B7280' }}>{k}</span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#DC2626' }}>{v}</span>
                    </div>
                  ))}
                </div>
                <div style={{ padding: '28px', background: '#F0FDF4', borderLeft: '1px solid #A7F3D0' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#059669', marginBottom: '20px' }}>Abarva</div>
                  {[
                    ['Time to first insight', '2 hours'],
                    ['Cost', '$200–500K + 15% of savings'],
                    ['Data foundation', 'Your actual systems data'],
                    ['Benchmarks', 'Real-time peer intelligence'],
                    ['Accountability', 'Paid only on outcomes'],
                    ['Knowledge retained', 'Permanent memory'],
                    ['Updates when things change', 'Living platform'],
                  ].map(([k, v], i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '8px 0', borderBottom: '1px solid #A7F3D0' }}>
                      <span style={{ fontSize: '13px', color: '#6B7280' }}>{k}</span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#059669' }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                {[
                  { label: 'TAM', value: '$200B', sub: 'Annual consulting spend', accent: '#1B4FD8' },
                  { label: 'Value per engagement', value: '$50–200M', sub: 'Average Fortune 500', accent: '#6D28D9' },
                  { label: 'Abarva fee per client', value: '$10–60M', sub: 'At 15% of savings', accent: '#047857' },
                  { label: 'At 1% penetration', value: '$500M+', sub: 'ARR potential', accent: '#B45309' },
                ].map((m, i) => (
                  <div key={i} style={{ ...T.statCard }}>
                    <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: m.accent, marginBottom: '8px' }}>{m.label}</div>
                    <div style={{ fontSize: '26px', fontWeight: 700, color: '#111827', letterSpacing: '-0.02em', marginBottom: '4px' }}>{m.value}</div>
                    <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{m.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* WHY NOT GENERAL AI */}
          {section === 'moat' && (
            <div>
              <span style={T.label}>The Moat</span>
              <h1 style={T.h1}>Why general AI assistants cannot do this.</h1>
              <p style={T.body}>General AI assistants know everything about the world but nothing about your company. Abarva knows everything about your company and uses the world to benchmark it. That specificity is the product.</p>

              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '12px' }}>
                {[
                  {
                    icon: '01', title: 'Knows YOUR data — not generic benchmarks', color: '#1B4FD8',
                    before: 'Industry denial rates are typically 10–15% for health systems of this size and profile.',
                    after: 'Your RCM contract guarantees 12% denial rate. Actual: 18.2%. That is $8M in enforceable penalties — uncollected for three years. Here is the exact contract clause.',
                  },
                  {
                    icon: '02', title: 'Remembers every engagement — compounds over time', color: '#6D28D9',
                    before: 'Every session starts from zero. Cannot track whether past advice worked or what the outcomes were.',
                    after: 'Remembers every recommendation and every outcome. Year 3 Abarva — with outcome data from 800 clients — delivers fundamentally better intelligence than Year 1.',
                  },
                  {
                    icon: '03', title: 'Accountable for outcomes — paid only on value', color: '#047857',
                    before: 'No mechanism to know if advice worked. No accountability. The conversation ends and nothing is measured.',
                    after: 'Every recommendation tracked against its projection. Abarva captures 15% of measurable savings. Zero outcome means zero outcome fee. Incentives perfectly aligned.',
                  },
                  {
                    icon: '04', title: 'Connects every decision — sees the full system', color: '#B45309',
                    before: 'Answers questions in isolation. Cannot connect a vendor decision to a hiring decision to a regulatory deadline.',
                    after: 'Sees that fixing the denial rate requires resolving the vendor relationship, which requires hiring a CDO first, which must happen before Q3 to hit the board margin target.',
                  },
                ].map((item, i) => (
                  <div key={i} style={{ ...T.card, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0' }}>
                    <div style={{ paddingRight: '24px', borderRight: '1px solid #F3F4F6' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: item.color }}>{item.icon}</span>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>{item.title}</span>
                      </div>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '6px' }}>General AI Assistant</div>
                      <div style={{ fontSize: '13px', color: '#DC2626', lineHeight: 1.65, fontStyle: 'italic' }}>{item.before}</div>
                    </div>
                    <div style={{ paddingLeft: '24px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '6px', marginTop: '38px' }}>Abarva</div>
                      <div style={{ fontSize: '13px', color: '#059669', lineHeight: 1.65 }}>{item.after}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* LIVE CLIENT ECONOMICS */}
          {section === 'clients' && (
            <div>
              <span style={T.label}>Live Client Economics</span>
              <h1 style={T.h1}>Three clients. Real data. Real economics.</h1>
              <p style={T.body}>Not projections. Value identified from actual client data loaded into Abarva today.</p>

              <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                {CLIENTS.map((c, i) => (
                  <button key={i} onClick={() => setClientIdx(i)}
                    style={{ padding: '8px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', border: clientIdx === i ? 'none' : '1px solid #E5E7EB', background: clientIdx === i ? c.color : '#FFFFFF', color: clientIdx === i ? 'white' : '#6B7280', transition: 'all 0.12s', letterSpacing: '-0.01em' }}>
                    {c.name.split(' ').slice(0,2).join(' ')}
                  </button>
                ))}
              </div>

              <div style={{ ...T.card, borderLeft: '3px solid ' + client.color, marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#111827', letterSpacing: '-0.01em', marginBottom: '2px' }}>{client.name}</div>
                    <div style={{ fontSize: '13px', color: '#9CA3AF' }}>{client.industry}</div>
                  </div>
                  <span style={T.tag(client.color)}>{client.tier}</span>
                </div>
                <div style={{ padding: '14px 16px', background: '#FFFBEB', borderRadius: '8px', border: '1px solid #FEF3C7', marginBottom: '12px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#D97706', marginBottom: '6px' }}>What Abarva Found Before the First Meeting</div>
                  <div style={{ fontSize: '14px', color: '#374151', lineHeight: 1.65 }}>{client.finding}</div>
                </div>
                <div style={{ fontSize: '12px', color: '#D97706', fontStyle: 'italic' }}>"{client.wow}"</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '16px' }}>
                {client.metrics.map((m, i) => (
                  <div key={i} style={{ ...T.statCard, borderTop: '2px solid ' + (m.bad ? '#FCA5A5' : '#FDE68A') }}>
                    <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: '#9CA3AF', marginBottom: '6px' }}>{m.label}</div>
                    <div style={{ fontSize: '22px', fontWeight: 700, color: m.bad ? '#DC2626' : '#D97706', letterSpacing: '-0.02em' }}>{m.value}</div>
                    <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '4px' }}>{m.target}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {[
                    { label: 'Client ROI', value: client.roi + 'x', color: '#059669' },
                    { label: 'Payback', value: client.payback + ' months', color: '#1B4FD8' },
                    { label: 'Consulting Avoided', value: fmt(client.consultingAvoided), color: '#6D28D9' },
                    { label: 'Year 1 Savings', value: fmt(client.savingsRealized), color: '#B45309' },
                  ].map((m, i) => (
                    <div key={i} style={{ ...T.statCard }}>
                      <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: '#9CA3AF', marginBottom: '6px' }}>{m.label}</div>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: m.color, letterSpacing: '-0.02em' }}>{m.value}</div>
                    </div>
                  ))}
                </div>
                <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: '12px', padding: '20px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#0369A1', marginBottom: '16px' }}>Abarva Year 1 Economics</div>
                  {[
                    { label: 'Platform fee (annual)', value: fmt(client.platformFee) },
                    { label: 'Outcome fee (15% of Year 1 savings)', value: fmt(client.outcomeFee) },
                  ].map((row, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid #BAE6FD' }}>
                      <span style={{ fontSize: '13px', color: '#6B7280' }}>{row.label}</span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#0369A1' }}>{row.value}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px', marginTop: '4px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>Total Year 1</span>
                    <span style={{ fontSize: '22px', fontWeight: 700, color: '#059669', letterSpacing: '-0.02em' }}>{fmt(client.totalYear1)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* REVENUE MODEL */}
          {section === 'revenue' && (
            <div>
              <span style={T.label}>Revenue Model</span>
              <h1 style={T.h1}>Three tiers. Two revenue streams. One aligned incentive.</h1>
              <p style={T.body}>Platform fee gets us in the door. Outcome fee is where we build the business. Technology consumption revenue — a third stream — builds automatically in Phase 2.</p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '32px' }}>
                {TIERS.map((tier, i) => (
                  <div key={i} style={{ background: '#FFFFFF', border: tier.featured ? '2px solid #1B4FD8' : '1px solid #E5E7EB', borderRadius: '12px', padding: '24px', position: 'relative' as const }}>
                    {tier.featured && <div style={{ position: 'absolute' as const, top: '-11px', left: '50%', transform: 'translateX(-50%)', background: '#1B4FD8', color: 'white', fontSize: '10px', fontWeight: 700, padding: '3px 12px', borderRadius: '100px', whiteSpace: 'nowrap' as const, letterSpacing: '0.06em' }}>MOST POPULAR</div>}
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827', marginBottom: '4px' }}>{tier.name}</div>
                    <div style={{ fontSize: '32px', fontWeight: 700, color: tier.color, letterSpacing: '-0.02em', marginBottom: '2px' }}>{tier.price}</div>
                    <div style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '4px' }}>per year · {tier.clients} clients Year 1</div>
                    <div style={{ fontSize: '12px', color: '#6B7280', fontStyle: 'italic', marginBottom: '20px' }}>{tier.best}</div>
                    <div style={{ height: '1px', background: '#F3F4F6', marginBottom: '16px' }} />
                    {tier.features.map((f, fi) => (
                      <div key={fi} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'flex-start' }}>
                        <span style={{ color: tier.color, fontSize: '12px', marginTop: '1px', flexShrink: 0 }}>✓</span>
                        <span style={{ fontSize: '12px', color: '#6B7280', lineHeight: 1.4 }}>{f}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <div style={{ ...T.card, marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#9CA3AF', marginBottom: '24px' }}>Year 1 Model · 100 Clients</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '24px' }}>
                  {[
                    { label: 'Platform ARR', value: fmt(platformARR), sub: '40/40/20 tier mix', color: '#1B4FD8' },
                    { label: 'Outcome Fees', value: fmt(24000000), sub: '30% of clients', color: '#059669' },
                    { label: 'Total Year 1', value: fmt(totalY1), sub: 'Conservative', color: '#111827' },
                    { label: 'Per Client Avg', value: fmt(totalY1/100), sub: 'Blended', color: '#B45309' },
                  ].map((m, i) => (
                    <div key={i}>
                      <div style={{ fontSize: '28px', fontWeight: 700, color: m.color, letterSpacing: '-0.02em', marginBottom: '4px' }}>{m.value}</div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '2px' }}>{m.label}</div>
                      <div style={{ fontSize: '11px', color: '#9CA3AF' }}>{m.sub}</div>
                    </div>
                  ))}
                </div>
                <div style={{ height: '1px', background: '#F3F4F6', marginBottom: '20px' }} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
                  {[
                    { label: 'Today', value: '3–5', sub: 'Founder network', color: '#9CA3AF' },
                    { label: 'Month 3', value: '10', sub: 'Referrals', color: '#1B4FD8' },
                    { label: 'Month 6', value: '25', sub: 'Seed deployed', color: '#6D28D9' },
                    { label: 'Month 12', value: '100', sub: 'Year 1 target', color: '#047857' },
                  ].map((m, i) => (
                    <div key={i} style={{ textAlign: 'center', paddingRight: i < 3 ? '20px' : '0', borderRight: i < 3 ? '1px solid #F3F4F6' : 'none', paddingLeft: i > 0 ? '20px' : '0' }}>
                      <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: m.color, marginBottom: '6px' }}>{m.label}</div>
                      <div style={{ fontSize: '24px', fontWeight: 700, color: '#111827', letterSpacing: '-0.02em' }}>{m.value} clients</div>
                      <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>{m.sub}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: '#FFFBEB', border: '1px solid #FEF3C7', borderRadius: '12px', padding: '20px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#D97706', marginBottom: '8px' }}>Stream 3 · Technology Consumption · Phase 2</div>
                <div style={{ fontSize: '14px', color: '#374151', lineHeight: 1.7 }}>Every AI initiative Abarva recommends requires technology — AI infrastructure, data platforms, SaaS tools. When clients procure through Abarva, we earn 10–15% on consumption. This stream builds automatically as clients implement recommendations. No additional sales motion required.</div>
              </div>
            </div>
          )}

          {/* THE COMPOUNDING MOAT */}
          {section === 'compounding' && (
            <div>
              <span style={T.label}>The Compounding Moat</span>
              <h1 style={T.h1}>Abarva gets harder to compete with every year.</h1>
              <p style={T.body}>The Transformation Genome. Every client engagement adds to a proprietary dataset of what works, what fails, and why. No competitor can replicate five years of outcome data across two thousand clients.</p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '32px' }}>
                {[
                  { year: 'Year 1', clients: '100 clients', color: '#6B7280', bg: '#F9FAFB', border: '#E5E7EB',
                    text: 'Abarva knows 100 companies deeply. The product is useful. A well-funded competitor could replicate it with 18 months of engineering.',
                    data: '100 companies · no outcome data yet' },
                  { year: 'Year 2', clients: '300 clients', color: '#1B4FD8', bg: '#EFF6FF', border: '#BFDBFE',
                    text: 'Outcome data from Year 1 informs recommendations. Abarva knows what worked at 100 companies and what failed. Recommendations improve measurably.',
                    data: '300 companies · 100 with outcome data' },
                  { year: 'Year 3', clients: '800 clients', color: '#6D28D9', bg: '#F5F3FF', border: '#DDD6FE',
                    text: 'The Transformation Genome emerges. Patterns across industries, org sizes, and tech stacks. Abarva predicts failure before it happens. No competitor has this.',
                    data: '800 companies · 600 with outcome data' },
                  { year: 'Year 5', clients: '2,000+ clients', color: '#047857', bg: '#ECFDF5', border: '#A7F3D0',
                    text: 'Institutional memory of enterprise transformation. The data moat is insurmountable — comparable to what credit bureaus built in financial services, but for transformation.',
                    data: '2,000+ companies · 1,800 with outcome data' },
                ].map((m, i) => (
                  <div key={i} style={{ background: m.bg, border: '1px solid ' + m.border, borderRadius: '12px', padding: '24px', borderTop: '3px solid ' + m.color }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '12px' }}>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: m.color, letterSpacing: '-0.01em' }}>{m.year}</div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: m.color }}>{m.clients}</div>
                    </div>
                    <div style={{ fontSize: '13px', color: '#374151', lineHeight: 1.7, marginBottom: '12px' }}>{m.text}</div>
                    <div style={{ fontSize: '11px', color: '#9CA3AF', fontStyle: 'italic' }}>{m.data}</div>
                  </div>
                ))}
              </div>

              <div style={{ ...T.card }}>
                <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#9CA3AF', marginBottom: '20px' }}>Comparable Companies — Same Model, Different Verticals</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
                  {[
                    { label: 'AI Legal Platform', text: 'AI replaces legal research and document review', outcome: '$3B+ valuation · 100+ law firm clients', color: '#1B4FD8' },
                    { label: 'AI Clinical Documentation', text: 'AI replaces physician documentation workflow', outcome: '$2B+ valuation · 500+ health system clients', color: '#047857' },
                    { label: 'AI Data Analytics', text: 'AI replaces traditional BI and data warehousing', outcome: '$28B valuation · 9,000+ enterprise clients', color: '#6D28D9' },
                  ].map((m, i) => (
                    <div key={i} style={{ padding: '16px', background: '#F9FAFB', borderRadius: '10px', border: '1px solid #E5E7EB' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: m.color, marginBottom: '6px' }}>{m.label}</div>
                      <div style={{ fontSize: '12px', color: '#6B7280', lineHeight: 1.55, marginBottom: '8px' }}>{m.text}</div>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: '#059669' }}>{m.outcome}</div>
                    </div>
                  ))}
                </div>
                <div style={{ padding: '14px 16px', background: '#EFF6FF', borderRadius: '8px', border: '1px solid #BFDBFE' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#1B4FD8' }}>Abarva: </span>
                  <span style={{ fontSize: '13px', color: '#374151' }}>AI replaces enterprise transformation consulting. TAM is 10× larger than legal or clinical documentation. Outcome-based model creates superior revenue quality and higher multiples than pure SaaS.</span>
                </div>
              </div>
            </div>
          )}

          {/* SEED ROUND */}
          {section === 'seed' && (
            <div>
              <span style={T.label}>Seed Round</span>
              <h1 style={T.h1}>$10–15M to go from 5 clients to 100.</h1>
              <p style={T.body}>The platform works. The unit economics work. The seed round accelerates distribution — more Maestros, more enterprise sales, deeper product.</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '32px' }}>
                {[
                  { label: 'Product and Engineering', pct: '35%', amount: '$4–5M', color: '#1B4FD8',
                    items: ['8 senior engineers', 'Transform and Track modules', 'Technology consumption layer', 'MLOps and model management', 'Enterprise security and compliance'] },
                  { label: 'Sales and Maestros', pct: '35%', amount: '$4–5M', color: '#6D28D9',
                    items: ['4 senior Maestros (ex-tier-1 consulting)', '2 enterprise sales directors', '1 customer success lead', 'Maestro certification program', 'CIO advisory board'] },
                  { label: 'Operations and G&A', pct: '15%', amount: '$1.5–2M', color: '#047857',
                    items: ['Legal — IP and contracts', 'Finance and FP&A', 'HR and recruiting', 'Office and infrastructure', 'D&O insurance'] },
                  { label: 'Marketing and Brand', pct: '15%', amount: '$1.5–2M', color: '#B45309',
                    items: ['CIO community events', 'Thought leadership and research', 'Analyst relations', 'Brand and positioning', 'Content and SEO'] },
                ].map((m, i) => (
                  <div key={i} style={{ ...T.card }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>{m.label}</div>
                      <div style={{ fontSize: '22px', fontWeight: 700, color: m.color, letterSpacing: '-0.02em' }}>{m.pct}</div>
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: m.color, letterSpacing: '-0.01em', marginBottom: '16px' }}>{m.amount}</div>
                    <div style={{ height: '1px', background: '#F3F4F6', marginBottom: '14px' }} />
                    {m.items.map((item, ii) => (
                      <div key={ii} style={{ display: 'flex', gap: '8px', marginBottom: '7px' }}>
                        <span style={{ color: m.color, fontSize: '12px', flexShrink: 0, marginTop: '1px' }}>→</span>
                        <span style={{ fontSize: '13px', color: '#6B7280', lineHeight: 1.4 }}>{item}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '12px', padding: '28px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#1B4FD8', marginBottom: '20px' }}>Why Now</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                  {[
                    { title: 'Platform is proven', body: 'Three live clients. Real data. Real contradictions surfaced. Real value identified. The product works today, not in 18 months.' },
                    { title: 'Founder has the network', body: 'Direct relationships with CIOs across healthcare and financial services. First 5 clients are warm introductions, not cold outreach.' },
                    { title: 'Market is ready', body: 'Every board is demanding an AI strategy. Every CFO wants outcome-based contracts. The timing has never been better for this model.' },
                  ].map((m, i) => (
                    <div key={i}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>{m.title}</div>
                      <div style={{ fontSize: '13px', color: '#374151', lineHeight: 1.65 }}>{m.body}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  )
}
