/**
 * ABARVA PAGE SHELL
 * Every page wraps its content in this.
 * Ensures: consistent background, fonts, nav, quick-links bar.
 *
 * Usage:
 *   <PageShell activePage="diagnose" clientId={activeClient}>
 *     {content}
 *   </PageShell>
 */
'use client'
import { useState } from 'react'
import AbarvaNav from './AbarvaNav'

const BG    = '#060A12'
const CARD  = '#0D1520'
const EDGE  = '#1C2D45'
const TEAL  = '#2DD4C8'
const WHITE = '#EFF6FF'
const MUTED = '#94A3B8'
const MONO  = '"JetBrains Mono", monospace'
const SANS  = '"DM Sans", sans-serif'

interface PageShellProps {
  children: React.ReactNode
  activePage?: string
  clientId?: string
  /** Show the sticky quick-links bar at the bottom */
  showQuickLinks?: boolean
}

export default function PageShell({
  children,
  activePage = '',
  clientId = 'meridian',
  showQuickLinks = true,
}: PageShellProps) {
  const [qlOpen, setQlOpen] = useState(false)

  const clientLabel =
    clientId === 'firstcapital' ? 'First Capital' :
    clientId === 'apexretail'   ? 'Apex Retail' :
                                  'Meridian Health'

  return (
    <div style={{
      background:  BG,
      minHeight:   '100vh',
      fontFamily:  SANS,
      color:       WHITE,
    }}>
      {/* NAV */}
      <AbarvaNav clientId={clientId} activePage={activePage} />

      {/* PAGE CONTENT */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 28px' }}>
        {children}
      </div>

      {/* QUICK-LINKS BAR — sticky bottom */}
      {showQuickLinks && (
        <div style={{
          position:   'sticky',
          bottom:     0,
          background: CARD,
          borderTop:  `1px solid ${EDGE}`,
          padding:    '8px 28px',
          display:    'flex',
          alignItems: 'center',
          gap:        '6px',
          zIndex:     90,
          maxWidth:   '100%',
        }}>
          {/* Home */}
          <a href="/" style={qlBtn(activePage === 'home')}>
            ← Home
          </a>

          <div style={{ width: '1px', height: '20px', background: EDGE, flexShrink: 0 }} />

          {/* Products */}
          <span style={qlLabel}>Products:</span>
          {[
            { label: 'Situation',      href: `/diagnose?client=${clientId}`,     id: 'diagnose'    },
            { label: 'Strategy',       href: `/ai-strategy?client=${clientId}`,  id: 'ai-strategy' },
            { label: 'Vendor',         href: `/select?client=${clientId}`,       id: 'select'      },
            { label: 'Business Case',  href: `/justify?client=${clientId}`,      id: 'justify'     },
            { label: 'Outcomes',       href: `/outcomes?client=${clientId}`,     id: 'outcomes'    },
          ].map(p => (
            <a key={p.id} href={p.href} style={qlBtn(activePage === p.id)}>{p.label}</a>
          ))}

          <div style={{ width: '1px', height: '20px', background: EDGE, flexShrink: 0 }} />

          {/* Maestro */}
          <a href="/admin" style={qlBtn(activePage === 'admin', TEAL)}>
            Maestro
          </a>

          {/* Current client indicator */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontFamily: MONO, fontSize: '9px', color: '#374151', letterSpacing: '.06em', textTransform: 'uppercase' }}>Client:</span>
            <span style={{ fontFamily: MONO, fontSize: '10px', color: TEAL, fontWeight: 600 }}>{clientLabel}</span>
          </div>
        </div>
      )}
    </div>
  )
}

const qlBtn = (active: boolean, activeColor = TEAL): React.CSSProperties => ({
  fontFamily:     MONO,
  fontSize:       '10px',
  letterSpacing:  '.05em',
  textTransform:  'uppercase' as const,
  padding:        '5px 12px',
  borderRadius:   '5px',
  textDecoration: 'none',
  cursor:         'pointer',
  border:         'none',
  background:     active ? activeColor               : 'transparent',
  color:          active ? (activeColor === TEAL ? '#060A12' : WHITE) : MUTED,
  whiteSpace:     'nowrap' as const,
  flexShrink:     0,
})

const qlLabel: React.CSSProperties = {
  fontFamily:    MONO,
  fontSize:      '9px',
  color:         '#374151',
  letterSpacing: '.08em',
  textTransform: 'uppercase',
  whiteSpace:    'nowrap',
  flexShrink:    0,
}
