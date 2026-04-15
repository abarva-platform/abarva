'use client'
import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import AbarvaNav from '@/components/AbarvaNav'
import SolutionLayout from '@/components/SolutionLayout'

const BG = '#060A12', SANS = 'DM Sans, sans-serif', WHITE = '#EFF6FF'
const TEAL = '#2DD4C8', AMBER = '#F59E0B', GREEN = '#34D399', RED = '#EF4444'

const PHASES = [
  { num: 1, color: TEAL, title: 'Diagnose the delivery bottleneck',
    desc: 'AbarVa maps every handoff, every meeting displacing building, every vendor dependency without internal capability. In 48 hours you know exactly where your delivery cycle is leaking and which interventions recover the most time.',
    products: ['Situation', 'Data Intelligence'] },
  { num: 2, color: AMBER, title: 'Embed AI into the build cycle',
    desc: 'Maestros embed inside your engineering squads. AI agents handle scaffolding, testing, documentation, and review — the parts that slow humans down. Engineers build what requires judgment. Output doubles.',
    products: ['Strategy', 'Vendor'] },
  { num: 3, color: GREEN, title: 'Verify improvement · earn the fee',
    desc: 'Baseline locked Day 0: cycle time, output per engineer, consulting spend. Monthly actuals tracked. Fee on verified improvement only. If time to production does not drop, we do not get paid.',
    products: ['Business Case', 'Outcomes'] },
]

const GENOME = [
  { rate: '72%', name: 'Vendor dependency without internal capability', sub: 'Teams cannot verify or recover when the vendor fails' },
  { rate: '61%', name: 'Change management gap', sub: 'Technology works — adoption fails. Engineers revert.' },
  { rate: '79%', name: 'No MLOps infrastructure', sub: 'AI cannot reach production without deployment rails' },
]

const DELIVERABLES = [
  'Delivery bottleneck map — every handoff quantified',
  'AI agent integration playbook — squad-level',
  'Vendor selection scored against your stack',
  'Baseline + monthly tracking + fee on verified cycle time reduction',
]

const STARTERS = [
  'Time to production is 16+ months. Engineers spend more time in meetings than building.',
  'We have 80 consultants on site. 70% of their time is onboarding, not building.',
  'We are spending $300M in engineering capital and shipping less than our competitors.',
]

const GENOME_FINDINGS = [
  { severity: 'critical' as const, title: '$94M AI committed — zero with delivery infrastructure',
    detail: '28 AI initiatives running. None have MLOps infrastructure. Models cannot reach production. Genome pattern F006 — 79% failure rate without deployment rails.',
    sources: ['Client data', 'Genome F006 · 79%'] },
  { severity: 'critical' as const, title: 'Technology spend 4.2% of revenue — 35% above peer median',
    detail: 'Arcturus spends more than peers on technology without proportional delivery output. The cost is high — the velocity is not matching it.',
    sources: ['Client financials', 'Industry benchmark'] },
]

const BORDER = '#1C2D45', CARD = '#0D1520', TEAL2 = '#2DD4C8', MUTED2 = '#94A3B8'
const MONO2 = 'JetBrains Mono, monospace'

export default function SolutionPDLC() {
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
    if (role === 'admin') { router.replace(`/engage/arcturus/pdlc`); return }
    if (cid) { router.replace(`/portal/pdlc`); return }
  }, [isLoaded, user, router])

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: SANS, color: WHITE }}>
      <AbarvaNav activePage="solutions" />
      {clientId && (
        <div style={{ background: `rgba(45,212,200,0.06)`, borderBottom: `1px solid rgba(45,212,200,0.2)` }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: TEAL2 }} />
              <span style={{ fontSize: '13px', color: WHITE }}>Your engagement is in progress</span>
              <span style={{ fontFamily: MONO2, fontSize: '10px', color: MUTED2 }}>· Phase 0 complete</span>
            </div>
            <a href={`/engage/${clientId}/pdlc`} style={{ background: TEAL2, color: BG, padding: '8px 18px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
              Continue →
            </a>
          </div>
        </div>
      )}
      <SolutionLayout
        num="1 of 3" name="AI-Powered PDLC"
        tagline="Cut time to production in half. AI agents alongside your engineering teams — not replacing them. Knowledge stays permanently."
        meta={['CIO', 'All verticals', '8–16 week delivery', 'Outcome-fee model']}
        stats={[
          { label: 'Avg time to production', value: '16mo', color: RED, sub: 'Enterprise median before AbarVa' },
          { label: 'After AbarVa', value: '8mo', color: TEAL, sub: '50% reduction — Genome-validated' },
          { label: 'Consulting reduction', value: '$18M', color: AMBER, sub: 'Avg annual per engagement' },
          { label: 'Knowledge retained', value: '100%', color: GREEN, sub: 'Stays inside the org permanently' },
        ]}
        phases={PHASES}
        genome={GENOME}
        deliverables={DELIVERABLES}
        starters={STARTERS}
        findings={GENOME_FINDINGS}
        followUpQ="What is the primary bottleneck — speed, quality, or cost?"
        followUpOpts={['Speed — time to production', 'Cost — consulting and engineering spend', 'Quality — rework and failures', 'All three — they compound']}
        input={input} setInput={setInput}
        step={step} setStep={setStep}
        selected={selected} setSelected={setSelected}
        launched={launched} setLaunched={setLaunched}
      />
    </div>
  )
}
