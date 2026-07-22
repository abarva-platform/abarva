/**
 * Source E2E auth helper — Clerk sign-in with storageState caching.
 *
 * USAGE
 * -----
 *   import { signInAs, sourcePersonaStorageState } from './_auth';
 *
 *   // Pattern A: per-test storage state (recommended — fast, fully cached).
 *   test.describe('source flow', () => {
 *     test.use({ storageState: sourcePersonaStorageState('apex-vp-sourcing') });
 *
 *     test('opens BAFO stage', async ({ page }) => {
 *       await page.goto('/source/events/apex-retail-ams-outsourcing-2026?stage=bafo');
 *     });
 *   });
 *
 *   // Pattern B: imperative — primes storage state if missing, then injects
 *   //            the cookies into the current page context and verifies /source.
 *   test('manual flow', async ({ page }) => {
 *     await signInAs(page, 'apex-vp-sourcing');
 *     // page is now signed in and has navigated to /source/.
 *   });
 *
 * REFRESHING CREDENTIALS
 * ----------------------
 * Storage state files live at `.auth/source-<personaKey>.json` (repo root). They
 * are reused across runs to avoid round-tripping through Clerk every test.
 *
 *   - Refresh one persona:  rm .auth/source-apex-vp-sourcing.json
 *   - Refresh all source:   rm -rf .auth/source-*.json
 *   - One-shot bypass:      SOURCE_AUTH_REFRESH=1 npm run test:e2e
 *
 * `.auth/` MUST be gitignored — these files contain a live Clerk `__session`
 * cookie. Never commit them.
 *
 * AUTH MECHANISM
 * --------------
 * Builds on the canonical `withClerkAuth` helper in `tests/e2e/_helpers/auth.ts`.
 * That helper already supports two paths:
 *   1. `CLERK_SESSION_TOKEN` cookie injection (fast, used when env is set).
 *   2. Server-side sign-in ticket via `CLERK_SECRET_KEY` (preferred fallback).
 *
 * The Clerk "ticket" path is preferred over the live UI demo-code flow because
 * the demo-code 424242 / Demo2026! pair referenced in user memory targets the
 * in-app CXO personas (e.g. `cio@apex-retail.example.com`) — those personas are
 * provisioned via `scripts/provision-cxo-personas.ts --apply` and are NOT
 * registered as E2E test users by default. We attempt the canonical persona
 * email first and fall back to the tenant `+clerk_test@abarva.com` demo account
 * so specs always have a valid tenant context for RLS / broker calls.
 *
 * PERSONAS
 * --------
 *   - apex-vp-sourcing   Apex Retail accountable sourcing approver (drives AMS event E2E).
 *                        Canonical:  cio@apex-retail.example.com
 *                        Fallback:   demo-apexretail+clerk_test@abarva.com
 *                        activeClient: apexretail
 *
 *   - apex-non-approver  Apex Retail tenant member without approver perms —
 *                        used to assert "non-approver cannot advance gate".
 *                        Canonical:  analyst@apex-retail.example.com
 *                        DOCUMENTED GAP: No dedicated +clerk_test non-approver
 *                        account exists in DEMO_ROLE_ACCOUNTS. If the canonical
 *                        persona is not provisioned in Clerk, the fallback is
 *                        the apex CIO demo user — which IS an approver — so
 *                        specs that assert non-approver behavior will see
 *                        sourcePersonaIsFallback('apex-non-approver') === true
 *                        and should skip with a clear message. Provision the
 *                        non-approver via scripts/provision-cxo-personas.ts.
 *
 *   - meridian-cdio      Meridian Health CDIO.
 *                        Canonical:  cdio@meridian-health.example.com
 *                        Fallback:   demo-meridian+clerk_test@abarva.com
 *                        activeClient: meridian
 *                        DOCUMENTED GAP: Like apex-non-approver, the canonical
 *                        CXO persona may not be provisioned; fallback is the
 *                        Meridian tenant demo user. Tenant context is correct
 *                        but role-specific assertions may need the canonical
 *                        persona.
 *
 *   - meridian-cdao      Meridian Health CDAO.
 *                        Canonical:  cdao@meridian-health.example.com
 *                        Fallback:   demo-meridian+clerk_test@abarva.com
 *                        activeClient: meridian
 *                        DOCUMENTED GAP: The canonical CDAO persona may not be
 *                        provisioned in every Clerk environment; fallback keeps
 *                        tenant context correct for source smoke coverage.
 */

