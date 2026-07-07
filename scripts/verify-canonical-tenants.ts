import { Client } from 'pg';
import { config as loadEnv } from 'dotenv';
import path from 'node:path';

import { CANONICAL_TENANTS } from '../src/config/tenants/CANONICAL_TENANTS';

loadEnv({ path: '/Users/anand/Projects/nexus/.env.local', quiet: true });
loadEnv({ path: '/Users/anand/Projects/nexus/.env', quiet: true });
loadEnv({ path: path.resolve(process.cwd(), '.env.local'), quiet: true });
loadEnv({ path: path.resolve(process.cwd(), '.env'), quiet: true });

type ClientRow = {
  id: string;
  name: string;
  tenant_key: string | null;
  slug: string | null;
  industry_code: string | null;
  industry: string | null;
  holding_group_id: string | null;
  parent_client_id: string | null;
  holding_group_role: string | null;
  aggregate_visibility_level: string | null;
};

const expectedByKey: ReadonlyMap<string, (typeof CANONICAL_TENANTS)[number]> =
  new Map(CANONICAL_TENANTS.map((tenant) => [tenant.key, tenant]));

const LAKESHORE_HOLDING_GROUP_ID = '830de810-0000-4c9e-8f59-000000000000';

type AllowedChildClient = {
  name: string;
  parentKey: string;
  industryCode: string;
};

const ALLOWED_CHILD_CLIENTS: ReadonlyMap<string, AllowedChildClient> = new Map([
  [
    'morgan-street-holdings',
    {
      name: 'Morgan Street Holdings Chicago',
      parentKey: 'lakeshore-holdings',
      industryCode: 'diversified_holdco',
    },
  ],
  [
    'roosevelt-holdings',
    {
      name: 'Roosevelt Holdings Atlanta',
      parentKey: 'lakeshore-holdings',
      industryCode: 'diversified_holdco',
    },
  ],
  [
    'lakefront-capital',
    {
      name: 'Lakefront Capital Boston',
      parentKey: 'lakeshore-holdings',
      industryCode: 'diversified_holdco',
    },
  ],
]);

const LIVE_DRIFT_CHECK_ATTEMPTS = 6;
const LIVE_DRIFT_CHECK_RETRY_MS = 15_000;

function fail(message: string): never {
  console.error(`verify-canonical-tenants: ${message}`);
  process.exit(1);
}

function assertAzureDatabaseUrl(connectionString: string): void {
  let host = '';
  try {
    host = new URL(connectionString).hostname.toLowerCase();
  } catch {
    fail('DATABASE_URL is not a valid Postgres URL');
  }

  const supabaseMarkers = ['supabase.co', 'supabase.com', 'pooler.supabase.com', 'xtbymdryojmvoulaotce'];
  if (supabaseMarkers.some((marker) => host.includes(marker))) {
    fail('DATABASE_URL points at Supabase; canonical tenant drift must run against Azure/Postgres only');
  }
}

function validateStaticAllowlist() {
  const keys = CANONICAL_TENANTS.map((tenant) => tenant.key);
  const unique = new Set(keys);
  if (unique.size !== keys.length) fail('canonical tenant keys must be unique');
  for (const tenant of CANONICAL_TENANTS) {
    if (!tenant.key || !tenant.name || !tenant.industry) {
      fail(`tenant entry is incomplete: ${JSON.stringify(tenant)}`);
    }
    if (tenant.key !== tenant.key.toLowerCase() || tenant.key.includes('_')) {
      fail(`tenant key must be lower kebab-case: ${tenant.key}`);
    }
    if (tenant.industry !== tenant.industry.toLowerCase() || tenant.industry.includes('-')) {
      fail(`industry code must be lower snake_case: ${tenant.industry}`);
    }
  }
}

function normalize(value: string | null | undefined) {
  return String(value ?? '').trim().toLowerCase();
}

