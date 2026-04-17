'use client'
import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import AbarvaNav from '@/components/AbarvaNav'

const BG     = '#FAFAF9'
const BG2    = '#F2F1F0'
const DARK   = '#0F0E0D'
const TEXT   = '#3D3B38'
const MUTED  = '#706D66'
const BORDER = '#E8E6E3'
const TEAL   = '#2DD4C8'
const RED    = '#C53030'
const AMBER  = '#B45309'
const GREEN  = '#166534'
const MONO   = "'Courier New', monospace"

type Section =
  | 'maestros' | 'roles' | 'security'
  | 'clients' | 'contracts'
  | 'sensitive-data' | 'access-logs' | 'pending-requests'
  | 'audit-log' | 'api-keys' | 'compliance'

const SIDEBAR_GROUPS = [
  {
    label: 'USERS & ACCESS',
    items: [
      { key: 'maestros' as Section,  icon: '👤', label: 'Maestros' },
      { key: 'roles'    as Section,  icon: '🔐', label: 'Roles & Permissions' },
      { key: 'security' as Section,  icon: '🔒', label: 'Security' },
    ],
  },
  {
    label: 'CLIENT GOVERNANCE',
    items: [
      { key: 'clients'   as Section, icon: '🏢', label: 'Active Clients' },
      { key: 'contracts' as Section, icon: '📋', label: 'Contract Terms' },
    ],
  },
  {
    label: 'DATA GOVERNANCE',
    items: [
      { key: 'sensitive-data'    as Section, icon: '⚠️', label: 'Sensitive Data',      badge: 3 },
      { key: 'access-logs'       as Section, icon: '📊', label: 'Access Logs' },
      { key: 'pending-requests'  as Section, icon: '📥', label: 'Pending Requests',     badge: 2 },
    ],
  },
  {
    label: 'PLATFORM',
    items: [
      { key: 'audit-log'   as Section, icon: '📜', label: 'Audit Log' },
      { key: 'api-keys'    as Section, icon: '🔑', label: 'API Keys' },
      { key: 'compliance'  as Section, icon: '✓',  label: 'Compliance' },
    ],
  },
]

const SENSITIVE_REQUESTS = [
  { dataset: 'Payer Contract Analysis',   sub: 'Confidential · PII adjacent',     client: 'Meridian Health',    by: 'Anand S.', forWhat: 'RCM AI engagement',   date: 'Today' },
  { dataset: 'CDO Profile + Org Chart',   sub: 'Organisational · Sensitive',       client: 'Meridian Health',    by: 'Anand S.', forWhat: 'Tech Mod engagement', date: 'Yesterday' },
  { dataset: 'MAS Regulatory Filing',     sub: 'Regulatory · Restricted',          client: 'Arcturus Financial', by: 'Anand S.', forWhat: 'FEAT Compliance',      date: '2 days ago' },
]

const MAESTROS_LIST = [
  { name: 'Anand Sundaram', email: 'anand@abarva.ai', role: 'Admin + Maestro', roleBg: '#CCFBF1', roleColor: '#0F4F3E', clients: 'Meridian · Arcturus', engagements: 4, status: 'Active', action: 'Manage →' },
  { name: 'TBD — Hire 1',   email: 'Pending hire',   role: 'Maestro',         roleBg: BG2,       roleColor: MUTED,     clients: 'Unassigned',          engagements: 0, status: 'Pending', action: 'Assign →' },
]

const CLIENTS_LIST = [
  { name: 'Meridian Health System',  type: 'IDN · 14 hospitals',    status: 'Active', tier: 'Enterprise', maestro: 'Anand S.', since: '2026-01-15' },
  { name: 'Arcturus Financial',      type: 'Asset Manager · Global', status: 'Active', tier: 'Enterprise', maestro: 'Anand S.', since: '2026-02-01' },
]

const AUDIT_LOG = [
  { who: 'Anand S.', action: 'Approved sensitive data request',   detail: 'Arcturus Financial · FCA filings',  when: '14:22 today',       color: GREEN },
  { who: 'System',   action: 'Phase gate submitted for approval', detail: 'Meridian · RCM AI Ph1',             when: '11:05 today',       color: TEAL },
  { who: 'Anand S.', action: 'Created Maestro account',           detail: 'jordan@abarva.com',                 when: 'Yesterday 16:40',   color: MUTED },
  { who: 'System',   action: 'Client onboarded',                  detail: 'Arcturus Financial — status Active',when: 'Yesterday 09:12',   color: MUTED },
  { who: 'Anand S.', action: 'API key rotated',                   detail: 'Production key — Supabase',         when: '2 days ago',        color: AMBER },
]

