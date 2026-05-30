// CLI · Ingest a ServiceNow ITSM CSV extract into tower_itsm_records.
//
// Usage:
//   npx tsx src/scripts/tower/ingest-servicenow-itsm.ts \
//     --tenant <tenant-key> \
//     --file <path-to-csv-or-xlsx> \
//     [--dry-run] [--source-file-id <id>] [--json]
//
// Behaviors:
//   --dry-run skips the DB writer; everything else runs (parse + validate).
//   Idempotent: re-running with the same CSV upserts on (tenant_key, record_number).
//   Both .csv and .xlsx inputs are accepted. The xlsx loader reads the "Data" sheet.

import { readFileSync, existsSync } from 'node:fs';
import { basename, extname } from 'node:path';

import {
  parseServiceNowItsmCsv,
  summarize,
  validateItsmRecords,
  writeItsmRecords,
} from '../../lib/tower/ingest/servicenow-itsm';

interface CliArgs {
  tenant: string;
  file: string;
  dryRun: boolean;
  sourceFileId: string;
  json: boolean;
}

function parseArgs(argv: string[]): CliArgs {
  const args: Partial<CliArgs> & { dryRun?: boolean; json?: boolean } = {
    dryRun: false,
    json: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--tenant') args.tenant = argv[++i];
    else if (a === '--file') args.file = argv[++i];
    else if (a === '--source-file-id') args.sourceFileId = argv[++i];
    else if (a === '--dry-run') args.dryRun = true;
    else if (a === '--json') args.json = true;
    else if (a === '--help' || a === '-h') {
      printHelpAndExit(0);
    }
  }

  if (!args.tenant) {
    process.stderr.write('error: --tenant is required\n');
    printHelpAndExit(2);
  }
  if (!args.file) {
    process.stderr.write('error: --file is required\n');
    printHelpAndExit(2);
  }
  if (!existsSync(args.file as string)) {
    process.stderr.write(`error: file not found: ${args.file}\n`);
    process.exit(2);
  }

  return {
    tenant: args.tenant as string,
    file: args.file as string,
    dryRun: !!args.dryRun,
    sourceFileId: args.sourceFileId ?? basename(args.file as string),
    json: !!args.json,
  };
}

function printHelpAndExit(code: number): never {
  process.stdout.write(`Usage:
  npx tsx src/scripts/tower/ingest-servicenow-itsm.ts \
    --tenant <tenant-key> --file <csv-or-xlsx> [--dry-run] [--source-file-id <id>] [--json]
`);
  process.exit(code);
}

async function loadCsvFromInput(file: string): Promise<string> {
  const ext = extname(file).toLowerCase();
  if (ext === '.csv' || ext === '.tsv') {
    return readFileSync(file, 'utf8');
  }
  if (ext === '.xlsx') {
    // Dynamic import keeps exceljs out of the CSV-only hot path.
    const ExcelJS = (await import('exceljs')).default;
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(file);
    const ws = wb.getWorksheet('Data') ?? wb.worksheets[0];
    if (!ws) throw new Error('xlsx has no "Data" sheet or worksheets.');

    // Header is row 3 in our template (rows 1-2 are banner / subtitle).
    let headerRowIdx = 1;
    for (let r = 1; r <= Math.min(5, ws.rowCount); r += 1) {
      const row = ws.getRow(r);
      const firstCell = String(row.getCell(1).value ?? '').trim().toLowerCase();
      if (firstCell === 'record_number') {
        headerRowIdx = r;
        break;
      }
    }
    const headerRow = ws.getRow(headerRowIdx);
    const headers: string[] = [];
    headerRow.eachCell({ includeEmpty: false }, (cell) => {
      headers.push(String(cell.value ?? '').trim());
    });

    const lines: string[] = [headers.map(csvEscape).join(',')];
    for (let r = headerRowIdx + 1; r <= ws.rowCount; r += 1) {
      const row = ws.getRow(r);
      const cells = headers.map((_, idx) => {
        const v = row.getCell(idx + 1).value;
        if (v == null) return '';
        if (v instanceof Date) return v.toISOString();
        return String(v);
      });
      if (cells.every((c) => c === '')) continue;
      lines.push(cells.map(csvEscape).join(','));
    }
    return lines.join('\n');
  }
  throw new Error(`unsupported file extension: ${ext}`);
}

function csvEscape(v: string): string {
  if (v == null) return '';
  if (/[",\n\r]/.test(v)) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}

async function main(): Promise<void> {
  const cli = parseArgs(process.argv.slice(2));
  const notes: string[] = [];

  const csvText = await loadCsvFromInput(cli.file);
  notes.push(`source: ${cli.file}`);
  notes.push(`tenant: ${cli.tenant}`);
  notes.push(`mode: ${cli.dryRun ? 'dry-run' : 'commit'}`);

  const parsed = parseServiceNowItsmCsv(csvText);
  const validated = validateItsmRecords(parsed.records);

  let writeResult = null;
  if (!cli.dryRun) {
    writeResult = await writeItsmRecords({
      tenantKey: cli.tenant,
      sourceFileId: cli.sourceFileId,
      records: validated.valid,
    });
  } else {
    notes.push('dry-run: DB writes skipped');
  }

  const summary = summarize({
    rowsTotal: parsed.rows_total,
    validCount: validated.valid.length,
    parseErrors: parsed.errors,
    validationErrors: validated.errors,
    writeResult,
    notes: [...notes, ...parsed.notes],
  });

  if (cli.json) {
    process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  } else {
    process.stdout.write(
      `\nServiceNow ITSM ingest · ${cli.dryRun ? 'DRY-RUN' : 'COMMIT'}\n` +
        `  tenant:           ${cli.tenant}\n` +
        `  source:           ${cli.file}\n` +
        `  rows_total:       ${summary.rows_total}\n` +
        `  rows_valid:       ${summary.rows_valid}\n` +
        `  rows_inserted:    ${summary.rows_inserted}\n` +
        `  rows_skipped_dup: ${summary.rows_skipped_duplicate}\n` +
        `  rows_failed:      ${summary.rows_failed}\n`,
    );
    if (summary.errors.length > 0) {
      const head = summary.errors.slice(0, 10);
      process.stdout.write('  errors (first 10):\n');
      for (const e of head) {
        process.stdout.write(
          `    row ${e.row_index} ${e.record_number ?? '-'} [${e.field}] ${e.message}\n`,
        );
      }
    }
  }

  // Non-zero exit if anything failed (CI-friendly).
  if (summary.rows_failed > 0 && !cli.dryRun) process.exitCode = 1;
}

if (require.main === module) {
  main().catch((err) => {
    process.stderr.write(`FAILED: ${err instanceof Error ? err.stack ?? err.message : String(err)}\n`);
    process.exit(1);
  });
}
