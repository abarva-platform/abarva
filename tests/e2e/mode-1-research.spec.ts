import { test, expect } from '@playwright/test'
import { installIntelligenceMocks, pratQueries } from './intelligence-fixtures'

test('mode 1 research shows cohort intelligence and attached sources', async ({ page }) => {
  await installIntelligenceMocks(page)
  await page.goto('/intelligence')

  const started = Date.now()

  await page.getByPlaceholder('What are health systems like us doing on ambient documentation?').fill(pratQueries.research)
  await page.getByRole('button', { name: 'Ask Nexus' }).click()

  await expect(page.getByText('Ambient documentation peers are clustering into two credible paths.')).toBeVisible()
  expect(Date.now() - started).toBeLessThan(1500)

  await expect(page.getByText('Emergent cohort')).toBeVisible()
  await expect(page.getByText('Ambient documentation cohort').first()).toBeVisible()
  await expect(page.getByText('Sources', { exact: true })).toBeVisible()
})
