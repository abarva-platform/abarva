'use client'
import { useState } from 'react'
import AbarvaNav from '@/components/AbarvaNav'

const BG = '#060A12', CARD = '#0D1520', BORDER = '#1C2D45'
const TEAL = '#2DD4C8', WHITE = '#EFF6FF', MUTED = '#94A3B8', DIM = '#475569'
const RED = '#EF4444', AMBER = '#F59E0B', GREEN = '#34D399'
const SANS = 'DM Sans, sans-serif', MONO = 'JetBrains Mono, monospace', SERIF = 'Georgia, serif'

const STARTERS = [
  'Time to production is 16+ months. Engineers spend more time in meetings than building.',
  'We have 80 consultants on site. 70% of their time is onboarding, not building.',
  'We are spending $300M in engineering capital and shipping less than our competitors.',
]

const FINDINGS = [
  {
    severity: 'critical' as const,
    title: '16+ month time to production — Genome average 8mo post-AbarVa',
    detail: 'The bottleneck is governance and handoffs, not engineering velocity. 72% of cases involve vendor dependency without internal capability to accelerate.',
  },
  {
    severity: 'critical' as const,
    title: 'Consultant-heavy delivery model — knowledge walks out Friday',
    detail: '79% of programmes with no MLOps infrastructure fail to reach production within 18 months.',
  },
  {
    severity: 'warning' as const,
    title: 'Change management gap — 61% failure rate pattern',
    detail: 'Embedding AI into the build cycle requires change at the squad level, not just tooling.',
  },
]

const FOLLOWUP_OPTIONS = [
  'Speed — time to production',
  'Cost — consulting and engineering spend',
  'Quality — rework and failures',
  'All three',
]

