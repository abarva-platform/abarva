import { expect, test } from '@playwright/test';
import { missingAuthPrereqs, withClerkAuth } from './_helpers/auth';

const missingPrereqs = [...missingAuthPrereqs];

test.describe('Intelligence foundation browse', () => {
  test.skip(missingPrereqs.length > 0, `Missing required env: ${missingPrereqs.join(', ')}`);

  test('filters the library by industry and category facets', async ({ page }) => {
    await withClerkAuth(page, { email: 'anand+clerk_test@abarva.com', activeClient: 'meridian' });

    await page.goto('/intelligence/library');
    await expect(page.getByRole('heading', { name: 'What AbarVa knows' })).toBeVisible();

    await page.locator('a[href="/intelligence/library?industry=HEALTHCARE_IDN"]').first().click();
    await page.waitForURL(/\/intelligence\/library\?industry=HEALTHCARE_IDN$/, { timeout: 15000 });
    await expect(page.getByText('Prior Authorization Automation')).toBeVisible();
    await page.locator('a[href=\"/intelligence/library?category=topic&industry=HEALTHCARE_IDN\"]').first().click();
    await page.waitForURL(/\/intelligence\/library\?category=topic&industry=HEALTHCARE_IDN$/, { timeout: 15000 });
    await expect(page.getByText('AI Governance Implementation')).toBeVisible();
    await expect(page.getByText('Prior Authorization Automation')).toBeVisible();
  });
});
