import type { Browser, BrowserContext, Page } from '@playwright/test';
import { CXO_PERSONAS, type CxoPersona } from '@/lib/auth/cxo-personas';

export interface CrawlPersona {
  key: string;
  tenantKey: CxoPersona['clientKey'];
  tenantName: string;
  title: string;
  email: string;
  sourceSlug: string;
}

export interface CrawlSurface {
  id: string;
  path: string;
  requiresAgentProbe?: boolean;
}

export const CRAWL_PERSONAS: CrawlPersona[] = [
  persona('apex-cfo', 'cfo-apex'),
  persona('apex-cio', 'cio-apex'),
  persona('apex-cdo', 'cdo-apex'),
  persona('meridian-cdio', 'cdio-meridian-health'),
  persona('firstcapital-cio', 'cio-firstcapital'),
];

export const PRIMARY_CRAWL_SURFACES: CrawlSurface[] = [
  { id: 'home', path: '/home' },
  { id: 'intelligence-root', path: '/intelligence' },
  { id: 'intelligence-ask', path: '/intelligence/ask', requiresAgentProbe: true },
  { id: 'intelligence-patterns', path: '/intelligence/patterns' },
  { id: 'intelligence-signals', path: '/intelligence/signals' },
  { id: 'moves-list', path: '/moves' },
  { id: 'strategic-moves-list', path: '/strategic-moves' },
  { id: 'moves-new', path: '/strategic-moves/new' },
  { id: 'programs-list', path: '/programs' },
  { id: 'programs-new', path: '/programs/new' },
  { id: 'source-list', path: '/source' },
  { id: 'source-events', path: '/source/events' },
  { id: 'source-new', path: '/source/new' },
  { id: 'source-queue', path: '/source/queue' },
  { id: 'source-portfolio', path: '/source/portfolio' },
  { id: 'source-value', path: '/source/value' },
  { id: 'tower-root', path: '/tower' },
  { id: 'tower-portfolio', path: '/tower/portfolio' },
  { id: 'tower-value', path: '/tower/lens/value' },
  { id: 'tower-risk', path: '/tower/lens/risk' },
  { id: 'tower-outcomes', path: '/tower/outcomes' },
  { id: 'home-queue', path: '/home/queue' },
  { id: 'admin-data-trust', path: '/admin/data-trust' },
  { id: 'admin-setup', path: '/admin/tenant' },
  { id: 'admin-production-readiness', path: '/admin/production-readiness' },
  { id: 'admin-releases', path: '/admin/releases' },
];

export const POST_DEPLOY_HARD_QUESTIONS = [
  'What decision should I make next, and what evidence supports it?',
  'What are the top three reasons this recommendation could be wrong?',
  'Which claims are not grounded in tenant data?',
  'What should the CFO refuse to fund until evidence improves?',
  'Which Source event should not proceed to award yet?',
  'What exact intake field blocks the procurement recommendation?',
  'What value has been verified versus merely projected?',
  'Where is tenant identity wrong or stale?',
  'What would change your recommendation?',
  'What should I ask the vendor before signing?',
] as const;

export interface PersonaContextOptions {
  baseUrl: string;
  password?: string;
  headless?: boolean;
}

export interface PersonaContext {
  context: BrowserContext;
  page: Page;
  persona: CrawlPersona;
}

export async function createIsolatedPersonaContext(
  browser: Browser,
  persona: CrawlPersona,
  options: PersonaContextOptions,
): Promise<PersonaContext> {
  const context = await browser.newContext({
    baseURL: options.baseUrl,
    storageState: undefined,
  });
  const page = await context.newPage();
  await signInPersona(page, persona, options);
  return { context, page, persona };
}

