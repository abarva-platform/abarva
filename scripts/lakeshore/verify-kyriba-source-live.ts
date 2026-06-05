import { createClerkClient } from '@clerk/backend';
import { chromium } from 'playwright';

const baseUrl = process.env.LAKESHORE_VERIFY_BASE_URL ?? 'https://app.abarva.ai';
const email = process.env.LAKESHORE_VERIFY_EMAIL ?? 'cfo@lakeshore-holdings.example.com';
const activeClient = 'lakeshore';
const eventCode = 'LSH-KYRIBA-TREASURY-2026';

const stageExpectations = [
  {
    stage: 'selection',
    markers: [
      'Selection Memo',
      'Contract Record',
      'Kyriba',
      'Lakeshore',
      'Lakeshore should proceed with a treasury platform rollout anchored on Kyriba',
    ],
  },
  {
    stage: 'transition',
    markers: [
      'Transition Plan',
      'Checkpoint Log',
      'Knowledge-Transfer Evidence',
      'Kyriba',
      'Lakeshore',
      'The transition plan is built around a controlled parallel run',
    ],
  },
  {
    stage: 'value',
    markers: [
      'Value Ledger',
      'Governance Review Note',
      'Kyriba',
      'Lakeshore',
      'The Kyriba rollout value ledger is intentionally conservative',
    ],
  },
];

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

async function main() {
  const clerk = createClerkClient({ secretKey: requiredEnv('CLERK_SECRET_KEY') });
  const users = await clerk.users.getUserList({ emailAddress: [email], limit: 1 });
  const user = users.data[0];
  if (!user) throw new Error(`No Clerk user found for ${email}`);

  const ticket = await clerk.signInTokens.createSignInToken({
    userId: user.id,
    expiresInSeconds: 300,
  });

  const browser = await chromium.launch({ headless: true });
  const results: Array<{ stage: string; url: string; status: number | null; markers: Record<string, boolean> }> = [];

  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(
      () => (window as Window & { Clerk?: { loaded?: boolean } }).Clerk?.loaded === true,
      null,
      { timeout: 30_000 },
    );
    await page.evaluate(async (token) => {
      const win = window as unknown as Window & {
        Clerk: {
          client: {
            signIn: {
              create: (params: { strategy: 'ticket'; ticket: string }) => Promise<{
                status: string;
                createdSessionId?: string | null;
              }>;
            };
          };
          setActive: (params: { session?: string | null }) => Promise<void>;
        };
      };
      const result = await win.Clerk.client.signIn.create({ strategy: 'ticket', ticket: token });
      if (result.status !== 'complete' || !result.createdSessionId) {
        throw new Error(`Ticket sign-in failed: ${result.status}`);
      }
      await win.Clerk.setActive({ session: result.createdSessionId });
    }, ticket.token);
    await page.waitForFunction(() => document.cookie.includes('__session='), null, { timeout: 30_000 });

    await context.addCookies([
      {
        name: 'abarva_active_client',
        value: activeClient,
        url: baseUrl,
        httpOnly: false,
        secure: true,
        sameSite: 'Lax',
      },
    ]);

    for (const expectation of stageExpectations) {
      const url = `${baseUrl}/source/events/${eventCode}?stage=${expectation.stage}`;
      const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 45_000 });
      const text = await page.locator('body').innerText({ timeout: 15_000 });
      const markers = Object.fromEntries(expectation.markers.map((marker) => [marker, text.includes(marker)]));
      results.push({ stage: expectation.stage, url, status: response?.status() ?? null, markers });
      const missing = Object.entries(markers)
        .filter(([, present]) => !present)
        .map(([marker]) => marker);
      if (missing.length > 0) {
        throw new Error(`Stage ${expectation.stage} missing markers: ${missing.join(', ')}`);
      }
    }

    const cookies = await context.cookies(baseUrl);
    const clientCookie = cookies.find((cookie) => cookie.name === 'abarva_active_client')?.value ?? '';
    console.log(
      JSON.stringify(
        {
          baseUrl,
          email,
          activeClientCookie: clientCookie,
          eventCode,
          results,
        },
        null,
        2,
      ),
    );
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
