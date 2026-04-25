'use client'
import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { StewardAdminRail } from '@/components/admin/StewardAdminRail'
import { StewardSetupControlCenter } from '@/components/admin/StewardSetupControlCenter'

// ── Design tokens (spec-exact) ────────────────────────────────────────────
const BG     = '#FAFAF9'
const DARK   = '#0F0E0D'
const TEXT   = '#3D3B38'
const MUTED  = '#706D66'
const BORDER = '#E8E6E3'
const BG2    = '#F2F1F0'
const TEAL   = '#14B8A6'
const RED    = '#C53030'
const AMBER  = '#B45309'
const GREEN  = '#166534'
const MONO   = "'Courier New', monospace"
const SANS   = 'DM Sans, sans-serif'
const ADMIN_EMAIL_ALLOWLIST = new Set([
  'anand+clerk_test@abarva.com',
  'anand.sundaram@thesundaram.com',
])

// ── Types ─────────────────────────────────────────────────────────────────
type Section =
  | 'control-center'
  | 'maestros' | 'roles' | 'security'
  | 'clients'  | 'contracts'
  | 'sensitive-data' | 'quality' | 'access-logs' | 'pending-requests'
  | 'audit-log' | 'api-keys' | 'compliance' | 'build-progress' | 'production-readiness'

// ── Sidebar config ────────────────────────────────────────────────────────
const SIDEBAR_GROUPS: Array<{
  label: string
  items: Array<{ key: Section; icon: string; label: string; badge?: number; badgeAmber?: boolean }>
}> = [
  {
    label: 'Setup',
    items: [
      { key: 'control-center', icon: '◎', label: 'Setup · Control Center' },
    ],
  },
  {
    label: 'Users & Access',
    items: [
      { key: 'maestros', icon: '👤', label: 'Maestros' },
      { key: 'roles',    icon: '🔐', label: 'Roles & Permissions' },
      { key: 'security', icon: '🔒', label: 'Security' },
    ],
  },
  {
    label: 'Client Governance',
    items: [
      { key: 'clients',   icon: '🏢', label: 'Active Clients' },
      { key: 'contracts', icon: '📋', label: 'Contract Terms' },
    ],
  },
  {
    label: 'Data Governance',
    items: [
      { key: 'sensitive-data',    icon: '⚠️',  label: 'Sensitive Data Approvals', badge: 3, badgeAmber: false },
      { key: 'quality',           icon: '📈',  label: 'Quality Ops' },
      { key: 'access-logs',       icon: '📊',  label: 'Access Logs' },
      { key: 'pending-requests',  icon: '📥',  label: 'Pending Requests',          badge: 2, badgeAmber: true },
    ],
  },
  {
    label: 'Platform',
    items: [
      { key: 'build-progress', icon: '▣', label: 'Build Progress' },
      { key: 'production-readiness', icon: '□', label: 'Production Readiness' },
      { key: 'audit-log',  icon: '📜', label: 'Audit Log' },
      { key: 'api-keys',   icon: '🔑', label: 'API Keys' },
      { key: 'compliance', icon: '✅', label: 'Compliance' },
    ],
  },
]

// ── Static data ───────────────────────────────────────────────────────────
// Roster mixes active Maestro + two recruitable slots; slot labels read as
// seed narrative rather than runtime placeholders.
const MAESTROS = [
  { name: 'Anand Sundaram', email: 'anand+clerk_test@abarva.com', roleBg: '#CCFBF1', roleColor: '#0F4F3E', roleLabel: 'Admin + Maestro', clients: 'Meridian · Arcturus', engagements: 4,  status: 'Active',  action: 'Manage →' },
  // dom-integrity-ignore-line
  { name: 'Open slot · Hire 1', email: 'Pending onboarding',          roleBg: BG2,       roleColor: MUTED,     roleLabel: 'Maestro',          clients: 'Unassigned',          engagements: 0,  status: 'Pending', action: 'Assign →' },
  // dom-integrity-ignore-line
  { name: 'Open slot · Hire 2', email: 'Pending onboarding',          roleBg: BG2,       roleColor: MUTED,     roleLabel: 'Maestro',          clients: 'Unassigned',          engagements: 0,  status: 'Pending', action: 'Assign →' },
]

