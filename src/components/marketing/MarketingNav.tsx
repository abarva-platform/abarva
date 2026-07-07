'use client'

/**
 * MarketingNav — public-site navigation.
 *
 * Launch default is intentionally narrow: one Request access CTA.
 * Grouped menus can be opted in later when Product/About/Contact are ready.
 *
 * Used by both the shared `MarketingHeader` (site.tsx) and the
 * `LoggedOutLandingPage` so the public nav is consistent everywhere.
 *
 * Accessibility: dropdowns open on hover (desktop) AND click/keyboard
 * (touch + a11y). Triggers expose `aria-expanded` / `aria-haspopup`,
 * menus use `role="menu"` / `role="menuitem"`, Escape closes, arrow keys
 * move focus, and an outside click closes any open menu.
 */

import Link from 'next/link'
import { useCallback, useEffect, useId, useRef, useState } from 'react'

export type MarketingNavLink = {
  label: string
  href: string
}

export type MarketingNavGroup = {
  label: string
  links: MarketingNavLink[]
}

export const MARKETING_NAV_GROUPS: MarketingNavGroup[] = []

function isMailto(href: string) {
  return href.startsWith('mailto:')
}

function NavLinkItem({
  link,
  className,
  role,
  onClick,
  innerRef,
}: {
  link: MarketingNavLink
  className?: string
  role?: string
  onClick?: () => void
  innerRef?: (el: HTMLElement | null) => void
}) {
  if (isMailto(link.href)) {
    return (
      <a
        href={link.href}
        className={className}
        role={role}
        onClick={onClick}
        ref={innerRef as React.Ref<HTMLAnchorElement>}
      >
        {link.label}
      </a>
    )
  }
  return (
    <Link
      href={link.href}
      prefetch={false}
      className={className}
      role={role}
      onClick={onClick}
      ref={innerRef as React.Ref<HTMLAnchorElement>}
    >
      {link.label}
    </Link>
  )
}

