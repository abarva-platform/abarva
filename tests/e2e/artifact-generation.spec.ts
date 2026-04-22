import { test, expect } from '@playwright/test'
import { installIntelligenceMocks, pratQueries } from './intelligence-fixtures'

test('artifact generation renders the CTA row with ephemeral governance', async ({ page }) => {
  await installIntelligenceMocks(page)
  await page.goto('/intelligence')

  await page.getByPlaceholder('What are health systems like us doing on ambient documentation?').fill(pratQueries.artifact)
  await page.getByRole('button', { name: 'Ask Nexus' }).click()

  await expect(page.getByText('CMIO decision brief')).toBeVisible()
  await expect(page.getByText('Ambient documentation decision brief')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Download PDF' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Download HTML' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Copy' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Attach to Program' })).toBeVisible()
  await expect(page.getByText('EPHEMERAL · NOT CATALOGUED')).toBeVisible()
})
