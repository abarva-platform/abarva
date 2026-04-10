'use client'
import { useState, useRef } from 'react'
import { useUser, UserButton } from '@clerk/nextjs'

type DropdownId = 'products' | 'clients' | 'deliverables' | null

interface AbarvaNavProps {
  clientId?: string
  onClientChange?: (clientId: string) => void
  activePage?: string
  showAdmin?: boolean
}

function DropItem({ icon, name, desc, href }: { icon: string; name: string; desc: string; href: string }) {
  return (
    <a
      href={href}
      style={{ display: 'flex', gap: '12px', padding: '10px 12px', borderRadius: '8px', textDecoration: 'none', alignItems: 'center' }}
      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#1C2128')}
      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
    >
      <div style={{ width: '32px', height: '32px', background: '#21262D', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '13px', color: '#E6EDF3', fontWeight: 600, marginBottom: '2px' }}>{name}</div>
        <div style={{ fontSize: '11px', color: '#6B7280' }}>{desc}</div>
      </div>
    </a>
  )
}

const COL_HEAD: React.CSSProperties = {
  fontSize: '10px', color: '#6B7280', fontWeight: 700,
  textTransform: 'uppercase' as const, letterSpacing: '0.1em',
  marginBottom: '10px', paddingLeft: '12px',
}

const DROP_PANEL: React.CSSProperties = {
  background: '#161B22', border: '1px solid #21262D', borderRadius: '12px',
  padding: '20px', zIndex: 200, boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
}

