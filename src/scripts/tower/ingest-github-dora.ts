// CLI: ingest a GitHub → DORA workbook into Azure Postgres.
//
// Usage:
//
//   npx tsx src/scripts/tower/ingest-github-dora.ts \
//     --file public/templates/tower/github-dora/sample-filled.xlsx \
//     --tenant northwind-retail \
//     [--dry-run] \
//     [--source-file-id <id>] \
//     [--actor <email>]
//
// Behaviour:
//
//   - --dry-run prints an insert/update/no-op diff and exits 0 without
//     writing. The DB is never touched on dry runs (no BEGIN even).
//   - Idempotent: re-running on the same file is a series of no-ops.
//   - Wraps all writes in a single transaction; any failure rolls back
//     cleanly.
//   - Exits non-zero if validation fails so CI can fail the job.

import path from 'node:path';
import fs from 'node:fs/promises';
import { config as loadEnv } from 'dotenv';
import { Client } from 'pg';

import {
  applyIngestPlan,
  buildIngestPlan,
  parseGithubDoraWorkbook,
  resolveClientIdByTenantKey,
  validateGithubDoraRows,
  type GithubDoraIngestPlan,
  type GithubDoraRowError,
} from '../../lib/tower/ingest/github-dora';
import { postgresClientOptions } from '../postgres-client-options';

interface CliArgs {
  readonly file: string;
  readonly tenant: string;
  readonly dryRun: boolean;
  readonly sourceFileId?: string;
  readonly actor: string;
}

function parseArgs(argv: readonly string[]): CliArgs {
  const args = argv.slice(2);
  function get(flag: string): string | undefined {
    const i = args.indexOf(flag);
    if (i === -1) return undefined;
    const v = args[i + 1];
    return v && !v.startsWith('--') ? v : undefined;
  }
  const file = get('--file');
  const tenant = get('--tenant');
  if (!file || !tenant) {
    console.error(
      'usage: ingest-github-dora --file <path.xlsx> --tenant <tenant-key> [--dry-run] [--source-file-id <id>] [--actor <email>]',
    );
    process.exit(2);
  }
  return {
    file: path.resolve(process.cwd(), file),
    tenant,
    dryRun: args.includes('--dry-run'),
    sourceFileId: get('--source-file-id'),
    actor: get('--actor') ?? 'tower-ingest-cli',
  };
}

function formatErrors(errors: readonly GithubDoraRowError[]): string {
  return errors
    .slice(0, 25)
    .map(
      (e) =>
        `  · row ${e.rowNumber} [${e.column}] ${e.message}`,
    )
    .join('\n');
}

function summarizePlan(plan: GithubDoraIngestPlan): void {
  const samples = plan.rows.slice(0, 5);
  console.log(`tenant client_id: ${plan.clientId}`);
  console.log(
    `plan: ${plan.inserts} insert · ${plan.updates} update · ${plan.noops} no-op (of ${plan.rows.length} rows)`,
  );
  if (samples.length > 0) {
    console.log('first rows:');
    for (const item of samples) {
      console.log(
        `  · [${item.action}] ${item.row.repo} ${item.row.period_start}..${item.row.period_end} ` +
          `df=${item.row.deployment_frequency_per_day}/d ltc=${item.row.lead_time_for_changes_hours}h ` +
          `cfr=${item.row.change_failure_rate_pct}% mttr=${item.row.mttr_hours}h n=${item.row.sample_size_deploys}`,
      );
    }
  }
}

async function loadEnvFiles(): Promise<void> {
  loadEnv({ path: path.resolve(process.cwd(), '.env.local') });
  loadEnv();
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv);
  await loadEnvFiles();

  const fileBuffer = await fs.readFile(args.file);
  const parsed = await parseGithubDoraWorkbook(fileBuffer);
  if (parsed.errors.length > 0) {
    console.error('workbook structural errors:');
    console.error(formatErrors(parsed.errors));
    process.exit(1);
  }
  const validation = validateGithubDoraRows(parsed.rows);
  if (validation.errors.length > 0) {
    console.error(`row validation errors (${validation.errors.length}):`);
    console.error(formatErrors(validation.errors));
    process.exit(1);
  }
  console.log(
    `parsed ${parsed.rows.length} rows · ${validation.validRows.length} valid · 0 errors`,
  );

  const connectionString =
    process.env.ABARVA_AZURE_DATABASE_URL?.trim() ||
    process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    console.error(
      'missing ABARVA_AZURE_DATABASE_URL / DATABASE_URL in environment.',
    );
    process.exit(1);
  }

  const client = new Client(
    postgresClientOptions(connectionString, 'tower-ingest-github-dora'),
  );
  await client.connect();
  try {
    const clientId = await resolveClientIdByTenantKey(client, args.tenant);
    const plan = await buildIngestPlan({
      client,
      clientId,
      rows: validation.validRows,
    });
    summarizePlan(plan);

    if (args.dryRun) {
      console.log('--dry-run set; no writes performed.');
      return;
    }

    const summary = await applyIngestPlan({
      client,
      plan,
      actor: args.actor,
      sourceFileId: args.sourceFileId,
    });
    console.log(
      `applied: ${summary.rowsInserted} inserted · ${summary.rowsUpdated} updated · ${summary.rowsUnchanged} unchanged · ${summary.rowsTotal} total`,
    );
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.stack ?? err.message : err);
  process.exit(1);
});
