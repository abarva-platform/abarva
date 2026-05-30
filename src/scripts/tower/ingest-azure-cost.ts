#!/usr/bin/env tsx
/**
 * Tower ingest CLI · Azure Cost Management
 *
 * Usage:
 *   npx tsx src/scripts/tower/ingest-azure-cost.ts \
 *     --client=<client_id> \
 *     --file=path/to/azure-cost.xlsx \
 *     [--sheet=Data] \
 *     [--source-file-id=<uuid>] \
 *     [--dry-run] \
 *     [--regenerate-templates]
 *
 * --dry-run         · parse + validate but do not write
 * --regenerate-templates · rebuild the blank + sample template files into /public
 * --sheet=NAME      · sheet to read (default: Data)
 *
 * Idempotency: upserts on
 *   (client_id, subscription_id, resource_group, resource_name, service, meter_category, period_start)
 */

import { readFileSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import process from 'node:process';
import ExcelJS from 'exceljs';

import { parseAzureCostCsv, parseAzureCostRows, type AzureCostRow, type AzureCostRowRaw } from '@/lib/tower/ingest/azure-cost/parse';
import { validateAzureCostRows } from '@/lib/tower/ingest/azure-cost/validate';
import { writeBlankTemplate, writeSampleTemplate } from '@/lib/tower/ingest/azure-cost/template';
import { azureCostSource } from '@/lib/tower/ingest/azure-cost';

interface CliArgs {
  client: string | null;
  file: string | null;
  sheet: string;
  sourceFileId: string | null;
  dryRun: boolean;
  regenerateTemplates: boolean;
  help: boolean;
}

function parseArgs(argv: string[]): CliArgs {
  const out: CliArgs = {
    client: null,
    file: null,
    sheet: 'Data',
    sourceFileId: null,
    dryRun: false,
    regenerateTemplates: false,
    help: false,
  };
  for (const arg of argv) {
    if (arg === '--dry-run') out.dryRun = true;
    else if (arg === '--regenerate-templates') out.regenerateTemplates = true;
    else if (arg === '--help' || arg === '-h') out.help = true;
    else if (arg.startsWith('--client=')) out.client = arg.slice('--client='.length);
    else if (arg.startsWith('--file=')) out.file = arg.slice('--file='.length);
    else if (arg.startsWith('--sheet=')) out.sheet = arg.slice('--sheet='.length);
    else if (arg.startsWith('--source-file-id=')) out.sourceFileId = arg.slice('--source-file-id='.length);
  }
  return out;
}

function printUsage(): void {
   
  console.log(`Tower ingest · ${azureCostSource.displayName}

Usage:
  npx tsx src/scripts/tower/ingest-azure-cost.ts \\
    --client=<client_id> --file=path/to/file.xlsx [--sheet=Data] [--dry-run]

Flags:
  --client=<id>             Required for non-dry runs. Tenant client UUID.
  --file=<path>             Required for ingest. .xlsx or .csv export.
  --sheet=<name>            Sheet name in the .xlsx (default: Data).
  --source-file-id=<uuid>   Optional provenance handle from uploaded_files.
  --dry-run                 Parse + validate, do not write.
  --regenerate-templates    Rebuild public/templates/tower/azure-cost/{template,sample}.xlsx
  --help                    This help.
`);
}

async function readXlsxRows(path: string, sheetName: string): Promise<AzureCostRowRaw[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(path);
  const ws = wb.getWorksheet(sheetName);
  if (!ws) throw new Error(`sheet_not_found:${sheetName}`);

  // Find header row by scanning rows 1..10 for the row that contains our headers.
  let headerRowIdx = -1;
  let headerMap: Map<string, number> = new Map();
  for (let r = 1; r <= Math.min(ws.rowCount, 10); r += 1) {
    const row = ws.getRow(r);
    const values: string[] = [];
    row.eachCell({ includeEmpty: true }, (cell) => {
      values.push(String(cell.value ?? '').trim().toLowerCase());
    });
    if (values.includes('subscription_id') && values.includes('monthly_cost_usd')) {
      headerRowIdx = r;
      headerMap = new Map(values.map((v, i) => [v, i + 1]));
      break;
    }
  }
  if (headerRowIdx === -1) throw new Error('header_row_not_found · expected a row containing subscription_id and monthly_cost_usd');

  const required = [
    'subscription_id', 'resource_group', 'resource_name', 'service',
    'tag_program', 'tag_environment', 'period_start', 'period_end',
    'monthly_cost_usd', 'currency', 'meter_category', 'location',
  ];

  const out: AzureCostRowRaw[] = [];
  for (let r = headerRowIdx + 1; r <= ws.rowCount; r += 1) {
    const row = ws.getRow(r);
    const obj: Record<string, string> = {};
    let nonEmpty = false;
    for (const key of required) {
      const colIdx = headerMap.get(key);
      if (!colIdx) continue;
      const cell = row.getCell(colIdx);
      let value: string;
      if (cell.value == null) {
        value = '';
      } else if (cell.value instanceof Date) {
        value = cell.value.toISOString().slice(0, 10);
      } else if (typeof cell.value === 'object' && 'text' in cell.value) {
        // rich text
        value = String((cell.value as { text: string }).text ?? '').trim();
      } else if (typeof cell.value === 'object' && 'result' in cell.value) {
        // formula
        value = String((cell.value as { result: unknown }).result ?? '').trim();
      } else {
        value = String(cell.value).trim();
      }
      if (value) nonEmpty = true;
      obj[key] = value;
    }
    if (nonEmpty) out.push(obj as AzureCostRowRaw);
  }
  return out;
}

async function loadRows(file: string, sheet: string): Promise<{ rows: AzureCostRow[]; issues: number }> {
  const ext = extname(file).toLowerCase();
  if (ext === '.csv') {
    const csv = readFileSync(file, 'utf8');
    const result = parseAzureCostCsv(csv);
    return { rows: result.rows, issues: result.issues.length };
  }
  if (ext === '.xlsx' || ext === '.xlsm') {
    const raw = await readXlsxRows(file, sheet);
    const result = parseAzureCostRows(raw);
    if (result.issues.length > 0) {
       
      console.warn(`[ingest-azure-cost] ${result.issues.length} parse issues; first 5:`);
      for (const issue of result.issues.slice(0, 5)) {
         
        console.warn(`  row ${issue.row} · ${issue.field}: ${issue.message}`);
      }
    }
    return { rows: result.rows, issues: result.issues.length };
  }
  throw new Error(`unsupported_extension:${ext}`);
}

async function upsertRows(
  rows: AzureCostRow[],
  clientId: string,
  sourceFileId: string | null,
): Promise<{ written: number; skipped: number }> {
  // Lazy-imported so dry-run / regenerate-templates don't require DATABASE_URL.
  const { withAzureCostClient } = await import('@/lib/tower/ingest/azure-cost/db');
  let written = 0;
  await withAzureCostClient(async (client) => {
    await client.query('BEGIN');
    try {
    for (const r of rows) {
      const res = await client.query(
        `
          INSERT INTO tower_cloud_cost (
            client_id, subscription_id, resource_group, resource_name, service,
            meter_category, location, tag_program, tag_environment,
            period_start, period_end, monthly_cost_usd, currency,
            source, source_file_id
          ) VALUES (
            $1, $2, $3, $4, $5,
            $6, $7, $8, $9,
            $10, $11, $12, $13,
            'azure-cost', $14
          )
          ON CONFLICT (client_id, subscription_id, resource_group, resource_name, service, meter_category, period_start)
          DO UPDATE SET
            location = EXCLUDED.location,
            tag_program = EXCLUDED.tag_program,
            tag_environment = EXCLUDED.tag_environment,
            period_end = EXCLUDED.period_end,
            monthly_cost_usd = EXCLUDED.monthly_cost_usd,
            currency = EXCLUDED.currency,
            source_file_id = EXCLUDED.source_file_id,
            ingested_at = now()
        `,
        [
          clientId,
          r.subscriptionId,
          r.resourceGroup,
          r.resourceName,
          r.service,
          r.meterCategory,
          r.location,
          r.tagProgram,
          r.tagEnvironment,
          r.periodStart,
          r.periodEnd,
          r.monthlyCostUsd,
          r.currency,
          sourceFileId,
        ],
      );
      if (res.rowCount && res.rowCount > 0) written += 1;
    }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    }
  });
  return { written, skipped: rows.length - written };
}

async function main(): Promise<number> {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printUsage();
    return 0;
  }

  if (args.regenerateTemplates) {
    const publicDir = resolve(process.cwd(), 'public', 'templates', 'tower', 'azure-cost');
    await writeBlankTemplate(join(publicDir, 'template.xlsx'));
    await writeSampleTemplate(join(publicDir, 'sample.xlsx'));
     
    console.log(`[ingest-azure-cost] wrote ${join(publicDir, 'template.xlsx')}`);
     
    console.log(`[ingest-azure-cost] wrote ${join(publicDir, 'sample.xlsx')}`);
    if (!args.file) return 0;
  }

  if (!args.file) {
     
    console.error('[ingest-azure-cost] --file is required (or use --regenerate-templates alone)');
    printUsage();
    return 2;
  }

  const filePath = resolve(process.cwd(), args.file);
  const { rows, issues } = await loadRows(filePath, args.sheet);
  const report = validateAzureCostRows(rows);

   
  console.log(`[ingest-azure-cost] parsed ${rows.length} rows · ${issues} parse issues · ${report.warnings.length} warnings`);
   
  console.log(`[ingest-azure-cost] totalUsd=${report.totalUsd.toFixed(2)} · programs=${report.programs} · subs=${report.subscriptions} · months=${report.months} · untaggedShare=${(report.untaggedShare * 100).toFixed(1)}%`);
  for (const w of report.warnings.slice(0, 10)) {
     
    console.log(`[ingest-azure-cost] warn · ${w.code} · ${w.message}`);
  }

  if (!report.ok) {
     
    console.error('[ingest-azure-cost] validation failed; not writing');
    return 1;
  }

  if (args.dryRun) {
     
    console.log('[ingest-azure-cost] dry-run · no writes performed');
    return 0;
  }

  if (!args.client) {
     
    console.error('[ingest-azure-cost] --client is required for non-dry runs');
    return 2;
  }

  const result = await upsertRows(rows, args.client, args.sourceFileId);
   
  console.log(`[ingest-azure-cost] upserted ${result.written} rows · skipped ${result.skipped}`);
  return 0;
}

main().then(
  (code) => process.exit(code),
  (err) => {
     
    console.error('[ingest-azure-cost] fatal:', err);
    process.exit(1);
  },
);
