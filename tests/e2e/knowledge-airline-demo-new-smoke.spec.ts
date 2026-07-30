// Knowledge UI signed-in smoke test — airline-demo-new
//
// Reuses the exact same sign-in harness as tests/e2e/primary-surfaces-smoke.spec.ts
// (DemoCodeSignIn flow, synthetic Apex Retail CIO fixture — see that file's own
// header comment). The Knowledge route at /home/knowledge is hardcoded to a
// fixed page (regardless of which signed-in persona is used), so any valid
// demo session is sufficient to prove the authenticated route loads,
// hydrates, and navigates cleanly.
//
// This is a runtime/render smoke test, not a data-correctness test, but it is
// no longer a "verify everything is honestly empty" test either. Since PR B
// (reports/airline-knowledge-provider-reconciliation-2026-07-30/), the route
// binds to the REAL KnowledgeUiViewModelAssembler over the REAL fixture
// ConsumptionRuntime (fixture-airline-demo-new) instead of the deleted
// duplicate GovernedKnowledgeProvider stub that withheld everything
// unconditionally. Some sections now render real fixture content (Brief
// identity, Explore "Systems"/"Vendors", Relationships), and some still
// render their honest empty state because no real projection exists for
// that field at any layer of the consumption contract yet (Goals, Purpose,
// Contradictions, the decision-readiness quadrant). Assertions below reflect
// that mix, not a blanket "everything is withheld" expectation.
//
// Run: BASE_URL=http://localhost:3001 npx playwright test tests/e2e/knowledge-airline-demo-new-smoke.spec.ts

import { test, expect, type Page, type ConsoleMessage } from '@playwright/test'

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000'
const DEMO_EMAIL = process.env.E2E_DEMO_EMAIL ?? 'cio@apex-retail.example.com'
const DEMO_PASSWORD = process.env.E2E_DEMO_PASSWORD ?? 'Demo2026!'
const DEMO_ACCESS_CODE = process.env.E2E_DEMO_ACCESS_CODE ?? '424242'

async function signIn(page: Page): Promise<void> {
  await page.goto(`${BASE_URL}/sign-in`)
  await page.getByPlaceholder(/name@company.com/i).fill(DEMO_EMAIL)
  await page.getByPlaceholder(/Password from invite/i).fill(DEMO_PASSWORD)
  await page.getByPlaceholder(/6-digit code/i).fill(DEMO_ACCESS_CODE)
  await page.getByRole('button', { name: /sign in/i }).click()
  await page.waitForURL(/\/home/, { timeout: 15_000 })
}

// The pre-existing src/app/not-found.tsx intentionally logs every 404 via
// console.error for Vercel production monitoring (unrelated to this build,
// confirmed by git blame). That is the ONLY console.error pattern this suite
// tolerates; anything else fails the test.
const KNOWN_UNRELATED_CONSOLE_PATTERN = /^\[404\] path=/

