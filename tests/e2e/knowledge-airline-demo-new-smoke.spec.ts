// Knowledge UI signed-in smoke test — airline-demo-new
//
// Authenticates with Clerk ticket sign-in as the Airline Foundation automation
// proof user. No reusable password/demo-code credential is typed into the
// browser, and Clerk is not bypassed.
//
// This is a runtime/render smoke test, not a data-correctness test, but it is
// no longer a "verify everything is honestly empty" test either. The route
// binds to the REAL KnowledgeUiViewModelAssembler over the REAL HTTP
// KnowledgeConsumptionProvider for the server-resolved Airline Foundation
// proof tenant. Some sections render loaded governed data, and some still
// render honest SOURCE_INCOMPLETE / not-loaded states because not every
// projection exists for the active baseline yet.
//
// Run:
//   CLERK_SECRET_KEY=... BASE_URL=http://localhost:3001 npx playwright test tests/e2e/knowledge-airline-demo-new-smoke.spec.ts

import { test, expect, type Page, type ConsoleMessage } from '@playwright/test'
import { createClerkClient } from '@clerk/backend'

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000'
const FOUNDATION_PROOF_EMAIL =
  process.env.FOUNDATION_PROOF_EMAIL ?? 'airline-foundation-agent@abarva.ai'

test.describe.configure({ mode: 'serial' })

function requireClerkSecret(): string {
  const secret = process.env.CLERK_SECRET_KEY?.trim()
  if (!secret) {
    throw new Error(
      'CLERK_SECRET_KEY is required for the signed-in Airline Foundation proof test.',
    )
  }
  return secret
}

async function signInWithFoundationTicket(page: Page): Promise<void> {
  const clerk = createClerkClient({ secretKey: requireClerkSecret() })
  const users = await clerk.users.getUserList({
    emailAddress: [FOUNDATION_PROOF_EMAIL],
    limit: 1,
  })
  const user = users.data[0]
  if (!user) {
    throw new Error(`No Clerk proof user found for ${FOUNDATION_PROOF_EMAIL}`)
  }
  const token = await clerk.signInTokens.createSignInToken({
    userId: user.id,
    expiresInSeconds: 300,
  })

  await page.goto(`${BASE_URL}/sign-in`, { waitUntil: 'domcontentloaded' })
  await page.waitForFunction(
    () => (window as Window & { Clerk?: { loaded?: boolean } }).Clerk?.loaded === true,
    null,
    { timeout: 30_000 },
  )
  await page.evaluate(async (ticket) => {
    const win = window as unknown as Window & {
      Clerk: {
        client: {
          signIn: {
            create: (params: { strategy: 'ticket'; ticket: string }) => Promise<{
              status: string
              createdSessionId?: string | null
            }>
          }
        }
        setActive: (params: { session?: string | null }) => Promise<void>
      }
    }
    const result = await win.Clerk.client.signIn.create({
      strategy: 'ticket',
      ticket,
    })
    if (result.status !== 'complete' || !result.createdSessionId) {
      throw new Error(`Ticket sign-in failed with status ${result.status}`)
    }
    await win.Clerk.setActive({ session: result.createdSessionId })
  }, token.token)
}

async function gotoHomeKnowledgeThroughRequiredGates(page: Page, path = '/home/knowledge'): Promise<void> {
  await page.goto(`${BASE_URL}${path}`)

  if (page.url().includes('/responsible-ai/acknowledgment')) {
    await expect(page.getByText(/acknowledgment ledger is unavailable/i)).toHaveCount(0)
    await page.getByRole('checkbox').check()
    await page.getByRole('button', { name: /accept and continue|renew acknowledgment and continue/i }).click()
    await page.waitForURL(/\/home|\/responsible-ai\/training/, { timeout: 20_000 })
  }

  if (page.url().includes('/responsible-ai/training')) {
    await expect(page.getByText(/training ledger is unavailable/i)).toHaveCount(0)
    await page.getByRole('checkbox').check()
    await page.getByRole('button', { name: /complete training and continue/i }).click()
    await page.waitForURL(/\/home/, { timeout: 20_000 })
  }

  await page.goto(`${BASE_URL}${path}`)
}

// The pre-existing src/app/not-found.tsx intentionally logs every 404 via
// console.error for Vercel production monitoring (unrelated to this build,
// confirmed by git blame). That is the ONLY console.error pattern this suite
// tolerates; anything else fails the test.
const KNOWN_UNRELATED_CONSOLE_PATTERN = /^\[404\] path=/

