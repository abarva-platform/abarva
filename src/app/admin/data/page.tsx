'use client'
import { useState } from 'react'
import AbarvaNav from '@/components/AbarvaNav'

const S = {
  page: { minHeight: '100vh', background: '#F8FAFC', fontFamily: 'Inter, -apple-system, sans-serif' } as React.CSSProperties,
  card: { background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '24px' } as React.CSSProperties,
  label: { fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '12px' } as React.CSSProperties,
}

const LINKS = [
  { href: '/admin', label: 'Engagement Hub' },
  { href: '/admin/data', label: 'Data Loader', active: true },
  { href: '/admin/data-guide', label: 'Data Guide' },
  { href: '/admin/approvals', label: 'Approvals' },
  { href: '/admin/outcomes', label: 'Outcome Tracker' },
  { href: '/admin/brief', label: 'Pre-Meeting Brief' },
  { href: '/admin/context', label: 'Business Context' },
]

const CONFIDENCE_CATEGORIES = [
  {
    label: 'Financial Intelligence', pct: 28, color: '#059669',
    uploaded: [
      { name: 'Meridian_IT_Financial_Model_FY2024.xlsx', date: 'Apr 8, 2026', contribution: '+12%' },
      { name: 'Meridian_Vendor_Contract_Summary.xlsx', date: 'Apr 8, 2026', contribution: '+9%' },
      { name: 'Annual_Financial_Summary_FY2024.xlsx', date: 'Apr 8, 2026', contribution: '+7%' },
    ],
    missing: [
      { name: 'IT_Project_Portfolio.xlsx', reason: 'Epic optimization analysis blocked' },
      { name: 'Headcount_by_Function.xlsx', reason: 'CDO vacancy analysis incomplete' },
    ],
  },
  {
    label: 'Technology Stack', pct: 31, color: '#2563EB',
    uploaded: [
      { name: 'Meridian_Application_Technology_Inventory.xlsx', date: 'Apr 8, 2026', contribution: '+14%' },
      { name: 'Meridian_DataCenter_Infrastructure_Inventory.xlsx', date: 'Apr 8, 2026', contribution: '+8%' },
      { name: 'Meridian_AI_Analytics_Initiative_Tracker.xlsx', date: 'Apr 8, 2026', contribution: '+9%' },
    ],
    missing: [
      { name: 'Integration_Map.xlsx', reason: 'Interface complexity analysis pending' },
    ],
  },
  {
    label: 'Clinical & Operations', pct: 22, color: '#7C3AED',
    uploaded: [
      { name: 'Meridian_Healthcare_Quality_RCM_Data.xlsx', date: 'Apr 8, 2026', contribution: '+18%' },
      { name: 'Meridian_Vendor_Performance_Scorecard.xlsx', date: 'Apr 8, 2026', contribution: '+9%' },
    ],
    missing: [],
  },
  {
    label: 'Workforce & HR', pct: 10, color: '#D97706',
    uploaded: [
      { name: 'Meridian_Workforce_HR_Analytics.xlsx', date: 'Apr 8, 2026', contribution: '+10%' },
    ],
    missing: [
      { name: 'Physician_Satisfaction_FY2024.xlsx', reason: 'Epic optimization analysis needs this' },
    ],
  },
  {
    label: 'Leadership & Strategy', pct: 3, color: '#DC2626',
    uploaded: [],
    missing: [
      { name: 'Strategic_Plan_Summary.pptx', reason: 'Board alignment analysis incomplete' },
    ],
  },
]

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

const Q_UPDATE_QUESTIONS = [
  { id: 'q1', label: 'Q1', question: 'Did any new systems go live in the past 90 days?', placeholder: 'e.g., New EHR module, cloud migration completed...' },
  { id: 'q2', label: 'Q2', question: 'Did any major projects complete, fail, or get cancelled?', placeholder: 'e.g., AI pilot concluded, ERP project deferred...' },
  { id: 'q3', label: 'Q3', question: 'Did leadership priorities or budget change?', placeholder: 'e.g., CFO target shifted, CDO role filled...' },
  { id: 'q4', label: 'Q4', question: 'Any new vendor contracts, renewals, or cancellations?', placeholder: 'e.g., Ensemble contract renewed, Mirth replaced...' },
  { id: 'q5', label: 'Q5', question: 'Any regulatory changes that affect your technology strategy?', placeholder: 'e.g., New CMS mandate, ONC rule update...' },
]

