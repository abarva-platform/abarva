'use client'
import { useRouter } from 'next/navigation'

const BG = '#060A12', CARD = '#0D1520', BORDER = '#1C2D45', TEAL = '#2DD4C8'
const WHITE = '#EFF6FF', MUTED = 'rgba(255,255,255,0.75)', DIM = 'rgba(255,255,255,0.6)'
const RED = '#EF4444', AMBER = '#F59E0B', GREEN = '#34D399'
const SANS = 'DM Sans, sans-serif', MONO = 'JetBrains Mono, monospace', SERIF = 'Georgia, serif'

interface SolutionLayoutProps {
  num: string
  name: string
  tagline: string
  meta: string[]
  stats: { label: string; value: string; color: string; sub: string }[]
  phases: { num: number; color: string; title: string; desc: string; products: string[] }[]
  genome: { rate: string; name: string; sub: string }[]
  deliverables: string[]
  starters: string[]
  findings: { severity: 'critical' | 'warning'; title: string; detail: string; sources: string[] }[]
  followUpQ: string
  followUpOpts: string[]
  input: string
  setInput: (v: string) => void
  step: number
  setStep: (v: number) => void
  selected: string
  setSelected: (v: string) => void
  launched: boolean
  setLaunched: (v: boolean) => void
  poweredBy?: string[]
}

