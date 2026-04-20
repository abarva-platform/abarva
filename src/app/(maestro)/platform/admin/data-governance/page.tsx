'use client'
import { useState } from 'react'

const T = {
  bg: '#0D1117', surface: '#161B22', surface2: '#1C2128',
  border: '#21262D', border2: '#30363D',
  text: '#E6EDF3', text2: '#C9D1D9', text3: '#8B949E',
  teal: '#2DD4C8', blue: '#4DA3FF', green: '#6EE7B7', amber: '#F59E0B', red: '#EF4444',
  purple: '#A78BFA',
}

type PromotionStatus = 'pending' | 'approved' | 'rejected' | 'changes_requested'

interface PromotionRequest {
  id: string
  engagement: string
  org: string
  maestro: string
  document: string
  category: string
  requestedAt: string
  status: PromotionStatus
  note?: string
  visibleTo: string[]
}

interface AuditEntry {
  timestamp: string
  user: string
  role: string
  action: string
  category: string
  approvedBy?: string
  layer: number
}

interface TeamMember {
  name: string
  role: string
  email: string
  access: string
  addedAt: string
}

interface DataFile {
  name: string
  uploadedAt: string
  uploadedBy: string
  status: 'promoted' | 'pending_promotion' | 'engagement_only'
  promotable: boolean
}

interface Engagement {
  id: string
  name: string
  org: string
  maestro: string
  createdAt: string
  team: TeamMember[]
  files: DataFile[]
  pendingCount: number
}

const PROMOTIONS: PromotionRequest[] = [
  {
    id: 'p1', engagement: 'Meridian Health — AI Strategy 2026', org: 'Meridian Health',
    maestro: 'Anand Sundaram', document: 'Q4 AI Roadmap Draft v2', category: 'Strategic Plans',
    requestedAt: 'Apr 12, 2026', status: 'pending',
    visibleTo: ['CIO', 'CEO', 'CFO'],
    note: 'Approved by Marcus Webb (CIO) — ready for master intelligence',
  },
  {
    id: 'p2', engagement: 'First Capital — FedNow Deployment', org: 'First Capital Bank',
    maestro: 'Anand Sundaram', document: 'FedNow Vendor Evaluation — Final Scorecard', category: 'Vendor Contracts',
    requestedAt: 'Apr 13, 2026', status: 'pending',
    visibleTo: ['CIO', 'CFO', 'COO'],
    note: 'Decision made. Finzly selected. Promote to master for outcome tracking.',
  },
  {
    id: 'p3', engagement: 'Meridian Health — AI Strategy 2026', org: 'Meridian Health',
    maestro: 'Anand Sundaram', document: 'IT Budget 2025–2026', category: 'Financial Performance',
    requestedAt: 'Apr 5, 2026', status: 'approved',
    visibleTo: ['CIO', 'CFO', 'CEO'],
  },
  {
    id: 'p4', engagement: 'Apex Retail — Demand Intelligence', org: 'Apex Retail Group',
    maestro: 'Anand Sundaram', document: 'Demand Forecast Draft (internal notes)', category: 'Strategic Plans',
    requestedAt: 'Apr 10, 2026', status: 'rejected',
    note: 'Contains negotiation notes. Keep in engagement workspace only.',
    visibleTo: [],
  },
]

