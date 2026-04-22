import { test, expect } from '@playwright/test'
import { installIntelligenceMocks, pratQueries } from './intelligence-fixtures'

test('counter-argument renders the opposing case and tiebreaker', async ({ page }) => {
  await installIntelligenceMocks(page)
  await page.goto('/intelligence')

  await page.getByPlaceholder('What are health systems like us doing on ambient documentation?').fill(pratQueries.grounded)
  await page.getByRole('button', { name: 'Ask Nexus' }).click()
  await page.getByRole('button', { name: 'Counter', exact: true }).click()

  await expect(page.getByText('counter-argument', { exact: true })).toBeVisible()
  await expect(page.getByText('Counter-position')).toBeVisible()
  await expect(page.getByLabel('Nexus grounded counter_pair').getByText('Tiebreaker.')).toBeVisible()
})
