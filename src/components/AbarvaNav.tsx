'use client'
import Link from 'next/link'
import { useState, Suspense } from 'react'
import { useUser, useClerk } from '@clerk/nextjs'
import { useRouter, usePathname } from 'next/navigation'
import { resolveSessionRole } from '@/lib/auth/access-routing'
import { clearActiveClientContext } from '@/lib/auth/client-context-storage'
import { useClientContext } from '@/lib/use-client-context'
import { AbarvaWordmark } from './abarva/AbarVaWordmark'

const NAV_BG    = '#FFFCF7'
const NAV_BORD  = '#E5DCD2'
const TEAL      = '#0B4A91'
const NAV_TEXT  = '#171412'
const NAV_MUTE  = '#6D625A'
const SANS      = 'DM Sans, sans-serif'
const MONO      = 'JetBrains Mono, monospace'
const DROP_BG   = '#FFFFFF'
const DROP_BORD = '#E5DCD2'
const DROP_HEAD = '#171412'

interface NavProps {
  activePage?: string;
  /**
   * When true, render only the logo + client selector + user menu.
   * Primary nav items are hidden because a separate PrimaryNav is
   * rendering them below (MaestroChrome). Default false = full bar
   * for the marketing landing page.
   */
  compact?: boolean;
}

function NavInner({ activePage, compact = false }: NavProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const { isLoaded, user } = useUser()
  const { signOut } = useClerk()
  const router = useRouter()
  const pathname = usePathname() ?? ''

  const { clientId, currentClient } = useClientContext()

  const email = user?.primaryEmailAddress?.emailAddress
    ?? user?.emailAddresses?.[0]?.emailAddress
    ?? undefined
  const metaRole = resolveSessionRole(user?.publicMetadata?.role as string | undefined, email)

  const signedIn    = isLoaded && !!user
  const displayName = user?.fullName || user?.emailAddresses?.[0]?.emailAddress?.split('@')?.[0] || 'User'
  const firstName   = user?.firstName || displayName.split(' ')[0]
  const initials    = displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

  // ── Role flags ───────────────────────────────────────────────────────────
  const isAdmin    = metaRole === 'admin'
  const isInvestor = metaRole === 'investor'
  const isMaestro  = metaRole === 'maestro'   // separate Maestro role (mh+clerk_test, af+clerk_test)
  const isClient   = metaRole === 'client'
  const isExternal = metaRole === 'external'
  const isOperator = signedIn && (isAdmin || isInvestor || isMaestro) // all non-client signed-in

  // ── Paths ────────────────────────────────────────────────────────────────
  const intelligencePath = `/intelligence?client=${clientId}`

  // ── Active states · pathname first (truth), activePage prop fallback
  // for legacy callers.
  const tenantProgramsActive = pathname.startsWith('/tenant/') && pathname.includes('/programs')
  const tenantIntelligenceActive = pathname.startsWith('/tenant/') && pathname.includes('/intelligence')
  const tenantTowerActive = pathname.startsWith('/tenant/') && pathname.includes('/tower')
  const homeActive         = pathname === '/home' || pathname.startsWith('/home/')
                              || pathname === '/dashboard' || pathname.startsWith('/dashboard/')
                              || pathname === '/' || activePage === 'home'
  const engagementsActive  = pathname === '/engagements' || pathname.startsWith('/engagements/')
                              || pathname.startsWith('/engage/') || tenantProgramsActive || activePage === 'engagements'
  const sourceActive       = pathname === '/source' || pathname.startsWith('/source/') || activePage === 'source'
  const intelligenceActive = pathname === '/intelligence' || pathname.startsWith('/intelligence/')
                              || tenantIntelligenceActive || activePage === 'intelligence'
  const towerActive        = pathname === '/tower' || pathname.startsWith('/tower/')
                              || tenantTowerActive || activePage === 'tower'
  // Admin takes precedence · when the pathname is under /platform/admin,
  // only the Admin pill should light up, not both Platform and Admin.
  const adminActive        = pathname.startsWith('/admin') || pathname.startsWith('/platform/admin')
                              || (activePage || '').startsWith('admin')
  const platformActive     = !adminActive && (
                              pathname === '/platform'
                                || pathname.startsWith('/platform/')
                                || activePage === 'platform'
                            )
  const investorActive     = pathname.startsWith('/investor') || activePage === 'investor'

  const navLink = (label: string, href: string, active: boolean) => (
    <a href={href} key={label} className={active ? 'abarva-nav-link abarva-nav-link--active' : 'abarva-nav-link'} style={{
      fontSize: '15px',
      fontWeight: active ? 700 : 500,
      letterSpacing: '-0.01em',
      color: active ? TEAL : NAV_TEXT,
      padding: '8px 20px', fontFamily: SANS, textDecoration: 'none', flexShrink: 0,
      borderBottom: active ? `2px solid ${TEAL}` : '2px solid transparent',
      transition: 'color 150ms cubic-bezier(0, 0, 0.2, 1), border-color 150ms cubic-bezier(0, 0, 0.2, 1)',
      borderRadius: '6px',
    }}>
      {label}
    </a>
  )

  // Demo nav item — temporarily disabled while v2 ships.
  const demoNavItem = () => (
    <span
      key="demo-nav"
      // dom-integrity-ignore-line · intentional user-facing copy while demo is paused
      title="Demo temporarily unavailable — new version coming soon"
      style={{
        fontSize: '15px',
        fontWeight: 600,
        letterSpacing: '-0.01em',
        color: NAV_MUTE,
        padding: '8px 20px', fontFamily: SANS, flexShrink: 0,
        borderBottom: '1px solid transparent',
        pointerEvents: 'none' as React.CSSProperties['pointerEvents'],
        cursor: 'default',
      }}
    >
      Demo <span style={{ fontFamily: MONO, fontSize: 10, marginLeft: 4, color: '#8A7565' }}>soon</span>
    </span>
  )

  // Admin nav item — clickable for admin, hidden visually-only for non-admin via disabled state
  const adminNavItem = () => (
    <a
      href={isAdmin ? '/platform/admin' : undefined}
      key="admin-nav"
      style={{
        fontSize: '15px',
        fontWeight: isAdmin && adminActive ? 700 : 600,
        letterSpacing: '-0.01em',
        color: isAdmin ? (adminActive ? TEAL : NAV_TEXT) : '#B7ADA2',
        padding: '8px 20px', fontFamily: SANS, textDecoration: 'none', flexShrink: 0,
        borderBottom: isAdmin && adminActive ? `1px solid ${TEAL}` : '1px solid transparent',
        pointerEvents: isAdmin ? 'auto' : 'none' as React.CSSProperties['pointerEvents'],
        cursor: isAdmin ? 'pointer' : 'default',
      }}
    >
      Admin
    </a>
  )

  // Static client label for all roles. Account switching is disabled in the
  // active shell so users stay hard-locked to the current account context.
  const staticClientLabel = () => (
    <div
      aria-label={`Current account ${currentClient.shortName}. Account switching is disabled.`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '7px',
        marginRight: '16px',
        padding: '6px 10px',
        borderRadius: '999px',
        border: `1px solid ${NAV_BORD}`,
        background: '#FBF7F0',
      }}
    >
      <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: currentClient.color, flexShrink: 0 }} />
      <span style={{ fontFamily: SANS, fontSize: '13px', fontWeight: 600, color: NAV_TEXT }}>{currentClient.shortName}</span>
      <span style={{ fontFamily: MONO, fontSize: '9px', color: NAV_MUTE }}>locked</span>
    </div>
  )

  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 200 }}>
      {/* Scoped hover + focus styling for the nav. Pure polish · no
          behavior changes. Honors prefers-reduced-motion. */}
      <style jsx global>{`
        .abarva-nav-link:not(.abarva-nav-link--active):hover {
          color: #0B4A91;
        }
        .abarva-nav-link:focus-visible {
          outline: none;
          box-shadow: 0 0 0 2px #FFFCF7, 0 0 0 4px #0B4A91;
        }
        .abarva-avatar-btn:focus-visible,
        .abarva-client-btn:focus-visible {
          outline: none;
          box-shadow: 0 0 0 2px #FFFCF7, 0 0 0 4px #0B4A91;
          border-radius: 8px;
        }
        .abarva-menu-item:hover {
          background: #FBF7F0 !important;
        }
        .abarva-menu-item:focus-visible {
          outline: none;
          background: #FBF7F0 !important;
          box-shadow: inset 2px 0 0 #0B4A91;
        }
        @media (prefers-reduced-motion: reduce) {
          .abarva-nav-link {
            transition: none !important;
          }
        }
      `}</style>
      <div id="abarva-nav" style={{
        height: '60px', background: NAV_BG,
        borderBottom: `1px solid ${NAV_BORD}`,
        display: 'flex', alignItems: 'center', padding: '0 24px', gap: '2px',
        boxSizing: 'border-box',
      }}>

        {/* ── Wordmark ─────────────────────────────────────────────────────── */}
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px', marginRight: '24px', flexShrink: 0 }}>
          <AbarvaWordmark
            size="md"
            inkColor={NAV_TEXT}
          />
        </Link>

        {/* ══════════════════════════════════════════════════════════════════
            SIGNED-IN OPERATORS (admin / investor / maestro) — product-map 5 items:
            Home · Engagements · Intelligence · Control Tower · Platform
            Client dropdown stays (elevated roles switch; maestro sees static label).
            When compact=true (MaestroChrome has PrimaryNav below), skip the
            primary items to avoid a duplicate nav row.
        ══════════════════════════════════════════════════════════════════ */}
        {signedIn && isOperator && (
          <>
            {staticClientLabel()}
            {!compact && navLink('Home', '/home', homeActive)}
            {!compact && navLink('Programs', '/engagements', engagementsActive)}
            {!compact && navLink('Source', '/source', sourceActive)}
            {!compact && navLink('Intelligence', intelligencePath, intelligenceActive)}
            {!compact && navLink('Control Tower', '/tower', towerActive)}
            {!compact && navLink('Platform', '/platform', platformActive)}
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            SIGNED-IN CLIENT (Prat, Priya, Dan) — 4 product items only.
            No Platform, no Investor, no Admin. Client's own org is implicit;
            no client switcher. Matches post-test-drive corrections doc §P0-4.
        ══════════════════════════════════════════════════════════════════ */}
        {signedIn && isClient && (
          <>
            {staticClientLabel()}
            {!compact && navLink('Home', '/home', homeActive)}
            {!compact && navLink('Programs', '/engagements', engagementsActive)}
            {!compact && navLink('Intelligence', intelligencePath, intelligenceActive)}
            {!compact && navLink('Control Tower', '/tower', towerActive)}
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            UNAUTHENTICATED — marketing surface only
        ══════════════════════════════════════════════════════════════════ */}
        {(!signedIn || isExternal) && (
          <>
            {navLink('Investor', '/investor', investorActive)}
            {demoNavItem()}
          </>
        )}

        {/* ── Right side: Admin portal shortcut + user avatar ─── */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
          {signedIn && (isAdmin || isInvestor) && navLink('Investor', '/investor', investorActive)}
          {signedIn && isAdmin && adminNavItem()}
          <div style={{ width: '12px' }} />

          {signedIn ? (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setUserMenuOpen(o => !o)}
                className="abarva-avatar-btn"
                aria-label={`Account menu for ${displayName}`}
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', padding: '4px 0', cursor: 'pointer' }}
              >
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', fontWeight: 500, color: NAV_TEXT, fontFamily: SANS }}>{firstName}</div>
                  <div style={{ fontSize: '9px', color: TEAL, fontFamily: MONO }}>
                    {isAdmin ? 'Admin' : isMaestro ? 'Maestro' : isInvestor ? 'Investor' : isClient ? 'Client' : isExternal ? 'External' : ''}
                  </div>
                </div>
                <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(11,74,145,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: TEAL, fontFamily: MONO, flexShrink: 0 }}>
                  {initials}
                </div>
              </button>

              {userMenuOpen && (
                <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, background: DROP_BG, border: `1px solid ${DROP_BORD}`, borderRadius: '10px', padding: '6px 0', zIndex: 400, minWidth: '200px', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
                  <div style={{ padding: '8px 14px 10px', borderBottom: `1px solid ${DROP_BORD}`, marginBottom: '4px' }}>
                    <div style={{ fontFamily: SANS, fontSize: '13px', color: DROP_HEAD, fontWeight: 600 }}>{displayName}</div>
                    <div style={{ fontFamily: MONO, fontSize: '9px', color: '#6B7280', marginTop: '2px' }}>
                      {isAdmin ? 'Admin' : isMaestro ? 'Maestro' : isInvestor ? 'Investor' : isClient ? 'Client' : isExternal ? 'External' : ''}
                    </div>
                  </div>
                  {(isAdmin || isMaestro) && (
                    <Link href="/maestro" className="abarva-menu-item" style={{ display: 'block', padding: '9px 14px', textDecoration: 'none', fontFamily: SANS, fontSize: '13px', color: DROP_HEAD, borderRadius: '8px', margin: '0 4px' }}>
                      Maestro Workspace
                    </Link>
                  )}
                  {isAdmin && (
                    <Link href="/platform" className="abarva-menu-item" style={{ display: 'block', padding: '9px 14px', textDecoration: 'none', fontFamily: SANS, fontSize: '13px', color: DROP_HEAD, borderRadius: '8px', margin: '0 4px' }}>
                      Platform
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      setUserMenuOpen(false)
                      clearActiveClientContext()
                      signOut(() => router.push('/'))
                    }}
                    className="abarva-menu-item"
                    style={{ width: '100%', textAlign: 'left', padding: '9px 14px', fontSize: '13px', color: DROP_HEAD, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: SANS, borderRadius: '8px', margin: '0 4px' }}
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/sign-in" style={{ fontSize: '12px', fontWeight: 500, color: NAV_TEXT, textDecoration: 'none', padding: '5px 12px', border: `1px solid ${NAV_BORD}`, borderRadius: '6px', flexShrink: 0, fontFamily: SANS, background: '#FFFFFF' }}>
                Login
              </Link>
              {/* dom-integrity-ignore-line */}
              <span title="Demo temporarily unavailable — new version coming soon" style={{ fontSize: '12px', fontWeight: 600, color: NAV_MUTE, background: '#FBF7F0', padding: '5px 14px', borderRadius: '6px', flexShrink: 0, fontFamily: SANS, border: `1px solid ${NAV_BORD}`, cursor: 'default' }}>
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
    <Suspense fallback={<div style={{ height: '60px', background: NAV_BG, borderBottom: `1px solid ${NAV_BORD}` }} />}>
      <NavInner {...props} />
    </Suspense>
  )
}