function isSessionPoolPressure(error: unknown): boolean {
  const record = error as { code?: unknown; message?: unknown };
  const message = typeof record?.message === 'string' ? record.message : '';
  return (
    record?.code === 'XX000' &&
    (/EMAXCONNSESSION/i.test(message) || /max clients reached in session mode/i.test(message))
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runLiveDriftCheck(): Promise<void> {
  const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  let connected = false;
  try {
    await client.connect();
    connected = true;
    const { rows } = await client.query<ClientRow>(`
      SELECT
        id::text,
        name,
        tenant_key,
        slug,
        industry_code,
        industry,
        holding_group_id::text,
        parent_client_id::text,
        holding_group_role,
        aggregate_visibility_level
      FROM public.clients
      ORDER BY tenant_key NULLS LAST, name
    `);

    const parentRowsByKey = new Map(rows.map((row) => [row.tenant_key ?? '', row]));
    const liveKeys = rows.map((row) => row.tenant_key).filter((key): key is string => Boolean(key));
    const expectedKeys = CANONICAL_TENANTS.map((tenant) => tenant.key);
    const extras = liveKeys.filter((key) => !expectedByKey.has(key) && !ALLOWED_CHILD_CLIENTS.has(key));
    const missing = expectedKeys.filter((key) => !liveKeys.includes(key));

    const canonicalRows = rows.filter((row) => expectedByKey.has(row.tenant_key ?? ''));
    if (canonicalRows.length !== CANONICAL_TENANTS.length) {
      fail(`expected ${CANONICAL_TENANTS.length} canonical client rows, found ${canonicalRows.length}`);
    }
    if (extras.length > 0) fail(`unexpected tenant keys in clients: ${extras.join(', ')}`);
    if (missing.length > 0) fail(`missing tenant keys in clients: ${missing.join(', ')}`);

    for (const row of canonicalRows) {
      const expected = expectedByKey.get(row.tenant_key ?? '');
      if (!expected) continue;
      if (row.slug !== expected.key) fail(`${expected.key}: slug=${row.slug ?? '(null)'} expected ${expected.key}`);
      if (normalize(row.name) !== normalize(expected.name)) {
        fail(`${expected.key}: name=${row.name} expected ${expected.name}`);
      }
      if (normalize(row.industry_code) !== expected.industry) {
        fail(`${expected.key}: industry_code=${row.industry_code ?? '(null)'} expected ${expected.industry}`);
      }
      if (normalize(row.industry) !== expected.industry) {
        fail(`${expected.key}: industry=${row.industry ?? '(null)'} expected ${expected.industry}`);
      }
      if (expected.key === 'lakeshore-holdings') {
        if (row.holding_group_id !== LAKESHORE_HOLDING_GROUP_ID) {
          fail(`${expected.key}: holding_group_id=${row.holding_group_id ?? '(null)'} expected ${LAKESHORE_HOLDING_GROUP_ID}`);
        }
        if (row.holding_group_role !== 'l0_sponsor') {
          fail(`${expected.key}: holding_group_role=${row.holding_group_role ?? '(null)'} expected l0_sponsor`);
        }
        if (row.aggregate_visibility_level !== 'group_aggregate') {
          fail(`${expected.key}: aggregate_visibility_level=${row.aggregate_visibility_level ?? '(null)'} expected group_aggregate`);
        }
      }
    }

    for (const [tenantKey, expected] of ALLOWED_CHILD_CLIENTS) {
      const row = parentRowsByKey.get(tenantKey);
      if (!row) fail(`missing allowed child client: ${tenantKey}`);
      const parent = parentRowsByKey.get(expected.parentKey);
      if (!parent) fail(`${tenantKey}: parent ${expected.parentKey} is missing`);
      if (row.slug !== tenantKey) fail(`${tenantKey}: slug=${row.slug ?? '(null)'} expected ${tenantKey}`);
      if (normalize(row.name) !== normalize(expected.name)) {
        fail(`${tenantKey}: name=${row.name} expected ${expected.name}`);
      }
      if (normalize(row.industry_code) !== expected.industryCode) {
        fail(`${tenantKey}: industry_code=${row.industry_code ?? '(null)'} expected ${expected.industryCode}`);
      }
      if (row.holding_group_id !== LAKESHORE_HOLDING_GROUP_ID) {
        fail(`${tenantKey}: holding_group_id=${row.holding_group_id ?? '(null)'} expected ${LAKESHORE_HOLDING_GROUP_ID}`);
      }
      if (row.parent_client_id !== parent.id) {
        fail(`${tenantKey}: parent_client_id=${row.parent_client_id ?? '(null)'} expected ${parent.id}`);
      }
      if (row.holding_group_role !== 'l1_holdco') {
        fail(`${tenantKey}: holding_group_role=${row.holding_group_role ?? '(null)'} expected l1_holdco`);
      }
      if (row.aggregate_visibility_level !== 'group_aggregate') {
        fail(`${tenantKey}: aggregate_visibility_level=${row.aggregate_visibility_level ?? '(null)'} expected group_aggregate`);
      }
    }
  } finally {
    if (connected) await client.end();
  }
}

async function runLiveDriftCheckWithRetry(): Promise<void> {
  for (let attempt = 1; attempt <= LIVE_DRIFT_CHECK_ATTEMPTS; attempt += 1) {
    try {
      await runLiveDriftCheck();
      return;
    } catch (error) {
      if (!isSessionPoolPressure(error) || attempt === LIVE_DRIFT_CHECK_ATTEMPTS) throw error;
      console.warn(
        `verify-canonical-tenants: session pool is saturated; retrying ${attempt}/${LIVE_DRIFT_CHECK_ATTEMPTS - 1} in ${LIVE_DRIFT_CHECK_RETRY_MS / 1000}s`,
      );
      await sleep(LIVE_DRIFT_CHECK_RETRY_MS);
    }
  }
}

async function main(): Promise<number> {
  validateStaticAllowlist();

  if (!process.env.DATABASE_URL) {
    console.log('verify-canonical-tenants: static allowlist clean; DATABASE_URL absent, skipping live drift check.');
    return 0;
  }

  assertAzureDatabaseUrl(process.env.DATABASE_URL);

  await runLiveDriftCheckWithRetry();

  console.log(
    `verify-canonical-tenants: clean (${CANONICAL_TENANTS.length} canonical tenants + ${ALLOWED_CHILD_CLIENTS.size} Lakeshore child clients verified).`,
  );
  return 0;
}

main().then((code) => process.exit(code)).catch((error) => {
  console.error('verify-canonical-tenants: unexpected error', error);
  process.exit(2);
});
