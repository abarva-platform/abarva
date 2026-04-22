import { test, expect } from '@playwright/test'
import { installIntelligenceMocks, pratQueries } from './intelligence-fixtures'

test('persona lens appends a CFO-weighted re-render', async ({ page }) => {
  await installIntelligenceMocks(page)
  await page.goto('/intelligence')

  await page.getByPlaceholder('What are health systems like us doing on ambient documentation?').fill(pratQueries.grounded)
  await page.getByRole('button', { name: 'Ask Nexus' }).click()
  await page.getByLabel('Nexus grounded matrix').getByRole('button', { name: 'CFO', exact: true }).click()

  const personaTurn = page.getByLabel('Nexus grounded crux')
  await expect(personaTurn.getByText('CFO lens')).toBeVisible()
  await expect(personaTurn.getByText('payback, downside case, and rollback triggers')).toBeVisible()
  await expect(personaTurn.getByText('same sources, re-weighted only')).toBeVisible()
})
