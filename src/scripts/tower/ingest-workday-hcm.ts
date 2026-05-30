/**
 * Tower ingest CLI · Workday HCM
 *
 * Usage:
 *   npx tsx src/scripts/tower/ingest-workday-hcm.ts \
 *     --client-id <uuid> \
 *     --as-of 2026-05-30 \
 *     --file path/to/workday-hcm.csv \
 *     [--dry-run]
 *
 * Or, to ingest the bundled Northwind synthetic sample:
 *   npx tsx src/scripts/tower/ingest-workday-hcm.ts \
 *     --client-id <uuid> --as-of 2026-05-30 --northwind-synthetic [--dry-run]
 *
 * Behaviour:
 *   - --dry-run prints the validation summary and exits with 0/1 without
 *     touching the database.
 *   - Without --dry-run the script upserts rows into `tower_workforce`
 *     idempotently (unique on client_id+employee_id+as_of_date).
 *   - Restricted-data note: this script writes data classified RESTRICTED.
 *     PII discipline (no real names, only synthetic / redacted IDs) must
 *     hold at the CSV layer. The script does not redact names itself.
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import Papa from 'papaparse';
import { ingestWorkforceRows } from '@/lib/tower/ingest/workday-hcm/ingest';
import { parseWorkdayHcmCsv } from '@/lib/tower/ingest/workday-hcm/parse';
import { generateNorthwindWorkforce } from '@/lib/tower/ingest/workday-hcm/synthetic';
import type { WorkdayWorkforceRow } from '@/lib/tower/ingest/workday-hcm/types';
import { validateParseResult } from '@/lib/tower/ingest/workday-hcm/validate';

interface Args {
  clientId: string | null;
  asOf: string | null;
  file: string | null;
  northwindSynthetic: boolean;
  dryRun: boolean;
}

function parseArgs(argv: string[]): Args {
  const out: Args = {
    clientId: null,
    asOf: null,
    file: null,
    northwindSynthetic: false,
    dryRun: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--client-id') out.clientId = argv[++i] ?? null;
    else if (a === '--as-of') out.asOf = argv[++i] ?? null;
    else if (a === '--file') out.file = argv[++i] ?? null;
    else if (a === '--northwind-synthetic') out.northwindSynthetic = true;
    else if (a === '--dry-run') out.dryRun = true;
    else if (a === '--help' || a === '-h') {
      console.log(
        [
          'Usage: ingest-workday-hcm --client-id <uuid> --as-of YYYY-MM-DD',
          '  ( --file <csv> | --northwind-synthetic ) [--dry-run]',
        ].join('\n'),
      );
      process.exit(0);
    }
  }
  return out;
}

function summary(rows: WorkdayWorkforceRow[]): string {
  const lines: string[] = [];
  lines.push(`rows: ${rows.length}`);
  const contractors = rows.filter((r) => r.contractor_flag).length;
  lines.push(`contractors: ${contractors}  FTE: ${rows.length - contractors}`);
  const byFn = new Map<string, number>();
  rows.forEach((r) => byFn.set(r.function, (byFn.get(r.function) ?? 0) + 1));
  const fnLines = [...byFn.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([fn, n]) => `  ${fn.padEnd(20)} ${n}`)
    .join('\n');
  lines.push('function mix:');
  lines.push(fnLines);
  const attrited = rows.filter((r) => r.attrition_date).length;
  lines.push(`attrited (in scope): ${attrited}`);
  return lines.join('\n');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.clientId) {
    console.error('error: --client-id required');
    process.exit(1);
  }
  if (!args.asOf) {
    console.error('error: --as-of required (YYYY-MM-DD)');
    process.exit(1);
  }
  if (!args.file && !args.northwindSynthetic) {
    console.error('error: either --file or --northwind-synthetic required');
    process.exit(1);
  }

  let rows: WorkdayWorkforceRow[];
  if (args.northwindSynthetic) {
    rows = generateNorthwindWorkforce({ asOfDate: args.asOf });
    console.log(`[northwind-synthetic] generated ${rows.length} rows`);
  } else {
    const path = resolve(process.cwd(), args.file!);
    const text = readFileSync(path, 'utf8');
    const parsed = parseWorkdayHcmCsv(text);
    if (parsed.errors.length > 0 && parsed.rows.length === 0) {
      console.error(`[parse] failed with ${parsed.errors.length} errors:`);
      parsed.errors.slice(0, 10).forEach((e) =>
        console.error(`  row ${e.rowIndex} [${e.field}]: ${e.message}`),
      );
      process.exit(1);
    }
    const summaryV = validateParseResult(parsed);
    if (summaryV.errors.length > 0) {
      console.warn(`[validate] ${summaryV.errors.length} row-level issues:`);
      summaryV.errors.slice(0, 10).forEach((e) =>
        console.warn(`  row ${e.rowIndex} [${e.field}]: ${e.message}`),
      );
    }
    rows = parsed.rows;
  }

  console.log('---');
  console.log(summary(rows));
  console.log('---');

  if (args.dryRun) {
    console.log('[dry-run] no database writes performed.');
    process.exit(0);
  }

  // Confirm restricted-data discipline at write time.
  const hasNonSyntheticIds = rows.some((r) => !/^[A-Z]{2,8}-[A-Z]{2,4}-\d{3,8}$/.test(r.employee_id));
  if (hasNonSyntheticIds) {
    console.warn(
      '[pii-discipline] one or more employee_id values do not match the synthetic-ID pattern. ' +
        'Real-customer ingests must pass redacted IDs only. Continuing — auditors check class=restricted.',
    );
  }

  const result = await ingestWorkforceRows({
    clientId: args.clientId,
    asOfDate: args.asOf,
    rows,
  });

  console.log(JSON.stringify(result, null, 2));
  // Sanity round-trip: re-parse the CSV form of the synthetic rows so we
  // know the parser handles our own output. Cheap insurance.
  if (args.northwindSynthetic) {
    const headers = Object.keys(rows[0]);
    const csv = Papa.unparse(rows, { columns: headers });
    const reparsed = parseWorkdayHcmCsv(csv);
    if (reparsed.rows.length !== rows.length) {
      console.warn(
        `[sanity] reparse round-trip mismatch: generated=${rows.length} reparsed=${reparsed.rows.length}`,
      );
    }
  }

  if (result.rowsFailed > 0) process.exit(2);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
