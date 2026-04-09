'use client'
import { useState } from 'react'

const SECTIONS = [
  { id: 'problem', label: 'The Problem' },
  { id: 'why-not-ai', label: 'Why Not General AI' },
  { id: 'clients', label: 'Live Client Economics' },
  { id: 'revenue', label: 'Revenue Model' },
  { id: 'moat', label: 'The Moat' },
  { id: 'seed', label: 'Seed Round' },
]

const CLIENTS = [
  {
    id: 'meridian', name: 'Meridian Health System', industry: 'Healthcare IDN · 23 Hospitals',
    revenue: '$11.2B', tier: 'Tier 3 — Enterprise', platformFee: 500000,
    consultingAvoided: 4000000, savingsRealized: 28000000, outcomeFee: 4200000,
    totalYear1: 4700000, roi: 5.25, payback: 8.2, color: '#2563EB',
    headline: 'The RCM vendor contract guarantees a 12% denial rate. Actual rate: 18.2%. That is $8M in contractual penalties. Never enforced.',
    wow: 'How did it know about the penalty clause before the first meeting?',
    metrics: [
      { label: 'Operating Margin', value: '1.8%', target: 'Target: 4.0%', status: 'red' },
      { label: 'RCM Denial Rate', value: '18.2%', target: 'Contract SLA: 12.0%', status: 'red' },
      { label: 'AI Pilots at Scale', value: '0 of 6', target: '24 months of pilots', status: 'red' },
      { label: 'Epic Optimization', value: '58/100', target: 'Benchmark: 80+', status: 'yellow' },
    ],
  },
  {
    id: 'firstcapital', name: 'First Capital Financial', industry: 'Regional Bank · $18B Assets',
    revenue: '$1.84B', tier: 'Tier 2 — Growth', platformFee: 350000,
    consultingAvoided: 2500000, savingsRealized: 12000000, outcomeFee: 1800000,
    totalYear1: 2150000, roi: 4.9, payback: 10.4, color: '#7C3AED',
    headline: 'Real-time payments infrastructure is not live. 68% of peer institutions are live. Commercial deposit relationships are at risk every quarter this continues.',
    wow: 'How did it know the exact peer comparison and deposit risk exposure?',
    metrics: [
      { label: 'Cost-to-Income', value: '68%', target: 'Benchmark: 61%', status: 'red' },
      { label: 'Digital Adoption', value: '41%', target: 'Benchmark: 67%', status: 'red' },
      { label: 'Core Banking Age', value: '22 years', target: 'Critical: 20yr threshold', status: 'red' },
      { label: 'AML False Positives', value: '78%', target: 'Benchmark: 25%', status: 'red' },
    ],
  },
  {
    id: 'apexretail', name: 'Apex Retail Group', industry: 'Omnichannel Retailer · 800 Stores',
    revenue: '$12.4B', tier: 'Tier 3 — Enterprise', platformFee: 500000,
    consultingAvoided: 3500000, savingsRealized: 248000000, outcomeFee: 37200000,
    totalYear1: 37700000, roi: 22.2, payback: 2.8, color: '#059669',
    headline: 'The personalization engine has been in the existing license for 14 months. Never activated. $248M annual revenue opportunity. Activation cost: $800K. Timeline: 6 weeks.',
    wow: 'How did it know the tool was purchased but never activated — before anyone said a word?',
    metrics: [
      { label: 'Operating Margin', value: '3.8%', target: 'Target: 6.0%', status: 'red' },
      { label: 'Cart Abandonment', value: '72%', target: 'Benchmark: 58%', status: 'red' },
      { label: 'Loyalty Active Rate', value: '42%', target: 'Benchmark: 68%', status: 'red' },
      { label: 'Forecast Accuracy', value: '62%', target: 'Benchmark: 84%', status: 'yellow' },
    ],
  },
]

