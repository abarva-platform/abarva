'use client'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import AbarvaNav from '@/components/AbarvaNav'

const PAGE  = '#F8F7F4'
const DARK  = '#060A12'
const DARK2 = '#0D1520'
const CARD  = '#FFFFFF'
const BDR   = '#E5E7EB'
const TEXT  = '#0C0C0C'
const TEXT2 = '#3C3C3C'
const MUTED = '#6B7280'
const TEAL  = '#2DD4C8'
const GRN   = '#34D399'
const RED   = '#EF4444'
const SANS  = 'DM Sans, sans-serif'
const MONO  = 'JetBrains Mono, monospace'
const SERIF = 'Georgia, serif'

const VERIFIED_OUTCOMES = [
  { metric: 'C/I Ratio', before: '71.2%', after: '69.1%', delta: '-2.1pp', unit: 'percentage points', verifiedBy: 'KPMG', date: 'Month 3', positive: true },
  { metric: 'Bloomberg Terminal Cost', before: '$8.4M/yr', after: '$5.1M/yr', delta: '-$3.3M', unit: 'annual savings', verifiedBy: 'CFO Office', date: 'Month 2', positive: true },
  { metric: 'AI Initiative ROI', before: '$0 tracked', after: '$7.4M', delta: '+$7.4M', unit: 'verified return', verifiedBy: 'Internal Audit', date: 'Month 4', positive: true },
]

const ACTIVE_ENGAGEMENTS = [
  { name: 'Margin Optimization — Cost-to-Income', sponsor: 'Victoria Hargreaves · CEO', problem: '$840M efficiency gap. 71% C/I vs 58% peer median. No transformation programme with a named owner.', phase: 'Phase 1 · Prescribe', value: '$840M', progress: 40 },
  { name: 'MAS FEAT Compliance', sponsor: 'Raj Malhotra · CIO', problem: 'MAS FEAT non-compliant. FCA review pending Q3. No dedicated remediation squad.', phase: 'Phase 0 · Diagnose', value: 'Regulatory', progress: 15 },
]

const NEXT_ENGAGEMENTS = [
  { name: 'AI ROI Verification Programme', value: '$60–120M', deadline: 'Q3 2026', desc: 'Baseline and track ROI across 28 active AI initiatives.' },
  { name: 'MA Star Rating Improvement', value: '$34M CMS bonus', deadline: 'Q4 2026', desc: 'From 3.5 to 4.0 stars — $34M CMS performance bonus at risk.' },
  { name: 'Salesforce FSC Optimisation', value: '$28M', deadline: '2027', desc: '44% adoption. 78% target. Behavioural change + platform config.' },
]

