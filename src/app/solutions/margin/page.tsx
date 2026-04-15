'use client'
import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import AbarvaNav from '@/components/AbarvaNav'
import SolutionLayout from '@/components/SolutionLayout'
import { arcturusFinancial } from '@/data/arcturus/index'

const BG = '#060A12', SANS = 'DM Sans, sans-serif', WHITE = '#EFF6FF'
const TEAL = '#2DD4C8', AMBER = '#F59E0B', GREEN = '#34D399', RED = '#EF4444'
const BORDER2 = '#1C2D45', MUTED2 = 'rgba(255,255,255,0.75)', MONO2 = 'JetBrains Mono, monospace'

export default function SolutionMargin() {
  const [input, setInput] = useState('')
  const [step, setStep] = useState(0)
  const [selected, setSelected] = useState('')
  const [launched, setLaunched] = useState(false)
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const clientId = user?.publicMetadata?.clientId as string | undefined

  useEffect(() => {
    if (!isLoaded || !user) return
    const role = user.publicMetadata?.role as string
    const cid = (user.publicMetadata?.clientId as string) || 'arcturus'
    if (role === 'admin') { router.replace(`/engage/arcturus/margin`); return }
    if (cid) { router.replace(`/portal/margin`); return }
  }, [isLoaded, user, router])

  const f = arcturusFinancial.financials
  const ci = f.costToIncomeRatio       // 71
  const target = f.targetCIRatio       // 58
  const gap = f.efficiencyGap          // 840
  const ai = f.aiInvestment            // 94

  const phases = [
    { num: 1, color: TEAL, title: 'Diagnose — where the margin is leaking and why',
      desc: 'AbarVa runs financials, cost structure, and AI portfolio through 340 Genome patterns. In 48 hours every margin gap is structured: which are fixable, which are structural, in what order to address them.',
      products: ['Situation', 'Data Intelligence'] },
    { num: 2, color: AMBER, title: 'Prescribe — the sequenced recovery plan',
      desc: '3–5 specific interventions, sequenced by impact and feasibility. Each with a CFO-grade business case: investment required, savings range, timeline, risk, Genome validation.',
      products: ['Strategy', 'Business Case'] },
    { num: 3, color: GREEN, title: 'Verify — baseline locked · savings tracked · fee earned',
      desc: 'Baseline locked Day 0. Immutable. Monthly actuals tracked. Fee 15–20% of what is actually delivered — not what was promised.',
      products: ['Outcomes'] },
  ]

  const genome = [
    { rate: '89%', name: 'No named executive sponsor', sub: 'Margin programmes without C-suite owner stall at implementation' },
    { rate: '76%', name: 'AI spend without verified ROI', sub: 'Technology cost inflating margin — no traceable output' },
    { rate: '68%', name: 'Cost misattribution', sub: 'Teams optimise visible costs — structural drivers intact' },
  ]

  const deliverables = [
    'Margin gap analysis — every driver quantified',
    '3–5 prioritised interventions with ROI ranges',
    'CFO-ready business case per intervention',
    'Baseline locked Day 0 · monthly tracking · fee on verified savings',
  ]

  const starters = [
    `C/I ratio is ${ci}% vs ${target}% peer target. $${gap}M efficiency gap.`,
    `$${ai}M committed to AI initiatives. Cannot show ROI on any of them.`,
    'Technology is our largest cost after compensation. Cannot show what it is delivering.',
  ]

  const findings = [
    { severity: 'critical' as const,
      title: `C/I ratio ${ci}% vs ${target}% target — $${gap}M annual efficiency gap`,
      detail: 'Arcturus spends 35% more than peers on technology without proportional outcomes. The margin gap is structural, not cyclical — it will not self-correct.',
      sources: ['Client financials', 'Industry benchmark', 'Genome (14 cases)'] },
    { severity: 'critical' as const,
      title: `$${ai}M AI committed — zero with a documented baseline`,
      detail: 'Every initiative contributes to cost. None has a measurable return. Portfolio must be rationalized to 3–5 funded initiatives before adding new ones.',
      sources: ['Client data', 'Genome F002 · 84%'] },
    { severity: 'warning' as const,
      title: '$38M client portal investment — 44% adoption, NPS 31',
      detail: 'Portal recovery contributes 1.2–2.1pp to operating margin in similar cases once adoption exceeds 70%.',
      sources: ['Client technology', 'Industry benchmark'] },
  ]

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: SANS, color: WHITE }}>
      <AbarvaNav activePage="solutions" />
      {clientId && (
        <div style={{ background: `rgba(45,212,200,0.06)`, borderBottom: `1px solid rgba(45,212,200,0.2)` }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: TEAL }} />
              <span style={{ fontSize: '13px', color: WHITE }}>Your engagement is in progress</span>
              <span style={{ fontFamily: MONO2, fontSize: '10px', color: MUTED2 }}>· Phase 0 complete</span>
            </div>
            <a href={`/engage/${clientId}/margin`} style={{ background: TEAL, color: BG, padding: '8px 18px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
              Continue →
            </a>
          </div>
        </div>
      )}
      <SolutionLayout
        num="2 of 3" name="Margin Optimization"
        tagline="Identify every margin lever — across revenue, cost structure, and AI portfolio — and create a board-ready recovery plan. Fee charged only on verified savings."
        meta={['CEO · CFO · COO', 'Healthcare · FinServ · Retail', '6–12 week delivery', '15–20% of verified savings']}
        stats={[
          { label: 'C/I ratio — Arcturus', value: `${ci}%`, color: RED, sub: `vs ${target}% target · $${gap}M gap` },
          { label: 'AI spend committed', value: `$${ai}M`, color: AMBER, sub: 'Zero with documented ROI' },
          { label: 'Recovery range', value: '$60–120M', color: TEAL, sub: 'Annual · Genome-validated' },
          { label: 'Fee model', value: '15–20%', color: GREEN, sub: 'Of verified savings only' },
        ]}
        phases={phases}
        genome={genome}
        deliverables={deliverables}
        starters={starters}
        findings={findings}
        followUpQ="Who is the executive sponsor — and what outcome do they care most about?"
        followUpOpts={['CEO — total margin recovery', 'CFO — cost discipline and ROI accountability', 'CIO — technology cost and AI ROI', 'Board — competitive benchmarking story']}
        input={input} setInput={setInput}
        step={step} setStep={setStep}
        selected={selected} setSelected={setSelected}
        launched={launched} setLaunched={setLaunched}
        poweredBy={['Situation Intelligence', 'Margin Intelligence', 'Contradiction Intelligence']}
      />

      {/* Powered by */}
      <div style={{ background: '#08101C', borderTop: `1px solid ${BORDER2}`, padding: '40px 32px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' as const }}>
            <div style={{ fontFamily: MONO2, fontSize: '9px', color: MUTED2, letterSpacing: '.12em', textTransform: 'uppercase' as const, flexShrink: 0 }}>
              Powered by
            </div>
            {[
              { name: 'Situation Intelligence', path: '/diagnose' },
              { name: 'Contradiction Intelligence', path: '/contradictions' },
              { name: 'Business Case Intelligence', path: '/justify' },
              { name: 'Outcome Intelligence', path: '/outcome-intelligence' },
            ].map(m => (
              <a key={m.name} href={m.path} style={{
                fontFamily: MONO2, fontSize: '10px', color: TEAL,
                background: 'rgba(45,212,200,0.07)', border: '1px solid rgba(45,212,200,0.2)',
                borderRadius: '4px', padding: '4px 10px', textDecoration: 'none',
              }}>
                {m.name}
              </a>
            ))}
            <div style={{ marginLeft: 'auto' }}>
              <a href="/ai-strategy" style={{ fontSize: '12px', color: MUTED2, textDecoration: 'none' }}>
                Full AI Strategy engagement →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