import fs from 'node:fs';
import path from 'node:path';
import { chromium, type Page, type Response } from '@playwright/test';
import { RESPONSIBLE_AI_ACKNOWLEDGMENT_VERSION } from '@/lib/ai-liability/responsible-ai-acknowledgment-copy';

import {
  BASE_URL,
  CLERK_SECRET_KEY,
  DEMO_ACCOUNTS,
  addActiveClientCookie,
  clerkUserExists,
  signInWithDemoAccount,
  withClerkAuth,
} from '../_helpers/auth';
import { AUTH_TOKEN } from '../_helpers/env';

export type SourcePersonaKey =
  | 'apex-vp-sourcing'
  | 'skyharbor-vp-itops'
  | 'apex-non-approver'
  | 'meridian-cdio'
  | 'meridian-cdao'
  | 'apex-cio'
  | 'apex-cfo'
  | 'admin';

type PersonaConfig = {
  /** Canonical CXO-persona email (preferred if provisioned in Clerk). */
  email: string;
  /** Fallback Clerk demo account to use if canonical persona not provisioned. */
  fallbackEmail: string;
  /** Demo-account key for live-UI sign-in fallback (used when no Clerk secret). */
  fallbackDemoAccount: keyof typeof DEMO_ACCOUNTS | null;
  /** Tenant key for the `abarva_active_client` cookie. */
  activeClient: string;
  /** Path used to verify /source/ is reachable after sign-in. */
  postLoginProbe: string;
  /** Optional note describing a known gap (e.g. non-approver fallback). */
  gapNote?: string;
};

const PERSONAS: Record<SourcePersonaKey, PersonaConfig> = {
  'apex-vp-sourcing': {
    email: 'cio@apex-retail.example.com',
    fallbackEmail: DEMO_ACCOUNTS.apexretail.email,
    fallbackDemoAccount: 'apexretail',
    activeClient: 'apexretail',
    postLoginProbe: '/source',
  },
  'apex-non-approver': {
    email: 'analyst@apex-retail.example.com',
    fallbackEmail: DEMO_ACCOUNTS.apexretail.email,
    fallbackDemoAccount: 'apexretail',
    activeClient: 'apexretail',
    postLoginProbe: '/source',
    gapNote:
      'No dedicated non-approver +clerk_test account exists. If the canonical ' +
      'persona analyst@apex-retail.example.com is not provisioned, the fallback ' +
      'is the Apex CIO demo user — which IS an approver. Specs asserting ' +
      'non-approver behavior should call sourcePersonaIsFallback() and skip.',
  },
  'skyharbor-vp-itops': {
    email: 'cto@skyharbor-air.example.com',
    fallbackEmail: DEMO_ACCOUNTS.skyharbor.email,
    fallbackDemoAccount: 'skyharbor',
    activeClient: 'skyharbor',
    postLoginProbe: '/source',
  },
  'meridian-cdio': {
    email: 'cdio@meridian-health.example.com',
    fallbackEmail: DEMO_ACCOUNTS.meridian.email,
    fallbackDemoAccount: 'meridian',
    activeClient: 'meridian',
    postLoginProbe: '/source',
    gapNote:
      'Canonical cdio@meridian-health.example.com persona may not be ' +
      'provisioned; fallback is demo-meridian+clerk_test@abarva.com. Tenant ' +
      'context is correct; role-specific assertions may require the canonical ' +
      'persona via scripts/provision-cxo-personas.ts --apply.',
  },
  'meridian-cdao': {
    email: 'cdao@meridian-health.example.com',
    fallbackEmail: DEMO_ACCOUNTS.meridian.email,
    fallbackDemoAccount: 'meridian',
    activeClient: 'meridian',
    postLoginProbe: '/source',
    gapNote:
      'Canonical cdao@meridian-health.example.com persona may not be ' +
      'provisioned; fallback is demo-meridian+clerk_test@abarva.com. Tenant ' +
      'context is correct for source smoke coverage; CDAO-specific assertions ' +
      'require the canonical persona via scripts/provision-cxo-personas.ts --apply.',
  },
  'apex-cio': {
    email: 'cio@apex-retail.example.com',
    fallbackEmail: DEMO_ACCOUNTS.apexretail.email,
    fallbackDemoAccount: 'apexretail',
    activeClient: 'apexretail',
    postLoginProbe: '/source',
  },
  'apex-cfo': {
    email: 'cfo@apex-retail.example.com',
    fallbackEmail: DEMO_ACCOUNTS.apexretail.email,
    fallbackDemoAccount: 'apexretail',
    activeClient: 'apexretail',
    postLoginProbe: '/source',
  },
  admin: {
    email: DEMO_ACCOUNTS.admin.email,
    fallbackEmail: DEMO_ACCOUNTS.admin.email,
    fallbackDemoAccount: 'admin',
    activeClient: 'apexretail',
    postLoginProbe: '/source',
  },
};

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const AUTH_DIR = path.join(REPO_ROOT, '.auth');
const STORAGE_MAX_AGE_MS = 1000 * 60 * 60 * 8; // 8 hours
const RESPONSIBLE_AI_ACK_ROUTE = '/responsible-ai/acknowledgment';

