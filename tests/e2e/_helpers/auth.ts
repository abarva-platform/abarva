import type { Page } from '@playwright/test';
import {
  AUTH_TOKEN,
  BASE_HOST,
  BASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_URL,
} from './env';

export { BASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from './env';

export const DEMO_ACCOUNTS = {
  meridian: { email: 'mh+clerk_test@abarva.com', password: 'Demo2026!' },
  arcturus: { email: 'af@abarva.com', password: 'Demo2026!' },
  admin: { email: 'anand+clerk_test@abarva.com', password: 'AbarVa2026!' },
  investor: { email: 'investor+clerk_test@abarva.com', password: 'Demo2026!' },
} as const;

export function missingClerkPrereqs(): string[] {
  return AUTH_TOKEN ? [] : ['CLERK_SESSION_TOKEN'];
}

export function missingSupabasePrereqs(): string[] {
  return [
    !SUPABASE_URL ? 'NEXT_PUBLIC_SUPABASE_URL' : null,
    !SUPABASE_SERVICE_ROLE_KEY ? 'SUPABASE_SERVICE_ROLE_KEY' : null,
  ].filter(Boolean) as string[];
}

export function missingEngagementPrereqs(): string[] {
  return [...missingClerkPrereqs(), ...missingSupabasePrereqs()];
}

export const missingAuthPrereqs = missingClerkPrereqs();

export async function addClerkSessionCookie(page: Page, sessionToken = AUTH_TOKEN): Promise<void> {
  if (!sessionToken) {
    throw new Error('CLERK_SESSION_TOKEN missing');
  }

  await page.context().addCookies([
    {
      name: '__session',
      value: sessionToken,
      domain: BASE_HOST,
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
      secure: BASE_URL.startsWith('https://'),
    },
  ]);
}

export async function addActiveClientCookie(page: Page, clientKey: string): Promise<void> {
  await page.context().addCookies([
    {
      name: 'abarva_active_client',
      value: clientKey,
      domain: BASE_HOST,
      path: '/',
      sameSite: 'Lax',
      secure: BASE_URL.startsWith('https://'),
    },
  ]);
}

export async function withClerkAuth(
  page: Page,
  options: { sessionToken?: string | null; activeClient?: string | null } | string = {},
): Promise<void> {
  const sessionToken = typeof options === 'string' ? AUTH_TOKEN : options.sessionToken ?? AUTH_TOKEN;
  const activeClient = typeof options === 'string' ? options : options.activeClient ?? null;

  await addClerkSessionCookie(page, sessionToken);
  if (activeClient) {
    await addActiveClientCookie(page, activeClient);
  }
}

export async function signInWithDemoAccount(page: Page, account: keyof typeof DEMO_ACCOUNTS): Promise<void> {
  const creds = DEMO_ACCOUNTS[account];

  await page.goto('/sign-in');
  await page.getByPlaceholder('Enter your email address').fill(creds.email);
  await page.getByPlaceholder('Enter your password').fill(creds.password);
  await page.getByRole('button', { name: 'Continue' }).click();

  await page.waitForFunction(() => document.cookie.includes('__session='), null, { timeout: 15000 });
}
