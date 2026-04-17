'use client'
import { Suspense } from 'react'
import AbarvaNav from '@/components/AbarvaNav'

const BG    = '#FAFAF9'
const DARK  = '#0F0E0D'
const DBG   = '#0F0E0D'
const BODY  = '#3C3C3C'
const MUTED = '#706D66'
const BORDER = '#E5E7EB'
const TEAL  = '#2DD4C8'
const BLUE  = '#4DA3FF'
const AMBER = '#F59E0B'
const GREEN = '#34D399'
const SANS  = 'DM Sans, sans-serif'
const MONO  = 'JetBrains Mono, monospace'
const SERIF = 'Georgia, serif'

// ── Phase timeline data ───────────────────────────────────────────────────────
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

// ── Module card data ──────────────────────────────────────────────────────────
const MODULES = [
  { num: '01', phase: 1, phaseLabel: 'DIAGNOSE',          phaseColor: BLUE,  name: 'Situation Intelligence',     desc: 'What is broken — and what it costs',                  example: '7 issues · $224M at risk · 94% confidence' },
  { num: '02', phase: 1, phaseLabel: 'DIAGNOSE',          phaseColor: BLUE,  name: 'Contradiction Intelligence',  desc: 'What was promised vs what the data shows',             example: 'SLA never enforced · $48M/yr outsourced' },
  { num: '03', phase: 1, phaseLabel: 'DIAGNOSE',          phaseColor: BLUE,  name: 'Data Intelligence',           desc: 'Is your data ready to support AI?',                   example: '72/100 readiness · 2 datasets missing' },
  { num: '04', phase: 2, phaseLabel: 'PRESCRIBE',         phaseColor: AMBER, name: 'Technology Intelligence',     desc: 'Stack inventory, spend, and contract windows',         example: '312 apps · 42% redundant · $38M shadow IT' },
  { num: '05', phase: 2, phaseLabel: 'PRESCRIBE',         phaseColor: AMBER, name: 'Vendor Intelligence',         desc: 'Which vendor wins in your situation — not theirs',     example: 'Ensemble SLA violation identified' },
  { num: '06', phase: 2, phaseLabel: 'PRESCRIBE',         phaseColor: AMBER, name: 'Architecture Intelligence',   desc: 'Target AI stack blueprint for 3 years out',           example: 'Epic integration path for Q3 2026' },
  { num: '07', phase: 2, phaseLabel: 'PRESCRIBE',         phaseColor: AMBER, name: 'Business Case Intelligence',  desc: 'CFO-grade numbers the board will sign off on',        example: '$94M case · 5.7x ROI · KPMG-verifiable' },
  { num: '08', phase: 3, phaseLabel: 'VALUE REALIZATION', phaseColor: GREEN, name: 'AI Delivery Intelligence',    desc: 'Portfolio, blockers, delivery roadmap',               example: '28 AI initiatives · F011 pattern active' },
  { num: '09', phase: 3, phaseLabel: 'VALUE REALIZATION', phaseColor: GREEN, name: 'Outcome Intelligence',        desc: 'Baseline locked — verified delta — fee earned',       example: '$22.4M verified · Month 3 · Audited' },
  { num: '10', phase: 3, phaseLabel: 'VALUE REALIZATION', phaseColor: GREEN, name: 'Monthly Actuals',             desc: 'Are the numbers moving right now?',                   example: 'Denial rate 16.1% ↓ from 18.4% baseline' },
  { num: '11', phase: 3, phaseLabel: 'VALUE REALIZATION', phaseColor: GREEN, name: 'Fee Calculation',             desc: 'What AbarVa has earned — verified',                   example: '$3.92M fee · Invoice MER-FEE-001' },
]

