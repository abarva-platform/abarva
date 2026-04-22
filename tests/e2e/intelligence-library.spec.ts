import { expect, test } from '@playwright/test';
import { missingAuthPrereqs, withClerkAuth } from './_helpers/auth';

const missingPrereqs = [...missingAuthPrereqs];

test.describe('Intelligence library', () => {
  test.skip(missingPrereqs.length > 0, `Missing required env: ${missingPrereqs.join(', ')}`);

  test('redirects into the library and opens a pattern detail from the catalog', async ({ page }) => {
    await withClerkAuth(page, { email: 'anand+clerk_test@abarva.com', activeClient: 'meridian' });

    await page.goto('/intelligence');
    await page.waitForURL(/\/intelligence\/library$/, { timeout: 15000 });

    await expect(page.getByRole('heading', { name: 'What AbarVa knows' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Ask →' })).toBeVisible();
    await expect(page.getByText('FEATURED SHELF · start here')).toBeVisible();

    await page.locator('a[href="/intelligence/library?category=pattern"]').first().click();
    await page.waitForURL(/\/intelligence\/library\?category=pattern$/, { timeout: 15000 });
    await expect(page.getByText('F008 · AI investment without verified ROI')).toBeVisible();

    await page.locator('a[href^="/intelligence/patterns?code="]').first().click();
    await page.waitForURL(/\/intelligence\/patterns\?code=/, { timeout: 15000 });
    await expect(page.getByText('Genome Intelligence')).toBeVisible();
  });
});
