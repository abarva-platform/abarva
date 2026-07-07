// Upsert-only Supabase -> Azure Postgres drain for corpus and pattern assets.
//
// Default mode is read-only. Use --apply to copy rows. The script preserves
// primary keys and fails loudly on schema gaps or unique-key collisions.

import { Client, type QueryResultRow } from 'pg';
import path from 'node:path';
import { config as loadEnv } from 'dotenv';
import { buildUpdateAssignments } from './upsert-sql';

loadEnv({ path: path.resolve(process.cwd(), '.env.local') });
loadEnv();

type ColumnMeta = {
  columnName: string;
  udtName: string;
};

type TablePlan = {
  table: string;
  required?: boolean;
  conflictColumns?: string[];
};

type CopyOutcome = {
  table: string;
  sourceRows: number;
  targetRowsBefore: number | null;
  targetRowsAfter: number | null;
  conflictColumns: string[];
  copied: number;
  status: 'dry-run' | 'copied' | 'source-missing' | 'target-missing' | 'no-conflict-key' | 'skipped';
};

const DEFAULT_TABLES: TablePlan[] = [
  // Shared client dimension used by client-private patterns and tenant context.
  // Merge on the natural key `name` (the unique constraint `clients_name_key`):
  // the same client can already exist in Azure with a different `id`, so a
  // PK(`id`)-only upsert collides on `name`. The primary key is never rewritten
  // on conflict (see buildUpdateAssignments / protectedColumns).
  { table: 'clients', conflictColumns: ['name'] },

  // Legacy intelligence/genome substrate.
  { table: 'canonical_industry_ai_patterns', required: false },
  { table: 'emergent_patterns', required: false },
  { table: 'foundational_pattern_packs', required: false },
  { table: 'foundational_pattern_variants', required: false },
  { table: 'genome_patterns' },
  { table: 'knowledge_sources' },
  { table: 'knowledge_chunks' },
  { table: 'intelligence_graph_edges' },
  { table: 'pattern_packs', required: false },
  { table: 'pattern_match_logs', required: false },
  { table: 'outcome_pattern_feedback', required: false },

  // Canonical corpus authoring layer.
  { table: 'corpus_patterns' },
  { table: 'corpus_pattern_versions' },
  { table: 'corpus_pattern_content' },
  { table: 'corpus_pattern_relationships' },
  { table: 'corpus_review_state' },
  { table: 'corpus_telemetry' },
  { table: 'corpus_overlays' },
  { table: 'client_private_patterns' },

  // Enterprise context and retrieval layer.
  { table: 'enterprise_context_sources', required: false },
  { table: 'enterprise_context_source_files', required: false },
  { table: 'enterprise_context_records', required: false },
  { table: 'enterprise_context_facts', required: false },
  { table: 'enterprise_context_relationships', required: false },
  { table: 'enterprise_context_evidence', required: false },
  { table: 'enterprise_context_quality_issues', required: false },
  { table: 'enterprise_context_stewardship_tasks', required: false },
  { table: 'enterprise_context_snapshots', required: false },
  { table: 'enterprise_context_template_runs', required: false },
  { table: 'enterprise_context_chunk_queue', required: false },
  { table: 'enterprise_context_chunks' },
];

function parseArgs() {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply');
  const limit = Number(valueAfter(args, '--limit') ?? 0);
  const tableArg = valueAfter(args, '--tables');
  const excludeArg = valueAfter(args, '--exclude');
  const selected = tableArg ? new Set(tableArg.split(',').map((value) => value.trim()).filter(Boolean)) : null;
  const excluded = new Set((excludeArg ?? '').split(',').map((value) => value.trim()).filter(Boolean));
  const tables = DEFAULT_TABLES.filter((plan) => (!selected || selected.has(plan.table)) && !excluded.has(plan.table));

  if (limit < 0 || !Number.isFinite(limit)) {
    throw new Error('--limit must be a positive number.');
  }
  if (tables.length === 0) {
    throw new Error('No tables selected.');
  }
  return { apply, limit, tables };
}

function valueAfter(args: string[], flag: string): string | null {
  const idx = args.indexOf(flag);
  return idx >= 0 ? args[idx + 1] ?? null : null;
}