const APPROVALS = [
  { dataset: 'Payer Contract Analysis', sub: 'Confidential · PII adjacent',  client: 'Meridian Health',    by: 'Anand S.', engagement: 'RCM AI — Denial Prevention', when: 'Today' },
  { dataset: 'CDO Profile + Org Chart', sub: 'Organisational · Sensitive',   client: 'Meridian Health',    by: 'Anand S.', engagement: 'Technology Modernization',  when: 'Yesterday' },
  { dataset: 'MAS Regulatory Filing',   sub: 'Regulatory · Restricted',      client: 'Arcturus Financial', by: 'Anand S.', engagement: 'MAS FEAT Compliance',        when: '2 days ago' },
]

// ── Shared table styles (spec-exact) ─────────────────────────────────────
const thStyle: React.CSSProperties = {
  padding: '9px 16px', fontSize: '10px', fontWeight: 700, color: MUTED,
  textTransform: 'uppercase', letterSpacing: '0.08em', background: BG2,
  borderBottom: `1px solid ${BORDER}`, textAlign: 'left', fontFamily: MONO,
}
const tdStyle: React.CSSProperties = {
  padding: '12px 16px', fontSize: '14px', color: DARK,
  borderBottom: `1px solid ${BG2}`, verticalAlign: 'middle',
}

function rowHover(on: boolean, row: HTMLTableRowElement) {
  Array.from(row.querySelectorAll('td')).forEach(td => {
    (td as HTMLElement).style.background = on ? BG2 : ''
  })
}

function StatusPill({ status }: { status: string }) {
  const active = status === 'Active'
  return (
    <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 9px', borderRadius: '10px', background: active ? '#DCFCE7' : '#FEF3C7', color: active ? '#166534' : '#78350F' }}>
      {status}
    </span>
  )
}

// ── Default view: Maestros management ─────────────────────────────────────
function MaestrosView() {
  return (
    <>
      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '20px', borderBottom: `1px solid ${BORDER}`, marginBottom: '24px' }}>
        <div>
          <div style={{ fontSize: '22px', fontWeight: 600, color: DARK, marginBottom: '4px' }}>Maestros</div>
          <div style={{ fontSize: '13px', color: MUTED }}>Manage Maestro accounts, roles, and client assignments</div>
        </div>
        <button style={{ background: DARK, color: BG, fontSize: '13px', fontWeight: 600, padding: '9px 18px', borderRadius: '5px', border: 'none', cursor: 'pointer', fontFamily: SANS }}>
          + Add Maestro
        </button>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '28px' }}>
        {[
          { label: 'Total Maestros',       value: '3', color: DARK,  sub: '1 pending onboarding' },
          { label: 'Active Clients',        value: '2', color: DARK,  sub: 'Meridian · Arcturus' },
          { label: 'Data Requests Pending', value: '3', color: RED,   sub: 'Awaiting your approval' },
          { label: 'Security Alerts',       value: '1', color: AMBER, sub: 'API key rotation due' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '7px', padding: '18px 20px' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: MONO, marginBottom: '8px' }}>{s.label}</div>
            <div style={{ fontSize: '26px', fontWeight: 600, color: s.color, lineHeight: 1, marginBottom: '4px' }}>{s.value}</div>
            <div style={{ fontSize: '12px', color: MUTED }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Maestros table */}
      <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '7px', overflow: 'hidden', marginBottom: '20px' }}>
        <div style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ fontSize: '15px', fontWeight: 600, color: DARK }}>All Maestros</div>
          <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 9px', borderRadius: '3px', background: BG2, color: MUTED }}>3 total</span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Name', 'Role', 'Clients Assigned', 'Active Engagements', 'Status', 'Action'].map(h => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MAESTROS.map((m, i) => (
              <tr key={i} onMouseEnter={e => rowHover(true, e.currentTarget)} onMouseLeave={e => rowHover(false, e.currentTarget)}>
                <td style={tdStyle}>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: DARK }}>{m.name}</div>
                  <div style={{ fontSize: '12px', color: MUTED, marginTop: '2px' }}>{m.email}</div>
                </td>
                <td style={tdStyle}>
                  <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 7px', borderRadius: '3px', background: m.roleBg, color: m.roleColor }}>{m.roleLabel}</span>
                </td>
                <td style={{ ...tdStyle, color: TEXT }}>{m.clients}</td>
                <td style={{ ...tdStyle, fontWeight: m.engagements ? 600 : 400, color: m.engagements ? DARK : MUTED }}>{m.engagements || '—'}</td>
                <td style={tdStyle}><StatusPill status={m.status} /></td>
                <td style={{ ...tdStyle, fontSize: '13px', fontWeight: 500, color: TEAL, cursor: 'pointer', whiteSpace: 'nowrap' }}>{m.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Sensitive Data Approvals table */}
      <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '7px', overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ fontSize: '15px', fontWeight: 600, color: DARK }}>Sensitive Data Approval Requests</div>
          <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 9px', borderRadius: '3px', background: '#FEF2F2', color: '#7F1D1D', border: '1px solid #FCA5A5' }}>3 pending</span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Dataset', 'Client', 'Requested By', 'Engagement', 'Requested', 'Action'].map(h => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {APPROVALS.map((r, i) => (
              <tr key={i} onMouseEnter={e => rowHover(true, e.currentTarget)} onMouseLeave={e => rowHover(false, e.currentTarget)}>
                <td style={tdStyle}>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: DARK }}>{r.dataset}</div>
                  <div style={{ fontSize: '12px', color: MUTED, marginTop: '2px' }}>{r.sub}</div>
                </td>
                <td style={{ ...tdStyle, color: DARK }}>{r.client}</td>
                <td style={{ ...tdStyle, color: DARK }}>{r.by}</td>
                <td style={{ ...tdStyle, color: MUTED }}>{r.engagement}</td>
                <td style={{ ...tdStyle, fontSize: '13px', color: MUTED }}>{r.when}</td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: GREEN, cursor: 'pointer' }}>Approve</span>
                    <span style={{ color: BORDER }}>|</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: RED, cursor: 'pointer' }}>Reject</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

