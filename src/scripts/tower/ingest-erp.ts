#!/usr/bin/env -S npx tsx
// Tower · ERP ingest CLI.
//
// Usage:
//   npx tsx src/scripts/tower/ingest-erp.ts \
//     --client-id <uuid> --file <path-to-xlsx> [--dry-run] [--source oracle_gl_ap|sap_co_pa|other]
//
//   npx tsx src/scripts/tower/ingest-erp.ts \
//     --client-id <uuid> --sample [--dry-run]
//       # writes the synthetic Northwind dataset directly
//
// What it does:
//   1. Parses + validates the workbook (or builds the synthetic dataset).
//   2. Prints a summary of rows, errors, and inferred source system.
//   3. Upserts vendors + financials into the two Tower tables. The
//      writer is idempotent on the natural-key uniques declared in
//      migration 20260530134228_tower_program_financials.sql.
//
// --dry-run skips DB writes and only validates / reports.

import { readFile } from 'node:fs/promises';
import { parseErpWorkbook, type ErpSourceSystem } from '@/lib/tower/ingest/erp/parse';
import { buildSyntheticNorthwindDataset } from '@/lib/tower/ingest/erp/sample-data';
import { writeErpDataset } from '@/lib/tower/ingest/erp/writer';

interface CliArgs {
  clientId: string | null;
  file: string | null;
  sample: boolean;
  dryRun: boolean;
  sourceSystem: ErpSourceSystem | null;
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    clientId: null,
    file: null,
    sample: false,
    dryRun: false,
    sourceSystem: null,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--client-id') args.clientId = argv[++i] ?? null;
    else if (a === '--file') args.file = argv[++i] ?? null;
    else if (a === '--sample') args.sample = true;
    else if (a === '--dry-run') args.dryRun = true;
    else if (a === '--source') {
      const v = argv[++i];
      if (v === 'oracle_gl_ap' || v === 'sap_co_pa' || v === 'manual_upload' || v === 'other') {
        args.sourceSystem = v;
      }
    } else if (a === '--help' || a === '-h') {
      printUsageAndExit(0);
    }
  }
  return args;
}

function printUsageAndExit(code: number): never {
  console.error(
    [
      'Tower · ERP ingest CLI',
      '',
      'Usage:',
      '  npx tsx src/scripts/tower/ingest-erp.ts --client-id <uuid> --file <xlsx> [--dry-run] [--source oracle_gl_ap|sap_co_pa]',
      '  npx tsx src/scripts/tower/ingest-erp.ts --client-id <uuid> --sample [--dry-run]',
      '',
      'Options:',
      '  --client-id   Required. Tenant UUID.',
      '  --file        Path to a filled ERP workbook (xlsx). Mutually exclusive with --sample.',
      '  --sample      Use the synthetic Northwind dataset instead of reading a file.',
      '  --dry-run     Validate + report, do not write to the database.',
      '  --source      Override the inferred source system. Default: inferred from headers.',
    ].join('\n'),
  );
  process.exit(code);
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  if (!args.clientId) {
    console.error('error: --client-id is required.');
    printUsageAndExit(2);
  }
  if (!args.sample && !args.file) {
    console.error('error: pass --file or --sample.');
    printUsageAndExit(2);
  }
  if (args.sample && args.file) {
    console.error('error: --sample and --file are mutually exclusive.');
    printUsageAndExit(2);
  }

  let vendors;
  let financials;
  let sourceSystem: ErpSourceSystem;
  let errorCount = 0;

  if (args.sample) {
    const ds = buildSyntheticNorthwindDataset();
    vendors = ds.vendors;
    financials = ds.financials;
    sourceSystem = args.sourceSystem ?? 'manual_upload';
    console.log(`built synthetic Northwind dataset: ${vendors.length} vendors, ${financials.length} financial rows`);
  } else {
    const buf = await readFile(args.file!);
    const result = await parseErpWorkbook(buf);
    vendors = result.vendors;
    financials = result.financials;
    sourceSystem = args.sourceSystem ?? result.source_system_guess;
    errorCount = result.errors.length;
    console.log(
      `parsed ${args.file}: ${vendors.length} vendors, ${financials.length} financial rows, ${errorCount} validation errors. Source: ${sourceSystem}.`,
    );
    if (result.errors.length > 0) {
      for (const e of result.errors.slice(0, 20)) {
        console.error(`  · [${e.sheet}, row ${e.row_index}] ${e.reason}`);
      }
      if (result.errors.length > 20) {
        console.error(`  · ... and ${result.errors.length - 20} more`);
      }
    }
    if (errorCount > 0 && !args.dryRun) {
      console.error('error: validation errors present. Re-run with --dry-run to inspect, or fix the file. Aborting writes.');
      process.exit(1);
    }
  }

  const summary = await writeErpDataset({
    clientId: args.clientId,
    sourceFileId: null,
    sourceSystem,
    vendors,
    financials,
    dryRun: args.dryRun,
  });

  console.log(
    JSON.stringify(
      {
        client_id: args.clientId,
        dry_run: args.dryRun,
        source_system: sourceSystem,
        vendors_upserted: summary.vendors_upserted,
        financials_upserted: summary.financials_upserted,
        validation_errors: errorCount,
        notes: summary.notes,
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error('tower:ingest-erp failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
