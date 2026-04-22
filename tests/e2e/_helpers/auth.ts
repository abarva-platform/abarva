import type { Page } from '@playwright/test';
import { createClerkClient } from '@clerk/backend';
import {
  AUTH_TOKEN,
  BASE_HOST,
  BASE_URL,
  CLERK_SECRET_KEY,
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_URL,
} from './env';

export {
  BASE_URL,
  CLERK_SECRET_KEY,
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_URL,
} from './env';

export const DEMO_ACCOUNTS = {
  meridian: { email: 'mh+clerk_test@abarva.com', password: 'Demo2026!' },
  arcturus: { email: 'af+clerk_test@abarva.com', password: 'Demo2026!' },
  apexretail: { email: 'apex+clerk_test@abarva.com', password: 'Demo2026!' },
  keystone: { email: 'keystone+clerk_test@abarva.com', password: 'Demo2026!' },
  admin: { email: 'anand+clerk_test@abarva.com', password: 'Archer2026!' },
  investor: { email: 'investor+clerk_test@abarva.com', password: 'Demo2026!' },
} as const;

export function missingClerkPrereqs(): string[] {
  return AUTH_TOKEN || CLERK_SECRET_KEY ? [] : ['CLERK_SESSION_TOKEN or CLERK_SECRET_KEY'];
}

export async function clerkUserExists(email: string): Promise<boolean> {
  if (!CLERK_SECRET_KEY) {
    return false;
  }

  const clerk = createClerkClient({ secretKey: CLERK_SECRET_KEY });
  const users = await clerk.users.getUserList({ emailAddress: [email], limit: 1 });
  return Boolean(users.data[0]);
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

async function signInWithServerTicket(page: Page, email: string): Promise<void> {
  if (!CLERK_SECRET_KEY) {
    throw new Error('CLERK_SECRET_KEY missing');
  }

  const clerk = createClerkClient({ secretKey: CLERK_SECRET_KEY });
  const users = await clerk.users.getUserList({ emailAddress: [email], limit: 1 });
  const user = users.data[0];
  if (!user) {
    throw new Error(`No Clerk user found for ${email}`);
  }

  const signInToken = await clerk.signInTokens.createSignInToken({
    userId: user.id,
    expiresInSeconds: 300,
  });

  await page.goto('/');
  await page.waitForFunction(() => (window as Window & { Clerk?: { loaded?: boolean } }).Clerk?.loaded === true);
  await page.evaluate(async (ticket) => {
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
        user: unknown;
      };
    };

    const result = await win.Clerk.client.signIn.create({ strategy: 'ticket', ticket });
    if (result.status !== 'complete' || !result.createdSessionId) {
      throw new Error(`Ticket sign-in failed with status ${result.status}`);
    }

    await win.Clerk.setActive({ session: result.createdSessionId });
  }, signInToken.token);
  await page.waitForFunction(() => {
    const win = window as Window & { Clerk?: { user?: unknown } };
    return Boolean(win.Clerk?.user);
  });
  await page.waitForFunction(() => document.cookie.includes('__session='));
  await page.waitForLoadState('networkidle');
}

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
  options:
    | { sessionToken?: string | null; activeClient?: string | null; email?: string | null }
    | string = {},
): Promise<void> {
  const sessionToken = typeof options === 'string' ? AUTH_TOKEN : options.sessionToken ?? AUTH_TOKEN;
  const activeClient = typeof options === 'string' ? options : options.activeClient ?? null;
  const email = typeof options === 'string' ? DEMO_ACCOUNTS.admin.email : options.email ?? DEMO_ACCOUNTS.admin.email;

  if (sessionToken) {
    await addClerkSessionCookie(page, sessionToken);
  } else {
    await signInWithServerTicket(page, email);
  }

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
