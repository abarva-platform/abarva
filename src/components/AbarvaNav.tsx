'use client'
import { useState } from 'react'

const TEAL = '#2DD4C8'
const BORDER = '#1C2D45'
const CARD = '#0D1520'
const TEXT = '#EFF6FF'
const MUTED = '#94A3B8'
const PAGE_BG = '#060A12'

interface NavProps {
  clientId?: string
  activePage?: string
  onClientChange?: (id: string) => void
}

const CLIENTS = [
  { id: 'meridian',     name: 'Meridian Health System',   sub: 'Healthcare · $11.2B',          color: TEAL,      dot: TEAL },
  { id: 'firstcapital', name: 'First Capital Financial',  sub: 'Financial Services · $18B AUM', color: '#6366F1', dot: '#6366F1' },
  { id: 'apexretail',   name: 'Apex Retail Group',        sub: 'Retail · $12.4B',              color: '#F59E0B', dot: '#F59E0B' },
]

const PRODUCTS = [
  { name: 'Situation',      desc: "What's actually broken — and what is it costing?", path: '/diagnose' },
  { name: 'Strategy',       desc: 'Where should we place our AI bets?',               path: '/ai-strategy' },
  { name: 'Vendor',         desc: 'Which vendor wins in our situation?',              path: '/select' },
  { name: 'Business Case',  desc: 'How do we justify this to the board?',            path: '/justify' },
  { name: 'Outcomes',       desc: 'Did it work — and can we prove it?',              path: '/outcomes' },
]

const SOLUTIONS = [
  { name: 'AI-Powered PDLC',                    desc: 'Build products faster with AI agents',        path: '/solutions/pdlc' },
  { name: 'AI-Powered Transformation Delivery', desc: 'Replace large consulting teams with Maestros', path: '/solutions/delivery' },
  { name: 'Margin Optimization',                desc: 'Recover margin across revenue, cost and AI',   path: '/solutions/margin' },
]

