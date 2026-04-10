'use client'
import { useUser } from '@clerk/nextjs'
import { useState, useEffect, useRef } from 'react'
import AbarvaNav from '@/components/AbarvaNav'
import { meridianHealth } from '@/data/meridian/index'
import { firstCapital } from '@/data/firstcapital/index'
import { apexRetail } from '@/data/apexretail/index'
import { regulatoryAlerts } from '@/data/knowledge/regulatory'
import { meridianAI } from '@/data/meridian/ai'
import { firstCapitalAI } from '@/data/firstcapital/ai'
import { apexRetailAI } from '@/data/apexretail/ai'

const S = {
  page: { minHeight: '100vh', backgroundColor: '#F8FAFC', backgroundImage: 'radial-gradient(circle, #E5E7EB 1px, transparent 1px)', backgroundSize: '24px 24px', fontFamily: 'Inter, -apple-system, sans-serif' } as React.CSSProperties,
  card: { background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '24px' } as React.CSSProperties,
  lbl: { fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '16px' } as React.CSSProperties,
}

export default function Home() {
  const { user } = useUser()
  const [clientId, setClientId] = useState('meridian')
  const [selectorOpen, setSelectorOpen] = useState(false)
  const [animProgress, setAnimProgress] = useState(0)
  const animRafRef = useRef<number | null>(null)

  useEffect(() => {
    if (animRafRef.current) cancelAnimationFrame(animRafRef.current)
    setAnimProgress(0)
    const t0 = performance.now()
    const dur = 1800
    const tick = (now: number) => {
      const p = Math.min((now - t0) / dur, 1)
      setAnimProgress(1 - Math.pow(1 - p, 3))
      if (p < 1) animRafRef.current = requestAnimationFrame(tick)
      else animRafRef.current = null
    }
    animRafRef.current = requestAnimationFrame(tick)
    return () => { if (animRafRef.current) cancelAnimationFrame(animRafRef.current) }
  }, [clientId])

  function animVal(raw: string): string {
    const m = raw.match(/^(\$?)(\d+\.?\d*)(.*)$/)
    if (!m) return raw
    const num = parseFloat(m[2])
    if (num > 999) return raw
    const cur = num * animProgress
    const str = m[2].includes('.') ? cur.toFixed(1) : String(Math.round(cur))
    return m[1] + str + m[3]
  }

  function getData() {
    if (clientId === 'firstcapital') return {
      name: 'First Capital Financial', industry: 'Financial Services', confidence: 88,
      metrics: [
        { label: 'Cost-to-Income', value: firstCapital.financials.costToIncomeRatio + '%', sub: 'Target: 55%', status: 'red' as const },
        { label: 'Digital Adoption', value: firstCapital.technology.digital.digitalAdoptionRate + '%', sub: 'Benchmark: 67%', status: 'red' as const },
        { label: 'Core Banking Age', value: firstCapital.technology.coreBanking.age + ' yrs', sub: 'Critical: 20 yrs', status: 'red' as const },
        { label: 'FedNow Live', value: 'No', sub: '68% of peers live', status: 'red' as const },
        { label: 'AML False Positives', value: '94%', sub: 'Target: <60%', status: 'red' as const },
        { label: 'Mobile App Rating', value: '2.8★', sub: 'Peers: 4.4★', status: 'red' as const },
        { label: 'Account Abandonment', value: '67%', sub: 'Target: <30%', status: 'red' as const },
        { label: 'OCC MRAs', value: '3 Open', sub: 'Target: 0', status: 'red' as const },
      ],
      findings: firstCapital.contradictions.slice(0, 3),
      alerts: regulatoryAlerts.firstcapital.slice(0, 3),
      aiScore: firstCapitalAI.maturity.dataReadiness.overall,
    }
    if (clientId === 'apexretail') return {
      name: 'Apex Retail Group', industry: 'Retail', confidence: 86,
      metrics: [
        { label: 'Operating Margin', value: apexRetail.org.operatingMargin + '%', sub: 'Target: ' + apexRetail.org.targetOperatingMargin + '%', status: 'red' as const },
        { label: 'Cart Abandonment', value: '71%', sub: 'Benchmark: 58%', status: 'red' as const },
        { label: 'Loyalty Active', value: apexRetail.financials.loyaltyMemberPercent + '%', sub: 'Benchmark: 68%', status: 'red' as const },
        { label: 'Forecast Accuracy', value: '61%', sub: 'Target: 85%', status: 'red' as const },
        { label: 'Einstein Activated', value: 'No', sub: '$4.2M license unused', status: 'red' as const },
        { label: 'Inventory Accuracy', value: apexRetail.financials.inventoryTurnover + 'x', sub: 'Benchmark: 6.8x', status: 'red' as const },
        { label: 'Shrinkage Rate', value: '2.8%', sub: 'Benchmark: 1.5%', status: 'red' as const },
        { label: 'SAP Support Ends', value: '2027', sub: '18 months to migrate', status: 'red' as const },
      ],
      findings: apexRetail.contradictions.slice(0, 3),
      alerts: regulatoryAlerts.apexretail.slice(0, 3),
      aiScore: apexRetailAI.maturity.dataReadiness.overall,
    }
    return {
      name: 'Meridian Health System', industry: 'Healthcare', confidence: 94,
      metrics: [
        { label: 'Operating Margin', value: meridianHealth.org.operatingMargin + '%', sub: 'Target: 4.0%', status: 'red' as const },
        { label: 'RCM Denial Rate', value: meridianHealth.technology.rcm.denialRate + '%', sub: 'Benchmark: 11.4%', status: 'red' as const },
        { label: 'Epic Optimization', value: meridianHealth.technology.ehr.optimizationScore + '/100', sub: 'Target: 85/100', status: 'amber' as const },
        { label: 'MA Star Rating', value: String(meridianHealth.healthPlan.medicareAdvantage.starRating), sub: '$34M bonus below 4.0', status: 'amber' as const },
        { label: 'Prior Auth Connected', value: '23%', sub: 'Peers: 62% automated', status: 'red' as const },
        { label: 'Travel Nurse Cost', value: '$48M', sub: 'Target: $28M', status: 'red' as const },
        { label: 'CDO Status', value: 'Vacant', sub: '14 months unfilled', status: 'red' as const },
        { label: 'AI Pilots Scaled', value: '0 / 6', sub: 'All stalled at pilot', status: 'red' as const },
      ],
      findings: meridianHealth.contradictions.slice(0, 3),
      alerts: regulatoryAlerts.meridian.slice(0, 3),
      aiScore: meridianAI.maturity.dataReadiness.overall,
    }
  }

  const data = getData()
  const sc: Record<string, string> = { red: '#DC2626', yellow: '#D97706', amber: '#D97706', green: '#059669' }

  const cats = [
    { name: 'Financial', pct: clientId === 'meridian' ? 85 : clientId === 'firstcapital' ? 82 : 80 },
    { name: 'Technology', pct: clientId === 'meridian' ? 78 : clientId === 'firstcapital' ? 74 : 76 },
    { name: 'Operations', pct: clientId === 'meridian' ? 72 : clientId === 'firstcapital' ? 68 : 70 },
    { name: 'Leadership', pct: clientId === 'meridian' ? 84 : 80 },
    { name: 'AI Maturity', pct: data.aiScore },
    { name: 'Vendors', pct: clientId === 'meridian' ? 45 : 44 },
  ]

  const products = [
    { id: 'diagnose', name: 'Diagnose', tagline: 'Know your situation in 48 hours, not 6 months', href: '/diagnose?client=' + clientId, btnColor: '#1B4FD8', icon: '⚡' },
    { id: 'ai-strategy', name: 'AI Strategy', tagline: 'Enterprise AI strategy in 2 hours, not 6 months', href: '/ai-strategy?client=' + clientId, btnColor: '#6D28D9', icon: '◈' },
    { id: 'justify', name: 'Justify', tagline: 'Board-ready business case in 30 minutes, not 8 weeks', href: '/justify?client=' + clientId, btnColor: '#047857', icon: '$' },
    { id: 'select', name: 'Select', tagline: 'Vendor selection and negotiation in days, not months', href: '/select?client=' + clientId, btnColor: '#B45309', icon: '◎' },
    { id: 'domain-strategy', name: 'Domain Strategy', tagline: 'Deep-dive AI strategy by business domain', href: '/domain-strategy?client=' + clientId, btnColor: '#0369A1', icon: '⬡' },
    { id: 'scenarios', name: 'Scenario Modeling', tagline: 'Change assumptions. See the impact. Decide faster.', href: '/scenarios?client=' + clientId, btnColor: '#DC2626', icon: '⊞' },
  ]

  return (
    <div style={S.page}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes redPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(220,38,38,0); }
          50% { box-shadow: 0 0 0 5px rgba(220,38,38,0.13); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .m-red { animation: redPulse 3s ease-in-out infinite; }
        .fade-up { animation: fadeUp 0.45s ease-out both; }
      ` }} />
      <AbarvaNav clientId={clientId} onClientChange={setClientId} activePage="home" />
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '28px 32px' }}>

        {/* Header */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Good morning, {user?.firstName || 'Maestro'}.</div>
          <div style={{ fontSize: '14px', color: '#6B7280' }}>{data.name} · {data.industry} · {data.confidence}% data confidence</div>
        </div>

        {/* Client Selector */}
        <div style={{ position: 'relative', display: 'inline-block', marginBottom: '16px' }}>
          <div onClick={() => setSelectorOpen(o => !o)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 14px', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#0F172A', userSelect: 'none' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: clientId === 'meridian' ? '#2563EB' : clientId === 'firstcapital' ? '#7C3AED' : '#059669', display: 'block', flexShrink: 0 }} />
            Viewing: {data.name}
            <span style={{ fontSize: '10px', color: '#9CA3AF', marginLeft: '2px' }}>{selectorOpen ? '▴' : '▾'}</span>
          </div>
          {selectorOpen && (
            <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '4px', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '6px', zIndex: 50, boxShadow: '0 8px 24px rgba(0,0,0,0.08)', minWidth: '220px' }}>
              {([
                { id: 'meridian', name: 'Meridian Health', sub: 'Healthcare', color: '#2563EB' },
                { id: 'firstcapital', name: 'First Capital', sub: 'Financial Services', color: '#7C3AED' },
                { id: 'apexretail', name: 'Apex Retail', sub: 'Retail', color: '#059669' },
              ] as { id: string; name: string; sub: string; color: string }[]).map(c => (
                <div key={c.id} onClick={() => { setClientId(c.id); setSelectorOpen(false) }}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', background: clientId === c.id ? '#F8FAFC' : 'transparent' }}
                  onMouseEnter={e => { if (clientId !== c.id) (e.currentTarget as HTMLElement).style.background = '#F8FAFC' }}
                  onMouseLeave={e => { if (clientId !== c.id) (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: c.color, display: 'block', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>{c.name}</div>
                    <div style={{ fontSize: '11px', color: '#9CA3AF' }}>{c.sub}</div>
                  </div>
                  {clientId === c.id && <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#059669', fontWeight: 700 }}>✓</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Metrics — 4×2 grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '20px' }}>
          {data.metrics.map((m, i) => (
            <div key={clientId + i} className={m.status === 'red' ? 'm-red fade-up' : 'fade-up'}
              style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '14px 16px', height: '88px', boxSizing: 'border-box' as const, cursor: 'pointer', position: 'relative' as const, animationDelay: `${i * 50}ms` }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = '#2563EB'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = '#E2E8F0'}>
              <span style={{ position: 'absolute' as const, top: '10px', right: '10px', width: '6px', height: '6px', borderRadius: '50%', background: sc[m.status], display: 'block' }} />
              <div style={{ fontSize: '10px', color: '#6B7280', marginBottom: '4px', fontWeight: 600, letterSpacing: '0.03em' }}>{m.label}</div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A', lineHeight: 1.1, marginBottom: '3px' }}>{animVal(m.value)}</div>
              <div style={{ fontSize: '11px', color: '#94A3B8' }}>{m.sub}</div>
            </div>
          ))}
        </div>

        {/* Products */}
        <div style={S.lbl}>PRODUCTS</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
          {products.map(p => (
            <a key={p.id} href={p.href} style={{ textDecoration: 'none', display: 'flex' }}>
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '20px', height: '140px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', width: '100%', cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(-2px)'; el.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)' }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'none'; el.style.boxShadow = 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '15px', lineHeight: 1 }}>{p.icon}</span>
                  <span style={{ fontSize: '15px', fontWeight: 800, color: '#111827' }}>{p.name}</span>
                </div>
                <div style={{ fontSize: '12px', color: '#6B7280', lineHeight: 1.45, flex: 1, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' as const }}>{p.tagline}</div>
                <div style={{ padding: '0 16px', height: '36px', borderRadius: '6px', background: p.btnColor, color: 'white', fontSize: '12px', fontWeight: 700, textAlign: 'center' as const, marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Launch {p.name} →</div>
              </div>
            </a>
          ))}
        </div>

        {/* CADE proof point */}
        <div style={{ background: '#111827', borderRadius: '12px', padding: '40px 48px', marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#2DD4C8', letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: '6px' }}>Proven in production</div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#E6EDF3', lineHeight: 1.4 }}>Enterprise Healthcare Client · live deployment</div>
            </div>
            <div style={{ display: 'flex', gap: '56px' }}>
              {[
                { value: '40%', label: 'Productivity increase' },
                { value: '60%', label: 'Cost reduction' },
                { value: '94%', label: 'Data confidence' },
              ].map((s, i) => (
                <div key={i} style={{ textAlign: 'center' as const }}>
                  <div style={{ fontSize: '32px', fontWeight: 800, color: '#2DD4C8', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: '4px' }}>{s.value}</div>
                  <div style={{ fontSize: '12px', color: '#6B7280' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom panels */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>

          {/* Findings */}
          <div style={S.card}>
            <div style={S.lbl}>TOP FINDINGS</div>
            {data.findings.map((f, i) => (
              <div key={i} style={{ display: 'flex', gap: '10px', padding: '10px 12px', background: '#FEF2F2', borderRadius: '8px', border: '1px solid #FECACA', alignItems: 'flex-start', marginBottom: '10px' }}>
                <span style={{ color: '#DC2626', fontWeight: 700, fontSize: '12px', flexShrink: 0 }}>{i + 1}</span>
                <span style={{ fontSize: '12px', color: '#374151', lineHeight: 1.5 }}>{f}</span>
              </div>
            ))}
            <a href={'/timeline?client=' + clientId} style={{ display: 'block', marginTop: '4px', padding: '8px', borderRadius: '8px', background: '#0F172A', color: '#F8FAFC', fontSize: '12px', fontWeight: 700, textDecoration: 'none', textAlign: 'center' }}>
              View Decision Timeline →
            </a>
            <a href={'/contradictions?client=' + clientId} style={{ display: 'block', marginTop: '6px', padding: '8px', borderRadius: '8px', background: '#0D1117', color: '#2DD4C8', fontSize: '12px', fontWeight: 700, textDecoration: 'none', textAlign: 'center' }}>
              View Contradiction Map →
            </a>
            <a href={'/diagnose?client=' + clientId} style={{ display: 'block', marginTop: '6px', padding: '8px', borderRadius: '8px', background: '#EFF6FF', color: '#2563EB', fontSize: '12px', fontWeight: 600, textDecoration: 'none', textAlign: 'center' }}>
              Ask Abarva about these →
            </a>
          </div>

          {/* Data Readiness */}
          <div style={S.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={S.lbl}>DATA READINESS</div>
              <span style={{ fontSize: '22px', fontWeight: 700, color: '#2563EB' }}>{Math.round(data.confidence * animProgress)}%</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px 8px' }}>
              {cats.map((cat, i) => {
                const r = 24, circ = 2 * Math.PI * r
                const color = cat.pct >= 70 ? '#059669' : cat.pct >= 50 ? '#D97706' : '#DC2626'
                const offset = circ * (1 - (cat.pct * animProgress) / 100)
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '6px 0' }}>
                    <div style={{ position: 'relative', width: '60px', height: '60px' }}>
                      <svg width="60" height="60" viewBox="0 0 60 60" style={{ transform: 'rotate(-90deg)' }}>
                        <circle cx="30" cy="30" r={r} fill="none" stroke="#F1F5F9" strokeWidth="6" />
                        <circle cx="30" cy="30" r={r} fill="none" stroke={color} strokeWidth="6"
                          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
                      </svg>
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#0F172A' }}>
                        {Math.round(cat.pct * animProgress)}%
                      </div>
                    </div>
                    <div style={{ fontSize: '10px', color: '#475569', fontWeight: 600, textAlign: 'center', lineHeight: 1.2 }}>{cat.name}</div>
                  </div>
                )
              })}
            </div>
            <a href="/admin/data" style={{ display: 'block', marginTop: '12px', padding: '8px', borderRadius: '8px', background: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0', fontSize: '12px', fontWeight: 600, textDecoration: 'none', textAlign: 'center' }}>Manage Data →</a>
          </div>

          {/* Regulatory Alerts */}
          <div style={S.card}>
            <div style={S.lbl}>REGULATORY ALERTS</div>
            {data.alerts.map((alert, i) => (
              <div key={i} style={{ padding: '10px 12px', borderRadius: '8px', background: alert.severity === 'red' ? '#FEF2F2' : '#FFFBEB', border: '1px solid ' + (alert.severity === 'red' ? '#FECACA' : '#FDE68A'), marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#0F172A' }}>{alert.title}</span>
                  <span style={{ fontSize: '10px', fontWeight: 600, padding: '1px 6px', borderRadius: '10px', background: alert.severity === 'red' ? '#FEE2E2' : '#FEF3C7', color: alert.severity === 'red' ? '#DC2626' : '#D97706', flexShrink: 0, marginLeft: '8px' }}>{alert.monthsRemaining === 0 ? 'Active' : alert.monthsRemaining + 'mo'}</span>
                </div>
                <div style={{ fontSize: '11px', color: '#6B7280', lineHeight: 1.4 }}>{(alert as any).meridianGap || (alert as any).gap || ''}</div>
              </div>
            ))}
            <a href={'/diagnose?client=' + clientId} style={{ display: 'block', padding: '8px', borderRadius: '8px', background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', fontSize: '12px', fontWeight: 600, textDecoration: 'none', textAlign: 'center' }}>Get compliance plan →</a>
          </div>

        </div>
      </div>
    </div>
  )
}
