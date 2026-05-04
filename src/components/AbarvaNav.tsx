'use client'
import Link from 'next/link'
import { useState, Suspense } from 'react'
import { useUser, useClerk } from '@clerk/nextjs'
import { useRouter, usePathname } from 'next/navigation'
import { resolveSessionRole } from '@/lib/auth/access-routing'
import { clearActiveClientContext } from '@/lib/auth/client-context-storage'
import { resolveModuleAccess, type ProductModule } from '@/lib/auth/module-access'
import { useClientContext } from '@/lib/use-client-context'
import { AbarVaLogo } from './abarva/AbarVaLogo'
import { COLORS, FONT, BORDER, SPACING } from '@/lib/design/abarva-theme'

const NAV_BG = COLORS.surface
const NAV_BORD = COLORS.border
const NAVY = COLORS.navy
const NAV_TEXT = COLORS.ink
const NAV_MUTE = COLORS.muted
const SANS = FONT.body
const MONO = FONT.mono
const DROP_BG = '#FFFFFF'
const DROP_BORD = BORDER.hairline
const DROP_HEAD = COLORS.inkDark

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

  const { currentClient } = useClientContext()

  const email = user?.primaryEmailAddress?.emailAddress
    ?? user?.emailAddresses?.[0]?.emailAddress
    ?? undefined
  const metaRole = resolveSessionRole(user?.publicMetadata?.role as string | undefined, email)
  const moduleAccess = resolveModuleAccess({
    role: user?.publicMetadata?.role as string | undefined,
    email,
    publicMetadata: user?.publicMetadata as Record<string, unknown> | null | undefined,
  })
  const canShow = (module: ProductModule) => moduleAccess.modules.includes(module)

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
  const intelligencePath = `/intelligence`

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
  const strategicMovesActive = pathname === '/strategic-moves' || pathname.startsWith('/strategic-moves/')
                              || activePage === 'strategic-moves'
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
      color: active ? NAVY : NAV_TEXT,
      padding: '8px 20px', fontFamily: SANS, textDecoration: 'none', flexShrink: 0,
      borderBottom: active ? `2px solid ${NAVY}` : '2px solid transparent',
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

  // Admin nav item — shown only when setup access is granted.
  const adminNavItem = () => (
    <a
      href="/admin"
      key="admin-nav"
      style={{
        fontSize: '15px',
        fontWeight: adminActive ? 700 : 600,
        letterSpacing: '-0.01em',
        color: adminActive ? NAVY : NAV_TEXT,
        padding: '8px 20px', fontFamily: SANS, textDecoration: 'none', flexShrink: 0,
        borderBottom: adminActive ? `1px solid ${NAVY}` : '1px solid transparent',
        cursor: 'pointer',
      }}
    >
      Admin
    </a>
  )

  // Static client label for all roles.
  const staticClientLabel = () => (
    <div
      aria-label={`Current tenant ${currentClient.name}.`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        border: 'none',
        background: 'transparent',
        borderRadius: '0',
        padding: '0',
        marginRight: '16px',
        boxSizing: 'border-box',
        minWidth: '0',
      }}
    >
      <div
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: currentClient.color,
          boxShadow: `0 0 0 2px ${COLORS.surface}`,
          flexShrink: 0,
        }}
      />
      <span
        title={currentClient.name}
        style={{
          fontFamily: SANS,
          fontSize: '14px',
          fontWeight: 600,
          color: NAV_TEXT,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: 'block',
          maxWidth: '220px',
        }}
      >
        {currentClient.name}
      </span>
    </div>
  )

  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 200 }}>
      {/* Scoped hover + focus styling for the nav. Pure polish · no
          behavior changes. Honors prefers-reduced-motion. */}
      <style jsx global>{`
        .abarva-nav-link:not(.abarva-nav-link--active):hover {
          color: ${NAVY};
        }
        .abarva-nav-link:focus-visible {
          outline: none;
          box-shadow: 0 0 0 2px ${COLORS.surface}, 0 0 0 4px ${NAVY};
        }
        .abarva-avatar-btn:focus-visible,
        .abarva-client-btn:focus-visible {
          outline: none;
          box-shadow: 0 0 0 2px ${COLORS.surface}, 0 0 0 4px ${NAVY};
          border-radius: 8px;
        }
        .abarva-menu-item:hover {
          background: #F5F3EE !important;
        }
        .abarva-menu-item:focus-visible {
          outline: none;
          background: #F5F3EE !important;
          box-shadow: inset 2px 0 0 ${NAVY};
        }
        @media (prefers-reduced-motion: reduce) {
          .abarva-nav-link {
            transition: none !important;
          }
        }
      `}</style>
      <div id="abarva-nav" style={{
        height: '56px', background: NAV_BG,
        borderBottom: BORDER.hairline,
        display: 'flex', alignItems: 'center', padding: `0 ${SPACING.xxl}px`, gap: `${SPACING.sm}px`,
        boxSizing: 'border-box',
        boxShadow: '0 6px 18px rgba(27, 43, 92, 0.06)',
      }}>

        {/* ── Wordmark ─────────────────────────────────────────────────────── */}
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: `${SPACING.md}px`, marginRight: `${SPACING.xl}px`, flexShrink: 0 }}>
          <AbarVaLogo
            variant="wordmark"
            size="md"
            label="AbarVa"
            style={{ height: 26, width: 'auto' }}
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
            {!compact && canShow('programs') && navLink('Programs', '/programs', engagementsActive)}
            {!compact && canShow('programs') && navLink('Strategic Moves', '/strategic-moves', strategicMovesActive)}
            {!compact && canShow('source') && navLink('Source', '/source', sourceActive)}
            {!compact && canShow('intelligence') && navLink('Intelligence', intelligencePath, intelligenceActive)}
            {!compact && canShow('tower') && navLink('Control Tower', '/tower', towerActive)}
            {!compact && canShow('setup') && navLink('Platform', '/platform', platformActive)}
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
            {!compact && canShow('programs') && navLink('Programs', '/programs', engagementsActive)}
            {!compact && canShow('programs') && navLink('Strategic Moves', '/strategic-moves', strategicMovesActive)}
            {!compact && canShow('source') && navLink('Source', '/source', sourceActive)}
            {!compact && canShow('intelligence') && navLink('Intelligence', intelligencePath, intelligenceActive)}
            {!compact && canShow('tower') && navLink('Control Tower', '/tower', towerActive)}
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
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: `${SPACING.xs}px` }}>
          {signedIn && (isAdmin || isInvestor) && navLink('Investor', '/investor', investorActive)}
          {signedIn && canShow('setup') && adminNavItem()}
          {/* ⌘K search hint */}
          {signedIn && (
            <span
              aria-label="Press Command K to open global search"
              style={{
                fontFamily: MONO,
                fontSize: 9,
                letterSpacing: '0.12em',
                color: NAV_MUTE,
                background: '#EFECE4',
                padding: '3px 7px',
                borderRadius: 4,
                flexShrink: 0,
                cursor: 'default',
                userSelect: 'none',
              }}
            >
              ⌘K
            </span>
          )}
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
                  <div style={{ fontSize: '9px', color: NAVY, fontFamily: MONO }}>
                    {isAdmin ? 'Admin' : isMaestro ? 'Maestro' : isInvestor ? 'Investor' : isExternal ? 'External' : ''}
                  </div>
                </div>
                <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(27, 43, 92, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: NAVY, fontFamily: MONO, flexShrink: 0 }}>
                  {initials}
                </div>
              </button>

              {userMenuOpen && (
                <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, background: DROP_BG, border: `1px solid ${DROP_BORD}`, borderRadius: '10px', padding: '6px 0', zIndex: 400, minWidth: '200px', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
                  <div style={{ padding: '8px 14px 10px', borderBottom: `1px solid ${DROP_BORD}`, marginBottom: '4px' }}>
                    <div style={{ fontFamily: SANS, fontSize: '13px', color: DROP_HEAD, fontWeight: 600 }}>{displayName}</div>
                    <div style={{ fontFamily: MONO, fontSize: '9px', color: '#6B7280', marginTop: '2px' }}>
                      {isAdmin ? 'Admin' : isMaestro ? 'Maestro' : isInvestor ? 'Investor' : isExternal ? 'External' : ''}
                    </div>
                  </div>
                  {(isAdmin || isMaestro) && (
                    <Link href="/home" className="abarva-menu-item" style={{ display: 'block', padding: '9px 14px', textDecoration: 'none', fontFamily: SANS, fontSize: '13px', color: DROP_HEAD, borderRadius: '8px', margin: '0 4px' }}>
                      Maestro Workspace
                    </Link>
                  )}
                  {canShow('setup') && (
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
              <span title="Demo temporarily unavailable — new version coming soon" style={{ fontSize: '12px', fontWeight: 600, color: NAV_MUTE, background: '#F5F3EE', padding: '5px 14px', borderRadius: '6px', flexShrink: 0, fontFamily: SANS, border: `1px solid ${NAV_BORD}`, cursor: 'default' }}>
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
    <Suspense fallback={<div style={{ height: '56px', background: NAV_BG, borderBottom: BORDER.hairline }} />}>
      <NavInner {...props} />
    </Suspense>
  )
}
