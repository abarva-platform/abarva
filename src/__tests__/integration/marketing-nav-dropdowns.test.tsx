/**
 * @jest-environment jsdom
 */

/**
 * Marketing public-site nav — the NARROW LAUNCH contract.
 *
 * This file used to assert "Option A": two grouped dropdown triggers
 * (`Platform ▾`, `Company ▾`), their links, hover/click/keyboard opening,
 * Escape and outside-click closing, and an expandable mobile menu with the same
 * two sections. Nine of its eleven cases asserted a nav that no longer exists.
 *
 * `feat(marketing): gate public product surfaces` (#2658, 2026-05-31) retired
 * the grouped nav on purpose for a narrow launch: it emptied
 * `MARKETING_NAV_GROUPS` and added `showMenuItems`, defaulting to `false`. The
 * component's own doc comment records the decision — "Launch default is
 * intentionally narrow: one Request access CTA. Grouped menus can be opted in
 * later when Product/About/Contact are ready."
 *
 * That PR updated `tests/public-site/shell.test.ts` and not this file, because
 * no workflow command ran this file. It sat red and unread for nearly four
 * months.
 *
 * So the assertions are rewritten to the contract that exists, and they are
 * rewritten as a GUARD on the gating decision rather than as a description of
 * an empty component: every case below fails if the grouped nav is switched
 * back on by default without a deliberate change to this file.
 *
 * A FINDING THIS REWRITE SURFACED, recorded and deliberately NOT covered here:
 * `Dropdown` and `MobileSection` are still in `MarketingNav.tsx` and still
 * implement hover, click, ArrowUp/ArrowDown, Escape and outside-click closing —
 * but `MARKETING_NAV_GROUPS` is an empty module-level array and no prop can
 * supply groups to them, so none of that behaviour is reachable through
 * `MarketingNav`. The only production caller (`site.tsx`) never passes
 * `showMenuItems`. Mounting `Dropdown` directly to keep those cases green would
 * manufacture coverage of an affordance no reader can open, so it is not done.
 * The dead island is filed as its own backlog item.
 */

import { fireEvent, render, screen } from '@testing-library/react'
import { MARKETING_NAV_GROUPS, MarketingNav } from '@/components/marketing/MarketingNav'

describe('MarketingNav — narrow launch contract', () => {
  it('declares no nav groups, which is what makes the bar CTA-only', () => {
    // The gating decision lives in data, not in markup. If a future change
    // repopulates this array, the dropdown cases below stop being vacuous and
    // this case is the one that says the decision moved.
    expect(MARKETING_NAV_GROUPS).toEqual([])
  })

  it('renders exactly one CTA and no other nav control', () => {
    render(<MarketingNav />)

    const cta = screen.getByText('Request access') as HTMLAnchorElement
    expect(cta.getAttribute('href')).toBe('/')

    // `hidden: true` so CSS-driven media-query visibility cannot hide a control
    // from the role query under jsdom — the mistake the old mobile case made in
    // reverse, by finding a hamburger it then required to exist.
    expect(screen.queryAllByRole('button', { hidden: true })).toHaveLength(0)
    expect(screen.queryAllByRole('link', { hidden: true })).toHaveLength(1)
  })

  it('exposes no grouped dropdown triggers', () => {
    render(<MarketingNav />)

    expect(screen.queryByRole('button', { name: /Platform/ })).toBeNull()
    expect(screen.queryByRole('button', { name: /Company/ })).toBeNull()
    expect(screen.queryAllByRole('menu', { hidden: true })).toHaveLength(0)
    expect(screen.queryAllByRole('menuitem', { hidden: true })).toHaveLength(0)
  })

  it('exposes no hamburger and no mobile drawer', () => {
    const { container } = render(<MarketingNav />)

    expect(container.querySelector('.mkt-nav__hamburger')).toBeNull()
    expect(container.querySelector('.mkt-nav__mobile')).toBeNull()
    expect(container.querySelectorAll('.mkt-nav__m-toggle')).toHaveLength(0)
  })

  it('does not render a Sign in link beside the CTA', () => {
    // The old case asserted `Sign in` AND a `Request demo` CTA in the bar. The
    // launch bar carries neither: one CTA, and #2658 pointed it at the sign-in
    // route through `site.tsx` rather than rendering a second link here.
    render(<MarketingNav />)

    expect(screen.queryByText('Sign in')).toBeNull()
    expect(screen.queryByText('Request demo')).toBeNull()
  })

  it('honors a custom CTA label and href', () => {
    render(<MarketingNav ctaHref="/contact" ctaLabel="Talk to us" />)

    const cta = screen.getAllByText('Talk to us')[0] as HTMLAnchorElement
    expect(cta.getAttribute('href')).toBe('/contact')
  })

  it('renders a mailto CTA as a plain anchor rather than a client-side Link', () => {
    render(<MarketingNav ctaHref="mailto:careers@example.com" ctaLabel="Careers" />)

    const cta = screen.getByText('Careers') as HTMLAnchorElement
    expect(cta.tagName).toBe('A')
    expect(cta.getAttribute('href')).toBe('mailto:careers@example.com')
  })

  it('carries the site CTA that site.tsx passes', () => {
    // `src/components/marketing/site.tsx` defaults to ctaHref '/sign-in' and
    // ctaLabel 'Request access'. Asserting the pair here keeps the nav honest
    // about the one route the public front door actually offers.
    render(<MarketingNav ctaHref="/sign-in" ctaLabel="Request access" />)

    const cta = screen.getByText('Request access') as HTMLAnchorElement
    expect(cta.getAttribute('href')).toBe('/sign-in')
  })

  it('never renders "AI Success Platform" as a nav label', () => {
    render(<MarketingNav />)

    expect(screen.queryByText(/AI Success Platform/i)).toBeNull()
  })

  it('has no interactive state to open, so a click on the bar changes nothing', () => {
    // The old suite's hover/keyboard/outside-click cases all needed a trigger.
    // There is none. What remains worth asserting is that the bar is inert:
    // the CTA is the only thing a pointer can reach, and nothing in the nav
    // opens.
    const { container } = render(<MarketingNav />)
    const bar = container.querySelector('.mkt-nav__bar') as HTMLElement

    fireEvent.click(bar)
    fireEvent.mouseEnter(bar)
    fireEvent.keyDown(bar, { key: 'ArrowDown' })

    expect(screen.queryAllByRole('menu', { hidden: true })).toHaveLength(0)
    expect(container.querySelector('[aria-expanded="true"]')).toBeNull()
  })
})
