import { Client } from 'pg';
import path from 'node:path';
import { config as loadEnv } from 'dotenv';
import { postgresClientOptions } from './postgres-client-options';

loadEnv({ path: path.resolve(process.cwd(), '.env.local') });
loadEnv();

type TenantKey = 'apex-retail' | 'meridian-health' | 'first-capital';

type TenantExpectation = {
  displayName: string;
  aliases: string[];
  minimums: Record<MetricKey, number>;
};

type MetricKey =
  | 'clients'
  | 'dataInventorySegments'
  | 'dataInventoryRecords'
  | 'contextChunks'
  | 'graphNodes'
  | 'graphEdges'
  | 'sourceEvents'
  | 'engagements'
  | 'kpis'
  | 'patternPacks';

type TenantMetricResult = {
  value: number | null;
  minimum: number;
  status: 'pass' | 'fail' | 'missing_table';
};

type TenantResult = {
  tenantKey: TenantKey;
  displayName: string;
  status: 'pass' | 'fail';
  metrics: Record<MetricKey, TenantMetricResult>;
};

const TENANT_EXPECTATIONS: Record<TenantKey, TenantExpectation> = {
  'apex-retail': {
    displayName: 'Apex Retail',
    aliases: ['apex-retail', 'apexretail'],
    minimums: {
      clients: 1,
      dataInventorySegments: 14,
      dataInventoryRecords: 400,
      contextChunks: 900,
      graphNodes: 250,
      graphEdges: 300,
      sourceEvents: 5,
      engagements: 3,
      kpis: 3,
      patternPacks: 3,
    },
  },
  'meridian-health': {
    displayName: 'Meridian Health',
    aliases: ['meridian-health', 'meridian'],
    minimums: {
      clients: 1,
      dataInventorySegments: 14,
      dataInventoryRecords: 700,
      contextChunks: 800,
      graphNodes: 400,
      graphEdges: 600,
      sourceEvents: 8,
      engagements: 3,
      kpis: 3,
      patternPacks: 3,
    },
  },
  'first-capital': {
    displayName: 'First Capital',
    aliases: ['first-capital', 'firstcapital', 'arcturus', 'brindlemark'],
    minimums: {
      clients: 1,
      dataInventorySegments: 14,
      dataInventoryRecords: 300,
      contextChunks: 800,
      graphNodes: 200,
      graphEdges: 200,
      sourceEvents: 5,
      engagements: 2,
      kpis: 3,
      patternPacks: 3,
    },
  },
};

const METRIC_ORDER: MetricKey[] = [
  'clients',
  'dataInventorySegments',
  'dataInventoryRecords',
  'contextChunks',
  'graphNodes',
  'graphEdges',
  'sourceEvents',
  'engagements',
  'kpis',
  'patternPacks',
];

function parseArgs(): { tenants: TenantKey[]; json: boolean; warnOnly: boolean } {
  const args = process.argv.slice(2);
  const tenantArg = valueAfter(args, '--tenant');
  const tenants = tenantArg
    ? tenantArg.split(',').map((tenant) => tenant.trim()).filter(Boolean) as TenantKey[]
    : Object.keys(TENANT_EXPECTATIONS) as TenantKey[];

  for (const tenant of tenants) {
    if (!Object.hasOwn(TENANT_EXPECTATIONS, tenant)) {
      throw new Error(`Unsupported tenant "${tenant}". Expected one of ${Object.keys(TENANT_EXPECTATIONS).join(', ')}.`);
    }
  }

  return {
    tenants,
    json: args.includes('--json'),
    warnOnly: args.includes('--warn-only'),
  };
}

function valueAfter(args: string[], flag: string): string | null {
  const idx = args.indexOf(flag);
  return idx >= 0 ? args[idx + 1] ?? null : null;
}

async function tableExists(client: Client, table: string): Promise<boolean> {
  const result = await client.query<{ exists: boolean }>('select to_regclass($1) is not null as exists', [`public.${table}`]);
  return Boolean(result.rows[0]?.exists);
}

async function count(client: Client, table: string, whereSql: string, params: unknown[]): Promise<number | null> {
  if (!await tableExists(client, table)) return null;
  const result = await client.query<{ count: number }>(`select count(*)::int from ${table} where ${whereSql}`, params);
  return result.rows[0]?.count ?? 0;
}

