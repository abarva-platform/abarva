'use client'

import Link from 'next/link'
import type { CSSProperties, ReactNode } from 'react'

export const CREAM = '#F8F7F4'
export const INK = '#0C0C0C'
export const BODY = '#3C3C3C'
export const MUTED = '#6B7280'
export const BORDER = '#E5E7EB'
export const TEAL = '#14B8A6'
export const DARK = '#060A12'
export const DARK_CARD = '#0D1520'
export const DARK_BODY = '#9CA3AF'
export const RED = '#EF4444'
export const AMBER = '#F59E0B'
export const GREEN = '#34D399'
export const SERIF = 'Georgia, serif'
export const SANS = 'DM Sans, sans-serif'
export const MONO = 'JetBrains Mono, monospace'

export function MarketingStyles() {
  return (
    <style jsx global>{`
      .marketing-shell {
        min-height: 100vh;
        background: ${CREAM};
        color: ${INK};
        font-family: ${SANS};
      }

      .marketing-container {
        width: min(1240px, calc(100vw - 48px));
        margin: 0 auto;
      }

      .marketing-header {
        position: sticky;
        top: 0;
        z-index: 40;
        background: rgba(248, 247, 244, 0.92);
        backdrop-filter: blur(14px);
        border-bottom: 1px solid rgba(12, 12, 12, 0.08);
      }

      .marketing-header__inner {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 24px;
        min-height: 72px;
      }

      .marketing-wordmark {
        display: inline-flex;
        align-items: baseline;
        gap: 0;
        text-decoration: none;
      }

      .marketing-wordmark__abar {
        font-family: ${SERIF};
        font-size: 28px;
        font-weight: 700;
        color: ${INK};
        line-height: 1;
      }

      .marketing-wordmark__va {
        font-family: ${SERIF};
        font-size: 34px;
        font-weight: 900;
        color: ${TEAL};
        line-height: 1;
      }

      .marketing-nav {
        display: flex;
        align-items: center;
        gap: 20px;
        flex-wrap: wrap;
      }

      .marketing-nav__link {
        font-size: 14px;
        font-weight: 600;
        color: ${BODY};
        text-decoration: none;
      }

      .marketing-nav__cta {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 44px;
        padding: 0 18px;
        border-radius: 999px;
        background: ${INK};
        color: white;
        text-decoration: none;
        font-size: 14px;
        font-weight: 700;
      }

      .marketing-section {
        padding: 80px 0;
      }

      .marketing-section--dark {
        background: ${DARK};
        color: white;
      }

      .marketing-grid-2 {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 28px;
      }

      .marketing-grid-3 {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 20px;
      }

      .marketing-grid-4 {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 18px;
      }

      .marketing-card {
        background: white;
        border: 1px solid ${BORDER};
        border-radius: 18px;
        padding: 24px;
      }

      .marketing-card--dark {
        background: ${DARK_CARD};
        border: 1px solid rgba(255, 255, 255, 0.1);
      }

      .marketing-eyebrow {
        margin-bottom: 16px;
        font-family: ${MONO};
        font-size: 11px;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: ${TEAL};
      }

      .marketing-title {
        margin: 0 0 16px;
        font-family: ${SERIF};
        font-size: clamp(34px, 5vw, 58px);
        line-height: 1.08;
        font-weight: 700;
      }

      .marketing-title--section {
        font-size: clamp(28px, 4vw, 44px);
      }

      .marketing-copy {
        margin: 0;
        font-size: 17px;
        line-height: 1.7;
        color: ${BODY};
      }

      .marketing-section--dark .marketing-copy {
        color: ${DARK_BODY};
      }

      .marketing-stat {
        font-family: ${SERIF};
        font-size: clamp(34px, 4vw, 54px);
        line-height: 1;
        font-weight: 700;
        color: ${INK};
      }

      .marketing-section--dark .marketing-stat {
        color: white;
      }

      .marketing-actions {
        display: flex;
        gap: 14px;
        flex-wrap: wrap;
      }

      .marketing-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 48px;
        padding: 0 24px;
        border-radius: 999px;
        text-decoration: none;
        font-size: 15px;
        font-weight: 700;
      }

      .marketing-button--primary {
        background: ${INK};
        color: white;
      }

      .marketing-button--secondary {
        background: transparent;
        color: ${INK};
        border: 1.5px solid rgba(12, 12, 12, 0.16);
      }

      .marketing-section--dark .marketing-button--secondary {
        color: white;
        border-color: rgba(255, 255, 255, 0.18);
      }

      .marketing-table {
        width: 100%;
        border-collapse: collapse;
      }

      .marketing-table th,
      .marketing-table td {
        padding: 14px 12px;
        text-align: left;
        vertical-align: top;
        border-bottom: 1px solid rgba(12, 12, 12, 0.08);
        font-size: 14px;
        line-height: 1.55;
      }

      .marketing-section--dark .marketing-table th,
      .marketing-section--dark .marketing-table td {
        border-bottom-color: rgba(255, 255, 255, 0.1);
      }

      .marketing-table th {
        font-family: ${MONO};
        font-size: 11px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: ${MUTED};
      }

      .marketing-section--dark .marketing-table th {
        color: rgba(255, 255, 255, 0.58);
      }

      .marketing-diagram {
        width: 100%;
        height: auto;
        border-radius: 18px;
        border: 1px solid rgba(12, 12, 12, 0.08);
        display: block;
      }

      .marketing-section--dark .marketing-diagram {
        border-color: rgba(255, 255, 255, 0.1);
      }

      .marketing-footer {
        padding: 32px 0 56px;
      }

      .marketing-footer__meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
        flex-wrap: wrap;
        padding-top: 24px;
        border-top: 1px solid rgba(12, 12, 12, 0.08);
      }

      .marketing-section--dark .marketing-footer__meta {
        border-top-color: rgba(255, 255, 255, 0.1);
      }

      @media (max-width: 980px) {
        .marketing-grid-4 {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .marketing-grid-3,
        .marketing-grid-2 {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 760px) {
        .marketing-container {
          width: min(100vw - 28px, 1240px);
        }

        .marketing-header__inner {
          min-height: 64px;
          padding: 8px 0;
        }

        .marketing-nav {
          gap: 12px;
        }

        .marketing-nav__link {
          font-size: 13px;
        }

        .marketing-grid-4 {
          grid-template-columns: 1fr;
        }

        .marketing-section {
          padding: 64px 0;
        }
      }
    `}</style>
  )
}

