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

    await page.goto('/tower');
    await expect(page.getByText('Control Tower')).toBeVisible();
    await expect(page.getByText('Tech Stack')).toBeVisible();
    await expect(page.getByText('Projects')).toBeVisible();
    await expect(page.getByText('Staff Aug')).toBeVisible();
    await expect(page.getByText('Volumetrics')).toBeVisible();

    await page.goto('/tower/projects');
    await expect(page.getByRole('heading', { name: 'Technology Projects' })).toBeVisible();

    await page.goto('/tower/staff-aug');
    await expect(page.getByRole('heading', { name: 'Staff Augmentation' })).toBeVisible();

    await page.goto('/tower/tech-stack');
    await expect(page.getByRole('heading', { name: 'Tech Stack' })).toBeVisible();

    await page.goto('/tower/volumetrics');
    await expect(page.getByRole('heading', { name: 'Volumetrics' })).toBeVisible();

    expect(runtimeErrors).toEqual([]);
  });
});
