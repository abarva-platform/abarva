/**
 * E2E nav active-state tests (Playwright).
 *
 * Run against local dev: BASE_URL=http://localhost:3000 npx playwright test
 * Run against prod:      BASE_URL=https://nexus-vert-kappa.vercel.app npx playwright test
 *
 * These tests use the public (unauthenticated) routes only.
 * For authenticated routes, set up Clerk test mode (CLERK_SECRET_KEY + test user JWT).
 *
 * What we check:
 *  - Only ONE nav item has color rgb(45,212,200) [TEAL] at a time
 *  - The correct item is active per route
 */

import { test, expect, Page } from '@playwright/test'

const TEAL = 'rgb(45, 212, 200)'

async function getNavItemColor(page: Page, text: string): Promise<string> {
  return page
    .locator(`#abarva-nav a, #abarva-nav button`)
    .filter({ hasText: text })
    .first()
    .evaluate(el => window.getComputedStyle(el).color)
}

async function noNavHighlightExcept(page: Page, expectActive: string | null) {
  const navItems = ['Solutions', 'AI Value Realization', 'Intelligence']
  for (const item of navItems) {
    const color = await getNavItemColor(page, item)
    if (item === expectActive) {
      expect(color, `${item} should be teal on this page`).toBe(TEAL)
    } else {
      expect(color, `${item} should NOT be teal on this page`).not.toBe(TEAL)
    }
  }
}

// ── Public routes (no auth required) ─────────────────────────────────────────

test('home page: no nav item highlighted', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  await noNavHighlightExcept(page, null)
})

test('solutions page: Solutions highlighted only', async ({ page }) => {
  await page.goto('/solutions')
  await page.waitForLoadState('networkidle')
  const color = await getNavItemColor(page, 'Solutions')
  expect(color).toBe(TEAL)
})

test('platform page: nothing highlighted', async ({ page }) => {
  await page.goto('/platform')
  await page.waitForLoadState('networkidle')
  await noNavHighlightExcept(page, null)
})

test('clients page: nothing highlighted', async ({ page }) => {
  await page.goto('/clients')
  await page.waitForLoadState('networkidle')
  await noNavHighlightExcept(page, null)
})

// ── Module pages — require auth; skipped unless CLERK_TEST_TOKEN is set ──────
// To run authenticated tests:
//   1. Set up a Clerk test user
//   2. Export CLERK_SESSION_TOKEN=<jwt>
//   3. These tests inject the session cookie before navigating

const AUTH_TOKEN = process.env.CLERK_SESSION_TOKEN

test.describe('Authenticated module routes', () => {
  test.skip(!AUTH_TOKEN, 'CLERK_SESSION_TOKEN not set — skipping auth tests')

  async function withAuth(page: Page, url: string) {
    await page.context().addCookies([{
      name: '__session',
      value: AUTH_TOKEN!,
      domain: new URL(process.env.BASE_URL || 'http://localhost:3000').hostname,
      path: '/',
    }])
    await page.goto(url)
    await page.waitForLoadState('networkidle')
  }

  test('data-intelligence: AI Value Realization highlighted, Intelligence not', async ({ page }) => {
    await withAuth(page, '/data-intelligence?client=meridian')
    const avrColor = await getNavItemColor(page, 'AI Value Realization')
    const intColor = await getNavItemColor(page, 'Intelligence')
    expect(avrColor).toBe(TEAL)
    expect(intColor).not.toBe(TEAL)
  })

  test('ai-strategy: Intelligence highlighted, AVR not', async ({ page }) => {
    await withAuth(page, '/ai-strategy?client=meridian')
    const intColor = await getNavItemColor(page, 'Intelligence')
    const avrColor = await getNavItemColor(page, 'AI Value Realization')
    expect(intColor).toBe(TEAL)
    expect(avrColor).not.toBe(TEAL)
  })

  test('Maestro link is not teal on data-intelligence page', async ({ page }) => {
    await withAuth(page, '/data-intelligence?client=meridian')
    const maestroColor = await getNavItemColor(page, 'Maestro')
    expect(maestroColor).not.toBe(TEAL)
  })

  test('Maestro link IS teal on maestro page', async ({ page }) => {
    await withAuth(page, '/admin/client/meridian')
    // Maestro page uses activePage="maestro"
    const maestroColor = await getNavItemColor(page, 'Maestro')
    expect(maestroColor).toBe(TEAL)
  })

  // All 9 module pages: only AVR active
  const modules = [
    { name: 'diagnose', path: '/diagnose?client=meridian' },
    { name: 'contradictions', path: '/contradictions?client=meridian' },
    { name: 'data-intelligence', path: '/data-intelligence?client=meridian' },
    { name: 'intelligence', path: '/intelligence?client=meridian' },
    { name: 'vendor-intelligence', path: '/vendor-intelligence?client=meridian' },
    { name: 'architecture', path: '/architecture?client=meridian' },
    { name: 'justify', path: '/justify?client=meridian' },
    { name: 'ai-pdlc', path: '/ai-pdlc?client=meridian' },
    { name: 'outcome-intelligence', path: '/outcome-intelligence?client=meridian' },
  ]

  for (const { name, path } of modules) {
    test(`${name}: only AI Value Realization is teal`, async ({ page }) => {
      await withAuth(page, path)
      await noNavHighlightExcept(page, 'AI Value Realization')
    })
  }
})
