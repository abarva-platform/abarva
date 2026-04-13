'use client'
import AbarvaNav from '@/components/AbarvaNav'

const S = {
  page: { minHeight: '100vh', background: '#F8FAFC', fontFamily: 'Inter, -apple-system, sans-serif' } as React.CSSProperties,
  card: { background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '24px' } as React.CSSProperties,
  label: { fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '12px' } as React.CSSProperties,
  subnav: { display: 'flex', gap: '8px', padding: '12px 32px', background: '#FFFFFF', borderBottom: '1px solid #E2E8F0' } as React.CSSProperties,
}

const LINKS = [{ href: '/admin', label: 'Engagement Hub' }, { href: '/admin/data', label: 'Data Loader' }, { href: '/admin/approvals', label: 'Approvals' }, { href: '/admin/outcomes', label: 'Outcome Tracker', active: true }]

const INITIATIVES = [
  { client: 'Meridian Health', initiative: 'Sepsis AI Scale-up', target: '23 hospitals · $24M saving', current: '2 hospitals — stalled', pct: 8, status: 'red', commentary: 'No MLOps deployed. CDO hire is prerequisite. Board intervention needed.', fee: '$480K at milestone', feeNum: 480000 },
  { client: 'Meridian Health', initiative: 'Prior Auth Automation', target: '80% payers connected · $28M saving', current: 'Vendor selected — kick-off Apr 15', pct: 0, status: 'yellow', commentary: 'Cohere Health selected. Implementation starting. On track.', fee: '20% of Year 1 realized saving', feeNum: 5600000 },
  { client: 'Apex Retail', initiative: 'Einstein Personalization', target: '$248M revenue · 60% loyalty active', current: 'Activation in progress — Segment CDP step 1 complete', pct: 22, status: 'yellow', commentary: 'Salesforce PS engaged. Identity resolution complete. On track.', fee: '2% of incremental revenue', feeNum: 4960000 },
  { client: 'First Capital', initiative: 'FedNow API Layer', target: 'FedNow live · $180M deposit protection', current: 'Architecture approved — implementation starting', pct: 12, status: 'yellow', commentary: 'Finzly selected. FIS HORIZON documentation received. On track.', fee: '$360K at go-live', feeNum: 360000 },
]

export default function AdminOutcomes() {
  return (
    <div style={S.page}>
      <AbarvaNav clientId="meridian" activePage="admin" />
      <div style={S.subnav}>{LINKS.map(l => <a key={l.href} href={l.href} style={{ padding: '6px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, textDecoration: 'none', background: l.active ? '#1E3A5F' : '#F8FAFC', color: l.active ? '#FFFFFF' : '#475569', border: '1px solid #E2E8F0', flexShrink: 0 }}>{l.label}</a>)}</div>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Outcome Tracker</h1>
        <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>Tracking every committed initiative against baseline — AbarVa fees tied to results</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
          {[{ label: 'Total Value Committed', value: '$571M', color: '#059669' }, { label: 'AbarVa Fees at Risk', value: '$11.4M', color: '#2563EB' }, { label: 'Avg Progress', value: '11%', color: '#D97706' }, { label: 'At Risk', value: '1 of 4', color: '#DC2626' }].map((m, i) => (
            <div key={i} style={S.card}>
              <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '6px' }}>{m.label}</div>
              <div style={{ fontSize: '26px', fontWeight: 700, color: m.color }}>{m.value}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {INITIATIVES.map((init, i) => {
            const sc = init.status === 'red' ? '#DC2626' : init.status === 'yellow' ? '#D97706' : '#059669'
            const sb = init.status === 'red' ? '#FEF2F2' : init.status === 'yellow' ? '#FFFBEB' : '#ECFDF5'
            const sbo = init.status === 'red' ? '#FECACA' : init.status === 'yellow' ? '#FDE68A' : '#A7F3D0'
            return (
              <div key={i} style={{ ...S.card, borderLeft: `4px solid ${sc}` }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '24px', alignItems: 'start' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '2px' }}>{init.client}</div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', marginBottom: '8px' }}>{init.initiative}</div>
                    <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '2px' }}>Target</div>
                    <div style={{ fontSize: '12px', color: '#059669', fontWeight: 500 }}>{init.target}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '4px' }}>Current status</div>
                    <div style={{ fontSize: '13px', color: '#374151', marginBottom: '12px' }}>{init.current}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ flex: 1, height: '6px', background: '#F1F5F9', borderRadius: '3px' }}>
                        <div style={{ height: '6px', borderRadius: '3px', width: `${init.pct}%`, background: sc }} />
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: sc }}>{init.pct}%</span>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '4px' }}>AbarVa commentary</div>
                    <div style={{ fontSize: '12px', color: '#374151', lineHeight: 1.5, padding: '10px 12px', background: sb, borderRadius: '8px', border: `1px solid ${sbo}` }}>{init.commentary}</div>
                  </div>
                  <div style={{ minWidth: '140px' }}>
                    <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '4px' }}>Fee structure</div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#2563EB', marginBottom: '2px' }}>${(init.feeNum / 1000000).toFixed(1)}M</div>
                    <div style={{ fontSize: '11px', color: '#6B7280', lineHeight: 1.4 }}>{init.fee}</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