export default function AbarvaNav({ clientId = 'meridian', activePage = '', onClientChange }: NavProps) {
  const [open, setOpen] = useState<string | null>(null)
  const [clientOpen, setClientOpen] = useState(false)
  let closeTimer: ReturnType<typeof setTimeout>

  const openDrop = (name: string) => { clearTimeout(closeTimer); setOpen(name) }
  const startClose = () => { closeTimer = setTimeout(() => setOpen(null), 180) }

  const activeClient = CLIENTS.find(c => c.id === clientId) || CLIENTS[0]

  return (
    <nav style={{ background: CARD, borderBottom: `1px solid ${BORDER}`, position: 'sticky', top: 0, zIndex: 200 }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 28px', display: 'flex', alignItems: 'center', height: '64px' }}>

        {/* Wordmark — always navigates home */}
        <a href="/" style={{ display: 'flex', flexDirection: 'column', textDecoration: 'none', marginRight: '28px', lineHeight: 1, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline' }}>
            <span style={{ fontFamily: 'Georgia,serif', fontSize: '17px', fontWeight: 800, color: TEXT }}>Abar</span>
            <span style={{ fontFamily: 'Georgia,serif', fontSize: '23px', fontWeight: 900, color: TEAL }}>Va</span>
          </div>
          <span style={{ fontFamily: 'monospace', fontSize: '9px', color: TEXT, letterSpacing: '.06em', marginTop: '1px' }}>
            Intelligence. Now act on it.
          </span>
        </a>

        {/* Intelligence ▾ */}
        <DropMenu label="Intelligence" id="intelligence" open={open} openDrop={openDrop} startClose={startClose}>
          <DropSection label="Five products">
            {PRODUCTS.map(p => (
              <DropItem key={p.name} name={p.name} desc={p.desc} href={`${p.path}?client=${clientId}`} />
            ))}
          </DropSection>
        </DropMenu>

        {/* Solutions ▾ */}
        <DropMenu label="Solutions" id="solutions" open={open} openDrop={openDrop} startClose={startClose}>
          <DropSection label="Three solutions">
            {SOLUTIONS.map(s => (
              <DropItem key={s.name} name={s.name} desc={s.desc} href={s.path} />
            ))}
          </DropSection>
        </DropMenu>

        {/* Clients ▾ */}
        <DropMenu label="Clients" id="clients" open={open} openDrop={openDrop} startClose={startClose}>
          <DropSection label="Demo clients">
            {CLIENTS.map(c => (
              <ClientDropItem
                key={c.id}
                client={c}
                active={c.id === clientId}
                onSelect={onClientChange ? (id) => { onClientChange(id); setOpen(null) } : undefined}
              />
            ))}
          </DropSection>
          <div style={{ borderTop: `1px solid ${BORDER}`, margin: '6px 0', padding: '8px 12px 4px' }}>
            <a href="/admin" style={{ fontSize: '12px', color: TEAL, textDecoration: 'none', fontFamily: 'monospace', letterSpacing: '.04em' }}>
              Open Maestro portal →
            </a>
          </div>
        </DropMenu>

        {/* Right side */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>

          {/* Active client pill — shows which client is loaded */}
          {onClientChange && (
            <div style={{ position: 'relative', marginRight: '8px' }}>
              <button
                onClick={() => setClientOpen(o => !o)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '7px',
                  background: 'rgba(45,212,200,0.08)', border: `1px solid rgba(45,212,200,0.2)`,
                  borderRadius: '20px', padding: '5px 12px 5px 8px',
                  cursor: 'pointer', color: TEAL, fontSize: '12px', fontWeight: 500,
                }}
              >
                <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: activeClient.dot, flexShrink: 0 }} />
                {activeClient.name.split(' ')[0]} {activeClient.name.split(' ')[1]}
                <span style={{ fontSize: '9px', color: MUTED }}>▾</span>
              </button>
              {clientOpen && (
                <div style={{
                  position: 'absolute', top: '100%', right: 0, marginTop: '6px',
                  background: PAGE_BG, border: `1px solid ${BORDER}`, borderRadius: '10px',
                  padding: '6px', zIndex: 300, minWidth: '220px',
                  boxShadow: '0 8px 24px rgba(0,0,0,.5)',
                }}>
                  {CLIENTS.map(c => (
                    <button
                      key={c.id}
                      onClick={() => { onClientChange(c.id); setClientOpen(false) }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
                        padding: '9px 12px', borderRadius: '7px', border: 'none', cursor: 'pointer',
                        background: c.id === clientId ? 'rgba(45,212,200,0.08)' : 'transparent',
                        textAlign: 'left',
                      }}
                    >
                      <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: c.dot, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 500, color: TEXT }}>{c.name}</div>
                        <div style={{ fontSize: '11px', color: MUTED }}>{c.sub}</div>
                      </div>
                      {c.id === clientId && <span style={{ marginLeft: 'auto', color: TEAL, fontSize: '12px' }}>✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Investor View */}
          <a href="/investor" style={{
            fontSize: '13px', fontWeight: 500, color: activePage === 'investor' ? TEAL : TEXT,
            textDecoration: 'none', padding: '0 14px', height: '64px',
            display: 'flex', alignItems: 'center',
            borderBottom: activePage === 'investor' ? `2px solid ${TEAL}` : '2px solid transparent',
          }}>
            Investor View
          </a>

          {/* Maestro CTA */}
          <a href="/admin" style={{
            background: TEAL, color: '#060A12',
            fontSize: '13px', fontWeight: 600, textDecoration: 'none',
            padding: '8px 18px', borderRadius: '8px', flexShrink: 0,
          }}>
            Maestro
          </a>
        </div>
      </div>
    </nav>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────────

function DropMenu({ label, id, open, openDrop, startClose, children }: {
  label: string; id: string; open: string | null
  openDrop: (id: string) => void; startClose: () => void; children: React.ReactNode
}) {
  const isOpen = open === id
  return (
    <div
      style={{ position: 'relative', height: '64px', display: 'flex', alignItems: 'center' }}
      onMouseEnter={() => openDrop(id)}
      onMouseLeave={startClose}
    >
      <div style={{
        display: 'flex', alignItems: 'center', gap: '3px', padding: '0 14px',
        fontSize: '14px', fontWeight: 500, color: isOpen ? TEAL : TEXT,
        cursor: 'pointer', height: '64px', userSelect: 'none',
        borderBottom: isOpen ? `2px solid ${TEAL}` : '2px solid transparent',
        transition: 'color .12s, border-color .12s',
      }}>
        {label}
        <span style={{ fontSize: '9px', color: isOpen ? TEAL : MUTED, marginTop: '1px' }}>▾</span>
      </div>
      {isOpen && (
        <div
          onMouseEnter={() => clearTimeout(undefined)}
          onMouseLeave={startClose}
          style={{
            position: 'absolute', top: '64px', left: 0, minWidth: '260px',
            background: PAGE_BG, border: `1px solid ${BORDER}`, borderRadius: '12px',
            padding: '8px', zIndex: 200, boxShadow: '0 12px 40px rgba(0,0,0,.5)',
          }}
        >
          {children}
        </div>
      )}
    </div>
  )
}

function DropSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontFamily: 'monospace', fontSize: '9px', color: MUTED, letterSpacing: '.1em', textTransform: 'uppercase', padding: '6px 12px 4px' }}>
        {label}
      </div>
      {children}
    </div>
  )
}

function DropItem({ name, desc, href, tag }: { name: string; desc: string; href: string; tag?: string }) {
  return (
    <a
      href={href}
      style={{ display: 'block', padding: '9px 12px', borderRadius: '8px', textDecoration: 'none', marginBottom: '1px' }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(45,212,200,0.06)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
        <span style={{ fontSize: '13px', fontWeight: 500, color: TEXT }}>{name}</span>
        {tag && (
          <span style={{ fontFamily: 'monospace', fontSize: '9px', color: MUTED, background: '#1C2D45', padding: '2px 7px', borderRadius: '4px', letterSpacing: '.04em' }}>
            {tag}
          </span>
        )}
      </div>
      <div style={{ fontSize: '11px', color: MUTED, lineHeight: 1.4 }}>{desc}</div>
    </a>
  )
}

function ClientDropItem({ client, active, onSelect }: {
  client: typeof CLIENTS[0]; active: boolean; onSelect?: (id: string) => void
}) {
  const content = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}>
      <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: client.dot, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '13px', fontWeight: 500, color: TEXT }}>{client.name}</div>
        <div style={{ fontSize: '11px', color: MUTED }}>{client.sub}</div>
      </div>
      {active && <span style={{ fontSize: '11px', color: TEAL }}>✓</span>}
    </div>
  )

  if (onSelect) {
    return (
      <button
        onClick={() => onSelect(client.id)}
        style={{ display: 'flex', width: '100%', padding: '9px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: active ? 'rgba(45,212,200,0.06)' : 'transparent', textAlign: 'left', marginBottom: '1px' }}
        onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(45,212,200,0.06)' }}
        onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
      >
        {content}
      </button>
    )
  }

  return (
    <a
      href={`/admin/client/${client.id}`}
      style={{ display: 'flex', padding: '9px 12px', borderRadius: '8px', textDecoration: 'none', marginBottom: '1px' }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(45,212,200,0.06)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
    >
      {content}
    </a>
  )
}
