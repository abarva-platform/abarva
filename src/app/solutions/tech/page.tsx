'use client'
import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import AbarvaNav from '@/components/AbarvaNav'
import SolutionLayout from '@/components/SolutionLayout'
import { arcturusTechnology } from '@/data/arcturus/technology'

const BG = '#060A12', SANS = 'DM Sans, sans-serif', WHITE = '#EFF6FF'
const TEAL = '#2DD4C8', AMBER = '#F59E0B', GREEN = '#34D399', RED = '#EF4444'
const BORDER = '#1C2D45', MUTED = 'rgba(255,255,255,0.75)', MONO = 'JetBrains Mono, monospace'
const SURFACE = '#0D1520', INDIGO = '#818CF8'

const PHASE0_FINDINGS = [
  {
    severity: 'critical',
    code: null,
    title: 'SQL Server DW: EOL October 2025 — already passed. Running without security patches today.',
    desc: 'Microsoft ended support for SQL Server 2017 in October 2025. Every day this system runs is a security and regulatory risk. Azure SQL migration is a 4-month project at £1.2M. Non-negotiable regardless of Bloomberg AIM decision.',
    sources: ['ARC-C04'],
    action: 'Commission Azure SQL migration within 30 days'
  },
  {
    severity: 'critical',
    code: 'F002',
    title: '3 Bloomberg AIM modernisation failures. £32.6M spent. All failed for the same reason.',
    desc: 'No named executive sponsor who survived the programme duration. 2009, 2016, 2021. CDO currently vacant 11 months — same structural gap. Attempt 4 with the same governance structure will produce the same result.',
    sources: ['ARC-P04'],
    action: 'Name executive sponsor before scoping any modernisation approach'
  },
  {
    severity: 'high',
    code: 'F001',
    title: '6 of 14 Bloomberg customisations are portable. API wrapper approach has not been tried.',
    desc: 'AIM-C011, AIM-C013, AIM-C005, AIM-C008, AIM-C014 — internal-built or low-complexity. An API wrapper covering these 6 would reduce dependency without triggering the migration complexity that killed all 3 prior attempts.',
    sources: ['ARC-P04', 'ARC-T02'],
    action: 'Commission API wrapper feasibility study for the 6 portable customisations'
  },
]

const TRACKS = [
  {
    id: 'core_system',
    label: 'Core System Modernization',
    sub: 'Track 1',
    color: TEAL,
    desc: 'Which systems need replacing, wrapping, or optimising. Evidence-based. Vendor scored against your data. Programme governance.',
    relevant: true,
    relevance: 'Directly addresses Bloomberg AIM, SQL Server DW, Salesforce FSC'
  },
  {
    id: 'erp',
    label: 'ERP Selection & SI Governance',
    sub: 'Track 2',
    color: AMBER,
    desc: 'Product selection (SAP vs Oracle vs Workday). SI selection using Genome track record — not analyst rankings. Readiness assessment. Governance model.',
    relevant: false,
    relevance: 'Available if ERP modernisation is in scope'
  },
  {
    id: 'cloud_advisory',
    label: 'Cloud Architecture Advisory',
    sub: 'Track 3',
    color: INDIGO,
    desc: 'Architecture blueprint design for specific use cases. Vendor/SI selection. Governance of delivery against the blueprint. AbarVa designs and governs — does not build.',
    relevant: false,
    relevance: 'Available if cloud architecture decisions are in scope'
  },
  {
    id: 'all',
    label: 'All Three Tracks',
    sub: 'Comprehensive',
    color: GREEN,
    desc: 'Full technology modernisation assessment across all three tracks. Workstreams run in parallel.',
    relevant: false,
    relevance: 'Recommended if CIO wants a complete technology modernisation programme'
  },
]