const AUDIT_LOG: AuditEntry[] = [
  { timestamp: 'Apr 14, 2026 10:34', user: 'Robert Chen', role: 'CFO', action: 'View', category: 'Clinical AI Initiatives', layer: 1 },
  { timestamp: 'Apr 14, 2026 10:12', user: 'Anand Sundaram', role: 'MAESTRO', action: 'Promote Request', category: 'Strategic Plans', layer: 2 },
  { timestamp: 'Apr 14, 2026 09:45', user: 'Dr. Sarah Patel', role: 'CMIO', action: 'View', category: 'Clinical Quality', layer: 1 },
  { timestamp: 'Apr 14, 2026 09:22', user: 'Marcus Webb', role: 'CIO', action: 'Upload', category: 'Vendor Contracts', layer: 2 },
  { timestamp: 'Apr 13, 2026 16:55', user: 'Anand Sundaram', role: 'MAESTRO', action: 'Promote Request', category: 'Vendor Contracts', layer: 2 },
  { timestamp: 'Apr 13, 2026 14:30', user: 'Linda Park', role: 'COO', action: 'View', category: 'Operations', layer: 1 },
  { timestamp: 'Apr 13, 2026 11:22', user: 'Marcus Webb', role: 'CIO', action: 'Approve', category: 'Financial Performance', approvedBy: 'Marcus Webb', layer: 1 },
  { timestamp: 'Apr 12, 2026 15:10', user: 'Anand Sundaram', role: 'MAESTRO', action: 'Upload', category: 'Strategic Plans', layer: 2 },
  { timestamp: 'Apr 12, 2026 09:00', user: 'Robert Chen', role: 'CFO', action: 'Upload', category: 'Financials', layer: 2 },
  { timestamp: 'Apr 10, 2026 16:20', user: 'Anand Sundaram', role: 'MAESTRO', action: 'Reject', category: 'Strategic Plans', layer: 2 },
  { timestamp: 'Apr 9, 2026 14:45', user: 'Dr. Sarah Patel', role: 'CMIO', action: 'Upload', category: 'Clinical Quality', layer: 2 },
  { timestamp: 'Apr 8, 2026 11:00', user: 'Anand Sundaram', role: 'MAESTRO', action: 'Upload', category: 'Technology', layer: 2 },
  { timestamp: 'Apr 7, 2026 10:30', user: 'Marcus Webb', role: 'CIO', action: 'Approve', category: 'Technology', approvedBy: 'Marcus Webb', layer: 1 },
  { timestamp: 'Apr 5, 2026 09:15', user: 'Anand Sundaram', role: 'MAESTRO', action: 'Approve', category: 'Financial Performance', approvedBy: 'Anand Sundaram', layer: 1 },
  { timestamp: 'Apr 4, 2026 16:00', user: 'Linda Park', role: 'COO', action: 'Upload', category: 'Workforce & HR', layer: 2 },
  { timestamp: 'Apr 3, 2026 11:30', user: 'Anand Sundaram', role: 'MAESTRO', action: 'Access Grant', category: 'All Data', layer: 1 },
  { timestamp: 'Apr 2, 2026 14:00', user: 'Anand Sundaram', role: 'MAESTRO', action: 'Upload', category: 'Vendor Contracts', layer: 2 },
  { timestamp: 'Apr 2, 2026 09:00', user: 'Marcus Webb', role: 'CIO', action: 'Upload', category: 'IT Financials', layer: 2 },
  { timestamp: 'Apr 1, 2026 17:00', user: 'Anand Sundaram', role: 'MAESTRO', action: 'Engagement Created', category: '—', layer: 2 },
  { timestamp: 'Mar 31, 2026 15:00', user: 'Anand Sundaram', role: 'MAESTRO', action: 'Org Provisioned', category: '—', layer: 1 },
]