const TIERS = [
  { name: 'Starter', price: 200000, clients: 40, color: '#475569', highlighted: false,
    features: ['Diagnose', 'AI Strategy', 'Justify', '1 Maestro — 4 hrs/month', 'Quarterly outcome review'],
    best: 'First engagement. Proof of value.' },
  { name: 'Growth', price: 350000, clients: 40, color: '#2563EB', highlighted: true,
    features: ['All Starter features', 'Select', 'Maestro Admin', '1 Maestro — 10 hrs/month', 'Monthly outcome tracking', 'Vendor negotiation support'],
    best: 'Active transformation program.' },
  { name: 'Enterprise', price: 500000, clients: 20, color: '#7C3AED', highlighted: false,
    features: ['All Growth features', 'Transform and Track', 'Procurement intelligence', '2 Maestros — Unlimited', 'Weekly outcome review', 'Board presentation support'],
    best: 'Multi-year transformation partner.' },
]

function fmt(n: number) {
  if (n >= 1000000000) return '$' + (n/1000000000).toFixed(1) + 'B'
  if (n >= 1000000) return '$' + (n/1000000).toFixed(1) + 'M'
  if (n >= 1000) return '$' + (n/1000).toFixed(0) + 'K'
  return '$' + n.toLocaleString()
}

const sc: Record<string, string> = { red: '#DC2626', yellow: '#D97706', green: '#059669' }