export default function ClientViewPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!isLoaded) return
    if (!user) { router.push('/sign-in'); return }
  }, [isLoaded, user, router])

  if (!isLoaded || !user) return <div style={{ minHeight: '100vh', background: PAGE }} />

  return (
    <div style={{ minHeight: '100vh', background: PAGE, fontFamily: SANS, color: TEXT }}>
      <AbarvaNav activePage="client-view" />

      {/* ── HEADER — dark ─────────────────────────────────────────────────── */}
      <section style={{ background: DARK, padding: '56px 48px', overflow: 'hidden' }}>
        <div style={{ fontFamily: MONO, fontSize: 11, color: TEAL, textTransform: 'uppercase' as const, letterSpacing: '.12em', marginBottom: 14 }}>
          Arcturus Financial · AbarVa Engagement Summary
        </div>
        <h1 style={{ fontFamily: SERIF, fontSize: 56, fontWeight: 700, color: '#FFFFFF', margin: '0 0 16px', lineHeight: 1.1 }}>
          Your transformation.<br />By the numbers.
        </h1>
        <p style={{ fontFamily: SANS, fontSize: 18, color: '#9CA3AF', margin: '0 0 48px', maxWidth: 560 }}>
          Board-ready. Auditable. Updated monthly.
        </p>

        {/* 4 board stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
          {[
            { value: '$22.4M', label: 'VERIFIED TO DATE', color: TEAL, sub: 'Audited · KPMG Month 3' },
            { value: '5.7x', label: 'ROI ON INVESTMENT', color: '#FFFFFF', sub: '$22.4M ÷ $3.92M fee' },
            { value: '3', label: 'PHASES APPROVED', color: GRN, sub: 'Gate-locked delivery' },
            { value: '$11.6M', label: 'PROJECTED YEAR 1', color: '#FFFFFF', sub: 'Based on current trajectory' },
          ].map((s, i) => (
            <div key={i} style={{ background: DARK2, border: '1px solid #1F2937', borderRadius: 8, padding: 28 }}>
              <div style={{ fontFamily: SERIF, fontSize: 52, fontWeight: 700, color: s.color, lineHeight: 1, marginBottom: 8 }}>{s.value}</div>
              <div style={{ fontFamily: MONO, fontSize: 10, color: TEAL, textTransform: 'uppercase' as const, letterSpacing: '.08em', marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontFamily: SANS, fontSize: 12, color: '#4B5563' }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── ENGAGEMENT SUMMARY ────────────────────────────────────────────── */}
      <section style={{ padding: '56px 48px', background: PAGE, overflow: 'hidden' }}>
        <div style={{ fontFamily: MONO, fontSize: 11, color: TEAL, textTransform: 'uppercase' as const, letterSpacing: '.12em', marginBottom: 12 }}>Active Engagements</div>
        <h2 style={{ fontFamily: SERIF, fontSize: 48, fontWeight: 700, color: TEXT, margin: '0 0 40px' }}>What AbarVa is solving.</h2>

        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 16 }}>
          {ACTIVE_ENGAGEMENTS.map((e, i) => (
            <div key={i} style={{ background: CARD, border: `1px solid ${BDR}`, borderRadius: 8, padding: 32, display: 'flex', alignItems: 'center', gap: 32 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: SANS, fontSize: 20, fontWeight: 600, color: TEXT, marginBottom: 6 }}>{e.name}</div>
                <div style={{ fontFamily: SANS, fontSize: 15, color: TEAL, marginBottom: 10 }}>{e.sponsor}</div>
                <div style={{ fontFamily: SANS, fontSize: 16, color: TEXT2, marginBottom: 16, lineHeight: 1.6 }}>{e.problem}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontFamily: MONO, fontSize: 11, color: TEAL, background: 'rgba(45,212,200,0.1)', padding: '4px 10px', borderRadius: 4 }}>{e.phase}</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' as const, flexShrink: 0 }}>
                <div style={{ fontFamily: SANS, fontSize: 28, fontWeight: 700, color: TEAL, marginBottom: 12 }}>{e.value}</div>
                <div style={{ width: 140, height: 6, background: BDR, borderRadius: 3 }}>
                  <div style={{ height: 6, borderRadius: 3, width: `${e.progress}%`, background: TEAL }} />
                </div>
                <div style={{ fontFamily: SANS, fontSize: 12, color: MUTED, marginTop: 6, textAlign: 'right' as const }}>{e.progress}% complete</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── VERIFIED OUTCOMES — dark ──────────────────────────────────────── */}
      <section style={{ background: DARK, padding: '56px 48px', overflow: 'hidden' }}>
        <div style={{ fontFamily: MONO, fontSize: 11, color: TEAL, textTransform: 'uppercase' as const, letterSpacing: '.12em', marginBottom: 12 }}>Outcomes</div>
        <h2 style={{ fontFamily: SERIF, fontSize: 48, fontWeight: 700, color: '#FFFFFF', margin: '0 0 40px' }}>What has been verified.</h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
          {VERIFIED_OUTCOMES.map((o, i) => (
            <div key={i} style={{ background: DARK2, border: '1px solid #1F2937', borderRadius: 8, padding: 28 }}>
              <div style={{ fontFamily: SANS, fontSize: 16, color: '#FFFFFF', fontWeight: 600, marginBottom: 16 }}>{o.metric}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ fontFamily: SANS, fontSize: 20, color: '#9CA3AF' }}>{o.before}</div>
                <div style={{ fontFamily: MONO, fontSize: 13, color: '#4B5563' }}>→</div>
                <div style={{ fontFamily: SANS, fontSize: 24, fontWeight: 700, color: '#FFFFFF' }}>{o.after}</div>
              </div>
              <div style={{ fontFamily: SANS, fontSize: 28, fontWeight: 700, color: o.positive ? GRN : RED, marginBottom: 6 }}>{o.delta}</div>
              <div style={{ fontFamily: SANS, fontSize: 13, color: '#9CA3AF', marginBottom: 12 }}>{o.unit}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 6 }}>
                <span style={{ color: GRN, fontSize: 12 }}>✓</span>
                <span style={{ fontFamily: MONO, fontSize: 11, color: GRN }}>Verified · {o.verifiedBy} · {o.date}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHAT'S NEXT ───────────────────────────────────────────────────── */}
      <section style={{ padding: '56px 48px', background: PAGE, overflow: 'hidden' }}>
        <div style={{ fontFamily: MONO, fontSize: 11, color: TEAL, textTransform: 'uppercase' as const, letterSpacing: '.12em', marginBottom: 12 }}>Recommended</div>
        <h2 style={{ fontFamily: SERIF, fontSize: 48, fontWeight: 700, color: TEXT, margin: '0 0 40px' }}>What comes next.</h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 40 }}>
          {NEXT_ENGAGEMENTS.map((n, i) => (
            <div key={i} style={{ background: CARD, border: `1px solid ${BDR}`, borderRadius: 8, padding: 28 }}>
              <div style={{ fontFamily: SANS, fontSize: 18, fontWeight: 600, color: TEXT, marginBottom: 8 }}>{n.name}</div>
              <div style={{ fontFamily: SANS, fontSize: 16, color: TEXT2, marginBottom: 16, lineHeight: 1.6 }}>{n.desc}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontFamily: SANS, fontSize: 20, fontWeight: 700, color: TEAL }}>{n.value}</div>
                <div style={{ fontFamily: MONO, fontSize: 11, color: MUTED }}>{n.deadline}</div>
              </div>
              <button style={{ width: '100%', background: TEXT, color: '#FFFFFF', fontFamily: SANS, fontSize: 15, fontWeight: 600, height: 44, border: 'none', borderRadius: 6, cursor: 'pointer' }}>
                Learn more →
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ── BOARD PACK ────────────────────────────────────────────────────── */}
      <section style={{ padding: '0 48px 80px' }}>
        <div style={{ background: CARD, borderTop: `4px solid ${TEAL}`, border: `1px solid ${BDR}`, borderRadius: 8, padding: 40 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3 style={{ fontFamily: SERIF, fontSize: 28, color: TEXT, margin: '0 0 12px' }}>Board Pack</h3>
              <p style={{ fontFamily: SANS, fontSize: 17, color: TEXT2, margin: '0 0 24px', maxWidth: 520, lineHeight: 1.6 }}>
                One-click export of all verified outcomes, P&L impact, and next recommendations — formatted for board presentation.
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const, marginBottom: 28 }}>
                {['Verified savings', 'ROI summary', 'Engagement detail', 'P&L impact', 'Next 90 days', 'Fee summary'].map((t, i) => (
                  <span key={i} style={{ fontFamily: MONO, fontSize: 11, color: MUTED, background: PAGE, border: `1px solid ${BDR}`, padding: '4px 10px', borderRadius: 4 }}>{t}</span>
                ))}
              </div>
              <button style={{ background: TEXT, color: '#FFFFFF', fontFamily: SANS, fontSize: 15, fontWeight: 600, height: 44, padding: '0 28px', border: 'none', borderRadius: 6, cursor: 'pointer', marginRight: 12 }}>
                Download Board Pack →
              </button>
              <button style={{ background: 'transparent', color: TEAL, fontFamily: SANS, fontSize: 15, border: 'none', cursor: 'pointer', padding: 0 }}>
                View all monthly reviews →
              </button>
            </div>
            <div style={{ textAlign: 'right' as const, flexShrink: 0 }}>
              <div style={{ fontFamily: SERIF, fontSize: 64, fontWeight: 700, color: TEAL, lineHeight: 1 }}>April</div>
              <div style={{ fontFamily: MONO, fontSize: 13, color: MUTED }}>Monthly review ready</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
