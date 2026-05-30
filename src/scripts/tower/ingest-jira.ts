/**
 * Tower → Jira ingest CLI.
 *
 * Usage:
 *   npx tsx src/scripts/tower/ingest-jira.ts \
 *     --client <client_id_uuid> \
 *     --file public/templates/tower/jira/template.xlsx
 *
 *   Flags:
 *     --dry-run         Parse + validate, do not write. Prints summary.
 *     --csv             Force CSV parser (default: infer from .xlsx vs .csv).
 *     --source-tag <s>  Override the source_file column (default: file basename).
 *
 * Idempotency: upsert key is (client_id, issue_key). Re-running with the
 * same file overwrites prior rows for matching keys; rows present in DB but
 * absent from the file are left untouched (deletes are explicit, not implicit).
 *
 * Auth: requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in the
 * environment (loaded from .env.local).
 */

import path from 'node:path';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { config as loadEnv } from 'dotenv';
import Papa from 'papaparse';
import ExcelJS from 'exceljs';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import {
  parseJiraRows,
  type JiraIngestInputRow,
  type JiraIngestRow,
  type JiraParseResult,
} from '@/lib/tower/ingest/jira/parse';
import { findTowerIngestSource } from '@/lib/tower/ingest/registry';

interface CliArgs {
  clientId: string | null;
  file: string | null;
  dryRun: boolean;
  forceCsv: boolean;
  sourceTag: string | null;
  help: boolean;
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    clientId: null,
    file: null,
    dryRun: false,
    forceCsv: false,
    sourceTag: null,
    help: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--client' || a === '-c') {
      args.clientId = argv[++i] ?? null;
    } else if (a === '--file' || a === '-f') {
      args.file = argv[++i] ?? null;
    } else if (a === '--dry-run') {
      args.dryRun = true;
    } else if (a === '--csv') {
      args.forceCsv = true;
    } else if (a === '--source-tag') {
      args.sourceTag = argv[++i] ?? null;
    } else if (a === '--help' || a === '-h') {
      args.help = true;
    }
  }
  return args;
}

function printHelp(): void {
  console.log(
    [
      'Usage: tsx src/scripts/tower/ingest-jira.ts --client <uuid> --file <path>',
      '',
      'Options:',
      '  --client, -c   <uuid>    Target client_id (required).',
      '  --file, -f     <path>    .xlsx or .csv file to ingest (required).',
      '  --dry-run                Parse + validate only. No DB writes.',
      '  --csv                    Force CSV parser regardless of extension.',
      '  --source-tag   <string>  Override source_file label. Defaults to basename.',
      '  --help, -h               Show this help.',
      '',
      'Idempotency: upsert key is (client_id, issue_key).',
    ].join('\n'),
  );
}

