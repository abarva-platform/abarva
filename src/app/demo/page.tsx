'use client'
import { useState, useEffect, useRef, useCallback } from 'react'

const BG     = '#060A12'
const PANEL  = '#0C0C0C'
const WHITE  = '#FFFFFF'
const MUTED  = 'rgba(255,255,255,0.80)'
const DIM    = 'rgba(255,255,255,0.30)'
const TEAL   = '#2DD4C8'
const BORDER = 'rgba(255,255,255,0.07)'
const MONO   = "'JetBrains Mono', 'Courier New', monospace"
const SERIF  = "Georgia, 'Times New Roman', serif"
const SANS   = "'DM Sans', system-ui, sans-serif"

interface Screen {
  id: number
  category: 'THE PROBLEM' | 'VISION' | 'PLATFORM' | 'PROOF'
  title: string
  body: string
  bullets: string[]
  url: string
}

const PHASE_GROUPS: { label: string; category: Screen['category']; screens: number[] }[] = [
  { label: 'THE PROBLEM', category: 'THE PROBLEM', screens: [1, 2] },
  { label: 'VISION',      category: 'VISION',       screens: [3, 4] },
  { label: 'PLATFORM',    category: 'PLATFORM',     screens: [5, 6, 7, 8, 9, 10] },
  { label: 'PROOF',       category: 'PROOF',        screens: [11, 12] },
]