export default function SolutionLayout({
  num, name, tagline, meta, stats, phases, genome, deliverables, starters, findings,
  followUpQ, followUpOpts, input, setInput, step, setStep, selected, setSelected, launched, setLaunched,
  poweredBy,
}: SolutionLayoutProps) {
  const router = useRouter()

  function handleLaunch() {
    setLaunched(true)
    setTimeout(() => router.push('/admin'), 1200)
  }

  return (
    <>
      {/* ── SECTION 1: Hero ── */}
      <div style={{ borderBottom: `1px solid ${BORDER}`, padding: '64px 5vw 56px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 400px', gap: '64px', alignItems: 'start' }}>

          {/* Left: identity */}
          <div>
            <div style={{ fontFamily: MONO, fontSize: '10px', color: TEAL, letterSpacing: '.14em', textTransform: 'uppercase' as const, marginBottom: '14px' }}>
              Solution · {num}
            </div>
            <h1 style={{ fontFamily: SERIF, fontSize: '52px', fontWeight: 500, color: WHITE, margin: '0 0 16px', lineHeight: 1.2 }}>
              {name}
            </h1>
            <p style={{ fontSize: '18px', color: MUTED, lineHeight: 1.7, margin: '0 0 24px' }}>
              {tagline}
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
              {meta.map((m, i) => (
                <span key={i} style={{ fontFamily: MONO, fontSize: '10px', color: '#EFF6FF', background: 'rgba(45,212,200,0.08)', border: '1px solid rgba(45,212,200,0.25)', borderRadius: '4px', padding: '4px 10px' }}>
                  {m}
                </span>
              ))}
            </div>
          </div>

          {/* Right: 2×2 stat grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {stats.map((s, i) => (
              <div key={i} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '20px 16px', borderTop: `2px solid ${s.color}` }}>
                <div style={{ fontSize: '11px', color: MUTED, marginBottom: '8px', fontFamily: MONO, lineHeight: 1.4 }}>{s.label}</div>
                <div style={{ fontFamily: SERIF, fontSize: '28px', color: s.color, lineHeight: 1, marginBottom: '6px' }}>{s.value}</div>
                <div style={{ fontSize: '11px', color: DIM, lineHeight: 1.4 }}>{s.sub}</div>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* ── SECTION 2: Phases + Genome + Deliverables ── */}
      <div style={{ borderBottom: `1px solid ${BORDER}`, padding: '64px 5vw' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 380px', gap: '64px', alignItems: 'start' }}>

          {/* Left: Three phases */}
          <div>
            <div style={{ fontFamily: MONO, fontSize: '10px', color: TEAL, letterSpacing: '.12em', textTransform: 'uppercase' as const, marginBottom: '36px' }}>
              Three phases
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '36px' }}>
              {phases.map((phase) => (
                <div key={phase.num} style={{ display: 'flex', gap: '20px' }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '50%',
                    background: `${phase.color}1A`, border: `1px solid ${phase.color}44`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, fontFamily: MONO, fontSize: '20px', color: phase.color, fontWeight: 700,
                  }}>
                    {phase.num}
                  </div>
                  <div>
                    <div style={{ fontSize: '20px', fontWeight: 600, color: WHITE, marginBottom: '8px' }}>{phase.title}</div>
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.80)', lineHeight: 1.6, margin: '0 0 12px' }}>{phase.desc}</p>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
                      {phase.products.map(p => (
                        <span key={p} style={{
                          fontFamily: MONO, fontSize: '10px', color: phase.color,
                          background: `${phase.color}14`, border: `1px solid ${phase.color}33`,
                          borderRadius: '4px', padding: '3px 8px',
                        }}>{p}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Genome + Deliverables */}
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '20px' }}>

            {/* Genome card */}
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '24px' }}>
              <div style={{ fontFamily: MONO, fontSize: '10px', color: TEAL, letterSpacing: '.12em', textTransform: 'uppercase' as const, marginBottom: '20px' }}>
                Genome patterns
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '20px' }}>
                {genome.map((g, i) => (
                  <div key={i}>
                    <div style={{ fontFamily: MONO, fontSize: '24px', fontWeight: 700, color: TEAL, lineHeight: 1, marginBottom: '4px' }}>{g.rate}</div>
                    <div style={{ fontSize: '13px', color: WHITE, fontWeight: 600, marginBottom: '3px' }}>{g.name}</div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.80)' }}>{g.sub}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Deliverables card */}
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '24px' }}>
              <div style={{ fontFamily: MONO, fontSize: '10px', color: MUTED, letterSpacing: '.12em', textTransform: 'uppercase' as const, marginBottom: '16px' }}>
                Deliverables
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '12px' }}>
                {deliverables.map((d, i) => (
                  <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <div style={{
                      width: '16px', height: '16px', borderRadius: '50%',
                      background: 'rgba(45,212,200,0.12)', border: '1px solid rgba(45,212,200,0.3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, marginTop: '2px',
                    }}>
                      <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: TEAL }} />
                    </div>
                    <span style={{ fontSize: '13px', color: MUTED, lineHeight: 1.5 }}>{d}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── SECTION 3: Powered by Intelligence ── */}
      {poweredBy && poweredBy.length > 0 && (
        <div style={{ borderTop: `1px solid ${BORDER}`, padding: '32px 5vw' }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ fontFamily: MONO, fontSize: '9px', color: TEAL, letterSpacing: '.14em', textTransform: 'uppercase', flexShrink: 0 }}>
              Powered by
            </div>
            {poweredBy.map((mod, i) => (
              <span key={i} style={{
                fontFamily: MONO, fontSize: '10px', color: TEAL,
                background: 'rgba(45,212,200,0.08)', border: '1px solid rgba(45,212,200,0.25)',
                borderRadius: '20px', padding: '4px 12px',
              }}>{mod}</span>
            ))}
          </div>
        </div>
      )}

      {/* ── SECTION 4: Intake flow ── */}
      <div style={{ padding: '64px 5vw 96px' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>

          <div style={{ fontFamily: MONO, fontSize: '10px', color: TEAL, letterSpacing: '.14em', textTransform: 'uppercase' as const, marginBottom: '12px' }}>
            Start this solution
          </div>
          <h2 style={{ fontFamily: SERIF, fontSize: '22px', fontWeight: 500, color: WHITE, margin: '0 0 32px' }}>
            Tell us what you're trying to solve.
          </h2>

          {/* Step dots */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '28px' }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: step >= i ? TEAL : BORDER,
                transition: 'background 0.2s',
              }} />
            ))}
          </div>

          {/* ── STEP 0: Input ── */}
          {step === 0 && (
            <div>
              <div style={{ fontFamily: MONO, fontSize: '10px', color: MUTED, letterSpacing: '.1em', textTransform: 'uppercase' as const, marginBottom: '16px' }}>
                Step 1 of 3 · describe the problem
              </div>

              {/* Starter pills */}
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '8px', marginBottom: '16px' }}>
                {starters.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(s)}
                    style={{
                      textAlign: 'left' as const, background: 'rgba(45,212,200,0.04)',
                      border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '12px 16px',
                      cursor: 'pointer', color: MUTED, fontSize: '13px', fontFamily: SANS, lineHeight: 1.5,
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(45,212,200,0.3)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = BORDER)}
                  >
                    <span style={{ color: TEAL, fontFamily: MONO, fontSize: '10px', marginRight: '8px' }}>→</span>{s}
                  </button>
                ))}
              </div>

              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Or describe your situation in your own words…"
                rows={4}
                style={{
                  width: '100%', background: CARD, border: `1px solid ${BORDER}`, borderRadius: '10px',
                  padding: '16px', color: WHITE, fontSize: '14px', fontFamily: SANS, lineHeight: 1.6,
                  resize: 'vertical' as const, outline: 'none', boxSizing: 'border-box' as const,
                }}
                onFocus={e => (e.currentTarget.style.borderColor = 'rgba(45,212,200,0.4)')}
                onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
              />

              <button
                onClick={() => { if (input.trim()) setStep(1) }}
                disabled={!input.trim()}
                style={{
                  marginTop: '16px', background: input.trim() ? TEAL : DIM,
                  color: input.trim() ? BG : MUTED, border: 'none', borderRadius: '8px',
                  padding: '13px 28px', fontSize: '14px', fontWeight: 600, fontFamily: SANS,
                  cursor: input.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                Match to Genome →
              </button>
            </div>
          )}

          {/* ── STEP 1: Genome response ── */}
          {step >= 1 && (
            <div>
              <div style={{ fontFamily: MONO, fontSize: '10px', color: TEAL, letterSpacing: '.12em', textTransform: 'uppercase' as const, marginBottom: '16px' }}>
                Genome match — what your client data already shows
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '12px', marginBottom: '32px' }}>
                {findings.map((f, i) => (
                  <div key={i} style={{
                    background: CARD,
                    border: `1px solid ${f.severity === 'critical' ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}`,
                    borderLeft: `3px solid ${f.severity === 'critical' ? RED : AMBER}`,
                    borderRadius: '10px', padding: '18px 20px',
                  }}>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                      <span style={{
                        fontFamily: MONO, fontSize: '9px', letterSpacing: '.1em', textTransform: 'uppercase' as const,
                        color: f.severity === 'critical' ? RED : AMBER,
                        background: f.severity === 'critical' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                        padding: '2px 8px', borderRadius: '4px',
                      }}>
                        {f.severity}
                      </span>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: WHITE, marginBottom: '6px' }}>{f.title}</div>
                    <div style={{ fontSize: '13px', color: MUTED, lineHeight: 1.6, marginBottom: '8px' }}>{f.detail}</div>
                    {f.sources.length > 0 && (
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' as const }}>
                        {f.sources.map((src, j) => (
                          <span key={j} style={{
                            fontFamily: MONO, fontSize: '9px', color: DIM,
                            background: 'rgba(71,85,105,0.2)', border: `1px solid ${BORDER}`,
                            borderRadius: '3px', padding: '2px 6px',
                          }}>{src}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Follow-up question */}
              {step === 1 && (
                <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '24px' }}>
                  <div style={{ fontFamily: MONO, fontSize: '10px', color: MUTED, letterSpacing: '.1em', textTransform: 'uppercase' as const, marginBottom: '12px' }}>
                    Step 2 of 3 · one follow-up question
                  </div>
                  <p style={{ fontSize: '15px', color: WHITE, marginBottom: '16px', fontWeight: 500 }}>{followUpQ}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '8px' }}>
                    {followUpOpts.map(opt => (
                      <button
                        key={opt}
                        onClick={() => { setSelected(opt); setStep(2) }}
                        style={{
                          padding: '9px 16px', borderRadius: '8px', fontSize: '13px', fontFamily: SANS,
                          cursor: 'pointer',
                          border: `1px solid ${selected === opt ? TEAL : BORDER}`,
                          background: selected === opt ? 'rgba(45,212,200,0.1)' : 'transparent',
                          color: selected === opt ? TEAL : MUTED,
                        }}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Launch card */}
              {step >= 2 && !launched && (
                <div style={{ background: CARD, border: '1px solid rgba(45,212,200,0.25)', borderRadius: '12px', padding: '28px 24px' }}>
                  <div style={{ fontFamily: MONO, fontSize: '10px', color: TEAL, letterSpacing: '.12em', textTransform: 'uppercase' as const, marginBottom: '12px' }}>
                    Step 3 of 3 · ready to begin
                  </div>
                  <p style={{ fontSize: '13px', color: MUTED, lineHeight: 1.6, margin: '0 0 20px' }}>
                    Creates project in your Maestro workspace with solution context pre-loaded.
                  </p>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      onClick={handleLaunch}
                      style={{
                        background: TEAL, color: BG, border: 'none', borderRadius: '8px',
                        padding: '13px 28px', fontSize: '14px', fontWeight: 600, fontFamily: SANS, cursor: 'pointer',
                      }}
                    >
                      Start engagement →
                    </button>
                    <button
                      onClick={() => setStep(1)}
                      style={{
                        background: 'transparent', color: MUTED, border: `1px solid ${BORDER}`,
                        borderRadius: '8px', padding: '13px 20px', fontSize: '13px', fontFamily: SANS, cursor: 'pointer',
                      }}
                    >
                      Change my answer
                    </button>
                  </div>
                </div>
              )}

              {/* Launched */}
              {launched && (
                <div style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: '12px', padding: '28px 24px', textAlign: 'center' as const }}>
                  <div style={{ fontFamily: MONO, fontSize: '10px', color: GREEN, letterSpacing: '.12em', textTransform: 'uppercase' as const, marginBottom: '12px' }}>
                    Project created
                  </div>
                  <p style={{ fontSize: '15px', color: WHITE, margin: '0' }}>Opening your workspace…</p>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </>
  )
}
