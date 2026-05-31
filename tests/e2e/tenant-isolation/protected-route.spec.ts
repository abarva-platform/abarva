import { expect, test } from '@playwright/test';

import { CLERK_SECRET_KEY, withClerkAuth } from '../_helpers/auth';
import { TENANT_ISOLATION_PERSONAS } from './fixtures/personas';

test.describe('Wave 0 tenant isolation · protected routes', () => {
  const missingServerTicketPrereqs = CLERK_SECRET_KEY ? [] : ['CLERK_SECRET_KEY'];

  test.skip(
    missingServerTicketPrereqs.length > 0,
    `Missing required env: ${missingServerTicketPrereqs.join(', ')}. This gate requires per-persona Clerk server-ticket sign-in.`,
  );

  for (const persona of TENANT_ISOLATION_PERSONAS) {
    test(`${persona.displayName} sees only its own home context`, async ({ page }) => {
      await withClerkAuth(page, {
        sessionToken: null,
        activeClient: persona.tenantKey,
        email: persona.email,
      });

      await page.goto(persona.homeRoute);
      await expect(page.locator('body')).toContainText(persona.expectedText);
      await expect(page.locator('body')).not.toContainText(persona.forbiddenText);
    });
  }
});
