/**
 * @jest-environment jsdom
 */

/**
 * Marketing public-site nav — Option A.
 *
 * Verifies the regrouped nav: only `Platform ▾` and `Company ▾` triggers in
 * the bar, the correct links per dropdown, hover + click + keyboard opening,
 * Escape/outside-click closing, and that "AI Success Platform" never appears
 * as a nav label.
 */

import { fireEvent, render, screen, within } from '@testing-library/react'
import { MARKETING_NAV_GROUPS, MarketingNav } from '@/components/marketing/MarketingNav'

describe('MarketingNav — Option A grouped dropdowns', () => {
  it('exposes exactly two grouped dropdown triggers: Platform and Company', () => {
    render(<MarketingNav />)
    const triggers = screen.getAllByRole('button', { name: /Platform|Company/ })
    expect(triggers).toHaveLength(2)
    expect(screen.getByRole('button', { name: /Platform/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Company/ })).toBeTruthy()
  })

  it('groups Platform → Product, Learn and Company → Customers, Architecture, Careers', () => {
    const platform = MARKETING_NAV_GROUPS.find((g) => g.label === 'Platform')!
    const company = MARKETING_NAV_GROUPS.find((g) => g.label === 'Company')!

    expect(platform.links.map((l) => l.label)).toEqual(['Product', 'Learn'])
    expect(platform.links.map((l) => l.href)).toEqual(['/product', '/learn'])

    expect(company.links.map((l) => l.label)).toEqual([
      'Customers',
      'Architecture',
      'Careers',
    ])
    const careers = company.links.find((l) => l.label === 'Careers')!
    expect(careers.href.startsWith('mailto:')).toBe(true)
  })

  it('triggers report aria-expanded and aria-haspopup', () => {
    render(<MarketingNav />)
    const platform = screen.getByRole('button', { name: /Platform/ })
    expect(platform.getAttribute('aria-haspopup')).toBe('menu')
    expect(platform.getAttribute('aria-expanded')).toBe('false')
  })

  it('opens a dropdown on click and exposes its links as menuitems', () => {
    render(<MarketingNav />)
    const platform = screen.getByRole('button', { name: /Platform/ })
    fireEvent.click(platform)
    expect(platform.getAttribute('aria-expanded')).toBe('true')

    const menu = screen.getByRole('menu', { name: 'Platform' })
    const items = within(menu).getAllByRole('menuitem')
    expect(items.map((i) => i.textContent)).toEqual(['Product', 'Learn'])
  })

  it('opens a dropdown on hover (desktop affordance)', () => {
    render(<MarketingNav />)
    const company = screen.getByRole('button', { name: /Company/ })
    const group = company.closest('.mkt-nav__group') as HTMLElement
    fireEvent.mouseEnter(group)
    expect(company.getAttribute('aria-expanded')).toBe('true')
  })

  it('opens with ArrowDown and closes with Escape (keyboard accessible)', () => {
    render(<MarketingNav />)
    const platform = screen.getByRole('button', { name: /Platform/ })
    fireEvent.keyDown(platform, { key: 'ArrowDown' })
    expect(platform.getAttribute('aria-expanded')).toBe('true')

    const menu = screen.getByRole('menu', { name: 'Platform' })
    fireEvent.keyDown(menu, { key: 'Escape' })
    expect(platform.getAttribute('aria-expanded')).toBe('false')
  })

  it('closes an open dropdown on outside click', () => {
    render(<MarketingNav />)
    const platform = screen.getByRole('button', { name: /Platform/ })
    fireEvent.click(platform)
    expect(platform.getAttribute('aria-expanded')).toBe('true')

    fireEvent.pointerDown(document.body)
    expect(platform.getAttribute('aria-expanded')).toBe('false')
  })

  it('renders Sign in and a Request demo CTA in the bar', () => {
    render(<MarketingNav />)
    expect(screen.getAllByText('Sign in').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Request demo').length).toBeGreaterThan(0)
  })

  it('honors a custom CTA label and href', () => {
    render(<MarketingNav ctaHref="/contact" ctaLabel="Talk to us" />)
    const cta = screen.getAllByText('Talk to us')[0] as HTMLAnchorElement
    expect(cta.getAttribute('href')).toBe('/contact')
  })

  it('never renders "AI Success Platform" as a nav label', () => {
    render(<MarketingNav />)
    expect(screen.queryByText(/AI Success Platform/i)).toBeNull()
  })

  it('provides an expandable mobile menu with Platform/Company sections', () => {
    render(<MarketingNav />)
    // `hidden: true` so CSS-driven media-query visibility doesn't hide the
    // mobile-only controls from the role query under jsdom.
    const hamburger = screen
      .getAllByRole('button', { hidden: true })
      .find((b) => b.className.includes('mkt-nav__hamburger')) as HTMLElement
    expect(hamburger).toBeTruthy()
    expect(hamburger.getAttribute('aria-label')).toBe('Open menu')
    expect(hamburger.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(hamburger)
    expect(hamburger.getAttribute('aria-expanded')).toBe('true')

    // Mobile sections collapse/expand independently of the desktop dropdowns.
    const mobileToggles = screen
      .getAllByRole('button', { hidden: true })
      .filter((b) => b.className.includes('mkt-nav__m-toggle'))
    expect(mobileToggles).toHaveLength(2)
    fireEvent.click(mobileToggles[0])
    expect(mobileToggles[0].getAttribute('aria-expanded')).toBe('true')
  })
})
