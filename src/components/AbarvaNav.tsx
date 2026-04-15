'use client'
import { useState, useRef } from 'react'
import { useUser, useClerk } from '@clerk/nextjs'
import { usePathname, useRouter } from 'next/navigation'

const PAGE_BG = '#060A12', CARD = '#0D1520', BORDER = '#1C2D45'
const TEAL = '#2DD4C8', TEXT = '#EFF6FF', MUTED = '#94A3B8'
const AMBER = '#F59E0B'
const SANS = 'DM Sans, sans-serif', MONO = 'JetBrains Mono, monospace', SERIF = 'Georgia, serif'

const CLIENT_NAMES: Record<string, string> = {
  meridian:  'Meridian Health',
  arcturus:  'Arcturus Financial',
}

interface NavProps {
  activePage?: string
  clientId?: string
  onClientChange?: (id: any) => void
}

export default function AbarvaNav({ activePage, clientId }: NavProps) {
  const [open, setOpen] = useState<string | null>(null)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const { isLoaded, user } = useUser()
  const { signOut } = useClerk()
  const pathname = usePathname()
  const router = useRouter()

  const openDrop = (id: string) => { clearTimeout(closeTimer.current); setOpen(id) }
  const startClose = () => { closeTimer.current = setTimeout(() => setOpen(null), 200) }
  const cancelClose = () => clearTimeout(closeTimer.current)

  // Derive client from URL — only used for the nav label, never for routing
  const urlClientId = pathname?.split('/admin/client/')?.[1]?.split('/')?.[0] || null
  const cid = urlClientId || clientId || 'meridian'

  const metaClientId = user?.publicMetadata?.clientId as string | undefined
  const metaRole     = user?.publicMetadata?.role     as string | undefined

  const signedIn = isLoaded && !!user
  const displayName = user?.fullName || user?.emailAddresses?.[0]?.emailAddress?.split('@')?.[0] || 'Maestro'
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div style={{
      height: '64px',
      position: 'sticky' as const,
      top: 0,
      zIndex: 200,
      background: CARD,
      borderBottom: `1px solid ${BORDER}`,
      display: 'flex',
      flexDirection: 'row' as const,
      alignItems: 'center',
      padding: '0 28px',
      gap: '4px',
      boxSizing: 'border-box' as const,
    }}>

      {/* Wordmark */}
      <a href="/" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column' as const, lineHeight: 1, marginRight: '32px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline' }}>
          <span style={{ fontFamily: SERIF, fontSize: '17px', fontWeight: 800, color: TEXT }}>Abar</span>
          <span style={{ fontFamily: SERIF, fontSize: '22px', fontWeight: 900, color: TEAL }}>Va</span>
        </div>
        <span style={{ fontFamily: MONO, fontSize: '8px', color: TEXT, letterSpacing: '.04em', opacity: .7 }}>know it. build it. own it.</span>
      </a>

      {/* Intelligence dropdown */}
      <div style={{ position: 'relative' as const }} onMouseEnter={() => openDrop('intel')} onMouseLeave={startClose}>
        <button style={{ fontSize: '13px', color: MUTED, background: 'none', border: 'none', cursor: 'pointer', padding: '8px 10px', fontFamily: SANS }}>
          Intelligence ▾
        </button>
        {open === 'intel' && (
          <div
            style={{ position: 'absolute' as const, top: '64px', left: 0, background: CARD, border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '8px 0', minWidth: '320px', zIndex: 300 }}
            onMouseEnter={cancelClose} onMouseLeave={startClose}
          >
            {[
              { name: 'Situation Intelligence',     path: `/diagnose?client=${cid}`,    desc: "What's actually broken — and what is it costing?" },
              { name: 'AI Investment Intelligence', path: `/ai-strategy?client=${cid}`, desc: 'Where should we place our AI bets?' },
              { name: 'Vendor Intelligence',        path: `/select?client=${cid}`,      desc: 'Which vendor actually wins in our situation?' },
              { name: 'Business Case Intelligence', path: `/justify?client=${cid}`,     desc: 'How do we justify this to the board?' },
              { name: 'Outcome Intelligence',       path: `/outcomes?client=${cid}`,    desc: 'Did it work — and can we prove it?' },
            ].map(item => (
              <a key={item.name} href={item.path} onClick={() => setOpen(null)} style={{ display: 'block', padding: '10px 20px', textDecoration: 'none' }}>
                <div style={{ fontSize: '13px', fontWeight: 500, color: TEXT, fontFamily: SANS }}>{item.name}</div>
                <div style={{ fontSize: '11px', color: MUTED, fontFamily: SANS, marginTop: '2px' }}>{item.desc}</div>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Solutions dropdown */}
      <div style={{ position: 'relative' as const }} onMouseEnter={() => openDrop('solutions')} onMouseLeave={startClose}>
        <button style={{ fontSize: '13px', color: MUTED, background: 'none', border: 'none', cursor: 'pointer', padding: '8px 10px', fontFamily: SANS }}>
          Solutions ▾
        </button>
        {open === 'solutions' && (
          <div
            style={{ position: 'absolute' as const, top: '64px', left: 0, background: CARD, border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '8px 0', minWidth: '320px', zIndex: 300 }}
            onMouseEnter={cancelClose} onMouseLeave={startClose}
          >
            {[
              { name: 'AI-Powered PDLC',         path: '/solutions/pdlc',   desc: 'Build products at twice the velocity' },
              { name: 'Margin Optimization',      path: '/solutions/margin', desc: 'Recover margin across revenue, cost, AI' },
              { name: 'Technology Modernization', path: '/solutions/tech',   desc: 'Govern the modernization the vendor cannot' },
            ].map(item => (
              <a key={item.name} href={item.path} onClick={() => setOpen(null)} style={{ display: 'block', padding: '10px 20px', textDecoration: 'none' }}>
                <div style={{ fontSize: '13px', fontWeight: 500, color: TEXT, fontFamily: SANS }}>{item.name}</div>
                <div style={{ fontSize: '11px', color: MUTED, fontFamily: SANS, marginTop: '2px' }}>{item.desc}</div>
              </a>
            ))}
            <div style={{ borderTop: `1px solid ${BORDER}`, margin: '4px 0' }} />
            <a href="/solutions" onClick={() => setOpen(null)} style={{ display: 'block', padding: '10px 20px', textDecoration: 'none' }}>
              <div style={{ fontSize: '13px', color: TEAL, fontFamily: SANS }}>View all solutions →</div>
            </a>
          </div>
        )}
      </div>

      {/* Platform link */}
      <a href="/platform" style={{ fontSize: '13px', color: MUTED, padding: '8px 10px', fontFamily: SANS, textDecoration: 'none', flexShrink: 0 }}>
        Platform
      </a>

      {/* Clients link */}
      <a href="/clients" style={{ fontSize: '13px', color: MUTED, padding: '8px 10px', fontFamily: SANS, textDecoration: 'none', flexShrink: 0 }}>
        Clients
      </a>

      {/* Right side */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
        {signedIn ? (
          <>
            {/* Dynamic client name from URL */}
            {urlClientId && CLIENT_NAMES[urlClientId] && (
              <span style={{
                fontSize: '13px', color: TEXT, fontFamily: SANS,
                padding: '0 16px', borderLeft: `1px solid ${BORDER}`, borderRight: `1px solid ${BORDER}`,
              }}>
                {CLIENT_NAMES[urlClientId]}
              </span>
            )}

            {/* Identity pill + dropdown */}
            <div style={{ position: 'relative' as const }}>
              <button
                onClick={() => setUserMenuOpen(o => !o)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  background: 'rgba(45,212,200,0.06)', border: '1px solid rgba(45,212,200,0.2)',
                  borderRadius: '8px', padding: '6px 12px', cursor: 'pointer',
                }}
              >
                <div style={{ textAlign: 'right' as const }}>
                  <div style={{ fontSize: '12px', fontWeight: 500, color: TEXT, fontFamily: SANS }}>{displayName}</div>
                  <div style={{ fontSize: '10px', color: TEAL, fontFamily: SANS }}>{metaRole === 'admin' ? 'Admin' : 'Maestro'}</div>
                </div>
                <div style={{
                  width: '30px', height: '30px', borderRadius: '50%',
                  background: 'rgba(45,212,200,0.15)', border: '1px solid rgba(45,212,200,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', fontWeight: 600, color: TEAL, fontFamily: MONO,
                }}>
                  {initials}
                </div>
              </button>
              {userMenuOpen && (
                <div style={{
                  position: 'absolute' as const, top: 'calc(100% + 6px)', right: 0,
                  background: PAGE_BG, border: `1px solid ${BORDER}`, borderRadius: '10px',
                  padding: '6px 0', zIndex: 300, minWidth: '160px',
                }}>
                  <button
                    onClick={() => { setUserMenuOpen(false); signOut(() => router.push('/')) }}
                    style={{
                      width: '100%', textAlign: 'left' as const, padding: '9px 16px',
                      fontSize: '13px', color: TEXT, background: 'transparent',
                      border: 'none', cursor: 'pointer', fontFamily: SANS,
                    }}
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <a href="/investor" style={{
              fontSize: '12px', color: AMBER, textDecoration: 'none',
              padding: '6px 12px', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '6px', fontFamily: SANS,
            }}>
              Investor view
            </a>
            <a href="/sign-in" style={{
              background: TEAL, color: PAGE_BG, fontSize: '13px', fontWeight: 600,
              textDecoration: 'none', padding: '8px 18px', borderRadius: '8px', flexShrink: 0, fontFamily: SANS,
            }}>
              Login →
            </a>
          </>
        )}
      </div>

    </div>
  )
}
