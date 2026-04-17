'use client'
import { Suspense } from 'react'
import AbarvaNav from '@/components/AbarvaNav'

const BG     = '#FAFAF9'
const DARK   = '#0F0E0D'
const DBG    = '#0F0E0D'
const BODY   = '#3C3C3C'
const MUTED  = '#706D66'
const BORDER = '#E5E7EB'
const TEAL   = '#2DD4C8'
const BLUE   = '#4DA3FF'
const AMBER  = '#F59E0B'
const GREEN  = '#34D399'
const SANS   = 'DM Sans, sans-serif'
const MONO   = 'JetBrains Mono, monospace'
const SERIF  = 'Georgia, serif'

const PHASES = [
  {
    id: 0, label: 'READINESS', duration: '2–3 days', color: TEAL,
    desc: 'Before anything starts. Data uploaded, situation confirmed, Genome matched.',
    items: ['0.1 Situation Confirmation', '0.2 AI Aspiration', '0.3 Data Readiness', '0.4 Genome Pre-Match', '0.5 Scope Confirmation'],
    itemLabel: 'Steps',
  },
  {
    id: 1, label: 'DIAGNOSE', duration: '1–2 weeks', color: BLUE,
    desc: 'What is broken, what it costs, what the data actually shows.',
    items: ['Situation Intelligence', 'Contradiction Intelligence', 'Data Intelligence'],
    itemLabel: 'Modules',
  },
  {
    id: 2, label: 'PRESCRIBE', duration: '1–2 weeks', color: AMBER,
    desc: 'What to do about it, in what order, with what vendors, at what cost.',
    items: ['Technology Intelligence', 'Vendor Intelligence', 'Architecture Intelligence', 'Business Case Intelligence'],
    itemLabel: 'Modules',
  },
  {
    id: 3, label: 'VALUE REALIZATION', duration: 'ongoing', color: GREEN,
    desc: 'AI Delivery. Outcome tracking. Fee on verified savings.',
    items: ['AI Delivery Intelligence', 'Outcome Intelligence', 'Monthly Actuals', 'Fee Calculation'],
    itemLabel: 'Modules',
  },
]

const MODULE_PHASES = [
  {
    phase: 1, label: 'DIAGNOSE', color: BLUE,
    desc: 'What is broken, what it costs, what the data actually shows',
    modules: [
      { num: '01', name: 'Situation Intelligence',    desc: 'What is broken — and what it costs',                example: '7 issues · $224M at risk · 94% confidence' },
      { num: '02', name: 'Contradiction Intelligence', desc: 'What was promised vs what the data shows',          example: 'SLA never enforced · $48M/yr outsourced' },
      { num: '03', name: 'Data Intelligence',          desc: 'Is your data ready to support AI?',                example: '72/100 readiness · 2 datasets missing' },
    ],
  },
  {
    phase: 2, label: 'PRESCRIBE', color: AMBER,
    desc: 'What to do about it, in what order, with what vendors, at what cost',
    modules: [
      { num: '04', name: 'Technology Intelligence',    desc: 'Stack inventory, spend, and contract windows',     example: '312 apps · 42% redundant · $38M shadow IT' },
      { num: '05', name: 'Vendor Intelligence',        desc: 'Which vendor wins in your situation — not theirs', example: 'Ensemble SLA violation identified' },
      { num: '06', name: 'Architecture Intelligence',  desc: 'Target AI stack blueprint for 3 years out',        example: 'Epic integration path for Q3 2026' },
      { num: '07', name: 'Business Case Intelligence', desc: 'CFO-grade numbers the board will sign off on',     example: '$94M case · 5.7x ROI · KPMG-verifiable' },
    ],
  },
  {
    phase: 3, label: 'VALUE REALIZATION', color: GREEN,
    desc: 'AI Delivery. Outcome tracking. Fee on verified savings',
    modules: [
      { num: '08', name: 'AI Delivery Intelligence',   desc: 'Portfolio, blockers, delivery roadmap',            example: '28 AI initiatives · F011 pattern active' },
      { num: '09', name: 'Outcome Intelligence',       desc: 'Baseline locked — verified delta — fee earned',    example: '$22.4M verified · Month 3 · Audited' },
      { num: '10', name: 'Monthly Actuals',            desc: 'Are the numbers moving right now?',                example: 'Denial rate 16.1% ↓ from 18.4% baseline' },
      { num: '11', name: 'Fee Calculation',            desc: 'What AbarVa has earned — verified',               example: '$3.92M fee · Invoice MER-FEE-001' },
    ],
  },
]

