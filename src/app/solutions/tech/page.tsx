'use client'
import { useState } from 'react'
import AbarvaNav from '@/components/AbarvaNav'
import { arcturusTechnology } from '@/data/arcturus/technology'

const BG = '#060A12', CARD = '#0D1520', BORDER = '#1C2D45'
const TEAL = '#2DD4C8', WHITE = '#EFF6FF', MUTED = '#94A3B8', DIM = '#475569'
const RED = '#EF4444', AMBER = '#F59E0B', GREEN = '#34D399'
const SANS = 'DM Sans, sans-serif', MONO = 'JetBrains Mono, monospace', SERIF = 'Georgia, serif'

export default function SolutionTech() {
  const [step, setStep] = useState(0)
  const [problem, setProblem] = useState('')
  const [selectedOpt, setSelectedOpt] = useState('')
  const [launched, setLaunched] = useState(false)

  const handleMatch = () => { if (problem.trim()) setStep(1) }
  const handleLaunch = () => { setLaunched(true); setTimeout(() => { window.location.href = '/admin' }, 1200) }

  const oms = arcturusTechnology.corePlatform

  const starters = [
    `${oms.name} is ${oms.age} years old. ${oms.failedModernizations} failed modernization attempts. $${oms.annualMaintenanceCost}M annual maintenance.`,
    'Aladdin Risk only covers liquid assets. Regulator wants daily stress testing. We run monthly. Gap closes 2026.',
    '14 data systems. No golden record. 3-day reporting lag. We compete on information advantage.',
  ]

  const findings = [
    {
      severity: 'critical' as const,
      title: `${oms.name} — ${oms.age} years old · $${oms.annualMaintenanceCost}M maintenance · ${oms.failedModernizations} failed attempts`,
      detail: 'The business case was built by the vendor each time. When the client builds it from their own data — success rate is 71%. Vendor-built: 23%.',
      sources: ['Client technology', 'Genome (11 cases)'],
    },
    {
      severity: 'critical' as const,
      title: '14 data systems — no golden record — 3-day reporting lag',
      detail: 'Any OMS modernization fails if the data architecture problem is not solved first. Genome F003 — data readiness — present in 68% of failed modernizations.',
      sources: ['Client technology', 'Genome F003 · 68%'],
    },
    {
      severity: 'warning' as const,
      title: 'Aladdin Risk — alternatives not in real-time risk · regulator wants daily',
      detail: 'Regulator requires daily stress testing by mid-2026. Current system runs monthly. This changes the CFO calculation entirely.',
      sources: ['Client technology', 'Regulatory deadline'],
    },
  ]

  const followupOptions = [
    'Business case built by vendor — not trusted',
    'Risk too high — too many unknowns',
    'Cost too high vs perceived benefit',
    'No named executive to own the programme',
  ]

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: SANS, color: WHITE }}>
      <AbarvaNav activePage="solutions" />

      {/* ── Hero band ── */}
      <div style={{ borderBottom: `1px solid ${BORDER}`, padding: '64px 32px 56px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ fontFamily: MONO, fontSize: '10px', color: TEAL, letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: '14px' }}>
            Solution · Technology Modernization · Asset Management
          </div>
          <h1 style={{ fontFamily: SERIF, fontSize: '48px', fontWeight: 500, color: WHITE, margin: '0 0 16px', lineHeight: 1.15 }}>
            Technology Modernization
          </h1>
          <p style={{ fontSize: '18px', color: MUTED, maxWidth: '640px', lineHeight: 1.7, margin: '0 0 48px' }}>
            Replace legacy systems without repeating the last three failures. Client-built business case. Genome-validated vendor scoring. Fee on maintenance cost reduction only.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            {[
              {
                value: `${oms.age}yr`,
                color: RED,
                label: `${oms.name} core OMS age — $${oms.annualMaintenanceCost}M annual maintenance`,
              },
              {
                value: `${oms.failedModernizations}`,
                color: AMBER,
                label: 'Failed modernization attempts — each built by the vendor',
              },
              {
                value: '71%',
                color: TEAL,
                label: 'Success rate when client builds the business case',
              },
              {
                value: `$${oms.annualMaintenanceCost}M`,
                color: GREEN,
                label: 'Annual maintenance cost recovered once migration complete',
              },
            ].map(({ value, color, label }) => (
              <div key={value + label} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '24px 20px', borderTop: `2px solid ${color}` }}>
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
              <div style={{ fontSize: '14px', fontWeight: 600, color: WHITE }}>Diagnose — which systems actually need replacing</div>
            </div>
            <div style={{ padding: '28px 0 28px 32px', borderBottom: `1px solid ${BORDER}` }}>
              <p style={{ fontSize: '14px', color: MUTED, lineHeight: 1.6, margin: '0 0 16px', maxWidth: '560px' }}>
                Assess every system against the data readiness threshold. Identify which legacy platforms are structural blockers for AI. Separate the replace decisions from the configure decisions — not everything needs a migration.
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
              <div style={{ fontSize: '14px', fontWeight: 600, color: WHITE }}>Build the case the CFO will approve</div>
            </div>
            <div style={{ padding: '28px 0 28px 32px', borderBottom: `1px solid ${BORDER}` }}>
              <p style={{ fontSize: '14px', color: MUTED, lineHeight: 1.6, margin: '0 0 16px', maxWidth: '560px' }}>
                Score vendors against your data — not analyst opinion. Build the business case using your maintenance cost, your failure history, and Genome-validated ranges. The CFO sees the numbers before the vendor does.
              </p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
                {['Strategy', 'Vendor', 'Business Case'].map(p => (
                  <span key={p} style={{ fontFamily: MONO, fontSize: '10px', color: AMBER, background: 'rgba(245,158,11,0.08)', border: `1px solid rgba(245,158,11,0.2)`, borderRadius: '4px', padding: '4px 10px' }}>{p}</span>
                ))}
              </div>
            </div>

            {/* Phase 3 */}
            <div style={{ padding: '28px 32px 28px 0', borderRight: `1px solid ${BORDER}` }}>
              <div style={{ fontFamily: MONO, fontSize: '9px', color: GREEN, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: '6px' }}>Phase 3</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: WHITE }}>Govern the delivery — Maestros embedded</div>
            </div>
            <div style={{ padding: '28px 0 28px 32px' }}>
              <p style={{ fontSize: '14px', color: MUTED, lineHeight: 1.6, margin: '0 0 16px', maxWidth: '560px' }}>
                Maestros embedded inside the programme — not watching from outside. Milestone tracking locked to the baseline. Fee is a percentage of verified maintenance cost reduction once migration is complete.
              </p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
                {['Outcomes'].map(p => (
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
            AbarVa Genome · Technology modernization failure patterns
          </div>
          <p style={{ fontSize: '14px', color: DIM, margin: '0 0 36px' }}>
            Across 200+ enterprise engagements — these three patterns predict modernization failure with 90%+ accuracy.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            {[
              { pct: '72%', label: 'Vendor dependency without internal capability' },
              { pct: '68%', label: 'Data readiness below threshold' },
              { pct: '84%', label: 'No named executive sponsor' },
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
              'System-by-system modernization assessment',
              'Vendor scored against your data — not analyst opinion',
              'CFO-ready business case with Genome-validated ranges',
              'Delivery governance · milestone tracking · fee on maintenance cost reduction',
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
            Describe your technology situation
          </h2>
          <p style={{ fontSize: '14px', color: MUTED, margin: '0 0 28px', lineHeight: 1.6 }}>
            We will match it against the AbarVa Genome and surface the patterns that predict your outcome.
          </p>

          {/* Starter buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            {starters.map((s, i) => (
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
                {findings.map((fi, i) => (
                  <div
                    key={i}
                    style={{
                      background: CARD,
                      border: `1px solid ${fi.severity === 'critical' ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}`,
                      borderLeft: `3px solid ${fi.severity === 'critical' ? RED : AMBER}`,
                      borderRadius: '10px', padding: '18px 20px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span style={{
                        fontFamily: MONO, fontSize: '9px', letterSpacing: '.1em', textTransform: 'uppercase',
                        color: fi.severity === 'critical' ? RED : AMBER,
                        background: fi.severity === 'critical' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                        padding: '2px 8px', borderRadius: '4px',
                      }}>
                        {fi.severity}
                      </span>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: WHITE, marginBottom: '6px' }}>{fi.title}</div>
                    <div style={{ fontSize: '13px', color: MUTED, lineHeight: 1.6, marginBottom: '10px' }}>{fi.detail}</div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' as const }}>
                      {fi.sources.map(src => (
                        <span key={src} style={{ fontFamily: MONO, fontSize: '9px', color: DIM, background: 'rgba(71,85,105,0.15)', border: `1px solid rgba(71,85,105,0.3)`, borderRadius: '3px', padding: '2px 7px' }}>{src}</span>
                      ))}
                    </div>
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
                    What has stopped the CFO from approving this before?
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '10px', marginBottom: '24px' }}>
                    {followupOptions.map(opt => (
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
                    AbarVa will create a Technology Modernization project scoped to the blocker: <strong style={{ color: WHITE }}>{selectedOpt}</strong>. Genome patterns pre-loaded. Vendor scoring against your data. Baseline locked Day 0.
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
