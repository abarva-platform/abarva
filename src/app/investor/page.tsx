'use client'
import { useState, useEffect, useRef } from 'react'

const SECTIONS = [
  { id: 'problem', label: 'The Problem' },
  { id: 'moat', label: 'Why Not General AI' },
  { id: 'clients', label: 'Live Client Economics' },
  { id: 'revenue', label: 'Revenue Model' },
  { id: 'compounding', label: 'The Moat' },
  { id: 'team', label: 'The Team' },
  { id: 'seed', label: 'Seed Round' },
]

const CLIENTS = [
  {
    id: 'meridian', name: 'Meridian Health System',
    tag: 'Healthcare · 23 Hospitals',
    revenue: '$11.2B Revenue', tier: 'Enterprise',
    platformFee: 500000, outcomeFee: 4200000, totalYear1: 4700000,
    roi: 5.25, payback: 8.2, consultingAvoided: 4000000, savingsRealized: 28000000,
    color: '#1B4FD8',
    finding: 'The RCM vendor contract guarantees a 12% denial rate. Actual rate: 18.2%. That is $8M in contractual penalties — never once enforced in three years.',
    wow: 'How did it know about the penalty clause before the first meeting?',
    metrics: [
      { label: 'Operating Margin', value: '1.8%', target: 'Target: 4.0%', red: true, office: 'Financial' },
      { label: 'RCM Denial Rate', value: '18.2%', target: 'Contract SLA: 12%', red: true, office: 'Back Office' },
      { label: 'Epic Optimization', value: '58/100', target: 'Benchmark: 80+', red: false, office: 'Back Office' },
      { label: 'MA Star Rating', value: '3.5', target: '$34M bonus below 4.0', red: false, office: 'Front Office' },
      { label: 'Prior Auth Connected', value: '23%', target: 'CMS requires 100% by Jan 2026', red: true, office: 'Middle Office' },
      { label: 'AI Pilots Scaled', value: '0 of 6', target: '24 months of effort', red: true, office: 'Back Office' },
      { label: 'IT Budget', value: '$504M', target: '4.5% of revenue', red: false, office: 'IT' },
      { label: 'Travel Nurse Cost', value: '$142M', target: 'Benchmark: $68M', red: true, office: 'Middle Office' },
    ],
  },
  {
    id: 'firstcapital', name: 'First Capital Financial',
    tag: 'Regional Bank · $18B Assets',
    revenue: '$1.84B Revenue', tier: 'Growth',
    platformFee: 350000, outcomeFee: 1800000, totalYear1: 2150000,
    roi: 4.9, payback: 10.4, consultingAvoided: 2500000, savingsRealized: 12000000,
    color: '#6D28D9',
    finding: 'Real-time payments infrastructure is not live. 68% of peer institutions are live. Three commercial clients have formally inquired about alternatives in the past 90 days.',
    wow: 'How did it know the exact peer benchmark and deposit risk exposure?',
    metrics: [
      { label: 'Cost-to-Income', value: '68%', target: 'Benchmark: 61%', red: true, office: 'Financial' },
      { label: 'Digital Adoption', value: '41%', target: 'Benchmark: 67%', red: true, office: 'Front Office' },
      { label: 'FedNow Live', value: 'No', target: '68% of peers live', red: true, office: 'Back Office' },
      { label: 'Core Banking Age', value: '22 yrs', target: 'Critical threshold: 20yr', red: true, office: 'IT' },
      { label: 'AML False Positives', value: '78%', target: 'Benchmark: 25%', red: true, office: 'Middle Office' },
      { label: 'Mobile App Rating', value: '3.2/5', target: 'Switch threshold: 3.5', red: true, office: 'Front Office' },
      { label: 'Compliance % of IT', value: '34%', target: 'Benchmark: 22%', red: true, office: 'IT' },
      { label: 'Account Abandonment', value: '64%', target: 'Benchmark: 32%', red: true, office: 'Front Office' },
    ],
  },
  {
    id: 'apexretail', name: 'Apex Retail Group',
    tag: 'Omnichannel Retail · 800 Stores',
    revenue: '$12.4B Revenue', tier: 'Enterprise',
    platformFee: 500000, outcomeFee: 37200000, totalYear1: 37700000,
    roi: 22.2, payback: 2.8, consultingAvoided: 3500000, savingsRealized: 248000000,
    color: '#047857',
    finding: 'The personalization engine has been in the existing software license for 14 months. Never activated. $248M annual revenue opportunity. Activation cost: $800K. Time to value: 6 weeks.',
    wow: 'How did it know the tool was purchased but idle — before anyone said a word?',
    metrics: [
      { label: 'Operating Margin', value: '3.8%', target: 'Target: 6.0%', red: true, office: 'Financial' },
      { label: 'Cart Abandonment', value: '72%', target: 'Benchmark: 58%', red: true, office: 'Front Office' },
      { label: 'Loyalty Active Rate', value: '42%', target: 'Benchmark: 68%', red: true, office: 'Front Office' },
      { label: 'Inventory Turnover', value: '4.2x', target: 'Benchmark: 6.8x', red: true, office: 'Back Office' },
      { label: 'Forecast Accuracy', value: '62%', target: 'Benchmark: 84%', red: true, office: 'Middle Office' },
      { label: 'Shrinkage Rate', value: '2.8%', target: 'Benchmark: 1.4%', red: true, office: 'Middle Office' },
      { label: 'SAP ECC Age', value: '14 yrs', target: 'Support ends 2027', red: true, office: 'IT' },
      { label: 'Einstein Activated', value: 'No', target: '$248M opportunity idle', red: true, office: 'IT' },
    ],
  },
]

const TIERS = [
  { name: 'Starter', price: '$200K', clients: 40, color: '#374151', featured: false,
    features: ['Diagnose', 'AI Strategy', 'Justify', '1 Maestro — 4 hrs/month', 'Quarterly outcome review'],
    best: 'First engagement. Proof of value.' },
  { name: 'Growth', price: '$350K', clients: 40, color: '#1B4FD8', featured: true,
    features: ['All Starter features', 'Select', 'Maestro Admin', '1 Maestro — 10 hrs/month', 'Monthly outcome tracking', 'Vendor negotiation support'],
    best: 'Active transformation program.' },
  { name: 'Enterprise', price: '$500K', clients: 20, color: '#6D28D9', featured: false,
    features: ['All Growth features', 'Transform and Track', 'Procurement intelligence', '2 Maestros — Unlimited hours', 'Weekly outcome review', 'Board presentation support'],
    best: 'Multi-year transformation partner.' },
]

