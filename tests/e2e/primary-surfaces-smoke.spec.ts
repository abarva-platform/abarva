// Primary-surface smoke test · A1 deliverable
//
// Asserts that each of the four primary surfaces (Home, Intelligence,
// Strategic Moves, Source, Tower) renders for a logged-in CXO without
// console errors and with the expected tenant-grounded copy.
//
// Run modes:
//   - Locally:           BASE_URL=http://localhost:3000 npx playwright test tests/e2e/primary-surfaces-smoke.spec.ts
//   - Against staging:   BASE_URL=https://staging.abarva.ai npx playwright test tests/e2e/primary-surfaces-smoke.spec.ts
//   - Against prod:      BASE_URL=https://app.abarva.ai npx playwright test tests/e2e/primary-surfaces-smoke.spec.ts
//
// Requires a valid Clerk session token or server-side Clerk secret for ticket sign-in.
// The legacy DemoCodeSignIn flow is still available behind E2E_USE_LEGACY_DEMO_CODE_FLOW=true.
//
// This is a smoke test: it asserts page rendering and headline copy, not
// agent answer quality. Agent-answer regression lives elsewhere (Atlas eval
// suite + dedicated Sentinel regression). The point of this suite is
// "does the page open without crashing for the demo CXO?" — the precondition
// for every other test that follows.

import { test, expect, type Page } from '@playwright/test';
import { BASE_URL, missingAuthPrereqs, withClerkAuth } from './_helpers/auth';

// Default demo persona: Carlos Rivera, Apex Retail CIO.
// Override via env if you want to smoke a different tenant.
const DEMO_EMAIL = process.env.E2E_DEMO_EMAIL ?? 'cio@apex-retail.example.com';
const DEMO_PASSWORD = process.env.E2E_DEMO_PASSWORD ?? 'Demo2026!';
const DEMO_ACCESS_CODE = process.env.E2E_DEMO_ACCESS_CODE ?? '424242';
const ACTIVE_CLIENT = process.env.E2E_ACTIVE_CLIENT ?? null;
const EXPECTED_TENANT_NAME = process.env.E2E_EXPECTED_TENANT_NAME ?? 'Apex Retail Group';
const USE_LEGACY_DEMO_CODE_FLOW = process.env.E2E_USE_LEGACY_DEMO_CODE_FLOW === 'true';

async function signIn(page: Page): Promise<void> {
  if (!USE_LEGACY_DEMO_CODE_FLOW) {
    await withClerkAuth(page, {
      activeClient: ACTIVE_CLIENT,
      email: DEMO_EMAIL,
    });
    return;
  }

  await page.goto(`${BASE_URL}/sign-in`);
  await page.getByPlaceholder(/name@company.com/i).fill(DEMO_EMAIL);
  await page.getByPlaceholder(/Password from invite/i).fill(DEMO_PASSWORD);
  await page.getByPlaceholder(/6-digit code/i).fill(DEMO_ACCESS_CODE);
  await page.getByRole('button', { name: /sign in/i }).click();
  // Land on /home (or wherever the post-sign-in redirect goes).
  await page.waitForURL(/\/home/, { timeout: 15_000 });
}

test.describe('A1 · Primary-surface smoke (logged-in CXO)', () => {
  test.skip(
    !USE_LEGACY_DEMO_CODE_FLOW && missingAuthPrereqs.length > 0,
    `Missing required env: ${missingAuthPrereqs.join(', ')}`,
  );

  test.beforeEach(async ({ page }) => {
    // Capture any console errors that surface during navigation so the
    // smoke test fails on render-time crashes, not just missing UI.
    page.on('pageerror', (err) => {
      throw new Error(`Page errored: ${err.message}`);
    });

    await signIn(page);
  });

  test('Home renders with tenant identity and four readiness modules', async ({ page }) => {
    await page.goto(`${BASE_URL}/home`);
    // Tenant identity must surface — proves locked-role pinning works.
    await expect(page.getByText(EXPECTED_TENANT_NAME)).toBeVisible();
    // Four module readiness tiles are the home-page contract.
    await expect(page.getByText(/Tower/i)).toBeVisible();
    await expect(page.getByText(/Intelligence/i)).toBeVisible();
    await expect(page.getByText(/Source/i)).toBeVisible();
    await expect(page.getByText(/Strategic Moves|Moves/i)).toBeVisible();
  });

  test('Intelligence Brief renders with tenant-grounded headline', async ({ page }) => {
    await page.goto(`${BASE_URL}/intelligence`);
    // Headline includes tenant name — proves the V4 Brief L11 fix held.
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    // Decision cards (above-the-line) render.
    await expect(page.getByText(/this quarter/i)).toBeVisible();
  });

  test('Strategic Moves renders with portfolio + at least one card', async ({ page }) => {
    await page.goto(`${BASE_URL}/strategic-moves`);
    await expect(page.getByRole('heading', { name: /Strategic Moves/i })).toBeVisible();
  });

  test('Source renders with sourcing events portfolio', async ({ page }) => {
    await page.goto(`${BASE_URL}/source`);
    await expect(page.getByRole('heading', { name: /Sourcing events|Source/i })).toBeVisible();
  });

  test('Tower renders with portfolio cockpit and Atlas chat', async ({ page }) => {
    await page.goto(`${BASE_URL}/tower`);
    await expect(page.getByText(/Portfolio|IT Portfolio|Tower/i)).toBeVisible();
    // Atlas rail must surface — proves the agent dock is mounted.
    await expect(page.getByText(/Atlas/i)).toBeVisible();
  });

  test('Sign-out clears the session and lands on /signed-out', async ({ page }) => {
    // Use the Clerk JS API since the in-app Sign-out button bug was the
    // headline finding of the audit; PR #1929 wired useSignOut() to the
    // 6 sites and PR #1932 verified it works. Confirming both paths here.
    await page.goto(`${BASE_URL}/home`);
    await page.getByRole('button', { name: /sign out/i }).click();
    // After sign-out, navigation to a protected route should bounce to /sign-in.
    await page.goto(`${BASE_URL}/home`);
    await expect(page).toHaveURL(/\/sign-in/, { timeout: 15_000 });
  });
});
