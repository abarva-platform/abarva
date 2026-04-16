'use client'
import React from 'react'

// ── AbarVa module header — shared across all 9 AVR modules ───────────────────
// Same tokens as AbarvaNav / SolutionLayout
const CARD   = '#0D1520'
const BORDER = '#1C2D45'
const TEAL   = '#2DD4C8'
const WHITE  = '#EFF6FF'
const MUTED  = 'rgba(255,255,255,0.55)'
const MONO   = 'JetBrains Mono, monospace'
const SANS   = 'DM Sans, sans-serif'
const SERIF  = 'Georgia, serif'

export interface ModuleStat {
  value: string
  label: string
  dot?: string   // optional colored dot (teal, red, amber, etc.)
}

export interface ModuleTab {
  id: string
  label: string
  active: boolean
  onClick: () => void
}

interface ModuleHeaderProps {
  /** Mono label in top-left, e.g. "Data Intelligence · Meridian" */
  label: string
  /** Serif question rendered as h1 */
  question: string
  /** Stat numbers shown below the question */
  stats: ModuleStat[]
  /** Optional tab row at the bottom of the header */
  tabs?: ModuleTab[]
  /** Optional node rendered top-right (role selector, client picker, etc.) */
  right?: React.ReactNode
  /** Max content width, defaults to 1400 */
  maxWidth?: number
  /** Inner padding, defaults to '20px 48px 0' */
  padding?: string
}

export default function ModuleHeader({
  label, question, stats, tabs, right,
  maxWidth = 1400,
  padding = '20px 48px 0',
}: ModuleHeaderProps) {
  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 40,
      background: CARD, borderBottom: `1px solid ${BORDER}`,
    }}>
      <div style={{ maxWidth, margin: '0 auto', padding }}>

        {/* Row 1: mono label + optional right slot */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{
            fontFamily: MONO, fontSize: '9px', color: TEAL,
            letterSpacing: '.14em', textTransform: 'uppercase' as const,
          }}>
            {label}
          </div>
          {right}
        </div>

        {/* Row 2: serif question */}
        <h1 style={{
          fontFamily: SERIF, fontSize: '24px', fontWeight: 700,
          color: WHITE, margin: '0 0 14px', lineHeight: 1.3, maxWidth: '680px',
        }}>
          &ldquo;{question}&rdquo;
        </h1>

        {/* Row 3: stat numbers */}
        <div style={{ display: 'flex', gap: '40px', paddingBottom: tabs ? '0' : '14px', flexWrap: 'wrap' as const }}>
          {stats.map((s, i) => (
            <div key={i}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {s.dot && (
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
                )}
                <div style={{ fontFamily: MONO, fontSize: '20px', fontWeight: 700, color: WHITE }}>
                  {s.value}
                </div>
              </div>
              <div style={{
                fontFamily: MONO, fontSize: '8px', color: MUTED,
                marginTop: '2px', textTransform: 'uppercase' as const, letterSpacing: '.08em',
              }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Row 4 (optional): tab nav */}
        {tabs && (
          <div style={{ display: 'flex', marginTop: '10px', borderTop: `1px solid ${BORDER}` }}>
            {tabs.map(t => (
              <button key={t.id} onClick={t.onClick} style={{
                padding: '10px 24px', fontSize: '12px', fontFamily: MONO,
                fontWeight: t.active ? 600 : 400, letterSpacing: '.06em',
                textTransform: 'uppercase' as const,
                color: t.active ? WHITE : MUTED,
                background: 'none', border: 'none', cursor: 'pointer',
                borderBottom: t.active ? `2px solid ${TEAL}` : '2px solid transparent',
                whiteSpace: 'nowrap' as const, transition: 'color 0.12s',
              }}>
                {t.label}
              </button>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