/** Absolute path to the storageState JSON for a given persona. */
export function sourcePersonaStorageState(personaKey: SourcePersonaKey): string {
  return path.join(AUTH_DIR, `source-${personaKey}.json`);
}

/** Persona descriptor (useful for skip-guards and debugging in specs). */
export function getSourcePersona(personaKey: SourcePersonaKey): PersonaConfig {
  const persona = PERSONAS[personaKey];
  if (!persona) {
    throw new Error(`Unknown Source persona: ${personaKey}`);
  }
  return persona;
}

/** Lists personas with documented gaps so specs can skip/annotate centrally. */
export function sourcePersonaGaps(): Array<{ key: SourcePersonaKey; note: string }> {
  return (Object.entries(PERSONAS) as Array<[SourcePersonaKey, PersonaConfig]>)
    .filter(([, p]) => Boolean(p.gapNote))
    .map(([key, p]) => ({ key, note: p.gapNote as string }));
}

/**
 * Returns true if the canonical persona email was unavailable and the helper
 * is using a fallback demo account. Specs that depend on role-specific
 * behavior (e.g. non-approver assertions) should skip when this is true.
 *
 * Note: this is a best-effort check — it resolves the persona email the same
 * way signInAs() does. If `CLERK_SECRET_KEY` is missing, it conservatively
 * reports `true` because we cannot verify Clerk membership.
 */
export async function sourcePersonaIsFallback(personaKey: SourcePersonaKey): Promise<boolean> {
  const persona = getSourcePersona(personaKey);
  if (persona.email === persona.fallbackEmail) return false;
  if (!CLERK_SECRET_KEY) return true;
  return !(await clerkUserExists(persona.email));
}

function shouldRefresh(): boolean {
  return process.env.SOURCE_AUTH_REFRESH === '1';
}

function ensureAuthDir(): void {
  if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
  }
}

function decodeJwtExp(jwt: string): number | null {
  const parts = jwt.split('.');
  if (parts.length < 2) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString(
        'utf8',
      ),
    ) as { exp?: unknown };
    return typeof payload.exp === 'number' ? payload.exp : null;
  } catch {
    return null;
  }
}