const SCREENS: Screen[] = [
  {
    id: 1,
    category: 'THE PROBLEM',
    title: 'The $200B problem.',
    body: 'Every enterprise is spending on AI and transformation. Almost none can prove it\'s working. Consulting firms deliver decks and leave. Nobody owns the outcome.',
    bullets: [
      '$200B consulting spend — zero accountability',
      '73% of AI investments produce no verified outcome',
      '48 hours to first intelligence — vs 4 weeks for a consultant',
      'Fee tied to verified outcomes — industry first',
    ],
    url: '/',
  },
  {
    id: 2,
    category: 'THE PROBLEM',
    title: 'Same problem. Same firms. Same result. Since forever.',
    body: 'Consulting firms spend weeks 1–4 learning the client. Knowledge walks out when they leave. Deliverable is a PowerPoint. No baseline. No accountability. Same firm comes back next year.',
    bullets: [
      'Left column: how advisory firms work today',
      'Right column: how AbarVa works differently',
      'Data ingested before the first meeting — not during',
      'Baseline locked Day 0 — immutable',
      'Knowledge stays in the platform permanently',
    ],
    url: '/platform',
  },
  {
    id: 3,
    category: 'VISION',
    title: 'Not a consulting firm. Not a software vendor. The layer that connects your data to verified outcomes.',
    body: 'AbarVa is the intelligence platform with embedded operators — Maestros — who govern delivery from inside and share the outcome. Three layers: Intelligence, Knowledge, Execution.',
    bullets: [
      'Intelligence: your data + benchmarks + 340+ Genome patterns',
      'Maestros: operators embedded in delivery — not parachuted in',
      'Outcome share: 15–20% of verified savings only',
      'One Maestro runs 3–4 engagements simultaneously — scales without headcount',
    ],
    url: '/platform',
  },
  {
    id: 4,
    category: 'VISION',
    title: '340+ patterns from real transformations. Getting smarter with every engagement.',
    body: 'The Transformation Genome is the moat. Patterns from real transformations. Failure rates. Recovery ranges. Vendor track records. Every engagement makes it smarter. Advisory firms carry this in partners\' heads — it walks out when they retire. Ours compounds.',
    bullets: [
      'F011: 74% failure rate — Epic without interim RCM stabilisation',
      'F002: 84% failure rate — no named executive sponsor',
      'Meridian matched to 4 active patterns',
      'Every pattern sourced and auditable — not consultant opinion',
    ],
    url: '/intelligence',
  },
  {
    id: 5,
    category: 'PLATFORM',
    title: 'Before the first meeting, the Maestro already knows everything.',
    body: 'The Admin portal gives the Maestro full programme visibility. Every engagement. Every client. Every approval pending. Data health tracked. Value accumulating.',
    bullets: [
      '$960M+ total value tracked across active clients',
      'Sponsor and business function tagged per engagement',
      'Approval queue — phase gates are formal, not advisory',
      'Data health score per client — readiness before deployment',
      'Fee earned: $0 until outcomes are verified',
    ],
    url: '/admin',
  },
  {
    id: 6,
    category: 'PLATFORM',
    title: 'A new engagement is defined by the intelligence, not by a form.',
    body: 'The Maestro types the leadership directive in plain language. The AI reads the client\'s uploaded data and maps it to the right Genome patterns — immediately. Sponsor confirmed. Timeline set. Engagement created in one flow.',
    bullets: [
      'Q1: free text — the Maestro\'s exact words from the CEO conversation',
      'AI maps the directive to client data instantly — not a generic template',
      'Genome validation always visible — 74% success rate for this type',
      'Live canvas populates as questions are answered',
      'Save & Launch → Phase 0 pre-populated, baseline locked',
    ],
    url: '/admin',
  },
  {
    id: 7,
    category: 'PLATFORM',
    title: 'The Maestro arrives at the first meeting knowing every gap, every risk, every number.',
    body: 'The Intel Feed surfaces critical signals from Meridian\'s data. F011 active — 74% failure rate without interim RCM. $94M annual write-off. Board does not know. Not a consultant\'s opinion — pattern-matched intelligence from 47 comparable engagements.',
    bullets: [
      'Rotating critical signal — live updated from client data',
      'Three solution cards with verified $ exposure per domain',
      'Genome signals panel on the right — 4 patterns matched',
      'Readiness status — 2 data gaps flagged before deployment',
      'YOUR ACTION — Phase 1 ready for Maestro review',
    ],
    url: '/maestro/meridian',
  },
  {
    id: 8,
    category: 'PLATFORM',
    title: '7 issues. $224M at risk. Mapped in 48 hours.',
    body: 'Situation Intelligence maps every system failure and benchmark deviation to a dollar figure. No vague findings — every issue has an owner, a phase, and a cost of inaction. The Maestro didn\'t spend 4 weeks learning the client. The platform did it before the first meeting.',
    bullets: [
      '18.2% denial rate vs 12.1% benchmark — $94M annual exposure',
      'Each finding linked to a phase, owner, and solution track',
      'Genome pattern cited per finding — evidence-based, not opinion',
      'Switch to Arcturus tab — cross-industry contrast, same confidence',
    ],
    url: '/diagnose',
  },
  {
    id: 9,
    category: 'PLATFORM',
    title: 'The AI Analyst tracks every outcome in real time. Every number auditable.',
    body: 'Month 3: C/I ratio 69.1% from 71.2% baseline. 210 basis points improvement. $12.8M annualised. The CFO asks if it\'s structural or an anomaly — the AI Analyst gives three data points confirming it\'s structural. Fee trigger: $12.8M × 15% = $1.92M earned.',
    bullets: [
      'AI Analyst answers the CFO\'s exact question — not a canned report',
      'Three structural confirmations — not narrative, not opinion',
      'Fee calculation transparent: $1.92M earned on $12.8M verified',
      'Monthly Actuals, AI ROI Tracker, Fee Calculation tabs live',
      'Phase timeline left — every phase gate complete and gated',
    ],
    url: '/engage/meridian/margin',
  },
  {
    id: 10,
    category: 'PLATFORM',
    title: 'The board can see it. The CFO can defend it. Every dollar auditable.',
    body: 'The Value Dashboard shows what AbarVa has delivered — not projected, verified. $22.4M verified. $3.92M fee earned. 5.7x ROI on the AbarVa fee. P&L mapped: OpEx reduction, CapEx avoided. Monthly Review auto-generates on the 1st.',
    bullets: [
      '$22.4M verified — audited by KPMG Month 3',
      '5.7x ROI: $22.4M ÷ $3.92M fee — client\'s language, not ours',
      'P&L mapping: OpEx / CapEx / Revenue clearly split',
      'Monthly Review Package — board-ready, one click',
      'Next $34M opportunity surfaced — window still open',
    ],
    url: '/maestro/meridian',
  },
  {
    id: 11,
    category: 'PROOF',
    title: 'Same platform. Different industry. Same confidence.',
    body: 'Arcturus Financial Group: $8.4B AUM, C/I ratio 71% against a 58% peer median. The same Maestro platform — calibrated to wealth management benchmarks and financial services contracts. The Genome knows financial services as well as healthcare.',
    bullets: [
      '$840M efficiency gap identified — same methodology, different vertical',
      '8 CRITICAL signals in the Intel Feed — no gap missed',
      '3 active solutions: Margin Optimisation, Tech, PDLC',
      'Different industry — identical confidence level and platform experience',
      'F005: 82% / F002: 84% — same Genome, new patterns applied',
    ],
    url: '/maestro/arcturus',
  },
  {
    id: 12,
    category: 'PROOF',
    title: '$8M. $25M cap. Category-creation round.',
    body: 'AbarVa is raising $8M on a SAFE with a $25M cap and MFN protection. Platform live. Demo clients running. Genome seeded with 340+ patterns. Series A trigger: $5M ARR with 3 enterprise clients.',
    bullets: [
      'Platform is live — you just watched it work end to end',
      'SAFE with MFN — clean, founder-friendly structure',
      'Use of funds: 3 Maestros, Genome data, automated benchmarks, GTM',
      'Series A trigger: $5M ARR, ~$100M pre-money',
      'Harvey AI comp: $11B doing for legal what we do for transformation',
    ],
    url: '/investor',
  },
]

