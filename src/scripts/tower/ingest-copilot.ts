// Tower ingest CLI · GitHub Copilot usage + cost.
//
// Reads an Excel workbook (built from public/templates/tower/copilot/template.xlsx),
// parses + validates rows, then upserts into tower_ai_tool_usage. Idempotent
// via the unique index on (client_id, tool, team, period_start, period_end).
//
// Usage:
//   npx tsx src/scripts/tower/ingest-copilot.ts \
//     --file=public/templates/tower/copilot/sample-filled.xlsx \
//     --client=apex-retail \
//     [--dry-run] [--source-file-id=<id>]
//
// --dry-run prints a summary without touching the database. No Supabase or
// Postgres credentials are required for --dry-run.

import { config } from 'dotenv';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import ExcelJS from 'exceljs';

import { parseCopilotWorkbook } from '@/lib/tower/ingest/copilot/parse';
import { validateCopilotRows } from '@/lib/tower/ingest/copilot/validate';
import { COPILOT_TOOL_KIND, type CopilotUsageRow } from '@/lib/tower/ingest/copilot/schema';

config({ path: '.env.local' });

interface Args {
  file: string;
  clientKey: string | null;
  dryRun: boolean;
  sourceFileId: string;
  help: boolean;
}

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  let file = '';
  let clientKey: string | null = null;
  let dryRun = false;
  let sourceFileId = `cli-${new Date().toISOString().slice(0, 10)}`;
  let help = false;
  for (const a of argv) {
    if (a === '--dry-run' || a === '--dry') dryRun = true;
    else if (a === '--help' || a === '-h') help = true;
    else if (a.startsWith('--file=')) file = a.slice('--file='.length);
    else if (a.startsWith('--client=')) clientKey = a.slice('--client='.length);
    else if (a.startsWith('--source-file-id=')) sourceFileId = a.slice('--source-file-id='.length);
  }
  return { file, clientKey, dryRun, sourceFileId, help };
}

function usage() {
  process.stdout.write(`Tower ingest · GitHub Copilot

Usage:
  npx tsx src/scripts/tower/ingest-copilot.ts \\
    --file=<path>.xlsx \\
    --client=<tenant-key> \\
    [--dry-run] [--source-file-id=<id>]

Flags:
  --file=PATH         Path to a Copilot ingest workbook (xlsx).
  --client=KEY        Tenant key (e.g. apex-retail, meridian-health).
  --dry-run           Parse + validate only. No DB writes. No DB connection needed.
  --source-file-id=ID Stable identifier recorded with each upsert (default: cli-YYYY-MM-DD).
  --help              Show this message.

Examples:
  # Validate the synthetic sample without touching the database.
  npx tsx src/scripts/tower/ingest-copilot.ts \\
    --file=public/templates/tower/copilot/sample-filled.xlsx \\
    --client=apex-retail --dry-run
`);
}

interface IngestSummary {
  rowsParsed: number;
  rowsValid: number;
  rowsInvalid: number;
  parseErrors: number;
  warnings: number;
  upserted: number;
  upsertFailed: number;
  notes: string[];
}

async function loadWorkbook(filePath: string): Promise<ExcelJS.Workbook> {
  const absolute = resolve(filePath);
  const buffer = await readFile(absolute);
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer);
  return wb;
}

