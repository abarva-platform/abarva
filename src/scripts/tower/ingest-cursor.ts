// S4 — Cursor usage + cost ingest CLI.
//
// Usage:
//   npx tsx src/scripts/tower/ingest-cursor.ts \
//     --file public/templates/tower/cursor/sample-filled.xlsx \
//     --tenant northwind
//
//   Optional flags:
//     --dry-run                 parse + validate only; do not touch the DB
//     --source-file-id <id>     traceability label written to the row
//     --strict                  fail the whole batch on any warning
//
// Behaviour:
//   • Idempotent — upserts on (client_id, tool='cursor', team, period_start).
//     Re-running with the same file produces zero net row changes.
//   • Refuses to run if the resolved tenant has zero rows in `clients`.
//   • Refuses to run if validation found any error-severity issues. Warnings
//     are printed; --strict promotes warnings to errors.
//   • Returns a JSON summary on stdout so the script is automatable.
//
// Coordinated with: S2 Copilot, S3 Claude Code (shared `tower_ai_tool_usage`).

import { readFileSync } from 'node:fs';
import * as path from 'node:path';
import { Client } from 'pg';
import { config as loadEnv } from 'dotenv';
import { parseCursorWorkbook } from '@/lib/tower/ingest/cursor/parse';
import {
  validateCursorRows,
  type CursorValidatedRow,
} from '@/lib/tower/ingest/cursor/validate';
import { postgresClientOptions } from '@/scripts/postgres-client-options';
import '@/lib/tower/ingest/cursor/registry-entry';

loadEnv({ path: path.resolve(process.cwd(), '.env.local') });
loadEnv({ path: '/Users/anand/Projects/nexus/.env.local' });
loadEnv();

interface CliArgs {
  file: string;
  tenant: string;
  dryRun: boolean;
  sourceFileId: string | null;
  strict: boolean;
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    file: '',
    tenant: '',
    dryRun: false,
    sourceFileId: null,
    strict: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    switch (a) {
      case '--file':
        args.file = argv[++i] ?? '';
        break;
      case '--tenant':
        args.tenant = argv[++i] ?? '';
        break;
      case '--dry-run':
        args.dryRun = true;
        break;
      case '--source-file-id':
        args.sourceFileId = argv[++i] ?? null;
        break;
      case '--strict':
        args.strict = true;
        break;
      case '--help':
      case '-h':
        printHelpAndExit(0);
        break;
      default:
        // ignore unknown flags so other slices can co-share argv
        break;
    }
  }
  if (!args.file) {
    console.error('error: --file <path> is required');
    printHelpAndExit(2);
  }
  if (!args.tenant) {
    console.error('error: --tenant <tenant_key> is required');
    printHelpAndExit(2);
  }
  return args;
}

function printHelpAndExit(code: number): never {
  console.log(`
Usage: ingest-cursor --file <path> --tenant <key> [--dry-run] [--source-file-id <id>] [--strict]

  --file            xlsx file containing the Cursor template "Data" sheet
  --tenant          clients.tenant_key for the target tenant (e.g. northwind)
  --dry-run         parse + validate only; skip DB writes
  --source-file-id  trace label persisted on every row
  --strict          treat warnings as errors
`);
  process.exit(code);
}

function databaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL not set (looked in .env.local + env)');
  return url;
}

async function resolveClientId(pg: Client, tenantKey: string): Promise<string> {
  const result = await pg.query<{ id: string }>(
    `SELECT id FROM clients WHERE tenant_key = $1 LIMIT 1`,
    [tenantKey],
  );
  const row = result.rows[0];
  if (!row) {
    throw new Error(
      `tenant "${tenantKey}" not found in clients table (tenant_key); ` +
        `seed the tenant first or pass a different --tenant`,
    );
  }
  return row.id;
}

async function upsertRows(
  pg: Client,
  clientId: string,
  rows: CursorValidatedRow[],
  sourceFileId: string | null,
): Promise<{ inserted: number; updated: number }> {
  let inserted = 0;
  let updated = 0;
  for (const row of rows) {
    const res = await pg.query<{ xmax: string }>(
      `
      INSERT INTO tower_ai_tool_usage (
        client_id, tool, team, period_start, period_end,
        seats_assigned, active_users, completions_shown, completions_accepted,
        monthly_cost_usd, source_file_id
      ) VALUES ($1, 'cursor', $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (client_id, tool, team, period_start) DO UPDATE SET
        period_end = EXCLUDED.period_end,
        seats_assigned = EXCLUDED.seats_assigned,
        active_users = EXCLUDED.active_users,
        completions_shown = EXCLUDED.completions_shown,
        completions_accepted = EXCLUDED.completions_accepted,
        monthly_cost_usd = EXCLUDED.monthly_cost_usd,
        source_file_id = EXCLUDED.source_file_id,
        ingested_at = now()
      RETURNING xmax
      `,
      [
        clientId,
        row.team,
        row.period_start,
        row.period_end,
        row.seats_assigned,
        row.active_users,
        row.completions_shown,
        row.completions_accepted,
        row.monthly_cost_usd,
        sourceFileId,
      ],
    );
    // xmax = '0' on a true insert; non-zero on an update.
    const xmax = res.rows[0]?.xmax ?? '0';
    if (xmax === '0') inserted += 1;
    else updated += 1;
  }
  return { inserted, updated };
}

async function main(): Promise<number> {
  const args = parseArgs(process.argv.slice(2));
  const buffer = readFileSync(path.resolve(args.file));

  const { rows: parsed, warnings: parseWarnings } = await parseCursorWorkbook(buffer);
  const { valid, issues, natural_key_collisions } = validateCursorRows(parsed);

  const errorIssues = issues.filter((i) => i.severity === 'error');
  const warningIssues = issues.filter((i) => i.severity === 'warning');

  const summary: Record<string, unknown> = {
    file: args.file,
    tenant: args.tenant,
    parsed_rows: parsed.length,
    valid_rows: valid.length,
    error_count: errorIssues.length,
    warning_count: warningIssues.length,
    parse_warnings: parseWarnings,
    natural_key_collisions,
    issues: issues.slice(0, 25),
    dry_run: args.dryRun,
  };

  if (errorIssues.length > 0) {
    console.log(JSON.stringify({ ...summary, status: 'rejected' }, null, 2));
    return 1;
  }
  if (args.strict && warningIssues.length > 0) {
    console.log(
      JSON.stringify({ ...summary, status: 'rejected_on_warnings' }, null, 2),
    );
    return 1;
  }

  if (args.dryRun) {
    console.log(JSON.stringify({ ...summary, status: 'dry_run_ok' }, null, 2));
    return 0;
  }

  const pg = new Client(postgresClientOptions(databaseUrl(), 'tower-ingest-cursor'));
  await pg.connect();
  try {
    const clientId = await resolveClientId(pg, args.tenant);
    await pg.query('BEGIN');
    const { inserted, updated } = await upsertRows(pg, clientId, valid, args.sourceFileId);
    await pg.query('COMMIT');

    console.log(
      JSON.stringify(
        {
          ...summary,
          status: 'ok',
          client_id: clientId,
          inserted,
          updated,
        },
        null,
        2,
      ),
    );
    return 0;
  } catch (err) {
    await pg.query('ROLLBACK').catch(() => {});
    console.error('ingest failed:', (err as Error).message);
    return 1;
  } finally {
    await pg.end();
  }
}

if (require.main === module) {
  main()
    .then((code) => process.exit(code))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
