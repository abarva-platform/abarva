import { expect, test } from '@playwright/test';
import { missingAuthPrereqs, withClerkAuth } from './_helpers/auth';

const PROGRAM_ID = 'contact-center-ai-transformation';
const EXPECTED_ORDER = [
  'Agent-assist operating model locked',
  'Salesforce Commerce + service integration wave',
  'NVIDIA AI Enterprise tuning sprint',
  'Cost takeout attribution audit',
];

test.describe('Programs timeline sub-page', () => {
  test.skip(missingAuthPrereqs.length > 0, `Missing required env: ${missingAuthPrereqs.join(', ')}`);

  test('timeline renders execute milestones in seeded order', async ({ page }) => {
    await withClerkAuth(page, { activeClient: 'apex' });

    await page.goto(`/programs/${PROGRAM_ID}/timeline`, { waitUntil: 'domcontentloaded' });

    await expect(page).toHaveURL(new RegExp(`/programs/${PROGRAM_ID}/timeline$`));
    await expect(page.getByText('Planned versus actual')).toBeVisible();
    await expect(page.getByText('Static timeline shell for the demo', { exact: false })).toBeVisible();

    for (const milestone of EXPECTED_ORDER) {
      await expect(page.getByText(milestone)).toBeVisible();
    }

    const rowTexts = await page.locator('.programs-list-item').evaluateAll((nodes) =>
      nodes.map((node) => node.textContent ?? ''),
    );
    const positions = EXPECTED_ORDER.map((label) => rowTexts.findIndex((text) => text.includes(label)));

    expect(positions.every((position) => position >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });
});
