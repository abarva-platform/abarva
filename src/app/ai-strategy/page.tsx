'use client'
import AbarvaNav from '@/components/AbarvaNav'

const BG = '#060A12', CARD = '#0D1520', BORDER = '#1C2D45'
const TEAL = '#2DD4C8', WHITE = '#EFF6FF', MUTED = 'rgba(255,255,255,0.75)', DIM = 'rgba(255,255,255,0.6)'
const AMBER = '#F59E0B', GREEN = '#10B981', INDIGO = '#818CF8'
const SANS = 'DM Sans, sans-serif', MONO = 'JetBrains Mono, monospace', SERIF = 'Georgia, serif'

const PHASES: {
  label: string
  color: string
  desc: string
  modules: { num: number; name: string; desc: string; path: string }[]
}[] = [
  {
    label: 'DIAGNOSE',
    color: TEAL,
    desc: 'What is actually broken — and what is it costing',
    modules: [
      {
        num: 1,
        name: 'Situation Intelligence',
        desc: "What's actually broken — and what it costs. Every gap structured by Genome pattern, confidence, and recovery range.",
        path: '/diagnose',
      },
      {
        num: 2,
        name: 'Contradiction Intelligence',
        desc: 'What leaders told the board vs what the data shows. Contradiction map with source-by-source verification.',
        path: '/contradictions',
      },
      {
        num: 3,
        name: 'Data Intelligence',
        desc: "What your data can and can't support. Completeness scored, gaps flagged, data requests generated.",
        path: '/data-intelligence',
      },
    ],
  },
  {
    label: 'PRESCRIBE',
    color: AMBER,
    desc: 'The right architecture, vendors, and investment sequenced by Genome',
    modules: [
      {
        num: 4,
        name: 'Technology Intelligence',
        desc: 'Every system scored — age, cost, dependency depth, migration risk. Modernisation sequence generated.',
        path: '/intelligence',
      },
      {
        num: 5,
        name: 'Vendor Intelligence',
        desc: 'Which vendor wins in your specific context — not their deck, your data. Scored against Genome outcomes.',
        path: '/vendor-intelligence',
      },
      {
        num: 6,
        name: 'Architecture Intelligence',
        desc: 'What to build and in what order. Dependencies mapped, sequencing validated against failure patterns.',
        path: '/architecture',
      },
      {
        num: 7,
        name: 'Business Case Intelligence',
        desc: 'The CFO-grade case the board will approve. Three scenarios, risk-adjusted, Genome-validated ranges.',
        path: '/justify',
      },
    ],
  },
  {
    label: 'EXECUTE & VERIFY',
    color: GREEN,
    desc: 'AI to production. Outcomes verified. Fee earned.',
    modules: [
      {
        num: 8,
        name: 'AI Delivery Intelligence',
        desc: 'Getting AI from approved spec to production. Bottlenecks mapped, deployment rails designed, MLOps sequenced.',
        path: '/ai-pdlc',
      },
      {
        num: 9,
        name: 'Outcome Intelligence',
        desc: 'Baseline locked Day 0. Monthly actuals vs baseline. Verified savings. Fee earned only when outcomes move.',
        path: '/outcome-intelligence',
      },
    ],
  },
]

