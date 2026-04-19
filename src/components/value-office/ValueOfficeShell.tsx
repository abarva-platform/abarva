'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import AbarvaNav from '@/components/AbarvaNav'
import { VALUE_OFFICE_TOP_LEVEL_NAV } from '@/lib/value-office/navigation'
import { useClientContext } from '@/lib/use-client-context'
import { VALUE_OFFICE_COLORS } from './design'

const { shell: SHELL, line: LINE, teal: TEAL, muted: MUTED } = VALUE_OFFICE_COLORS

function isPathActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

function topLevelHrefForPath(pathname: string) {
  if (pathname.includes('/value-office/') && pathname.includes('/review')) return '/value-office/reviews'
  if (pathname.includes('/value-office/') && pathname.includes('/outcomes')) return '/value-office/execution'
  if (pathname.startsWith('/value-office/new')) return '/value-office/new'
  if (pathname.startsWith('/value-office/reviews')) return '/value-office/reviews'
  if (pathname.startsWith('/value-office/execution')) return '/value-office/execution'
  if (pathname.startsWith('/value-office/knowledge')) return '/value-office/knowledge'
  return '/value-office/portfolio'
}

export default function ValueOfficeShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { currentClient } = useClientContext()
  const activeTopLevelHref = topLevelHrefForPath(pathname)

  return (
    <div style={{ minHeight: '100vh', background: VALUE_OFFICE_COLORS.pageBg, color: VALUE_OFFICE_COLORS.ink, fontFamily: 'Georgia, serif' }}>
      <AbarvaNav activePage="value-office" />

      <div style={{ position: 'sticky', top: 72, zIndex: 40, backdropFilter: 'blur(14px)', background: 'rgba(249,244,236,0.94)', borderBottom: `1px solid ${LINE}` }}>
        <div style={{ maxWidth: 1520, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18, minHeight: 58, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontFamily: 'Courier New, monospace', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: TEAL }}>
                  AI Value Office
                </div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, color: VALUE_OFFICE_COLORS.ink }}>
                  {currentClient.shortName}
                </div>
              </div>
              <span style={{ width: 1, height: 28, background: LINE }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                {VALUE_OFFICE_TOP_LEVEL_NAV.map(item => {
                  const active = item.href === activeTopLevelHref || isPathActive(pathname, item.href)
                  return (
                    <Link
                      key={item.key}
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
                    </Link>
                  )
                })}
              </div>
            </div>
            <div style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.5 }}>
              The operating system for turning AI ideas into approved, measurable, evidence-backed initiatives.
            </div>
          </div>
        </div>
      </div>

      <main>{children}</main>
    </div>
  )
}
