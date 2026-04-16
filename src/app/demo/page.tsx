'use client'
import { useState, useEffect, useRef, useCallback } from 'react'

const BG     = '#060A12'
const PANEL  = '#080E1A'
const WHITE  = '#EFF6FF'
const MUTED  = 'rgba(239,246,255,0.55)'
const DIM    = 'rgba(239,246,255,0.30)'
const TEAL   = '#2DD4C8'
const BORDER = 'rgba(239,246,255,0.08)'
const MONO   = "'JetBrains Mono', 'Courier New', monospace"
const SERIF  = "Georgia, 'Times New Roman', serif"

interface Screen {
  n: number
  label: string
  title: string
  url: string
  narrator: string
  notice: string[]
}

const SCREENS: Screen[] = [
  {
    n: 1, label: 'The Problem',
    title: 'The $200B problem.',
    url: '/',
    narrator: 'Every enterprise is spending on AI. Almost none can prove it\'s working. AbarVa exists to close that gap — with a fee model that only pays out when outcomes are verified.',
    notice: [
      '$200B committed to AI with no verified ROI',
      '73% of AI projects fail to reach production',
      '48 hours from sign-off to first signal',
      'Skin in the game: we earn when you do',
    ],
  },
  {
    n: 2, label: 'Intel Feed',
    title: 'Before the first meeting.',
    url: '/admin/client/meridian',
    narrator: 'A Maestro walks into the first Meridian meeting already knowing everything. The Intel Feed surfaces critical signals, benchmarks, and dollar-risk before any consultant has shaken a hand.',
    notice: [
      'Rotating critical signal at top — live updated',
      'Genome signals panel on the right',
      '3 solution cards with verified $ exposure',
      'Data intelligence tab for system-level analysis',
    ],
  },
  {
    n: 3, label: 'Diagnose',
    title: '7 issues. $224M at risk.',
    url: '/diagnose',
    narrator: 'Situation Intelligence maps every system failure and benchmark deviation to a dollar figure. No vague findings — every issue has an owner, a phase, and a cost of inaction.',
    notice: [
      '18.2% denial rate vs 12.1% benchmark — $94M exposure',
      'Each finding linked to phase and solution',
      'Switch to Arcturus tab to see cross-industry contrast',
      'All findings seeded from real engagement patterns',
    ],
  },
  {
    n: 4, label: 'Tech Intel',
    title: 'Every system. Every contract. Every risk.',
    url: '/intelligence',
    narrator: 'Technology Intelligence maps the full vendor stack, contract windows, and AI readiness scores. No surprises in due diligence — the Maestro already knows the Bloomberg AIM contract is up December 2026.',
    notice: [
      'Bloomberg AIM contract window: Dec 2026',
      '$340M total vendor spend mapped',
      'AI readiness score per system',
      'AI Advisor panel with recommendations',
    ],
  },
  {
    n: 5, label: 'Genome',
    title: 'Cross-client intelligence.',
    url: '/admin/client/meridian',
    narrator: 'The Genome aggregates outcomes across every AbarVa engagement. Meridian benefits from what worked — and what failed — at Arcturus, Apex Retail, and 40+ others. This is the moat.',
    notice: [
      'Click the Genome tab in the left panel',
      'F011: 74% failure rate on Epic without interim RCM',
      '4 genome patterns matched to this client',
      'Positive signals from comparable IDN transformations',
    ],
  },
  {
    n: 6, label: 'The Fee',
    title: 'The fee is earned, not charged.',
    url: '/engage/meridian/margin',
    narrator: 'Every dollar of the AbarVa fee is tied to verified savings. The platform calculates the fee against confirmed outcomes in real time — so both sides know exactly what was earned and why.',
    notice: [
      'Click the Value tab to see fee breakdown',
      '$12.8M in verified savings to date',
      '$1.92M AbarVa fee (15% of verified savings)',
      'Year 1 projection: $34–39M',
    ],
  },
  {
    n: 7, label: 'Arcturus',
    title: 'Same platform. Different industry.',
    url: '/admin/client/arcturus',
    narrator: 'Arcturus Financial Group: $8.4B AUM, C/I ratio 71% against a 58% peer median. The same Maestro platform — calibrated to wealth management benchmarks and financial services contracts.',
    notice: [
      '$840M efficiency gap identified',
      '8 CRITICAL signals in the Intel Feed',
      '3 active solutions: Margin, Tech, PDLC',
      'Different industry, identical confidence level',
    ],
  },
  {
    n: 8, label: 'The Ask',
    title: '$8M. $25M cap. Category-creation round.',
    url: '/investor',
    narrator: 'AbarVa is raising $8M on a SAFE with a $25M cap and MFN protection. The funds accelerate Genome expansion, hire 3 Maestros, and reach the Series A trigger: $5M ARR.',
    notice: [
      'Click The Ask tab to see SAFE terms',
      'SAFE with MFN — clean, founder-friendly structure',
      'Use of funds: Genome data, Maestro hires, GTM',
      'Series A trigger: $5M ARR, 3 enterprise clients',
    ],
  },
]

