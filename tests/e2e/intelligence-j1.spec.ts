import { expect, test } from '@playwright/test';

// /intelligence/topics + /intelligence/topics/[topicId] +
// enhanced /intelligence/failure-modes/[slug] — INT-2.7 E2E suite
//
// Per INT-2_DETAILED_DESIGN.md §10.4. Validates the J1 surfaces
// shipped by INT-2.1 → INT-2.6.
//
// Routes are public (auth-gate-removed in INT-1.3 for /intelligence
// and INT-2 inherits that for /intelligence/topics +
// /intelligence/topics/<topicId>; failure-modes also public).
// Tests don't sign in.

test.describe('Intelligence J1 oriented browse', () => {
  test('cold load of /intelligence/topics renders all 10 topic cards', async ({
    page,
  }) => {
    await page.goto('/intelligence/topics');

    await expect(
      page.getByRole('heading', { name: /AI transformation topics/i }),
    ).toBeVisible();

    await expect(
      page.getByTestId('intelligence-j1-topics-grid'),
    ).toBeVisible();

    const expectedIds = [
      'ai-use-case-portfolio-management',
      'analytics-modernization',
      'data-foundation-readiness',
      'ai-governance-and-risk',
      'vendor-and-platform-decisions',
      'pilot-to-production-scaling',
      'workflow-and-operating-model-change',
      'outcome-measurement-and-attribution',
      'specialized-industry-applications',
      'talent-and-skills',
    ];
    for (const id of expectedIds) {
      await expect(
        page.getByTestId(`intelligence-j1-topic-card-${id}`),
      ).toBeVisible();
    }
  });

  test('topic card click navigates to /intelligence/topics/<topicId>', async ({
    page,
  }) => {
    await page.goto('/intelligence/topics');
    await page
      .getByTestId('intelligence-j1-topic-card-pilot-to-production-scaling')
      .click();
    await page.waitForURL(
      /\/intelligence\/topics\/pilot-to-production-scaling$/,
      { timeout: 10000 },
    );
    await expect(page.getByText('Pilot-to-production scaling')).toBeVisible();
    await expect(
      page.getByText(/73% of enterprise AI pilots/),
    ).toBeVisible();
  });

  test('topic deep-dive renders thesis + what-gets-wrong + what-good-looks-like', async ({
    page,
  }) => {
    await page.goto('/intelligence/topics/data-foundation-readiness');
    await expect(
      page.getByTestId('intelligence-j1-topic-what-gets-wrong'),
    ).toBeVisible();
    await expect(
      page.getByTestId('intelligence-j1-topic-what-good-looks-like'),
    ).toBeVisible();
    await expect(page.getByText(/Data foundation readiness/)).toBeVisible();
    await expect(page.getByText(/Associated patterns/i)).toBeVisible();
  });

  test('topic deep-dive renders associated pattern cards', async ({ page }) => {
    await page.goto('/intelligence/topics/pilot-to-production-scaling');
    // Pattern cards have testid prefix 'intelligence-j1-topic-pattern-card-'.
    // The associated patterns include pattern_demand_forecasting_inventory_ai.
    await expect(
      page.getByTestId(
        'intelligence-j1-topic-pattern-card-pattern_demand_forecasting_inventory_ai',
      ),
    ).toBeVisible();
  });

  test('topic deep-dive related failure-mode chip navigates back to FM page', async ({
    page,
  }) => {
    await page.goto('/intelligence/topics/pilot-to-production-scaling');
    // Failure mode #8 (Pilot-to-production scaling gap).
    await page.getByTestId('intelligence-j1-topic-failure-mode-link-8').click();
    await page.waitForURL(
      /\/intelligence\/failure-modes\/pilot-to-production-gap$/,
      { timeout: 10000 },
    );
    await expect(page.getByText('The Pilot-to-Production Gap')).toBeVisible();
  });

  test('"Ask Sentinel about this topic" navigates to /intelligence/ask', async ({
    page,
  }) => {
    await page.goto('/intelligence/topics/ai-governance-and-risk');
    await page.getByTestId('intelligence-j1-topic-ask-sentinel').click();
    // /intelligence/ask is auth-gated; redirect to /sign-in is acceptable.
    await page.waitForURL(/\/(intelligence\/ask|sign-in)/, { timeout: 10000 });
  });

  test('unknown topic id returns 404', async ({ page }) => {
    const response = await page.goto(
      '/intelligence/topics/this-topic-does-not-exist',
    );
    expect(response?.status()).toBe(404);
  });

  test('failure-mode page renders enhanced pattern cards', async ({ page }) => {
    await page.goto('/intelligence/failure-modes/pilot-to-production-gap');
    // Pattern cards with new testid pattern from INT-2.4.
    await expect(
      page.getByTestId(
        'intelligence-j1-failure-mode-pattern-card-pattern_demand_forecasting_inventory_ai',
      ),
    ).toBeVisible();
  });

  test('failure-mode page renders related topics with click navigation', async ({
    page,
  }) => {
    await page.goto('/intelligence/failure-modes/pilot-to-production-gap');
    const relatedTopic = page.getByTestId(
      'intelligence-j1-failure-mode-related-topic-pilot-to-production-scaling',
    );
    await expect(relatedTopic).toBeVisible();
    await relatedTopic.click();
    await page.waitForURL(
      /\/intelligence\/topics\/pilot-to-production-scaling$/,
      { timeout: 10000 },
    );
  });

  test('topic grid uses semantic role="list" + role="listitem"', async ({
    page,
  }) => {
    await page.goto('/intelligence/topics');
    const grid = page.getByTestId('intelligence-j1-topics-grid');
    await expect(grid).toHaveAttribute('role', 'list');
    const card = page.getByTestId(
      'intelligence-j1-topic-card-talent-and-skills',
    );
    await expect(card).toHaveAttribute('role', 'listitem');
  });

  test('breadcrumb terminal items have aria-current="page"', async ({
    page,
  }) => {
    await page.goto('/intelligence/topics');
    const topicsBreadcrumb = page.getByText('Topics', { exact: true }).last();
    await expect(topicsBreadcrumb).toHaveAttribute('aria-current', 'page');
  });
});