export function MarketingHeader({
  ctaHref = '/sign-in',
  ctaLabel = 'Request demo',
}: {
  ctaHref?: string
  ctaLabel?: string
}) {
  const navItems = [
    { href: '/#products', label: 'Product' },
    { href: '/#architecture', label: 'Architecture' },
    { href: '/#customers', label: 'Customers' },
    { href: 'mailto:partners@abarva.ai?subject=AbarVa%20careers', label: 'Careers' },
  ]

  return (
    <header className="marketing-header">
      <div className="marketing-container marketing-header__inner">
        <Link href="/" className="marketing-wordmark" aria-label="AbarVa home">
          <span className="marketing-wordmark__abar">Abar</span>
          <span className="marketing-wordmark__va">Va</span>
        </Link>
        <nav className="marketing-nav" aria-label="Primary">
          {navItems.map((item) => (
            item.href.startsWith('mailto:') ? (
              <a key={item.label} href={item.href} className="marketing-nav__link">
                {item.label}
              </a>
            ) : (
              <Link key={item.label} href={item.href} className="marketing-nav__link">
                {item.label}
              </Link>
            )
          ))}
          {ctaHref.startsWith('mailto:') ? (
            <a href={ctaHref} className="marketing-nav__cta">
              {ctaLabel}
            </a>
          ) : (
            <Link href={ctaHref} className="marketing-nav__cta">
              {ctaLabel}
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}

export function Eyebrow({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div className="marketing-eyebrow" style={style}>
      {children}
    </div>
  )
}

export function Title({
  children,
  section = false,
  style,
}: {
  children: ReactNode
  section?: boolean
  style?: CSSProperties
}) {
  return (
    <h1 className={`marketing-title${section ? ' marketing-title--section' : ''}`} style={style}>
      {children}
    </h1>
  )
}

export function Copy({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <p className="marketing-copy" style={style}>
      {children}
    </p>
  )
}
