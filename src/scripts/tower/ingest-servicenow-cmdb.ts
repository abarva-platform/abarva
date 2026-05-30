/**
 * CLI: ingest a ServiceNow CMDB workbook into the Tower CMDB tables.
 *
 * Usage:
 *   npx tsx src/scripts/tower/ingest-servicenow-cmdb.ts \
 *     --file public/templates/tower/servicenow-cmdb/sample.xlsx \
 *     --client-id apexretail \
 *     --dry-run
 *
 * Flags:
 *   --file <path>         Path to the .xlsx workbook. Required.
 *   --client-id <slug>    Tenant slug. Required.
 *   --dry-run             Parse + validate only. No DB writes.
 *   --ingest-run-id <id>  Override the run id used for audit (default: ulid-like).
 *   --source-system <id>  Override the source_system column value
 *                         (default: servicenow_cmdb).
 *   --verbose             Print per-issue diagnostics.
 *
 * Exits non-zero on any of:
 *   * Parse issues (missing required columns / invalid enum values).
 *   * Validation issues (duplicate CI sys_id, orphan dependency, duplicate edge).
 *   * DB error during the transactional upsert.
 *
 * The DB write is transactional and idempotent — see
 * src/lib/tower/ingest/servicenow-cmdb/upsert.ts.
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { parseServiceNowCmdbWorkbook } from '@/lib/tower/ingest/servicenow-cmdb/parse';
import { validateCmdbExtract } from '@/lib/tower/ingest/servicenow-cmdb/validate';
import { upsertCmdbExtract } from '@/lib/tower/ingest/servicenow-cmdb/upsert';

interface Args {
  file: string;
  clientId: string;
  dryRun: boolean;
  ingestRunId: string;
  sourceSystem: string;
  verbose: boolean;
}

function generateRunId(): string {
  // Crockford-ish base32 of a 96-bit random-but-deterministic-by-clock id.
  const ts = Date.now().toString(36);
  const rand = Math.floor(Math.random() * 0xffffffff).toString(36);
  return `ingest-${ts}-${rand}`;
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    file: '',
    clientId: '',
    dryRun: false,
    ingestRunId: '',
    sourceSystem: 'servicenow_cmdb',
    verbose: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i];
    const next = argv[i + 1];
    switch (flag) {
      case '--file':
        args.file = next ?? '';
        i += 1;
        break;
      case '--client-id':
        args.clientId = next ?? '';
        i += 1;
        break;
      case '--ingest-run-id':
        args.ingestRunId = next ?? '';
        i += 1;
        break;
      case '--source-system':
        args.sourceSystem = next ?? args.sourceSystem;
        i += 1;
        break;
      case '--dry-run':
        args.dryRun = true;
        break;
      case '--verbose':
        args.verbose = true;
        break;
      case '--help':
      case '-h':
        printUsage();
        process.exit(0);
        break;
      default:
        throw new Error(`Unknown argument: ${flag}`);
    }
  }
  if (!args.file) throw new Error('--file is required');
  if (!args.clientId) throw new Error('--client-id is required');
  if (!args.ingestRunId) args.ingestRunId = generateRunId();
  return args;
}

function printUsage(): void {
   
  console.log(
    [
      'Usage: tsx src/scripts/tower/ingest-servicenow-cmdb.ts [flags]',
      '',
      'Flags:',
      '  --file <path>         Path to the .xlsx workbook. Required.',
      '  --client-id <slug>    Tenant slug. Required.',
      '  --dry-run             Parse + validate only. No DB writes.',
      '  --ingest-run-id <id>  Override the run id used for audit.',
      '  --source-system <id>  Override source_system column.',
      '  --verbose             Print per-issue diagnostics.',
    ].join('\n'),
  );
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const filePath = path.resolve(process.cwd(), args.file);

   
  console.log(`reading ${filePath}`);
  const buffer = await readFile(filePath);
  const parsed = await parseServiceNowCmdbWorkbook(buffer);
   
  console.log(
    `parsed: ${parsed.cis.length} CIs, ${parsed.dependencies.length} dependencies, ${parsed.issues.length} parse issue(s)`,
  );

  if (parsed.issues.length > 0) {
    if (args.verbose) {
      for (const issue of parsed.issues) {
         
        console.warn(
          `  [parse] ${issue.sheet} row ${issue.row} ${issue.column}: ${issue.message}`,
        );
      }
    } else {
       
      console.warn(
        `  [parse] ${parsed.issues.length} issues — re-run with --verbose for details`,
      );
    }
  }

  const validation = validateCmdbExtract({
    cis: parsed.cis,
    dependencies: parsed.dependencies,
  });
   
  console.log(
    `validation: ok=${validation.ok}, ${validation.issues.length} issue(s)`,
  );
  if (validation.issues.length > 0 && args.verbose) {
    for (const issue of validation.issues) {
       
      console.warn(`  [validate] ${issue.kind}: ${issue.message}`);
    }
  }

  if (parsed.issues.length > 0 || !validation.ok) {
     
    console.error(
      'aborting — fix the issues above (or re-run with --dry-run to confirm) before writing to the database.',
    );
    process.exit(1);
  }

  if (args.dryRun) {
     
    console.log('dry-run complete — no database writes performed.');
    return;
  }

  // Lazy-import so the CLI can dry-run without a DATABASE_URL set.
  const { getCmdbIngestPool, closeCmdbIngestPool } = await import(
    '@/lib/tower/ingest/servicenow-cmdb/db'
  );
  const pool = getCmdbIngestPool();

  const result = await upsertCmdbExtract({
    pool,
    context: {
      clientId: args.clientId,
      ingestRunId: args.ingestRunId,
      sourceSystem: args.sourceSystem,
    },
    cis: parsed.cis,
    dependencies: parsed.dependencies,
  });

   
  console.log(
    `ingest run ${args.ingestRunId}: cis +${result.cisInserted}/~${result.cisUpdated}, ` +
      `dependencies +${result.dependenciesInserted}/~${result.dependenciesUpdated}`,
  );
  await closeCmdbIngestPool();
}

main().catch((err) => {
   
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
