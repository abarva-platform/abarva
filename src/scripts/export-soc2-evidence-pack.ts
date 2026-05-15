import fs from 'node:fs';
import path from 'node:path';
import { Client } from 'pg';

interface Options {
  databaseUrl: string;
  outDir: string;
  sinceIso?: string;
  maxRows: number;
  dryRun: boolean;
}

interface ExportResult {
  name: string;
  kind: 'postgres_table' | 'json_ledger';
  status: 'exported' | 'skipped';
  rows: number;
  file?: string;
  reason?: string;
}

const DEFAULT_TABLES = [
  'sensitive_upload_audit',
  'data_inventory_audit_log',
  'gate_criteria',
  'gate_criterion_states',
] as const;

const LOCAL_LEDGERS = [
  { name: 'program_approvals', file: '.approvals/ledger.json' },
  { name: 'phase_gates', file: '.approvals/phase-gates.json' },
  { name: 'sponsor_commitments', file: '.approvals/sponsor-commitments.json' },
] as const;

function parseArgs(argv: string[]): Options {
  const options: Options = {
    databaseUrl: process.env.DATABASE_URL ?? '',
    outDir: path.join(process.cwd(), 'artifacts/soc2-evidence', new Date().toISOString().replace(/[:.]/g, '-')),
    maxRows: 10_000,
    dryRun: false,
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
      case '--out-dir':
        options.outDir = path.resolve(nextValue);
        if (consume) index += 1;
        break;
      case '--since':
        options.sinceIso = nextValue;
        if (consume) index += 1;
        break;
      case '--max-rows':
        options.maxRows = Number(nextValue);
        if (consume) index += 1;
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      default:
        throw new Error(`Unknown argument: ${raw}`);
    }
  }

  if (!options.dryRun && !options.databaseUrl) {
    throw new Error('Missing DATABASE_URL or --database-url. Use --dry-run to inspect export plan without connecting.');
  }
  if (!Number.isFinite(options.maxRows) || options.maxRows < 1) {
    throw new Error(`Invalid --max-rows: ${options.maxRows}`);
  }
  if (options.sinceIso && Number.isNaN(Date.parse(options.sinceIso))) {
    throw new Error(`Invalid --since timestamp: ${options.sinceIso}`);
  }

  return options;
}

function csvValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  const text = typeof value === 'object' ? JSON.stringify(value) : String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return '';
  const columns = Array.from(rows.reduce((set, row) => {
    Object.keys(row).forEach((key) => set.add(key));
    return set;
  }, new Set<string>()));

  return [
    columns.map(csvValue).join(','),
    ...rows.map((row) => columns.map((column) => csvValue(row[column])).join(',')),
  ].join('\n').concat('\n');
}

async function tableColumns(client: Client, tableName: string): Promise<string[]> {
  const result = await client.query<{ column_name: string }>(
    `
      select column_name
      from information_schema.columns
      where table_schema = 'public'
        and table_name = $1
      order by ordinal_position
    `,
    [tableName],
  );
  return result.rows.map((row) => row.column_name);
}

function preferredTimeColumn(columns: string[]): string | null {
  for (const candidate of ['evaluated_at', 'created_at', 'updated_at', 'timestamp', 'changed_at']) {
    if (columns.includes(candidate)) return candidate;
  }
  return null;
}

async function exportTable(client: Client, tableName: string, options: Options): Promise<ExportResult> {
  const columns = await tableColumns(client, tableName);
  if (columns.length === 0) {
    return {
      name: tableName,
      kind: 'postgres_table',
      status: 'skipped',
      rows: 0,
      reason: 'table not present',
    };
  }

  const timeColumn = preferredTimeColumn(columns);
  const where = options.sinceIso && timeColumn ? `where ${timeColumn} >= $1` : '';
  const order = timeColumn ? `order by ${timeColumn} desc` : columns.includes('id') ? 'order by id' : '';
  const params = options.sinceIso && timeColumn ? [options.sinceIso, options.maxRows] : [options.maxRows];
  const limitParam = params.length;

  const result = await client.query<Record<string, unknown>>(
    `select * from ${tableName} ${where} ${order} limit $${limitParam}`,
    params,
  );

  const file = `${tableName}.csv`;
  fs.writeFileSync(path.join(options.outDir, file), toCsv(result.rows), 'utf8');

  return {
    name: tableName,
    kind: 'postgres_table',
    status: 'exported',
    rows: result.rows.length,
    file,
  };
}

function exportJsonLedger(ledger: { name: string; file: string }, options: Options): ExportResult {
  const source = path.join(process.cwd(), ledger.file);
  if (!fs.existsSync(source)) {
    return {
      name: ledger.name,
      kind: 'json_ledger',
      status: 'skipped',
      rows: 0,
      reason: `${ledger.file} not present`,
    };
  }

  const parsed = JSON.parse(fs.readFileSync(source, 'utf8')) as unknown;
  const rows = Array.isArray(parsed)
    ? parsed
    : typeof parsed === 'object' && parsed !== null && Array.isArray((parsed as { entries?: unknown[] }).entries)
      ? (parsed as { entries: unknown[] }).entries
      : [parsed];

  const file = `${ledger.name}.json`;
  fs.copyFileSync(source, path.join(options.outDir, file));

  return {
    name: ledger.name,
    kind: 'json_ledger',
    status: 'exported',
    rows: rows.length,
    file,
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.dryRun) {
    console.log(JSON.stringify({
      status: 'pass',
      dryRun: true,
      outDir: options.outDir,
      sinceIso: options.sinceIso ?? null,
      maxRows: options.maxRows,
      postgresTables: DEFAULT_TABLES,
      localLedgers: LOCAL_LEDGERS,
    }, null, 2));
    return;
  }

  fs.mkdirSync(options.outDir, { recursive: true });

  const client = new Client({ connectionString: options.databaseUrl });
  await client.connect();

  const results: ExportResult[] = [];
  try {
    for (const table of DEFAULT_TABLES) {
      results.push(await exportTable(client, table, options));
    }
  } finally {
    await client.end();
  }

  for (const ledger of LOCAL_LEDGERS) {
    results.push(exportJsonLedger(ledger, options));
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    sinceIso: options.sinceIso ?? null,
    maxRows: options.maxRows,
    outDir: options.outDir,
    results,
  };
  fs.writeFileSync(path.join(options.outDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');

  console.log(JSON.stringify({
    status: 'pass',
    ...manifest,
  }, null, 2));
}

main().catch((error) => {
  console.error(JSON.stringify({
    status: 'fail',
    error: error instanceof Error ? error.message : String(error),
  }, null, 2));
  process.exit(1);
});