function PageInner() {
  return (
    <div style={{ fontFamily: SANS, background: BG, minHeight: '100vh' }}>
      <AbarvaNav activePage="ai-value-realization" />

      {/* ── SECTION 1: HERO ──────────────────────────────────────────────── */}
      <section style={{ background: BG, padding: '88px 48px 80px', textAlign: 'center' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto' }}>
          <div style={{ fontFamily: MONO, fontSize: '12px', fontWeight: 700, color: TEAL, letterSpacing: '.16em', textTransform: 'uppercase', marginBottom: '28px' }}>
            AI VALUE REALIZATION · 3 PHASES · 11 MODULES
          </div>
          <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(40px, 5.5vw, 68px)', fontWeight: 400, color: DARK, lineHeight: 1.15, margin: '0 0 24px' }}>
            A structured path from broken AI<br />programme to verified outcome.
          </h1>
          <p style={{ fontSize: 'clamp(17px, 2vw, 22px)', color: BODY, lineHeight: 1.7, margin: '0 0 44px', maxWidth: '680px', marginLeft: 'auto', marginRight: 'auto' }}>
            AbarVa guides client and Maestro through every step — from situation diagnosis to fee calculation on verified savings.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/ai-strategy?client=meridian" style={{ display: 'inline-block', background: DARK, color: BG, fontSize: '16px', fontWeight: 600, padding: '15px 32px', borderRadius: '7px', textDecoration: 'none' }}>
              See it with Meridian →
            </a>
            <a href="#modules" style={{ display: 'inline-block', background: 'transparent', color: DARK, fontSize: '16px', fontWeight: 600, padding: '15px 32px', borderRadius: '7px', textDecoration: 'none', border: `1px solid ${BORDER}` }}>
              See the 11 modules ↓
            </a>
          </div>
        </div>
      </section>

      {/* ── SECTION 2: THE JOURNEY ───────────────────────────────────────── */}
      <section style={{ background: DBG, padding: '80px 48px' }}>
        <div style={{ maxWidth: '1360px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <div style={{ fontFamily: MONO, fontSize: '11px', fontWeight: 700, color: TEAL, letterSpacing: '.16em', textTransform: 'uppercase', marginBottom: '20px' }}>
              THE JOURNEY
            </div>
            <h2 style={{ fontFamily: SERIF, fontSize: 'clamp(30px, 4vw, 50px)', fontWeight: 400, color: '#FAFAF9', lineHeight: 1.2, margin: 0 }}>
              How a Maestro takes a client from<br />problem to verified outcome.
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: 'rgba(255,255,255,0.07)', borderRadius: '12px', overflow: 'hidden' }}>
            {PHASES.map((phase) => (
              <div key={phase.id} style={{ background: '#0D1520', padding: '32px 28px 36px' }}>
                <div style={{ borderTop: `3px solid ${phase.color}`, paddingTop: '20px', marginBottom: '18px' }}>
                  <div style={{ fontFamily: MONO, fontSize: '10px', color: 'rgba(255,255,255,0.28)', letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Phase {phase.id} · {phase.duration}
                  </div>
                  <div style={{ fontFamily: SANS, fontSize: '20px', fontWeight: 700, color: phase.color, letterSpacing: '.02em' }}>
                    {phase.label}
                  </div>
                </div>
                <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.65, margin: '0 0 20px' }}>
                  {phase.desc}
                </p>
                <div style={{ borderTop: `1px solid rgba(255,255,255,0.07)`, paddingTop: '16px' }}>
                  <div style={{ fontFamily: MONO, fontSize: '9px', color: 'rgba(255,255,255,0.18)', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: '10px' }}>
                    {phase.itemLabel}
                  </div>
                  {phase.items.map((item, j) => (
                    <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '8px' }}>
                      <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: phase.color, marginTop: '7px', flexShrink: 0, opacity: 0.65 }} />
                      <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '36px', textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '12px 24px' }}>
              <span style={{ fontFamily: MONO, fontSize: '12px', color: TEAL }}>⊘</span>
              <span style={{ fontFamily: SANS, fontSize: '15px', color: 'rgba(255,255,255,0.4)' }}>
                Nothing moves without client approval. Each phase is gate-locked.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 3: 11 MODULES ────────────────────────────────────────── */}
      <section id="modules" style={{ background: BG, padding: '80px 48px' }}>
        <div style={{ maxWidth: '1360px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <div style={{ fontFamily: MONO, fontSize: '11px', fontWeight: 700, color: TEAL, letterSpacing: '.16em', textTransform: 'uppercase', marginBottom: '20px' }}>
              THE MODULES
            </div>
            <h2 style={{ fontFamily: SERIF, fontSize: 'clamp(30px, 4vw, 50px)', fontWeight: 400, color: DARK, lineHeight: 1.2, margin: 0 }}>
              11 modules. Each one does<br />one thing, precisely.
            </h2>
          </div>

          {/* Phase groups */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '52px' }}>
            {MODULE_PHASES.map(phaseGroup => (
              <div key={phaseGroup.phase}>
                {/* Phase header bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px', paddingBottom: '20px', borderBottom: `2px solid ${phaseGroup.color}22` }}>
                  <div style={{ width: '4px', height: '48px', borderRadius: '2px', background: phaseGroup.color, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontFamily: MONO, fontSize: '10px', color: phaseGroup.color, letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Phase {phaseGroup.phase}
                    </div>
                    <div style={{ fontFamily: SANS, fontSize: '24px', fontWeight: 700, color: DARK, lineHeight: 1 }}>{phaseGroup.label}</div>
                  </div>
                  <div style={{ fontSize: '16px', color: MUTED, lineHeight: 1.5, maxWidth: '480px' }}>{phaseGroup.desc}</div>
                  <div style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: '10px', color: MUTED, whiteSpace: 'nowrap' }}>
                    {phaseGroup.modules.length} modules
                  </div>
                </div>

                {/* Module cards */}
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${phaseGroup.modules.length}, 1fr)`, gap: '16px' }}>
                  {phaseGroup.modules.map(mod => (
                    <div key={mod.num} style={{ background: '#FFFFFF', border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '28px 26px 24px', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                      {/* Watermark number */}
                      <div style={{ position: 'absolute', bottom: '-16px', right: '16px', fontFamily: MONO, fontSize: '96px', fontWeight: 700, color: `${phaseGroup.color}0D`, lineHeight: 1, userSelect: 'none', pointerEvents: 'none' }}>
                        {mod.num}
                      </div>

                      {/* Module number */}
                      <div style={{ fontFamily: MONO, fontSize: '11px', fontWeight: 700, color: phaseGroup.color, letterSpacing: '.12em', marginBottom: '14px' }}>
                        {mod.num}
                      </div>

                      {/* Name */}
                      <div style={{ fontSize: '20px', fontWeight: 700, color: DARK, lineHeight: 1.25, marginBottom: '12px' }}>
                        {mod.name}
                      </div>

                      {/* Desc */}
                      <div style={{ fontSize: '15px', color: BODY, lineHeight: 1.6, marginBottom: '20px', flex: 1 }}>
                        {mod.desc}
                      </div>

                      {/* Meridian example */}
                      <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: '14px' }}>
                        <div style={{ fontFamily: MONO, fontSize: '9px', color: MUTED, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: '6px' }}>
                          Meridian
                        </div>
                        <div style={{ fontFamily: MONO, fontSize: '12px', color: phaseGroup.color, lineHeight: 1.5 }}>
                          {mod.example}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 4: SEE IT LIVE ───────────────────────────────────────── */}
      <section style={{ background: DBG, padding: '80px 48px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontFamily: MONO, fontSize: '11px', fontWeight: 700, color: TEAL, letterSpacing: '.16em', textTransform: 'uppercase', marginBottom: '20px' }}>
            SEE IT LIVE
          </div>
          <h2 style={{ fontFamily: SERIF, fontSize: 'clamp(30px, 4vw, 50px)', fontWeight: 400, color: '#FAFAF9', lineHeight: 1.2, margin: '0 0 52px' }}>
            See AI Value Realization running<br />on real client data.
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
            {[
              { name: 'Meridian Health System', vertical: 'Healthcare', color: '#2DD4C8', href: '/ai-strategy?client=meridian' },
              { name: 'Arcturus Financial Group', vertical: 'Financial Services', color: '#818CF8', href: '/ai-strategy?client=arcturus' },
            ].map(c => (
              <div key={c.name} style={{ background: '#0D1520', border: '1px solid #1F2937', borderTop: `3px solid ${c.color}`, borderRadius: '12px', padding: '32px 32px 28px', textAlign: 'left' }}>
                <div style={{ fontFamily: MONO, fontSize: '10px', color: 'rgba(255,255,255,0.28)', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: '12px' }}>
                  {c.vertical}
                </div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: '#F9FAFB', marginBottom: '24px', lineHeight: 1.3 }}>
                  {c.name}
                </div>
                <a href={c.href} style={{ display: 'inline-block', background: c.color, color: DARK, fontSize: '15px', fontWeight: 700, padding: '12px 26px', borderRadius: '7px', textDecoration: 'none' }}>
                  Enter AVR →
                </a>
              </div>
            ))}
          </div>

          <p style={{ fontFamily: MONO, fontSize: '11px', color: 'rgba(255,255,255,0.22)', letterSpacing: '.07em', margin: 0 }}>
            Composite organisations. Real data patterns. No signup required.
          </p>
        </div>
      </section>
    </div>
  )
}

export default function AIValueRealizationPage() {
  return (
    <Suspense fallback={<div style={{ height: '60px', background: '#060A12' }} />}>
      <PageInner />
    </Suspense>
  )
}
