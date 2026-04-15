'use client'
import { useState } from 'react'
import AbarvaNav from '@/components/AbarvaNav'
import SolutionLayout from '@/components/SolutionLayout'
import { arcturusTechnology } from '@/data/arcturus/technology'

const BG = '#060A12', SANS = 'DM Sans, sans-serif', WHITE = '#EFF6FF'
const TEAL = '#2DD4C8', AMBER = '#F59E0B', GREEN = '#34D399', RED = '#EF4444'

export default function SolutionTech() {
  const [input, setInput] = useState('')
  const [step, setStep] = useState(0)
  const [selected, setSelected] = useState('')
  const [launched, setLaunched] = useState(false)

  const cp = arcturusTechnology.corePlatform
  const platformName = cp.name                   // 'Bloomberg AIM'
  const age = cp.age                              // 28
  const maint = cp.annualMaintenanceCost          // 42
  const att = cp.failedModernizations             // 3

  const phases = [
    { num: 1, color: TEAL, title: 'Diagnose — which systems actually need replacing',
      desc: 'Not everything needs modernizing. AbarVa maps every core system: actual vs perceived technical debt, true cost to maintain vs replace, what the business cannot do because of the system.',
      products: ['Situation', 'Data Intelligence'] },
    { num: 2, color: AMBER, title: 'Build the case the CFO will approve',
      desc: `Three previous attempts failed because the business case was built by the vendor. AbarVa builds it from the client's data with Genome patterns from prior modernizations at peer organisations.`,
      products: ['Strategy', 'Vendor', 'Business Case'] },
    { num: 3, color: GREEN, title: 'Govern the delivery — Maestros embedded',
      desc: 'Maestros govern the implementation. They hold the vendor accountable to the business case. Fee on verified maintenance cost reduction and milestone delivery.',
      products: ['Outcomes'] },
  ]

  const genome = [
    { rate: '72%', name: 'Vendor dependency without internal capability', sub: 'Cannot verify delivery or recover if vendor fails' },
    { rate: '68%', name: 'Data readiness below threshold', sub: 'Migration starts before data is clean — doubles cost' },
    { rate: '84%', name: 'No named executive sponsor', sub: 'Programme drifts without C-suite owner — vendor fills vacuum' },
  ]

  const deliverables = [
    'System-by-system modernization assessment',
    'Vendor scored against your data — not analyst opinion',
    'CFO-ready business case with Genome-validated ranges',
    'Delivery governance · milestone tracking · fee on maintenance cost reduction',
  ]

  const starters = [
    `${platformName} is ${age} years old. ${att} failed modernization attempts. $${maint}M annual maintenance.`,
    'Aladdin Risk only covers liquid assets. Regulator wants daily stress testing. We run monthly.',
    '14 data systems. No golden record. 3-day reporting lag. We compete on information advantage.',
  ]

  const findings = [
    { severity: 'critical' as const,
      title: `${platformName} — ${age} years old · $${maint}M maintenance · ${att} failed attempts`,
      detail: 'The business case was built by the vendor each time. When the client builds it from their own data — success rate is 71%. Vendor-built: 23%.',
      sources: ['Client technology', 'Genome (11 cases)'] },
    { severity: 'critical' as const,
      title: '14 data systems — no golden record — 3-day reporting lag',
      detail: 'Any OMS modernization fails if the data architecture problem is not solved first. Genome F003 — data readiness — present in 68% of failed modernizations.',
      sources: ['Client technology', 'Genome F003 · 68%'] },
    { severity: 'warning' as const,
      title: 'Aladdin Risk — alternatives not in real-time risk · regulator wants daily by 2026',
      detail: 'This creates a compliance deadline that changes the CFO calculation entirely — the cost of NOT modernizing becomes visible.',
      sources: ['Client technology', 'Regulatory deadline'] },
  ]

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: SANS, color: WHITE }}>
      <AbarvaNav activePage="solutions" />
      <SolutionLayout
        num="3 of 3" name="Technology Modernization"
        tagline="Core systems going end-of-life. Three failed modernization attempts. The business case won't get approved. AbarVa diagnoses which systems actually need replacing, builds the case the CFO will approve, and governs the delivery."
        meta={['CIO · CFO', 'All verticals', 'SAP · FIS · Bloomberg AIM · Epic', 'Outcome-fee model']}
        stats={[
          { label: 'Bloomberg AIM age', value: `${age}yr`, color: RED, sub: `$${maint}M annual maintenance` },
          { label: 'Failed attempts', value: `${att}`, color: AMBER, sub: 'Each built by the vendor — failed' },
          { label: 'Success rate', value: '71%', color: TEAL, sub: 'When client builds the business case' },
          { label: 'Maintenance recovered', value: `$${maint}M`, color: GREEN, sub: 'Annual once migration complete' },
        ]}
        phases={phases}
        genome={genome}
        deliverables={deliverables}
        starters={starters}
        findings={findings}
        followUpQ="What has stopped the CFO from approving this before?"
        followUpOpts={[
          'Business case built by the vendor — not trusted',
          'Risk too high — too many unknowns',
          'Cost too high relative to perceived benefit',
          'No named executive to own the programme',
        ]}
        input={input} setInput={setInput}
        step={step} setStep={setStep}
        selected={selected} setSelected={setSelected}
        launched={launched} setLaunched={setLaunched}
      />
    </div>
  )
}
