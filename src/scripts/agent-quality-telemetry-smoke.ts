#!/usr/bin/env -S npx tsx
// L7 durable agent-quality telemetry smoke.
//
// Verifies the `agent_quality_violation_events` table created in AZLAB46:
// table/index presence, service-side insert/read, tenant-scoped RLS read,
// and cross-tenant denial. By default the probe runs in a transaction and
// rolls back. Pass --commit-fixture to leave one synthetic row behind as
// durable evidence for a live Azure run.

import path from 'node:path';
import { config as loadEnv } from 'dotenv';
import { Client } from 'pg';
import { postgresClientOptions } from './postgres-client-options';

loadEnv({ path: path.resolve(process.cwd(), '.env.local') });
loadEnv();

interface Options {
  databaseUrl: string;
  tenantKey: string;
  otherTenantKey: string;
  dryRun: boolean;
  commitFixture: boolean;
}

interface SmokeSummary {
  tableExists: boolean;
  tenantIndexExists: boolean;
  ginIndexExists: boolean;
  insertedId: string | null;
  serviceVisibleRows: number;
  authenticatedTenantVisibleRows: number;
  authenticatedOtherTenantVisibleRows: number;
  committed: boolean;
}

function parseArgs(argv: string[]): Options {
  const options: Options = {
    databaseUrl:
      process.env.AGENT_QUALITY_DATABASE_URL ??
      process.env.AZURE_LAB_DATABASE_URL ??
      process.env.DATABASE_URL ??
      '',
    tenantKey: 'apex-retail',
    otherTenantKey: 'meridian-health',
    dryRun: false,
    commitFixture: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const raw = argv[index];
    const [key, inlineValue] = raw.split('=', 2);
    const nextValue = inlineValue ?? argv[index + 1];
    const consume = inlineValue === undefined;

    switch (key) {
      case '--database-url':
        options.databaseUrl = nextValue;
        if (consume) index += 1;
        break;
      case '--tenant-key':
        options.tenantKey = nextValue;
        if (consume) index += 1;
        break;
      case '--other-tenant-key':
        options.otherTenantKey = nextValue;
        if (consume) index += 1;
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--commit-fixture':
        options.commitFixture = true;
        break;
      default:
        throw new Error(`Unknown argument: ${raw}`);
    }
  }

  if (!options.dryRun && !options.databaseUrl) {
    throw new Error(
      'Missing AGENT_QUALITY_DATABASE_URL, AZURE_LAB_DATABASE_URL, DATABASE_URL, or --database-url. Use --dry-run to inspect the plan.',
    );
  }
  if (!options.tenantKey.trim()) throw new Error('Missing --tenant-key.');
  if (!options.otherTenantKey.trim()) throw new Error('Missing --other-tenant-key.');
  if (options.tenantKey === options.otherTenantKey) {
    throw new Error('--tenant-key and --other-tenant-key must differ.');
  }

  return options;
}

async function relationExists(client: Client, relationName: string, relationKind: 'table' | 'index'): Promise<boolean> {
  const result = await client.query<{ exists: boolean }>(
    `
      select exists (
        select 1
          from pg_class c
          join pg_namespace n on n.oid = c.relnamespace
         where n.nspname = 'public'
           and c.relname = $1
           and c.relkind = $2
      ) as exists
    `,
    [relationName, relationKind === 'table' ? 'r' : 'i'],
  );
  return result.rows[0]?.exists === true;
}

async function insertFixture(client: Client, tenantKey: string): Promise<string> {
  const id = `vlt_l7_smoke_${Date.now()}`;
  await client.query(
    `
      insert into agent_quality_violation_events (
        id,
        event_timestamp,
        route,
        surface,
        tenant_client_key,
        user_id,
        violation_count,
        violation_types,
        violations,
        response_length,
        metadata
      )
      values (
        $1,
        now(),
        '/api/chat/agent',
        '/intelligence',
        $2,
        'l7-telemetry-smoke',
        1,
        array['sentinel-internal-consistency'],
        $3::jsonb,
        240,
        $4::jsonb
      )
    `,
    [
      id,
      tenantKey,
      JSON.stringify([
        {
          type: 'sentinel-internal-consistency',
          detail: 'synthetic l7 telemetry smoke violation',
        },
      ]),
      JSON.stringify({
        l7TelemetrySmoke: true,
        generatedBy: 'agent-quality-telemetry-smoke',
      }),
    ],
  );
  return id;
}

