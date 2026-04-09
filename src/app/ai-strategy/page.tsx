'use client'
import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import AbarvaNav from '@/components/AbarvaNav'
import { meridianAI } from '@/data/meridian/ai'
import { firstCapitalAI } from '@/data/firstcapital/ai'
import { apexRetailAI } from '@/data/apexretail/ai'

const S = {
  page: { minHeight: '100vh', background: '#F8FAFC', fontFamily: 'Inter, -apple-system, sans-serif' } as React.CSSProperties,
  card: { background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '24px' } as React.CSSProperties,
  label: { fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '12px' } as React.CSSProperties,
}

const STEPS = [
  { id: 1, name: 'Current State' },
  { id: 2, name: 'Stakeholder Input' },
  { id: 3, name: 'Opportunities' },
  { id: 4, name: 'Prioritization' },
  { id: 5, name: 'Roadmap' },
  { id: 6, name: 'Export' },
]

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
  const [activeClient, setActiveClient] = useState(clientId)
  const [oppTab, setOppTab] = useState<'front' | 'middle' | 'back'>('front')
  const [priority, setPriority] = useState<'revenue' | 'cost' | 'risk'>('revenue')
  const [budget, setBudget] = useState<'conservative' | 'moderate' | 'aggressive'>('moderate')

  const clientName = activeClient === 'firstcapital' ? 'First Capital Financial' : activeClient === 'apexretail' ? 'Apex Retail Group' : 'Meridian Health System'
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
      <span style={{ fontSize: '13px', color: '#6B7280' }}>{clientName}</span>
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

  return (
    <div style={S.page}>
      <AbarvaNav clientId={activeClient} onClientChange={id => { setActiveClient(id); setStep(1) }} activePage="ai-strategy" />
      <Breadcrumb />
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
            <NavBtns next={2} nextLabel="Next: Stakeholder Input →" />
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
              <div style={S.label}>ABARVA SYNTHESIS AND RECOMMENDATION</div>
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
            <NavBtns prev={1} next={3} nextLabel="Next: Opportunities →" />
          </div>
        )}

        {step === 3 && (
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>AI Opportunity Scan</h1>
            <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>Every AI opportunity tied to actual client data</p>
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
                return (
                  <div key={i} style={{ ...S.card, padding: '16px', borderLeft: '3px solid ' + accents[oppTab] }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A', flex: 1, paddingRight: '8px' }}>{opp.name}</div>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: '#059669', flexShrink: 0 }}>${(opp.annualValue / 1000000).toFixed(0)}M</div>
                    </div>
                    <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '10px', lineHeight: 1.4 }}>{opp.problem}</div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' as const }}>
                      <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '10px', background: rb, color: rc }}>Data: {opp.dataReadinessPct}%</span>
                      <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '10px', background: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0' }}>${(opp.investment / 1000000).toFixed(1)}M invest</span>
                      <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '10px', background: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0' }}>{opp.roi}x ROI</span>
                      <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '10px', background: wb, color: wc }}>Wave {opp.wave}</span>
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
            <NavBtns prev={2} next={4} nextLabel="Next: Prioritization →" />
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
            <NavBtns prev={3} next={5} nextLabel="Next: Roadmap →" />
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
            <NavBtns prev={4} next={6} nextLabel="Next: Export →" />
          </div>
        )}

        {step === 6 && (
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Export AI Strategy</h1>
            <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>What McKinsey charges ${(ai.roadmap.summary.mckinseyEquivalent / 1000000).toFixed(1)}M and 16 weeks to produce</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>
              {[
                { title: 'Executive Summary', format: 'PDF', color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', audience: 'Board and CEO' },
                { title: 'Full Business Case', format: 'Excel', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0', audience: 'CFO and Finance' },
                { title: 'Technical Roadmap', format: 'PowerPoint', color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', audience: 'CIO and IT' },
              ].map((exp, i) => (
                <div key={i} style={{ ...S.card, background: exp.bg, border: '1px solid ' + exp.border, textAlign: 'center' }}>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>{exp.title}</div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: exp.color, marginBottom: '16px' }}>{exp.format} · For {exp.audience}</div>
                  <button style={{ width: '100%', padding: '10px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', border: 'none', background: exp.color, color: 'white' }}>Download {exp.format} →</button>
                </div>
              ))}
            </div>
            <div style={{ ...S.card, background: '#1E3A5F', marginBottom: '24px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '12px' }}>ABARVA vs TRADITIONAL CONSULTING</div>
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
                { label: 'Generate Solution Blueprint', href: '/blueprint?client=' + activeClient },
                { label: 'View Data Intelligence', href: '/data-intelligence?client=' + activeClient },
              ].map((btn, i) => (
                <a key={i} href={btn.href} style={{ display: 'block', padding: '12px 16px', borderRadius: '10px', background: '#0F172A', color: '#F8FAFC', textDecoration: 'none', fontSize: '13px', fontWeight: 600, textAlign: 'center' as const, border: '1px solid #1E293B', letterSpacing: '0.01em' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#1E293B'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#0F172A'}>
                  {btn.label} →
                </a>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={() => setStep(5)} style={{ padding: '12px 24px', borderRadius: '10px', background: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>← Back</button>
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
