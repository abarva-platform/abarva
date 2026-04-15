'use client'
import { useRouter } from 'next/navigation'

// ── Light section tokens ─────────────────────────────────────────────────────
const LBG   = '#F8F7F4', LTEXT = '#0C0C0C', LBODY = '#3C3C3C'
const LMUTE = '#888888', LBDR = '#E2E1DC',  LCARD = '#FFFFFF'

// ── Dark section tokens ──────────────────────────────────────────────────────
const DBG   = '#060A12', DTEXT = '#EFF6FF',  DBODY = 'rgba(255,255,255,0.74)'
const DMUTE = 'rgba(255,255,255,0.46)', DBDR = '#1C2D45', DCARD = '#0D1520'

// ── Shared ───────────────────────────────────────────────────────────────────
const TEAL  = '#2DD4C8'
const SANS  = 'DM Sans, sans-serif', MONO = 'JetBrains Mono, monospace', SERIF = 'Georgia, serif'

// Keep BG/DIM for legacy intake flow refs
const BG = DBG, DIM = DMUTE

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
      {/* ── SECTION 1: Hero ─ light ───────────────────────────────────────── */}
      <div style={{ background: LBG, padding: '80px 64px 72px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 420px', gap: 64, alignItems: 'start' }}>

          {/* Left: identity */}
          <div>
            <div style={{ fontFamily: MONO, fontSize: 10, color: LMUTE, letterSpacing: '.14em', textTransform: 'uppercase' as const, marginBottom: 16 }}>
              Solution · {num}
            </div>
            <h1 style={{ fontFamily: SERIF, fontSize: 52, fontWeight: 400, color: LTEXT, margin: '0 0 20px', lineHeight: 1.12 }}>
              {name}
            </h1>
            <p style={{ fontSize: 17, color: LBODY, lineHeight: 1.72, margin: '0 0 28px' }}>
              {tagline}
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
              {meta.map((m, i) => (
                <span key={i} style={{ fontFamily: MONO, fontSize: 10, color: LMUTE, background: LCARD, border: `1px solid ${LBDR}`, borderRadius: 4, padding: '4px 10px' }}>
                  {m}
                </span>
              ))}
            </div>
          </div>

          {/* Right: 2×2 stat grid — no colored values */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {stats.map((s, i) => (
              <div key={i} style={{ background: LCARD, border: `1px solid ${LBDR}`, borderRadius: 10, padding: '20px 18px' }}>
                <div style={{ fontFamily: MONO, fontSize: 9, color: LMUTE, textTransform: 'uppercase' as const, letterSpacing: '.08em', marginBottom: 10 }}>{s.label}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                  <div style={{ fontFamily: SERIF, fontSize: 26, color: LTEXT, lineHeight: 1 }}>{s.value}</div>
                </div>
                <div style={{ fontSize: 11, color: LMUTE, lineHeight: 1.4 }}>{s.sub}</div>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* ── SECTION 2: Three phases ─ dark ────────────────────────────────── */}
      <div style={{ background: DBG, padding: '80px 64px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 360px', gap: 64, alignItems: 'start' }}>

          {/* Left: phases */}
          <div>
            <div style={{ fontFamily: MONO, fontSize: 10, color: DMUTE, letterSpacing: '.12em', textTransform: 'uppercase' as const, marginBottom: 40 }}>
              Three phases
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 36 }}>
              {phases.map((phase) => (
                <div key={phase.num} style={{ display: 'flex', gap: 24 }}>
                  {/* Phase number */}
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(45,212,200,0.08)', border: '1px solid rgba(45,212,200,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: MONO, fontSize: 14, color: TEAL, fontWeight: 700 }}>
                    {phase.num}
                  </div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 500, color: DTEXT, marginBottom: 10, lineHeight: 1.35 }}>{phase.title}</div>
                    <p style={{ fontSize: 13, color: DBODY, lineHeight: 1.65, margin: '0 0 14px' }}>{phase.desc}</p>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
                      {phase.products.map(p => (
                        <span key={p} style={{ fontFamily: MONO, fontSize: 10, color: TEAL, background: 'rgba(45,212,200,0.08)', border: '1px solid rgba(45,212,200,0.2)', borderRadius: 4, padding: '3px 8px' }}>{p}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Genome + Deliverables */}
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 16 }}>

            {/* Genome card */}
            <div style={{ background: DCARD, border: `1px solid ${DBDR}`, borderRadius: 12, padding: 24 }}>
              <div style={{ fontFamily: MONO, fontSize: 10, color: TEAL, letterSpacing: '.12em', textTransform: 'uppercase' as const, marginBottom: 24 }}>
                Genome patterns
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 20 }}>
                {genome.map((g, i) => (
                  <div key={i}>
                    <div style={{ fontFamily: SERIF, fontSize: 28, color: DTEXT, lineHeight: 1, marginBottom: 4 }}>{g.rate}</div>
                    <div style={{ fontSize: 13, color: DTEXT, fontWeight: 500, marginBottom: 3 }}>{g.name}</div>
                    <div style={{ fontSize: 11, color: DBODY }}>{g.sub}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Deliverables card */}
            <div style={{ background: DCARD, border: `1px solid ${DBDR}`, borderRadius: 12, padding: 24 }}>
              <div style={{ fontFamily: MONO, fontSize: 10, color: DMUTE, letterSpacing: '.12em', textTransform: 'uppercase' as const, marginBottom: 18 }}>
                Deliverables
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
                {deliverables.map((d, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: TEAL, flexShrink: 0, marginTop: 6 }} />
                    <span style={{ fontSize: 13, color: DBODY, lineHeight: 1.55 }}>{d}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── SECTION 3: Powered by ─ light strip ───────────────────────────── */}
      {poweredBy && poweredBy.length > 0 && (
        <div style={{ background: LBG, borderTop: `1px solid ${LBDR}`, borderBottom: `1px solid ${LBDR}`, padding: '20px 64px' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' as const }}>
            <div style={{ fontFamily: MONO, fontSize: 9, color: LMUTE, letterSpacing: '.14em', textTransform: 'uppercase' as const, flexShrink: 0 }}>
              Powered by
            </div>
            {poweredBy.map((mod, i) => (
              <span key={i} style={{ fontFamily: MONO, fontSize: 10, color: TEAL, background: 'rgba(45,212,200,0.06)', border: '1px solid rgba(45,212,200,0.2)', borderRadius: 4, padding: '4px 10px' }}>
                {mod}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── SECTION 4: Intake flow ─ dark ─────────────────────────────────── */}
      <div style={{ background: DBG, padding: '72px 64px 96px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>

          <div style={{ fontFamily: MONO, fontSize: 10, color: TEAL, letterSpacing: '.14em', textTransform: 'uppercase' as const, marginBottom: 12 }}>
            Start this solution
          </div>
          <h2 style={{ fontFamily: SERIF, fontSize: 38, fontWeight: 400, color: DTEXT, margin: '0 0 36px' }}>
            Tell us what you&apos;re trying to solve.
          </h2>

          {/* Step dots */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: step >= i ? TEAL : DBDR, transition: 'background 0.2s' }} />
            ))}
          </div>

          {/* ── STEP 0: Input ── */}
          {step === 0 && (
            <div>
              <div style={{ fontFamily: MONO, fontSize: 10, color: DMUTE, letterSpacing: '.1em', textTransform: 'uppercase' as const, marginBottom: 16 }}>
                Step 1 of 3 · describe the problem
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8, marginBottom: 16 }}>
                {starters.map((s, i) => (
                  <button key={i} onClick={() => setInput(s)} style={{ textAlign: 'left' as const, background: 'rgba(45,212,200,0.04)', border: `1px solid ${DBDR}`, borderRadius: 8, padding: '12px 16px', cursor: 'pointer', color: DBODY, fontSize: 13, fontFamily: SANS, lineHeight: 1.5 }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(45,212,200,0.3)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = DBDR)}
                  >
                    <span style={{ color: TEAL, fontFamily: MONO, fontSize: 10, marginRight: 8 }}>→</span>{s}
                  </button>
                ))}
              </div>
              <textarea value={input} onChange={e => setInput(e.target.value)} placeholder="Or describe your situation in your own words…" rows={4}
                style={{ width: '100%', background: DCARD, border: `1px solid ${DBDR}`, borderRadius: 10, padding: 16, color: DTEXT, fontSize: 14, fontFamily: SANS, lineHeight: 1.6, resize: 'vertical' as const, outline: 'none', boxSizing: 'border-box' as const }}
                onFocus={e => (e.currentTarget.style.borderColor = 'rgba(45,212,200,0.4)')}
                onBlur={e => (e.currentTarget.style.borderColor = DBDR)}
              />
              <button onClick={() => { if (input.trim()) setStep(1) }} disabled={!input.trim()}
                style={{ marginTop: 16, background: input.trim() ? TEAL : DBDR, color: input.trim() ? BG : DMUTE, border: 'none', borderRadius: 8, padding: '13px 28px', fontSize: 14, fontWeight: 600, fontFamily: SANS, cursor: input.trim() ? 'pointer' : 'not-allowed' }}>
                Match to Genome →
              </button>
            </div>
          )}

          {/* ── STEP 1: Genome response ── */}
          {step >= 1 && (
            <div>
              <div style={{ fontFamily: MONO, fontSize: 10, color: TEAL, letterSpacing: '.12em', textTransform: 'uppercase' as const, marginBottom: 16 }}>
                Genome match — what your client data already shows
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12, marginBottom: 32 }}>
                {findings.map((f, i) => (
                  <div key={i} style={{ background: DCARD, border: `1px solid ${DBDR}`, borderRadius: 10, padding: '18px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: f.severity === 'critical' ? '#EF4444' : '#F59E0B', flexShrink: 0 }} />
                      <span style={{ fontFamily: MONO, fontSize: 9, color: DMUTE, letterSpacing: '.1em', textTransform: 'uppercase' as const }}>{f.severity}</span>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: DTEXT, marginBottom: 8 }}>{f.title}</div>
                    <div style={{ fontSize: 13, color: DBODY, lineHeight: 1.65, marginBottom: 10 }}>{f.detail}</div>
                    {f.sources.length > 0 && (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
                        {f.sources.map((src, j) => (
                          <span key={j} style={{ fontFamily: MONO, fontSize: 9, color: DMUTE, background: 'rgba(71,85,105,0.15)', border: `1px solid ${DBDR}`, borderRadius: 3, padding: '2px 6px' }}>{src}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Follow-up question */}
              {step === 1 && (
                <div style={{ background: DCARD, border: `1px solid ${DBDR}`, borderRadius: 12, padding: 24 }}>
                  <div style={{ fontFamily: MONO, fontSize: 10, color: DMUTE, letterSpacing: '.1em', textTransform: 'uppercase' as const, marginBottom: 12 }}>
                    Step 2 of 3 · one follow-up question
                  </div>
                  <p style={{ fontSize: 15, color: DTEXT, marginBottom: 16, fontWeight: 500 }}>{followUpQ}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8 }}>
                    {followUpOpts.map(opt => (
                      <button key={opt} onClick={() => { setSelected(opt); setStep(2) }}
                        style={{ padding: '9px 16px', borderRadius: 8, fontSize: 13, fontFamily: SANS, cursor: 'pointer', border: `1px solid ${selected === opt ? TEAL : DBDR}`, background: selected === opt ? 'rgba(45,212,200,0.1)' : 'transparent', color: selected === opt ? TEAL : DBODY }}>
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Launch card */}
              {step >= 2 && !launched && (
                <div style={{ background: DCARD, border: '1px solid rgba(45,212,200,0.25)', borderRadius: 12, padding: '28px 24px' }}>
                  <div style={{ fontFamily: MONO, fontSize: 10, color: TEAL, letterSpacing: '.12em', textTransform: 'uppercase' as const, marginBottom: 12 }}>
                    Step 3 of 3 · ready to begin
                  </div>
                  <p style={{ fontSize: 13, color: DBODY, lineHeight: 1.65, margin: '0 0 20px' }}>
                    Creates project in your Maestro workspace with solution context pre-loaded.
                  </p>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={handleLaunch} style={{ background: TEAL, color: BG, border: 'none', borderRadius: 8, padding: '13px 28px', fontSize: 14, fontWeight: 600, fontFamily: SANS, cursor: 'pointer' }}>
                      Start engagement →
                    </button>
                    <button onClick={() => setStep(1)} style={{ background: 'transparent', color: DMUTE, border: `1px solid ${DBDR}`, borderRadius: 8, padding: '13px 20px', fontSize: 13, fontFamily: SANS, cursor: 'pointer' }}>
                      Change my answer
                    </button>
                  </div>
                </div>
              )}

              {/* Launched */}
              {launched && (
                <div style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.25)', borderRadius: 12, padding: '28px 24px', textAlign: 'center' as const }}>
                  <div style={{ fontFamily: MONO, fontSize: 10, color: TEAL, letterSpacing: '.12em', textTransform: 'uppercase' as const, marginBottom: 12 }}>
                    Project created
                  </div>
                  <p style={{ fontSize: 15, color: DTEXT, margin: 0 }}>Opening your workspace…</p>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </>
  )
}
