'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { useClientContext } from '@/lib/use-client-context'

const BG = '#F4EFE6'
const PANEL = '#FFFCF6'
const INK = '#171411'
const MUTED = '#6E655C'
const LINE = '#DDCFBD'
const TEAL = '#127C72'
const SHELL = '#F9F4EC'

function isPathActive(pathname: string, href: string) {
  if (href === '/value-office') {
    return pathname === '/value-office'
  }
  return pathname === href || pathname.startsWith(`${href}/`)
}

export default function ValueOfficeShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { currentClient } = useClientContext()

  const navItems = [
    { label: 'Portfolio', href: '/value-office' },
    { label: 'Execution', href: '/value-office/tracker' },
  ]

  const contextLabel = pathname.includes('/review')
    ? 'CXO review'
    : pathname.match(/\/value-office\/[^/]+$/)
      ? 'Use case workspace'
      : pathname.includes('/tracker')
        ? 'Build tracker'
        : 'Portfolio workspace'

  return (
    <div style={{ minHeight: '100vh', background: BG, color: INK, fontFamily: 'Georgia, serif' }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 60, backdropFilter: 'blur(16px)', background: 'rgba(244,239,230,0.92)', borderBottom: `1px solid ${LINE}` }}>
        <div style={{ maxWidth: 1760, margin: '0 auto', padding: '14px 24px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <a href="/value-office" style={{ textDecoration: 'none', color: INK }}>
                <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: TEAL, marginBottom: 4 }}>
                  AbarVa Product
                </div>
                <div style={{ fontSize: 28, lineHeight: 1.05 }}>AI Value Office</div>
              </a>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ padding: '6px 10px', borderRadius: 999, border: `1px solid ${LINE}`, background: PANEL, fontFamily: 'Courier New, monospace', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: MUTED }}>
                  {currentClient.shortName}
                </span>
                <span style={{ padding: '6px 10px', borderRadius: 999, border: `1px solid ${LINE}`, background: PANEL, fontFamily: 'Courier New, monospace', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: MUTED }}>
                  {currentClient.vertical}
                </span>
                <span style={{ padding: '6px 10px', borderRadius: 999, background: '#EFFAF7', color: TEAL, fontFamily: 'Courier New, monospace', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  {contextLabel}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <a href="/" style={{ textDecoration: 'none', color: MUTED, fontFamily: 'DM Sans, sans-serif', fontWeight: 700 }}>
                Nexus
              </a>
              <a
                href="/value-office/tracker"
                style={{
                  textDecoration: 'none',
                  padding: '10px 14px',
                  borderRadius: 999,
                  background: '#171411',
                  color: '#F6F1E8',
                  fontFamily: 'DM Sans, sans-serif',
                  fontWeight: 700,
                }}
              >
                Build tracker
              </a>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {navItems.map(item => {
              const active = isPathActive(pathname, item.href)
              return (
                <a
                  key={item.href}
                  href={item.href}
                  style={{
                    textDecoration: 'none',
                    padding: '8px 12px',
                    borderRadius: 999,
                    border: `1px solid ${active ? 'rgba(18,124,114,0.18)' : LINE}`,
                    background: active ? '#EFFAF7' : SHELL,
                    color: active ? TEAL : MUTED,
                    fontFamily: 'DM Sans, sans-serif',
                    fontWeight: 700,
                  }}
                >
                  {item.label}
                </a>
              )
            })}
          </div>
        </div>
      </header>

      <main>{children}</main>
    </div>
  )
}
