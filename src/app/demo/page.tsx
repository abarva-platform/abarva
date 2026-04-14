'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import AbarvaNav from '@/components/AbarvaNav'

const T = {
  bg: '#0D1117', surface: '#161B22', surface2: '#1C2128',
  border: '#21262D', border2: '#30363D',
  text: '#E6EDF3', text2: '#C9D1D9', text3: '#8B949E',
  teal: '#2DD4C8', blue: '#4DA3FF', red: '#EF4444',
  amber: '#F59E0B', green: '#6EE7B7',
}

const ACTS = [
  { n: 1, label: 'The Setup', duration: 90 },
  { n: 2, label: 'First Intelligence', duration: 120 },
  { n: 3, label: 'The Strategy', duration: 150 },
  { n: 4, label: 'The Model', duration: 90 },
]

// ─── Progress Bar ────────────────────────────────────────────────────────────

function ProgressBar({ act, onJump, autoPlay, onToggle, paused, onPause }:
  { act: number; onJump: (n: number) => void; autoPlay: boolean; onToggle: () => void; paused: boolean; onPause: () => void }) {
  return (
    <div style={{ background: T.surface, borderBottom: '1px solid ' + T.border, padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '0', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
        {ACTS.map((a, i) => (
          <div key={a.n} style={{ display: 'flex', alignItems: 'center' }}>
            {i > 0 && (
              <div style={{ width: '32px', height: '2px', background: act > a.n - 1 ? T.teal : T.border2, transition: 'background 400ms' }} />
            )}
            <button
              onClick={() => { if (a.n <= act || act > 0) { onJump(a.n) } }}
              title={`Act ${a.n}: ${a.label}`}
              style={{
                width: '28px', height: '28px', borderRadius: '50%',
                background: act === a.n ? T.teal : act > a.n ? '#0D4A3F' : T.surface2,
                border: `2px solid ${act === a.n ? T.teal : act > a.n ? '#166534' : T.border2}`,
                color: act === a.n ? '#0D1117' : act > a.n ? T.green : T.text3,
                fontSize: '11px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 300ms', flexShrink: 0,
              }}
            >
              {act > a.n ? '✓' : a.n}
            </button>
            {act === a.n && (
              <span style={{ fontSize: '11px', fontWeight: 600, color: T.teal, marginLeft: '6px', whiteSpace: 'nowrap' }}>
                Act {a.n}: {a.label}
              </span>
            )}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {autoPlay && !paused && (
          <button onClick={onPause} style={{ padding: '5px 12px', background: 'none', border: '1px solid ' + T.border2, borderRadius: '6px', color: T.text3, fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit' }}>
            ⏸ Pause
          </button>
        )}
        <button
          onClick={onToggle}
          style={{ padding: '5px 12px', background: autoPlay ? T.teal + '20' : T.surface2, border: `1px solid ${autoPlay ? T.teal + '60' : T.border2}`, borderRadius: '6px', color: autoPlay ? T.teal : T.text3, fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          {autoPlay ? '▶ Auto-play' : '⊞ Self-paced'}
        </button>
      </div>
    </div>
  )
}

// ─── Act 1: The Setup ────────────────────────────────────────────────────────

const BADGES = ['FINANCIALS', 'TECHNOLOGY', 'LEADERSHIP', 'CLINICAL', 'AI', 'VENDORS', 'INTERVIEWS', 'OUTCOMES']

function Act1Panel({ onInteract }: { onInteract: () => void }) {
  const [step, setStep] = useState(0)
  const [confidence, setConfidence] = useState(0)
  const [badgeCount, setBadgeCount] = useState(0)

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    timers.push(setTimeout(() => setStep(1), 600))
    timers.push(setTimeout(() => setStep(2), 1400))
    // Badges light up one by one
    for (let i = 0; i < 8; i++) {
      timers.push(setTimeout(() => setBadgeCount(i + 1), 1600 + i * 350))
    }
    timers.push(setTimeout(() => setStep(3), 4600))
    // Confidence counter
    timers.push(setTimeout(() => {
      let c = 0
      const interval = setInterval(() => {
        c += 3
        setConfidence(Math.min(c, 87))
        if (c >= 87) clearInterval(interval)
      }, 40)
    }, 4800))
    timers.push(setTimeout(() => setStep(4), 6000))
    timers.push(setTimeout(() => setStep(5), 7200))
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div onClick={onInteract} style={{ padding: '24px', height: '100%', overflowY: 'auto' }}>
      {/* Engagement card */}
      <div style={{
        background: T.surface2, border: '1px solid ' + T.border,
        borderLeft: `4px solid ${T.teal}`, borderRadius: '10px', padding: '20px',
        opacity: step >= 1 ? 1 : 0, transform: step >= 1 ? 'translateY(0)' : 'translateY(12px)',
        transition: 'all 500ms',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: T.text }}>Meridian Health System</div>
            <div style={{ fontSize: '11px', color: T.teal, marginTop: '2px', fontWeight: 600 }}>Healthcare · $11.2B revenue</div>
          </div>
          <div style={{ padding: '3px 8px', background: '#0D4A3F', border: '1px solid #166534', borderRadius: '20px', fontSize: '10px', fontWeight: 700, color: T.green }}>
            ACTIVE
          </div>
        </div>

        {/* Data completeness bar */}
        {step >= 3 && (
          <div style={{ marginBottom: '14px', opacity: step >= 3 ? 1 : 0, transition: 'opacity 400ms' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span style={{ fontSize: '10px', color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Data completeness</span>
              <span style={{ fontSize: '11px', fontWeight: 700, color: T.teal }}>{confidence}%</span>
            </div>
            <div style={{ height: '4px', background: T.border, borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${confidence}%`, background: T.teal, borderRadius: '2px', transition: 'width 80ms' }} />
            </div>
          </div>
        )}

        {/* Category badges */}
        {step >= 2 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '14px' }}>
            {BADGES.map((b, i) => (
              <div key={b} style={{
                padding: '3px 7px', borderRadius: '5px', fontSize: '9px', fontWeight: 700,
                background: i < badgeCount ? '#0D2B1A' : T.surface,
                border: `1px solid ${i < badgeCount ? '#166534' : T.border}`,
                color: i < badgeCount ? T.green : T.text3,
                letterSpacing: '0.05em',
                opacity: i < badgeCount ? 1 : 0.4,
                transition: 'all 300ms',
              }}>{i < badgeCount ? '✓ ' : ''}{b}</div>
            ))}
          </div>
        )}

        {/* Key metrics */}
        {step >= 4 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px', opacity: step >= 4 ? 1 : 0, transition: 'opacity 400ms' }}>
            {[
              { label: 'RCM Denial Rate', value: '18.2%', bad: true },
              { label: 'IT Budget', value: '$340M', bad: false },
              { label: 'Prior Auth Days', value: '4.2d', bad: true },
              { label: 'Epic Score', value: '58/100', bad: true },
            ].map(m => (
              <div key={m.label} style={{ padding: '8px 10px', background: T.bg, borderRadius: '6px', border: '1px solid ' + T.border }}>
                <div style={{ fontSize: '9px', color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>{m.label}</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: m.bad ? T.red : T.teal }}>{m.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Intelligence summary */}
        {step >= 5 && (
          <div style={{ padding: '12px', background: '#1A0A0A', border: '1px solid ' + T.red + '40', borderRadius: '8px', opacity: step >= 5 ? 1 : 0, transform: step >= 5 ? 'translateY(0)' : 'translateY(8px)', transition: 'all 400ms' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: T.red, marginBottom: '8px' }}>🔴 3 CRITICAL ISSUES DETECTED</div>
            {['RCM denial rate 6pp above benchmark — $94M annual impact', 'CDO vacant 8 months — AI vendor decisions stalled', 'Epic optimization 58/100 — physician AI not activated'].map((t, i) => (
              <div key={i} style={{ fontSize: '11px', color: T.text2, marginBottom: '4px', paddingLeft: '12px', borderLeft: '2px solid ' + T.red + '40' }}>{t}</div>
            ))}
          </div>
        )}
      </div>

      {step >= 2 && (
        <div style={{ marginTop: '16px', fontSize: '11px', color: T.text3, textAlign: 'center' }}>
          Intelligence activating · {badgeCount}/8 categories loaded
        </div>
      )}
    </div>
  )
}

// ─── Act 2: First Intelligence ────────────────────────────────────────────────

function Act2Panel({ onInteract }: { onInteract: () => void }) {
  const [step, setStep] = useState(0)

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    timers.push(setTimeout(() => setStep(1), 800))
    timers.push(setTimeout(() => setStep(2), 2200))
    timers.push(setTimeout(() => setStep(3), 4000))
    timers.push(setTimeout(() => setStep(4), 5500))
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div onClick={onInteract} style={{ padding: '24px', height: '100%', overflowY: 'auto' }}>
      {/* Role selector */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {['CIO', 'CFO', 'CMIO', 'COO', 'CEO'].map(role => (
          <div key={role} style={{
            padding: '6px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, cursor: 'pointer',
            background: role === 'CIO' ? T.teal : T.surface2,
            color: role === 'CIO' ? '#0D1117' : T.text3,
            border: `1px solid ${role === 'CIO' ? T.teal : T.border2}`,
            transform: role === 'CIO' && step >= 1 ? 'scale(1.05)' : 'scale(1)',
            transition: 'all 300ms',
          }}>{role}</div>
        ))}
      </div>

      {/* Contradiction detection */}
      {step >= 2 && (
        <div style={{ background: '#1A0A0A', border: '1px solid ' + T.red + '50', borderRadius: '10px', padding: '16px', marginBottom: '16px', opacity: 1, transition: 'opacity 400ms' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: T.red, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>
            ⚠ CONTRADICTION DETECTED
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
            <div style={{ padding: '10px', background: T.surface2, borderRadius: '6px', border: '1px solid ' + T.border }}>
              <div style={{ fontSize: '9px', color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Reported to board</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: T.amber }}>94.2%</div>
              <div style={{ fontSize: '10px', color: T.text3 }}>collection rate</div>
            </div>
            <div style={{ padding: '10px', background: T.surface2, borderRadius: '6px', border: '1px solid ' + T.red + '40' }}>
              <div style={{ fontSize: '9px', color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Actual (claims data)</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: T.red }}>87.1%</div>
              <div style={{ fontSize: '10px', color: T.text3 }}>collection rate</div>
            </div>
          </div>
          <div style={{ padding: '10px 12px', background: '#0D2B1A', border: '1px solid #166534', borderRadius: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: T.green }}>$31M gap — revenue being miscounted</span>
          </div>
        </div>
      )}

      {/* Financial impact */}
      {step >= 3 && (
        <div style={{ background: T.surface2, border: '1px solid ' + T.border, borderRadius: '10px', padding: '14px 16px', marginBottom: '16px' }}>
          <div style={{ fontSize: '10px', color: T.text3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Annual value at risk</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: T.red }}>$94M</div>
          <div style={{ fontSize: '11px', color: T.text3, marginTop: '2px' }}>RCM denial write-off · Ensemble Health Partners SLA breach · $8M unclaimed</div>
        </div>
      )}

      {/* Response options */}
      {step >= 4 && (
        <div>
          <div style={{ fontSize: '10px', color: T.text3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Ask AbarVa:</div>
          {['Show me the dollar impact →', 'Who owns this problem? →', 'Fastest path to fix this →'].map((q, i) => (
            <div key={i} style={{ padding: '10px 14px', background: T.bg, border: '1px solid ' + T.border, borderRadius: '8px', marginBottom: '6px', fontSize: '12px', color: T.text2, cursor: 'pointer', transition: 'border-color 150ms' }}>
              {q}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Act 3: The Strategy ─────────────────────────────────────────────────────

const STEPS_3 = [
  { n: 1, label: 'Ground Truth', sub: 'AI readiness scores' },
  { n: 2, label: 'Executives Disagree', sub: 'Fault lines mapped' },
  { n: 3, label: 'Every Bet', sub: '12 opportunities ranked' },
  { n: 4, label: 'Your 3 Bets', sub: 'Prioritization complete' },
  { n: 5, label: 'Wave 1 Plan', sub: 'Timeline set' },
  { n: 6, label: 'Risk & Governance', sub: 'Failure patterns checked' },
  { n: 7, label: 'CFO Briefing', sub: 'ROI model ready' },
  { n: 8, label: 'Board Deck Ready', sub: '90 minutes total', highlight: true },
]

function Act3Panel({ onInteract }: { onInteract: () => void }) {
  const [activeStep, setActiveStep] = useState(1)
  const [showBoardDeck, setShowBoardDeck] = useState(false)

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    // Flash through steps 1-7 quickly, land on 8
    for (let i = 1; i <= 7; i++) {
      timers.push(setTimeout(() => setActiveStep(i + 1), i * 800))
    }
    timers.push(setTimeout(() => setShowBoardDeck(true), 7500))
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div onClick={onInteract} style={{ padding: '24px', height: '100%', overflowY: 'auto' }}>
      {/* Step list */}
      <div style={{ marginBottom: '20px' }}>
        {STEPS_3.map((s) => (
          <div key={s.n} style={{
            display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px',
            borderRadius: '8px', marginBottom: '4px',
            background: activeStep === s.n ? (s.highlight ? T.teal + '15' : T.surface2) : 'transparent',
            border: `1px solid ${activeStep === s.n ? (s.highlight ? T.teal + '60' : T.border) : 'transparent'}`,
            transition: 'all 300ms',
          }}>
            <div style={{
              width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
              background: activeStep > s.n ? '#0D4A3F' : activeStep === s.n ? (s.highlight ? T.teal : T.blue) : T.surface2,
              border: `1px solid ${activeStep > s.n ? '#166534' : activeStep === s.n ? (s.highlight ? T.teal : T.blue) : T.border2}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '9px', fontWeight: 700,
              color: activeStep > s.n ? T.green : activeStep === s.n ? '#0D1117' : T.text3,
              transition: 'all 300ms',
            }}>
              {activeStep > s.n ? '✓' : s.n}
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: activeStep === s.n ? 700 : 500, color: activeStep >= s.n ? T.text : T.text3 }}>{s.label}</div>
              {activeStep === s.n && <div style={{ fontSize: '10px', color: s.highlight ? T.teal : T.text3 }}>{s.sub}</div>}
            </div>
            {activeStep === s.n && <div style={{ marginLeft: 'auto', width: '6px', height: '6px', borderRadius: '50%', background: s.highlight ? T.teal : T.blue, flexShrink: 0 }} />}
          </div>
        ))}
      </div>

      {/* Board Deck Ready */}
      {showBoardDeck && (
        <div style={{ background: '#0D2B1A', border: '1px solid #166534', borderRadius: '12px', padding: '20px', opacity: showBoardDeck ? 1 : 0, transition: 'opacity 600ms' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: T.green, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
            ✓ Board Deck Ready
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '14px' }}>
            {['HTML Board Deck', 'CFO Excel Model', 'CIO Roadmap'].map(e => (
              <div key={e} style={{ padding: '8px', background: T.surface2, borderRadius: '6px', border: '1px solid ' + T.border, textAlign: 'center' }}>
                <div style={{ fontSize: '9px', fontWeight: 700, color: T.text2, textAlign: 'center' }}>{e}</div>
              </div>
            ))}
          </div>
          <div style={{ padding: '10px 12px', background: T.surface, border: '1px solid ' + T.border, borderRadius: '8px', borderLeft: '3px solid ' + T.amber }}>
            <div style={{ fontSize: '11px', color: T.text3, marginBottom: '2px' }}>McKinsey comparison</div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: T.amber }}>This took 90 minutes. McKinsey: $3.2M · 16 weeks.</div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Act 4: The Model ────────────────────────────────────────────────────────

function Act4Panel({ onInteract }: { onInteract: () => void }) {
  const [step, setStep] = useState(0)

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    timers.push(setTimeout(() => setStep(1), 600))
    timers.push(setTimeout(() => setStep(2), 1800))
    timers.push(setTimeout(() => setStep(3), 3200))
    return () => timers.forEach(clearTimeout)
  }, [])

  const block = (title: string, body: React.ReactNode, color: string, visible: boolean) => (
    <div style={{
      padding: '16px 18px', background: T.surface2, border: '1px solid ' + color + '50',
      borderLeft: '4px solid ' + color, borderRadius: '10px',
      opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(10px)',
      transition: 'all 500ms',
    }}>
      <div style={{ fontSize: '10px', fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>{title}</div>
      {body}
    </div>
  )

  return (
    <div onClick={onInteract} style={{ padding: '24px', height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {block('Platform Fee', (
        <>
          <div style={{ fontSize: '20px', fontWeight: 800, color: T.text }}>$500K/year</div>
          <div style={{ fontSize: '12px', color: T.text3 }}>Full platform access · Paid regardless of outcome</div>
        </>
      ), T.blue, step >= 1)}

      <div style={{ textAlign: 'center', fontSize: '18px', color: T.text3, opacity: step >= 2 ? 1 : 0, transition: 'opacity 300ms' }}>+</div>

      {block('Outcome Fee', (
        <>
          <div style={{ fontSize: '20px', fontWeight: 800, color: T.teal }}>15–20% of verified savings</div>
          <div style={{ fontSize: '12px', color: T.text3, marginBottom: '10px' }}>Only triggered when savings are real</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {[
              { label: 'Meridian baseline', value: '18.2% denial rate' },
              { label: 'Target', value: '12.0%' },
              { label: 'If achieved', value: '$28M saved' },
              { label: 'AbarVa earns', value: '$4.2–5.6M' },
            ].map(m => (
              <div key={m.label} style={{ padding: '7px 8px', background: T.bg, borderRadius: '5px', border: '1px solid ' + T.border }}>
                <div style={{ fontSize: '9px', color: T.text3, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>{m.label}</div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: T.text }}>{m.value}</div>
              </div>
            ))}
          </div>
        </>
      ), T.teal, step >= 2)}

      <div style={{ textAlign: 'center', fontSize: '18px', color: T.text3, opacity: step >= 3 ? 1 : 0, transition: 'opacity 300ms' }}>=</div>

      {block('Total If Meridian Hits Target', (
        <>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
            <div>
              <div style={{ fontSize: '11px', color: T.text3, marginBottom: '2px' }}>AbarVa earns</div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: T.green }}>$5.1–6.1M</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: T.text3, marginBottom: '2px' }}>Meridian keeps</div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: T.teal }}>$22M+</div>
            </div>
          </div>
          <div style={{ marginTop: '10px', fontSize: '13px', fontWeight: 700, color: T.text }}>Both win. Or neither does.</div>
        </>
      ), T.green, step >= 3)}
    </div>
  )
}

// ─── Final Close Screen ───────────────────────────────────────────────────────

function FinalScreen() {
  return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
      <div style={{ maxWidth: '600px', width: '100%', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px', marginBottom: '24px' }}>
          <span style={{ fontFamily: 'Georgia, serif', fontSize: '22px', fontWeight: 700, color: '#fff' }}>Abar</span>
          <span style={{ fontFamily: 'Georgia, serif', fontSize: '28px', fontWeight: 900, color: T.teal }}>Va</span>
        </div>
        <div style={{ fontSize: '13px', fontWeight: 700, color: T.teal, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>Intelligence. Now act on it.</div>
        <h2 style={{ fontSize: 'clamp(22px,4vw,36px)', fontWeight: 800, color: T.text, lineHeight: 1.2, margin: '0 0 32px' }}>
          Ready to see this with your organization's data?
        </h2>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '32px', flexWrap: 'wrap' }}>
          <a href="mailto:anand@abarva.ai?subject=Demo Request" style={{ padding: '14px 28px', background: T.teal, color: '#0D1117', borderRadius: '10px', fontSize: '14px', fontWeight: 700, textDecoration: 'none' }}>
            Book a Demo →
          </a>
          <a href="mailto:anand@abarva.ai" style={{ padding: '14px 28px', background: T.surface2, color: T.text, border: '1px solid ' + T.border2, borderRadius: '10px', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>
            Talk to Anand →
          </a>
        </div>
        <div style={{ fontSize: '13px', color: T.text3, marginBottom: '16px' }}>Or explore the platform yourself:</div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="/diagnose?client=meridian" style={{ padding: '10px 20px', background: T.surface, border: '1px solid ' + T.teal + '50', borderRadius: '8px', fontSize: '12px', fontWeight: 600, color: T.teal, textDecoration: 'none' }}>Open Meridian →</a>
          <a href="/diagnose?client=firstcapital" style={{ padding: '10px 20px', background: T.surface, border: '1px solid ' + T.blue + '50', borderRadius: '8px', fontSize: '12px', fontWeight: 600, color: T.blue, textDecoration: 'none' }}>Open First Capital →</a>
          <a href="/diagnose?client=apexretail" style={{ padding: '10px 20px', background: T.surface, border: '1px solid ' + T.amber + '50', borderRadius: '8px', fontSize: '12px', fontWeight: 600, color: T.amber, textDecoration: 'none' }}>Open Apex Retail →</a>
        </div>
      </div>
    </div>
  )
}

// ─── Act content config ───────────────────────────────────────────────────────

const ACT_STORIES = [
  {
    act: 1,
    label: 'THE SETUP',
    heading: "You've just signed Meridian Health System.",
    body: "Their CIO, Marcus Webb, has given you access to load their data. Here's what the Maestro does first.",
    narration: "This is your Maestro command center. When Meridian loads their data, AbarVa begins analyzing immediately. No interviews needed. No weeks of discovery. 48 hours.",
  },
  {
    act: 2,
    label: 'FIRST INTELLIGENCE',
    heading: "Before your first meeting with Marcus Webb, AbarVa has already found something important.",
    body: "Something his own team missed.",
    narration: "AbarVa found a $31M contradiction in Meridian's own data. Their leadership team reported 94% collection rate to the board. Their claims data shows 87%. That gap is real money.\n\nYou walk into the CIO meeting with this. No competitor can do that.",
  },
  {
    act: 3,
    label: 'THE STRATEGY',
    heading: 'Marcus Webb asks the question every CIO asks: "Where should we place our AI bets?"',
    body: "AbarVa answers in 90 minutes. McKinsey answers in 16 weeks.",
    narration: "Eight steps. Ninety minutes. A board-ready strategy built from Meridian's own data — not interviews, not frameworks, not generic best practices.\n\nTheir data. Their numbers. Their decisions.",
  },
  {
    act: 4,
    label: 'HOW ABARVA GETS PAID',
    heading: "This is the part no consulting firm can match.",
    body: "AbarVa does not charge for time. AbarVa charges for outcomes.",
    narration: "McKinsey charges $3.2M whether it works or not. AbarVa earns $4.2M only if Meridian saves $28M.\n\nThat's not a consulting model. That's a partnership.",
  },
]

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function DemoPage() {
  const [act, setAct] = useState(1)
  const [done, setDone] = useState(false)
  const [autoPlay, setAutoPlay] = useState(true)
  const [paused, setPaused] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const panelKey = useRef(0) // force re-mount of panel on act change

  const advance = useCallback(() => {
    if (act < 4) {
      setAct(a => a + 1)
    } else {
      setDone(true)
    }
  }, [act])

  // Auto-play timer
  useEffect(() => {
    if (!autoPlay || paused || done) return
    const duration = ACTS[act - 1].duration * 1000
    timerRef.current = setTimeout(advance, duration)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [act, autoPlay, paused, done, advance])

  function handleJump(n: number) {
    if (timerRef.current) clearTimeout(timerRef.current)
    panelKey.current++
    setAct(n)
    setPaused(false)
    setDone(false)
  }

  function handleInteract() {
    if (autoPlay && !paused) setPaused(true)
  }

  function handlePause() {
    if (timerRef.current) clearTimeout(timerRef.current)
    setPaused(true)
  }

  function handleToggleMode() {
    setAutoPlay(a => !a)
    setPaused(false)
  }

  if (done) return <FinalScreen />

  const story = ACT_STORIES[act - 1]
  const RightPanel = [Act1Panel, Act2Panel, Act3Panel, Act4Panel][act - 1]

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: 'DM Sans, Inter, -apple-system, sans-serif', color: T.text, display: 'flex', flexDirection: 'column' }}>
      <AbarvaNav />

      {/* Progress bar */}
      <ProgressBar act={act} onJump={handleJump} autoPlay={autoPlay} onToggle={handleToggleMode} paused={paused} onPause={handlePause} />

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        {/* Left panel — story (40%) */}
        <div style={{ width: '40%', borderRight: '1px solid ' + T.border, padding: '36px 32px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: T.teal, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '14px' }}>
              ACT {act} OF 4 · {story.label}
            </div>
            <h2 style={{ fontSize: 'clamp(15px,1.8vw,20px)', fontWeight: 700, color: T.text, lineHeight: 1.35, margin: '0 0 12px' }}>
              {story.heading}
            </h2>
            <p style={{ fontSize: '14px', color: T.text3, lineHeight: 1.6, margin: 0 }}>{story.body}</p>
          </div>

          {/* Narration */}
          <div style={{ padding: '16px', background: T.surface2, border: '1px solid ' + T.border, borderRadius: '8px', borderLeft: '3px solid ' + T.teal }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: T.teal, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Narration</div>
            {story.narration.split('\n\n').map((para, i) => (
              <p key={i} style={{ fontSize: '13px', color: T.text2, lineHeight: 1.65, margin: i > 0 ? '10px 0 0' : 0 }}>&ldquo;{para}&rdquo;</p>
            ))}
          </div>

          {/* Continue / manual advance */}
          {(!autoPlay || paused) && (
            <button
              onClick={() => { setPaused(false); advance() }}
              style={{ padding: '12px 20px', background: T.teal, color: '#0D1117', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', alignSelf: 'flex-start' }}
            >
              {act < 4 ? `Continue to Act ${act + 1} →` : 'See the close →'}
            </button>
          )}

          {autoPlay && !paused && (
            <div style={{ fontSize: '11px', color: T.text3 }}>
              Auto-advancing in {ACTS[act - 1].duration}s · Click the right panel to pause
            </div>
          )}
        </div>

        {/* Right panel — live platform (60%) */}
        <div style={{ flex: 1, background: T.bg, overflowY: 'auto' }}>
          <RightPanel key={`${act}-${panelKey.current}`} onInteract={handleInteract} />
        </div>
      </div>
    </div>
  )
}