async function resolveClientId(clientKey: string): Promise<string> {
  // Lazy-load the data plane only when we actually need it (so --dry-run
  // doesn't require DB credentials).
  const mod = await import('@/lib/data-plane/postgresCompat');
  const sb = mod.getAzureWriteFluentClient();
  const { data, error } = await sb
    .from('clients')
    .select('id, name, tenant_key')
    .or(`tenant_key.eq.${clientKey},name.eq.${clientKey}`)
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Failed to resolve client "${clientKey}": ${error.message}`);
  if (!data || typeof data !== 'object' || !('id' in data) || !data.id) {
    throw new Error(`No client matched key "${clientKey}". Pass a tenant_key or client name.`);
  }
  return String((data as { id: string }).id);
}

async function upsertRows(args: {
  clientId: string;
  rows: CopilotUsageRow[];
  sourceFileId: string;
  ingestRunId: string;
}): Promise<{ upserted: number; failed: number; notes: string[] }> {
  const mod = await import('@/lib/data-plane/postgresCompat');
  const sb = mod.getAzureWriteFluentClient();
  let upserted = 0;
  let failed = 0;
  const notes: string[] = [];

  for (const row of args.rows) {
    const payload = {
      client_id: args.clientId,
      tool: COPILOT_TOOL_KIND,
      team: row.team,
      period_start: row.period_start,
      period_end: row.period_end,
      active_users: row.active_users,
      total_suggestions: row.total_suggestions,
      accepted_suggestions: row.accepted_suggestions,
      acceptance_rate_pct: row.acceptance_rate_pct,
      monthly_cost_usd: row.monthly_cost_usd,
      seats_assigned: row.seats_assigned,
      seats_used: row.seats_used,
      source_file_id: args.sourceFileId,
      ingest_run_id: args.ingestRunId,
      raw_jsonb: row as unknown as Record<string, unknown>,
      updated_at: new Date().toISOString(),
    };
    const { error } = await sb.from('tower_ai_tool_usage').upsert(payload, {
      onConflict: 'client_id,tool,team,period_start,period_end',
    });
    if (error) {
      failed += 1;
      notes.push(`row ${row.team} ${row.period_start}: ${error.message}`);
    } else {
      upserted += 1;
    }
  }

  return { upserted, failed, notes };
}

async function run() {
  const args = parseArgs();
  if (args.help || !args.file) {
    usage();
    process.exit(args.help ? 0 : 1);
  }

  const wb = await loadWorkbook(args.file);
  const parse = parseCopilotWorkbook(wb);
  const validation = validateCopilotRows(parse.rows);

  const summary: IngestSummary = {
    rowsParsed: parse.rows.length,
    rowsValid: validation.valid.length,
    rowsInvalid: validation.invalid.length,
    parseErrors: parse.parseErrors.length,
    warnings: validation.warnings.length,
    upserted: 0,
    upsertFailed: 0,
    notes: parse.notes.slice(),
  };

  // Surface parse + validation issues to stderr so they're visible in CI logs.
  for (const e of parse.parseErrors) {
    process.stderr.write(`parse-error: row ${e.rowNumber}: ${e.reason}\n`);
  }
  for (const { row, issues } of validation.invalid) {
    for (const issue of issues) {
      process.stderr.write(`invalid: ${row.team} ${row.period_start}..${row.period_end} [${String(issue.field)}]: ${issue.message}\n`);
    }
  }
  for (const w of validation.warnings) {
    process.stderr.write(`warn: ${w.team} ${w.period}: ${w.message}\n`);
  }

  if (args.dryRun) {
    process.stdout.write(`${JSON.stringify({ mode: 'dry-run', ...summary }, null, 2)}\n`);
    return;
  }

  if (!args.clientKey) {
    process.stderr.write('ERROR: --client=<tenant-key> is required when not --dry-run.\n');
    process.exit(2);
  }

  if (validation.valid.length === 0) {
    process.stderr.write('No valid rows to ingest.\n');
    process.stdout.write(`${JSON.stringify({ mode: 'live', ...summary }, null, 2)}\n`);
    process.exit(validation.invalid.length > 0 ? 3 : 0);
  }

  const clientId = await resolveClientId(args.clientKey);
  const ingestRunId = randomUUID();
  const upsert = await upsertRows({
    clientId,
    rows: validation.valid,
    sourceFileId: args.sourceFileId,
    ingestRunId,
  });

  summary.upserted = upsert.upserted;
  summary.upsertFailed = upsert.failed;
  summary.notes.push(...upsert.notes);

  process.stdout.write(`${JSON.stringify({ mode: 'live', clientId, ingestRunId, ...summary }, null, 2)}\n`);
  if (upsert.failed > 0) process.exit(4);
}

run().catch((err) => {
  process.stderr.write(`FATAL: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
