import { expect, test, type Page } from '@playwright/test';
import { findPersonaByEmail } from '../../src/lib/auth/cxo-personas';
import { clerkUserExists, missingAuthPrereqs, withClerkAuth } from './_helpers/auth';

const APEX_CIO_EMAIL = 'cio@apex-retail.example.com';
const APEX_CIO = findPersonaByEmail(APEX_CIO_EMAIL);
const APEX_DEMO_MOVE_ID = process.env.APEX_DEMO_MOVE_ID ?? 'b7b90f51-72cd-4ea1-93b8-285d484063c9';

if (!APEX_CIO) {
  throw new Error(`Missing CXO persona fixture for ${APEX_CIO_EMAIL}`);
}

async function expectNoRuntimeError(page: Page) {
  await expect(page.getByText(/Application error|Unhandled Runtime Error|Internal Server Error/i)).toHaveCount(0);
}

test.describe('CXO journey: Apex CIO', () => {
  test.describe.configure({ mode: 'serial' });

  test.skip(missingAuthPrereqs.length > 0, `Missing required env: ${missingAuthPrereqs.join(', ')}`);

  test.beforeEach(async ({ page }) => {
    test.skip(!(await clerkUserExists(APEX_CIO.email)), `No Clerk user found for ${APEX_CIO.email}`);

    await withClerkAuth(page, {
      activeClient: APEX_CIO.clientKey,
      email: APEX_CIO.email,
    });
  });

  test('signs in as the Apex CIO and lands on Apex Home', async ({ page }) => {
    await page.goto('/auth-redirect');
    await page.waitForURL(/\/home\?client=apexretail$/, { timeout: 15000 });

    await expect(page.getByTestId('tenant-home-page')).toBeVisible();
    await expect(page.getByText(APEX_CIO.tenant, { exact: false }).first()).toBeVisible();
    await expectNoRuntimeError(page);
  });

  test('loads Intelligence without a runtime error', async ({ page }) => {
    await page.goto('/intelligence');

    await expect(page.getByTestId('intelligence-v3-page')).toBeVisible();
    await expect(page.getByRole('tab', { name: /The Brief/i })).toBeVisible();
    await expectNoRuntimeError(page);
  });

  test('loads Strategic Moves with the new Move action visible', async ({ page }) => {
    await page.goto('/strategic-moves');

    await expect(page.getByRole('heading', { level: 1, name: 'Strategic Moves' })).toBeVisible();
    await expect(page.getByRole('link', { name: /\+?\s*New Move/i })).toBeVisible();
    await expectNoRuntimeError(page);
  });

  test('renders the first Move walkthrough content', async ({ page }) => {
    await page.goto('/home/learn/first-move');

    await expect(page.getByRole('navigation', { name: 'Learn sections' }).first()).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: 'First Move walkthrough' })).toBeVisible();
    await expect(page.getByText('Contact Center AI Routing')).toBeVisible();
    await expectNoRuntimeError(page);
  });

  test('generates a Nexus current-state brief for the Apex demo Move', async ({ page }) => {
    await page.goto(`/strategic-moves/${APEX_DEMO_MOVE_ID}`);

    await expect(page.getByRole('heading', { level: 1, name: 'Contact Center AI Routing' })).toBeVisible();
    await page.getByRole('button', { name: 'Generate brief' }).click();

    await expect(page.getByRole('heading', { name: 'Org Structure & Decision Rights' })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('heading', { name: 'Technology Landscape' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Financial Baselines & Value Levers' })).toBeVisible();
    await expect(page.getByLabel('Ask Nexus a current-state question')).toBeVisible();
    await expectNoRuntimeError(page);
  });
});
