'use client'
import AbarvaNav from '@/components/AbarvaNav'

const S = {
  page: { minHeight: '100vh', background: '#F8FAFC', fontFamily: 'Inter, -apple-system, sans-serif' } as React.CSSProperties,
  card: { background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '24px' } as React.CSSProperties,
  label: { fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '12px' } as React.CSSProperties,
  subnav: { display: 'flex', gap: '8px', padding: '12px 32px', background: '#FFFFFF', borderBottom: '1px solid #E2E8F0', overflowX: 'auto' as const } as React.CSSProperties,
}

const LINKS = [
  { href: '/admin', label: 'Engagement Hub', active: true },
  { href: '/admin/data', label: 'Data Loader' },
  { href: '/admin/approvals', label: 'Approvals' },
  { href: '/admin/outcomes', label: 'Outcome Tracker' },
  { href: '/admin/brief', label: 'Pre-Meeting Brief' },
  { href: '/admin/context', label: 'Business Context' },
]

const ENGAGEMENTS = [
  { id: 'meridian', name: 'Meridian Health System', industry: 'Healthcare', confidence: 94, phase: 'AI Strategy', lastActivity: '2 hours ago', pending: 2, milestone: 'AI Strategy Board Presentation — Apr 18', value: '$292M annual value identified', color: '#2563EB' },
  { id: 'firstcapital', name: 'First Capital Financial', industry: 'Financial Services', confidence: 88, phase: 'Diagnose', lastActivity: '1 day ago', pending: 1, milestone: 'FedNow Architecture Review — Apr 22', value: '$91M annual value identified', color: '#7C3AED' },
  { id: 'apexretail', name: 'Apex Retail Group', industry: 'Retail', confidence: 86, phase: 'Justify', lastActivity: '3 hours ago', pending: 0, milestone: 'Einstein Activation Business Case — Apr 15', value: '$1.27B annual value identified', color: '#059669' },
]

const ACTIVITY = [
  { time: '2 hours ago', action: 'AI Strategy Step 4 completed', client: 'Meridian Health', type: 'product' },
  { time: '3 hours ago', action: 'Business case exported — Einstein Activation', client: 'Apex Retail', type: 'export' },
  { time: '5 hours ago', action: 'New data file uploaded — Q2 financial statements', client: 'First Capital', type: 'data' },
  { time: '1 day ago', action: 'Regulatory alert triggered — CMS Prior Auth rule', client: 'Meridian Health', type: 'alert' },
]

export default function AdminHub() {
  return (
    <div style={S.page}>
      <AbarvaNav clientId="meridian" activePage="admin" />
      <div style={S.subnav}>
        {LINKS.map(link => <a key={link.href} href={link.href} style={{ padding: '6px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, textDecoration: 'none', background: link.active ? '#1E3A5F' : '#F8FAFC', color: link.active ? '#FFFFFF' : '#475569', border: '1px solid #E2E8F0', flexShrink: 0 }}>{link.label}</a>)}
      </div>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Engagement Hub</h1>
          <p style={{ fontSize: '14px', color: '#6B7280' }}>3 active engagements · $1.65B annual value identified across portfolio</p>
        </div>

        <div style={{ ...S.label }}>ACTIVE ENGAGEMENTS</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
          {ENGAGEMENTS.map(eng => (
            <div key={eng.id} style={{ ...S.card, borderLeft: `4px solid ${eng.color}` }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: '24px', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', marginBottom: '2px' }}>{eng.name}</div>
                  <div style={{ fontSize: '12px', color: '#6B7280' }}>{eng.industry} · Last: {eng.lastActivity}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '4px' }}>Phase</div>
                  <span style={{ fontSize: '12px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px', background: '#EFF6FF', color: '#2563EB' }}>{eng.phase}</span>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '2px' }}>Confidence</div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: '#0F172A' }}>{eng.confidence}%</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '4px' }}>Next milestone</div>
                  <div style={{ fontSize: '12px', color: '#374151' }}>{eng.milestone}</div>
                  <div style={{ fontSize: '12px', color: '#059669', fontWeight: 600, marginTop: '2px' }}>{eng.value}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <a href={`/?client=${eng.id}`} style={{ padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, textDecoration: 'none', background: '#2563EB', color: 'white', textAlign: 'center' }}>Open →</a>
                  {eng.id === 'meridian' && <a href="/admin/brief" style={{ padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, textDecoration: 'none', background: '#0F172A', color: '#E6EDF3', textAlign: 'center', border: '1px solid #1E293B' }}>Brief →</a>}
                  {eng.id === 'meridian' && <a href="/admin/context" style={{ padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, textDecoration: 'none', background: '#1E3A5F', color: '#FFFFFF', textAlign: 'center' }}>Context →</a>}
                  {eng.pending > 0 && <a href="/admin/approvals" style={{ padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, textDecoration: 'none', background: '#FEF2F2', color: '#DC2626', textAlign: 'center', border: '1px solid #FECACA' }}>{eng.pending} pending</a>}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px' }}>
          <div style={S.card}>
            <div style={S.label}>ACTIVITY FEED</div>
            {ACTIVITY.map((act, i) => {
              const tc: Record<string, string> = { product: '#2563EB', export: '#059669', data: '#7C3AED', alert: '#DC2626' }
              return (
                <div key={i} style={{ display: 'flex', gap: '12px', padding: '12px 0', borderBottom: i < ACTIVITY.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: tc[act.type], flexShrink: 0, marginTop: '5px' }} />
                  <div>
                    <div style={{ fontSize: '13px', color: '#374151', marginBottom: '2px' }}>{act.action}</div>
                    <div style={{ fontSize: '11px', color: '#94A3B8' }}>{act.client} · {act.time}</div>
                  </div>
                </div>
              )
            })}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={S.card}>
              <div style={S.label}>QUICK ACTIONS</div>
              {[{ label: '+ New Engagement', href: '/search', color: '#2563EB' }, { label: 'Upload Data', href: '/admin/data', color: '#7C3AED' }, { label: 'Review Approvals (3)', href: '/admin/approvals', color: '#DC2626' }, { label: 'Outcome Tracker', href: '/admin/outcomes', color: '#059669' }, { label: 'Business Context', href: '/admin/context', color: '#0F172A' }].map((a, i) => (
                <a key={i} href={a.href} style={{ display: 'block', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, textDecoration: 'none', background: `${a.color}10`, color: a.color, border: `1px solid ${a.color}30`, marginBottom: '8px' }}>{a.label}</a>
              ))}
            </div>
            <div style={S.card}>
              <div style={S.label}>PORTFOLIO SUMMARY</div>
              {[{ label: 'Total value identified', value: '$1.65B', color: '#059669' }, { label: 'Active engagements', value: '3', color: '#2563EB' }, { label: 'Avg confidence', value: '89%', color: '#7C3AED' }, { label: 'Pending approvals', value: '3', color: '#DC2626' }].map((m, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < 3 ? '1px solid #F1F5F9' : 'none' }}>
                  <span style={{ fontSize: '12px', color: '#6B7280' }}>{m.label}</span>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: m.color }}>{m.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
