import { expect, test } from '@playwright/test';
import { missingAuthPrereqs, withClerkAuth } from './_helpers/auth';

const PROGRAM_ID = 'contact-center-ai-transformation';

test.describe('Programs team sub-page', () => {
  test.skip(missingAuthPrereqs.length > 0, `Missing required env: ${missingAuthPrereqs.join(', ')}`);

  test('team roster renders sponsor, lead, and workstream coverage', async ({ page }) => {
    await withClerkAuth(page, { activeClient: 'apex' });

    await page.goto(`/programs/${PROGRAM_ID}/team`, { waitUntil: 'domcontentloaded' });

    await expect(page).toHaveURL(new RegExp(`/programs/${PROGRAM_ID}/team$`));
    await expect(page.getByText('Participants and workstreams')).toBeVisible();
    await expect(page.getByText('Dana Mercer')).toBeVisible();
    await expect(page.getByText('Alex Kim')).toBeVisible();
    await expect(page.getByText('Marcus Hale')).toBeVisible();
    await expect(page.getByText('Store and service sponsor')).toBeVisible();
    await expect(page.getByText('Execution lead')).toBeVisible();
    await expect(page.getByText('Platform integration')).toBeVisible();
  });
});
