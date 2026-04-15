'use client'
import { useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import AbarvaNav from '@/components/AbarvaNav'

const BG = '#060A12', CARD = '#0D1520', BORDER = '#1C2D45'
const TEAL = '#2DD4C8', WHITE = '#EFF6FF', MUTED = '#94A3B8', DIM = '#475569'
const GREEN = '#34D399', AMBER = '#F59E0B'
const SANS = 'DM Sans, sans-serif', MONO = 'JetBrains Mono, monospace', SERIF = 'Georgia, serif'

const CLIENTS = [
  {
    id: 'meridian',
    name: 'Meridian Health System',
    type: 'IDN',
    revenue: '$11.2B',
    employees: '42,000',
    hq: 'Charlotte, NC',
    color: '#4DA3FF',
    status: 'Active',
    phase: 'Phase 2 · In Progress',
    alert: 'CDO vacancy blocking $82M',
  },
  {
    id: 'arcturus',
    name: 'Arcturus Financial Group',
    type: 'Asset Manager',
    revenue: '$16.2B',
    employees: '13,000',
    hq: 'Global',
    color: '#818CF8',
    status: 'Setup',
    phase: 'Phase 0 · Baseline pending',
    alert: 'MAS FEAT overdue 4 months',
  },
]

export default function AdminPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!isLoaded) return
    if (!user) { router.push('/sign-in'); return }
    const role = user.publicMetadata?.role as string
    if (role !== 'admin') { router.push('/'); return }
  }, [isLoaded, user, router])

  if (!isLoaded || !user) return <div style={{ minHeight: '100vh', background: BG }} />

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: SANS, color: WHITE }}>
      <AbarvaNav activePage="admin" />

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 48px 80px' }}>
        {/* Header */}
        <div style={{ marginBottom: '36px' }}>
          <div style={{ fontFamily: MONO, fontSize: '9px', color: TEAL, letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: '10px' }}>
            Maestro · All Engagements
          </div>
          <h1 style={{ fontFamily: SERIF, fontSize: '32px', fontWeight: 700, color: WHITE, margin: 0 }}>
            Active clients
          </h1>
        </div>

        {/* Client grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          {CLIENTS.map(c => (
            <a
              key={c.id}
              href={`/admin/client/${c.id}`}
              style={{ textDecoration: 'none' }}
            >
              <div style={{
                background: CARD, border: `1px solid ${BORDER}`,
                borderLeft: `4px solid ${c.color}`,
                borderRadius: '10px', padding: '24px 28px',
                cursor: 'pointer', transition: 'border-color 0.15s',
              }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = c.color}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = BORDER}
              >
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: c.color, flexShrink: 0 }} />
                      <div style={{ fontSize: '18px', fontWeight: 600, color: WHITE }}>{c.name}</div>
                    </div>
                    <div style={{ fontSize: '12px', color: MUTED, paddingLeft: '18px' }}>
                      {c.type} · {c.revenue} revenue · {c.employees} employees · {c.hq}
                    </div>
                  </div>
                  <span style={{
                    fontFamily: MONO, fontSize: '9px', padding: '3px 10px', borderRadius: '20px',
                    background: c.status === 'Active' ? 'rgba(52,211,153,0.12)' : 'rgba(245,158,11,0.12)',
                    color: c.status === 'Active' ? GREEN : AMBER,
                    border: `1px solid ${c.status === 'Active' ? 'rgba(52,211,153,0.25)' : 'rgba(245,158,11,0.25)'}`,
                    letterSpacing: '.06em', textTransform: 'uppercase' as const, flexShrink: 0,
                  }}>
                    {c.status}
                  </span>
                </div>

                {/* Phase + alert */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                  <div style={{ fontFamily: MONO, fontSize: '10px', color: c.color, letterSpacing: '.06em' }}>
                    {c.phase}
                  </div>
                  <div style={{
                    fontSize: '11px', color: AMBER,
                    background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
                    borderRadius: '4px', padding: '3px 10px', flexShrink: 0,
                  }}>
                    ⚠ {c.alert}
                  </div>
                </div>

                {/* Open in Maestro */}
                <div style={{ marginTop: '18px', paddingTop: '14px', borderTop: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontFamily: MONO, fontSize: '9px', color: DIM, letterSpacing: '.08em', textTransform: 'uppercase' as const }}>
                    Open workspace
                  </div>
                  <span style={{ fontFamily: MONO, fontSize: '10px', color: TEAL }}>→</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