export default function SolutionPDLC() {
  const [step, setStep] = useState(0)
  const [problem, setProblem] = useState('')
  const [selectedOpt, setSelectedOpt] = useState('')
  const [launched, setLaunched] = useState(false)

  function handleMatch() {
    if (problem.trim()) setStep(1)
  }

  function handleLaunch() {
    setLaunched(true)
    setTimeout(() => { window.location.href = '/admin' }, 1200)
  }

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: SANS, color: WHITE }}>
      <AbarvaNav activePage="solutions" />

      {/* ── Hero band ── */}
      <div style={{ borderBottom: `1px solid ${BORDER}`, padding: '64px 32px 56px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ fontFamily: MONO, fontSize: '10px', color: TEAL, letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: '14px' }}>
            Solution · CIO · AI-Powered PDLC · All verticals
          </div>
          <h1 style={{ fontFamily: SERIF, fontSize: '48px', fontWeight: 500, color: WHITE, margin: '0 0 16px', lineHeight: 1.15 }}>
            AI-Powered PDLC
          </h1>
          <p style={{ fontSize: '18px', color: MUTED, maxWidth: '640px', lineHeight: 1.7, margin: '0 0 48px' }}>
            Build products at twice the velocity. AI agents alongside your engineering teams — from backlog to production, Genome-validated.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            {[
              { value: '$300M', color: RED, label: 'Enterprise avg engineering capital — 70% in meetings not building' },
              { value: '16mo', color: RED, label: 'Average time to production before AbarVa' },
              { value: '8mo', color: TEAL, label: 'After AbarVa — 50% reduction, Genome-validated' },
              { value: '$18M', color: GREEN, label: 'Average annual consulting reduction per engagement' },
            ].map(({ value, color, label }) => (
              <div key={value} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '24px 20px', borderTop: `2px solid ${color}` }}>
                <div style={{ fontFamily: SERIF, fontSize: '32px', color, marginBottom: '8px', lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: '12px', color: MUTED, lineHeight: 1.5 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Three-phase section ── */}
      <div style={{ borderBottom: `1px solid ${BORDER}`, padding: '64px 32px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ fontFamily: MONO, fontSize: '10px', color: MUTED, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: '40px' }}>
            How it works — three phases
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '0' }}>

            {/* Phase 1 */}
            <div style={{ padding: '28px 32px 28px 0', borderRight: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
              <div style={{ fontFamily: MONO, fontSize: '9px', color: TEAL, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: '6px' }}>Phase 1</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: WHITE }}>Diagnose the delivery bottleneck</div>
            </div>
            <div style={{ padding: '28px 0 28px 32px', borderBottom: `1px solid ${BORDER}` }}>
              <p style={{ fontSize: '14px', color: MUTED, lineHeight: 1.6, margin: '0 0 16px', maxWidth: '560px' }}>
                Map every handoff, sprint ceremony, and governance gate. Quantify the capital burned between idea and production. Benchmark against the Genome.
              </p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
                {['Situation', 'Data Intelligence'].map(p => (
                  <span key={p} style={{ fontFamily: MONO, fontSize: '10px', color: TEAL, background: 'rgba(45,212,200,0.08)', border: `1px solid rgba(45,212,200,0.2)`, borderRadius: '4px', padding: '4px 10px' }}>{p}</span>
                ))}
              </div>
            </div>

            {/* Phase 2 */}
            <div style={{ padding: '28px 32px 28px 0', borderRight: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
              <div style={{ fontFamily: MONO, fontSize: '9px', color: AMBER, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: '6px' }}>Phase 2</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: WHITE }}>Embed AI into the build cycle</div>
            </div>
            <div style={{ padding: '28px 0 28px 32px', borderBottom: `1px solid ${BORDER}` }}>
              <p style={{ fontSize: '14px', color: MUTED, lineHeight: 1.6, margin: '0 0 16px', maxWidth: '560px' }}>
                Design and embed AI agents at squad level — code generation, test automation, review, deployment. Select and integrate tooling against your existing stack.
              </p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
                {['Strategy', 'Vendor'].map(p => (
                  <span key={p} style={{ fontFamily: MONO, fontSize: '10px', color: AMBER, background: 'rgba(245,158,11,0.08)', border: `1px solid rgba(245,158,11,0.2)`, borderRadius: '4px', padding: '4px 10px' }}>{p}</span>
                ))}
              </div>
            </div>

            {/* Phase 3 */}
            <div style={{ padding: '28px 32px 28px 0', borderRight: `1px solid ${BORDER}` }}>
              <div style={{ fontFamily: MONO, fontSize: '9px', color: GREEN, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: '6px' }}>Phase 3</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: WHITE }}>Verify delivery improvement · earn the fee</div>
            </div>
            <div style={{ padding: '28px 0 28px 32px' }}>
              <p style={{ fontSize: '14px', color: MUTED, lineHeight: 1.6, margin: '0 0 16px', maxWidth: '560px' }}>
                Baseline locked Day 0. Monthly tracking published. Fee is contingent on verified cycle time reduction — if we don't cut time to production, we don't get paid.
              </p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
                {['Business Case', 'Outcomes'].map(p => (
                  <span key={p} style={{ fontFamily: MONO, fontSize: '10px', color: GREEN, background: 'rgba(52,211,153,0.08)', border: `1px solid rgba(52,211,153,0.2)`, borderRadius: '4px', padding: '4px 10px' }}>{p}</span>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── Genome patterns panel ── */}
      <div style={{ background: CARD, borderBottom: `1px solid ${BORDER}`, padding: '56px 32px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ fontFamily: MONO, fontSize: '10px', color: MUTED, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: '8px' }}>
            AbarVa Genome · PDLC failure patterns
          </div>
          <p style={{ fontSize: '14px', color: DIM, margin: '0 0 36px' }}>
            Across 200+ enterprise engagements — these three patterns predict PDLC failure with 90%+ accuracy.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            {[
              { pct: '72%', label: 'Vendor dependency without internal capability' },
              { pct: '61%', label: 'Change management gap' },
              { pct: '79%', label: 'No MLOps infrastructure' },
            ].map(({ pct, label }) => (
              <div key={pct} style={{ border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '28px 24px' }}>
                <div style={{ fontFamily: MONO, fontSize: '40px', fontWeight: 700, color: RED, lineHeight: 1, marginBottom: '12px' }}>{pct}</div>
                <div style={{ fontSize: '13px', color: MUTED, lineHeight: 1.5 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Deliverables ── */}
      <div style={{ borderBottom: `1px solid ${BORDER}`, padding: '56px 32px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ fontFamily: MONO, fontSize: '10px', color: MUTED, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: '32px' }}>
            Deliverables
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', maxWidth: '760px' }}>
            {[
              'Delivery bottleneck map — every handoff quantified',
              'AI agent integration playbook — squad-level',
              'Vendor selection for tooling — scored against your stack',
              'Baseline + monthly tracking + fee on verified cycle time reduction',
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(45,212,200,0.12)', border: `1px solid rgba(45,212,200,0.3)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: TEAL }} />
                </div>
                <span style={{ fontSize: '14px', color: MUTED, lineHeight: 1.5 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Intake section ── */}
      <div style={{ padding: '64px 32px 96px' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          <div style={{ fontFamily: MONO, fontSize: '10px', color: TEAL, letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: '12px' }}>
            Genome match — start here
          </div>
          <h2 style={{ fontFamily: SERIF, fontSize: '28px', fontWeight: 500, color: WHITE, margin: '0 0 8px' }}>
            Describe your delivery situation
          </h2>
          <p style={{ fontSize: '14px', color: MUTED, margin: '0 0 28px', lineHeight: 1.6 }}>
            We will match it against the AbarVa Genome and surface the patterns that predict your outcome.
          </p>

          {/* Starter buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            {STARTERS.map((s, i) => (
              <button
                key={i}
                onClick={() => setProblem(s)}
                style={{
                  textAlign: 'left', background: 'rgba(45,212,200,0.04)', border: `1px solid ${BORDER}`,
                  borderRadius: '8px', padding: '12px 16px', cursor: 'pointer', color: MUTED,
                  fontSize: '13px', fontFamily: SANS, lineHeight: 1.5,
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(45,212,200,0.35)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = BORDER)}
              >
                <span style={{ color: TEAL, fontFamily: MONO, fontSize: '10px', marginRight: '8px' }}>→</span>
                {s}
              </button>
            ))}
          </div>

          {/* Textarea */}
          <textarea
            value={problem}
            onChange={e => setProblem(e.target.value)}
            placeholder="Or describe your situation in your own words…"
            rows={4}
            style={{
              width: '100%', background: CARD, border: `1px solid ${BORDER}`, borderRadius: '10px',
              padding: '16px', color: WHITE, fontSize: '14px', fontFamily: SANS, lineHeight: 1.6,
              resize: 'vertical', outline: 'none', boxSizing: 'border-box',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = 'rgba(45,212,200,0.4)')}
            onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
          />

          {/* Match button */}
          {step === 0 && (
            <button
              onClick={handleMatch}
              disabled={!problem.trim()}
              style={{
                marginTop: '16px', background: problem.trim() ? TEAL : DIM,
                color: problem.trim() ? BG : MUTED, border: 'none', borderRadius: '8px',
                padding: '13px 28px', fontSize: '14px', fontWeight: 600, fontFamily: SANS,
                cursor: problem.trim() ? 'pointer' : 'not-allowed', transition: 'background 0.15s',
              }}
            >
              Match to Genome →
            </button>
          )}

          {/* ── Step 1: Findings ── */}
          {step >= 1 && (
            <div style={{ marginTop: '32px' }}>
              <div style={{ fontFamily: MONO, fontSize: '10px', color: TEAL, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: '16px' }}>
                Genome match · 3 patterns identified
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                {FINDINGS.map((f, i) => (
                  <div
                    key={i}
                    style={{
                      background: CARD, border: `1px solid ${f.severity === 'critical' ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}`,
                      borderLeft: `3px solid ${f.severity === 'critical' ? RED : AMBER}`,
                      borderRadius: '10px', padding: '18px 20px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span style={{
                        fontFamily: MONO, fontSize: '9px', letterSpacing: '.1em', textTransform: 'uppercase',
                        color: f.severity === 'critical' ? RED : AMBER,
                        background: f.severity === 'critical' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                        padding: '2px 8px', borderRadius: '4px',
                      }}>
                        {f.severity}
                      </span>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: WHITE, marginBottom: '6px' }}>{f.title}</div>
                    <div style={{ fontSize: '13px', color: MUTED, lineHeight: 1.6 }}>{f.detail}</div>
                  </div>
                ))}
              </div>

              {/* ── Step 1 → 2 follow-up ── */}
              {step === 1 && (
                <div>
                  <div style={{ fontFamily: MONO, fontSize: '10px', color: MUTED, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: '12px' }}>
                    One follow-up question
                  </div>
                  <p style={{ fontSize: '15px', color: WHITE, marginBottom: '16px', fontWeight: 500 }}>
                    What is the primary bottleneck — speed, quality, or cost?
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '10px', marginBottom: '24px' }}>
                    {FOLLOWUP_OPTIONS.map(opt => (
                      <button
                        key={opt}
                        onClick={() => setSelectedOpt(opt)}
                        style={{
                          padding: '9px 18px', borderRadius: '8px', fontSize: '13px', fontFamily: SANS,
                          cursor: 'pointer', border: `1px solid ${selectedOpt === opt ? TEAL : BORDER}`,
                          background: selectedOpt === opt ? 'rgba(45,212,200,0.1)' : CARD,
                          color: selectedOpt === opt ? TEAL : MUTED,
                          transition: 'all 0.15s',
                        }}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setStep(2)}
                    disabled={!selectedOpt}
                    style={{
                      background: selectedOpt ? TEAL : DIM, color: selectedOpt ? BG : MUTED,
                      border: 'none', borderRadius: '8px', padding: '13px 28px',
                      fontSize: '14px', fontWeight: 600, fontFamily: SANS,
                      cursor: selectedOpt ? 'pointer' : 'not-allowed',
                    }}
                  >
                    Create project and begin →
                  </button>
                </div>
              )}

              {/* ── Step 2: Launch ── */}
              {step >= 2 && !launched && (
                <div style={{ background: CARD, border: `1px solid rgba(45,212,200,0.25)`, borderRadius: '12px', padding: '28px 24px' }}>
                  <div style={{ fontFamily: MONO, fontSize: '10px', color: TEAL, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: '12px' }}>
                    Ready to launch
                  </div>
                  <p style={{ fontSize: '14px', color: MUTED, lineHeight: 1.6, margin: '0 0 20px' }}>
                    AbarVa will create an AI-Powered PDLC project scoped to your bottleneck: <strong style={{ color: WHITE }}>{selectedOpt}</strong>. Genome patterns pre-loaded. Baseline will be locked on Day 0.
                  </p>
                  <button
                    onClick={handleLaunch}
                    style={{
                      background: TEAL, color: BG, border: 'none', borderRadius: '8px',
                      padding: '13px 28px', fontSize: '14px', fontWeight: 600, fontFamily: SANS, cursor: 'pointer',
                    }}
                  >
                    Create project and begin →
                  </button>
                </div>
              )}

              {/* ── Launched state ── */}
              {launched && (
                <div style={{ background: 'rgba(52,211,153,0.06)', border: `1px solid rgba(52,211,153,0.3)`, borderRadius: '12px', padding: '28px 24px', textAlign: 'center' as const }}>
                  <div style={{ fontFamily: MONO, fontSize: '10px', color: GREEN, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: '12px' }}>
                    Project created
                  </div>
                  <p style={{ fontSize: '15px', color: WHITE, margin: '0' }}>
                    Opening your workspace…
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
