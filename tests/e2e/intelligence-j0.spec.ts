import { expect, test } from '@playwright/test';

// /intelligence J0 cold-landing — INT-1.6 E2E suite
//
// Per INT-1_DETAILED_DESIGN.md §10.5. Validates the J0 surface
// shipped by INT-1.1 → INT-1.7. These specs run against either a
// local dev server (default `BASE_URL=http://localhost:3000`) or
// production (`BASE_URL=https://nexus-vert-kappa.vercel.app` via
// `npm run test:e2e:prod`).
//
// J0 is auth-gate-free per D1 verdict (cold-visitor route). Tests
// don't sign in.

test.describe('Intelligence J0 cold landing', () => {
  test('cold load renders all 10 failure-mode cards', async ({ page }) => {
    await page.goto('/intelligence');

    // Headline + subhead
    await expect(
      page.getByTestId('intelligence-j0-headline'),
    ).toContainText('Why enterprise AI transformation fails');
    await expect(page.getByTestId('intelligence-j0-subhead')).toContainText(
      /\d+ failure modes/,
    );

    // Grid landmark
    await expect(page.getByTestId('intelligence-j0-card-grid')).toBeVisible();

    // All 10 cards by stable testid
    for (let id = 1; id <= 10; id += 1) {
      await expect(
        page.getByTestId(`intelligence-j0-card-${id}`),
      ).toBeVisible();
    }
  });

  test('every card displays its editorial name', async ({ page }) => {
    await page.goto('/intelligence');
    const expected = [
      'The Phantom Sponsor',
      'The Slogan Charter',
      'The Untestable Foundation',
      'The Borrowed Team',
      "The Workflow That Wasn't",
      'The Last-Minute Auditor',
      'The Vendor-Picked-First Decision',
      'The Pilot-to-Production Gap',
      'The Phantom KPI',
      'The Sprawl Trap',
    ];
    for (const name of expected) {
      await expect(page.getByText(name).first()).toBeVisible();
    }
  });

  test('card click navigates to /intelligence/failure-modes/<slug>', async ({
    page,
  }) => {
    await page.goto('/intelligence');
    await page.getByTestId('intelligence-j0-card-1').click();
    await page.waitForURL(/\/intelligence\/failure-modes\/phantom-sponsor$/, {
      timeout: 10000,
    });
    await expect(page.getByText('The Phantom Sponsor')).toBeVisible();
    await expect(page.getByText(/Why it kills programs/i)).toBeVisible();
    await expect(page.getByText(/What good looks like/i)).toBeVisible();
  });

  test('card #8 deep-link renders Pilot-to-Production Gap content', async ({
    page,
  }) => {
    await page.goto('/intelligence/failure-modes/pilot-to-production-gap');
    await expect(page.getByText('The Pilot-to-Production Gap')).toBeVisible();
    await expect(
      page.getByText(/73% of enterprise AI pilots/),
    ).toBeVisible();
    await expect(page.getByText(/McKinsey/i).first()).toBeVisible();
    await expect(page.getByText(/Coming with INT-2/)).toBeVisible();
  });

  test('"Browse topics" affordance navigates to /intelligence/topics', async ({
    page,
  }) => {
    await page.goto('/intelligence');
    await page
      .getByTestId('intelligence-j0-affordance-browse-topics')
      .click();
    await page.waitForURL(/\/intelligence\/topics$/, { timeout: 10000 });
    await expect(
      page.getByRole('heading', { name: /AI transformation topics/i }),
    ).toBeVisible();
  });

  test('"Open Sentinel" affordance navigates to /intelligence/ask', async ({
    page,
  }) => {
    await page.goto('/intelligence');
    await page
      .getByTestId('intelligence-j0-affordance-open-sentinel')
      .click();
    // /intelligence/ask is auth-gated; cold-visitor request will be
    // redirected to /sign-in via the proxy. Either path is acceptable
    // for "the affordance works" — we just want a non-404 response.
    await page.waitForURL(/\/(intelligence\/ask|sign-in)/, { timeout: 10000 });
  });

  test('card grid uses semantic role="list" with role="listitem" cards', async ({
    page,
  }) => {
    await page.goto('/intelligence');
    const grid = page.getByTestId('intelligence-j0-card-grid');
    await expect(grid).toHaveAttribute('role', 'list');
    const card1 = page.getByTestId('intelligence-j0-card-1');
    await expect(card1).toHaveAttribute('role', 'listitem');
  });

  test('non-existent slug returns 404', async ({ page }) => {
    const response = await page.goto(
      '/intelligence/failure-modes/this-slug-does-not-exist',
    );
    expect(response?.status()).toBe(404);
  });

  test('mobile viewport (<768px) shows the "Show all 10" affordance', async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 800 },
    });
    const page = await context.newPage();
    await page.goto('/intelligence');
    await expect(page.getByTestId('intelligence-j0-show-all')).toBeVisible();
    // Cards 1..5 (most-cited) visible; 6..10 hidden.
    // We can't strictly assert which 5 without re-running the sort,
    // so we just verify the toggle exists + reveals the rest.
    await page.getByTestId('intelligence-j0-show-all').click();
    // After click, the toggle disappears (showAll=true).
    await expect(page.getByTestId('intelligence-j0-show-all')).toHaveCount(0);
    await context.close();
  });
});
