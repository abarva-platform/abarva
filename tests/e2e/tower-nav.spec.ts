import { expect, test } from '@playwright/test';
import { withClerkAuth, missingAuthPrereqs } from './_helpers/auth';

test.describe('Tower navigation smoke', () => {
  test.skip(missingAuthPrereqs.length > 0, `Missing required env: ${missingAuthPrereqs.join(', ')}`);

  test('AI Control Tower loads without console errors on the consolidated route', async ({ page }) => {
    const runtimeErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') runtimeErrors.push(`console: ${msg.text()}`);
    });
    page.on('pageerror', (err) => {
      runtimeErrors.push(`pageerror: ${err.message}`);
    });

    await withClerkAuth(page, 'apexretail');

    await page.goto('/tower');
    await expect(page.getByRole('heading', { name: 'AI Control Tower.' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Value and adoption/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Actions/i })).toBeVisible();

    expect(runtimeErrors).toEqual([]);
  });
});
