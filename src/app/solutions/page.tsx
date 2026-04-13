'use client'
import { useState } from 'react'
import AbarvaNav from '@/components/AbarvaNav'

const T = {
  bg: '#0D1117', surface: '#161B22', surface2: '#1C2128',
  border: '#21262D', border2: '#30363D',
  text: '#E6EDF3', text2: '#C9D1D9', text3: '#8B949E',
  teal: '#2DD4C8', blue: '#4DA3FF', amber: '#F59E0B',
}

const SOLUTIONS = [
  {
    code: 'HP-01',
    name: 'Revenue Cycle Intelligence',
    vertical: 'Healthcare',
    objective: 'Optimise',
    problem: 'Your denial rate is costing you more than you report to the board.',
    products: ['Situation Intelligence', 'AI Investment Intelligence', 'Business Case Intelligence', 'Vendor Intelligence', 'Outcome Intelligence'],
    value: '$15–94M annually',
    href: '/solutions/revenue-cycle-intelligence',
    color: T.teal,
  },
  {
    code: 'HP-02',
    name: 'Patient Access & Growth',
    vertical: 'Healthcare',
    objective: 'Grow',
    problem: 'Your referral leakage is invisible until patients leave the network.',
    products: ['Situation Intelligence', 'Workforce Intelligence', 'Data Estate Intelligence', 'Outcome Intelligence'],
    value: '$8–40M annually',
    href: '/solutions/patient-access-growth',
    color: T.teal,
  },
  {
    code: 'BK-01',
    name: 'AI Portfolio Accountability',
    vertical: 'Financial Services',
    objective: 'Protect',
    problem: 'You are spending on AI. Do you know if it is working?',
    products: ['Outcome Intelligence', 'AI Investment Intelligence', 'Business Case Intelligence', 'Delivery Intelligence'],
    value: '$12–60M annually',
    href: '/solutions/ai-portfolio-accountability',
    color: T.blue,
  },
  {
    code: 'BK-02',
    name: 'Customer Revenue Intelligence',
    vertical: 'Financial Services',
    objective: 'Grow',
    problem: 'Digital adoption at 41% while peers are at 67%.',
    products: ['Situation Intelligence', 'AI Investment Intelligence', 'Vendor Intelligence', 'Business Case Intelligence'],
    value: '$20–99M annually',
    href: '/solutions/customer-revenue-intelligence',
    color: T.blue,
  },
  {
    code: 'RT-01',
    name: 'Supply Chain AI Rationalization',
    vertical: 'Retail',
    objective: 'Optimise',
    problem: 'You have 14 supply chain tools. 6 are redundant.',
    products: ['Procurement Intelligence', 'AI Investment Intelligence', 'Business Case Intelligence', 'Delivery Intelligence'],
    value: '$30–120M annually',
    href: '/solutions/supply-chain-ai',
    color: T.amber,
  },
  {
    code: 'RT-02',
    name: 'Customer Intelligence',
    vertical: 'Retail',
    objective: 'Grow',
    problem: 'Conversion at 2.3% while category peers are at 3.8%.',
    products: ['Situation Intelligence', 'AI Investment Intelligence', 'Vendor Intelligence', 'Outcome Intelligence'],
    value: '$40–248M annually',
    href: '/solutions/customer-intelligence',
    color: T.amber,
  },
]

const VERTICALS = ['All', 'Healthcare', 'Financial Services', 'Retail']
const OBJECTIVES = ['All', 'Grow', 'Optimise', 'Protect']

