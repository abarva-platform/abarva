// Tower · Claude Code per-developer usage CLI ingest.
//
// Usage:
//   npx tsx src/scripts/tower/ingest-claude-code.ts \
//     --file <path-to-xlsx-or-csv> \
//     --tenant <client-key> \
//     [--dry-run]
//
// Reads the workbook, validates rows, and upserts into
// `tower_ai_tool_usage` keyed on (tool='claude_code', tenant, developer_id,
// period_start). Idempotent: rerunning the same file is a no-op.
//
// Requires DATABASE_URL (or ABARVA_AZURE_DATABASE_URL) for write mode.
// --dry-run skips DB writes and reports planned actions only.

import { readFileSync, existsSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';

import { parseClaudeCodeCsv, parseClaudeCodeXlsx } from '@/lib/tower/ingest/claude-code/parse';
import { validateClaudeCodeRows } from '@/lib/tower/ingest/claude-code/validate';
import { buildPayload, classifyUpsert } from '@/lib/tower/ingest/claude-code/plan';
import { CLAUDE_CODE_TOOL, type ClaudeCodeUsageRow } from '@/lib/tower/ingest/claude-code/types';

loadEnv({ path: resolve(process.cwd(), '.env.local') });
loadEnv();

interface CliArgs {
  file: string;
  tenant: string;
  dryRun: boolean;
}

function parseArgs(argv: string[]): CliArgs {
  const args: Partial<CliArgs> = { dryRun: false };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--file' || a === '-f') args.file = argv[++i];
    else if (a === '--tenant' || a === '-t') args.tenant = argv[++i];
    else if (a === '--dry-run') args.dryRun = true;
  }
  if (!args.file || !args.tenant) {
    console.error(
      'usage: tsx src/scripts/tower/ingest-claude-code.ts --file <path> --tenant <client-key> [--dry-run]',
    );
    process.exit(2);
  }
  return args as CliArgs;
}

async function loadRows(filePath: string): Promise<{ rows: ClaudeCodeUsageRow[]; warnings: string[] }> {
  if (!existsSync(filePath)) {
    throw new Error(`file not found: ${filePath}`);
  }
  const ext = extname(filePath).toLowerCase();
  if (ext === '.xlsx' || ext === '.xlsm') {
    const buf = readFileSync(filePath);
    return parseClaudeCodeXlsx(buf);
  }
  if (ext === '.csv' || ext === '.tsv') {
    const csv = readFileSync(filePath, 'utf-8');
    return parseClaudeCodeCsv(csv);
  }
  throw new Error(`unsupported file extension: ${ext}`);
}

interface UpsertSummary {
  inserted: number;
  updated: number;
  unchanged: number;
  failed: number;
  notes: string[];
}

async function upsertRows(
  rows: ClaudeCodeUsageRow[],
  tenant: string,
  sourceFile: string,
): Promise<UpsertSummary> {
  // Lazy-load the DB compat client so --dry-run never requires a DB url.
  const { getAzureWriteFluentClient } = await import('@/lib/data-plane/postgresCompat');
  const sb = getAzureWriteFluentClient();
  const summary: UpsertSummary = {
    inserted: 0,
    updated: 0,
    unchanged: 0,
    failed: 0,
    notes: [],
  };

  for (const row of rows) {
    // Idempotency probe: look up by natural key first to classify
    // inserted/updated/unchanged. The downstream upsert is the single source
    // of truth for the write.
    const probe = await sb
      .from('tower_ai_tool_usage')
      .select('id,sessions,prompt_tokens,output_tokens,monthly_cost_usd,primary_use_case,team,period_end')
      .eq('tool', CLAUDE_CODE_TOOL)
      .eq('tenant_client_key', tenant)
      .eq('developer_id', row.developer_id)
      .eq('period_start', row.period_start);

    const existing = probe.data?.[0] ?? null;
    const action = classifyUpsert(row, existing);
    const payload = buildPayload(row, tenant, sourceFile);

    const writeRes = await sb.from('tower_ai_tool_usage').upsert(payload, {
      onConflict: 'tool,tenant_client_key,developer_id,period_start',
    });

    if (writeRes.error) {
      summary.failed += 1;
      summary.notes.push(`${row.developer_id} @ ${row.period_start}: ${writeRes.error.message}`);
      continue;
    }

    if (action === 'insert') summary.inserted += 1;
    else if (action === 'update') summary.updated += 1;
    else summary.unchanged += 1;
  }

  return summary;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const resolved = resolve(process.cwd(), args.file);
  console.log(`[claude-code-ingest] file=${resolved}`);
  console.log(`[claude-code-ingest] tenant=${args.tenant}  dry-run=${args.dryRun}`);

  const { rows, warnings } = await loadRows(resolved);
  console.log(`[claude-code-ingest] parsed rows=${rows.length}`);
  for (const w of warnings) console.warn(`  parse warning: ${w}`);

  const v = validateClaudeCodeRows(rows);
  for (const w of v.warnings) console.warn(`  validation warning: ${w}`);
  if (!v.ok) {
    console.error(`[claude-code-ingest] validation failed (${v.errors.length} errors):`);
    for (const e of v.errors.slice(0, 50)) {
      console.error(`  row ${e.row_index} (${e.developer_id ?? '?'}): ${e.message}`);
    }
    process.exit(1);
  }

  if (args.dryRun) {
    console.log(`[claude-code-ingest] dry-run · would upsert ${rows.length} rows`);
    process.exit(0);
  }

  const summary = await upsertRows(rows, args.tenant, resolved);
  console.log(
    `[claude-code-ingest] done · inserted=${summary.inserted} updated=${summary.updated} unchanged=${summary.unchanged} failed=${summary.failed}`,
  );
  for (const note of summary.notes.slice(0, 20)) console.warn(`  ${note}`);
  if (summary.failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('[claude-code-ingest] FAILED:', err);
  process.exit(1);
});
