import { expect, test } from '@playwright/test';

import { CLERK_SECRET_KEY, withClerkAuth } from '../_helpers/auth';
import { TENANT_ISOLATION_PERSONAS } from './fixtures/personas';

test.describe('Wave 0 tenant isolation · cross-client probe', () => {
  const missingServerTicketPrereqs = CLERK_SECRET_KEY ? [] : ['CLERK_SECRET_KEY'];

  test.skip(
    missingServerTicketPrereqs.length > 0,
    `Missing required env: ${missingServerTicketPrereqs.join(', ')}. This gate requires per-persona Clerk server-ticket sign-in.`,
  );

  for (const persona of TENANT_ISOLATION_PERSONAS) {
    for (const forbiddenPersona of TENANT_ISOLATION_PERSONAS) {
      if (forbiddenPersona.tenantKey === persona.tenantKey) continue;

      test(`${persona.displayName} network and DOM ignore requested ${forbiddenPersona.displayName}`, async ({ page }) => {
        const responseBodies: string[] = [];
        page.on('response', async (response) => {
          const url = response.url();
          if (!/\/api\/|\/admin|\/home|\/tower|\/intelligence/.test(url)) return;
          const text = await response.text().catch(() => '');
          if (text) responseBodies.push(text.slice(0, 20_000));
        });

        await withClerkAuth(page, {
          sessionToken: null,
          activeClient: persona.tenantKey,
          email: persona.email,
        });

        await page.goto(`/home?client=${forbiddenPersona.tenantKey}`);
        await page.waitForLoadState('domcontentloaded');

        const body = await page.locator('body').innerText();
        expect(body).toMatch(persona.expectedText);
        expect(body).not.toMatch(forbiddenPersona.expectedText);
        expect(responseBodies.join('\n')).not.toMatch(forbiddenPersona.expectedText);
      });
    }
  }
});