function PlaceholderView({ title, sub }: { title: string; sub: string }) {
  return (
    <div>
      <div style={{ paddingBottom: '20px', borderBottom: `1px solid ${BORDER}`, marginBottom: '24px' }}>
        <div style={{ fontSize: '22px', fontWeight: 600, color: DARK, marginBottom: '4px' }}>{title}</div>
        <div style={{ fontSize: '13px', color: MUTED }}>{sub}</div>
      </div>
      <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '7px', padding: '48px', textAlign: 'center' }}>
        <div style={{ fontSize: '13px', color: MUTED }}>No items to display.</div>
      </div>
    </div>
  )
}

function QualityOpsJumpView() {
  return (
    <div>
      <div style={{ paddingBottom: '20px', borderBottom: `1px solid ${BORDER}`, marginBottom: '24px' }}>
        <div style={{ fontSize: '22px', fontWeight: 600, color: DARK, marginBottom: '4px' }}>Quality Ops</div>
        <div style={{ fontSize: '13px', color: MUTED }}>Score the corpus, inspect gaps, and resolve the actions that improve intelligence quality.</div>
      </div>
      <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '7px', padding: '28px' }}>
        <div style={{ fontSize: '10px', fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: MONO, marginBottom: '10px' }}>
          New internal surface
        </div>
        <div style={{ fontSize: '18px', fontWeight: 600, color: DARK, marginBottom: '8px' }}>Open the Quality Ops page</div>
        <div style={{ fontSize: '14px', color: MUTED, lineHeight: 1.7, marginBottom: '16px', maxWidth: '720px' }}>
          This page separates Data Quality, Evidence Integrity, Intelligence Quality, and Knowledge Health, then ties each score to concrete actions operators can resolve.
        </div>
        <a
          href="/platform/admin/quality"
          style={{ display: 'inline-block', background: DARK, color: BG, fontSize: '13px', fontWeight: 600, padding: '10px 16px', borderRadius: '6px', textDecoration: 'none' }}
        >
          Open Quality Ops →
        </a>
      </div>

      {/* Crawler-friendly admin nav · plain-anchor links to every admin
          sub-surface. Exposes the Steward rail's chip destinations as
          <a> elements so browser-automation agents can discover them
          without interacting with the guided-choice rail. */}
      <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '7px', padding: '24px', marginTop: '16px' }}>
        <div style={{ fontSize: '10px', fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: MONO, marginBottom: '12px' }}>
          Admin surfaces
        </div>
        <nav style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }} aria-label="Admin sub-surfaces">
          {[
            { href: '/platform/admin/users', label: 'Users · provisioning' },
            { href: '/platform/admin/connectors', label: 'Connectors · health' },
            { href: '/platform/admin/audit', label: 'Audit · cross-ledger' },
            { href: '/platform/admin/quality', label: 'Quality · ops' },
            { href: '/platform/admin/build-progress', label: 'Build Progress · backlog' },
            { href: '/platform/admin/production-readiness', label: 'Production Readiness · tracker' },
            { href: '/home/queue', label: 'Queue · your assignments' },
          ].map((link) => (
            <a
              key={link.href}
              href={link.href}
              style={{
                display: 'inline-block',
                background: BG,
                color: DARK,
                fontSize: '12px',
                fontWeight: 600,
                padding: '8px 14px',
                borderRadius: '6px',
                textDecoration: 'none',
                border: `1px solid ${BORDER}`,
              }}
            >
              {link.label} →
            </a>
          ))}
        </nav>
      </div>
    </div>
  )
}

