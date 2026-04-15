'use client'
import { useState, useRef, Suspense } from 'react'
import { useUser, useClerk } from '@clerk/nextjs'
import { usePathname, useRouter } from 'next/navigation'
import { useClientContext, ALL_CLIENTS } from '@/lib/use-client-context'

const PAGE_BG = '#060A12', CARD = '#0D1520', BORDER = '#1C2D45'
const TEAL = '#2DD4C8', TEXT = '#EFF6FF', MUTED = 'rgba(255,255,255,0.75)'
const SANS = 'DM Sans, sans-serif', MONO = 'JetBrains Mono, monospace', SERIF = 'Georgia, serif'

interface NavProps {
  activePage?: string
}

// Inner nav that uses the client context hook — must be inside Suspense boundary
function NavInner({ activePage }: NavProps) {
  const [open, setOpen] = useState<string | null>(null)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [clientToggleOpen, setClientToggleOpen] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const { isLoaded, user } = useUser()
  const { signOut } = useClerk()
  const router = useRouter()

  const { clientId, currentClient, allowedClients, canSwitch, switchClient, role } = useClientContext()

  const openDrop = (id: string) => { clearTimeout(closeTimer.current); setOpen(id) }
  const startClose = () => { closeTimer.current = setTimeout(() => setOpen(null), 200) }
  const cancelClose = () => clearTimeout(closeTimer.current)

  const metaClientId  = user?.publicMetadata?.clientId  as string | undefined
  const metaRole      = user?.publicMetadata?.role       as string | undefined

  const signedIn      = isLoaded && !!user
  const displayName   = user?.fullName || user?.emailAddresses?.[0]?.emailAddress?.split('@')?.[0] || 'User'
  const initials      = displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

  const roleLabel =
    metaRole === 'admin'    ? 'Admin'    :
    metaRole === 'investor' ? 'Investor' :
    metaRole === 'client'   ? 'Client'   : null

  // Build solution link paths — admin sees engage routes, client sees portal routes
  const solutionPath = (sol: string) => {
    if (!signedIn) return `/solutions/${sol}`
    if (metaRole === 'admin') return `/engage/${clientId}/${sol}`
    if (metaRole === 'client' && metaClientId) return `/portal/${sol}?client=${metaClientId}`
    return `/solutions/${sol}`
  }

  // Module nav links — carry the active client param
  const modulePath = (page: string) => `/${page}?client=${clientId}`

  return (
    <div id="abarva-nav" style={{
      height: '60px',
      position: 'sticky',
      top: 0,
      zIndex: 200,
      background: CARD,
      borderBottom: `1px solid ${BORDER}`,
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px',
      gap: '2px',
      boxSizing: 'border-box',
    }}>

      {/* Wordmark */}
      <a href="/" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', lineHeight: 1, marginRight: '28px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline' }}>
          <span style={{ fontFamily: SERIF, fontSize: '17px', fontWeight: 800, color: TEXT }}>Abar</span>
          <span style={{ fontFamily: SERIF, fontSize: '22px', fontWeight: 900, color: TEAL }}>Va</span>
        </div>
        <span style={{ fontFamily: MONO, fontSize: '7.5px', color: TEXT, letterSpacing: '.04em', opacity: .6 }}>know it. build it. own it.</span>
      </a>

      {/* ── Client toggle ─────────────────────────────── */}
      {signedIn && (
        <div style={{ position: 'relative', marginRight: '16px' }}>
          <button
            onClick={() => canSwitch ? setClientToggleOpen(o => !o) : undefined}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: `${currentClient.color}10`,
              border: `1px solid ${currentClient.color}35`,
              borderRadius: '7px', padding: '5px 10px 5px 8px',
              cursor: canSwitch ? 'pointer' : 'default',
            }}
          >
            {/* Colour dot */}
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: currentClient.color, flexShrink: 0 }} />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontFamily: SANS, fontSize: '12px', fontWeight: 600, color: TEXT, lineHeight: 1.2 }}>
                {currentClient.shortName}
              </div>
              <div style={{ fontFamily: MONO, fontSize: '8px', color: currentClient.color, lineHeight: 1 }}>
                {currentClient.vertical}
              </div>
            </div>
            {canSwitch && (
              <span style={{ fontFamily: MONO, fontSize: '9px', color: MUTED, marginLeft: '2px' }}>▾</span>
            )}
          </button>

          {/* Dropdown — admin/investor only */}
          {canSwitch && clientToggleOpen && (
            <div
              onMouseLeave={() => setClientToggleOpen(false)}
              style={{
                position: 'absolute', top: 'calc(100% + 6px)', left: 0,
                background: PAGE_BG, border: `1px solid ${BORDER}`,
                borderRadius: '10px', padding: '6px', zIndex: 400, minWidth: '220px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
              }}>
              <div style={{ fontFamily: MONO, fontSize: '8px', color: MUTED, letterSpacing: '.1em', padding: '4px 8px 8px', textTransform: 'uppercase' }}>
                Switch Account
              </div>
              {ALL_CLIENTS.map(c => {
                const isActive = c.id === clientId
                const isAllowed = !!allowedClients.find(a => a.id === c.id)
                return (
                  <button
                    key={c.id}
                    onClick={() => { if (isAllowed) { switchClient(c.id); setClientToggleOpen(false) } }}
                    style={{
                      width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '9px 10px', borderRadius: '7px', border: 'none',
                      background: isActive ? `${c.color}12` : 'transparent',
                      cursor: isAllowed ? 'pointer' : 'default',
                      opacity: isAllowed ? 1 : 0.35,
                    }}
                  >
                    <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: c.color, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: SANS, fontSize: '12px', fontWeight: isActive ? 600 : 400, color: isActive ? c.color : TEXT }}>
                        {c.shortName}
                      </div>
                      <div style={{ fontFamily: MONO, fontSize: '9px', color: MUTED }}>{c.vertical}</div>
                    </div>
                    {isActive && (
                      <span style={{ fontFamily: MONO, fontSize: '9px', color: c.color }}>✓</span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Nav links ──────────────────────────────────── */}

      {/* Solutions dropdown */}
      <div style={{ position: 'relative' }} onMouseEnter={() => openDrop('solutions')} onMouseLeave={startClose}>
        <button style={{ fontSize: '13px', color: TEXT, background: 'none', border: 'none', cursor: 'pointer', padding: '8px 10px', fontFamily: SANS }}>
          Solutions ▾
        </button>
        {open === 'solutions' && (
          <div
            style={{ position: 'absolute', top: '60px', left: 0, background: CARD, border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '8px 0', minWidth: '320px', zIndex: 300 }}
            onMouseEnter={cancelClose} onMouseLeave={startClose}
          >
            {[
              { name: 'AI-Powered PDLC',         sol: 'pdlc',   desc: 'Build products at twice the velocity' },
              { name: 'Margin Optimization',      sol: 'margin', desc: 'Recover margin across revenue, cost, AI' },
              { name: 'Technology Modernization', sol: 'tech',   desc: 'Govern the modernization the vendor cannot' },
            ].map(item => (
              <a key={item.name} href={solutionPath(item.sol)} onClick={() => setOpen(null)} style={{ display: 'block', padding: '10px 20px', textDecoration: 'none' }}>
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

      {/* Intelligence modules — shown to all signed-in users, carry client param */}
      {signedIn && (
        <>
          <a href={modulePath('diagnose')}
            style={{ fontSize: '13px', color: activePage === 'diagnose' ? TEAL : TEXT, padding: '8px 10px', fontFamily: SANS, textDecoration: 'none', flexShrink: 0, borderBottom: activePage === 'diagnose' ? `2px solid ${TEAL}` : '2px solid transparent' }}>
            Diagnose
          </a>
          <a href={modulePath('intelligence')}
            style={{ fontSize: '13px', color: activePage === 'intelligence' ? TEAL : TEXT, padding: '8px 10px', fontFamily: SANS, textDecoration: 'none', flexShrink: 0, borderBottom: activePage === 'intelligence' ? `2px solid ${TEAL}` : '2px solid transparent' }}>
            Technology
          </a>
          <a href={modulePath('architecture')}
            style={{ fontSize: '13px', color: activePage === 'architecture' ? TEAL : TEXT, padding: '8px 10px', fontFamily: SANS, textDecoration: 'none', flexShrink: 0, borderBottom: activePage === 'architecture' ? `2px solid ${TEAL}` : '2px solid transparent' }}>
            Architecture
          </a>
          <a href={modulePath('ai-pdlc')}
            style={{ fontSize: '13px', color: activePage === 'ai-pdlc' ? TEAL : TEXT, padding: '8px 10px', fontFamily: SANS, textDecoration: 'none', flexShrink: 0, borderBottom: activePage === 'ai-pdlc' ? `2px solid ${TEAL}` : '2px solid transparent' }}>
            AI Delivery
          </a>
        </>
      )}

      {/* Public links */}
      <a href="/ai-strategy" style={{ fontSize: '13px', color: TEXT, padding: '8px 10px', fontFamily: SANS, textDecoration: 'none', flexShrink: 0 }}>
        AI Strategy
      </a>
      <a href="/platform" style={{ fontSize: '13px', color: TEXT, padding: '8px 10px', fontFamily: SANS, textDecoration: 'none', flexShrink: 0 }}>
        Platform
      </a>
      {(metaRole === 'admin' || !signedIn) && (
        <a href="/clients" style={{ fontSize: '13px', color: TEXT, padding: '8px 10px', fontFamily: SANS, textDecoration: 'none', flexShrink: 0 }}>
          Clients
        </a>
      )}

      {/* ── Right side ─────────────────────────────────── */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
        {signedIn ? (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setUserMenuOpen(o => !o)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: 'rgba(45,212,200,0.06)', border: '1px solid rgba(45,212,200,0.2)',
                borderRadius: '8px', padding: '5px 10px', cursor: 'pointer',
              }}
            >
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '12px', fontWeight: 500, color: TEXT, fontFamily: SANS }}>{displayName}</div>
                {roleLabel && <div style={{ fontSize: '9px', color: TEAL, fontFamily: MONO }}>{roleLabel}</div>}
              </div>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                background: 'rgba(45,212,200,0.15)', border: '1px solid rgba(45,212,200,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '10px', fontWeight: 700, color: TEAL, fontFamily: MONO, flexShrink: 0,
              }}>
                {initials}
              </div>
            </button>

            {userMenuOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 6px)', right: 0,
                background: PAGE_BG, border: `1px solid ${BORDER}`, borderRadius: '10px',
                padding: '6px 0', zIndex: 400, minWidth: '160px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
              }}>
                <div style={{ padding: '8px 14px 6px', borderBottom: `1px solid ${BORDER}`, marginBottom: '4px' }}>
                  <div style={{ fontFamily: SANS, fontSize: '12px', color: TEXT, fontWeight: 500 }}>{displayName}</div>
                  {roleLabel && <div style={{ fontFamily: MONO, fontSize: '9px', color: TEAL, marginTop: '2px' }}>{roleLabel}</div>}
                </div>
                {metaRole === 'admin' && (
                  <a href="/admin" style={{ display: 'block', padding: '8px 14px', textDecoration: 'none', fontFamily: SANS, fontSize: '12px', color: MUTED }}>
                    Admin Dashboard
                  </a>
                )}
                <button
                  onClick={() => { setUserMenuOpen(false); signOut(() => router.push('/')) }}
                  style={{
                    width: '100%', textAlign: 'left', padding: '8px 14px',
                    fontSize: '12px', color: TEXT, background: 'transparent',
                    border: 'none', cursor: 'pointer', fontFamily: SANS,
                  }}
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <a href="/investor" style={{
              fontSize: '12px', color: MUTED, textDecoration: 'none',
              padding: '5px 10px', border: `1px solid ${BORDER}`, borderRadius: '6px', fontFamily: SANS,
            }}>
              Investor view
            </a>
            <a href="/sign-in" style={{
              background: TEAL, color: PAGE_BG, fontSize: '13px', fontWeight: 600,
              textDecoration: 'none', padding: '7px 18px', borderRadius: '8px', flexShrink: 0, fontFamily: SANS,
            }}>
              Login →
            </a>
          </>
        )}
      </div>

    </div>
  )
}

// Suspense wrapper required because useClientContext uses useSearchParams
export default function AbarvaNav(props: NavProps) {
  return (
    <Suspense fallback={
      <div style={{ height: '60px', background: '#0D1520', borderBottom: '1px solid #1C2D45' }} />
    }>
      <NavInner {...props} />
    </Suspense>
  )
}