async function countVisible(client: Client, id: string): Promise<number> {
  const result = await client.query<{ count: string }>(
    `select count(*)::text from agent_quality_violation_events where id = $1`,
    [id],
  );
  return Number(result.rows[0]?.count ?? '0');
}

async function applyAuthenticatedContext(client: Client, tenantKey: string): Promise<void> {
  await client.query('select set_config($1, $2, true)', [
    'request.jwt.claims',
    JSON.stringify({
      tenant_key: tenantKey,
      role: 'observer',
      sub: 'l7-telemetry-smoke',
    }),
  ]);
  await client.query('set local role authenticated');
}

async function runSmoke(options: Options): Promise<SmokeSummary> {
  const client = new Client(postgresClientOptions(options.databaseUrl, 'l7-agent-quality-telemetry-smoke'));
  await client.connect();

  try {
    const tableExists = await relationExists(client, 'agent_quality_violation_events', 'table');
    const tenantIndexExists = await relationExists(
      client,
      'idx_agent_quality_violation_events_tenant_ts',
      'index',
    );
    const ginIndexExists = await relationExists(
      client,
      'idx_agent_quality_violation_events_type_gin',
      'index',
    );

    if (!tableExists) {
      throw new Error('agent_quality_violation_events table is missing. Apply migrations first.');
    }
    if (!tenantIndexExists || !ginIndexExists) {
      throw new Error('agent_quality_violation_events indexes are incomplete. Apply migrations first.');
    }

    await client.query('begin');
    const insertedId = await insertFixture(client, options.tenantKey);
    const serviceVisibleRows = await countVisible(client, insertedId);
    if (serviceVisibleRows !== 1) {
      throw new Error(`service role could not read inserted telemetry row; count=${serviceVisibleRows}`);
    }

    await applyAuthenticatedContext(client, options.tenantKey);
    const authenticatedTenantVisibleRows = await countVisible(client, insertedId);
    if (authenticatedTenantVisibleRows !== 1) {
      throw new Error(
        `authenticated tenant could not read its telemetry row; count=${authenticatedTenantVisibleRows}`,
      );
    }

    await client.query('reset role');
    await applyAuthenticatedContext(client, options.otherTenantKey);
    const authenticatedOtherTenantVisibleRows = await countVisible(client, insertedId);
    if (authenticatedOtherTenantVisibleRows !== 0) {
      throw new Error(
        `cross-tenant authenticated read leaked telemetry row; count=${authenticatedOtherTenantVisibleRows}`,
      );
    }

    await client.query('reset role');
    if (options.commitFixture) {
      await client.query('commit');
    } else {
      await client.query('rollback');
    }

    return {
      tableExists,
      tenantIndexExists,
      ginIndexExists,
      insertedId,
      serviceVisibleRows,
      authenticatedTenantVisibleRows,
      authenticatedOtherTenantVisibleRows,
      committed: options.commitFixture,
    };
  } catch (error) {
    await client.query('rollback').catch(() => undefined);
    throw error;
  } finally {
    await client.end();
  }
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));

  if (options.dryRun) {
    console.log(JSON.stringify({
      status: 'dry-run',
      checks: [
        'table exists: agent_quality_violation_events',
        'indexes exist: tenant timestamp btree + violation_types gin',
        'service-side insert/read works',
        'authenticated same-tenant read works through RLS',
        'authenticated other-tenant read returns zero rows',
      ],
      tenantKey: options.tenantKey,
      otherTenantKey: options.otherTenantKey,
      commitFixture: options.commitFixture,
    }, null, 2));
    return;
  }

  const summary = await runSmoke(options);
  console.log(JSON.stringify({
    status: 'pass',
    event: 'l7_agent_quality_telemetry_smoke',
    ...summary,
  }, null, 2));
}

main().catch((error) => {
  console.error(JSON.stringify({
    status: 'fail',
    event: 'l7_agent_quality_telemetry_smoke',
    error: error instanceof Error ? error.message : String(error),
  }, null, 2));
  process.exitCode = 1;
});
