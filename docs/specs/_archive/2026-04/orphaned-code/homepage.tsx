'use client'
import { useState } from 'react'
import AbarvaNav from '@/components/AbarvaNav'

const BG = '#060A12'
const CARD = '#0D1520'
const BORDER = '#1C2D45'
const TEAL = '#2DD4C8'
const WHITE = '#EFF6FF'
const MUTED = '#94A3B8'

const SOLUTIONS = [
  {
    id: 'pdlc',
    name: 'AI-Powered PDLC',
    owner: 'CIO · All verticals',
    color: '#6366F1',
    href: '/solutions/pdlc',
    problem: '"We\'re spending $300M in capital. Time to production is 16 months. My engineers aren\'t building — they\'re in meetings."',
    value: '$18M consulting reduction',
    metric: '16mo → 8mo delivery',
  },
  {
    id: 'delivery',
    name: 'AI-Powered Transformation Delivery',
    owner: 'CIO · CTO · All verticals',
    color: TEAL,
    href: '/solutions/delivery',
    problem: '"80 consultants on site. 70% of their time is getting up to speed. Knowledge walks out the door every Friday."',
    value: '4 Maestros replace 40 consultants',
    metric: 'Knowledge stays permanently',
  },
  {
    id: 'margin',
    name: 'Margin Optimization',
    owner: 'CEO · CFO · COO',
    color: '#F59E0B',
    href: '/solutions/margin',
    problem: '"Operating margin 1.8% against a 4% target. Don\'t know exactly where the margin is leaking or which lever to pull first."',
    value: '$60–120M annual recovery',
    metric: 'Unlocks by vertical',
  },
]

const PRODUCTS = [
  { name: 'Situation',     q: 'What\'s actually broken — and what is it costing?', href: '/diagnose?client=meridian',    color: '#EF4444' },
  { name: 'Strategy',      q: 'Where should we place our AI bets?',               href: '/ai-strategy?client=meridian', color: '#6366F1' },
  { name: 'Vendor',        q: 'Which vendor wins in our situation?',              href: '/select?client=meridian',       color: '#F59E0B' },
  { name: 'Business Case', q: 'How do we justify this to the board?',            href: '/justify?client=meridian',      color: '#34D399' },
  { name: 'Outcomes',      q: 'Did it work — and can we prove it?',             href: '/outcomes?client=meridian',     color: TEAL },
]

const CLIENTS = [
  { id: 'meridian',     name: 'Meridian Health',  sub: 'Healthcare',         color: TEAL,      href: '/diagnose?client=meridian' },
  { id: 'firstcapital', name: 'First Capital',    sub: 'Financial Services', color: '#6366F1', href: '/diagnose?client=firstcapital' },
  { id: 'apexretail',   name: 'Apex Retail',      sub: 'Retail',             color: '#F59E0B', href: '/diagnose?client=apexretail' },
]

