import { expect, test, type Locator, type Page } from '@playwright/test';
import { missingAuthPrereqs, withClerkAuth } from './_helpers/auth';

const AUTHENTICATED_SURFACES = [
  { path: '/home', name: 'Home' },
  { path: '/admin', name: 'Admin' },
  { path: '/intelligence', name: 'Intelligence' },
  { path: '/strategic-moves', name: 'Strategic Moves' },
  { path: '/source', name: 'Source' },
  { path: '/tower', name: 'Tower' },
] as const;

const INTERACTIVE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[role="button"]:not([aria-disabled="true"])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

async function visibleInteractiveControls(page: Page): Promise<Locator[]> {
  const controls = page.locator(INTERACTIVE_SELECTOR);
  const count = await controls.count();
  const visibleControls: Locator[] = [];

  for (let index = 0; index < count; index += 1) {
    const control = controls.nth(index);
    if (await control.isVisible()) {
      visibleControls.push(control);
    }
  }

  return visibleControls;
}

async function focusedElementSnapshot(page: Page) {
  return page.evaluate(() => {
    const active = document.activeElement as HTMLElement | null;
    if (!active || active === document.body) {
      return null;
    }

    const style = window.getComputedStyle(active);
    return {
      tagName: active.tagName,
      text: active.textContent?.trim().slice(0, 80) ?? '',
      ariaLabel: active.getAttribute('aria-label'),
      testId: active.getAttribute('data-testid'),
      role: active.getAttribute('role'),
      outlineStyle: style.outlineStyle,
      outlineWidth: style.outlineWidth,
      outlineColor: style.outlineColor,
    };
  });
}

async function expectKeyboardCanReachControls(
  page: Page,
  expectedMinimumStops: number,
): Promise<void> {
  const visited = new Set<string>();

  for (let index = 0; index < 24; index += 1) {
    await page.keyboard.press('Tab');
    const snapshot = await focusedElementSnapshot(page);
    if (!snapshot) {
      continue;
    }

    visited.add(
      [
        snapshot.tagName,
        snapshot.role,
        snapshot.ariaLabel,
        snapshot.testId,
        snapshot.text,
      ].join('|'),
    );

    expect(
      snapshot.outlineStyle !== 'none' ||
        snapshot.outlineWidth !== '0px' ||
        snapshot.outlineColor !== 'rgba(0, 0, 0, 0)',
    ).toBe(true);

    if (visited.size >= expectedMinimumStops) {
      return;
    }
  }

  expect(visited.size).toBeGreaterThanOrEqual(expectedMinimumStops);
}

test.describe('T181 accessibility stress · keyboard and landmark workflow coverage', () => {
  test('public shell exposes a main landmark before authentication', async ({
    page,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('main, [role="main"]').first()).toBeVisible();
    await expect(page.locator('main, [role="main"]')).toHaveCount(1);

    const controls = await visibleInteractiveControls(page);
    expect(controls.length).toBeGreaterThan(0);
    await expectKeyboardCanReachControls(page, Math.min(3, controls.length));
  });

  test.describe('authenticated product surfaces', () => {
    test.skip(
      missingAuthPrereqs.length > 0,
      `Missing required env: ${missingAuthPrereqs.join(', ')} — authenticated accessibility stress skipped.`,
    );

    test.beforeEach(async ({ page }) => {
      await withClerkAuth(page, {
        activeClient: 'apexretail',
        email: 'cio@apex-retail.example.com',
      });
    });

    for (const surface of AUTHENTICATED_SURFACES) {
      test(`${surface.name} has one main landmark and keyboard-reachable controls`, async ({
        page,
      }) => {
        await page.goto(surface.path);
        await page.waitForLoadState('domcontentloaded');

        const main = page.locator('main, [role="main"]');
        await expect(main.first()).toBeVisible({ timeout: 15_000 });
        await expect(main).toHaveCount(1);

        const controls = await visibleInteractiveControls(page);
        expect(controls.length).toBeGreaterThan(0);
        await expectKeyboardCanReachControls(page, Math.min(8, controls.length));
      });
    }
  });
});
