import fs from 'node:fs';
import path from 'node:path';

import { createClerkClient } from '@clerk/backend';
import { chromium, type BrowserContext, type Page } from '@playwright/test';
import { config as loadEnv } from 'dotenv';

import { AGENT_CLIENT_LOGINS } from '../../src/lib/auth/agent-client-logins';

import {
  RESPONSIBLE_AI_ACKNOWLEDGMENT_ROUTE,
  RESPONSIBLE_AI_ACKNOWLEDGMENT_VERSION,
} from '../../src/lib/ai-liability/responsible-ai-acknowledgment-copy';
import {
  RESPONSIBLE_AI_TRAINING_ROUTE,
  RESPONSIBLE_AI_TRAINING_VERSION,
} from '../../src/lib/ai-liability/responsible-ai-training-copy';

type ClientKey =
  | 'apexretail'
  | 'meridian'
  | 'arcturus'
  | 'northstar'
  | 'skyharbor'
  | 'lakeshore';

type AgentAuthPersona = {
  key: string;
  clientKey: ClientKey;
  tenantName: string;
  email: string;
  role: string;
  storageFile: string;
  probeRoutes: string[];
};

type PrimeResult = {
  persona: AgentAuthPersona;
  status: 'pass' | 'fail' | 'skip';
  storagePath: string;
  detail: string;
};

const REPO_ROOT = process.cwd();
const DEFAULT_BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';
const AUTH_DIR = path.join(REPO_ROOT, '.auth');
const REPORT_DIR = path.join(REPO_ROOT, 'reports', 'agent-client-auth');
const ACTIVE_CLIENT_COOKIE = 'abarva_active_client';
const ACTIVE_CLIENT_LOCAL_STORAGE_KEY = 'abarva_selected_client';

// One automation persona per client, derived from the canonical agent roster
// (src/lib/auth/agent-client-logins.ts). Replaces the prior hardcoded human
// CXO emails (removed → access-stale). Each agent probes all main surfaces for
// its tenant. Provision the underlying Clerk users once with:
//   npx tsx scripts/provision-cxo-personas.ts --agents --apply
const PERSONAS: AgentAuthPersona[] = AGENT_CLIENT_LOGINS.map((login) => ({
  key: login.slug,
  clientKey: login.clientKey,
  tenantName: login.tenant,
  email: login.email,
  role: 'Automation agent',
  storageFile: `agent-${login.clientKey}.json`,
  probeRoutes: [
    `/home?client=${login.clientKey}`,
    `/intelligence?client=${login.clientKey}`,
    `/tower?client=${login.clientKey}`,
    `/source?client=${login.clientKey}`,
    `/strategic-moves?client=${login.clientKey}`,
  ],
}));

const TENANT_NAMES_BY_CLIENT = new Map<ClientKey, string>(
  PERSONAS.map((persona) => [persona.clientKey, persona.tenantName]),
);

function loadEnvFiles(): void {
  for (const candidate of [
    path.join(REPO_ROOT, '.env.local'),
    path.join(REPO_ROOT, '.env'),
  ]) {
    if (fs.existsSync(candidate)) {
      loadEnv({ path: candidate, override: false });
    }
  }
}

function parseArgs() {
  const args = process.argv.slice(2);
  const getValue = (name: string): string | null => {
    const inline = args.find((arg) => arg.startsWith(`${name}=`));
    if (inline) return inline.slice(name.length + 1);
    const index = args.indexOf(name);
    return index >= 0 ? args[index + 1] ?? null : null;
  };

  const selectedClient = getValue('--client') as ClientKey | null;
  const selectedPersona = getValue('--persona');
  return {
    baseUrl: getValue('--base-url') ?? DEFAULT_BASE_URL,
    client: selectedClient,
    persona: selectedPersona,
    list: args.includes('--list'),
    refresh: args.includes('--refresh'),
    includeOptionalProbeFailures: args.includes('--strict-probes'),
  };
}

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

function selectedPersonas(args: ReturnType<typeof parseArgs>): AgentAuthPersona[] {
  let personas = PERSONAS;
  if (args.client) personas = personas.filter((persona) => persona.clientKey === args.client);
  if (args.persona) personas = personas.filter((persona) => persona.key === args.persona);
  return personas;
}