export default function Home() {
  const [hSol, setHSol] = useState<string | null>(null)
  const [hProd, setHProd] = useState<string | null>(null)

  return (
    <div style={{ background: BG, minHeight: '100vh', fontFamily: '"DM Sans", sans-serif', color: WHITE }}>
      <AbarvaNav />

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 28px' }}>

        {/* ── HERO ──────────────────────────────────────────────── */}
        <div style={{ padding: '80px 0 64px', textAlign: 'center' }}>
          <div style={{ fontFamily: 'monospace', fontSize: '11px', color: TEAL, letterSpacing: '.18em', textTransform: 'uppercase', marginBottom: '20px' }}>
            Enterprise transformation · AI-native · Outcome-accountable
          </div>
          <h1 style={{ fontFamily: 'Georgia,serif', fontSize: '54px', fontWeight: 500, color: WHITE, lineHeight: 1.2, margin: '0 auto 20px', maxWidth: '820px' }}>
            Know it.<br />Build it.<br /><span style={{ color: '#2DD4C8' }}>Own it.</span>
          </h1>
          <p style={{ fontSize: '17px', color: MUTED, maxWidth: '560px', margin: '0 auto 36px', lineHeight: 1.75 }}>
            AbarVa builds the knowledge layer consulting never could. Find what's broken. Build the intelligence that captures what you learn. Own it permanently — yours, compounding, forever.
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/diagnose?client=meridian" style={{ background: TEAL, color: BG, padding: '13px 28px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>
              See it with Meridian Health →
            </a>
            <a href="/investor" style={{ border: `1px solid ${BORDER}`, color: WHITE, padding: '13px 24px', borderRadius: '8px', fontSize: '14px', textDecoration: 'none' }}>
              Investor view
            </a>
            <a href="/admin" style={{ color: MUTED, padding: '13px 16px', fontSize: '13px', textDecoration: 'none' }}>
              Maestro login →
            </a>
          </div>
        </div>

        {/* ── SOLUTIONS ─────────────────────────────────────────── */}
        <div style={{ marginBottom: '64px' }}>
          <div style={{ fontFamily: 'monospace', fontSize: '10px', color: TEAL, letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: '6px' }}>
            Three solutions
          </div>
          <div style={{ fontSize: '13px', color: MUTED, marginBottom: '20px' }}>
            Each one diagnoses, prescribes, executes, and tracks. AbarVa earns nothing until outcomes are verified.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {SOLUTIONS.map(s => (
              <a
                key={s.id}
                href={s.href}
                style={{ textDecoration: 'none' }}
                onMouseEnter={() => setHSol(s.id)}
                onMouseLeave={() => setHSol(null)}
              >
                <div style={{
                  background: CARD,
                  border: `1px solid ${hSol === s.id ? s.color : BORDER}`,
                  borderLeft: `4px solid ${s.color}`,
                  borderRadius: '0 12px 12px 0',
                  padding: '20px 24px',
                  display: 'grid',
                  gridTemplateColumns: '260px 1fr 200px',
                  gap: '24px',
                  alignItems: 'center',
                  transition: 'border-color .15s',
                }}>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 500, color: WHITE, marginBottom: '5px' }}>{s.name}</div>
                    <div style={{ fontFamily: 'monospace', fontSize: '9px', color: MUTED, letterSpacing: '.06em', textTransform: 'uppercase', background: '#1C2D45', display: 'inline-block', padding: '2px 8px', borderRadius: '4px' }}>{s.owner}</div>
                  </div>
                  <div style={{ fontSize: '13px', color: MUTED, fontStyle: 'italic', lineHeight: 1.6 }}>{s.problem}</div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '14px', fontWeight: 500, color: s.color, marginBottom: '3px' }}>{s.value}</div>
                    <div style={{ fontSize: '11px', color: MUTED, marginBottom: '10px' }}>{s.metric}</div>
                    <div style={{ fontSize: '12px', color: hSol === s.id ? TEAL : '#374151', transition: 'color .15s' }}>Explore →</div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* ── PRODUCTS ──────────────────────────────────────────── */}
        <div style={{ marginBottom: '64px' }}>
          <div style={{ fontFamily: 'monospace', fontSize: '10px', color: TEAL, letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: '6px' }}>
            Five products — the intelligence engine
          </div>
          <div style={{ fontSize: '13px', color: MUTED, marginBottom: '20px' }}>
            Solutions activate products in sequence. Products can also be used independently.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0,1fr))', gap: '10px' }}>
            {PRODUCTS.map(p => (
              <a
                key={p.name}
                href={p.href}
                style={{ textDecoration: 'none' }}
                onMouseEnter={() => setHProd(p.name)}
                onMouseLeave={() => setHProd(null)}
              >
                <div style={{
                  background: CARD,
                  border: `1px solid ${hProd === p.name ? TEAL : BORDER}`,
                  borderTop: `3px solid ${p.color}`,
                  borderRadius: '0 0 12px 12px',
                  padding: '18px 16px',
                  height: '156px',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'border-color .15s',
                }}>
                  <div style={{ fontFamily: 'monospace', fontSize: '10px', color: TEAL, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '10px' }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize: '12px', color: MUTED, fontStyle: 'italic', lineHeight: 1.6, flex: 1 }}>
                    "{p.q}"
                  </div>
                  <div style={{ fontSize: '11px', color: hProd === p.name ? TEAL : '#374151', marginTop: '10px', transition: 'color .15s' }}>
                    Open →
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* ── PROOF POINT ───────────────────────────────────────── */}
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '36px 40px', marginBottom: '64px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '28px' }}>
            <div style={{ maxWidth: '420px' }}>
              <div style={{ fontFamily: 'monospace', fontSize: '10px', color: TEAL, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: '10px' }}>
                Proven in production
              </div>
              <div style={{ fontFamily: 'Georgia,serif', fontSize: '18px', color: WHITE, lineHeight: 1.5, marginBottom: '8px' }}>
                Major health system · Live deployment
              </div>
              <div style={{ fontSize: '13px', color: MUTED, lineHeight: 1.6 }}>
                Knowledge layer ingested 225 scheduled jobs, 160 database schemas, 236 Tableau workbooks. The system now answers in seconds what used to take weeks of asking the right person.
              </div>
            </div>
            <div style={{ display: 'flex', gap: '56px', flexWrap: 'wrap' }}>
              {[
                { v: '40%',  l: 'Productivity increase' },
                { v: '60%',  l: 'Consulting cost reduction' },
                { v: '8×',   l: 'Faster knowledge access' },
              ].map((s, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Georgia,serif', fontSize: '40px', fontWeight: 500, color: TEAL, lineHeight: 1, marginBottom: '6px' }}>{s.v}</div>
                  <div style={{ fontSize: '12px', color: MUTED, maxWidth: '100px' }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── CLIENT ENTRY POINTS ───────────────────────────────── */}
        <div style={{ textAlign: 'center', paddingBottom: '72px' }}>
          <div style={{ fontFamily: 'Georgia,serif', fontSize: '26px', fontWeight: 500, color: WHITE, marginBottom: '10px' }}>
            Ready to see your situation?
          </div>
          <div style={{ fontSize: '14px', color: MUTED, marginBottom: '28px' }}>
            Load Meridian Health, First Capital, or Apex Retail — each with real client data.
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {CLIENTS.map(c => (
              <a
                key={c.id}
                href={c.href}
                style={{
                  background: CARD, border: `1px solid ${BORDER}`,
                  padding: '14px 22px', borderRadius: '10px',
                  textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = c.color }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = BORDER }}
              >
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: c.color, flexShrink: 0 }} />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: WHITE }}>{c.name}</div>
                  <div style={{ fontSize: '11px', color: MUTED }}>{c.sub}</div>
                </div>
              </a>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
