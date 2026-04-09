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

const STEPS = [{ id: 1, name: 'Requirement' }, { id: 2, name: 'Vendor Options' }, { id: 3, name: 'Compare' }, { id: 4, name: 'Negotiation' }]

const VENDORS = [
  { name: 'Cohere Health', klas: 4.4, cost: '$2.1-3.2M', timeline: '6-9 mo', bestFor: 'Prior auth automation with ML', risk: 'Low', ai: true, peers: ['Advocate Aurora', 'Baylor Scott & White'], recommendation: true },
  { name: 'Waystar AI', klas: 4.1, cost: '$3.0-4.8M', timeline: '9-12 mo', bestFor: 'Integrated RCM and prior auth', risk: 'Medium', ai: true, peers: ['HCA Healthcare', 'CommonSpirit'], recommendation: false },
  { name: 'Olive AI', klas: 3.8, cost: '$4.2-6.0M', timeline: '12-18 mo', bestFor: 'Broad RCM automation', risk: 'High', ai: true, peers: ['Bon Secours', 'Spectrum Health'], recommendation: false },
]

const DIMS = ['TCO (3yr)', 'Implementation Timeline', 'KLAS Score', 'Integration Complexity', 'Vendor Stability', 'Support Model', 'AI/ML Capability', 'Reference Customers']

function score(v: any, dim: string) {
  if (dim === 'KLAS Score') return v.klas ? v.klas + '/5.0' : 'N/A'
  if (dim === 'AI/ML Capability') return v.ai ? '★★★★★' : '★★★☆☆'
  if (dim === 'Reference Customers') return v.peers?.join(', ')
  const m: Record<string, string> = { Low: '★★★★★', Medium: '★★★★☆', High: '★★★☆☆' }
  return m[v.risk] || '★★★☆☆'
}

const CLIENT_NOTES: Record<string, string[]> = {
  meridian: ['You have $8M in enforceable Ensemble SLA penalties — use as leverage', 'Mention you are evaluating Cohere, Waystar, and Olive — all want this deal', 'CDO role is vacant — negotiate vendor implementation leadership as part of the deal', 'Implementation team must have prior Epic integration experience'],
  firstcapital: ['FIS HORIZON constraint is known — vendor must have HORIZON reference clients', '3 OCC MRAs in progress — new vendor must not add compliance risk', 'Mention you are evaluating core banking modernization — creates urgency', 'Require FedNow go-live within 6 months as contractual milestone'],
  apexretail: ['Einstein is already purchased — use as leverage: We may just activate Einstein instead', 'SAP decision pending — vendor must work with both ECC and S4 HANA', 'Request CDO advisory hours as part of implementation', 'Tie 30% of fees to achieving forecast accuracy targets not just go-live'],
}

