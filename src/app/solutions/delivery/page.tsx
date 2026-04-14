'use client'
import { useState } from 'react'
import AbarvaNav from '@/components/AbarvaNav'
import SolutionLayout from '@/components/SolutionLayout'

const BG = '#060A12', SANS = 'DM Sans, sans-serif', WHITE = '#EFF6FF'
const TEAL = '#2DD4C8', AMBER = '#F59E0B', GREEN = '#34D399', RED = '#EF4444'

const PHASES = [
  { num: 1, color: TEAL, title: 'Diagnose — what you are actually paying for',
    desc: 'AbarVa maps every consulting relationship: what is delivered vs promised, what knowledge stays vs leaves, what is rebuilt engagement after engagement.',
    products: ['Situation'] },
  { num: 2, color: AMBER, title: 'Prescribe — the Maestro model',
    desc: 'Define which consulting relationships to replace, what the Maestro team does instead, how knowledge is captured, and the board-level business case with CFO-grade ROI.',
    products: ['Strategy', 'Business Case'] },
  { num: 3, color: GREEN, title: 'Execute — Maestros embed, consulting spend drops',
    desc: 'Maestros replace the consulting engagement. Fee on verified reduction in consulting spend and verified outcomes delivered.',
    products: ['Vendor', 'Outcomes'] },
]

const GENOME = [
  { rate: '84%', name: 'No named executive sponsor', sub: 'Transformation stalls without C-suite ownership' },
  { rate: '76%', name: 'Pilot purgatory', sub: 'Prior failed engagements create credibility deficit' },
  { rate: '61%', name: 'Change management gap', sub: 'Technology delivered — adoption fails' },
]

const DELIVERABLES = [
  'Consulting relationship audit — value vs cost mapped',
  'Maestro team design — roles, scope, knowledge model',
  'Transition plan — from consulting to Maestros',
  'Fee on verified consulting spend reduction',
]

const STARTERS = [
  '80 consultants on site. 70% of their time is getting up to speed. Knowledge walks out every Friday.',
  'We are spending $42M on consulting annually and cannot point to what has permanently changed.',
  'Every transformation programme ends and we start the next one from scratch.',
]

const GENOME_FINDINGS = [
  { severity: 'critical' as const, title: '$42M consulting spend — no documented knowledge transfer',
    detail: 'Arcturus spends $42M annually on consulting. No knowledge management. Each engagement restarts from baseline.',
    sources: ['Client financials', 'Genome F001 · 72%'] },
  { severity: 'critical' as const, title: 'CDO vacant 11 months — no executive to own transformation',
    detail: 'Every programme needs a named C-suite owner. Without one, consulting engagements drift without accountability.',
    sources: ['Client leadership', 'Genome F002 · 84%'] },
]

export default function SolutionDelivery() {
  const [input, setInput] = useState('')
  const [step, setStep] = useState(0)
  const [selected, setSelected] = useState('')
  const [launched, setLaunched] = useState(false)

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: SANS, color: WHITE }}>
      <AbarvaNav activePage="solutions" />
      <SolutionLayout
        num="2 of 4" name="AI-Powered Transformation Delivery"
        tagline="Replace 40 consultants with 4 Maestros. Knowledge stays permanently. The engagement ends; the intelligence does not."
        meta={['CIO · CTO', 'All verticals', 'Full engagement lifecycle', 'Outcome-fee model']}
        stats={[
          { label: 'Typical consulting team', value: '40', color: RED, sub: 'People — 70% time onboarding' },
          { label: 'AbarVa Maestro team', value: '4', color: TEAL, sub: 'Embedded — knowledge stays permanently' },
          { label: 'Knowledge lost (consulting)', value: '100%', color: AMBER, sub: 'Exits with the team every Friday' },
          { label: 'Consulting avoided', value: '$42M', color: GREEN, sub: 'Avg annual spend replaced (Arcturus)' },
        ]}
        phases={PHASES}
        genome={GENOME}
        deliverables={DELIVERABLES}
        starters={STARTERS}
        findings={GENOME_FINDINGS}
        followUpQ="What is the primary goal — reduce cost, improve outcome quality, or retain knowledge?"
        followUpOpts={['Reduce consulting cost', 'Improve delivery quality and speed', 'Retain knowledge permanently', 'All three — they are connected']}
        input={input} setInput={setInput}
        step={step} setStep={setStep}
        selected={selected} setSelected={setSelected}
        launched={launched} setLaunched={setLaunched}
      />
    </div>
  )
}
