// Primary-surface tenant matrix · A1 expansion
//
// Runs the primary-surfaces smoke spec across all three demo tenants
// in one suite. Complements `primary-surfaces-smoke.spec.ts` (which
// targets a single tenant via env vars) with a matrix run that proves
// every tenant lands correctly.
//
// Tenants exercised:
//   - Apex Retail Group (cio@apex-retail.example.com)
//   - Meridian Health System (cdio@meridian-health.example.com)
//   - First Capital Financial (cio@firstcapital.example.com)
//
// All three share password Demo2026! and access code 424242 per the
// canonical demo-account roster in `src/lib/auth/canonical-auth-roster.ts`.
//
// Run modes:
//   - Locally:    BASE_URL=http://localhost:3000 npx playwright test tests/e2e/primary-surfaces-tenant-matrix.spec.ts
//   - Staging:    BASE_URL=https://staging.abarva.ai npx playwright test tests/e2e/primary-surfaces-tenant-matrix.spec.ts
//   - Production: BASE_URL=https://app.abarva.ai npx playwright test tests/e2e/primary-surfaces-tenant-matrix.spec.ts
//
// Run on a single tenant only:
//   ONLY_TENANT=meridian npx playwright test tests/e2e/primary-surfaces-tenant-matrix.spec.ts
//
// Backlog: A1 (extension of PR #1945).

import { test, expect, type Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';
const ONLY_TENANT = process.env.ONLY_TENANT?.toLowerCase() ?? null;

interface TenantFixture {
  readonly key: 'apexretail' | 'meridian' | 'arcturus';
  readonly displayName: string;
  readonly email: string;
  readonly homeIdentityFragment: string;     // text expected on /home
  readonly briefHeadlineFragment: string;    // text expected in the V4 Brief headline
}

const TENANTS: ReadonlyArray<TenantFixture> = [
  {
    key: 'apexretail',
    displayName: 'Apex Retail Group',
    email: 'cio@apex-retail.example.com',
    homeIdentityFragment: 'Apex Retail',
    briefHeadlineFragment: 'Apex Retail Group',
  },
  {
    key: 'meridian',
    displayName: 'Meridian Health System',
    email: 'cdio@meridian-health.example.com',
    homeIdentityFragment: 'Meridian Health',
    briefHeadlineFragment: 'Meridian Health',
  },
  {
    key: 'arcturus',
    displayName: 'First Capital Financial',
    email: 'cio@firstcapital.example.com',
    homeIdentityFragment: 'First Capital',
    briefHeadlineFragment: 'First Capital',
  },
];

const PASSWORD = process.env.E2E_DEMO_PASSWORD ?? 'Demo2026!';
const ACCESS_CODE = process.env.E2E_DEMO_ACCESS_CODE ?? '424242';

async function typeCredential(page: Page, placeholder: RegExp, value: string): Promise<void> {
  const field = page.getByPlaceholder(placeholder);
  await field.fill('');
  await field.click();
  await page.keyboard.type(value, { delay: 4 });
  await expect(field).toHaveValue(value);
}

async function signInAsTenant(page: Page, tenant: TenantFixture): Promise<void> {
  await page.context().clearCookies();
  await page.goto(`${BASE_URL}/sign-in`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByPlaceholder(/name@company.com/i)).toBeVisible({
    timeout: 30_000,
  });
  await page.waitForFunction(
    () => Boolean((window as unknown as { Clerk?: { loaded?: boolean } }).Clerk?.loaded),
    null,
    { timeout: 30_000 },
  );
  await typeCredential(page, /name@company.com/i, tenant.email);
  await typeCredential(page, /Password from invite/i, PASSWORD);
  await typeCredential(page, /6-digit code/i, ACCESS_CODE);
  await expect(page.getByRole('button', { name: /sign in/i })).toBeEnabled({
    timeout: 10_000,
  });
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL(/\/home/, { timeout: 30_000 });
}

for (const tenant of TENANTS) {
  if (ONLY_TENANT && ONLY_TENANT !== tenant.key) {
    continue;
  }

  test.describe(`A1 matrix · ${tenant.displayName} (${tenant.key})`, () => {
    test.describe.configure({ mode: 'serial' });
    test.setTimeout(60_000);

    test.beforeEach(async ({ page }) => {
      page.on('pageerror', (err) => {
        throw new Error(`Page errored: ${err.message}`);
      });
      await signInAsTenant(page, tenant);
    });

    test('Home renders correct tenant identity', async ({ page }) => {
      await page.goto(`${BASE_URL}/home`);
      // Tenant identity is the load-bearing assertion. Locked-role pinning
      // (PR #1930) ensures a Meridian-cookie user can never see Apex's home,
      // and vice versa. If this fails, audit Probe #1923 + #1930 regressions.
      await expect(
        page.getByRole('heading', { name: tenant.displayName }),
      ).toBeVisible();
    });

    test('Intelligence Brief headline names the right tenant', async ({ page }) => {
      await page.goto(`${BASE_URL}/intelligence`);
      // L11 fix (PR #1923): V4 Brief headline is tenant-keyed. Confirms
      // we don't ship "Heliara Health" on the Meridian Brief (D-021 regression).
      const heading = page.getByRole('heading', { level: 1 });
      await expect(heading).toBeVisible();
      // The headline may include "for <tenant>" or "<tenant> this quarter";
      // accept either, but the tenant name must be in it.
      const text = (await heading.textContent()) ?? '';
      expect(text).toContain(tenant.briefHeadlineFragment);
    });

    test('Strategic Moves loads with portfolio header', async ({ page }) => {
      await page.goto(`${BASE_URL}/strategic-moves`);
      await expect(
        page.getByRole('heading', { name: /^Strategic Moves$/i }),
      ).toBeVisible();
    });

    test('Source loads with sourcing portfolio header', async ({ page }) => {
      await page.goto(`${BASE_URL}/source`);
      await expect(
        page.getByRole('heading', { name: /Sourcing events|Source/i }),
      ).toBeVisible();
    });

    test('Tower loads with Atlas rail mounted', async ({ page }) => {
      await page.goto(`${BASE_URL}/tower`);
      await expect(page.getByText(/^Atlas$/i).first()).toBeVisible();
    });
  });
}