function StatusPill({ status }: { status: string }) {
  const s = status.toLowerCase()
  const bg    = s === 'active'  ? '#DCFCE7' : s === 'pending' ? '#FEF3C7' : '#FEF2F2'
  const color = s === 'active'  ? '#166534' : s === 'pending' ? '#78350F' : '#7F1D1D'
  return (
    <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '10px', background: bg, color }}>
      {status}
    </span>
  )
}

function thStyles(): React.CSSProperties {
  return { padding: '8px 14px', fontSize: '10px', fontWeight: 600, color: MUTED, textTransform: 'uppercase' as const, letterSpacing: '0.08em', background: BG2, borderBottom: `1px solid ${BORDER}`, textAlign: 'left' as const, fontFamily: MONO }
}

function tdStyles(): React.CSSProperties {
  return { padding: '11px 14px', fontSize: '13px', color: DARK, borderBottom: `1px solid ${BG2}`, verticalAlign: 'middle' as const }
}

function MaestrosSection() {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '20px', borderBottom: `1px solid ${BORDER}`, marginBottom: '24px' }}>
        <div>
          <div style={{ fontSize: '22px', fontWeight: 600, color: DARK, marginBottom: '4px' }}>Maestros</div>
          <div style={{ fontSize: '13px', color: MUTED }}>Manage Maestro accounts, roles, and client assignments.</div>
        </div>
        <button style={{ fontSize: '13px', fontWeight: 500, color: BG, background: DARK, padding: '8px 16px', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>
          + Add Maestro
        </button>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '28px' }}>
        {[
          { label: 'Total Maestros',           value: '3',  valueColor: DARK,  sub: '1 pending onboarding' },
          { label: 'Active Clients',            value: '2',  valueColor: DARK,  sub: 'Meridian · Arcturus' },
          { label: 'Sensitive Data Requests',   value: '3',  valueColor: RED,   sub: 'Awaiting your approval' },
          { label: 'Security Alerts',           value: '1',  valueColor: AMBER, sub: 'API key rotation due' },
        ].map((s, i) => (
          <div key={i} style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '6px', padding: '18px 20px' }}>
            <div style={{ fontFamily: MONO, fontSize: '10px', fontWeight: 600, color: MUTED, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '8px' }}>{s.label}</div>
            <div style={{ fontSize: '24px', fontWeight: 600, color: s.valueColor, lineHeight: 1, marginBottom: '4px' }}>{s.value}</div>
            <div style={{ fontSize: '11px', color: MUTED }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Maestros table */}
      <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '6px', overflow: 'hidden', marginBottom: '20px' }}>
        <div style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: DARK }}>All Maestros</div>
          <span style={{ fontSize: '12px', color: MUTED }}>3 total</span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Name', 'Role', 'Clients Assigned', 'Active Engagements', 'Status', 'Action'].map(h => (
                <th key={h} style={thStyles()}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MAESTROS_LIST.map((m, i) => (
              <tr key={i} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = BG2 }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '' }}>
                <td style={tdStyles()}>
                  <div style={{ fontWeight: 600, color: DARK }}>{m.name}</div>
                  <div style={{ fontSize: '11px', color: MUTED }}>{m.email}</div>
                </td>
                <td style={tdStyles()}>
                  <span style={{ fontSize: '11px', background: m.roleBg, color: m.roleColor, padding: '2px 7px', borderRadius: '3px', fontWeight: 600 }}>{m.role}</span>
                </td>
                <td style={{ ...tdStyles(), color: TEXT }}>{m.clients}</td>
                <td style={{ ...tdStyles(), fontWeight: 600 }}>{m.engagements || '—'}</td>
                <td style={tdStyles()}><StatusPill status={m.status} /></td>
                <td style={{ ...tdStyles(), fontSize: '12px', fontWeight: 500, color: TEAL, cursor: 'pointer' }}>{m.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Sensitive data approvals */}
      <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '6px', overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: DARK }}>Sensitive Data Approval Requests</div>
          <span style={{ fontSize: '11px', background: '#FEF2F2', color: '#7F1D1D', padding: '2px 8px', borderRadius: '3px', fontWeight: 600 }}>3 pending</span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Dataset', 'Client', 'Requested By', 'Requested For', 'Date', 'Action'].map(h => (
                <th key={h} style={thStyles()}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SENSITIVE_REQUESTS.map((r, i) => (
              <tr key={i} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = BG2 }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '' }}>
                <td style={tdStyles()}>
                  <div style={{ fontWeight: 600, color: DARK }}>{r.dataset}</div>
                  <div style={{ fontSize: '11px', color: MUTED }}>{r.sub}</div>
                </td>
                <td style={tdStyles()}>{r.client}</td>
                <td style={tdStyles()}>{r.by}</td>
                <td style={{ ...tdStyles(), color: MUTED }}>{r.forWhat}</td>
                <td style={{ ...tdStyles(), fontSize: '12px', color: MUTED }}>{r.date}</td>
                <td style={tdStyles()}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: GREEN, cursor: 'pointer' }}>Approve</span>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: RED, cursor: 'pointer' }}>Reject</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ClientsSection() {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '20px', borderBottom: `1px solid ${BORDER}`, marginBottom: '24px' }}>
        <div>
          <div style={{ fontSize: '22px', fontWeight: 600, color: DARK, marginBottom: '4px' }}>Active Clients</div>
          <div style={{ fontSize: '13px', color: MUTED }}>Manage client accounts and engagement status.</div>
        </div>
        <button style={{ fontSize: '13px', fontWeight: 500, color: BG, background: DARK, padding: '8px 16px', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>
          + Add Client
        </button>
      </div>
      <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '6px', overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: DARK }}>All Clients</div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Client', 'Type', 'Status', 'Tier', 'Maestro', 'Since'].map(h => (
                <th key={h} style={thStyles()}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CLIENTS_LIST.map((c, i) => (
              <tr key={i} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = BG2 }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '' }}>
                <td style={tdStyles()}><div style={{ fontWeight: 600 }}>{c.name}</div></td>
                <td style={{ ...tdStyles(), color: MUTED }}>{c.type}</td>
                <td style={tdStyles()}><StatusPill status={c.status} /></td>
                <td style={{ ...tdStyles(), color: MUTED }}>{c.tier}</td>
                <td style={tdStyles()}>{c.maestro}</td>
                <td style={{ ...tdStyles(), fontFamily: MONO, fontSize: '12px', color: MUTED }}>{c.since}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function AuditLogSection() {
  return (
    <div>
      <div style={{ paddingBottom: '20px', borderBottom: `1px solid ${BORDER}`, marginBottom: '24px' }}>
        <div style={{ fontSize: '22px', fontWeight: 600, color: DARK, marginBottom: '4px' }}>Audit Log</div>
        <div style={{ fontSize: '13px', color: MUTED }}>Complete activity log for compliance and security review.</div>
      </div>
      <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '6px', overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: DARK }}>Recent Activity</div>
        </div>
        {AUDIT_LOG.map((e, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '16px 1fr 140px', gap: '14px', alignItems: 'flex-start', padding: '12px 18px', borderBottom: i < AUDIT_LOG.length - 1 ? `1px solid ${BG2}` : 'none' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: e.color, marginTop: '4px', flexShrink: 0 }} />
            <div>
              <span style={{ fontSize: '13px', fontWeight: 600, color: DARK }}>{e.who}</span>
              <span style={{ fontSize: '13px', color: TEXT }}> — {e.action}</span>
              <div style={{ fontSize: '12px', color: MUTED, marginTop: '2px' }}>{e.detail}</div>
            </div>
            <div style={{ fontFamily: MONO, fontSize: '10px', color: MUTED, textAlign: 'right' as const, paddingTop: '2px' }}>{e.when}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function PlaceholderSection({ title, sub }: { title: string; sub: string }) {
  return (
    <div>
      <div style={{ paddingBottom: '20px', borderBottom: `1px solid ${BORDER}`, marginBottom: '24px' }}>
        <div style={{ fontSize: '22px', fontWeight: 600, color: DARK, marginBottom: '4px' }}>{title}</div>
        <div style={{ fontSize: '13px', color: MUTED }}>{sub}</div>
      </div>
      <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '6px', padding: '48px', textAlign: 'center' as const }}>
        <div style={{ fontSize: '13px', color: MUTED }}>No items to display.</div>
      </div>
    </div>
  )
}