const ENGAGEMENTS: Engagement[] = [
  {
    id: 'meridian-2026', name: 'Meridian Health — AI Strategy 2026', org: 'Meridian Health',
    maestro: 'Anand Sundaram', createdAt: 'Apr 2, 2026', pendingCount: 1,
    team: [
      { name: 'Marcus Webb', role: 'CIO', email: 'mwebb@meridianhealth.org', access: 'Technology, Vendors, IT Financials', addedAt: 'Apr 2' },
      { name: 'Robert Chen', role: 'CFO', email: 'rchen@meridianhealth.org', access: 'Financials, Vendor Contracts, RCM', addedAt: 'Apr 2' },
      { name: 'Dr. Sarah Patel', role: 'CMIO', email: 'spatel@meridianhealth.org', access: 'Clinical Quality, EHR, AI Initiatives', addedAt: 'Apr 3' },
      { name: 'Linda Park', role: 'COO', email: 'lpark@meridianhealth.org', access: 'Operations, Workforce, Vendor Performance', addedAt: 'Apr 3' },
    ],
    files: [
      { name: 'IT Budget 2025–2026.xlsx', uploadedAt: 'Apr 2', uploadedBy: 'Marcus Webb', status: 'promoted', promotable: true },
      { name: 'Vendor Contract Summary.xlsx', uploadedAt: 'Apr 3', uploadedBy: 'Marcus Webb', status: 'promoted', promotable: true },
      { name: 'Healthcare Quality RCM Data.xlsx', uploadedAt: 'Apr 4', uploadedBy: 'Dr. Sarah Patel', status: 'promoted', promotable: true },
      { name: 'Q4 AI Roadmap Draft v2.pptx', uploadedAt: 'Apr 12', uploadedBy: 'Anand Sundaram', status: 'pending_promotion', promotable: true },
      { name: 'Executive Interview Notes — Internal.docx', uploadedAt: 'Apr 13', uploadedBy: 'Anand Sundaram', status: 'engagement_only', promotable: false },
    ],
  },
  {
    id: 'firstcapital-2026', name: 'First Capital — FedNow Deployment', org: 'First Capital Bank',
    maestro: 'Anand Sundaram', createdAt: 'Apr 10, 2026', pendingCount: 1,
    team: [
      { name: 'David Kim', role: 'CTO', email: 'dkim@firstcapitalbank.com', access: 'Technology, Infrastructure, AI Initiatives', addedAt: 'Apr 10' },
      { name: 'Jennifer Torres', role: 'CFO', email: 'jtorres@firstcapitalbank.com', access: 'Financials, Vendor Contracts', addedAt: 'Apr 10' },
      { name: 'Michael Brown', role: 'COO', email: 'mbrown@firstcapitalbank.com', access: 'Operations, Compliance', addedAt: 'Apr 11' },
    ],
    files: [
      { name: 'IT Financial Model FY2025.xlsx', uploadedAt: 'Apr 10', uploadedBy: 'David Kim', status: 'promoted', promotable: true },
      { name: 'FedNow Vendor Evaluation — Final Scorecard.xlsx', uploadedAt: 'Apr 13', uploadedBy: 'Anand Sundaram', status: 'pending_promotion', promotable: true },
      { name: 'Finzly Contract Negotiation Notes.docx', uploadedAt: 'Apr 13', uploadedBy: 'Anand Sundaram', status: 'engagement_only', promotable: false },
    ],
  },
  {
    id: 'apex-2026', name: 'Apex Retail — Demand Intelligence', org: 'Apex Retail Group',
    maestro: 'Anand Sundaram', createdAt: 'Apr 12, 2026', pendingCount: 0,
    team: [
      { name: 'Rachel Osei', role: 'CIO', email: 'rosei@apexretail.com', access: 'Technology, Vendors, IT Financials', addedAt: 'Apr 12' },
      { name: 'Thomas Nguyen', role: 'CFO', email: 'tnguyen@apexretail.com', access: 'Financials, Vendor Contracts', addedAt: 'Apr 12' },
    ],
    files: [
      { name: 'Retail Technology Inventory.xlsx', uploadedAt: 'Apr 12', uploadedBy: 'Rachel Osei', status: 'promoted', promotable: true },
      { name: 'Supply Chain Performance Q1 2026.xlsx', uploadedAt: 'Apr 13', uploadedBy: 'Anand Sundaram', status: 'promoted', promotable: true },
    ],
  },
]

const TABS = ['Pending Promotions', 'Engagement Workspaces', 'Audit Trail', 'Access Notifications']

function ActionColor(action: string) {
  if (action.includes('Upload') || action.includes('Created') || action.includes('Provisioned') || action.includes('Grant')) return T.green
  if (action.includes('Approve')) return T.teal
  if (action.includes('Promote')) return T.amber
  if (action.includes('Reject')) return T.red
  if (action.includes('View')) return T.text3
  return T.text3
}

function PromotionStatusPill({ status }: { status: PromotionStatus }) {
  const cfg = {
    pending: { color: T.amber, label: 'Pending' },
    approved: { color: T.green, label: 'Approved' },
    rejected: { color: T.red, label: 'Rejected' },
    changes_requested: { color: T.purple, label: 'Changes Requested' },
  }[status]
  return (
    <span style={{ fontSize: '11px', fontWeight: 700, color: cfg.color, background: cfg.color + '18', borderRadius: '4px', padding: '2px 8px' }}>
      {cfg.label}
    </span>
  )
}

function FileStatusPill({ status }: { status: DataFile['status'] }) {
  const cfg = {
    promoted: { color: T.green, label: '✓ Master Intelligence' },
    pending_promotion: { color: T.amber, label: '⏳ Promotion Pending' },
    engagement_only: { color: T.text3, label: '📝 Engagement Only' },
  }[status]
  return (
    <span style={{ fontSize: '11px', fontWeight: 600, color: cfg.color }}>
      {cfg.label}
    </span>
  )
}

