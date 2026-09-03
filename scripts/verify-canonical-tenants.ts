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
  industry_code?: string | null;
  industry?: string | null;
  holding_group_id: string | null;
  parent_client_id: string | null;
  holding_group_role: string | null;
  aggregate_visibility_level: string | null;
};

type ClientColumn = keyof ClientRow;

const expectedByKey: ReadonlyMap<string, (typeof CANONICAL_TENANTS)[number]> =
  new Map(CANONICAL_TENANTS.map((tenant) => [tenant.key, tenant]));

const LIVE_DRIFT_CHECK_ATTEMPTS = 6;
const LIVE_DRIFT_CHECK_RETRY_MS = 15_000;
const REQUIRED_CLIENT_COLUMNS = ['id', 'name', 'tenant_key', 'slug'] as const satisfies readonly ClientColumn[];
const OPTIONAL_CLIENT_COLUMNS = [
  'industry_code',
  'industry',
  'holding_group_id',
  'parent_client_id',
  'holding_group_role',
  'aggregate_visibility_level',
] as const satisfies readonly ClientColumn[];

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

async function discoverClientColumns(client: Client): Promise<ReadonlySet<ClientColumn>> {
  const expectedColumns = [...REQUIRED_CLIENT_COLUMNS, ...OPTIONAL_CLIENT_COLUMNS];
  const { rows } = await client.query<{ column_name: ClientColumn }>(
    `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'clients'
        AND column_name = ANY($1::text[])
    `,
    [expectedColumns],
  );

  return new Set(rows.map((row) => row.column_name));
}

function clientSelectList(columns: ReadonlySet<ClientColumn>): string {
  const selectExpressions: string[] = [];

  for (const column of REQUIRED_CLIENT_COLUMNS) {
    selectExpressions.push(column === 'id' ? 'id::text AS id' : column);
  }

  for (const column of OPTIONAL_CLIENT_COLUMNS) {
    if (!columns.has(column)) continue;
    selectExpressions.push(
      column === 'holding_group_id' || column === 'parent_client_id'
        ? `${column}::text AS ${column}`
        : column,
    );
  }

  return selectExpressions.join(',\n        ');
}

async function runLiveDriftCheck(): Promise<void> {
  const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  let connected = false;
  try {
    await client.connect();
    connected = true;
    const columns = await discoverClientColumns(client);
    const missingRequiredColumns = REQUIRED_CLIENT_COLUMNS.filter((column) => !columns.has(column));
    if (missingRequiredColumns.length > 0) {
      fail(`clients schema missing required column(s): ${missingRequiredColumns.join(', ')}`);
    }

    const { rows } = await client.query<ClientRow>(`
      SELECT
        ${clientSelectList(columns)}
      FROM public.clients
      ORDER BY tenant_key NULLS LAST, name
    `);

    const liveKeys = rows.map((row) => row.tenant_key).filter((key): key is string => Boolean(key));
    const expectedKeys = CANONICAL_TENANTS.map((tenant) => tenant.key);
    const extras = liveKeys.filter((key) => !expectedByKey.has(key));
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
      if (columns.has('industry_code') && normalize(row.industry_code) !== expected.industry) {
        fail(`${expected.key}: industry_code=${row.industry_code ?? '(null)'} expected ${expected.industry}`);
      }
      if (columns.has('industry') && normalize(row.industry) !== expected.industry) {
        fail(`${expected.key}: industry=${row.industry ?? '(null)'} expected ${expected.industry}`);
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
    `verify-canonical-tenants: clean (${CANONICAL_TENANTS.length} canonical tenants verified).`,
  );
  return 0;
}

main().then((code) => process.exit(code)).catch((error) => {
  console.error('verify-canonical-tenants: unexpected error', error);
  process.exit(2);
});
