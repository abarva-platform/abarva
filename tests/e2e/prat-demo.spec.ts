import { test, expect } from '@playwright/test'
import { installIntelligenceMocks, pratQueries } from './intelligence-fixtures'

test('Prat demo script T0-T8 stays green through the full thread arc', async ({ page }) => {
  test.setTimeout(60_000)
  await installIntelligenceMocks(page)
  await page.goto('/demo/intelligence')

  await expect(page.getByText('$2.3M Abridge/DAX contradiction surfaced across ambient documentation work')).toBeVisible()

  await page.getByPlaceholder('What are health systems like us doing on ambient documentation?').fill(pratQueries.research)
  await page.getByRole('button', { name: 'Ask Nexus' }).click()
  await expect(page.getByText('Ambient documentation peers are clustering into two credible paths.')).toBeVisible()
  await expect(page.getByText('Ambient documentation cohort').first()).toBeVisible()

  await page.goto('/demo/intelligence?thread=thread-meridian')
  await page.getByPlaceholder('What are health systems like us doing on ambient documentation?').fill(pratQueries.grounded)
  await page.getByRole('button', { name: 'Ask Nexus' }).click()
  await expect(page.getByLabel('Nexus grounded matrix').getByText('DAX vs Abridge depends on the shape of the rollout you are actually committing to.')).toBeVisible()
  await expect(page.getByText('Program fit')).toBeVisible()

  await page.getByLabel('Nexus grounded matrix').getByRole('button', { name: 'Counter', exact: true }).click()
  await expect(page.getByText('Counter-position')).toBeVisible()

  await page.goto('/demo/intelligence?thread=thread-meridian')
  await page.getByLabel('Nexus grounded matrix').getByRole('button', { name: 'CFO', exact: true }).click()
  await expect(page.getByLabel('Nexus grounded crux').getByText('CFO lens')).toBeVisible()

  await page.goto('/demo/intelligence?thread=thread-meridian')
  await page.getByPlaceholder('What are health systems like us doing on ambient documentation?').fill(pratQueries.artifact)
  await page.getByRole('button', { name: 'Ask Nexus' }).click()
  await expect(page.getByText('EPHEMERAL · NOT CATALOGUED')).toBeVisible()

  await page.goto('/demo/intelligence?thread=thread-meridian')
  await page.getByPlaceholder('What are health systems like us doing on ambient documentation?').fill(pratQueries.contradiction)
  await page.getByRole('button', { name: 'Ask Nexus' }).click()
  await expect(page.getByText('contradiction self-check')).toBeVisible()
  await expect(page.getByText('Thread rail')).toBeVisible()

  await page.goto('/demo/intelligence?thread=thread-meridian')
  await page.getByPlaceholder('What are health systems like us doing on ambient documentation?').fill(pratQueries.pivot)
  await page.getByRole('button', { name: 'Ask Nexus' }).click()
  await expect(
    page.getByLabel('Nexus pivot one_sentence').getByText('This now wants to be treated as a program, not an ad hoc thread.'),
  ).toBeVisible({ timeout: 10_000 })

  await page.getByRole('button', { name: 'Scope as program' }).click()
  await expect(page).toHaveURL(/\/demo\/programs\/new\?source=intelligence_thread&threadId=thread-meridian/)
})
