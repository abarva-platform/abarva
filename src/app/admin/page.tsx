'use client'
import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import AbarvaNav from '@/components/AbarvaNav'

const PAGE  = '#F8F7F4'
const CARD  = '#FFFFFF'
const BDR   = '#E5E7EB'
const TEXT  = '#0C0C0C'
const TEXT2 = '#3C3C3C'
const MUTED = '#6B7280'
const TEAL  = '#2DD4C8'
const RED   = '#EF4444'
const AMBER = '#F59E0B'
const GREEN = '#34D399'
const DARK  = '#060A12'
const SANS  = 'DM Sans, sans-serif'
const MONO  = 'JetBrains Mono, monospace'
const SERIF = 'Georgia, serif'

type Section =
  | 'dashboard'
  | 'maestros' | 'roles' | 'security'
  | 'clients' | 'contracts'
  | 'data-approvals' | 'data-logs' | 'data-requests'
  | 'audit' | 'api-keys' | 'compliance'

const NAV_GROUPS = [
  {
    label: 'USERS & ACCESS',
    items: [
      { key: 'maestros' as Section, label: 'Maestros' },
      { key: 'roles'    as Section, label: 'Roles & Permissions' },
      { key: 'security' as Section, label: 'Security' },
    ],
  },
  {
    label: 'CLIENT GOVERNANCE',
    items: [
      { key: 'clients'   as Section, label: 'Active Clients' },
      { key: 'contracts' as Section, label: 'Contract Terms' },
    ],
  },
  {
    label: 'DATA GOVERNANCE',
    items: [
      { key: 'data-approvals' as Section, label: 'Sensitive Data Approvals' },
      { key: 'data-logs'      as Section, label: 'Data Access Logs' },
      { key: 'data-requests'  as Section, label: 'Pending Requests' },
    ],
  },
  {
    label: 'PLATFORM',
    items: [
      { key: 'audit'      as Section, label: 'Audit Log' },
      { key: 'api-keys'   as Section, label: 'API Keys' },
      { key: 'compliance' as Section, label: 'Compliance' },
    ],
  },
]

// ── Pending items (demo data) ──────────────────────────────────────────────────
const PENDING_DATA = [
  { client: 'Meridian Health System', clientColor: '#2DD4C8', maestro: 'Anand S.', dataset: 'Claims data 2022–2024 (PII)', classification: 'PII', requested: '2 hours ago', urgency: RED },
  { client: 'Arcturus Financial',     clientColor: '#818CF8', maestro: 'Anand S.', dataset: 'FCA regulatory filings (Confidential)', classification: 'Confidential', requested: '1 day ago', urgency: AMBER },
]

const PENDING_MAESTROS = [
  { name: 'Jordan Blake', email: 'jordan@abarva.com', requested: '3 hours ago' },
]

const PENDING_CLIENTS = [
  { name: 'Westbridge Capital', type: 'Asset Manager', submitted: '1 day ago' },
]

const AUDIT_LOG = [
  { who: 'Anand S.', action: 'Approved sensitive data request', detail: 'Arcturus Financial · FCA filings', when: '14:22 today', color: GREEN },
  { who: 'System',   action: 'Phase gate submitted for approval', detail: 'Meridian · RCM AI Ph1', when: '11:05 today', color: TEAL },
  { who: 'Anand S.', action: 'Created Maestro account', detail: 'jordan@abarva.com', when: 'Yesterday 16:40', color: MUTED },
  { who: 'System',   action: 'Client onboarded', detail: 'Arcturus Financial — status Active', when: 'Yesterday 09:12', color: MUTED },
  { who: 'Anand S.', action: 'API key rotated', detail: 'Production key — Supabase', when: '2 days ago', color: AMBER },
]

const CLIENTS_LIST = [
  { name: 'Meridian Health System', type: 'IDN · 14 hospitals',    status: 'Active', tier: 'Enterprise', maestro: 'Anand S.', since: '2026-01-15', color: '#2DD4C8' },
  { name: 'Arcturus Financial',     type: 'Asset Manager · Global', status: 'Active', tier: 'Enterprise', maestro: 'Anand S.', since: '2026-02-01', color: '#818CF8' },
]

const MAESTROS_LIST = [
  { name: 'Anand Sundaram', email: 'anand@abarva.com', role: 'Admin', clients: 'Meridian, Arcturus', status: 'Active', since: '2025-01-01' },
]