export default function AdminData() {
  const [drag, setDrag] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)

  const OVERALL_CONFIDENCE = 94

  const handleSubmit = () => {
    setSubmitted(true)
    setTimeout(() => { setShowModal(false); setSubmitted(false) }, 2000)
  }

  return (
    <div style={S.page}>
      <AbarvaNav activePage="admin" />
      <div style={{ display: 'flex', gap: '8px', padding: '12px 32px', background: '#FFFFFF', borderBottom: '1px solid #E2E8F0', overflowX: 'auto' as const }}>
        {LINKS.map(l => <a key={l.href} href={l.href} style={{ padding: '6px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, textDecoration: 'none', background: (l as any).active ? '#1E3A5F' : '#F8FAFC', color: (l as any).active ? '#FFFFFF' : '#475569', border: '1px solid #E2E8F0', flexShrink: 0, whiteSpace: 'nowrap' as const }}>{l.label}</a>)}
      </div>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Data Loader</h1>
            <p style={{ fontSize: '14px', color: '#6B7280' }}>Upload, verify, and approve client data. All data reviewed before impacting intelligence.</p>
          </div>
          <button onClick={() => setShowModal(true)} style={{ padding: '10px 18px', borderRadius: '8px', background: '#1E3A5F', color: '#FFFFFF', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
            ↻ Quarterly Update
          </button>
        </div>

        {/* Confidence score card */}
        <div style={{ ...S.card, marginBottom: '20px', borderTop: '3px solid #059669' }}>
          <div style={{ display: 'flex', gap: '40px', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <div style={S.label}>Data Confidence Score — Meridian Health System</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: '52px', fontWeight: 800, color: '#059669', letterSpacing: '-0.03em', lineHeight: 1 }}>{OVERALL_CONFIDENCE}%</span>
                <span style={{ fontSize: '14px', color: '#059669', fontWeight: 600 }}>Gold Standard</span>
              </div>
              <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>8 of 12 files uploaded · 2 leadership files pending</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', color: '#6B7280' }}>Overall confidence</span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#059669' }}>{OVERALL_CONFIDENCE}%</span>
              </div>
              <div style={{ height: '10px', background: '#F1F5F9', borderRadius: '5px', marginBottom: '20px' }}>
                <div style={{ height: '10px', borderRadius: '5px', width: OVERALL_CONFIDENCE + '%', background: 'linear-gradient(90deg, #2563EB 0%, #059669 100%)' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                {CONFIDENCE_CATEGORIES.map((cat, i) => (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '10px', color: '#94A3B8', lineHeight: 1.2 }}>{cat.label.split(' ')[0]}</span>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: cat.color }}>+{cat.pct}%</span>
                    </div>
                    <div style={{ height: '4px', background: '#F1F5F9', borderRadius: '2px' }}>
                      <div style={{ height: '4px', borderRadius: '2px', width: cat.uploaded.length > 0 ? '100%' : '0%', background: cat.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px' }}>
          <div>
            {/* Upload area */}
            <div style={{ ...S.card, marginBottom: '24px' }}>
              <div style={S.label}>UPLOAD NEW DATA</div>
              <div onDragOver={e => { e.preventDefault(); setDrag(true) }} onDragLeave={() => setDrag(false)} onDrop={e => { e.preventDefault(); setDrag(false) }}
                style={{ border: `2px dashed ${drag ? '#2563EB' : '#E2E8F0'}`, borderRadius: '10px', padding: '40px', textAlign: 'center', background: drag ? '#EFF6FF' : '#F8FAFC', cursor: 'pointer' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>📁</div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Drop files here or click to upload</div>
                <div style={{ fontSize: '12px', color: '#94A3B8' }}>Excel, CSV, PDF, PowerPoint supported</div>
              </div>
            </div>

            {/* File categories with uploaded/missing */}
            <div style={S.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={S.label}>FILE COVERAGE BY CATEGORY</div>
                <a href="/admin/data-guide" style={{ fontSize: '12px', fontWeight: 600, color: '#2563EB', textDecoration: 'none' }}>What good looks like →</a>
              </div>
              {CONFIDENCE_CATEGORIES.map((cat, ci) => (
                <div key={ci} style={{ marginBottom: ci < CONFIDENCE_CATEGORIES.length - 1 ? '20px' : 0, paddingBottom: ci < CONFIDENCE_CATEGORIES.length - 1 ? '20px' : 0, borderBottom: ci < CONFIDENCE_CATEGORIES.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>{cat.label}</div>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: cat.color }}>+{cat.pct}% confidence</span>
                  </div>
                  {cat.uploaded.map((f, fi) => (
                    <div key={fi} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: '#F0FDF4', borderRadius: '6px', marginBottom: '6px', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', minWidth: 0 }}>
                        <span style={{ color: '#059669', fontWeight: 700, flexShrink: 0 }}>✓</span>
                        <span style={{ fontSize: '12px', color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{f.name}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexShrink: 0, marginLeft: '8px' }}>
                        <span style={{ fontSize: '11px', color: '#059669', fontWeight: 600 }}>{f.contribution}</span>
                        <span style={{ fontSize: '11px', color: '#94A3B8' }}>{f.date}</span>
                      </div>
                    </div>
                  ))}
                  {cat.missing.map((f, fi) => (
                    <div key={fi} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '6px', marginBottom: '6px', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', minWidth: 0 }}>
                        <span style={{ color: '#D97706', fontWeight: 700, flexShrink: 0 }}>!</span>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '12px', fontWeight: 500, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{f.name}</div>
                          <div style={{ fontSize: '11px', color: '#92400E' }}>{f.reason}</div>
                        </div>
                      </div>
                      <button style={{ padding: '4px 10px', borderRadius: '6px', background: '#D97706', color: '#FFFFFF', border: 'none', fontSize: '11px', fontWeight: 600, cursor: 'pointer', flexShrink: 0, marginLeft: '8px' }}>Upload</button>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Full registry */}
            <div style={{ ...S.card, marginTop: '24px' }}>
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

          {/* Right sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Prescribed next loads */}
            <div style={S.card}>
              <div style={S.label}>PRESCRIBED NEXT LOADS</div>
              {[
                { client: 'Meridian Health', file: 'Physician_Satisfaction_FY2024.xlsx', reason: 'Epic optimization analysis', priority: 'High' },
                { client: 'Apex Retail', file: 'Customer_Loyalty_Transaction_Data.csv', reason: 'Churn model deployment', priority: 'High' },
                { client: 'First Capital', file: 'Loan_Portfolio_FY2024.xlsx', reason: 'Credit underwriting AI baseline', priority: 'Medium' },
              ].map((p, i) => (
                <div key={i} style={{ padding: '12px', borderRadius: '8px', background: p.priority === 'High' ? '#FEF2F2' : '#FFFBEB', border: `1px solid ${p.priority === 'High' ? '#FECACA' : '#FDE68A'}`, marginBottom: '8px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#0F172A', marginBottom: '2px' }}>{p.file}</div>
                  <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '4px' }}>{p.client} — {p.reason}</div>
                  <div style={{ fontSize: '10px', fontWeight: 600, color: p.priority === 'High' ? '#DC2626' : '#D97706' }}>{p.priority} priority</div>
                </div>
              ))}
            </div>

            {/* Download templates */}
            <div style={S.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={S.label}>DOWNLOAD TEMPLATES</div>
                <a href="/admin/data-guide" style={{ fontSize: '11px', color: '#2563EB', textDecoration: 'none', fontWeight: 600 }}>Full guide →</a>
              </div>
              {[
                { name: 'IT Financial Model', file: 'IT_Financial_Model_Template.xlsx' },
                { name: 'App Inventory', file: 'Application_Technology_Inventory.xlsx' },
                { name: 'KPI Scorecard', file: 'KPI_Scorecard_Current.xlsx' },
                { name: 'Vendor Performance', file: 'Vendor_Performance_Scorecard.xlsx' },
                { name: 'AI Initiative Tracker', file: 'AI_Analytics_Initiative_Tracker.xlsx' },
              ].map((t, i) => (
                <a key={i} href={`/templates/${t.file}`} download style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', borderRadius: '6px', background: '#F8FAFC', border: '1px solid #E2E8F0', textDecoration: 'none', fontSize: '12px', color: '#374151', marginBottom: '6px' }}>
                  {t.name} <span style={{ color: '#059669', fontWeight: 600 }}>↓</span>
                </a>
              ))}
            </div>

            {/* Quick actions */}
            <div style={S.card}>
              <div style={S.label}>QUICK ACTIONS</div>
              <a href="/admin/data-guide" style={{ display: 'block', padding: '10px 12px', borderRadius: '8px', background: '#F0FDF4', border: '1px solid #A7F3D0', color: '#059669', textDecoration: 'none', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>📋 Data Collection Guide</a>
              <button onClick={() => setShowModal(true)} style={{ display: 'block', width: '100%', padding: '10px 12px', borderRadius: '8px', background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#2563EB', fontSize: '13px', fontWeight: 600, cursor: 'pointer', textAlign: 'left' as const, marginBottom: '8px' }}>↻ Quarterly Update Wizard</button>
              <a href="/admin/approvals" style={{ display: 'block', padding: '10px 12px', borderRadius: '8px', background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}>⚠ 3 Pending Approvals</a>
            </div>
          </div>
        </div>
      </div>

      {/* Quarterly Update Modal */}
      {showModal && (
        <div style={{ position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '24px' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '32px', maxWidth: '580px', width: '100%', maxHeight: '90vh', overflowY: 'auto' as const }}>
            {submitted ? (
              <div style={{ textAlign: 'center' as const, padding: '24px' }}>
                <div style={{ fontSize: '40px', marginBottom: '16px' }}>✓</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#059669', marginBottom: '8px' }}>Intelligence Updated</div>
                <div style={{ fontSize: '14px', color: '#6B7280' }}>AbarVa is processing your updates. Confidence scores will refresh within 2 hours.</div>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Quarterly Update — Meridian Health System</div>
                    <div style={{ fontSize: '13px', color: '#6B7280' }}>5 questions · 15 minutes · keeps intelligence current</div>
                  </div>
                  <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', color: '#94A3B8', cursor: 'pointer', flexShrink: 0, marginLeft: '16px' }}>×</button>
                </div>
                {Q_UPDATE_QUESTIONS.map((q, i) => (
                  <div key={q.id} style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#2563EB', flexShrink: 0 }}>{q.label}</span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151', lineHeight: 1.4 }}>{q.question}</span>
                    </div>
                    <textarea
                      rows={2}
                      placeholder={q.placeholder}
                      value={answers[q.id] || ''}
                      onChange={e => setAnswers(p => ({ ...p, [q.id]: e.target.value }))}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '13px', fontFamily: 'Inter, sans-serif', color: '#374151', resize: 'none' as const, boxSizing: 'border-box' as const }}
                    />
                    {i < Q_UPDATE_QUESTIONS.length - 1 && <div style={{ height: '1px', background: '#F1F5F9', marginTop: '16px' }} />}
                  </div>
                ))}
                <div style={{ display: 'flex', gap: '10px', paddingTop: '8px' }}>
                  <button onClick={handleSubmit} style={{ flex: 1, padding: '12px', borderRadius: '8px', background: '#2563EB', color: '#FFFFFF', border: 'none', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>Submit Update</button>
                  <button onClick={() => setShowModal(false)} style={{ padding: '12px 20px', borderRadius: '8px', background: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
