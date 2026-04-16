'use client'
import { useState, Suspense, useEffect } from 'react'
import AbarvaNav from '@/components/AbarvaNav'
import { meridianAI } from '@/data/meridian/ai'
import { apexRetailAI } from '@/data/apexretail/ai'
import { arcturusAI } from '@/data/arcturus/ai'
import { useClientContext, ALL_CLIENTS } from '@/lib/use-client-context'

const T = {
  bg: '#060A12', surface: '#0D1520', border: '#1C2D45',
  teal: '#2DD4C8', text: '#EFF6FF', text2: '#94A3B8',
  green: '#10B981', amber: '#F59E0B', red: '#EF4444', indigo: '#6366F1',
  sans: '"DM Sans", system-ui, sans-serif',
  mono: '"JetBrains Mono", monospace',
  serif: '"Fraunces", Georgia, serif',
}

const STEPS = [
  { id: 1, name: 'Select Initiative' },
  { id: 2, name: 'Confirm Baseline' },
  { id: 3, name: 'Set Target' },
  { id: 4, name: 'Business Case' },
  { id: 5, name: 'Export' },
]

function fmt(n: number) {
  if (n >= 1_000_000_000) return '$' + (n / 1_000_000_000).toFixed(1) + 'B'
  if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(0) + 'M'
  if (n >= 1_000) return '$' + (n / 1_000).toFixed(0) + 'K'
  return '$' + n.toFixed(0)
}

function fmtMo(mo: number) {
  if (mo >= 12) return (mo / 12).toFixed(1) + ' yrs'
  return mo.toFixed(0) + ' mo'
}

// Animated counter
function Counter({ target, prefix = '$', suffix = '' }: { target: number; prefix?: string; suffix?: string }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    let start = 0
    const steps = 40
    const inc = target / steps
    const timer = setInterval(() => {
      start += inc
      if (start >= target) { setVal(target); clearInterval(timer) }
      else setVal(Math.floor(start))
    }, 18)
    return () => clearInterval(timer)
  }, [target])

  const display = val >= 1_000_000_000 ? prefix + (val / 1_000_000_000).toFixed(1) + 'B'
    : val >= 1_000_000 ? prefix + (val / 1_000_000).toFixed(0) + 'M'
    : val >= 1_000 ? prefix + (val / 1_000).toFixed(0) + 'K'
    : prefix + val.toFixed(0)
  return <>{display}{suffix}</>
}