function storageStateIsFresh(filePath: string, maxAgeMs = STORAGE_MAX_AGE_MS): boolean {
  if (!fs.existsSync(filePath)) return false;
  try {
    const stat = fs.statSync(filePath);
    if (Date.now() - stat.mtimeMs > maxAgeMs) return false;
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8')) as {
      cookies?: Array<{ name: string; value: string; expires?: number }>;
    };
    const session = parsed.cookies?.find((c) => c.name === '__session');
    if (!session?.value) return false;
    if (session.expires && session.expires > 0 && session.expires * 1000 < Date.now()) {
      return false;
    }
    const jwtExp = decodeJwtExp(session.value);
    if (jwtExp && jwtExp * 1000 < Date.now()) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

async function resolveEmail(persona: PersonaConfig): Promise<string> {
  if (persona.email === persona.fallbackEmail) return persona.email;
  if (!CLERK_SECRET_KEY) return persona.fallbackEmail;
  return (await clerkUserExists(persona.email)) ? persona.email : persona.fallbackEmail;
}

/**
 * Prime a fresh storageState file for the given persona by running the Clerk
 * sign-in flow in an isolated browser context. Returns the path to the
 * written file. Idempotent: callers should check storageStateIsFresh() first.
 */
async function primeStorageState(personaKey: SourcePersonaKey): Promise<string> {
  const persona = getSourcePersona(personaKey);
  const storagePath = sourcePersonaStorageState(personaKey);

  ensureAuthDir();
  const email = await resolveEmail(persona);

  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({ baseURL: BASE_URL });
    const page = await context.newPage();

    if (AUTH_TOKEN || CLERK_SECRET_KEY) {
      // Ticket flow or session-cookie injection via the canonical helper.
      await withClerkAuth(page, { email, activeClient: persona.activeClient });
    } else if (persona.fallbackDemoAccount) {
      // Live UI sign-in using DEMO_ACCOUNTS password (Demo2026!).
      await signInWithDemoAccount(page, persona.fallbackDemoAccount);
      await addActiveClientCookie(page, persona.activeClient);
    } else {
      throw new Error(
        `Cannot sign in persona '${personaKey}': no CLERK_SECRET_KEY, no ` +
          `CLERK_SESSION_TOKEN, and no fallback demo account configured.`,
      );
    }

    await ensureResponsibleAiAcknowledged(page);

    // Verify /source/ is reachable.
    const probe = await gotoSourceProbe(page, persona.postLoginProbe);
    if (page.url().includes('/sign-in') || (probe && probe.status() >= 400)) {
      throw new Error(
        `Post-login probe failed for persona '${personaKey}': ` +
          `GET ${persona.postLoginProbe} landed on ${page.url()}.`,
      );
    }

    await context.storageState({ path: storagePath });
    await context.close();
    return storagePath;
  } finally {
    await browser.close();
  }
}

/**
 * Sign `page` in as the given persona. Returns once `/source/` is verified
 * reachable.
 *
 * Idempotent: reuses `.auth/source-<personaKey>.json` when fresh; otherwise
 * primes a new storage state by running the Clerk sign-in flow in a
 * temporary browser context, then loads the resulting cookies onto `page`.
 *
 * Prefer `test.use({ storageState: sourcePersonaStorageState(...) })` for
 * test suites where every test starts authenticated — it skips the
 * cookie-injection round-trip entirely.
 */
export async function signInAs(
  page: Page,
  personaKey: SourcePersonaKey | string,
): Promise<void> {
  if (!(personaKey in PERSONAS)) {
    throw new Error(
      `Unknown persona "${personaKey}". Add it to tests/e2e/source/_auth.ts PERSONAS map.`,
    );
  }
  const key = personaKey as SourcePersonaKey;
  const persona = PERSONAS[key];
  const storagePath = sourcePersonaStorageState(key);

  if (persona.gapNote) {
    console.warn(`[source/_auth] Persona '${key}' has a documented gap: ${persona.gapNote}`);
  }

  if (shouldRefresh() && fs.existsSync(storagePath)) {
    fs.rmSync(storagePath);
  }

  if (!storageStateIsFresh(storagePath)) {
    await primeStorageState(key);
  }

  await injectStorageStateIntoPage(page, storagePath);

  await ensureResponsibleAiAcknowledged(page);

  // Verify /source/ is reachable from this page.
  let response = await gotoSourceProbe(page, persona.postLoginProbe);
  if (page.url().includes('/sign-in') || (response && response.status() >= 400)) {
    // Cached state expired between freshness check and use — reprime once.
    fs.rmSync(storagePath, { force: true });
    await primeStorageState(key);
    await injectStorageStateIntoPage(page, storagePath);
    await ensureResponsibleAiAcknowledged(page);
    response = await gotoSourceProbe(page, persona.postLoginProbe);
    if (page.url().includes('/sign-in') || (response && response.status() >= 400)) {
      throw new Error(
        `signInAs('${key}'): /source probe landed on ${page.url()} after refresh.`,
      );
    }
  }
}

