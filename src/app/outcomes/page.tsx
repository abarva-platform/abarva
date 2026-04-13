'use client'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import AbarvaNav from '@/components/AbarvaNav'
import EngagementProgress from '@/components/EngagementProgress'

function OutcomesContent() {
  const searchParams = useSearchParams()
  const clientId = searchParams.get('client') || 'meridian'

  const clientName = clientId === 'firstcapital' ? 'First Capital Financial' : clientId === 'apexretail' ? 'Apex Retail Group' : 'Meridian Health System'
  const clientColor = clientId === 'firstcapital' ? '#7C3AED' : clientId === 'apexretail' ? '#059669' : '#2563EB'

  const isMeridian = clientId === 'meridian'

  return (
    <div style={{ minHeight: '100vh', background: '#0D1117', fontFamily: 'Inter, -apple-system, sans-serif' }}>
      <AbarvaNav clientId={clientId} activePage="outcomes" />
      <EngagementProgress />

      {/* Header */}
      <div style={{ background: '#111827', borderBottom: '1px solid #21262D', padding: '24px 40px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#2DD4C8', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px' }}>Outcome Tracking</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#E6EDF3', letterSpacing: '-0.02em', marginBottom: '4px' }}>{clientName}</div>
          <div style={{ fontSize: '13px', color: '#6B7280' }}>Week-by-week progress · Fee calculation begins Month 3</div>
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 40px' }}>

        {isMeridian ? (
          <div>
            {/* Fee Calculation Box */}
            <div style={{ background: '#111827', border: '1px solid #21262D', borderRadius: '12px', padding: '24px', marginBottom: '32px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
              <div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Verified So Far</div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#9CA3AF', letterSpacing: '-0.025em' }}>$0</div>
                <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>Tracking begins Month 3</div>
              </div>
              <div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Projected Year 1 Outcome Fee</div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#2DD4C8', letterSpacing: '-0.025em' }}>$21.9M</div>
                <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>At 15% of $146M projected savings</div>
              </div>
              <div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Total Savings Pipeline</div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#059669', letterSpacing: '-0.025em' }}>$146M</div>
                <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>RCM + CDO + Epic optimization</div>
              </div>
            </div>

            {/* Initiative 1: Prior Auth Automation */}
            <div style={{ background: '#111827', border: '1px solid #21262D', borderRadius: '12px', padding: '28px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Initiative 1 · Revenue Cycle</div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: '#E6EDF3', marginBottom: '4px' }}>Prior Auth Automation — Denial Rate Tracking</div>
                  <div style={{ fontSize: '13px', color: '#6B7280' }}>Target: 18.2% → 12.0% by Month 6 · $37.6M annual impact</div>
                </div>
                <span style={{ padding: '4px 14px', borderRadius: '100px', background: '#059669' + '20', border: '1px solid #059669' + '40', fontSize: '12px', fontWeight: 700, color: '#059669', flexShrink: 0 }}>Active</span>
              </div>

              {/* Sparkline / trend */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>Denial Rate Trend</div>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', height: '80px', marginBottom: '8px' }}>
                  {[
                    { week: 'Week 1', rate: 18.2, actual: true },
                    { week: 'Week 2', rate: 17.9, actual: false },
                    { week: 'Week 3', rate: 17.6, actual: false },
                    { week: 'Week 4', rate: 17.2, actual: false },
                  ].map((d, i) => {
                    const maxRate = 18.5
                    const minRate = 12.0
                    const heightPct = ((d.rate - minRate) / (maxRate - minRate)) * 100
                    return (
                      <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: d.actual ? '#E6EDF3' : '#6B7280' }}>{d.rate}%</div>
                        <div style={{ width: '100%', height: '48px', display: 'flex', alignItems: 'flex-end' }}>
                          <div style={{
                            width: '100%',
                            height: heightPct + '%',
                            background: d.actual ? '#DC2626' : 'rgba(220,38,38,0.3)',
                            borderRadius: '4px 4px 0 0',
                            border: d.actual ? 'none' : '1px dashed #DC262640',
                            minHeight: '4px',
                          }} />
                        </div>
                        <div style={{ fontSize: '10px', color: d.actual ? '#9CA3AF' : '#4B5563', textAlign: 'center' }}>{d.week}</div>
                        {!d.actual && <div style={{ fontSize: '9px', color: '#4B5563', fontStyle: 'italic' }}>projected</div>}
                      </div>
                    )
                  })}
                </div>
                {/* Target line label */}
                <div style={{ fontSize: '11px', color: '#059669', marginTop: '4px' }}>
                  Target: 12% by Month 6 · Denial rate trending down
                </div>
              </div>

              {/* SVG sparkline */}
              <div style={{ background: '#0D1117', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Trend Line</div>
                <svg width="100%" height="60" viewBox="0 0 400 60" preserveAspectRatio="none">
                  <line x1="0" y1="55" x2="400" y2="55" stroke="#21262D" strokeWidth="1" />
                  <line x1="0" y1="5" x2="400" y2="5" stroke="#059669" strokeWidth="1" strokeDasharray="4,4" opacity="0.5" />
                  <polyline points="0,8 133,14 266,20 400,28" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinejoin="round" />
                  <polyline points="0,8 133,14 266,20 400,28" fill="rgba(220,38,38,0.08)" strokeWidth="0" />
                  <circle cx="0" cy="8" r="4" fill="#DC2626" />
                  <circle cx="133" cy="14" r="3" fill="#DC262660" />
                  <circle cx="266" cy="20" r="3" fill="#DC262660" />
                  <circle cx="400" cy="28" r="3" fill="#DC262660" />
                  <text x="395" y="10" textAnchor="end" fontSize="9" fill="#059669">12% target</text>
                  <text x="5" y="6" fontSize="9" fill="#E6EDF3">18.2%</text>
                </svg>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                {[
                  { label: 'Current Rate', value: '18.2%', color: '#DC2626', actual: true },
                  { label: 'Week 2 Target', value: '17.9%', color: '#9CA3AF', actual: false },
                  { label: 'Month 3 Target', value: '15.5%', color: '#9CA3AF', actual: false },
                  { label: 'Month 6 Target', value: '12.0%', color: '#059669', actual: false },
                ].map((m, i) => (
                  <div key={i} style={{ padding: '14px', background: '#0D1117', borderRadius: '8px', border: m.actual ? '1px solid #DC262640' : '1px solid #21262D' }}>
                    <div style={{ fontSize: '10px', color: '#6B7280', marginBottom: '4px' }}>{m.label}</div>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: m.color }}>{m.value}</div>
                    {!m.actual && <div style={{ fontSize: '9px', color: '#4B5563', marginTop: '2px' }}>projected</div>}
                  </div>
                ))}
              </div>
            </div>

            {/* Initiative 2: CDO Hire */}
            <div style={{ background: '#111827', border: '1px solid #21262D', borderRadius: '12px', padding: '28px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#D97706', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Initiative 2 · Leadership</div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: '#E6EDF3', marginBottom: '4px' }}>CDO Hire — Executive Search Progress</div>
                  <div style={{ fontSize: '13px', color: '#6B7280' }}>Target: Hire in 4-6 months · Unblocks $94M savings pipeline</div>
                </div>
                <span style={{ padding: '4px 14px', borderRadius: '100px', background: '#D97706' + '20', border: '1px solid #D97706' + '40', fontSize: '12px', fontWeight: 700, color: '#D97706', flexShrink: 0 }}>In Progress</span>
              </div>

              {/* Checklist */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { label: 'Job description drafted', week: 'Week 1', done: true },
                  { label: 'Search firm engaged', week: 'Week 2', done: false },
                  { label: 'First 5 candidates screened', week: 'Week 3', done: false },
                  { label: '2 finalists identified', week: 'Week 4', done: false },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', background: '#0D1117', borderRadius: '8px', border: item.done ? '1px solid #05966930' : '1px solid #21262D' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: item.done ? '#059669' : 'transparent', border: item.done ? 'none' : '2px solid #374151', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {item.done && <span style={{ color: '#fff', fontSize: '12px', fontWeight: 700 }}>✓</span>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 500, color: item.done ? '#E6EDF3' : '#6B7280' }}>{item.label}</div>
                      <div style={{ fontSize: '11px', color: '#4B5563', marginTop: '2px' }}>{item.week}{!item.done && ' · projected'}</div>
                    </div>
                    {item.done && <span style={{ fontSize: '11px', fontWeight: 700, color: '#059669' }}>Complete</span>}
                    {!item.done && <span style={{ fontSize: '11px', color: '#4B5563', fontStyle: 'italic' }}>Upcoming</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Non-Meridian placeholder */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {[
              { label: 'First Capital Financial', id: 'firstcapital' },
              { label: 'Apex Retail Group', id: 'apexretail' },
            ].filter(c => c.id === clientId).map((c, i) => (
              <div key={i} style={{ background: '#111827', border: '1px solid #21262D', borderRadius: '12px', padding: '40px', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', marginBottom: '16px' }}>📊</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#E6EDF3', marginBottom: '8px' }}>{c.label}</div>
                <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>Engagement starting — baseline established in Week 1</div>
                <div style={{ fontSize: '13px', color: '#4B5563' }}>Outcome tracking will begin Month 3 once baselines are confirmed and first initiatives are underway.</div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}

export default function OutcomesPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#0D1117', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280', fontFamily: 'Inter, sans-serif' }}>Loading...</div>}>
      <OutcomesContent />
    </Suspense>
  )
}
