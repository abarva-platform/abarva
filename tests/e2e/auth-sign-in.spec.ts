import { expect, test } from '@playwright/test';
import { clerkUserExists, missingAuthPrereqs, withClerkAuth } from './_helpers/auth';
import { DEMO_ROLE_ACCOUNTS, type DemoRoleAccountKey } from './_helpers/demo-accounts';

const missingPrereqs = [...missingAuthPrereqs];

test.describe('Auth sign-in smoke', () => {
  test.skip(missingPrereqs.length > 0, `Missing required env: ${missingPrereqs.join(', ')}`);

  test('renders the Clerk sign-in surface', async ({ page }) => {
    await page.goto('/sign-in');
    await expect(page.getByPlaceholder('Enter your email address')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue', exact: true })).toBeVisible();
  });

  (Object.entries(DEMO_ROLE_ACCOUNTS) as Array<[DemoRoleAccountKey, (typeof DEMO_ROLE_ACCOUNTS)[DemoRoleAccountKey]]>).forEach(
    ([accountKey, account]) => {
      test(`${accountKey} lands on the correct shell after sign-in`, async ({ page }) => {
        test.skip(!(await clerkUserExists(account.email)), `No Clerk user found for ${account.email}`);

        await withClerkAuth(page, { email: account.email });
        await page.goto('/auth-redirect');
        await page.waitForURL(account.expectedPath, { timeout: 15000 });

        if (account.pageMarker.kind === 'link') {
          await expect(page.getByRole('link', { name: account.pageMarker.label, exact: true })).toBeVisible();
        } else {
          await expect(page.getByText(account.pageMarker.label, { exact: false }).first()).toBeVisible();
        }

        if (account.visibleNav.length > 0 || account.hiddenNav.length > 0) {
          for (const label of account.visibleNav) {
            await expect(page.getByRole('link', { name: label, exact: true })).toBeVisible();
          }

          for (const label of account.hiddenNav) {
            await expect(page.getByRole('link', { name: label, exact: true })).toHaveCount(0);
          }
        }

        const signOutButton = page.getByRole('button', { name: /sign out/i });
        if (await signOutButton.isVisible().catch(() => false)) {
          await signOutButton.click();
          await page.waitForURL(/\/$/, { timeout: 15000 });
        }
      });
    },
  );
});
