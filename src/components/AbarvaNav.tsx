'use client'
import { useState, useRef } from 'react'
import { useUser, UserButton } from '@clerk/nextjs'

type DropdownId = 'products' | 'solutions' | 'clients' | 'deliverables' | null

interface AbarvaNavProps {
  clientId?: string
  onClientChange?: (clientId: string) => void
  activePage?: string
  showAdmin?: boolean
}

function DropItem({ icon, name, desc, href }: { icon: string; name: string; desc: string; href: string }) {
  return (
    <a href={href} className="drop-item">
      <div className="drop-icon" style={{ width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div className="drop-name" style={{ fontSize: '13px', fontWeight: 600, marginBottom: '2px' }}>{name}</div>
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
    color: open === id ? '#2DD4C8' : '#FFFFFF',
    fontSize: '14px', fontWeight: open === id ? 700 : 600,
    borderBottom: open === id ? '2px solid #2DD4C8' : '2px solid transparent',
    boxSizing: 'border-box' as const, transition: 'color 0.15s, border-color 0.25s, font-weight 0.1s',
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
        .drop-item {
          display: flex; gap: 12px; padding: 10px 12px; border-radius: 8px;
          text-decoration: none; align-items: center; background: transparent;
          border-left: 2px solid transparent; transition: all 0.12s ease; box-sizing: border-box;
        }
        .drop-item:hover { background: rgba(45,212,200,0.08); border-left-color: #2DD4C8; padding-left: 14px; }
        .drop-name { color: #FFFFFF; }
        .drop-item:hover .drop-name { color: #2DD4C8; }
        .drop-icon { background: #21262D; }
        .drop-item:hover .drop-icon { background: rgba(45,212,200,0.15); }
        .drop-simple {
          display: block; padding: 8px 12px; border-radius: 6px; font-size: 13px;
          color: #FFFFFF; text-decoration: none; margin-bottom: 2px;
          border-left: 2px solid transparent; transition: all 0.12s ease; box-sizing: border-box;
        }
        .drop-simple:hover { background: rgba(45,212,200,0.08); color: #2DD4C8; border-left-color: #2DD4C8; padding-left: 14px; }
        .drop-card {
          padding: 10px 12px; border-radius: 8px; margin-bottom: 4px;
          border-left: 2px solid transparent; transition: all 0.12s ease; box-sizing: border-box; cursor: pointer;
        }
        .drop-card:hover { background: rgba(45,212,200,0.08); border-left-color: #2DD4C8; padding-left: 14px; }
      ` }} />
      <nav style={{
        background: '#0D1117', borderBottom: '1px solid #21262D', height: '64px',
        display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center',
        padding: '0 32px', position: 'sticky', top: 0, zIndex: 100,
        fontFamily: '-apple-system, "Helvetica Neue", sans-serif',
      }}>

        {/* LEFT — Logo */}
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <svg width="34" height="34" viewBox="0 0 32 32" fill="none">
            {/* Outer hexagon ring: lines connecting adjacent satellite nodes */}
            <line x1="16" y1="6"   x2="24.7" y2="11"  stroke="#2DD4C8" strokeWidth="0.8" opacity="0.15" />
            <line x1="24.7" y1="11" x2="24.7" y2="21"  stroke="#2DD4C8" strokeWidth="0.8" opacity="0.15" />
            <line x1="24.7" y1="21" x2="16"   y2="26"  stroke="#2DD4C8" strokeWidth="0.8" opacity="0.15" />
            <line x1="16"   y1="26" x2="7.3"  y2="21"  stroke="#2DD4C8" strokeWidth="0.8" opacity="0.15" />
            <line x1="7.3"  y1="21" x2="7.3"  y2="11"  stroke="#2DD4C8" strokeWidth="0.8" opacity="0.15" />
            <line x1="7.3"  y1="11" x2="16"   y2="6"   stroke="#2DD4C8" strokeWidth="0.8" opacity="0.15" />
            {/* Spokes: hub to 6 satellites — teal */}
            <line x1="16" y1="16" x2="16"   y2="6"   stroke="#2DD4C8" strokeWidth="1.2" opacity="0.4" />
            <line x1="16" y1="16" x2="24.7" y2="11"  stroke="#2DD4C8" strokeWidth="1.2" opacity="0.4" />
            <line x1="16" y1="16" x2="24.7" y2="21"  stroke="#2DD4C8" strokeWidth="1.2" opacity="0.4" />
            <line x1="16" y1="16" x2="16"   y2="26"  stroke="#2DD4C8" strokeWidth="1.2" opacity="0.4" />
            <line x1="16" y1="16" x2="7.3"  y2="21"  stroke="#2DD4C8" strokeWidth="1.2" opacity="0.4" />
            <line x1="16" y1="16" x2="7.3"  y2="11"  stroke="#2DD4C8" strokeWidth="1.2" opacity="0.4" />
            {/* Satellite nodes */}
            <circle cx="16"   cy="6"  r="2.2" fill="#2DD4C8" />
            <circle cx="24.7" cy="11" r="2.2" fill="#2DD4C8" />
            <circle cx="24.7" cy="21" r="2.2" fill="#2DD4C8" />
            <circle cx="16"   cy="26" r="2.2" fill="#2DD4C8" />
            <circle cx="7.3"  cy="21" r="2.2" fill="#2DD4C8" />
            <circle cx="7.3"  cy="11" r="2.2" fill="#2DD4C8" />
            {/* Hub: glow ring + solid fill + inner dot */}
            <circle cx="16" cy="16" r="8"   fill="#2DD4C8" opacity="0.08" />
            <circle cx="16" cy="16" r="5.5" fill="#2DD4C8" />
            <circle cx="16" cy="16" r="2.2" fill="#0D1117" />
          </svg>
          <div>
            {/* Wordmark: ABAR smaller, VA larger — deliberate size contrast */}
            <div style={{ lineHeight: 1.05, display: 'flex', alignItems: 'baseline' }}>
              <span style={{
                fontSize: '17px', fontWeight: 700,
                fontFamily: "'Georgia', serif",
                color: '#FFFFFF',
                letterSpacing: '-0.02em',
              }}>Abar</span>
              <span style={{
                fontSize: '23px', fontWeight: 900,
                fontFamily: "'Georgia', serif",
                color: '#2DD4C8',
                letterSpacing: '-0.03em',
                marginLeft: '-1px',
              }}>Va</span>
            </div>
            <div style={{
              fontSize: '10px',
              color: '#FFFFFF',
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 700,
              letterSpacing: '0.01em',
              marginTop: '3px',
              whiteSpace: 'nowrap',
            }}>Intelligence. Now act on it.</div>
          </div>
        </a>

        {/* CENTER — Nav links with dropdowns */}
        <div id="ab-center" style={{ display: 'flex', alignItems: 'center', height: '64px' }}>

          {/* Products ▾ */}
          <div style={{ position: 'relative', height: '64px', display: 'flex', alignItems: 'center' }}
            onMouseEnter={() => openDrop('products')} onMouseLeave={startClose}>
            <div style={linkCss('products')}>
              Products
              <span style={{ fontSize: '10px', color: open === 'products' ? '#2DD4C8' : '#94A3B8', marginLeft: '2px' }}>▾</span>
            </div>
            {open === 'products' && (
              <div onMouseEnter={cancelClose} onMouseLeave={() => setOpen(null)}
                style={{ ...DROP_PANEL, position: 'absolute', top: '64px', left: 0, minWidth: '560px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <div style={COL_HEAD}>Intelligence Suite</div>
                  <DropItem icon="⚡" name="Situation Intelligence" desc="What's actually broken — and what's it costing us?" href={`/diagnose?client=${clientId}`} />
                  <DropItem icon="🎯" name="AI Investment Intelligence" desc="Where should we place our bets — and what are they worth?" href={`/ai-strategy?client=${clientId}`} />
                  <DropItem icon="💰" name="Business Case Intelligence" desc="How do I make this number defensible to my board?" href={`/justify?client=${clientId}`} />
                  <DropItem icon="🔍" name="Vendor Intelligence" desc="Who do I actually trust — and why?" href={`/select?client=${clientId}`} />
                  <DropItem icon="🎛" name="Outcome Intelligence" desc="Are we winning — or just spending?" href={`/control-tower?client=${clientId}`} />
                  <DropItem icon="⚙️" name="Delivery Intelligence" desc="Are we shipping faster — or just adding tools?" href={`/ai-pdlc?client=${clientId}`} />
                </div>
                <div>
                  <div style={COL_HEAD}>More Intelligence</div>
                  <DropItem icon="👥" name="Workforce Intelligence" desc="What does my team look like in 18 months?" href={`/future-of-work?client=${clientId}`} />
                  <DropItem icon="📊" name="Data Estate Intelligence" desc="Is our data estate an asset or a liability?" href={`/analytics-modernization?client=${clientId}`} />
                  <DropItem icon="🛒" name="Procurement Intelligence" desc="What should we buy — and what are we already paying for?" href={`/marketplace?client=${clientId}`} />
                  <DropItem icon="🏗" name="Architecture Pattern" desc="3-cloud AI orchestration diagram" href={`/architecture?client=${clientId}`} />
                  <DropItem icon="📋" name="Solution Blueprint" desc="Full implementation plan" href={`/blueprint?client=${clientId}`} />
                  <DropItem icon="📈" name="Board Presentation" desc="10-slide board deck generator" href={`/board-deck?client=${clientId}`} />
                </div>
              </div>
            )}
          </div>

          {/* Solutions ▾ */}
          <div style={{ position: 'relative', height: '64px', display: 'flex', alignItems: 'center' }}
            onMouseEnter={() => openDrop('solutions')} onMouseLeave={startClose}>
            <div style={linkCss('solutions')}>
              Solutions
              <span style={{ fontSize: '10px', color: open === 'solutions' ? '#2DD4C8' : '#94A3B8', marginLeft: '2px' }}>▾</span>
            </div>
            {open === 'solutions' && (
              <div onMouseEnter={cancelClose} onMouseLeave={() => setOpen(null)}
                style={{ ...DROP_PANEL, position: 'absolute', top: '64px', left: 0, minWidth: '480px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                {[
                  {
                    vertical: 'Healthcare',
                    items: [
                      { code: 'HP-01', name: 'Revenue Cycle Intelligence', problem: 'Your denial rate is costing you more than you report.', href: '/solutions/revenue-cycle-intelligence' },
                      { code: 'HP-02', name: 'Patient Access & Growth', problem: 'Your referral leakage is invisible until patients leave.', href: '/solutions/patient-access-growth' },
                    ],
                  },
                  {
                    vertical: 'Financial Services',
                    items: [
                      { code: 'BK-01', name: 'AI Portfolio Accountability', problem: 'You are spending on AI. Do you know if it is working?', href: '/solutions/ai-portfolio-accountability' },
                      { code: 'BK-02', name: 'Customer Revenue Intelligence', problem: 'Digital adoption at 41% while peers are at 67%.', href: '/solutions/customer-revenue-intelligence' },
                    ],
                  },
                  {
                    vertical: 'Retail',
                    items: [
                      { code: 'RT-01', name: 'Supply Chain AI Rationalization', problem: 'You have 14 supply chain tools. 6 are redundant.', href: '/solutions/supply-chain-ai' },
                      { code: 'RT-02', name: 'Customer Intelligence', problem: 'Conversion at 2.3% while category peers are at 3.8%.', href: '/solutions/customer-intelligence' },
                    ],
                  },
                ].map(group => (
                  <div key={group.vertical}>
                    <div style={COL_HEAD}>{group.vertical}</div>
                    {group.items.map(s => (
                      <a key={s.code} href={s.href} style={{ display: 'block', padding: '9px 12px', borderRadius: '8px', textDecoration: 'none', marginBottom: '4px', borderLeft: '2px solid transparent', transition: 'all 0.12s ease', boxSizing: 'border-box' }}
                        onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(45,212,200,0.08)'; el.style.borderLeftColor = '#2DD4C8'; el.style.paddingLeft = '14px' }}
                        onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'transparent'; el.style.borderLeftColor = 'transparent'; el.style.paddingLeft = '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', fontWeight: 700, color: '#2DD4C8' }}>{s.code}</span>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: '#FFFFFF' }}>{s.name}</span>
                        </div>
                        <div style={{ fontSize: '11px', color: '#6B7280', lineHeight: 1.4 }}>{s.problem}</div>
                      </a>
                    ))}
                  </div>
                ))}
                <div style={{ gridColumn: '1 / -1', borderTop: '1px solid #21262D', paddingTop: '12px', marginTop: '4px' }}>
                  <a href="/solutions" style={{ fontSize: '12px', color: '#2DD4C8', textDecoration: 'none', fontWeight: 600 }}>See all solutions →</a>
                </div>
              </div>
            )}
          </div>

          {/* Clients ▾ */}
          <div style={{ position: 'relative', height: '64px', display: 'flex', alignItems: 'center' }}
            onMouseEnter={() => openDrop('clients')} onMouseLeave={startClose}>
            <div style={linkCss('clients')}>
              Clients
              <span style={{ fontSize: '10px', color: open === 'clients' ? '#2DD4C8' : '#94A3B8', marginLeft: '2px' }}>▾</span>
            </div>
            {open === 'clients' && (
              <div onMouseEnter={cancelClose} onMouseLeave={() => setOpen(null)}
                style={{ ...DROP_PANEL, position: 'absolute', top: '64px', left: 0, minWidth: '640px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                <div>
                  <div style={COL_HEAD}>By Industry</div>
                  {([
                    { label: 'Healthcare & Life Sciences', href: '/admin/client/meridian' },
                    { label: 'Financial Services', href: '/admin/client/firstcapital' },
                    { label: 'Retail & CPG', href: '/admin/client/apexretail' },
                    { label: 'Technology & Software', href: null },
                  ] as { label: string; href: string | null }[]).map((item, i) => (
                    item.href ? (
                      <a key={i} href={item.href} className="drop-simple">
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
                    { name: 'Meridian Health', sub: 'Healthcare · $11.2B', href: '/admin/client/meridian' },
                    { name: 'First Capital', sub: 'Financial Services · $18B Assets', href: '/admin/client/firstcapital' },
                    { name: 'Apex Retail', sub: 'Retail · $12.4B', href: '/admin/client/apexretail' },
                  ].map((c, i) => (
                    <div key={i} className="drop-card">
                      <div style={{ fontSize: '13px', color: '#FFFFFF', fontWeight: 600, marginBottom: '2px' }}>{c.name}</div>
                      <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '6px' }}>{c.sub}</div>
                      <a href={c.href} style={{ fontSize: '11px', color: '#2DD4C8', textDecoration: 'none', fontWeight: 600 }}>Open Demo →</a>
                    </div>
                  ))}
                </div>
                <div>
                  <div style={COL_HEAD}>Resources</div>
                  <div style={{ background: '#0D1117', border: '1px solid #21262D', borderRadius: '10px', padding: '16px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF', marginBottom: '6px', lineHeight: 1.4 }}>See AbarVa in action</div>
                    <div style={{ fontSize: '11px', color: '#6B7280', lineHeight: 1.5, marginBottom: '12px' }}>
                      Watch how AbarVa diagnoses a real enterprise in 4 minutes
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
              <span style={{ fontSize: '10px', color: open === 'deliverables' ? '#2DD4C8' : '#94A3B8', marginLeft: '2px' }}>▾</span>
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

          {/* Maestro */}
          <a href="/admin"
            style={{ display: 'flex', alignItems: 'center', padding: '0 14px', height: '64px', fontSize: '14px', fontWeight: 600, color: '#FFFFFF', textDecoration: 'none', borderBottom: '2px solid transparent', boxSizing: 'border-box' as const, transition: 'color 0.15s, border-color 0.25s', fontFamily: "'DM Sans', sans-serif" }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.color = '#2DD4C8'; el.style.borderBottomColor = '#2DD4C8'; el.style.textDecoration = 'underline' }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.color = '#FFFFFF'; el.style.borderBottomColor = 'transparent'; el.style.textDecoration = 'none' }}>
            Maestro
          </a>

          {/* Investor View */}
          <a href="/investor"
            style={{ display: 'flex', alignItems: 'center', padding: '0 14px', height: '64px', fontSize: '14px', fontWeight: 600, color: '#FFFFFF', textDecoration: 'none', borderBottom: '2px solid transparent', boxSizing: 'border-box' as const, transition: 'color 0.15s, border-color 0.25s' }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.color = '#2DD4C8'; el.style.borderBottomColor = '#2DD4C8' }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.color = '#FFFFFF'; el.style.borderBottomColor = 'transparent' }}>
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
              style={{ padding: '0 18px', height: '36px', display: 'flex', alignItems: 'center', borderRadius: '8px', background: 'transparent', color: '#FFFFFF', border: '1px solid #4B5563', fontSize: '13px', fontWeight: 500, textDecoration: 'none' }}
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