async function readXlsxIssues(filePath: string): Promise<JiraIngestInputRow[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(filePath);
  // Prefer a sheet literally named "Issues"; otherwise pick the first sheet
  // that has an "issue_key" header. This makes the file forgiving of users
  // who renamed the sheet or exported straight from Jira.
  const sheets = wb.worksheets;
  let ws =
    wb.getWorksheet('Issues') ??
    sheets.find((s) => {
      const headers = (s.getRow(1).values as Array<unknown>) ?? [];
      return headers.some((v) => String(v ?? '').trim().toLowerCase() === 'issue_key');
    });
  if (!ws) {
    // Fall back: scan first 5 rows of each sheet for issue_key.
    for (const candidate of sheets) {
      for (let r = 1; r <= Math.min(5, candidate.rowCount); r += 1) {
        const row = candidate.getRow(r);
        const cells = Array.isArray(row.values) ? row.values : [];
        if (
          cells.some((v) => String(v ?? '').trim().toLowerCase() === 'issue_key')
        ) {
          ws = candidate;
          break;
        }
      }
      if (ws) break;
    }
  }
  if (!ws) {
    throw new Error('No worksheet with an "issue_key" header column found.');
  }

  // Find header row.
  let headerRowIdx = 1;
  for (let r = 1; r <= Math.min(10, ws.rowCount); r += 1) {
    const row = ws.getRow(r);
    const cells = Array.isArray(row.values) ? row.values : [];
    if (cells.some((v) => String(v ?? '').trim().toLowerCase() === 'issue_key')) {
      headerRowIdx = r;
      break;
    }
  }
  const headerCells = ws.getRow(headerRowIdx).values as Array<unknown>;
  const headers: string[] = [];
  // ExcelJS uses 1-based arrays with a leading hole.
  for (let i = 1; i < headerCells.length; i += 1) {
    headers.push(String(headerCells[i] ?? '').trim());
  }

  const rows: JiraIngestInputRow[] = [];
  for (let r = headerRowIdx + 1; r <= ws.rowCount; r += 1) {
    const row = ws.getRow(r);
    const values = row.values as Array<unknown>;
    if (!values || values.length <= 1) continue;
    const obj: Record<string, string> = {};
    for (let i = 0; i < headers.length; i += 1) {
      const cellValue = values[i + 1];
      if (cellValue === null || cellValue === undefined) {
        obj[headers[i]] = '';
        continue;
      }
      if (cellValue instanceof Date) {
        obj[headers[i]] = cellValue.toISOString();
      } else if (typeof cellValue === 'object' && cellValue !== null && 'text' in cellValue) {
        obj[headers[i]] = String((cellValue as { text: unknown }).text ?? '').trim();
      } else {
        obj[headers[i]] = String(cellValue).trim();
      }
    }
    // Skip empty rows.
    if (!obj.issue_key) continue;
    rows.push(obj as JiraIngestInputRow);
  }
  return rows;
}

function readCsvIssues(filePath: string): JiraIngestInputRow[] {
  const text = readFileSync(filePath, 'utf8');
  // Strip banner lines starting with '#'.
  const cleaned = text
    .split('\n')
    .filter((line) => !line.startsWith('#'))
    .join('\n');
  const parsed = Papa.parse<Record<string, string>>(cleaned, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.replace(/\*$/, '').trim(),
  });
  return (parsed.data ?? []).filter((r) => r.issue_key);
}

interface SupabaseLike {
  from: (table: string) => {
    upsert: (
      rows: object[],
      opts: { onConflict: string },
    ) => Promise<{ error: { message: string } | null; count?: number | null }>;
  };
}

async function upsertBatch(
  sb: SupabaseLike,
  clientId: string,
  rows: JiraIngestRow[],
  sourceTag: string,
): Promise<{ ok: number; failed: number; errors: string[] }> {
  const payload = rows.map((r) => ({
    client_id: clientId,
    issue_key: r.issue_key,
    issue_type: r.issue_type,
    epic_key: r.epic_key,
    team: r.team,
    status: r.status,
    story_points: r.story_points,
    created_at: r.created_at,
    started_at: r.started_at,
    completed_at: r.completed_at,
    cycle_time_hours: r.cycle_time_hours,
    source_file: sourceTag,
  }));

  // Chunk to keep payloads under PostgREST limits (~250 rows / batch).
  const CHUNK = 250;
  let ok = 0;
  let failed = 0;
  const errors: string[] = [];
  for (let i = 0; i < payload.length; i += CHUNK) {
    const slice = payload.slice(i, i + CHUNK);
    const { error } = await sb
      .from('tower_jira_issues')
      .upsert(slice, { onConflict: 'client_id,issue_key' });
    if (error) {
      failed += slice.length;
      errors.push(`chunk ${i / CHUNK}: ${error.message}`);
    } else {
      ok += slice.length;
    }
  }
  return { ok, failed, errors };
}

