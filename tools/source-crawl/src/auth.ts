// Interactive session capture. We never type the auditor's password
// or OTP — the script just opens the sign-in page in a real browser
// and waits for the human to complete login. Once the URL leaves
// /sign-in we save the storage state and exit.
//
// AbarVa uses Clerk OTP for auditor accounts (admin → 424242 in pilot,
// real OTP in prod). The crawler-side just observes the URL change.

import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';
import { loadConfig } from './config.js';

async function main(): Promise<void> {
  const cfg = loadConfig();
  mkdirSync(dirname(cfg.storageStatePath), { recursive: true });

  console.log('▸ Opening browser for auditor sign-in.');
  console.log('  Sign-in URL:', cfg.signinUrl);
  console.log('  Tenant URL: ', cfg.tenantUrl);
  console.log();
  console.log(
    '  Complete login manually. The script saves the session as soon',
  );
  console.log(
    '  as the URL leaves /sign-in and you reach the tenant landing page.',
  );

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await page.goto(cfg.signinUrl, { waitUntil: 'domcontentloaded' });

  // Poll for departure from /sign-in and arrival at tenant URL.
  // We tolerate Clerk's intermediate factor pages.
  const timeoutMs = 5 * 60_000; // 5 min for the human
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    await page.waitForTimeout(750);
    const url = page.url();
    if (
      !/\/sign-in/.test(url) &&
      !/clerk\./.test(url) &&
      url.includes(cfg.tenantHostname)
    ) {
      // Give the page a moment to settle and set its cookies.
      await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
      break;
    }
  }

  if (/\/sign-in/.test(page.url())) {
    console.error('✗ Timed out waiting for sign-in. Aborting.');
    await browser.close();
    process.exit(1);
  }

  await context.storageState({ path: cfg.storageStatePath });
  console.log(`✓ Session saved → ${cfg.storageStatePath}`);
  if (existsSync(cfg.storageStatePath)) {
    // Force read-only mode on the file — defense in depth.
    const { chmodSync } = await import('node:fs');
    chmodSync(cfg.storageStatePath, 0o600);
  }
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