export async function signInPersona(page: Page, persona: CrawlPersona, options: PersonaContextOptions): Promise<void> {
  const password = firstPresent(
    process.env[`CRAWL_${envKey(persona.key)}_PASSWORD`],
    options.password,
    process.env.CRAWL_DEMO_PASSWORD,
    'Demo2026!',
  );
  const email = firstPresent(process.env[`CRAWL_${envKey(persona.key)}_EMAIL`], persona.email);
  const code = firstPresent(process.env.CRAWL_DEMO_CODE, '424242');

  await page.goto('/sign-in', { waitUntil: 'domcontentloaded', timeout: 45_000 });
  await page.getByPlaceholder(/name@company\.com|enter your email address/i).fill(email);
  await page.getByPlaceholder(/password from invite|enter your password/i).fill(password);
  await page.getByPlaceholder(/6-digit code|access code/i).fill(code);
  await page.getByRole('button', { name: /sign in|continue/i }).click();

  const outcome = await waitForSignInOutcome(page);
  if (outcome.type === 'alert') {
    throw new Error(`crawl_sign_in_failed: ${outcome.text}`);
  }
  if (outcome.type === 'timeout') {
    throw new Error('crawl_sign_in_timeout_no_redirect_or_session');
  }

  await page.context().addCookies([{
    name: 'abarva_active_client',
    value: persona.tenantKey,
    domain: new URL(options.baseUrl).hostname,
    path: '/',
    sameSite: 'Lax',
    secure: options.baseUrl.startsWith('https://'),
  }]);
}

export function resolveCrawlPersonas(filter?: string): CrawlPersona[] {
  if (!filter || filter === 'all') return CRAWL_PERSONAS;
  const requested = new Set(filter.split(',').map((item) => item.trim()).filter(Boolean));
  return CRAWL_PERSONAS.filter((persona) => requested.has(persona.key));
}

export function resolveCrawlSurfaces(filter?: string): CrawlSurface[] {
  if (!filter || filter === 'all') return PRIMARY_CRAWL_SURFACES;
  const requested = new Set(filter.split(',').map((item) => item.trim()).filter(Boolean));
  return PRIMARY_CRAWL_SURFACES.filter((surface) => requested.has(surface.id));
}

function persona(key: string, slug: string): CrawlPersona {
  const found = CXO_PERSONAS.find((item) => item.slug === slug);
  if (!found) throw new Error(`Missing CXO persona fixture for ${slug}`);
  return {
    key,
    tenantKey: found.clientKey,
    tenantName: found.tenant,
    title: found.titleShort,
    email: found.email,
    sourceSlug: found.slug,
  };
}

function envKey(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]+/g, '_');
}

function firstPresent(...values: Array<string | undefined>): string {
  const found = values.find((value) => value?.trim());
  if (!found) throw new Error('Missing crawl credential');
  return found.trim();
}

async function waitForSignInOutcome(page: Page): Promise<
  | { type: 'redirect' }
  | { type: 'session' }
  | { type: 'alert'; text: string }
  | { type: 'timeout' }
> {
  const redirect = page.waitForURL((url) => !url.pathname.startsWith('/sign-in'), { timeout: 25_000 })
    .then(() => ({ type: 'redirect' as const }))
    .catch(() => null);
  const session = page.waitForFunction(() => {
    const clerk = (window as unknown as {
      Clerk?: { session?: { id?: string } | null; user?: { id?: string } | null };
    }).Clerk;
    return Boolean(clerk?.session?.id || clerk?.user?.id || document.cookie.includes('__session='));
  }, null, { timeout: 25_000 })
    .then(() => ({ type: 'session' as const }))
    .catch(() => null);
  const alert = page.getByRole('alert').waitFor({ state: 'visible', timeout: 25_000 })
    .then(async () => ({
      type: 'alert' as const,
      text: (await page.getByRole('alert').innerText().catch(() => 'unknown sign-in error')).trim(),
    }))
    .catch(() => null);
  const timeout = new Promise<{ type: 'timeout' }>((resolve) => {
    setTimeout(() => resolve({ type: 'timeout' }), 26_000);
  });

  const outcome = await Promise.race([redirect, session, alert, timeout]);
  return outcome ?? { type: 'timeout' };
}