function readUrl(name: string, aliases: string[] = []): string {
  for (const key of [name, ...aliases]) {
    const value = process.env[key]?.trim().replace(/^"|"$/g, '');
    if (value) return value;
  }
  throw new Error(`${name} is required.`);
}

function makeClient(connectionString: string): Client {
  return new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
    statement_timeout: 120_000,
  });
}

async function tableExists(client: Client, table: string): Promise<boolean> {
  const result = await client.query<{ exists: boolean }>(
    "select to_regclass($1) is not null as exists",
    [`public.${table}`],
  );
  return Boolean(result.rows[0]?.exists);
}

async function countRows(client: Client, table: string): Promise<number> {
  const result = await client.query<{ n: string }>(`select count(*)::bigint as n from "${table}"`);
  return Number(result.rows[0]?.n ?? 0);
}

async function getTableColumnMeta(client: Client, table: string): Promise<ColumnMeta[]> {
  const result = await client.query<{ column_name: string; udt_name: string }>(
    `
      select column_name, udt_name
      from information_schema.columns
      where table_schema = 'public'
        and table_name = $1
      order by ordinal_position
    `,
    [table],
  );
  return result.rows.map((row) => ({ columnName: row.column_name, udtName: row.udt_name }));
}

async function getPrimaryKeyColumns(client: Client, table: string): Promise<string[]> {
  const result = await client.query<{ column_name: string }>(
    `
      select a.attname as column_name
      from pg_index i
      join pg_class c on c.oid = i.indrelid
      join pg_namespace n on n.oid = c.relnamespace
      join pg_attribute a on a.attrelid = c.oid and a.attnum = any(i.indkey)
      where n.nspname = 'public'
        and c.relname = $1
        and i.indisprimary
      order by array_position(i.indkey, a.attnum)
    `,
    [table],
  );
  return result.rows.map((row) => row.column_name);
}

async function selectBatch(
  client: Client,
  table: string,
  columns: string[],
  orderColumns: string[],
  limit: number,
  offset: number,
): Promise<QueryResultRow[]> {
  const selectColumns = columns.map((column) => `"${column}"`).join(', ');
  const orderSql = orderColumns.length
    ? orderColumns.map((column) => `"${column}"`).join(', ')
    : columns[0] ? `"${columns[0]}"` : '1';
  const result = await client.query(
    `
      select ${selectColumns}
      from "${table}"
      order by ${orderSql}
      limit $1 offset $2
    `,
    [limit, offset],
  );
  return result.rows;
}

async function upsertRows(
  target: Client,
  table: string,
  rows: QueryResultRow[],
  columns: string[],
  columnTypes: Map<string, string>,
  conflictColumns: string[],
  protectedColumns: string[] = [],
): Promise<void> {
  if (rows.length === 0) return;
  const quotedColumns = columns.map((column) => `"${column}"`).join(', ');
  const quotedConflict = conflictColumns.map((column) => `"${column}"`).join(', ');
  const updateSql = buildUpdateAssignments(columns, conflictColumns, protectedColumns);
  const values: unknown[] = [];
  const tuples = rows.map((row) => {
    const placeholders = columns.map((column) => {
      values.push(prepareValue(row[column], columnTypes.get(column)));
      const type = columnTypes.get(column);
      const cast = type === 'jsonb' || type === 'json' ? `::${type}` : '';
      return `$${values.length}${cast}`;
    });
    return `(${placeholders.join(', ')})`;
  });

  await target.query(
    `
      insert into "${table}" (${quotedColumns})
      values ${tuples.join(', ')}
      on conflict (${quotedConflict}) ${updateSql}
    `,
    values,
  );
}

function prepareValue(value: unknown, columnType: string | undefined): unknown {
  if (value === undefined || value === null) return null;
  if (columnType === 'jsonb' || columnType === 'json') return JSON.stringify(value);
  return value;
}