export default function AbarvaNav({ clientId = 'meridian' }: AbarvaNavProps) {
  const { user } = useUser()
  const [open, setOpen] = useState<DropdownId>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const openDrop = (id: DropdownId) => {
    if (timer.current) clearTimeout(timer.current)
    setOpen(id)
  }
  const startClose = () => {
    timer.current = setTimeout(() => setOpen(null), 150)
  }
  const cancelClose = () => {
    if (timer.current) clearTimeout(timer.current)
  }

  const linkCss = (id: DropdownId): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: '4px',
    padding: '0 14px', height: '64px', cursor: 'pointer',
    color: open === id ? '#E6EDF3' : '#9CA3AF',
    fontSize: '13px', fontWeight: 500,
    borderBottom: open === id ? '2px solid #2DD4C8' : '2px solid transparent',
    boxSizing: 'border-box' as const, transition: 'color 0.1s',
    userSelect: 'none' as const,
    fontFamily: '-apple-system, "Helvetica Neue", sans-serif',
  })

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 768px) {
          #ab-center { display: none !important; }
          #ab-hamburger { display: flex !important; }
        }
      ` }} />
      <nav style={{
        background: '#0D1117', borderBottom: '1px solid #21262D', height: '64px',
        display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center',
        padding: '0 32px', position: 'sticky', top: 0, zIndex: 100,
        fontFamily: '-apple-system, "Helvetica Neue", sans-serif',
      }}>

        {/* LEFT — Logo */}
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <line x1="8" y1="8" x2="14" y2="14" stroke="#2DD4C8" strokeWidth="1" opacity="0.6" />
            <line x1="14" y1="14" x2="20" y2="8" stroke="#6B7280" strokeWidth="1" opacity="0.5" />
            <line x1="14" y1="14" x2="20" y2="20" stroke="#6B7280" strokeWidth="1" opacity="0.5" />
            <line x1="8" y1="8" x2="4" y2="16" stroke="#6B7280" strokeWidth="1" opacity="0.4" />
            <line x1="20" y1="20" x2="14" y2="24" stroke="#6B7280" strokeWidth="1" opacity="0.4" />
            <circle cx="8" cy="8" r="2" fill="#4DA3FF" />
            <circle cx="20" cy="8" r="2" fill="#4DA3FF" />
            <circle cx="14" cy="14" r="2.5" fill="#2DD4C8" />
            <circle cx="20" cy="20" r="2" fill="#4DA3FF" />
            <circle cx="4" cy="16" r="1.5" fill="#4DA3FF" />
            <circle cx="14" cy="24" r="1.5" fill="#4DA3FF" />
          </svg>
          <div>
            <div style={{ fontSize: '17px', fontWeight: 800, fontFamily: 'monospace', lineHeight: 1.1, letterSpacing: '-0.01em' }}>
              <span style={{ color: '#FFFFFF' }}>Abar</span><span style={{ color: '#2DD4C8' }}>VA</span>
            </div>
            <div style={{ fontSize: '9px', color: '#6B7280', fontFamily: 'monospace', letterSpacing: '0.04em', lineHeight: 1 }}>
              Enterprise AI Operating System
            </div>
          </div>
        </a>

        {/* CENTER — Nav links with dropdowns */}
        <div id="ab-center" style={{ display: 'flex', alignItems: 'center', height: '64px' }}>

          {/* Products ▾ */}
          <div style={{ position: 'relative', height: '64px', display: 'flex', alignItems: 'center' }}
            onMouseEnter={() => openDrop('products')} onMouseLeave={startClose}>
            <div style={linkCss('products')}>
              Products
              <span style={{ fontSize: '10px', color: open === 'products' ? '#2DD4C8' : '#6B7280', marginLeft: '2px' }}>▾</span>
            </div>
            {open === 'products' && (
              <div onMouseEnter={cancelClose} onMouseLeave={() => setOpen(null)}
                style={{ ...DROP_PANEL, position: 'absolute', top: '64px', left: 0, minWidth: '560px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <div style={COL_HEAD}>Platform</div>
                  <DropItem icon="⚡" name="Diagnose" desc="Know your situation in 48 hours" href={`/diagnose?client=${clientId}`} />
                  <DropItem icon="🧠" name="AI Strategy" desc="Enterprise AI roadmap in 2 hours" href={`/ai-strategy?client=${clientId}`} />
                  <DropItem icon="💰" name="Justify" desc="Board-ready business case in 30 minutes" href={`/justify?client=${clientId}`} />
                  <DropItem icon="🎯" name="Select" desc="Technology decision intelligence" href={`/select?client=${clientId}`} />
                  <DropItem icon="📊" name="Domain Strategy" desc="Deep-dive AI strategy by domain" href={`/domain-strategy?client=${clientId}`} />
                  <DropItem icon="🔬" name="Scenarios" desc="Decision simulation engine" href={`/scenarios?client=${clientId}`} />
                </div>
                <div>
                  <div style={COL_HEAD}>Deliverables</div>
                  <DropItem icon="🏗" name="Architecture Pattern" desc="3-cloud AI orchestration diagram" href={`/architecture?client=${clientId}`} />
                  <DropItem icon="📋" name="Solution Blueprint" desc="Full implementation plan" href={`/blueprint?client=${clientId}`} />
                  <DropItem icon="📈" name="Board Presentation" desc="10-slide board deck generator" href={`/board-deck?client=${clientId}`} />
                  <DropItem icon="💎" name="Value Template" desc="ROI framework, client-editable" href={`/value-template?client=${clientId}`} />
                </div>
              </div>
            )}
          </div>

          {/* Clients ▾ */}
          <div style={{ position: 'relative', height: '64px', display: 'flex', alignItems: 'center' }}
            onMouseEnter={() => openDrop('clients')} onMouseLeave={startClose}>
            <div style={linkCss('clients')}>
              Clients
              <span style={{ fontSize: '10px', color: open === 'clients' ? '#2DD4C8' : '#6B7280', marginLeft: '2px' }}>▾</span>
            </div>
            {open === 'clients' && (
              <div onMouseEnter={cancelClose} onMouseLeave={() => setOpen(null)}
                style={{ ...DROP_PANEL, position: 'absolute', top: '64px', left: 0, minWidth: '640px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                <div>
                  <div style={COL_HEAD}>By Industry</div>
                  {([
                    { label: 'Healthcare & Life Sciences', href: '/diagnose?client=meridian' },
                    { label: 'Financial Services', href: '/diagnose?client=firstcapital' },
                    { label: 'Retail & CPG', href: '/diagnose?client=apexretail' },
                    { label: 'Technology & Software', href: null },
                  ] as { label: string; href: string | null }[]).map((item, i) => (
                    item.href ? (
                      <a key={i} href={item.href}
                        style={{ display: 'block', padding: '8px 12px', borderRadius: '6px', fontSize: '13px', color: '#C9D1D9', textDecoration: 'none', marginBottom: '2px' }}
                        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#1C2128')}
                        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}>
                        {item.label}
                      </a>
                    ) : (
                      <div key={i} style={{ padding: '8px 12px', fontSize: '13px', color: '#4B5563', marginBottom: '2px' }}>
                        {item.label} <span style={{ fontSize: '10px' }}>Soon</span>
                      </div>
                    )
                  ))}
                </div>
                <div>
                  <div style={COL_HEAD}>Live Demos</div>
                  {[
                    { name: 'Meridian Health', sub: 'Healthcare · $11.2B', href: '/diagnose?client=meridian' },
                    { name: 'First Capital', sub: 'Financial Services · $18B Assets', href: '/diagnose?client=firstcapital' },
                    { name: 'Apex Retail', sub: 'Retail · $12.4B', href: '/diagnose?client=apexretail' },
                  ].map((c, i) => (
                    <div key={i} style={{ padding: '10px 12px', borderRadius: '8px', marginBottom: '4px' }}
                      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#1C2128')}
                      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}>
                      <div style={{ fontSize: '13px', color: '#E6EDF3', fontWeight: 600, marginBottom: '2px' }}>{c.name}</div>
                      <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '6px' }}>{c.sub}</div>
                      <a href={c.href} style={{ fontSize: '11px', color: '#2DD4C8', textDecoration: 'none', fontWeight: 600 }}>Open Demo →</a>
                    </div>
                  ))}
                </div>
                <div>
                  <div style={COL_HEAD}>Resources</div>
                  <div style={{ background: '#0D1117', border: '1px solid #21262D', borderRadius: '10px', padding: '16px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#E6EDF3', marginBottom: '6px', lineHeight: 1.4 }}>See Abarva in action</div>
                    <div style={{ fontSize: '11px', color: '#6B7280', lineHeight: 1.5, marginBottom: '12px' }}>
                      Watch how Abarva diagnoses a real enterprise in 4 minutes
                    </div>
                    <a href="/investor" style={{ fontSize: '12px', color: '#2DD4C8', textDecoration: 'none', fontWeight: 600 }}>
                      Watch demo →
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Deliverables ▾ */}
          <div style={{ position: 'relative', height: '64px', display: 'flex', alignItems: 'center' }}
            onMouseEnter={() => openDrop('deliverables')} onMouseLeave={startClose}>
            <div style={linkCss('deliverables')}>
              Deliverables
              <span style={{ fontSize: '10px', color: open === 'deliverables' ? '#2DD4C8' : '#6B7280', marginLeft: '2px' }}>▾</span>
            </div>
            {open === 'deliverables' && (
              <div onMouseEnter={cancelClose} onMouseLeave={() => setOpen(null)}
                style={{ ...DROP_PANEL, position: 'absolute', top: '64px', left: 0, minWidth: '380px' }}>
                <div style={COL_HEAD}>Deliverables</div>
                <DropItem icon="🏗" name="Architecture Pattern" desc="3-cloud AI orchestration diagram" href={`/architecture?client=${clientId}`} />
                <DropItem icon="📋" name="Solution Blueprint" desc="Full implementation plan" href={`/blueprint?client=${clientId}`} />
                <DropItem icon="📈" name="Board Presentation" desc="10-slide board deck generator" href={`/board-deck?client=${clientId}`} />
                <DropItem icon="💎" name="Value Template" desc="ROI framework, client-editable" href={`/value-template?client=${clientId}`} />
                <DropItem icon="🗺" name="Decision Timeline" desc="Key decisions and their outcomes" href={`/timeline?client=${clientId}`} />
                <DropItem icon="🔗" name="Contradiction Map" desc="Strategic contradictions visualized" href={`/contradictions?client=${clientId}`} />
              </div>
            )}
          </div>

          {/* Investor View */}
          <a href="/investor"
            style={{ display: 'flex', alignItems: 'center', padding: '0 14px', height: '64px', fontSize: '13px', fontWeight: 500, color: '#9CA3AF', textDecoration: 'none', borderBottom: '2px solid transparent', boxSizing: 'border-box' as const, transition: 'color 0.1s' }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#E6EDF3')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = '#9CA3AF')}>
            Investor View
          </a>
        </div>

        {/* RIGHT — CTAs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
          {/* Mobile hamburger — visible via CSS media query */}
          <div id="ab-hamburger" style={{ display: 'none', flexDirection: 'column', gap: '4px', cursor: 'pointer', padding: '4px', marginRight: '8px' }}>
            <div style={{ width: '18px', height: '2px', background: '#9CA3AF', borderRadius: '1px' }} />
            <div style={{ width: '18px', height: '2px', background: '#9CA3AF', borderRadius: '1px' }} />
            <div style={{ width: '18px', height: '2px', background: '#9CA3AF', borderRadius: '1px' }} />
          </div>

          <a href="/investor"
            style={{ padding: '0 18px', height: '36px', display: 'flex', alignItems: 'center', borderRadius: '8px', background: '#2DD4C8', color: '#0D1117', fontSize: '13px', fontWeight: 700, textDecoration: 'none' }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#22B5A9')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = '#2DD4C8')}>
            Book a Demo
          </a>

          {user ? (
            <UserButton />
          ) : (
            <a href="/sign-in"
              style={{ padding: '0 18px', height: '36px', display: 'flex', alignItems: 'center', borderRadius: '8px', background: 'transparent', color: '#9CA3AF', border: '1px solid #30363D', fontSize: '13px', fontWeight: 500, textDecoration: 'none' }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#21262D')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}>
              Sign In
            </a>
          )}
        </div>
      </nav>
    </>
  )
}
