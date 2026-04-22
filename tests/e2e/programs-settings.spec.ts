import { expect, test } from '@playwright/test';
import { missingAuthPrereqs, withClerkAuth } from './_helpers/auth';

const PROGRAM_ID = 'contact-center-ai-transformation';

test.describe('Programs settings sub-page', () => {
  test.skip(missingAuthPrereqs.length > 0, `Missing required env: ${missingAuthPrereqs.join(', ')}`);

  test('settings page renders the current static controls and placeholders', async ({ page }) => {
    await withClerkAuth(page, { activeClient: 'apex' });

    await page.goto(`/programs/${PROGRAM_ID}/settings`, { waitUntil: 'domcontentloaded' });

    await expect(page).toHaveURL(new RegExp(`/programs/${PROGRAM_ID}/settings$`));
    await expect(page.getByText('Pattern binding', { exact: true })).toBeVisible();
    await expect(
      page.locator('.programs-grid-auto .programs-section').first().getByText('Contact Center AI Transformation', { exact: true }),
    ).toBeVisible();
    await expect(page.getByText('Notifications', { exact: true })).toBeVisible();
    await expect(page.getByText('Retention', { exact: true })).toBeVisible();
    await expect(page.getByText('read-only after origination in the mocked frontend', { exact: false })).toBeVisible();
  });
});
