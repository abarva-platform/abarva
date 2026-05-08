'use client'
import React from 'react'

const TEAL = '#14B8A6'
const SERIF = 'Fraunces, Georgia, serif'

function Word({ kind, color }: { kind: 'AbarNexus' | 'AbarVa'; color?: string }) {
  const second = kind === 'AbarNexus' ? 'Nexus' : 'Va'
  return (
    <span style={{ fontFamily: SERIF, whiteSpace: 'nowrap' }}>
      <span style={{ color: color ?? 'inherit' }}>Abar</span>
      <span style={{ color: TEAL, fontWeight: 700 }}>{second}</span>
    </span>
  )
}

export function BrandedText({ children, color }: { children: string; color?: string }) {
  if (typeof children !== 'string') return <>{children}</>
  const re = /(AbarNexus|AbarVa)/g
  const parts: React.ReactNode[] = []
  let last = 0
  let key = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(children)) !== null) {
    if (m.index > last) parts.push(<React.Fragment key={key++}>{children.slice(last, m.index)}</React.Fragment>)
    parts.push(<Word key={key++} kind={m[0] as 'AbarNexus' | 'AbarVa'} color={color} />)
    last = m.index + m[0].length
  }
  if (last < children.length) parts.push(<React.Fragment key={key++}>{children.slice(last)}</React.Fragment>)
  return <>{parts}</>
}

// Standalone wordmark sized to mirror AbarVa hero lockup — use in headers/brand lockups
export function AbarNexusWordmark({ size = 18, color = '#FAFAF7' }: { size?: number; color?: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', lineHeight: 1, fontFamily: SERIF }}>
      <span style={{ fontSize: size, fontWeight: 700, color }}>Abar</span>
      <span style={{ fontSize: Math.round(size * 1.22), fontWeight: 900, color: TEAL, letterSpacing: '.01em' }}>Nexus</span>
    </span>
  )
}
