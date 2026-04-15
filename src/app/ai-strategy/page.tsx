'use client'
import { useState, useRef, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import AbarvaNav from '@/components/AbarvaNav'

const BG = '#060A12', CARD = '#0D1520', BORDER = '#1C2D45'
const TEAL = '#2DD4C8', WHITE = '#EFF6FF', MUTED = 'rgba(255,255,255,0.75)', DIM = 'rgba(255,255,255,0.6)'
const AMBER = '#F59E0B', GREEN = '#10B981', INDIGO = '#818CF8'
const SANS = 'DM Sans, sans-serif', MONO = 'JetBrains Mono, monospace', SERIF = 'Georgia, serif'

const PHASES: {
  label: string
  color: string
  desc: string
  modules: {
    num: number
    name: string
    cxoQ: string
    bullets: string[]
    output: string
    path: string
  }[]
}[] = [
  {
    label: 'DIAGNOSE',
    color: TEAL,
    desc: 'What is actually broken — and what is it costing',
    modules: [
      {
        num: 1,
        name: 'Situation Intelligence',
        cxoQ: "What's actually broken — and what is it costing right now?",
        bullets: [
          '340 Genome patterns run against your cost structure and operations',
          'Every gap ranked by recovery range, confidence, and time-to-fix',
          'Addressable vs structural split delivered in 48 hours',
        ],
        output: 'SITUATION BRIEF · 48HRS',
        path: '/diagnose',
      },
      {
        num: 2,
        name: 'Contradiction Intelligence',
        cxoQ: 'What did leadership tell the board — and what does the data actually show?',
        bullets: [
          'Every leadership statement cross-referenced against financial and operational data',
          'Source-by-source verification with confidence rating per contradiction',
          'Contradiction map used to calibrate Phase 2 prescriptions',
        ],
        output: 'CONTRADICTION MAP · 72HRS',
        path: '/contradictions',
      },
      {
        num: 3,
        name: 'Data Intelligence',
        cxoQ: "What can your data actually support — and what gaps are blocking AI?",
        bullets: [
          'Completeness scored across 12 data dimensions',
          'Pipeline gaps flagged with specific remediation steps',
          'Data readiness certificate generated before AI investment approved',
        ],
        output: 'DATA READINESS CERTIFICATE · 1 WEEK',
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
        cxoQ: 'Which systems are blocking you — and in what order do you fix them?',
        bullets: [
          'Every system scored: age, cost, dependency depth, migration risk',
          'EOL systems flagged with regulatory and operational exposure',
          'Modernisation sequence generated and Genome-validated',
        ],
        output: 'AI READINESS CERTIFICATE · 1 WEEK',
        path: '/intelligence',
      },
      {
        num: 5,
        name: 'Vendor Intelligence',
        cxoQ: 'Which vendor will actually deliver — in your specific context, not their deck?',
        bullets: [
          'Vendors scored against Genome outcomes from comparable engagements',
          'Contract anchors generated: benchmark rates, key person clauses, IP terms',
          'Failure probability calculated per vendor based on pattern match',
        ],
        output: 'VENDOR SCORECARD · 1 WEEK',
        path: '/vendor-intelligence',
      },
      {
        num: 6,
        name: 'Architecture Intelligence',
        cxoQ: 'What do we build, in what order — and what will fail if we get the sequence wrong?',
        bullets: [
          'Architecture options generated with dependency mapping',
          'Each option validated against Genome failure patterns',
          'Build sequence optimised for risk and speed-to-value',
        ],
        output: 'ARCHITECTURE BLUEPRINT · 2 WEEKS',
        path: '/architecture',
      },
      {
        num: 7,
        name: 'Business Case Intelligence',
        cxoQ: "What is the CFO-grade case — with ranges the board will actually approve?",
        bullets: [
          'Three scenarios (Bear/Base/Bull) built from your data and Genome comparables',
          'Risk-adjusted IRR with sensitivity analysis',
          'Investment committee package: every objection pre-answered',
        ],
        output: 'IC PACKAGE · 1 WEEK',
        path: '/justify',
      },
    ],
  },
  {
    label: 'VALUE REALIZATION',
    color: GREEN,
    desc: 'AI in production. Value verified. Fee earned only on what moves.',
    modules: [
      {
        num: 8,
        name: 'AI Delivery Intelligence',
        cxoQ: "How do we get AI from approved spec to production — without the usual 18-month slip?",
        bullets: [
          'Delivery bottlenecks mapped before programme starts',
          'MLOps sequence designed for your specific stack',
          'Deployment rails built to your engineering capacity',
        ],
        output: 'EXECUTION BASELINE · 2 WEEKS',
        path: '/ai-pdlc',
      },
      {
        num: 9,
        name: 'Outcome Intelligence',
        cxoQ: "How do we know it worked — and how does AbarVa's fee get earned?",
        bullets: [
          'Baseline locked Day 0 — no retroactive adjustment',
          'Monthly actuals vs baseline tracked in real time',
          'Fee released only on verified, audited savings',
        ],
        output: 'LIVE OUTCOME DASHBOARD · ONGOING',
        path: '/outcome-intelligence',
      },
    ],
  },
]

type ActiveModule = { name: string; num: number; path: string; color: string }

export default function AIStrategyPage() {
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [activeModule, setActiveModule] = useState<ActiveModule | null>(null)
  const [seeding, setSeeding] = useState(false)
  const [seeded, setSeeded] = useState(false)
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const isAdmin = isLoaded && user?.publicMetadata?.role === 'admin'
  const savedScrollY = useRef(0)
  const shouldRestoreScroll = useRef(false)

  useEffect(() => {
    if (!activeModule && shouldRestoreScroll.current) {
      shouldRestoreScroll.current = false
      requestAnimationFrame(() => window.scrollTo({ top: savedScrollY.current, behavior: 'instant' }))
    }
  }, [activeModule])

  async function handleSeedDemo() {
    setSeeding(true)
    try {
      const res = await fetch('/api/engage/arcturus/ai-strategy/seed-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ createdBy: user?.fullName || 'Admin' }),
      })
      const data = await res.json()
      if (data.success) {
        setSeeded(true)
        setTimeout(() => router.push('/engage/arcturus/ai-strategy'), 800)
      }
    } finally {
      setSeeding(false)
    }
  }

  const filteredPhases = activeFilter
    ? PHASES.filter(p => p.label === activeFilter)
    : PHASES

  // ── Embedded module view ────────────────────────────────────────────────────
  if (activeModule) {
    return (
      <div style={{ minHeight: '100vh', background: BG, fontFamily: SANS, color: WHITE }}>
        <AbarvaNav activePage="ai-strategy" />
        {/* Compact breadcrumb */}
        <div style={{
          background: CARD, borderBottom: `1px solid ${BORDER}`,
          padding: '0 48px', height: '40px',
          display: 'flex', alignItems: 'center', gap: '12px',
        }}>
          <button
            onClick={() => { shouldRestoreScroll.current = true; setActiveModule(null) }}
            style={{ fontFamily: MONO, fontSize: '10px', color: TEAL, background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '.05em', textTransform: 'uppercase' as const, padding: 0 }}
          >
            ← AI Value Realization
          </button>
          <div style={{ width: '1px', height: '16px', background: BORDER }} />
          <span style={{ fontSize: '12px', color: MUTED }}>{activeModule.name}</span>
          <div style={{ marginLeft: 'auto' }}>
            <span style={{ fontFamily: MONO, fontSize: '9px', padding: '2px 8px', borderRadius: '10px', background: `${activeModule.color}18`, color: activeModule.color, letterSpacing: '.06em' }}>
              MODULE {String(activeModule.num).padStart(2, '0')}
            </span>
          </div>
        </div>
        {/* Embedded workspace — nav hidden via injected CSS */}
        <iframe
          src={`${activeModule.path}?client=arcturus`}
          style={{ width: '100%', height: 'calc(100vh - 104px)', border: 'none', display: 'block' }}
          onLoad={e => {
            try {
              const doc = (e.currentTarget as HTMLIFrameElement).contentDocument
              if (!doc) return
              const s = doc.createElement('style')
              s.textContent = '#abarva-nav { display: none !important; }'
              doc.head.appendChild(s)
            } catch { /* cross-origin guard */ }
          }}
        />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: SANS, color: WHITE }}>
      <AbarvaNav activePage="ai-strategy" />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div style={{ padding: '72px 48px 64px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '64px', alignItems: 'center' }}>

          {/* Left: Headline + description + CTAs */}
          <div>
            <div style={{ fontFamily: MONO, fontSize: '10px', color: TEAL, letterSpacing: '.16em', textTransform: 'uppercase' as const, marginBottom: '20px' }}>
              AI Value Realization · 9 Intelligence modules · One outcome
            </div>
            <h1 style={{ fontFamily: SERIF, fontSize: '54px', fontWeight: 500, lineHeight: 1.12, margin: '0 0 24px' }}>
              The complete AI<br />
              value realization<br />
              <em style={{ color: TEAL }}>engagement.</em>
            </h1>
            <p style={{ fontSize: '17px', color: MUTED, maxWidth: '560px', margin: '0 0 14px', lineHeight: 1.7 }}>
              AbarVa runs all 9 Intelligence modules together. A complete diagnostic and prescription —
              where to invest, what to cut, what to build, what to govern.
            </p>
            <p style={{ fontSize: '14px', color: DIM, maxWidth: '520px', margin: '0 0 40px', lineHeight: 1.6 }}>
              Each module is independently useful. Together, they are a complete strategy — from the first gap
              to verified outcomes, with fee earned only on what moves.
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' as const }}>
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
              {isAdmin && (
                <button
                  onClick={handleSeedDemo}
                  disabled={seeding || seeded}
                  style={{
                    background: seeded ? `${GREEN}20` : 'rgba(45,212,200,0.10)',
                    color: seeded ? GREEN : TEAL,
                    border: `1px solid ${seeded ? GREEN : TEAL}40`,
                    padding: '12px 24px',
                    borderRadius: '8px', fontSize: '13px', cursor: seeding ? 'wait' : 'pointer',
                    fontFamily: SANS,
                  }}
                >
                  {seeded ? 'Demo loaded — redirecting…' : seeding ? 'Loading demo…' : 'Load Value Realization Demo →'}
                </button>
              )}
            </div>
          </div>

          {/* Right: Phase summary + key stats */}
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '10px' }}>
            {PHASES.map((phase, i) => (
              <div key={phase.label} style={{
                background: CARD, border: `1px solid ${BORDER}`,
                borderLeft: `3px solid ${phase.color}`,
                borderRadius: '10px', padding: '16px 20px',
              }}>
                <div style={{ fontFamily: MONO, fontSize: '9px', color: phase.color, letterSpacing: '.14em', marginBottom: '5px' }}>
                  PHASE {i + 1} — {phase.label}
                </div>
                <div style={{ fontSize: '13px', color: WHITE, fontWeight: 500, marginBottom: '4px' }}>{phase.desc}</div>
                <div style={{ fontFamily: MONO, fontSize: '9px', color: DIM }}>
                  {phase.modules.length} modules · {phase.modules.map(m => m.name.split(' ')[0]).join(', ')}
                </div>
              </div>
            ))}
            {/* Key stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
              {[
                { v: '340', l: 'Genome patterns' },
                { v: '9', l: 'Intelligence modules' },
                { v: '48hr', l: 'First deliverable' },
                { v: '$0', l: 'Fee if baseline unmoved' },
              ].map(s => (
                <div key={s.l} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '12px 16px' }}>
                  <div style={{ fontFamily: MONO, fontSize: '20px', color: TEAL, fontWeight: 700 }}>{s.v}</div>
                  <div style={{ fontSize: '11px', color: DIM, marginTop: '3px' }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ── Phase Filter Tabs ─────────────────────────────────────────────── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: BG, borderBottom: `1px solid ${BORDER}`,
        padding: '0 48px',
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '4px', overflowX: 'auto' as const }}>
          {[
            { label: 'ALL', color: WHITE },
            { label: 'DIAGNOSE', color: TEAL },
            { label: 'PRESCRIBE', color: AMBER },
            { label: 'EXECUTE & VERIFY', color: GREEN },
          ].map(tab => {
            const isActive = tab.label === 'ALL' ? activeFilter === null : activeFilter === tab.label
            return (
              <button
                key={tab.label}
                onClick={() => setActiveFilter(tab.label === 'ALL' ? null : tab.label)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  borderBottom: isActive ? `2px solid ${tab.color}` : '2px solid transparent',
                  padding: '14px 16px',
                  fontSize: '11px',
                  fontFamily: MONO,
                  letterSpacing: '.1em',
                  color: isActive ? tab.color : DIM,
                  fontWeight: isActive ? 600 : 400,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap' as const,
                  transition: 'color 0.15s, border-color 0.15s',
                  flexShrink: 0,
                }}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Pipeline ─────────────────────────────────────────────────────── */}
      <div style={{ padding: '48px 48px 80px', maxWidth: '1400px', margin: '0 auto' }}>

        {filteredPhases.map((phase, pi) => (
          <div key={phase.label}>
            {/* Phase connector arrow (between phases, only when showing all) */}
            {pi > 0 && activeFilter === null && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0' }}>
                <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '1px', height: '24px', background: BORDER }} />
                  <div style={{ fontSize: '16px', color: DIM }}>↓</div>
                </div>
              </div>
            )}

            {/* Phase header */}
            <div style={{
              background: CARD, border: `1px solid ${BORDER}`, borderLeft: `3px solid ${phase.color}`,
              borderRadius: '10px', padding: '18px 28px', marginBottom: '16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ fontFamily: MONO, fontSize: '9px', color: phase.color, letterSpacing: '.14em' }}>
                  PHASE {PHASES.indexOf(phase) + 1} — {phase.label}
                </div>
                <div style={{ flex: 1, height: '1px', background: BORDER }} />
                <div style={{ fontFamily: MONO, fontSize: '9px', color: DIM }}>
                  {phase.modules.length} module{phase.modules.length !== 1 ? 's' : ''}
                </div>
              </div>
              <div style={{ fontSize: '13px', color: MUTED, marginTop: '5px' }}>{phase.desc}</div>
            </div>

            {/* Modules grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))',
              gap: '12px',
              marginBottom: '8px',
            }}>
              {phase.modules.map((mod) => (
                <div
                  key={mod.num}
                  onClick={() => { savedScrollY.current = window.scrollY; setActiveModule({ name: mod.name, num: mod.num, path: mod.path, color: phase.color }) }}
                  style={{ cursor: 'pointer' }}
                >
                  <div style={{
                    background: CARD, border: `1px solid ${BORDER}`,
                    borderRadius: '10px', padding: '22px 24px',
                    height: '100%', boxSizing: 'border-box' as const,
                    transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(45,212,200,0.35)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = BORDER)}
                  >
                    {/* Row 1: Module name + Output artifact */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {/* Number badge */}
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
                        <div style={{ fontSize: '16px', fontWeight: 600, color: WHITE }}>{mod.name}</div>
                      </div>
                      <div style={{
                        fontFamily: MONO, fontSize: '9px', color: TEAL,
                        letterSpacing: '.1em', textTransform: 'uppercase' as const,
                        flexShrink: 0, paddingTop: '2px',
                        background: 'rgba(45,212,200,0.08)', border: '1px solid rgba(45,212,200,0.20)',
                        borderRadius: '4px', padding: '3px 8px',
                      }}>
                        {mod.output}
                      </div>
                    </div>

                    {/* Row 2: CXO question */}
                    <div style={{ fontSize: '13px', fontStyle: 'italic', color: TEAL, marginBottom: '12px', lineHeight: 1.5 }}>
                      "{mod.cxoQ}"
                    </div>

                    {/* Row 3: Capability bullets */}
                    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '6px', marginBottom: '12px' }}>
                      {mod.bullets.map((b, bi) => (
                        <div key={bi} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                          <span style={{ color: TEAL, fontSize: '12px', lineHeight: '1.5', flexShrink: 0 }}>·</span>
                          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.80)', lineHeight: 1.5 }}>{b}</span>
                        </div>
                      ))}
                    </div>

                    {/* Row 4: Arrow */}
                    <div style={{ fontSize: '14px', color: TEAL, textAlign: 'right' as const }}>Open module →</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── Bottom: Land with a Solution ─────────────────────────────────── */}
      <div style={{ background: '#08101C', borderTop: `1px solid ${BORDER}`, padding: '72px 48px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>

          {/* Heading row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px', alignItems: 'start', marginBottom: '48px' }}>
            <div>
              <div style={{ fontFamily: MONO, fontSize: '9px', color: TEAL, letterSpacing: '.16em', textTransform: 'uppercase' as const, marginBottom: '16px' }}>
                How engagements start
              </div>
              <h2 style={{ fontFamily: SERIF, fontSize: '40px', fontWeight: 500, lineHeight: 1.2, margin: '0 0 16px' }}>
                Land with a Solution.<br />
                <em style={{ color: TEAL }}>Scale to AI Value Realization.</em>
              </h2>
              <p style={{ fontSize: '15px', color: MUTED, lineHeight: 1.7, margin: 0 }}>
                Most engagements start with a specific problem — margin, delivery, or a technology decision.
                Once the first outcome is verified, the full AI Value Realization engagement layers on what comes next.
              </p>
            </div>

            {/* CTA */}
            <div style={{ display: 'flex', flexDirection: 'column' as const, justifyContent: 'flex-end', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: GREEN, flexShrink: 0 }} />
                <span style={{ fontSize: '13px', color: MUTED, lineHeight: 1.6 }}>
                  All 9 modules. Outcome-based fee. If the baseline does not move, we do not get paid.
                </span>
              </div>
              <a href="/diagnose?client=meridian" style={{
                display: 'inline-block',
                background: TEAL, color: BG, padding: '14px 28px',
                borderRadius: '8px', fontSize: '14px', fontWeight: 600, textDecoration: 'none',
                alignSelf: 'flex-start',
              }}>
                Start with a diagnostic →
              </a>
            </div>
          </div>

          {/* Solution pills */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {[
              { name: 'Margin Optimization', path: '/solutions/margin', color: AMBER, modules: 'Modules 1, 2, 7, 9', desc: 'Denial recovery · MA Star · AI portfolio' },
              { name: 'AI-Powered PDLC', path: '/solutions/pdlc', color: TEAL, modules: 'Modules 1, 3, 4, 8, 9', desc: 'Delivery velocity · AI to production' },
              { name: 'Technology Modernization', path: '/solutions/tech', color: INDIGO, modules: 'Modules 1, 4, 5, 6, 7', desc: 'System scoring · migration · vendor' },
            ].map(s => (
              <a key={s.name} href={s.path} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: CARD, border: `1px solid ${BORDER}`, borderTop: `2px solid ${s.color}`,
                  borderRadius: '10px', padding: '24px',
                  textAlign: 'left' as const, cursor: 'pointer',
                }}>
                  <div style={{ fontSize: '14px', fontWeight: 500, color: WHITE, marginBottom: '6px' }}>{s.name}</div>
                  <div style={{ fontFamily: MONO, fontSize: '9px', color: s.color, letterSpacing: '.08em', marginBottom: '10px' }}>{s.modules}</div>
                  <div style={{ fontSize: '12px', color: MUTED, lineHeight: 1.5 }}>{s.desc}</div>
                  <div style={{ fontSize: '12px', color: s.color, marginTop: '14px' }}>Start here →</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
