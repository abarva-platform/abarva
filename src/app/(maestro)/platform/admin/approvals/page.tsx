'use client'
import AbarvaNav from '@/components/AbarvaNav'

const S = {
  page: { minHeight: '100vh', background: '#F8FAFC', fontFamily: 'Inter, -apple-system, sans-serif' } as React.CSSProperties,
  card: { background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '24px' } as React.CSSProperties,
  label: { fontSize: '11px', fontWeight: 700, color: '#3C3C3C', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '12px' } as React.CSSProperties,
  subnav: { display: 'flex', gap: '8px', padding: '12px 32px', background: '#FFFFFF', borderBottom: '1px solid #E2E8F0' } as React.CSSProperties,
}

const LINKS = [{ href: '/platform/admin', label: 'Engagement Hub' }, { href: '/platform/admin/data', label: 'Data Loader' }, { href: '/platform/admin/approvals', label: 'Approvals', active: true }, { href: '/platform/admin/outcomes', label: 'Outcome Tracker' }]

const PENDING = [
  { type: 'Output Review', title: 'AI Strategy Draft — Meridian Health', description: 'Full 6-step AI strategy ready for CIO review. 18-month roadmap, $292M value identified.', client: 'Meridian Health', date: 'Apr 8, 2026' },
  { type: 'Data Request', title: 'Board Materials Request — Meridian Health', description: 'Client requested access to competitor benchmark data for board presentation.', client: 'Meridian Health', date: 'Apr 7, 2026' },
  { type: 'Access Request', title: 'New User — Robert Chen (CFO)', description: 'CFO requesting read-only access. Scope: Financial data and business cases only.', client: 'Meridian Health', date: 'Apr 6, 2026' },
]

const COMPLETED = [
  { title: 'Vendor comparison approved — Cohere vs Waystar', client: 'Meridian Health', date: 'Apr 5, 2026', result: 'Approved' },
  { title: 'IT Financial Model upload approved', client: 'First Capital', date: 'Apr 4, 2026', result: 'Approved' },
  { title: 'Regulatory benchmark data shared with CFO', client: 'Apex Retail', date: 'Apr 3, 2026', result: 'Approved with conditions' },
]

export default function AdminApprovals() {
  return (
    <div style={S.page}>
      <AbarvaNav activePage="admin" />
      <div style={S.subnav}>{LINKS.map(l => <a key={l.href} href={l.href} style={{ padding: '6px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, textDecoration: 'none', background: l.active ? '#1E3A5F' : '#F8FAFC', color: l.active ? '#FFFFFF' : '#475569', border: '1px solid #E2E8F0', flexShrink: 0 }}>{l.label}</a>)}</div>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Approval Workflows</h1>
        <p style={{ fontSize: '14px', color: '#3C3C3C', marginBottom: '24px' }}>3 items pending review · All outputs reviewed before sharing with clients</p>
        <div style={S.label}>PENDING ({PENDING.length})</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
          {PENDING.map((item, i) => (
            <div key={i} style={{ ...S.card, borderLeft: '4px solid #D97706' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div><span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px', background: '#FFFBEB', color: '#D97706', marginRight: '8px' }}>{item.type}</span><span style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A' }}>{item.title}</span></div>
                <span style={{ fontSize: '11px', color: '#3C3C3C' }}>{item.date}</span>
              </div>
              <div style={{ fontSize: '13px', color: '#3C3C3C', marginBottom: '12px' }}>{item.description}</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button style={{ padding: '8px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, background: '#059669', color: 'white', border: 'none', cursor: 'pointer' }}>Approve</button>
                <button style={{ padding: '8px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', cursor: 'pointer' }}>Approve with conditions</button>
                <button style={{ padding: '8px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, background: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0', cursor: 'pointer' }}>Reject</button>
              </div>
            </div>
          ))}
        </div>
        <div style={S.label}>COMPLETED</div>
        <div style={S.card}>
          {COMPLETED.map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: i < COMPLETED.length - 1 ? '1px solid #F1F5F9' : 'none', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: '#3C3C3C', marginBottom: '2px' }}>{item.title}</div>
                <div style={{ fontSize: '11px', color: '#3C3C3C' }}>{item.client} · {item.date}</div>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 10px', borderRadius: '10px', background: '#ECFDF5', color: '#059669' }}>{item.result}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