async function ensureResponsibleAiAcknowledged(page: Page): Promise<void> {
  try {
    await page.goto(RESPONSIBLE_AI_ACK_ROUTE, { waitUntil: 'domcontentloaded' });
  } catch (error) {
    if (
      !(error instanceof Error) ||
      !error.message.includes('net::ERR_ABORTED')
    ) {
      throw error;
    }
  }
  await page
    .waitForURL(/\/responsible-ai\/acknowledgment|\/home|\/source(\/queue|\/portfolio|\/events)?/, {
      timeout: 15000,
    })
    .catch(() => null);

  if (!page.url().includes(RESPONSIBLE_AI_ACK_ROUTE)) {
    return;
  }

  const response = await page.request.post(
    '/api/ai-liability/responsible-ai-acknowledgment',
    {
      data: {
        accepted: true,
        textVersion: RESPONSIBLE_AI_ACKNOWLEDGMENT_VERSION,
      },
    },
  );
  if (response.status() !== 200) {
    const responseBody = await response.text().catch(() => '');
    throw new Error(
      `Responsible AI acknowledgment API returned ${response.status()}: ${responseBody}`,
    );
  }

  try {
    await page.goto('/source', { waitUntil: 'domcontentloaded' });
  } catch (error) {
    if (
      !(error instanceof Error) ||
      !error.message.includes('net::ERR_ABORTED')
    ) {
      throw error;
    }
  }
  await page
    .waitForURL(/\/source(\/queue|\/portfolio|\/events)?|\/home/, {
      timeout: 15000,
    })
    .catch(() => null);
}

async function gotoSourceProbe(
  page: Page,
  url: string,
): Promise<Response | null> {
  try {
    const response = await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForURL(/\/source(\/queue|\/portfolio|\/events)?|\/sign-in|\/home/, {
      timeout: 15000,
    }).catch(() => null);
    return response;
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('net::ERR_ABORTED')
    ) {
      await page.waitForURL(/\/source(\/queue|\/portfolio|\/events)?|\/sign-in|\/home/, {
        timeout: 15000,
      });
      return null;
    }
    throw error;
  }
}

async function injectStorageStateIntoPage(page: Page, storagePath: string): Promise<void> {
  const parsed = JSON.parse(fs.readFileSync(storagePath, 'utf8')) as {
    cookies?: Array<{
      name: string;
      value: string;
      domain: string;
      path: string;
      expires?: number;
      httpOnly?: boolean;
      secure?: boolean;
      sameSite?: 'Lax' | 'Strict' | 'None';
    }>;
    origins?: Array<{
      origin: string;
      localStorage?: Array<{ name: string; value: string }>;
    }>;
  };
  if (parsed.cookies && parsed.cookies.length > 0) {
    await page.context().addCookies(parsed.cookies);
  }
  for (const originState of parsed.origins ?? []) {
    if (!originState.origin.startsWith(BASE_URL)) continue;
    await page.goto(originState.origin, { waitUntil: 'domcontentloaded' });
    await page.evaluate((entries) => {
      window.localStorage.clear();
      for (const entry of entries) {
        window.localStorage.setItem(entry.name, entry.value);
      }
    }, originState.localStorage ?? []);
  }
}

/** Back-compat: previous helper exported APEX_PERSONAS as a string[] of keys. */
export const APEX_PERSONAS: SourcePersonaKey[] = Object.keys(PERSONAS) as SourcePersonaKey[];
