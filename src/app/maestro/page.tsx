'use client'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import AbarvaNav from '@/components/AbarvaNav'

const BG    = '#F8F7F4'
const DARK  = '#060A12'
const CARD  = '#FFFFFF'
const BDR   = '#E2E1DC'
const TEXT  = '#0C0C0C'
const TEXT2 = '#3C3C3C'
const MUTED = '#6B7280'
const TEAL  = '#2DD4C8'
const RED   = '#EF4444'
const AMBER = '#F59E0B'
const GREEN = '#34D399'
const SANS  = 'DM Sans, sans-serif'
const MONO  = 'JetBrains Mono, monospace'
const SERIF = 'Georgia, serif'

const CLIENTS = [
  {
    id: 'meridian',
    name: 'Meridian Health System',
    type: 'IDN · 14 hospitals',
    color: '#2DD4C8',
    status: 'Active',
    engagement: 'RCM AI — Denial Prevention',
    phase: 'Phase 1 · Execute',
    signal: 'Denial rate 34% above target. Epic go-live Q3 at risk.',
    signalColor: RED,
    value: '$94M',
    progress: 45,
    maestro: 'Anand S.',
  },
  {
    id: 'arcturus',
    name: 'Arcturus Financial',
    type: 'Asset Manager · Global',
    color: '#818CF8',
    status: 'Setup',
    engagement: 'Margin Optimization',
    phase: 'Phase 1 · Diagnose',
    signal: '$840M efficiency gap. No transformation programme accountable.',
    signalColor: RED,
    value: '$840M',
    progress: 12,
    maestro: 'Anand S.',
  },
]

const ALL_ENGAGEMENTS = [
  { client: 'Meridian Health System', clientColor: '#2DD4C8', name: 'RCM AI — Denial Prevention', type: 'AI Value Realization', phase: 1, status: 'In Progress', next: 'Gate review Mon', value: '$94M', maestro: 'Anand S.', id: 'meridian' },
  { client: 'Meridian Health System', clientColor: '#2DD4C8', name: 'Technology Modernization',    type: 'Solutions',          phase: 2, status: 'In Progress', next: 'Vendor scoring Tue', value: '$38M', maestro: 'Anand S.', id: 'meridian' },
  { client: 'Arcturus Financial',     clientColor: '#818CF8', name: 'Margin Optimization',         type: 'AI Value Realization', phase: 1, status: 'In Progress', next: 'Baseline lock Thu', value: '$840M', maestro: 'Anand S.', id: 'arcturus' },
  { client: 'Arcturus Financial',     clientColor: '#818CF8', name: 'MAS FEAT Compliance',         type: 'Solutions',          phase: 0, status: 'Assigned',    next: 'Kick-off TBD', value: 'Regulatory', maestro: 'TBD', id: 'arcturus' },
]

const APPROVALS = [
  { client: 'Meridian Health System', clientColor: '#2DD4C8', label: 'Phase 1 Gate — RCM AI', due: 'Due Monday', urgency: RED },
  { client: 'Arcturus Financial',     clientColor: '#818CF8', label: 'Baseline Lock — Margin', due: 'Due Thursday', urgency: AMBER },
]

const DATA_REQUESTS = [
  { client: 'Meridian Health System', clientColor: '#2DD4C8', label: 'Claims data 2022–2024 (PII)', status: 'Pending Admin', statusColor: AMBER },
  { client: 'Arcturus Financial',     clientColor: '#818CF8', label: 'FCA regulatory filings (Confidential)', status: 'Approved', statusColor: GREEN },
]

