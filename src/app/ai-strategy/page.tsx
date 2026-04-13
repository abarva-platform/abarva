'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import AbarvaNav from '@/components/AbarvaNav'
import EngagementProgress from '@/components/EngagementProgress'
import { meridianAI } from '@/data/meridian/ai'
import { firstCapitalAI } from '@/data/firstcapital/ai'
import { apexRetailAI } from '@/data/apexretail/ai'
import type { FailureAnalysis, InitiativeRisk } from '@/lib/intelligence/types'

const S = {
  page: { minHeight: '100vh', background: '#F8FAFC', fontFamily: 'Inter, -apple-system, sans-serif' } as React.CSSProperties,
  card: { background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '24px' } as React.CSSProperties,
  label: { fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '12px' } as React.CSSProperties,
}

const STEPS = [
  { id: 1, name: 'Ground Truth' },
  { id: 2, name: 'Executives Disagree' },
  { id: 3, name: 'Every Bet' },
  { id: 4, name: 'Your Three Bets' },
  { id: 5, name: 'Wave 1 Plan' },
  { id: 6, name: 'What We Need' },
  { id: 7, name: 'Business Case' },
  { id: 8, name: 'Board Deck Ready' },
]

type PlatformChoice = 'agnostic' | 'azure' | 'aws' | 'google'
type ScopeChoice = 'enterprise' | 'domain' | 'hybrid'

const PLATFORM_LABELS: Record<PlatformChoice, string> = {
  agnostic: 'Platform Agnostic',
  azure: 'Azure + OpenAI',
  aws: 'AWS + Claude',
  google: 'Google + Gemini',
}

const SCOPE_LABELS: Record<ScopeChoice, { label: string; desc: string; rec: boolean }> = {
  enterprise: { label: 'Enterprise-wide', desc: 'All functions. Highest value, highest complexity.', rec: false },
  hybrid: { label: 'Hybrid (recommended)', desc: 'Start in one domain, design for enterprise rollout.', rec: true },
  domain: { label: 'Single Domain', desc: 'One function. Fast ROI, lower risk.', rec: false },
}

function Gauge({ label, score }: { label: string, score: number }) {
  const c = score >= 60 ? '#059669' : score >= 40 ? '#D97706' : '#DC2626'
  const circ = 2 * Math.PI * 40
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ position: 'relative', width: '100px', height: '100px', margin: '0 auto 8px' }}>
        <svg viewBox="0 0 100 100" style={{ width: '100px', height: '100px', transform: 'rotate(-90deg)' }}>
          <circle cx="50" cy="50" r="40" fill="none" stroke="#F1F5F9" strokeWidth="10" />
          <circle cx="50" cy="50" r="40" fill="none" stroke={c} strokeWidth="10"
            strokeDasharray={((score / 100) * circ) + ' ' + circ} strokeLinecap="round" />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '22px', fontWeight: 700, color: c }}>{score}</span>
          <span style={{ fontSize: '10px', color: '#94A3B8' }}>/100</span>
        </div>
      </div>
      <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>{label}</div>
      <div style={{ fontSize: '11px', color: c, fontWeight: 500 }}>{score >= 60 ? 'Ready' : score >= 40 ? 'Partial' : 'Not Ready'}</div>
    </div>
  )
}

