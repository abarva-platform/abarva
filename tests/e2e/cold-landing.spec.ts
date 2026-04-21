import { test, expect } from '@playwright/test'
import { installIntelligenceMocks } from './intelligence-fixtures'

test('cold landing hydrates State A with Zones 1-4', async ({ page }) => {
  await installIntelligenceMocks(page)

  await page.goto('/intelligence')

  await expect(page.getByText('AbarVa already knows the shape of Meridian Health System.')).toBeVisible()
  await expect(page.getByText('Zone 2 · Ask Intelligence')).toBeVisible()
  await expect(page.getByText('$2.3M Abridge/DAX contradiction surfaced across ambient documentation work')).toBeVisible()
  await expect(page.getByText('Zone 4 · Explore the foundation')).toBeVisible()

  await page.getByRole('button', { name: '$2.3M Abridge/DAX contradiction surfaced across ambient documentation work' }).click()
  await expect(page.getByLabel('Signal detail panel')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Originate program' })).toBeDisabled()
})
