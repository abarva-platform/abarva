import { expect, test } from '@playwright/test';

test('Wave 0 tenant isolation · protected route redirects without auth', async ({ page }) => {
  await page.goto('/home');

  await expect
    .poll(() => page.url(), { timeout: 10_000 })
    .toMatch(/\/sign-in|clerk|session-expired|signed-out/i);
});