export default function SolutionTech() {
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null)
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
    if (role === 'admin') { router.replace(`/engage/arcturus/tech`); return }
    if (cid) { router.replace(`/portal/tech`); return }
  }, [isLoaded, user, router])

  const cp = arcturusTechnology.corePlatform
  const age = cp.age
  const maint = cp.annualMaintenanceCost
  const att = cp.failedModernizations

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
    `Bloomberg AIM is ${age} years old. ${att} failed modernization attempts. £${maint}M annual maintenance.`,
    'SQL Server DW reached end-of-life. Running without security patches.',
    '14 data systems. No golden record. 3-day reporting lag. We compete on information advantage.',
  ]

  const findings = [
    { severity: 'critical' as const,
      title: `Bloomberg AIM — ${age} years old · £${maint}M maintenance · ${att} failed attempts`,
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

  // Logged-in view: Phase 0 findings + track selector
  if (clientId) {
    const severityColor = (s: string) => s === 'critical' ? RED : s === 'high' ? AMBER : MUTED

    return (
      <div style={{ minHeight: '100vh', background: BG, fontFamily: SANS, color: WHITE }}>
        <AbarvaNav activePage="solutions" />
        <div style={{ maxWidth: '960px', margin: '0 auto', padding: '96px 24px 80px' }}>

          {/* Header */}
          <div style={{ marginBottom: '40px' }}>
            <div style={{ fontFamily: MONO, fontSize: '10px', color: TEAL, letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: '10px' }}>
              Technology Intelligence · Arcturus Financial Group
            </div>
            <h1 style={{ fontFamily: SANS, fontSize: '32px', color: WHITE, margin: '0 0 12px', fontWeight: 700, lineHeight: 1.2 }}>
              Technology Modernization
            </h1>
            <p style={{ fontFamily: SANS, fontSize: '15px', color: MUTED, margin: 0, lineHeight: 1.6 }}>
              AbarVa has analysed your technology datasets. Three findings require immediate attention.
            </p>
          </div>

          {/* Phase 0 Findings */}
          <div style={{ marginBottom: '40px' }}>
            <div style={{ fontFamily: MONO, fontSize: '9px', color: MUTED, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: '14px' }}>
              Phase 0 — Technology Readiness Assessment · Score 34/100 · Partial
            </div>
            {PHASE0_FINDINGS.map((f, i) => {
              const c = severityColor(f.severity)
              return (
                <div key={i} style={{
                  background: SURFACE,
                  border: `1px solid ${c}25`,
                  borderLeft: `3px solid ${c}`,
                  borderRadius: '10px', padding: '20px', marginBottom: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: MONO, fontSize: '9px', color: c, background: `${c}15`, borderRadius: '3px', padding: '2px 6px', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                          {f.severity}
                        </span>
                        {f.code && (
                          <span style={{ fontFamily: MONO, fontSize: '9px', color: RED, background: 'rgba(239,68,68,0.10)', borderRadius: '3px', padding: '2px 6px' }}>
                            {f.code}
                          </span>
                        )}
                        {f.sources.map(s => (
                          <span key={s} style={{ fontFamily: MONO, fontSize: '9px', color: TEAL, background: 'rgba(45,212,200,0.08)', borderRadius: '3px', padding: '2px 6px' }}>
                            {s}
                          </span>
                        ))}
                      </div>
                      <div style={{ fontFamily: SANS, fontSize: '14px', color: WHITE, fontWeight: 600, marginBottom: '6px', lineHeight: 1.4 }}>
                        {f.title}
                      </div>
                      <div style={{ fontFamily: SANS, fontSize: '13px', color: MUTED, lineHeight: 1.6 }}>
                        {f.desc}
                      </div>
                    </div>
                  </div>
                  {f.action && (
                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: `1px solid ${BORDER}`, fontFamily: MONO, fontSize: '10px', color: c }}>
                      → {f.action}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Track Selector */}
          <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '28px' }}>
            <div style={{ fontFamily: MONO, fontSize: '9px', color: MUTED, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: '8px' }}>
              Select Your Track
            </div>
            <p style={{ fontFamily: SANS, fontSize: '14px', color: MUTED, margin: '0 0 20px', lineHeight: 1.6 }}>
              Technology Modernization operates across three tracks. Select one or all three.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '16px' }}>
              {TRACKS.map(track => (
                <button
                  key={track.id}
                  onClick={() => setSelectedTrack(selectedTrack === track.id ? null : track.id)}
                  style={{
                    background: selectedTrack === track.id ? `${track.color}10` : BG,
                    border: `1px solid ${selectedTrack === track.id ? track.color : BORDER}`,
                    borderRadius: '8px', padding: '16px', textAlign: 'left', cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <div style={{ fontFamily: MONO, fontSize: '9px', color: track.color, textTransform: 'uppercase', letterSpacing: '.1em' }}>
                      {track.sub}
                    </div>
                    {track.relevant && (
                      <span style={{ fontFamily: MONO, fontSize: '8px', color: TEAL, background: 'rgba(45,212,200,0.1)', borderRadius: '3px', padding: '1px 5px', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                        Recommended
                      </span>
                    )}
                  </div>
                  <div style={{ fontFamily: SANS, fontSize: '13px', color: selectedTrack === track.id ? track.color : WHITE, fontWeight: 600, marginBottom: '4px' }}>
                    {track.label}
                  </div>
                  <div style={{ fontFamily: SANS, fontSize: '12px', color: MUTED, lineHeight: 1.5, marginBottom: '6px' }}>
                    {track.desc}
                  </div>
                  <div style={{ fontFamily: MONO, fontSize: '9px', color: track.relevant ? TEAL : MUTED, letterSpacing: '.04em' }}>
                    {track.relevance}
                  </div>
                </button>
              ))}
            </div>
            {selectedTrack && (
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <a
                  href={`/engage/${clientId}/tech`}
                  style={{
                    background: TEAL, color: BG, borderRadius: '8px',
                    padding: '12px 28px', fontFamily: MONO, fontSize: '11px', fontWeight: 700,
                    letterSpacing: '.08em', textTransform: 'uppercase', textDecoration: 'none',
                    display: 'inline-block'
                  }}
                >
                  Begin Tech Modernization →
                </a>
              </div>
            )}
          </div>

          {/* Genome patterns */}
          <div style={{ marginTop: '40px', borderTop: `1px solid ${BORDER}`, paddingTop: '32px' }}>
            <div style={{ fontFamily: MONO, fontSize: '9px', color: MUTED, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: '16px' }}>
              Confirmed Genome Patterns — Arcturus
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {[
                { code: 'F001', rate: '72%', name: 'Vendor dependency without internal capability', status: 'confirmed' },
                { code: 'F002', rate: '84%', name: 'No named executive sponsor', status: 'confirmed' },
                { code: 'F003', rate: '68%', name: 'Data readiness below threshold', status: 'confirmed' },
              ].map(g => (
                <div key={g.code} style={{ background: SURFACE, border: `1px solid rgba(239,68,68,0.2)`, borderRadius: '8px', padding: '14px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontFamily: MONO, fontSize: '11px', color: RED, fontWeight: 700 }}>{g.code}</span>
                    <span style={{ fontFamily: MONO, fontSize: '9px', color: RED, background: 'rgba(239,68,68,0.1)', borderRadius: '3px', padding: '1px 5px', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                      {g.status}
                    </span>
                  </div>
                  <div style={{ fontFamily: MONO, fontSize: '18px', color: RED, fontWeight: 700, marginBottom: '4px' }}>{g.rate}</div>
                  <div style={{ fontFamily: SANS, fontSize: '12px', color: MUTED, lineHeight: 1.5 }}>{g.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Not-logged-in: marketing view
  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: SANS, color: WHITE }}>
      <AbarvaNav activePage="solutions" />
      <SolutionLayout
        num="3 of 3" name="Technology Modernization"
        tagline="Core systems going end-of-life. Three failed modernization attempts. The business case won't get approved. AbarVa diagnoses which systems actually need replacing, builds the case the CFO will approve, and governs the delivery."
        meta={['CIO · CFO', 'All verticals', 'SAP · FIS · Bloomberg AIM · Epic', 'Outcome-fee model']}
        stats={[
          { label: 'Average ERP overrun', value: '34%', color: RED, sub: 'Genome validated — not vendor estimate' },
          { label: 'Failed migrations cost', value: '£32M', color: AMBER, sub: '3 attempts, same root cause' },
          { label: 'Systems at EOL today', value: '42%', color: TEAL, sub: 'Of enterprise systems Genome-tracked' },
          { label: 'SI selection wrong', value: '68%', color: GREEN, sub: 'When based on analyst rankings alone' },
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
        poweredBy={['Situation Intelligence', 'Technology Intelligence', 'Vendor Intelligence']}
      />

      {/* Powered by */}
      <div style={{ background: '#08101C', borderTop: `1px solid ${BORDER}`, padding: '40px 32px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' as const }}>
            <div style={{ fontFamily: MONO, fontSize: '9px', color: MUTED, letterSpacing: '.12em', textTransform: 'uppercase' as const, flexShrink: 0 }}>
              Powered by
            </div>
            {[
              { name: 'Situation Intelligence', path: '/diagnose' },
              { name: 'Technology Intelligence', path: '/intelligence' },
              { name: 'Vendor Intelligence', path: '/vendor-intelligence' },
              { name: 'Architecture Intelligence', path: '/architecture' },
              { name: 'Business Case Intelligence', path: '/justify' },
            ].map(m => (
              <a key={m.name} href={m.path} style={{
                fontFamily: MONO, fontSize: '10px', color: TEAL,
                background: 'rgba(45,212,200,0.07)', border: '1px solid rgba(45,212,200,0.2)',
                borderRadius: '4px', padding: '4px 10px', textDecoration: 'none',
              }}>
                {m.name}
              </a>
            ))}
            <div style={{ marginLeft: 'auto' }}>
              <a href="/ai-strategy" style={{ fontSize: '12px', color: MUTED, textDecoration: 'none' }}>
                Full AI Strategy engagement →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