function AIStrategyContent() {
  const searchParams = useSearchParams()
  const clientId = searchParams.get('client') || 'meridian'
  const [step, setStep] = useState(1)
  const [scopeChosen, setScopeChosen] = useState(false)
  const [scope, setScope] = useState<ScopeChoice>('hybrid')
  const [platform, setPlatform] = useState<PlatformChoice>('agnostic')
  const [activeClient, setActiveClient] = useState(clientId)
  const [oppTab, setOppTab] = useState<'front' | 'middle' | 'back'>('front')
  const [priority, setPriority] = useState<'revenue' | 'cost' | 'risk'>('revenue')
  const [budget, setBudget] = useState<'conservative' | 'moderate' | 'aggressive'>('moderate')
  const [riskMap, setRiskMap] = useState<Record<string, InitiativeRisk>>({})
  const [riskNarrative, setRiskNarrative] = useState<string | null>(null)
  const [loadingRisk, setLoadingRisk] = useState(false)

  // Reset risk data when client changes
  useEffect(() => {
    setRiskMap({})
    setRiskNarrative(null)
  }, [activeClient])

  useEffect(() => {
    if (step !== 3) return
    if (Object.keys(riskMap).length > 0) return // already loaded for this client
    setLoadingRisk(true)
    fetch('/api/intelligence/failures', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client: activeClient }),
    })
      .then(r => r.json())
      .then((data: FailureAnalysis) => {
        const map: Record<string, InitiativeRisk> = {}
        data.risks.forEach(r => { map[r.initiativeId] = r })
        setRiskMap(map)
        setRiskNarrative(data.narrative)
        setLoadingRisk(false)
      })
      .catch(() => setLoadingRisk(false))
  }, [step, activeClient])

  const clientName = activeClient === 'firstcapital' ? 'First Capital Financial' : activeClient === 'apexretail' ? 'Apex Retail Group' : 'Meridian Health System'
  const clientIndustry = activeClient === 'firstcapital' ? 'Financial Services' : activeClient === 'apexretail' ? 'Retail' : 'Healthcare'
  const ai = activeClient === 'firstcapital' ? firstCapitalAI : activeClient === 'apexretail' ? apexRetailAI : meridianAI
  const accents: Record<string, string> = { front: '#2563EB', middle: '#7C3AED', back: '#059669' }

  function getAllOpps() {
    const all = [
      ...ai.opportunities.frontOffice.map((o: any) => ({ ...o, domain: 'front' })),
      ...ai.opportunities.middleOffice.map((o: any) => ({ ...o, domain: 'middle' })),
      ...ai.opportunities.backOffice.map((o: any) => ({ ...o, domain: 'back' })),
    ]
    if (priority === 'cost') return all.sort((a: any, b: any) => (b.roi || 0) - (a.roi || 0))
    if (priority === 'revenue') return all.sort((a: any, b: any) => (b.annualValue || 0) - (a.annualValue || 0))
    return all.sort((a: any, b: any) => (b.dataReadinessPct || 0) - (a.dataReadinessPct || 0))
  }

  const maxOpps = budget === 'conservative' ? 6 : budget === 'moderate' ? 10 : 15
  const currentOpps = oppTab === 'front' ? ai.opportunities.frontOffice : oppTab === 'middle' ? ai.opportunities.middleOffice : ai.opportunities.backOffice

  const Breadcrumb = () => (
    <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E2E8F0', padding: '0 32px', height: '40px', display: 'flex', alignItems: 'center', gap: '8px' }}>
      <a href="/" style={{ fontSize: '13px', color: '#6B7280', textDecoration: 'none' }}>Home</a>
      <span style={{ color: '#D1D5DB' }}>›</span>
      <span style={{ fontSize: '13px', color: '#0F172A', fontWeight: 500 }}>AI Strategy</span>
      <span style={{ color: '#D1D5DB' }}>›</span>
      <span style={{ fontSize: '13px', color: '#6B7280' }}>{clientName} · {clientIndustry}</span>
    </div>
  )

  const StepNav = () => (
    <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E2E8F0', padding: '0 32px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex' }}>
        {STEPS.map(s => (
          <button key={s.id} onClick={() => setStep(s.id)}
            style={{ padding: '12px 20px', fontSize: '13px', fontWeight: step === s.id ? 600 : 400, color: step === s.id ? '#7C3AED' : step > s.id ? '#059669' : '#94A3B8', background: 'none', border: 'none', cursor: 'pointer', borderBottom: step === s.id ? '2px solid #7C3AED' : '2px solid transparent', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '20px', height: '20px', borderRadius: '50%', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', background: step === s.id ? '#7C3AED' : step > s.id ? '#059669' : '#F1F5F9', color: step === s.id || step > s.id ? 'white' : '#94A3B8' }}>
              {step > s.id ? '✓' : s.id}
            </span>
            {s.name}
          </button>
        ))}
      </div>
    </div>
  )

  const NavBtns = ({ prev, next, nextLabel = 'Next →' }: { prev?: number, next?: number, nextLabel?: string }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
      {prev ? <button onClick={() => setStep(prev)} style={{ padding: '12px 24px', borderRadius: '10px', background: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>← Back</button> : <div />}
      {next && <button onClick={() => setStep(next)} style={{ padding: '12px 32px', borderRadius: '10px', background: '#7C3AED', color: 'white', border: 'none', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>{nextLabel}</button>}
    </div>
  )

  // Scope selector — shown before step 1 on first visit
  const ScopeSelector = () => (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '24px' }}>
      <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '40px', maxWidth: '600px', width: '100%' }}>
        <div style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>What is the scope of this AI strategy?</div>
        <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '28px' }}>This shapes how opportunities are prioritized and sequenced.</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
          {(Object.entries(SCOPE_LABELS) as [ScopeChoice, typeof SCOPE_LABELS[ScopeChoice]][]).map(([key, val]) => (
            <button key={key} onClick={() => setScope(key)}
              style={{ padding: '14px 16px', background: scope === key ? '#F5F3FF' : '#F8FAFC', border: '2px solid ' + (scope === key ? '#7C3AED' : '#E2E8F0'), borderRadius: '10px', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid ' + (scope === key ? '#7C3AED' : '#CBD5E0'), background: scope === key ? '#7C3AED' : 'transparent', marginTop: '2px', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', marginBottom: '2px' }}>
                  {val.label}
                  {val.rec && <span style={{ marginLeft: '8px', fontSize: '10px', fontWeight: 700, background: '#7C3AED', color: 'white', borderRadius: '4px', padding: '1px 6px' }}>RECOMMENDED</span>}
                </div>
                <div style={{ fontSize: '12px', color: '#6B7280' }}>{val.desc}</div>
              </div>
            </button>
          ))}
        </div>
        {scope === 'domain' || scope === 'hybrid' ? (
          <div style={{ marginBottom: '20px', padding: '12px 14px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Select starting domain</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {['Revenue Cycle', 'Finance', 'Operations', 'Clinical', 'Technology', 'Supply Chain', 'Customer'].map(d => (
                <span key={d} style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, background: '#E2E8F0', color: '#475569', cursor: 'pointer' }}>{d}</span>
              ))}
            </div>
          </div>
        ) : null}
        <button onClick={() => setScopeChosen(true)}
          style={{ width: '100%', padding: '14px', background: '#7C3AED', color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: 700, cursor: 'pointer' }}>
          Build AI Strategy — {SCOPE_LABELS[scope].label} →
        </button>
      </div>
    </div>
  )

  return (
    <div style={S.page}>
      {!scopeChosen && <ScopeSelector />}
      <AbarvaNav clientId={activeClient} onClientChange={id => { setActiveClient(id); setStep(1); setScopeChosen(false) }} activePage="ai-strategy" />
      <EngagementProgress />
      <Breadcrumb />
      {scopeChosen && (
        <div style={{ background: '#F5F3FF', borderBottom: '1px solid #DDD6FE', padding: '6px 32px', fontSize: '12px', color: '#7C3AED', fontWeight: 600 }}>
          📍 Scope: {SCOPE_LABELS[scope].label} | {clientName} | Step {step} of 8
        </div>
      )}
      {/* Journey */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #F3F4F6', padding: '0 32px', display: 'flex', alignItems: 'center', gap: '0', height: '36px', overflowX: 'auto' as const }}>
        {[
          { label: 'Diagnose', href: '/diagnose?client=' + activeClient, active: false },
          { label: 'AI Strategy', href: '/ai-strategy?client=' + activeClient, active: true },
          { label: 'Justify', href: '/justify?client=' + activeClient, active: false },
          { label: 'Select', href: '/select?client=' + activeClient, active: false },
          { label: 'Blueprint', href: '/blueprint?client=' + activeClient, active: false },
        ].map((step, i) => (
          <a key={i} href={step.href} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 12px', height: '36px', fontSize: '11px', fontWeight: step.active ? 700 : 500, color: step.active ? '#1B4FD8' : '#9CA3AF', textDecoration: 'none', borderBottom: step.active ? '2px solid #1B4FD8' : '2px solid transparent', whiteSpace: 'nowrap' as const, boxSizing: 'border-box' as const }}>
            {step.active && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#1B4FD8', display: 'block' }} />}
            {step.label}
          </a>
        ))}
      </div>
      <StepNav />
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px' }}>

        {step === 1 && (
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Current State Assessment</h1>
            <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>AI readiness from loaded client data</p>
            <div style={{ ...S.card, marginBottom: '24px' }}>
              <div style={S.label}>AI READINESS SCORES</div>
              <div style={{ display: 'flex', justifyContent: 'space-around', padding: '16px 0' }}>
                <Gauge label="Data Readiness" score={ai.maturity.dataReadiness.overall} />
                <Gauge label="Tech Readiness" score={ai.maturity.techReadiness.overall} />
                <Gauge label="Org Readiness" score={ai.maturity.orgReadiness.overall} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              {([
                { title: 'DATA READINESS', data: Object.entries(ai.maturity.dataReadiness).filter(([k]) => k !== 'overall') },
                { title: 'TECHNOLOGY READINESS', data: Object.entries(ai.maturity.techReadiness).filter(([k]) => k !== 'overall') },
                { title: 'ORG READINESS', data: Object.entries(ai.maturity.orgReadiness).filter(([k]) => k !== 'overall') },
              ] as Array<{title: string, data: [string, unknown][]}>).map((panel, pi) => (
                <div key={pi} style={S.card}>
                  <div style={S.label}>{panel.title}</div>
                  {panel.data.map(([key, val]) => {
                    const v = val as number
                    const c = v >= 70 ? '#059669' : v >= 40 ? '#D97706' : '#DC2626'
                    return (
                      <div key={key} style={{ marginBottom: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                          <span style={{ fontSize: '12px', color: '#475569', textTransform: 'capitalize' as const }}>{key.replace(/([A-Z])/g, ' $1')}</span>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: c }}>{v}%</span>
                        </div>
                        <div style={{ height: '4px', background: '#F1F5F9', borderRadius: '2px' }}>
                          <div style={{ height: '4px', borderRadius: '2px', width: v + '%', background: c }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
            <div style={{ ...S.card, marginBottom: '24px' }}>
              <div style={S.label}>CURRENT AI INITIATIVES</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
                {ai.maturity.currentInitiatives.map((init: any, i: number) => {
                  const bad = init.status.includes('Purgatory') || init.status.includes('Validated') || init.status.includes('BLOCKED')
                  return (
                    <div key={i} style={{ padding: '14px', borderRadius: '10px', background: bad ? '#FEF2F2' : '#F8FAFC', border: '1px solid ' + (bad ? '#FECACA' : '#E2E8F0') }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A', marginBottom: '4px' }}>{init.name}</div>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: bad ? '#DC2626' : '#D97706', marginBottom: '4px' }}>{init.status}</div>
                      <div style={{ fontSize: '11px', color: '#6B7280' }}>{init.scope} · {init.monthsStuck}mo stuck</div>
                    </div>
                  )
                })}
              </div>
              <div style={{ padding: '12px 16px', borderRadius: '10px', background: '#FEF2F2', border: '1px solid #FECACA' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#DC2626' }}>Pattern: {ai.maturity.pattern.replace(/_/g, ' ')} — </span>
                <span style={{ fontSize: '12px', color: '#374151' }}>{ai.maturity.patternDescription}</span>
              </div>
            </div>
            <NavBtns next={2} nextLabel="Next: Executive Disagreements →" />
          </div>
        )}

        {step === 2 && (
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Stakeholder Intelligence</h1>
            <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>Executive priorities and blockers from structured interviews</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '24px' }}>
              {Object.entries(ai.interviews).map(([role, exec]: [string, any]) => (
                <div key={role} style={S.card}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#7C3AED', textTransform: 'uppercase' as const, marginBottom: '2px' }}>{role.toUpperCase()}</div>
                      <div style={{ fontSize: '16px', fontWeight: 600, color: '#0F172A' }}>{exec.name}</div>
                      {exec.tenure && <div style={{ fontSize: '12px', color: '#6B7280' }}>{exec.tenure} tenure</div>}
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px', background: exec.changeReadiness === 'High' ? '#ECFDF5' : exec.changeReadiness === 'Medium' ? '#FFFBEB' : '#FEF2F2', color: exec.changeReadiness === 'High' ? '#059669' : exec.changeReadiness === 'Medium' ? '#D97706' : '#DC2626' }}>
                      {exec.changeReadiness} readiness
                    </span>
                  </div>
                  {[
                    { label: 'AI Priority', value: exec.aiPriority },
                    { label: 'Biggest Blocker', value: exec.biggestBlocker },
                    { label: 'Investment Appetite', value: exec.investmentAppetite },
                    { label: 'Success Metric', value: exec.successMetric },
                  ].map((item, i) => (
                    <div key={i} style={{ marginBottom: '8px' }}>
                      <div style={{ fontSize: '10px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' as const, marginBottom: '1px' }}>{item.label}</div>
                      <div style={{ fontSize: '12px', color: '#374151', lineHeight: 1.4 }}>{item.value}</div>
                    </div>
                  ))}
                  {exec.aiQuote && (
                    <div style={{ marginTop: '12px', padding: '10px 12px', borderLeft: '3px solid #7C3AED', background: '#F8FAFC', borderRadius: '0 6px 6px 0' }}>
                      <div style={{ fontSize: '12px', color: '#374151', fontStyle: 'italic' }}>"{exec.aiQuote}"</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div style={{ ...S.card, marginBottom: '24px', background: '#F0FDF4', border: '1px solid #A7F3D0' }}>
              <div style={S.label}>AbarVa SYNTHESIS AND RECOMMENDATION</div>
              <div style={{ fontSize: '13px', color: '#374151', lineHeight: 1.6, marginBottom: '12px' }}>{ai.changeReadiness.recommendation}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {ai.changeReadiness.riskFactors.slice(0, 3).map((r: string, i: number) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', padding: '6px 10px', background: '#FEF2F2', borderRadius: '6px' }}>
                    <span style={{ color: '#DC2626', flexShrink: 0 }}>⚠</span>
                    <span style={{ fontSize: '12px', color: '#374151' }}>{r}</span>
                  </div>
                ))}
              </div>
            </div>
            <NavBtns prev={1} next={3} nextLabel="Next: Every Bet Available →" />
          </div>
        )}

        {step === 3 && (
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>AI Opportunity Scan</h1>
            <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: activeClient === 'meridian' ? '16px' : '24px' }}>Every AI opportunity tied to actual client data</p>
            {activeClient === 'meridian' && (
              <div style={{ marginBottom: '24px', padding: '16px 20px', background: '#0F172A', borderRadius: '10px', border: '1px solid #1E293B' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#2DD4C8', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '8px' }}>
                  FAILURE GENOME ANALYSIS — TRANSFORMATION RISK
                </div>
                {loadingRisk && (
                  <div style={{ fontSize: '13px', color: '#94A3B8' }}>Scoring initiatives against 7 failure patterns...</div>
                )}
                {!loadingRisk && riskNarrative && (
                  <div style={{ fontSize: '13px', color: '#E2E8F0', lineHeight: 1.6 }}>{riskNarrative}</div>
                )}
                {!loadingRisk && !riskNarrative && (
                  <div style={{ fontSize: '13px', color: '#94A3B8' }}>Risk scoring unavailable</div>
                )}
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
              {[
                { label: 'Total Annual Value', value: '$' + (ai.roadmap.summary.totalAnnualValue / 1000000000).toFixed(2) + 'B', color: '#059669' },
                { label: 'Total Investment', value: '$' + (ai.roadmap.summary.totalInvestment / 1000000).toFixed(0) + 'M', color: '#2563EB' },
                { label: 'Blended ROI', value: ai.roadmap.summary.blendedROI + 'x', color: '#7C3AED' },
                { label: 'Payback Period', value: ai.roadmap.summary.paybackMonths + ' months', color: '#D97706' },
              ].map((m, i) => (
                <div key={i} style={S.card}>
                  <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '6px' }}>{m.label}</div>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: m.color }}>{m.value}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '0', marginBottom: '20px', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '4px', width: 'fit-content' }}>
              {([
                { id: 'front' as const, label: 'Front Office', count: ai.opportunities.frontOffice.length },
                { id: 'middle' as const, label: 'Middle Office', count: ai.opportunities.middleOffice.length },
                { id: 'back' as const, label: 'Back Office', count: ai.opportunities.backOffice.length },
              ]).map(tab => (
                <button key={tab.id} onClick={() => setOppTab(tab.id)}
                  style={{ padding: '8px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', border: 'none', background: oppTab === tab.id ? accents[tab.id] : 'transparent', color: oppTab === tab.id ? '#FFFFFF' : '#6B7280' }}>
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '24px' }}>
              {currentOpps.map((opp: any, i: number) => {
                const rc = opp.dataReadiness === 'green' ? '#059669' : opp.dataReadiness === 'yellow' ? '#D97706' : '#DC2626'
                const rb = opp.dataReadiness === 'green' ? '#ECFDF5' : opp.dataReadiness === 'yellow' ? '#FFFBEB' : '#FEF2F2'
                const wc = opp.wave === 1 ? '#059669' : opp.wave === 2 ? '#2563EB' : '#7C3AED'
                const wb = opp.wave === 1 ? '#ECFDF5' : opp.wave === 2 ? '#EFF6FF' : '#F5F3FF'
                const risk = riskMap[opp.id]
                const prob = risk?.successProbability
                const isBlocked = risk?.isBlocked
                const probColor = prob == null ? null : prob >= 60 ? '#059669' : prob >= 35 ? '#D97706' : '#DC2626'
                const probBg = prob == null ? null : prob >= 60 ? '#ECFDF5' : prob >= 35 ? '#FFFBEB' : '#FEF2F2'
                return (
                  <div key={i} style={{ ...S.card, padding: '16px', borderLeft: '3px solid ' + (isBlocked ? '#DC2626' : accents[oppTab]) }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A', flex: 1, paddingRight: '8px' }}>{opp.name}</div>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: '#059669', flexShrink: 0 }}>${(opp.annualValue / 1000000).toFixed(0)}M</div>
                    </div>
                    <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '10px', lineHeight: 1.4 }}>{opp.problem}</div>
                    {isBlocked && risk?.criticalBlocker && (
                      <div style={{ fontSize: '10px', color: '#DC2626', background: '#FEF2F2', padding: '4px 8px', borderRadius: '6px', marginBottom: '8px', fontWeight: 500 }}>
                        ⚠ {risk.criticalBlocker}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' as const }}>
                      <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '10px', background: rb, color: rc }}>Data: {opp.dataReadinessPct}%</span>
                      <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '10px', background: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0' }}>${(opp.investment / 1000000).toFixed(1)}M invest</span>
                      <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '10px', background: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0' }}>{opp.roi}x ROI</span>
                      <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '10px', background: wb, color: wc }}>Wave {opp.wave}</span>
                      {prob != null && (
                        <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px', background: probBg!, color: probColor! }}>{prob}% success</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            <div style={{ marginBottom: '16px' }}>
              <a href={'/domain-strategy?client=' + activeClient} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 18px', borderRadius: '8px', background: '#0F172A', color: '#2DD4C8', fontSize: '13px', fontWeight: 600, textDecoration: 'none', border: '1px solid #1E293B' }}>
                ◈ Go deeper on a domain →
              </a>
              <span style={{ marginLeft: '12px', fontSize: '12px', color: '#94A3B8' }}>Get a complete AI strategy for one business domain</span>
            </div>
            <NavBtns prev={2} next={4} nextLabel="Next: Your Three Bets →" />
          </div>
        )}

        {step === 4 && (
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Prioritization Matrix</h1>
            <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>Ranked by strategic priority and investment appetite</p>
            <div style={{ ...S.card, marginBottom: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div>
                  <div style={S.label}>STRATEGIC PRIORITY</div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {([{ id: 'revenue' as const, label: 'Revenue Growth' }, { id: 'cost' as const, label: 'Cost Reduction' }, { id: 'risk' as const, label: 'Risk Reduction' }]).map(p => (
                      <button key={p.id} onClick={() => setPriority(p.id)} style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', border: '1px solid #E2E8F0', background: priority === p.id ? '#7C3AED' : '#F8FAFC', color: priority === p.id ? '#FFFFFF' : '#475569' }}>{p.label}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={S.label}>INVESTMENT APPETITE</div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {([{ id: 'conservative' as const, label: '$5-20M' }, { id: 'moderate' as const, label: '$20-50M' }, { id: 'aggressive' as const, label: '$50M+' }]).map(b => (
                      <button key={b.id} onClick={() => setBudget(b.id)} style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', border: '1px solid #E2E8F0', background: budget === b.id ? '#2563EB' : '#F8FAFC', color: budget === b.id ? '#FFFFFF' : '#475569' }}>{b.label}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
              {getAllOpps().slice(0, maxOpps).map((opp: any, i: number) => {
                const dc: Record<string, string> = { front: '#2563EB', middle: '#7C3AED', back: '#059669' }
                const wColors = ['#059669', '#2563EB', '#7C3AED']
                const wBgs = ['#ECFDF5', '#EFF6FF', '#F5F3FF']
                const wIdx = (opp.wave || 1) - 1
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '14px 16px', background: '#FFFFFF', borderRadius: '10px', border: '1px solid #E2E8F0', borderLeft: '4px solid ' + (dc[opp.domain] || '#2563EB') }}>
                    <span style={{ fontSize: '20px', fontWeight: 700, color: '#94A3B8', width: '28px', textAlign: 'center', flexShrink: 0 }}>{i + 1}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A', marginBottom: '2px' }}>{opp.name}</div>
                      <div style={{ fontSize: '11px', color: '#6B7280' }}>{opp.aiApproach}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexShrink: 0 }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '16px', fontWeight: 700, color: '#059669' }}>${(opp.annualValue / 1000000).toFixed(0)}M</div>
                        <div style={{ fontSize: '10px', color: '#94A3B8' }}>annual value</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A' }}>{opp.roi}x</div>
                        <div style={{ fontSize: '10px', color: '#94A3B8' }}>ROI</div>
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px', background: wBgs[wIdx], color: wColors[wIdx] }}>Wave {opp.wave}</span>
                    </div>
                  </div>
                )
              })}
            </div>
            <div style={{ marginBottom: '16px', padding: '14px 16px', background: '#F5F3FF', border: '1px solid #DDD6FE', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#7C3AED', marginBottom: '2px' }}>Want to test different assumptions?</div>
                <div style={{ fontSize: '11px', color: '#6B7280' }}>Change investment, timeline, and targets — see how outcomes change in real time</div>
              </div>
              <a href={'/scenarios?client=' + activeClient} style={{ padding: '8px 18px', borderRadius: '8px', background: '#7C3AED', color: 'white', fontSize: '12px', fontWeight: 700, textDecoration: 'none', flexShrink: 0, marginLeft: '16px', whiteSpace: 'nowrap' as const }}>
                Model Different Scenarios →
              </a>
            </div>
            {/* Platform toggle */}
            <div style={{ ...S.card, marginBottom: '24px', border: '1px solid #DDD6FE', background: '#FAFAFF' }}>
              <div style={S.label}>PLATFORM ARCHITECTURE</div>
              <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '12px' }}>Select your cloud + AI platform or stay platform-agnostic to see technology-neutral recommendations.</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {(Object.entries(PLATFORM_LABELS) as [PlatformChoice, string][]).map(([key, label]) => (
                  <button key={key} onClick={() => setPlatform(key)}
                    style={{ padding: '8px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', border: '1px solid ' + (platform === key ? '#7C3AED' : '#E2E8F0'), background: platform === key ? '#7C3AED' : '#FFFFFF', color: platform === key ? '#FFFFFF' : '#475569' }}>
                    {key === 'aws' ? '★ ' : ''}{label}
                    {key === 'aws' && activeClient === 'meridian' && <span style={{ marginLeft: '6px', fontSize: '10px', background: '#ECFDF5', color: '#059669', borderRadius: '3px', padding: '1px 5px' }}>Best fit</span>}
                  </button>
                ))}
              </div>
              {platform !== 'agnostic' && (
                <div style={{ marginTop: '12px', padding: '10px 14px', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px', color: '#374151' }}>
                  {platform === 'aws' && '☁ AWS architecture: Amazon Bedrock (Claude 3.5) · Amazon HealthLake · SageMaker · Comprehend Medical · S3 Data Lake'}
                  {platform === 'azure' && '☁ Azure architecture: Azure OpenAI (GPT-4o) · Azure Health Data Services · Azure ML · Cognitive Services · ADLS Gen2'}
                  {platform === 'google' && '☁ Google architecture: Vertex AI (Gemini 1.5) · Healthcare Data Engine · BigQuery ML · Healthcare NLP API · Cloud Storage'}
                  <span style={{ marginLeft: '12px', color: '#7C3AED', fontWeight: 600 }}>Referral: AbarVa has a disclosed referral relationship with this platform provider.</span>
                </div>
              )}
            </div>
            <NavBtns prev={3} next={5} nextLabel="Next: Wave 1 Starts in 90 Days →" />
          </div>
        )}

        {step === 5 && (
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>18-Month AI Roadmap</h1>
            <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>Three waves sequenced by data readiness and strategic priority</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
              {[
                { label: 'Total Investment', value: '$' + (ai.roadmap.summary.totalInvestment / 1000000).toFixed(0) + 'M', color: '#2563EB' },
                { label: 'Annual Value', value: '$' + (ai.roadmap.summary.totalAnnualValue / 1000000000).toFixed(2) + 'B', color: '#059669' },
                { label: 'Blended ROI', value: ai.roadmap.summary.blendedROI + 'x', color: '#7C3AED' },
                { label: 'vs McKinsey', value: '$' + (ai.roadmap.summary.saving / 1000000).toFixed(1) + 'M saved', color: '#D97706' },
              ].map((m, i) => (
                <div key={i} style={S.card}>
                  <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '6px' }}>{m.label}</div>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: m.color }}>{m.value}</div>
                </div>
              ))}
            </div>
            {([
              { wave: ai.roadmap.wave1, num: 1, color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
              { wave: ai.roadmap.wave2, num: 2, color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
              { wave: ai.roadmap.wave3, num: 3, color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' },
            ] as Array<{wave: any, num: number, color: string, bg: string, border: string}>).map(({ wave, num, color, bg, border }) => {
              const allOpps = [...ai.opportunities.frontOffice, ...ai.opportunities.middleOffice, ...ai.opportunities.backOffice]
              const waveOpps = allOpps.filter((o: any) => wave.initiatives?.includes(o.id))
              return (
                <div key={num} style={{ ...S.card, marginBottom: '16px', border: '1px solid ' + border, background: bg }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 10px', borderRadius: '20px', background: color, color: 'white' }}>WAVE {num}</span>
                        <span style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>{wave.name}</span>
                        <span style={{ fontSize: '13px', color: '#6B7280' }}>Months {wave.months}</span>
                      </div>
                      {wave.tagline && <div style={{ fontSize: '13px', color: '#374151', fontStyle: 'italic' }}>{wave.tagline}</div>}
                      {wave.prerequisite && <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>Prerequisites: {wave.prerequisite}</div>}
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '18px', fontWeight: 700, color }}>${(wave.totalAnnualValue / 1000000).toFixed(0)}M <span style={{ fontSize: '12px', color: '#94A3B8' }}>annual value</span></div>
                      <div style={{ fontSize: '13px', color: '#6B7280' }}>${(wave.totalInvestment / 1000000).toFixed(0)}M invest · {wave.roi}x ROI</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '8px' }}>
                    {waveOpps.map((opp: any, i: number) => (
                      <div key={i} style={{ padding: '6px 12px', background: 'white', borderRadius: '6px', border: '1px solid ' + border }}>
                        <span style={{ fontSize: '12px', fontWeight: 500, color: '#0F172A' }}>{opp.name}</span>
                        <span style={{ fontSize: '11px', color, marginLeft: '8px', fontWeight: 600 }}>${(opp.annualValue / 1000000).toFixed(0)}M</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
            <NavBtns prev={4} next={6} nextLabel="Next: What We Need →" />
          </div>
        )}

        {step === 6 && (
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>What Do We Need</h1>
            <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>Skills gap, vendor recommendations, and platform requirements for your Wave 1 initiatives</p>

            {/* Skills gap */}
            <div style={{ ...S.card, marginBottom: '24px' }}>
              <div style={S.label}>SKILLS GAP ANALYSIS</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                {(activeClient === 'firstcapital' ? [
                  { skill: 'ML Engineering', current: 3, needed: 9, gap: 6, urgency: 'high' },
                  { skill: 'Data Engineering', current: 4, needed: 10, gap: 6, urgency: 'high' },
                  { skill: 'AI Risk & Compliance', current: 1, needed: 4, gap: 3, urgency: 'high' },
                  { skill: 'Fraud AI Specialist', current: 2, needed: 5, gap: 3, urgency: 'medium' },
                  { skill: 'MLOps', current: 0, needed: 2, gap: 2, urgency: 'medium' },
                  { skill: 'FinTech AI Product Management', current: 0, needed: 2, gap: 2, urgency: 'medium' },
                ] : activeClient === 'apexretail' ? [
                  { skill: 'ML Engineering', current: 2, needed: 7, gap: 5, urgency: 'high' },
                  { skill: 'Data Engineering', current: 3, needed: 10, gap: 7, urgency: 'high' },
                  { skill: 'Personalization AI', current: 1, needed: 4, gap: 3, urgency: 'high' },
                  { skill: 'Demand Forecasting', current: 2, needed: 5, gap: 3, urgency: 'medium' },
                  { skill: 'MLOps', current: 0, needed: 2, gap: 2, urgency: 'medium' },
                  { skill: 'Retail AI Product Management', current: 0, needed: 2, gap: 2, urgency: 'medium' },
                ] : [
                  { skill: 'ML Engineering', current: 2, needed: 8, gap: 6, urgency: 'high' },
                  { skill: 'Data Engineering', current: 5, needed: 12, gap: 7, urgency: 'high' },
                  { skill: 'AI Product Management', current: 0, needed: 3, gap: 3, urgency: 'high' },
                  { skill: 'Prompt Engineering', current: 1, needed: 4, gap: 3, urgency: 'medium' },
                  { skill: 'MLOps', current: 0, needed: 2, gap: 2, urgency: 'medium' },
                  { skill: 'Healthcare AI Compliance', current: 0, needed: 1, gap: 1, urgency: 'medium' },
                ]).map((s, i) => (
                  <div key={i} style={{ padding: '14px', borderRadius: '10px', background: s.urgency === 'high' ? '#FEF2F2' : '#FFFBEB', border: '1px solid ' + (s.urgency === 'high' ? '#FECACA' : '#FDE68A') }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', marginBottom: '8px' }}>{s.skill}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#6B7280', marginBottom: '4px' }}>
                      <span>Current: {s.current}</span><span>Needed: {s.needed}</span>
                    </div>
                    <div style={{ height: '6px', background: '#E2E8F0', borderRadius: '3px' }}>
                      <div style={{ height: '6px', borderRadius: '3px', width: (s.current / s.needed * 100) + '%', background: s.urgency === 'high' ? '#DC2626' : '#D97706' }} />
                    </div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: s.urgency === 'high' ? '#DC2626' : '#D97706', marginTop: '4px' }}>Gap: {s.gap} FTEs</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Vendor recommendations */}
            <div style={{ ...S.card, marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={S.label}>VENDOR RECOMMENDATIONS</div>
                <a href={'/select?client=' + activeClient} style={{ fontSize: '12px', fontWeight: 600, color: '#7C3AED', textDecoration: 'none' }}>Find the right platform → Marketplace</a>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {(activeClient === 'firstcapital' ? [
                  { name: 'NICE Actimize 10.2', category: 'AML / Fraud Detection', score: 91, rec: true, referral: false, reason: 'Existing vendor — upgrade from 8.1. Reduces AML false positives from 78% to 42%. Fastest path to OCC MRA resolution.' },
                  { name: 'FICO Falcon', category: 'Real-time Fraud AI', score: 87, rec: true, referral: true, reason: 'Market standard for real-time card fraud scoring. FedNow API-compatible. Reduces fraud losses toward $3.2M benchmark.' },
                  { name: 'Snowflake + Azure ML', category: 'Data Platform', score: 82, rec: false, referral: false, reason: 'Required to exit SQL Server 2017 EOS risk. Enables real-time ML — unlocks personalization and credit AI in Wave 2.' },
                ] : activeClient === 'apexretail' ? [
                  { name: 'Salesforce Einstein', category: 'Personalization AI', score: 89, rec: true, referral: true, reason: 'Existing investment — activate unused modules. Personalization and product recommendations already licensed.' },
                  { name: 'Databricks', category: 'AI Data Platform', score: 85, rec: true, referral: false, reason: 'Industry standard for retail demand forecasting and inventory AI. Proven at Walmart and Target scale.' },
                  { name: 'Dynamic Yield', category: 'Real-time Personalization', score: 78, rec: false, referral: false, reason: 'Best-in-class for checkout personalization. Evaluate after Databricks data platform is live.' },
                ] : [
                  { name: 'Cohere Health', category: 'Prior Auth AI', score: 88, rec: true, referral: true, reason: 'Highest prior auth accuracy in healthcare vertical. Pre-integrated with Epic.' },
                  { name: 'Amazon Bedrock', category: 'AI Infrastructure', score: 85, rec: true, referral: true, reason: 'Best fit for Meridian\'s AWS-heavy infrastructure. HIPAA-eligible. Claude 3.5 available.' },
                  { name: 'Workday AI', category: 'Workforce Analytics', score: 76, rec: false, referral: false, reason: 'Strong in HR but limited clinical integration. Evaluate only if Workday is strategic.' },
                ]).map((v, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '14px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid ' + (v.rec ? '#A7F3D0' : '#E2E8F0') }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>{v.name}</span>
                        <span style={{ fontSize: '11px', color: '#6B7280' }}>{v.category}</span>
                        {v.rec && <span style={{ fontSize: '10px', fontWeight: 700, background: '#059669', color: 'white', borderRadius: '3px', padding: '1px 6px' }}>RECOMMENDED</span>}
                        {v.referral && <span style={{ fontSize: '10px', color: '#D97706', fontWeight: 600 }}>★ Referral partner — disclosed</span>}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6B7280' }}>{v.reason}</div>
                    </div>
                    <div style={{ fontSize: '22px', fontWeight: 700, color: v.score >= 80 ? '#059669' : '#D97706', flexShrink: 0 }}>{v.score}</div>
                  </div>
                ))}
              </div>
            </div>

            <NavBtns prev={5} next={7} nextLabel="Next: Business Case →" />
          </div>
        )}

        {step === 7 && (
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Business Case</h1>
            <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>Three scenarios — CFO-grade financials. Every number sourced from {clientName} data.</p>

            {/* 3 Scenarios */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '28px' }}>
              {[
                {
                  name: 'Conservative', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0',
                  investment: ai.roadmap.wave1.totalInvestment / 1000000,
                  annualValue: ai.roadmap.wave1.totalAnnualValue / 1000000,
                  roi: ai.roadmap.wave1.roi, payback: 14,
                  desc: 'Wave 1 only. Proven use cases. Minimal org change.',
                },
                {
                  name: 'Moderate', color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE',
                  investment: (ai.roadmap.wave1.totalInvestment + ai.roadmap.wave2.totalInvestment) / 1000000,
                  annualValue: (ai.roadmap.wave1.totalAnnualValue + ai.roadmap.wave2.totalAnnualValue) / 1000000,
                  roi: ai.roadmap.wave2.roi, payback: 18,
                  desc: 'Waves 1+2. Parallel workstreams. Recommended.',
                },
                {
                  name: 'Aggressive', color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE',
                  investment: ai.roadmap.summary.totalInvestment / 1000000,
                  annualValue: ai.roadmap.summary.totalAnnualValue / 1000000,
                  roi: ai.roadmap.summary.blendedROI, payback: 22,
                  desc: 'All 3 waves concurrent. Maximum value, maximum risk.',
                },
              ].map((scenario, i) => (
                <div key={i} style={{ ...S.card, background: scenario.bg, border: '1px solid ' + scenario.border }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: scenario.color, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '12px' }}>{scenario.name}</div>
                  <div style={{ fontSize: '12px', color: '#374151', marginBottom: '16px', fontStyle: 'italic' }}>{scenario.desc}</div>
                  {[
                    { label: 'Total Investment', value: '$' + scenario.investment.toFixed(0) + 'M' },
                    { label: 'Annual Value', value: '$' + scenario.annualValue.toFixed(0) + 'M' },
                    { label: 'ROI', value: scenario.roi + 'x' },
                    { label: 'Payback Period', value: scenario.payback + ' months' },
                    { label: 'NPV (5yr)', value: '$' + (scenario.annualValue * 4 - scenario.investment).toFixed(0) + 'M' },
                  ].map((m, mi) => (
                    <div key={mi} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: mi < 4 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>
                      <span style={{ fontSize: '12px', color: '#6B7280' }}>{m.label}</span>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: scenario.color }}>{m.value}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* CFO summary */}
            <div style={{ ...S.card, background: '#0F172A', marginBottom: '24px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#2DD4C8', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '12px' }}>CFO FINANCIAL SUMMARY — MODERATE SCENARIO</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                {[
                  { label: 'Year 1 Investment', value: '$' + (ai.roadmap.wave1.totalInvestment / 1000000).toFixed(0) + 'M', sub: 'Capex + Opex' },
                  { label: 'Year 2 Value', value: '$' + ((ai.roadmap.wave1.totalAnnualValue + ai.roadmap.wave2.totalAnnualValue) / 1000000).toFixed(0) + 'M', sub: 'Annual run rate' },
                  { label: 'Efficiency Impact', value: activeClient === 'firstcapital' ? '-6pts C/I ratio' : activeClient === 'apexretail' ? '+2.4pts margin' : '+1.2pts margin', sub: activeClient === 'firstcapital' ? 'Toward 62% target' : activeClient === 'apexretail' ? 'On EBITDA path' : 'On 4.0% target path' },
                  { label: 'FTE Impact', value: activeClient === 'firstcapital' ? '-34 FTE' : activeClient === 'apexretail' ? '-41 FTE' : '-28 FTE', sub: 'Redeployment, not reduction' },
                ].map((m, i) => (
                  <div key={i}>
                    <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '4px' }}>{m.label}</div>
                    <div style={{ fontSize: '22px', fontWeight: 700, color: '#2DD4C8' }}>{m.value}</div>
                    <div style={{ fontSize: '10px', color: '#6B7280' }}>{m.sub}</div>
                  </div>
                ))}
              </div>
            </div>

            <NavBtns prev={6} next={8} nextLabel="Generate Board Deck →" />
          </div>
        )}

        {step === 8 && (
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Your Board Deck is Ready</h1>
            <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>What McKinsey charges ${(ai.roadmap.summary.mckinseyEquivalent / 1000000).toFixed(1)}M and 16 weeks to produce. This used {clientName}&apos;s own data.</p>
            <a href={'/board-deck?client=' + activeClient} style={{ display: 'block', padding: '16px', borderRadius: '10px', background: '#0D1117', border: '1px solid #2DD4C8', marginBottom: '12px', textDecoration: 'none' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#2DD4C8', marginBottom: '4px' }}>Generate Board Presentation →</div>
              <div style={{ fontSize: '12px', color: '#6B7280' }}>10 slides · Every number sourced · Board-ready</div>
            </a>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
              {[
                { title: 'Board Presentation', format: 'HTML', color: '#2DD4C8', bg: '#F0FDFA', border: '#99F6E4', audience: 'Board, CEO' },
                { title: 'Business Case (Excel)', format: 'Excel', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0', audience: 'CFO, Finance' },
                { title: 'Technical Roadmap', format: 'PowerPoint', color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', audience: 'CIO, IT' },
                { title: 'Executive Summary', format: 'PDF', color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', audience: 'All executives' },
                { title: 'Platform Architecture', format: 'PDF', color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE', audience: 'CTO, Architects' },
                { title: 'Vendor Evaluation', format: 'PDF', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', audience: 'Procurement, CFO' },
              ].map((exp, i) => (
                <div key={i} style={{ ...S.card, background: exp.bg, border: '1px solid ' + exp.border, textAlign: 'center' as const }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>{exp.title}</div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: exp.color, marginBottom: '12px' }}>{exp.format} · {exp.audience}</div>
                  <button style={{ width: '100%', padding: '8px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', border: 'none', background: exp.color, color: 'white' }}>Download →</button>
                </div>
              ))}
            </div>
            <div style={{ ...S.card, background: '#1E3A5F', marginBottom: '24px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '12px' }}>AbarVa vs TRADITIONAL CONSULTING</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {[
                  { label: 'Time to deliver', mckinsey: '16 weeks', abarva: '5 days' },
                  { label: 'Cost', mckinsey: '$' + (ai.roadmap.summary.mckinseyEquivalent / 1000000).toFixed(1) + 'M', abarva: '$' + (ai.roadmap.summary.abarvaFee / 1000).toFixed(0) + 'K' },
                  { label: 'Data used', mckinsey: 'Interview-based', abarva: 'Your actual data' },
                  { label: 'Accountability', mckinsey: 'None', abarva: 'Outcome-based fees' },
                ].map((row, i) => (
                  <div key={i} style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#94A3B8', width: '120px', flexShrink: 0 }}>{row.label}</span>
                    <span style={{ fontSize: '12px', color: '#FCA5A5', textDecoration: 'line-through', width: '100px' }}>{row.mckinsey}</span>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#6EE7B7' }}>{row.abarva}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
              {[
                { label: 'Generate Architecture Pattern', href: '/architecture?client=' + activeClient },
                { label: 'Generate Build Plan', href: '/how-to-build?client=' + activeClient },
                { label: 'Generate Solution Blueprint', href: '/blueprint?client=' + activeClient },
              ].map((btn, i) => (
                <a key={i} href={btn.href} style={{ display: 'block', padding: '12px 16px', borderRadius: '10px', background: '#0F172A', color: '#F8FAFC', textDecoration: 'none', fontSize: '13px', fontWeight: 600, textAlign: 'center' as const, border: '1px solid #1E293B', letterSpacing: '0.01em' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#1E293B'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#0F172A'}>
                  {btn.label} →
                </a>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={() => setStep(7)} style={{ padding: '12px 24px', borderRadius: '10px', background: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>← Back</button>
              <a href="/" style={{ padding: '12px 32px', borderRadius: '10px', background: '#059669', color: 'white', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>Done — Return to Dashboard</a>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default function AIStrategyPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', color: '#6B7280' }}>Loading AI Strategy...</div>}>
      <AIStrategyContent />
    </Suspense>
  )
}
