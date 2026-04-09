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

const STEPS = [{ id: 1, name: 'Select Initiative' }, { id: 2, name: 'Confirm Baseline' }, { id: 3, name: 'Set Target' }, { id: 4, name: 'Business Case' }, { id: 5, name: 'Export' }]

function fmt(n: number) {
  if (n >= 1000000000) return '$' + (n/1000000000).toFixed(1) + 'B'
  if (n >= 1000000) return '$' + (n/1000000).toFixed(0) + 'M'
  if (n >= 1000) return '$' + (n/1000).toFixed(0) + 'K'
  return '$' + n.toFixed(0)
}

function JustifyContent() {
  const searchParams = useSearchParams()
  const clientId = searchParams.get('client') || 'meridian'
  const [step, setStep] = useState(1)
  const [activeClient, setActiveClient] = useState(clientId)
  const [selectedOpp, setSelectedOpp] = useState<any>(null)
  const [scenario, setScenario] = useState<'conservative'|'base'|'optimistic'>('base')

  const clientName = activeClient === 'firstcapital' ? 'First Capital Financial' : activeClient === 'apexretail' ? 'Apex Retail Group' : 'Meridian Health System'
  const ai = activeClient === 'firstcapital' ? firstCapitalAI : activeClient === 'apexretail' ? apexRetailAI : meridianAI
  const allOpps = [...ai.opportunities.frontOffice, ...ai.opportunities.middleOffice, ...ai.opportunities.backOffice].sort((a: any, b: any) => (b.annualValue||0) - (a.annualValue||0))

  const mult = scenario === 'conservative' ? 0.6 : scenario === 'optimistic' ? 1.3 : 1.0
  const vals = selectedOpp ? {
    annualVal: selectedOpp.annualValue * mult,
    invest: selectedOpp.investment,
    net3yr: (selectedOpp.annualValue * mult * 3) - selectedOpp.investment,
    roi: (selectedOpp.annualValue * mult) / selectedOpp.investment,
    payback: selectedOpp.investment / (selectedOpp.annualValue * mult / 12),
  } : null

  const StepNav = () => (
    <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E2E8F0', padding: '0 32px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex' }}>
        {STEPS.map(s => (
          <button key={s.id} onClick={() => s.id <= step && setStep(s.id)}
            style={{ padding: '12px 20px', fontSize: '13px', fontWeight: step === s.id ? 600 : 400, color: step === s.id ? '#059669' : step > s.id ? '#059669' : '#94A3B8', background: 'none', border: 'none', cursor: s.id <= step ? 'pointer' : 'default', borderBottom: step === s.id ? '2px solid #059669' : '2px solid transparent', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '20px', height: '20px', borderRadius: '50%', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', background: step === s.id ? '#059669' : step > s.id ? '#059669' : '#F1F5F9', color: step === s.id || step > s.id ? 'white' : '#94A3B8' }}>{step > s.id ? '✓' : s.id}</span>
            {s.name}
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <div style={S.page}>
      <AbarvaNav clientId={activeClient} onClientChange={id => { setActiveClient(id); setStep(1); setSelectedOpp(null) }} activePage="justify" />
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E2E8F0', padding: '0 32px', height: '40px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <a href="/" style={{ fontSize: '13px', color: '#6B7280', textDecoration: 'none' }}>Home</a>
        <span style={{ color: '#D1D5DB' }}>›</span>
        <span style={{ fontSize: '13px', color: '#0F172A', fontWeight: 500 }}>Justify</span>
        <span style={{ color: '#D1D5DB' }}>›</span>
        <span style={{ fontSize: '13px', color: '#6B7280' }}>{clientName}</span>
      </div>
      <StepNav />
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '32px' }}>

        {step === 1 && (
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Select Initiative</h1>
            <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>Abarva auto-populates the baseline from {clientName} loaded data</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
              {allOpps.map((opp: any, i: number) => (
                <button key={i} onClick={() => setSelectedOpp(opp)}
                  style={{ padding: '16px', borderRadius: '10px', textAlign: 'left', cursor: 'pointer', background: selectedOpp?.id === opp.id ? '#EFF6FF' : '#FFFFFF', border: `1px solid ${selectedOpp?.id === opp.id ? '#2563EB' : '#E2E8F0'}`, width: '100%', transition: 'all 0.15s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A', marginBottom: '2px' }}>{opp.name}</div>
                      <div style={{ fontSize: '12px', color: '#6B7280' }}>{opp.problem}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '16px' }}>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: '#059669' }}>{fmt(opp.annualValue)}</div>
                      <div style={{ fontSize: '11px', color: '#94A3B8' }}>{opp.roi}x ROI · {opp.timeline}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => selectedOpp && setStep(2)} disabled={!selectedOpp} style={{ padding: '12px 32px', borderRadius: '10px', fontSize: '14px', fontWeight: 600, background: selectedOpp ? '#059669' : '#E2E8F0', color: selectedOpp ? 'white' : '#94A3B8', border: 'none', cursor: selectedOpp ? 'pointer' : 'not-allowed' }}>
                Next: Confirm Baseline →
              </button>
            </div>
          </div>
        )}

        {step === 2 && selectedOpp && (
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Confirm Baseline</h1>
            <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>Auto-populated from {clientName} loaded data</p>
            <div style={{ ...S.card, marginBottom: '16px', background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>{selectedOpp.name}</div>
              <div style={{ fontSize: '13px', color: '#374151' }}>{selectedOpp.problem}</div>
            </div>
            <div style={{ ...S.card, marginBottom: '24px' }}>
              <div style={S.label}>BASELINE DATA</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                {[
                  { label: 'Annual Value Opportunity', value: fmt(selectedOpp.annualValue), confidence: 88 },
                  { label: 'Required Investment', value: fmt(selectedOpp.investment), confidence: 82 },
                  { label: 'Implementation Timeline', value: selectedOpp.timeline, confidence: 90 },
                  { label: 'Data Readiness', value: selectedOpp.dataReadinessPct + '%', confidence: selectedOpp.dataReadinessPct },
                  { label: 'AI Approach', value: selectedOpp.aiApproach, confidence: 85 },
                  { label: 'Complexity', value: selectedOpp.complexity ? selectedOpp.complexity.charAt(0).toUpperCase() + selectedOpp.complexity.slice(1) : 'Medium', confidence: 88 },
                ].map((item, i) => (
                  <div key={i} style={{ padding: '12px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' as const, marginBottom: '4px' }}>{item.label}</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A', marginBottom: '4px' }}>{item.value}</div>
                    <div style={{ height: '3px', background: '#E2E8F0', borderRadius: '2px' }}>
                      <div style={{ height: '3px', borderRadius: '2px', width: `${item.confidence}%`, background: item.confidence >= 80 ? '#059669' : '#D97706' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={() => setStep(1)} style={{ padding: '12px 24px', borderRadius: '10px', background: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>← Back</button>
              <button onClick={() => setStep(3)} style={{ padding: '12px 32px', borderRadius: '10px', background: '#059669', color: 'white', border: 'none', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Confirm Baseline →</button>
            </div>
          </div>
        )}

        {step === 3 && selectedOpp && (
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Set Target</h1>
            <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>Abarva recommends targets based on peer benchmarks</p>
            <div style={{ ...S.card, marginBottom: '24px' }}>
              <div style={S.label}>SELECT SCENARIO</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                {[{ id: 'conservative' as const, label: 'Conservative', mult: 0.6, desc: 'Lower risk approach' }, { id: 'base' as const, label: 'Base Case', mult: 1.0, desc: 'Peer benchmark target' }, { id: 'optimistic' as const, label: 'Optimistic', mult: 1.3, desc: 'Top quartile performance' }].map(s => (
                  <button key={s.id} onClick={() => setScenario(s.id)} style={{ padding: '16px', borderRadius: '10px', textAlign: 'left', cursor: 'pointer', border: `2px solid ${scenario === s.id ? '#059669' : '#E2E8F0'}`, background: scenario === s.id ? '#F0FDF4' : '#FFFFFF', width: '100%' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>{s.label}</div>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: '#059669', marginBottom: '4px' }}>{fmt(selectedOpp.annualValue * s.mult)}</div>
                    <div style={{ fontSize: '11px', color: '#6B7280' }}>{s.desc}</div>
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={() => setStep(2)} style={{ padding: '12px 24px', borderRadius: '10px', background: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>← Back</button>
              <button onClick={() => setStep(4)} style={{ padding: '12px 32px', borderRadius: '10px', background: '#059669', color: 'white', border: 'none', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Generate Business Case →</button>
            </div>
          </div>
        )}

        {step === 4 && selectedOpp && vals && (
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Business Case</h1>
            <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>{selectedOpp.name} · {scenario.charAt(0).toUpperCase() + scenario.slice(1)} scenario</p>
            <div style={{ display: 'flex', gap: '0', marginBottom: '24px', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '4px', width: 'fit-content' }}>
              {(['conservative', 'base', 'optimistic'] as const).map(s => (
                <button key={s} onClick={() => setScenario(s)} style={{ padding: '8px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', border: 'none', background: scenario === s ? '#059669' : 'transparent', color: scenario === s ? '#FFFFFF' : '#6B7280' }}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
              {[
                { label: 'Annual Value', value: fmt(vals.annualVal), color: '#059669' },
                { label: 'Investment Required', value: fmt(vals.invest), color: '#2563EB' },
                { label: '3-Year Net Benefit', value: fmt(vals.net3yr), color: '#7C3AED' },
                { label: 'Payback Period', value: vals.payback.toFixed(0) + ' months', color: '#D97706' },
              ].map((m, i) => (
                <div key={i} style={S.card}>
                  <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '6px' }}>{m.label}</div>
                  <div style={{ fontSize: '26px', fontWeight: 700, color: m.color }}>{m.value}</div>
                </div>
              ))}
            </div>
            <div style={{ ...S.card, marginBottom: '24px' }}>
              <div style={S.label}>YEAR-BY-YEAR FINANCIAL MODEL</div>
              <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
                <thead>
                  <tr>{['', 'Year 1', 'Year 2', 'Year 3'].map((h, i) => <th key={i} style={{ padding: '10px', fontSize: '12px', fontWeight: 700, color: '#6B7280', background: '#F8FAFC', textAlign: i === 0 ? 'left' : 'right', borderBottom: '1px solid #E2E8F0' }}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {[
                    { label: 'Value Captured', y1: vals.annualVal * 0.35, y2: vals.annualVal * 0.75, y3: vals.annualVal },
                    { label: 'Investment', y1: vals.invest * 0.5, y2: vals.invest * 0.35, y3: vals.invest * 0.15 },
                    { label: 'Net Benefit', y1: (vals.annualVal * 0.35) - (vals.invest * 0.5), y2: (vals.annualVal * 0.75) - (vals.invest * 0.35), y3: vals.annualVal - (vals.invest * 0.15) },
                  ].map((row, ri) => (
                    <tr key={ri} style={{ background: ri % 2 === 0 ? '#FFFFFF' : '#F8FAFC' }}>
                      <td style={{ padding: '12px 10px', fontSize: '13px', fontWeight: 500, color: '#475569', borderBottom: '1px solid #F1F5F9' }}>{row.label}</td>
                      {[row.y1, row.y2, row.y3].map((val, ci) => (
                        <td key={ci} style={{ padding: '12px 10px', fontSize: '14px', fontWeight: 700, color: row.label === 'Net Benefit' ? (val < 0 ? '#DC2626' : '#059669') : '#0F172A', textAlign: 'right', borderBottom: '1px solid #F1F5F9' }}>{fmt(val)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={() => setStep(3)} style={{ padding: '12px 24px', borderRadius: '10px', background: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>← Back</button>
              <button onClick={() => setStep(5)} style={{ padding: '12px 32px', borderRadius: '10px', background: '#059669', color: 'white', border: 'none', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Export Business Case →</button>
            </div>
          </div>
        )}

        {step === 5 && selectedOpp && vals && (
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Export Business Case</h1>
            <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>{selectedOpp.name} · {fmt(vals.annualVal)} annual value · {vals.roi.toFixed(1)}x ROI</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>
              {[{ title: 'Executive Summary', format: 'PDF', color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' }, { title: 'Financial Model', format: 'Excel', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' }, { title: 'Implementation Plan', format: 'PDF', color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' }].map((exp, i) => (
                <div key={i} style={{ ...S.card, background: exp.bg, border: `1px solid ${exp.border}`, textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>{exp.title}</div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: exp.color, marginBottom: '16px' }}>{exp.format}</div>
                  <button style={{ width: '100%', padding: '10px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', border: 'none', background: exp.color, color: 'white' }}>Download {exp.format} →</button>
                </div>
              ))}
            </div>
            <div style={{ ...S.card, background: '#F0FDF4', border: '1px solid #A7F3D0', textAlign: 'center', padding: '32px', marginBottom: '24px' }}>
              <div style={{ fontSize: '14px', color: '#059669', fontWeight: 700, marginBottom: '8px' }}>Business case complete</div>
              <div style={{ fontSize: '36px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>{fmt(vals.annualVal)} annual value</div>
              <div style={{ fontSize: '14px', color: '#6B7280' }}>{vals.roi.toFixed(1)}x ROI · {vals.payback.toFixed(0)} month payback</div>
              <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '8px' }}>What McKinsey charges $1-2M to produce — Abarva generated this in 4 minutes from your actual data</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={() => setStep(4)} style={{ padding: '12px 24px', borderRadius: '10px', background: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>← Back</button>
              <div style={{ display: 'flex', gap: '12px' }}>
                <a href={`/select?client=${activeClient}`} style={{ padding: '12px 24px', borderRadius: '10px', background: '#EFF6FF', color: '#2563EB', textDecoration: 'none', fontSize: '14px', fontWeight: 600, border: '1px solid #BFDBFE' }}>Select Vendor →</a>
                <a href="/" style={{ padding: '12px 24px', borderRadius: '10px', background: '#059669', color: 'white', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>✓ Done</a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function JustifyPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', color: '#6B7280' }}>Loading...</div>}>
      <JustifyContent />
    </Suspense>
  )
}