export default function AIStrategyPage() {
  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: SANS, color: WHITE }}>
      <AbarvaNav activePage="ai-strategy" />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div style={{ padding: '96px 32px 80px', maxWidth: '900px', margin: '0 auto', textAlign: 'center' as const }}>
        <div style={{ fontFamily: MONO, fontSize: '10px', color: TEAL, letterSpacing: '.16em', textTransform: 'uppercase' as const, marginBottom: '20px' }}>
          AI Strategy Engagement · 9 Intelligence modules · One outcome
        </div>
        <h1 style={{ fontFamily: SERIF, fontSize: '52px', fontWeight: 500, lineHeight: 1.15, margin: '0 0 24px' }}>
          The complete AI strategy engagement.<br />
          <em style={{ color: TEAL }}>9 Intelligence modules. One outcome.</em>
        </h1>
        <p style={{ fontSize: '17px', color: MUTED, maxWidth: '640px', margin: '0 auto 16px', lineHeight: 1.7 }}>
          AbarVa runs all 9 Intelligence modules together. A complete diagnostic and prescription —
          where to invest, what to cut, what to build, what to govern.
        </p>
        <p style={{ fontSize: '14px', color: DIM, maxWidth: '520px', margin: '0 auto 40px', lineHeight: 1.6 }}>
          Each module is independently useful. Together, they are a complete strategy — from the first gap
          to verified outcomes, with fee earned only on what moves.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' as const }}>
          <a href="/diagnose?client=meridian" style={{
            background: TEAL, color: BG, padding: '12px 24px',
            borderRadius: '8px', fontSize: '13px', fontWeight: 600, textDecoration: 'none',
          }}>
            Start with a diagnostic →
          </a>
          <a href="/solutions" style={{
            background: 'transparent', color: MUTED,
            border: `1px solid ${BORDER}`, padding: '12px 24px',
            borderRadius: '8px', fontSize: '13px', textDecoration: 'none',
          }}>
            Start with a Solution instead
          </a>
        </div>
      </div>

      {/* ── Pipeline ─────────────────────────────────────────────────────── */}
      <div style={{ padding: '0 32px 80px', maxWidth: '860px', margin: '0 auto' }}>

        {PHASES.map((phase, pi) => (
          <div key={phase.label}>
            {/* Phase connector arrow (between phases) */}
            {pi > 0 && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
                <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '1px', height: '24px', background: BORDER }} />
                  <div style={{ fontSize: '16px', color: DIM }}>↓</div>
                </div>
              </div>
            )}

            {/* Phase header */}
            <div style={{
              background: CARD, border: `1px solid ${BORDER}`, borderLeft: `3px solid ${phase.color}`,
              borderRadius: '10px', padding: '16px 24px', marginBottom: '2px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ fontFamily: MONO, fontSize: '9px', color: phase.color, letterSpacing: '.14em' }}>
                  PHASE {pi + 1} — {phase.label}
                </div>
                <div style={{ flex: 1, height: '1px', background: BORDER }} />
              </div>
              <div style={{ fontSize: '13px', color: MUTED, marginTop: '4px' }}>{phase.desc}</div>
            </div>

            {/* Modules */}
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '1px', marginLeft: '20px', borderLeft: `1px solid ${BORDER}` }}>
              {phase.modules.map((mod, mi) => (
                <div key={mod.num} style={{ display: 'flex', alignItems: 'stretch', gap: '0' }}>
                  {/* Connector nub */}
                  <div style={{ display: 'flex', alignItems: 'center', paddingLeft: '0', width: '20px', flexShrink: 0 }}>
                    <div style={{ width: '20px', height: '1px', background: BORDER }} />
                  </div>
                  {/* Module card */}
                  <a href={mod.path} style={{ textDecoration: 'none', flex: 1 }}>
                    <div style={{
                      background: CARD, border: `1px solid ${BORDER}`,
                      borderRadius: '8px', padding: '16px 20px',
                      margin: '4px 0',
                      display: 'flex', alignItems: 'center', gap: '20px',
                      cursor: 'pointer',
                      transition: 'border-color 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = phase.color)}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = BORDER)}
                    >
                      {/* Number */}
                      <div style={{
                        width: '32px', height: '32px', flexShrink: 0,
                        background: `${phase.color}12`,
                        border: `1px solid ${phase.color}30`,
                        borderRadius: '6px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: MONO, fontSize: '10px', color: phase.color, fontWeight: 600,
                      }}>
                        {String(mod.num).padStart(2, '0')}
                      </div>
                      {/* Text */}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: 500, color: WHITE, marginBottom: '4px' }}>{mod.name}</div>
                        <div style={{ fontSize: '12px', color: MUTED, lineHeight: 1.5 }}>{mod.desc}</div>
                      </div>
                      {/* Arrow */}
                      <div style={{ fontSize: '14px', color: DIM, flexShrink: 0 }}>→</div>
                    </div>
                  </a>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── Bottom: Land with a Solution ─────────────────────────────────── */}
      <div style={{ background: '#08101C', borderTop: `1px solid ${BORDER}`, padding: '72px 32px' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto', textAlign: 'center' as const }}>
          <div style={{ fontFamily: MONO, fontSize: '9px', color: TEAL, letterSpacing: '.16em', textTransform: 'uppercase' as const, marginBottom: '16px' }}>
            How engagements start
          </div>
          <h2 style={{ fontFamily: SERIF, fontSize: '38px', fontWeight: 500, lineHeight: 1.2, margin: '0 0 16px' }}>
            Land with a Solution.<br />
            <em style={{ color: TEAL }}>Scale to AI Strategy.</em>
          </h2>
          <p style={{ fontSize: '15px', color: MUTED, maxWidth: '520px', margin: '0 auto 48px', lineHeight: 1.7 }}>
            Most engagements start with a specific problem — margin, delivery, or a technology decision.
            Once the first outcome is verified, the full AI Strategy engagement layers on what comes next.
          </p>

          {/* Solution pills */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '48px', maxWidth: '700px', margin: '0 auto 48px' }}>
            {[
              { name: 'Margin Optimization', path: '/solutions/margin', color: AMBER, modules: 'Modules 1, 2, 7, 9', desc: 'Denial recovery · MA Star · AI portfolio' },
              { name: 'AI-Powered PDLC', path: '/solutions/pdlc', color: TEAL, modules: 'Modules 1, 3, 4, 8, 9', desc: 'Delivery velocity · AI to production' },
              { name: 'Technology Modernization', path: '/solutions/tech', color: INDIGO, modules: 'Modules 1, 4, 5, 6, 7', desc: 'System scoring · migration · vendor' },
            ].map(s => (
              <a key={s.name} href={s.path} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: CARD, border: `1px solid ${BORDER}`, borderTop: `2px solid ${s.color}`,
                  borderRadius: '10px', padding: '20px',
                  textAlign: 'left' as const, cursor: 'pointer',
                }}>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: WHITE, marginBottom: '6px' }}>{s.name}</div>
                  <div style={{ fontFamily: MONO, fontSize: '9px', color: s.color, letterSpacing: '.08em', marginBottom: '8px' }}>{s.modules}</div>
                  <div style={{ fontSize: '11px', color: MUTED, lineHeight: 1.5 }}>{s.desc}</div>
                  <div style={{ fontSize: '12px', color: s.color, marginTop: '12px' }}>Start here →</div>
                </div>
              </a>
            ))}
          </div>

          <a href="/diagnose?client=meridian" style={{
            display: 'inline-block',
            background: TEAL, color: BG, padding: '14px 28px',
            borderRadius: '8px', fontSize: '14px', fontWeight: 600, textDecoration: 'none',
          }}>
            Start with a diagnostic →
          </a>
        </div>
      </div>

      {/* ── Fee model note ───────────────────────────────────────────────── */}
      <div style={{ padding: '48px 32px', maxWidth: '860px', margin: '0 auto', textAlign: 'center' as const }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: GREEN }} />
          <span style={{ fontSize: '13px', color: MUTED }}>
            All 9 modules. Outcome-based fee. If the baseline does not move, we do not get paid.
          </span>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: GREEN }} />
        </div>
      </div>
    </div>
  )
}
