'use client'
import { useUser } from '@clerk/nextjs'
import { useState } from 'react'
import AbarvaNav from '@/components/AbarvaNav'
import { meridianHealth } from '@/data/meridian/index'
import { firstCapital } from '@/data/firstcapital/index'
import { apexRetail } from '@/data/apexretail/index'
import { regulatoryAlerts } from '@/data/knowledge/regulatory'
import { meridianAI } from '@/data/meridian/ai'
import { firstCapitalAI } from '@/data/firstcapital/ai'
import { apexRetailAI } from '@/data/apexretail/ai'

const S = {
  page: { minHeight: '100vh', background: '#F8FAFC', fontFamily: 'Inter, -apple-system, sans-serif' } as React.CSSProperties,
  card: { background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '24px' } as React.CSSProperties,
  lbl: { fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '16px' } as React.CSSProperties,
}

export default function Home() {
  const { user } = useUser()
  const [clientId, setClientId] = useState('meridian')

  function getData() {
    if (clientId === 'firstcapital') return {
      name: 'First Capital Financial', industry: 'Financial Services', confidence: 88,
      metrics: [
        { label: 'Cost-to-Income', value: firstCapital.financials.costToIncomeRatio + '%', sub: 'Target: 55% | Benchmark: 61%', status: 'red' as const },
        { label: 'Digital Adoption', value: firstCapital.technology.digital.digitalAdoptionRate + '%', sub: 'Benchmark: 67%', status: 'red' as const },
        { label: 'Core Banking Age', value: firstCapital.technology.coreBanking.age + ' yrs', sub: 'Critical threshold: 20 yrs', status: 'red' as const },
        { label: 'FedNow Live', value: 'No', sub: '68% of peers live', status: 'red' as const },
      ],
      findings: firstCapital.contradictions.slice(0, 3),
      alerts: regulatoryAlerts.firstcapital.slice(0, 3),
      aiScore: firstCapitalAI.maturity.dataReadiness.overall,
    }
    if (clientId === 'apexretail') return {
      name: 'Apex Retail Group', industry: 'Retail', confidence: 86,
      metrics: [
        { label: 'Operating Margin', value: apexRetail.org.operatingMargin + '%', sub: 'Target: ' + apexRetail.org.targetOperatingMargin + '%', status: 'red' as const },
        { label: 'Digital Revenue', value: apexRetail.org.ecommercePercent + '%', sub: 'Target: 45%', status: 'yellow' as const },
        { label: 'Inventory Turnover', value: apexRetail.financials.inventoryTurnover + 'x', sub: 'Benchmark: 6.8x', status: 'red' as const },
        { label: 'Loyalty Active', value: apexRetail.financials.loyaltyMemberPercent + '%', sub: 'Benchmark: 68%', status: 'yellow' as const },
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
        { label: 'Epic Optimization', value: meridianHealth.technology.ehr.optimizationScore + '/100', sub: 'Target: 85/100', status: 'yellow' as const },
        { label: 'MA Star Rating', value: String(meridianHealth.healthPlan.medicareAdvantage.starRating), sub: '$34M bonus below 4.0', status: 'yellow' as const },
      ],
      findings: meridianHealth.contradictions.slice(0, 3),
      alerts: regulatoryAlerts.meridian.slice(0, 3),
      aiScore: meridianAI.maturity.dataReadiness.overall,
    }
  }

  const data = getData()
  const sc: Record<string, string> = { red: '#DC2626', yellow: '#D97706', green: '#059669' }

  const cats = [
    { name: 'Financial', pct: clientId === 'meridian' ? 85 : clientId === 'firstcapital' ? 82 : 80 },
    { name: 'Technology', pct: clientId === 'meridian' ? 78 : clientId === 'firstcapital' ? 74 : 76 },
    { name: 'Operations', pct: clientId === 'meridian' ? 72 : clientId === 'firstcapital' ? 68 : 70 },
    { name: 'Leadership', pct: clientId === 'meridian' ? 84 : 80 },
    { name: 'AI Maturity', pct: data.aiScore },
    { name: 'Vendors', pct: clientId === 'meridian' ? 45 : 44 },
  ]

  const products = [
    { id: 'diagnose', name: 'Diagnose', tagline: 'Know your situation in 48 hours, not 6 months', bullets: ['Role-specific analysis — CIO, CFO, COO, CEO', 'Real benchmark comparisons with exact percentiles', 'Contradictions surfaced automatically'], href: '/diagnose?client=' + clientId, accent: '#2563EB', icon: '⚡', status: 'Ready', sc: '#059669', sb: '#ECFDF5' },
    { id: 'ai-strategy', name: 'AI Strategy', tagline: 'Enterprise AI strategy in 2 hours, not 6 months', bullets: ['Data, tech, and org readiness scores', 'Front, middle, back office opportunity scan', 'Prioritized 18-month roadmap with ROI'], href: '/ai-strategy?client=' + clientId, accent: '#7C3AED', icon: '◈', status: 'Ready', sc: '#059669', sb: '#ECFDF5' },
    { id: 'justify', name: 'Justify', tagline: 'Board-ready business case in 30 minutes, not 8 weeks', bullets: ['Auto-populated baseline from your actual data', 'Conservative, Base, and Optimistic scenarios', 'Export to PDF or Excel'], href: '/justify?client=' + clientId, accent: '#059669', icon: '$', status: 'Ready', sc: '#059669', sb: '#ECFDF5' },
    { id: 'select', name: 'Select', tagline: 'Vendor selection and negotiation in days, not months', bullets: ['KLAS scores and peer reference data', 'Integration complexity with your actual stack', 'Negotiation playbook with specific leverage'], href: '/select?client=' + clientId, accent: '#D97706', icon: '◎', status: 'Ready', sc: '#059669', sb: '#ECFDF5' },
  ]

  return (
    <div style={S.page}>
      <AbarvaNav clientId={clientId} onClientChange={setClientId} activePage="home" />
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px' }}>

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Good morning, {user?.firstName || 'Maestro'}.</div>
          <div style={{ fontSize: '14px', color: '#6B7280' }}>{data.name} · {data.industry} · {data.confidence}% data confidence</div>
        </div>

        {/* Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
          {data.metrics.map((m, i) => (
            <div key={i} style={{ ...S.card, cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = '#2563EB'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = '#E2E8F0'}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: '#6B7280' }}>{m.label}</span>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: sc[m.status], display: 'block', marginTop: '4px' }} />
              </div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>{m.value}</div>
              <div style={{ fontSize: '11px', color: '#94A3B8' }}>{m.sub}</div>
            </div>
          ))}
        </div>

        {/* Products */}
        <div style={S.lbl}>PRODUCTS</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
          {products.map(p => (
            <a key={p.id} href={p.href} style={{ textDecoration: 'none' }}>
              <div style={{ ...S.card, cursor: 'pointer', transition: 'all 0.15s', height: '100%' }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = p.accent; el.style.transform = 'translateY(-2px)'; el.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)' }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#E2E8F0'; el.style.transform = 'none'; el.style.boxShadow = 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: p.accent + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>{p.icon}</div>
                  <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '20px', background: p.sb, color: p.sc }}>{p.status}</span>
                </div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>{p.name}</div>
                <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '12px', lineHeight: 1.5 }}>{p.tagline}</div>
                <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '12px', marginBottom: '16px' }}>
                  {p.bullets.map((b, i) => (
                    <div key={i} style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                      <span style={{ color: p.accent, fontSize: '10px', marginTop: '3px', flexShrink: 0 }}>✓</span>
                      <span style={{ fontSize: '12px', color: '#475569', lineHeight: 1.4 }}>{b}</span>
                    </div>
                  ))}
                </div>
                <div style={{ padding: '8px 16px', borderRadius: '8px', background: p.accent, color: 'white', fontSize: '13px', fontWeight: 600, textAlign: 'center' }}>Launch {p.name} →</div>
              </div>
            </a>
          ))}
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
            <a href={'/diagnose?client=' + clientId} style={{ display: 'block', marginTop: '4px', padding: '8px', borderRadius: '8px', background: '#EFF6FF', color: '#2563EB', fontSize: '12px', fontWeight: 600, textDecoration: 'none', textAlign: 'center' }}>
              Ask Abarva about these →
            </a>
          </div>

          {/* Data Readiness */}
          <div style={S.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={S.lbl}>DATA READINESS</div>
              <span style={{ fontSize: '24px', fontWeight: 700, color: '#2563EB' }}>{data.confidence}%</span>
            </div>
            {cats.map((cat, i) => (
              <div key={i} style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', color: '#475569' }}>{cat.name}</span>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: cat.pct >= 70 ? '#059669' : cat.pct >= 50 ? '#D97706' : '#DC2626' }}>{cat.pct}%</span>
                </div>
                <div style={{ height: '4px', background: '#F1F5F9', borderRadius: '2px' }}>
                  <div style={{ height: '4px', borderRadius: '2px', width: cat.pct + '%', background: cat.pct >= 70 ? '#059669' : cat.pct >= 50 ? '#D97706' : '#DC2626' }} />
                </div>
              </div>
            ))}
            <a href="/admin/data" style={{ display: 'block', marginTop: '16px', padding: '8px', borderRadius: '8px', background: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0', fontSize: '12px', fontWeight: 600, textDecoration: 'none', textAlign: 'center' }}>Manage Data →</a>
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