export default function AdminPage() {
  const { isLoaded, user } = useUser()
  const [active, setActive] = useState<Section>('maestros')

  const role = user?.publicMetadata?.role as string | undefined

  if (!isLoaded) return null

  if (!user || role !== 'admin') {
    return (
      <div style={{ minHeight: '100vh', background: BG }}>
        <AbarvaNav activePage="admin" />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 60px)' }}>
          <div style={{ textAlign: 'center' as const }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: DARK, marginBottom: '8px' }}>Admin Portal</div>
            <div style={{ fontSize: '13px', color: MUTED }}>This area is restricted to platform administrators.</div>
          </div>
        </div>
      </div>
    )
  }

  function renderContent() {
    switch (active) {
      case 'maestros':       return <MaestrosSection />
      case 'clients':        return <ClientsSection />
      case 'audit-log':      return <AuditLogSection />
      case 'roles':          return <PlaceholderSection title="Roles & Permissions" sub="Manage user roles and access permissions." />
      case 'security':       return <PlaceholderSection title="Security" sub="Security settings and two-factor authentication." />
      case 'contracts':      return <PlaceholderSection title="Contract Terms" sub="Client contract terms and SLA management." />
      case 'sensitive-data': return <PlaceholderSection title="Sensitive Data" sub="Review and manage sensitive data classifications." />
      case 'access-logs':    return <PlaceholderSection title="Access Logs" sub="Data access audit trail by user and dataset." />
      case 'pending-requests': return <PlaceholderSection title="Pending Requests" sub="Maestro requests for elevated data access." />
      case 'api-keys':       return <PlaceholderSection title="API Keys" sub="Manage platform API keys and integrations." />
      case 'compliance':     return <PlaceholderSection title="Compliance" sub="SOC2 compliance status and reporting." />
      default:               return <MaestrosSection />
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: BG }}>
      <AbarvaNav activePage="admin" />
      <div style={{ display: 'flex', minHeight: 'calc(100vh - 60px)' }}>

        {/* ── Sidebar ─────────────────────────────────────────────────── */}
        <div style={{ width: '220px', minWidth: '220px', background: DARK, padding: '16px 0', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ padding: '12px 16px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '4px' }}>
            <div style={{ fontFamily: MONO, fontSize: '9px', fontWeight: 700, color: '#4B5563', textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: '4px' }}>Admin Portal</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>Platform governance</div>
          </div>

          {SIDEBAR_GROUPS.map((group) => (
            <div key={group.label} style={{ padding: '10px 16px 4px' }}>
              <div style={{ fontFamily: MONO, fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: '4px' }}>
                {group.label}
              </div>
              {group.items.map((item) => {
                const isActive = active === item.key
                return (
                  <div
                    key={item.key}
                    onClick={() => setActive(item.key)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '6px 8px', borderRadius: '4px', cursor: 'pointer', marginBottom: '1px',
                      background: isActive ? 'rgba(45,212,200,0.1)' : 'transparent',
                    }}
                    onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)' }}
                    onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                  >
                    <span style={{ fontSize: '11px', color: isActive ? TEAL : 'rgba(255,255,255,0.3)', width: '14px', textAlign: 'center' as const }}>{item.icon}</span>
                    <span style={{ fontSize: '12px', color: isActive ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)', fontWeight: isActive ? 500 : 400 }}>{item.label}</span>
                    {'badge' in item && item.badge ? (
                      <span style={{ marginLeft: 'auto', fontSize: '10px', fontWeight: 600, background: RED, color: '#fff', padding: '1px 6px', borderRadius: '8px' }}>
                        {item.badge}
                      </span>
                    ) : null}
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        {/* ── Main ────────────────────────────────────────────────────── */}
        <div style={{ flex: 1, padding: '28px 36px', background: BG }}>
          {renderContent()}
        </div>
      </div>
    </div>
  )
}