function JustifyContent() {
  const { clientId: activeClient } = useClientContext()
  const [step, setStep] = useState(1)
  const [selectedOpp, setSelectedOpp] = useState<any>(null)
  const [scenario, setScenario] = useState<'conservative' | 'base' | 'optimistic'>('base')
  const [role, setRole] = useState('Maestro')

  const clientMeta = ALL_CLIENTS.find(c => c.id === activeClient)
  const clientName = clientMeta?.name || 'Your Organization'
  const clientIndustry = clientMeta?.vertical || 'Healthcare'

  const ROLES = clientIndustry === 'Financial Services'
    ? ['CIO', 'CFO', 'CRO', 'CEO', 'Maestro']
    : clientIndustry === 'Retail'
    ? ['CIO', 'CFO', 'CMO', 'COO', 'CEO', 'Maestro']
    : ['CIO', 'CFO', 'CMIO', 'COO', 'CEO', 'Maestro']

  const ai = activeClient === 'apexretail' ? apexRetailAI
    : activeClient === 'arcturus' ? arcturusAI
    : meridianAI

  const allOpps = [
    ...ai.opportunities.frontOffice,
    ...ai.opportunities.middleOffice,
    ...ai.opportunities.backOffice,
  ].sort((a: any, b: any) => (b.annualValue || 0) - (a.annualValue || 0))

  const mult = scenario === 'conservative' ? 0.6 : scenario === 'optimistic' ? 1.3 : 1.0
  const vals = selectedOpp ? {
    annualVal: selectedOpp.annualValue * mult,
    invest: selectedOpp.investment,
    net3yr: (selectedOpp.annualValue * mult * 3) - selectedOpp.investment,
    roi: (selectedOpp.annualValue * mult) / selectedOpp.investment,
    payback: selectedOpp.investment / (selectedOpp.annualValue * mult / 12),
  } : null

  const SCENARIOS = [
    { id: 'conservative' as const, label: 'Conservative', mult: 0.6, desc: '60th-percentile peer outcome', accent: T.amber },
    { id: 'base' as const, label: 'Base Case', mult: 1.0, desc: 'Median peer outcome', accent: T.teal },
    { id: 'optimistic' as const, label: 'Optimistic', mult: 1.3, desc: 'Top-quartile peer outcome', accent: T.green },
  ]

  return (
    <div style={{minHeight:'100vh',background:'#060A12',fontFamily:'"DM Sans",sans-serif',color:'#EFF6FF'}}>
      <AbarvaNav activePage="justify" />

      {/* ── Breadcrumb ─────────────────────────────────────────────────────── */}
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: '0 32px', height: '40px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <a href="/" style={{ fontSize: '12px', color: T.text2, textDecoration: 'none' }}>Home</a>
        <span style={{ color: T.border }}>›</span>
        <span style={{ fontSize: '12px', color: T.text, fontWeight: 500 }}>Business Case</span>
        <span style={{ color: T.border }}>›</span>
        <span style={{ fontSize: '12px', color: T.text2 }}>{clientName} · {clientIndustry}</span>
      </div>

      {/* ── Product header ─────────────────────────────────────────────────── */}
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: '24px 32px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: T.teal, fontFamily: T.mono, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '6px' }}>
              Business Case Intelligence
            </div>
            <div style={{ fontSize: '20px', fontFamily: T.serif, color: T.text, fontWeight: 500, lineHeight: 1.3, maxWidth: '560px' }}>
              &ldquo;How do we justify this to the board — with numbers they can defend?&rdquo;
            </div>
          </div>
          <div style={{ display: 'flex', gap: '32px', flexShrink: 0 }}>
            {[
              { label: 'Initiatives Available', value: String(allOpps.length) },
              { label: 'Total Opportunity', value: fmt(allOpps.reduce((s: number, o: any) => s + (o.annualValue || 0), 0) * 3) },
              { label: 'Median Payback', value: '14 mo' },
            ].map((m, i) => (
              <div key={i}>
                <div style={{ fontSize: '9px', fontWeight: 700, color: T.teal, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '2px' }}>{m.label}</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: T.text, fontFamily: T.serif }}>{m.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Role tabs strip ────────────────────────────────────────────────── */}
      <div style={{ background: '#060E18', borderBottom: `1px solid ${T.border}`, padding: '0 32px', display: 'flex', alignItems: 'center', gap: '2px', height: '38px' }}>
        {ROLES.map(r => {
          const isActive = role === r
          return (
            <button key={r} onClick={() => setRole(r)}
              style={{ fontFamily: T.mono, fontSize: '10px', letterSpacing: '0.06em', textTransform: 'uppercase' as const, padding: '4px 14px', borderRadius: '5px', border: 'none', cursor: 'pointer', height: '28px', background: isActive ? T.teal : 'transparent', color: isActive ? T.bg : '#94A3B8', fontWeight: isActive ? 700 : 400 }}
              onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.color = T.text }}
              onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.color = '#94A3B8' }}
            >{r}</button>
          )
        })}
        <div style={{ marginLeft: 'auto', fontFamily: T.mono, fontSize: '9px', color: '#374151', letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>
          Viewing as <span style={{ color: T.teal, fontWeight: 600 }}>{role}</span>
        </div>
      </div>

      {/* ── Role lens ──────────────────────────────────────────────────────── */}
      <div style={{ background: `${T.teal}08`, borderBottom: `1px solid ${T.border}`, padding: '12px 32px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '24px' }}>
          {(() => {
            const front = ai.opportunities.frontOffice || []
            const mid   = ai.opportunities.middleOffice || []
            const back  = ai.opportunities.backOffice  || []
            const oppsForRole = role === 'CMO'
              ? front
              : role === 'COO'
              ? [...mid, ...back].filter((o: any) => (o.name||'').toLowerCase().match(/ops|supply|fulfil|workforce|sched/))
              : role === 'CIO'
              ? [...mid, ...back].filter((o: any) => (o.name||'').toLowerCase().match(/platform|tech|data|migration|infrastructure|ai/))
              : role === 'CRO'
              ? [...mid, ...back].filter((o: any) => (o.name||'').toLowerCase().match(/risk|compliance|govern|stress|fraud/))
              : role === 'CMIO'
              ? [...front, ...back].filter((o: any) => (o.name||'').toLowerCase().match(/clinical|prior|patient|physician|care/))
              : allOpps

            const scopeVal = oppsForRole.reduce((s: number, o: any) => s + (o.annualValue || 0), 0)
            const best = oppsForRole.reduce((b: any, o: any) => (!b || (o.annualValue||0) > (b.annualValue||0)) ? o : b, null as any)
            const roi = best && best.investment ? ((best.annualValue || 0) * 3 / best.investment) : null

            return [
              { label: role === 'CFO' ? 'Total 3-Year Value' : 'Value in Scope (3yr)',
                value: fmt(scopeVal * 3) },
              { label: role === 'CFO' ? 'Median Payback' : 'Initiatives in Scope',
                value: role === 'CFO' ? '14 mo' : String(oppsForRole.length) + ' initiatives' },
              { label: 'Top Initiative',
                value: best ? best.name : '—',
                sub: roi ? `${roi.toFixed(1)}× ROI` : '' },
            ].map((item, i) => (
              <div key={i}>
                <div style={{ fontSize: '9px', fontWeight: 700, color: T.teal, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '3px' }}>{item.label}</div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: T.text, fontFamily: T.serif }}>{item.value}</div>
                {item.sub && <div style={{ fontSize: '10px', color: T.teal, fontFamily: T.mono, fontWeight: 600, marginTop: '2px' }}>{item.sub}</div>}
              </div>
            ))
          })()}
        </div>
      </div>

      {/* ── Journey strip ──────────────────────────────────────────────────── */}
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: '0 32px', display: 'flex', alignItems: 'center', height: '36px', overflowX: 'auto' }}>
        {[
          { label: 'Diagnose', href: '/diagnose?client=' + activeClient },
          { label: 'AI Strategy', href: '/ai-strategy?client=' + activeClient },
          { label: 'Business Case', href: '/justify?client=' + activeClient, active: true },
          { label: 'Vendor', href: '/vendor-intelligence?client=' + activeClient },
          { label: 'Blueprint', href: '/blueprint?client=' + activeClient },
        ].map((s, i) => (
          <a key={i} href={s.href} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '0 12px', height: '36px', fontSize: '11px', fontWeight: (s as any).active ? 700 : 500, color: (s as any).active ? T.teal : T.text2, textDecoration: 'none', borderBottom: (s as any).active ? `2px solid ${T.teal}` : '2px solid transparent', whiteSpace: 'nowrap', boxSizing: 'border-box' }}>
            {(s as any).active && <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: T.teal, display: 'block' }} />}
            {s.label}
          </a>
        ))}
      </div>

      {/* ── Step nav ───────────────────────────────────────────────────────── */}
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: '0 32px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex' }}>
          {STEPS.map(s => (
            <button key={s.id}
              onClick={() => s.id <= step && setStep(s.id)}
              style={{ padding: '12px 20px', fontSize: '12px', fontFamily: T.sans, fontWeight: step === s.id ? 600 : 400, color: step === s.id ? T.teal : step > s.id ? T.teal : T.text2, background: 'none', border: 'none', cursor: s.id <= step ? 'pointer' : 'default', borderBottom: step === s.id ? `2px solid ${T.teal}` : '2px solid transparent', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
              <span style={{ width: '18px', height: '18px', borderRadius: '50%', fontSize: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', background: step === s.id ? T.teal : step > s.id ? `${T.teal}25` : T.border, color: step === s.id ? T.bg : step > s.id ? T.teal : T.text2, flexShrink: 0 }}>
                {step > s.id ? '✓' : s.id}
              </span>
              {s.name}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px' }}>

        {/* ── STEP 1: Select Initiative ───────────────────────────────────── */}
        {step === 1 && (
          <div>
            <div style={{ marginBottom: '28px' }}>
              <h1 style={{ fontSize: '22px', fontWeight: 600, color: T.text, fontFamily: T.serif, marginBottom: '6px' }}>Select an initiative</h1>
              <p style={{ fontSize: '13px', color: T.text2, lineHeight: 1.6 }}>
                AbarVa pre-populates baseline from {clientName} data. Select an opportunity to build the business case.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '28px' }}>
              {allOpps.map((opp: any, i: number) => {
                const sel = selectedOpp?.id === opp.id
                return (
                  <button key={i} onClick={() => setSelectedOpp(opp)} style={{ padding: '0', borderRadius: '10px', textAlign: 'left', cursor: 'pointer', background: 'transparent', border: 'none', width: '100%' }}>
                    <div style={{ background: sel ? `${T.teal}08` : T.surface, border: `1px solid ${sel ? T.teal : T.border}`, borderLeft: `4px solid ${sel ? T.teal : T.border}`, borderRadius: '0 10px 10px 0', padding: '16px 20px', display: 'grid', gridTemplateColumns: '1fr auto', gap: '20px', alignItems: 'center', transition: 'all 0.15s' }}>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: sel ? T.text : T.text, marginBottom: '3px' }}>{opp.name}</div>
                        <div style={{ fontSize: '12px', color: T.text2, lineHeight: 1.5 }}>{opp.problem}</div>
                        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                          <span style={{ fontSize: '10px', color: T.teal, fontFamily: T.mono, background: `${T.teal}12`, padding: '2px 8px', borderRadius: '4px' }}>{opp.timeline}</span>
                          <span style={{ fontSize: '10px', color: T.text2, fontFamily: T.mono }}>{opp.roi}x ROI</span>
                          <span style={{ fontSize: '10px', color: T.text2, fontFamily: T.mono }}>Data: {opp.dataReadinessPct}%</span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: '24px', fontWeight: 700, color: T.green, fontFamily: T.serif }}>{fmt(opp.annualValue)}</div>
                        <div style={{ fontSize: '10px', color: T.text2, marginTop: '2px' }}>per year</div>
                        {sel && <div style={{ fontSize: '11px', color: T.teal, marginTop: '6px', fontWeight: 600 }}>Selected ✓</div>}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => selectedOpp && setStep(2)} disabled={!selectedOpp}
                style={{ padding: '13px 36px', borderRadius: '10px', fontSize: '14px', fontWeight: 600, background: selectedOpp ? T.teal : T.border, color: selectedOpp ? T.bg : T.text2, border: 'none', cursor: selectedOpp ? 'pointer' : 'not-allowed', fontFamily: T.sans }}>
                Confirm Baseline →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Confirm Baseline ────────────────────────────────────── */}
        {step === 2 && selectedOpp && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <h1 style={{ fontSize: '22px', fontWeight: 600, color: T.text, fontFamily: T.serif, marginBottom: '6px' }}>Confirm baseline</h1>
              <p style={{ fontSize: '13px', color: T.text2 }}>Auto-populated from {clientName} loaded data. These numbers lock at engagement start.</p>
            </div>

            {/* Selected initiative */}
            <div style={{ background: `${T.teal}08`, border: `1px solid ${T.teal}30`, borderLeft: `4px solid ${T.teal}`, borderRadius: '0 10px 10px 0', padding: '16px 20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
              <div>
                <div style={{ fontSize: '10px', color: T.teal, fontFamily: T.mono, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Selected Initiative</div>
                <div style={{ fontSize: '16px', fontWeight: 600, color: T.text }}>{selectedOpp.name}</div>
                <div style={{ fontSize: '12px', color: T.text2, marginTop: '2px' }}>{selectedOpp.problem}</div>
              </div>
              <button onClick={() => setStep(1)} style={{ fontSize: '12px', color: T.teal, background: 'transparent', border: `1px solid ${T.teal}40`, borderRadius: '6px', padding: '5px 12px', cursor: 'pointer', fontFamily: T.sans, whiteSpace: 'nowrap', flexShrink: 0 }}>
                Change →
              </button>
            </div>

            {/* Baseline grid */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '12px', padding: '24px', marginBottom: '20px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: T.teal, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '20px' }}>Baseline — locked before engagement starts</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                {[
                  { label: 'Annual Value Opportunity', value: fmt(selectedOpp.annualValue), confidence: 88, note: 'Based on peer benchmarks' },
                  { label: 'Required Investment', value: fmt(selectedOpp.investment), confidence: 82, note: 'Implementation + change mgmt' },
                  { label: 'Timeline to Value', value: selectedOpp.timeline, confidence: 90, note: 'Median peer deployment' },
                  { label: 'Data Readiness', value: selectedOpp.dataReadinessPct + '%', confidence: selectedOpp.dataReadinessPct, note: selectedOpp.dataReadinessPct >= 80 ? 'Ready to proceed' : 'Gaps identified — see Diagnose' },
                  { label: 'AI Approach', value: selectedOpp.aiApproach, confidence: 85, note: 'Recommended architecture' },
                  { label: 'Complexity', value: selectedOpp.complexity ? selectedOpp.complexity.charAt(0).toUpperCase() + selectedOpp.complexity.slice(1) : 'Medium', confidence: 88, note: 'Implementation complexity' },
                ].map((item, i) => (
                  <div key={i} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: '10px', padding: '16px' }}>
                    <div style={{ fontSize: '10px', color: T.teal, fontWeight: 700, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>{item.label}</div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: T.text, marginBottom: '8px', fontFamily: i <= 1 ? T.serif : T.sans }}>{item.value}</div>
                    <div style={{ fontSize: '10px', color: T.text2, marginBottom: '8px' }}>{item.note}</div>
                    {/* Confidence bar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ flex: 1, height: '3px', background: T.border, borderRadius: '2px' }}>
                        <div style={{ height: '3px', borderRadius: '2px', width: `${item.confidence}%`, background: item.confidence >= 80 ? T.green : T.amber, transition: 'width 0.6s ease' }} />
                      </div>
                      <span style={{ fontSize: '9px', color: item.confidence >= 80 ? T.green : T.amber, fontFamily: T.mono, fontWeight: 700 }}>{item.confidence}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Genome note */}
            <div style={{ background: `${T.indigo}08`, border: `1px solid ${T.indigo}25`, borderRadius: '10px', padding: '14px 18px', marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ fontSize: '14px', flexShrink: 0 }}>🧬</div>
              <div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: T.indigo, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>From Genome · {selectedOpp.roi}x average ROI at comparable organizations</div>
                <div style={{ fontSize: '12px', color: T.text2, lineHeight: 1.6 }}>
                  Organizations your profile achieved this initiative&apos;s baseline outcome in {selectedOpp.timeline} on average. Data readiness is the primary success factor — your {selectedOpp.dataReadinessPct}% score {selectedOpp.dataReadinessPct >= 75 ? 'is above the median' : 'suggests preparation work before launch'}.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={() => setStep(1)} style={{ padding: '12px 24px', borderRadius: '10px', background: T.surface, color: T.text2, border: `1px solid ${T.border}`, fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: T.sans }}>← Back</button>
              <button onClick={() => setStep(3)} style={{ padding: '13px 36px', borderRadius: '10px', background: T.teal, color: T.bg, border: 'none', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: T.sans }}>Set Target →</button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Set Target ──────────────────────────────────────────── */}
        {step === 3 && selectedOpp && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <h1 style={{ fontSize: '22px', fontWeight: 600, color: T.text, fontFamily: T.serif, marginBottom: '6px' }}>Set your target scenario</h1>
              <p style={{ fontSize: '13px', color: T.text2 }}>AbarVa calibrates targets from {selectedOpp.roi}x median peer ROI for this initiative type. Choose your planning scenario.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
              {SCENARIOS.map(s => {
                const active = scenario === s.id
                const projected = selectedOpp.annualValue * s.mult
                return (
                  <button key={s.id} onClick={() => setScenario(s.id)}
                    style={{ padding: '0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                    <div style={{ border: `2px solid ${active ? s.accent : T.border}`, background: active ? `${s.accent}08` : T.surface, borderRadius: '12px', padding: '24px', transition: 'all 0.15s', height: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: active ? s.accent : T.text2, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</div>
                        {active && <span style={{ fontSize: '10px', color: s.accent, background: `${s.accent}15`, padding: '2px 8px', borderRadius: '10px', fontFamily: T.mono, fontWeight: 700 }}>Selected</span>}
                      </div>
                      <div style={{ fontSize: '36px', fontWeight: 700, color: s.accent, fontFamily: T.serif, marginBottom: '6px', lineHeight: 1 }}>{fmt(projected)}</div>
                      <div style={{ fontSize: '12px', color: T.text2, marginBottom: '8px' }}>per year</div>
                      <div style={{ height: '1px', background: T.border, marginBottom: '12px' }} />
                      <div style={{ fontSize: '11px', color: T.text2, lineHeight: 1.5 }}>{s.desc}</div>
                      <div style={{ fontSize: '11px', color: T.text2, marginTop: '6px' }}>
                        <span style={{ color: active ? s.accent : T.text2, fontWeight: 600 }}>{(s.mult * 100).toFixed(0)}%</span> of base case · {fmt(selectedOpp.investment)} investment
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Scenario comparison bar */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '10px', padding: '20px', marginBottom: '24px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: T.text2, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>3-Year Scenario Comparison</div>
              {SCENARIOS.map(s => {
                const pct = (s.mult / 1.3) * 100
                return (
                  <div key={s.id} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 80px', gap: '12px', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ fontSize: '11px', fontWeight: scenario === s.id ? 700 : 400, color: scenario === s.id ? s.accent : T.text2, fontFamily: T.mono }}>{s.label}</div>
                    <div style={{ height: '6px', background: T.border, borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '6px', borderRadius: '3px', width: `${pct}%`, background: s.accent, opacity: scenario === s.id ? 1 : 0.35 }} />
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: s.accent, textAlign: 'right', fontFamily: T.mono }}>{fmt(selectedOpp.annualValue * s.mult * 3)}</div>
                  </div>
                )
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={() => setStep(2)} style={{ padding: '12px 24px', borderRadius: '10px', background: T.surface, color: T.text2, border: `1px solid ${T.border}`, fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: T.sans }}>← Back</button>
              <button onClick={() => setStep(4)} style={{ padding: '13px 36px', borderRadius: '10px', background: T.teal, color: T.bg, border: 'none', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: T.sans }}>Generate Business Case →</button>
            </div>
          </div>
        )}

        {/* ── STEP 4: Business Case ───────────────────────────────────────── */}
        {step === 4 && selectedOpp && vals && (
          <div>
            {/* Hero */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '16px', padding: '32px 36px', marginBottom: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: T.teal, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: '10px' }}>
                  Business Case · {clientName}
                </div>
                <div style={{ fontSize: '28px', fontFamily: T.serif, fontWeight: 500, color: T.text, lineHeight: 1.3, marginBottom: '10px' }}>
                  {selectedOpp.name}
                </div>
                <div style={{ fontSize: '13px', color: T.text2, lineHeight: 1.6, marginBottom: '16px' }}>
                  {selectedOpp.problem}
                </div>
                {/* Scenario toggle */}
                <div style={{ display: 'flex', gap: '4px', background: T.bg, border: `1px solid ${T.border}`, borderRadius: '8px', padding: '3px', width: 'fit-content' }}>
                  {SCENARIOS.map(s => (
                    <button key={s.id} onClick={() => setScenario(s.id)}
                      style={{ padding: '6px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', border: 'none', fontFamily: T.sans, background: scenario === s.id ? s.accent : 'transparent', color: scenario === s.id ? T.bg : T.text2, transition: 'all 0.15s' }}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                {[
                  { label: 'Annual Value', value: vals.annualVal, fmt: fmt, color: T.green, note: `${scenario} scenario` },
                  { label: 'Investment Required', value: vals.invest, fmt: fmt, color: T.indigo, note: 'One-time' },
                  { label: '3-Year Net Benefit', value: vals.net3yr, fmt: fmt, color: T.teal, note: 'After investment' },
                  { label: 'Payback Period', value: vals.payback, fmt: fmtMo, color: T.amber, note: 'Months to breakeven', noSign: true },
                ].map((m, i) => (
                  <div key={i} style={{ background: T.bg, border: `1px solid ${T.border}`, borderTop: `3px solid ${m.color}`, borderRadius: '0 0 10px 10px', padding: '16px' }}>
                    <div style={{ fontSize: '9px', fontWeight: 700, color: T.text2, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>{m.label}</div>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: T.text, fontFamily: T.serif, lineHeight: 1 }}>
                      <Counter target={m.value} prefix={(m as any).noSign ? '' : '$'} suffix={(m as any).noSign ? ' mo' : ''} />
                    </div>
                    <div style={{ fontSize: '10px', color: T.text2, marginTop: '4px' }}>{m.note}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial model + chart side by side */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>

              {/* Year-by-year table */}
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '12px', padding: '24px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: T.teal, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>Year-by-Year Financial Model</div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>{['', 'Year 1', 'Year 2', 'Year 3'].map((h, i) => (
                      <th key={i} style={{ padding: '8px 0', fontSize: '10px', fontWeight: 700, fontFamily: T.mono, color: T.teal, textTransform: 'uppercase', letterSpacing: '0.06em', background: 'transparent', textAlign: i === 0 ? 'left' : 'right', borderBottom: `1px solid ${T.border}` }}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {[
                      { label: 'Value Captured', y1: vals.annualVal * 0.35, y2: vals.annualVal * 0.75, y3: vals.annualVal, color: T.green },
                      { label: 'Investment', y1: vals.invest * 0.5, y2: vals.invest * 0.35, y3: vals.invest * 0.15, color: T.indigo },
                      { label: 'Net Benefit', y1: vals.annualVal * 0.35 - vals.invest * 0.5, y2: vals.annualVal * 0.75 - vals.invest * 0.35, y3: vals.annualVal - vals.invest * 0.15, color: null },
                    ].map((row, ri) => (
                      <tr key={ri}>
                        <td style={{ padding: '10px 0', fontSize: '12px', fontWeight: 500, color: T.text2, borderBottom: `1px solid ${T.border}` }}>{row.label}</td>
                        {[row.y1, row.y2, row.y3].map((val, ci) => (
                          <td key={ci} style={{ padding: '10px 0', fontSize: '13px', fontWeight: 700, fontFamily: T.mono, color: T.text, textAlign: 'right', borderBottom: `1px solid ${T.border}` }}>
                            {val < 0 ? '-' + fmt(Math.abs(val)) : fmt(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ marginTop: '14px', fontSize: '10px', color: T.text2, lineHeight: 1.6 }}>
                  Year 1 value capture: 35% · Year 2: 75% · Year 3: 100% — standard ramp curve from {selectedOpp.roi}x ROI Genome data.
                </div>
              </div>

              {/* Waterfall chart */}
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '12px', padding: '24px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: T.teal, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>Cumulative Net Benefit</div>
                {(() => {
                  const y1net = vals.annualVal * 0.35 - vals.invest * 0.5
                  const y2net = y1net + (vals.annualVal * 0.75 - vals.invest * 0.35)
                  const y3net = y2net + (vals.annualVal - vals.invest * 0.15)
                  const maxAbs = Math.max(Math.abs(y1net), Math.abs(y2net), y3net)
                  const zero = maxAbs > 0 ? Math.abs(Math.min(y1net, 0)) / maxAbs : 0.3
                  const barH = 120
                  const bars = [
                    { label: 'Y1', val: y1net, color: y1net < 0 ? T.red : T.green },
                    { label: 'Y2', val: y2net, color: y2net < 0 ? T.red : T.green },
                    { label: 'Y3', val: y3net, color: T.teal },
                  ]
                  return (
                    <div>
                      <svg viewBox={`0 0 280 ${barH + 30}`} style={{ width: '100%', overflow: 'visible' }}>
                        {/* zero line */}
                        <line x1="0" y1={barH * zero} x2="280" y2={barH * zero} stroke={T.border} strokeWidth="1" />
                        {bars.map((b, i) => {
                          const pct = maxAbs > 0 ? Math.abs(b.val) / maxAbs : 0
                          const barPx = pct * barH * 0.85
                          const y = b.val < 0 ? barH * zero : barH * zero - barPx
                          const x = 20 + i * 80
                          return (
                            <g key={i}>
                              <rect x={x} y={y} width="52" height={barPx} fill={b.color} opacity="0.85" rx="3" />
                              <text x={x + 26} y={barH + 16} textAnchor="middle" fontSize="10" fill={T.text2} fontFamily="monospace">{b.label}</text>
                              <text x={x + 26} y={b.val < 0 ? y + barPx + 14 : y - 5} textAnchor="middle" fontSize="9" fill={b.color} fontFamily="monospace" fontWeight="bold">
                                {b.val < 0 ? '-' + fmt(Math.abs(b.val)) : fmt(b.val)}
                              </text>
                            </g>
                          )
                        })}
                      </svg>
                      <div style={{ fontSize: '10px', color: T.text2, marginTop: '8px' }}>Cumulative net benefit · payback at {fmtMo(vals.payback)}</div>
                    </div>
                  )
                })()}
              </div>
            </div>

            {/* Intelligence & Risk */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>

              {/* AbarVa Intelligence */}
              <div style={{ background: `${T.teal}06`, border: `1px solid ${T.teal}25`, borderRadius: '12px', padding: '20px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: T.teal, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>AbarVa Intelligence · What the CFO will ask</div>
                {[
                  { q: 'Why this investment, why now?', a: `${selectedOpp.annualValue > 20_000_000 ? 'This is a top-5 value opportunity' : 'Peers are already executing this'} — delay costs ${fmt(selectedOpp.annualValue / 12)} per month in uncaptured value.` },
                  { q: 'What if it underperforms?', a: `Conservative scenario delivers ${fmt(selectedOpp.annualValue * 0.6)} — still ${(selectedOpp.annualValue * 0.6 / selectedOpp.investment).toFixed(1)}x return. Floor is positive.` },
                  { q: 'When do we see real money?', a: `Year 1 value capture begins at ${fmt(selectedOpp.annualValue * 0.35)}. Payback in ${fmtMo(vals.payback)}.` },
                ].map((item, i) => (
                  <div key={i} style={{ borderBottom: i < 2 ? `1px solid ${T.teal}15` : 'none', paddingBottom: i < 2 ? '10px' : '0', marginBottom: i < 2 ? '10px' : '0' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: T.text, marginBottom: '3px' }}>{item.q}</div>
                    <div style={{ fontSize: '11px', color: T.text2, lineHeight: 1.5 }}>{item.a}</div>
                  </div>
                ))}
              </div>

              {/* Risk factors */}
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '12px', padding: '20px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: T.text2, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>Risk Factors · From Genome</div>
                {[
                  { label: 'Data readiness', score: selectedOpp.dataReadinessPct, threshold: 75, risk: selectedOpp.dataReadinessPct >= 75 ? 'LOW' : 'MEDIUM', note: selectedOpp.dataReadinessPct >= 75 ? 'Above threshold' : 'Gaps require attention' },
                  { label: 'Program complexity', score: selectedOpp.complexity === 'high' ? 45 : selectedOpp.complexity === 'medium' ? 72 : 88, threshold: 60, risk: selectedOpp.complexity === 'high' ? 'HIGH' : selectedOpp.complexity === 'medium' ? 'MEDIUM' : 'LOW', note: selectedOpp.complexity === 'high' ? 'Requires CDO sponsorship' : 'Standard governance sufficient' },
                  { label: 'Vendor selection', score: 78, threshold: 70, risk: 'LOW', note: 'Vendor landscape well-mapped' },
                  { label: 'Change management', score: 68, threshold: 65, risk: 'MEDIUM', note: 'Plan required at kickoff' },
                ].map((item, i) => {
                  const riskColor = item.risk === 'LOW' ? T.green : item.risk === 'MEDIUM' ? T.amber : T.red
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: i < 3 ? '10px' : '0' }}>
                      <span style={{ fontSize: '9px', fontWeight: 700, color: riskColor, background: `${riskColor}15`, padding: '2px 7px', borderRadius: '10px', fontFamily: T.mono, whiteSpace: 'nowrap', flexShrink: 0 }}>{item.risk}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '11px', fontWeight: 500, color: T.text, marginBottom: '2px' }}>{item.label}</div>
                        <div style={{ fontSize: '10px', color: T.text2 }}>{item.note}</div>
                      </div>
                      <div style={{ width: '40px', height: '3px', background: T.border, borderRadius: '2px', flexShrink: 0 }}>
                        <div style={{ height: '3px', borderRadius: '2px', width: `${item.score}%`, background: riskColor }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button onClick={() => setStep(3)} style={{ padding: '12px 24px', borderRadius: '10px', background: T.surface, color: T.text2, border: `1px solid ${T.border}`, fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: T.sans }}>← Back</button>
              <div style={{ display: 'flex', gap: '10px' }}>
                <a href={'/scenarios?client=' + activeClient} style={{ padding: '12px 20px', borderRadius: '10px', background: `${T.indigo}15`, color: T.indigo, border: `1px solid ${T.indigo}30`, fontSize: '13px', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', fontFamily: T.sans }}>
                  Run Scenario Analysis →
                </a>
                <button onClick={() => setStep(5)} style={{ padding: '13px 36px', borderRadius: '10px', background: T.teal, color: T.bg, border: 'none', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: T.sans }}>
                  Export Business Case →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 5: Export ──────────────────────────────────────────────── */}
        {step === 5 && selectedOpp && vals && (
          <div>
            {/* Summary card */}
            <div style={{ background: T.surface, border: `1px solid ${T.teal}30`, borderTop: `4px solid ${T.teal}`, borderRadius: '0 0 16px 16px', padding: '36px 40px', marginBottom: '24px', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: T.teal, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: '10px' }}>Business Case Complete</div>
              <div style={{ fontSize: '52px', fontWeight: 700, color: T.text, fontFamily: T.serif, lineHeight: 1, marginBottom: '8px' }}>{fmt(vals.annualVal)}</div>
              <div style={{ fontSize: '16px', color: T.text2, marginBottom: '6px' }}>annual value · {scenario} scenario</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', marginTop: '20px', flexWrap: 'wrap' }}>
                {[
                  { label: 'ROI', value: vals.roi.toFixed(1) + 'x' },
                  { label: 'Payback', value: fmtMo(vals.payback) },
                  { label: '3-Year Net', value: fmt(vals.net3yr) },
                  { label: 'Investment', value: fmt(vals.invest) },
                ].map((m, i) => (
                  <div key={i} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: T.text, fontFamily: T.serif }}>{m.value}</div>
                    <div style={{ fontSize: '10px', color: T.text2, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '2px' }}>{m.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: '12px', color: T.text2, marginTop: '20px', borderTop: `1px solid ${T.border}`, paddingTop: '14px' }}>
                What McKinsey charges $1–2M to produce — AbarVa generated this from your actual data in minutes.
              </div>
            </div>

            {/* Export formats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
              {[
                { title: 'Executive Summary', desc: '4-page board brief. Problem, solution, ROI, risk mitigations, ask.', format: 'PDF', color: T.red, icon: '📄' },
                { title: 'Financial Model', desc: 'Full 3-scenario model with sensitivity analysis and assumptions log.', format: 'XLSX', color: T.green, icon: '📊' },
                { title: 'Implementation Plan', desc: 'Phase-gate timeline with milestones, owners, and success criteria.', format: 'PDF', color: T.indigo, icon: '🗂' },
              ].map((exp, i) => (
                <div key={i} style={{ background: T.surface, border: `1px solid ${T.border}`, borderTop: `3px solid ${exp.color}`, borderRadius: '0 0 12px 12px', padding: '20px' }}>
                  <div style={{ fontSize: '18px', marginBottom: '8px' }}>{exp.icon}</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: T.text, marginBottom: '4px' }}>{exp.title}</div>
                  <div style={{ fontSize: '10px', fontWeight: 700, fontFamily: T.mono, color: T.text2, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{exp.format}</div>
                  <div style={{ fontSize: '11px', color: T.text2, lineHeight: 1.5, marginBottom: '16px' }}>{exp.desc}</div>
                  <button style={{ width: '100%', padding: '10px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', border: `1px solid ${T.border}`, background: 'transparent', color: T.teal, fontFamily: T.sans }}>
                    Download {exp.format} →
                  </button>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={() => setStep(4)} style={{ padding: '12px 24px', borderRadius: '10px', background: T.surface, color: T.text2, border: `1px solid ${T.border}`, fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: T.sans }}>← Back</button>
              <div style={{ display: 'flex', gap: '12px' }}>
                <a href={`/vendor-intelligence?client=${activeClient}`} style={{ padding: '12px 24px', borderRadius: '10px', background: 'transparent', color: T.teal, textDecoration: 'none', fontSize: '13px', fontWeight: 600, border: `1px solid ${T.border}`, fontFamily: T.sans }}>
                  Select Vendor →
                </a>
                <a href="/" style={{ padding: '12px 24px', borderRadius: '10px', background: T.teal, color: T.bg, textDecoration: 'none', fontSize: '14px', fontWeight: 600, fontFamily: T.sans }}>
                  ✓ Done
                </a>
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
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#060A12', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"DM Sans", sans-serif', color: 'rgba(255,255,255,0.75)' }}>Loading...</div>}>
      <JustifyContent />
    </Suspense>
  )
}