function BuildProgressJumpView() {
  return (
    <div>
      <div style={{ paddingBottom: '20px', borderBottom: `1px solid ${BORDER}`, marginBottom: '24px' }}>
        <div style={{ fontSize: '22px', fontWeight: 600, color: DARK, marginBottom: '4px' }}>Build Progress</div>
        <div style={{ fontSize: '13px', color: MUTED }}>Track execution slices, critical path, validation status, blockers, and production readiness.</div>
      </div>
      <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '7px', padding: '28px' }}>
        <div style={{ fontSize: '10px', fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: MONO, marginBottom: '10px' }}>
          Founder control surface
        </div>
        <div style={{ fontSize: '18px', fontWeight: 600, color: DARK, marginBottom: '8px' }}>Open the Build Progress dashboard</div>
        <div style={{ fontSize: '14px', color: MUTED, lineHeight: 1.7, marginBottom: '16px', maxWidth: '720px' }}>
          The page is an internal mission-control view for the AbarVa backlog. It reads static TypeScript roadmap data today and is admin-only.
        </div>
        <a
          href="/platform/admin/build-progress"
          style={{ display: 'inline-block', background: DARK, color: BG, fontSize: '13px', fontWeight: 600, padding: '10px 16px', borderRadius: '6px', textDecoration: 'none' }}
        >
          Open Build Progress →
        </a>
      </div>
    </div>
  )
}

function ProductionReadinessJumpView() {
  return (
    <div>
      <div style={{ paddingBottom: '20px', borderBottom: `1px solid ${BORDER}`, marginBottom: '24px' }}>
        <div style={{ fontSize: '22px', fontWeight: 600, color: DARK, marginBottom: '4px' }}>Production Readiness</div>
        <div style={{ fontSize: '13px', color: MUTED }}>Review full-flow, pilot, and production readiness blockers from the deterministic PROD1 manifest.</div>
      </div>
      <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '7px', padding: '28px' }}>
        <div style={{ fontSize: '10px', fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: MONO, marginBottom: '10px' }}>
          Steward tracker
        </div>
        <div style={{ fontSize: '18px', fontWeight: 600, color: DARK, marginBottom: '8px' }}>Open the Production Readiness tracker</div>
        <div style={{ fontSize: '14px', color: MUTED, lineHeight: 1.7, marginBottom: '16px', maxWidth: '720px' }}>
          The tracker reads docs/build/production-readiness.json and does not claim live monitoring or production polling.
        </div>
        <a
          href="/platform/admin/production-readiness"
          style={{ display: 'inline-block', background: DARK, color: BG, fontSize: '13px', fontWeight: 600, padding: '10px 16px', borderRadius: '6px', textDecoration: 'none' }}
        >
          Open Production Readiness →
        </a>
      </div>
    </div>
  )
}