export default function DemoGuidedPage() {
  const [idx, setIdx] = useState(0)
  const [autoOn, setAutoOn] = useState(false)
  const [countdown, setCountdown] = useState(60)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const screen = SCREENS[idx]

  const goTo = useCallback((i: number) => {
    const clamped = Math.max(0, Math.min(SCREENS.length - 1, i))
    setIdx(clamped)
    setCountdown(60)
  }, [])

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setIdx(i => Math.min(i + 1, SCREENS.length - 1))
      if (e.key === 'ArrowLeft')  setIdx(i => Math.max(i - 1, 0))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Auto-advance timer
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (!autoOn) return
    timerRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          setIdx(i => {
            const next = Math.min(i + 1, SCREENS.length - 1)
            if (next === SCREENS.length - 1 && i === SCREENS.length - 1) setAutoOn(false)
            return next
          })
          return 60
        }
        return c - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [autoOn])

  const isFirst = idx === 0
  const isLast  = idx === SCREENS.length - 1

  return (
    <div style={{ height: '100vh', overflow: 'hidden', background: BG, display: 'flex', flexDirection: 'column', fontFamily: MONO }}>

      {/* ── TOP BAR ────────────────────────────────────────────────────── */}
      <div style={{
        height: '52px', background: PANEL, borderBottom: `1px solid ${BORDER}`,
        display: 'flex', alignItems: 'center', padding: '0 16px', gap: '10px', flexShrink: 0,
      }}>
        {/* Wordmark */}
        <a href="/" style={{ fontSize: '11px', color: TEAL, textDecoration: 'none', letterSpacing: '.1em', flexShrink: 0 }}>
          ABARVA
        </a>
        <div style={{ width: 1, height: 20, background: BORDER, flexShrink: 0 }} />
        <span style={{ fontSize: '9px', color: DIM, letterSpacing: '.12em', flexShrink: 0 }}>GUIDED DEMO</span>
        <div style={{ width: 1, height: 20, background: BORDER, flexShrink: 0 }} />

        {/* Step pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flex: 1, minWidth: 0 }}>
          {SCREENS.map((s, i) => {
            const active = i === idx
            const past   = i < idx
            return (
              <button
                key={i}
                onClick={() => goTo(i)}
                style={{
                  display: 'flex', alignItems: 'center', gap: active ? '5px' : 0,
                  padding: active ? '4px 10px' : '4px 7px',
                  borderRadius: '4px', border: 'none', cursor: 'pointer',
                  background: active ? 'rgba(45,212,200,0.12)' : 'transparent',
                  outline: active ? '1px solid rgba(45,212,200,0.35)' : 'none',
                  transition: 'all 0.18s',
                  flexShrink: active ? 0 : 1,
                }}
              >
                <span style={{
                  fontSize: '9px',
                  color: active ? TEAL : past ? 'rgba(45,212,200,0.4)' : DIM,
                  fontWeight: active ? 700 : 400,
                }}>
                  {i + 1}
                </span>
                {active && (
                  <span style={{ fontSize: '9px', color: TEAL, letterSpacing: '.04em', whiteSpace: 'nowrap' }}>
                    {s.label}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Right controls */}
        <span style={{ fontSize: '10px', color: MUTED, flexShrink: 0 }}>{idx + 1} of {SCREENS.length}</span>
        <button
          onClick={() => setAutoOn(a => !a)}
          style={{
            fontSize: '9px', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer',
            background: autoOn ? 'rgba(45,212,200,0.1)' : 'transparent',
            border: `1px solid ${autoOn ? 'rgba(45,212,200,0.35)' : BORDER}`,
            color: autoOn ? TEAL : DIM, flexShrink: 0,
          }}
        >
          {autoOn ? `⏸ ${countdown}s` : '▶ Auto 60s'}
        </button>
        <a href="/demo/explore" style={{ fontSize: '9px', color: DIM, textDecoration: 'none', padding: '4px 8px', border: `1px solid ${BORDER}`, borderRadius: '4px', flexShrink: 0 }}>
          Self-serve →
        </a>
      </div>

      {/* ── BODY ───────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Left panel */}
        <div style={{
          width: '320px', flexShrink: 0, background: PANEL,
          borderRight: `1px solid ${BORDER}`,
          display: 'flex', flexDirection: 'column',
          padding: '28px 24px 20px',
          overflowY: 'auto',
        }}>
          {/* Label */}
          <div style={{ fontSize: '9px', color: TEAL, letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: '14px' }}>
            Screen {screen.n} of {SCREENS.length} · {screen.label}
          </div>

          {/* Title */}
          <h2 style={{ fontFamily: SERIF, fontSize: '24px', color: WHITE, fontWeight: 400, lineHeight: 1.25, marginBottom: '20px' }}>
            {screen.title}
          </h2>

          {/* Narrator */}
          <p style={{
            fontFamily: SERIF, fontSize: '13px',
            color: 'rgba(239,246,255,0.78)',
            lineHeight: 1.8, marginBottom: '28px',
          }}>
            {screen.narrator}
          </p>

          {/* What to notice */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '9px', color: TEAL, letterSpacing: '.12em', marginBottom: '12px' }}>
              WHAT TO NOTICE
            </div>
            {screen.notice.map((b, i) => (
              <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '10px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '10px', color: TEAL, flexShrink: 0, marginTop: '1px' }}>·</span>
                <span style={{ fontSize: '10px', color: 'rgba(239,246,255,0.62)', lineHeight: 1.55 }}>{b}</span>
              </div>
            ))}
          </div>

          {/* Nav buttons */}
          <div style={{ marginTop: '28px' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
              <button
                onClick={() => goTo(idx - 1)}
                disabled={isFirst}
                style={{
                  flex: 1, padding: '10px', borderRadius: '6px', cursor: isFirst ? 'default' : 'pointer',
                  background: 'transparent', border: `1px solid ${BORDER}`,
                  color: isFirst ? DIM : MUTED, fontSize: '11px',
                }}
              >
                ← Prev
              </button>
              <button
                onClick={() => goTo(idx + 1)}
                disabled={isLast}
                style={{
                  flex: 2, padding: '10px', borderRadius: '6px', cursor: isLast ? 'default' : 'pointer',
                  background: isLast ? 'transparent' : 'rgba(45,212,200,0.14)',
                  border: `1px solid ${isLast ? BORDER : 'rgba(45,212,200,0.4)'}`,
                  color: isLast ? DIM : TEAL, fontSize: '11px', fontWeight: 700,
                }}
              >
                {isLast ? 'Complete' : 'Next →'}
              </button>
            </div>
            <div style={{ textAlign: 'center' as const, fontSize: '9px', color: DIM }}>
              ← → arrow keys · click any step above
            </div>
          </div>
        </div>

        {/* Right panel — iframe */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#000' }}>
          <iframe
            key={idx}
            src={screen.url}
            style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
            title={screen.title}
          />
        </div>
      </div>
    </div>
  )
}
