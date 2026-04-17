'use client'
import { useState, useRef, Suspense } from 'react'
import { useUser, useClerk } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useClientContext, ALL_CLIENTS } from '@/lib/use-client-context'

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
  const avrPath = (slug: string) => `/ai-strategy?module=${slug}&client=${clientId}`

  // ── Active states ─────────────────────────────────────────────────────────
  const avrActive = [
    'architecture', 'ai-pdlc', 'avr', 'data-intelligence', 'justify',
    'contradictions', 'outcome-intelligence', 'diagnose', 'vendor-intelligence', 'ai-strategy',
    'ai-value-realization',
  ].includes(activePage || '')
  const intelligenceActive = activePage === 'intelligence'
  const solutionsActive    = activePage === 'solutions'
  const adminActive        = (activePage || '').startsWith('admin')
  const platformActive     = activePage === 'platform'
  const investorActive     = activePage === 'investor'
  const demoActive         = activePage === 'demo'
  const maestroActive      = activePage === 'maestro'
  const homeActive         = activePage === 'home'

  // ── AVR breadcrumb ────────────────────────────────────────────────────────
  const MODULE_CRUMBS: Record<string, { phase: number; phaseLabel: string; phaseColor: string; moduleName: string }> = {
    'diagnose':             { phase: 1, phaseLabel: 'DIAGNOSE',          phaseColor: '#4DA3FF', moduleName: 'Situation Intelligence' },
    'contradictions':       { phase: 1, phaseLabel: 'DIAGNOSE',          phaseColor: '#4DA3FF', moduleName: 'Contradiction Intelligence' },
    'data-intelligence':    { phase: 1, phaseLabel: 'DIAGNOSE',          phaseColor: '#4DA3FF', moduleName: 'Data Intelligence' },
    'vendor-intelligence':  { phase: 2, phaseLabel: 'PRESCRIBE',         phaseColor: '#F59E0B', moduleName: 'Vendor Intelligence' },
    'architecture':         { phase: 2, phaseLabel: 'PRESCRIBE',         phaseColor: '#F59E0B', moduleName: 'Architecture Intelligence' },
    'justify':              { phase: 2, phaseLabel: 'PRESCRIBE',         phaseColor: '#F59E0B', moduleName: 'Business Case Intelligence' },
    'ai-pdlc':              { phase: 3, phaseLabel: 'VALUE REALIZATION', phaseColor: '#34D399', moduleName: 'AI Delivery Intelligence' },
    'outcome-intelligence': { phase: 3, phaseLabel: 'VALUE REALIZATION', phaseColor: '#34D399', moduleName: 'Outcome Intelligence' },
  }
  const crumb = MODULE_CRUMBS[activePage || '']
  const showBreadcrumb = (isAdmin || isMaestro) && !!crumb

  // ── AVR phases ────────────────────────────────────────────────────────────
  const AVR_PHASES = [
    {
      phase: 1, label: 'DIAGNOSE', color: '#4DA3FF',
      modules: [
        { name: 'Situation Intelligence',     num: '01', desc: 'What is broken — and what it costs',                  path: avrPath('situation') },
        { name: 'Contradiction Intelligence', num: '02', desc: 'What was promised vs what the data shows',             path: avrPath('contradiction') },
        { name: 'Data Intelligence',          num: '03', desc: 'Is your data ready to support AI?',                   path: avrPath('data') },
      ],
    },
    {
      phase: 2, label: 'PRESCRIBE', color: '#F59E0B',
      modules: [
        { name: 'Technology Intelligence',    num: '04', desc: 'Stack inventory, spend, and contract windows',         path: avrPath('technology') },
        { name: 'Vendor Intelligence',        num: '05', desc: 'Which vendor wins in your situation — not their demo', path: avrPath('vendor') },
        { name: 'Architecture Intelligence',  num: '06', desc: 'Target AI stack blueprint for 3 years out',           path: avrPath('architecture') },
        { name: 'Business Case Intelligence', num: '07', desc: 'CFO-grade numbers the board will sign off on',        path: avrPath('business-case') },
      ],
    },
    {
      phase: 3, label: 'EXECUTE', color: '#34D399',
      modules: [
        { name: 'AI Delivery Intelligence', num: '08', desc: 'Portfolio, blockers, delivery roadmap',                 path: avrPath('ai-delivery') },
        { name: 'Outcome Intelligence',     num: '09', desc: 'Baseline locked — verified delta — fee earned',         path: avrPath('outcome') },
        { name: 'Monthly Actuals',          num: '10', desc: 'Are the numbers moving right now?',                     path: avrPath('actuals') },
        { name: 'Fee Calculation',          num: '11', desc: 'What AbarVa has earned — verified',                    path: avrPath('fee') },
      ],
    },
  ]

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

  // AVR mega-menu
  const avrMegaMenu = () => (
    <div style={{ position: 'relative' }} onMouseEnter={() => openDrop('avr')} onMouseLeave={startClose}>
      <button style={{ fontSize: '14px', fontFamily: SANS, background: 'none', border: 'none', cursor: 'pointer', padding: '8px 10px', color: avrActive ? TEAL : NAV_TEXT, borderBottom: avrActive ? `2px solid ${TEAL}` : '2px solid transparent' }}>
        AI Value Realization ▾
      </button>
      {open === 'avr' && (
        <div style={{ ...dropPanel, minWidth: '780px', padding: '0', left: '50%', transform: 'translateX(-50%)' }} onMouseEnter={cancelClose} onMouseLeave={startClose}>
          <div style={{ padding: '14px 24px 12px', borderBottom: `1px solid ${DROP_BORD}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontFamily: SANS, fontSize: '14px', fontWeight: 700, color: DROP_HEAD }}>AI Value Realization Navigator</div>
              <div style={{ fontFamily: SANS, fontSize: '11px', color: DROP_DESC, marginTop: '2px' }}>3 phases · 11 modules · gate-locked delivery</div>
            </div>
            <a href={`/ai-strategy?client=${clientId}`} onClick={() => setOpen(null)} style={{ fontFamily: SANS, fontSize: '12px', color: TEAL, fontWeight: 600, textDecoration: 'none', padding: '6px 14px', border: `1px solid rgba(45,212,200,0.35)`, borderRadius: '6px', background: 'rgba(45,212,200,0.05)' }}>
              Open Navigator →
            </a>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0' }}>
            {AVR_PHASES.map((phase, pi) => (
              <div key={phase.phase} style={{ padding: '16px 20px 20px', borderRight: pi < AVR_PHASES.length - 1 ? `1px solid ${DROP_BORD}` : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <div style={{ width: '3px', height: '16px', borderRadius: '2px', background: phase.color, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontFamily: MONO, fontSize: '8px', color: DROP_CAT, letterSpacing: '.1em', textTransform: 'uppercase' as const }}>Phase {phase.phase}</div>
                    <div style={{ fontFamily: SANS, fontSize: '12px', fontWeight: 700, color: phase.color, letterSpacing: '.04em' }}>{phase.label}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {phase.modules.map(item => (
                    <a key={item.name} href={item.path} onClick={() => setOpen(null)}
                      style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '7px 8px', textDecoration: 'none', borderRadius: '6px' }}
                      onMouseEnter={e => (e.currentTarget.style.background = DROP_HOVER)}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <span style={{ fontFamily: MONO, fontSize: '9px', color: DROP_CAT, marginTop: '3px', flexShrink: 0, width: '16px' }}>{item.num}</span>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: DROP_HEAD, fontFamily: SANS, lineHeight: 1.3 }}>{item.name}</div>
                        <div style={{ fontSize: '10px', color: DROP_DESC, fontFamily: SANS, marginTop: '2px', lineHeight: 1.4 }}>{item.desc}</div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 200 }}>
      <div id="abarva-nav" style={{
        height: '60px', background: NAV_BG,
        borderBottom: showBreadcrumb ? 'none' : `1px solid ${NAV_BORD}`,
        display: 'flex', alignItems: 'center', padding: '0 24px', gap: '2px',
        boxSizing: 'border-box',
      }}>

        {/* ── Wordmark ─────────────────────────────────────────────────────── */}
        <a href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', marginRight: '24px', flexShrink: 0 }}>
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
            {navLink('Maestro', `/maestro/${clientId}`, maestroActive)}
            {navLink('Intelligence', intelligencePath, intelligenceActive)}
            {avrMegaMenu()}
            {navLink('Solutions', '/solutions', solutionsActive)}
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            INVESTOR — same as admin; Admin link greyed out on right
        ══════════════════════════════════════════════════════════════════ */}
        {signedIn && isInvestor && (
          <>
            {clientDropdown()}
            {navLink('Maestro', `/maestro/${clientId}`, maestroActive)}
            {navLink('Intelligence', intelligencePath, intelligenceActive)}
            {avrMegaMenu()}
            {navLink('Solutions', '/solutions', solutionsActive)}
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            MAESTRO — Maestro · Intelligence · AVR · Solutions | Platform · Admin(grey)
        ══════════════════════════════════════════════════════════════════ */}
        {signedIn && isMaestro && (
          <>
            {staticClientLabel()}
            {navLink('Maestro', `/maestro/${clientId}`, maestroActive)}
            {navLink('Intelligence', intelligencePath, intelligenceActive)}
            {avrMegaMenu()}
            {navLink('Solutions', '/solutions', solutionsActive)}
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            UNAUTHENTICATED / CLIENT — Solutions | Platform · Investor · Demo
        ══════════════════════════════════════════════════════════════════ */}
        {(!signedIn || isClient) && (
          <>
            {navLink('Solutions', '/solutions', solutionsActive)}
            {navLink('Investor', '/investor', investorActive)}
            {navLink('Demo', '/demo', demoActive)}
          </>
        )}

        {/* ── Right side: Demo · Platform · Investor · Admin + user avatar ─── */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
          {signedIn && navLink('Demo', '/demo', demoActive)}
          {signedIn && navLink('Platform', '/platform', platformActive)}
          {signedIn && isAdmin && navLink('Investor', '/investor', investorActive)}
          {signedIn && isInvestor && navLink('Home', '/', homeActive)}
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
              <a href="/demo" style={{ fontSize: '12px', fontWeight: 600, color: NAV_BG, background: NAV_TEXT, textDecoration: 'none', padding: '5px 14px', borderRadius: '4px', flexShrink: 0, fontFamily: SANS }}>
                Request Demo
              </a>
            </>
          )}
        </div>

      </div>

      {/* ── AVR breadcrumb (admin + maestro only) ─────────────────────────── */}
      {showBreadcrumb && crumb && (
        <div style={{ height: '30px', background: NAV_BG, borderBottom: `1px solid ${NAV_BORD}`, display: 'flex', alignItems: 'center', padding: '0 24px', gap: '8px' }}>
          <a href={`/ai-strategy?client=${clientId}`} style={{ fontFamily: MONO, fontSize: '9px', color: TEAL, textDecoration: 'none', letterSpacing: '.06em', opacity: 0.9 }}>AI Value Realization</a>
          <span style={{ fontFamily: MONO, fontSize: '9px', color: NAV_BORD }}>›</span>
          <span style={{ fontFamily: MONO, fontSize: '9px', color: crumb.phaseColor, letterSpacing: '.06em', opacity: 0.85 }}>Phase {crumb.phase} — {crumb.phaseLabel}</span>
          <span style={{ fontFamily: MONO, fontSize: '9px', color: NAV_BORD }}>›</span>
          <span style={{ fontFamily: MONO, fontSize: '9px', color: 'rgba(255,255,255,0.45)', letterSpacing: '.06em' }}>{crumb.moduleName}</span>
        </div>
      )}
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
