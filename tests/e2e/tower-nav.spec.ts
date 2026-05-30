import { expect, test } from '@playwright/test';
import { withClerkAuth, missingAuthPrereqs } from './_helpers/auth';

test.describe('Tower navigation smoke', () => {
  test.skip(missingAuthPrereqs.length > 0, `Missing required env: ${missingAuthPrereqs.join(', ')}`);

  test('tower surfaces load without console errors across main sub-pages', async ({ page }) => {
    const runtimeErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') runtimeErrors.push(`console: ${msg.text()}`);
    });
    page.on('pageerror', (err) => {
      runtimeErrors.push(`pageerror: ${err.message}`);
    });

    await withClerkAuth(page, 'apexretail');

    // Tower index — locked AbarVa palette + locked-system tokens.
    await page.goto('/tower');
    await expect(page.getByText('Control Tower')).toBeVisible();

    // Real drilldown routes (no longer redirect-shells).
    await page.goto('/tower/portfolio');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    await page.goto('/tower/portfolio-dag');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    await page.goto('/tower/onboard');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    expect(runtimeErrors).toEqual([]);
  });
});
