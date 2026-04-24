const { chromium } = require('@playwright/test');

const BASE_URL = process.env.BASE_URL || 'https://app.abarva.ai';
const DEMO_ACCOUNTS = {
  meridian: { email: 'demo-meridian+clerk_test@abarva.com', password: 'Demo2026!' },
  apexretail: { email: 'demo-apexretail+clerk_test@abarva.com', password: 'Demo2026!' },
};

function fail(message: string): never {
  throw new Error(message);
}

async function expectText(page: any, text: string | RegExp, timeout = 20000) {
  if (typeof text === 'string') {
    await page.getByText(text, { exact: false }).first().waitFor({ state: 'visible', timeout });
  } else {
    await page.getByText(text).first().waitFor({ state: 'visible', timeout });
  }
}

async function signIn(page: any, email: string, password: string) {
  await page.goto(`${BASE_URL}/sign-in`, { waitUntil: 'domcontentloaded' });
  await page.getByPlaceholder('Enter your email address').fill(email);
  await page.getByPlaceholder('Enter your password').fill(password);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();

  const verificationField = page.locator('input[autocomplete="one-time-code"]').first();
  try {
    await verificationField.waitFor({ state: 'visible', timeout: 5000 });
    await verificationField.fill('424242');
    await page.getByRole('button', { name: /continue|verify/i, exact: false }).click();
  } catch {
    // No verification challenge in this session.
  }

  await page.waitForFunction(() => document.cookie.includes('__session='), null, { timeout: 20000 });
}

async function verifyApexMorrison(browser: any) {
  const context = await browser.newContext({ baseURL: BASE_URL });
  const page = await context.newPage();
  await signIn(page, DEMO_ACCOUNTS.apexretail.email, DEMO_ACCOUNTS.apexretail.password);
  await page.goto(`${BASE_URL}/auth-redirect`, { waitUntil: 'domcontentloaded' });
  await page.goto(`${BASE_URL}/tenant/apex-retail/programs/morrison-owned-brand-margin-recovery`, { waitUntil: 'domcontentloaded' });
  await expectText(page, 'Morrison Owned Brand Margin Recovery');
  await page.goto(`${BASE_URL}/tenant/apex-retail/programs/morrison-owned-brand-margin-recovery/deliverables/d01-d01-program-charter`, { waitUntil: 'domcontentloaded' });
  await expectText(page, 'Program Charter');
  await expectText(page, 'Marcus T.');
  await page.goto(`${BASE_URL}/tenant/apex-retail/programs/morrison-owned-brand-margin-recovery/deliverables/d17-d17-decision-memo`, { waitUntil: 'domcontentloaded' });
  await expectText(page, 'Decision Memo');
  await expectText(page, /Option 1|three options|decision/i);
  await context.close();
  return 'Apex/Morrison program + legacy D01/D17 links loaded';
}

async function verifyMeridianDeliverables(browser: any) {
  const context = await browser.newContext({ baseURL: BASE_URL });
  const page = await context.newPage();
  await signIn(page, DEMO_ACCOUNTS.meridian.email, DEMO_ACCOUNTS.meridian.password);
  await page.goto(`${BASE_URL}/auth-redirect`, { waitUntil: 'domcontentloaded' });
  await page.goto(`${BASE_URL}/tenant/meridian-health/programs/ambient-clinical-value-chain-activation/deliverables/d01-d01-program-charter`, { waitUntil: 'domcontentloaded' });
  await expectText(page, 'Program Charter');
  await expectText(page, 'Ambient Clinical Value Chain Activation');
  await page.goto(`${BASE_URL}/tenant/meridian-health/programs/ambient-clinical-value-chain-activation/deliverables/d17-d17-decision-memo`, { waitUntil: 'domcontentloaded' });
  await expectText(page, 'Decision Memo');
  await expectText(page, /option|memo|decision/i);
  await context.close();
  return 'Meridian legacy D01/D17 links loaded';
}

async function verifySentinel(browser: any) {
  const context = await browser.newContext({ baseURL: BASE_URL });
  const page = await context.newPage();
  await signIn(page, DEMO_ACCOUNTS.meridian.email, DEMO_ACCOUNTS.meridian.password);
  await page.goto(`${BASE_URL}/preview/intelligence?client=meridian`, { waitUntil: 'domcontentloaded' });
  await expectText(page, 'Ask Sentinel');
  const input = page.getByLabel('Ask Sentinel');
  await input.fill('What are the two strongest evidence-backed signals for ambient documentation here?');
  await page.getByRole('button', { name: 'Send' }).click();
  await page.getByText(/sources · .*deliverables|sources · .*evidence|Confidence/i).first().waitFor({ state: 'visible', timeout: 30000 });
  const body = await page.locator('.sis-bubble.sentinel .sis-bubble-body').last().textContent();
  if (!body || /Free-text queries route through the Ask layer/i.test(body) || /Heard\./i.test(body)) {
    fail(`Sentinel returned stale/canned response: ${body ?? '(empty)'}`);
  }
  await context.close();
  return 'Sentinel free-text returned a non-canned response with evidence metadata';
}

async function verifyAtlas(browser: any) {
  const context = await browser.newContext({ baseURL: BASE_URL });
  const page = await context.newPage();
  await signIn(page, DEMO_ACCOUNTS.meridian.email, DEMO_ACCOUNTS.meridian.password);
  await page.goto(`${BASE_URL}/tower?client=meridian`, { waitUntil: 'domcontentloaded' });
  await expectText(page, 'Atlas');
  const input = page.getByPlaceholder('Ask Atlas about portfolio state…');
  await input.fill('What is the single biggest unowned pressure right now?');
  await page.getByRole('button', { name: 'Send' }).click();
  await page.getByText(/Atlas could not|Honest answer|unowned pressures|decision owner|pressure/i).last().waitFor({ state: 'visible', timeout: 30000 });
  const messages = await page.locator('text=Atlas').count();
  if (messages < 2) {
    fail('Atlas did not append a reply after free-text submission');
  }
  await context.close();
  return 'Atlas free-text appended a reply or honest fallback';
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const results: string[] = [];
  try {
    results.push(await verifyApexMorrison(browser));
    results.push(await verifyMeridianDeliverables(browser));
    results.push(await verifySentinel(browser));
    results.push(await verifyAtlas(browser));
    console.log(JSON.stringify({ ok: true, baseUrl: BASE_URL, results }, null, 2));
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(JSON.stringify({ ok: false, baseUrl: BASE_URL, error: String(error?.message || error) }, null, 2));
  process.exit(1);
});