export default function InvestorPage() {
  const [activeSection, setActiveSection] = useState('problem')
  const [activeClient, setActiveClient] = useState(0)
  const client = CLIENTS[activeClient]
  const platformARR = TIERS.reduce((s, t) => s + t.price * t.clients, 0)
  const outcomeFees = 24000000
  const totalYear1 = platformARR + outcomeFees

  const card = { background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '24px' }

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: 'Inter, -apple-system, sans-serif' }}>

      {/* Top nav */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E2E8F0', height: '56px', display: 'flex', alignItems: 'center', padding: '0 32px', justifyContent: 'space-between', position: 'sticky' as const, top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '28px', height: '28px', background: '#2563EB', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontSize: '13px', fontWeight: 700 }}>A</span>
          </div>
          <span style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>Abarva</span>
          <span style={{ fontSize: '11px', color: '#6B7280', padding: '2px 10px', background: '#F1F5F9', borderRadius: '20px', marginLeft: '8px' }}>Investor Overview · Confidential</span>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <a href="/diagnose?client=meridian" style={{ padding: '7px 16px', borderRadius: '8px', background: '#2563EB', color: 'white', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}>Healthcare Demo →</a>
          <a href="/diagnose?client=apexretail" style={{ padding: '7px 16px', borderRadius: '8px', background: '#059669', color: 'white', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}>Retail Demo →</a>
          <a href="/" style={{ fontSize: '13px', color: '#6B7280', textDecoration: 'none' }}>← Platform</a>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', minHeight: 'calc(100vh - 56px)' }}>

        {/* LEFT NAV */}
        <div style={{ background: '#FFFFFF', borderRight: '1px solid #E2E8F0', padding: '32px 0', position: 'sticky' as const, top: '56px', height: 'calc(100vh - 56px)', overflowY: 'auto' as const }}>

          {/* Hero stats */}
          <div style={{ padding: '0 20px 24px', borderBottom: '1px solid #F1F5F9', marginBottom: '16px' }}>
            {[
              { label: 'TAM', value: '$200B', sub: 'Enterprise transformation' },
              { label: 'Year 1 Revenue', value: fmt(totalYear1), sub: '100 clients · conservative' },
              { label: 'Seed Ask', value: '$10-15M', sub: '5 → 100 clients' },
              { label: 'Time to Value', value: '2 hours', sub: 'vs 16 weeks traditional' },
            ].map((m, i) => (
              <div key={i} style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '2px' }}>{m.label}</div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>{m.value}</div>
                <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>{m.sub}</div>
              </div>
            ))}
          </div>

          {/* Section nav */}
          <div style={{ padding: '0 12px' }}>
            {SECTIONS.map(s => (
              <button key={s.id} onClick={() => setActiveSection(s.id)}
                style={{ width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: activeSection === s.id ? 700 : 400, cursor: 'pointer', border: 'none', background: activeSection === s.id ? '#EFF6FF' : 'transparent', color: activeSection === s.id ? '#2563EB' : '#475569', marginBottom: '2px', transition: 'all 0.15s' }}>
                {activeSection === s.id && <span style={{ marginRight: '6px' }}>→</span>}
                {s.label}
              </button>
            ))}
          </div>

          {/* Demo links */}
          <div style={{ padding: '24px 12px 0', borderTop: '1px solid #F1F5F9', marginTop: '24px' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '12px', padding: '0 8px' }}>LIVE DEMOS</div>
            {[
              { label: 'Healthcare CIO', href: '/diagnose?client=meridian', color: '#2563EB', bg: '#EFF6FF' },
              { label: 'Retail CIO', href: '/diagnose?client=apexretail', color: '#059669', bg: '#ECFDF5' },
              { label: 'Financial Services', href: '/diagnose?client=firstcapital', color: '#7C3AED', bg: '#F5F3FF' },
            ].map((d, i) => (
              <a key={i} href={d.href} style={{ display: 'block', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, textDecoration: 'none', background: d.bg, color: d.color, marginBottom: '6px' }}>
                {d.label} →
              </a>
            ))}
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div style={{ padding: '40px 48px', maxWidth: '900px' }}>

          {/* ── THE PROBLEM ── */}
          {activeSection === 'problem' && (
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#DC2626', textTransform: 'uppercase' as const, letterSpacing: '0.12em', marginBottom: '12px' }}>THE PROBLEM</div>
              <h1 style={{ fontSize: '36px', fontWeight: 800, color: '#0F172A', lineHeight: 1.1, marginBottom: '16px' }}>$200B spent on transformation consulting annually. Outcomes are almost never tracked.</h1>
              <p style={{ fontSize: '16px', color: '#6B7280', lineHeight: 1.8, marginBottom: '40px', maxWidth: '680px' }}>Every large enterprise spends $50-200M on transformation programs. The consultants leave. The knowledge walks out the door. The next engagement starts from zero. No one is accountable for whether it worked.</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px', marginBottom: '40px' }}>
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '16px 0 0 16px', padding: '32px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#DC2626', textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: '20px' }}>TRADITIONAL CONSULTING FIRMS</div>
                  {[
                    ['Time to first insight', '16 weeks'],
                    ['Cost per engagement', '$3-5M'],
                    ['Data foundation', 'Interviews and surveys'],
                    ['Benchmarks', '18-month-old industry data'],
                    ['Accountability', 'None — paid regardless of outcome'],
                    ['Knowledge retained', 'Walks out the door'],
                    ['Updates when things change', 'New engagement required'],
                  ].map(([label, value], i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid #FECACA' }}>
                      <span style={{ fontSize: '13px', color: '#6B7280' }}>{label}</span>
                      <span style={{ fontSize: '13px', color: '#DC2626', fontWeight: 500 }}>{value}</span>
                    </div>
                  ))}
                </div>
                <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '0 16px 16px 0', padding: '32px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#2563EB', textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: '20px' }}>ABARVA</div>
                  {[
                    ['Time to first insight', '2 hours'],
                    ['Cost', '$200-500K platform + 15% of savings'],
                    ['Data foundation', 'Your actual systems data'],
                    ['Benchmarks', 'Real-time peer intelligence'],
                    ['Accountability', 'Paid only on outcomes delivered'],
                    ['Knowledge retained', 'Permanent institutional memory'],
                    ['Updates when things change', 'Living platform — always current'],
                  ].map(([label, value], i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid #BFDBFE' }}>
                      <span style={{ fontSize: '13px', color: '#6B7280' }}>{label}</span>
                      <span style={{ fontSize: '13px', color: '#2563EB', fontWeight: 600 }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                {[
                  { label: 'Enterprise transformation TAM', value: '$200B', sub: 'Annual global spend', color: '#DC2626' },
                  { label: 'Avg Fortune 500 transformation value', value: '$50-200M', sub: 'Per engagement', color: '#2563EB' },
                  { label: 'Abarva fee per client per year', value: '$10-60M', sub: 'At 15% of identified value', color: '#059669' },
                  { label: 'Revenue at 1% Fortune 500', value: '$500M+', sub: '5 clients today → 500 is the goal', color: '#7C3AED' },
                ].map((m, i) => (
                  <div key={i} style={{ ...card }}>
                    <div style={{ fontSize: '28px', fontWeight: 800, color: m.color, marginBottom: '6px' }}>{m.value}</div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#0F172A', marginBottom: '4px' }}>{m.label}</div>
                    <div style={{ fontSize: '11px', color: '#94A3B8' }}>{m.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── WHY NOT GENERAL AI ── */}
          {activeSection === 'why-not-ai' && (
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#7C3AED', textTransform: 'uppercase' as const, letterSpacing: '0.12em', marginBottom: '12px' }}>THE MOAT</div>
              <h1 style={{ fontSize: '36px', fontWeight: 800, color: '#0F172A', lineHeight: 1.1, marginBottom: '16px' }}>Why general AI assistants cannot do this.</h1>
              <p style={{ fontSize: '16px', color: '#6B7280', lineHeight: 1.8, marginBottom: '40px', maxWidth: '680px' }}>General AI assistants know everything about the world but nothing about your company. Abarva knows everything about your company and uses the world to benchmark it. That specificity is the moat.</p>

              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '16px', marginBottom: '40px' }}>
                {[
                  {
                    icon: '⚡', title: 'Knows YOUR data — not generic industry data', color: '#2563EB',
                    gpt: 'Industry denial rates are typically 10-15% for health systems of this size.',
                    abarva: 'Your RCM vendor contract guarantees 12% denial rate. Your actual rate is 18.2%. That is $8M in contractual penalties that have never been enforced. Abarva has identified the exact contract clause.',
                  },
                  {
                    icon: '◈', title: 'Remembers every engagement — compounds with every client', color: '#7C3AED',
                    gpt: 'Every session starts from zero. Cannot learn from past recommendations or track whether advice worked.',
                    abarva: 'Remembers every recommendation made to every client. Tracks every outcome. Year 3 Abarva — with outcome data from 800 clients — delivers dramatically better recommendations than Year 1.',
                  },
                  {
                    icon: '$', title: 'Accountable for outcomes — paid only on value delivered', color: '#059669',
                    gpt: 'No mechanism to know if advice worked. No accountability. The conversation ends and nothing is tracked.',
                    abarva: 'Every recommendation is tracked against its projection. Abarva captures 15% of measurable savings. If no value is delivered, no outcome fee is charged. Incentives are perfectly aligned.',
                  },
                  {
                    icon: '◎', title: 'Connects every decision — sees the full system', color: '#D97706',
                    gpt: 'Answers questions in isolation. Cannot connect a vendor decision to a hiring decision to a regulatory timeline.',
                    abarva: 'Sees that fixing the denial rate requires resolving the vendor relationship, which requires hiring a CDO, which must happen before Q3 to hit the margin target. Every decision connected to every other decision.',
                  },
                ].map((item, i) => (
                  <div key={i} style={{ ...card, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>
                    <div>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '12px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: item.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>{item.icon}</div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>{item.title}</div>
                      </div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' as const, marginBottom: '6px' }}>General AI Assistant</div>
                      <div style={{ fontSize: '13px', color: '#DC2626', fontStyle: 'italic', lineHeight: 1.6, padding: '10px 12px', background: '#FEF2F2', borderRadius: '8px' }}>{item.gpt}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' as const, marginBottom: '6px', marginTop: '48px' }}>Abarva</div>
                      <div style={{ fontSize: '13px', color: '#059669', lineHeight: 1.6, padding: '10px 12px', background: '#ECFDF5', borderRadius: '8px' }}>{item.abarva}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── LIVE CLIENT ECONOMICS ── */}
          {activeSection === 'clients' && (
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#059669', textTransform: 'uppercase' as const, letterSpacing: '0.12em', marginBottom: '12px' }}>LIVE CLIENT ECONOMICS</div>
              <h1 style={{ fontSize: '36px', fontWeight: 800, color: '#0F172A', lineHeight: 1.1, marginBottom: '8px' }}>Three clients. Real data. Real economics.</h1>
              <p style={{ fontSize: '15px', color: '#6B7280', lineHeight: 1.7, marginBottom: '32px' }}>Not projections. Value identified from actual client data loaded into Abarva today.</p>

              <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                {CLIENTS.map((c, i) => (
                  <button key={i} onClick={() => setActiveClient(i)}
                    style={{ padding: '8px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', border: 'none', background: activeClient === i ? c.color : '#F1F5F9', color: activeClient === i ? 'white' : '#475569', transition: 'all 0.15s' }}>
                    {c.name.split(' ').slice(0,2).join(' ')}
                  </button>
                ))}
              </div>

              {/* Client header */}
              <div style={{ ...card, borderLeft: '4px solid ' + client.color, marginBottom: '16px', padding: '20px 24px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: client.color, textTransform: 'uppercase' as const, marginBottom: '4px' }}>{client.industry}</div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>{client.name}</div>
                <div style={{ fontSize: '14px', color: '#6B7280' }}>{client.revenue} revenue · {client.tier}</div>
              </div>

              {/* Key metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
                {client.metrics.map((m, i) => (
                  <div key={i} style={{ ...card, padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' as const }}>{m.label}</span>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: sc[m.status], display: 'block', flexShrink: 0, marginTop: '2px' }} />
                    </div>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A', marginBottom: '2px' }}>{m.value}</div>
                    <div style={{ fontSize: '11px', color: '#94A3B8' }}>{m.target}</div>
                  </div>
                ))}
              </div>

              {/* WOW moment */}
              <div style={{ padding: '16px 20px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '10px', marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#D97706', textTransform: 'uppercase' as const, marginBottom: '6px' }}>WHAT ABARVA FOUND IMMEDIATELY — BEFORE ANY MEETING</div>
                <div style={{ fontSize: '14px', color: '#374151', lineHeight: 1.7, marginBottom: '8px' }}>{client.headline}</div>
                <div style={{ fontSize: '13px', color: '#D97706', fontStyle: 'italic' }}>"{client.wow}"</div>
              </div>

              {/* Economics */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {[
                    { label: 'Client ROI', value: client.roi + 'x', color: '#059669' },
                    { label: 'Payback Period', value: client.payback + ' months', color: '#2563EB' },
                    { label: 'Consulting Avoided', value: fmt(client.consultingAvoided), color: '#7C3AED' },
                    { label: 'Year 1 Savings', value: fmt(client.savingsRealized), color: '#D97706' },
                  ].map((m, i) => (
                    <div key={i} style={{ ...card, padding: '16px' }}>
                      <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' as const, marginBottom: '6px' }}>{m.label}</div>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: m.color }}>{m.value}</div>
                    </div>
                  ))}
                </div>
                <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '12px', padding: '20px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#2563EB', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '16px' }}>ABARVA YEAR 1 ECONOMICS</div>
                  {[
                    { label: 'Platform fee (annual)', value: fmt(client.platformFee) },
                    { label: 'Outcome fee (15% of Year 1 savings)', value: fmt(client.outcomeFee) },
                  ].map((row, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #BFDBFE' }}>
                      <span style={{ fontSize: '13px', color: '#6B7280' }}>{row.label}</span>
                      <span style={{ fontSize: '13px', color: '#2563EB', fontWeight: 600 }}>{row.value}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '14px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>Total Abarva Year 1</span>
                    <span style={{ fontSize: '20px', color: '#059669', fontWeight: 800 }}>{fmt(client.totalYear1)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── REVENUE MODEL ── */}
          {activeSection === 'revenue' && (
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#F59E0B', textTransform: 'uppercase' as const, letterSpacing: '0.12em', marginBottom: '12px' }}>REVENUE MODEL</div>
              <h1 style={{ fontSize: '36px', fontWeight: 800, color: '#0F172A', lineHeight: 1.1, marginBottom: '8px' }}>Three tiers. Two revenue streams. One aligned incentive.</h1>
              <p style={{ fontSize: '15px', color: '#6B7280', lineHeight: 1.7, marginBottom: '32px' }}>Platform fee gets us in the door. Outcome fee is where we build the business. A third stream — technology consumption revenue — builds automatically in Phase 2.</p>

              {/* Tiers */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
                {TIERS.map((tier, i) => (
                  <div key={i} style={{ background: tier.highlighted ? '#EFF6FF' : '#FFFFFF', border: tier.highlighted ? '2px solid #2563EB' : '1px solid #E2E8F0', borderRadius: '12px', padding: '24px', position: 'relative' as const }}>
                    {tier.highlighted && <div style={{ position: 'absolute' as const, top: '-11px', left: '50%', transform: 'translateX(-50%)', background: '#2563EB', color: 'white', fontSize: '10px', fontWeight: 700, padding: '2px 12px', borderRadius: '20px', whiteSpace: 'nowrap' as const }}>MOST POPULAR</div>}
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>{tier.name}</div>
                    <div style={{ fontSize: '32px', fontWeight: 800, color: tier.color, marginBottom: '2px' }}>{fmt(tier.price)}</div>
                    <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '4px' }}>per year · {tier.clients} clients projected Y1</div>
                    <div style={{ fontSize: '12px', color: '#6B7280', fontStyle: 'italic', marginBottom: '16px' }}>{tier.best}</div>
                    {tier.features.map((f, fi) => (
                      <div key={fi} style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                        <span style={{ color: tier.color, flexShrink: 0, fontSize: '12px' }}>✓</span>
                        <span style={{ fontSize: '12px', color: '#475569' }}>{f}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Year 1 model */}
              <div style={{ ...card, marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#F59E0B', textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: '24px' }}>YEAR 1 FINANCIAL MODEL · 100 CLIENTS</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '24px' }}>
                  {[
                    { label: 'Platform ARR', value: fmt(platformARR), sub: '40 / 40 / 20 tier mix', color: '#2563EB' },
                    { label: 'Outcome Fees', value: fmt(outcomeFees), sub: '30% of clients', color: '#059669' },
                    { label: 'Total Year 1', value: fmt(totalYear1), sub: 'Conservative estimate', color: '#0F172A' },
                    { label: 'Per Client Avg', value: fmt(totalYear1/100), sub: 'Blended', color: '#D97706' },
                  ].map((m, i) => (
                    <div key={i} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '28px', fontWeight: 800, color: m.color, marginBottom: '4px' }}>{m.value}</div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#0F172A', marginBottom: '2px' }}>{m.label}</div>
                      <div style={{ fontSize: '11px', color: '#94A3B8' }}>{m.sub}</div>
                    </div>
                  ))}
                </div>
                <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
                  {[
                    { label: 'Today', value: '3-5', sub: 'Founder network', color: '#94A3B8' },
                    { label: 'Month 3', value: '10', sub: 'Referrals', color: '#2563EB' },
                    { label: 'Month 6', value: '25', sub: 'Seed deployed', color: '#7C3AED' },
                    { label: 'Month 12', value: '100', sub: 'Year 1 target', color: '#059669' },
                  ].map((m, i) => (
                    <div key={i} style={{ textAlign: 'center', padding: '12px', borderRight: i < 3 ? '1px solid #F1F5F9' : 'none' }}>
                      <div style={{ fontSize: '10px', fontWeight: 700, color: m.color, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '6px' }}>{m.label}</div>
                      <div style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', marginBottom: '2px' }}>{m.value} clients</div>
                      <div style={{ fontSize: '11px', color: '#94A3B8' }}>{m.sub}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stream 3 */}
              <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '12px', padding: '24px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#D97706', textTransform: 'uppercase' as const, marginBottom: '8px' }}>STREAM 3 — TECHNOLOGY CONSUMPTION · PHASE 2</div>
                <div style={{ fontSize: '15px', color: '#374151', lineHeight: 1.7 }}>Every AI initiative Abarva recommends requires technology. When clients procure AI infrastructure, models, and SaaS tools through Abarva, we earn 10-15% on consumption. This stream builds automatically as clients implement recommendations — no additional sales motion required.</div>
              </div>
            </div>
          )}

          {/* ── THE MOAT ── */}
          {activeSection === 'moat' && (
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#7C3AED', textTransform: 'uppercase' as const, letterSpacing: '0.12em', marginBottom: '12px' }}>THE COMPOUNDING MOAT</div>
              <h1 style={{ fontSize: '36px', fontWeight: 800, color: '#0F172A', lineHeight: 1.1, marginBottom: '8px' }}>Abarva gets harder to compete with every year.</h1>
              <p style={{ fontSize: '15px', color: '#6B7280', lineHeight: 1.7, marginBottom: '40px', maxWidth: '680px' }}>The Transformation Genome. Every client engagement adds to a proprietary dataset of what works, what fails, and why. No competitor can replicate 5 years of outcome data across 2,000 clients.</p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '32px' }}>
                {[
                  { year: 'Year 1', clients: '100 clients', color: '#475569', bg: '#F8FAFC', border: '#E2E8F0',
                    insight: 'Abarva knows 100 companies deeply. The product is useful. A well-funded competitor could replicate it with 18 months of effort.',
                    data: 'Client data: 100 companies · Outcome data: None yet' },
                  { year: 'Year 2', clients: '300 clients', color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE',
                    insight: 'Outcome data from Year 1 informs recommendations. Abarva knows what worked at 100 companies and what failed. Recommendations measurably improve.',
                    data: 'Client data: 300 companies · Outcome data: 100 companies' },
                  { year: 'Year 3', clients: '800 clients', color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE',
                    insight: 'The Transformation Genome emerges. Patterns across industries, organization sizes, and technology stacks. Abarva predicts failure before it happens. No competitor has this dataset.',
                    data: 'Client data: 800 companies · Outcome data: 600 companies' },
                  { year: 'Year 5', clients: '2,000+ clients', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0',
                    insight: 'Institutional memory of enterprise transformation. The data moat is insurmountable. Comparable to what the major credit bureaus built in financial services — but for enterprise transformation.',
                    data: 'Client data: 2,000+ companies · Outcome data: 1,800 companies' },
                ].map((m, i) => (
                  <div key={i} style={{ background: m.bg, border: '1px solid ' + m.border, borderRadius: '12px', padding: '24px', borderTop: '3px solid ' + m.color }}>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: m.color, marginBottom: '2px' }}>{m.year}</div>
                    <div style={{ fontSize: '13px', color: '#475569', fontWeight: 600, marginBottom: '12px' }}>{m.clients}</div>
                    <div style={{ fontSize: '13px', color: '#374151', lineHeight: 1.7, marginBottom: '12px' }}>{m.insight}</div>
                    <div style={{ fontSize: '11px', color: '#94A3B8', fontStyle: 'italic' }}>{m.data}</div>
                  </div>
                ))}
              </div>

              <div style={{ ...card }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '16px' }}>COMPARABLE COMPANIES — SAME MODEL, DIFFERENT INDUSTRIES</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                  {[
                    { company: 'AI Legal Platform', model: 'AI replaces legal research and document review', outcome: '$3B+ valuation · 100+ law firm clients', color: '#2563EB' },
                    { company: 'AI Clinical Documentation', model: 'AI replaces physician documentation workflow', outcome: '$2B+ valuation · 500+ health system clients', color: '#059669' },
                    { company: 'AI Data Analytics', model: 'AI replaces traditional BI and data warehousing', outcome: '$28B valuation · 9,000+ enterprise clients', color: '#7C3AED' },
                  ].map((m, i) => (
                    <div key={i} style={{ padding: '16px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: m.color, marginBottom: '6px' }}>{m.company}</div>
                      <div style={{ fontSize: '12px', color: '#374151', lineHeight: 1.5, marginBottom: '8px' }}>{m.model}</div>
                      <div style={{ fontSize: '11px', color: '#059669', fontWeight: 600 }}>{m.outcome}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '16px', padding: '14px 16px', background: '#EFF6FF', borderRadius: '10px', border: '1px solid #BFDBFE' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#2563EB' }}>Abarva: </span>
                  <span style={{ fontSize: '13px', color: '#374151' }}>AI replaces enterprise transformation consulting. TAM is 10x larger than legal or clinical documentation. Outcome-based model creates superior revenue quality and multiple expansion.</span>
                </div>
              </div>
            </div>
          )}

          {/* ── SEED ROUND ── */}
          {activeSection === 'seed' && (
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#2563EB', textTransform: 'uppercase' as const, letterSpacing: '0.12em', marginBottom: '12px' }}>SEED ROUND</div>
              <h1 style={{ fontSize: '36px', fontWeight: 800, color: '#0F172A', lineHeight: 1.1, marginBottom: '8px' }}>$10-15M to go from 5 clients to 100.</h1>
              <p style={{ fontSize: '15px', color: '#6B7280', lineHeight: 1.7, marginBottom: '32px' }}>The platform works. The unit economics work. The seed round accelerates distribution — more Maestros, more enterprise sales, more product depth.</p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '32px' }}>
                {[
                  { label: 'Product and Engineering', pct: '35%', amount: '$4-5M', color: '#2563EB',
                    items: ['8 senior engineers', 'Transform and Track modules', 'Technology consumption layer', 'MLOps and model management', 'Enterprise security and compliance'] },
                  { label: 'Sales and Maestros', pct: '35%', amount: '$4-5M', color: '#7C3AED',
                    items: ['4 senior Maestros (ex-Big 4 / tier-1 consulting)', '2 enterprise sales directors', '1 customer success lead', 'Maestro certification program', 'CIO advisory board'] },
                  { label: 'Operations and G&A', pct: '15%', amount: '$1.5-2M', color: '#059669',
                    items: ['Legal — IP and contracts', 'Finance and FP&A', 'HR and recruiting', 'Office and infrastructure', 'D&O insurance'] },
                  { label: 'Marketing and Brand', pct: '15%', amount: '$1.5-2M', color: '#D97706',
                    items: ['CIO community events', 'Thought leadership and research', 'Analyst relations (Gartner, Forrester)', 'Brand and positioning', 'Content and SEO'] },
                ].map((m, i) => (
                  <div key={i} style={{ ...card }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>{m.label}</div>
                      <div style={{ fontSize: '24px', fontWeight: 800, color: m.color }}>{m.pct}</div>
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: m.color, marginBottom: '16px' }}>{m.amount}</div>
                    {m.items.map((item, ii) => (
                      <div key={ii} style={{ display: 'flex', gap: '6px', marginBottom: '7px' }}>
                        <span style={{ color: m.color, flexShrink: 0, fontSize: '12px' }}>→</span>
                        <span style={{ fontSize: '13px', color: '#475569' }}>{item}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '12px', padding: '32px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#2563EB', textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: '16px' }}>WHY NOW</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                  {[
                    { title: 'Platform is proven', body: 'Three live clients. Real data. Real contradictions surfaced. Real value identified. The product works today.' },
                    { title: 'Founder has the network', body: 'Direct relationships with CIOs across healthcare and financial services. First 5 clients are warm introductions, not cold outreach.' },
                    { title: 'Market is ready', body: 'Every board is asking their CIO for an AI strategy. Every CFO wants outcome-based contracts. The timing has never been better.' },
                  ].map((m, i) => (
                    <div key={i}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>{m.title}</div>
                      <div style={{ fontSize: '13px', color: '#374151', lineHeight: 1.6 }}>{m.body}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