export default function DataGovernance() {
  const [tab, setTab] = useState(0)
  const [promotions, setPromotions] = useState(PROMOTIONS)
  const [expandedEngagement, setExpandedEngagement] = useState<string | null>('meridian-2026')
  const [requestChangesId, setRequestChangesId] = useState<string | null>(null)
  const [changesNote, setChangesNote] = useState('')

  const pending = promotions.filter(p => p.status === 'pending')

  function handlePromotion(id: string, action: PromotionStatus, note?: string) {
    setPromotions(ps => ps.map(p => p.id === id ? { ...p, status: action, note: note ?? p.note } : p))
  }

  const CROSS_ROLE_NOTIFICATIONS = [
    { timestamp: 'Apr 14, 2026 10:34', viewer: 'Robert Chen', viewerRole: 'CFO', resource: 'Clinical AI Initiatives Report', notified: 'Dr. Sarah Patel (CMIO)', reason: 'CFO access to clinical data triggers CMIO notification per org policy' },
    { timestamp: 'Apr 13, 2026 14:30', viewer: 'Linda Park', viewerRole: 'COO', resource: 'IT Vendor Performance Scorecard', notified: 'Marcus Webb (CIO)', reason: 'COO access to IT vendor data triggers CIO notification per org policy' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: 'Inter, sans-serif', color: T.text }}>
      {/* Header */}
      <div style={{ background: T.surface, borderBottom: '1px solid ' + T.border, padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <a href="/platform/admin" style={{ fontSize: '13px', color: T.text3, textDecoration: 'none', marginBottom: '4px', display: 'block' }}>← Engagement Hub</a>
          <div style={{ fontSize: '18px', fontWeight: 700 }}>Data Governance</div>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {pending.length > 0 && (
            <div style={{ fontSize: '13px', fontWeight: 700, color: T.amber, background: T.amber + '18', border: '1px solid ' + T.amber + '40', borderRadius: '6px', padding: '6px 12px' }}>
              {pending.length} pending approval{pending.length > 1 ? 's' : ''}
            </div>
          )}
          <div style={{ fontSize: '12px', color: T.text3 }}>Steward view</div>
        </div>
      </div>

      {/* Layer model banner */}
      <div style={{ background: T.surface2, borderBottom: '1px solid ' + T.border, padding: '10px 24px', display: 'flex', gap: '32px' }}>
        {[
          { label: 'Layer 1 — Master Intelligence', desc: 'Approved, permanent, governed', color: T.teal },
          { label: 'Layer 2 — Engagement Workspace', desc: 'Project-scoped, isolated, promotable', color: T.amber },
          { label: 'Layer 3 — Transformation Genome', desc: 'Anonymised cross-client patterns', color: T.purple },
        ].map(layer => (
          <div key={layer.label} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: layer.color, marginTop: '5px', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: layer.color }}>{layer.label}</div>
              <div style={{ fontSize: '11px', color: T.text3 }}>{layer.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ background: T.surface, borderBottom: '1px solid ' + T.border, padding: '0 24px', display: 'flex', gap: '2px' }}>
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            style={{
              padding: '12px 16px', background: 'none', border: 'none',
              borderBottom: tab === i ? '2px solid ' + T.teal : '2px solid transparent',
              color: tab === i ? T.teal : T.text3,
              fontSize: '13px', fontWeight: tab === i ? 700 : 500,
              cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}
          >
            {t}
            {t === 'Pending Promotions' && pending.length > 0 && (
              <span style={{ fontSize: '10px', fontWeight: 800, background: T.amber, color: '#0D1117', borderRadius: '10px', padding: '1px 6px' }}>
                {pending.length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 24px' }}>

        {/* Tab 0: Pending Promotions */}
        {tab === 0 && (
          <div>
            <div style={{ fontSize: '14px', color: T.text3, marginBottom: '24px' }}>
              Review promotion requests from Maestro. Approved data moves to Master Intelligence (Layer 1) and becomes visible to rostered team members.
            </div>

            {promotions.map(p => (
              <div
                key={p.id}
                style={{
                  background: T.surface,
                  border: '1px solid ' + (p.status === 'pending' ? T.amber + '40' : T.border),
                  borderRadius: '12px', padding: '20px', marginBottom: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
                      PENDING PROMOTION REQUEST — {p.org}
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: T.text, marginBottom: '4px' }}>{p.document}</div>
                    <div style={{ fontSize: '13px', color: T.text3 }}>
                      Category: <span style={{ color: T.text2 }}>{p.category}</span> ·
                      Maestro: <span style={{ color: T.text2 }}>{p.maestro}</span> ·
                      Requested: <span style={{ color: T.text2 }}>{p.requestedAt}</span>
                    </div>
                    {p.note && (
                      <div style={{ marginTop: '8px', fontSize: '13px', color: T.text3, fontStyle: 'italic' }}>
                        "{p.note}"
                      </div>
                    )}
                    {p.visibleTo.length > 0 && (
                      <div style={{ marginTop: '8px', fontSize: '12px', color: T.text3 }}>
                        If approved, visible to: {p.visibleTo.join(' · ')}
                      </div>
                    )}
                  </div>
                  <PromotionStatusPill status={p.status} />
                </div>

                {p.status === 'pending' && (
                  <>
                    {requestChangesId === p.id ? (
                      <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <textarea
                          rows={2}
                          placeholder="Describe the changes needed..."
                          value={changesNote}
                          onChange={e => setChangesNote(e.target.value)}
                          style={{
                            width: '100%', padding: '10px 12px', background: T.surface2,
                            border: '1px solid ' + T.border2, borderRadius: '8px',
                            fontSize: '13px', color: T.text, fontFamily: 'inherit',
                            resize: 'none', boxSizing: 'border-box',
                          }}
                        />
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => { handlePromotion(p.id, 'changes_requested', changesNote); setRequestChangesId(null); setChangesNote('') }}
                            style={{ padding: '8px 16px', background: T.purple, color: '#0D1117', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                          >
                            Send Request
                          </button>
                          <button onClick={() => setRequestChangesId(null)} style={{ padding: '8px 16px', background: T.border2, color: T.text2, border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                        <button onClick={() => handlePromotion(p.id, 'approved')} style={{ padding: '8px 16px', background: T.green, color: '#0D1117', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                          Approve → Master
                        </button>
                        <button onClick={() => { setRequestChangesId(p.id); setChangesNote('') }} style={{ padding: '8px 16px', background: T.surface2, color: T.text2, border: '1px solid ' + T.border2, borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                          Request Changes
                        </button>
                        <button onClick={() => handlePromotion(p.id, 'rejected')} style={{ padding: '8px 16px', background: 'none', color: T.red, border: '1px solid ' + T.red + '40', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                          Reject
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Tab 1: Engagement Workspaces */}
        {tab === 1 && (
          <div>
            <div style={{ fontSize: '14px', color: T.text3, marginBottom: '24px' }}>
              Each engagement has an isolated workspace. Data stays in Layer 2 until promoted to Master Intelligence.
            </div>
            {ENGAGEMENTS.map(eng => (
              <div key={eng.id} style={{ background: T.surface, border: '1px solid ' + T.border, borderRadius: '12px', marginBottom: '16px', overflow: 'hidden' }}>
                {/* Engagement header */}
                <div
                  style={{ padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                  onClick={() => setExpandedEngagement(expandedEngagement === eng.id ? null : eng.id)}
                >
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: T.text, marginBottom: '2px' }}>{eng.name}</div>
                    <div style={{ fontSize: '12px', color: T.text3 }}>
                      Maestro: {eng.maestro} · Created: {eng.createdAt} · {eng.team.length} team members · {eng.files.length} files
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {eng.pendingCount > 0 && (
                      <span style={{ fontSize: '11px', fontWeight: 800, color: T.amber, background: T.amber + '18', border: '1px solid ' + T.amber + '40', borderRadius: '10px', padding: '2px 8px' }}>
                        {eng.pendingCount} pending
                      </span>
                    )}
                    <span style={{ fontSize: '16px', color: T.text3 }}>{expandedEngagement === eng.id ? '▲' : '▼'}</span>
                  </div>
                </div>

                {expandedEngagement === eng.id && (
                  <div style={{ borderTop: '1px solid ' + T.border, padding: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                      {/* Team Roster */}
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
                          TEAM ACCESS
                        </div>
                        {eng.team.map((member, i) => (
                          <div key={i} style={{ padding: '10px 12px', background: T.surface2, borderRadius: '8px', marginBottom: '6px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                              <span style={{ fontSize: '13px', fontWeight: 600, color: T.text }}>{member.name}</span>
                              <span style={{ fontSize: '11px', fontWeight: 700, color: T.teal, background: T.teal + '18', borderRadius: '4px', padding: '1px 6px' }}>{member.role}</span>
                            </div>
                            <div style={{ fontSize: '11px', color: T.text3 }}>{member.email}</div>
                            <div style={{ fontSize: '11px', color: T.text3, marginTop: '2px' }}>
                              Can view: {member.access}
                            </div>
                          </div>
                        ))}
                        <button style={{ width: '100%', padding: '8px', background: 'none', border: '1px dashed ' + T.border2, borderRadius: '8px', color: T.text3, fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit', marginTop: '4px' }}>
                          + Add team member
                        </button>
                      </div>

                      {/* Data Inventory */}
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
                          DATA INVENTORY
                        </div>
                        {eng.files.map((file, i) => (
                          <div key={i} style={{ padding: '10px 12px', background: T.surface2, borderRadius: '8px', marginBottom: '6px' }}>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: T.text, marginBottom: '4px' }}>{file.name}</div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <div style={{ fontSize: '11px', color: T.text3 }}>
                                Uploaded {file.uploadedAt} by {file.uploadedBy}
                              </div>
                              <FileStatusPill status={file.status} />
                            </div>
                            {!file.promotable && (
                              <div style={{ fontSize: '10px', color: T.text3, marginTop: '3px' }}>Not promotable — engagement-only data</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: Audit Trail */}
        {tab === 2 && (
          <div>
            <div style={{ fontSize: '14px', color: T.text3, marginBottom: '20px' }}>
              Complete record of all data access, uploads, promotions, and approvals. Visible to Steward and Maestro only.
            </div>
            <div style={{ background: T.surface, border: '1px solid ' + T.border, borderRadius: '12px', overflow: 'hidden' }}>
              {/* Table header */}
              <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr 80px 1fr 80px 120px', gap: '0', background: T.surface2, borderBottom: '1px solid ' + T.border, padding: '10px 16px' }}>
                {['Timestamp', 'User', 'Role', 'Action', 'Layer', 'Data Category'].map(h => (
                  <div key={h} style={{ fontSize: '11px', fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</div>
                ))}
              </div>
              {AUDIT_LOG.map((entry, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '150px 1fr 80px 1fr 80px 120px', gap: '0', padding: '10px 16px', borderBottom: i < AUDIT_LOG.length - 1 ? '1px solid ' + T.border : 'none', alignItems: 'center' }}>
                  <div style={{ fontSize: '11px', color: T.text3 }}>{entry.timestamp}</div>
                  <div style={{ fontSize: '12px', color: T.text2 }}>{entry.user}</div>
                  <div style={{ fontSize: '11px' }}>
                    <span style={{ color: T.teal, background: T.teal + '18', borderRadius: '3px', padding: '1px 5px', fontWeight: 700, fontSize: '10px' }}>{entry.role}</span>
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: ActionColor(entry.action) }}>{entry.action}</div>
                  <div style={{ fontSize: '11px', color: T.text3 }}>Layer {entry.layer}</div>
                  <div style={{ fontSize: '11px', color: T.text3 }}>{entry.category}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Access Notifications */}
        {tab === 3 && (
          <div>
            <div style={{ fontSize: '14px', color: T.text3, marginBottom: '20px' }}>
              When a user accesses data that triggers a cross-role notification per org policy, both users are informed. Configurable per engagement.
            </div>
            {CROSS_ROLE_NOTIFICATIONS.map((n, i) => (
              <div key={i} style={{ background: T.surface, border: '1px solid ' + T.border, borderRadius: '12px', padding: '20px', marginBottom: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                  ACCESS NOTIFICATION — {n.timestamp}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '12px', background: T.surface2, borderRadius: '8px', fontFamily: 'monospace', fontSize: '12px', color: T.text3, marginBottom: '12px' }}>
                  <div><span style={{ color: T.text2 }}>{n.viewer}</span> ({n.viewerRole}) accessed: <span style={{ color: T.teal }}>{n.resource}</span></div>
                  <div>Notified: <span style={{ color: T.amber }}>{n.notified}</span></div>
                  <div>Reason: {n.reason}</div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button style={{ padding: '6px 14px', background: T.surface2, color: T.text3, border: '1px solid ' + T.border2, borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>
                    View access log
                  </button>
                  <button style={{ padding: '6px 14px', background: T.surface2, color: T.text3, border: '1px solid ' + T.border2, borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>
                    Configure notifications
                  </button>
                </div>
              </div>
            ))}
            <div style={{ background: T.surface, border: '1px dashed ' + T.border2, borderRadius: '12px', padding: '24px', textAlign: 'center' }}>
              <div style={{ fontSize: '13px', color: T.text3, marginBottom: '8px' }}>Configure which data access events trigger notifications for this org</div>
              <button style={{ padding: '8px 18px', background: T.teal, color: '#0D1117', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                Notification Policy Settings
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
