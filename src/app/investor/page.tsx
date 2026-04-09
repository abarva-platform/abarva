'use client'
import { useState } from 'react'

const CLIENTS = [
  {
    id: 'meridian', name: 'Meridian Health System', industry: 'Healthcare IDN · 23 Hospitals',
    revenue: '$11.2B', tier: 'Tier 3 — Enterprise', platformFee: 500000,
    consultingAvoided: 4000000, savingsRealized: 28000000, outcomeFee: 4200000,
    totalYear1: 4700000, roi: 5.25, payback: 8.2, color: '#2563EB',
    headline: 'Your Ensemble contract guarantees 12% denial rate. Actual rate: 18.2%. That is $8M in contractual penalties. You have never enforced them.',
    wow: 'How did it know about the Ensemble penalty clause?',
  },
  {
    id: 'firstcapital', name: 'First Capital Financial', industry: 'Regional Bank · $18B Assets',
    revenue: '$1.84B', tier: 'Tier 2 — Growth', platformFee: 350000,
    consultingAvoided: 2500000, savingsRealized: 12000000, outcomeFee: 1800000,
    totalYear1: 2150000, roi: 4.9, payback: 10.4, color: '#7C3AED',
    headline: 'FedNow is not live. 68% of your peers are live. You are losing commercial deposit relationships every quarter this continues.',
    wow: 'How did it know our FedNow status and peer comparison?',
  },
  {
    id: 'apexretail', name: 'Apex Retail Group', industry: 'Omnichannel Retailer · 800 Stores',
    revenue: '$12.4B', tier: 'Tier 3 — Enterprise', platformFee: 500000,
    consultingAvoided: 3500000, savingsRealized: 248000000, outcomeFee: 37200000,
    totalYear1: 37700000, roi: 22.2, payback: 2.8, color: '#059669',
    headline: 'Einstein personalization is in your Salesforce license. Purchased 14 months ago. Never activated. $248M annual revenue opportunity. Activation cost: $800K. Time: 6 weeks.',
    wow: 'How did it know Einstein was purchased but never activated?',
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

export default function InvestorPage() {
  const [activeClient, setActiveClient] = useState(0)
  const client = CLIENTS[activeClient]
  const platformARR = TIERS.reduce((s, t) => s + t.price * t.clients, 0)
  const outcomeFees = 24000000
  const totalYear1 = platformARR + outcomeFees

  const bg = '#0A0F1E'
  const border = '1px solid rgba(255,255,255,0.08)'

  return (
    <div style={{ minHeight: '100vh', background: bg, fontFamily: 'Inter, -apple-system, sans-serif', color: '#FFFFFF' }}>

      {/* Nav */}
      <div style={{ borderBottom: border, height: '56px', display: 'flex', alignItems: 'center', padding: '0 48px', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '28px', height: '28px', background: '#2563EB', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontSize: '13px', fontWeight: 700 }}>A</span>
          </div>
          <span style={{ fontSize: '16px', fontWeight: 700 }}>Abarva</span>
          <span style={{ fontSize: '11px', color: '#475569', padding: '2px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: '20px', marginLeft: '8px' }}>Investor Overview · Confidential</span>
        </div>
        <a href="/" style={{ fontSize: '13px', color: '#475569', textDecoration: 'none' }}>← Back to Platform</a>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '72px 48px' }}>

        {/* HERO */}
        <div style={{ textAlign: 'center', marginBottom: '96px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: '20px' }}>ENTERPRISE TRANSFORMATION OPERATING SYSTEM</div>
          <h1 style={{ fontSize: '52px', fontWeight: 800, lineHeight: 1.08, marginBottom: '24px' }}>
            McKinsey charges $5M and takes 16 weeks.<br />
            <span style={{ color: '#2563EB' }}>Abarva delivers more in 2 hours.</span>
          </h1>
          <p style={{ fontSize: '18px', color: '#6B7280', maxWidth: '580px', margin: '0 auto 48px', lineHeight: 1.7 }}>
            The first enterprise transformation platform that gets paid on outcomes — not advice. We capture 15% of measurable client savings. Our incentives are perfectly aligned.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <a href="/diagnose?client=meridian" style={{ padding: '14px 28px', borderRadius: '10px', background: '#2563EB', color: 'white', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>Healthcare Demo →</a>
            <a href="/diagnose?client=apexretail" style={{ padding: '14px 28px', borderRadius: '10px', background: '#059669', color: 'white', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>Retail Demo →</a>
            <a href="/" style={{ padding: '14px 28px', borderRadius: '10px', background: 'rgba(255,255,255,0.07)', color: 'white', textDecoration: 'none', fontSize: '14px', fontWeight: 600, border }}>Full Platform →</a>
          </div>
        </div>

        {/* OLD vs NEW */}
        <div style={{ marginBottom: '96px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px' }}>
            <div style={{ background: 'rgba(220,38,38,0.05)', border: '1px solid rgba(220,38,38,0.15)', borderRadius: '16px 0 0 16px', padding: '40px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#DC2626', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '20px' }}>THE OLD WAY · McKinsey / BCG / Accenture</div>
              {[
                ['Time to first insight', '16 weeks'],
                ['Cost per engagement', '$3-5M'],
                ['Data foundation', 'Interviews and 18-month-old benchmarks'],
                ['Accountability', 'None — paid whether it works or not'],
                ['Knowledge retained', 'Walks out the door'],
                ['Updates when things change', 'New $3M engagement'],
                ['Who does the work', '80% junior analysts'],
              ].map(([label, value], i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontSize: '13px', color: '#6B7280' }}>{label}</span>
                  <span style={{ fontSize: '13px', color: '#DC2626', fontWeight: 500 }}>{value}</span>
                </div>
              ))}
            </div>
            <div style={{ background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.25)', borderRadius: '0 16px 16px 0', padding: '40px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '20px' }}>THE ABARVA WAY</div>
              {[
                ['Time to first insight', '2 hours'],
                ['Cost', '$200-500K platform + 15% of savings'],
                ['Data foundation', 'Your actual systems — real-time benchmarks'],
                ['Accountability', 'Paid only on outcomes delivered'],
                ['Knowledge retained', 'Permanent institutional memory'],
                ['Updates when things change', 'Living platform — always current'],
                ['Who does the work', 'AI with senior Maestro oversight'],
              ].map(([label, value], i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontSize: '13px', color: '#6B7280' }}>{label}</span>
                  <span style={{ fontSize: '13px', color: '#6EE7B7', fontWeight: 600 }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* WHAT GPT CANNOT DO */}
        <div style={{ marginBottom: '96px' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#7C3AED', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '12px' }}>THE MOAT</div>
            <h2 style={{ fontSize: '36px', fontWeight: 700, marginBottom: '12px' }}>What ChatGPT cannot do. Ever.</h2>
            <p style={{ fontSize: '16px', color: '#6B7280', maxWidth: '560px', margin: '0 auto' }}>ChatGPT knows everything about the world but nothing about your company. Abarva knows everything about your company and uses the world to benchmark it.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {[
              { icon: '⚡', title: 'Knows YOUR data specifically', color: '#2563EB',
                gpt: 'Healthcare denial rates are typically 10-15%.',
                abarva: 'Your Ensemble denial rate is 18.2%. Your contract guarantees 12%. That is $8M in contractual penalties. You have never enforced them. Here is the exact clause.' },
              { icon: '◈', title: 'Remembers and compounds', color: '#7C3AED',
                gpt: 'Forgets every conversation. Every session starts from zero. Cannot learn from outcomes.',
                abarva: 'Remembers every recommendation and every outcome. Gets smarter with every client. Year 3 Abarva is dramatically more valuable than Year 1.' },
              { icon: '$', title: 'Accountable for outcomes', color: '#059669',
                gpt: 'Cannot know if its advice worked. No accountability. No skin in the game.',
                abarva: 'Tracks every initiative against its projection. Captures 15% of measurable savings. Zero outcome delivered means zero outcome fee.' },
            ].map((item, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border, borderRadius: '14px', padding: '28px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: item.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', marginBottom: '16px' }}>{item.icon}</div>
                <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '20px' }}>{item.title}</div>
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>ChatGPT</div>
                  <div style={{ fontSize: '13px', color: '#DC2626', fontStyle: 'italic', lineHeight: 1.6, padding: '10px 12px', background: 'rgba(220,38,38,0.08)', borderRadius: '8px' }}>{item.gpt}</div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Abarva</div>
                  <div style={{ fontSize: '13px', color: '#6EE7B7', lineHeight: 1.6, padding: '10px 12px', background: 'rgba(110,231,183,0.08)', borderRadius: '8px' }}>{item.abarva}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* LIVE CLIENT ECONOMICS */}
        <div style={{ marginBottom: '96px' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '12px' }}>LIVE CLIENT ECONOMICS</div>
            <h2 style={{ fontSize: '36px', fontWeight: 700, marginBottom: '12px' }}>Three clients. Real data. Real economics.</h2>
            <p style={{ fontSize: '16px', color: '#6B7280' }}>Not projections. Value identified from actual client data loaded into Abarva today.</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', justifyContent: 'center' }}>
            {CLIENTS.map((c, i) => (
              <button key={i} onClick={() => setActiveClient(i)}
                style={{ padding: '10px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', border: 'none', background: activeClient === i ? c.color : 'rgba(255,255,255,0.06)', color: 'white', transition: 'all 0.15s' }}>
                {c.name.split(' ').slice(0,2).join(' ')}
              </button>
            ))}
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', border, borderRadius: '16px', padding: '48px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: client.color, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>{client.industry}</div>
                <div style={{ fontSize: '28px', fontWeight: 800, marginBottom: '4px' }}>{client.name}</div>
                <div style={{ fontSize: '15px', color: '#6B7280', marginBottom: '28px' }}>{client.revenue} revenue · {client.tier}</div>
                <div style={{ padding: '20px', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', borderLeft: '3px solid ' + client.color, marginBottom: '20px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', marginBottom: '8px' }}>WHAT ABARVA FOUND IMMEDIATELY</div>
                  <div style={{ fontSize: '15px', color: '#E2E8F0', lineHeight: 1.7 }}>{client.headline}</div>
                </div>
                <div style={{ padding: '14px 18px', background: 'rgba(245,158,11,0.08)', borderRadius: '10px', border: '1px solid rgba(245,158,11,0.2)' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#F59E0B', textTransform: 'uppercase', marginBottom: '6px' }}>THE WOW MOMENT</div>
                  <div style={{ fontSize: '14px', color: '#FDE68A', fontStyle: 'italic' }}>"{client.wow}"</div>
                </div>
              </div>
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                  {[
                    { label: 'Client ROI', value: client.roi + 'x', color: '#6EE7B7' },
                    { label: 'Payback Period', value: client.payback + ' months', color: '#93C5FD' },
                    { label: 'Consulting Avoided', value: fmt(client.consultingAvoided), color: '#C4B5FD' },
                    { label: 'Year 1 Savings', value: fmt(client.savingsRealized), color: '#FDE68A' },
                  ].map((m, i) => (
                    <div key={i} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '10px', padding: '16px' }}>
                      <div style={{ fontSize: '10px', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>{m.label}</div>
                      <div style={{ fontSize: '22px', fontWeight: 700, color: m.color }}>{m.value}</div>
                    </div>
                  ))}
                </div>
                <div style={{ background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.25)', borderRadius: '14px', padding: '24px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#93C5FD', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>ABARVA YEAR 1 ECONOMICS</div>
                  {[
                    { label: 'Platform fee (annual)', value: fmt(client.platformFee), color: '#94A3B8' },
                    { label: 'Outcome fee (15% of Year 1 savings)', value: fmt(client.outcomeFee), color: '#6EE7B7' },
                  ].map((row, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                      <span style={{ fontSize: '13px', color: '#6B7280' }}>{row.label}</span>
                      <span style={{ fontSize: '13px', color: row.color, fontWeight: 600 }}>{row.value}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '14px', marginTop: '4px' }}>
                    <span style={{ fontSize: '15px', fontWeight: 700 }}>Total Abarva Year 1</span>
                    <span style={{ fontSize: '20px', color: '#6EE7B7', fontWeight: 800 }}>{fmt(client.totalYear1)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PRICING TIERS */}
        <div style={{ marginBottom: '96px' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '12px' }}>REVENUE MODEL</div>
            <h2 style={{ fontSize: '36px', fontWeight: 700, marginBottom: '12px' }}>Three tiers. Two revenue streams. One aligned incentive.</h2>
            <p style={{ fontSize: '16px', color: '#6B7280' }}>Platform fee gets us in the door. Outcome fee is where we build the business.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
            {TIERS.map((tier, i) => (
              <div key={i} style={{ background: tier.highlighted ? 'rgba(37,99,235,0.1)' : 'rgba(255,255,255,0.03)', border: tier.highlighted ? '1px solid rgba(37,99,235,0.4)' : border, borderRadius: '16px', padding: '32px', position: 'relative' as const }}>
                {tier.highlighted && <div style={{ position: 'absolute' as const, top: '-12px', left: '50%', transform: 'translateX(-50%)', background: '#2563EB', color: 'white', fontSize: '10px', fontWeight: 700, padding: '3px 14px', borderRadius: '20px', textTransform: 'uppercase' as const, letterSpacing: '0.08em', whiteSpace: 'nowrap' as const }}>Most Popular</div>}
                <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>{tier.name}</div>
                <div style={{ fontSize: '36px', fontWeight: 800, color: tier.color, marginBottom: '4px' }}>{fmt(tier.price)}</div>
                <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>per year · {tier.clients} clients projected Year 1</div>
                <div style={{ fontSize: '12px', color: '#475569', fontStyle: 'italic', marginBottom: '24px' }}>{tier.best}</div>
                {tier.features.map((f, fi) => (
                  <div key={fi} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ color: tier.color, flexShrink: 0, fontSize: '12px' }}>✓</span>
                    <span style={{ fontSize: '13px', color: '#94A3B8' }}>{f}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', border, borderRadius: '16px', padding: '40px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '24px' }}>YEAR 1 FINANCIAL MODEL · 100 CLIENTS</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' }}>
              {[
                { label: 'Platform ARR', value: fmt(platformARR), sub: '40 / 40 / 20 tier mix', color: '#93C5FD' },
                { label: 'Outcome Fees', value: fmt(outcomeFees), sub: '30% of clients generating fees', color: '#6EE7B7' },
                { label: 'Total Year 1', value: fmt(totalYear1), sub: 'Conservative estimate', color: '#FFFFFF' },
                { label: 'Revenue per Client', value: fmt(totalYear1/100), sub: 'Blended average', color: '#FDE68A' },
              ].map((m, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', fontWeight: 800, color: m.color, marginBottom: '6px' }}>{m.value}</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>{m.label}</div>
                  <div style={{ fontSize: '11px', color: '#6B7280' }}>{m.sub}</div>
                </div>
              ))}
            </div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '24px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0' }}>
              {[
                { label: 'Today', value: '3-5 clients', sub: 'Founder network CIOs', color: '#475569' },
                { label: 'Month 3', value: '10 clients', sub: 'Referrals and events', color: '#2563EB' },
                { label: 'Month 6', value: '25 clients', sub: 'Seed funding deployed', color: '#7C3AED' },
                { label: 'Month 12', value: '100 clients', sub: 'Year 1 target', color: '#059669' },
              ].map((m, i) => (
                <div key={i} style={{ textAlign: 'center', padding: '16px', borderRight: i < 3 ? '1px solid rgba(255,255,255,0.08)' : 'none' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: m.color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>{m.label}</div>
                  <div style={{ fontSize: '22px', fontWeight: 700, marginBottom: '4px' }}>{m.value}</div>
                  <div style={{ fontSize: '11px', color: '#6B7280' }}>{m.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* COMPOUNDING MOAT */}
        <div style={{ marginBottom: '96px', background: 'rgba(255,255,255,0.03)', border, borderRadius: '16px', padding: '48px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#7C3AED', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '16px' }}>THE COMPOUNDING MOAT</div>
          <h2 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '36px' }}>Abarva gets harder to compete with every year.</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
            {[
              { year: 'Year 1', clients: '100 clients', color: '#475569', insight: 'Abarva knows 100 companies deeply. Useful. Replicable by a well-funded competitor.' },
              { year: 'Year 2', clients: '300 clients', color: '#2563EB', insight: 'Outcome data from Year 1 improves recommendations. Knows what works and what fails.' },
              { year: 'Year 3', clients: '800 clients', color: '#7C3AED', insight: 'The Transformation Genome. Abarva predicts failure before it happens. No competitor has this.' },
              { year: 'Year 5', clients: '2,000+ clients', color: '#059669', insight: 'Institutional memory of enterprise transformation. The data moat is insurmountable.' },
            ].map((m, i) => (
              <div key={i} style={{ borderTop: '3px solid ' + m.color, paddingTop: '20px' }}>
                <div style={{ fontSize: '22px', fontWeight: 800, color: m.color, marginBottom: '4px' }}>{m.year}</div>
                <div style={{ fontSize: '13px', color: '#94A3B8', fontWeight: 600, marginBottom: '12px' }}>{m.clients}</div>
                <div style={{ fontSize: '13px', color: '#6B7280', lineHeight: 1.7 }}>{m.insight}</div>
              </div>
            ))}
          </div>
        </div>

        {/* SEED ROUND */}
        <div style={{ marginBottom: '96px' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '12px' }}>SEED ROUND</div>
            <h2 style={{ fontSize: '36px', fontWeight: 700, marginBottom: '12px' }}>$10-15M to go from 5 clients to 100.</h2>
            <p style={{ fontSize: '16px', color: '#6B7280' }}>The platform works. The economics work. The seed round accelerates distribution.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            {[
              { label: 'Product and Engineering', pct: '35%', amount: '$4-5M', color: '#2563EB', items: ['8 engineers', 'Transform and Track modules', 'Technology consumption layer', 'MLOps and model management'] },
              { label: 'Sales and Maestros', pct: '35%', amount: '$4-5M', color: '#7C3AED', items: ['4 senior Maestros ex-McKinsey', '2 enterprise sales', '1 customer success', 'Maestro training program'] },
              { label: 'Operations and G&A', pct: '15%', amount: '$1.5-2M', color: '#059669', items: ['Legal and compliance', 'Finance and HR', 'Office and infrastructure', 'Insurance and risk'] },
              { label: 'Marketing and Brand', pct: '15%', amount: '$1.5-2M', color: '#F59E0B', items: ['CIO community events', 'Thought leadership', 'Analyst relations', 'Brand and positioning'] },
            ].map((m, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border, borderRadius: '14px', padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700 }}>{m.label}</div>
                  <div style={{ fontSize: '22px', fontWeight: 700, color: m.color }}>{m.pct}</div>
                </div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: m.color, marginBottom: '16px' }}>{m.amount}</div>
                {m.items.map((item, ii) => (
                  <div key={ii} style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                    <span style={{ color: m.color, flexShrink: 0, fontSize: '11px' }}>→</span>
                    <span style={{ fontSize: '12px', color: '#6B7280' }}>{item}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center', padding: '64px 48px', background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.25)', borderRadius: '20px' }}>
          <h2 style={{ fontSize: '36px', fontWeight: 800, marginBottom: '16px' }}>See it live. Right now.</h2>
          <p style={{ fontSize: '16px', color: '#6B7280', marginBottom: '36px' }}>Three live clients. Real data. The same platform a CIO would use on day one.</p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' as const }}>
            <a href="/diagnose?client=meridian" style={{ padding: '14px 28px', borderRadius: '10px', background: '#2563EB', color: 'white', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>Healthcare CIO Demo →</a>
            <a href="/diagnose?client=apexretail" style={{ padding: '14px 28px', borderRadius: '10px', background: '#059669', color: 'white', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>Retail CIO Demo →</a>
            <a href="/diagnose?client=firstcapital" style={{ padding: '14px 28px', borderRadius: '10px', background: '#7C3AED', color: 'white', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>Finserv Demo →</a>
            <a href="/" style={{ padding: '14px 28px', borderRadius: '10px', background: 'rgba(255,255,255,0.07)', color: 'white', textDecoration: 'none', fontSize: '14px', fontWeight: 600, border }}>Full Platform →</a>
          </div>
        </div>

      </div>
    </div>
  )
}