async function clientIdsForAliases(client: Client, aliases: string[]): Promise<string[]> {
  if (!await tableExists(client, 'clients')) return [];
  const result = await client.query<{ id: string }>(
    'select id::text from clients where tenant_key = any($1::text[]) or name = any($1::text[])',
    [aliases],
  );
  return result.rows.map((row) => row.id);
}

async function collectMetrics(client: Client, expectation: TenantExpectation): Promise<Record<MetricKey, number | null>> {
  const aliases = expectation.aliases;
  const clientIds = await clientIdsForAliases(client, aliases);

  return {
    clients: await count(client, 'clients', 'tenant_key = any($1::text[]) or name = any($1::text[])', [aliases]),
    dataInventorySegments: await count(client, 'data_inventory_segments', 'tenant_key = any($1::text[])', [aliases]),
    dataInventoryRecords: await count(client, 'data_inventory_records', 'tenant_key = any($1::text[])', [aliases]),
    contextChunks: await count(client, 'enterprise_context_chunks', 'tenant_key = any($1::text[])', [aliases]),
    graphNodes: await count(client, 'enterprise_graph_nodes', 'tenant_key = any($1::text[])', [aliases]),
    graphEdges: await count(client, 'enterprise_graph_edges', 'tenant_key = any($1::text[])', [aliases]),
    sourceEvents: await count(client, 'source_events', 'client_key = any($1::text[])', [aliases]),
    engagements: clientIds.length
      ? await count(client, 'engagements', 'client_id::text = any($1::text[])', [clientIds])
      : 0,
    kpis: clientIds.length
      ? await count(client, 'kpis', 'client_id::text = any($1::text[])', [clientIds])
      : 0,
    patternPacks: clientIds.length
      ? await count(client, 'pattern_packs', 'client_id::text = any($1::text[])', [clientIds])
      : 0,
  };
}

function scoreTenant(tenantKey: TenantKey, metrics: Record<MetricKey, number | null>): TenantResult {
  const expectation = TENANT_EXPECTATIONS[tenantKey];
  const scored = Object.fromEntries(METRIC_ORDER.map((metric) => {
    const value = metrics[metric];
    const minimum = expectation.minimums[metric];
    const status: TenantMetricResult['status'] = value === null
      ? 'missing_table'
      : value >= minimum
        ? 'pass'
        : 'fail';

    return [metric, { value, minimum, status }];
  })) as Record<MetricKey, TenantMetricResult>;

  return {
    tenantKey,
    displayName: expectation.displayName,
    status: Object.values(scored).every((metric) => metric.status === 'pass') ? 'pass' : 'fail',
    metrics: scored,
  };
}

function printHuman(results: TenantResult[]): void {
  for (const result of results) {
    const marker = result.status === 'pass' ? '✓' : 'x';
    console.log(`${marker} ${result.displayName} (${result.tenantKey})`);
    for (const metric of METRIC_ORDER) {
      const scored = result.metrics[metric];
      const value = scored.value === null ? 'missing table' : scored.value.toLocaleString('en-US');
      const status = scored.status === 'pass' ? 'pass' : 'FAIL';
      console.log(`  ${metric.padEnd(24)} ${String(value).padStart(14)} / min ${String(scored.minimum).padStart(5)}  ${status}`);
    }
  }
}

async function main() {
  const { tenants, json, warnOnly } = parseArgs();
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('x DATABASE_URL is required for Azure tenant data parity verification.');
    process.exit(1);
  }

  const client = new Client(postgresClientOptions(url, 'verify-azure-tenant-data-parity'));
  await client.connect();

  try {
    const results: TenantResult[] = [];
    for (const tenant of tenants) {
      const metrics = await collectMetrics(client, TENANT_EXPECTATIONS[tenant]);
      results.push(scoreTenant(tenant, metrics));
    }

    if (json) {
      console.log(JSON.stringify({ status: results.every((result) => result.status === 'pass') ? 'pass' : 'fail', results }, null, 2));
    } else {
      printHuman(results);
    }

    if (!warnOnly && results.some((result) => result.status === 'fail')) {
      process.exit(1);
    }
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error('x Azure tenant data parity verification failed.');
  console.error(error);
  process.exit(1);
});