function SelectContent() {
  const searchParams = useSearchParams()
  const clientId = searchParams.get('client') || 'meridian'
  const [step, setStep] = useState(1)
  const [activeClient, setActiveClient] = useState(clientId)
  const [selectedInit, setSelectedInit] = useState<string|null>(null)
  const [selectedVendor, setSelectedVendor] = useState<any>(null)

  const clientName = activeClient === 'firstcapital' ? 'First Capital Financial' : activeClient === 'apexretail' ? 'Apex Retail Group' : 'Meridian Health System'
  const ai = activeClient === 'firstcapital' ? firstCapitalAI : activeClient === 'apexretail' ? apexRetailAI : meridianAI
  const wave1Opps = [...ai.opportunities.frontOffice, ...ai.opportunities.middleOffice, ...ai.opportunities.backOffice].filter((o: any) => o.wave === 1).slice(0, 8)
  const recommended = VENDORS.find(v => v.recommendation)

  const StepNav = () => (
    <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E2E8F0', padding: '0 32px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex' }}>
        {STEPS.map(s => (
          <button key={s.id} onClick={() => s.id <= step && setStep(s.id)}
            style={{ padding: '12px 20px', fontSize: '13px', fontWeight: step === s.id ? 600 : 400, color: step === s.id ? '#D97706' : step > s.id ? '#D97706' : '#94A3B8', background: 'none', border: 'none', cursor: s.id <= step ? 'pointer' : 'default', borderBottom: step === s.id ? '2px solid #D97706' : '2px solid transparent', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '20px', height: '20px', borderRadius: '50%', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', background: step === s.id ? '#D97706' : step > s.id ? '#D97706' : '#F1F5F9', color: step === s.id || step > s.id ? 'white' : '#94A3B8' }}>{step > s.id ? '✓' : s.id}</span>
            {s.name}
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <div style={S.page}>
      <AbarvaNav clientId={activeClient} onClientChange={id => { setActiveClient(id); setStep(1); setSelectedInit(null) }} activePage="select" />
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E2E8F0', padding: '0 32px', height: '40px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <a href="/" style={{ fontSize: '13px', color: '#6B7280', textDecoration: 'none' }}>Home</a>
        <span style={{ color: '#D1D5DB' }}>›</span>
        <span style={{ fontSize: '13px', color: '#0F172A', fontWeight: 500 }}>Select</span>
        <span style={{ color: '#D1D5DB' }}>›</span>
        <span style={{ fontSize: '13px', color: '#6B7280' }}>{clientName}</span>
      </div>
      <StepNav />
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px' }}>

        {step === 1 && (
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Define Requirement</h1>
            <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>Abarva surfaces the right vendors for {clientName} context</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
              {wave1Opps.map((opp: any, i: number) => (
                <button key={i} onClick={() => setSelectedInit(opp.name)}
                  style={{ padding: '16px', borderRadius: '10px', textAlign: 'left', cursor: 'pointer', background: selectedInit === opp.name ? '#FFFBEB' : '#FFFFFF', border: `1px solid ${selectedInit === opp.name ? '#D97706' : '#E2E8F0'}`, width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A', marginBottom: '2px' }}>{opp.name}</div>
                      <div style={{ fontSize: '12px', color: '#6B7280' }}>{opp.aiApproach}</div>
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#D97706', flexShrink: 0, marginLeft: '16px' }}>${(opp.annualValue/1000000).toFixed(0)}M value</div>
                  </div>
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => selectedInit && setStep(2)} disabled={!selectedInit} style={{ padding: '12px 32px', borderRadius: '10px', fontSize: '14px', fontWeight: 600, background: selectedInit ? '#D97706' : '#E2E8F0', color: selectedInit ? 'white' : '#94A3B8', border: 'none', cursor: selectedInit ? 'pointer' : 'not-allowed' }}>Find Vendors →</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Vendor Options</h1>
            <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '16px' }}>{selectedInit} · {VENDORS.length} vendors evaluated for {clientName}</p>
            {recommended && (
              <div style={{ ...S.card, marginBottom: '16px', background: '#FFFBEB', border: '2px solid #D97706' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#D97706', textTransform: 'uppercase' as const, marginBottom: '6px' }}>ABARVA RECOMMENDATION</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>{recommended.name} — {recommended.bestFor}</div>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
              {VENDORS.map((v, i) => (
                <div key={i} style={{ ...S.card, border: `1px solid ${v.recommendation ? '#D97706' : '#E2E8F0'}`, background: v.recommendation ? '#FEFCE8' : '#FFFFFF' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>{v.name}</div>
                    {v.recommendation && <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px', background: '#D97706', color: 'white' }}>RECOMMENDED</span>}
                  </div>
                  {[{ label: 'KLAS', value: v.klas + '/5.0' }, { label: 'Cost', value: v.cost }, { label: 'Timeline', value: v.timeline }, { label: 'Risk', value: v.risk }].map((row, ri) => (
                    <div key={ri} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '11px', color: '#94A3B8' }}>{row.label}</span>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>{row.value}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #F1F5F9', fontSize: '11px', color: '#374151' }}>{v.peers?.join(' · ')}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={() => setStep(1)} style={{ padding: '12px 24px', borderRadius: '10px', background: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>← Back</button>
              <button onClick={() => setStep(3)} style={{ padding: '12px 32px', borderRadius: '10px', background: '#D97706', color: 'white', border: 'none', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Compare Vendors →</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Vendor Comparison</h1>
            <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>8-dimension analysis for {clientName}</p>
            <div style={{ ...S.card, overflowX: 'auto', marginBottom: '24px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
                <thead>
                  <tr>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' as const, background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>Dimension</th>
                    {VENDORS.map((v, i) => <th key={i} style={{ padding: '10px 14px', textAlign: 'center', fontSize: '12px', fontWeight: 700, color: v.recommendation ? '#D97706' : '#0F172A', background: v.recommendation ? '#FEFCE8' : '#F8FAFC', borderBottom: '1px solid #E2E8F0', minWidth: '160px' }}>{v.name}{v.recommendation && <div style={{ fontSize: '10px', color: '#D97706' }}>RECOMMENDED</div>}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {DIMS.map((dim, di) => (
                    <tr key={di} style={{ background: di % 2 === 0 ? '#FFFFFF' : '#F8FAFC' }}>
                      <td style={{ padding: '10px 14px', fontSize: '13px', color: '#374151', borderBottom: '1px solid #F1F5F9' }}>{dim}</td>
                      {VENDORS.map((v, vi) => <td key={vi} style={{ padding: '10px 14px', textAlign: 'center', fontSize: '12px', color: '#374151', borderBottom: '1px solid #F1F5F9' }}>{score(v, dim)}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={() => setStep(2)} style={{ padding: '12px 24px', borderRadius: '10px', background: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>← Back</button>
              <button onClick={() => { setSelectedVendor(recommended || VENDORS[0]); setStep(4) }} style={{ padding: '12px 32px', borderRadius: '10px', background: '#D97706', color: 'white', border: 'none', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Get Negotiation Playbook →</button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Negotiation Playbook</h1>
            <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>{(selectedVendor || recommended)?.name} · Specific to {clientName}</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              {[
                { title: 'Pricing Leverage', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0', items: ['Request 15-20% discount off list price — standard for multi-year deals', 'Fixed implementation fee cap — not time-and-materials', 'Year 2-3 pricing locked at CPI — prevent escalation', 'Free training for 10 internal staff included'] },
                { title: 'SLA and Penalty Terms', color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', items: ['99.9% uptime SLA with financial penalties for breach', 'P1 issues resolved in 4 hours not 24', 'Tie 20% of fees to achieving target performance metric', 'Right to terminate with 90 days notice if SLAs missed 2+ quarters'] },
                { title: 'Contract Structure', color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE', items: ['Phase 1 pilot only — do not sign full enterprise deal upfront', 'Data ownership clause — all your data portable on exit', 'Named implementation team committed before signing', 'Most favored nation pricing clause'] },
                { title: 'Walk Away Conditions', color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', items: ['No outcome-based pricing option available', 'Implementation team not named before contract signing', 'No reference customers your size and complexity', 'Proprietary data formats that prevent migration to another vendor'] },
              ].map((section, i) => (
                <div key={i} style={{ ...S.card, background: section.bg, border: `1px solid ${section.border}` }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: section.color, marginBottom: '12px' }}>{section.title}</div>
                  {section.items.map((item, ii) => (
                    <div key={ii} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ color: section.color, flexShrink: 0 }}>→</span>
                      <span style={{ fontSize: '12px', color: '#374151', lineHeight: 1.5 }}>{item}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div style={{ ...S.card, background: '#1E3A5F', marginBottom: '24px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '12px' }}>SPECIFIC TO {clientName.toUpperCase()}</div>
              {(CLIENT_NOTES[activeClient] || CLIENT_NOTES.meridian).map((tip, i) => (
                <div key={i} style={{ display: 'flex', gap: '10px', padding: '10px 12px', background: 'rgba(255,255,255,0.08)', borderRadius: '8px', marginBottom: '8px' }}>
                  <span style={{ color: '#FCD34D', fontWeight: 700, flexShrink: 0 }}>⚡</span>
                  <span style={{ fontSize: '12px', color: '#E2E8F0', lineHeight: 1.5 }}>{tip}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={() => setStep(3)} style={{ padding: '12px 24px', borderRadius: '10px', background: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>← Back</button>
              <a href="/" style={{ padding: '12px 32px', borderRadius: '10px', background: '#D97706', color: 'white', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>✓ Done</a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function SelectPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', color: '#6B7280' }}>Loading...</div>}>
      <SelectContent />
    </Suspense>
  )
}
