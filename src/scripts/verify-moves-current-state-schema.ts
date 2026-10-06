import { Client } from 'pg';
import path from 'node:path';
import { config as loadEnv } from 'dotenv';
import { postgresClientOptions } from './postgres-client-options';

loadEnv({ path: path.resolve(process.cwd(), '.env.local') });
loadEnv();

type RequiredTable = {
  table: string;
  columns: string[];
};

const REQUIRED_TABLES: RequiredTable[] = [
  {
    table: 'tower_cmdb_cis',
    columns: ['client_id', 'ci_name', 'ci_type', 'business_service', 'source_file_id'],
  },
  {
    table: 'tower_dora_metrics',
    columns: [
      'client_id',
      'repo',
      'team',
      'period_start',
      'period_end',
      'deployment_frequency_per_day',
      'lead_time_for_changes_hours',
      'change_failure_rate_pct',
      'mttr_hours',
      'sample_size_deploys',
      'source_file_id',
    ],
  },
  {
    table: 'tower_workforce',
    columns: [
      'client_id',
      'employee_id',
      'function',
      'sub_function',
      'location',
      'level',
      'contractor_flag',
      'start_date',
      'as_of_date',
    ],
  },
  {
    table: 'program_evidence_items',
    columns: ['tenant_key', 'program_id', 'attachment_id', 'phase', 'step_id', 'extracted_text'],
  },
  {
    table: 'program_evidence_reviews',
    columns: [
      'tenant_key',
      'program_id',
      'evidence_id',
      'family_key',
      'decision',
      'auto_promoted',
      'source_ref',
    ],
  },
];

async function tableExists(client: Client, table: string): Promise<boolean> {
  const result = await client.query<{ exists: boolean }>(
    "SELECT to_regclass($1) IS NOT NULL AS exists",
    [`public.${table}`],
  );
  return result.rows[0]?.exists === true;
}

async function tableColumns(client: Client, table: string): Promise<Set<string>> {
  const result = await client.query<{ column_name: string }>(
    `SELECT column_name
       FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = $1`,
    [table],
  );
  return new Set(result.rows.map((row) => row.column_name));
}

async function tableCount(client: Client, table: string): Promise<number> {
  const result = await client.query<{ count: string }>(`SELECT count(*)::text AS count FROM public.${table}`);
  return Number.parseInt(result.rows[0]?.count ?? '0', 10);
}

async function main() {
  const url = process.env.ABARVA_AZURE_DATABASE_URL ?? process.env.AZURE_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!url) {
    console.error('moves-current-state-schema: DATABASE_URL is required.');
    process.exit(1);
  }

  const client = new Client(postgresClientOptions(url, 'verify-moves-current-state-schema'));
  await client.connect();

  try {
    const tables: Record<string, unknown> = {};
    const missingTables: string[] = [];
    const missingColumns: string[] = [];

    for (const required of REQUIRED_TABLES) {
      const exists = await tableExists(client, required.table);
      if (!exists) {
        missingTables.push(required.table);
        tables[required.table] = { exists: false };
        continue;
      }

      const columns = await tableColumns(client, required.table);
      const absent = required.columns.filter((column) => !columns.has(column));
      for (const column of absent) missingColumns.push(`${required.table}.${column}`);
      tables[required.table] = {
        exists: true,
        rowCount: await tableCount(client, required.table),
        missingColumns: absent,
      };
    }

    const report = {
      schema: 'abarva.moves-current-state-schema-readback.v1',
      status: missingTables.length === 0 && missingColumns.length === 0 ? 'GREEN' : 'NOT_READY',
      checkedAt: new Date().toISOString(),
      tables,
      missingTables,
      missingColumns,
    };

    console.log(JSON.stringify(report, null, 2));

    if (report.status !== 'GREEN') {
      process.exit(1);
    }
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error('moves-current-state-schema: verification failed.');
  console.error(error);
  process.exit(1);
});
