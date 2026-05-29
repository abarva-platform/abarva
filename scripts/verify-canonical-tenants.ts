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
};

const expectedByKey: ReadonlyMap<string, (typeof CANONICAL_TENANTS)[number]> =
  new Map(CANONICAL_TENANTS.map((tenant) => [tenant.key, tenant]));

function fail(message: string): never {
  console.error(`verify-canonical-tenants: ${message}`);
  process.exit(1);
}

function validateStaticAllowlist() {
  const keys = CANONICAL_TENANTS.map((tenant) => tenant.key);
  const unique = new Set(keys);
  if (keys.length !== 5) fail(`expected 5 canonical tenants, found ${keys.length}`);
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

async function main(): Promise<number> {
  validateStaticAllowlist();

  if (!process.env.DATABASE_URL) {
    console.log('verify-canonical-tenants: static allowlist clean; DATABASE_URL absent, skipping live drift check.');
    return 0;
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    const { rows } = await client.query<ClientRow>(`
      SELECT id::text, name, tenant_key, slug, industry_code, industry
      FROM public.clients
      ORDER BY tenant_key NULLS LAST, name
    `);

    const liveKeys = rows.map((row) => row.tenant_key).filter((key): key is string => Boolean(key));
    const expectedKeys = CANONICAL_TENANTS.map((tenant) => tenant.key);
    const extras = liveKeys.filter((key) => !expectedByKey.has(key));
    const missing = expectedKeys.filter((key) => !liveKeys.includes(key));

    if (rows.length !== CANONICAL_TENANTS.length) {
      fail(`expected ${CANONICAL_TENANTS.length} client rows, found ${rows.length}`);
    }
    if (extras.length > 0) fail(`unexpected tenant keys in clients: ${extras.join(', ')}`);
    if (missing.length > 0) fail(`missing tenant keys in clients: ${missing.join(', ')}`);

    for (const row of rows) {
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
    }
  } finally {
    await client.end();
  }

  console.log(`verify-canonical-tenants: clean (${CANONICAL_TENANTS.length} canonical tenants verified).`);
  return 0;
}

main().then((code) => process.exit(code)).catch((error) => {
  console.error('verify-canonical-tenants: unexpected error', error);
  process.exit(2);
});
