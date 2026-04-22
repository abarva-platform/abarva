import { test, expect } from '@playwright/test'
import { installIntelligenceMocks, pratQueries } from './intelligence-fixtures'

test('mode 2 grounded renders matrix, crux, and program fit', async ({ page }) => {
  await installIntelligenceMocks(page)
  await page.goto('/intelligence')

  await page.getByPlaceholder('What are health systems like us doing on ambient documentation?').fill(pratQueries.grounded)
  await page.getByRole('button', { name: 'Ask Nexus' }).click()

  await expect(page.getByText('DAX vs Abridge depends on the shape of the rollout you are actually committing to.')).toBeVisible()
  await expect(page.getByRole('table')).toBeVisible()
  await expect(page.getByText('The crux.')).toBeVisible()
  await expect(page.getByText('Emergent cohort')).toBeVisible()
  await expect(page.getByText('Program fit')).toBeVisible()
  await expect(page.getByText('high')).toBeVisible()
})
