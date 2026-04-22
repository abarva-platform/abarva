import { expect, test } from '@playwright/test';
import { missingAuthPrereqs, withClerkAuth } from './_helpers/auth';

const PROGRAM_ID = 'unified-customer-data-platform';
const MODULE_KEY = 'stakeholder-map';

test.describe('Programs module sub-page', () => {
  test.skip(missingAuthPrereqs.length > 0, `Missing required env: ${missingAuthPrereqs.join(', ')}`);

  test('module workspace renders and navigates back to the program overview', async ({ page }) => {
    await withClerkAuth(page, { activeClient: 'apex' });

    await page.goto(`/programs/${PROGRAM_ID}/module/${MODULE_KEY}`, { waitUntil: 'domcontentloaded' });

    await expect(page).toHaveURL(new RegExp(`/programs/${PROGRAM_ID}/module/${MODULE_KEY}$`));
    await expect(page.getByText('Module workspace', { exact: true })).toBeVisible();
    await expect(
      page.locator('.programs-card.programs-section').nth(1).getByText('Stakeholder Map', { exact: true }),
    ).toBeVisible();
    await expect(page.getByText('Dana Mercer', { exact: true })).toBeVisible();
    await expect(page.getByText('Arjun Patel', { exact: true })).toBeVisible();

    const overviewLink = page.getByRole('link', { name: 'Overview' });
    await expect(overviewLink).toBeVisible();
    await overviewLink.click();

    await expect(page).toHaveURL(new RegExp(`/programs/${PROGRAM_ID}$`));
    await expect(page.getByRole('tab', { name: 'Journey' })).toBeVisible();
  });
});
