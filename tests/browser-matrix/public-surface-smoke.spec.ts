import { expect, test } from '@playwright/test'

const htmlRoutes = [
  '/',
  '/sign-in',
  '/signed-out',
]

test.describe('public browser matrix smoke', () => {
  for (const route of htmlRoutes) {
    test(`${route} renders without browser-specific failures`, async ({ page }) => {
      const consoleErrors: string[] = []
      const pageErrors: string[] = []

      page.on('console', (message) => {
        if (message.type() === 'error') {
          consoleErrors.push(message.text())
        }
      })
      page.on('pageerror', (error) => {
        pageErrors.push(error.message)
      })

      const response = await page.goto(route, { waitUntil: 'domcontentloaded' })
      expect(response, `${route} should return a response`).not.toBeNull()
      expect(response?.status(), `${route} should not return an error status`).toBeLessThan(400)

      await expect(page.locator('body')).toBeVisible()
      await expect(page.locator('body')).not.toHaveText(/^\s*$/)
      const viewportWidth = await page.locator('html').evaluate((node) => node.clientWidth)
      expect(viewportWidth, `${route} should have a measurable viewport`).toBeGreaterThan(0)

      expect(pageErrors, `${route} page errors`).toEqual([])
      expect(consoleErrors, `${route} console errors`).toEqual([])
    })
  }

  test('/api/health returns a machine-readable readiness response', async ({ request }) => {
    const response = await request.get('/api/health')
    expect(response.status()).toBeLessThan(600)

    const payload = await response.json()
    expect(payload).toEqual(expect.any(Object))
  })

  test('/robots.txt is available to every browser project', async ({ request }) => {
    const response = await request.get('/robots.txt')
    expect(response.status()).toBeLessThan(400)

    const text = await response.text()
    expect(text).toContain('User-agent')
  })

  test('/sitemap.xml is available to every browser project', async ({ request }) => {
    const response = await request.get('/sitemap.xml')
    expect(response.status()).toBeLessThan(400)

    const text = await response.text()
    expect(text).toContain('<urlset')
  })
})