async function copyTable(
  source: Client,
  target: Client,
  plan: TablePlan,
  apply: boolean,
  rowLimit: number,
): Promise<CopyOutcome> {
  const sourceExists = await tableExists(source, plan.table);
  if (!sourceExists) {
    return {
      table: plan.table,
      sourceRows: 0,
      targetRowsBefore: null,
      targetRowsAfter: null,
      conflictColumns: [],
      copied: 0,
      status: 'source-missing',
    };
  }

  const sourceRows = await countRows(source, plan.table);
  const targetExists = await tableExists(target, plan.table);
  if (!targetExists) {
    return {
      table: plan.table,
      sourceRows,
      targetRowsBefore: null,
      targetRowsAfter: null,
      conflictColumns: [],
      copied: 0,
      status: 'target-missing',
    };
  }

  const targetRowsBefore = await countRows(target, plan.table);
  const targetMeta = await getTableColumnMeta(target, plan.table);
  const sourceMeta = await getTableColumnMeta(source, plan.table);
  const sourceColumns = new Set(sourceMeta.map((column) => column.columnName));
  const columns = targetMeta.map((column) => column.columnName).filter((column) => sourceColumns.has(column));
  const columnTypes = new Map(targetMeta.map((column) => [column.columnName, column.udtName]));
  const primaryKeyColumns = await getPrimaryKeyColumns(target, plan.table);
  const conflictColumns = plan.conflictColumns ?? primaryKeyColumns;

  if (conflictColumns.length === 0 || !conflictColumns.every((column) => columns.includes(column))) {
    return {
      table: plan.table,
      sourceRows,
      targetRowsBefore,
      targetRowsAfter: targetRowsBefore,
      conflictColumns,
      copied: 0,
      status: 'no-conflict-key',
    };
  }

  const copyTotal = rowLimit > 0 ? Math.min(sourceRows, rowLimit) : sourceRows;
  if (!apply) {
    return {
      table: plan.table,
      sourceRows,
      targetRowsBefore,
      targetRowsAfter: targetRowsBefore,
      conflictColumns,
      copied: copyTotal,
      status: 'dry-run',
    };
  }

  const batchSize = 500;
  let copied = 0;
  for (let offset = 0; offset < copyTotal; offset += batchSize) {
    const rows = await selectBatch(source, plan.table, columns, conflictColumns, Math.min(batchSize, copyTotal - offset), offset);
    await upsertRows(target, plan.table, rows, columns, columnTypes, conflictColumns, primaryKeyColumns);
    copied += rows.length;
    console.log(`${plan.table}: copied ${copied}/${copyTotal}`);
  }

  return {
    table: plan.table,
    sourceRows,
    targetRowsBefore,
    targetRowsAfter: await countRows(target, plan.table),
    conflictColumns,
    copied,
    status: 'copied',
  };
}

async function main() {
  const { apply, limit, tables } = parseArgs();
  const sourceUrl = readUrl('SOURCE_DATABASE_URL');
  const targetUrl = readUrl('TARGET_DATABASE_URL', ['ABARVA_AZURE_DATABASE_URL', 'AZURE_LAB_DATABASE_URL']);
  const source = makeClient(sourceUrl);
  const target = makeClient(targetUrl);
  await source.connect();
  await target.connect();

  const outcomes: CopyOutcome[] = [];
  try {
    for (const table of tables) {
      const outcome = await copyTable(source, target, table, apply, limit);
      outcomes.push(outcome);
      console.log(JSON.stringify(outcome));
    }
  } finally {
    await source.end();
    await target.end();
  }

  const blockers = outcomes.filter((outcome) =>
    outcome.status === 'target-missing' ||
    outcome.status === 'no-conflict-key' ||
    (outcome.status === 'source-missing' && tableRequired(outcome.table, tables))
  );
  const behind = outcomes.filter((outcome) =>
    outcome.targetRowsAfter !== null && outcome.targetRowsAfter < outcome.sourceRows
  );
  console.log(JSON.stringify({ apply, limit, outcomes, blockers, behind }, null, 2));

  if (blockers.length > 0 || behind.length > 0) {
    process.exitCode = 1;
  }
}

function tableRequired(table: string, plans: TablePlan[]): boolean {
  return plans.find((plan) => plan.table === table)?.required !== false;
}

main().catch((error) => {
  console.error('x Supabase to Azure drain failed.');
  console.error(error);
  process.exit(1);
});
