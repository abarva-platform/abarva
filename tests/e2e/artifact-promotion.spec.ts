import { test, expect } from '@playwright/test'
import { installIntelligenceMocks, pratQueries } from './intelligence-fixtures'

test('artifact promotion surfaces the current backend persistence blocker explicitly', async ({ page }) => {
  await installIntelligenceMocks(page)
  await page.goto('/intelligence')

  await page.getByPlaceholder('What are health systems like us doing on ambient documentation?').fill(pratQueries.artifact)
  await page.getByRole('button', { name: 'Ask Nexus' }).click()

  await page.getByRole('button', { name: 'Attach to Program' }).click()

  await expect(page.getByText('integration note')).toBeVisible()
  await expect(page.getByText('does not persist intelligence_artifacts yet')).toBeVisible()
})