function normalizeMetadataValue(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function metadataKeys(value: unknown): string[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
  return Object.keys(value as Record<string, unknown>);
}

function validateClientLock(persona: AgentAuthPersona, metadata: Record<string, unknown>): void {
  const clientId = normalizeMetadataValue(metadata.clientId);
  const defaultClientId = normalizeMetadataValue(metadata.defaultClientId);
  const tenantKey = normalizeMetadataValue(metadata.tenantKey);
  const visibleClientKeys = Array.isArray(metadata.visibleClientKeys)
    ? metadata.visibleClientKeys.filter((value): value is string => typeof value === 'string')
    : [];
  const allowedClientKeys = Array.isArray(metadata.allowedClientKeys)
    ? metadata.allowedClientKeys.filter((value): value is string => typeof value === 'string')
    : [];
  const tenantRoles = metadataKeys(metadata.tenantRoles);

  if (clientId !== persona.clientKey) {
    throw new Error(
      `${persona.email} publicMetadata.clientId=${clientId ?? '<missing>'}; expected ${persona.clientKey}.`,
    );
  }

  if (defaultClientId && defaultClientId !== persona.clientKey) {
    throw new Error(
      `${persona.email} publicMetadata.defaultClientId=${defaultClientId}; expected ${persona.clientKey}.`,
    );
  }

  for (const [label, keys] of [
    ['visibleClientKeys', visibleClientKeys],
    ['allowedClientKeys', allowedClientKeys],
    ['tenantRoles', tenantRoles],
  ] as const) {
    const unique = [...new Set(keys)];
    if (unique.length > 1 || (unique.length === 1 && unique[0] !== persona.clientKey)) {
      throw new Error(
        `${persona.email} publicMetadata.${label} exposes ${unique.join(', ') || '<none>'}; expected only ${persona.clientKey}.`,
      );
    }
  }

  if ((tenantKey && tenantKey.includes(',')) || tenantKey?.includes(';')) {
    throw new Error(`${persona.email} publicMetadata.tenantKey looks multi-valued: ${tenantKey}.`);
  }
}

async function signInWithTicket(page: Page, baseUrl: string, userId: string): Promise<void> {
  const clerk = createClerkClient({ secretKey: requireEnv('CLERK_SECRET_KEY') });
  const signInToken = await clerk.signInTokens.createSignInToken({
    userId,
    expiresInSeconds: 300,
  });

  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(
    () => (window as Window & { Clerk?: { loaded?: boolean } }).Clerk?.loaded === true,
    null,
    { timeout: 20000 },
  );
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

  await page.waitForFunction(() => document.cookie.includes('__session='), null, { timeout: 20000 });
}

async function pinActiveClient(context: BrowserContext, page: Page, baseUrl: string, clientKey: ClientKey): Promise<void> {
  const url = new URL(baseUrl);
  await context.addCookies([
    {
      name: ACTIVE_CLIENT_COOKIE,
      value: clientKey,
      domain: url.hostname,
      path: '/',
      sameSite: 'Lax',
      secure: url.protocol === 'https:',
    },
  ]);

  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await page.evaluate(
    ({ cookieName, storageKey, clientKey: activeClient }) => {
      window.localStorage.setItem(storageKey, activeClient);
      document.cookie = `${cookieName}=${encodeURIComponent(activeClient)}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    },
    { cookieName: ACTIVE_CLIENT_COOKIE, storageKey: ACTIVE_CLIENT_LOCAL_STORAGE_KEY, clientKey },
  );
}

async function acknowledgeResponsibleAi(page: Page, baseUrl: string): Promise<void> {
  const ackUrl = new URL(RESPONSIBLE_AI_ACKNOWLEDGMENT_ROUTE, baseUrl).toString();
  const response = await page.goto(ackUrl, { waitUntil: 'domcontentloaded' }).catch(() => null);
  if (response && response.status() >= 400 && response.status() !== 404) {
    throw new Error(`Responsible AI acknowledgment route returned ${response.status()}.`);
  }

  if (!page.url().includes(RESPONSIBLE_AI_ACKNOWLEDGMENT_ROUTE)) return;

  const apiResponse = await page.request.post('/api/ai-liability/responsible-ai-acknowledgment', {
    data: {
      accepted: true,
      textVersion: RESPONSIBLE_AI_ACKNOWLEDGMENT_VERSION,
    },
  });
  if (![200, 409].includes(apiResponse.status())) {
    throw new Error(`Responsible AI acknowledgment API returned ${apiResponse.status()}.`);
  }
}

async function completeResponsibleAiTraining(page: Page, baseUrl: string): Promise<void> {
  const trainingUrl = new URL(RESPONSIBLE_AI_TRAINING_ROUTE, baseUrl).toString();
  const response = await page.goto(trainingUrl, { waitUntil: 'domcontentloaded' }).catch(() => null);
  if (response && response.status() >= 400 && response.status() !== 404) {
    throw new Error(`Responsible AI training route returned ${response.status()}.`);
  }

  if (!page.url().includes(RESPONSIBLE_AI_TRAINING_ROUTE)) return;

  const apiResponse = await page.request.post('/api/ai-liability/responsible-ai-training', {
    data: {
      completed: true,
      trainingVersion: RESPONSIBLE_AI_TRAINING_VERSION,
    },
  });
  if (![200, 409].includes(apiResponse.status())) {
    throw new Error(`Responsible AI training API returned ${apiResponse.status()}.`);
  }
}

async function probeRoutes(
  page: Page,
  baseUrl: string,
  persona: AgentAuthPersona,
  strict: boolean,
): Promise<string[]> {
  const notes: string[] = [];
  const expectedTenantName = persona.tenantName;
  const foreignTenantNames = [...TENANT_NAMES_BY_CLIENT.entries()]
    .filter(([clientKey]) => clientKey !== persona.clientKey)
    .map(([, tenantName]) => tenantName);
  for (const route of persona.probeRoutes) {
    const url = new URL(route, baseUrl).toString();
    const response = await page.goto(url, { waitUntil: 'domcontentloaded' }).catch((error: unknown) => {
      notes.push(`${route}: navigation error ${error instanceof Error ? error.message : String(error)}`);
      return null;
    });
    const status = response?.status() ?? 0;
    const landedOnSignIn = page.url().includes('/sign-in');
    if (landedOnSignIn || status >= 400) {
      const note = `${route}: ${landedOnSignIn ? 'redirected to sign-in' : `HTTP ${status}`}`;
      if (strict) throw new Error(note);
      notes.push(note);
    } else {
      const bodyText = await page.locator('body').innerText({ timeout: 10000 }).catch(() => '');
      const landedUrl = page.url();
      const leakedTenantName = foreignTenantNames.find((tenantName) =>
        bodyText.includes(tenantName),
      );
      if (leakedTenantName) {
        throw new Error(
          `${route}: landed on ${landedUrl} but rendered foreign tenant "${leakedTenantName}".`,
        );
      }
      notes.push(
        bodyText.includes(expectedTenantName)
          ? `${route}: ok (${expectedTenantName})`
          : `${route}: ok (no foreign tenant copy; expected tenant text not rendered)`,
      );
    }
  }
  return notes;
}

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}. Use a local .env.local; never commit it.`);
  return value;
}

async function primePersona(
  persona: AgentAuthPersona,
  args: ReturnType<typeof parseArgs>,
): Promise<PrimeResult> {
  const storagePath = path.join(AUTH_DIR, persona.storageFile);
  try {
    if (args.refresh) fs.rmSync(storagePath, { force: true });

    const clerk = createClerkClient({ secretKey: requireEnv('CLERK_SECRET_KEY') });
    const users = await clerk.users.getUserList({ emailAddress: [persona.email], limit: 1 });
    const user = users.data[0];
    if (!user) {
      throw new Error(
        `No Clerk user found. Provision first: npx tsx scripts/provision-cxo-personas.ts --client ${persona.clientKey} --clerk-only --apply`,
      );
    }

    validateClientLock(persona, user.publicMetadata ?? {});

    const browser = await chromium.launch();
    try {
      const context = await browser.newContext({ baseURL: args.baseUrl });
      const page = await context.newPage();

      await signInWithTicket(page, args.baseUrl, user.id);
      await pinActiveClient(context, page, args.baseUrl, persona.clientKey);
      await acknowledgeResponsibleAi(page, args.baseUrl);
      await completeResponsibleAiTraining(page, args.baseUrl);
      await pinActiveClient(context, page, args.baseUrl, persona.clientKey);
      const probeNotes = await probeRoutes(page, args.baseUrl, persona, args.includeOptionalProbeFailures);

      await context.storageState({ path: storagePath });
      await context.close();

      return {
        persona,
        status: 'pass',
        storagePath,
        detail: probeNotes.join('; '),
      };
    } finally {
      await browser.close();
    }
  } catch (error) {
    return {
      persona,
      status: 'fail',
      storagePath,
      detail: error instanceof Error ? error.message : String(error),
    };
  }
}

function writeReport(results: PrimeResult[], baseUrl: string): string {
  ensureDir(REPORT_DIR);
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = path.join(REPORT_DIR, `agent-client-auth-${stamp}.md`);
  const lines = [
    '# Agent Client Auth State Report',
    '',
    `Generated: ${new Date().toISOString()}`,
    `Base URL: ${baseUrl}`,
    '',
    'These storageState files contain live Clerk session cookies. They must stay local under `.auth/` and must never be committed.',
    '',
    '| Status | Persona | Client | Email | Storage state | Detail |',
    '| --- | --- | --- | --- | --- | --- |',
    ...results.map((result) => [
      result.status,
      result.persona.key,
      result.persona.clientKey,
      result.persona.email,
      path.relative(REPO_ROOT, result.storagePath),
      result.detail.replace(/\|/g, '\\|'),
    ].join(' | ')).map((row) => `| ${row} |`),
    '',
  ];
  fs.writeFileSync(reportPath, `${lines.join('\n')}\n`);
  return reportPath;
}

async function main(): Promise<void> {
  loadEnvFiles();
  const args = parseArgs();
  const personas = selectedPersonas(args);

  if (args.list) {
    for (const persona of personas.length ? personas : PERSONAS) {
      console.log(`${persona.key}\t${persona.clientKey}\t${persona.email}\t.auth/${persona.storageFile}`);
    }
    return;
  }

  if (personas.length === 0) {
    throw new Error('No matching personas. Use --list to see valid --client and --persona values.');
  }

  ensureDir(AUTH_DIR);
  const results: PrimeResult[] = [];
  for (const persona of personas) {
    const result = await primePersona(persona, args);
    results.push(result);
    const prefix = result.status === 'pass' ? '[PASS]' : '[FAIL]';
    console.log(`${prefix} ${persona.key} -> ${path.relative(REPO_ROOT, result.storagePath)}: ${result.detail}`);
  }

  const reportPath = writeReport(results, args.baseUrl);
  console.log(`Report: ${path.relative(REPO_ROOT, reportPath)}`);

  if (results.some((result) => result.status === 'fail')) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