function fmt(n: number) {
  if (n >= 1e9) return '$' + (n/1e9).toFixed(1) + 'B'
  if (n >= 1e6) return '$' + (n/1e6).toFixed(1) + 'M'
  if (n >= 1e3) return '$' + (n/1e3).toFixed(0) + 'K'
  return '$' + n.toLocaleString()
}

export default function InvestorPage() {
  const [section, setSection] = useState('problem')
  const [clientIdx, setClientIdx] = useState(0)
  const client = CLIENTS[clientIdx]
  const platformARR = 40*200000 + 40*350000 + 20*500000
  const totalY1 = platformARR + 24000000
  const [counts, setCounts] = useState([0, 0, 0, 0])
  const animatedRef = useRef(false)
  const [clientProgress, setClientProgress] = useState(0)
  const clientRafRef = useRef<number | null>(null)

  useEffect(() => { document.title = 'Abarva Investor Overview — Confidential' }, [])

  useEffect(() => {
    if (section !== 'problem' || animatedRef.current) return
    animatedRef.current = true
    const targets = [200, 200, 60, 500]
    const steps = 50
    const stepMs = 1500 / steps
    let step = 0
    const timer = setInterval(() => {
      step++
      const eased = 1 - Math.pow(1 - step / steps, 3)
      setCounts(targets.map(v => Math.round(v * eased)))
      if (step >= steps) clearInterval(timer)
    }, stepMs)
    return () => clearInterval(timer)
  }, [section])

  useEffect(() => {
    if (section !== 'clients') return
    if (clientRafRef.current) cancelAnimationFrame(clientRafRef.current)
    setClientProgress(0)
    const t0 = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - t0) / 2000, 1)
      setClientProgress(1 - Math.pow(1 - p, 3))
      if (p < 1) clientRafRef.current = requestAnimationFrame(tick)
      else clientRafRef.current = null
    }
    clientRafRef.current = requestAnimationFrame(tick)
    return () => { if (clientRafRef.current) cancelAnimationFrame(clientRafRef.current) }
  }, [clientIdx, section])

  const css = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif; }
    .tag { display: inline-block; font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 16px; }
    .h1 { font-size: 42px; font-weight: 800; line-height: 1.1; letter-spacing: -0.025em; color: #111827; margin-bottom: 16px; }
    .h2 { font-size: 32px; font-weight: 800; line-height: 1.15; letter-spacing: -0.02em; color: #111827; margin-bottom: 12px; }
    .body { font-size: 16px; line-height: 1.75; color: #4B5563; margin-bottom: 32px; max-width: 600px; }
    .card { background: #fff; border: 1px solid #E5E7EB; border-radius: 12px; padding: 24px; }
    .metric-card { background: #fff; border: 1px solid #E5E7EB; border-radius: 10px; padding: 18px; }
    .metric-label { font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; height: 32px; display: flex; align-items: flex-start; margin-bottom: 8px; }
    .metric-value { font-size: 26px; font-weight: 800; letter-spacing: -0.025em; margin-bottom: 4px; }
    .metric-sub { font-size: 12px; color: #9CA3AF; }
    .subnav-btn { background: none; border: none; cursor: pointer; font-size: 13px; font-weight: 500; padding: 0 20px; height: 48px; border-bottom: 2px solid transparent; white-space: nowrap; transition: all 0.15s; color: #6B7280; font-family: inherit; }
    .subnav-btn.active { color: #111827; font-weight: 700; border-bottom-color: #111827; }
    .subnav-btn:hover { color: #111827; }
    .client-btn { border: 1px solid #E5E7EB; background: #fff; border-radius: 8px; padding: 8px 20px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.12s; font-family: inherit; color: #374151; }
    .tier-card { background: #fff; border: 1px solid #E5E7EB; border-radius: 12px; padding: 28px; position: relative; }
    .tier-card.featured { border: 2px solid #1B4FD8; }
    .compare-row:nth-child(odd) .compare-cell { background: #fff; }
    .compare-row:nth-child(even) .compare-cell { background: #F9FAFB; }
  `

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: "-apple-system, 'Helvetica Neue', Arial, sans-serif" }}>
      <style>{css}</style>

      {/* TOP NAV */}
      <div style={{ background: '#0D1117', borderBottom: '1px solid #21262D', height: '64px', display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', padding: '0 40px', position: 'sticky' as const, top: 0, zIndex: 100, fontFamily: '-apple-system, "Helvetica Neue", sans-serif' }}>
        {/* Left — Logo */}
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <svg width="34" height="34" viewBox="0 0 32 32" fill="none">
            <line x1="16" y1="16" x2="16" y2="6"    stroke="#60A5FA" strokeWidth="1.2" opacity="0.55" />
            <line x1="16" y1="16" x2="24.7" y2="11"  stroke="#60A5FA" strokeWidth="1.2" opacity="0.55" />
            <line x1="16" y1="16" x2="24.7" y2="21"  stroke="#60A5FA" strokeWidth="1.2" opacity="0.55" />
            <line x1="16" y1="16" x2="16" y2="26"   stroke="#60A5FA" strokeWidth="1.2" opacity="0.55" />
            <line x1="16" y1="16" x2="7.3" y2="21"  stroke="#60A5FA" strokeWidth="1.2" opacity="0.55" />
            <line x1="16" y1="16" x2="7.3" y2="11"  stroke="#60A5FA" strokeWidth="1.2" opacity="0.55" />
            <circle cx="16"   cy="6"  r="2.2" fill="#60A5FA" />
            <circle cx="24.7" cy="11" r="2.2" fill="#60A5FA" />
            <circle cx="24.7" cy="21" r="2.2" fill="#60A5FA" />
            <circle cx="16"   cy="26" r="2.2" fill="#60A5FA" />
            <circle cx="7.3"  cy="21" r="2.2" fill="#60A5FA" />
            <circle cx="7.3"  cy="11" r="2.2" fill="#60A5FA" />
            <circle cx="16" cy="16" r="5.5" fill="#2DD4C8" />
          </svg>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 900, fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1.1, letterSpacing: '-0.02em' }}>
              <span style={{ color: '#F0F6FF' }}>Abar</span><span style={{ color: '#2DD4C8' }}>VA</span>
            </div>
            <div style={{ fontSize: '9px', color: '#9CA3AF', fontFamily: 'monospace', letterSpacing: '0.04em', lineHeight: 1, marginTop: '1px', whiteSpace: 'nowrap' }}>Enterprise AI Brain</div>
          </div>
          <span style={{ fontSize: '11px', color: '#6B7280', padding: '3px 10px', background: 'rgba(255,255,255,0.05)', borderRadius: '100px', marginLeft: '4px', fontFamily: 'monospace' }}>Investor Overview · Confidential</span>
        </a>
        {/* Center — Section links */}
        <div style={{ display: 'flex', alignItems: 'center', height: '64px' }}>
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => setSection(s.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: section === s.id ? 600 : 400, color: section === s.id ? '#E6EDF3' : '#6B7280', padding: '0 14px', height: '64px', borderBottom: section === s.id ? '2px solid #2DD4C8' : '2px solid transparent', boxSizing: 'border-box' as const, transition: 'color 0.1s', fontFamily: 'inherit', whiteSpace: 'nowrap' as const }}>
              {s.label}
            </button>
          ))}
        </div>
        {/* Right */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <a href="/" style={{ fontSize: '13px', color: '#9CA3AF', textDecoration: 'none' }}>← Platform</a>
        </div>
      </div>

      {/* KEY METRICS BAR */}
      <div style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB', padding: '0 40px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderLeft: '1px solid #E5E7EB' }}>
          {[
            { label: 'TAM', value: '$200B', sub: 'Enterprise transformation', color: '#1B4FD8' },
            { label: 'Year 1 Revenue', value: fmt(totalY1), sub: '100 clients · conservative', color: '#6D28D9' },
            { label: 'Seed Ask', value: '$10–15M', sub: '5 → 100 clients', color: '#047857' },
            { label: 'Time to Value', value: '2 hours', sub: 'vs 16 weeks traditional', color: '#B45309' },
          ].map((m, i) => (
            <div key={i} style={{ padding: '20px 28px', borderRight: '1px solid #E5E7EB' }}>
              <div style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: m.color, marginBottom: '6px' }}>{m.label}</div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#111827', letterSpacing: '-0.025em', lineHeight: 1.05, marginBottom: '4px' }}>{m.value}</div>
              <div style={{ fontSize: '12px', color: '#6B7280' }}>{m.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION SUB-NAV — NVIDIA style */}
      <div style={{ background: '#111827', position: 'sticky' as const, top: '64px', zIndex: 99 }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', overflowX: 'auto' as const }}>
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => setSection(s.id)}
              className={'subnav-btn' + (section === s.id ? ' active' : '')}
              style={{ color: section === s.id ? '#fff' : '#9CA3AF', borderBottomColor: section === s.id ? '#fff' : 'transparent', fontWeight: section === s.id ? 700 : 400 }}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '56px 40px' }}>

        {/* THE PROBLEM */}
        {section === 'problem' && (
          <div>
            {/* Dark hero band */}
            <div style={{ background: '#111827', borderRadius: '12px', padding: '48px', marginBottom: '40px' }}>
              <div className="tag" style={{ color: '#6EE7B7' }}>The Problem</div>
              <h1 style={{ fontSize: '42px', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.025em', color: '#F9FAFB', marginBottom: '16px' }}>$200B spent on transformation consulting.<br />Outcomes are almost never tracked.</h1>
              <p style={{ fontSize: '16px', lineHeight: 1.75, color: '#9CA3AF', marginBottom: 0, maxWidth: '600px' }}>Every large enterprise spends $50–200M on transformation programs. Consultants leave. Knowledge walks out. The next engagement starts from zero. Nobody is accountable for whether it worked.</p>
            </div>

            {/* Market metrics — 4 columns, animated */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: '#E5E7EB', border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden', marginBottom: '40px' }}>
              {[
                { label: 'Total addressable market', value: '$' + counts[0] + 'B', sub: 'Annual consulting spend', color: '#1B4FD8' },
                { label: 'Value per Fortune 500 engagement', value: '$50–' + counts[1] + 'M', sub: 'Average identified', color: '#6D28D9' },
                { label: 'Abarva fee per client per year', value: '$10–' + counts[2] + 'M', sub: 'At 15% of savings', color: '#047857' },
                { label: 'Revenue at 1% Fortune 500 penetration', value: '$' + counts[3] + 'M+', sub: 'ARR potential', color: '#B45309' },
              ].map((m, i) => (
                <div key={i} style={{ background: '#fff', padding: '24px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: m.color, height: '32px', display: 'flex', alignItems: 'flex-start', marginBottom: '10px', lineHeight: 1.3 }}>{m.label}</div>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: '#111827', letterSpacing: '-0.025em', marginBottom: '6px' }}>{m.value}</div>
                  <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{m.sub}</div>
                </div>
              ))}
            </div>

            {/* Comparison table */}
            <div style={{ border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden', marginBottom: '0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 1fr' }}>
                <div style={{ padding: '14px 20px', background: '#F9FAFB', borderBottom: '2px solid #E5E7EB', borderRight: '1px solid #E5E7EB' }} />
                <div style={{ padding: '14px 20px', background: '#FEF2F2', borderBottom: '2px solid #FECACA', borderRight: '1px solid #E5E7EB' }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#DC2626' }}>Traditional Consulting</span>
                </div>
                <div style={{ padding: '14px 20px', background: '#ECFDF5', borderBottom: '2px solid #A7F3D0' }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#059669' }}>Abarva</span>
                </div>
              </div>
              {[
                ['Time to first insight', '16 weeks', '2 hours'],
                ['Cost', '$3–5M per engagement', '$200–500K + 15% of savings'],
                ['Data foundation', 'Interviews and surveys', 'Your actual systems data'],
                ['Accountability', 'None — paid regardless of outcome', 'Paid only on outcomes delivered'],
                ['Knowledge retained', 'Walks out the door when project ends', 'Permanent institutional memory'],
              ].map(([label, bad, good], i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '200px 1fr 1fr', background: i % 2 === 0 ? '#fff' : '#F9FAFB', borderTop: '1px solid #F3F4F6' }}>
                  <div style={{ padding: '14px 20px', borderRight: '1px solid #E5E7EB' }}>
                    <span style={{ fontSize: '14px', color: '#374151', fontWeight: 500 }}>{label}</span>
                  </div>
                  <div style={{ padding: '14px 20px', borderRight: '1px solid #E5E7EB', background: i % 2 === 0 ? '#FFFAFA' : '#FEF9F9' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#DC2626' }}>{bad}</span>
                  </div>
                  <div style={{ padding: '14px 20px', background: i % 2 === 0 ? '#F7FFF9' : '#F0FDF4' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#059669' }}>{good}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* WHY NOT GENERAL AI */}
        {section === 'moat' && (
          <div>
            <div className="tag" style={{ color: '#6D28D9' }}>The Differentiation</div>
            <h1 className="h1">What general AI assistants<br />cannot do. Ever.</h1>
            <p className="body">General AI assistants know everything about the world but nothing about your company. Abarva knows everything about your company and uses the world to benchmark it.</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1px', background: '#E5E7EB', border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden' }}>
              {/* Header row */}
              <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr 1fr', background: '#F9FAFB' }}>
                <div style={{ padding: '14px 20px', borderRight: '1px solid #E5E7EB' }} />
                <div style={{ padding: '14px 20px', borderRight: '1px solid #E5E7EB' }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#DC2626' }}>General AI Assistant</span>
                </div>
                <div style={{ padding: '14px 20px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#059669' }}>Abarva</span>
                </div>
              </div>
              {[
                {
                  capability: 'Uses your actual data',
                  before: 'Industry denial rates are typically 10–15% for health systems of this size.',
                  after: 'Your RCM contract guarantees 12% denial rate. Actual: 18.2%. That is $8M in enforceable penalties — uncollected for 3 years. Here is the contract clause.',
                },
                {
                  capability: 'Remembers every engagement',
                  before: 'Every session starts from zero. Cannot learn from past advice or track outcomes.',
                  after: 'Remembers every recommendation and outcome. Year 3 Abarva — with outcome data from 800 clients — is fundamentally more valuable than Year 1.',
                },
                {
                  capability: 'Accountable for outcomes',
                  before: 'No mechanism to know if advice worked. No accountability. No skin in the game.',
                  after: 'Tracks every recommendation against its projection. Captures 15% of measurable savings. Zero outcome delivered means zero outcome fee.',
                },
                {
                  capability: 'Connects every decision',
                  before: 'Answers questions in isolation. Cannot connect vendor, hiring, and regulatory decisions.',
                  after: 'Sees that fixing denial rate requires resolving vendor first, then hiring CDO, then hitting Q3 margin target. Every decision connected.',
                },
              ].map((row, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '240px 1fr 1fr', background: i % 2 === 0 ? '#fff' : '#F9FAFB', borderTop: '1px solid #F3F4F6' }}>
                  <div style={{ padding: '20px', borderRight: '1px solid #E5E7EB' }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>{row.capability}</span>
                  </div>
                  <div style={{ padding: '20px', borderRight: '1px solid #E5E7EB', background: i % 2 === 0 ? '#FFFAFA' : '#FEF9F9' }}>
                    <span style={{ fontSize: '13px', color: '#DC2626', fontStyle: 'italic', lineHeight: 1.6 }}>{row.before}</span>
                  </div>
                  <div style={{ padding: '20px', background: i % 2 === 0 ? '#F7FFF9' : '#F0FDF4' }}>
                    <span style={{ fontSize: '13px', color: '#059669', lineHeight: 1.6 }}>{row.after}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LIVE CLIENT ECONOMICS */}
        {section === 'clients' && (
          <div>
            <div className="tag" style={{ color: '#047857' }}>Live Client Economics</div>
            <h1 className="h1">Three clients. Real data. Real economics.</h1>
            <p className="body">Not projections. Value identified from actual client data loaded into Abarva today.</p>

            {/* Client selector */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
              {CLIENTS.map((c, i) => (
                <button key={i} onClick={() => setClientIdx(i)} className="client-btn"
                  style={{ background: clientIdx === i ? c.color : '#fff', color: clientIdx === i ? '#fff' : '#374151', borderColor: clientIdx === i ? c.color : '#E5E7EB' }}>
                  {c.name.split(' ').slice(0,2).join(' ')}
                </button>
              ))}
            </div>

            {/* Client header */}
            <div style={{ border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'start', padding: '24px', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: client.color, marginBottom: '4px' }}>{client.tag}</div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em', marginBottom: '2px' }}>{client.name}</div>
                  <div style={{ fontSize: '14px', color: '#9CA3AF' }}>{client.revenue}</div>
                </div>
                <span style={{ background: client.color + '15', color: client.color, fontSize: '12px', fontWeight: 700, padding: '5px 14px', borderRadius: '100px', letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>{client.tier}</span>
              </div>
              <div style={{ padding: '20px 24px', background: '#FFFBEB', borderBottom: '1px solid #FEF3C7' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#D97706', marginBottom: '8px' }}>What Abarva Found Before the First Meeting</div>
                <div style={{ fontSize: '15px', color: '#374151', lineHeight: 1.7, marginBottom: '8px' }}>{client.finding}</div>
                <div style={{ fontSize: '13px', color: '#D97706', fontStyle: 'italic' }}>"{client.wow}"</div>
              </div>

              {/* 8 metrics — 4 columns x 2 rows with office tags */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', background: '#E5E7EB', gap: '1px' }}>
                {client.metrics.map((m: any, i: number) => (
                  <div key={i} style={{ background: '#fff', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: m.red ? '#DC2626' : '#D97706', lineHeight: 1.3, flex: 1, paddingRight: '4px' }}>{m.label}</div>
                      <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' as const, padding: '2px 6px', borderRadius: '100px', background: '#F3F4F6', color: '#6B7280', flexShrink: 0, whiteSpace: 'nowrap' as const }}>{m.office}</span>
                    </div>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: m.red ? '#DC2626' : '#D97706', letterSpacing: '-0.025em', marginBottom: '2px' }}>{m.value}</div>
                    <div style={{ fontSize: '11px', color: '#9CA3AF' }}>{m.target}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Economics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr) 1.5fr', gap: '1px', background: '#E5E7EB', border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden' }}>
              {[
                { label: 'Client ROI', value: (client.roi * clientProgress).toFixed(1) + 'x', color: '#059669' },
                { label: 'Payback period', value: Math.round(client.payback * clientProgress) + ' months', color: '#1B4FD8' },
                { label: 'Consulting avoided', value: fmt(client.consultingAvoided * clientProgress), color: '#6D28D9' },
                { label: 'Year 1 savings', value: fmt(client.savingsRealized * clientProgress), color: '#B45309' },
              ].map((m, i) => (
                <div key={i} style={{ background: '#fff', padding: '20px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: m.color, height: '32px', display: 'flex', alignItems: 'flex-start', marginBottom: '8px', lineHeight: 1.3 }}>{m.label}</div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#111827', letterSpacing: '-0.025em' }}>{m.value}</div>
                </div>
              ))}
              <div style={{ background: '#EFF6FF', padding: '20px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#1B4FD8', marginBottom: '12px' }}>Abarva Year 1 Economics</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '13px', color: '#6B7280' }}>Platform fee</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#374151' }}>{fmt(client.platformFee * clientProgress)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #BFDBFE' }}>
                  <span style={{ fontSize: '13px', color: '#6B7280' }}>Outcome fee (15%)</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#1B4FD8' }}>{fmt(client.outcomeFee * clientProgress)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>Total Year 1</span>
                  <span style={{ fontSize: '20px', fontWeight: 800, color: '#059669', letterSpacing: '-0.02em' }}>{fmt(client.totalYear1 * clientProgress)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* REVENUE MODEL */}
        {section === 'revenue' && (
          <div>
            <div className="tag" style={{ color: '#B45309' }}>Revenue Model</div>
            <h1 className="h1">Three tiers. Two revenue streams.<br />One aligned incentive.</h1>
            <p className="body">Platform fee gets us in the door. Outcome fee is where we build the business. Technology consumption revenue builds automatically in Phase 2.</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '40px' }}>
              {TIERS.map((tier, i) => (
                <div key={i} className={'tier-card' + (tier.featured ? ' featured' : '')}>
                  {tier.featured && (
                    <div style={{ position: 'absolute' as const, top: '-12px', left: '50%', transform: 'translateX(-50%)', background: '#1B4FD8', color: '#fff', fontSize: '10px', fontWeight: 800, padding: '3px 14px', borderRadius: '100px', whiteSpace: 'nowrap' as const, letterSpacing: '0.08em' }}>MOST POPULAR</div>
                  )}
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>{tier.name}</div>
                  <div style={{ fontSize: '36px', fontWeight: 800, color: tier.color, letterSpacing: '-0.025em', marginBottom: '4px' }}>{tier.price}</div>
                  <div style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '6px' }}>per year · {tier.clients} clients Year 1</div>
                  <div style={{ fontSize: '13px', color: '#6B7280', fontStyle: 'italic', marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #F3F4F6' }}>{tier.best}</div>
                  {tier.features.map((f, fi) => (
                    <div key={fi} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'flex-start' }}>
                      <span style={{ color: tier.color, fontSize: '14px', marginTop: '0px', flexShrink: 0, fontWeight: 700 }}>✓</span>
                      <span style={{ fontSize: '13px', color: '#4B5563', lineHeight: 1.4 }}>{f}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Year 1 model */}
            <div style={{ border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden', marginBottom: '24px' }}>
              <div style={{ padding: '20px 24px', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                <span style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#6B7280' }}>Year 1 Financial Model · 100 Clients</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: '#E5E7EB' }}>
                {[
                  { label: 'Platform ARR', value: fmt(platformARR), sub: '40 / 40 / 20 tier mix', color: '#1B4FD8' },
                  { label: 'Outcome fees', value: fmt(24000000), sub: '30% of clients generating', color: '#059669' },
                  { label: 'Total Year 1', value: fmt(totalY1), sub: 'Conservative estimate', color: '#111827' },
                  { label: 'Revenue per client', value: fmt(totalY1/100), sub: 'Blended average', color: '#B45309' },
                ].map((m, i) => (
                  <div key={i} style={{ background: '#fff', padding: '24px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: m.color, height: '28px', display: 'flex', alignItems: 'flex-start', marginBottom: '8px' }}>{m.label}</div>
                    <div style={{ fontSize: '28px', fontWeight: 800, color: '#111827', letterSpacing: '-0.025em', marginBottom: '4px' }}>{m.value}</div>
                    <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{m.sub}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: '#E5E7EB', borderTop: '1px solid #E5E7EB' }}>
                {[
                  { label: 'Today', value: '3–5 clients', sub: 'Founder network', color: '#9CA3AF' },
                  { label: 'Month 3', value: '10 clients', sub: 'Referrals and events', color: '#1B4FD8' },
                  { label: 'Month 6', value: '25 clients', sub: 'Seed funding deployed', color: '#6D28D9' },
                  { label: 'Month 12', value: '100 clients', sub: 'Year 1 target', color: '#047857' },
                ].map((m, i) => (
                  <div key={i} style={{ background: '#F9FAFB', padding: '20px 24px', textAlign: 'center' as const }}>
                    <div style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: m.color, marginBottom: '6px' }}>{m.label}</div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em', marginBottom: '2px' }}>{m.value}</div>
                    <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{m.sub}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Comparable valuations */}
            <div style={{ border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden', marginBottom: '24px' }}>
              <div style={{ padding: '16px 24px', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                <span style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#6B7280' }}>Why Abarva Commands a Premium Multiple</span>
              </div>
              <div style={{ overflowX: 'auto' as const }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
                  <thead>
                    <tr style={{ background: '#F9FAFB' }}>
                      {['Company', 'Valuation', 'ARR', 'Multiple', 'Why'].map((h, i) => (
                        <th key={i} style={{ padding: '12px 20px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#6B7280', textAlign: 'left' as const, borderBottom: '1px solid #E5E7EB', borderRight: i < 4 ? '1px solid #E5E7EB' : 'none' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { company: 'Harvey AI', val: '$3B+', arr: '~$50M', mult: '60x', why: 'AI replaces legal work — outcome-accountable', color: '#1B4FD8' },
                      { company: 'Ambience Healthcare', val: '$2B+', arr: '~$30M', mult: '67x', why: 'AI replaces clinical documentation — health system clients', color: '#047857' },
                      { company: 'Databricks', val: '$62B', arr: '~$2B', mult: '31x', why: 'Enterprise data platform — SaaS model', color: '#6D28D9' },
                      { company: 'Abarva (projected)', val: 'Target: $2.2B', arr: '$56M', mult: '40–60x', why: 'AI replaces transformation consulting — outcome-based', color: '#B45309' },
                    ].map((row, i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#F9FAFB', borderTop: '1px solid #F3F4F6' }}>
                        <td style={{ padding: '14px 20px', fontSize: '14px', fontWeight: 700, color: row.color, borderRight: '1px solid #E5E7EB' }}>{row.company}</td>
                        <td style={{ padding: '14px 20px', fontSize: '14px', fontWeight: 600, color: '#111827', borderRight: '1px solid #E5E7EB' }}>{row.val}</td>
                        <td style={{ padding: '14px 20px', fontSize: '14px', color: '#374151', borderRight: '1px solid #E5E7EB' }}>{row.arr}</td>
                        <td style={{ padding: '14px 20px', fontSize: '14px', fontWeight: 700, color: '#059669', borderRight: '1px solid #E5E7EB' }}>{row.mult}</td>
                        <td style={{ padding: '14px 20px', fontSize: '13px', color: '#6B7280' }}>{row.why}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ padding: '20px 24px', background: '#EFF6FF', borderTop: '1px solid #BFDBFE' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#1B4FD8', marginBottom: '16px' }}>Valuation Scenarios at $56M ARR</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                  {[
                    { label: 'Conservative', mult: '20x', val: '$1.1B', color: '#6B7280' },
                    { label: 'Base Case', mult: '40x', val: '$2.2B', color: '#1B4FD8' },
                    { label: 'Premium', mult: '60x', val: '$3.4B', color: '#047857' },
                  ].map((s, i) => (
                    <div key={i} style={{ padding: '16px', background: '#fff', borderRadius: '8px', border: '1px solid #BFDBFE', textAlign: 'center' as const }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' as const, marginBottom: '6px' }}>{s.label}</div>
                      <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>{s.mult} multiple</div>
                      <div style={{ fontSize: '28px', fontWeight: 800, color: s.color, letterSpacing: '-0.025em' }}>{s.val}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ background: '#FFFBEB', border: '1px solid #FEF3C7', borderRadius: '12px', padding: '24px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#D97706', marginBottom: '10px' }}>Stream 3 · Technology Consumption · Phase 2</div>
              <div style={{ fontSize: '15px', color: '#374151', lineHeight: 1.75 }}>Every AI initiative Abarva recommends requires technology — AI infrastructure, data platforms, SaaS tools. When clients procure through Abarva, we earn 10–15% on consumption. This stream builds automatically as clients implement recommendations. No additional sales motion required.</div>
            </div>
          </div>
        )}

        {/* THE COMPOUNDING MOAT */}
        {section === 'compounding' && (
          <div>
            <div className="tag" style={{ color: '#6D28D9' }}>The Compounding Moat</div>
            <h1 className="h1">Abarva gets harder to compete with<br />every year.</h1>
            <p className="body">The Transformation Genome. Every client engagement adds to a proprietary dataset of what works, what fails, and why. No competitor can replicate five years of outcome data across two thousand clients.</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: '#E5E7EB', border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden', marginBottom: '32px' }}>
              {[
                { year: 'Year 1', clients: '100 clients', color: '#9CA3AF',
                  text: 'Abarva knows 100 companies deeply. Useful. A well-funded competitor could replicate it with 18 months of engineering.',
                  data: 'Outcome data: none yet' },
                { year: 'Year 2', clients: '300 clients', color: '#1B4FD8',
                  text: 'Outcome data from Year 1 improves recommendations. Knows what works and what fails across 100 companies.',
                  data: 'Outcome data: 100 companies' },
                { year: 'Year 3', clients: '800 clients', color: '#6D28D9',
                  text: 'The Transformation Genome emerges. Predicts failure before it happens. No competitor has this data.',
                  data: 'Outcome data: 600 companies' },
                { year: 'Year 5', clients: '2,000+ clients', color: '#047857',
                  text: 'Institutional memory of enterprise transformation. The data moat is insurmountable.',
                  data: 'Outcome data: 1,800 companies' },
              ].map((m, i) => (
                <div key={i} style={{ background: '#fff', padding: '24px', borderTop: '4px solid ' + m.color }}>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: m.color, letterSpacing: '-0.02em', marginBottom: '2px' }}>{m.year}</div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: m.color, marginBottom: '16px', opacity: 0.7 }}>{m.clients}</div>
                  <div style={{ fontSize: '13px', color: '#374151', lineHeight: 1.7, marginBottom: '16px' }}>{m.text}</div>
                  <div style={{ fontSize: '11px', color: '#9CA3AF', fontStyle: 'italic', fontWeight: 600 }}>{m.data}</div>
                </div>
              ))}
            </div>

            <div style={{ border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ padding: '16px 24px', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                <span style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#6B7280' }}>Comparable Companies — Same Model, Different Verticals</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: '#E5E7EB' }}>
                {[
                  { label: 'AI Legal Platform', text: 'AI replaces legal research and document review', outcome: '$3B+ valuation · 100+ law firm clients', color: '#1B4FD8' },
                  { label: 'AI Clinical Documentation', text: 'AI replaces physician documentation workflows', outcome: '$2B+ valuation · 500+ health system clients', color: '#047857' },
                  { label: 'AI Data Analytics', text: 'AI replaces traditional BI and data warehousing', outcome: '$28B valuation · 9,000+ enterprise clients', color: '#6D28D9' },
                ].map((m, i) => (
                  <div key={i} style={{ background: '#fff', padding: '24px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: m.color, marginBottom: '8px' }}>{m.label}</div>
                    <div style={{ fontSize: '13px', color: '#6B7280', lineHeight: 1.6, marginBottom: '10px' }}>{m.text}</div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#059669' }}>{m.outcome}</div>
                  </div>
                ))}
              </div>
              <div style={{ padding: '16px 24px', background: '#EFF6FF', borderTop: '1px solid #BFDBFE' }}>
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#1B4FD8' }}>Abarva: </span>
                <span style={{ fontSize: '14px', color: '#374151' }}>AI replaces enterprise transformation consulting. TAM is 10× larger. Outcome-based model creates superior revenue quality and higher multiples than pure SaaS.</span>
              </div>
            </div>

            {/* Maestro Leverage Model */}
            <div style={{ marginTop: '32px', border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ padding: '16px 24px', background: '#111827', borderBottom: '1px solid #21262D' }}>
                <span style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#2DD4C8' }}>The Maestro Leverage Model</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: '#E5E7EB' }}>
                {[
                  { year: 'Year 1', ratio: '1:5', color: '#9CA3AF', desc: 'One Maestro supports 5 active clients with full Abarva platform backing. Human expertise multiplied.' },
                  { year: 'Year 2', ratio: '1:15', color: '#1B4FD8', desc: 'Outcome data from Year 1 reduces diagnostic time. Maestro pattern-matches across 15 concurrent engagements.' },
                  { year: 'Year 3', ratio: '1:40', color: '#6D28D9', desc: 'Transformation Genome handles 80% of analysis automatically. Maestro focuses on judgment and relationships.' },
                  { year: 'Year 5', ratio: '1:100', color: '#047857', desc: 'Institutional knowledge of 2,000+ engagements. One Maestro manages 100 clients with AI doing the diagnostic work.' },
                ].map((m, i) => (
                  <div key={i} style={{ background: '#fff', padding: '24px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' as const, marginBottom: '8px' }}>{m.year}</div>
                    <div style={{ fontSize: '36px', fontWeight: 800, color: m.color, letterSpacing: '-0.03em', marginBottom: '12px' }}>{m.ratio}</div>
                    <div style={{ fontSize: '12px', color: '#374151', lineHeight: 1.6 }}>{m.desc}</div>
                  </div>
                ))}
              </div>
              <div style={{ padding: '14px 24px', background: '#FFFBEB', borderTop: '1px solid #FEF3C7' }}>
                <span style={{ fontSize: '13px', color: '#374151' }}>
                  <strong style={{ color: '#D97706' }}>Precedent: </strong>
                  Harvey AI went from 1 lawyer : 10 matters to 1 lawyer : 200 matters. Abarva applies the same leverage model to enterprise transformation.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TEAM */}
        {section === 'team' && (
          <div>
            <div className="tag" style={{ color: '#2DD4C8' }}>The Team</div>
            <h1 className="h1">Built by someone who has done this<br />for 20 years at the largest scale.</h1>
            <p className="body">Not a product person who hired consultants to validate the idea. The founder is the product.</p>

            {/* Founder card */}
            <div style={{ background: '#111827', borderRadius: '12px', padding: '40px', marginBottom: '24px', border: '1px solid #21262D' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap' as const, gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#2DD4C8', marginBottom: '8px' }}>Founder & CEO</div>
                  <div style={{ fontSize: '32px', fontWeight: 800, color: '#F9FAFB', letterSpacing: '-0.02em', marginBottom: '4px' }}>Abarva Founder</div>
                </div>
                <div style={{ padding: '6px 18px', borderRadius: '100px', background: '#2DD4C820', border: '1px solid #2DD4C840', fontSize: '13px', fontWeight: 600, color: '#2DD4C8' }}>Founder</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '12px', marginBottom: '28px' }}>
                {[
                  'Managing Director, Accenture — Data & AI North America Growth Lead',
                  'Built CADE (Catalyst Analytics Delivery Engine) on AWS Bedrock and Claude — deployed at Enterprise Healthcare Client — 40% productivity increase, 60% cost reduction',
                  '20+ years enterprise transformation across healthcare, financial services, retail',
                  'Led $200M+ in technology transformation engagements at Fortune 500 companies',
                ].map((bullet, i) => (
                  <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <span style={{ color: '#2DD4C8', fontSize: '14px', flexShrink: 0, marginTop: '2px', fontWeight: 700 }}>→</span>
                    <span style={{ fontSize: '14px', color: '#C9D1D9', lineHeight: 1.6 }}>{bullet}</span>
                  </div>
                ))}
              </div>
              <div style={{ background: '#451A03', borderLeft: '4px solid #2DD4C8', borderRadius: '0 8px 8px 0', padding: '20px 24px' }}>
                <div style={{ fontSize: '13px', color: '#FED7AA', lineHeight: 1.75, fontStyle: 'italic' }}>
                  "I spent 20 years watching enterprises pay $3-5M for consulting engagements that left no institutional memory. The consultants left, the knowledge walked out, and the next engagement started from zero. Abarva is the platform I wish I had built 10 years ago."
                </div>
                <div style={{ fontSize: '11px', color: '#D97706', fontWeight: 700, marginTop: '10px' }}>— Abarva Founder & CEO</div>
              </div>
            </div>

            {/* Proof of Concept */}
            <div style={{ background: '#111827', border: '1px solid #21262D', borderRadius: '12px', padding: '32px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap' as const, gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#2DD4C8', marginBottom: '8px' }}>Proven in Production — Not a Prototype</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#F9FAFB', letterSpacing: '-0.02em', marginBottom: '8px' }}>CADE — Catalyst Analytics Delivery Engine</div>
                  <div style={{ fontSize: '13px', color: '#9CA3AF', lineHeight: 1.6, maxWidth: '560px' }}>Built by the Abarva founder at Accenture and deployed at Enterprise Healthcare Client. CADE runs on AWS Bedrock and Claude — the same intelligence layer, same agent orchestration, same outcome-based model as Abarva.</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: '#21262D', borderRadius: '10px', overflow: 'hidden', marginBottom: '20px' }}>
                {[
                  { value: '40%', label: 'Productivity increase' },
                  { value: '60%', label: 'Cost reduction' },
                  { value: '6 weeks', label: 'Concept to production' },
                ].map((m, i) => (
                  <div key={i} style={{ padding: '24px', background: '#161B22', textAlign: 'center' as const }}>
                    <div style={{ fontSize: '32px', fontWeight: 800, color: '#2DD4C8', letterSpacing: '-0.025em', marginBottom: '6px' }}>{m.value}</div>
                    <div style={{ fontSize: '12px', color: '#6B7280' }}>{m.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ padding: '14px 18px', background: '#0D1117', borderRadius: '8px', border: '1px solid #21262D' }}>
                <span style={{ fontSize: '13px', color: '#9CA3AF' }}>CADE is the architectural proof of concept for Abarva — same intelligence layer, same agent orchestration, same outcome-based model. Enterprise Healthcare Client is the first reference customer.</span>
              </div>
            </div>

            {/* Planned Team */}
            <div style={{ border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden', marginBottom: '24px' }}>
              <div style={{ padding: '16px 24px', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                <span style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#6B7280' }}>Planned Team · Seed Round Hiring</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1px', background: '#E5E7EB' }}>
                {[
                  { role: 'Head of Engineering', color: '#1B4FD8', bg: '#EFF6FF', desc: 'Senior full-stack, AI/ML background, enterprise SaaS experience.', timing: 'Month 1' },
                  { role: 'Maestro #1', color: '#6D28D9', bg: '#F5F3FF', desc: 'Former Deloitte or McKinsey partner, healthcare or financial services background.', timing: 'Month 1' },
                  { role: 'Maestro #2', color: '#047857', bg: '#ECFDF5', desc: 'Former Big 4 Managing Director, retail or technology background.', timing: 'Month 2' },
                  { role: 'Enterprise Sales Director', color: '#B45309', bg: '#FFFBEB', desc: 'Former Salesforce or Veeva enterprise sales, $500K+ deal experience.', timing: 'Month 3' },
                ].map((m, i) => (
                  <div key={i} style={{ padding: '24px', background: '#fff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: m.color }}>{m.role}</div>
                      <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '100px', background: '#F3F4F6', color: '#6B7280', flexShrink: 0, marginLeft: '8px' }}>Hiring {m.timing}</span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#374151', lineHeight: 1.6 }}>{m.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Advisors */}
            <div style={{ border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ padding: '16px 24px', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                <span style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#6B7280' }}>Advisors — Recruiting</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: '#E5E7EB' }}>
                {[
                  { title: 'Healthcare CIO Advisor', name: '[Name TBD]', desc: 'Former CIO at major health system. Recruiting.', color: '#1B4FD8' },
                  { title: 'Financial Services Advisor', name: '[Name TBD]', desc: 'Former CTO at regional bank. Recruiting.', color: '#6D28D9' },
                  { title: 'AI/ML Technical Advisor', name: '[Name TBD]', desc: 'Former research scientist at Anthropic or Google DeepMind. Recruiting.', color: '#047857' },
                ].map((m, i) => (
                  <div key={i} style={{ padding: '24px', background: '#F9FAFB' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: m.color, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '8px' }}>{m.title}</div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#111827', marginBottom: '6px' }}>{m.name}</div>
                    <div style={{ fontSize: '13px', color: '#6B7280' }}>{m.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SEED ROUND */}
        {section === 'seed' && (
          <div>
            <div className="tag" style={{ color: '#1B4FD8' }}>Seed Round</div>
            <h1 className="h1">$10–15M to go from 5 clients to 100.</h1>
            <p className="body">The platform works. The unit economics work. The seed round accelerates distribution — more Maestros, more enterprise sales, deeper product.</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '32px' }}>
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
                <div key={i} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                    <span style={{ fontSize: '15px', fontWeight: 800, color: '#111827' }}>{m.label}</span>
                    <span style={{ fontSize: '28px', fontWeight: 800, color: m.color, letterSpacing: '-0.025em' }}>{m.pct}</span>
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: m.color, letterSpacing: '-0.02em', marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #F3F4F6' }}>{m.amount}</div>
                  {m.items.map((item, ii) => (
                    <div key={ii} style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
                      <span style={{ color: m.color, fontSize: '13px', flexShrink: 0, fontWeight: 700 }}>→</span>
                      <span style={{ fontSize: '13px', color: '#4B5563', lineHeight: 1.4 }}>{item}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* GTM section */}
            <div style={{ border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden', marginBottom: '24px' }}>
              <div style={{ padding: '16px 24px', background: '#111827', borderBottom: '1px solid #21262D' }}>
                <span style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#2DD4C8' }}>Go-to-Market — 5 Channels</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1px', background: '#E5E7EB' }}>
                {[
                  { label: 'Founder Network', desc: 'Direct CIO relationships built over 20 years at Accenture. First 3-5 clients close without outbound.', color: '#1B4FD8' },
                  { label: 'Maestro Network', desc: 'Each Maestro brings 5-10 warm enterprise relationships. 4 Maestros = 40 warm introductions.', color: '#6D28D9' },
                  { label: 'CIO Advisory Board', desc: 'Advisory board members are clients and referrers. Target: 6 members by Month 6.', color: '#047857' },
                  { label: 'Conference & Thought Leadership', desc: 'ViVE, HIMSS, Sibos. Founder-led speaking. CIO research reports.', color: '#B45309' },
                  { label: 'Inbound & Referral', desc: 'Client success drives referral. One happy CIO at a health system talks to 5 peers.', color: '#059669' },
                ].map((c, i) => (
                  <div key={i} style={{ padding: '20px', background: '#fff' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: c.color, marginBottom: '8px' }}>{c.label}</div>
                    <div style={{ fontSize: '12px', color: '#374151', lineHeight: 1.6 }}>{c.desc}</div>
                  </div>
                ))}
              </div>
              <div style={{ padding: '20px 24px', background: '#F9FAFB', borderTop: '1px solid #E5E7EB' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '24px' }}>
                  {[
                    { label: 'CAC', value: '$80K', color: '#6D28D9' },
                    { label: 'Year 1 LTV', value: '$4.7M', color: '#047857' },
                    { label: 'LTV:CAC', value: '58:1', color: '#1B4FD8' },
                    { label: 'Sales cycle', value: '60-90 days', color: '#B45309' },
                  ].map((m, i) => (
                    <div key={i} style={{ textAlign: 'center' as const }}>
                      <div style={{ fontSize: '10px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase' as const, marginBottom: '4px' }}>{m.label}</div>
                      <div style={{ fontSize: '24px', fontWeight: 800, color: m.color, letterSpacing: '-0.025em' }}>{m.value}</div>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '12px' }}>Monthly Client Ramp</div>
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '6px' }}>
                  {[
                    { month: 'Month 1', clients: 3, max: 100 },
                    { month: 'Month 3', clients: 8, max: 100 },
                    { month: 'Month 6', clients: 25, max: 100 },
                    { month: 'Month 9', clients: 55, max: 100 },
                    { month: 'Month 12', clients: 100, max: 100 },
                  ].map((row, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '64px', fontSize: '11px', color: '#6B7280', flexShrink: 0 }}>{row.month}</div>
                      <div style={{ flex: 1, height: '20px', background: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: (row.clients / row.max * 100) + '%', background: '#1B4FD8', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '6px' }}>
                          <span style={{ fontSize: '10px', fontWeight: 700, color: '#fff' }}>{row.clients}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '12px', padding: '32px' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#1B4FD8', marginBottom: '24px' }}>Why Now</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px' }}>
                {[
                  { title: 'Platform is proven', body: 'Three live clients. Real data. Real contradictions surfaced. Real value identified. The product works today, not in 18 months.' },
                  { title: 'Founder has the network', body: 'Direct relationships with CIOs across healthcare and financial services. First 5 clients are warm introductions, not cold outreach.' },
                  { title: 'Market is ready', body: 'Every board is demanding an AI strategy. Every CFO wants outcome-based contracts. The timing has never been better for this model.' },
                ].map((m, i) => (
                  <div key={i}>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: '#111827', marginBottom: '8px' }}>{m.title}</div>
                    <div style={{ fontSize: '14px', color: '#374151', lineHeight: 1.7 }}>{m.body}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