test.describe('Knowledge UI · airline-demo-new (signed-in smoke)', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page)
  })

  test('route loads, hydrates, and shows the shell for a signed-in user', async ({ page }) => {
    const consoleErrors: string[] = []
    const pageErrors: string[] = []
    const failedRequests: { url: string; status: number }[] = []

    page.on('console', (msg: ConsoleMessage) => {
      if (msg.type() === 'error' && !KNOWN_UNRELATED_CONSOLE_PATTERN.test(msg.text())) {
        consoleErrors.push(msg.text())
      }
    })
    page.on('pageerror', (err) => pageErrors.push(err.message))
    page.on('response', (res) => {
      if (res.status() >= 400 && !res.url().includes('__nextjs')) {
        failedRequests.push({ url: res.url(), status: res.status() })
      }
    })

    await page.goto(`${BASE_URL}/home/knowledge`)
    await expect(page).toHaveURL(/\/home\/knowledge/)

    // Shell chrome
    await expect(page.getByText('AbarVa', { exact: true })).toBeVisible()
    await expect(page.getByText('fixture-airline-demo-new')).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'Knowledge mode' })).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'Product modules' })).toBeVisible()
    await expect(page.getByLabel('aVa companion')).toBeVisible()

    await page.screenshot({ path: 'test-results/knowledge-brief-mode.png', fullPage: true })

    expect(pageErrors, `Uncaught page errors: ${pageErrors.join('; ')}`).toHaveLength(0)
    expect(
      consoleErrors,
      `Unexplained console errors: ${consoleErrors.join('; ')}`,
    ).toHaveLength(0)
    expect(
      failedRequests,
      `Unexplained failed requests: ${JSON.stringify(failedRequests)}`,
    ).toHaveLength(0)
  })

  test('all four modes are reachable and render without crashing', async ({ page }) => {
    const pageErrors: string[] = []
    page.on('pageerror', (err) => pageErrors.push(err.message))

    await page.goto(`${BASE_URL}/home/knowledge`)
    const modeNav = page.getByRole('navigation', { name: 'Knowledge mode' })

    for (const modeLabel of ['Brief', 'Explore', 'Relationships', 'Evidence & gaps']) {
      await modeNav.getByRole('button', { name: modeLabel }).click()
      await expect(modeNav.getByRole('button', { name: modeLabel })).toHaveAttribute('aria-current', 'page')
      // Every mode must show either real fixture content (a table, a real
      // card) or at least one honest state banner -- never a blank/broken
      // pane. Brief/Explore/Relationships now render real fixture content by
      // default; Evidence & gaps' Contradictions/Decision-readiness-quadrant
      // sections always render their honest banner (no real projection
      // exists for either).
      const hasBanner = page.getByTestId('knowledge-state-banner').first()
      const hasTable = page.getByRole('table').first()
      await expect(hasBanner.or(hasTable)).toBeVisible({ timeout: 10_000 })
      await page.screenshot({
        path: `test-results/knowledge-mode-${modeLabel.toLowerCase().replace(/[^a-z]+/g, '-')}.png`,
        fullPage: true,
      })
    }

    expect(pageErrors, `Uncaught page errors while switching modes: ${pageErrors.join('; ')}`).toHaveLength(0)
  })

  test('Explore mode renders a real table for a DIRECTLY_SUPPORTED kind, and never a real-looking table for a kind with no real projection', async ({ page }) => {
    await page.goto(`${BASE_URL}/home/knowledge`)
    await page.getByRole('navigation', { name: 'Knowledge mode' }).getByRole('button', { name: 'Explore' }).click()

    // "Systems" (applications) is backed by a real registered projection
    // (application_inventory_v1) and the fixture pack has real rows -- it
    // must render a real table, not a withheld banner.
    await expect(page.getByRole('table')).toBeVisible()
    await expect(page.getByText('Crew Scheduling System')).toBeVisible()

    // "Risks and controls" has no real inventory projection at any layer of
    // the consumption contract yet -- per the render-gate contract, it must
    // show its honest PROJECTION_UNAVAILABLE banner, never an
    // empty-but-real-looking <table>.
    await page.getByRole('button', { name: 'Risks and controls' }).click()
    await expect(page.getByTestId('knowledge-state-banner').first()).toBeVisible()
    await expect(page.getByRole('table')).toHaveCount(0)
  })

  test('Evidence & gaps mode shows the wired Decision Readiness quadrant honestly withheld, not zero', async ({ page }) => {
    await page.goto(`${BASE_URL}/home/knowledge`)
    await page
      .getByRole('navigation', { name: 'Knowledge mode' })
      .getByRole('button', { name: 'Evidence & gaps' })
      .click()
    await expect(page.getByText('Decision readiness')).toBeVisible()
    // Regression guard for the orphan-component fix: this section must show
    // at least two honest withheld banners (ReadinessTiles + the newly-wired
    // DecisionReadinessQuadrant), not a silent gap where the quadrant used
    // to not exist at all.
    const banners = page.getByTestId('knowledge-state-banner')
    await expect(banners.first()).toBeVisible()
    expect(await banners.count()).toBeGreaterThanOrEqual(2)
  })
})
