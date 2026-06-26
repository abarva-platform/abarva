#!/usr/bin/env tsx
/**
 * Tower materialized read-model builder.
 *
 * This is the approved isolation seam: upstream context projection can be read
 * here, then Tower runtime surfaces read only tower_* tables.
 *
 * Usage:
 *   npx tsx src/scripts/tower/materialize-read-model.ts \
 *     --client-id=<uuid> --tenant-key=lakeshore-holdings --dry-run
 *
 *   npx tsx src/scripts/tower/materialize-read-model.ts \
 *     --client-id=<uuid> --tenant-key=skyharbor-air --apply
 */

import { getAzureWriteFluentClient } from '@/lib/data-plane/postgresCompat';
import {
  buildTowerMaterializationPlanFromUpstream,
  persistTowerMaterializationPlan,
} from '@/lib/tower/tower-materialization';

interface Args {
  clientId: string | null;
  tenantKey: string | null;
  apply: boolean;
  dryRun: boolean;
  help: boolean;
}

function parseArgs(argv: readonly string[]): Args {
  const out: Args = {
    clientId: null,
    tenantKey: null,
    apply: false,
    dryRun: false,
    help: false,
  };
  for (const arg of argv) {
    if (arg === '--help' || arg === '-h') out.help = true;
    else if (arg === '--apply') out.apply = true;
    else if (arg === '--dry-run') out.dryRun = true;
    else if (arg.startsWith('--client-id=')) out.clientId = arg.slice('--client-id='.length);
    else if (arg.startsWith('--tenant-key=')) out.tenantKey = arg.slice('--tenant-key='.length);
  }
  return out;
}

function printUsage(): void {
  console.log(`Tower materialized read-model builder

Required:
  --client-id=<uuid>
  --tenant-key=<canonical-or-alias>

Mode:
  --dry-run   Build and print the materialization plan summary only.
  --apply     Upsert materialized rows into tower_* tables.
`);
}

async function main(): Promise<number> {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printUsage();
    return 0;
  }
  if (!args.clientId || !args.tenantKey) {
    printUsage();
    console.error('Missing --client-id or --tenant-key');
    return 2;
  }
  if (args.apply === args.dryRun) {
    console.error('Choose exactly one: --dry-run or --apply');
    return 2;
  }

  const plan = await buildTowerMaterializationPlanFromUpstream({
    clientId: args.clientId,
    tenantKey: args.tenantKey,
  });

  const summary = {
    mode: args.apply ? 'apply' : 'dry-run',
    clientId: plan.clientId,
    tenantKey: plan.tenantKey,
    source: plan.source,
    ...plan.summary,
  };

  if (args.dryRun) {
    console.log(JSON.stringify(summary, null, 2));
    return 0;
  }

  const written = await persistTowerMaterializationPlan({
    db: getAzureWriteFluentClient(),
    plan,
  });
  console.log(JSON.stringify({ ...summary, written }, null, 2));
  return 0;
}

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