function PageInner() {
  return (
    <div style={{ fontFamily: SANS, background: BG, minHeight: '100vh' }}>
      <AbarvaNav activePage="ai-value-realization" />

      {/* ── SECTION 1: HERO ──────────────────────────────────────────────── */}
      <section style={{ background: BG, padding: '80px 24px 72px', textAlign: 'center' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div style={{ fontFamily: MONO, fontSize: '10px', fontWeight: 700, color: TEAL, letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: '24px' }}>
            AI VALUE REALIZATION · 3 PHASES · 11 MODULES
          </div>
          <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 400, color: DARK, lineHeight: 1.2, margin: '0 0 20px' }}>
            A structured path from broken AI<br />programme to verified outcome.
          </h1>
          <p style={{ fontSize: '17px', color: BODY, lineHeight: 1.7, margin: '0 0 40px' }}>
            AbarVa guides client and Maestro through every step — from situation diagnosis to fee calculation on verified savings.
          </p>
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/ai-strategy?client=meridian" style={{ display: 'inline-block', background: DARK, color: BG, fontSize: '14px', fontWeight: 600, padding: '13px 28px', borderRadius: '6px', textDecoration: 'none' }}>
              See it with Meridian →
            </a>
            <a href="#modules" style={{ display: 'inline-block', background: 'transparent', color: DARK, fontSize: '14px', fontWeight: 600, padding: '13px 28px', borderRadius: '6px', textDecoration: 'none', border: `1px solid ${BORDER}` }}>
              See the 11 modules ↓
            </a>
          </div>
        </div>
      </section>

      {/* ── SECTION 2: THE JOURNEY ───────────────────────────────────────── */}
      <section style={{ background: DBG, padding: '72px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '52px' }}>
            <div style={{ fontFamily: MONO, fontSize: '10px', fontWeight: 700, color: TEAL, letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: '16px' }}>
              THE JOURNEY
            </div>
            <h2 style={{ fontFamily: SERIF, fontSize: 'clamp(26px, 4vw, 38px)', fontWeight: 400, color: '#FAFAF9', lineHeight: 1.25, margin: 0 }}>
              How a Maestro takes a client from<br />problem to verified outcome.
            </h2>
          </div>

          {/* Phase timeline */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0', position: 'relative' }}>
            {PHASES.map((phase, i) => (
              <div key={phase.id} style={{ position: 'relative' }}>
                {/* Arrow connector */}
                {i < PHASES.length - 1 && (
                  <div style={{ position: 'absolute', right: '-1px', top: '40px', zIndex: 2, fontFamily: MONO, fontSize: '14px', color: 'rgba(255,255,255,0.15)' }}>›</div>
                )}
                <div style={{ padding: '0 20px 0 0', paddingRight: i < PHASES.length - 1 ? '28px' : '0' }}>
                  {/* Phase header */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <div style={{ width: '3px', height: '20px', borderRadius: '2px', background: phase.color, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontFamily: MONO, fontSize: '8px', color: 'rgba(255,255,255,0.3)', letterSpacing: '.12em', textTransform: 'uppercase' }}>
                          Phase {phase.id} · {phase.duration}
                        </div>
                        <div style={{ fontFamily: SANS, fontSize: '14px', fontWeight: 700, color: phase.color, letterSpacing: '.03em', marginTop: '2px' }}>
                          {phase.label}
                        </div>
                      </div>
                    </div>
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, margin: '0 0 16px' }}>
                      {phase.desc}
                    </p>
                  </div>

                  {/* Items */}
                  <div style={{ borderTop: `1px solid rgba(255,255,255,0.07)`, paddingTop: '14px' }}>
                    <div style={{ fontFamily: MONO, fontSize: '8px', color: 'rgba(255,255,255,0.2)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '8px' }}>
                      {phase.itemLabel}
                    </div>
                    {phase.items.map((item, j) => (
                      <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '6px' }}>
                        <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: phase.color, marginTop: '6px', flexShrink: 0, opacity: 0.7 }} />
                        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Gate note */}
          <div style={{ marginTop: '40px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '28px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px 20px' }}>
              <span style={{ fontFamily: MONO, fontSize: '10px', color: TEAL }}>⊘</span>
              <span style={{ fontFamily: SANS, fontSize: '13px', color: 'rgba(255,255,255,0.45)' }}>
                Nothing moves without client approval. Each phase is gate-locked.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 3: 11 MODULES ────────────────────────────────────────── */}
      <section id="modules" style={{ background: BG, padding: '72px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div style={{ fontFamily: MONO, fontSize: '10px', fontWeight: 700, color: TEAL, letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: '16px' }}>
              THE MODULES
            </div>
            <h2 style={{ fontFamily: SERIF, fontSize: 'clamp(26px, 4vw, 38px)', fontWeight: 400, color: DARK, lineHeight: 1.25, margin: 0 }}>
              11 modules. Each one does<br />one thing, precisely.
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {MODULES.map(mod => (
              <div key={mod.num} style={{ background: '#FFFFFF', border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Phase badge + module number */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: MONO, fontSize: '9px', fontWeight: 700, color: mod.phaseColor, letterSpacing: '.1em', textTransform: 'uppercase', background: `${mod.phaseColor}18`, padding: '3px 8px', borderRadius: '4px' }}>
                    Phase {mod.phase} · {mod.phaseLabel}
                  </span>
                  <span style={{ fontFamily: MONO, fontSize: '11px', color: MUTED }}>{mod.num}</span>
                </div>

                {/* Name */}
                <div style={{ fontSize: '16px', fontWeight: 700, color: DARK, lineHeight: 1.3 }}>{mod.name}</div>

                {/* Description */}
                <div style={{ fontSize: '13px', color: BODY, lineHeight: 1.5 }}>{mod.desc}</div>

                {/* Example */}
                <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: '10px', marginTop: '2px' }}>
                  <div style={{ fontFamily: MONO, fontSize: '8px', color: MUTED, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '4px' }}>Meridian example</div>
                  <div style={{ fontFamily: MONO, fontSize: '11px', color: TEAL, lineHeight: 1.5 }}>{mod.example}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 4: SEE IT LIVE ───────────────────────────────────────── */}
      <section style={{ background: DBG, padding: '72px 24px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontFamily: MONO, fontSize: '10px', fontWeight: 700, color: TEAL, letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: '16px' }}>
            SEE IT LIVE
          </div>
          <h2 style={{ fontFamily: SERIF, fontSize: 'clamp(26px, 4vw, 38px)', fontWeight: 400, color: '#FAFAF9', lineHeight: 1.25, margin: '0 0 48px' }}>
            See AI Value Realization running<br />on real client data.
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '28px' }}>
            {[
              { name: 'Meridian Health System', short: 'Meridian Health', vertical: 'Healthcare', color: '#2DD4C8', href: '/ai-strategy?client=meridian' },
              { name: 'Arcturus Financial Group', short: 'Arcturus Financial', vertical: 'Financial Services', color: '#818CF8', href: '/ai-strategy?client=arcturus' },
            ].map(c => (
              <div key={c.name} style={{ background: '#0D1520', border: '1px solid #1F2937', borderRadius: '12px', padding: '28px 28px 24px', textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: c.color, flexShrink: 0 }} />
                  <div style={{ fontFamily: MONO, fontSize: '9px', color: 'rgba(255,255,255,0.3)', letterSpacing: '.1em', textTransform: 'uppercase' }}>{c.vertical}</div>
                </div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#F9FAFB', marginBottom: '20px', lineHeight: 1.3 }}>{c.name}</div>
                <a href={c.href} style={{ display: 'inline-block', background: c.color, color: DARK, fontSize: '13px', fontWeight: 700, padding: '10px 22px', borderRadius: '6px', textDecoration: 'none' }}>
                  Enter AVR →
                </a>
              </div>
            ))}
          </div>

          <p style={{ fontFamily: MONO, fontSize: '10px', color: 'rgba(255,255,255,0.25)', letterSpacing: '.06em', margin: 0 }}>
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
