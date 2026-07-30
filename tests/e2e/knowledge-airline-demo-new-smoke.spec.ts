// Knowledge UI signed-in smoke test — airline-demo-new
//
// Reuses the exact same sign-in harness as tests/e2e/primary-surfaces-smoke.spec.ts
// (DemoCodeSignIn flow, synthetic Apex Retail CIO fixture — see that file's own
// header comment). The Knowledge route at /home/knowledge is hardcoded to
// tenantKey="airline-demo-new" regardless of which signed-in persona is used,
// so any valid demo session is sufficient to prove the authenticated route
// loads, hydrates, and navigates cleanly.
//
// This is a runtime/render smoke test, not a data-correctness test: the
// GovernedKnowledgeProvider stub honestly withholds all data for
// airline-demo-new today (0/62 binding-matrix rows are reconciled — see
// reports/airline-knowledge-ui-binding-2026-07-29/), so every mode is
// EXPECTED to render its safe empty/withheld state, never real numbers.
// A test asserting real data would be testing the wrong thing right now.
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
    await expect(page.getByText('airline-demo-new')).toBeVisible()
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
      // Every mode must show at least one honest state banner today — real
      // content, not a blank/broken pane, since nothing is reconciled yet.
      await expect(page.getByTestId('knowledge-state-banner').first()).toBeVisible({ timeout: 10_000 })
      await page.screenshot({
        path: `test-results/knowledge-mode-${modeLabel.toLowerCase().replace(/[^a-z]+/g, '-')}.png`,
        fullPage: true,
      })
    }

    expect(pageErrors, `Uncaught page errors while switching modes: ${pageErrors.join('; ')}`).toHaveLength(0)
  })

  test('Explore mode never renders a real-looking table for unreconciled data', async ({ page }) => {
    await page.goto(`${BASE_URL}/home/knowledge`)
    await page.getByRole('navigation', { name: 'Knowledge mode' }).getByRole('button', { name: 'Explore' }).click()
    // Per the render-gate contract: withheld data must never render as an
    // empty-but-real-looking <table>.
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