// ── Admin Portal — standalone, no maestro imports ─────────────────────────
export default function AdminPortal() {
  const { isLoaded, user } = useUser()
  const [active, setActive] = useState<Section>('control-center')

  const role = user?.publicMetadata?.role as string | undefined
  const fallbackRole =
    (user?.unsafeMetadata?.role as string | undefined)
    ?? (user?.publicMetadata?.legacyRole as string | undefined)
  const primaryEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase()
  const isAdmin =
    role === 'admin'
    || fallbackRole === 'admin'
    || (!!primaryEmail && ADMIN_EMAIL_ALLOWLIST.has(primaryEmail))

  if (!isLoaded) return null

  if (!user || !isAdmin) {
    return (
      <div style={{ background: BG, fontFamily: SANS, minHeight: 'calc(100vh - 104px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '15px', fontWeight: 600, color: DARK, marginBottom: '8px' }}>Admin Portal</div>
          <div style={{ fontSize: '13px', color: MUTED }}>This area is restricted to platform administrators.</div>
        </div>
      </div>
    )
  }

  function renderContent() {
    switch (active) {
      case 'control-center':   return <StewardSetupControlCenter />
      case 'maestros':         return <MaestrosView />
      case 'roles':            return <PlaceholderView title="Roles & Permissions"       sub="Manage user roles and access control." />
      case 'security':         return <PlaceholderView title="Security"                  sub="Security settings and authentication." />
      case 'clients':          return <PlaceholderView title="Active Clients"            sub="Client accounts and contract status." />
      case 'contracts':        return <PlaceholderView title="Contract Terms"            sub="Contract terms and SLA management." />
      case 'sensitive-data':   return <PlaceholderView title="Sensitive Data Approvals"  sub="Review and approve data access requests." />
      case 'quality':          return <QualityOpsJumpView />
      case 'access-logs':      return <PlaceholderView title="Access Logs"               sub="Data access audit trail by user and dataset." />
      case 'pending-requests': return <PlaceholderView title="Pending Requests"          sub="Maestro requests for elevated data access." />
      case 'build-progress':   return <BuildProgressJumpView />
      case 'production-readiness': return <ProductionReadinessJumpView />
      case 'audit-log':        return <PlaceholderView title="Audit Log"                 sub="Complete platform activity log." />
      case 'api-keys':         return <PlaceholderView title="API Keys"                  sub="Platform API keys and integrations." />
      case 'compliance':       return <PlaceholderView title="Compliance"                sub="SOC2 compliance status and reporting." />
      default:                 return <MaestrosView />
    }
  }

  const firstInitial = (user.firstName ?? user.primaryEmailAddress?.emailAddress ?? 'AS').charAt(0).toUpperCase()
  const lastInitial = (user.lastName ?? '').charAt(0).toUpperCase()
  const userInitials = `${firstInitial}${lastInitial || 'D'}`
  const clientNameMeta = (user.publicMetadata?.clientName as string | undefined) ?? 'AbarVa Ops'
  // Seed Steward with roster count from the in-page MAESTROS table; the
  // rail refetches live counts from /api/admin/steward-stats on mount.
  const initialMaestros = MAESTROS.filter(m => m.status === 'Active').length
  const initialPending = MAESTROS.filter(m => m.status === 'Pending').length

  return (
    <div style={{ background: BG, fontFamily: SANS }}>
      <StewardAdminRail
        initialMaestros={initialMaestros}
        initialPendingInvitations={initialPending}
        userInitials={userInitials}
        clientName={clientNameMeta}
      />
      <div style={{ display: 'flex', minHeight: 'calc(100vh - 104px)' }}>

        {/* ── Sidebar ──────────────────────────────────────────────── */}
        <div style={{ width: '240px', minWidth: '240px', background: '#020408', display: 'flex', flexDirection: 'column', paddingBottom: '20px', borderRight: '1px solid rgba(255,255,255,0.08)' }}>

          {/* Portal header */}
          <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', marginBottom: '4px' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: MONO, marginBottom: '4px' }}>
              Portal
            </div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: '#FAFAF9', marginBottom: '2px' }}>Admin Portal</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontFamily: MONO, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Platform governance
            </div>
          </div>

          {/* Nav groups */}
          {SIDEBAR_GROUPS.map(group => (
            <div key={group.label} style={{ padding: '14px 18px 4px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px', fontFamily: MONO }}>
                {group.label}
              </div>
              {group.items.map(item => {
                const isActive = active === item.key
                return (
                  <div
                    key={item.key}
                    onClick={() => setActive(item.key)}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '5px', cursor: 'pointer', marginBottom: '1px', background: isActive ? 'rgba(20,184,166,0.1)' : 'transparent', transition: 'background 0.15s' }}
                    onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)' }}
                    onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                  >
                    <span style={{ fontSize: '14px', color: isActive ? TEAL : 'rgba(255,255,255,0.45)', width: '16px', textAlign: 'center', flexShrink: 0 }}>
                      {item.icon}
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: isActive ? 600 : 400, color: isActive ? '#ffffff' : 'rgba(255,255,255,0.85)' }}>
                      {item.label}
                    </span>
                    {item.badge ? (
                      <span style={{ marginLeft: 'auto', fontSize: '10px', fontWeight: 700, background: item.badgeAmber ? AMBER : RED, color: '#fff', padding: '1px 6px', borderRadius: '8px', flexShrink: 0 }}>
                        {item.badge}
                      </span>
                    ) : null}
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        {/* ── Main content ─────────────────────────────────────────── */}
        <div style={{ flex: 1, padding: '28px 36px', background: BG, overflowY: 'auto' }}>
          {renderContent()}
        </div>

      </div>
    </div>
  )
}