export default function SolutionsPage() {
  const [vertical, setVertical] = useState('All')
  const [objective, setObjective] = useState('All')

  const filtered = SOLUTIONS.filter(s =>
    (vertical === 'All' || s.vertical === vertical) &&
    (objective === 'All' || s.objective === objective)
  )

  const pill = (label: string, active: boolean, onClick: () => void) => (
    <button key={label} onClick={onClick} style={{
      padding: '6px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: active ? 700 : 500,
      background: active ? T.teal : T.surface2, color: active ? '#0D1117' : T.text3,
      border: `1px solid ${active ? T.teal : T.border2}`, cursor: 'pointer', fontFamily: 'inherit',
      transition: 'all 150ms',
    }}>{label}</button>
  )

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: 'DM Sans, Inter, -apple-system, sans-serif' }}>
      <AbarvaNav />

      {/* Header */}
      <div style={{ borderBottom: '1px solid ' + T.border, padding: '48px 0 40px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 32px' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: T.teal, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '12px' }}>Solution Library</div>
          <h1 style={{ fontSize: 'clamp(26px,3.5vw,42px)', fontWeight: 800, color: T.text, lineHeight: 1.15, margin: '0 0 14px' }}>
            The problems AbarVa solves.
          </h1>
          <p style={{ fontSize: '16px', color: T.text3, lineHeight: 1.6, margin: '0', maxWidth: '600px' }}>
            Every solution is a pre-configured combination of Intelligence products,
            calibrated to your vertical and your situation.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '28px 32px 0' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
          {VERTICALS.map(v => pill(v, vertical === v, () => setVertical(v)))}
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {OBJECTIVES.map(o => pill(o, objective === o, () => setObjective(o)))}
        </div>
      </div>

      {/* Solution cards */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 32px 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {filtered.map(s => (
            <div key={s.code} style={{
              background: T.surface, border: '1px solid ' + T.border,
              borderTop: '3px solid ' + s.color,
              borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column',
              transition: 'border-color 200ms, box-shadow 200ms',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = `0 0 0 1px ${s.color}40`; (e.currentTarget as HTMLElement).style.borderColor = s.color + '60' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; (e.currentTarget as HTMLElement).style.borderColor = T.border }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', fontWeight: 700, color: s.color }}>{s.code}</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <span style={{ padding: '2px 7px', background: s.color + '20', border: '1px solid ' + s.color + '40', borderRadius: '10px', fontSize: '10px', fontWeight: 700, color: s.color }}>
                    {s.vertical.toUpperCase()}
                  </span>
                  <span style={{ padding: '2px 7px', background: T.surface2, border: '1px solid ' + T.border2, borderRadius: '10px', fontSize: '10px', fontWeight: 600, color: T.text3 }}>
                    {s.objective.toUpperCase()}
                  </span>
                </div>
              </div>

              <h3 style={{ fontSize: '18px', fontWeight: 700, color: T.text, margin: '0 0 10px', lineHeight: 1.3 }}>{s.name}</h3>

              <p style={{ fontSize: '13px', color: T.text3, lineHeight: 1.6, margin: '0 0 16px', fontStyle: 'italic' }}>
                &ldquo;{s.problem}&rdquo;
              </p>

              {/* Products activated */}
              <div style={{ marginBottom: '14px', flex: 1 }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Products activated:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                  {s.products.map(p => (
                    <span key={p} style={{ padding: '3px 8px', background: T.surface2, border: '1px solid ' + T.border2, borderRadius: '4px', fontSize: '10px', color: T.text2 }}>
                      {p.replace(' Intelligence', '')}
                    </span>
                  ))}
                </div>
              </div>

              {/* Value */}
              <div style={{ marginBottom: '16px', padding: '10px 12px', background: T.bg, borderRadius: '8px', border: '1px solid ' + T.border }}>
                <span style={{ fontSize: '10px', color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Typical value: </span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: s.color }}>{s.value}</span>
              </div>

              <a href={s.href} style={{ display: 'block', padding: '11px', background: s.color, color: '#0D1117', borderRadius: '8px', fontSize: '13px', fontWeight: 700, textDecoration: 'none', textAlign: 'center', transition: 'opacity 150ms' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '0.85'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '1'}>
                Explore Solution →
              </a>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: T.text3 }}>
            No solutions match the selected filters.
          </div>
        )}
      </div>
    </div>
  )
}
