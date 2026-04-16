'use client'
import { useState, useRef, Suspense } from 'react'
import { useUser, useClerk } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useClientContext, ALL_CLIENTS } from '@/lib/use-client-context'

// ── Nav tokens ────────────────────────────────────────────────────────────────
const NAV_BG   = '#060A12'   // dark bar background
const NAV_BORD = '#1C2D45'   // bar bottom border
const TEAL     = '#2DD4C8'
const NAV_TEXT = '#EFF6FF'   // primary text on dark bar
const NAV_MUTE = 'rgba(239,246,255,0.55)'  // secondary text on dark bar
const SANS     = 'DM Sans, sans-serif'
const MONO     = 'JetBrains Mono, monospace'
const SERIF    = 'Georgia, serif'

// ── Dropdown tokens (white panel, black text — Snowflake style) ───────────────
const DROP_BG   = '#FFFFFF'
const DROP_BORD = '#E5E7EB'
const DROP_HEAD = '#0C0C0C'   // primary item label
const DROP_DESC = '#6B7280'   // secondary description
const DROP_CAT  = '#9CA3AF'   // category / phase header
const DROP_HOVER = '#F9FAFB'

interface NavProps {
  activePage?: string
}

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

  const metaClientId = user?.publicMetadata?.clientId as string | undefined
  const metaRole     = user?.publicMetadata?.role       as string | undefined

  const signedIn    = isLoaded && !!user
  const displayName = user?.fullName || user?.emailAddresses?.[0]?.emailAddress?.split('@')?.[0] || 'User'
  const initials    = displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

  const roleLabel =
    metaRole === 'admin'    ? 'Admin'    :
    metaRole === 'investor' ? 'Investor' :
    metaRole === 'client'   ? 'Client'   : null

  const isElevated = metaRole === 'admin' || metaRole === 'investor'
  const isAdmin    = metaRole === 'admin' || metaRole === 'investor'  // investors play Maestro role

  const solutionPath = (sol: string) => {
    if (metaRole === 'client' && metaClientId) return `/portal/${sol}?client=${metaClientId}`
    return `/solutions/${sol}`
  }

  const modulePath = (page: string) => `/${page}?client=${clientId}`

  // Intelligence → cockpit at /intelligence (separate from AVR module links)
  const intelligencePath = modulePath('intelligence')

  // 3 phases × modules → all link to unified /ai-strategy page
  const avrPath = (slug: string) => `/ai-strategy?module=${slug}&client=${clientId}`
  const AVR_PHASES = [
    {
      phase: 1,
      label: 'DIAGNOSE',
      color: '#4DA3FF',
      modules: [
        { name: 'Situation Intelligence',     num: '01', desc: 'What is broken — and what it costs',             path: avrPath('situation') },
        { name: 'Contradiction Intelligence', num: '02', desc: 'What was promised vs what the data shows',        path: avrPath('contradiction') },
        { name: 'Data Intelligence',          num: '03', desc: 'Is your data ready to support AI?',              path: avrPath('data') },
      ],
    },
    {
      phase: 2,
      label: 'PRESCRIBE',
      color: '#F59E0B',
      modules: [
        { name: 'Technology Intelligence',    num: '04', desc: 'Stack inventory, spend, and contract windows',    path: avrPath('technology') },
        { name: 'Vendor Intelligence',        num: '05', desc: 'Which vendor wins in your situation — not their demo', path: avrPath('vendor') },
        { name: 'Architecture Intelligence',  num: '06', desc: 'Target AI stack blueprint for 3 years out',      path: avrPath('architecture') },
        { name: 'Business Case Intelligence', num: '07', desc: 'CFO-grade numbers the board will sign off on',   path: avrPath('business-case') },
      ],
    },
    {
      phase: 3,
      label: 'EXECUTE',
      color: '#34D399',
      modules: [
        { name: 'AI Delivery Intelligence', num: '08', desc: 'Portfolio, blockers, delivery roadmap',            path: avrPath('ai-delivery') },
        { name: 'Outcome Intelligence',     num: '09', desc: 'Baseline locked — verified delta — fee earned',    path: avrPath('outcome') },
        { name: 'Monthly Actuals',          num: '10', desc: 'Are the numbers moving right now?',                path: avrPath('actuals') },
        { name: 'Fee Calculation',          num: '11', desc: 'What AbarVa has earned — verified',               path: avrPath('fee') },
      ],
    },
  ]

  // Admin sub-menu items — all route to /admin portal with ?section= param
  const ADMIN_ITEMS = [
    { label: 'Program Dashboard', path: '/admin?section=program', desc: 'All engagements, phases, approvals, fees' },
    { label: 'Client Setup',        path: '/admin?section=setup',     desc: 'Client profile, fee model, contacts' },
    { label: 'Data Uploads',        path: '/admin?section=data',      desc: 'Upload files, approve data, AI readiness' },
    { label: 'Engagements',         path: '/admin?section=engagements', desc: 'Define and assign engagement backlog' },
    { label: 'Users & Roles',       path: '/admin?section=users',     desc: 'Invite Maestros, assign engagements' },
    { label: 'Workload',            path: '/admin?section=backlog',   desc: 'Capacity planning and assignment' },
  ]

  // AVR active: 8 module pages — intelligence is now its own top-level cockpit link
  const avrActive = [
    'architecture', 'ai-pdlc', 'avr',
    'data-intelligence', 'justify', 'contradictions', 'outcome-intelligence',
    'diagnose', 'vendor-intelligence', 'ai-strategy',
  ].includes(activePage || '')

  // Intelligence cockpit active
  const intelligenceActive = activePage === 'intelligence'

  // AI Unlock active
  const aiUnlockActive = activePage === 'ai-unlock'

  const adminActive = (activePage || '').startsWith('admin')

  // Breadcrumb
  const MODULE_CRUMBS: Record<string, { phase: number; phaseLabel: string; phaseColor: string; moduleName: string }> = {
    'diagnose':             { phase: 1, phaseLabel: 'DIAGNOSE',          phaseColor: '#4DA3FF', moduleName: 'Situation Intelligence' },
    'contradictions':       { phase: 1, phaseLabel: 'DIAGNOSE',          phaseColor: '#4DA3FF', moduleName: 'Contradiction Intelligence' },
    'data-intelligence':    { phase: 1, phaseLabel: 'DIAGNOSE',          phaseColor: '#4DA3FF', moduleName: 'Data Intelligence' },
    // 'intelligence' is a standalone cockpit — no AVR breadcrumb
    'vendor-intelligence':  { phase: 2, phaseLabel: 'PRESCRIBE',         phaseColor: '#F59E0B', moduleName: 'Vendor Intelligence' },
    'architecture':         { phase: 2, phaseLabel: 'PRESCRIBE',         phaseColor: '#F59E0B', moduleName: 'Architecture Intelligence' },
    'justify':              { phase: 2, phaseLabel: 'PRESCRIBE',         phaseColor: '#F59E0B', moduleName: 'Business Case Intelligence' },
    'ai-pdlc':              { phase: 3, phaseLabel: 'VALUE REALIZATION', phaseColor: '#34D399', moduleName: 'AI Delivery Intelligence' },
    'outcome-intelligence': { phase: 3, phaseLabel: 'VALUE REALIZATION', phaseColor: '#34D399', moduleName: 'Outcome Intelligence' },
  }
  const crumb = MODULE_CRUMBS[activePage || '']
  const showBreadcrumb = signedIn && isElevated && !!crumb

  // Shared dropdown panel style (white, Snowflake-inspired)
  const dropPanel: React.CSSProperties = {
    position: 'absolute', top: '58px', left: 0,
    background: DROP_BG,
    border: `1px solid ${DROP_BORD}`,
    borderRadius: '12px',
    padding: '8px 0',
    zIndex: 300,
    boxShadow: '0 4px 32px rgba(0,0,0,0.18)',
  }

  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 200 }}>
      <div id="abarva-nav" style={{
        height: '60px',
        background: NAV_BG,
        borderBottom: showBreadcrumb ? 'none' : `1px solid ${NAV_BORD}`,
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        gap: '2px',
        boxSizing: 'border-box',
      }}>

        {/* ── Wordmark ──────────────────────────────────────────────────────── */}
        <a href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', marginRight: '24px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', lineHeight: 1 }}>
            <span style={{ fontFamily: SERIF, fontSize: '21px', fontWeight: 700, color: '#FFFFFF' }}>Abar</span>
            <span style={{ fontFamily: SERIF, fontSize: '26px', fontWeight: 900, color: TEAL }}>Va</span>
          </div>
        </a>

        {/* ── Client toggle — admin + investor only ─────────────────────────── */}
        {signedIn && isElevated && (
          <div style={{ position: 'relative', marginRight: '16px' }}>
            <button
              onClick={() => canSwitch ? setClientToggleOpen(o => !o) : undefined}
              style={{
                display: 'flex', alignItems: 'center', gap: '7px',
                background: 'none', border: 'none', padding: '4px 8px 4px 0',
                cursor: canSwitch ? 'pointer' : 'default',
              }}
            >
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: currentClient.color, flexShrink: 0 }} />
              <span style={{ fontFamily: SANS, fontSize: '13px', fontWeight: 600, color: NAV_TEXT }}>{currentClient.shortName}</span>
              {canSwitch && <span style={{ fontFamily: MONO, fontSize: '9px', color: NAV_MUTE }}>▾</span>}
            </button>

            {canSwitch && clientToggleOpen && (
              <div
                onMouseLeave={() => setClientToggleOpen(false)}
                style={{
                  position: 'absolute', top: 'calc(100% + 6px)', left: 0,
                  background: DROP_BG, border: `1px solid ${DROP_BORD}`,
                  borderRadius: '10px', padding: '6px', zIndex: 400, minWidth: '220px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                }}>
                <div style={{ fontFamily: MONO, fontSize: '8px', color: DROP_CAT, letterSpacing: '.1em', padding: '4px 8px 8px', textTransform: 'uppercase' }}>
                  Switch Account
                </div>
                {ALL_CLIENTS.map(c => {
                  const isActive  = c.id === clientId
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
                        <div style={{ fontFamily: SANS, fontSize: '12px', fontWeight: isActive ? 600 : 400, color: isActive ? c.color : DROP_HEAD }}>
                          {c.shortName}
                        </div>
                      </div>
                      {isActive && <span style={{ fontFamily: MONO, fontSize: '9px', color: c.color }}>✓</span>}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Intelligence — signed-in only ────────────────────────────────── */}
        {signedIn && (
          <a
            href={intelligencePath}
            style={{
              fontSize: '13px',
              color: intelligenceActive ? TEAL : NAV_TEXT,
              padding: '8px 10px', fontFamily: SANS, textDecoration: 'none', flexShrink: 0,
              borderBottom: intelligenceActive ? `2px solid ${TEAL}` : '2px solid transparent',
            }}>
            Intelligence
          </a>
        )}

        {/* ── Solutions ▾ ──────────────────────────────────────────────────── */}
        <div style={{ position: 'relative' }} onMouseEnter={() => openDrop('solutions')} onMouseLeave={startClose}>
          <button style={{
            fontSize: '13px', color: activePage === 'solutions' ? TEAL : NAV_TEXT,
            background: 'none', border: 'none', cursor: 'pointer', padding: '8px 10px', fontFamily: SANS,
            borderBottom: activePage === 'solutions' ? `2px solid ${TEAL}` : '2px solid transparent',
          }}>
            Solutions ▾
          </button>
          {open === 'solutions' && (
            <div style={{ ...dropPanel, minWidth: '300px' }} onMouseEnter={cancelClose} onMouseLeave={startClose}>
              {[
                { name: 'AI-Powered PDLC',         sol: 'pdlc',   desc: 'Build products at twice the velocity' },
                { name: 'Margin Optimization',      sol: 'margin', desc: 'Recover margin across revenue, cost, AI' },
                { name: 'Technology Modernization', sol: 'tech',   desc: 'Govern the modernization the vendor cannot' },
              ].map(item => (
                <a key={item.name} href={solutionPath(item.sol)} onClick={() => setOpen(null)}
                  style={{ display: 'block', padding: '10px 20px', textDecoration: 'none', borderRadius: '8px', margin: '0 4px' }}
                  onMouseEnter={e => (e.currentTarget.style.background = DROP_HOVER)}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: DROP_HEAD, fontFamily: SANS }}>{item.name}</div>
                  <div style={{ fontSize: '11px', color: DROP_DESC, fontFamily: SANS, marginTop: '2px' }}>{item.desc}</div>
                </a>
              ))}
              <div style={{ borderTop: `1px solid ${DROP_BORD}`, margin: '6px 0' }} />
              <a href="/solutions" onClick={() => setOpen(null)}
                style={{ display: 'block', padding: '9px 20px', textDecoration: 'none', fontFamily: SANS, fontSize: '13px', color: '#1D4ED8', fontWeight: 500, borderRadius: '8px', margin: '0 4px' }}
                onMouseEnter={e => (e.currentTarget.style.background = DROP_HOVER)}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                View all solutions →
              </a>
            </div>
          )}
        </div>

        {/* ── Start Here ▾ — mega menu ─────────────────────────────────────── */}
        <div style={{ position: 'relative' }} onMouseEnter={() => openDrop('avr')} onMouseLeave={startClose}>
          <button style={{
            fontSize: '13px', fontFamily: SANS, background: 'none', border: 'none', cursor: 'pointer', padding: '8px 10px',
            color: avrActive ? TEAL : NAV_TEXT,
            borderBottom: avrActive ? `2px solid ${TEAL}` : '2px solid transparent',
          }}>
            AI Value Realization ▾
          </button>
          {open === 'avr' && (
            <div
              style={{
                ...dropPanel,
                minWidth: '780px',
                padding: '0',
                left: '50%',
                transform: 'translateX(-50%)',
              }}
              onMouseEnter={cancelClose}
              onMouseLeave={startClose}
            >
              {/* Top bar */}
              <div style={{
                padding: '14px 24px 12px',
                borderBottom: `1px solid ${DROP_BORD}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ fontFamily: SANS, fontSize: '14px', fontWeight: 700, color: DROP_HEAD }}>
                    AI Value Realization Navigator
                  </div>
                  <div style={{ fontFamily: SANS, fontSize: '11px', color: DROP_DESC, marginTop: '2px' }}>
                    3 phases · 11 modules · gate-locked delivery
                  </div>
                </div>
                <a
                  href={`/ai-strategy?client=${clientId}`}
                  onClick={() => setOpen(null)}
                  style={{
                    fontFamily: SANS, fontSize: '12px', color: TEAL, fontWeight: 600,
                    textDecoration: 'none', padding: '6px 14px',
                    border: `1px solid rgba(45,212,200,0.35)`, borderRadius: '6px',
                    background: 'rgba(45,212,200,0.05)',
                  }}
                >
                  Open Navigator →
                </a>
              </div>

              {/* 3-column phase grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0' }}>
                {AVR_PHASES.map((phase, pi) => (
                  <div
                    key={phase.phase}
                    style={{
                      padding: '16px 20px 20px',
                      borderRight: pi < AVR_PHASES.length - 1 ? `1px solid ${DROP_BORD}` : 'none',
                    }}
                  >
                    {/* Phase label */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <div style={{ width: '3px', height: '16px', borderRadius: '2px', background: phase.color, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontFamily: MONO, fontSize: '8px', color: DROP_CAT, letterSpacing: '.1em', textTransform: 'uppercase' as const }}>
                          Phase {phase.phase}
                        </div>
                        <div style={{ fontFamily: SANS, fontSize: '12px', fontWeight: 700, color: phase.color, letterSpacing: '.04em' }}>
                          {phase.label}
                        </div>
                      </div>
                    </div>

                    {/* Module list */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      {phase.modules.map(item => (
                        <a
                          key={item.name}
                          href={item.path}
                          onClick={() => setOpen(null)}
                          style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '7px 8px', textDecoration: 'none', borderRadius: '6px' }}
                          onMouseEnter={e => (e.currentTarget.style.background = DROP_HOVER)}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <span style={{ fontFamily: MONO, fontSize: '9px', color: DROP_CAT, marginTop: '3px', flexShrink: 0, width: '16px' }}>
                            {item.num}
                          </span>
                          <div>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: DROP_HEAD, fontFamily: SANS, lineHeight: 1.3 }}>
                              {item.name}
                            </div>
                            <div style={{ fontSize: '10px', color: DROP_DESC, fontFamily: SANS, marginTop: '2px', lineHeight: 1.4 }}>
                              {item.desc}
                            </div>
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

        {/* ── Admin ▾ — admin role only ─────────────────────────────────────── */}
        {signedIn && isAdmin && (
          <div style={{ position: 'relative' }} onMouseEnter={() => openDrop('admin')} onMouseLeave={startClose}>
            <button style={{
              fontSize: '13px', fontFamily: SANS, background: 'none', border: 'none', cursor: 'pointer', padding: '8px 10px',
              color: adminActive ? TEAL : NAV_TEXT,
              borderBottom: adminActive ? `2px solid ${TEAL}` : '2px solid transparent',
            }}>
              Admin ▾
            </button>
            {open === 'admin' && (
              <div style={{ ...dropPanel, minWidth: '260px' }} onMouseEnter={cancelClose} onMouseLeave={startClose}>
                <div style={{ padding: '8px 16px 10px', borderBottom: `1px solid ${DROP_BORD}`, marginBottom: '6px' }}>
                  <span style={{ fontFamily: MONO, fontSize: '8px', color: DROP_CAT, letterSpacing: '.1em', textTransform: 'uppercase' as const }}>
                    Admin Console
                  </span>
                </div>
                {ADMIN_ITEMS.map(item => (
                  <a key={item.label} href={item.path} onClick={() => setOpen(null)}
                    style={{ display: 'block', padding: '9px 16px', textDecoration: 'none', borderRadius: '8px', margin: '0 4px' }}
                    onMouseEnter={e => (e.currentTarget.style.background = DROP_HOVER)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ fontSize: '13px', fontWeight: 600, color: DROP_HEAD, fontFamily: SANS }}>{item.label}</div>
                    <div style={{ fontSize: '11px', color: DROP_DESC, fontFamily: SANS, marginTop: '2px' }}>{item.desc}</div>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Right side ─────────────────────────────────────────────────────── */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>

          {/* Maestro — all signed-in users: links to client workspace */}
          {signedIn && (
            <a href={`/admin/client/${clientId}`} style={{
              fontSize: '12px', color: activePage === 'maestro' ? TEAL : NAV_TEXT,
              textDecoration: 'none', padding: '6px 10px', fontFamily: SANS, flexShrink: 0,
            }}>
              Maestro
            </a>
          )}

          {/* Demo */}
          <a href="/demo" style={{
            fontSize: '12px', color: activePage === 'demo' ? TEAL : NAV_TEXT,
            textDecoration: 'none', padding: '6px 10px', fontFamily: SANS, flexShrink: 0,
          }}>
            Demo
          </a>

          {/* Platform */}
          <a href="/platform" style={{
            fontSize: '12px', color: NAV_TEXT, textDecoration: 'none',
            padding: '6px 10px', fontFamily: SANS, flexShrink: 0,
          }}>
            Platform
          </a>

          {signedIn ? (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setUserMenuOpen(o => !o)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  background: 'none', border: 'none', padding: '4px 0',
                  cursor: 'pointer',
                }}
              >
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', fontWeight: 500, color: NAV_TEXT, fontFamily: SANS }}>{displayName}</div>
                  {roleLabel && <div style={{ fontSize: '9px', color: TEAL, fontFamily: MONO }}>{roleLabel}</div>}
                </div>
                <div style={{
                  width: '30px', height: '30px', borderRadius: '50%',
                  background: 'rgba(45,212,200,0.18)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '10px', fontWeight: 700, color: TEAL, fontFamily: MONO, flexShrink: 0,
                }}>
                  {initials}
                </div>
              </button>

              {userMenuOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 6px)', right: 0,
                  background: DROP_BG, border: `1px solid ${DROP_BORD}`, borderRadius: '10px',
                  padding: '6px 0', zIndex: 400, minWidth: '180px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                }}>
                  <div style={{ padding: '8px 14px 10px', borderBottom: `1px solid ${DROP_BORD}`, marginBottom: '4px' }}>
                    <div style={{ fontFamily: SANS, fontSize: '13px', color: DROP_HEAD, fontWeight: 600 }}>{displayName}</div>
                    {roleLabel && <div style={{ fontFamily: MONO, fontSize: '9px', color: DROP_DESC, marginTop: '2px' }}>{roleLabel}</div>}
                  </div>
                  {isAdmin && (
                    <a href="/admin" style={{ display: 'block', padding: '9px 14px', textDecoration: 'none', fontFamily: SANS, fontSize: '13px', color: DROP_HEAD, borderRadius: '8px', margin: '0 4px' }}
                      onMouseEnter={e => (e.currentTarget.style.background = DROP_HOVER)}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      Admin Dashboard
                    </a>
                  )}
                  <button
                    onClick={() => { setUserMenuOpen(false); signOut(() => router.push('/')) }}
                    style={{
                      width: '100%', textAlign: 'left', padding: '9px 14px',
                      fontSize: '13px', color: DROP_HEAD, background: 'transparent',
                      border: 'none', cursor: 'pointer', fontFamily: SANS, borderRadius: '8px', margin: '0 4px',
                    }}
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
              <a href="/investor" style={{
                fontSize: '12px', color: NAV_TEXT, textDecoration: 'none',
                padding: '6px 10px', fontFamily: SANS,
              }}>
                Investor
              </a>
              <a href="/sign-in" style={{
                background: TEAL, color: '#060A12', fontSize: '13px', fontWeight: 600,
                textDecoration: 'none', padding: '7px 18px', borderRadius: '8px', flexShrink: 0, fontFamily: SANS,
              }}>
                Login →
              </a>
            </>
          )}
        </div>

      </div>

      {/* ── Explorer breadcrumb ───────────────────────────────────────────────── */}
      {showBreadcrumb && crumb && (
        <div style={{
          height: '30px', background: NAV_BG,
          borderBottom: `1px solid ${NAV_BORD}`,
          display: 'flex', alignItems: 'center', padding: '0 24px', gap: '8px',
        }}>
          <a
            href={`/ai-strategy?client=${clientId}`}
            style={{ fontFamily: MONO, fontSize: '9px', color: TEAL, textDecoration: 'none', letterSpacing: '.06em', opacity: 0.9 }}
          >
            AI Value Realization
          </a>
          <span style={{ fontFamily: MONO, fontSize: '9px', color: NAV_BORD }}>›</span>
          <span style={{ fontFamily: MONO, fontSize: '9px', color: crumb.phaseColor, letterSpacing: '.06em', opacity: 0.85 }}>
            Phase {crumb.phase} — {crumb.phaseLabel}
          </span>
          <span style={{ fontFamily: MONO, fontSize: '9px', color: NAV_BORD }}>›</span>
          <span style={{ fontFamily: MONO, fontSize: '9px', color: 'rgba(255,255,255,0.45)', letterSpacing: '.06em' }}>
            {crumb.moduleName}
          </span>
        </div>
      )}
    </div>
  )
}

export default function AbarvaNav(props: NavProps) {
  return (
    <Suspense fallback={
      <div style={{ height: '60px', background: '#0D1520', borderBottom: '1px solid #1C2D45' }} />
    }>
      <NavInner {...props} />
    </Suspense>
  )
}
