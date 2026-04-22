import { test, expect } from '@playwright/test'
import { deepDiveTurns, installIntelligenceMocks } from './intelligence-fixtures'

test('state C deep-dive shows the thread rail and contradiction self-check', async ({ page }) => {
  await installIntelligenceMocks(page, { initialTurns: deepDiveTurns() })
  await page.goto('/intelligence/thread/thread-meridian')

  await expect(page.getByText('Thread rail')).toBeVisible()
  await expect(page.getByText('contradiction self-check')).toBeVisible()
  await expect(page.getByText('Adding pathology re-opens the DAX comparison and changes the rollout logic.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Save thread' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Attach to program' })).toBeVisible()
})