function summarize(result: JiraParseResult, sourceTag: string): void {
  const byType = new Map<string, number>();
  for (const row of result.rows) {
    byType.set(row.issue_type, (byType.get(row.issue_type) ?? 0) + 1);
  }
  const byTeam = new Map<string, number>();
  for (const row of result.rows) {
    byTeam.set(row.team, (byTeam.get(row.team) ?? 0) + 1);
  }
  const closed = result.rows.filter((r) => r.cycle_time_hours !== null);
  const avgCycle =
    closed.length > 0
      ? closed.reduce((acc, r) => acc + (r.cycle_time_hours ?? 0), 0) / closed.length
      : null;

  console.log('');
  console.log(`source_file:           ${sourceTag}`);
  console.log(`rows_total:            ${result.rows_total}`);
  console.log(`rows_valid:            ${result.rows_valid}`);
  console.log(`rows_invalid:          ${result.rows_invalid}`);
  console.log(
    `by_type:               ${Array.from(byType.entries())
      .map(([k, v]) => `${k}=${v}`)
      .join(', ')}`,
  );
  console.log(`teams:                 ${byTeam.size}`);
  if (avgCycle !== null) {
    console.log(`avg_cycle_time_hours:  ${avgCycle.toFixed(2)} (n=${closed.length})`);
  }
  if (result.errors.length > 0) {
    console.log('');
    console.log(`Errors (first 10 of ${result.errors.length}):`);
    for (const err of result.errors.slice(0, 10)) {
      console.log(`  · row=${err.row_index} key=${err.issue_key ?? '-'} :: ${err.reason}`);
    }
  }
}

async function main(): Promise<number> {
  // Sanity-check the registry on every CLI run — catches a bad union-merge.
  const registryEntry = findTowerIngestSource('jira');
  if (!registryEntry) {
    console.error('FATAL: "jira" source missing from TOWER_INGEST_SOURCES.');
    return 1;
  }

  loadEnv({ path: path.resolve(process.cwd(), '.env.local') });
  loadEnv();

  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return 0;
  }
  if (!args.clientId || !args.file) {
    printHelp();
    return 1;
  }
  if (!existsSync(args.file)) {
    console.error(`File not found: ${args.file}`);
    return 1;
  }
  const fileStat = statSync(args.file);
  if (!fileStat.isFile()) {
    console.error(`Not a regular file: ${args.file}`);
    return 1;
  }

  const isCsv = args.forceCsv || args.file.toLowerCase().endsWith('.csv');
  const sourceTag = args.sourceTag ?? path.basename(args.file);
  console.log(`Reading ${args.file}${isCsv ? ' (CSV)' : ' (XLSX)'}`);

  const input = isCsv ? readCsvIssues(args.file) : await readXlsxIssues(args.file);
  console.log(`Read ${input.length} candidate rows.`);

  const result = parseJiraRows(input);
  summarize(result, sourceTag);

  if (args.dryRun) {
    console.log('');
    console.log('--dry-run: no DB writes.');
    return result.rows_invalid > 0 ? 1 : 0;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error(
      'NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for writes (use --dry-run otherwise).',
    );
    return 1;
  }
  const sb: SupabaseClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log('');
  console.log(`Upserting ${result.rows.length} rows into tower_jira_issues …`);
  const { ok, failed, errors } = await upsertBatch(
    sb as unknown as SupabaseLike,
    args.clientId,
    result.rows,
    sourceTag,
  );
  console.log(`upserted:              ${ok}`);
  console.log(`upsert_failed:         ${failed}`);
  if (errors.length > 0) {
    for (const e of errors) console.log(`  · ${e}`);
  }
  return failed > 0 ? 1 : 0;
}

const invokedDirectly = process.argv[1]?.endsWith('ingest-jira.ts');
if (invokedDirectly) {
  main()
    .then((code) => process.exit(code))
    .catch((err) => {
      console.error('FAILED:', err);
      process.exit(1);
    });
}

export { main as runJiraIngestCli, parseArgs };