test.describe('Knowledge UI · airline-demo-new (auth boundary)', () => {
  test('unauthenticated /home/knowledge redirects to Clerk sign-in', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    await page.goto(`${BASE_URL}/home/knowledge`)
    await expect(page).toHaveURL(/\/sign-in\?redirect=%2Fhome%2Fknowledge/)
    await context.close()
  })
})

test.describe('Knowledge UI · airline-demo-new (signed-in smoke)', () => {
  test.beforeEach(async ({ page }) => {
    await signInWithFoundationTicket(page)
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

    await gotoHomeKnowledgeThroughRequiredGates(page)
    await expect(page).toHaveURL(/\/home\/knowledge/)
    expect(page.url()).not.toContain('/knowledge-preview')

    // Shell chrome
    await expect(page.getByText('AbarVa', { exact: true })).toBeVisible()
    await expect(page.getByText('airline-demo-new')).toBeVisible()
    await expect(page.getByText('fixture-airline-demo-new')).toHaveCount(0)
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

  test('tenant query strings cannot select another foundation tenant', async ({ page }) => {
    await gotoHomeKnowledgeThroughRequiredGates(
      page,
      '/home/knowledge?tenant=healthcare-demo-new&provider=http',
    )
    await expect(page).toHaveURL(/\/home\/knowledge/)
    await expect(page.getByText('airline-demo-new')).toBeVisible()
    await expect(page.getByText(/fixture-airline-demo-new|fixture-healthcare-demo-new|healthcare-demo-new/i)).toHaveCount(0)
    expect(page.url()).not.toContain('/knowledge-preview')
  })

  test('all four modes are reachable and render without crashing', async ({ page }) => {
    const pageErrors: string[] = []
    page.on('pageerror', (err) => pageErrors.push(err.message))

    await gotoHomeKnowledgeThroughRequiredGates(page)
    const modeNav = page.getByRole('navigation', { name: 'Knowledge mode' })

    for (const modeLabel of ['Brief', 'Explore', 'Relationships', 'Evidence & gaps']) {
      await modeNav.getByRole('button', { name: modeLabel }).click()
      await expect(modeNav.getByRole('button', { name: modeLabel })).toHaveAttribute('aria-current', 'page')
      // Every mode must show either real governed content (a table, a real
      // card) or at least one honest state banner -- never a blank/broken
      // pane. Use one CSS union locator to avoid Playwright strict-mode
      // failures when a mode legitimately has both tables and banners.
      const visibleModeEvidence = page
        .locator('[data-testid="knowledge-state-banner"], table')
        .first()
      await expect(visibleModeEvidence).toBeVisible({ timeout: 10_000 })
      await page.screenshot({
        path: `test-results/knowledge-mode-${modeLabel.toLowerCase().replace(/[^a-z]+/g, '-')}.png`,
        fullPage: true,
      })
    }

    expect(pageErrors, `Uncaught page errors while switching modes: ${pageErrors.join('; ')}`).toHaveLength(0)
  })

  test('Explore mode renders a real table for a DIRECTLY_SUPPORTED kind, and never a real-looking table for a kind with no real projection', async ({ page }) => {
    await gotoHomeKnowledgeThroughRequiredGates(page)
    await page.getByRole('navigation', { name: 'Knowledge mode' }).getByRole('button', { name: 'Explore' }).click()

    // "Systems" (applications) is backed by a registered projection
    // (application_inventory_v1) and the active Airline Foundation baseline
    // must render real rows -- not a fixture marker and not a withheld banner.
    await expect(page.getByRole('table')).toBeVisible()
    await expect(page.getByText('Crew Scheduling System')).toBeVisible()
    await expect(page.getByText('fixture-airline-demo-new')).toHaveCount(0)

    // "Risks and controls" has no real inventory projection at any layer of
    // the consumption contract yet -- per the render-gate contract, it must
    // show its honest PROJECTION_UNAVAILABLE banner, never an
    // empty-but-real-looking <table>.
    await page.getByRole('button', { name: 'Risks and controls' }).click()
    await expect(page.getByTestId('knowledge-state-banner').first()).toBeVisible()
    await expect(page.getByRole('table')).toHaveCount(0)
  })

  test('Evidence & gaps mode shows the wired Decision Readiness quadrant honestly withheld, not zero', async ({ page }) => {
    await gotoHomeKnowledgeThroughRequiredGates(page)
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
