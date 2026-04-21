import { test, expect } from '@playwright/test'
import { installIntelligenceMocks } from './intelligence-fixtures'

test('tenancy leak attempts surface the backend block without a generic error', async ({ page }) => {
  await installIntelligenceMocks(page, {
    queryFailure: {
      status: 500,
      body: {
        error: 'tenancy_violation',
        detail: 'Cross-tenant query blocked at database layer.',
      },
    },
  })
  await page.goto('/intelligence')

  await page.getByPlaceholder('What are health systems like us doing on ambient documentation?').fill(
    'Compare Meridian Health System and Apex Retail Group directly.',
  )
  await page.getByRole('button', { name: 'Ask Nexus' }).click()

  await expect(page.getByText('integration note')).toBeVisible()
  await expect(page.getByText('Cross-tenant query blocked at database layer.')).toBeVisible()
})