export default function MaestroHome() {
  const { user, isLoaded } = useUser()
  const router = useRouter()

  if (!isLoaded) return <div style={{ minHeight: '100vh', background: DARK }} />
  if (!user) { router.push('/sign-in'); return null }

  const firstName = user.firstName || user.fullName?.split(' ')[0] || 'Maestro'
  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: SANS }}>
      <AbarvaNav activePage="maestro" />

      {/* ── Hero bar ───────────────────────────────────────────────────────────── */}
      <div style={{ background: DARK, padding: '40px 48px 36px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ fontFamily: MONO, fontSize: 11, color: TEAL, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 8 }}>
            Maestro Workspace
          </div>
          <h1 style={{ fontFamily: SERIF, fontSize: 42, fontWeight: 400, color: '#EFF6FF', margin: '0 0 6px' }}>
            {greeting}, {firstName}.
          </h1>
          <p style={{ fontFamily: SANS, fontSize: 15, color: 'rgba(239,246,255,0.55)', margin: 0 }}>
            {CLIENTS.length} active clients · {ALL_ENGAGEMENTS.filter(e => e.status === 'In Progress').length} engagements in flight · {APPROVALS.length} approvals pending
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '40px 48px', display: 'grid', gridTemplateColumns: '1fr 340px', gap: 32 }}>

        {/* ── LEFT COLUMN ────────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

          {/* Today's Priority */}
          <section>
            <div style={{ fontFamily: MONO, fontSize: 10, color: TEAL, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 16 }}>
              Today&apos;s Priority
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {CLIENTS.map(c => (
                <a key={c.id} href={`/maestro/${c.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    background: CARD, border: `1px solid ${BDR}`, borderLeft: `4px solid ${c.color}`,
                    borderRadius: 10, padding: '24px 20px', cursor: 'pointer',
                    transition: 'box-shadow 0.15s',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)')}
                    onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div>
                        <div style={{ fontFamily: SANS, fontSize: 14, fontWeight: 700, color: TEXT }}>{c.name}</div>
                        <div style={{ fontFamily: MONO, fontSize: 10, color: MUTED, marginTop: 2 }}>{c.type}</div>
                      </div>
                      <span style={{
                        fontFamily: MONO, fontSize: 9, padding: '3px 8px', borderRadius: 4,
                        background: c.status === 'Active' ? 'rgba(52,211,153,0.1)' : 'rgba(245,158,11,0.1)',
                        color: c.status === 'Active' ? GREEN : AMBER,
                        border: `1px solid ${c.status === 'Active' ? 'rgba(52,211,153,0.3)' : 'rgba(245,158,11,0.3)'}`,
                      }}>
                        {c.status.toUpperCase()}
                      </span>
                    </div>

                    <div style={{ background: '#FEF2F2', border: `1px solid rgba(239,68,68,0.2)`, borderRadius: 6, padding: '10px 12px', marginBottom: 14 }}>
                      <div style={{ fontFamily: MONO, fontSize: 9, color: c.signalColor, letterSpacing: '.06em', marginBottom: 4 }}>SIGNAL</div>
                      <div style={{ fontFamily: SANS, fontSize: 12, color: TEXT2, lineHeight: 1.5 }}>{c.signal}</div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontFamily: SANS, fontSize: 12, color: TEXT2 }}>{c.engagement}</div>
                        <div style={{ fontFamily: MONO, fontSize: 10, color: c.color, marginTop: 2 }}>{c.phase}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 700, color: TEXT }}>{c.value}</div>
                        <div style={{ fontFamily: MONO, fontSize: 9, color: MUTED }}>OPPORTUNITY</div>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div style={{ marginTop: 14, height: 3, background: '#F3F4F6', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${c.progress}%`, background: c.color, borderRadius: 2 }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                      <div style={{ fontFamily: MONO, fontSize: 9, color: MUTED }}>Progress</div>
                      <div style={{ fontFamily: MONO, fontSize: 9, color: TEXT2 }}>{c.progress}%</div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </section>

          {/* My Engagements */}
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontFamily: MONO, fontSize: 10, color: TEAL, letterSpacing: '.12em', textTransform: 'uppercase' }}>
                My Engagements
              </div>
              <div style={{ fontFamily: MONO, fontSize: 9, color: MUTED }}>{ALL_ENGAGEMENTS.length} total</div>
            </div>
            <div style={{ background: CARD, border: `1px solid ${BDR}`, borderRadius: 10, overflow: 'hidden' }}>
              {/* Header */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 80px 80px 120px 100px', gap: 12, padding: '10px 20px', borderBottom: `1px solid ${BDR}`, background: BG }}>
                {['CLIENT / ENGAGEMENT', 'TYPE', 'PHASE', 'STATUS', 'NEXT ACTION', 'VALUE'].map(h => (
                  <div key={h} style={{ fontFamily: MONO, fontSize: 9, color: MUTED, letterSpacing: '.08em' }}>{h}</div>
                ))}
              </div>
              {ALL_ENGAGEMENTS.map((e, i) => (
                <a key={i} href={`/maestro/${e.id}`} style={{ textDecoration: 'none' }}>
                  <div
                    style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 80px 80px 120px 100px', gap: 12, padding: '14px 20px', borderBottom: i < ALL_ENGAGEMENTS.length - 1 ? `1px solid ${BDR}` : 'none', alignItems: 'center' }}
                    onMouseEnter={e2 => (e2.currentTarget.style.background = '#FAFAFA')}
                    onMouseLeave={e2 => (e2.currentTarget.style.background = 'transparent')}
                  >
                    <div>
                      <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, color: TEXT, marginBottom: 2 }}>{e.name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: e.clientColor }} />
                        <div style={{ fontFamily: SANS, fontSize: 11, color: MUTED }}>{e.client}</div>
                      </div>
                    </div>
                    <div style={{ fontFamily: MONO, fontSize: 10, color: MUTED }}>{e.type}</div>
                    <div style={{ fontFamily: MONO, fontSize: 11, color: TEAL }}>Ph {e.phase}</div>
                    <div>
                      <span style={{
                        fontFamily: MONO, fontSize: 9, padding: '2px 7px', borderRadius: 4,
                        background: e.status === 'In Progress' ? 'rgba(52,211,153,0.1)' : 'rgba(245,158,11,0.08)',
                        color: e.status === 'In Progress' ? GREEN : AMBER,
                        border: `1px solid ${e.status === 'In Progress' ? 'rgba(52,211,153,0.3)' : 'rgba(245,158,11,0.3)'}`,
                      }}>
                        {e.status === 'In Progress' ? 'ACTIVE' : e.status.toUpperCase()}
                      </span>
                    </div>
                    <div style={{ fontFamily: SANS, fontSize: 11, color: TEXT2 }}>{e.next}</div>
                    <div style={{ fontFamily: SERIF, fontSize: 15, fontWeight: 700, color: TEXT }}>{e.value}</div>
                  </div>
                </a>
              ))}
            </div>
          </section>

        </div>

        {/* ── RIGHT COLUMN ───────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* My Clients */}
          <section>
            <div style={{ fontFamily: MONO, fontSize: 10, color: TEAL, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 14 }}>
              My Clients
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {CLIENTS.map(c => (
                <a key={c.id} href={`/maestro/${c.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    background: CARD, border: `1px solid ${BDR}`, borderRadius: 8, padding: '14px 16px',
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#FAFAFA')}
                    onMouseLeave={e => (e.currentTarget.style.background = CARD)}
                  >
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: c.color, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, color: TEXT }}>{c.name}</div>
                      <div style={{ fontFamily: MONO, fontSize: 10, color: MUTED, marginTop: 2 }}>{c.type}</div>
                    </div>
                    <span style={{ fontFamily: MONO, fontSize: 9, color: MUTED }}>→</span>
                  </div>
                </a>
              ))}
            </div>
          </section>

          {/* Pending Approvals */}
          <section>
            <div style={{ fontFamily: MONO, fontSize: 10, color: TEAL, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 14 }}>
              Pending Approvals
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {APPROVALS.map((a, i) => (
                <div key={i} style={{ background: CARD, border: `1px solid ${BDR}`, borderLeft: `3px solid ${a.urgency}`, borderRadius: 8, padding: '14px 16px' }}>
                  <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, color: TEXT, marginBottom: 4 }}>{a.label}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: a.clientColor }} />
                    <div style={{ fontFamily: MONO, fontSize: 10, color: MUTED }}>{a.client}</div>
                  </div>
                  <div style={{ fontFamily: MONO, fontSize: 10, color: a.urgency, marginTop: 6 }}>{a.due}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Data Requests */}
          <section>
            <div style={{ fontFamily: MONO, fontSize: 10, color: TEAL, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 14 }}>
              Data Requests
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {DATA_REQUESTS.map((d, i) => (
                <div key={i} style={{ background: CARD, border: `1px solid ${BDR}`, borderRadius: 8, padding: '14px 16px' }}>
                  <div style={{ fontFamily: SANS, fontSize: 12, color: TEXT, marginBottom: 6, lineHeight: 1.4 }}>{d.label}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: d.clientColor }} />
                      <div style={{ fontFamily: MONO, fontSize: 10, color: MUTED }}>{d.client}</div>
                    </div>
                    <span style={{
                      fontFamily: MONO, fontSize: 9, padding: '2px 7px', borderRadius: 4,
                      background: d.status === 'Approved' ? 'rgba(52,211,153,0.1)' : 'rgba(245,158,11,0.1)',
                      color: d.statusColor,
                      border: `1px solid ${d.status === 'Approved' ? 'rgba(52,211,153,0.3)' : 'rgba(245,158,11,0.3)'}`,
                    }}>
                      {d.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}