function Dropdown({ group }: { group: MarketingNavGroup }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const itemRefs = useRef<(HTMLElement | null)[]>([])
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const menuId = useId()

  const clearCloseTimer = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }, [])

  const close = useCallback((returnFocus = false) => {
    clearCloseTimer()
    setOpen(false)
    if (returnFocus) triggerRef.current?.focus()
  }, [clearCloseTimer])

  // Outside click closes the menu.
  useEffect(() => {
    if (!open) return
    function onPointerDown(event: PointerEvent) {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  useEffect(() => clearCloseTimer, [clearCloseTimer])

  function focusItem(index: number) {
    const items = itemRefs.current.filter(Boolean)
    if (items.length === 0) return
    const next = (index + items.length) % items.length
    items[next]?.focus()
  }

  function onTriggerKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setOpen(true)
      requestAnimationFrame(() => focusItem(0))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setOpen(true)
      requestAnimationFrame(() => focusItem(-1))
    } else if (event.key === 'Escape') {
      close()
    }
  }

  function onMenuKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const items = itemRefs.current.filter(Boolean)
    const currentIndex = items.indexOf(document.activeElement as HTMLElement)
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      focusItem(currentIndex + 1)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      focusItem(currentIndex - 1)
    } else if (event.key === 'Home') {
      event.preventDefault()
      focusItem(0)
    } else if (event.key === 'End') {
      event.preventDefault()
      focusItem(-1)
    } else if (event.key === 'Escape' || event.key === 'Tab') {
      close(event.key === 'Escape')
    }
  }

  return (
    <div
      ref={wrapRef}
      className="mkt-nav__group"
      onMouseEnter={() => {
        clearCloseTimer()
        setOpen(true)
      }}
      onMouseLeave={() => {
        clearCloseTimer()
        closeTimer.current = setTimeout(() => setOpen(false), 120)
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        className="mkt-nav__trigger"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={onTriggerKeyDown}
      >
        {group.label}
        <span className="mkt-nav__caret" aria-hidden="true">
          ▾
        </span>
      </button>
      <div
        id={menuId}
        role="menu"
        aria-label={group.label}
        className={`mkt-nav__menu${open ? ' mkt-nav__menu--open' : ''}`}
        onKeyDown={onMenuKeyDown}
      >
        {group.links.map((link, index) => (
          <NavLinkItem
            key={link.label}
            link={link}
            role="menuitem"
            className="mkt-nav__menu-link"
            onClick={() => close()}
            innerRef={(el) => {
              itemRefs.current[index] = el
            }}
          />
        ))}
      </div>
    </div>
  )
}

function MobileSection({ group }: { group: MarketingNavGroup }) {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  return (
    <div className="mkt-nav__m-section">
      <button
        type="button"
        className="mkt-nav__m-toggle"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        {group.label}
        <span className="mkt-nav__caret" aria-hidden="true">
          {open ? '−' : '+'}
        </span>
      </button>
      <div
        id={panelId}
        className={`mkt-nav__m-panel${open ? ' mkt-nav__m-panel--open' : ''}`}
      >
        {group.links.map((link) => (
          <NavLinkItem key={link.label} link={link} className="mkt-nav__m-link" />
        ))}
      </div>
    </div>
  )
}

export type MarketingNavProps = {
  /** Optional override for the CTA target. */
  ctaHref?: string
  ctaLabel?: string
  showMenuItems?: boolean
}

export function MarketingNav({
  ctaHref = '/',
  ctaLabel = 'Request access',
  showMenuItems = false,
}: MarketingNavProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const mobileId = useId()

  // Close the mobile drawer with Escape.
  useEffect(() => {
    if (!mobileOpen) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setMobileOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [mobileOpen])

  return (
    <div className="mkt-nav">
      <MarketingNavStyles />
      <nav className="mkt-nav__bar" aria-label="Primary">
        {showMenuItems && (
          <div className="mkt-nav__groups">
            {MARKETING_NAV_GROUPS.map((group) => (
              <Dropdown key={group.label} group={group} />
            ))}
          </div>
        )}
        <div className="mkt-nav__actions">
          {isMailto(ctaHref) ? (
            <a href={ctaHref} className="mkt-nav__cta">
              {ctaLabel}
            </a>
          ) : (
            <Link href={ctaHref} className="mkt-nav__cta">
              {ctaLabel}
            </Link>
          )}
        </div>
        {showMenuItems && (
          <button
            type="button"
            className="mkt-nav__hamburger"
            aria-expanded={mobileOpen}
            aria-controls={mobileId}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMobileOpen((value) => !value)}
          >
            <span className="mkt-nav__hamburger-bar" aria-hidden="true" />
            <span className="mkt-nav__hamburger-bar" aria-hidden="true" />
            <span className="mkt-nav__hamburger-bar" aria-hidden="true" />
          </button>
        )}
      </nav>
      {showMenuItems && (
        <div
          id={mobileId}
          className={`mkt-nav__mobile${mobileOpen ? ' mkt-nav__mobile--open' : ''}`}
        >
          {MARKETING_NAV_GROUPS.map((group) => (
            <MobileSection key={group.label} group={group} />
          ))}
          <div className="mkt-nav__m-actions">
            {isMailto(ctaHref) ? (
              <a href={ctaHref} className="mkt-nav__m-cta">
                {ctaLabel}
              </a>
            ) : (
              <Link
                href={ctaHref}
                className="mkt-nav__m-cta"
                onClick={() => setMobileOpen(false)}
              >
                {ctaLabel}
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function MarketingNavStyles() {
  return (
    <style jsx global>{`
      .mkt-nav {
        display: flex;
        flex: 1;
        min-width: 0;
        flex-direction: column;
        font-family: 'DM Sans', sans-serif;
      }

      .mkt-nav__bar {
        display: flex;
        align-items: center;
        gap: 28px;
      }

      .mkt-nav__groups {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .mkt-nav__actions {
        display: flex;
        align-items: center;
        gap: 14px;
        margin-left: auto;
      }

      .mkt-nav__group {
        position: relative;
      }

      .mkt-nav__trigger {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 8px 12px;
        border: 0;
        background: transparent;
        font: inherit;
        font-size: 14px;
        font-weight: 600;
        color: #3c3c3c;
        cursor: pointer;
        border-radius: 8px;
      }

      .mkt-nav__top-link {
        display: inline-flex;
        align-items: center;
        min-height: 38px;
        padding: 8px 12px;
        border-radius: 8px;
        color: #3c3c3c;
        font-size: 14px;
        font-weight: 650;
        text-decoration: none;
      }

      .mkt-nav__top-link:hover,
      .mkt-nav__top-link:focus-visible {
        color: #0c0c0c;
        background: rgba(12, 12, 12, 0.05);
        outline: none;
      }

      .mkt-nav__trigger:hover,
      .mkt-nav__trigger[aria-expanded='true'] {
        color: #0c0c0c;
        background: rgba(12, 12, 12, 0.05);
      }

      .mkt-nav__trigger:focus-visible {
        outline: 2px solid #0c0c0c;
        outline-offset: 2px;
      }

      .mkt-nav__caret {
        font-size: 10px;
        line-height: 1;
      }

      .mkt-nav__menu {
        position: absolute;
        top: calc(100% + 8px);
        left: 0;
        min-width: 184px;
        display: flex;
        flex-direction: column;
        padding: 8px;
        background: #f8f7f4;
        border: 1px solid rgba(12, 12, 12, 0.1);
        border-radius: 14px;
        box-shadow: 0 18px 44px rgba(12, 12, 12, 0.12);
        opacity: 0;
        visibility: hidden;
        transform: translateY(-4px);
        transition: opacity 0.12s ease, transform 0.12s ease, visibility 0.12s;
        z-index: 60;
      }

      .mkt-nav__menu--open {
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
      }

      .mkt-nav__menu-link {
        padding: 9px 12px;
        font-size: 14px;
        font-weight: 600;
        color: #3c3c3c;
        text-decoration: none;
        border-radius: 9px;
      }

      .mkt-nav__menu-link:hover,
      .mkt-nav__menu-link:focus-visible {
        background: rgba(12, 12, 12, 0.06);
        color: #0c0c0c;
        outline: none;
      }

      .mkt-nav__menu-link:focus-visible {
        outline: 2px solid #0c0c0c;
        outline-offset: -2px;
      }

      .mkt-nav__signin {
        font-size: 14px;
        font-weight: 600;
        color: #3c3c3c;
        text-decoration: none;
      }

      .mkt-nav__signin:hover {
        color: #0c0c0c;
      }

      .mkt-nav__cta {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 44px;
        padding: 0 18px;
        border-radius: 999px;
        background: #0c0c0c;
        color: #ffffff;
        text-decoration: none;
        font-size: 14px;
        font-weight: 700;
      }

      .mkt-nav__cta:hover {
        background: #1f1f1f;
      }

      .mkt-nav__hamburger {
        display: none;
        flex-direction: column;
        gap: 5px;
        width: 44px;
        height: 44px;
        align-items: center;
        justify-content: center;
        border: 1px solid rgba(12, 12, 12, 0.14);
        border-radius: 10px;
        background: transparent;
        cursor: pointer;
      }

      .mkt-nav__hamburger-bar {
        display: block;
        width: 18px;
        height: 2px;
        background: #0c0c0c;
        border-radius: 2px;
      }

      .mkt-nav__hamburger:focus-visible {
        outline: 2px solid #0c0c0c;
        outline-offset: 2px;
      }

      .mkt-nav__mobile {
        display: none;
        flex-direction: column;
        gap: 4px;
        margin-top: 12px;
        padding: 8px;
        background: #f8f7f4;
        border: 1px solid rgba(12, 12, 12, 0.1);
        border-radius: 16px;
      }

      .mkt-nav__mobile--open {
        display: flex;
      }

      .mkt-nav__m-section {
        border-bottom: 1px solid rgba(12, 12, 12, 0.07);
      }

      .mkt-nav__m-section:last-of-type {
        border-bottom: 0;
      }

      .mkt-nav__m-toggle {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        padding: 14px 12px;
        border: 0;
        background: transparent;
        font: inherit;
        font-size: 15px;
        font-weight: 700;
        color: #0c0c0c;
        cursor: pointer;
      }

      .mkt-nav__m-toggle:focus-visible {
        outline: 2px solid #0c0c0c;
        outline-offset: -2px;
      }

      .mkt-nav__m-panel {
        display: none;
        flex-direction: column;
        padding: 0 8px 10px;
      }

      .mkt-nav__m-panel--open {
        display: flex;
      }

      .mkt-nav__m-link {
        padding: 11px 14px;
        font-size: 14px;
        font-weight: 600;
        color: #3c3c3c;
        text-decoration: none;
        border-radius: 9px;
      }

      .mkt-nav__m-link:hover,
      .mkt-nav__m-link:focus-visible {
        background: rgba(12, 12, 12, 0.06);
        color: #0c0c0c;
      }

      .mkt-nav__m-actions {
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding: 14px 12px 8px;
        border-top: 1px solid rgba(12, 12, 12, 0.07);
      }

      .mkt-nav__m-signin {
        font-size: 15px;
        font-weight: 600;
        color: #3c3c3c;
        text-decoration: none;
        padding: 6px 0;
      }

      .mkt-nav__m-cta {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 46px;
        border-radius: 999px;
        background: #0c0c0c;
        color: #ffffff;
        text-decoration: none;
        font-size: 14px;
        font-weight: 700;
      }

      @media (max-width: 760px) {
        .mkt-nav__groups,
        .mkt-nav__actions {
          display: none;
        }

        .mkt-nav__hamburger {
          display: flex;
          margin-left: auto;
        }
      }
    `}</style>
  )
}
