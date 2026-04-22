import { expect, test } from '@playwright/test';
import { withClerkAuth, missingAuthPrereqs } from './_helpers/auth';
import { buildNdjsonStream, mockNdjsonRoute } from './_helpers/stream-mock';

const QUERY = 'How do retail teams typically sequence analytics modernization?';
const ANSWER =
  'Retail teams usually sequence analytics modernization in three moves: stabilize the data foundation, lock a priority use-case stack, and then migrate decision workflows in measured waves.';

test.describe('Intelligence ask', () => {
  test.skip(missingAuthPrereqs.length > 0, `Missing required env: ${missingAuthPrereqs.join(', ')}`);

  test('renders deterministic SSE answer and source cards', async ({ page }) => {
    await withClerkAuth(page, 'apexretail');

    await mockNdjsonRoute(page, /.*\/api\/intelligence\/ask\?q=.*/, buildNdjsonStream([
      {
        type: 'classified',
        classification: {
          intent: 'benchmark',
          entities: ['retail', 'analytics modernization'],
          confidence: 92,
        },
      },
      { type: 'delta', text: ANSWER.slice(0, 96) },
      { type: 'delta', text: ANSWER.slice(96) },
      {
        type: 'sources',
        sources: [
          {
            type: 'benchmark',
            name: 'Retail modernization benchmark pack',
            id: 'bench_001',
            detail: 'Peer sequencing across data foundation, use-case prioritization, and workflow migration.',
          },
          {
            type: 'pattern',
            name: 'Analytics modernization pattern',
            id: 'pattern_analytics_modernization',
            detail: 'Canonical pattern covering data platform rationalization and staged decision-workflow migration.',
          },
        ],
      },
      {
        type: 'followups',
        followups: [
          'What are the biggest failure modes?',
          'How should sponsors measure time-to-value?',
        ],
      },
    ]));

    await page.goto('/intelligence/ask');
    await expect(page.getByRole('heading', { name: 'Ask the knowledge layer' })).toBeVisible();

    const composer = page.getByPlaceholder(/How is Abridge typically deployed/i);
    await composer.fill(QUERY);
    await page.getByRole('button', { name: 'Ask' }).click();

    await expect(page.getByText(ANSWER)).toBeVisible();
    await expect(page.getByText('SOURCES')).toBeVisible();
    await expect(page.getByText('Retail modernization benchmark pack')).toBeVisible();
    await expect(page.getByText('Analytics modernization pattern')).toBeVisible();
    await expect(page.getByText('intent:')).toBeVisible();
    await expect(page.getByRole('button', { name: 'What are the biggest failure modes?' })).toBeVisible();
  });
});
