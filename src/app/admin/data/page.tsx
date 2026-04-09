'use client'
import { useState } from 'react'
import AbarvaNav from '@/components/AbarvaNav'

const S = {
  page: { minHeight: '100vh', background: '#F8FAFC', fontFamily: 'Inter, -apple-system, sans-serif' } as React.CSSProperties,
  card: { background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '24px' } as React.CSSProperties,
  label: { fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '12px' } as React.CSSProperties,
  subnav: { display: 'flex', gap: '8px', padding: '12px 32px', background: '#FFFFFF', borderBottom: '1px solid #E2E8F0' } as React.CSSProperties,
}

const LINKS = [{ href: '/admin', label: 'Engagement Hub' }, { href: '/admin/data', label: 'Data Loader', active: true }, { href: '/admin/approvals', label: 'Approvals' }, { href: '/admin/outcomes', label: 'Outcome Tracker' }]

const FILES = [
  { name: 'Meridian_IT_Financial_Model_FY2024.xlsx', type: 'Financial', client: 'Meridian Health', date: 'Apr 8, 2026', confidence: '+12%' },
  { name: 'Meridian_DataCenter_Infrastructure_Inventory.xlsx', type: 'Technology', client: 'Meridian Health', date: 'Apr 8, 2026', confidence: '+8%' },
  { name: 'Meridian_Application_Technology_Inventory.xlsx', type: 'Technology', client: 'Meridian Health', date: 'Apr 8, 2026', confidence: '+14%' },
  { name: 'Meridian_Healthcare_Quality_RCM_Data.xlsx', type: 'Clinical', client: 'Meridian Health', date: 'Apr 8, 2026', confidence: '+18%' },
  { name: 'Meridian_Workforce_HR_Analytics.xlsx', type: 'Workforce', client: 'Meridian Health', date: 'Apr 8, 2026', confidence: '+10%' },
  { name: 'Meridian_Vendor_Performance_Scorecard.xlsx', type: 'Vendors', client: 'Meridian Health', date: 'Apr 8, 2026', confidence: '+9%' },
  { name: 'Enterprise_IT_Financial_Models_All_Clients.xlsx', type: 'Financial', client: 'All Clients', date: 'Apr 8, 2026', confidence: '+11%' },
  { name: 'Apex_Retail_Store_Technology_Inventory.xlsx', type: 'Technology', client: 'Apex Retail', date: 'Apr 8, 2026', confidence: '+8%' },
]

export default function AdminData() {
  const [drag, setDrag] = useState(false)
  return (
    <div style={S.page}>
      <AbarvaNav clientId="meridian" activePage="admin" />
      <div style={S.subnav}>{LINKS.map(l => <a key={l.href} href={l.href} style={{ padding: '6px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, textDecoration: 'none', background: l.active ? '#1E3A5F' : '#F8FAFC', color: l.active ? '#FFFFFF' : '#475569', border: '1px solid #E2E8F0', flexShrink: 0 }}>{l.label}</a>)}</div>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Data Loader</h1>
        <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>Upload, verify, and approve client data. All data reviewed before impacting intelligence.</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px' }}>
          <div>
            <div style={{ ...S.card, marginBottom: '24px' }}>
              <div style={S.label}>UPLOAD NEW DATA</div>
              <div onDragOver={e => { e.preventDefault(); setDrag(true) }} onDragLeave={() => setDrag(false)} onDrop={e => { e.preventDefault(); setDrag(false) }}
                style={{ border: `2px dashed ${drag ? '#2563EB' : '#E2E8F0'}`, borderRadius: '10px', padding: '40px', textAlign: 'center', background: drag ? '#EFF6FF' : '#F8FAFC', cursor: 'pointer' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>📁</div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Drop files here or click to upload</div>
                <div style={{ fontSize: '12px', color: '#94A3B8' }}>Excel, CSV, PDF, PowerPoint supported</div>
              </div>
            </div>
            <div style={S.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={S.label}>APPROVED DATA REGISTRY ({FILES.length} files)</div>
                <span style={{ fontSize: '12px', color: '#059669', fontWeight: 600 }}>All approved ✓</span>
              </div>
              {FILES.map((f, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < FILES.length - 1 ? '1px solid #F1F5F9' : 'none', alignItems: 'center', gap: '12px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '12px', fontWeight: 500, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{f.name}</div>
                    <div style={{ fontSize: '11px', color: '#94A3B8' }}>{f.client} · {f.type} · {f.date}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#059669' }}>{f.confidence} confidence</span>
                    <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '10px', background: '#ECFDF5', color: '#059669', fontWeight: 600 }}>✓ Approved</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={S.card}>
              <div style={S.label}>PRESCRIBED NEXT LOADS</div>
              {[{ client: 'Meridian Health', file: 'Physician_Satisfaction_FY2024.xlsx', reason: 'Epic optimization analysis', priority: 'High' }, { client: 'Apex Retail', file: 'Customer_Loyalty_Transaction_Data.csv', reason: 'Churn model deployment', priority: 'High' }, { client: 'First Capital', file: 'Loan_Portfolio_FY2024.xlsx', reason: 'Credit underwriting AI baseline', priority: 'Medium' }].map((p, i) => (
                <div key={i} style={{ padding: '12px', borderRadius: '8px', background: p.priority === 'High' ? '#FEF2F2' : '#FFFBEB', border: `1px solid ${p.priority === 'High' ? '#FECACA' : '#FDE68A'}`, marginBottom: '8px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#0F172A', marginBottom: '2px' }}>{p.file}</div>
                  <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '4px' }}>{p.client} — {p.reason}</div>
                  <div style={{ fontSize: '10px', fontWeight: 600, color: p.priority === 'High' ? '#DC2626' : '#D97706' }}>{p.priority} priority</div>
                </div>
              ))}
            </div>
            <div style={S.card}>
              <div style={S.label}>DOWNLOAD TEMPLATES</div>
              {[{ name: 'IT Financial Model', file: 'Meridian_IT_Financial_Model_FY2024.xlsx' }, { name: 'Data Center Inventory', file: 'Meridian_DataCenter_Infrastructure_Inventory.xlsx' }, { name: 'App Inventory', file: 'Meridian_Application_Technology_Inventory.xlsx' }, { name: 'Healthcare Quality', file: 'Meridian_Healthcare_Quality_RCM_Data.xlsx' }, { name: 'Workforce Analytics', file: 'Meridian_Workforce_HR_Analytics.xlsx' }].map((t, i) => (
                <a key={i} href={`/templates/${t.file}`} download style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', borderRadius: '6px', background: '#F8FAFC', border: '1px solid #E2E8F0', textDecoration: 'none', fontSize: '12px', color: '#374151', marginBottom: '6px' }}>
                  {t.name} <span style={{ color: '#059669', fontWeight: 600 }}>↓</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