// ── Section components ─────────────────────────────────────────────────────────

function Dashboard() {
  const totalPending = PENDING_DATA.length + PENDING_MAESTROS.length + PENDING_CLIENTS.length
  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: MONO, fontSize: 10, color: TEAL, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 8 }}>Admin Dashboard</div>
        <h2 style={{ fontFamily: SERIF, fontSize: 32, fontWeight: 400, color: TEXT, margin: '0 0 6px' }}>
          {totalPending === 0 ? 'All clear.' : `${totalPending} item${totalPending > 1 ? 's' : ''} need your attention.`}
        </h2>
        <p style={{ fontFamily: SANS, fontSize: 14, color: MUTED, margin: 0 }}>
          Platform administration · Users, governance, data, security.
        </p>
      </div>

      {/* Stat row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 40 }}>
        {[
          { label: 'Data Requests Pending', value: PENDING_DATA.length,     color: PENDING_DATA.length > 0 ? RED : GREEN },
          { label: 'Maestro Accounts',      value: MAESTROS_LIST.length,    color: TEAL },
          { label: 'Active Clients',         value: CLIENTS_LIST.length,     color: TEAL },
          { label: 'Compliance Status',      value: 'SOC2',                  color: GREEN },
        ].map((s, i) => (
          <div key={i} style={{ background: CARD, border: `1px solid ${BDR}`, borderRadius: 10, padding: '20px 22px' }}>
            <div style={{ fontFamily: SERIF, fontSize: 36, fontWeight: 700, color: s.color, marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontFamily: MONO, fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '.08em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Pending sensitive data requests */}
      {PENDING_DATA.length > 0 && (
        <div style={{ background: CARD, border: `1px solid ${BDR}`, borderLeft: `4px solid ${RED}`, borderRadius: 10, padding: '24px 28px', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <div>
              <div style={{ fontFamily: MONO, fontSize: 10, color: RED, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 4 }}>Action Required</div>
              <div style={{ fontFamily: SANS, fontSize: 16, fontWeight: 700, color: TEXT }}>Sensitive Data Access Requests</div>
            </div>
            <span style={{ fontFamily: MONO, fontSize: 11, padding: '3px 10px', borderRadius: 20, background: 'rgba(239,68,68,0.1)', color: RED, border: '1px solid rgba(239,68,68,0.3)' }}>
              {PENDING_DATA.length} pending
            </span>
          </div>
          {PENDING_DATA.map((d, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 16, alignItems: 'center', padding: '14px 0', borderTop: i > 0 ? `1px solid ${BDR}` : 'none' }}>
              <div>
                <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, color: TEXT, marginBottom: 4 }}>{d.dataset}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: d.clientColor }} />
                  <div style={{ fontFamily: SANS, fontSize: 12, color: MUTED }}>{d.client} · Requested by {d.maestro}</div>
                </div>
              </div>
              <div>
                <span style={{ fontFamily: MONO, fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'rgba(239,68,68,0.08)', color: RED, border: '1px solid rgba(239,68,68,0.2)' }}>
                  {d.classification}
                </span>
                <div style={{ fontFamily: MONO, fontSize: 10, color: MUTED, marginTop: 6 }}>{d.requested}</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={{ padding: '8px 18px', background: TEXT, color: CARD, border: 'none', borderRadius: 6, fontFamily: SANS, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Approve</button>
                <button style={{ padding: '8px 18px', background: 'transparent', color: MUTED, border: `1px solid ${BDR}`, borderRadius: 6, fontFamily: SANS, fontSize: 12, cursor: 'pointer' }}>Deny</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recent audit log */}
      <div style={{ background: CARD, border: `1px solid ${BDR}`, borderRadius: 10, padding: '24px 28px' }}>
        <div style={{ fontFamily: MONO, fontSize: 10, color: TEAL, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 18 }}>Recent Audit Log</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {AUDIT_LOG.map((e, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '16px 1fr 140px', gap: 14, alignItems: 'flex-start', padding: '12px 0', borderBottom: i < AUDIT_LOG.length - 1 ? `1px solid ${BDR}` : 'none' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: e.color, marginTop: 4 }} />
              <div>
                <span style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, color: TEXT }}>{e.who}</span>
                <span style={{ fontFamily: SANS, fontSize: 13, color: TEXT2 }}> — {e.action}</span>
                <div style={{ fontFamily: SANS, fontSize: 12, color: MUTED, marginTop: 2 }}>{e.detail}</div>
              </div>
              <div style={{ fontFamily: MONO, fontSize: 10, color: MUTED, textAlign: 'right', paddingTop: 2 }}>{e.when}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function MaestrosSection() {
  return (
    <div>
      <div style={{ fontFamily: MONO, fontSize: 10, color: TEAL, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 8 }}>Users & Access</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28 }}>
        <h2 style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 400, color: TEXT, margin: 0 }}>Maestros</h2>
        <button style={{ padding: '10px 22px', background: TEXT, color: CARD, border: 'none', borderRadius: 7, fontFamily: SANS, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          + Invite Maestro
        </button>
      </div>

      {PENDING_MAESTROS.length > 0 && (
        <div style={{ background: 'rgba(245,158,11,0.06)', border: `1px solid rgba(245,158,11,0.3)`, borderRadius: 10, padding: '18px 22px', marginBottom: 24 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, color: AMBER, letterSpacing: '.08em', marginBottom: 14 }}>PENDING APPROVAL</div>
          {PENDING_MAESTROS.map((m, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontFamily: SANS, fontSize: 14, fontWeight: 600, color: TEXT }}>{m.name}</div>
                <div style={{ fontFamily: SANS, fontSize: 12, color: MUTED }}>{m.email} · Requested {m.requested}</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={{ padding: '8px 18px', background: TEXT, color: CARD, border: 'none', borderRadius: 6, fontFamily: SANS, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Approve</button>
                <button style={{ padding: '8px 18px', background: 'transparent', color: MUTED, border: `1px solid ${BDR}`, borderRadius: 6, fontFamily: SANS, fontSize: 12, cursor: 'pointer' }}>Deny</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ background: CARD, border: `1px solid ${BDR}`, borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 80px', gap: 12, padding: '10px 20px', background: PAGE, borderBottom: `1px solid ${BDR}` }}>
          {['NAME / EMAIL', 'ROLE', 'CLIENTS', 'STATUS', 'SINCE'].map(h => (
            <div key={h} style={{ fontFamily: MONO, fontSize: 9, color: MUTED, letterSpacing: '.08em' }}>{h}</div>
          ))}
        </div>
        {MAESTROS_LIST.map((m, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 80px', gap: 12, padding: '16px 20px', borderBottom: i < MAESTROS_LIST.length - 1 ? `1px solid ${BDR}` : 'none', alignItems: 'center' }}>
            <div>
              <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, color: TEXT }}>{m.name}</div>
              <div style={{ fontFamily: SANS, fontSize: 11, color: MUTED }}>{m.email}</div>
            </div>
            <div style={{ fontFamily: MONO, fontSize: 11, color: TEAL }}>{m.role}</div>
            <div style={{ fontFamily: SANS, fontSize: 12, color: TEXT2 }}>{m.clients}</div>
            <span style={{ fontFamily: MONO, fontSize: 9, padding: '2px 8px', borderRadius: 4, width: 'fit-content', background: 'rgba(52,211,153,0.1)', color: GREEN, border: '1px solid rgba(52,211,153,0.3)' }}>
              {m.status.toUpperCase()}
            </span>
            <div style={{ fontFamily: MONO, fontSize: 10, color: MUTED }}>{m.since}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ClientsSection() {
  return (
    <div>
      <div style={{ fontFamily: MONO, fontSize: 10, color: TEAL, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 8 }}>Client Governance</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28 }}>
        <h2 style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 400, color: TEXT, margin: 0 }}>Active Clients</h2>
        <button style={{ padding: '10px 22px', background: TEXT, color: CARD, border: 'none', borderRadius: 7, fontFamily: SANS, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          + Onboard Client
        </button>
      </div>

      {PENDING_CLIENTS.length > 0 && (
        <div style={{ background: 'rgba(245,158,11,0.06)', border: `1px solid rgba(245,158,11,0.3)`, borderRadius: 10, padding: '18px 22px', marginBottom: 24 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, color: AMBER, letterSpacing: '.08em', marginBottom: 14 }}>PENDING ONBOARDING</div>
          {PENDING_CLIENTS.map((c, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontFamily: SANS, fontSize: 14, fontWeight: 600, color: TEXT }}>{c.name}</div>
                <div style={{ fontFamily: SANS, fontSize: 12, color: MUTED }}>{c.type} · Submitted {c.submitted}</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={{ padding: '8px 18px', background: TEXT, color: CARD, border: 'none', borderRadius: 6, fontFamily: SANS, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Approve</button>
                <button style={{ padding: '8px 18px', background: 'transparent', color: MUTED, border: `1px solid ${BDR}`, borderRadius: 6, fontFamily: SANS, fontSize: 12, cursor: 'pointer' }}>Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ background: CARD, border: `1px solid ${BDR}`, borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 80px 1fr 80px', gap: 12, padding: '10px 20px', background: PAGE, borderBottom: `1px solid ${BDR}` }}>
          {['CLIENT', 'TIER', 'STATUS', 'MAESTRO', 'SINCE'].map(h => (
            <div key={h} style={{ fontFamily: MONO, fontSize: 9, color: MUTED, letterSpacing: '.08em' }}>{h}</div>
          ))}
        </div>
        {CLIENTS_LIST.map((c, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 80px 1fr 80px', gap: 12, padding: '16px 20px', borderBottom: i < CLIENTS_LIST.length - 1 ? `1px solid ${BDR}` : 'none', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.color, flexShrink: 0 }} />
              <div>
                <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, color: TEXT }}>{c.name}</div>
                <div style={{ fontFamily: SANS, fontSize: 11, color: MUTED }}>{c.type}</div>
              </div>
            </div>
            <div style={{ fontFamily: MONO, fontSize: 11, color: TEXT2 }}>{c.tier}</div>
            <span style={{ fontFamily: MONO, fontSize: 9, padding: '2px 8px', borderRadius: 4, width: 'fit-content', background: 'rgba(52,211,153,0.1)', color: GREEN, border: '1px solid rgba(52,211,153,0.3)' }}>
              {c.status.toUpperCase()}
            </span>
            <div style={{ fontFamily: SANS, fontSize: 12, color: TEXT2 }}>{c.maestro}</div>
            <div style={{ fontFamily: MONO, fontSize: 10, color: MUTED }}>{c.since}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function DataApprovalsSection() {
  return (
    <div>
      <div style={{ fontFamily: MONO, fontSize: 10, color: TEAL, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 8 }}>Data Governance</div>
      <h2 style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 400, color: TEXT, margin: '0 0 28px' }}>Sensitive Data Approvals</h2>

      {PENDING_DATA.length === 0 ? (
        <div style={{ background: CARD, border: `1px solid ${BDR}`, borderRadius: 10, padding: 40, textAlign: 'center', color: MUTED, fontFamily: SANS, fontSize: 14 }}>
          No pending requests.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {PENDING_DATA.map((d, i) => (
            <div key={i} style={{ background: CARD, border: `1px solid ${BDR}`, borderLeft: `4px solid ${d.urgency}`, borderRadius: 10, padding: '24px 28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: SANS, fontSize: 16, fontWeight: 700, color: TEXT, marginBottom: 8 }}>{d.dataset}</div>
                  <div style={{ display: 'flex', gap: 20, marginBottom: 16 }}>
                    <div>
                      <div style={{ fontFamily: MONO, fontSize: 9, color: MUTED, marginBottom: 2 }}>CLIENT</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: d.clientColor }} />
                        <div style={{ fontFamily: SANS, fontSize: 13, color: TEXT2 }}>{d.client}</div>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontFamily: MONO, fontSize: 9, color: MUTED, marginBottom: 2 }}>REQUESTED BY</div>
                      <div style={{ fontFamily: SANS, fontSize: 13, color: TEXT2 }}>{d.maestro}</div>
                    </div>
                    <div>
                      <div style={{ fontFamily: MONO, fontSize: 9, color: MUTED, marginBottom: 2 }}>CLASSIFICATION</div>
                      <span style={{ fontFamily: MONO, fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'rgba(239,68,68,0.08)', color: RED, border: '1px solid rgba(239,68,68,0.2)' }}>
                        {d.classification}
                      </span>
                    </div>
                    <div>
                      <div style={{ fontFamily: MONO, fontSize: 9, color: MUTED, marginBottom: 2 }}>RECEIVED</div>
                      <div style={{ fontFamily: SANS, fontSize: 13, color: TEXT2 }}>{d.requested}</div>
                    </div>
                  </div>
                  <div style={{ background: PAGE, border: `1px solid ${BDR}`, borderRadius: 6, padding: '12px 16px', fontFamily: SANS, fontSize: 12, color: MUTED, lineHeight: 1.6 }}>
                    Approving this request grants the Maestro read access to the dataset for the duration of their active engagement with this client. Access is logged and can be revoked at any time.
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button style={{ padding: '10px 28px', background: TEXT, color: CARD, border: 'none', borderRadius: 7, fontFamily: SANS, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  Approve Access
                </button>
                <button style={{ padding: '10px 28px', background: 'transparent', color: RED, border: `1px solid rgba(239,68,68,0.4)`, borderRadius: 7, fontFamily: SANS, fontSize: 13, cursor: 'pointer' }}>
                  Deny
                </button>
                <button style={{ padding: '10px 28px', background: 'transparent', color: MUTED, border: `1px solid ${BDR}`, borderRadius: 7, fontFamily: SANS, fontSize: 13, cursor: 'pointer' }}>
                  Request More Info
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function AuditLogSection() {
  return (
    <div>
      <div style={{ fontFamily: MONO, fontSize: 10, color: TEAL, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 8 }}>Platform</div>
      <h2 style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 400, color: TEXT, margin: '0 0 28px' }}>Audit Log</h2>
      <div style={{ background: CARD, border: `1px solid ${BDR}`, borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr 1fr 160px', gap: 12, padding: '10px 20px', background: PAGE, borderBottom: `1px solid ${BDR}` }}>
          {['', 'ACTION', 'DETAIL', 'TIMESTAMP'].map(h => (
            <div key={h} style={{ fontFamily: MONO, fontSize: 9, color: MUTED, letterSpacing: '.08em' }}>{h}</div>
          ))}
        </div>
        {AUDIT_LOG.map((e, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '28px 1fr 1fr 160px', gap: 12, padding: '14px 20px', borderBottom: i < AUDIT_LOG.length - 1 ? `1px solid ${BDR}` : 'none', alignItems: 'center' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: e.color }} />
            <div>
              <span style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, color: TEXT }}>{e.who}</span>
              <span style={{ fontFamily: SANS, fontSize: 13, color: TEXT2 }}> — {e.action}</span>
            </div>
            <div style={{ fontFamily: SANS, fontSize: 12, color: MUTED }}>{e.detail}</div>
            <div style={{ fontFamily: MONO, fontSize: 10, color: MUTED }}>{e.when}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function PlaceholderSection({ title, sub }: { title: string; sub: string }) {
  return (
    <div>
      <h2 style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 400, color: TEXT, margin: '0 0 8px' }}>{title}</h2>
      <p style={{ fontFamily: SANS, fontSize: 14, color: MUTED, margin: '0 0 32px' }}>{sub}</p>
      <div style={{ background: CARD, border: `1px solid ${BDR}`, borderRadius: 10, padding: '60px 40px', textAlign: 'center', color: MUTED, fontFamily: SANS, fontSize: 14 }}>
        Coming soon.
      </div>
    </div>
  )
}

// ── Admin portal ──────────────────────────────────────────────────────────────
function AdminPortalInner() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [section, setSection] = useState<Section>('dashboard')

  const metaRole = user?.publicMetadata?.role as string | undefined

  useEffect(() => {
    if (!isLoaded) return
    if (!user) { router.push('/sign-in'); return }
    if (metaRole !== 'admin' && metaRole !== 'investor') { router.push('/maestro') }
  }, [isLoaded, user, metaRole, router])

  if (!isLoaded || !user) return <div style={{ minHeight: '100vh', background: DARK }} />
  if (metaRole !== 'admin' && metaRole !== 'investor') return <div style={{ minHeight: '100vh', background: DARK }} />

  const renderSection = () => {
    if (section === 'dashboard')      return <Dashboard />
    if (section === 'maestros')       return <MaestrosSection />
    if (section === 'clients')        return <ClientsSection />
    if (section === 'data-approvals') return <DataApprovalsSection />
    if (section === 'audit')          return <AuditLogSection />
    if (section === 'roles')          return <PlaceholderSection title="Roles & Permissions" sub="Define what each role can see and do." />
    if (section === 'security')       return <PlaceholderSection title="Security" sub="SSO configuration, MFA enforcement, session policies." />
    if (section === 'contracts')      return <PlaceholderSection title="Contract Terms" sub="Fee models, outcome share rates, contract windows." />
    if (section === 'data-logs')      return <PlaceholderSection title="Data Access Logs" sub="Who accessed which datasets, when." />
    if (section === 'data-requests')  return <PlaceholderSection title="Pending Requests" sub="Maestro requests awaiting admin decision." />
    if (section === 'api-keys')       return <PlaceholderSection title="API Keys" sub="Manage production and sandbox credentials." />
    if (section === 'compliance')     return <PlaceholderSection title="Compliance" sub="HIPAA, SOC2, data retention and audit controls." />
    return <Dashboard />
  }

  return (
    <div style={{ minHeight: '100vh', background: PAGE, fontFamily: SANS, display: 'flex', flexDirection: 'column' }}>
      <AbarvaNav activePage="admin" />

      <div style={{ display: 'flex', flex: 1 }}>

        {/* ── Sidebar ────────────────────────────────────────────────────────── */}
        <div style={{ width: 240, background: DARK, padding: '32px 0', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>

          {/* Dashboard link */}
          <button
            onClick={() => setSection('dashboard')}
            style={{
              display: 'block', width: '100%', textAlign: 'left',
              padding: '10px 24px', background: section === 'dashboard' ? 'rgba(45,212,200,0.12)' : 'transparent',
              border: 'none', borderLeft: `3px solid ${section === 'dashboard' ? TEAL : 'transparent'}`,
              fontFamily: SANS, fontSize: 13, fontWeight: 700, color: section === 'dashboard' ? TEAL : 'rgba(239,246,255,0.7)',
              cursor: 'pointer', marginBottom: 20,
            }}
          >
            Admin Dashboard
          </button>

          {NAV_GROUPS.map(g => (
            <div key={g.label} style={{ marginBottom: 24 }}>
              <div style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(239,246,255,0.35)', letterSpacing: '.12em', textTransform: 'uppercase', padding: '0 24px', marginBottom: 6 }}>
                {g.label}
              </div>
              {g.items.map(item => (
                <button
                  key={item.key}
                  onClick={() => setSection(item.key)}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: '9px 24px', background: section === item.key ? 'rgba(45,212,200,0.12)' : 'transparent',
                    border: 'none', borderLeft: `3px solid ${section === item.key ? TEAL : 'transparent'}`,
                    fontFamily: SANS, fontSize: 13,
                    color: section === item.key ? TEAL : 'rgba(239,246,255,0.7)',
                    cursor: 'pointer',
                  }}
                >
                  {item.label}
                  {item.key === 'data-approvals' && PENDING_DATA.length > 0 && (
                    <span style={{ marginLeft: 8, background: RED, color: '#fff', borderRadius: 8, fontSize: 9, padding: '1px 6px', fontFamily: MONO }}>
                      {PENDING_DATA.length}
                    </span>
                  )}
                  {item.key === 'maestros' && PENDING_MAESTROS.length > 0 && (
                    <span style={{ marginLeft: 8, background: AMBER, color: '#fff', borderRadius: 8, fontSize: 9, padding: '1px 6px', fontFamily: MONO }}>
                      {PENDING_MAESTROS.length}
                    </span>
                  )}
                  {item.key === 'clients' && PENDING_CLIENTS.length > 0 && (
                    <span style={{ marginLeft: 8, background: AMBER, color: '#fff', borderRadius: 8, fontSize: 9, padding: '1px 6px', fontFamily: MONO }}>
                      {PENDING_CLIENTS.length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          ))}

          {/* Separator + Maestro workspace link */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', margin: '12px 24px 16px' }} />
          <a href="/maestro" style={{ display: 'block', padding: '10px 24px', fontFamily: SANS, fontSize: 13, color: 'rgba(239,246,255,0.45)', textDecoration: 'none' }}>
            ← Maestro Workspace
          </a>
        </div>

        {/* ── Main content ───────────────────────────────────────────────────── */}
        <div style={{ flex: 1, padding: '48px 52px', maxWidth: 1000 }}>
          {renderSection()}
        </div>

      </div>
    </div>
  )
}

export default function AdminPage() {
  return <AdminPortalInner />
}