export default function DemoGuidedPage() {
  const [idx, setIdx] = useState(0)
  const [autoOn, setAutoOn] = useState(false)
  const [countdown, setCountdown] = useState(60)
  const [selfServe, setSelfServe] = useState(false)
  const [sinceNav, setSinceNav] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const sinceRef = useRef(0)
  const screen = SCREENS[idx]
  const total = SCREENS.length

  const goTo = useCallback((i: number) => {
    const clamped = Math.max(0, Math.min(total - 1, i))
    setIdx(clamped)
    setCountdown(60)
    sinceRef.current = 0
    setSinceNav(0)
  }, [total])

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goTo(idx + 1)
      if (e.key === 'ArrowLeft')  goTo(idx - 1)
      if (e.key === 'Escape') setSelfServe(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [idx, goTo])

  // Auto-advance with 3s minimum display time
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (!autoOn) return
    timerRef.current = setInterval(() => {
      sinceRef.current += 1
      setSinceNav(sinceRef.current)
      setCountdown(c => {
        if (c <= 1 && sinceRef.current >= 3) {
          setIdx(i => {
            const next = Math.min(i + 1, total - 1)
            if (next === total - 1 && i === total - 1) setAutoOn(false)
            sinceRef.current = 0
            setSinceNav(0)
            return next
          })
          return 60
        }
        return c <= 1 ? c : c - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [autoOn, total])

  const isFirst = idx === 0
  const isLast  = idx === total - 1
  const progress = ((idx + 1) / total) * 100
  const activeGroup = PHASE_GROUPS.find(g => g.screens.includes(screen.id))

  if (selfServe) {
    return (
      <div style={{ height: '100vh', overflow: 'hidden', position: 'relative' }}>
        <iframe src="/" style={{ width: '100%', height: '100%', border: 'none' }} title="AbarVa Platform" />
        <button
          onClick={() => setSelfServe(false)}
          style={{
            position: 'fixed', top: 12, right: 12, zIndex: 9999,
            padding: '8px 16px', background: PANEL, border: `1px solid ${BORDER}`,
            borderRadius: 6, color: TEAL, fontFamily: MONO, fontSize: 10,
            cursor: 'pointer', letterSpacing: '.08em',
          }}
        >
          ← GUIDED DEMO
        </button>
      </div>
    )
  }

  return (
    <div style={{ height: '100vh', overflow: 'hidden', background: BG, display: 'flex', flexDirection: 'column', fontFamily: MONO }}>

      {/* ── TOP BAR ──────────────────────────────────────────────────────── */}
      <div style={{
        height: 52, background: PANEL, borderBottom: `1px solid ${BORDER}`,
        display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12, flexShrink: 0,
      }}>
        {/* Wordmark */}
        <a href="/" style={{ fontSize: 11, color: TEAL, textDecoration: 'none', letterSpacing: '.12em', flexShrink: 0 }}>
          ABARVA
        </a>
        <div style={{ width: 1, height: 20, background: BORDER, flexShrink: 0 }} />
        <span style={{ fontSize: 9, color: DIM, letterSpacing: '.12em', flexShrink: 0 }}>GUIDED DEMO</span>
        <div style={{ width: 1, height: 20, background: BORDER, flexShrink: 0 }} />

        {/* Phase groups with step dots */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0, overflow: 'hidden' }}>
          {PHASE_GROUPS.map((group, gi) => {
            const groupActive = group.category === screen.category
            return (
              <div key={gi} style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: gi === 2 ? 0 : 1 }}>
                {gi > 0 && <div style={{ width: 1, height: 16, background: BORDER, marginRight: 2 }} />}
                {/* Group label */}
                <span style={{
                  fontSize: 8, letterSpacing: '.1em', flexShrink: 0,
                  color: groupActive ? TEAL : 'rgba(45,212,200,0.3)',
                  fontWeight: groupActive ? 700 : 400,
                }}>
                  {group.label}
                </span>
                {/* Step dots */}
                {group.screens.map(sn => {
                  const si = sn - 1
                  const active = si === idx
                  const past   = si < idx
                  return (
                    <button
                      key={sn}
                      onClick={() => goTo(si)}
                      title={`Screen ${sn}: ${SCREENS[si].title}`}
                      style={{
                        width: active ? 20 : 14, height: 14,
                        borderRadius: 3, border: 'none', cursor: 'pointer',
                        background: active ? TEAL : past ? 'rgba(45,212,200,0.3)' : 'rgba(255,255,255,0.08)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <span style={{ fontSize: 8, color: active ? BG : past ? TEAL : DIM, fontWeight: 700 }}>{sn}</span>
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>

        {/* Right controls */}
        <button
          onClick={() => setAutoOn(a => !a)}
          style={{
            fontSize: 9, padding: '4px 10px', borderRadius: 4, cursor: 'pointer',
            background: autoOn ? 'rgba(45,212,200,0.1)' : 'transparent',
            border: `1px solid ${autoOn ? 'rgba(45,212,200,0.35)' : BORDER}`,
            color: autoOn ? TEAL : DIM, flexShrink: 0,
          }}
        >
          {autoOn ? `⏸ ${countdown}s` : '▶ Auto 60s'}
        </button>
        <button
          onClick={() => setSelfServe(true)}
          style={{
            fontSize: 9, color: DIM, padding: '4px 8px',
            border: `1px solid ${BORDER}`, borderRadius: 4,
            background: 'transparent', cursor: 'pointer', flexShrink: 0,
          }}
        >
          Self-serve →
        </button>
      </div>

      {/* ── BODY ─────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* LEFT PANEL */}
        <div style={{
          width: 260, flexShrink: 0, background: PANEL,
          borderRight: `1px solid ${BORDER}`,
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Scrollable content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '28px 24px 20px' }}>

            {/* Screen counter + category */}
            <div style={{
              fontFamily: MONO, fontSize: 10, color: TEAL,
              textTransform: 'uppercase', letterSpacing: '.13em', marginBottom: 16,
            }}>
              SCREEN {screen.id} OF {total} · {activeGroup?.label ?? screen.category}
            </div>

            {/* Headline */}
            <h2 style={{
              fontFamily: SERIF, fontSize: 26, color: WHITE,
              fontWeight: 700, lineHeight: 1.2, margin: '0 0 18px',
            }}>
              {screen.title}
            </h2>

            {/* Body */}
            <p style={{
              fontFamily: SANS, fontSize: 15, color: MUTED,
              lineHeight: 1.75, margin: '0 0 28px',
            }}>
              {screen.body}
            </p>

            {/* What to notice */}
            <div>
              <div style={{
                fontFamily: MONO, fontSize: 10, color: TEAL,
                textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 14,
              }}>
                WHAT TO NOTICE
              </div>
              {screen.bullets.map((b, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'flex-start' }}>
                  <span style={{ fontFamily: MONO, fontSize: 12, color: TEAL, flexShrink: 0, marginTop: 1, lineHeight: 1.5 }}>›</span>
                  <span style={{ fontFamily: SANS, fontSize: 13, color: 'rgba(255,255,255,0.70)', lineHeight: 1.6 }}>{b}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom — nav + progress */}
          <div style={{ flexShrink: 0, borderTop: `1px solid ${BORDER}` }}>
            {/* Nav buttons */}
            <div style={{ padding: '16px 20px 12px' }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <button
                  onClick={() => goTo(idx - 1)}
                  disabled={isFirst}
                  style={{
                    flex: 1, padding: '10px', borderRadius: 6,
                    cursor: isFirst ? 'default' : 'pointer',
                    background: 'transparent', border: `1px solid ${BORDER}`,
                    color: isFirst ? DIM : MUTED,
                    fontFamily: MONO, fontSize: 11,
                  }}
                >
                  ← Prev
                </button>
                <button
                  onClick={() => goTo(idx + 1)}
                  disabled={isLast}
                  style={{
                    flex: 2, padding: '10px', borderRadius: 6,
                    cursor: isLast ? 'default' : 'pointer',
                    background: isLast ? 'transparent' : 'rgba(45,212,200,0.14)',
                    border: `1px solid ${isLast ? BORDER : 'rgba(45,212,200,0.4)'}`,
                    color: isLast ? DIM : TEAL,
                    fontFamily: MONO, fontSize: 11, fontWeight: 700,
                  }}
                >
                  {isLast ? 'Complete' : 'Next →'}
                </button>
              </div>
              <div style={{ textAlign: 'center', fontSize: 9, color: DIM, fontFamily: MONO }}>
                ← → arrow keys · click any step above
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ height: 3, background: 'rgba(255,255,255,0.06)' }}>
              <div style={{
                height: 3, background: TEAL,
                width: `${progress}%`,
                transition: 'width 0.3s ease',
              }} />
            </div>
          </div>
        </div>

        {/* RIGHT PANEL — iframe */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#000' }}>
          <iframe
            key={screen.url + idx}
            src={screen.url}
            style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
            title={screen.title}
          />
        </div>
      </div>
    </div>
  )
}
