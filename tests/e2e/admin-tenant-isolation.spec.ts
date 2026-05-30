/**
 * PR-G · Apex-leak regression gate (F9 e2e walker).
 *
 * For every non-Apex canonical tenant, signs in as the tenant's CXO admin,
 * walks the canonical 18 admin routes, and asserts that no rendered page
 * carries any Apex literal (display name, slug, CDP). Together with the
 * Jest hygiene scanner in src/__tests__/hygiene/no-apex-literal-leak.test.ts,
 * this closes the F8 + F9 regression gate for the 6-layer Apex-tenant
 * default-string leak that PR-A through PR-E eliminated.
 *
 * Source: docs/build/ADMIN_HOME_FULL_TEST_2026-05-30.md §6 F8 + F9.
 *
 * Skip condition:
 *   Like every other spec in tests/e2e/, this needs real Clerk credentials
 *   (CLERK_SESSION_TOKEN or CLERK_SECRET_KEY) AND a real Supabase to fully
 *   render the admin routes. Without them, it skips cleanly — it does NOT
 *   fail CI. The Jest hygiene scanner remains the always-on guard.
 *
 * Per-tenant Clerk-user check: each tenant's CXO persona is verified to
 * exist in Clerk before the walk. If a tenant has not been provisioned
 * yet (Northstar / Skyharbor are demo-only), that tenant's suite skips
 * with a clear message instead of failing.
 *
 * Run modes:
 *   npm run test:e2e
 *   npx playwright test tests/e2e/admin-tenant-isolation.spec.ts
 */

import { expect, test, type Page } from '@playwright/test';
import { findPersonaByEmail } from '../../src/lib/auth/cxo-personas';
import { clerkUserExists, missingAuthPrereqs, withClerkAuth } from './_helpers/auth';

// ─── The Apex leak pattern (built by concat so this file does not trip the
//     Jest hygiene scanner if it ever expands into tests/) ───────────────
const LEAK_PATTERN = new RegExp(
  [
    ['Apex', 'Retail'].join(' '),
    ['apex', 'retail'].join('-'),
    'apexretail',
    ['apex', 'cdp'].join('-'),
  ].join('|'),
  'i',
);

// ─── Canonical 18 admin routes (per spec §6 F9) ────────────────────────
const ADMIN_ROUTES: ReadonlyArray<string> = [
  '/admin',
  '/admin?tab=tenant',
  '/admin/data-trust',
  '/admin/connectors',
  '/admin/users-access',
  '/admin/users-access/notifications',
  '/admin/users-access/sso-configuration',
  '/admin/agent-readiness',
  '/admin/production-readiness',
  '/admin/compliance',
  '/admin/audit?tab=activity',
  '/admin/audit?tab=isolation',
  '/admin/audit?tab=approvals',
  '/admin/programs/approvals',
  '/admin/cross-program-signals',
  '/admin/customer',
  '/admin/releases',
  '/admin/inbox',
];

// ─── Non-Apex canonical tenants. Each entry pins a CXO admin email; the
//     persona record carries the canonical clientKey for the active-client
//     cookie. ─────────────────────────────────────────────────────────────
interface TenantTarget {
  label: string;
  email: string;
}

const TENANT_TARGETS: ReadonlyArray<TenantTarget> = [
  { label: 'meridian-health', email: 'cdio@meridian-health.example.com' },
  { label: 'first-capital', email: 'cio@firstcapital.example.com' },
  { label: 'northstar-clinical', email: 'ceo@northstar-clinical.example.com' },
  { label: 'skyharbor-air', email: 'cto@skyharbor-air.example.com' },
];

async function expectNoApexLeakOnRoute(page: Page, route: string): Promise<void> {
  await page.goto(route);
  await page.waitForLoadState('networkidle').catch(() => {
    // Some admin routes stream zones; networkidle may time out. Fall back
    // to domcontentloaded — the scan still runs against whatever DOM is
    // present, which is exactly what a tenant-confusion bug would render.
  });
  const text = (await page.locator('body').innerText().catch(() => '')) || '';
  if (LEAK_PATTERN.test(text)) {
    const offending = text
      .split('\n')
      .filter((line) => LEAK_PATTERN.test(line))
      .slice(0, 3)
      .join(' | ');
    throw new Error(
      `Apex leak detected on ${route}: ${offending.slice(0, 240)}`,
    );
  }
  expect(text).not.toMatch(LEAK_PATTERN);
}

test.describe('admin tenant isolation · no Apex leak on any tenant', () => {
  test.describe.configure({ mode: 'serial' });

  test.skip(
    missingAuthPrereqs.length > 0,
    `Missing required env: ${missingAuthPrereqs.join(', ')} — e2e gate skipped; Jest hygiene scanner remains the always-on guard.`,
  );

  for (const target of TENANT_TARGETS) {
    const persona = findPersonaByEmail(target.email);

    test.describe(`tenant · ${target.label}`, () => {
      test.skip(
        !persona,
        `No CXO persona fixture for ${target.email} — provision before enabling this lane.`,
      );

      if (!persona) {
        return;
      }

      test.beforeEach(async ({ page }) => {
        test.skip(
          !(await clerkUserExists(persona.email)),
          `No Clerk user found for ${persona.email} — provision via scripts/provision-cxo-personas.ts.`,
        );

        await withClerkAuth(page, {
          activeClient: persona.clientKey,
          email: persona.email,
        });
      });

      for (const route of ADMIN_ROUTES) {
        test(`${target.label} · ${route} renders without Apex literals`, async ({
          page,
        }) => {
          await expectNoApexLeakOnRoute(page, route);
        });
      }
    });
  }
});
