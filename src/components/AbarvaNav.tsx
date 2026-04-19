'use client'
import { useState, useRef, Suspense } from 'react'
import { useUser, useClerk } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useClientContext, ALL_CLIENTS } from '@/lib/use-client-context'
import AbarvaMark from './AbarvaMark'

const NAV_BG    = '#020408'
const NAV_BORD  = 'rgba(255,255,255,0.08)'
const TEAL      = '#2DD4C8'
const NAV_TEXT  = '#EFF6FF'
const NAV_MUTE  = 'rgba(239,246,255,0.85)'
const SANS      = 'DM Sans, sans-serif'
const MONO      = 'JetBrains Mono, monospace'
const SERIF     = 'Georgia, serif'
const DROP_BG   = '#FFFFFF'
const DROP_BORD = '#E5E7EB'
const DROP_HEAD = '#0C0C0C'
const DROP_DESC = '#3C3C3C'
const DROP_CAT  = '#2DD4C8'
const DROP_HOVER = '#F9FAFB'

interface NavProps { activePage?: string }

function NavInner({ activePage }: NavProps) {
  const [open, setOpen] = useState<string | null>(null)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [clientToggleOpen, setClientToggleOpen] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const { isLoaded, user } = useUser()
  const { signOut } = useClerk()
  const router = useRouter()

  const { clientId, currentClient, allowedClients, canSwitch, switchClient } = useClientContext()

  const openDrop = (id: string) => { clearTimeout(closeTimer.current); setOpen(id) }
  const startClose = () => { closeTimer.current = setTimeout(() => setOpen(null), 180) }
  const cancelClose = () => clearTimeout(closeTimer.current)

  const metaRole = user?.publicMetadata?.role as string | undefined

  const signedIn    = isLoaded && !!user
  const displayName = user?.fullName || user?.emailAddresses?.[0]?.emailAddress?.split('@')?.[0] || 'User'
  const firstName   = user?.firstName || displayName.split(' ')[0]
  const initials    = displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

  // ── Role flags ───────────────────────────────────────────────────────────
  const isAdmin    = metaRole === 'admin'
  const isInvestor = metaRole === 'investor'
  const isMaestro  = metaRole === 'maestro'   // separate Maestro role (mh+clerk_test, af+clerk_test)
  const isClient   = metaRole === 'client'
  const isOperator = signedIn && (isAdmin || isInvestor || isMaestro) // all non-client signed-in

  // ── Paths ────────────────────────────────────────────────────────────────
  const intelligencePath = `/intelligence?client=${clientId}`

  // ── Active states ─────────────────────────────────────────────────────────
  const intelligenceActive = activePage === 'intelligence'
  const adminActive        = (activePage || '').startsWith('admin')
  const platformActive     = activePage === 'platform'
  const investorActive     = activePage === 'investor'
  const maestroActive      = activePage === 'maestro' || activePage === 'dashboard'
  const homeActive         = activePage === 'home'

  // ── Helpers ───────────────────────────────────────────────────────────────
  const dropPanel: React.CSSProperties = {
    position: 'absolute', top: '58px', left: 0,
    background: DROP_BG, border: `1px solid ${DROP_BORD}`,
    borderRadius: '12px', padding: '8px 0', zIndex: 300,
    boxShadow: '0 4px 32px rgba(0,0,0,0.18)',
  }

  const navLink = (label: string, href: string, active: boolean) => (
    <a href={href} key={label} style={{
      fontSize: '14px', color: active ? TEAL : NAV_TEXT,
      padding: '8px 10px', fontFamily: SANS, textDecoration: 'none', flexShrink: 0,
      borderBottom: active ? `2px solid ${TEAL}` : '2px solid transparent',
    }}>
      {label}
    </a>
  )

  // Demo nav item — temporarily disabled while v2 ships; rendered as muted, non-clickable
  const demoNavItem = () => (
    <span
      key="demo-nav"
      title="Demo temporarily unavailable — new version coming soon"
      style={{
        fontSize: '14px',
        color: 'rgba(255,255,255,0.30)',
        padding: '8px 10px', fontFamily: SANS, flexShrink: 0,
        borderBottom: '2px solid transparent',
        pointerEvents: 'none' as React.CSSProperties['pointerEvents'],
        cursor: 'default',
      }}
    >
      Demo <span style={{ fontFamily: MONO, fontSize: 9, marginLeft: 4, color: 'rgba(255,255,255,0.40)' }}>soon</span>
    </span>
  )

  // Admin nav item — clickable for admin, greyed + disabled for others
  const adminNavItem = () => (
    <a
      href={isAdmin ? '/admin' : undefined}
      key="admin-nav"
      style={{
        fontSize: '14px',
        color: isAdmin ? (adminActive ? TEAL : NAV_TEXT) : 'rgba(255,255,255,0.25)',
        padding: '8px 10px', fontFamily: SANS, textDecoration: 'none', flexShrink: 0,
        borderBottom: isAdmin && adminActive ? `2px solid ${TEAL}` : '2px solid transparent',
        pointerEvents: isAdmin ? 'auto' : 'none' as React.CSSProperties['pointerEvents'],
        cursor: isAdmin ? 'pointer' : 'default',
      }}
    >
      Admin
    </a>
  )

  // Client dropdown (admin + investor)
  const clientDropdown = () => (
    <div style={{ position: 'relative', marginRight: '16px' }}>
      <button
        onClick={() => setClientToggleOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'none', border: 'none', padding: '4px 8px 4px 0', cursor: 'pointer' }}
      >
        <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: currentClient.color, flexShrink: 0 }} />
        <span style={{ fontFamily: SANS, fontSize: '13px', fontWeight: 600, color: NAV_TEXT }}>{currentClient.shortName}</span>
        <span style={{ fontFamily: MONO, fontSize: '9px', color: NAV_MUTE }}>▾</span>
      </button>
      {clientToggleOpen && (
        <div onMouseLeave={() => setClientToggleOpen(false)} style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, background: DROP_BG, border: `1px solid ${DROP_BORD}`, borderRadius: '10px', padding: '6px', zIndex: 400, minWidth: '220px', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
          <div style={{ fontFamily: MONO, fontSize: '8px', color: DROP_CAT, letterSpacing: '.1em', padding: '4px 8px 8px', textTransform: 'uppercase' }}>Switch Account</div>
          {ALL_CLIENTS.map(c => {
            const isActive  = c.id === clientId
            const isAllowed = !!allowedClients.find(a => a.id === c.id)
            return (
              <button key={c.id} onClick={() => { if (isAllowed) { switchClient(c.id); setClientToggleOpen(false) } }}
                style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 10px', borderRadius: '7px', border: 'none', background: isActive ? `${c.color}12` : 'transparent', cursor: isAllowed ? 'pointer' : 'default', opacity: isAllowed ? 1 : 0.35 }}
              >
                <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: c.color, flexShrink: 0 }} />
                <div style={{ fontFamily: SANS, fontSize: '12px', fontWeight: isActive ? 600 : 400, color: isActive ? c.color : DROP_HEAD }}>{c.shortName}</div>
                {isActive && <span style={{ fontFamily: MONO, fontSize: '9px', color: c.color, marginLeft: 'auto' }}>✓</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )

  // Static client label (maestro — locked to their client)
  const staticClientLabel = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginRight: '16px', padding: '4px 8px 4px 0' }}>
      <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: currentClient.color, flexShrink: 0 }} />
      <span style={{ fontFamily: SANS, fontSize: '13px', fontWeight: 600, color: NAV_TEXT }}>{currentClient.shortName}</span>
    </div>
  )

  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 200 }}>
      <div id="abarva-nav" style={{
        height: '60px', background: NAV_BG,
        borderBottom: `1px solid ${NAV_BORD}`,
        display: 'flex', alignItems: 'center', padding: '0 24px', gap: '2px',
        boxSizing: 'border-box',
      }}>

        {/* ── Wordmark ─────────────────────────────────────────────────────── */}
        <a href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px', marginRight: '24px', flexShrink: 0 }}>
          <AbarvaMark size={36} />
          <div style={{ display: 'flex', alignItems: 'baseline', lineHeight: 1 }}>
            <span style={{ fontFamily: SERIF, fontSize: '21px', fontWeight: 700, color: '#FFFFFF' }}>Abar</span>
            <span style={{ fontFamily: SERIF, fontSize: '26px', fontWeight: 900, color: TEAL }}>Va</span>
          </div>
        </a>

        {/* ══════════════════════════════════════════════════════════════════
            ADMIN — Maestro · Intelligence · AVR · Solutions | Platform · Investor · Admin
        ══════════════════════════════════════════════════════════════════ */}
        {signedIn && isAdmin && (
          <>
            {clientDropdown()}
            {navLink('Maestro', '/dashboard', maestroActive)}
            {navLink('Intelligence', intelligencePath, intelligenceActive)}
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            INVESTOR — Home · Maestro · Intelligence · AVR · Solutions | ...
        ══════════════════════════════════════════════════════════════════ */}
        {signedIn && isInvestor && (
          <>
            {navLink('Home', '/', homeActive)}
            {clientDropdown()}
            {navLink('Maestro', '/dashboard', maestroActive)}
            {navLink('Intelligence', intelligencePath, intelligenceActive)}
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            MAESTRO — Maestro · Intelligence · AVR · Solutions | Platform · Admin(grey)
        ══════════════════════════════════════════════════════════════════ */}
        {signedIn && isMaestro && (
          <>
            {staticClientLabel()}
            {navLink('Maestro', '/dashboard', maestroActive)}
            {navLink('Intelligence', intelligencePath, intelligenceActive)}
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            UNAUTHENTICATED / CLIENT — Solutions | Platform · Investor · Demo
        ══════════════════════════════════════════════════════════════════ */}
        {(!signedIn || isClient) && (
          <>
            {navLink('Investor', '/investor', investorActive)}
            {demoNavItem()}
          </>
        )}

        {/* ── Right side: Demo · Platform · Investor · Admin + user avatar ─── */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
          {signedIn && demoNavItem()}
          {signedIn && navLink('Platform', '/platform', platformActive)}
          {signedIn && (isAdmin || isInvestor) && navLink('Investor', '/investor', investorActive)}
          {signedIn && adminNavItem()}
          <div style={{ width: '12px' }} />

          {signedIn ? (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setUserMenuOpen(o => !o)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', padding: '4px 0', cursor: 'pointer' }}
              >
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', fontWeight: 500, color: NAV_TEXT, fontFamily: SANS }}>{firstName}</div>
                  <div style={{ fontSize: '9px', color: TEAL, fontFamily: MONO }}>
                    {isAdmin ? 'Admin' : isMaestro ? 'Maestro' : isInvestor ? 'Investor' : isClient ? 'Client' : ''}
                  </div>
                </div>
                <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(45,212,200,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: TEAL, fontFamily: MONO, flexShrink: 0 }}>
                  {initials}
                </div>
              </button>

              {userMenuOpen && (
                <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, background: DROP_BG, border: `1px solid ${DROP_BORD}`, borderRadius: '10px', padding: '6px 0', zIndex: 400, minWidth: '200px', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
                  <div style={{ padding: '8px 14px 10px', borderBottom: `1px solid ${DROP_BORD}`, marginBottom: '4px' }}>
                    <div style={{ fontFamily: SANS, fontSize: '13px', color: DROP_HEAD, fontWeight: 600 }}>{displayName}</div>
                    <div style={{ fontFamily: MONO, fontSize: '9px', color: '#6B7280', marginTop: '2px' }}>
                      {isAdmin ? 'Admin' : isMaestro ? 'Maestro' : isInvestor ? 'Investor' : isClient ? 'Client' : ''}
                    </div>
                  </div>
                  {(isAdmin || isMaestro) && (
                    <a href="/maestro" style={{ display: 'block', padding: '9px 14px', textDecoration: 'none', fontFamily: SANS, fontSize: '13px', color: DROP_HEAD, borderRadius: '8px', margin: '0 4px' }}
                      onMouseEnter={e => (e.currentTarget.style.background = DROP_HOVER)}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      Maestro Workspace
                    </a>
                  )}
                  {isAdmin && (
                    <a href="/admin" style={{ display: 'block', padding: '9px 14px', textDecoration: 'none', fontFamily: SANS, fontSize: '13px', color: DROP_HEAD, borderRadius: '8px', margin: '0 4px' }}
                      onMouseEnter={e => (e.currentTarget.style.background = DROP_HOVER)}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      Admin Portal
                    </a>
                  )}
                  <button
                    onClick={() => { setUserMenuOpen(false); signOut(() => router.push('/')) }}
                    style={{ width: '100%', textAlign: 'left', padding: '9px 14px', fontSize: '13px', color: DROP_HEAD, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: SANS, borderRadius: '8px', margin: '0 4px' }}
                    onMouseEnter={e => (e.currentTarget.style.background = DROP_HOVER)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <a href="/sign-in" style={{ fontSize: '12px', fontWeight: 500, color: 'rgba(255,255,255,0.7)', textDecoration: 'none', padding: '5px 12px', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '4px', flexShrink: 0, fontFamily: SANS }}>
                Login
              </a>
              <span title="Demo temporarily unavailable — new version coming soon" style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.45)', background: 'rgba(255,255,255,0.06)', padding: '5px 14px', borderRadius: '4px', flexShrink: 0, fontFamily: SANS, border: '1px solid rgba(255,255,255,0.1)', cursor: 'default' }}>
                Demo soon
              </span>
            </>
          )}
        </div>

      </div>
    </div>
  )
}

export default function AbarvaNav(props: NavProps) {
  return (
    <Suspense fallback={<div style={{ height: '60px', background: '#020408', borderBottom: '1px solid rgba(255,255,255,0.08)' }} />}>
      <NavInner {...props} />
    </Suspense>
  )
}
