'use client'
import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import PageShell from '@/components/PageShell'
import { meridianAI } from '@/data/meridian/ai'
import { firstCapitalAI } from '@/data/firstcapital/ai'
import { apexRetailAI } from '@/data/apexretail/ai'

const T = {
  bg: '#060A12', surface: '#0D1520', border: '#1C2D45',
  teal: '#2DD4C8', text: '#EFF6FF', text2: '#94A3B8',
  green: '#10B981', amber: '#F59E0B', red: '#EF4444', indigo: '#6366F1',
  sans: '"DM Sans", system-ui, sans-serif',
  mono: '"JetBrains Mono", monospace',
  serif: '"Fraunces", Georgia, serif',
}

const S = {
  page: { minHeight: '100vh', background: T.bg, fontFamily: T.sans, color: T.text } as React.CSSProperties,
  card: { background: T.surface, border: `1px solid ${T.border}`, borderRadius: '12px', padding: '24px' } as React.CSSProperties,
  label: { fontSize: '11px', fontWeight: 700, color: T.teal, fontFamily: T.mono, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '12px' } as React.CSSProperties,
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
  const clientIndustry = activeClient === 'firstcapital' ? 'Financial Services' : activeClient === 'apexretail' ? 'Retail' : 'Healthcare'
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
    <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: '0 32px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex' }}>
        {STEPS.map(s => (
          <button key={s.id} onClick={() => s.id <= step && setStep(s.id)}
            style={{ padding: '12px 20px', fontSize: '13px', fontFamily: T.sans, fontWeight: step === s.id ? 600 : 400, color: step === s.id ? T.teal : step > s.id ? T.teal : T.text2, background: 'none', border: 'none', cursor: s.id <= step ? 'pointer' : 'default', borderBottom: step === s.id ? `2px solid ${T.teal}` : '2px solid transparent', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '20px', height: '20px', borderRadius: '50%', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', background: step === s.id ? T.teal : step > s.id ? `${T.teal}25` : T.border, color: step === s.id ? T.bg : step > s.id ? T.teal : T.text2 }}>{step > s.id ? '✓' : s.id}</span>
            {s.name}
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <PageShell activePage="justify" clientId={activeClient}>
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: '0 32px', height: '40px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <a href="/" style={{ fontSize: '13px', color: T.text2, textDecoration: 'none' }}>Home</a>
        <span style={{ color: T.border }}>›</span>
        <span style={{ fontSize: '13px', color: T.text, fontWeight: 500 }}>Justify</span>
        <span style={{ color: T.border }}>›</span>
        <span style={{ fontSize: '13px', color: T.text2 }}>{clientName} · {clientIndustry}</span>
      </div>
      {/* Journey */}
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: '0 32px', display: 'flex', alignItems: 'center', gap: '0', height: '36px', overflowX: 'auto' as const }}>
        {[
          { label: 'Diagnose', href: '/diagnose?client=' + clientId, active: false },
          { label: 'AI Strategy', href: '/ai-strategy?client=' + clientId, active: false },
          { label: 'Justify', href: '/justify?client=' + clientId, active: true },
          { label: 'Vendor', href: '/vendor-intelligence?client=' + clientId, active: false },
          { label: 'Blueprint', href: '/blueprint?client=' + clientId, active: false },
        ].map((s, i) => (
          <a key={i} href={s.href} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 12px', height: '36px', fontSize: '11px', fontWeight: s.active ? 700 : 500, color: s.active ? T.teal : T.text2, textDecoration: 'none', borderBottom: s.active ? `2px solid ${T.teal}` : '2px solid transparent', whiteSpace: 'nowrap' as const, boxSizing: 'border-box' as const }}>
            {s.active && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: T.teal, display: 'block' }} />}
            {s.label}
          </a>
        ))}
      </div>
      <StepNav />
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px' }}>

        {step === 1 && (
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: T.text, marginBottom: '4px', fontFamily: T.sans }}>Select Initiative</h1>
            <p style={{ fontSize: '14px', color: T.text2, marginBottom: '24px' }}>AbarVa auto-populates the baseline from {clientName} loaded data</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
              {allOpps.map((opp: any, i: number) => (
                <button key={i} onClick={() => setSelectedOpp(opp)}
                  style={{ padding: '16px', borderRadius: '10px', textAlign: 'left', cursor: 'pointer', background: selectedOpp?.id === opp.id ? `${T.teal}15` : T.surface, border: `1px solid ${selectedOpp?.id === opp.id ? T.teal : T.border}`, width: '100%', transition: 'all 0.15s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: T.text, marginBottom: '2px' }}>{opp.name}</div>
                      <div style={{ fontSize: '12px', color: T.text2 }}>{opp.problem}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '16px' }}>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: T.green, fontFamily: T.serif }}>{fmt(opp.annualValue)}</div>
                      <div style={{ fontSize: '11px', color: T.text2, fontFamily: T.mono }}>{opp.roi}x ROI · {opp.timeline}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => selectedOpp && setStep(2)} disabled={!selectedOpp} style={{ padding: '12px 32px', borderRadius: '10px', fontSize: '14px', fontWeight: 600, background: selectedOpp ? T.teal : T.border, color: selectedOpp ? T.bg : T.text2, border: 'none', cursor: selectedOpp ? 'pointer' : 'not-allowed', fontFamily: T.sans }}>
                Next: Confirm Baseline →
              </button>
            </div>
          </div>
        )}

        {step === 2 && selectedOpp && (
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: T.text, marginBottom: '4px', fontFamily: T.sans }}>Confirm Baseline</h1>
            <p style={{ fontSize: '14px', color: T.text2, marginBottom: '24px' }}>Auto-populated from {clientName} loaded data</p>
            <div style={{ ...S.card, marginBottom: '16px', background: `${T.teal}10`, border: `1px solid ${T.teal}40` }}>
              <div style={{ fontSize: '16px', fontWeight: 700, color: T.text, marginBottom: '4px' }}>{selectedOpp.name}</div>
              <div style={{ fontSize: '13px', color: T.text2 }}>{selectedOpp.problem}</div>
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
                  <div key={i} style={{ padding: '12px', background: T.bg, borderRadius: '8px', border: `1px solid ${T.border}` }}>
                    <div style={{ fontSize: '11px', color: T.teal, fontWeight: 600, fontFamily: T.mono, textTransform: 'uppercase' as const, marginBottom: '4px' }}>{item.label}</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: T.text, marginBottom: '4px' }}>{item.value}</div>
                    <div style={{ height: '3px', background: T.border, borderRadius: '2px' }}>
                      <div style={{ height: '3px', borderRadius: '2px', width: `${item.confidence}%`, background: item.confidence >= 80 ? T.green : T.amber }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={() => setStep(1)} style={{ padding: '12px 24px', borderRadius: '10px', background: T.surface, color: T.text2, border: `1px solid ${T.border}`, fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: T.sans }}>← Back</button>
              <button onClick={() => setStep(3)} style={{ padding: '12px 32px', borderRadius: '10px', background: T.teal, color: T.bg, border: 'none', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: T.sans }}>Confirm Baseline →</button>
            </div>
          </div>
        )}

        {step === 3 && selectedOpp && (
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: T.text, marginBottom: '4px', fontFamily: T.sans }}>Set Target</h1>
            <p style={{ fontSize: '14px', color: T.text2, marginBottom: '24px' }}>AbarVa recommends targets based on peer benchmarks</p>
            <div style={{ ...S.card, marginBottom: '24px' }}>
              <div style={S.label}>SELECT SCENARIO</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                {[
                  { id: 'conservative' as const, label: 'Conservative', mult: 0.6, desc: 'Lower risk approach', accent: T.amber },
                  { id: 'base' as const, label: 'Base Case', mult: 1.0, desc: 'Peer benchmark target', accent: T.teal },
                  { id: 'optimistic' as const, label: 'Optimistic', mult: 1.3, desc: 'Top quartile performance', accent: T.green },
                ].map(s => (
                  <button key={s.id} onClick={() => setScenario(s.id)} style={{ padding: '16px', borderRadius: '10px', textAlign: 'left', cursor: 'pointer', border: `2px solid ${scenario === s.id ? s.accent : T.border}`, background: scenario === s.id ? `${s.accent}15` : T.bg, width: '100%' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: scenario === s.id ? s.accent : T.text2, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>{s.label}</div>
                    <div style={{ fontSize: '22px', fontWeight: 700, color: s.accent, marginBottom: '4px', fontFamily: T.serif }}>{fmt(selectedOpp.annualValue * s.mult)}</div>
                    <div style={{ fontSize: '11px', color: T.text2 }}>{s.desc}</div>
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={() => setStep(2)} style={{ padding: '12px 24px', borderRadius: '10px', background: T.surface, color: T.text2, border: `1px solid ${T.border}`, fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: T.sans }}>← Back</button>
              <button onClick={() => setStep(4)} style={{ padding: '12px 32px', borderRadius: '10px', background: T.teal, color: T.bg, border: 'none', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: T.sans }}>Generate Business Case →</button>
            </div>
          </div>
        )}

        {step === 4 && selectedOpp && vals && (
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: T.text, marginBottom: '4px', fontFamily: T.sans }}>Business Case</h1>
            <p style={{ fontSize: '14px', color: T.text2, marginBottom: '24px' }}>{selectedOpp.name} · {scenario.charAt(0).toUpperCase() + scenario.slice(1)} scenario</p>
            <div style={{ display: 'flex', gap: '0', marginBottom: '24px', background: T.surface, border: `1px solid ${T.border}`, borderRadius: '10px', padding: '4px', width: 'fit-content' }}>
              {([
                { id: 'conservative' as const, label: 'Conservative', accent: T.amber },
                { id: 'base' as const, label: 'Base Case', accent: T.teal },
                { id: 'optimistic' as const, label: 'Optimistic', accent: T.green },
              ]).map(s => (
                <button key={s.id} onClick={() => setScenario(s.id)} style={{ padding: '8px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', border: 'none', fontFamily: T.sans, background: scenario === s.id ? s.accent : 'transparent', color: scenario === s.id ? T.bg : T.text2 }}>
                  {s.label}
                </button>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
              {[
                { label: 'Annual Value', value: fmt(vals.annualVal), color: T.green },
                { label: 'Investment Required', value: fmt(vals.invest), color: T.indigo },
                { label: '3-Year Net Benefit', value: fmt(vals.net3yr), color: T.teal },
                { label: 'Payback Period', value: vals.payback.toFixed(0) + ' months', color: T.amber },
              ].map((m, i) => (
                <div key={i} style={{ ...S.card, borderTop: `2px solid ${m.color}` }}>
                  <div style={{ fontSize: '10px', color: T.teal, fontFamily: T.mono, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '8px' }}>{m.label}</div>
                  <div style={{ fontSize: '26px', fontWeight: 700, color: m.color, fontFamily: T.serif }}>{m.value}</div>
                </div>
              ))}
            </div>
            <div style={{ ...S.card, marginBottom: '24px' }}>
              <div style={S.label}>YEAR-BY-YEAR FINANCIAL MODEL</div>
              <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
                <thead>
                  <tr>{['', 'Year 1', 'Year 2', 'Year 3'].map((h, i) => <th key={i} style={{ padding: '10px', fontSize: '11px', fontWeight: 700, fontFamily: T.mono, color: T.teal, textTransform: 'uppercase' as const, letterSpacing: '0.06em', background: T.bg, textAlign: i === 0 ? 'left' : 'right', borderBottom: `1px solid ${T.border}` }}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {[
                    { label: 'Value Captured', y1: vals.annualVal * 0.35, y2: vals.annualVal * 0.75, y3: vals.annualVal },
                    { label: 'Investment', y1: vals.invest * 0.5, y2: vals.invest * 0.35, y3: vals.invest * 0.15 },
                    { label: 'Net Benefit', y1: (vals.annualVal * 0.35) - (vals.invest * 0.5), y2: (vals.annualVal * 0.75) - (vals.invest * 0.35), y3: vals.annualVal - (vals.invest * 0.15) },
                  ].map((row, ri) => (
                    <tr key={ri} style={{ background: ri % 2 === 0 ? T.surface : T.bg }}>
                      <td style={{ padding: '12px 10px', fontSize: '13px', fontWeight: 500, color: T.text2, borderBottom: `1px solid ${T.border}` }}>{row.label}</td>
                      {[row.y1, row.y2, row.y3].map((val, ci) => (
                        <td key={ci} style={{ padding: '12px 10px', fontSize: '14px', fontWeight: 700, fontFamily: T.mono, color: row.label === 'Net Benefit' ? (val < 0 ? T.red : T.green) : T.text, textAlign: 'right', borderBottom: `1px solid ${T.border}` }}>{fmt(val)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button onClick={() => setStep(3)} style={{ padding: '12px 24px', borderRadius: '10px', background: T.surface, color: T.text2, border: `1px solid ${T.border}`, fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: T.sans }}>← Back</button>
              <div style={{ display: 'flex', gap: '10px' }}>
                <a href={'/scenarios?client=' + activeClient} style={{ padding: '12px 20px', borderRadius: '10px', background: `${T.indigo}20`, color: T.indigo, border: `1px solid ${T.indigo}40`, fontSize: '13px', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', fontFamily: T.sans }}>Run Scenario Analysis →</a>
                <button onClick={() => setStep(5)} style={{ padding: '12px 32px', borderRadius: '10px', background: T.teal, color: T.bg, border: 'none', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: T.sans }}>Export Business Case →</button>
              </div>
            </div>
          </div>
        )}

        {step === 5 && selectedOpp && vals && (
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: T.text, marginBottom: '4px', fontFamily: T.sans }}>Export Business Case</h1>
            <p style={{ fontSize: '14px', color: T.text2, marginBottom: '24px' }}>{selectedOpp.name} · {fmt(vals.annualVal)} annual value · {vals.roi.toFixed(1)}x ROI</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>
              {[
                { title: 'Executive Summary', format: 'PDF', color: T.red },
                { title: 'Financial Model', format: 'Excel', color: T.green },
                { title: 'Implementation Plan', format: 'PDF', color: T.indigo },
              ].map((exp, i) => (
                <div key={i} style={{ ...S.card, borderTop: `2px solid ${exp.color}`, textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: T.text, marginBottom: '4px' }}>{exp.title}</div>
                  <div style={{ fontSize: '11px', fontWeight: 700, fontFamily: T.mono, color: exp.color, marginBottom: '16px', textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>{exp.format}</div>
                  <button style={{ width: '100%', padding: '10px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', border: 'none', background: exp.color, color: T.bg, fontFamily: T.sans }}>Download {exp.format} →</button>
                </div>
              ))}
            </div>
            <div style={{ ...S.card, borderTop: `2px solid ${T.teal}`, textAlign: 'center', padding: '32px', marginBottom: '24px' }}>
              <div style={{ fontSize: '11px', color: T.teal, fontWeight: 700, fontFamily: T.mono, textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: '8px' }}>Business case complete</div>
              <div style={{ fontSize: '36px', fontWeight: 700, color: T.text, marginBottom: '4px', fontFamily: T.serif }}>{fmt(vals.annualVal)} annual value</div>
              <div style={{ fontSize: '14px', color: T.text2 }}>{vals.roi.toFixed(1)}x ROI · {vals.payback.toFixed(0)} month payback</div>
              <div style={{ fontSize: '12px', color: T.text2, marginTop: '8px' }}>What McKinsey charges $1-2M to produce — AbarVa generated this in 4 minutes from your actual data</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={() => setStep(4)} style={{ padding: '12px 24px', borderRadius: '10px', background: T.surface, color: T.text2, border: `1px solid ${T.border}`, fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: T.sans }}>← Back</button>
              <div style={{ display: 'flex', gap: '12px' }}>
                <a href={`/vendor-intelligence?client=${activeClient}`} style={{ padding: '12px 24px', borderRadius: '10px', background: `${T.indigo}20`, color: T.indigo, textDecoration: 'none', fontSize: '14px', fontWeight: 600, border: `1px solid ${T.indigo}40`, fontFamily: T.sans }}>Select Vendor →</a>
                <a href="/" style={{ padding: '12px 24px', borderRadius: '10px', background: T.teal, color: T.bg, textDecoration: 'none', fontSize: '14px', fontWeight: 600, fontFamily: T.sans }}>✓ Done</a>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  )
}

export default function JustifyPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#060A12', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"DM Sans", sans-serif', color: '#94A3B8' }}>Loading...</div>}>
      <JustifyContent />
    </Suspense>
  )
}
